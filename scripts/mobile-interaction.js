// 移动端切换功能
function initializeMobileInteraction() {
  const sidebar = document.getElementById('sidebar');
  const minimap = document.getElementById('minimap');
  const mainContent = document.getElementById('main-content');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const minimapToggle = document.getElementById('minimap-toggle');
  const mobileOverlay = document.getElementById('mobile-overlay');

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
  if (mainContent) {
    mainContent.addEventListener('click', (e) => {
      const sidebarVisible = sidebar?.classList.contains('mobile-visible');
      const minimapVisible = minimap?.classList.contains('mobile-visible');

      if ((sidebarVisible || minimapVisible) && !e.target.closest('a, button')) {
        closeAllPanels();
      }
    });
  }

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


}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
  // 延迟执行，确保所有组件都已渲染
  setTimeout(initializeMobileInteraction, 100);
});

// 监听 Astro 的页面切换事件
document.addEventListener('astro:page-load', () => {
  // 延迟执行，确保所有组件都已渲染
  setTimeout(initializeMobileInteraction, 100);
});

// 备用方案：监听 popstate 事件
window.addEventListener('popstate', () => {
  setTimeout(initializeMobileInteraction, 200);
});

// 监听动态内容变化
if (typeof MutationObserver !== 'undefined') {
  const observer = new MutationObserver((mutations) => {
    let shouldReinitialize = false;
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        // 检查是否有相关的节点被添加
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node;
            if (element.id === 'sidebar' || element.id === 'minimap' ||
                element.id === 'sidebar-toggle' || element.id === 'minimap-toggle') {
              shouldReinitialize = true;
            }
          }
        });
      }
    });

    if (shouldReinitialize) {
      setTimeout(initializeMobileInteraction, 50);
    }
  });

  // 开始观察
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}
