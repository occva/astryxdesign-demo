import type {ResourceSchema} from '../types';
import type {TFunction} from 'i18next';

const statusOptions = (enabled: string, disabled: string, enabledValue: string) => [
  {label: enabled, value: enabledValue, color: 'green' as const, status: 'success' as const},
  {label: disabled, value: 'disabled', color: 'gray' as const, status: 'neutral' as const},
];

export function systemSchemas(t: TFunction<'adminResources'>): ResourceSchema[] {
  const copy = {
    users: {
      title: t('users.title'), name: t('users.name'), account: t('users.account'),
      status: t('users.status'), normal: t('users.normal'), disabled: t('users.disabled'),
      authStatus: t('users.authStatus'), provisioned: t('users.provisioned'),
      unprovisioned: t('users.unprovisioned'), phone: t('users.phone'), gender: t('users.gender'),
      tags: t('users.tags'), createdAt: t('users.createdAt'), department: t('users.department'),
      noDepartment: t('users.noDepartment'), role: t('users.role'), noRole: t('users.noRole'),
      male: t('users.male'), female: t('users.female'), unspecifiedGender: t('users.unspecifiedGender'),
    },
    roles: {
      title: t('roles.title'), name: t('roles.name'), code: t('roles.code'),
      status: t('roles.status'), enabled: t('roles.enabled'), disabled: t('roles.disabled'),
      scope: t('roles.scope'), updatedAt: t('roles.updatedAt'),
    },
    departments: {
      title: t('departments.title'), name: t('departments.name'), parent: t('departments.parent'),
      status: t('departments.status'), enabled: t('departments.enabled'), disabled: t('departments.disabled'),
      owner: t('departments.owner'), noOwner: t('departments.noOwner'), members: t('departments.members'),
    },
    menus: {
      title: t('menus.title'), name: t('menus.name'), code: t('menus.code'), parent: t('menus.parent'),
      root: t('menus.root'), path: t('menus.path'), icon: t('menus.icon'), component: t('menus.component'),
      directory: t('menus.directory'), visible: t('menus.visible'), shown: t('menus.shown'),
      hidden: t('menus.hidden'), status: t('menus.status'), enabled: t('menus.enabled'),
      disabled: t('menus.disabled'), sort: t('menus.sort'), dashboard: t('menus.dashboard'),
      auditLogs: t('menus.auditLogs'), files: t('menus.files'), iconMenu: t('menus.iconMenu'),
      organization: t('menus.organization'),
      iconSettings: t('menus.iconSettings'), iconUser: t('menus.iconUser'), iconRole: t('menus.iconRole'),
      iconDepartment: t('menus.iconDepartment'), iconTable: t('menus.iconTable'), iconChart: t('menus.iconChart'),
    },
  };
  return [
    {
      id: 'users', title: copy.users.title, primaryField: 'name', statusField: 'status',
      filterFields: ['name', 'phone', 'status', 'createdAt'], fields: [
        {key: 'name', label: copy.users.name, kind: 'text', width: 'fluid', filterable: true, editable: true, required: true},
        {key: 'account', label: copy.users.account, kind: 'text', editable: true, required: true},
        {key: 'authStatus', label: copy.users.authStatus, kind: 'status', editable: false, options: [
          {label: copy.users.provisioned, value: 'provisioned', status: 'success'},
          {label: copy.users.unprovisioned, value: 'unprovisioned', status: 'warning'},
        ]},
        {key: 'status', label: copy.users.status, kind: 'status', filterable: true, editable: true, options: statusOptions(copy.users.normal, copy.users.disabled, 'normal')},
        {key: 'phone', label: copy.users.phone, kind: 'phone', filterable: true, editable: true},
        {key: 'gender', label: copy.users.gender, kind: 'select', editable: true, options: [
          {label: copy.users.unspecifiedGender, value: ''},
          {label: copy.users.male, value: 'male'},
          {label: copy.users.female, value: 'female'},
        ]},
        {key: 'tags', label: copy.users.tags, kind: 'tags', editable: true},
        {key: 'createdAt', label: copy.users.createdAt, kind: 'date', filterable: true},
        {key: 'departmentId', label: copy.users.department, kind: 'select', visible: false, editable: true, options: [{label: copy.users.noDepartment, value: ''}]},
        {key: 'department', label: copy.users.department, kind: 'text', editable: false},
        {key: 'roleIds', label: copy.users.role, kind: 'multiselect', visible: false, editable: true},
        {key: 'role', label: copy.users.role, kind: 'text', editable: false},
      ],
    },
    {
      id: 'roles', title: copy.roles.title, primaryField: 'name', statusField: 'status',
      filterFields: ['name', 'code', 'status', 'updatedAt'], fields: [
        {key: 'name', label: copy.roles.name, kind: 'text', width: 'fluid', filterable: true, editable: true, required: true},
        {key: 'code', label: copy.roles.code, kind: 'text', filterable: true, editable: true},
        {key: 'status', label: copy.roles.status, kind: 'status', filterable: true, editable: true, options: statusOptions(copy.roles.enabled, copy.roles.disabled, 'enabled')},
        {key: 'scope', label: copy.roles.scope, kind: 'text', width: 'fluid', editable: false},
        {key: 'updatedAt', label: copy.roles.updatedAt, kind: 'date', filterable: true},
      ],
    },
    {
      id: 'departments', title: copy.departments.title, primaryField: 'name', statusField: 'status',
      filterFields: ['name', 'owner', 'status'], fields: [
        {key: 'name', label: copy.departments.name, kind: 'text', width: 'fluid', filterable: true, editable: true, required: true},
        {key: 'parent', label: copy.departments.parent, kind: 'text', editable: true},
        {key: 'status', label: copy.departments.status, kind: 'status', filterable: true, editable: true, options: statusOptions(copy.departments.enabled, copy.departments.disabled, 'enabled')},
        {key: 'ownerUserId', label: copy.departments.owner, kind: 'select', visible: false, editable: true, options: [{label: copy.departments.noOwner, value: ''}]},
        {key: 'owner', label: copy.departments.owner, kind: 'text', filterable: true, editable: false},
        {key: 'members', label: copy.departments.members, kind: 'number', editable: false},
      ],
    },
    {
      id: 'menus', title: copy.menus.title, primaryField: 'name', statusField: 'status',
      filterFields: ['name', 'path', 'status'], fields: [
        {key: 'name', label: copy.menus.name, kind: 'text', width: 'fluid', filterable: true, editable: true, required: true},
        {key: 'code', label: copy.menus.code, kind: 'text', visible: false, editable: true, required: true},
        {key: 'parentId', label: copy.menus.parent, kind: 'select', editable: true, visible: false, options: [{label: copy.menus.root, value: ''}]},
        {key: 'parent', label: copy.menus.parent, kind: 'text', editable: false},
        {key: 'path', label: copy.menus.path, kind: 'text', filterable: true, editable: true, required: true},
        {key: 'icon', label: copy.menus.icon, kind: 'icon', editable: true, required: true},
        {key: 'componentKey', label: copy.menus.component, kind: 'select', editable: true, options: [
          {label: copy.menus.directory, value: ''},
          {label: copy.menus.dashboard, value: 'dashboard'},
          {label: copy.users.title, value: 'users'},
          {label: copy.roles.title, value: 'roles'},
          {label: copy.departments.title, value: 'departments'},
          {label: copy.menus.organization, value: 'organization'},
          {label: copy.menus.title, value: 'menus'},
          {label: copy.menus.auditLogs, value: 'audit_logs'},
          {label: copy.menus.files, value: 'files'},
        ]},
        {key: 'status', label: copy.menus.status, kind: 'status', filterable: true, editable: true, options: statusOptions(copy.menus.enabled, copy.menus.disabled, 'enabled')},
        {key: 'visible', label: copy.menus.visible, kind: 'select', visible: false, editable: true, valueType: 'boolean', options: [
          {label: copy.menus.shown, value: 'true', status: 'success'},
          {label: copy.menus.hidden, value: 'false', status: 'neutral'},
        ]},
        {key: 'sortOrder', label: copy.menus.sort, kind: 'number', visible: false, editable: true, valueType: 'number'},
      ],
    },
  ];
}
