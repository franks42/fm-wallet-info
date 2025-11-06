const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Testing LIVE site: https://franks42.github.io/fm-wallet-info/');
  console.log('⏰ Start time:', new Date().toISOString());
  console.log('');

  let browser;
  let page;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process']
    });

    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      bypassCSP: true
    });

    page = await context.newPage();

    // Collect all console messages
    const consoleMessages = [];
    page.on('console', msg => {
      const timestamp = new Date().toISOString().split('T')[1].substring(0, 12);
      const text = msg.text();
      const message = `[${timestamp}] ${text}`;
      console.log(message);
      consoleMessages.push(message);
    });

    // Capture errors
    page.on('pageerror', error => {
      console.error('❌ PAGE ERROR:', error.message);
    });

    // Monitor critical requests only
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('fm_wallet.cljs')) {
        console.log('📥 ClojureScript file loaded:', response.status());
      } else if (url.includes('scittle.js') && !url.includes('ajax') && !url.includes('reagent')) {
        console.log('📥 Scittle core loaded:', response.status());
      } else if (url.includes('figuremarkets')) {
        console.log('📥 Figure Markets API:', response.status());
        if (response.status() === 200) {
          try {
            const json = await response.json();
            console.log('📊 API returned', json.data ? json.data.length : 0, 'markets');
          } catch (e) {
            console.log('📊 API response not JSON');
          }
        }
      }
    });

    console.log('📄 Navigating to page...');
    await page.goto('https://franks42.github.io/fm-wallet-info/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    }).catch(e => console.log('Navigation warning:', e.message));

    console.log('⏳ Waiting 20 seconds for app to initialize...');
    console.log('');
    await page.waitForTimeout(20000);

    console.log('');
    console.log('==========================================');
    console.log('DIAGNOSTIC RESULTS');
    console.log('==========================================');
    console.log('');

    // Get page info
    const title = await page.title().catch(() => 'UNKNOWN');
    const version = await page.evaluate(() => window.APP_VERSION).catch(() => 'NOT FOUND');

    console.log('📄 Page Title:', title);
    console.log('🔢 App Version:', version);
    console.log('');

    // Check visibility
    const loadingVisible = await page.locator('text=Loading HASH price').isVisible().catch(() => false);
    const errorVisible = await page.locator('text=Error Loading Data').isVisible().catch(() => false);
    const hashCardVisible = await page.locator('h2:has-text("HASH")').isVisible().catch(() => false);
    const priceVisible = await page.locator('text=/\\$\\d+\\.\\d+/').first().isVisible().catch(() => false);

    console.log('🔍 VISIBILITY CHECK:');
    console.log('   Loading spinner:', loadingVisible ? '✅ YES (STUCK!)' : '❌ NO');
    console.log('   Error message:', errorVisible ? '⚠️  YES' : '❌ NO');
    console.log('   HASH card:', hashCardVisible ? '✅ YES' : '❌ NO');
    console.log('   Price displayed:', priceVisible ? '✅ YES (WORKING!)' : '❌ NO');
    console.log('');

    // Check dependencies
    const deps = await page.evaluate(() => ({
      React: typeof React !== 'undefined',
      ReactDOM: typeof ReactDOM !== 'undefined',
      scittle: typeof window.scittle !== 'undefined',
      tailwind: typeof tailwind !== 'undefined'
    })).catch(() => ({}));

    console.log('📦 DEPENDENCIES:');
    console.log('   React:', deps.React ? '✅' : '❌');
    console.log('   ReactDOM:', deps.ReactDOM ? '✅' : '❌');
    console.log('   Scittle:', deps.scittle ? '✅' : '❌');
    console.log('   Tailwind:', deps.tailwind ? '✅' : '❌');
    console.log('');

    // Analyze console logs
    console.log('📝 CONSOLE LOG ANALYSIS:');
    const lastLog = consoleMessages[consoleMessages.length - 1];
    console.log('   Total logs:', consoleMessages.length);
    console.log('   Last log:', lastLog || 'NONE');
    console.log('');

    // Find where it stops
    const checkpoints = [
      { text: 'FM Wallet Info v1.0.1', name: 'App started' },
      { text: 'Tailwind config applied', name: 'Tailwind configured' },
      { text: 'Scittle core loaded', name: 'Scittle loaded' },
      { text: 'React loaded', name: 'React loaded' },
      { text: 'ReactDOM loaded', name: 'ReactDOM loaded' },
      { text: 'Scittle Reagent loaded', name: 'Reagent loaded' },
      { text: 'Window load event fired', name: 'Window loaded' },
      { text: 'CLJS: Namespace fm-wallet loading', name: 'ClojureScript started' },
      { text: 'CLJS: app-state created', name: 'State created' },
      { text: 'CLJS: init function called', name: 'Init called' },
      { text: 'CLJS: mount-root called', name: 'Mount called' },
      { text: 'CLJS: Reagent render complete', name: 'UI rendered' },
      { text: 'CLJS: fetch-hash-price! called', name: 'API fetch started' },
      { text: 'CLJS: Got response', name: 'API responded' },
      { text: 'CLJS: JSON parsed', name: 'Data parsed' },
      { text: 'CLJS: HASH-USD market', name: 'HASH found' },
      { text: 'CLJS: App state updated successfully', name: 'State updated' }
    ];

    console.log('🎯 EXECUTION CHECKPOINTS:');
    let lastCheckpoint = 'None';
    checkpoints.forEach(cp => {
      const found = consoleMessages.some(msg => msg.includes(cp.text));
      console.log(`   ${found ? '✅' : '❌'} ${cp.name}`);
      if (found) lastCheckpoint = cp.name;
    });
    console.log('');
    console.log('🔴 STOPPED AFTER:', lastCheckpoint);
    console.log('');

    // Take screenshot
    try {
      await page.screenshot({ path: 'live-screenshot.png', fullPage: true });
      console.log('📸 Screenshot saved: live-screenshot.png');
    } catch (e) {
      console.log('📸 Could not save screenshot');
    }

    console.log('');
    console.log('==========================================');
    console.log('CONCLUSION');
    console.log('==========================================');
    console.log('');

    if (priceVisible && hashCardVisible) {
      console.log('✅ APP IS WORKING! HASH price is displayed.');
    } else if (loadingVisible) {
      console.log('❌ APP IS STUCK at loading screen.');
      console.log(`   Execution stopped after: ${lastCheckpoint}`);
      console.log('   Check the last console log above for details.');
    } else if (errorVisible) {
      console.log('⚠️  APP LOADED but hit an error.');
    } else {
      console.log('❓ UNKNOWN STATE - check logs and screenshot.');
    }

  } catch (error) {
    console.error('');
    console.error('❌ TEST ERROR:', error.message);
    console.error('   This might be due to network restrictions in test environment');
    console.error('   But the logs above (if any) are still valuable!');
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  console.log('');
  console.log('✅ Test complete');
})();
