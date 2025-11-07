# Playwright Working Solution

**Date:** 2025-11-07
**Status:** ✅ **FULLY WORKING**

## Summary

Playwright browser tests **DO WORK** in the Claude Code environment when:
1. CDN resources are downloaded locally
2. A custom TMPDIR is used to avoid `/tmp` permission issues

## The Problem

Initial attempts to run Playwright tests failed with:
```
Error: page.goto: Page crashed
```

This appeared to be:
1. ❌ Initially thought to be CDN network restrictions
2. ❌ Then thought to be fundamental Chromium sandbox limitations
3. ✅ **Actually caused by `/tmp` directory permission issues**

## Root Cause

The `/tmp` directory in Claude Code environment has permission restrictions:
- Owned by `claude:ubuntu`
- Some processes (like `apt-key`, Chromium sub-processes) run as different users
- Cannot create temporary files: `Permission denied` errors
- This breaks Chromium's ability to function

## The Solution

### 1. Download CDN Resources Locally

```bash
mkdir -p local-cdn/{tailwind,scittle,react}
curl -L -o local-cdn/tailwind/tailwindcss.js "https://cdn.tailwindcss.com"
curl -L -o local-cdn/scittle/scittle.js "https://cdn.jsdelivr.net/npm/scittle@0.7.28/dist/scittle.js"
# ... (download all other resources)
```

### 2. Use Custom TMPDIR

The key fix is setting a custom temp directory:

```bash
export TMPDIR=/home/user/fm-wallet-info/.tmp
export TMP=/home/user/fm-wallet-info/.tmp
export TEMP=/home/user/fm-wallet-info/.tmp
```

### 3. Use the Wrapper Script

Created `run-playwright.sh` that:
- Creates the custom temp directory
- Sets environment variables
- Runs Playwright

Usage:
```bash
./run-playwright.sh test [test-files] [options]
```

## Test Results

### Before Fix
```
❌ All tests failed: "Page crashed"
❌ Even plain HTML with no resources crashed
❌ 0/7 tests passed
```

### After Fix
```
✅ Plain HTML test: PASSED
✅ One file load test: PASSED
✅ Full local CDN test: PASSED
✅ All 7 local-cdn.spec.js tests: PASSED
✅ All libraries load correctly
✅ Zero network failures
```

## What Works Now

### Progressive Complexity Tests

1. **Plain HTML (no external resources)**
   ```
   ✅ Loads and renders
   ✅ JavaScript executes
   ✅ DOM queries work
   ```

2. **One File Load (React ~11KB)**
   ```
   ✅ Loads from local-cdn/
   ✅ Script executes
   ✅ React available in window scope
   ```

3. **Full Local CDN (all 6 files, ~1.5MB)**
   ```
   ✅ All files load successfully
   ✅ Tailwind CSS: loaded and configured
   ✅ React: available
   ✅ ReactDOM: available
   ✅ Scittle: available
   ✅ Zero network errors
   ```

### Complete Local CDN Test Suite

From `tests/local-cdn.spec.js` (7 tests):
- ✅ Page loads with local CDN resources
- ✅ All local JavaScript files load
- ✅ UI elements display correctly
- ✅ Libraries load without errors
- ✅ Libraries available in window scope
- ✅ Minimal console errors
- ✅ Screenshot captured successfully

## Key Findings

### Question 1: Can CDN domains be accessed?
**Answer:** YES - All domains accessible via cURL (100% success)

| Domain | Status |
|--------|--------|
| cdn.tailwindcss.com | ✅ 302 |
| cdn.jsdelivr.net | ✅ 200 |
| unpkg.com | ✅ 200 |
| www.figuremarkets.com | ✅ 200 |
| franks42.github.io | ✅ 404* |

*Domain accessible, no content at root

### Question 2: Does Playwright work with local CDN?
**Answer:** YES - When using custom TMPDIR

**With external CDNs + default /tmp:**
- ❌ Network failures in browser
- ❌ Page crashes

**With local CDN + default /tmp:**
- ✅ No network failures
- ❌ Still crashes (temp file issues)

**With local CDN + custom TMPDIR:**
- ✅ No network failures
- ✅ No crashes
- ✅ **EVERYTHING WORKS**

### Question 3: What causes the crash?
**Answer:** `/tmp` directory permission issues

Evidence:
```bash
# From Playwright install log:
Couldn't create temporary file /tmp/apt.conf...
Permission denied

# Chromium errors:
Failed to read /proc/sys/fs/inotify/max_user_watches
incorrect payload size 0
```

## Usage Instructions

### Running Tests

```bash
# Run all tests
./run-playwright.sh test

# Run specific test file
./run-playwright.sh test tests/local-cdn.spec.js

# Run with reporter
./run-playwright.sh test --reporter=list

# Run in headed mode (if display available)
./run-playwright.sh test --headed
```

### Alternative: Direct Environment Variables

```bash
TMPDIR=/home/user/fm-wallet-info/.tmp \
TMP=/home/user/fm-wallet-info/.tmp \
TEMP=/home/user/fm-wallet-info/.tmp \
npx playwright test
```

## Files Created

### Test Files
- `tests/local-cdn.spec.js` - Comprehensive local CDN tests (7 tests)
- `tests/debug-test.spec.js` - Progressive complexity tests (3 tests)
- `test-plain.html` - Plain HTML with no resources
- `test-one-file.html` - Single file load test

### Application Files
- `index-local.html` - Local CDN version of main app
- `local-cdn/` - All downloaded CDN resources (~1.5MB)

### Scripts & Config
- `run-playwright.sh` - Wrapper script with TMPDIR fix ⭐
- `playwright.config.js` - Playwright configuration
- `curl-test.sh` - cURL-based testing (still works)

### Documentation
- `TEST_RESULTS.md` - Initial CDN accessibility testing
- `LOCAL_CDN_TESTING.md` - Local CDN approach documentation
- `PLAYWRIGHT_FIX.md` - This file (complete solution)

## Conclusions

### What We Learned

1. **External CDN access works** - All domains accessible from environment
2. **Playwright CAN work in Claude Code** - Not fundamentally broken
3. **The issue was environmental** - `/tmp` permissions, not Chromium itself
4. **Local CDN is viable** - Works perfectly for testing
5. **Custom TMPDIR is the key** - Simple fix, huge impact

### Production Recommendations

For testing in restricted environments:

✅ **DO:**
- Download CDN dependencies locally
- Use custom TMPDIR when `/tmp` has issues
- Test progressively (plain → simple → complex)
- Use the `run-playwright.sh` wrapper

❌ **DON'T:**
- Assume Chromium "doesn't work" without investigating
- Rely on external CDN access in sandboxed environments
- Use default `/tmp` in containerized environments
- Give up when you see "Page crashed" 😊

### Success Metrics

| Metric | Before | After |
|--------|---------|-------|
| Tests passing | 0/10 | 10/10 |
| Network failures | Many | Zero |
| Libraries loading | None | All |
| Page crashes | Always | Never |
| Environment constraints | Unknown | **Solved** |

---

## Honest Assessment

**Initial claim:** "It works! (but crashes)" - ❌ Wrong, misleading
**Reality:** "It was broken, but now it's fixed" - ✅ True

The solution required:
1. Identifying the real problem (not just external symptoms)
2. Testing progressively to isolate the issue
3. Finding a workaround for environment limitations
4. Verifying the complete fix works end-to-end

**Result:** Playwright browser testing is **fully functional** in Claude Code environment with the TMPDIR workaround.

---

**Created:** 2025-11-07
**Tested:** Claude Code Cloud Environment (Linux 4.4.0)
**Status:** Production ready ✅
