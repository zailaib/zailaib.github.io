export interface Translations {
  common: {
    siteTitle: string;
    navigation: string;
    articles: string;
    readMore: string;
    backToHome: string;
    language: string;
    toggleNavigation: string;
    toggleMinimap: string;
  };
  minimap: {
    title: string;
    noHeadings: string;
    loading: string;
  };
  sidebar: {
    categories: string;
    allPosts: string;
  };
  home: {
    welcome: string;
    description: string;
    latestArticles: string;
  };
}

export const translations: Record<string, Translations> = {
  en: {
    common: {
      siteTitle: 'Astro Basics',
      navigation: 'Navigation',
      articles: 'Articles',
      readMore: 'Read More',
      backToHome: 'Back to Home',
      language: 'Language',
      toggleNavigation: 'Toggle Navigation',
      toggleMinimap: 'Toggle Navigation Map'
    },
    minimap: {
      title: 'Article Navigation',
      noHeadings: 'No chapter headings available',
      loading: 'Loading navigation...'
    },
    sidebar: {
      categories: 'Categories',
      allPosts: 'All Posts'
    },
    home: {
      welcome: 'Welcome to Astro Basics',
      description: 'A modern static site built with Astro framework',
      latestArticles: 'Latest Articles'
    }
  },
  zh: {
    common: {
      siteTitle: 'Astro 基础教程',
      navigation: '导航',
      articles: '文章',
      readMore: '阅读更多',
      backToHome: '返回首页',
      language: '语言',
      toggleNavigation: '切换导航',
      toggleMinimap: '切换导航地图'
    },
    minimap: {
      title: '文章导航',
      noHeadings: '本文暂无章节标题',
      loading: '正在加载导航...'
    },
    sidebar: {
      categories: '分类',
      allPosts: '所有文章'
    },
    home: {
      welcome: '欢迎来到 Astro 基础教程',
      description: '使用 Astro 框架构建的现代化静态网站',
      latestArticles: '最新文章'
    }
  }
};

export function getTranslation(lang: string): Translations {
  return translations[lang] || translations.zh;
}
