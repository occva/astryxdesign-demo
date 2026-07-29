import type {AppNotification} from '../types';

export const notifications: AppNotification[] = [
  {
    id: 'n1',
    title: 'Role permissions need review',
    description: 'The Operator role requested user search access.',
    time: '28 minutes ago',
    status: 'warning',
    isRead: false,
  },
  {
    id: 'n2',
    title: 'Menu configuration changed',
    description: 'A new System Management menu item is awaiting publication approval.',
    time: '2 hours ago',
    status: 'info',
    isRead: false,
  },
  {
    id: 'n3',
    title: 'CRUD data refreshed',
    description: 'User, role, and department tables are now in sync.',
    time: '10 minutes ago',
    status: 'success',
    isRead: true,
  },
];
