import type {Locale} from '../localization';
import type {AdminRecord, ResourceSchema} from '../types';
import {createMockText} from './localized';

export function createResourceSchemas(locale: Locale): ResourceSchema[] {
  const t = createMockText(locale);
  const normalStatusOptions = [
    {label: t('Active', '正常'), value: 'normal', color: 'green', status: 'success'},
    {label: t('Disabled', '禁用'), value: 'disabled', color: 'gray', status: 'neutral'},
  ] as const;
  const enabledStatusOptions = [
    {label: t('Enabled', '启用'), value: 'enabled', color: 'green', status: 'success'},
    {label: t('Disabled', '禁用'), value: 'disabled', color: 'gray', status: 'neutral'},
  ] as const;
  const userFields = [
    {key: 'name', label: t('Name', '姓名'), kind: 'text', width: 'fluid', filterable: true, editable: true, required: true},
    {key: 'account', label: t('Account', '账户'), kind: 'text', editable: true, required: true},
    {key: 'status', label: t('Status', '状态'), kind: 'status', filterable: true, editable: true, options: normalStatusOptions as never},
    {key: 'phone', label: t('Phone', '手机号'), kind: 'phone', filterable: true, editable: true},
    {key: 'gender', label: t('Gender', '性别'), kind: 'select', editable: true, options: [
      {label: t('Male', '男'), value: t('Male', '男'), color: 'blue'},
      {label: t('Female', '女'), value: t('Female', '女'), color: 'pink'},
      {label: t('Prefer not to say', '保密'), value: t('Prefer not to say', '保密'), color: 'gray'},
    ]},
    {key: 'tags', label: t('Tags', '标签'), kind: 'tags'},
    {key: 'createdAt', label: t('Created at', '创建时间'), kind: 'date'},
    {key: 'department', label: t('Department', '部门'), kind: 'text', editable: true},
  ] satisfies ResourceSchema['fields'];

  return [
    {id: 'crud', title: t('CRUD Records', 'CRUD 数据表格'), primaryField: 'name', statusField: 'status', filterFields: ['name', 'phone', 'status'], fields: userFields},
    {id: 'users', title: t('System Users', '系统用户'), primaryField: 'name', statusField: 'status', filterFields: ['name', 'phone', 'status'], fields: userFields},
    {
      id: 'roles', title: t('Roles', '角色管理'), primaryField: 'name', statusField: 'status', filterFields: ['name', 'code', 'status'],
      fields: [
        {key: 'name', label: t('Role name', '角色名称'), kind: 'text', width: 'fluid', filterable: true, editable: true, required: true},
        {key: 'code', label: t('Role code', '角色编码'), kind: 'text', filterable: true, editable: true},
        {key: 'status', label: t('Status', '状态'), kind: 'status', filterable: true, editable: true, options: enabledStatusOptions as never},
        {key: 'scope', label: t('Permission scope', '权限范围'), kind: 'text', width: 'fluid', editable: true},
        {key: 'updatedAt', label: t('Updated at', '更新时间'), kind: 'date'},
      ],
    },
    {
      id: 'departments', title: t('Departments', '部门管理'), primaryField: 'name', statusField: 'status', filterFields: ['name', 'owner', 'status'],
      fields: [
        {key: 'name', label: t('Department name', '部门名称'), kind: 'text', width: 'fluid', filterable: true, editable: true, required: true},
        {key: 'parent', label: t('Parent department', '上级部门'), kind: 'text', editable: true},
        {key: 'status', label: t('Status', '状态'), kind: 'status', filterable: true, editable: true, options: enabledStatusOptions as never},
        {key: 'owner', label: t('Owner', '负责人'), kind: 'text', filterable: true, editable: true},
        {key: 'members', label: t('Members', '成员数'), kind: 'number', editable: true},
      ],
    },
    {
      id: 'menus', title: t('Menus', '菜单管理'), primaryField: 'name', statusField: 'status', filterFields: ['name', 'path', 'status'],
      fields: [
        {key: 'name', label: t('Menu name', '菜单名称'), kind: 'text', width: 'fluid', filterable: true, editable: true, required: true},
        {key: 'path', label: t('Route path', '路由地址'), kind: 'text', filterable: true, editable: true},
        {key: 'icon', label: t('Icon', '图标'), kind: 'text', editable: true},
        {key: 'status', label: t('Status', '状态'), kind: 'status', filterable: true, editable: true, options: enabledStatusOptions as never},
        {key: 'sort', label: t('Sort order', '排序'), kind: 'text', editable: true},
      ],
    },
  ];
}

