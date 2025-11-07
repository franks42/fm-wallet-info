const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('[Console]', msg.text()));
  page.on('pageerror', err => console.error('[PageError]', err.message));

  await page.goto('http://localhost:8000');
  await page.waitForTimeout(5000);

  console.log('=== Checking DOM ===');
  const hasInput = await page.evaluate(() => !!document.getElementById('wallet-address-input'));
  const appHTML = await page.evaluate(() => document.getElementById('app').innerHTML.substring(0, 300));

  console.log('Has input field:', hasInput);
  console.log('App HTML:', appHTML);

  await browser.close();
  process.exit(0);
})().catch(e => {
  console.error('[Test Error]', e.message);
  process.exit(1);
});
