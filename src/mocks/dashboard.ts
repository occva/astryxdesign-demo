import type {DashboardData} from '../types';

export const dashboardData: DashboardData = {
  metrics: [
    {label: '访问量', value: '86,420', delta: '+12.8%', tone: 'positive'},
    {label: '成交额', value: '¥128,430', delta: '+8.4%', tone: 'positive'},
    {label: '新增用户', value: '2,846', delta: '+6.1%', tone: 'positive'},
    {label: '转化率', value: '12.6%', delta: '-1.2%', tone: 'negative'},
  ],
  trend: [
    {label: '1月', value: 42, target: 50},
    {label: '2月', value: 58, target: 54},
    {label: '3月', value: 36, target: 48},
    {label: '4月', value: 64, target: 58},
    {label: '5月', value: 72, target: 62},
    {label: '6月', value: 54, target: 60},
    {label: '7月', value: 88, target: 70},
    {label: '8月', value: 76, target: 72},
    {label: '9月', value: 92, target: 78},
    {label: '10月', value: 80, target: 74},
    {label: '11月', value: 98, target: 82},
    {label: '12月', value: 86, target: 80},
  ],
  modules: [
    {label: 'CRUD 数据', value: 68, capacity: 100, color: 'blue'},
    {label: '系统配置', value: 22, capacity: 100, color: 'teal'},
    {label: '图表访问', value: 10, capacity: 100, color: 'orange'},
  ],
  activities: [
    {
      id: 'a1',
      title: 'CRUD 数据刷新完成',
      description: '用户表、角色表和部门表已同步到页面',
      time: '10 分钟前',
      status: 'success',
    },
    {
      id: 'a2',
      title: '角色权限待复核',
      description: '运营人员角色申请新增用户查询权限',
      time: '28 分钟前',
      status: 'warning',
    },
    {
      id: 'a3',
      title: '部门成员数变化',
      description: '内容中心成员数超过 50，建议拆分子部门',
      time: '1 小时前',
      status: 'accent',
    },
    {
      id: 'a4',
      title: '菜单配置变更',
      description: '系统管理新增菜单项，等待发布确认',
      time: '2 小时前',
      status: 'neutral',
    },
  ],
};
