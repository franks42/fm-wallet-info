import { test, expect } from '@playwright/test';

test.describe('Debug Tests - Progressive Complexity', () => {

  test('test 1: plain HTML (no resources)', async ({ page }) => {
    console.log('\n=== TEST 1: Plain HTML ===');

    try {
      await page.goto('/test-plain.html', { waitUntil: 'load', timeout: 10000 });
      console.log('✅ Page loaded successfully');

      const title = await page.title();
      console.log('Page title:', title);

      const h1 = await page.locator('h1').textContent();
      console.log('H1 content:', h1);

      expect(title).toBe('Plain HTML Test');
      expect(h1).toBe('Hello World');

      console.log('✅ TEST 1 PASSED');
    } catch (error) {
      console.error('❌ TEST 1 FAILED:', error.message);
      throw error;
    }
  });

  test('test 2: one small file (React ~11KB)', async ({ page }) => {
    console.log('\n=== TEST 2: One File Load ===');

    try {
      await page.goto('/test-one-file.html', { waitUntil: 'load', timeout: 10000 });
      console.log('✅ Page loaded successfully');

      // Wait a bit for script to execute
      await page.waitForTimeout(1000);

      const title = await page.title();
      console.log('Page title:', title);

      expect(title).toBe('One File Test');

      console.log('✅ TEST 2 PASSED');
    } catch (error) {
      console.error('❌ TEST 2 FAILED:', error.message);
      throw error;
    }
  });

  test('test 3: full local CDN', async ({ page }) => {
    console.log('\n=== TEST 3: Full Local CDN ===');

    try {
      await page.goto('/index-local.html', { waitUntil: 'domcontentloaded', timeout: 10000 });
      console.log('✅ Page navigation started');

      await page.waitForTimeout(2000);

      const title = await page.title();
      console.log('Page title:', title);

      console.log('✅ TEST 3 PASSED');
    } catch (error) {
      console.error('❌ TEST 3 FAILED:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  });
});
