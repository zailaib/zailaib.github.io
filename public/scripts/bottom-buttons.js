// 底部固定按钮功能
function initializeBottomButtons() {
  const homeBtn = document.getElementById('home-btn');
  const topBtn = document.getElementById('top-btn');

  if (!homeBtn || !topBtn) {
    // 如果按钮不存在，稍后重试
    setTimeout(initializeBottomButtons, 100);
    return;
  }

  // 移除之前的事件监听器，避免重复绑定
  const newHomeBtn = homeBtn.cloneNode(true);
  const newTopBtn = topBtn.cloneNode(true);
  homeBtn.parentNode?.replaceChild(newHomeBtn, homeBtn);
  topBtn.parentNode?.replaceChild(newTopBtn, topBtn);

  // Home 按钮功能
  newHomeBtn.addEventListener('click', () => {
    // 获取当前语言
    const currentPath = window.location.pathname;
    const isEnglish = currentPath.startsWith('/en');

    // 跳转到对应语言的首页
    const homeUrl = isEnglish ? '/en/' : '/';
    window.location.href = homeUrl;
  });

  // Top 按钮功能
  newTopBtn.addEventListener('click', () => {
    // 平滑滚动到顶部
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
  
  // 根据滚动位置显示/隐藏 Top 按钮
  function updateTopButtonVisibility() {
    const currentTopBtn = document.getElementById('top-btn');
    if (!currentTopBtn) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const shouldShow = scrollTop > 300; // 滚动超过300px时显示

    if (shouldShow) {
      currentTopBtn.style.opacity = '1';
      currentTopBtn.style.pointerEvents = 'auto';
    } else {
      currentTopBtn.style.opacity = '0.6';
      currentTopBtn.style.pointerEvents = 'auto';
    }
  }
  
  // 监听滚动事件
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    // 防抖处理
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(updateTopButtonVisibility, 10);
  }, { passive: true });
  
  // 初始化按钮状态
  updateTopButtonVisibility();
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
  // 延迟执行，确保所有组件都已渲染
  setTimeout(initializeBottomButtons, 100);
});

// 监听 Astro 的页面切换事件
document.addEventListener('astro:page-load', () => {
  // 延迟执行，确保所有组件都已渲染
  setTimeout(initializeBottomButtons, 100);
});

// 备用方案：监听 popstate 事件
window.addEventListener('popstate', () => {
  setTimeout(initializeBottomButtons, 200);
});

// 监听动态内容变化
if (typeof MutationObserver !== 'undefined') {
  const observer = new MutationObserver((mutations) => {
    let shouldReinitialize = false;
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        // 检查是否有底部按钮相关的节点被添加
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node;
            if (element.classList?.contains('fixed-bottom-buttons') ||
                element.id === 'home-btn' || element.id === 'top-btn') {
              shouldReinitialize = true;
            }
          }
        });
      }
    });

    if (shouldReinitialize) {
      setTimeout(initializeBottomButtons, 50);
    }
  });

  // 开始观察
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}
