import type {Locale} from '../localization';
import type {AppNotification} from '../types';
import {createMockText} from './localized';

export function createNotifications(locale: Locale): AppNotification[] {
  const t = createMockText(locale);
  return [
    {
      id: 'n1',
      title: t('Role permissions need review', '角色权限待复核'),
      description: t('The Operator role requested user search access.', '运营人员角色申请新增用户查询权限。'),
      time: t('28 minutes ago', '28 分钟前'),
      status: 'warning',
      isRead: false,
    },
    {
      id: 'n2',
      title: t('Menu configuration changed', '菜单配置变更'),
      description: t('A new System Management menu item is awaiting publication approval.', '系统管理新增菜单项，等待发布确认。'),
      time: t('2 hours ago', '2 小时前'),
      status: 'info',
      isRead: false,
    },
    {
      id: 'n3',
      title: t('CRUD data refreshed', 'CRUD 数据刷新完成'),
      description: t('User, role, and department tables are now in sync.', '用户表、角色表和部门表已同步到页面。'),
      time: t('10 minutes ago', '10 分钟前'),
      status: 'success',
      isRead: true,
    },
  ];
}
