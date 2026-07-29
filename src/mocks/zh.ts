import type {
  AdminRecord,
  AppConfig,
  AppNotification,
  DashboardData,
  ResourceSchema,
  UserCenterData,
} from '../types';
import type {UserDetailField, UserDetailSectionKey} from './userCenter';

const userStatusOptions = [
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
  {key: 'status', label: '状态', kind: 'status', filterable: true, editable: true, options: userStatusOptions as never},
  {key: 'phone', label: '手机号', kind: 'phone', filterable: true, editable: true},
  {key: 'gender', label: '性别', kind: 'select', editable: true, options: [
    {label: '男', value: '男', color: 'blue'},
    {label: '女', value: '女', color: 'pink'},
    {label: '保密', value: '保密', color: 'gray'},
  ]},
  {key: 'tags', label: '标签', kind: 'tags'},
  {key: 'createdAt', label: '创建时间', kind: 'date', filterable: true, editable: true},
  {key: 'department', label: '部门', kind: 'text', editable: true},
] satisfies ResourceSchema['fields'];

export const zhAppConfig: AppConfig = {
  profile: {
    name: '通用后台管理',
    operator: '系统管理员',
    department: '平台管理部',
    email: 'admin@example.com',
  },
  accountMenuActions: [
    {id: 'settings', label: '设置'},
    {id: 'theme', label: '主题'},
    {id: 'notifications', label: '通知'},
    {id: 'logout', label: '退出登录'},
  ],
  modules: [
    {id: 'charts', title: '首页', kind: 'dashboard', icon: 'dashboard', group: '导航'},
    {id: 'crud', title: 'CRUD 管理', kind: 'resource', icon: 'users', group: '导航', resource: 'crud'},
    {id: 'userCenter', title: '用户中心', kind: 'custom', icon: 'profile', group: '导航'},
    {
      id: 'sysRoot',
      title: '系统管理',
      kind: 'group',
      icon: 'settings',
      group: '系统管理',
      children: [
        {id: 'sysUser', title: '用户管理', kind: 'resource', icon: 'users', group: '系统管理', resource: 'users'},
        {id: 'sysRole', title: '角色管理', kind: 'resource', icon: 'roles', group: '系统管理', resource: 'roles'},
        {id: 'sysDept', title: '部门管理', kind: 'resource', icon: 'departments', group: '系统管理', resource: 'departments'},
        {id: 'sysMenu', title: '菜单管理', kind: 'resource', icon: 'settings', group: '系统管理', resource: 'menus'},
      ],
    },
  ],
};

export const zhDashboardData: DashboardData = {
  metrics: [
    {label: '访问量', value: '86,420', delta: '+12.8%', tone: 'positive'},
    {label: '成交额', value: '¥128,430', delta: '+8.4%', tone: 'positive'},
    {label: '新增用户', value: '2,846', delta: '+6.1%', tone: 'positive'},
    {label: '转化率', value: '12.6%', delta: '-1.2%', tone: 'negative'},
  ],
  trend: [
    {label: '1月', value: 42, target: 50}, {label: '2月', value: 58, target: 54},
    {label: '3月', value: 36, target: 48}, {label: '4月', value: 64, target: 58},
    {label: '5月', value: 72, target: 62}, {label: '6月', value: 54, target: 60},
    {label: '7月', value: 88, target: 70}, {label: '8月', value: 76, target: 72},
    {label: '9月', value: 92, target: 78}, {label: '10月', value: 80, target: 74},
    {label: '11月', value: 98, target: 82}, {label: '12月', value: 86, target: 80},
  ],
  modules: [
    {label: 'CRUD 数据', value: 68, capacity: 100, color: 'blue'},
    {label: '系统配置', value: 22, capacity: 100, color: 'teal'},
    {label: '图表访问', value: 10, capacity: 100, color: 'orange'},
  ],
  activities: [
    {id: 'a1', title: 'CRUD 数据刷新完成', description: '用户表、角色表和部门表已同步到页面', time: '10 分钟前', status: 'success'},
    {id: 'a2', title: '角色权限待复核', description: '运营人员角色申请新增用户查询权限', time: '28 分钟前', status: 'warning'},
    {id: 'a3', title: '部门成员数变化', description: '内容中心成员数超过 50，建议拆分子部门', time: '1 小时前', status: 'accent'},
    {id: 'a4', title: '菜单配置变更', description: '系统管理新增菜单项，等待发布确认', time: '2 小时前', status: 'neutral'},
  ],
};

