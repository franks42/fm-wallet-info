const { chromium } = require('playwright');

async function testHelloWorld() {
  console.log('🧪 Testing Hello World page...');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  let clojureScriptLoaded = false;

  // Listen for console messages
  page.on('console', msg => {
    const text = msg.text();
    console.log(`Browser console: ${text}`);

    if (text.includes('ClojureScript loaded successfully')) {
      console.log('✅ ClojureScript loaded!');
      clojureScriptLoaded = true;
    }

    if (text.includes('Error') || text.includes('❌')) {
      console.log(`❌ Error detected: ${text}`);
    }
  });

  try {
    console.log('📱 Loading http://localhost:8000/...');
    await page.goto('http://localhost:8000/', {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    console.log('⏳ Waiting for #app element...');
    await page.waitForSelector('#app', { timeout: 10000 });

    console.log('⏳ Checking for ClojureScript content...');
    const content = await page.textContent('#app');

    if (content.includes('Hello from ClojureScript')) {
      console.log('✅ Hello World content found!');
    } else {
      console.log('❌ Expected content not found');
      console.log('Actual content:', content);
      return false;
    }

    if (!clojureScriptLoaded) {
      console.log('⚠️  Warning: Console message not detected, but content is there');
    }

    console.log('✅ All checks passed!');
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testHelloWorld().then(success => {
  if (success) {
    console.log('\n🎉 HELLO WORLD TEST PASSED');
  } else {
    console.log('\n🚨 HELLO WORLD TEST FAILED');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
