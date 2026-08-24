import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import {enUS} from './locales/en-US';
import {zhCN} from './locales/zh-CN';

export const LANGUAGE_STORAGE_KEY = 'kumo-demo-language';
const LEGACY_LANGUAGE_STORAGE_KEY = 'kumo-demo-locale';

export const languageRegistry = {
  'en-US': {label: 'English', shortLabel: 'EN', currency: 'USD', resource: enUS},
  'zh-CN': {label: '简体中文', shortLabel: '中', currency: 'CNY', resource: zhCN},
} as const;

export type AppLanguage = keyof typeof languageRegistry;

export const supportedLanguages = Object.keys(languageRegistry) as AppLanguage[];

export function resolveLanguage(value?: string | null): AppLanguage {
  if (value && value in languageRegistry) return value as AppLanguage;
  const base = value?.toLowerCase().split('-')[0];
  return supportedLanguages.find(language => language.toLowerCase().startsWith(`${base}-`)) ?? 'en-US';
}

const initialLanguage = resolveLanguage(
  typeof window === 'undefined'
    ? undefined
    : window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
      ?? ({en:'en-US', zh:'zh-CN'}[window.localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY) ?? ''] as string | undefined)
      ?? window.navigator.language,
);

void i18n.use(initReactI18next).init({
  lng: initialLanguage,
  fallbackLng: 'en-US',
  supportedLngs: supportedLanguages,
  ns: Object.keys(enUS),
  defaultNS: 'common',
  resources: Object.fromEntries(
    supportedLanguages.map(language => [language, languageRegistry[language].resource]),
  ),
  interpolation: {escapeValue: false},
  returnNull: false,
});

i18n.on('languageChanged', language => {
  const resolved = resolveLanguage(language);
  if (typeof window !== 'undefined') window.localStorage.setItem(LANGUAGE_STORAGE_KEY, resolved);
  if (typeof window !== 'undefined') window.localStorage.removeItem(LEGACY_LANGUAGE_STORAGE_KEY);
  if (typeof document !== 'undefined') document.documentElement.lang = resolved;
});

export function currentLanguage(): AppLanguage {
  return resolveLanguage(i18n.resolvedLanguage ?? i18n.language);
}

export function translationMap<K extends string>(keys: readonly K[], translate: (key: K) => string) {
  return Object.fromEntries(keys.map(key => [key, translate(key)])) as Record<K, string>;
}

export default i18n;
