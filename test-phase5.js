const { chromium } = require('playwright');

const WALLET_NO_VESTING = "pb1dsuqw9wn7r0g8m9pm6em8es3fh0l52zrlequcwvnw5yjfkwrqp5scax55t";
const WALLET_VESTING = "pb1c9rqwfefggk3s3y79rh8quwvp8rf8ayr7qvmk8";

async function testWallet(browser, walletType, walletAddress) {
  console.log(`\n=== Testing ${walletType} Wallet ===`);
  console.log(`Address: ${walletAddress.substring(0, 20)}...`);

  const page = await browser.newPage();
  page.on('console', msg => console.log(`[${walletType}]`, msg.text()));

  await page.goto('http://localhost:8000');
  await page.waitForTimeout(3000);

  // Fill and submit
  await page.fill('#wallet-address-input', walletAddress);
  await page.click('#fetch-wallet-data-button');

  // Wait for all API calls
  await page.waitForTimeout(8000);

  const appText = await page.textContent('#app');

  // Check for all expected sections
  const checks = [
    ['Account Balance', 'Account Balance section'],
    ['Liquid', 'Liquid field'],
    ['Committed', 'Committed field'],
    ['Delegated', 'Delegated field'],
    ['WALLET TOTAL', 'Wallet total calculation'],
    ['Delegation Details', 'Delegation details section'],
    ['TOTAL DELEGATED', 'Total delegated sum'],
    ['Staked', 'Staked amount'],
    ['Rewards', 'Rewards amount']
  ];

  let passCount = 0;
  checks.forEach(([text, desc]) => {
    if (appText.includes(text)) {
      console.log(`✅ ${desc} present`);
      passCount++;
    } else {
      console.log(`❌ ${desc} MISSING`);
    }
  });

  // Check for unvested and available fields only on vesting wallet
  if (walletType === 'VESTING') {
    if (appText.includes('Unvested')) {
      console.log('✅ Unvested amount present');
      passCount++;
    } else {
      console.log('❌ Unvested amount MISSING');
    }

    if (appText.includes('AVAILABLE')) {
      console.log('✅ Available amount present');
      passCount++;
    } else {
      console.log('❌ Available amount MISSING');
    }
  }

  console.log(`\n${walletType} Result: ${passCount}/${checks.length + (walletType === 'VESTING' ? 2 : 0)} checks passed`);

  await page.close();
  return passCount;
}

(async () => {
  console.log('\n🧪 Testing Phase 5: All Wallet Data (Multi-Endpoint)\n');

  const browser = await chromium.launch();

  const noVestingPasses = await testWallet(browser, 'NO_VESTING', WALLET_NO_VESTING);
  const vestingPasses = await testWallet(browser, 'VESTING', WALLET_VESTING);

  await browser.close();

  console.log('\n=== Summary ===');
  console.log(`NO_VESTING wallet: ${noVestingPasses}/9 checks passed`);
  console.log(`VESTING wallet: ${vestingPasses}/11 checks passed`);

  if (noVestingPasses >= 8 && vestingPasses >= 10) {
    console.log('\n✅ Phase 5 PASSED');
    process.exit(0);
  } else {
    console.log('\n❌ Phase 5 FAILED');
    process.exit(1);
  }
})().catch(e => {
  console.error('[Test Error]', e.message);
  process.exit(1);
});
