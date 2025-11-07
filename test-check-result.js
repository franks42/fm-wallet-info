const { chromium } = require('playwright');

(async () => {
  const walletAddress = process.env.WALLET_EMPTY;

  if (!walletAddress) {
    console.error('❌ WALLET_EMPTY not set');
    process.exit(1);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('[Console]', msg.text()));

  await page.goto('http://localhost:8000');
  await page.waitForTimeout(3000);

  // Fill and submit
  await page.fill('#wallet-address-input', walletAddress);
  await page.click('#fetch-wallet-data-button');

  // Wait longer
  await page.waitForTimeout(8000);

  const appHTML = await page.evaluate(() => document.getElementById('app').innerHTML);
  console.log('\n=== App HTML ===');
  console.log(appHTML.substring(0, 1000));

  await browser.close();
  process.exit(0);
})().catch(e => {
  console.error('[Test Error]', e.message);
  process.exit(1);
});
