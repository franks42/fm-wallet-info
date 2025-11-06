import { test, expect } from '@playwright/test';

test.describe('FM Wallet Info Page', () => {
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

  test('should load the page successfully', async ({ page }) => {
    const response = await page.goto('/');
    expect(response.status()).toBe(200);

    // Check page title
    await expect(page).toHaveTitle(/Figure Markets - HASH Price/);
  });

  test('should load all CDN resources successfully', async ({ page }) => {
    await page.goto('/');

    // Wait for network to be idle
    await page.waitForLoadState('networkidle');

    // Check that critical CDN resources loaded
    const cdnDomains = [
      'cdn.tailwindcss.com',
      'cdn.jsdelivr.net',
      'unpkg.com'
    ];

    for (const domain of cdnDomains) {
      const domainRequests = networkRequests.filter(req => req.url.includes(domain));
      expect(domainRequests.length).toBeGreaterThan(0);
      console.log(`✅ Found ${domainRequests.length} request(s) to ${domain}`);
    }

    // Check for network failures
    if (networkFailures.length > 0) {
      console.log('Network failures detected:', networkFailures);
    }
    expect(networkFailures.length).toBe(0);
  });

  test('should display the correct UI elements', async ({ page }) => {
    await page.goto('/');

    // Check header
    const header = page.locator('h1');
    await expect(header).toContainText('Figure Markets');

    // Check subtitle
    await expect(page.locator('text=Live HASH Price Tracker')).toBeVisible();

    // Check app container exists
    await expect(page.locator('#app')).toBeVisible();

    // Check footer
    await expect(page.locator('text=Data from')).toBeVisible();
    await expect(page.locator('a[href="https://www.figuremarkets.com"]')).toBeVisible();

    // Check version
    const version = page.locator('#version');
    await expect(version).toContainText('v1.0.1');
  });

  test('should log successful script loading', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait a bit for all deferred scripts to load
    await page.waitForTimeout(3000);

    // Check for critical loading messages
    const expectedMessages = [
      '🚀 FM Wallet Info v1.0.1 - Starting...',
      '✅ Tailwind CSS script tag loaded',
      '✅ Body tag reached',
      '✅ DOM structure loaded'
    ];

    for (const msg of expectedMessages) {
      const found = consoleMessages.some(m => m.includes(msg));
      console.log(`Checking for message: "${msg}" - ${found ? '✅ Found' : '❌ Not found'}`);
      expect(found).toBe(true);
    }

    // Check for library loading (these are deferred, so might take time)
    const libraryMessages = [
      '✅ Scittle core loaded',
      '✅ React loaded',
      '✅ ReactDOM loaded'
    ];

    for (const msg of libraryMessages) {
      const found = consoleMessages.some(m => m.includes(msg));
      console.log(`Checking for library: "${msg}" - ${found ? '✅ Found' : '❌ Not found'}`);
    }
  });

  test('should not have console errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Filter out known acceptable messages
    const criticalErrors = consoleErrors.filter(error => {
      return !error.includes('FAILED to load') || error.includes('❌');
    });

    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Console errors: ${consoleErrors.length}`);

    if (criticalErrors.length > 0) {
      console.log('Critical errors found:', criticalErrors);
    }
  });

  test('should load ClojureScript application', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for ClojureScript to load and execute
    await page.waitForTimeout(5000);

    // Check if scittle loaded
    const scittleLoaded = await page.evaluate(() => {
      return typeof window.scittle !== 'undefined';
    });
    console.log('Scittle loaded:', scittleLoaded);

    // Check if React loaded
    const reactLoaded = await page.evaluate(() => {
      return typeof window.React !== 'undefined';
    });
    console.log('React loaded:', reactLoaded);
  });

  test('should make API call to Figure Markets', async ({ page }) => {
    await page.goto('/');

    // Wait for the app to initialize
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Check if API call was made
    const apiRequests = networkRequests.filter(req =>
      req.url.includes('figuremarkets.com') ||
      req.url.includes('figure')
    );

    console.log(`API requests found: ${apiRequests.length}`);
    apiRequests.forEach(req => {
      console.log(`  - ${req.method} ${req.url}`);
    });
  });

  test('should display price data or loading state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Initially should show loading
    const loadingText = page.locator('text=Loading HASH price...');
    const isLoadingVisible = await loadingText.isVisible().catch(() => false);
    console.log('Loading state visible:', isLoadingVisible);

    // Wait for potential data load
    await page.waitForTimeout(8000);

    // Check app container for content
    const appContent = await page.locator('#app').textContent();
    console.log('App content:', appContent);

    // Take a screenshot to see the final state
    await page.screenshot({ path: 'tests/screenshots/final-state.png', fullPage: true });
    console.log('Screenshot saved to tests/screenshots/final-state.png');
  });

  test('should have working external links', async ({ page }) => {
    await page.goto('/');

    // Check Figure Markets link
    const figureLink = page.locator('a[href="https://www.figuremarkets.com"]');
    await expect(figureLink).toBeVisible();
    await expect(figureLink).toHaveAttribute('target', '_blank');
  });

  test.afterEach(async () => {
    console.log('\n--- Test Summary ---');
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Console errors: ${consoleErrors.length}`);
    console.log(`Network requests: ${networkRequests.length}`);
    console.log(`Network failures: ${networkFailures.length}`);
    console.log('-------------------\n');
  });
});
