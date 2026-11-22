// Light / dark theme: 'auto' follows the phone's setting.
export function resolveTheme(setting, prefersDark) {
  if (setting === 'light' || setting === 'dark') return setting;
  return prefersDark ? 'dark' : 'light';
}

export function applyTheme(setting, onResolved) {
  const mq = globalThis.matchMedia?.('(prefers-color-scheme: dark)');
  const resolved = resolveTheme(setting, !!mq?.matches);
  document.documentElement.dataset.theme = resolved;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#1F1C18' : '#F6F0E4');
  onResolved?.(resolved);
  return resolved;
}
