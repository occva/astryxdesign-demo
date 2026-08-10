import type {CSSProperties} from 'react';
import {useEffect, useState} from 'react';
import {Badge} from '@cloudflare/kumo/components/badge';
import {Button} from '@cloudflare/kumo/components/button';
import {LayerCard} from '@cloudflare/kumo/components/layer-card';
import {Meter} from '@cloudflare/kumo/components/meter';
import {Tabs} from '@cloudflare/kumo/components/tabs';
import {Text} from '@cloudflare/kumo/components/text';
import NumberFlow, {NumberFlowGroup, continuous, type Format} from '@number-flow/react';
import {ArrowClockwise, ChartBar, ChartLine} from '@phosphor-icons/react';
import {mockApi} from '../services/mockApi';
import type {DashboardData, DashboardMetric, StatusTone} from '../types';
import {Card, PageTitle, SectionTitle, StatusBadge, colorToBadgeVariant} from './kumo-ui';
import {uiCopy, type Locale} from '../localization';

type TrendChartType = 'bar' | 'line';
type ParsedNumber = {
  value: number;
  prefix?: string;
  format: Format;
};

const numberFlowMaskStyle = {
  '--number-flow-mask-height': '0.18em',
} as CSSProperties;

const numberFlowTransformTiming: EffectTiming = {
  duration: 340,
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
};

const numberFlowPlugins = [continuous];

const metricLoadSteps = [
  {delay: 120, ratio: 1},
];

function fractionDigits(value: string) {
  return value.includes('.') ? value.split('.')[1]?.replace(/[^\d]/g, '').length ?? 0 : 0;
}

function parseMetricValue(value: string): ParsedNumber | null {
  const trimmed = value.trim();
  const numericValue = Number(trimmed.replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(numericValue)) return null;

  const prefix = trimmed.match(/^[^\d+-]+/)?.[0];
  if (trimmed.endsWith('%')) {
    return {
      value: numericValue / 100,
      format: {
        style: 'percent',
        maximumFractionDigits: fractionDigits(trimmed),
      },
    };
  }

  return {
    value: numericValue,
    prefix,
    format: {
      maximumFractionDigits: fractionDigits(trimmed),
    },
  };
}

function parseMetricDelta(delta: string): ParsedNumber | null {
  const parsed = parseMetricValue(delta);
  if (!parsed) return null;

  return {
    ...parsed,
    format: {
      ...parsed.format,
      signDisplay: 'exceptZero',
    },
  };
}

function useFlowValue(targetValue: number, animationKey: number) {
  const [flowState, setFlowState] = useState({animated: false, value: 0});

  useEffect(() => {
    setFlowState({animated: false, value: 0});
    const timers = metricLoadSteps.map(step => (
      window.setTimeout(() => {
        setFlowState({animated: true, value: targetValue * step.ratio});
      }, step.delay)
    ));
    return () => timers.forEach(timer => window.clearTimeout(timer));
  }, [targetValue, animationKey]);

  return flowState;
}

function AnimatedMetricValue({
  value,
  animationKey,
}: {
  value: string;
  animationKey: number;
}) {
  const parsed = parseMetricValue(value);
  const flow = useFlowValue(parsed?.value ?? 0, animationKey);
  if (!parsed) return <>{value}</>;

  return (
    <NumberFlow
      value={flow.value}
      animated={flow.animated}
      respectMotionPreference={false}
      transformTiming={numberFlowTransformTiming}
      spinTiming={numberFlowTransformTiming}
      plugins={numberFlowPlugins}
      prefix={parsed.prefix}
      format={parsed.format}
      willChange
      style={numberFlowMaskStyle}
    />
  );
}

function AnimatedMetricDelta({
  delta,
  animationKey,
}: {
  delta: string;
  animationKey: number;
}) {
  const parsed = parseMetricDelta(delta);
  const flow = useFlowValue(parsed?.value ?? 0, animationKey);
  if (!parsed) return <>{delta}</>;

  return (
    <NumberFlow
      value={flow.value}
      animated={flow.animated}
      respectMotionPreference={false}
      transformTiming={numberFlowTransformTiming}
      spinTiming={numberFlowTransformTiming}
      plugins={numberFlowPlugins}
      prefix={parsed.prefix}
      format={parsed.format}
      willChange
      style={numberFlowMaskStyle}
    />
  );
}

function MetricCard({
  metric,
  animationKey,
}: {
  metric: DashboardMetric;
  animationKey: number;
}) {
  const variant = metric.tone === 'negative' ? 'error' : metric.tone === 'positive' ? 'success' : 'neutral';
  return (
    <Card>
      <div className="flex flex-col gap-3">
        <Text variant="secondary" size="sm">{metric.label}</Text>
        <div className="flex items-end justify-between gap-3">
          <Text variant="heading2" as="p">
            <AnimatedMetricValue
              key={`value-${animationKey}`}
              value={metric.value}
              animationKey={animationKey}
            />
          </Text>
          <Badge variant={variant}>
            <AnimatedMetricDelta
              key={`delta-${animationKey}`}
              delta={metric.delta}
              animationKey={animationKey}
            />
          </Badge>
        </div>
      </div>
    </Card>
  );
}

