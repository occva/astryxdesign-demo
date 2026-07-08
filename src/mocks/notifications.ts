import type {AppNotification} from '../types';

export const notifications: AppNotification[] = [
  {
    id: 'n1',
    title: '角色权限待复核',
    description: '运营人员角色申请新增用户查询权限。',
    time: '28 分钟前',
    status: 'warning',
    isRead: false,
  },
  {
    id: 'n2',
    title: '菜单配置变更',
    description: '系统管理新增菜单项，等待发布确认。',
    time: '2 小时前',
    status: 'info',
    isRead: false,
  },
  {
    id: 'n3',
    title: 'CRUD 数据刷新完成',
    description: '用户表、角色表和部门表已同步到页面。',
    time: '10 分钟前',
    status: 'success',
    isRead: true,
  },
];
