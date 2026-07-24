// 全局变量存储当前的 observer
let currentObserver = null;

// 动态生成Minimap导航的核心函数
function initializeMinimap() {
  const minimapContainer = document.getElementById('minimap-links');
  if (!minimapContainer) return;

  console.log('Initializing minimap...');

  // 清理之前的 observer
  if (currentObserver) {
    currentObserver.disconnect();
    currentObserver = null;
  }

  // 等待内容加载完成
  setTimeout(() => {
    // 获取主内容区域中的所有标题，使用更广泛的选择器
    const contentSelectors = [
      'article h1, article h2, article h3, article h4, article h5, article h6',
      '.post-content h1, .post-content h2, .post-content h3, .post-content h4, .post-content h5, .post-content h6',
      '.content-wrapper h1, .content-wrapper h2, .content-wrapper h3, .content-wrapper h4, .content-wrapper h5, .content-wrapper h6',
      'main h1, main h2, main h3, main h4, main h5, main h6',
      '#post-content h1, #post-content h2, #post-content h3, #post-content h4, #post-content h5, #post-content h6'
    ];

    let headings = [];

    // 尝试不同的选择器，找到标题
    for (const selector of contentSelectors) {
      headings = document.querySelectorAll(selector);
      if (headings.length > 0) {
        console.log(`Found ${headings.length} headings with selector: ${selector}`);
        break;
      }
    }

    if (headings.length === 0) {
      minimapContainer.innerHTML = `<p class="minimap-placeholder">${window.minimapConfig?.translations?.noHeadings || 'No headings found'}</p>`;
      return;
    }
  
    // 清空占位符
    minimapContainer.innerHTML = '';

    // 创建导航链接
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.substring(1));
      const text = heading.textContent?.trim() || `Heading ${index + 1}`;

      // 生成更好的ID（保留 Unicode 字母，避免中文标题被删光）
      let id = heading.id;
      if (!id) {
        // 取文本前20个有意义的字符生成ID
        const base = text
          .replace(/[^\p{L}\p{N}\s-]/gu, '') // 保留字母数字空格连字符（含中文）
          .replace(/\s+/g, '-')
          .replace(/--+/g, '-')
          .replace(/^-+|-+$/g, '') // trim hyphens
          .slice(0, 48);
        id = base || `section-${index}`;

        // 确保ID唯一
        let uniqueId = id;
        let counter = 1;
        while (document.getElementById(uniqueId)) {
          uniqueId = `${id}-${counter}`;
          counter++;
        }
        heading.id = uniqueId;
        id = uniqueId;
      }

      const link = document.createElement('a');
      link.href = `#${id}`;
      link.textContent = text;
      link.className = `minimap-link level-${level}`;
      link.dataset.headingId = id;

      // 添加点击事件，确保平滑滚动并避免被 header 覆盖
      link.addEventListener('click', (e) => {
        e.preventDefault();
        try {
          const target = document.getElementById(id);
          if (!target) return;
          const header = document.querySelector('header') || document.querySelector('.header-content');
          const headerHeight = header ? header.offsetHeight : 0;
          const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
          window.scrollTo({
            top: Math.max(0, targetPosition),
            behavior: 'smooth'
          });
          history.pushState(null, '', `#${id}`);
        } catch (err) {
          console.warn('Minimap scroll error:', err);
        }
      });

      minimapContainer.appendChild(link);
    });

    // 设置IntersectionObserver来高亮当前标题
    // 考虑 header 高度，调整 rootMargin
    const header = document.querySelector('header') || document.querySelector('.header-content');
    const headerHeight = header ? header.offsetHeight : 80; // 默认 80px
    const topMargin = `${headerHeight + 20}px`; // header 高度 + 20px 缓冲

    const observerOptions = {
      rootMargin: `-${topMargin} 0px -60% 0px`,
      threshold: 0.1
    };

    currentObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target.id;
        const link = document.querySelector(`.minimap-link[data-heading-id="${id}"]`);

        if (entry.isIntersecting) {
          // 移除其他活动状态
          document.querySelectorAll('.minimap-link.active').forEach(activeLink => {
            activeLink.classList.remove('active');
          });
          // 添加当前活动状态
          link?.classList.add('active');
        }
      });
    }, observerOptions);

    // 观察所有标题
    headings.forEach(heading => {
      currentObserver.observe(heading);
    });

  }, 100); // 延迟100ms确保内容已渲染
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', initializeMinimap);

// 监听 Astro 的页面切换事件（View Transitions）
document.addEventListener('astro:page-load', () => {
  console.log('Astro page loaded, reinitializing minimap...');
  initializeMinimap();
});

// 备用方案：监听 popstate 事件（浏览器前进后退）
window.addEventListener('popstate', () => {
  console.log('Popstate event, reinitializing minimap...');
  setTimeout(initializeMinimap, 200);
});

// 备用方案：监听 hashchange 事件
window.addEventListener('hashchange', () => {
  console.log('Hash changed, checking minimap...');
  setTimeout(initializeMinimap, 100);
});
