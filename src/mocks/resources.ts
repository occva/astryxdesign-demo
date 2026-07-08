import type {AdminRecord, ResourceSchema} from '../types';

const normalStatusOptions = [
  {label: '正常', value: 'normal', color: 'green', status: 'success'},
  {label: '禁用', value: 'disabled', color: 'gray', status: 'neutral'},
] as const;

const enabledStatusOptions = [
  {label: '启用', value: 'enabled', color: 'green', status: 'success'},
  {label: '禁用', value: 'disabled', color: 'gray', status: 'neutral'},
] as const;

const userFields = [
  {key: 'name', label: '姓名', kind: 'text', width: 'fluid', filterable: true, editable: true, required: true},
  {key: 'account', label: '账户', kind: 'text', editable: true, required: true},
  {key: 'status', label: '状态', kind: 'status', filterable: true, editable: true, options: normalStatusOptions as never},
  {key: 'phone', label: '手机号', kind: 'phone', filterable: true, editable: true},
  {key: 'gender', label: '性别', kind: 'select', editable: true, options: [
    {label: '男', value: '男', color: 'blue'},
    {label: '女', value: '女', color: 'pink'},
    {label: '保密', value: '保密', color: 'gray'},
  ]},
  {key: 'tags', label: '标签', kind: 'tags'},
  {key: 'createdAt', label: '创建时间', kind: 'date'},
  {key: 'department', label: '部门', kind: 'text', editable: true},
] satisfies ResourceSchema['fields'];

export const resourceSchemas: ResourceSchema[] = [
  {
    id: 'crud',
    title: 'CRUD 数据表格',
    primaryField: 'name',
    statusField: 'status',
    filterFields: ['name', 'phone', 'status'],
    fields: userFields,
  },
  {
    id: 'users',
    title: '系统用户',
    primaryField: 'name',
    statusField: 'status',
    filterFields: ['name', 'phone', 'status'],
    fields: userFields,
  },
  {
    id: 'roles',
    title: '角色管理',
    primaryField: 'name',
    statusField: 'status',
    filterFields: ['name', 'code', 'status'],
    fields: [
      {key: 'name', label: '角色名称', kind: 'text', width: 'fluid', filterable: true, editable: true, required: true},
      {key: 'code', label: '角色编码', kind: 'text', filterable: true, editable: true},
      {key: 'status', label: '状态', kind: 'status', filterable: true, editable: true, options: enabledStatusOptions as never},
      {key: 'scope', label: '权限范围', kind: 'text', width: 'fluid', editable: true},
      {key: 'updatedAt', label: '更新时间', kind: 'date'},
    ],
  },
  {
    id: 'departments',
    title: '部门管理',
    primaryField: 'name',
    statusField: 'status',
    filterFields: ['name', 'owner', 'status'],
    fields: [
      {key: 'name', label: '部门名称', kind: 'text', width: 'fluid', filterable: true, editable: true, required: true},
      {key: 'parent', label: '上级部门', kind: 'text', editable: true},
      {key: 'status', label: '状态', kind: 'status', filterable: true, editable: true, options: enabledStatusOptions as never},
      {key: 'owner', label: '负责人', kind: 'text', filterable: true, editable: true},
      {key: 'members', label: '成员数', kind: 'number', editable: true},
    ],
  },
  {
    id: 'menus',
    title: '菜单管理',
    primaryField: 'name',
    statusField: 'status',
    filterFields: ['name', 'path', 'status'],
    fields: [
      {key: 'name', label: '菜单名称', kind: 'text', width: 'fluid', filterable: true, editable: true, required: true},
      {key: 'path', label: '路由地址', kind: 'text', filterable: true, editable: true},
      {key: 'icon', label: '图标', kind: 'text', editable: true},
      {key: 'status', label: '状态', kind: 'status', filterable: true, editable: true, options: enabledStatusOptions as never},
      {key: 'sort', label: '排序', kind: 'text', editable: true},
    ],
  },
];

const users: AdminRecord[] = [
  {id: 'u1', name: '董秀兰', account: 'gsrwr', status: 'disabled', phone: '15578728477', gender: '男', tags: ['运营', '活动', '排班', '审核', '门店', '数据'], createdAt: '2015-06-02 05:05:13', department: '华南运营部'},
  {id: 'u2', name: '夏洋', account: 'noaco', status: 'normal', phone: '15578721335', gender: '女', tags: ['客服', '售后', '回访', '质检', '工单', '培训', '排班'], createdAt: '1976-12-13 20:57:00', department: '客户成功部'},
  {id: 'u3', name: '赖涛', account: 'yqtsy', status: 'normal', phone: '15578723666', gender: '保密', tags: ['商品', '选品', '价格', '库存', '上架', '活动', '供应商', '复核'], createdAt: '1981-01-16 17:33:52', department: '商品中心'},
  {id: 'u4', name: '易杰', account: 'cgvoo', status: 'disabled', phone: '15578725798', gender: '保密', tags: ['仓储', '盘点', '调拨', '异常'], createdAt: '2017-10-28 16:19:18', department: '供应链部'},
  {id: 'u5', name: '傅军', account: 'sqqib', status: 'normal', phone: '15578725256', gender: '保密', tags: ['财务', '对账'], createdAt: '2012-12-01 08:15:36', department: '财务部'},
  {id: 'u6', name: '康勇', account: 'ukexe', status: 'normal', phone: '15578723678', gender: '女', tags: ['内容', '素材', '审核', '投放', '短视频', '直播'], createdAt: '1990-05-29 23:12:35', department: '内容中心'},
];

export const resourceRecords: Record<string, AdminRecord[]> = {
  crud: users,
  users: structuredClone(users),
  roles: [
    {id: 'r1', name: '超级管理员', code: 'admin', status: 'enabled', scope: '全部菜单、按钮、数据权限', updatedAt: '2026-06-28 10:21'},
    {id: 'r2', name: '运营人员', code: 'operator', status: 'enabled', scope: '首页、CRUD 管理、用户查询', updatedAt: '2026-06-25 15:04'},
    {id: 'r3', name: '财务人员', code: 'finance', status: 'enabled', scope: '订单数据、报表导出、对账权限', updatedAt: '2026-06-20 09:12'},
    {id: 'r4', name: '访客', code: 'guest', status: 'disabled', scope: '只读仪表盘', updatedAt: '2026-05-18 13:45'},
  ],
  departments: [
    {id: 'd1', name: '总部', parent: '0', status: 'enabled', owner: '管理员', members: 18},
    {id: 'd2', name: '华南运营部', parent: '总部', status: 'enabled', owner: '董秀兰', members: 42},
    {id: 'd3', name: '客户成功部', parent: '总部', status: 'enabled', owner: '夏洋', members: 36},
    {id: 'd4', name: '商品中心', parent: '总部', status: 'enabled', owner: '赖涛', members: 51},
    {id: 'd5', name: '供应链部', parent: '总部', status: 'disabled', owner: '易杰', members: 27},
  ],
  menus: [
    {id: 'm1', name: '首页', path: '/home', icon: 'i-chart', status: 'enabled', sort: '1'},
    {id: 'm2', name: 'CRUD 管理', path: '/crud', icon: 'i-crud', status: 'enabled', sort: '2'},
    {id: 'm3', name: '系统管理', path: '/system', icon: 'i-setting', status: 'enabled', sort: '3'},
    {id: 'm4', name: '用户管理', path: '/system/user', icon: 'i-table', status: 'enabled', sort: '3-1'},
    {id: 'm5', name: '角色管理', path: '/system/role', icon: 'i-table', status: 'enabled', sort: '3-2'},
  ],
};
