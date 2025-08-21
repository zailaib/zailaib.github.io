import { getLanguageByCode, DEFAULT_LANGUAGE } from './languages';
import { getTranslation } from './translations';
import type { Language } from '../types';

export { getTranslation };

/**
 * 从URL路径中获取当前语言代码
 * @param pathname - 当前页面的路径
 * @returns 语言代码 ('zh' | 'en')
 */
export function getCurrentLanguage(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0) {
    const firstSegment = segments[0];
    if (['en', 'zh'].includes(firstSegment)) {
      return firstSegment;
    }
  }
  return DEFAULT_LANGUAGE;
}

/**
 * 获取本地化路径（根据目标语言生成正确的URL路径）
 * @param pathname - 当前路径
 * @param targetLang - 目标语言代码
 * @returns 本地化后的路径
 */
export function getLocalizedPath(pathname: string, targetLang: string): string {
  const currentLang = getCurrentLanguage(pathname);

  // 处理文章路径的特殊情况
  if (pathname.includes('/posts/')) {
    // 如果是语言特定的文章路径 (如 /en/posts/... 或 /zh/posts/...)
    if (pathname.startsWith(`/${currentLang}/posts/`)) {
      const pathAfterPosts = pathname.replace(`/${currentLang}/posts/`, '');
      return `/${targetLang}/posts/${pathAfterPosts}`;
    }
    // 如果是默认的文章路径 (如 /posts/...)
    else if (pathname.startsWith('/posts/')) {
      const pathAfterPosts = pathname.replace('/posts/', '');
      return `/${targetLang}/posts/${pathAfterPosts}`;
    }
  }

  // 处理普通页面路径
  const pathWithoutLang = pathname.replace(new RegExp(`^/${currentLang}`), '');

  if (targetLang === DEFAULT_LANGUAGE) {
    return pathWithoutLang || '/';
  }

  return `/${targetLang}${pathWithoutLang}`;
}

/**
 * 创建语言切换器配置
 * @param currentPath - 当前页面路径
 * @returns 语言切换器配置对象
 */
export function createLanguageSwitcher(currentPath: string) {
  const currentLang = getCurrentLanguage(currentPath);
  const languages = getLanguageByCode(currentLang);
  
  return {
    current: languages,
    available: ['en', 'zh'].filter(lang => lang !== currentLang).map(getLanguageByCode),
    getPath: (langCode: string) => getLocalizedPath(currentPath, langCode)
  };
}

/**
 * 翻译函数 - 根据语言和键获取翻译文本
 * @param lang - 语言代码
 * @param key - 翻译键（支持点符号，如 'common.siteTitle'）
 * @returns 翻译后的文本，如果找不到则返回键本身
 */
export function t(lang: string, key: string): string {
  const keys = key.split('.');
  let value: any = getTranslation(lang);
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // 返回key本身作为fallback
    }
  }
  
  return typeof value === 'string' ? value : key;
}
