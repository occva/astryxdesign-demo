import {useEffect, useState} from 'react';
import {ArrowClockwise, ChartBar, ChartLine} from './vercel-icons';
import {mockApi} from '../services/mockApi';
import type {DashboardData, DashboardMetric, StatusTone} from '../types';
import {
  Badge,
  Button,
  Card,
  LayerCard,
  Meter,
  PageTitle,
  SectionTitle,
  StatusBadge,
  Tabs,
  Text,
  colorToBadgeVariant,
} from './report-ui';
import {uiCopy, type Locale} from '../localization';

type TrendChartType = 'bar' | 'line';

function MetricCard({metric}: {metric: DashboardMetric}) {
  const variant = metric.tone === 'negative' ? 'error' : metric.tone === 'positive' ? 'success' : 'info';
  return (
    <Card className="vbg-custom-metric">
      <div className="vbg-dashboard-metric__body">
        <Text variant="secondary" size="sm">{metric.label}</Text>
        <div className="vbg-dashboard-metric__row">
          <Text variant="heading2" as="p">{metric.value}</Text>
          <span className="vbg-dashboard-metric__delta" data-variant={variant}>
            {metric.delta}
          </span>
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
    <div className="vbg-dashboard-chart">
      <svg
        aria-label={ariaLabel}
        className="vbg-dashboard-chart__svg"
        role="img"
        viewBox="0 0 724 224"
      >
        {ticks.map(tick => (
          <g key={tick}>
            <text
              x={chart.left - 12}
              y={yFor(tick)}
              className="vbg-dashboard-chart__label"
              fill="var(--vbg-text-secondary)"
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
              stroke="var(--vbg-border-subtle)"
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
                  fill="color-mix(in srgb, var(--vbg-surface-contrast) 12%, transparent)"
                  stroke="var(--vbg-border-subtle)"
                  rx="4"
                />
                <rect
                  x={x + barGap / 2}
                  y={valueY}
                  width={barWidth}
                  height={chart.bottom - valueY}
                  fill="var(--vbg-chart-1)"
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
              stroke="color-mix(in srgb, var(--vbg-surface-contrast) 34%, transparent)"
              strokeDasharray="6 8"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
            <path
              d={pathFor('value')}
              fill="none"
              stroke="var(--vbg-chart-1)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />
            {data.map((point, index) => (
              <circle
                key={point.label}
                cx={xFor(index)}
                cy={yFor(point.value)}
                fill="var(--vbg-surface-primary)"
                r="4"
                stroke="var(--vbg-chart-1)"
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
              stroke="var(--vbg-border-subtle)"
              opacity={index === 0 || index === data.length - 1 ? 0 : 0.35}
            />
            <text
              x="0"
              y={chart.labelY}
              className="vbg-dashboard-chart__label"
              fill="var(--vbg-text-secondary)"
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
          className="vbg-custom-chart-tooltip vbg-dashboard-chart-tooltip"
          style={{left: `${tooltipLeft}%`, top: `${tooltipTop}%`, transform: tooltipTransform}}
        >
          <div className="vbg-dashboard-chart-tooltip__title">{activePoint.label}</div>
          <div className="vbg-dashboard-chart-tooltip__row">
            <span>{actualLabel}</span>
            <span className="vbg-dashboard-chart-tooltip__value">{activePoint.value}</span>
          </div>
          <div className="vbg-dashboard-chart-tooltip__row vbg-dashboard-chart-tooltip__row--muted">
            <span>{targetLabel}</span>
            <span className="vbg-dashboard-chart-tooltip__value">{activePoint.target}</span>
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
    <div className="vbg-dashboard-legend">
      <span className="vbg-dashboard-legend__item">
        <span className="vbg-dashboard-legend__dot vbg-dashboard-legend__dot--actual" />
        {actualLabel}
      </span>
      <span className="vbg-dashboard-legend__item">
        <span
          className="vbg-dashboard-legend__dot vbg-dashboard-legend__dot--target"
          style={{background: 'color-mix(in srgb, var(--vbg-surface-contrast) 12%, transparent)'}}
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
  const [trendChartType, setTrendChartType] = useState<TrendChartType>('bar');

  const loadDashboard = () => {
    setIsLoading(true);
    mockApi.getDashboard().then(next => {
      setData(next);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    mockApi.getDashboard().then(next => {
      if (mounted) {
        setData(next);
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
    <div className="vbg-dashboard-page">
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

      <section className="vbg-dashboard-metric-grid">
        {data.metrics.map(metric => <MetricCard key={metric.label} metric={metric} />)}
      </section>

      <section className="vbg-dashboard-grid">
        <LayerCard>
          <LayerCard.Secondary>
            <SectionTitle
              title={copy.trendTitle}
              aside={
                <div className="vbg-dashboard-chart-actions">
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
                          <span className="vbg-dashboard-tab-label">
                            <ChartBar className="vbg-custom-icon vbg-custom-icon--sm" />
                            {copy.barChart}
                          </span>
                        ),
                      },
                      {
                        value: 'line',
                        label: (
                          <span className="vbg-dashboard-tab-label">
                            <ChartLine className="vbg-custom-icon vbg-custom-icon--sm" />
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

        <LayerCard>
          <LayerCard.Secondary>
            <SectionTitle title={copy.distribution} />
          </LayerCard.Secondary>
          <LayerCard.Primary>
            <div className="vbg-dashboard-module-list">
              {data.modules.map(item => (
                <div key={item.label} className="vbg-dashboard-module-item">
                  <div className="vbg-dashboard-module-item__row">
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
        <div className="vbg-dashboard-activity">
          <SectionTitle title={copy.activity} aside={<Text variant="secondary" size="sm">{copy.latest}</Text>} />
          <div className="vbg-custom-list vbg-custom-activity-list">
            {data.activities.map(activity => (
              <div key={activity.id} className="vbg-dashboard-activity__item">
                <StatusBadge tone={activityTone(activity.status)}>{activity.title}</StatusBadge>
                <div className="vbg-dashboard-activity__copy">
                  <div className="vbg-dashboard-activity__row">
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
