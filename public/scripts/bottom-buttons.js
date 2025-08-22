// 底部固定按钮功能
function initializeBottomButtons() {
  const homeBtn = document.getElementById('home-btn');
  const topBtn = document.getElementById('top-btn');
  
  if (!homeBtn || !topBtn) {
    return;
  }
  
  // Home 按钮功能
  homeBtn.addEventListener('click', () => {
    // 获取当前语言
    const currentPath = window.location.pathname;
    const isEnglish = currentPath.startsWith('/en');
    
    // 跳转到对应语言的首页
    const homeUrl = isEnglish ? '/en/' : '/';
    window.location.href = homeUrl;
  });
  
  // Top 按钮功能
  topBtn.addEventListener('click', () => {
    // 平滑滚动到顶部
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
  
  // 根据滚动位置显示/隐藏 Top 按钮
  function updateTopButtonVisibility() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const shouldShow = scrollTop > 300; // 滚动超过300px时显示
    
    if (shouldShow) {
      topBtn.style.opacity = '1';
      topBtn.style.pointerEvents = 'auto';
    } else {
      topBtn.style.opacity = '0.6';
      topBtn.style.pointerEvents = 'auto';
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
document.addEventListener('DOMContentLoaded', initializeBottomButtons);

// 监听 Astro 的页面切换事件
document.addEventListener('astro:page-load', initializeBottomButtons);

// 备用方案：监听 popstate 事件
window.addEventListener('popstate', () => {
  setTimeout(initializeBottomButtons, 100);
});
