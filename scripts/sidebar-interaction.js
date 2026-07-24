// 侧边栏交互功能
function initializeSidebar() {
  // 分类折叠功能
  const categoryHeaders = document.querySelectorAll('.category-header');
  categoryHeaders.forEach(header => {
    // 移除之前的事件监听器，避免重复绑定
    const newHeader = header.cloneNode(true);
    header.parentNode?.replaceChild(newHeader, header);
    
    newHeader.addEventListener('click', () => {
      const category = newHeader.dataset.category;
      const section = newHeader.closest('.category-section');
      
      if (section && category) {
        section.classList.toggle('collapsed');
        
        // 保存折叠状态到 localStorage
        const collapsedCategories = JSON.parse(localStorage.getItem('collapsedCategories') || '[]');
        if (section.classList.contains('collapsed')) {
          if (!collapsedCategories.includes(category)) {
            collapsedCategories.push(category);
          }
        } else {
          const index = collapsedCategories.indexOf(category);
          if (index > -1) {
            collapsedCategories.splice(index, 1);
          }
        }
        localStorage.setItem('collapsedCategories', JSON.stringify(collapsedCategories));
      }
    });
  });

  // 显示更多功能
  const showMoreBtns = document.querySelectorAll('.show-more-btn');
  showMoreBtns.forEach(btn => {
    // 移除之前的事件监听器，避免重复绑定
    const newBtn = btn.cloneNode(true);
    btn.parentNode?.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', () => {
      const category = newBtn.dataset.category;
      const section = newBtn.closest('.category-section');
      const hiddenItems = section?.querySelectorAll('.article-item-hidden');
      const showMoreText = newBtn.querySelector('.show-more-text');
      const showLessText = newBtn.querySelector('.show-less-text');
      
      if (hiddenItems && showMoreText && showLessText) {
        const isExpanded = newBtn.classList.contains('expanded');
        
        if (isExpanded) {
          // 收起
          hiddenItems.forEach(item => {
            item.style.display = 'none';
          });
          showMoreText.style.display = 'inline';
          showLessText.style.display = 'none';
          newBtn.classList.remove('expanded');
        } else {
          // 展开
          hiddenItems.forEach(item => {
            item.style.display = 'block';
          });
          showMoreText.style.display = 'none';
          showLessText.style.display = 'inline';
          newBtn.classList.add('expanded');
        }
      }
    });
  });

  // 恢复折叠状态
  const collapsedCategories = JSON.parse(localStorage.getItem('collapsedCategories') || '[]');
  collapsedCategories.forEach(category => {
    const section = document.querySelector(`[data-category="${category}"]`);
    if (section) {
      section.classList.add('collapsed');
    }
  });
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
  // 延迟执行，确保所有组件都已渲染
  setTimeout(initializeSidebar, 100);
});

// 监听 Astro 的页面切换事件
document.addEventListener('astro:page-load', () => {
  // 延迟执行，确保所有组件都已渲染
  setTimeout(initializeSidebar, 100);
});

// 备用方案：监听 popstate 事件
window.addEventListener('popstate', () => {
  setTimeout(initializeSidebar, 200);
});

// 监听动态内容变化
if (typeof MutationObserver !== 'undefined') {
  const observer = new MutationObserver((mutations) => {
    let shouldReinitialize = false;
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        // 检查是否有侧边栏相关的节点被添加
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node;
            if (element.classList?.contains('category-section') || 
                element.querySelector?.('.category-section')) {
              shouldReinitialize = true;
            }
          }
        });
      }
    });
    
    if (shouldReinitialize) {
      setTimeout(initializeSidebar, 50);
    }
  });

  // 开始观察
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}
