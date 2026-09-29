const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const base = process.argv[2] || 'http://127.0.0.1:4173';

(async () => {
  const { cards, detailCopy } = await import('../docs/content.js');
  await fs.mkdir('test-results', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const errors = [], failedResponses = [];
  try {
    for (const width of [1280, 768, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce', isMobile: width <= 760, hasTouch: width <= 760 });
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.status() >= 400) failedResponses.push(response.url()); });
      // Isolate detail rendering from slow software WebGL. The full browser
      // suite separately verifies real card flights and return animations.
      await page.route('**/assets/archive-scene.js*', route => route.fulfill({ contentType: 'text/javascript', body: 'export function createProjectBox(box, controls) { const state = controls.getState(); controls.registerSelect(index => state.onOpen(index)); state.onReady(); return () => {}; }' }));
      await page.goto(base);
      await page.waitForFunction(() => !document.querySelector('.portfolio-loader'));
      for (let index = 0; index < cards.length; index++) {
        const card = cards[index];
        if (width <= 760) {
          await page.getByRole('button', { name: `Select ${card.label}`, exact: true }).click();
          await page.getByRole('button', { name: `View ${card.label}`, exact: true }).click();
        } else {
          await page.getByRole('button', { name: `Open ${card.label}`, exact: true }).focus();
          await page.keyboard.press('Enter');
        }
        const dialog = page.locator('dialog[open]');
        await dialog.waitFor();
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.locator('#dialog-title').textContent(), card.label);
        assert.equal(await page.locator('.terminal-lead').textContent(), detailCopy[card.id].subtitle);
        assert.equal(await page.locator('.terminal-description').textContent(), detailCopy[card.id].description);
        assert.ok((await page.locator('.terminal-command').textContent()).includes(`./${card.id}`));
        assert.equal(await page.locator('.terminal-host').textContent(), 'Yeong@C4T');
        assert.equal(await page.locator('.terminal-status-host').textContent(), '[Yeong@C4T]');
        assert.ok(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth + 1), `${card.label} overflow at ${width}px`);
        assert.ok(await page.locator('.terminal-title-art').evaluate(element => {
          const art = element.getBoundingClientRect(), bounds = element.parentElement.getBoundingClientRect();
          return art.width > 0 && art.left >= bounds.left - 1 && art.right <= bounds.right + 1;
        }));
        assert.equal(await page.locator('.terminal-cursor').evaluate(element => getComputedStyle(element).animationName), 'none');
        const expectedRows = [0, 7, 12, 6, 6, 9][index];
        assert.equal(await page.locator('.terminal-history-row').count(), expectedRows);
        if (width === 1280 || width === 390) await page.screenshot({ path: `test-results/detail-${card.id}-${width}.png` });
        await dialog.evaluate(element => { element.scrollTop = element.scrollHeight; });
        await page.waitForFunction(() => document.querySelector('.terminal-percent').textContent === '100%');
        await page.locator('.terminal-navigation [data-open]').last().click();
        assert.equal(await page.locator('#dialog-title').textContent(), cards[(index + 1) % 6].label);
        assert.equal(await dialog.evaluate(element => element.scrollTop), 0);
        await page.getByRole('button', { name: 'Close project', exact: true }).click();
        assert.equal(await page.locator('dialog[open]').count(), 0);
        // The native close event restores focus asynchronously. Wait for the
        // return lifecycle before directing keyboard input to the next card.
        await page.waitForFunction(() => document.querySelector('.archive-page').dataset.homeIdle === 'true');
      }
      await page.getByRole('button', { name: 'Résumé', exact: true }).click();
      assert.equal(await page.locator('.terminal-title-art').count(), 0);
      assert.ok((await page.locator('dialog').innerText()).includes('Co-First Author'));
      await page.keyboard.press('Escape');
      await page.close();
      console.log(`All six detail pages: ${width}px, content, overflow, navigation, progress and résumé isolation passed.`);
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(failedResponses, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
