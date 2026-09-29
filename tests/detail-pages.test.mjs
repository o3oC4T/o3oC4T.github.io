import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { cards, detailCopy, research, ctf, rubiya, team, honors, education } from '../docs/content.js';
import { titleArt, artStyles, artGlyphs, renderTitleArt } from '../docs/title-art.js';
import { renderDetailPage, updateDetailProgress } from '../docs/detail-pages.js';

const escape = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

test('all six titles produce distinct ANSI character grids', () => {
  const art = cards.map(card => titleArt(card.label));
  assert.equal(new Set(art.map(item => item.lines.join('\n'))).size, 6);
  for (const item of art) {
    assert.equal(item.height, 110);
    assert.ok(item.width > item.height);
    assert.equal(item.lines.length, item.rows);
    assert.ok(item.lines.every(line => line.length === item.columns));
    assert.match(item.lines.join(''), /[█▓▒░▀▄▌▐]/);
    assert.ok([...item.lines.join('')].every(glyph => glyph === ' ' || artGlyphs.includes(glyph)));
  }
  assert.throws(() => titleArt('bad<script>'), /Unsupported/);
  assert.throws(() => titleArt(''), /required/);
});

test('five reference-inspired styles use mixed glyphs on a stable grid', () => {
  for (const card of cards) {
    const variants = artStyles.map(style => titleArt(card.label, style));
    assert.equal(new Set(variants.map(art => art.lines.join('\n'))).size, 5);
    assert.equal(new Set(variants.map(art => `${art.width},${art.height}`)).size, 1);
    assert.match(variants[0].lines.join(''), /░/);
    assert.match(variants[1].lines.join(''), /▒/);
    assert.match(variants[2].lines.join(''), /▐/);
    assert.match(variants[3].lines.join(''), /#/);
    assert.match(variants[4].lines.join(''), /█/);
    for (const style of artStyles) {
      const svg = renderTitleArt(card.label, style, `test-${card.id}`);
      const ids = new Set([...svg.matchAll(/ id="([^"]+)"/g)].map(match => match[1]));
      for (const match of svg.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(match[1]));
      for (const match of svg.matchAll(/ x="(\d+)" y="(\d+)"/g)) {
        assert.equal(+match[1] % 6, 0);
        assert.equal(+match[2] % 10, 0);
      }
    }
  }
  assert.throws(() => titleArt('Research', 'missing'), /Unknown/);
  assert.throws(() => renderTitleArt('Research', 'ansi', 'bad"id'), /Invalid/);
});

test('each detail page has its own command, title, and translated two-line introduction', () => {
  assert.deepEqual(Object.keys(detailCopy), cards.map(card => card.id));
  assert.equal(detailCopy.research.subtitle, 'Security research that connects the evidence.');
  assert.equal(detailCopy.research.description, 'Two studies presented at the WISA 2026 Poster Session and my authorship roles.');
  cards.forEach((card, index) => {
    const html = renderDetailPage(index);
    const intro = detailCopy[card.id];
    assert.ok(html.includes(`id="dialog-title" class="sr-only">${card.label}</h1>`));
    assert.ok(html.includes(`./${card.id}`));
    assert.ok(html.includes('yeong@o3oc4t'));
    assert.ok(html.includes(`class="terminal-lead" lang="en">${escape(intro.subtitle)}</p>`));
    assert.ok(html.includes(`class="terminal-description" lang="en">${escape(intro.description)}</p>`));
    assert.doesNotMatch(intro.subtitle + intro.description, /[가-힣]/);
    assert.doesNotMatch(html, /Sergey|Serg Zorin|serg@zorin|Seattle|20 years|Currently at Meta|password-protected|view case study/);
    assert.match(html, /preserveAspectRatio="xMinYMin meet" aria-hidden="true"/);
    const svg = html.match(/<svg class="terminal-title-art".*?<\/svg>/s)[0];
    assert.match(svg, /class="terminal-title-tiles"/);
    assert.doesNotMatch(svg, /<(?:text|tspan|pattern|image|filter|rect)\b/);
    assert.equal((svg.match(/<path /g) || []).length, artGlyphs.length);
    const grid = titleArt(card.label, artStyles[index % artStyles.length]);
    assert.equal((svg.match(/<use /g) || []).length, grid.lines.join('').replaceAll(' ', '').length);
    assert.match(html, /class="terminal-art-field" aria-hidden="true"/);
    assert.ok(html.includes(`aria-label="Change ${card.label} ASCII art style"`));
    assert.doesNotMatch(html, /\stitle="Click to change ASCII style"/);
    assert.equal((html.match(/<h1 /g) || []).length, 1);
    assert.match(html, /aria-label="Close project"/);
    assert.ok(html.includes(`data-open="${(index + 5) % 6}"`));
    assert.ok(html.includes(`data-open="${(index + 1) % 6}"`));
  });
});

test('research and team roles use numbered work entries; every result remains in history rows', () => {
  const pages = cards.map((_, index) => renderDetailPage(index));
  assert.equal((pages[0].match(/<article class="terminal-work"/g) || []).length, research.length);
  for (const paper of research) {
    for (const value of [paper.title, paper.venue, paper.role, paper.number, ...paper.tags]) assert.ok(pages[0].includes(escape(value)), value);
  }
  for (const [index, records] of [[1, ctf], [2, rubiya], [3, team], [4, honors]]) {
    assert.equal((pages[index].match(/<li class="terminal-history-row/g) || []).length, records.length);
    for (const record of records) {
      for (const value of [record.name, record.result, record.note].filter(Boolean)) assert.ok(pages[index].includes(escape(value)), value);
    }
  }
  assert.ok(pages[2].includes('CTF Member'));
  assert.ok(pages[2].includes('def-cam CTF (D-CTF) Quals'));
  assert.ok(pages[3].includes('Academic Team · <mark>Leader</mark>'));
  assert.ok(pages[4].includes('모두의 창업 1기'));
  assert.ok(pages[4].includes('제 9회 정보보호영재교육원 경진대회'));
  assert.equal((pages[5].match(/<li class="terminal-history-row/g) || []).length, education.length);
  for (const item of education) for (const value of [item.period, item.school, item.course]) assert.ok(pages[5].includes(escape(value)), value);
});

test('progress reflects dialog scrolling and safely ignores other dialogs', () => {
  const meter = {}, percent = {};
  const dialog = { scrollHeight: 1500, clientHeight: 500, scrollTop: 0, querySelector: selector => selector === '.terminal-meter' ? meter : percent };
  updateDetailProgress(dialog);
  assert.deepEqual([meter.textContent, percent.textContent], ['░░░░░░░░', '00%']);
  dialog.scrollTop = 500;
  updateDetailProgress(dialog);
  assert.deepEqual([meter.textContent, percent.textContent], ['████░░░░', '50%']);
  dialog.scrollTop = 1100;
  updateDetailProgress(dialog);
  assert.deepEqual([meter.textContent, percent.textContent], ['████████', '100%']);
  dialog.scrollHeight = dialog.clientHeight;
  updateDetailProgress(dialog);
  assert.equal(percent.textContent, '100%');
  assert.doesNotThrow(() => updateDetailProgress({ querySelector: () => null }));
});

test('detail styling is separately loaded, responsive, and respects reduced motion', async () => {
  const html = await readFile(new URL('../docs/index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../docs/detail-pages.css', import.meta.url), 'utf8');
  const app = await readFile(new URL('../docs/app.js', import.meta.url), 'utf8');
  assert.match(html, /href="\/detail-pages.css\?v=20260930-ascii"/);
  assert.match(css, /aspect-ratio: var\(--title-art-ratio\)/);
  assert.doesNotMatch(css, /\.terminal-title-art\s*\{[^}]*\b(?:min-height|max-height):/);
  assert.match(css, /\.archive-detail\.terminal-detail\[open\]/);
  assert.match(css, /@media \(max-width: 600px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /\.terminal-cursor \{ animation: none; \}/);
  assert.match(app, /archive-detail terminal-detail/);
  assert.match(app, /dialog.innerHTML = renderDetailPage\(index\)/);
  assert.match(app, /pickerScrollTarget/);
  assert.match(app, /disposeDetailArt\?\.\(\)/);
  assert.match(app, /mountTitleArt\(dialog.querySelector/);
});
