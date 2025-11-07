const { chromium } = require('playwright');

async function testHashPrice() {
  console.log('🧪 Testing HASH price display...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  let hashPriceFetched = false;
  let hashPriceValue = null;
  let errorOccurred = false;

  // Listen for console messages
  page.on('console', msg => {
    const text = msg.text();
    console.log(`Browser console: ${text}`);

    if (text.includes('HASH price:')) {
      console.log('✅ HASH price fetched!');
      hashPriceFetched = true;
      // Extract price from log
      const match = text.match(/HASH price:\s*([\d.]+)/);
      if (match) {
        hashPriceValue = parseFloat(match[1]);
        console.log(`   Price value: $${hashPriceValue}`);
      }
    }

    if (text.includes('Error') || text.includes('❌')) {
      console.log(`❌ Error detected: ${text}`);
      errorOccurred = true;
    }
  });

  try {
    console.log('📱 Loading http://localhost:8000/...');
    await page.goto('http://localhost:8000/', {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    console.log('⏳ Waiting for app to load...');
    await page.waitForSelector('#app', { timeout: 10000 });

    console.log('⏳ Waiting for price to load (max 10 seconds)...');
    // Wait for either the price display or error message
    await page.waitForFunction(
      () => {
        const appDiv = document.getElementById('app');
        const content = appDiv ? appDiv.textContent : '';
        return content.includes('$') || content.includes('Error');
      },
      { timeout: 10000 }
    );

    // Get the final content
    const content = await page.textContent('#app');
    console.log('📄 Page content includes:', content.substring(0, 100) + '...');

    // Check if price is displayed
    if (content.includes('HASH Price') && content.includes('$')) {
      console.log('✅ HASH price is displayed in UI!');

      // Verify price format
      const priceMatch = content.match(/\$[\d.]+/);
      if (priceMatch) {
        console.log(`✅ Price format is correct: ${priceMatch[0]}`);
      }

      if (!hashPriceFetched) {
        console.log('⚠️  Warning: Console log not detected, but UI shows price');
      }

      return true;
    } else if (content.includes('Error')) {
      console.log('❌ Error message displayed in UI');
      return false;
    } else {
      console.log('❌ Expected content not found');
      console.log('Actual content:', content);
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testHashPrice().then(success => {
  if (success) {
    console.log('\n🎉 HASH PRICE TEST PASSED');
  } else {
    console.log('\n🚨 HASH PRICE TEST FAILED');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
