try {
  const theme = localStorage.getItem('theme') || 'system';
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  document.documentElement.classList.add(dark ? 'dark' : 'light');
} catch (e) {}
