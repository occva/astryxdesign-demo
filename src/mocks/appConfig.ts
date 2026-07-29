import type {AppConfig} from '../types';

export const appProfile = {
  name: 'Admin Console',
  operator: 'System Administrator',
  department: 'Platform Operations',
  email: 'admin@example.com',
};

export const accountMenuActions = [
  {id: 'settings', label: 'Settings'},
  {id: 'theme', label: 'Theme'},
  {id: 'notifications', label: 'Notifications'},
  {id: 'logout', label: 'Sign out'},
] as const;

export const modules: AppConfig['modules'] = [
  {
    id: 'charts',
    title: 'Dashboard',
    kind: 'dashboard',
    icon: 'dashboard',
    group: 'Navigation',
  },
  {
    id: 'crud',
    title: 'CRUD Management',
    kind: 'resource',
    icon: 'users',
    group: 'Navigation',
    resource: 'crud',
  },
  {
    id: 'userCenter',
    title: 'User Center',
    kind: 'custom',
    icon: 'profile',
    group: 'Navigation',
  },
  {
    id: 'sysRoot',
    title: 'System Management',
    kind: 'group',
    icon: 'settings',
    group: 'System Management',
    children: [
      {
        id: 'sysUser',
        title: 'User Management',
        kind: 'resource',
        icon: 'users',
        group: 'System Management',
        resource: 'users',
      },
      {
        id: 'sysRole',
        title: 'Role Management',
        kind: 'resource',
        icon: 'roles',
        group: 'System Management',
        resource: 'roles',
      },
      {
        id: 'sysDept',
        title: 'Department Management',
        kind: 'resource',
        icon: 'departments',
        group: 'System Management',
        resource: 'departments',
      },
      {
        id: 'sysMenu',
        title: 'Menu Management',
        kind: 'resource',
        icon: 'settings',
        group: 'System Management',
        resource: 'menus',
      },
    ],
  },
];

export const appConfig: AppConfig = {
  profile: appProfile,
  accountMenuActions: [...accountMenuActions],
  modules,
};
