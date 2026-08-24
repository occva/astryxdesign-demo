import type {CSSProperties} from 'react';
import {useEffect, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import {Badge} from '@cloudflare/kumo/components/badge';
import {Button} from '@cloudflare/kumo/components/button';
import {Chart, ChartPalette, type KumoChartOption} from '@cloudflare/kumo/components/chart';
import {Empty} from '@cloudflare/kumo/components/empty';
import {LayerCard} from '@cloudflare/kumo/components/layer-card';
import {Meter} from '@cloudflare/kumo/components/meter';
import {Tabs} from '@cloudflare/kumo/components/tabs';
import {Text} from '@cloudflare/kumo/components/text';
import {useKumoToastManager} from '@cloudflare/kumo/components/toast';
import NumberFlow, {NumberFlowGroup, continuous, type Format} from '@number-flow/react';
import {ArrowClockwise, ChartBar, ChartLine} from '@phosphor-icons/react';
import * as echarts from 'echarts/core';
import {BarChart, LineChart} from 'echarts/charts';
import {GridComponent, LegendComponent, TooltipComponent} from 'echarts/components';
import {CanvasRenderer} from 'echarts/renderers';
import {applicationApi} from '../services/applicationApi';
import i18n, {currentLanguage} from '../i18n';
import {formatRelativeTime} from '../i18n/relative-time';
import type {DashboardData, DashboardMetric, StatusTone} from '../types';
import {Card, PageTitle, SectionTitle, Skeleton, StatusBadge, colorToBadgeVariant} from './kumo-ui';

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

echarts.use([BarChart, LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

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

function AnimatedMetricValue({
  value,
}: {
  value: string;
}) {
  const parsed = parseMetricValue(value);
  if (!parsed) return <>{value}</>;

  return (
    <NumberFlow
      value={parsed.value}
      animated
      respectMotionPreference
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
}: {
  delta: string;
}) {
  const parsed = parseMetricDelta(delta);
  if (!parsed) return <>{delta}</>;

  return (
    <NumberFlow
      value={parsed.value}
      animated
      respectMotionPreference
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
  label,
}: {
  metric: DashboardMetric;
  animationKey: number;
  label: string;
}) {
  const variant = metric.tone === 'negative' ? 'error' : metric.tone === 'positive' ? 'success' : 'neutral';
  return (
    <Card>
      <div className="flex flex-col gap-3">
        <Text variant="secondary" size="sm">{label}</Text>
        <div className="flex items-end justify-between gap-3">
          <Text variant="heading2" as="p">
            <AnimatedMetricValue
              key={`value-${animationKey}`}
              value={metric.value}
            />
          </Text>
          <Badge variant={variant}>
            <AnimatedMetricDelta
              key={`delta-${animationKey}`}
              delta={metric.delta}
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
  const options: KumoChartOption = {
    animationDuration: 350,
    aria: {enabled: true, description: ariaLabel},
    color: [ChartPalette.categorical(0), ChartPalette.categorical(1)],
    tooltip: {trigger: 'axis'},
    legend: {top: 0, data: [actualLabel, targetLabel]},
    grid: {
      top: 42,
      right: 16,
      bottom: 28,
      left: 42,
      outerBoundsMode: 'same',
      outerBoundsContain: 'axisLabel',
    },
    xAxis: {
      type: 'category',
      data: data.map(point => point.label),
      axisTick: {show: false},
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      interval: 25,
    },
    series: [
      {
        name: actualLabel,
        type,
        data: data.map(point => point.value),
        barMaxWidth: 16,
        smooth: type === 'line',
      },
      {
        name: targetLabel,
        type,
        data: data.map(point => point.target),
        barMaxWidth: 16,
        smooth: type === 'line',
        lineStyle: {type: 'dashed'},
      },
    ],
  };

  return <Chart echarts={echarts} options={options} height={224} />;
}

function activityTone(status: StatusTone) {
  if (status === 'accent') return 'info';
  return status;
}

function DashboardSkeleton() {
  const {t} = useTranslation('dashboard');
  return (
    <div className="flex flex-col gap-6" aria-label={t('loading')}>
      <Skeleton className="h-8 w-40" />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({length: 4}, (_, index) => <Card key={index}><Skeleton className="h-24 w-full" /></Card>)}
      </section>
      <Card><Skeleton className="h-72 w-full" /></Card>
    </div>
  );
}

export function DashboardPage() {
  const {t} = useTranslation('dashboard');
  const toasts = useKumoToastManager();
  const language = currentLanguage();
  const [trendChartType, setTrendChartType] = useState<TrendChartType>('bar');
  const {
    data,
    error,
    isLoading,
    isFetching,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: applicationApi.getDashboard,
  });
  const translateContent = (key: string, fallback: string) => String(i18n.t(key, {defaultValue: fallback}));
  const translatedTrend = data?.trend.map(point => ({
    ...point,
    label: point.i18nKey ? translateContent(point.i18nKey, point.label) : point.label,
  })) ?? [];

  useEffect(() => {
    if (error) {
      toasts.add({
        title: error instanceof Error ? error.message : t('loadFailed'),
        variant: 'error',
      });
    }
  }, [error, t, toasts]);

  if (!data) {
    return isLoading ? <DashboardSkeleton /> : <Card><Empty size="sm" title={t('empty')} /></Card>;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageTitle
        title={t('title')}
        actions={
          <Button
            variant="secondary"
            icon={ArrowClockwise}
            loading={isFetching}
            onClick={() => void refetch()}
          >
            {t('refresh')}
          </Button>
        }
      />

      <NumberFlowGroup>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.metrics.map(metric => (
            <MetricCard
              key={metric.label}
              metric={metric}
              label={metric.i18nKey ? translateContent(metric.i18nKey, metric.label) : metric.label}
              animationKey={dataUpdatedAt}
            />
          ))}
        </section>
      </NumberFlowGroup>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <LayerCard className="min-w-0">
          <LayerCard.Secondary>
            <SectionTitle
              title={t('trendTitle')}
              aside={
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="blue">{t('months')}</Badge>
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
                            {t('barChart')}
                          </span>
                        ),
                      },
                      {
                        value: 'line',
                        label: (
                          <span className="inline-flex items-center gap-1">
                            <ChartLine className="size-3.5" />
                            {t('lineChart')}
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
              data={translatedTrend}
              type={trendChartType}
              ariaLabel={`${t('trendTitle')} ${trendChartType === 'bar' ? t('barChart') : t('lineChart')}`}
              actualLabel={t('actualValue')}
              targetLabel={t('targetValue')}
            />
          </LayerCard.Primary>
        </LayerCard>

        <LayerCard className="min-w-0">
          <LayerCard.Secondary>
            <SectionTitle title={t('distribution')} />
          </LayerCard.Secondary>
          <LayerCard.Primary>
            <div className="flex flex-col gap-4">
              {data.modules.map(item => {
                const label = item.i18nKey
                  ? translateContent(item.i18nKey, item.label)
                  : item.label;
                return (
                  <div key={item.label} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <Text as="span">{label}</Text>
                    <Badge variant={colorToBadgeVariant(item.color)}>{item.value}%</Badge>
                  </div>
                  <Meter label={`${label} ${t('capacity')}`} value={item.value} max={item.capacity} showValue={false} />
                  </div>
                );
              })}
            </div>
          </LayerCard.Primary>
        </LayerCard>
      </section>

      <Card>
        <div className="flex flex-col gap-4">
          <SectionTitle title={t('activity')} aside={<Text variant="secondary" size="sm">{t('latest')}</Text>} />
          <div className="divide-y divide-kumo-line">
            {data.activities.map(activity => {
              const title = activity.i18nKey
                ? translateContent(`${activity.i18nKey}.title`, activity.title)
                : activity.title;
              const description = activity.i18nKey
                ? translateContent(`${activity.i18nKey}.description`, activity.description)
                : activity.description;
              return (
                <div key={activity.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                  <StatusBadge tone={activityTone(activity.status)}>{title}</StatusBadge>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Text as="span" bold>{title}</Text>
                      <Text variant="secondary" size="sm" as="time">{formatRelativeTime(activity.occurredAt, language)}</Text>
                    </div>
                    <Text variant="secondary" size="sm">{description}</Text>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
