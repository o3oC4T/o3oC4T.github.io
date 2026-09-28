import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('favicon embeds the original profile photo with one complete circular clip', async () => {
  const photo = await readFile(new URL('../docs/assets/profile-cat.jpg', import.meta.url));
  const icon = await readFile(new URL('../docs/icon.svg', import.meta.url), 'utf8');
  const embedded = icon.match(/data:image\/jpeg;base64,([A-Za-z0-9+/=]+)/)?.[1];
  assert.ok(embedded);
  assert.deepEqual(Buffer.from(embedded, 'base64'), photo);
  assert.equal((icon.match(/<circle /g) || []).length, 1);
  assert.match(icon, /<circle cx="200" cy="200" r="200"\/>/);
  assert.doesNotMatch(icon, /<mask|<path|<rect/);
});

test('About uses a circular photo over the retained pink portrait background', async () => {
  const app = await readFile(new URL('../docs/app.js', import.meta.url), 'utf8');
  const css = await readFile(new URL('../docs/styles.css', import.meta.url), 'utf8');
  const html = await readFile(new URL('../docs/index.html', import.meta.url), 'utf8');
  assert.match(app, /<img src="\/assets\/profile-cat.jpg" width="400" height="400" alt="최영의 고양이 프로필 사진"/);
  assert.doesNotMatch(app, /YC monogram/);
  assert.match(css, /\.yc-portrait>img\{[^}]*border-radius:50%/);
  assert.match(css, /radial-gradient\(ellipse at 55% 15%,#5a264236,transparent 70%\)/);
  assert.match(html, /rel="icon" href="\/icon.svg\?v=20260928-cat"/);
});
