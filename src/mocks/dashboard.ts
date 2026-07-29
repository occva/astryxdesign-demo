import type {DashboardData} from '../types';

export const dashboardData: DashboardData = {
  metrics: [
    {label: 'Visits', value: '86,420', delta: '+12.8%', tone: 'positive'},
    {label: 'Revenue', value: '$128,430', delta: '+8.4%', tone: 'positive'},
    {label: 'New users', value: '2,846', delta: '+6.1%', tone: 'positive'},
    {label: 'Conversion rate', value: '12.6%', delta: '-1.2%', tone: 'negative'},
  ],
  trend: [
    {label: 'Jan', value: 42, target: 50},
    {label: 'Feb', value: 58, target: 54},
    {label: 'Mar', value: 36, target: 48},
    {label: 'Apr', value: 64, target: 58},
    {label: 'May', value: 72, target: 62},
    {label: 'Jun', value: 54, target: 60},
    {label: 'Jul', value: 88, target: 70},
    {label: 'Aug', value: 76, target: 72},
    {label: 'Sep', value: 92, target: 78},
    {label: 'Oct', value: 80, target: 74},
    {label: 'Nov', value: 98, target: 82},
    {label: 'Dec', value: 86, target: 80},
  ],
  modules: [
    {label: 'CRUD data', value: 68, capacity: 100, color: 'blue'},
    {label: 'System configuration', value: 22, capacity: 100, color: 'teal'},
    {label: 'Chart views', value: 10, capacity: 100, color: 'orange'},
  ],
  activities: [
    {
      id: 'a1',
      title: 'CRUD data refreshed',
      description: 'User, role, and department tables are now in sync',
      time: '10 minutes ago',
      status: 'success',
    },
    {
      id: 'a2',
      title: 'Role permissions need review',
      description: 'The Operator role requested user search access',
      time: '28 minutes ago',
      status: 'warning',
    },
    {
      id: 'a3',
      title: 'Department headcount changed',
      description: 'Content Center now has more than 50 members; consider creating subdepartments',
      time: '1 hour ago',
      status: 'accent',
    },
    {
      id: 'a4',
      title: 'Menu configuration changed',
      description: 'A new System Management menu item is awaiting publication approval',
      time: '2 hours ago',
      status: 'neutral',
    },
  ],
};
