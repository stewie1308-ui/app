import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveTheme } from '../www/js/theme.js';
import { loadState } from '../www/js/storage.js';

test('auto follows the phone, light and dark override it', () => {
  assert.equal(resolveTheme('auto', true), 'dark');
  assert.equal(resolveTheme('auto', false), 'light');
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('dark', false), 'dark');
});
test('an unknown or missing setting behaves like auto', () => {
  assert.equal(resolveTheme(undefined, true), 'dark');
  assert.equal(resolveTheme('purple', false), 'light');
});
test('theme defaults to auto for new and old saves', () => {
  const store = { getItem: () => JSON.stringify({ version: 1, settings: { sessionSize: 3 } }), setItem() {} };
  assert.equal(loadState(store).settings.theme, 'auto');
  assert.equal(loadState(store).settings.sessionSize, 3);
});
