import type {Locale} from '../localization';
import type {DashboardData} from '../types';
import {createMockText} from './localized';

export function createDashboardData(locale: Locale): DashboardData {
  const t = createMockText(locale);
  return {
    metrics: [
      {label: t('Visits', '访问量'), value: '86,420', delta: '+12.8%', tone: 'positive'},
      {label: t('Revenue', '成交额'), value: t('$128,430', '¥128,430'), delta: '+8.4%', tone: 'positive'},
      {label: t('New users', '新增用户'), value: '2,846', delta: '+6.1%', tone: 'positive'},
      {label: t('Conversion rate', '转化率'), value: '12.6%', delta: '-1.2%', tone: 'negative'},
    ],
    trend: [
      {label: t('Jan', '1月'), value: 42, target: 50},
      {label: t('Feb', '2月'), value: 58, target: 54},
      {label: t('Mar', '3月'), value: 36, target: 48},
      {label: t('Apr', '4月'), value: 64, target: 58},
      {label: t('May', '5月'), value: 72, target: 62},
      {label: t('Jun', '6月'), value: 54, target: 60},
      {label: t('Jul', '7月'), value: 88, target: 70},
      {label: t('Aug', '8月'), value: 76, target: 72},
      {label: t('Sep', '9月'), value: 92, target: 78},
      {label: t('Oct', '10月'), value: 80, target: 74},
      {label: t('Nov', '11月'), value: 98, target: 82},
      {label: t('Dec', '12月'), value: 86, target: 80},
    ],
    modules: [
      {label: t('CRUD data', 'CRUD 数据'), value: 68, capacity: 100, color: 'blue'},
      {label: t('System configuration', '系统配置'), value: 22, capacity: 100, color: 'teal'},
      {label: t('Chart views', '图表访问'), value: 10, capacity: 100, color: 'orange'},
    ],
    activities: [
      {
        id: 'a1',
        title: t('CRUD data refreshed', 'CRUD 数据刷新完成'),
        description: t('User, role, and department tables are now in sync', '用户表、角色表和部门表已同步到页面'),
        time: t('10 minutes ago', '10 分钟前'),
        status: 'success',
      },
      {
        id: 'a2',
        title: t('Role permissions need review', '角色权限待复核'),
        description: t('The Operator role requested user search access', '运营人员角色申请新增用户查询权限'),
        time: t('28 minutes ago', '28 分钟前'),
        status: 'warning',
      },
      {
        id: 'a3',
        title: t('Department headcount changed', '部门成员数变化'),
        description: t('Content Center now has more than 50 members; consider creating subdepartments', '内容中心成员数超过 50，建议拆分子部门'),
        time: t('1 hour ago', '1 小时前'),
        status: 'accent',
      },
      {
        id: 'a4',
        title: t('Menu configuration changed', '菜单配置变更'),
        description: t('A new System Management menu item is awaiting publication approval', '系统管理新增菜单项，等待发布确认'),
        time: t('2 hours ago', '2 小时前'),
        status: 'neutral',
      },
    ],
  };
}
