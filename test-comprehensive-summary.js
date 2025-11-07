const { chromium } = require('playwright');

(async () => {
  const WALLET_NO_VESTING = "pb1dsuqw9wn7r0g8m9pm6em8es3fh0l52zrlequcwvnw5yjfkwrqp5scax55t";

  console.log('\n🧪 Testing Phase 4: Comprehensive Wallet Summary\n');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Log console messages
  page.on('console', msg => console.log('[Browser]', msg.text()));
  page.on('pageerror', err => console.error('[Page Error]', err.message));

  await page.goto('http://localhost:8000');
  console.log('✅ Page loaded');

  // Wait for app to initialize
  await page.waitForTimeout(3000);

  // Fill wallet address and submit
  console.log('\n📝 Entering wallet address:', WALLET_NO_VESTING.substring(0, 20) + '...');
  await page.fill('#wallet-address-input', WALLET_NO_VESTING);
  await page.click('#fetch-wallet-data-button');

  // Wait for API call to complete
  console.log('⏳ Waiting for API response...');
  await page.waitForTimeout(6000);

  // Get the page text
  const appText = await page.textContent('#app');

  console.log('\n=== Test Results ===');

  // Check for Account Information
  if (appText.includes('Account Information')) {
    console.log('✅ Account Information section displayed');
  } else {
    console.log('❌ Account Information section NOT found');
  }

  // Check for Delegation Summary
  if (appText.includes('Delegation Summary')) {
    console.log('✅ Delegation Summary section displayed');
  } else {
    console.log('❌ Delegation Summary section NOT found');
  }

  // Check for specific fields
  const checks = [
    ['Account Type', 'Account type field'],
    ['Is Vesting', 'Vesting status field'],
    ['Assets Under Management', 'AUM field'],
    ['Validators', 'Validators count'],
    ['Staked', 'Staked amount'],
    ['Rewards', 'Rewards amount'],
    ['Total Delegated', 'Total delegation']
  ];

  checks.forEach(([text, description]) => {
    if (appText.includes(text)) {
      console.log(`✅ ${description} present`);
    } else {
      console.log(`❌ ${description} MISSING`);
    }
  });

  // Check for HASH formatting
  if (appText.includes('HASH')) {
    console.log('✅ HASH currency formatting present');
  } else {
    console.log('❌ HASH currency formatting MISSING');
  }

  // Get a snippet of the UI
  const accountInfo = await page.evaluate(() => {
    const app = document.getElementById('app');
    return app ? app.innerText.substring(0, 500) : 'App div not found';
  });

  console.log('\n=== UI Snippet ===');
  console.log(accountInfo);

  await browser.close();

  console.log('\n✅ Test completed');
  process.exit(0);
})().catch(e => {
  console.error('[Test Error]', e.message);
  process.exit(1);
});
