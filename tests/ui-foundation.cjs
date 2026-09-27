// Deterministic UI check: no real user data or provider requests.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, permissions: ['microphone'] });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const state = { profile: { name: '', strengths: '', workingOn: '', intention: '', situations: '', focus: '', coachingStyle: 'gentle', voicePreset: 'default' }, attempts: [], messages: [], scenarios: [], completed: [], memory: { status: 'off' }, capabilities: { mode: 'preview', gemini: false, transcription: false, speech: false, memory: false, database: 'local', voices: [] } };
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/personal-voice') return route.fulfill({json:null});
    if (path === '/api/state') return route.fulfill({ json: state });
    if (path === '/api/profile') { state.profile = route.request().postDataJSON(); return route.fulfill({ json: state.profile }); }
    return route.fulfill({ status: 503, json: { error: 'Provider request intentionally disabled during UI testing.' } });
  });
  try {
    await page.goto(process.env.TEST_ORIGIN || 'http://127.0.0.1:3000');
    await page.getByRole('button', { name: 'Just want a quick practice?', exact: true }).waitFor();
    assert.equal(await page.getByRole('navigation').getByRole('button').count(), 4);
    await page.locator('.plan-intro img').waitFor();
    fs.mkdirSync('test-results', { recursive: true });
    await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true, animations: 'disabled' });
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Home overflow at ${width}`);
      for (const tab of ['Yoro', 'Voices', 'My Voice', 'Today']) {
        await page.getByRole('navigation').getByRole('button', { name: tab, exact: true }).click();
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${tab} overflow at ${width}`);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true, animations: 'disabled' });
    await page.getByRole('navigation').getByRole('button', { name: 'My Voice', exact: true }).click();
    assert.equal(await page.locator('main textarea').count(),0);
    assert.equal(await page.locator('.progress-numbers').evaluate(el=>getComputedStyle(el).display),'flex');
    for(const [field,value] of [['Call me','Armaan'],['My direction','Clear, direct, and approachable'],['Keep what makes me, me','Confidence']]){
      await page.locator('.profile-item-toggle').filter({hasText:field}).click();
      await page.getByLabel(field,{exact:true}).fill(value);
      await page.getByRole('button',{name:'Save change',exact:true}).click();
      await page.getByText('Profile saved.', { exact: false }).waitFor();
    }
    await page.getByRole('navigation').getByRole('button', { name: 'Today', exact: true }).click();
    await page.getByRole('heading', { name: 'Hey Armaan.' }).waitFor();
    await page.getByRole('heading', {name:'What are you preparing for?'}).waitFor();
    await page.reload();
    await page.getByRole('heading', { name: 'Hey Armaan.' }).waitFor();
    await page.getByRole('button', { name: 'Just want a quick practice?', exact: true }).click();
    await page.getByRole('button', { name: 'Back to Today', exact: false }).click();
    await page.getByRole('button', { name: 'Just want a quick practice?', exact: true }).click();
    assert.equal(await page.getByRole('navigation').getByRole('button', { name: 'Today', exact: true }).getAttribute('aria-current'), 'page');
    await page.getByRole('button', { name: 'Record response', exact: true }).click();
    await page.getByRole('button', { name: /Stop recording/ }).waitFor();
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: /Stop recording/ }).click();
    await page.getByLabel('Your recorded response', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Try preview exercise', exact: true }).click();
    await page.getByRole('alert').getByText('Provider request intentionally disabled during UI testing.').waitFor();
    await page.screenshot({ path: 'test-results/practice-mobile.png', fullPage: true });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.getByRole('navigation').getByRole('button', { name: 'Today', exact: true }).click();
    assert.equal(await page.locator('.plan-intro img').evaluate(el => getComputedStyle(el).animationName), 'none');
    assert.deepEqual(errors, []);
    console.log('PASS: five widths across all four destinations, working entry points, profile-to-home continuity and reload, fake microphone capture, error recovery, reduced motion, no browser errors.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
