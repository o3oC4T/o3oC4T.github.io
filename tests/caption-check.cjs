const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const base = process.argv[2] || 'http://127.0.0.1:4173';

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    await fs.mkdir('test-results', { recursive: true });
    const page = await browser.newPage({ reducedMotion: 'no-preference', viewport: { width: 900, height: 300 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // Isolate DOM text animation from software WebGL, using the deployed module/CSS.
    await page.route('**/__caption-test', route => route.fulfill({
      contentType: 'text/html',
      body: `<link rel="stylesheet" href="${base}/assets/reference-layout.css"><link rel="stylesheet" href="${base}/styles.css"><div class="box-caption" aria-live="polite" style="--caption-accent:#c994ff;color:#c994ff;bottom:50%;font-size:32px"><span class="caption-number"></span><span class="caption-title"></span><span class="caption-arrow" aria-hidden="true"></span></div>`,
    }));
    await page.goto(base + '/__caption-test');
    await page.evaluate(async base => {
      await document.fonts.load('400 32px Manrope');
      await document.fonts.ready;
      const { createCaptionScramble } = await import(base + '/caption-scramble.js');
      window.captionTest = createCaptionScramble(document.querySelector('.box-caption'));
    }, base);
    await page.clock.install({ time: new Date('2026-09-21T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-09-21T00:00:01Z'));
    const snapshot = () => page.evaluate(() => ({
      states: [...document.querySelectorAll('.about-matrix')].map(e => e.dataset.scrambling),
      phases: [...document.querySelectorAll('.matrix-letter')].map(e => e.dataset.phase),
      glyphs: [...document.querySelectorAll('.matrix-letter')].map(e => e.dataset.glyph).join(''),
      text: document.querySelector('.caption-title .sr-only').textContent,
      width: document.querySelector('.box-caption').getBoundingClientRect().width,
      accent: getComputedStyle(document.querySelector('.matrix-letter'), '::after').color,
      pseudoDisplay: getComputedStyle(document.querySelector('.matrix-letter'), '::after').display,
    }));
    const labels = ['Research', 'CTF', 'RubiyaLAB', 'Team o3o', 'Honors', 'Education'];
    for (const [index, title] of labels.entries()) {
      await page.evaluate(([number, title]) => window.captionTest.set(number, title), [String(index + 1).padStart(2, '0'), title]);
      const first = await snapshot();
      assert.deepEqual(first.states, ['active', 'active', 'active']);
      assert.ok(first.phases.includes('shuffling'));
      assert.notEqual(first.pseudoDisplay, 'none');
      assert.equal(first.accent, 'rgb(201, 148, 255)');
      assert.equal(first.text, title);
      await page.clock.runFor(75);
      assert.notEqual((await snapshot()).glyphs, first.glyphs);
      if (!index) await page.screenshot({ path: 'test-results/caption-scrambling.png' });
      await page.clock.runFor(525);
      const settled = await snapshot();
      assert.deepEqual(settled.states, ['idle', 'idle', 'idle']);
      assert.ok(settled.phases.every(phase => phase === 'settled'));
      assert.equal(settled.glyphs, String(index + 1).padStart(2, '0') + title.replace(/\s/g, '') + '↗');
      assert.equal(settled.width, first.width);
      await page.evaluate(([number, title]) => window.captionTest.set(number, title), [String(index + 1).padStart(2, '0'), title]);
      assert.deepEqual((await snapshot()).states, ['idle', 'idle', 'idle']);
      console.log('Scramble → settle without layout shift:', title);
    }
    await page.evaluate(() => window.captionTest.set('01', 'Research'));
    await page.clock.runFor(75);
    await page.evaluate(() => window.captionTest.set('06', 'Education'));
    await page.clock.runFor(600);
    assert.equal((await snapshot()).glyphs, '06Education↗');
    await page.evaluate(() => window.captionTest.set('', '', { animate: false }));
    assert.deepEqual((await snapshot()).states, ['idle', 'idle', 'idle']);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => window.captionTest.set('02', 'CTF'));
    assert.deepEqual((await snapshot()).states, ['idle', 'idle', 'idle']);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(() => window.captionTest.set('03', 'RubiyaLAB'));
    assert.ok((await snapshot()).states.includes('active'));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => [...document.querySelectorAll('.about-matrix')].every(e => e.dataset.scrambling === 'idle'));
    await page.evaluate(() => window.captionTest.destroy());
    assert.deepEqual(errors, []);
    console.log('Fast switches, pointer leave, repeated hover, reduced motion and cleanup passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
