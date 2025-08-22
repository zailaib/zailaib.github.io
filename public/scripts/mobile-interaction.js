// 移动端手势和切换功能
function initializeMobileInteraction() {
  console.log('Initializing mobile interaction...');

  const sidebar = document.getElementById('sidebar');
  const minimap = document.getElementById('minimap');
  const mainContent = document.getElementById('main-content');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const minimapToggle = document.getElementById('minimap-toggle');
  const mobileOverlay = document.getElementById('mobile-overlay');

  console.log('Elements found:', {
    sidebar: !!sidebar,
    minimap: !!minimap,
    mainContent: !!mainContent,
    sidebarToggle: !!sidebarToggle,
    minimapToggle: !!minimapToggle,
    mobileOverlay: !!mobileOverlay
  });

  // 确保主要元素存在
  if (!mainContent) {
    console.warn('Main content element not found');
    return;
  }

  let touchStartX = 0;
  let touchStartY = 0;
  let isScrolling = false;
  
  // 移动端手势检测
  mainContent.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isScrolling = false;
  }, { passive: true });

  mainContent.addEventListener('touchmove', (e) => {
    // 检测是否在滚动
    const touchMoveY = e.touches[0].clientY;
    if (Math.abs(touchMoveY - touchStartY) > 10) {
      isScrolling = true;
    }
  }, { passive: true });

  mainContent.addEventListener('touchend', (e) => {
    // 如果用户在滚动，不触发手势
    if (isScrolling) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = Math.abs(touchEndY - touchStartY);

    console.log('Touch gesture:', { deltaX, deltaY, isScrolling });

    // 水平滑动且垂直移动较小，且不是滚动
    if (Math.abs(deltaX) > 80 && deltaY < 100) {
      e.preventDefault(); // 防止其他手势

      if (deltaX > 0) {
        // 向右滑动 - 显示侧边栏
        console.log('Right swipe - showing sidebar');
        toggleSidebar();
      } else {
        // 向左滑动 - 显示Minimap
        console.log('Left swipe - showing minimap');
        toggleMinimap();
      }
    }
  }, { passive: false });
  
  // 显示/隐藏遮罩层
  function showOverlay() {
    if (mobileOverlay) {
      mobileOverlay.classList.add('visible');
    }
  }

  function hideOverlay() {
    if (mobileOverlay) {
      mobileOverlay.classList.remove('visible');
    }
  }

  // 关闭所有移动端面板
  function closeAllPanels() {
    sidebar?.classList.remove('mobile-visible');
    minimap?.classList.remove('mobile-visible');
    hideOverlay();
  }

  // 切换功能
  function toggleSidebar() {
    console.log('Toggling sidebar');
    if (sidebar) {
      const isVisible = sidebar.classList.contains('mobile-visible');

      if (isVisible) {
        closeAllPanels();
      } else {
        minimap?.classList.remove('mobile-visible');
        sidebar.classList.add('mobile-visible');
        showOverlay();
      }

      console.log('Sidebar visibility:', !isVisible);
    }
  }

  function toggleMinimap() {
    console.log('Toggling minimap');
    if (minimap) {
      const isVisible = minimap.classList.contains('mobile-visible');

      if (isVisible) {
        closeAllPanels();
      } else {
        sidebar?.classList.remove('mobile-visible');
        minimap.classList.add('mobile-visible');
        showOverlay();
      }

      console.log('Minimap visibility:', !isVisible);
    }
  }

  // 按钮点击事件
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleSidebar();
    });
  }

  if (minimapToggle) {
    minimapToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMinimap();
    });
  }

  // 遮罩层点击关闭功能
  if (mobileOverlay) {
    mobileOverlay.addEventListener('click', () => {
      console.log('Overlay clicked, closing panels');
      closeAllPanels();
    });
  }

  // 点击内容区域关闭侧边栏和小地图（仅在面板打开时）
  mainContent.addEventListener('click', (e) => {
    const sidebarVisible = sidebar?.classList.contains('mobile-visible');
    const minimapVisible = minimap?.classList.contains('mobile-visible');

    if ((sidebarVisible || minimapVisible) && !e.target.closest('a, button')) {
      closeAllPanels();
    }
  });

  // ESC 键关闭面板
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const sidebarVisible = sidebar?.classList.contains('mobile-visible');
      const minimapVisible = minimap?.classList.contains('mobile-visible');

      if (sidebarVisible || minimapVisible) {
        e.preventDefault();
        closeAllPanels();
      }
    }
  });
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', initializeMobileInteraction);

// 监听 Astro 的页面切换事件
document.addEventListener('astro:page-load', () => {
  console.log('Astro page loaded, reinitializing mobile interaction...');
  initializeMobileInteraction();
});

// 备用方案：监听 popstate 事件
window.addEventListener('popstate', () => {
  console.log('Popstate event, reinitializing mobile interaction...');
  setTimeout(initializeMobileInteraction, 100);
});
