import {appConfig} from '../mocks/appConfig';
import {mockAuthUsers} from '../mocks/auth';
import {dashboardData} from '../mocks/dashboard';
import {notifications} from '../mocks/notifications';
import {resourceRecords, resourceSchemas} from '../mocks/resources';
import {userCenterData, userCenterDetailSchema} from '../mocks/userCenter';
import type {
  AdminRecord,
  AppConfig,
  AppNotification,
  AuthSession,
  AuthUser,
  DashboardData,
  MockPage,
  MockQuery,
  ResourceSchema,
  SecuritySetting,
  UserCenterData,
  UserProfile,
  UserProfileDetail,
} from '../types';

const store: Record<string, AdminRecord[]> = structuredClone(resourceRecords);
const SESSION_STORAGE_KEY = 'astryx-demo-session';
const AUTH_USERS_STORAGE_KEY = 'astryx-demo-auth-users';
const authStore: AuthUser[] = readAuthUsers();
let notificationStore: AppNotification[] = structuredClone(notifications);
let userCenterStore: UserCenterData = structuredClone(userCenterData);

function delay<T>(value: T, ms = 180): Promise<T> {
  return new Promise(resolve => window.setTimeout(() => resolve(value), ms));
}

function asText(value: unknown): string {
  if (Array.isArray(value)) return value.join(' ');
  if (value === null || value === undefined) return '';
  return String(value);
}

function normalize(value: unknown): string {
  return asText(value).toLowerCase();
}

function readSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

function writeSession(session: AuthSession) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

function readAuthUsers(): AuthUser[] {
  if (typeof window === 'undefined') return structuredClone(mockAuthUsers);
  const raw = window.localStorage.getItem(AUTH_USERS_STORAGE_KEY);
  if (!raw) return structuredClone(mockAuthUsers);
  try {
    const stored = JSON.parse(raw) as AuthUser[];
    const usersByEmail = new Map<string, AuthUser>();
    for (const user of mockAuthUsers) usersByEmail.set(user.email, user);
    for (const user of stored) usersByEmail.set(user.email, user);
    return [...usersByEmail.values()];
  } catch {
    window.localStorage.removeItem(AUTH_USERS_STORAGE_KEY);
    return structuredClone(mockAuthUsers);
  }
}

function writeAuthUsers() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(authStore));
}

function createSession(user: AuthUser): AuthSession {
  return {
    token: `mock-token-${user.email}-${Date.now()}`,
    user: {
      name: user.name,
      email: user.email,
    },
  };
}

function staticDetailValue(label: string, previous: UserCenterData) {
  const item = [
    ...previous.personalDetails,
    ...previous.contactDetails,
    ...previous.organizationDetails,
  ].find(detail => detail.label === label);
  return item?.value ?? '';
}

function detailsFromProfile(profile: UserProfile, previous: UserCenterData) {
  const build = (section: keyof typeof userCenterDetailSchema): UserProfileDetail[] => (
    userCenterDetailSchema[section].map(field => {
      if (field.source === 'enterpriseWechat' || field.source === 'emergencyContact') {
        return {label: field.label, value: staticDetailValue(field.label, previous)};
      }
      return {label: field.label, value: String(profile[field.source] ?? '')};
    })
  );

  return {
    personalDetails: build('personalDetails'),
    contactDetails: build('contactDetails'),
    organizationDetails: build('organizationDetails'),
  };
}

function profileFromAuthUser(user: AuthUser, previous: UserCenterData): UserProfile {
  const account = user.email.split('@')[0] || user.name;
  return {
    ...previous.profile,
    name: user.name,
    account,
    email: user.email,
    status: '在线值守',
  };
}

function applyProfile(profile: UserProfile) {
  userCenterStore = {
    ...userCenterStore,
    profile,
    ...detailsFromProfile(profile, userCenterStore),
  };
}

function hydrateUserCenterFromSession(session: AuthSession | null) {
  if (!session) return null;
  const user = authStore.find(item => item.email === session.user.email) ?? {
    ...session.user,
    password: '',
  };
  applyProfile(profileFromAuthUser(user, userCenterStore));
  return session;
}

function combineUserCenter(): UserCenterData {
  return {
    profile: userCenterStore.profile,
    statusOptions: userCenterStore.statusOptions,
    securitySettings: userCenterStore.securitySettings,
    personalDetails: userCenterStore.personalDetails,
    contactDetails: userCenterStore.contactDetails,
    organizationDetails: userCenterStore.organizationDetails,
  };
}

