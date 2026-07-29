import type {AdminRecord, ResourceSchema} from '../types';

const normalStatusOptions = [
  {label: 'Active', value: 'normal', color: 'green', status: 'success'},
  {label: 'Disabled', value: 'disabled', color: 'gray', status: 'neutral'},
] as const;

const enabledStatusOptions = [
  {label: 'Enabled', value: 'enabled', color: 'green', status: 'success'},
  {label: 'Disabled', value: 'disabled', color: 'gray', status: 'neutral'},
] as const;

const userFields = [
  {key: 'name', label: 'Name', kind: 'text', width: 'fluid', filterable: true, editable: true, required: true},
  {key: 'account', label: 'Account', kind: 'text', editable: true, required: true},
  {key: 'status', label: 'Status', kind: 'status', filterable: true, editable: true, options: normalStatusOptions as never},
  {key: 'phone', label: 'Phone', kind: 'phone', filterable: true, editable: true},
  {key: 'gender', label: 'Gender', kind: 'select', editable: true, options: [
    {label: 'Male', value: 'Male', color: 'blue'},
    {label: 'Female', value: 'Female', color: 'pink'},
    {label: 'Prefer not to say', value: 'Prefer not to say', color: 'gray'},
  ]},
  {key: 'tags', label: 'Tags', kind: 'tags'},
  {key: 'createdAt', label: 'Created at', kind: 'date'},
  {key: 'department', label: 'Department', kind: 'text', editable: true},
] satisfies ResourceSchema['fields'];

export const resourceSchemas: ResourceSchema[] = [
  {
    id: 'crud',
    title: 'CRUD Records',
    primaryField: 'name',
    statusField: 'status',
    filterFields: ['name', 'phone', 'status'],
    fields: userFields,
  },
  {
    id: 'users',
    title: 'System Users',
    primaryField: 'name',
    statusField: 'status',
    filterFields: ['name', 'phone', 'status'],
    fields: userFields,
  },
  {
    id: 'roles',
    title: 'Roles',
    primaryField: 'name',
    statusField: 'status',
    filterFields: ['name', 'code', 'status'],
    fields: [
      {key: 'name', label: 'Role name', kind: 'text', width: 'fluid', filterable: true, editable: true, required: true},
      {key: 'code', label: 'Role code', kind: 'text', filterable: true, editable: true},
      {key: 'status', label: 'Status', kind: 'status', filterable: true, editable: true, options: enabledStatusOptions as never},
      {key: 'scope', label: 'Permission scope', kind: 'text', width: 'fluid', editable: true},
      {key: 'updatedAt', label: 'Updated at', kind: 'date'},
    ],
  },
  {
    id: 'departments',
    title: 'Departments',
    primaryField: 'name',
    statusField: 'status',
    filterFields: ['name', 'owner', 'status'],
    fields: [
      {key: 'name', label: 'Department name', kind: 'text', width: 'fluid', filterable: true, editable: true, required: true},
      {key: 'parent', label: 'Parent department', kind: 'text', editable: true},
      {key: 'status', label: 'Status', kind: 'status', filterable: true, editable: true, options: enabledStatusOptions as never},
      {key: 'owner', label: 'Owner', kind: 'text', filterable: true, editable: true},
      {key: 'members', label: 'Members', kind: 'number', editable: true},
    ],
  },
  {
    id: 'menus',
    title: 'Menus',
    primaryField: 'name',
    statusField: 'status',
    filterFields: ['name', 'path', 'status'],
    fields: [
      {key: 'name', label: 'Menu name', kind: 'text', width: 'fluid', filterable: true, editable: true, required: true},
      {key: 'path', label: 'Route path', kind: 'text', filterable: true, editable: true},
      {key: 'icon', label: 'Icon', kind: 'text', editable: true},
      {key: 'status', label: 'Status', kind: 'status', filterable: true, editable: true, options: enabledStatusOptions as never},
      {key: 'sort', label: 'Sort order', kind: 'text', editable: true},
    ],
  },
];

