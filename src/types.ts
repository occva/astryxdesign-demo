export type PageId = 'dashboard' | string;

export type IconKey =
  | 'dashboard'
  | 'users'
  | 'roles'
  | 'departments'
  | 'club'
  | 'settings'
  | 'profile'

export type ModuleKind = 'dashboard' | 'resource' | 'custom' | 'group';

export type FieldKind =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'currency'
  | 'date'
  | 'select'
  | 'status'
  | 'tags'
  | 'progress';

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

export type AccountMenuAction = {
  id: 'settings' | 'theme' | 'notifications' | 'logout';
  label: string;
};

export type AppProfile = {
  name: string;
  operator: string;
  department: string;
  email: string;
};

export type AppConfig = {
  profile: AppProfile;
  accountMenuActions: AccountMenuAction[];
  modules: AppModule[];
};

export type AuthUser = {
  name: string;
  email: string;
  password: string;
};

export type AuthSession = {
  token: string;
  user: Omit<AuthUser, 'password'>;
};

export type AppNotification = {
  id: string;
  title: string;
  description: string;
  time: string;
  status: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
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

export type MockQuery = {
  page: number;
  pageSize: number;
  filters?: Record<string, string>;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
};

export type MockPage<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type DashboardMetric = {
  label: string;
  value: string;
  delta: string;
  tone: 'positive' | 'negative' | 'neutral';
};

export type DashboardActivity = {
  id: string;
  title: string;
  description: string;
  time: string;
  status: StatusTone;
};

export type DashboardData = {
  metrics: DashboardMetric[];
  trend: Array<{label: string; value: number; target: number}>;
  modules: Array<{label: string; value: number; capacity: number; color: SelectOption['color']}>;
  activities: DashboardActivity[];
};

export type UserCenterData = {
  profile: UserProfile;
  statusOptions: SelectOption[];
  securitySettings: SecuritySetting[];
  personalDetails: UserProfileDetail[];
  contactDetails: UserProfileDetail[];
  organizationDetails: UserProfileDetail[];
};

export type UserProfile = {
  name: string;
  title: string;
  department: string;
  account: string;
  employeeId: string;
  role: string;
  manager: string;
  email: string;
  phone: string;
  location: string;
  joinedAt: string;
  status: string;
};

export type SecuritySetting = {
  key: 'passwordLogin' | 'twoFactorAuth' | 'loginAlert';
  label: string;
  description: string;
  value: boolean;
};

export type UserProfileDetail = {
  label: string;
  value: string;
};
