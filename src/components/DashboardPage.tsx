import {useEffect, useState} from 'react';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Divider} from '@astryxdesign/core/Divider';
import {Grid} from '@astryxdesign/core/Grid';
import {Heading, Text} from '@astryxdesign/core/Text';
import {HStack, StackItem, VStack} from '@astryxdesign/core/Stack';
import {ProgressBar} from '@astryxdesign/core/ProgressBar';
import {StatusDot} from '@astryxdesign/core/StatusDot';
import {Token} from '@astryxdesign/core/Token';
import {Icon} from '@astryxdesign/core/Icon';
import {ArrowPathIcon} from '@heroicons/react/24/outline';
import {mockApi} from '../services/mockApi';
import type {DashboardData, DashboardMetric} from '../types';

function MetricCard({metric}: {metric: DashboardMetric}) {
  const color = metric.tone === 'negative' ? 'red' : metric.tone === 'positive' ? 'green' : 'blue';
  return (
    <Card>
      <VStack gap={2}>
        <Text type="supporting" color="secondary">{metric.label}</Text>
        <HStack hAlign="between" vAlign="end">
          <Heading level={2}>{metric.value}</Heading>
          <Token label={metric.delta} color={color} size="sm" />
        </HStack>
      </VStack>
    </Card>
  );
}

function TrendBars({data}: {data: DashboardData['trend']}) {
  return (
    <HStack gap={3} vAlign="end" className="trendChart">
      {data.map(point => (
        <VStack key={point.label} gap={2} hAlign="center" className="trendColumn">
          <HStack gap={1} vAlign="end" className="trendBars">
            <span className="trendTarget" style={{height: `${point.target}%`}} />
            <span className="trendValue" style={{height: `${point.value}%`}} />
          </HStack>
          <Text type="supporting" color="secondary">{point.label}</Text>
        </VStack>
      ))}
    </HStack>
  );
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
  }, []);

  if (!data) {
    return (
      <Card>
        <Text type="body">{isLoading ? '正在加载工作台...' : '暂无工作台数据'}</Text>
      </Card>
    );
  }

  return (
    <VStack gap={6}>
      <HStack hAlign="between" vAlign="center" wrap="wrap">
        <Heading level={1}>首页</Heading>
        <Button
          label="刷新数据"
          variant="secondary"
          icon={<Icon icon={ArrowPathIcon} size="sm" />}
          isLoading={isLoading}
          onClick={() => {
            setIsLoading(true);
            mockApi.getDashboard().then(next => {
              setData(next);
              setIsLoading(false);
            });
          }}
        />
      </HStack>

      <Grid className="dashboardMetricGrid" gap={4}>
        {data.metrics.map(metric => <MetricCard key={metric.label} metric={metric} />)}
      </Grid>

      <Grid className="dashboardPanelGrid" gap={4}>
        <Card>
          <VStack gap={5}>
            <HStack hAlign="between" vAlign="center">
              <Heading level={3}>近 12 月业务趋势</Heading>
              <Token label="12 个月" color="blue" size="sm" />
            </HStack>
            <TrendBars data={data.trend} />
          </VStack>
        </Card>

        <Card>
          <VStack gap={5}>
            <Heading level={3}>模块占比</Heading>
            {data.modules.map(item => (
              <VStack key={item.label} gap={2}>
                <HStack hAlign="between" vAlign="center">
                  <Text type="body">{item.label}</Text>
                  <Token label={`${item.value}%`} color={item.color ?? 'gray'} size="sm" />
                </HStack>
                <ProgressBar value={item.value} max={item.capacity} label={`${item.label} 容量`} isLabelHidden />
              </VStack>
            ))}
          </VStack>
        </Card>
      </Grid>

      <Card>
        <VStack gap={4}>
          <HStack hAlign="between" vAlign="center">
            <Heading level={3}>系统动态</Heading>
            <Text type="supporting" color="secondary">最近更新</Text>
          </HStack>
          <Divider />
          {data.activities.map(activity => (
            <HStack key={activity.id} gap={3} vAlign="start">
              <StatusDot variant={activity.status} label={activity.title} tooltip={activity.title} />
              <StackItem size="fill">
                <VStack gap={0.5}>
                  <HStack hAlign="between" vAlign="center" wrap="wrap">
                    <Text type="body">{activity.title}</Text>
                    <Text type="supporting" color="secondary">{activity.time}</Text>
                  </HStack>
                  <Text type="supporting" color="secondary">{activity.description}</Text>
                </VStack>
              </StackItem>
            </HStack>
          ))}
        </VStack>
      </Card>
    </VStack>
  );
}
