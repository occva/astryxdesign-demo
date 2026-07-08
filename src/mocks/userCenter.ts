import type {UserCenterData, UserProfile} from '../types';

export type UserDetailSectionKey = 'personalDetails' | 'contactDetails' | 'organizationDetails';

export type UserDetailField = {
  label: string;
  source: keyof UserProfile | 'enterpriseWechat' | 'emergencyContact';
};

export const userCenterDetailSchema: Record<UserDetailSectionKey, UserDetailField[]> = {
  personalDetails: [
    {label: '姓名', source: 'name'},
    {label: '登录账号', source: 'account'},
    {label: '员工编号', source: 'employeeId'},
    {label: '当前状态', source: 'status'},
    {label: '入职日期', source: 'joinedAt'},
    {label: '办公地点', source: 'location'},
  ],
  contactDetails: [
    {label: '手机号', source: 'phone'},
    {label: '邮箱', source: 'email'},
    {label: '企业微信', source: 'enterpriseWechat'},
    {label: '紧急联系人', source: 'emergencyContact'},
  ],
  organizationDetails: [
    {label: '所属部门', source: 'department'},
    {label: '岗位', source: 'title'},
    {label: '系统角色', source: 'role'},
    {label: '直属上级', source: 'manager'},
  ],
};

export const userCenterData: UserCenterData = {
  profile: {
    name: '系统管理员',
    title: '平台运营负责人',
    department: '平台管理部',
    account: 'admin',
    employeeId: 'EMP-2026-001',
    role: '超级管理员',
    manager: '平台负责人',
    email: 'admin@example.com',
    phone: '155 7872 0001',
    location: '上海 · 总部',
    joinedAt: '2024-03-18',
    status: '在线值守'
  },
  statusOptions: [
    {label: '在线值守', value: '在线值守', color: 'green'},
    {label: '忙碌处理中', value: '忙碌处理中', color: 'orange'},
    {label: '离线待命', value: '离线待命', color: 'gray'},
  ],
  securitySettings: [
    {
      key: 'passwordLogin',
      label: '允许密码登录',
      description: '关闭后仅保留企业身份认证入口。',
      value: true,
    },
    {
      key: 'twoFactorAuth',
      label: '双重验证',
      description: '登录敏感模块时需要二次确认。',
      value: true,
    },
    {
      key: 'loginAlert',
      label: '异地登录提醒',
      description: '检测到新地点登录时发送邮件提醒。',
      value: true,
    },
  ],
  personalDetails: [
    {label: '姓名', value: '系统管理员'},
    {label: '登录账号', value: 'admin'},
    {label: '员工编号', value: 'EMP-2026-001'},
    {label: '当前状态', value: '在线值守'},
    {label: '入职日期', value: '2024-03-18'},
    {label: '办公地点', value: '上海 · 总部'},
  ],
  contactDetails: [
    {label: '手机号', value: '155 7872 0001'},
    {label: '邮箱', value: 'admin@example.com'},  
    {label: '企业微信', value: 'admin.ops'},
    {label: '紧急联系人', value: '平台值班组'},
  ],
  organizationDetails: [
    {label: '所属部门', value: '平台管理部'},
    {label: '岗位', value: '平台运营负责人'},
    {label: '系统角色', value: '超级管理员'},
    {label: '直属上级', value: '平台负责人'},
  ]
};
