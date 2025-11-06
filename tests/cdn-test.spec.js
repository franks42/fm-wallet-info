import { test, expect } from '@playwright/test';

test.describe('CDN Connectivity Test Page', () => {
  test('should load CDN test page', async ({ page }) => {
    await page.goto('/test-cdn.html');

    // Wait for the page to load
    await page.waitForLoadState('load');

    // Check page title
    await expect(page).toHaveTitle('CDN Connectivity Test');

    // Take a screenshot
    await page.screenshot({ path: 'tests/screenshots/cdn-test.png', fullPage: true });
    console.log('Screenshot saved to tests/screenshots/cdn-test.png');

    // Get page content
    const content = await page.content();
    console.log('Page loaded successfully');
  });

  test('should load index page HTML structure', async ({ page }) => {
    // Set a longer timeout for this test
    test.setTimeout(60000);

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Just check if basic HTML loaded
    const title = await page.title();
    console.log('Page title:', title);
    expect(title).toContain('Figure Markets');

    // Take a screenshot
    await page.screenshot({ path: 'tests/screenshots/index-page.png', fullPage: true });
    console.log('Screenshot saved to tests/screenshots/index-page.png');
  });
});
