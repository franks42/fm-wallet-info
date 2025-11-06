# Testing Guide

## Version Checking

The app now includes version numbers in:
- Browser tab title: "Figure Markets - HASH Price v1.0.1"
- Footer display: Shows version number
- Console log on startup: `🚀 FM Wallet Info v1.0.1 - Starting...`

**Version updates with every commit** to help track which version you're viewing.

## Debugging with Console Logs

Open your browser's Developer Tools (F12 or Cmd+Option+I) and check the Console tab.

You should see a clear sequence of logs:

```
🚀 FM Wallet Info v1.0.1 - Starting...
📍 Page URL: https://...
⏰ Load Time: 2025-11-06T...
✅ Tailwind CSS script tag loaded
✅ Tailwind config applied
✅ Scittle core loaded
✅ Scittle AJAX loaded
✅ React loaded
✅ ReactDOM loaded
✅ Scittle Reagent loaded
✅ Body tag reached
✅ DOM structure loaded
📝 All script tags declared
✅ Window load event fired
🔍 Checking for React: ✅ Found
🔍 Checking for ReactDOM: ✅ Found
🔍 Checking for scittle: ✅ Found
📦 CLJS: Namespace fm-wallet loading...
📦 CLJS: Reagent core: ✅ Found
...
```

### If it Hangs at "Loading HASH price..."

Check the console to see **where the logs stop**:

1. **Stops at "FAILED to load Scittle core"** → CDN blocked (firewall/proxy issue)
2. **Stops at "CLJS: Namespace fm-wallet loading"** → Scittle execution issue
3. **Stops at "fetch-hash-price! called"** → API fetch issue
4. **Shows "Response status: 200"** → API working, check data parsing logs

## Testing with Playwright (Automated)

A debug script is included to automatically test the page:

```bash
# Test your GitHub Pages deployment
node test-debug.js https://franks42.github.io/fm-wallet-info/

# Or test local server
python3 -m http.server 8080 &
node test-debug.js http://localhost:8080
```

This will:
- Capture all console logs
- Monitor network requests
- Check if HASH card appears
- Take a screenshot (debug-screenshot.png)
- Report status

## Known Testing Environment Issues

**This development/testing environment has network restrictions** that block CDN access:
- ❌ `ERR_TUNNEL_CONNECTION_FAILED` errors
- ❌ Cannot load Tailwind, Scittle, React from CDNs
- ❌ Cannot fetch from Figure Markets API

**This is NORMAL for restricted environments.** The app will work fine:
- ✅ On GitHub Pages (public internet)
- ✅ On your local machine (with normal internet)
- ✅ For end users accessing the site

## Deploying to Test

### Quick Deploy to GitHub Pages

```bash
# 1. Merge to main branch
git checkout main
git merge claude/review-figure-fm-hash-011CUsJ4mCHB2a4wWksADsVy
git push origin main

# 2. Enable GitHub Pages
# Go to: https://github.com/franks42/fm-wallet-info/settings/pages
# Select "main" branch, "/" folder, Save

# 3. Wait 2 minutes, then visit:
# https://franks42.github.io/fm-wallet-info/
```

### Check the Console Logs

Once deployed, open the page in your browser:
1. Press F12 to open DevTools
2. Go to Console tab
3. Refresh the page
4. Look for the emoji-prefixed logs to trace execution

## Expected Behavior

**When working correctly:**
1. Page loads with title showing version number
2. All CDN resources load successfully (✅ logs)
3. ClojureScript namespace loads
4. App state created
5. API fetch initiated
6. Response received (status 200)
7. HASH-USD data found
8. App state updated, loading=false
9. HASH card displayed with price data

**Total time: 2-5 seconds**

## What to Look For

- **Version number visible** in title bar and footer
- **Console shows v1.0.1** in first log line
- **All "✅" checkmarks** in console logs
- **HASH card appears** with green/red color coding
- **Price updates** every 30 seconds
- **No red error messages** in console

## Troubleshooting

If you see "Loading HASH price..." indefinitely:
1. Check browser console for last log message
2. Look for any red error messages
3. Verify internet connectivity
4. Check if CDNs are accessible from your network
5. Try a different browser/incognito mode
6. Use test-debug.js to get detailed diagnostics
