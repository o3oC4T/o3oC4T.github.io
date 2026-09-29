const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const base = process.argv[2] || 'http://127.0.0.1:4173';

const sizes = [
  [1280, 900], [1920, 1080], [901, 600], [900, 600],
  [761, 900], [760, 900], [601, 900], [600, 900],
  [390, 844], [844, 390], [320, 568], [568, 320], [1280, 900],
];

async function geometry(page) {
  return page.locator('.terminal-title-art').evaluate(svg => {
    const box = svg.getBoundingClientRect();
    const parent = svg.parentElement.getBoundingClientRect();
    const view = svg.viewBox.baseVal;
    const face = svg.querySelector('.terminal-title-face');
    const bounds = face.getBBox();
    const matrix = svg.getScreenCTM();
    const dialog = svg.closest('dialog');
    return {
      width: box.width, height: box.height, expectedRatio: view.width / view.height,
      inside: box.left >= parent.left - 1 && box.right <= parent.right + 1,
      overflow: dialog.scrollWidth > dialog.clientWidth + 1,
      scaleX: matrix.a, scaleY: matrix.d,
      face: [bounds.x, bounds.y, bounds.width, bounds.height],
      path: face.getAttribute('d'),
      fontDependentElements: svg.querySelectorAll('text, tspan, foreignObject, image, pattern, filter').length,
    };
  });
}

(async () => {
  const { cards } = await import('../docs/content.js');
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  await fs.mkdir('test-results', { recursive: true });
  try {
    for (const deviceScaleFactor of [1, 1.25, 2]) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor, reducedMotion: 'reduce' });
      page.on('pageerror', error => errors.push(error.message));
      // Exercise the real modal and CSS without repeatedly running the 3D scene.
      await page.route('**/assets/archive-scene.js*', route => route.fulfill({ contentType: 'text/javascript', body: 'export function createProjectBox(box, controls) { const state = controls.getState(); controls.registerSelect(index => state.onOpen(index)); state.onReady(); return () => {}; }' }));
      await page.goto(base);
      await page.waitForFunction(() => !document.querySelector('.portfolio-loader'));
      for (const card of cards) {
        await page.getByRole('button', { name: `Open ${card.label}`, exact: true }).focus();
        await page.keyboard.press('Enter');
        await page.locator('dialog[open]').waitFor();
        await page.evaluate(() => document.fonts.ready);
        const art = page.locator('.terminal-title-art');
        const initial = await geometry(page);
        const initialPixels = await art.screenshot();
        for (const [width, height] of sizes) {
          await page.setViewportSize({ width, height });
          const current = await geometry(page);
          const context = `${card.label}, ${width}×${height}, DPR ${deviceScaleFactor}`;
          assert.equal(current.fontDependentElements, 0, context);
          assert.ok(current.width > 0 && current.height > 0 && current.inside, context);
          assert.equal(current.overflow, false, context);
          assert.ok(Math.abs(current.width / current.height - current.expectedRatio) < .002, context);
          assert.ok(Math.abs(current.scaleX - current.scaleY) < .00001, context);
          assert.deepEqual(current.face, initial.face, context);
          assert.equal(current.path, initial.path, context);
          if (deviceScaleFactor === 1 && [1280, 390, 320].includes(width)) {
            await art.screenshot({ path: `test-results/art-${card.id}-${width}.png` });
          }
        }
        // Returning to the same viewport must produce the very same pixels,
        // not accumulate rounding or font-metric changes after resizing.
        assert.deepEqual(await art.screenshot(), initialPixels, `${card.label}: resize round trip`);
        await art.evaluate(svg => {
          svg.style.fontFamily = 'serif';
          svg.style.fontSize = '72px';
          svg.style.letterSpacing = '20px';
        });
        assert.deepEqual(await art.screenshot(), initialPixels, `${card.label}: font independence`);
        for (const zoom of [1.25, 1.5, .8, 1]) {
          await page.evaluate(value => { document.documentElement.style.zoom = value; }, zoom);
          const current = await geometry(page);
          assert.ok(current.inside && !current.overflow, `${card.label}: zoom ${zoom}`);
          assert.ok(Math.abs(current.scaleX - current.scaleY) < .00001);
          assert.deepEqual(current.face, initial.face);
        }
        await page.getByRole('button', { name: 'Close project', exact: true }).click();
      }
      await page.close();
      console.log(`All six titles: repeated resize, portrait/landscape, zoom, font independence and pixel-stable round trips passed at DPR ${deviceScaleFactor}.`);
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
