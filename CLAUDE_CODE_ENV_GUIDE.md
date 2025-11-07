# Claude Code Environment - Limitations & Workarounds

**Last Updated:** 2025-11-07
**Environment:** Claude Code Cloud (Linux 4.4.0)

This document describes environment limitations discovered during Playwright browser testing and their solutions. Use this guide to avoid common pitfalls when setting up automated browser testing in Claude Code.

---

## Quick Start

If you just want to run Playwright tests:

```bash
# Use the wrapper script (handles all workarounds automatically)
./run-playwright.sh test

# Or set environment variables manually:
export TMPDIR=/home/user/fm-wallet-info/.tmp
export TMP=/home/user/fm-wallet-info/.tmp
export TEMP=/home/user/fm-wallet-info/.tmp
npx playwright test
```

---

## Environment Limitations

### Limitation 1: `/tmp` Directory Permissions

**Problem:**
- `/tmp` directory owned by `claude:ubuntu`
- Some processes (Chromium sub-processes, apt-key) run as different users
- Cannot create temporary files → Permission denied errors
- **Result:** Chromium browser crashes immediately after launch

**Symptoms:**
```
Error: page.goto: Page crashed
Failed to read /proc/sys/fs/inotify/max_user_watches
Couldn't create temporary file /tmp/apt.conf...
```

**Test if You're Affected:**
```bash
# Even plain HTML will crash:
npx playwright test tests/debug-test.spec.js --grep "plain HTML"
# If this crashes, you have the /tmp issue
```

**Solution:**
Use a custom TMPDIR that your user has full control over:

```bash
# Create custom temp directory
mkdir -p /home/user/fm-wallet-info/.tmp

# Set environment variables
export TMPDIR=/home/user/fm-wallet-info/.tmp
export TMP=/home/user/fm-wallet-info/.tmp
export TEMP=/home/user/fm-wallet-info/.tmp

# Now Playwright will work
npx playwright test
```

**Permanent Solution:**
Use the provided `run-playwright.sh` wrapper script that handles this automatically.

---

### Limitation 2: External CDN Access from Browser

**Problem:**
- cURL/wget can access external CDNs fine (command-line level)
- **BUT** Playwright's browser environment has additional network restrictions
- All external CDN requests fail with `ERR_TUNNEL_CONNECTION_FAILED`
- This is separate from the /tmp issue

**Symptoms:**
```
[Network Failure]: https://cdn.jsdelivr.net/... - net::ERR_TUNNEL_CONNECTION_FAILED
Failed to load resource: net::ERR_TUNNEL_CONNECTION_FAILED
```

**Test if You're Affected:**
```bash
# Command-line access works:
curl -I https://cdn.jsdelivr.net/npm/scittle@0.7.28/dist/scittle.js
# ✅ Returns 200 OK

# But browser access fails:
./run-playwright.sh test tests/external-cdn.spec.js
# ❌ All CDN requests fail
```

**Solution:**
Download CDN resources locally and serve them from your local webserver:

```bash
# 1. Download all CDN dependencies
mkdir -p local-cdn/{tailwind,scittle,react}
curl -L -o local-cdn/tailwind/tailwindcss.js "https://cdn.tailwindcss.com"
curl -L -o local-cdn/scittle/scittle.js "https://cdn.jsdelivr.net/npm/scittle@0.7.28/dist/scittle.js"
# ... etc

# 2. Update HTML to use local paths
<script src="local-cdn/tailwind/tailwindcss.js"></script>

# 3. Serve with local webserver
python3 -m http.server 8080

# 4. Run tests
./run-playwright.sh test
```

See `index-local.html` for a complete example.

---

### Limitation 3: System Dependency Installation

**Problem:**
- `npx playwright install --with-deps` tries to install system packages
- Package manager has permission/GPG key issues
- Not critical (Chromium usually works without extra deps)

**Symptoms:**
```
Couldn't create temporary file /tmp/apt.conf...
Unable to mkstemp /tmp/apt-key...
```

**Solution:**
- Ignore these warnings if Chromium already works
- The browser binary itself installs fine
- System dependencies are pre-installed in most cases

**Test:**
```bash
# Check if Chromium is installed
npx playwright install --dry-run chromium

# Try to run it directly
/root/.cache/ms-playwright/chromium-*/chrome-linux/chrome --version
```

---

## Complete Setup Guide

### For Projects Using External CDNs

