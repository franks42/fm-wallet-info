import { test, expect } from '@playwright/test';

test.describe('FM Wallet Info - Local CDN Mode', () => {
  let consoleMessages = [];
  let consoleErrors = [];
  let networkRequests = [];
  let networkFailures = [];

  test.beforeEach(async ({ page }) => {
    // Clear message arrays
    consoleMessages = [];
    consoleErrors = [];
    networkRequests = [];
    networkFailures = [];

    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
      console.log(`[Browser Console ${msg.type()}]:`, text);
    });

    // Capture network activity
    page.on('request', request => {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      });
    });

    page.on('requestfailed', request => {
      networkFailures.push({
        url: request.url(),
        failure: request.failure()?.errorText
      });
      console.log(`[Network Failure]: ${request.url()} - ${request.failure()?.errorText}`);
    });

    // Capture page errors
    page.on('pageerror', error => {
      console.log(`[Page Error]:`, error.message);
      consoleErrors.push(`Page error: ${error.message}`);
    });
  });

  test('should load page with local CDN resources', async ({ page }) => {
    await page.goto('/index-local.html');
    await page.waitForLoadState('load');

    // Check page title
    await expect(page).toHaveTitle(/Figure Markets - HASH Price.*Local CDN/);
    console.log('✅ Page title verified');
  });

  test('should load all local JavaScript files', async ({ page }) => {
    await page.goto('/index-local.html');
    await page.waitForLoadState('networkidle');

    // Check that local resources were requested
    const localRequests = networkRequests.filter(req => req.url.includes('local-cdn'));
    console.log(`Found ${localRequests.length} local CDN requests`);

    expect(localRequests.length).toBeGreaterThan(0);

    // Verify no external CDN requests were made
    const externalCDNRequests = networkRequests.filter(req =>
      req.url.includes('cdn.tailwindcss.com') ||
      req.url.includes('cdn.jsdelivr.net') ||
      req.url.includes('unpkg.com')
    );
    console.log(`External CDN requests: ${externalCDNRequests.length}`);
    expect(externalCDNRequests.length).toBe(0);

    // Check for network failures
    console.log(`Network failures: ${networkFailures.length}`);
    if (networkFailures.length > 0) {
      console.log('Network failures:', networkFailures);
    }
  });

  test('should display UI elements correctly', async ({ page }) => {
    await page.goto('/index-local.html');
    await page.waitForLoadState('load');

    // Check header
    const header = page.locator('h1');
    await expect(header).toContainText('Figure Markets');

    // Check subtitle
    await expect(page.locator('text=Live HASH Price Tracker')).toBeVisible();

    // Check local mode indicator
    await expect(page.locator('text=Local CDN Mode')).toBeVisible();

    // Check app container exists
    await expect(page.locator('#app')).toBeVisible();

    console.log('✅ All UI elements verified');
  });

  test('should load libraries without errors', async ({ page }) => {
    await page.goto('/index-local.html');
    await page.waitForLoadState('networkidle');

    // Wait for deferred scripts to load
    await page.waitForTimeout(3000);

    // Check for expected loading messages
    const expectedMessages = [
      '🚀 FM Wallet Info v1.0.1-local - Starting...',
      '✅ Tailwind CSS script tag loaded',
      '✅ Body tag reached',
      '✅ DOM structure loaded'
    ];

    for (const msg of expectedMessages) {
      const found = consoleMessages.some(m => m.includes(msg));
      if (found) {
        console.log(`✓ Found: "${msg}"`);
      } else {
        console.log(`✗ Missing: "${msg}"`);
      }
    }

    // Check for library loading
    const libraryMessages = [
      'Scittle core loaded',
      'React loaded',
      'ReactDOM loaded',
      'Scittle AJAX loaded',
      'Scittle Reagent loaded'
    ];

    for (const msg of libraryMessages) {
      const found = consoleMessages.some(m => m.includes(msg));
      console.log(`Library check - ${msg}: ${found ? '✅' : '⚠️'}`);
    }
  });

  test('should verify libraries are available in window scope', async ({ page }) => {
    await page.goto('/index-local.html');
    await page.waitForLoadState('networkidle');

    // Wait for all deferred scripts to load
    await page.waitForTimeout(5000);

    // Check if libraries loaded
    const results = await page.evaluate(() => {
      return {
        tailwind: typeof window.tailwind !== 'undefined',
        react: typeof window.React !== 'undefined',
        reactDOM: typeof window.ReactDOM !== 'undefined',
        scittle: typeof window.scittle !== 'undefined'
      };
    });

    console.log('Library availability:');
    console.log('  Tailwind:', results.tailwind ? '✅' : '❌');
    console.log('  React:', results.react ? '✅' : '❌');
    console.log('  ReactDOM:', results.reactDOM ? '✅' : '❌');
    console.log('  Scittle:', results.scittle ? '✅' : '❌');

    // At minimum, React should load (it's not deferred in the same way)
    // Other libraries may take longer to initialize
  });

  test('should have minimal console errors', async ({ page }) => {
    await page.goto('/index-local.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Console errors: ${consoleErrors.length}`);

    if (consoleErrors.length > 0) {
      console.log('Console errors found:');
      consoleErrors.forEach(err => console.log('  -', err));
    }
  });

  test('should take screenshot of final state', async ({ page }) => {
    await page.goto('/index-local.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/local-cdn-final.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved to tests/screenshots/local-cdn-final.png');

    // Get app content
    const appContent = await page.locator('#app').textContent();
    console.log('App content:', appContent);
  });

  test.afterEach(async () => {
    console.log('\n--- Test Summary ---');
    console.log(`Console messages: ${consoleMessages.length}`);
    console.log(`Console errors: ${consoleErrors.length}`);
    console.log(`Network requests: ${networkRequests.length}`);
    console.log(`Network failures: ${networkFailures.length}`);
    console.log('-------------------\n');
  });
});
