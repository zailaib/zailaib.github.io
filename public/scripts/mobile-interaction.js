// 移动端手势和切换功能
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const minimap = document.getElementById('minimap');
  const mainContent = document.getElementById('main-content');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const minimapToggle = document.getElementById('minimap-toggle');
  
  // 确保元素存在
  if (!mainContent) return;
  
  let touchStartX = 0;
  let touchStartY = 0;
  
  // 移动端手势检测
  mainContent.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  });
  
  mainContent.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = Math.abs(touchEndY - touchStartY);
    
    // 水平滑动且垂直移动较小
    if (Math.abs(deltaX) > 50 && deltaY < 50) {
      if (deltaX > 0) {
        // 向右滑动 - 显示侧边栏
        toggleSidebar();
      } else {
        // 向左滑动 - 显示Minimap
        toggleMinimap();
      }
    }
  });
  
  // 切换功能
  function toggleSidebar() {
    sidebar?.classList.toggle('mobile-visible');
    minimap?.classList.remove('mobile-visible');
  }
  
  function toggleMinimap() {
    minimap?.classList.toggle('mobile-visible');
    sidebar?.classList.remove('mobile-visible');
  }
  
  sidebarToggle?.addEventListener('click', toggleSidebar);
  minimapToggle?.addEventListener('click', toggleMinimap);
  
  // 点击内容区域关闭侧边栏
  mainContent.addEventListener('click', () => {
    sidebar?.classList.remove('mobile-visible');
    minimap?.classList.remove('mobile-visible');
  });
});
