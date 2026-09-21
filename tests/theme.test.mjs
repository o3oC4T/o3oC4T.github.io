import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { theme } from '../docs/theme.js';
import { cards } from '../docs/content.js';
import { recolorCss } from '../scripts/neon-pastel.mjs';

const luminance = hex => [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255)
  .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
  .reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);

test('default accent is pastel pink and all six captions have readable pastel accents', () => {
  assert.equal(theme.accent, '#ffb3df');
  cards.forEach(card => {
    assert.equal(card.color, theme.colors[card.accent]);
    assert.ok((luminance(card.color) + .05) / (luminance(theme.surface) + .05) > 7);
    assert.ok(luminance(card.color) > .5);
  });
});
test('UI recoloring preserves opacity, replaces green cursors, and is idempotent', () => {
  const source = 'a{color:#c4f568;background:#080908;border:1px solid #c4f56828;cursor:url(/cursor-lime.png) 7 6,auto}';
  const result = recolorCss(source);
  assert.ok(result.includes('#ffb3df28'));
  assert.ok(result.includes(theme.background));
  assert.ok(result.includes('cursor-pink.svg) 5 3'));
  assert.equal(recolorCss(result), result);
});
test('published styles and renderer contain no original default lime', async () => {
  for (const file of ['styles.css', 'assets/reference-layout.css', 'assets/reference-mobile.css', 'assets/archive-scene.js', 'app.js', 'icon.svg']) {
    const contents = await readFile(new URL(`../docs/${file}`, import.meta.url), 'utf8');
    assert.doesNotMatch(contents, /#c4f568|#c1ff52|#9ec541|#82a23f|cursor-lime\.png/i, file);
  }
});
test('all cards have procedural holographic faces and softened pastel hover colors', async () => {
  const scene = await readFile(new URL('../docs/assets/archive-scene.js', import.meta.url), 'utf8');
  assert.ok(scene.includes('paintPastelSurface(l,r,n)'));
  assert.ok(scene.includes('iridescence:1'));
  assert.ok(scene.includes('hoverTint * .12'));
  assert.ok(scene.includes('hue:328'));
  assert.ok(scene.includes('75% 84%'));
  for (const color of theme.holographic) assert.ok(scene.includes(color));
  for (const key of Object.keys(theme.colors)) {
    const cursor = await readFile(new URL(`../docs/assets/cursor-${key}.svg`, import.meta.url), 'utf8');
    assert.ok(cursor.includes(theme.colors[key]));
  }
});
