const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.argv[2] || 'http://127.0.0.1:4173';
const version = '?v=20260930-cursor36';

(async () => {
  const { cards } = await import('../docs/content.js');
  const { theme } = await import('../docs/theme.js');
  const cursorColors = ['white', ...Object.keys(theme.colors)];
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  try {
    for (const mobile of [false, true]) {
      const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 }, isMobile: mobile, hasTouch: mobile });
      const cursorRequests = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (/\/cursor-[a-z]+\.svg/.test(request.url())) cursorRequests.push(request.url()); });
      await page.route('**/assets/archive-scene.js*', route => route.fulfill({ contentType: 'text/javascript', body: 'export function createProjectBox(box, controls) { const state = controls.getState(); controls.registerSelect(index => state.onOpen(index)); state.onReady(); return () => {}; }' }));
      await page.goto(base);
      await page.waitForFunction(() => !document.querySelector('.portfolio-loader'));
      const cursor = () => page.locator('body').evaluate(element => getComputedStyle(element).cursor);
      if (mobile) {
        assert.equal(await page.evaluate(() => matchMedia('(any-hover: hover) and (any-pointer: fine)').matches), false);
        assert.ok(!(await cursor()).includes('cursor-'));
        assert.equal(await page.locator('.profile-touch-cursor').count(), 0, 'No indicator before touching');
        assert.equal(new Set(cursorRequests).size, cursorColors.length, 'Default and six card photo assets preload on mobile');
        await page.getByRole('button', { name: 'Work', exact: true }).tap();
        assert.ok((await page.locator('.profile-touch-cursor').getAttribute('src')).includes('cursor-white.svg'), 'Home navigation uses neutral white');
        for (const card of cards) {
          await page.getByRole('button', { name: `Select ${card.label}`, exact: true }).tap();
          assert.ok((await page.locator('.profile-touch-cursor').getAttribute('src')).includes(`cursor-${card.accent}.svg`));
          assert.equal(await page.locator('.profile-touch-cursor').getAttribute('data-visible'), 'true');
        }
        await page.getByRole('button', { name: 'View Education', exact: true }).tap();
        assert.equal(await page.locator('#dialog-title').textContent(), 'Education');
        assert.ok(!(await page.locator('dialog').evaluate(element => getComputedStyle(element).cursor)).includes('cursor-'));
        const marker = page.locator('.profile-touch-cursor');
        assert.equal(await page.locator('dialog .profile-touch-cursor').count(), 1, 'Touch photo stays above the modal');
        assert.ok((await marker.getAttribute('src')).includes('cursor-rainbow.svg'));
        const client = await page.context().newCDPSession(page);
        const send = (type, points) => client.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([x,y], id) => ({ x, y, id: id + 1, radiusX: 1, radiusY: 1 })) });
        await send('touchStart', [[195, 700]]);
        for (const y of [640, 580, 520, 460, 400]) {
          await send('touchMove', [[195, y]]);
          // Passive native-scroll touchmove delivery is compositor-scheduled.
          await page.waitForFunction(point => {
            const box = document.querySelector('.profile-touch-cursor').getBoundingClientRect();
            return Math.abs(box.x + 18 - point.x) < 1 && Math.abs(box.y + 18 - point.y) < 1;
          }, { x: 195, y }, { timeout: 3000 });
          const bounds = await marker.boundingBox();
          assert.equal(bounds.width, 36);
          assert.equal(bounds.height, 36);
          assert.ok(Math.abs(bounds.x + 18 - 195) < 1 && Math.abs(bounds.y + 18 - y) < 1,
            `Touch photo follows the finger, including native scrolling: ${JSON.stringify({ bounds, x: 195, y, transform: await marker.evaluate(element => element.style.transform) })}`);
          assert.equal(await marker.getAttribute('data-visible'), 'true');
        }
        assert.ok(await page.locator('dialog').evaluate(dialog => dialog.scrollTop > 100), 'The indicator does not block scrolling');
        assert.equal(await page.evaluate(() => document.elementFromPoint(195, 400).classList.contains('profile-touch-cursor')), false);
        await marker.evaluate(image => image.decode());
        await page.screenshot({ path: 'test-results/cursor-mobile.png' });
        await send('touchEnd', []);
        await page.waitForFunction(() => document.querySelector('.profile-touch-cursor').dataset.visible === 'false');
        await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.profile-touch-cursor')).opacity) === 0);
        await send('touchStart', [[150, 350]]);
        assert.equal(await marker.getAttribute('data-visible'), 'true');
        await send('touchStart', [[150, 350], [240, 440]]);
        assert.equal(await marker.getAttribute('data-visible'), 'false', 'Two-finger gestures hide the indicator');
        await send('touchEnd', []);
        await send('touchStart', [[180, 350]]);
        assert.equal(await marker.getAttribute('data-visible'), 'true', 'Single touch resumes after multi-touch');
        await send('touchCancel', []);
        assert.equal(await marker.getAttribute('data-visible'), 'false');
        await page.locator('dialog').evaluate(dialog => { dialog.scrollTop = 0; });
        await page.getByRole('button', { name: 'Close project', exact: true }).tap();
        await page.waitForFunction(() => document.querySelector('.archive-page').dataset.homeIdle === 'true');
        await page.getByRole('button', { name: 'About me', exact: true }).tap();
        assert.equal(await page.locator('.about-dialog .profile-touch-cursor').count(), 1);
        assert.ok((await marker.getAttribute('src')).includes('cursor-white.svg'));
        await send('touchStart', [[195, 300]]);
        const aboutBounds = await marker.boundingBox();
        assert.ok(Math.abs(aboutBounds.x + 18 - 195) < 1 && Math.abs(aboutBounds.y + 18 - 300) < 1, 'Centered inside a non-fullscreen dialog');
        await page.emulateMedia({ media: 'print' });
        assert.equal(await marker.isVisible(), false, 'No touch marker in printed documents');
        await page.emulateMedia({ media: 'screen' });
        await send('touchEnd', []);
        await page.getByRole('button', { name: 'Close dialog', exact: true }).tap();
        await page.waitForFunction(() => document.querySelector('.archive-page').dataset.homeIdle === 'true');
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await client.detach();
      } else {
        assert.ok((await cursor()).includes(`cursor-white.svg${version}`));
        for (const card of cards) {
          await page.getByRole('button', { name: `Open ${card.label}`, exact: true }).focus();
          assert.ok((await cursor()).includes(`cursor-${card.accent}.svg${version}`));
          assert.match(await cursor(), /18 18, auto$/);
        }
        assert.equal(new Set(cursorRequests).size, cursorColors.length, 'Default and all six colors preload before the first card interaction');
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('#dialog-title').textContent(), 'Education');
        assert.ok((await page.locator('.terminal-art-button').evaluate(element => getComputedStyle(element).cursor)).includes('cursor-rainbow.svg'));
        await page.getByRole('button', { name: 'Close project', exact: true }).click();
        await page.waitForFunction(() => document.querySelector('.archive-page').dataset.homeIdle === 'true');
        await page.getByRole('button', { name: 'Résumé', exact: true }).focus();
        assert.ok((await cursor()).includes('cursor-white.svg'), 'Leaving the card restores white');
        assert.equal(await page.locator('.profile-touch-cursor').count(), 0, 'No duplicate cursor for mouse-only interaction');
      }
      await page.close();
      console.log(`${mobile ? 'Touch' : 'Desktop'}: cursor selection, center hotspot, dialog interaction and loading behavior passed.`);
    }
    const gallery = await browser.newPage({ viewport: { width: 800, height: 370 }, deviceScaleFactor: 2 });
    gallery.on('pageerror', error => errors.push(error.message));
    await gallery.route('**/__cursor-gallery', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Cursor preview</title>' }));
    await gallery.goto(base + '/__cursor-gallery');
    // Native OS cursors are not included in browser screenshots. Display the
    // same SVG files at their true size and enlarged for visual inspection.
    await gallery.setContent(`<style>body{margin:0;font:12px monospace;background:#0c0910;color:#d2c3d5}h1{font:14px monospace;margin:24px}.row{display:flex;justify-content:space-around;padding:14px 24px}.cell{width:84px;text-align:center}.cell p{margin:8px 0}.actual img{width:36px;height:36px}.large img{width:104px;height:104px}.light{background:#f5eef3;color:#332632}</style><h1>36px profile cursor · 18% pastel tint</h1>${['actual', 'large', 'actual light'].map(kind => `<div class="row ${kind}">${cursorColors.map(color => `<div class="cell"><img src="${base}/assets/cursor-${color}.svg${version}" alt="${color}">${kind === 'actual' ? `<p>${color}</p>` : ''}</div>`).join('')}</div>`).join('')}`);
    await gallery.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
    const pixels = await gallery.locator('.actual:not(.light) img').evaluateAll(images => images.map(image => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 36;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      const pixel = (x, y) => [...context.getImageData(x, y, 1, 1).data];
      return { size: [image.naturalWidth, image.naturalHeight], corners: [pixel(0,0),pixel(35,0),pixel(0,35),pixel(35,35)], center: pixel(18,18), forehead: pixel(18,10), eye: pixel(10,18) };
    }));
    for (const image of pixels) {
      assert.deepEqual(image.size, [36, 36]);
      assert.ok(image.corners.every(pixel => pixel[3] === 0), 'Transparent outside the circle');
      assert.equal(image.center[3], 255, 'No hole in the photo');
      assert.ok(image.forehead.some((channel, i) => i < 3 && Math.abs(channel - image.eye[i]) > 20), 'Photo detail survives native cursor image decoding');
    }
    assert.equal(new Set(pixels.map(image => image.center.join(','))).size, cursorColors.length, 'Distinct subtle color tints');
    await gallery.screenshot({ path: 'test-results/cursor-gallery.png' });
    await gallery.close();
    assert.deepEqual(errors, []);
    console.log('White default and six card SVGs decode with photo detail, transparent corners, intact centers and distinct tints.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
