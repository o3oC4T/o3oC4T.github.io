const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const { mkdir } = require('node:fs/promises');
const base = process.argv[2] || 'http://127.0.0.1:4173';
const renderer = 'export function createProjectBox(box, controls) { const state = controls.getState(); controls.registerSelect(index => state.onOpen(index)); state.onReady(); return () => {}; }';

(async () => {
  await mkdir('test-results', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  async function setup(mobile = false, reducedMotion = 'no-preference') {
    const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 }, isMobile: mobile, hasTouch: mobile, reducedMotion });
    page.setDefaultTimeout(10000);
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/assets/archive-scene.js*', route => route.fulfill({ contentType: 'text/javascript', body: renderer }));
    await page.route('**/assets/textures.js', route => route.fulfill({ contentType: 'text/javascript', body: 'export function createProjectTexturePixels() { return {}; }' }));
    await page.goto(base);
    await page.waitForFunction(() => !document.querySelector('.portfolio-loader'));
    return page;
  }
  const color = page => page.locator('.cursor-trail > img').evaluateAll(images => {
    const colors = new Set(images.map(image => image.getAttribute('src').match(/cursor-([a-z]+)\.svg/)[1]));
    return colors.size === 1 ? [...colors][0] : 'mixed';
  });
  const sweep = async (page, y = 450) => {
    await page.mouse.move(300, y);
    for (const x of [340, 380, 420, 460, 500, 540, 580]) {
      await page.mouse.move(x, y);
      await page.waitForTimeout(16);
    }
  };
  try {
    const page = await setup();
    assert.equal(await page.locator('.cursor-trail').count(), 0, 'No overlay until pointer movement');
    await sweep(page);
    assert.equal(await page.locator('.cursor-trail > img').count(), 4);
    assert.equal(await color(page), 'white');
    await page.locator('.cursor-trail > img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
    const dots = await page.locator('.cursor-trail > img').evaluateAll(elements => elements.map(element => {
      const bounds = element.getBoundingClientRect(), style = getComputedStyle(element);
      return { size: bounds.width, x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2, opacity: +style.opacity, pointerEvents: style.pointerEvents, radius: style.borderRadius };
    }));
    assert.deepEqual(dots.map(dot => Math.round(dot.size)), [26, 21, 16, 11]);
    for (let index = 0; index < dots.length; index++) {
      assert.equal(dots[index].pointerEvents, 'none');
      assert.equal(dots[index].radius, '50%');
      assert.ok(Math.abs(dots[index].y - 450) < 1);
      assert.ok(dots[index].x < 580);
      if (index) {
        assert.ok(dots[index].x < dots[index - 1].x, 'Four successive trailing positions');
        assert.ok(dots[index].opacity < dots[index - 1].opacity, 'Progressively fainter circles');
      }
    }
    assert.equal(await page.locator('.cursor-trail').getAttribute('aria-hidden'), 'true');
    assert.equal(await page.evaluate(() => document.elementFromPoint(580, 450).closest('.cursor-trail')), null);
    await page.screenshot({ path: 'test-results/trail-desktop.png' });
    await page.waitForFunction(() => document.querySelector('.cursor-trail').hidden);
    const settled = await page.locator('.cursor-trail').innerHTML();
    await page.waitForTimeout(100);
    assert.equal(await page.locator('.cursor-trail').innerHTML(), settled, 'No updates after the fade ends');
    await page.getByRole('button', { name: 'Open CTF', exact: true }).focus();
    await sweep(page);
    assert.equal(await color(page), 'sky');
    await page.keyboard.press('Enter');
    assert.ok(await page.locator('.cursor-trail').isHidden(), 'Opening a dialog clears the old trail');
    await sweep(page);
    assert.equal(await page.locator('dialog .cursor-trail > img').count(), 4, 'Trail belongs to the modal top layer');
    assert.equal(await color(page), 'sky');
    const modalBounds = await page.locator('.cursor-trail').boundingBox();
    assert.equal(modalBounds.x, 0);
    assert.equal(modalBounds.y, 0);
    await page.getByRole('button', { name: 'Close project', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.archive-page').dataset.homeIdle === 'true');
    await sweep(page);
    assert.equal(await page.locator('body > .cursor-trail').count(), 1);
    assert.equal(await page.locator('.cursor-trail > img').count(), 4, 'Nodes are reused');
    await page.emulateMedia({ media: 'print' });
    assert.ok(await page.locator('.cursor-trail').isHidden());
    await page.emulateMedia({ media: 'screen', reducedMotion: 'reduce' });
    await sweep(page);
    assert.ok(await page.locator('.cursor-trail').isHidden());
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await sweep(page);
    assert.ok(await page.locator('.cursor-trail').isVisible());
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    assert.ok(await page.locator('.cursor-trail').isHidden());
    await page.close();
    console.log('Mouse: four fading circles, white/card colors, modal layering, idle stop and reduced motion passed.');

    const mobile = await setup(true);
    await mobile.getByRole('button', { name: 'Select Education', exact: true }).tap();
    await mobile.getByRole('button', { name: 'View Education', exact: true }).tap();
    const client = await mobile.context().newCDPSession(mobile);
    const send = (type, points) => client.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([x, y], id) => ({ x, y, id: id + 1, radiusX: 1, radiusY: 1 })) });
    await send('touchStart', [[195, 700]]);
    for (const y of [640, 580, 520, 460, 400]) {
      await send('touchMove', [[195, y]]);
      await mobile.waitForFunction(y => {
        const box = document.querySelector('.profile-touch-cursor').getBoundingClientRect();
        return Math.abs(box.y + 18 - y) < 1;
      }, y);
    }
    assert.equal(await mobile.locator('dialog .cursor-trail > img').count(), 4);
    assert.equal(await color(mobile), 'rainbow');
    assert.ok(await mobile.locator('dialog').evaluate(el => el.scrollTop > 100), 'Native touch scrolling is unaffected');
    await mobile.screenshot({ path: 'test-results/trail-mobile.png' });
    await send('touchStart', [[195, 400], [245, 450]]);
    assert.ok(await mobile.locator('.cursor-trail').isHidden(), 'No trail during pinch');
    await send('touchEnd', []);
    await send('touchStart', [[195, 450]]);
    await send('touchMove', [[195, 400]]);
    await mobile.waitForFunction(() => !document.querySelector('.cursor-trail').hidden);
    await send('touchCancel', []);
    assert.ok(await mobile.locator('.cursor-trail').isHidden());
    await client.detach();
    await mobile.close();
    const reduced = await setup(false, 'reduce');
    await sweep(reduced);
    assert.equal(await reduced.locator('.cursor-trail').count(), 0, 'Reduced motion never allocates trailing dots');
    await reduced.close();
    assert.deepEqual(errors, []);
    console.log('Touch: scrolling, photo cursor, modal tint, pinch/cancel and reduced-motion behavior passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