function TrendChart({
  data,
  type,
  ariaLabel,
  actualLabel,
  targetLabel,
}: {
  data: DashboardData['trend'];
  type: TrendChartType;
  ariaLabel: string;
  actualLabel: string;
  targetLabel: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const chart = {
    left: 46,
    right: 696,
    top: 14,
    bottom: 178,
    labelY: 212,
  };
  const ticks = [0, 25, 50, 75, 100];
  const width = chart.right - chart.left;
  const height = chart.bottom - chart.top;
  const xFor = (index: number) => chart.left + (width * index) / Math.max(data.length - 1, 1);
  const yFor = (value: number) => chart.top + height - (height * value) / 100;
  const bandWidth = width / Math.max(data.length, 1);
  const barWidth = 7;
  const barGap = 3;
  const pathFor = (key: 'value' | 'target') =>
    data.map((point, index) => `${index === 0 ? 'M' : 'L'} ${xFor(index)} ${yFor(point[key])}`).join(' ');
  const activePoint = activeIndex === null ? null : data[activeIndex];
  const activeX = activeIndex === null ? 0 : xFor(activeIndex);
  const tooltipOnRight = activeX < chart.left + width / 2;
  const tooltipLeft = ((activeX + (tooltipOnRight ? bandWidth / 2 + 10 : -(bandWidth / 2 + 10))) / 724) * 100;
  const tooltipTop = activePoint
    ? (Math.min(chart.bottom - 44, Math.max(chart.top + 44, yFor(Math.max(activePoint.value, activePoint.target)))) / 224) * 100
    : 0;
  const tooltipTransform = tooltipOnRight ? 'translateY(-50%)' : 'translate(-100%, -50%)';

  return (
    <div className="relative h-56 px-1 pt-2">
      <svg
        aria-label={ariaLabel}
        className="h-full w-full overflow-visible"
        role="img"
        viewBox="0 0 724 224"
      >
        {ticks.map(tick => (
          <g key={tick}>
            <text
              x={chart.left - 12}
              y={yFor(tick)}
              className="text-xs"
              fill="var(--text-color-kumo-subtle)"
              dominantBaseline="middle"
              textAnchor="end"
            >
              {tick}
            </text>
            <line
              x1={chart.left}
              x2={chart.right}
              y1={yFor(tick)}
              y2={yFor(tick)}
              className="stroke-kumo-line"
              opacity={tick === 0 ? 1 : 0.65}
              strokeDasharray={tick === 0 ? undefined : '4 8'}
            />
          </g>
        ))}
        {type === 'bar' ? (
          data.map((point, index) => {
            const x = xFor(index);
            const targetY = yFor(point.target);
            const valueY = yFor(point.value);
            return (
              <g key={point.label}>
                <rect
                  x={x - barWidth - barGap / 2}
                  y={targetY}
                  width={barWidth}
                  height={chart.bottom - targetY}
                  fill="color-mix(in srgb, var(--color-kumo-contrast) 18%, transparent)"
                  stroke="var(--color-kumo-line)"
                  rx="4"
                />
                <rect
                  x={x + barGap / 2}
                  y={valueY}
                  width={barWidth}
                  height={chart.bottom - valueY}
                  fill="var(--color-kumo-brand)"
                  rx="4"
                />
              </g>
            );
          })
        ) : (
          <>
            <path
              d={pathFor('target')}
              fill="none"
              stroke="color-mix(in srgb, var(--color-kumo-contrast) 36%, transparent)"
              strokeDasharray="6 8"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
            <path
              d={pathFor('value')}
              fill="none"
              stroke="var(--color-kumo-brand)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />
            {data.map((point, index) => (
              <circle
                key={point.label}
                cx={xFor(index)}
                cy={yFor(point.value)}
                fill="var(--color-kumo-base)"
                r="4"
                stroke="var(--color-kumo-brand)"
                strokeWidth="2"
              />
            ))}
          </>
        )}
        {data.map((point, index) => (
          <g key={point.label} transform={`translate(${xFor(index)} 0)`}>
            <line
              x1="0"
              x2="0"
              y1={chart.top}
              y2={chart.bottom}
              className="stroke-kumo-line"
              opacity={index === 0 || index === data.length - 1 ? 0 : 0.35}
            />
            <text
              x="0"
              y={chart.labelY}
              className="text-xs"
              fill="var(--text-color-kumo-subtle)"
              textAnchor="middle"
            >
              {point.label}
            </text>
          </g>
        ))}
        {data.map((point, index) => (
          <rect
            key={point.label}
            x={xFor(index) - bandWidth / 2}
            y={chart.top}
            width={bandWidth}
            height={chart.bottom - chart.top}
            fill="transparent"
            tabIndex={0}
            onBlur={() => setActiveIndex(null)}
            onFocus={() => setActiveIndex(index)}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          />
        ))}
      </svg>
      {activePoint ? (
        <div
          className="pointer-events-none absolute z-10 min-w-28 rounded-lg bg-kumo-contrast px-3 py-2 text-xs text-kumo-inverse shadow-lg"
          style={{left: `${tooltipLeft}%`, top: `${tooltipTop}%`, transform: tooltipTransform}}
        >
          <div className="mb-1 font-medium">{activePoint.label}</div>
          <div className="flex items-center justify-between gap-4">
            <span>{actualLabel}</span>
            <span className="font-medium">{activePoint.value}</span>
          </div>
          <div className="flex items-center justify-between gap-4 opacity-80">
            <span>{targetLabel}</span>
            <span className="font-medium">{activePoint.target}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TrendLegend({
  actualLabel,
  targetLabel,
}: {
  actualLabel: string;
  targetLabel: string;
}) {
  return (
    <div className="flex items-center gap-3 text-xs text-kumo-subtle">
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-kumo-brand" />
        {actualLabel}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          className="size-2 rounded-full ring-1 ring-kumo-line"
          style={{background: 'color-mix(in srgb, var(--color-kumo-contrast) 18%, transparent)'}}
        />
        {targetLabel}
      </span>
    </div>
  );
}

function activityTone(status: StatusTone) {
  if (status === 'accent') return 'info';
  return status;
}

export function DashboardPage({locale}: {locale: Locale}) {
  const copy = uiCopy[locale].dashboard;
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [metricAnimationKey, setMetricAnimationKey] = useState(0);
  const [trendChartType, setTrendChartType] = useState<TrendChartType>('bar');

  const loadDashboard = () => {
    setIsLoading(true);
    mockApi.getDashboard().then(next => {
      setData(next);
      setMetricAnimationKey(current => current + 1);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    mockApi.getDashboard().then(next => {
      if (mounted) {
        setData(next);
        setMetricAnimationKey(current => current + 1);
        setIsLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [locale]);

  if (!data) {
    return (
      <Card>
        <Text>{isLoading ? copy.loading : copy.empty}</Text>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title={copy.title}
        actions={
          <Button
            variant="secondary"
            icon={ArrowClockwise}
            loading={isLoading}
            onClick={loadDashboard}
          >
            {copy.refresh}
          </Button>
        }
      />

      <NumberFlowGroup>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.metrics.map(metric => (
            <MetricCard
              key={metric.label}
              metric={metric}
              animationKey={metricAnimationKey}
            />
          ))}
        </section>
      </NumberFlowGroup>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <LayerCard className="min-w-0">
          <LayerCard.Secondary>
            <SectionTitle
              title={copy.trendTitle}
              aside={
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="blue">{copy.months}</Badge>
                  <TrendLegend actualLabel={copy.actualValue} targetLabel={copy.targetValue} />
                  <Tabs
                    size="sm"
                    value={trendChartType}
                    onValueChange={value => setTrendChartType(value as TrendChartType)}
                    tabs={[
                      {
                        value: 'bar',
                        label: (
                          <span className="inline-flex items-center gap-1">
                            <ChartBar className="size-3.5" />
                            {copy.barChart}
                          </span>
                        ),
                      },
                      {
                        value: 'line',
                        label: (
                          <span className="inline-flex items-center gap-1">
                            <ChartLine className="size-3.5" />
                            {copy.lineChart}
                          </span>
                        ),
                      },
                    ]}
                  />
                </div>
              }
            />
          </LayerCard.Secondary>
          <LayerCard.Primary>
            <TrendChart
              data={data.trend}
              type={trendChartType}
              ariaLabel={`${copy.trendTitle} ${trendChartType === 'bar' ? copy.barChart : copy.lineChart}`}
              actualLabel={copy.actualValue}
              targetLabel={copy.targetValue}
            />
          </LayerCard.Primary>
        </LayerCard>

        <LayerCard className="min-w-0">
          <LayerCard.Secondary>
            <SectionTitle title={copy.distribution} />
          </LayerCard.Secondary>
          <LayerCard.Primary>
            <div className="flex flex-col gap-4">
              {data.modules.map(item => (
                <div key={item.label} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <Text as="span">{item.label}</Text>
                    <Badge variant={colorToBadgeVariant(item.color)}>{item.value}%</Badge>
                  </div>
                  <Meter label={`${item.label} ${copy.capacity}`} value={item.value} max={item.capacity} showValue={false} />
                </div>
              ))}
            </div>
          </LayerCard.Primary>
        </LayerCard>
      </section>

      <Card>
        <div className="flex flex-col gap-4">
          <SectionTitle title={copy.activity} aside={<Text variant="secondary" size="sm">{copy.latest}</Text>} />
          <div className="divide-y divide-kumo-line">
            {data.activities.map(activity => (
              <div key={activity.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                <StatusBadge tone={activityTone(activity.status)}>{activity.title}</StatusBadge>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Text as="span" bold>{activity.title}</Text>
                    <Text variant="secondary" size="sm" as="time">{activity.time}</Text>
                  </div>
                  <Text variant="secondary" size="sm">{activity.description}</Text>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
