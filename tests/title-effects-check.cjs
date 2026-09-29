const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.argv[2] || 'http://127.0.0.1:4173';
const field = page => page.locator('.terminal-art-field').evaluate(canvas => canvas.toDataURL());

(async () => {
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  try {
    for (const mobile of [false, true]) {
      const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 }, isMobile: mobile, hasTouch: mobile });
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/assets/archive-scene.js*', route => route.fulfill({ contentType: 'text/javascript', body: 'export function createProjectBox(box, controls) { const state = controls.getState(); controls.registerSelect(index => state.onOpen(index)); state.onReady(); return () => {}; }' }));
      await page.goto(base);
      await page.waitForFunction(() => !document.querySelector('.portfolio-loader'));
      const open = async () => {
        if (mobile) await page.getByRole('button', { name: 'View Research', exact: true }).click();
        else {
          await page.getByRole('button', { name: 'Open Research', exact: true }).focus();
          await page.keyboard.press('Enter');
        }
        await page.locator('dialog[open]').waitFor();
        await page.evaluate(() => document.fonts.ready);
        await page.waitForFunction(() => document.querySelector('.terminal-art-button').dataset.artMotion === 'running');
      };
      await open();
      const button = page.locator('.terminal-art-button');
      const initial = await field(page);
      await page.waitForTimeout(300);
      assert.notEqual(await field(page), initial, 'Ambient ASCII moves with time');
      const populated = await page.locator('.terminal-art-field').evaluate(canvas => {
        const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        let count = 0;
        for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) count++;
        return count;
      });
      assert.ok(populated > 100, 'Visible character field');
      if (!mobile) {
        const maxAlpha = () => page.locator('.terminal-art-field').evaluate(canvas => {
          const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
          let maximum = 0;
          for (let i = 3; i < pixels.length; i += 4) maximum = Math.max(maximum, pixels[i]);
          return maximum;
        });
        await page.mouse.move(0, 0);
        await page.waitForTimeout(120);
        const restingAlpha = await maxAlpha();
        const bounds = await button.boundingBox();
        await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        await page.waitForTimeout(120);
        assert.ok(await maxAlpha() > restingAlpha + 20, 'Pointer intensifies nearby characters');
      }
      const previousStyle = await button.getAttribute('data-art-style');
      if (mobile) await button.tap(); else await button.click();
      await page.waitForFunction(() => document.querySelector('.terminal-art-button').dataset.artPhase === 'glitch');
      await page.waitForFunction(() => document.querySelector('.terminal-art-button').dataset.artPhase === 'idle');
      assert.notEqual(await button.getAttribute('data-art-style'), previousStyle);
      if (!mobile) {
        const bounds = await button.boundingBox();
        await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        await page.waitForTimeout(80);
        await page.screenshot({ path: 'test-results/ascii-pointer.png' });
      }
      await page.locator('dialog').evaluate(dialog => { dialog.scrollTop = dialog.scrollHeight; });
      await page.waitForFunction(() => document.querySelector('.terminal-art-button').dataset.artMotion === 'paused');
      const offscreen = await field(page);
      await page.waitForTimeout(150);
      assert.equal(await field(page), offscreen, 'Offscreen field stops');
      await page.locator('dialog').evaluate(dialog => { dialog.scrollTop = 0; });
      await page.waitForFunction(() => document.querySelector('.terminal-art-button').dataset.artMotion === 'running');
      await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { configurable: true, value: true });
        document.dispatchEvent(new Event('visibilitychange'));
      });
      const hidden = await field(page);
      await page.waitForTimeout(150);
      assert.equal(await field(page), hidden, 'Hidden-tab field stops');
      await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForFunction(() => document.querySelector('.terminal-art-button').dataset.artMotion === 'paused');
      const reduced = await field(page);
      await page.waitForTimeout(150);
      assert.equal(await field(page), reduced, 'Reduced motion is static');
      await button.focus();
      const beforeKey = await button.getAttribute('data-art-style');
      await page.keyboard.press('Enter');
      assert.notEqual(await button.getAttribute('data-art-style'), beforeKey);
      assert.equal(await button.getAttribute('data-art-phase'), 'idle', 'No reduced-motion glitch');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.waitForFunction(() => document.querySelector('.terminal-art-button').dataset.artMotion === 'running');
      await button.click();
      await page.evaluate(() => {
        window.retiredArt = document.querySelector('.terminal-art-button');
        document.querySelector('dialog').close();
      });
      await page.waitForFunction(() => window.retiredArt.dataset.artMotion === 'disposed');
      const retired = await page.evaluate(() => [window.retiredArt.innerHTML, window.retiredArt.querySelector('canvas').toDataURL()]);
      await page.waitForTimeout(250);
      assert.deepEqual(await page.evaluate(() => [window.retiredArt.innerHTML, window.retiredArt.querySelector('canvas').toDataURL()]), retired, 'Closing cancels the field and an in-flight glitch');
      await open();
      await page.evaluate(() => { window.retiredArt = document.querySelector('.terminal-art-button'); });
      await page.locator('.terminal-navigation [data-open]').last().click();
      assert.equal(await page.evaluate(() => window.retiredArt.dataset.artMotion), 'disposed');
      assert.equal(await page.locator('.terminal-art-field').count(), 1, 'One instance after changing cards');
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Résumé', exact: true }).click();
      assert.equal(await page.locator('.terminal-art-field').count(), 0);
      await page.close();
      console.log(`${mobile ? 'Touch' : 'Desktop'}: ambient field, shuffle/glitch, keyboard, reduced motion, visibility and complete disposal passed.`);
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
