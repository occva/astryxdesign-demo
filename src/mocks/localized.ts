import type {Locale} from '../localization';

export function createMockText(locale: Locale) {
  return (english: string, chinese: string) => locale === 'zh' ? chinese : english;
}
