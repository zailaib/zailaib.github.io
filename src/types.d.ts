// i18n 的 Translation 类型以 translations.ts 的 Translations 为单一来源，此处不再重复定义。

export interface BaseLayoutProps {
  title?: string;
  description?: string;
  showSidebar?: boolean;
  showMinimap?: boolean;
  currentSlug?: string;
  isPost?: boolean;
}

export interface MinimapProps {
  currentSlug?: string;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
}
