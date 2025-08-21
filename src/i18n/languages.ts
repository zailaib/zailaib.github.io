export interface Language {
  code: string;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    dir: 'ltr'
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    dir: 'ltr'
  }
];

export const DEFAULT_LANGUAGE = 'zh';

export function getLanguageByCode(code: string): Language {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code) || 
         SUPPORTED_LANGUAGES.find(lang => lang.code === DEFAULT_LANGUAGE)!;
}
