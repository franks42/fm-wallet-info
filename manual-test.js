#!/usr/bin/env node

/**
 * Manual browser-free testing script for FM Wallet Info
 * Tests the webpage functionality without requiring Playwright
 */

const http = require('http');
const https = require('https');

const TEST_SERVER = 'http://127.0.0.1:8080';
const TIMEOUT = 10000;

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test HTTP request
function testHTTP(url, description) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, { timeout: TIMEOUT }, (res) => {
      if (res.statusCode === 200 || res.statusCode === 302 || res.statusCode === 301) {
        log(`✅ ${description}: ${res.statusCode}`, 'green');
        resolve({ success: true, status: res.statusCode });
      } else {
        log(`⚠️  ${description}: ${res.statusCode}`, 'yellow');
        resolve({ success: false, status: res.statusCode });
      }
    });

    req.on('error', (error) => {
      log(`❌ ${description}: ${error.message}`, 'red');
      resolve({ success: false, error: error.message });
    });

    req.on('timeout', () => {
      log(`❌ ${description}: Timeout`, 'red');
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
  });
}

// Test page content
function testPageContent(path, expectedContent, description) {
  return new Promise((resolve) => {
    http.get(`${TEST_SERVER}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          const found = expectedContent.every(content =>
            data.includes(content)
          );

          if (found) {
            log(`✅ ${description}: Found all expected content`, 'green');
            resolve({ success: true, found: true });
          } else {
            log(`⚠️  ${description}: Missing some expected content`, 'yellow');
            resolve({ success: true, found: false });
          }
        } else {
          log(`❌ ${description}: Status ${res.statusCode}`, 'red');
          resolve({ success: false, status: res.statusCode });
        }
      });
    }).on('error', (error) => {
      log(`❌ ${description}: ${error.message}`, 'red');
      resolve({ success: false, error: error.message });
    });
  });
}

// Main test suite
async function runTests() {
  log('\n═══════════════════════════════════════════', 'cyan');
  log('  FM WALLET INFO - MANUAL TEST SUITE', 'bold');
  log('═══════════════════════════════════════════\n', 'cyan');

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  // Test 1: Local webserver
  log('\n📌 Testing Local Webserver', 'cyan');
  log('─────────────────────────────');
  results.total++;
  const serverTest = await testHTTP(`${TEST_SERVER}/index.html`, 'GET /index.html');
  if (serverTest.success) results.passed++;
  else results.failed++;

  results.total++;
  const cdnPageTest = await testHTTP(`${TEST_SERVER}/test-cdn.html`, 'GET /test-cdn.html');
  if (cdnPageTest.success) results.passed++;
  else results.failed++;

  // Test 2: CDN Accessibility (from server environment)
  log('\n📌 Testing CDN Accessibility', 'cyan');
  log('─────────────────────────────');

  const cdnTests = [
    { url: 'https://cdn.tailwindcss.com/', desc: 'Tailwind CSS CDN' },
    { url: 'https://cdn.jsdelivr.net/npm/scittle@0.7.28/dist/scittle.js', desc: 'jsDelivr (Scittle)' },
    { url: 'https://unpkg.com/react@18/umd/react.production.min.js', desc: 'unpkg (React)' },
    { url: 'https://www.figuremarkets.com', desc: 'Figure Markets' },
  ];

  for (const test of cdnTests) {
    results.total++;
    const result = await testHTTP(test.url, test.desc);
    if (result.success || result.status === 302 || result.status === 301) {
      results.passed++;
    } else {
      results.failed++;
    }
  }

  // Test 3: Page content
  log('\n📌 Testing Page Content', 'cyan');
  log('─────────────────────────────');

  results.total++;
  const indexContent = await testPageContent(
    '/index.html',
    [
      'Figure Markets',
      'HASH Price',
      'v1.0.1',
      'cdn.tailwindcss.com',
      'cdn.jsdelivr.net',
      'unpkg.com',
      'scittle',
      'fm_wallet.cljs'
    ],
    'Index.html content check'
  );
  if (indexContent.success && indexContent.found) results.passed++;
  else results.failed++;

  results.total++;
  const clojureScriptExists = await testHTTP(`${TEST_SERVER}/src/fm_wallet.cljs`, 'ClojureScript source file');
  if (clojureScriptExists.success) results.passed++;
  else results.failed++;

  // Test 4: Figure Markets API
  log('\n📌 Testing Figure Markets API', 'cyan');
  log('─────────────────────────────');

  results.total++;
  const apiTest = await testHTTP(
    'https://www.figuremarkets.com/service-hft-exchange/api/v1/markets',
    'Figure Markets API'
  );
  if (apiTest.success) results.passed++;
  else results.failed++;

  // Summary
  log('\n═══════════════════════════════════════════', 'cyan');
  log('  TEST SUMMARY', 'bold');
  log('═══════════════════════════════════════════', 'cyan');
  log(`Total Tests: ${results.total}`);
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, results.failed > 0 ? 'yellow' : 'green');
  log('═══════════════════════════════════════════\n', 'cyan');

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});
