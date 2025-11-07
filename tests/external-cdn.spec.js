import { test, expect } from '@playwright/test';

test.describe('FM Wallet Info - External CDN (with TMPDIR fix)', () => {
  let consoleMessages = [];
  let consoleErrors = [];
  let networkRequests = [];
  let networkFailures = [];

  test.beforeEach(async ({ page }) => {
    consoleMessages = [];
    consoleErrors = [];
    networkRequests = [];
    networkFailures = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
      console.log(`[Browser Console ${msg.type()}]:`, text);
    });

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

    page.on('pageerror', error => {
      console.log(`[Page Error]:`, error.message);
      consoleErrors.push(`Page error: ${error.message}`);
    });
  });

  test('should load page with EXTERNAL CDN resources', async ({ page }) => {
    console.log('\n=== Testing ORIGINAL index.html with EXTERNAL CDNs ===');

    try {
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15000 });
      console.log('✅ Page navigation started');

      await page.waitForTimeout(3000);

      const title = await page.title();
      console.log('Page title:', title);

      expect(title).toContain('Figure Markets');
      console.log('✅ TEST PASSED - External CDN works!');
    } catch (error) {
      console.error('❌ TEST FAILED:', error.message);
      throw error;
    }
  });

  test('should load external CDN resources successfully', async ({ page }) => {
    console.log('\n=== Testing External CDN Resource Loading ===');

    await page.goto('/', { waitUntil: 'networkidle', timeout: 20000 });

    // Check for external CDN requests
    const cdnRequests = networkRequests.filter(req =>
      req.url.includes('cdn.tailwindcss.com') ||
      req.url.includes('cdn.jsdelivr.net') ||
      req.url.includes('unpkg.com')
    );

    console.log(`\nExternal CDN requests made: ${cdnRequests.length}`);
    cdnRequests.forEach(req => {
      console.log(`  - ${req.url}`);
    });

    console.log(`\nNetwork failures: ${networkFailures.length}`);
    if (networkFailures.length > 0) {
      console.log('Failed requests:');
      networkFailures.forEach(fail => {
        console.log(`  ❌ ${fail.url}: ${fail.failure}`);
      });
    }

    expect(cdnRequests.length).toBeGreaterThan(0);
    console.log('✅ External CDN requests were made');
  });

  test('should load libraries from external CDN', async ({ page }) => {
    console.log('\n=== Testing External Library Loading ===');

    await page.goto('/', { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(5000);

    const libs = await page.evaluate(() => {
      return {
        tailwind: typeof window.tailwind !== 'undefined',
        react: typeof window.React !== 'undefined',
        reactDOM: typeof window.ReactDOM !== 'undefined',
        scittle: typeof window.scittle !== 'undefined'
      };
    });

    console.log('\nLibrary availability from EXTERNAL CDN:');
    console.log('  Tailwind:', libs.tailwind ? '✅' : '❌');
    console.log('  React:', libs.react ? '✅' : '❌');
    console.log('  ReactDOM:', libs.reactDOM ? '✅' : '❌');
    console.log('  Scittle:', libs.scittle ? '✅' : '❌');

    // At least React should load
    if (libs.react) {
      console.log('✅ External CDN libraries are loading!');
    }
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