export function createResourceRecords(locale: Locale): Record<string, AdminRecord[]> {
  const t = createMockText(locale);
  const users: AdminRecord[] = [
    {id: 'u1', name: t('Alice Dong', '董秀兰'), account: 'gsrwr', status: 'disabled', phone: '15578728477', gender: t('Female', '女'), tags: [t('Operations', '运营'), t('Campaigns', '活动'), t('Scheduling', '排班'), t('Review', '审核'), t('Retail', '门店'), t('Data', '数据')], createdAt: '2015-06-02 05:05:13', department: t('South China Operations', '华南运营部')},
    {id: 'u2', name: t('Evan Xia', '夏洋'), account: 'noaco', status: 'normal', phone: '15578721335', gender: t('Male', '男'), tags: [t('Support', '客服'), t('After-sales', '售后'), t('Follow-up', '回访'), t('Quality', '质检'), t('Tickets', '工单'), t('Training', '培训'), t('Scheduling', '排班')], createdAt: '1976-12-13 20:57:00', department: t('Customer Success', '客户成功部')},
    {id: 'u3', name: t('Theo Lai', '赖涛'), account: 'yqtsy', status: 'normal', phone: '15578723666', gender: t('Prefer not to say', '保密'), tags: [t('Products', '商品'), t('Sourcing', '选品'), t('Pricing', '价格'), t('Inventory', '库存'), t('Listings', '上架'), t('Campaigns', '活动'), t('Suppliers', '供应商'), t('Review', '复核')], createdAt: '1981-01-16 17:33:52', department: t('Merchandising', '商品中心')},
    {id: 'u4', name: t('Jay Yi', '易杰'), account: 'cgvoo', status: 'disabled', phone: '15578725798', gender: t('Prefer not to say', '保密'), tags: [t('Warehousing', '仓储'), t('Stocktake', '盘点'), t('Transfers', '调拨'), t('Exceptions', '异常')], createdAt: '2017-10-28 16:19:18', department: t('Supply Chain', '供应链部')},
    {id: 'u5', name: t('Jordan Fu', '傅军'), account: 'sqqib', status: 'normal', phone: '15578725256', gender: t('Prefer not to say', '保密'), tags: [t('Finance', '财务'), t('Reconciliation', '对账')], createdAt: '2012-12-01 08:15:36', department: t('Finance', '财务部')},
    {id: 'u6', name: t('Kelly Kang', '康勇'), account: 'ukexe', status: 'normal', phone: '15578723678', gender: t('Female', '女'), tags: [t('Content', '内容'), t('Assets', '素材'), t('Review', '审核'), t('Promotion', '投放'), t('Short video', '短视频'), t('Live streaming', '直播')], createdAt: '1990-05-29 23:12:35', department: t('Content Center', '内容中心')},
  ];

  return {
    crud: users,
    users: structuredClone(users),
    roles: [
      {id: 'r1', name: t('Super Administrator', '超级管理员'), code: 'admin', status: 'enabled', scope: t('All menus, actions, and data', '全部菜单、按钮、数据权限'), updatedAt: '2026-06-28 10:21'},
      {id: 'r2', name: t('Operator', '运营人员'), code: 'operator', status: 'enabled', scope: t('Dashboard, CRUD management, and user search', '首页、CRUD 管理、用户查询'), updatedAt: '2026-06-25 15:04'},
      {id: 'r3', name: t('Finance', '财务人员'), code: 'finance', status: 'enabled', scope: t('Order data, report exports, and reconciliation', '订单数据、报表导出、对账权限'), updatedAt: '2026-06-20 09:12'},
      {id: 'r4', name: t('Guest', '访客'), code: 'guest', status: 'disabled', scope: t('Read-only dashboard', '只读仪表盘'), updatedAt: '2026-05-18 13:45'},
    ],
    departments: [
      {id: 'd1', name: t('Headquarters', '总部'), parent: '0', status: 'enabled', owner: t('Administrator', '管理员'), members: 18},
      {id: 'd2', name: t('South China Operations', '华南运营部'), parent: t('Headquarters', '总部'), status: 'enabled', owner: t('Alice Dong', '董秀兰'), members: 42},
      {id: 'd3', name: t('Customer Success', '客户成功部'), parent: t('Headquarters', '总部'), status: 'enabled', owner: t('Evan Xia', '夏洋'), members: 36},
      {id: 'd4', name: t('Merchandising', '商品中心'), parent: t('Headquarters', '总部'), status: 'enabled', owner: t('Theo Lai', '赖涛'), members: 51},
      {id: 'd5', name: t('Supply Chain', '供应链部'), parent: t('Headquarters', '总部'), status: 'disabled', owner: t('Jay Yi', '易杰'), members: 27},
    ],
    menus: [
      {id: 'm1', name: t('Dashboard', '首页'), path: '/home', icon: 'i-chart', status: 'enabled', sort: '1'},
      {id: 'm2', name: t('CRUD Management', 'CRUD 管理'), path: '/crud', icon: 'i-crud', status: 'enabled', sort: '2'},
      {id: 'm3', name: t('System Management', '系统管理'), path: '/system', icon: 'i-setting', status: 'enabled', sort: '3'},
      {id: 'm4', name: t('User Management', '用户管理'), path: '/system/user', icon: 'i-table', status: 'enabled', sort: '3-1'},
      {id: 'm5', name: t('Role Management', '角色管理'), path: '/system/role', icon: 'i-table', status: 'enabled', sort: '3-2'},
    ],
  };
}
