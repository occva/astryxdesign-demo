import type {Locale} from '../localization';
import type {UserCenterData, UserProfile} from '../types';
import {createMockText} from './localized';

export type UserDetailSectionKey = 'personalDetails' | 'contactDetails' | 'organizationDetails';

export type UserDetailField = {
  label: string;
  source: keyof UserProfile | 'enterpriseWechat' | 'emergencyContact';
};

export function createUserCenterDetailSchema(locale: Locale): Record<UserDetailSectionKey, UserDetailField[]> {
  const t = createMockText(locale);
  return {
    personalDetails: [
      {label: t('Name', '姓名'), source: 'name'},
      {label: t('Account', '登录账号'), source: 'account'},
      {label: t('Employee ID', '员工编号'), source: 'employeeId'},
      {label: t('Status', '当前状态'), source: 'status'},
      {label: t('Start date', '入职日期'), source: 'joinedAt'},
      {label: t('Office location', '办公地点'), source: 'location'},
    ],
    contactDetails: [
      {label: t('Phone', '手机号'), source: 'phone'},
      {label: t('Email', '邮箱'), source: 'email'},
      {label: t('Enterprise WeChat', '企业微信'), source: 'enterpriseWechat'},
      {label: t('Emergency contact', '紧急联系人'), source: 'emergencyContact'},
    ],
    organizationDetails: [
      {label: t('Department', '所属部门'), source: 'department'},
      {label: t('Job title', '岗位'), source: 'title'},
      {label: t('System role', '系统角色'), source: 'role'},
      {label: t('Manager', '直属上级'), source: 'manager'},
    ],
  };
}

export function createUserCenterData(locale: Locale): UserCenterData {
  const t = createMockText(locale);
  const profile: UserProfile = {
    name: t('System Administrator', '系统管理员'),
    title: t('Head of Platform Operations', '平台运营负责人'),
    department: t('Platform Operations', '平台管理部'),
    account: 'admin',
    employeeId: 'EMP-2026-001',
    role: t('Super Administrator', '超级管理员'),
    manager: t('Head of Platform', '平台负责人'),
    email: 'admin@example.com',
    phone: '155 7872 0001',
    location: t('Shanghai · Headquarters', '上海 · 总部'),
    joinedAt: '2024-03-18',
    status: t('Available', '在线值守'),
  };

  return {
    profile,
    statusOptions: [
      {label: t('Available', '在线值守'), value: t('Available', '在线值守'), color: 'green'},
      {label: t('Busy', '忙碌处理中'), value: t('Busy', '忙碌处理中'), color: 'orange'},
      {label: t('Offline', '离线待命'), value: t('Offline', '离线待命'), color: 'gray'},
    ],
    securitySettings: [
      {key: 'passwordLogin', label: t('Allow password sign-in', '允许密码登录'), description: t('When disabled, only enterprise identity sign-in remains available.', '关闭后仅保留企业身份认证入口。'), value: true},
      {key: 'twoFactorAuth', label: t('Two-factor authentication', '双重验证'), description: t('Require an additional verification step for sensitive modules.', '登录敏感模块时需要二次确认。'), value: true},
      {key: 'loginAlert', label: t('New location alerts', '异地登录提醒'), description: t('Send an email when a sign-in from a new location is detected.', '检测到新地点登录时发送邮件提醒。'), value: true},
    ],
    personalDetails: [
      {label: t('Name', '姓名'), value: profile.name},
      {label: t('Account', '登录账号'), value: profile.account},
      {label: t('Employee ID', '员工编号'), value: profile.employeeId},
      {label: t('Status', '当前状态'), value: profile.status},
      {label: t('Start date', '入职日期'), value: profile.joinedAt},
      {label: t('Office location', '办公地点'), value: profile.location},
    ],
    contactDetails: [
      {label: t('Phone', '手机号'), value: profile.phone},
      {label: t('Email', '邮箱'), value: profile.email},
      {label: t('Enterprise WeChat', '企业微信'), value: 'admin.ops'},
      {label: t('Emergency contact', '紧急联系人'), value: t('Platform on-call team', '平台值班组')},
    ],
    organizationDetails: [
      {label: t('Department', '所属部门'), value: profile.department},
      {label: t('Job title', '岗位'), value: profile.title},
      {label: t('System role', '系统角色'), value: profile.role},
      {label: t('Manager', '直属上级'), value: profile.manager},
    ],
  };
}
