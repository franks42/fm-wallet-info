# GitHub Pages Setup Guide

## Option 1: Enable GitHub Pages (Recommended)

After merging this PR to your main branch:

1. Go to your repository settings: `https://github.com/franks42/fm-wallet-info/settings/pages`
2. Under "Source", select your main branch (or the branch you want to deploy)
3. Select `/ (root)` as the folder
4. Click "Save"
5. Wait a few minutes for deployment
6. Your site will be available at: **`https://franks42.github.io/fm-wallet-info/`**

## Option 2: Test Using RawGit/CDN (Immediate)

You can test the app immediately using GitHub's raw content served through a CDN:

### Using jsDelivr CDN:

```
https://cdn.jsdelivr.net/gh/franks42/fm-wallet-info@claude/review-figure-fm-hash-011CUsJ4mCHB2a4wWksADsVy/index.html
```

However, this may have CORS issues with the API calls.

## Option 3: Local Testing (Works Now)

```bash
cd fm-wallet-info
python3 -m http.server 8080
# Open http://localhost:8080
```

## Option 4: Quick Deploy to Main

If you want to quickly deploy, you can:

```bash
# Merge this branch to main
git checkout main  # or master
git merge claude/review-figure-fm-hash-011CUsJ4mCHB2a4wWksADsVy
git push origin main

# Then follow Option 1 above
```

## Verifying It Works

Once deployed, you should see:
- A clean UI with "Figure Markets" header
- HASH price card with live data from Figure Markets API
- Auto-refresh every 30 seconds
- Current price, 24h change, volume, bid/ask spread

## Troubleshooting

### CORS Issues
If you see CORS errors in the console, it means the Figure Markets API may have restrictions. The API should work fine from GitHub Pages as it supports CORS, but raw content CDNs might have issues.

### API Rate Limiting
The Figure Markets API is public but may have rate limits. The app refreshes every 30 seconds which should be well within limits.

### No Data Showing
Check the browser console (F12) for error messages. The app logs all API calls and responses.
