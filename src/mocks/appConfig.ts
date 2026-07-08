import type {AppConfig} from '../types';

export const appProfile = {
  name: '通用后台管理',
  operator: '系统管理员',
  department: '平台管理部',
  email: 'admin@example.com',
};

export const accountMenuActions = [
  {id: 'settings', label: '设置'},
  {id: 'theme', label: '主题'},
  {id: 'notifications', label: '通知'},
  {id: 'logout', label: '退出登录'},
] as const;

export const modules: AppConfig['modules'] = [
  {
    id: 'charts',
    title: '首页',
    kind: 'dashboard',
    icon: 'dashboard',
    group: '导航',
  },
  {
    id: 'crud',
    title: 'CRUD 管理',
    kind: 'resource',
    icon: 'users',
    group: '导航',
    resource: 'crud',
  },
  {
    id: 'userCenter',
    title: '用户中心',
    kind: 'custom',
    icon: 'profile',
    group: '导航',
  },
  {
    id: 'sysRoot',
    title: '系统管理',
    kind: 'group',
    icon: 'settings',
    group: '系统管理',
    children: [
      {
        id: 'sysUser',
        title: '用户管理',
        kind: 'resource',
        icon: 'users',
        group: '系统管理',
        resource: 'users',
      },
      {
        id: 'sysRole',
        title: '角色管理',
        kind: 'resource',
        icon: 'roles',
        group: '系统管理',
        resource: 'roles',
      },
      {
        id: 'sysDept',
        title: '部门管理',
        kind: 'resource',
        icon: 'departments',
        group: '系统管理',
        resource: 'departments',
      },
      {
        id: 'sysMenu',
        title: '菜单管理',
        kind: 'resource',
        icon: 'settings',
        group: '系统管理',
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
