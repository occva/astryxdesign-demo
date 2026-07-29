import {useEffect, useState} from 'react';
import {Badge} from '@cloudflare/kumo/components/badge';
import {Button} from '@cloudflare/kumo/components/button';
import {LayerCard} from '@cloudflare/kumo/components/layer-card';
import {Meter} from '@cloudflare/kumo/components/meter';
import {Text} from '@cloudflare/kumo/components/text';
import {ArrowClockwise} from '@phosphor-icons/react';
import {mockApi} from '../services/mockApi';
import type {DashboardData, DashboardMetric, StatusTone} from '../types';
import {Card, PageTitle, SectionTitle, StatusBadge, colorToBadgeVariant} from './kumo-ui';
import {uiCopy, type Locale} from '../localization';

function MetricCard({metric}: {metric: DashboardMetric}) {
  const variant = metric.tone === 'negative' ? 'error' : metric.tone === 'positive' ? 'success' : 'info';
  return (
    <Card>
      <div className="flex flex-col gap-3">
        <Text variant="secondary" size="sm">{metric.label}</Text>
        <div className="flex items-end justify-between gap-3">
          <Text variant="heading2" as="p">{metric.value}</Text>
          <Badge variant={variant}>{metric.delta}</Badge>
        </div>
      </div>
    </Card>
  );
}

function TrendBars({data}: {data: DashboardData['trend']}) {
  return (
    <div className="grid h-56 grid-cols-12 items-end gap-3 px-1 pt-2">
      {data.map(point => (
        <div key={point.label} className="flex min-w-0 flex-col items-center gap-2">
          <div className="flex h-40 items-end gap-1">
            <span className="trend-bar-target" style={{height: `${point.target}%`}} />
            <span className="trend-bar-value" style={{height: `${point.value}%`}} />
          </div>
          <Text variant="secondary" size="sm" as="span">{point.label}</Text>
        </div>
      ))}
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map(metric => <MetricCard key={metric.label} metric={metric} />)}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <LayerCard className="min-w-0">
          <LayerCard.Secondary>
            <SectionTitle title={copy.trendTitle} aside={<Badge variant="blue">{copy.months}</Badge>} />
          </LayerCard.Secondary>
          <LayerCard.Primary>
            <TrendBars data={data.trend} />
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
