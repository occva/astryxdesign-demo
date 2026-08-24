export type PageId = 'dashboard' | string;

export type IconKey = string;

export type ModuleKind = 'dashboard' | 'resource' | 'custom' | 'group';

export type FieldKind =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'currency'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'icon'
  | 'status'
  | 'tags'
  | 'progress'
  | 'file';

export type SelectOption = {
  label: string;
  value: string;
  color?: 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'cyan' | 'blue' | 'purple' | 'pink' | 'gray';
  status?: StatusTone;
};

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'error' | 'accent';

export type ResourceField = {
  key: string;
  label: string;
  kind: FieldKind;
  width?: 'fluid';
  filterable?: boolean;
  visible?: boolean;
  editable?: boolean;
  required?: boolean;
  options?: SelectOption[];
  valueType?: 'string' | 'number' | 'boolean';
};

export type AppModule = {
  id: PageId;
  title: string;
  kind: ModuleKind;
  icon: IconKey;
  group: string;
  resource?: string;
  children?: AppModule[];
};

export type AuthMenu = {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  path: string;
  icon: string;
  componentKey: string;
  sortOrder: number;
  i18nKey: string;
};

export type AuthSession = {
  token: string;
  refreshToken: string;
  expiresAt: number;
  user: {
    id: string;
    authUserId: string;
    name: string;
    email: string;
    account: string;
    phone: string;
    employeeNo: string;
    jobTitle: string;
    managerName: string;
    enterpriseWechat: string;
    emergencyContact: string;
    officeLocation: string;
    joinedAt: string;
    avatarUrl: string;
    gender: string;
    status: string;
    department: string;
    departmentOwner: string;
    roleName: string;
    roleCode: string;
    roleIds: string[];
    roleNames: string[];
    roleCodes: string[];
    hasSystemRole: boolean;
    permissionCodes: string[];
    tags: string[];
    lastLoginAt: string;
    createdAt: string;
    menuPaths: string[];
    menuKeys: string[];
    menus: AuthMenu[];
  };
};

export type AppNotification = {
  id: string;
  title: string;
  description: string;
  occurredAt: string;
  status: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  i18nKey: string;
};

export type ResourceSchema = {
  id: string;
  title: string;
  primaryField: string;
  statusField?: string;
  filterFields: string[];
  fields: ResourceField[];
};

export interface AdminRecord extends Record<string, unknown> {
  id: string;
}

export type ResourceQuery = {
  page: number;
  pageSize: number;
  filters?: Record<string, string>;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
};

export type ResourcePage<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type AuditLog = {
  id:string; occurredAt:string; actorUserId:string|null; actorName:string; actorAccount:string;
  action:string; resourceType:string; resourceId:string|null; requestMethod:string; requestPath:string;
  requestId:string; status:'succeeded'|'failed'; statusCode:number; changes:unknown;
  ipAddress:string|null; userAgent:string|null; errorCode:string|null;
};

export type ManagedFile = {
  id:string; originalName:string; mimeType:string; sizeBytes:number; status:string; uploadedBy:string;
  createdAt:string; metadata:Record<string,unknown>; links:Array<{id:string;resource_type:string;resource_id:string;field_key:string;sort_order:number}>;
};

export type DepartmentNode = {
  id:string; name:string; code:string; parentId:string|null; parent:string; ownerUserId:string|null;
  owner:string; status:string; sortOrder:number; members:number; description:string; createdAt:string;
  updatedAt:string; totalMembers:number; people:DepartmentMember[]; children:DepartmentNode[];
};

export type DepartmentMember = {
  id:string; name:string; account:string; employeeNo:string; jobTitle:string; managerName:string;
  avatarUrl:string|null; status:'normal'|'disabled';
};

export type DepartmentImportPreview = {
  total:number; created:number; updated:number;
  rows:Array<{line:number;code:string;name:string;parentCode:string;ownerAccount:string;status:string;sortOrder:number;description:string}>;
  errors:Array<{line:number;field:string;message:string}>;
};

export type DashboardMetric = {
  label: string;
  value: string;
  delta: string;
  tone: 'positive' | 'negative' | 'neutral';
  i18nKey: string;
};

export type DashboardActivity = {
  id: string;
  title: string;
  description: string;
  occurredAt: string;
  status: StatusTone;
  i18nKey: string;
};

export type DashboardData = {
  metrics: DashboardMetric[];
  trend: Array<{label: string; value: number; target: number; i18nKey: string}>;
  modules: Array<{label: string; value: number; capacity: number; color: SelectOption['color']; i18nKey: string}>;
  activities: DashboardActivity[];
};