**Step 1: Download CDN Resources**
```bash
# Create directory structure
mkdir -p local-cdn/{tailwind,scittle,react}

# Download all resources
curl -L -o local-cdn/tailwind/tailwindcss.js "https://cdn.tailwindcss.com"
curl -L -o local-cdn/scittle/scittle.js "https://cdn.jsdelivr.net/npm/scittle@0.7.28/dist/scittle.js"
curl -L -o local-cdn/scittle/scittle.cljs-ajax.js "https://cdn.jsdelivr.net/npm/scittle@0.7.28/dist/scittle.cljs-ajax.js"
curl -L -o local-cdn/scittle/scittle.reagent.js "https://cdn.jsdelivr.net/npm/scittle@0.7.28/dist/scittle.reagent.js"
curl -L -o local-cdn/react/react.production.min.js "https://unpkg.com/react@18/umd/react.production.min.js"
curl -L -o local-cdn/react/react-dom.production.min.js "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"
```

**Step 2: Create Local Version of Your HTML**
```html
<!-- Original: index.html (with external CDNs) -->
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/scittle@0.7.28/dist/scittle.js"></script>

<!-- Local: index-local.html (with local CDN) -->
<script src="local-cdn/tailwind/tailwindcss.js"></script>
<script src="local-cdn/scittle/scittle.js"></script>
```

**Step 3: Create Wrapper Script**
```bash
cat > run-playwright.sh << 'EOF'
#!/bin/bash
mkdir -p /home/user/YOUR_PROJECT/.tmp
export TMPDIR=/home/user/YOUR_PROJECT/.tmp
export TMP=/home/user/YOUR_PROJECT/.tmp
export TEMP=/home/user/YOUR_PROJECT/.tmp
npx playwright "$@"
EOF

chmod +x run-playwright.sh
```

**Step 4: Run Tests**
```bash
# Start local webserver
python3 -m http.server 8080 &

# Run tests
./run-playwright.sh test
```

---

## Troubleshooting

### Browser Crashes Immediately

**Error:**
```
Error: page.goto: Page crashed
```

**Diagnosis:**
```bash
# Test with plain HTML (no resources)
echo '<html><body>Test</body></html>' > test.html
npx playwright test --grep "test.html"
```

**If plain HTML crashes:**
- Problem: /tmp permissions
- Solution: Use TMPDIR workaround (see Limitation 1)

**If plain HTML works but your page crashes:**
- Problem: External CDN access blocked
- Solution: Use local CDN (see Limitation 2)

---

### Network Errors in Browser

**Error:**
```
net::ERR_TUNNEL_CONNECTION_FAILED
Failed to load resource
```

**This is normal in Claude Code browser environment!**

**Verify:**
```bash
# Command-line access works:
curl -I https://cdn.jsdelivr.net/npm/scittle@0.7.28/dist/scittle.js
# ✅ Should return 200 or 30x

# Browser access fails - this is expected
```