const users: AdminRecord[] = [
  {id: 'u1', name: 'Alice Dong', account: 'gsrwr', status: 'disabled', phone: '15578728477', gender: 'Female', tags: ['Operations', 'Campaigns', 'Scheduling', 'Review', 'Retail', 'Data'], createdAt: '2015-06-02 05:05:13', department: 'South China Operations'},
  {id: 'u2', name: 'Evan Xia', account: 'noaco', status: 'normal', phone: '15578721335', gender: 'Male', tags: ['Support', 'After-sales', 'Follow-up', 'Quality', 'Tickets', 'Training', 'Scheduling'], createdAt: '1976-12-13 20:57:00', department: 'Customer Success'},
  {id: 'u3', name: 'Theo Lai', account: 'yqtsy', status: 'normal', phone: '15578723666', gender: 'Prefer not to say', tags: ['Products', 'Sourcing', 'Pricing', 'Inventory', 'Listings', 'Campaigns', 'Suppliers', 'Review'], createdAt: '1981-01-16 17:33:52', department: 'Merchandising'},
  {id: 'u4', name: 'Jay Yi', account: 'cgvoo', status: 'disabled', phone: '15578725798', gender: 'Prefer not to say', tags: ['Warehousing', 'Stocktake', 'Transfers', 'Exceptions'], createdAt: '2017-10-28 16:19:18', department: 'Supply Chain'},
  {id: 'u5', name: 'Jordan Fu', account: 'sqqib', status: 'normal', phone: '15578725256', gender: 'Prefer not to say', tags: ['Finance', 'Reconciliation'], createdAt: '2012-12-01 08:15:36', department: 'Finance'},
  {id: 'u6', name: 'Kelly Kang', account: 'ukexe', status: 'normal', phone: '15578723678', gender: 'Female', tags: ['Content', 'Assets', 'Review', 'Promotion', 'Short video', 'Live streaming'], createdAt: '1990-05-29 23:12:35', department: 'Content Center'},
];

export const resourceRecords: Record<string, AdminRecord[]> = {
  crud: users,
  users: structuredClone(users),
  roles: [
    {id: 'r1', name: 'Super Administrator', code: 'admin', status: 'enabled', scope: 'All menus, actions, and data', updatedAt: '2026-06-28 10:21'},
    {id: 'r2', name: 'Operator', code: 'operator', status: 'enabled', scope: 'Dashboard, CRUD management, and user search', updatedAt: '2026-06-25 15:04'},
    {id: 'r3', name: 'Finance', code: 'finance', status: 'enabled', scope: 'Order data, report exports, and reconciliation', updatedAt: '2026-06-20 09:12'},
    {id: 'r4', name: 'Guest', code: 'guest', status: 'disabled', scope: 'Read-only dashboard', updatedAt: '2026-05-18 13:45'},
  ],
  departments: [
    {id: 'd1', name: 'Headquarters', parent: '0', status: 'enabled', owner: 'Administrator', members: 18},
    {id: 'd2', name: 'South China Operations', parent: 'Headquarters', status: 'enabled', owner: 'Alice Dong', members: 42},
    {id: 'd3', name: 'Customer Success', parent: 'Headquarters', status: 'enabled', owner: 'Evan Xia', members: 36},
    {id: 'd4', name: 'Merchandising', parent: 'Headquarters', status: 'enabled', owner: 'Theo Lai', members: 51},
    {id: 'd5', name: 'Supply Chain', parent: 'Headquarters', status: 'disabled', owner: 'Jay Yi', members: 27},
  ],
  menus: [
    {id: 'm1', name: 'Dashboard', path: '/home', icon: 'i-chart', status: 'enabled', sort: '1'},
    {id: 'm2', name: 'CRUD Management', path: '/crud', icon: 'i-crud', status: 'enabled', sort: '2'},
    {id: 'm3', name: 'System Management', path: '/system', icon: 'i-setting', status: 'enabled', sort: '3'},
    {id: 'm4', name: 'User Management', path: '/system/user', icon: 'i-table', status: 'enabled', sort: '3-1'},
    {id: 'm5', name: 'Role Management', path: '/system/role', icon: 'i-table', status: 'enabled', sort: '3-2'},
  ],
};
