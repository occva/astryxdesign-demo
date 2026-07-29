import type {Locale} from '../localization';
import type {AppConfig} from '../types';
import {createMockText} from './localized';

export function createAppConfig(locale: Locale): AppConfig {
  const t = createMockText(locale);
  const navigationGroup = t('Navigation', '导航');
  const systemGroup = t('System Management', '系统管理');

  return {
    profile: {
      name: t('Admin Console', '通用后台管理'),
      operator: t('System Administrator', '系统管理员'),
      department: t('Platform Operations', '平台管理部'),
      email: 'admin@example.com',
    },
    accountMenuActions: [
      {id: 'settings', label: t('Settings', '设置')},
      {id: 'theme', label: t('Theme', '主题')},
      {id: 'notifications', label: t('Notifications', '通知')},
      {id: 'logout', label: t('Sign out', '退出登录')},
    ],
    modules: [
      {id: 'charts', title: t('Dashboard', '首页'), kind: 'dashboard', icon: 'dashboard', group: navigationGroup},
      {id: 'crud', title: t('CRUD Management', 'CRUD 管理'), kind: 'resource', icon: 'users', group: navigationGroup, resource: 'crud'},
      {id: 'userCenter', title: t('User Center', '用户中心'), kind: 'custom', icon: 'profile', group: navigationGroup},
      {
        id: 'sysRoot',
        title: systemGroup,
        kind: 'group',
        icon: 'settings',
        group: systemGroup,
        children: [
          {id: 'sysUser', title: t('User Management', '用户管理'), kind: 'resource', icon: 'users', group: systemGroup, resource: 'users'},
          {id: 'sysRole', title: t('Role Management', '角色管理'), kind: 'resource', icon: 'roles', group: systemGroup, resource: 'roles'},
          {id: 'sysDept', title: t('Department Management', '部门管理'), kind: 'resource', icon: 'departments', group: systemGroup, resource: 'departments'},
          {id: 'sysMenu', title: t('Menu Management', '菜单管理'), kind: 'resource', icon: 'settings', group: systemGroup, resource: 'menus'},
        ],
      },
    ],
  };
}