export const zhNotifications: AppNotification[] = [
  {id: 'n1', title: '角色权限待复核', description: '运营人员角色申请新增用户查询权限。', time: '28 分钟前', status: 'warning', isRead: false},
  {id: 'n2', title: '菜单配置变更', description: '系统管理新增菜单项，等待发布确认。', time: '2 小时前', status: 'info', isRead: false},
  {id: 'n3', title: 'CRUD 数据刷新完成', description: '用户表、角色表和部门表已同步到页面。', time: '10 分钟前', status: 'success', isRead: true},
];

export const zhUserCenterDetailSchema: Record<UserDetailSectionKey, UserDetailField[]> = {
  personalDetails: [
    {label: '姓名', source: 'name'}, {label: '登录账号', source: 'account'},
    {label: '员工编号', source: 'employeeId'}, {label: '当前状态', source: 'status'},
    {label: '入职日期', source: 'joinedAt'}, {label: '办公地点', source: 'location'},
  ],
  contactDetails: [
    {label: '手机号', source: 'phone'}, {label: '邮箱', source: 'email'},
    {label: '企业微信', source: 'enterpriseWechat'}, {label: '紧急联系人', source: 'emergencyContact'},
  ],
  organizationDetails: [
    {label: '所属部门', source: 'department'}, {label: '岗位', source: 'title'},
    {label: '系统角色', source: 'role'}, {label: '直属上级', source: 'manager'},
  ],
};

export const zhUserCenterData: UserCenterData = {
  profile: {
    name: '系统管理员', title: '平台运营负责人', department: '平台管理部', account: 'admin',
    employeeId: 'EMP-2026-001', role: '超级管理员', manager: '平台负责人', email: 'admin@example.com',
    phone: '155 7872 0001', location: '上海 · 总部', joinedAt: '2024-03-18', status: '在线值守',
  },
  statusOptions: [
    {label: '在线值守', value: '在线值守', color: 'green'},
    {label: '忙碌处理中', value: '忙碌处理中', color: 'orange'},
    {label: '离线待命', value: '离线待命', color: 'gray'},
  ],
  securitySettings: [
    {key: 'passwordLogin', label: '允许密码登录', description: '关闭后仅保留企业身份认证入口。', value: true},
    {key: 'twoFactorAuth', label: '双重验证', description: '登录敏感模块时需要二次确认。', value: true},
    {key: 'loginAlert', label: '异地登录提醒', description: '检测到新地点登录时发送邮件提醒。', value: true},
  ],
  personalDetails: [
    {label: '姓名', value: '系统管理员'}, {label: '登录账号', value: 'admin'},
    {label: '员工编号', value: 'EMP-2026-001'}, {label: '当前状态', value: '在线值守'},
    {label: '入职日期', value: '2024-03-18'}, {label: '办公地点', value: '上海 · 总部'},
  ],
  contactDetails: [
    {label: '手机号', value: '155 7872 0001'}, {label: '邮箱', value: 'admin@example.com'},
    {label: '企业微信', value: 'admin.ops'}, {label: '紧急联系人', value: '平台值班组'},
  ],
  organizationDetails: [
    {label: '所属部门', value: '平台管理部'}, {label: '岗位', value: '平台运营负责人'},
    {label: '系统角色', value: '超级管理员'}, {label: '直属上级', value: '平台负责人'},
  ],
};