**Solution:**
- Download resources locally (they're accessible via curl)
- Serve from local webserver
- Update HTML to use local paths

---

### Permission Errors During Install

**Error:**
```
Couldn't create temporary file /tmp/apt.conf...
Permission denied
```

**This is expected and can be ignored if:**
- Chromium binary installs successfully
- Browser launches without crashing
- Tests run successfully

**Check:**
```bash
# Verify Chromium is installed
ls /root/.cache/ms-playwright/chromium-*/chrome-linux/chrome

# Verify it runs
/root/.cache/ms-playwright/chromium-*/chrome-linux/chrome --version
```

---

## Environment Characteristics

### What Works

✅ **cURL/wget** - Full external network access
✅ **Node.js/npm** - Package installation works
✅ **Python HTTP server** - Local webserver works perfectly
✅ **Git operations** - Clone, push, pull all work
✅ **Chromium binary** - Installs and runs (with TMPDIR fix)
✅ **Playwright** - Fully functional (with workarounds)

### What's Restricted

❌ **/tmp directory** - Permission issues for some processes
❌ **Browser external network** - Chromium can't access external URLs
❌ **System package install** - apt/apt-key have permission issues
❌ **Some kernel features** - inotify, some /proc entries unavailable

### Network Access Layers

| Layer | External CDN Access | Notes |
|-------|-------------------|-------|
| Command-line (curl) | ✅ Works | Full access |
| Node.js (npm) | ✅ Works | Can download packages |
| Browser (Playwright) | ❌ Blocked | ERR_TUNNEL_CONNECTION_FAILED |

**Key insight:** Network restrictions are at the **browser level**, not system level.

---

## Testing Your Setup

Use these progressive tests to verify each fix:

### Test 1: Plain HTML (tests TMPDIR fix)
```bash
./run-playwright.sh test tests/debug-test.spec.js --grep "plain HTML"
```
**Expected:** ✅ Pass (if TMPDIR fix works)

### Test 2: One File Load (tests basic loading)
```bash
./run-playwright.sh test tests/debug-test.spec.js --grep "one small file"
```
**Expected:** ✅ Pass (loads one local file)

### Test 3: Full Local CDN (tests complete solution)
```bash
./run-playwright.sh test tests/local-cdn.spec.js
```
**Expected:** ✅ All 7 tests pass

### Test 4: External CDN (demonstrates limitation)
```bash
./run-playwright.sh test tests/external-cdn.spec.js
```
**Expected:** Tests technically pass but logs show all CDN requests fail

---

## Best Practices

### For New Projects

1. **Assume external CDN access will fail** in browser
2. **Download dependencies locally** during setup
3. **Use the TMPDIR workaround** from the start
4. **Test progressively** (plain HTML → simple → complex)
5. **Keep local CDN in git** or document download steps

### For CI/CD

The same workarounds apply in containerized environments:

```yaml
# GitHub Actions / GitLab CI example
- name: Setup Playwright
  run: |
    mkdir -p $HOME/.tmp
    export TMPDIR=$HOME/.tmp
    export TMP=$HOME/.tmp
    export TEMP=$HOME/.tmp
    npm install @playwright/test
    npx playwright install chromium

- name: Download CDN resources
  run: |
    mkdir -p local-cdn
    # Download all CDN dependencies
    curl -L -o local-cdn/... https://...

- name: Run tests
  run: |
    export TMPDIR=$HOME/.tmp
    npx playwright test
```

### For Documentation

When documenting setup:
1. Include the TMPDIR workaround
2. List all CDN dependencies to download
3. Provide working wrapper scripts
4. Show expected vs actual errors

---

## Files in This Repository

### Workaround Scripts
- `run-playwright.sh` - Wrapper script with TMPDIR fix (USE THIS)

### Test Files
- `tests/debug-test.spec.js` - Progressive complexity tests
- `tests/local-cdn.spec.js` - Local CDN comprehensive tests
- `tests/external-cdn.spec.js` - Demonstrates external CDN limitation

### Test HTML Pages
- `test-plain.html` - Plain HTML (no resources)
- `test-one-file.html` - Single file load test
- `index-local.html` - Full local CDN version

### Documentation
- `PLAYWRIGHT_FIX.md` - Detailed fix documentation
- `LOCAL_CDN_TESTING.md` - Local CDN approach details
- `TEST_RESULTS.md` - Initial CDN accessibility testing
- `CLAUDE_CODE_ENV_GUIDE.md` - This file

---

## Why These Limitations Exist

### Security Isolation
Claude Code runs in a heavily sandboxed environment for security:
- Multiple user processes isolated from each other
- Network access controlled at different layers
- File system permissions strictly enforced

### Container Architecture
The environment is containerized with:
- Minimal system resources
- Restricted kernel features
- Limited network egress from browser processes

### Browser Sandboxing
Chromium adds additional sandboxing that conflicts with:
- Container restrictions
- Limited /tmp access
- Network isolation policies

**Result:** Command-line tools work, but browser has stricter limits.

---

## Summary

### Two Critical Issues

1. **Browser crashes** → Fix with TMPDIR workaround
2. **External CDN blocked** → Fix with local CDN downloads

### Both Fixes Required

Neither fix alone is sufficient:
- TMPDIR fix without local CDN → Browser runs but resources fail to load
- Local CDN without TMPDIR fix → Resources available but browser crashes

### Recommended Solution

Use the provided `run-playwright.sh` script which handles both:
```bash
./run-playwright.sh test
```

This gives you fully functional Playwright testing in Claude Code environment.

---

## Version History

- **2025-11-07:** Initial documentation based on fm-wallet-info testing
  - Discovered /tmp permission issue
  - Identified browser network restrictions
  - Created working solutions for both

---

## Contributing

If you discover additional limitations or workarounds:
1. Document the problem clearly
2. Provide reproduction steps
3. Show the solution with code examples
4. Update this guide

---

**Remember:** These limitations are specific to the Claude Code cloud environment. Your code will likely work fine in:
- Local development environments
- Standard CI/CD pipelines
- Production deployments
- Most containerized environments

The workarounds here are specific to Claude Code's unique security model.
