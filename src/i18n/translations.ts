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
    title: string;
    categories: string;
    allPosts: string;
    showMore: string;
    showLess: string;
  };
  home: {
    welcome: string;
    description: string;
    latestArticles: string;
    apps: string;
    viewAllApps: string;
  };
}

export const translations: Record<string, Translations> = {
  en: {
    common: {
      siteTitle: 'Calendar Stories',
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
      title: 'Content Navigation',
      categories: 'Categories',
      allPosts: 'All Posts',
      showMore: 'Show More',
      showLess: 'Show Less'
    },
    home: {
      welcome: 'Stories of Time',
      description: 'Mark every moment in life with a calendar',
      latestArticles: 'Latest Articles',
      apps: 'Mini Games & Apps',
      viewAllApps: 'View All'
    }
  },
  zh: {
    common: {
      siteTitle: '日历故事',
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
      title: '内容导航',
      categories: '分类',
      allPosts: '所有文章',
      showMore: '显示更多',
      showLess: '收起'
    },
    home: {
      welcome: '时间的故事',
      description: '用日历标记生活中的每一个重要节点',
      latestArticles: '最新文章',
      apps: '小游戏 & 应用',
      viewAllApps: '查看全部'
    }
  }
};

export function getTranslation(lang: string): Translations {
  return translations[lang] || translations.zh;
}
