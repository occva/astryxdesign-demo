import type {Locale} from '../localization';
import type {AuthUser} from '../types';
import {createMockText} from './localized';

export function createMockAuthUsers(locale: Locale): AuthUser[] {
  const t = createMockText(locale);
  return [{
    name: t('System Administrator', '系统管理员'),
    email: 'admin@example.com',
    password: 'admin123',
  }];
}
