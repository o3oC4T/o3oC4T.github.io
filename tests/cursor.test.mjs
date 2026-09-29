import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { theme } from '../docs/theme.js';

test('white default and six card cursors embed the original photo in one complete 36px circle', async () => {
  const photo = await readFile(new URL('../docs/assets/profile-cat.jpg', import.meta.url));
  for (const [name, color] of Object.entries({ white: theme.cursorDefault, ...theme.colors })) {
    const svg = await readFile(new URL(`../docs/assets/cursor-${name}.svg`, import.meta.url), 'utf8');
    assert.match(svg, /width="36" height="36" viewBox="0 0 26 26"/);
    assert.match(svg, /<clipPath id="crop"><circle cx="13" cy="13" r="12"\/><\/clipPath>/);
    assert.equal((svg.match(/<clipPath /g) || []).length, 1);
    assert.equal((svg.match(/<image /g) || []).length, 1);
    assert.deepEqual(Buffer.from(svg.match(/data:image\/jpeg;base64,([A-Za-z0-9+/=]+)/)[1], 'base64'), photo);
    assert.match(svg, /r="12" fill="url\(#tint\)" opacity="\.18"/);
    assert.ok(svg.includes(`stop-color="${color}"`));
    assert.doesNotMatch(svg, /<path|<mask|<animate|<script|<foreignObject|href="https?:/);
  }
});

test('cursor coordinates are centered and every image is versioned and preloaded for mouse and touch', async () => {
  const css = await readFile(new URL('../docs/assets/reference-layout.css', import.meta.url), 'utf8');
  const app = await readFile(new URL('../docs/app.js', import.meta.url), 'utf8');
  const html = await readFile(new URL('../docs/index.html', import.meta.url), 'utf8');
  assert.equal((css.match(/cursor-[a-z]+\.svg\?v=20260930-cursor36\) 18 18/g) || []).length, 12);
  assert.match(app, /\.svg\?v=20260930-cursor36\) 18 18, auto/);
  assert.doesNotMatch(app + css, /cursor-[^)]*\) 5 3/);
  assert.match(css, /html:has\(\.archive-page\)\{--portfolio-native-cursor:url\(\/assets\/cursor-white\.svg/);
  assert.match(app, /card\?\.accent \|\| 'white'/);
  for (const color of ['white', ...Object.keys(theme.colors)]) {
    assert.ok(html.includes(`<link rel="preload" as="image" href="/assets/cursor-${color}.svg?v=20260930-cursor36">`));
  }
});

test('neutral cursor default does not change the pink UI or Research accent', () => {
  assert.equal(theme.cursorDefault, '#f5f5f7');
  assert.equal(theme.accent, '#ffb3df');
  assert.equal(theme.colors.pink, '#ffb3df');
});

test('touch feedback cannot intercept taps, scrolling, pinch or print output', async () => {
  const js = await readFile(new URL('../docs/touch-cursor.js', import.meta.url), 'utf8');
  const css = await readFile(new URL('../docs/styles.css', import.meta.url), 'utf8');
  assert.match(js, /passive: true/);
  assert.match(js, /event.touches.length !== 1/);
  assert.doesNotMatch(js, /preventDefault|setPointerCapture|requestAnimationFrame|setInterval/);
  assert.match(css, /\.profile-touch-cursor\{[^}]*pointer-events:none/);
  assert.match(css, /@media print\{\.profile-touch-cursor\{display:none!important\}\}/);
});
