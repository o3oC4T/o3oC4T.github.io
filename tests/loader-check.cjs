const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const { mkdir } = require('node:fs/promises');
const base = process.argv[2] || 'http://127.0.0.1:4173';
const renderer = `export function createProjectBox(box, controls) {
  const state = controls.getState();
  const canvas = document.createElement('canvas');
  box.prepend(canvas);
  controls.registerSelect(index => state.onOpen(index));
  window.__loaderState = state;
  window.__finishLoader = state.onReady;
  window.__failLoader = controls.onError;
  return () => canvas.remove();
}`;
const textures = 'export function createProjectTexturePixels() { return {}; }';

(async () => {
  await mkdir('test-results', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  try {
    for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 568 }, { width: 667, height: 375 }]) {
      const mobile = viewport.width < 760;
      const page = await browser.newPage({ viewport, isMobile: mobile, hasTouch: mobile, reducedMotion: viewport.width === 320 ? 'reduce' : 'no-preference' });
      page.on('pageerror', error => errors.push(error.message));
      let release;
      const gate = new Promise(resolve => { release = resolve; });
      await page.route('**/assets/archive-scene.js*', async route => {
        await gate;
        await route.fulfill({ contentType: 'text/javascript', body: renderer });
      });
      await page.route('**/assets/textures.js', route => route.fulfill({ contentType: 'text/javascript', body: textures }));
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      const progress = page.getByRole('progressbar', { name: 'Opening the archive', exact: true });
      await page.waitForFunction(() => document.querySelector('.loader-progress').getAttribute('aria-valuenow') === '30');
      await page.waitForTimeout(400);
      assert.equal(await progress.getAttribute('aria-valuenow'), '30', 'A pending download does not advance on a timer');
      assert.equal(await page.locator('.archive-page').evaluate(element => element.inert), true);
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => Boolean(document.activeElement.closest('.archive-page'))), false, 'No keyboard navigation underneath the loading screen');
      const typography = await page.locator('.loader-title').evaluate(element => ({ fontSize: parseFloat(getComputedStyle(element).fontSize), width: element.getBoundingClientRect().width }));
      assert.ok(typography.fontSize >= 24 && typography.fontSize <= 34);
      assert.ok(typography.width <= viewport.width - 48);
      const barBounds = await progress.boundingBox();
      assert.ok(barBounds.x >= 0 && barBounds.x + barBounds.width <= viewport.width);
      assert.equal(await page.locator('.loading-dots').count(), 0);
      release();
      await page.waitForFunction(() => Boolean(window.__finishLoader));
      assert.equal(await progress.getAttribute('aria-valuenow'), '85');
      assert.equal(await page.locator('.loader-track').innerText(), '[#################...]');
      assert.equal(await page.evaluate(() => window.__loaderState.canStart), false);
      await page.screenshot({ path: `test-results/loader-${viewport.width}.png` });
      await page.evaluate(() => window.__finishLoader());
      assert.equal(await progress.getAttribute('aria-valuenow'), '100');
      assert.equal(await page.locator('.loader-track').innerText(), '[####################]');
      await page.waitForFunction(() => !document.querySelector('.portfolio-loader'));
      assert.equal(await page.evaluate(() => window.__loaderState.canStart), true);
      assert.equal(await page.locator('.archive-page').evaluate(element => element.inert), false);
      await page.getByRole('button', { name: 'Résumé', exact: true }).click();
      assert.equal(await page.locator('dialog[open]').count(), 1);
      await page.close();
      console.log(`${viewport.width}×${viewport.height}: readable ASCII loader, milestone progress, first-frame completion and navigation passed.`);
    }

    for (const failure of ['download', 'render', 'completion']) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/assets/archive-scene.js*', route => failure === 'download' ? route.abort() : route.fulfill({ contentType: 'text/javascript', body: renderer }));
      await page.route('**/assets/textures.js', route => route.fulfill({ contentType: 'text/javascript', body: textures }));
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      if (failure !== 'download') {
        await page.waitForFunction(() => Boolean(window.__failLoader));
        assert.equal(await page.locator('.loader-percent').textContent(), '85%');
        await page.evaluate(complete => {
          if (complete) window.__finishLoader();
          window.__failLoader();
          window.__finishLoader(); // A late ready event cannot resurrect the loader.
        }, failure === 'completion');
      }
      await page.locator('.scene-error:not([hidden])').waitFor();
      assert.equal(await page.locator('.portfolio-loader').count(), 0);
      assert.equal(await page.locator('.archive-page').evaluate(element => element.inert), false);
      assert.ok(await page.getByRole('button', { name: '새로고침', exact: true }).isVisible());
      await page.getByRole('button', { name: 'About me', exact: true }).click();
      assert.equal(await page.locator('#dialog-title').textContent(), 'About Yeong Choi');
      await page.close();
      console.log(`${failure} failure: loading screen dismissed and recovery navigation remains available.`);
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
