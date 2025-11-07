const { chromium } = require('playwright');

async function testWalletScenario(scenarioName, envVarName) {
  const walletAddress = process.env[envVarName];

  if (!walletAddress) {
    console.log(`⚠️  ${envVarName} not set, skipping ${scenarioName} test`);
    return { skipped: true };
  }

  console.log(`\n🧪 Testing ${scenarioName} (${envVarName})`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set up console monitoring
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(text);
    if (text.includes('✅') || text.includes('❌') || text.includes('💰')) {
      console.log(`  📝 ${text}`);
    }
  });

  try {
    // Navigate to page
    await page.goto('http://localhost:8000', { waitUntil: 'networkidle' });

    // Wait for Scittle to load and render the app
    await page.waitForFunction(
      () => {
        const appDiv = document.getElementById('app');
        return appDiv && appDiv.innerHTML.includes('wallet-address-input');
      },
      { timeout: 20000 }
    );

    // Now wait for the input to be interactive
    await page.waitForSelector('#wallet-address-input', { timeout: 5000 });

    console.log(`  🔍 Entering wallet address...`);

    // Fill wallet address
    await page.fill('#wallet-address-input', walletAddress);

    // Click fetch button
    await page.click('#fetch-wallet-data-button');

    console.log(`  ⏳ Waiting for data to load...`);

    // Wait for either success or error
    await page.waitForFunction(
      () => {
        const html = document.getElementById('app').innerHTML;
        return html.includes('Wallet Account Info') || html.includes('Error');
      },
      { timeout: 15000 }
    );

    // Check if error or success
    const appContent = await page.textContent('#app');

    if (appContent.includes('Error')) {
      console.log(`  ❌ ${scenarioName}: Error state displayed`);
      if (scenarioName === 'Invalid Wallet') {
        console.log(`  ✅ Expected error for invalid wallet`);
        await browser.close();
        return { success: true, expected: 'error' };
      } else {
        await browser.close();
        return { success: false, error: 'Unexpected error' };
      }
    }

    if (appContent.includes('Wallet Account Info')) {
      console.log(`  ✅ ${scenarioName}: Wallet data displayed`);

      // Check for account type
      if (appContent.includes('Account Type')) {
        console.log(`  ✅ Account type displayed`);
      }

      // Check for vesting info
      if (appContent.includes('Is Vesting')) {
        console.log(`  ✅ Vesting status displayed`);

        if (scenarioName === 'Vesting Wallet' && appContent.includes('✅ Yes')) {
          console.log(`  ✅ Vesting account correctly identified`);
        }

        if (scenarioName !== 'Vesting Wallet' && appContent.includes('❌ No')) {
          console.log(`  ✅ Non-vesting account correctly identified`);
        }
      }

      // Check for AUM
      if (appContent.includes('Assets Under Management')) {
        console.log(`  ✅ AUM displayed`);
      }

      await browser.close();
      return { success: true };
    }

    console.log(`  ❌ ${scenarioName}: Unexpected state`);
    await browser.close();
    return { success: false, error: 'Unexpected state' };

  } catch (error) {
    console.error(`  ❌ ${scenarioName}: Error - ${error.message}`);
    await browser.close();
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('🚀 FM Wallet Info - Playwright Tests');
  console.log('Testing wallet info display with all scenarios\n');

  const scenarios = [
    { name: 'Empty Wallet', envVar: 'WALLET_EMPTY' },
    { name: 'No Vesting Wallet', envVar: 'WALLET_NO_VESTING' },
    { name: 'Vesting Wallet', envVar: 'WALLET_VESTING' },
    { name: 'Invalid Wallet', envVar: 'WALLET_INVALID' }
  ];

  const results = [];

  for (const scenario of scenarios) {
    const result = await testWalletScenario(scenario.name, scenario.envVar);
    results.push({ ...scenario, ...result });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));

  let passedCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (const result of results) {
    if (result.skipped) {
      console.log(`⚠️  ${result.name}: Skipped (${result.envVar} not set)`);
      skippedCount++;
    } else if (result.success) {
      console.log(`✅ ${result.name}: Passed`);
      passedCount++;
    } else {
      console.log(`❌ ${result.name}: Failed - ${result.error}`);
      failedCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${results.length} tests`);
  console.log(`✅ Passed: ${passedCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log(`⚠️  Skipped: ${skippedCount}`);
  console.log('='.repeat(60) + '\n');

  if (failedCount > 0) {
    console.error('❌ WALLET INFO TESTS FAILED');
    process.exit(1);
  } else if (passedCount === 0 && skippedCount === results.length) {
    console.error('⚠️  ALL TESTS SKIPPED - No wallet environment variables set');
    process.exit(1);
  } else {
    console.log('🎉 WALLET INFO TESTS PASSED');
    process.exit(0);
  }
}

runAllTests().catch(error => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});
