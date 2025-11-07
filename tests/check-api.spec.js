import { test, expect } from '@playwright/test';

test.describe('Check API Access', () => {
  test('check if Figure Markets API is accessible', async ({ page }) => {
    const networkRequests = [];
    const networkFailures = [];

    // Monitor all network activity
    page.on('request', request => {
      if (request.url().includes('figuremarkets.com')) {
        console.log(`[Request] ${request.method()} ${request.url()}`);
        networkRequests.push({
          method: request.method(),
          url: request.url()
        });
      }
    });

    page.on('response', response => {
      if (response.url().includes('figuremarkets.com')) {
        console.log(`[Response] ${response.status()} ${response.url()}`);
      }
    });

    page.on('requestfailed', request => {
      if (request.url().includes('figuremarkets.com')) {
        console.log(`[FAILED] ${request.url()}`);
        console.log(`  Error: ${request.failure()?.errorText}`);
        networkFailures.push({
          url: request.url(),
          error: request.failure()?.errorText
        });
      }
    });

    console.log('\n=== Loading application and checking API calls ===\n');

    await page.goto('/index-local.html', { waitUntil: 'networkidle' });

    // Wait long enough for app to try API call
    await page.waitForTimeout(15000);

    console.log('\n=== Summary ===');
    console.log(`API requests attempted: ${networkRequests.length}`);
    console.log(`API requests failed: ${networkFailures.length}`);

    if (networkRequests.length === 0) {
      console.log('\n⚠️  No API requests detected - app may not be initializing');
    }

    if (networkFailures.length > 0) {
      console.log('\n❌ API access is blocked:');
      networkFailures.forEach(fail => {
        console.log(`  - ${fail.url}`);
        console.log(`    Error: ${fail.error}`);
      });
    }
  });
});
