import { test, expect } from '@playwright/test';

test.describe('FM Wallet Info - Application Screenshot', () => {
  test('capture full application with HASH price', async ({ page }) => {
    console.log('\n=== Loading FM Wallet Info Application ===');

    // Navigate to local CDN version
    await page.goto('/index-local.html', { waitUntil: 'networkidle' });
    console.log('✅ Page loaded');

    // Wait for libraries to load
    await page.waitForTimeout(3000);
    console.log('✅ Libraries loaded (3s wait)');

    // Wait for the app to initialize and potentially fetch data
    await page.waitForTimeout(10000);
    console.log('✅ App initialization time elapsed (10s wait)');

    // Check what's in the #app container
    const appContent = await page.locator('#app').textContent();
    console.log('\n📋 App content:', appContent);

    // Check if libraries loaded
    const libs = await page.evaluate(() => {
      return {
        react: typeof window.React !== 'undefined',
        reactDOM: typeof window.ReactDOM !== 'undefined',
        scittle: typeof window.scittle !== 'undefined',
        tailwind: typeof window.tailwind !== 'undefined'
      };
    });

    console.log('\n📦 Libraries loaded:');
    console.log('  React:', libs.react ? '✅' : '❌');
    console.log('  ReactDOM:', libs.reactDOM ? '✅' : '❌');
    console.log('  Scittle:', libs.scittle ? '✅' : '❌');
    console.log('  Tailwind:', libs.tailwind ? '✅' : '❌');

    // Take full page screenshot
    await page.screenshot({
      path: 'tests/screenshots/app-fullpage.png',
      fullPage: true
    });
    console.log('\n📸 Full page screenshot: tests/screenshots/app-fullpage.png');

    // Take viewport screenshot (what user sees)
    await page.screenshot({
      path: 'tests/screenshots/app-viewport.png'
    });
    console.log('📸 Viewport screenshot: tests/screenshots/app-viewport.png');

    // Get the page title
    const title = await page.title();
    console.log('\n📄 Page title:', title);

    console.log('\n✅ Application capture complete!');
  });
});
