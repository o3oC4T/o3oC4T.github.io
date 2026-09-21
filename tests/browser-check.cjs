const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const base = process.argv[2] || 'http://127.0.0.1:4173';
const names = ['Research', 'CTF', 'RubiyaLAB', 'Team o3o', 'Honors', 'Education'];
const evidence = ['Co-First Author', 'Jinddabi’s', 'THJCC CTF 2026', 'MntcrlCTF 2026', '모두의 창업 1기', '고려대학교'];

(async () => {
  await fs.mkdir('test-results', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const errors = [], badResponses = [];
  const setup = async options => {
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1, reducedMotion: 'reduce', ...options });
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.status() >= 400) badResponses.push([r.status(), r.url()]); });
    // Test-only throttling for software WebGL. Production animation is unchanged.
    await page.addInitScript(() => {
      Object.defineProperty(window, 'devicePixelRatio', { get: () => 0.4 });
      const raf = requestAnimationFrame.bind(window);
      window.requestAnimationFrame = cb => raf(() => setTimeout(() => cb(performance.now()), 100));
    });
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !document.querySelector('.portfolio-loader'), {}, { timeout: 90000 });
    await page.waitForTimeout(1500);
    return page;
  };
  try {
    const desktop = await setup();
    assert.equal(await desktop.locator('.project-box>canvas').count(), 1);
    assert.equal(await desktop.locator('.box-keyboard button').count(), 6);
    await desktop.screenshot({ path: 'test-results/desktop.png', timeout: 30000 });
    for (let index = 0; index < names.length; index++) {
      await desktop.getByRole('button', { name: 'Open ' + names[index], exact: true }).focus();
      await desktop.keyboard.press('Enter');
      await desktop.locator('dialog[open]').waitFor({ timeout: 30000 });
      assert.equal(await desktop.locator('#dialog-title').textContent(), names[index]);
      assert.ok((await desktop.locator('dialog').innerText()).includes(evidence[index]));
      await desktop.screenshot({ path: `test-results/card-${index + 1}.png`, timeout: 30000 });
      await desktop.getByRole('button', { name: 'Close project', exact: true }).click();
      await desktop.waitForTimeout(350);
      assert.equal(await desktop.locator('dialog[open]').count(), 0);
      console.log('Desktop card passed:', names[index]);
    }
    await desktop.getByRole('button', { name: 'About Yeong Choi', exact: true }).click();
    await desktop.waitForFunction(() => document.querySelector('#about-scene').getAttribute('aria-hidden') === 'false');
    await desktop.waitForFunction(() => Number(getComputedStyle(document.querySelector('#about-scene')).opacity) > 0.99);
    assert.ok(await desktop.locator('#about-scene').innerText().then(t => t.includes('Team o3o')));
    await desktop.screenshot({ path: 'test-results/about.png', timeout: 30000 });
    await desktop.keyboard.press('Escape');
    await desktop.getByRole('button', { name: 'Résumé', exact: true }).click();
    assert.ok((await desktop.locator('dialog').innerText()).includes('Co-Second Author'));
    await desktop.emulateMedia({ media: 'print' });
    await desktop.pdf({ path: 'test-results/resume.pdf', format: 'A4', preferCSSPageSize: true });
    await desktop.emulateMedia({ media: 'screen' });
    await desktop.keyboard.press('Escape');
    await desktop.getByRole('button', { name: 'Let’s talk', exact: true }).click();
    assert.equal(await desktop.locator('dialog a[href="https://www.instagram.com/ilh_sh/"]').count(), 1);
    assert.equal(await desktop.locator('dialog a[href*="linkedin"]').count(), 0);
    await desktop.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await desktop.getByRole('button', { name: 'Copy Discord ID you_me._.', exact: true }).click();
    assert.equal(await desktop.evaluate(() => navigator.clipboard.readText()), 'you_me._.');
    await desktop.screenshot({ path: 'test-results/contact.png', timeout: 30000 });
    await desktop.keyboard.press('Escape');
    await desktop.close();
    console.log('About, résumé print and personal contacts passed.');

    const mobile = await setup({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    assert.equal(await mobile.locator('.project-box>canvas').count(), 1);
    assert.ok(await mobile.locator('.minimal-header nav button').evaluateAll(buttons => buttons.every(button => button.scrollWidth <= button.clientWidth + 1)));
    await mobile.screenshot({ path: 'test-results/mobile.png', timeout: 30000 });
    for (let index = 0; index < names.length; index++) {
      await mobile.getByRole('button', { name: 'Select ' + names[index], exact: true }).click();
      await mobile.waitForTimeout(400);
      await mobile.getByRole('button', { name: 'View ' + names[index], exact: true }).click();
      await mobile.locator('dialog[open]').waitFor({ timeout: 30000 });
      assert.equal(await mobile.locator('#dialog-title').textContent(), names[index]);
      assert.ok(await mobile.locator('dialog').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
      if (!index) await mobile.screenshot({ path: 'test-results/mobile-research.png', timeout: 30000 });
      await mobile.getByRole('button', { name: 'Close project', exact: true }).click();
      await mobile.waitForTimeout(350);
      console.log('Mobile card passed:', names[index]);
    }
    await mobile.getByRole('button', { name: 'About me', exact: true }).click();
    assert.ok((await mobile.locator('dialog').innerText()).includes('Yeong Choi'));
    await mobile.getByRole('button', { name: 'Close dialog', exact: true }).click();
    await mobile.getByRole('button', { name: 'Let’s talk', exact: true }).click();
    assert.ok((await mobile.locator('dialog').innerText()).includes('you_me._.'));
    await mobile.getByRole('button', { name: 'Close dialog', exact: true }).click();
    assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await mobile.close();
    console.log('Mobile about, contacts and overflow checks passed.');

    const motion = await setup({ reducedMotion: 'no-preference' });
    await motion.waitForTimeout(4000);
    await motion.getByRole('button', { name: 'Open Research', exact: true }).focus();
    await motion.keyboard.press('Enter');
    await motion.locator('dialog[open]').waitFor({ timeout: 45000 });
    await motion.getByRole('button', { name: 'Close project', exact: true }).click();
    await motion.waitForFunction(() => document.querySelector('.project-box').dataset.flight !== 'true', {}, { timeout: 45000 });
    await motion.getByRole('button', { name: 'Open Education', exact: true }).focus();
    await motion.keyboard.press('Enter');
    await motion.locator('dialog[open]').waitFor({ timeout: 45000 });
    assert.equal(await motion.locator('#dialog-title').textContent(), 'Education');
    await motion.getByRole('button', { name: 'Close project', exact: true }).click();
    await motion.waitForFunction(() => document.querySelector('.project-box').dataset.flight !== 'true', {}, { timeout: 45000 });
    await motion.close();
    console.log('Normal-motion card flight and return passed, including rainbow card.');

    const plain = await browser.newPage();
    await plain.addInitScript(() => {
      const context = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) {
        if (type === 'webgl' || type === 'webgl2') return null;
        return context.call(this, type, ...args);
      };
    });
    await plain.goto(base);
    await plain.locator('.scene-fallback:not([hidden])').waitFor({ timeout: 30000 });
    await plain.locator('.fallback-cards button').first().click();
    assert.equal(await plain.locator('#dialog-title').textContent(), 'Research');
    await plain.close();
    console.log('WebGL unavailable: text fallback passed.');
    assert.deepEqual(errors, []);
    assert.deepEqual(badResponses, []);
    console.log('All checks passed; no page errors or failed responses.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
