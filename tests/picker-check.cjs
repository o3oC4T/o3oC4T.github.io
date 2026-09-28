const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.argv[2] || 'http://127.0.0.1:4173';

// Exercise the real application and native smooth scrolling. Only GPU rendering
// is replaced: observe exactly the mobileSelected values the renderer consumes.
const rendererProbe = `export function createProjectBox(box, controls) {
  const state = controls.getState();
  let selected = state.mobileSelected;
  window.pickerTrace = [];
  window.pickerState = state;
  Object.defineProperty(state, 'mobileSelected', {
    get: () => selected,
    set(value) {
      if (value !== selected) window.pickerTrace.push(value);
      selected = value;
    }
  });
  controls.registerSelect(index => state.onOpen(index));
  state.onReady();
  return () => {};
}`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  try {
    for (const reducedMotion of ['no-preference', 'reduce']) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion });
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/assets/archive-scene.js*', route => route.fulfill({ contentType: 'text/javascript', body: rendererProbe }));
      await page.goto(base);
      await page.waitForFunction(() => !document.querySelector('.portfolio-loader'));
      const rail = page.locator('.mobile-picker-rail');
      const clearTrace = () => page.evaluate(() => { window.pickerTrace = []; });
      const settle = async index => {
        await page.waitForFunction(index => {
          const rail = document.querySelector('.mobile-picker-rail');
          return Math.abs(rail.scrollLeft - rail.clientWidth * index) <= 1 && window.pickerState.mobileSelected === index;
        }, index);
        await page.waitForTimeout(120);
        assert.equal(await page.locator('.picker-count').textContent(), `${String(index + 1).padStart(2, '0')} / 06`);
        assert.equal(await page.locator('.mobile-picker-dots [aria-pressed="true"]').count(), 1);
        assert.equal(await page.locator('.mobile-picker-dots [aria-pressed="true"]').getAttribute('data-picker'), String(index));
      };
      const move = async (name, index) => {
        await clearTrace();
        await page.getByRole('button', { name, exact: true }).click();
        await settle(index);
        assert.deepEqual(await page.evaluate(() => window.pickerTrace), [index], `${reducedMotion}: ${name} must not reselect previous/intermediate cards`);
      };
      await move('Next card', 1);
      await move('Previous card', 0);
      await move('Previous card', 5);
      await move('Next card', 0);
      await move('Select Education', 5);
      await move('Select Research', 0);
      console.log(`${reducedMotion}: arrows, wraparound and distant dots never reverse selection.`);

      await clearTrace();
      for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Next card', exact: true }).click();
      await settle(3);
      assert.deepEqual(await page.evaluate(() => window.pickerTrace), [1, 2, 3]);
      await clearTrace();
      await page.getByRole('button', { name: 'Next card', exact: true }).click();
      await page.getByRole('button', { name: 'Previous card', exact: true }).click();
      await settle(3);
      assert.deepEqual(await page.evaluate(() => window.pickerTrace), [4, 3]);
      await page.setViewportSize({ width: 430, height: 932 });
      await settle(3);
      await page.setViewportSize({ width: 390, height: 844 });
      await settle(3);
      console.log(`${reducedMotion}: rapid clicks, immediate reversal and resize preserve the requested card.`);

      // Real touch input must still update the selection after programmatic moves.
      const cdp = await page.context().newCDPSession(page);
      const swipe = async () => {
        const bounds = await rail.boundingBox();
        const x = bounds.x + bounds.width - 20, y = bounds.y + 30;
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
        for (let step = 1; step <= 10; step++) {
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - (bounds.width - 40) * step / 10, y }] });
          await page.waitForTimeout(25);
        }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      };
      await move('Select Research', 0);
      await clearTrace();
      await swipe();
      await settle(1);
      assert.deepEqual(await page.evaluate(() => window.pickerTrace), [1]);

      if (reducedMotion === 'no-preference') {
        await page.getByRole('button', { name: 'Select Education', exact: true }).click();
        await swipe();
        await page.waitForTimeout(900);
        const actual = await rail.evaluate(element => Math.round(element.scrollLeft / element.clientWidth));
        await settle(actual);
      }
      const index = await page.evaluate(() => window.pickerState.mobileSelected);
      const name = ['Research', 'CTF', 'RubiyaLAB', 'Team o3o', 'Honors', 'Education'][index];
      await page.getByRole('button', { name: `View ${name}`, exact: true }).click();
      assert.equal(await page.locator('#dialog-title').textContent(), name);
      await page.getByRole('button', { name: 'Close project', exact: true }).click();
      await settle(index);
      console.log(`${reducedMotion}: touch swipes, interrupted motion and opening the selected card passed.`);
      await page.close();
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
