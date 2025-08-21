declare module '*.json' {
  const value: any;
  export default value;
}

// 统一文章接口定义
export interface Post {
  title: string;
  slug: string;
  date: string;
  tags?: string | string[];
  category?: string;
}

export interface SidebarPost extends Post {
  // 侧边栏特定的扩展属性
}

export interface PostsByCategory {
  [category: string]: Post[];
}

// 布局组件 Props
export interface BaseLayoutProps {
  title?: string;
  description?: string;
  showSidebar?: boolean;
  showMinimap?: boolean;
  sidebarData?: PostsByCategory;
  currentSlug?: string;
  isPost?: boolean;
}

export interface SidebarProps {
  postsByCategory: PostsByCategory;
}

export interface MinimapProps {
  currentSlug?: string;
}

// 文章列表组件 Props
export interface ArticleListProps {
  articles: Post[];
  mode?: 'list' | 'sidebar' | 'card';
  groupByCategory?: boolean;
  showTags?: boolean;
  showDate?: boolean;
}

export interface PostListProps {
  posts: Post[];
}

export interface HomeProps {
  posts: Post[];
}

// 内容配置
export interface ContentConfig {
  collections: {
    posts: {
      schema: any;
    };
  };
}

// i18n 类型定义
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
}

export interface Translation {
  common: {
    siteTitle: string;
  };
  toggleNavigation: string;
  toggleMinimap: string;
  minimap: {
    title: string;
    loading: string;
    noHeadings: string;
  };
}

// 移动端交互配置
export interface MobileInteractionConfig {
  touchThreshold: number;
  swipeThreshold: number;
}

// 组件事件类型
export interface ComponentEvents {
  onLanguageChange?: (langCode: string) => void;
  onNavigationToggle?: (isOpen: boolean) => void;
}
