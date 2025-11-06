const { chromium } = require('playwright');

// Get URL from command line argument or use default
const url = process.argv[2] || 'http://localhost:8080';

(async () => {
  console.log('🚀 Testing URL:', url);
  console.log('⏰ Start time:', new Date().toISOString());
  console.log('');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect all console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const timestamp = new Date().toISOString().split('T')[1];
    const message = `[${timestamp}] [${msg.type().toUpperCase()}] ${msg.text()}`;
    console.log(message);
    consoleMessages.push(message);
  });

  // Capture errors
  page.on('pageerror', error => {
    console.error('❌ PAGE ERROR:', error.message);
  });

  // Monitor network requests
  page.on('request', request => {
    const url = request.url();
    if (url.includes('tailwindcss') || url.includes('scittle') || url.includes('react') ||
        url.includes('figuremarkets') || url.includes('fm_wallet.cljs')) {
      console.log('📤 REQUEST:', url.substring(0, 80));
    }
  });

  page.on('response', response => {
    const url = response.url();
    if (url.includes('tailwindcss') || url.includes('scittle') || url.includes('react') ||
        url.includes('figuremarkets') || url.includes('fm_wallet.cljs')) {
      console.log('📥 RESPONSE:', response.status(), url.substring(0, 60));
    }
  });

  console.log('📄 Loading page...');
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) {
    console.log('⚠️  Page load timeout or error (continuing anyway):', e.message);
  }

  console.log('');
  console.log('⏳ Waiting 15 seconds for app to initialize...');
  console.log('');
  await page.waitForTimeout(15000);

  console.log('');
  console.log('==========================================');
  console.log('DIAGNOSTIC RESULTS');
  console.log('==========================================');
  console.log('');

  // Check page title
  const title = await page.title();
  console.log('📄 Page Title:', title);

  // Check for version
  const version = await page.evaluate(() => window.APP_VERSION).catch(() => 'NOT FOUND');
  console.log('🔢 App Version:', version);

  // Check what's visible
  const loadingVisible = await page.locator('text=Loading HASH price').isVisible().catch(() => false);
  console.log('🔄 Loading spinner visible:', loadingVisible ? '✅ YES (STUCK)' : '❌ NO (good)');

  const errorVisible = await page.locator('text=Error Loading Data').isVisible().catch(() => false);
  console.log('⚠️  Error message visible:', errorVisible ? '✅ YES (error occurred)' : '❌ NO');

  const hashCardVisible = await page.locator('h2:has-text("HASH")').isVisible().catch(() => false);
  console.log('💎 HASH card visible:', hashCardVisible ? '✅ YES (working!)' : '❌ NO');

  // Check for global objects
  const hasReact = await page.evaluate(() => typeof React !== 'undefined').catch(() => false);
  const hasReactDOM = await page.evaluate(() => typeof ReactDOM !== 'undefined').catch(() => false);
  const hasScittle = await page.evaluate(() => typeof window.scittle !== 'undefined').catch(() => false);

  console.log('');
  console.log('📦 Dependencies loaded:');
  console.log('   React:', hasReact ? '✅' : '❌');
  console.log('   ReactDOM:', hasReactDOM ? '✅' : '❌');
  console.log('   Scittle:', hasScittle ? '✅' : '❌');

  // Get app state if available
  try {
    const appState = await page.evaluate(() => {
      // Try to access Scittle's internal state
      if (window.scittle && window.scittle.core) {
        return 'Scittle loaded';
      }
      return 'Scittle not accessible';
    });
    console.log('🔍 Scittle state:', appState);
  } catch (e) {
    console.log('🔍 Could not access Scittle state');
  }

  // Take screenshot
  await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
  console.log('');
  console.log('📸 Screenshot saved to: debug-screenshot.png');

  console.log('');
  console.log('==========================================');
  console.log('CONCLUSION');
  console.log('==========================================');

  if (hashCardVisible) {
    console.log('✅ APP IS WORKING! HASH card displayed successfully.');
  } else if (loadingVisible) {
    console.log('❌ APP IS STUCK on loading screen.');
    console.log('   Check console logs above for where it stopped.');
  } else if (errorVisible) {
    console.log('⚠️  APP LOADED but encountered an error.');
  } else {
    console.log('❓ UNKNOWN STATE - check screenshot and logs.');
  }

  await browser.close();
  console.log('');
  console.log('✅ Test complete');
})();
