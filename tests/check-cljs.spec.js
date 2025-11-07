import { test, expect } from '@playwright/test';

test.describe('Check ClojureScript Execution', () => {
  test('capture all console logs to see if CLJS runs', async ({ page }) => {
    const consoleLogs = [];

    // Capture ALL console messages
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      console.log(`[Console ${msg.type()}]: ${text}`);
    });

    console.log('\n=== Loading page and checking for CLJS logs ===\n');

    await page.goto('/index-local.html', { waitUntil: 'networkidle' });

    // Wait plenty of time for CLJS to initialize
    await page.waitForTimeout(15000);

    console.log('\n=== Checking for specific CLJS log messages ===\n');

    const cljsIndicators = [
      '📦 CLJS: Namespace fm-wallet loading',
      '🚀 CLJS: init function called',
      '🎯 CLJS: mount-root called',
      '🚀 CLJS: fetch-hash-price! called'
    ];

    let cljsExecuting = false;
    for (const indicator of cljsIndicators) {
      const found = consoleLogs.some(log => log.includes(indicator));
      console.log(`${found ? '✅' : '❌'} "${indicator}": ${found ? 'FOUND' : 'NOT FOUND'}`);
      if (found) cljsExecuting = true;
    }

    console.log('\n=== Summary ===');
    console.log(`Total console messages: ${consoleLogs.length}`);
    console.log(`ClojureScript executing: ${cljsExecuting ? '✅ YES' : '❌ NO'}`);

    if (!cljsExecuting) {
      console.log('\n⚠️  ClojureScript is NOT executing!');
      console.log('This explains why the app is stuck on "Loading..."');
      console.log('\nPossible causes:');
      console.log('  1. Scittle not loading/initializing properly');
      console.log('  2. ClojureScript file not being parsed');
      console.log('  3. Reagent dependencies missing');
    }

    // Show first 20 console logs
    console.log('\n=== First 20 Console Logs ===');
    consoleLogs.slice(0, 20).forEach((log, i) => {
      console.log(`${i + 1}. ${log}`);
    });
  });
});
