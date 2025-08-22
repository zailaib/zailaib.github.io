// 移动端手势和切换功能
function initializeMobileInteraction() {
  const sidebar = document.getElementById('sidebar');
  const minimap = document.getElementById('minimap');
  const mainContent = document.getElementById('main-content');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const minimapToggle = document.getElementById('minimap-toggle');
  const mobileOverlay = document.getElementById('mobile-overlay');

  // 确保主要元素存在
  if (!mainContent) {
    return;
  }

  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let isScrolling = false;
  let hasMoved = false;
  
  // 移动端手势检测 - 降低阈值，提高敏感度
  mainContent.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
    isScrolling = false;
    hasMoved = false;
  }, { passive: true });

  mainContent.addEventListener('touchmove', (e) => {
    if (!hasMoved) hasMoved = true;

    const touchMoveX = e.touches[0].clientX;
    const touchMoveY = e.touches[0].clientY;
    const deltaX = Math.abs(touchMoveX - touchStartX);
    const deltaY = Math.abs(touchMoveY - touchStartY);

    // 如果垂直移动超过水平移动，认为是滚动
    if (deltaY > deltaX && deltaY > 15) {
      isScrolling = true;
    }
  }, { passive: true });

  mainContent.addEventListener('touchend', (e) => {
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime;

    // 如果用户在滚动或者触摸时间过长，不触发手势
    if (isScrolling || touchDuration > 500) {
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = Math.abs(touchEndY - touchStartY);

    // 降低阈值：水平滑动 50px，垂直容忍 80px，且有明显移动
    if (hasMoved && Math.abs(deltaX) > 50 && deltaY < 80 && Math.abs(deltaX) > deltaY) {
      e.preventDefault(); // 防止其他手势

      if (deltaX > 0) {
        // 向右滑动 - 显示侧边栏
        toggleSidebar();
        showGestureHint('👈 Swipe left for minimap');
      } else {
        // 向左滑动 - 显示Minimap
        toggleMinimap();
        showGestureHint('👉 Swipe right for navigation');
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

  // 显示手势提示
  function showGestureHint(message) {
    // 移除现有提示
    const existingHint = document.querySelector('.mobile-gesture-hint');
    if (existingHint) {
      existingHint.remove();
    }

    // 创建新提示
    const hint = document.createElement('div');
    hint.className = 'mobile-gesture-hint';
    hint.textContent = message;
    document.body.appendChild(hint);

    // 4秒后自动移除
    setTimeout(() => {
      hint.remove();
    }, 4000);
  }

  // 切换功能
  function toggleSidebar() {
    if (sidebar) {
      const isVisible = sidebar.classList.contains('mobile-visible');

      if (isVisible) {
        closeAllPanels();
      } else {
        minimap?.classList.remove('mobile-visible');
        sidebar.classList.add('mobile-visible');
        showOverlay();
      }
    }
  }

  function toggleMinimap() {
    if (minimap) {
      const isVisible = minimap.classList.contains('mobile-visible');

      if (isVisible) {
        closeAllPanels();
      } else {
        sidebar?.classList.remove('mobile-visible');
        minimap.classList.add('mobile-visible');
        showOverlay();
      }
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

  // 专门处理侧边栏和 minimap 内的链接点击
  if (sidebar) {
    sidebar.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.href) {
        // 延迟关闭，让导航先完成
        setTimeout(() => {
          closeAllPanels();
        }, 100);
      }
    });
  }

  if (minimap) {
    minimap.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.href) {
        // 延迟关闭，让滚动先完成
        setTimeout(() => {
          closeAllPanels();
        }, 300);
      }
    });
  }

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

  // 首次访问时显示手势提示（仅在移动端）
  if (window.innerWidth <= 768 && !localStorage.getItem('mobile-gesture-hint-shown')) {
    setTimeout(() => {
      showGestureHint('👆 Swipe left/right to access navigation');
      localStorage.setItem('mobile-gesture-hint-shown', 'true');
    }, 2000);
  }

  // 开发调试：在桌面端添加测试按钮（仅在开发环境且需要时启用）
  // 取消注释下面的代码来启用调试面板
  /*
  if (window.location.hostname === 'localhost' && window.innerWidth > 768) {
    const debugPanel = document.createElement('div');
    debugPanel.innerHTML = `
      <div style="position: fixed; top: 10px; right: 10px; z-index: 9999; background: #333; color: white; padding: 10px; border-radius: 5px; font-size: 12px;">
        <div>Mobile Debug Panel</div>
        <button onclick="window.mobileDebug.testLeftSwipe()" style="margin: 2px; padding: 5px;">Test Left Swipe</button>
        <button onclick="window.mobileDebug.testRightSwipe()" style="margin: 2px; padding: 5px;">Test Right Swipe</button>
        <button onclick="window.mobileDebug.closeAll()" style="margin: 2px; padding: 5px;">Close All</button>
      </div>
    `;
    document.body.appendChild(debugPanel);

    // 全局调试函数
    window.mobileDebug = {
      testLeftSwipe: () => {
        console.log('🧪 Debug: Simulating left swipe');
        toggleMinimap();
      },
      testRightSwipe: () => {
        console.log('🧪 Debug: Simulating right swipe');
        toggleSidebar();
      },
      closeAll: () => {
        console.log('🧪 Debug: Closing all panels');
        closeAllPanels();
      }
    };
  }
  */
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', initializeMobileInteraction);

// 监听 Astro 的页面切换事件
document.addEventListener('astro:page-load', initializeMobileInteraction);

// 备用方案：监听 popstate 事件
window.addEventListener('popstate', () => {
  setTimeout(initializeMobileInteraction, 100);
});
