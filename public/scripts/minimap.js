// 动态生成Minimap导航
document.addEventListener('DOMContentLoaded', () => {
  const minimapContainer = document.getElementById('minimap-links');
  if (!minimapContainer) return;
  
  // 获取文章中的所有标题
  const headings = document.querySelectorAll('article h1, article h2, article h3');
  
  if (headings.length === 0) {
    minimapContainer.innerHTML = `<p class="minimap-placeholder">${window.minimapConfig?.translations?.noHeadings || 'No headings found'}</p>`;
    return;
  }
  
  // 清空占位符
  minimapContainer.innerHTML = '';
  
  // 创建导航链接
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.substring(1));
    const text = heading.textContent || `Heading ${index + 1}`;
    const id = heading.id || `heading-${index}`;
    
    // 如果没有ID，为标题添加ID
    if (!heading.id) {
      heading.id = id;
    }
    
    const link = document.createElement('a');
    link.href = `#${id}`;
    link.textContent = text;
    link.className = `minimap-link level-${level}`;
    link.dataset.headingId = id;
    
    minimapContainer.appendChild(link);
  });
  
  // 设置IntersectionObserver来高亮当前标题
  const observerOptions = {
    rootMargin: '-20% 0px -70% 0px',
    threshold: 0.1
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.id;
      const link = document.querySelector(`.minimap-link[data-heading-id="${id}"]`);
      
      if (entry.isIntersecting) {
        link?.classList.add('active');
      } else {
        link?.classList.remove('active');
      }
    });
  }, observerOptions);
  
  // 观察所有标题
  headings.forEach(heading => {
    observer.observe(heading);
  });
});
