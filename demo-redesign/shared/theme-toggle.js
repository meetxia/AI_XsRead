// 文字之境 · 主题切换脚本（浅色/深色）
(function () {
  const html = document.documentElement;
  const stored = localStorage.getItem('xs-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (stored === 'dark' || (!stored && prefersDark)) html.classList.add('dark');

  // 暴露给页面调用
  window.toggleTheme = function () {
    const isDark = html.classList.toggle('dark');
    localStorage.setItem('xs-theme', isDark ? 'dark' : 'light');
    // 更新 meta theme-color（如有）
    const metas = document.querySelectorAll('meta[name="theme-color"]');
    metas.forEach(m => {
      if (m.media && m.media.includes('dark') && isDark) m.setAttribute('content', m.getAttribute('content'));
    });
  };

  // 自动绑定 [data-theme-toggle]
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-theme-toggle]');
    if (t) { e.preventDefault(); window.toggleTheme(); }
  });
})();
