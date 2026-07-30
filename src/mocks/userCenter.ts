import type {UserCenterData, UserProfile} from '../types';

export type UserDetailSectionKey = 'personalDetails' | 'contactDetails' | 'organizationDetails';

export type UserDetailField = {
  label: string;
  source: keyof UserProfile;
};

export const userCenterDetailSchema: Record<UserDetailSectionKey, UserDetailField[]> = {
  personalDetails: [
    {label: 'Name', source: 'name'},
    {label: 'Account', source: 'account'},
    {label: 'Employee ID', source: 'employeeId'},
    {label: 'Status', source: 'status'},
    {label: 'Start date', source: 'joinedAt'},
    {label: 'Office location', source: 'location'},
  ],
  contactDetails: [
    {label: 'Phone', source: 'phone'},
    {label: 'Email', source: 'email'},
    {label: 'Enterprise WeChat', source: 'enterpriseWechat'},
    {label: 'Emergency contact', source: 'emergencyContact'},
  ],
  organizationDetails: [
    {label: 'Department', source: 'department'},
    {label: 'Job title', source: 'title'},
    {label: 'System role', source: 'role'},
    {label: 'Manager', source: 'manager'},
  ],
};

export const userCenterData: UserCenterData = {
  profile: {
    avatarUrl: '/astryx-team.png',
    name: 'System Administrator',
    title: 'Head of Platform Operations',
    department: 'Platform Operations',
    account: 'admin',
    employeeId: 'EMP-2026-001',
    role: 'Super Administrator',
    manager: 'Head of Platform',
    email: 'admin@example.com',
    phone: '155 7872 0001',
    enterpriseWechat: 'admin.ops',
    emergencyContact: 'Platform on-call team',
    location: 'Shanghai · Headquarters',
    joinedAt: '2024-03-18',
    status: 'Available'
  },
  statusOptions: [
    {label: 'Available', value: 'Available', color: 'green'},
    {label: 'Busy', value: 'Busy', color: 'orange'},
    {label: 'Offline', value: 'Offline', color: 'gray'},
  ],
  securitySettings: [
    {
      key: 'passwordLogin',
      label: 'Allow password sign-in',
      description: 'When disabled, only enterprise identity sign-in remains available.',
      value: true,
    },
    {
      key: 'twoFactorAuth',
      label: 'Two-factor authentication',
      description: 'Require an additional verification step for sensitive modules.',
      value: true,
    },
    {
      key: 'loginAlert',
      label: 'New location alerts',
      description: 'Send an email when a sign-in from a new location is detected.',
      value: true,
    },
  ],
  personalDetails: [
    {label: 'Name', value: 'System Administrator'},
    {label: 'Account', value: 'admin'},
    {label: 'Employee ID', value: 'EMP-2026-001'},
    {label: 'Status', value: 'Available'},
    {label: 'Start date', value: '2024-03-18'},
    {label: 'Office location', value: 'Shanghai · Headquarters'},
  ],
  contactDetails: [
    {label: 'Phone', value: '155 7872 0001'},
    {label: 'Email', value: 'admin@example.com'},
    {label: 'Enterprise WeChat', value: 'admin.ops'},
    {label: 'Emergency contact', value: 'Platform on-call team'},
  ],
  organizationDetails: [
    {label: 'Department', value: 'Platform Operations'},
    {label: 'Job title', value: 'Head of Platform Operations'},
    {label: 'System role', value: 'Super Administrator'},
    {label: 'Manager', value: 'Head of Platform'},
  ]
};