export const mockApi = {
  async getAppConfig(): Promise<AppConfig> {
    return delay(structuredClone(appConfig), 80);
  },

  async getAuthUsers(): Promise<AuthUser[]> {
    return delay(structuredClone(authStore), 80);
  },

  async getSession(): Promise<AuthSession | null> {
    return delay(hydrateUserCenterFromSession(readSession()), 80);
  },

  async login(email: string, password: string): Promise<AuthSession> {
    const user = authStore.find(item => item.email === email && item.password === password);
    if (!user) {
      throw new Error('账号或密码不正确。');
    }
    const session = createSession(user);
    writeSession(session);
    applyProfile(profileFromAuthUser(user, userCenterStore));
    return delay(structuredClone(session), 80);
  },

  async registerAuthUser(user: AuthUser): Promise<AuthSession> {
    if (authStore.some(item => item.email === user.email)) {
      throw new Error('该邮箱已存在。');
    }
    authStore.push(user);
    writeAuthUsers();
    const profile = profileFromAuthUser(user, userCenterStore);
    applyProfile(profile);
    const session = createSession(user);
    writeSession(session);
    return delay(structuredClone(session), 80);
  },

  async logout(): Promise<void> {
    clearSession();
    return delay(undefined, 80);
  },

  async getNotifications(): Promise<AppNotification[]> {
    return delay(structuredClone(notificationStore), 80);
  },

  async markNotificationRead(id: string): Promise<AppNotification[]> {
    notificationStore = notificationStore.map(item => (
      item.id === id ? {...item, isRead: true} : item
    ));
    return delay(structuredClone(notificationStore), 80);
  },

  async markAllNotificationsRead(): Promise<AppNotification[]> {
    notificationStore = notificationStore.map(item => ({...item, isRead: true}));
    return delay(structuredClone(notificationStore), 80);
  },

  async getDashboard(): Promise<DashboardData> {
    return delay(structuredClone(dashboardData));
  },

  async getUserProfile(): Promise<UserProfile> {
    return delay(structuredClone(userCenterStore.profile));
  },

  async getUserStatusOptions(): Promise<UserCenterData['statusOptions']> {
    return delay(structuredClone(userCenterStore.statusOptions), 80);
  },

  async getUserProfileDetails(): Promise<Pick<UserCenterData, 'personalDetails' | 'contactDetails' | 'organizationDetails'>> {
    return delay(structuredClone({
      personalDetails: userCenterStore.personalDetails,
      contactDetails: userCenterStore.contactDetails,
      organizationDetails: userCenterStore.organizationDetails,
    }));
  },

  async getSecuritySettings(): Promise<SecuritySetting[]> {
    return delay(structuredClone(userCenterStore.securitySettings), 80);
  },

  async getUserCenter(): Promise<UserCenterData> {
    return delay(structuredClone(combineUserCenter()));
  },

  async updateUserProfile(profile: UserProfile): Promise<UserProfile> {
    applyProfile(profile);
    return delay(structuredClone(userCenterStore.profile));
  },

  async updateSecuritySettings(settings: SecuritySetting[]): Promise<SecuritySetting[]> {
    userCenterStore = {
      ...userCenterStore,
      securitySettings: structuredClone(settings),
    };
    return delay(structuredClone(userCenterStore.securitySettings), 80);
  },

  async getSchemas(): Promise<ResourceSchema[]> {
    return delay(structuredClone(resourceSchemas), 80);
  },

  async list(resourceId: string, query: MockQuery): Promise<MockPage<AdminRecord>> {
    const rows = [...(store[resourceId] ?? [])];
    const filters = Object.entries(query.filters ?? {})
      .map(([key, value]) => [key, normalize(value)] as const)
      .filter(([, value]) => value.length > 0);

    const filtered = rows.filter(row => {
      return filters.every(([key, value]) => normalize(row[key]).includes(value));
    });

    if (query.sortKey) {
      filtered.sort((a, b) => {
        const left = asText(a[query.sortKey!]);
        const right = asText(b[query.sortKey!]);
        return query.sortDirection === 'desc'
          ? right.localeCompare(left, 'zh-CN', {numeric: true})
          : left.localeCompare(right, 'zh-CN', {numeric: true});
      });
    }

    const start = (query.page - 1) * query.pageSize;
    return delay({
      items: structuredClone(filtered.slice(start, start + query.pageSize)),
      total: filtered.length,
      page: query.page,
      pageSize: query.pageSize,
    });
  },

  async create(resourceId: string, record: Omit<AdminRecord, 'id'>): Promise<AdminRecord> {
    const next: AdminRecord = {
      id: `${resourceId}-${Date.now()}`,
      ...record,
    };
    store[resourceId] = [next, ...(store[resourceId] ?? [])];
    return delay(structuredClone(next));
  },

  async update(resourceId: string, id: string, patch: Partial<AdminRecord>): Promise<AdminRecord> {
    const rows = store[resourceId] ?? [];
    const index = rows.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error(`Record ${id} was not found.`);
    }
    rows[index] = {...rows[index], ...patch};
    return delay(structuredClone(rows[index]));
  },

  async remove(resourceId: string, id: string): Promise<void> {
    store[resourceId] = (store[resourceId] ?? []).filter(item => item.id !== id);
    return delay(undefined);
  },
};