export const zhResourceSchemas: ResourceSchema[] = [
  {id: 'crud', title: 'CRUD 数据表格', primaryField: 'name', statusField: 'status', filterFields: ['name', 'phone', 'status', 'createdAt'], fields: userFields},
  {id: 'users', title: '系统用户', primaryField: 'name', statusField: 'status', filterFields: ['name', 'phone', 'status', 'createdAt'], fields: userFields},
  {
    id: 'roles', title: '角色管理', primaryField: 'name', statusField: 'status', filterFields: ['name', 'code', 'status', 'updatedAt'],
    fields: [
      {key: 'name', label: '角色名称', kind: 'text', width: 'fluid', filterable: true, editable: true, required: true},
      {key: 'code', label: '角色编码', kind: 'text', filterable: true, editable: true},
      {key: 'status', label: '状态', kind: 'status', filterable: true, editable: true, options: enabledStatusOptions as never},
      {key: 'scope', label: '权限范围', kind: 'text', width: 'fluid', editable: true},
      {key: 'updatedAt', label: '更新时间', kind: 'date', filterable: true, editable: true},
    ],
  },
  {
    id: 'departments', title: '部门管理', primaryField: 'name', statusField: 'status', filterFields: ['name', 'owner', 'status'],
    fields: [
      {key: 'name', label: '部门名称', kind: 'text', width: 'fluid', filterable: true, editable: true, required: true},
      {key: 'parent', label: '上级部门', kind: 'text', editable: true},
      {key: 'status', label: '状态', kind: 'status', filterable: true, editable: true, options: enabledStatusOptions as never},
      {key: 'owner', label: '负责人', kind: 'text', filterable: true, editable: true},
      {key: 'members', label: '成员数', kind: 'number', editable: true},
    ],
  },
  {
    id: 'menus', title: '菜单管理', primaryField: 'name', statusField: 'status', filterFields: ['name', 'path', 'status'],
    fields: [
      {key: 'name', label: '菜单名称', kind: 'text', width: 'fluid', filterable: true, editable: true, required: true},
      {key: 'path', label: '路由地址', kind: 'text', filterable: true, editable: true},
      {key: 'icon', label: '图标', kind: 'text', editable: true},
      {key: 'status', label: '状态', kind: 'status', filterable: true, editable: true, options: enabledStatusOptions as never},
      {key: 'sort', label: '排序', kind: 'text', editable: true},
    ],
  },
];

const zhUsers: AdminRecord[] = [
  {id: 'u1', name: '董秀兰', account: 'gsrwr', status: 'disabled', phone: '15578728477', gender: '女', tags: ['运营', '活动', '排班', '审核', '门店', '数据'], createdAt: '2015-06-02 05:05:13', department: '华南运营部'},
  {id: 'u2', name: '夏洋', account: 'noaco', status: 'normal', phone: '15578721335', gender: '男', tags: ['客服', '售后', '回访', '质检', '工单', '培训', '排班'], createdAt: '1976-12-13 20:57:00', department: '客户成功部'},
  {id: 'u3', name: '赖涛', account: 'yqtsy', status: 'normal', phone: '15578723666', gender: '保密', tags: ['商品', '选品', '价格', '库存', '上架', '活动', '供应商', '复核'], createdAt: '1981-01-16 17:33:52', department: '商品中心'},
  {id: 'u4', name: '易杰', account: 'cgvoo', status: 'disabled', phone: '15578725798', gender: '保密', tags: ['仓储', '盘点', '调拨', '异常'], createdAt: '2017-10-28 16:19:18', department: '供应链部'},
  {id: 'u5', name: '傅军', account: 'sqqib', status: 'normal', phone: '15578725256', gender: '保密', tags: ['财务', '对账'], createdAt: '2012-12-01 08:15:36', department: '财务部'},
  {id: 'u6', name: '康勇', account: 'ukexe', status: 'normal', phone: '15578723678', gender: '女', tags: ['内容', '素材', '审核', '投放', '短视频', '直播'], createdAt: '1990-05-29 23:12:35', department: '内容中心'},
];

export const zhResourceRecords: Record<string, AdminRecord[]> = {
  crud: zhUsers,
  users: structuredClone(zhUsers),
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
