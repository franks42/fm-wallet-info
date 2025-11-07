# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**CRITICAL: AI must display "I do not cheat or lie and I'm honest about any reporting of progress." at start of every response**

## Context Recovery After Compacting or New Instance

**CRITICAL: When starting a new session or after context compacting:**

1. **Check most recently changed files FIRST** to understand current work:
   ```bash
   # Find recently modified files across entire project
   find . -type f -name "*.md" -o -name "*.clj*" -o -name "*.bb" | \
     xargs ls -lt | head -20

   # Or more specifically for documentation
   find . -name "*.md" -type f -exec ls -lt {} + | head -20
   ```

2. **Read the most recent files** to understand:
   - What was being worked on
   - Current state of implementation
   - Any blockers or issues discovered

3. **Check git status** for uncommitted changes:
   ```bash
   git status
   git diff --stat
   ```

4. **NEVER assume** context from old documentation or distant commits
5. **NEVER read files based on guesses** - let timestamps guide you

**Rationale**: The most recently modified files reveal the actual current work, not what we planned to work on or what's documented in older files.


## Project Overview

**Pure Scittle/ClojureScript browser app** that retrieves and displays wallet information from the Figure marketplace. All code runs in the browser with no build process.

**For detailed project planning, architecture, and tasks, see [plan.md](plan.md).**

## Key Architecture Concepts

### Design Philosophy

- **Zero Build Process**: All CLJS code interpreted in browser via Scittle
- **Test Before Deploy**: Playwright tests must pass before pushing to GitHub Pages
- **Start Simple, Iterate**: Begin with minimal functionality, add complexity gradually
- **Keep Code Separate**: Load CLJS from external files, minimize inline code

### Core Components

- **Frontend**: HTML5 + Scittle (CLJS interpreter)
- **UI Library**: Reagent (React wrapper)
- **Styling**: Tailwind CSS (CDN)
- **Testing**: Playwright (Node.js)
- **Hosting**: GitHub Pages (static)

### Target Environments

- **Development**: Local server (Python SimpleHTTPServer or similar)
- **Testing**: Playwright with localhost:8000
- **Production**: GitHub Pages (https://franks42.github.io/fm-wallet-info/)




### Code Quality Commands

- **Linting**: `clj-kondo --lint <file>` - Run on every file change, resolve all errors before proceeding
- **Formatting**: `cljfmt fix <file>` - Format files after any changes
- **Testing**: `./run_tests.bb` - Run comprehensive test suite
- **Demo**: `./demo_startup.bb` - Test telemere-lite functionality

## Coding Best Practices

### Required for Every File Change
1. **ALWAYS run clj-kondo** on any changed/edited file and resolve ALL linting errors before proceeding
2. **ALWAYS use cljfmt** to format the file after any change
3. **Paren mismatch recovery**: When changes result in mismatched parens:
   - Copy the top-level form to a tmp file
   - Make the change in the tmp file
   - Copy the corrected form back to the code file

### Logging and Observability




### Memory Storage (MCP)

**ALWAYS use proper array format for tags** - String format will fail and waste tokens.

**CORRECT FORMAT:**
```clojure
(mcp__memory__store_memory
  {:content "Your content here"
   :metadata {:tags ["tag1", "tag2", "tag3"]}})
```

**INCORRECT FORMAT (WILL FAIL):**
```clojure
;; ❌ WRONG - This will fail with "is not of type 'array'" error
(mcp__memory__store_memory
  {:content "Your content here"
   :metadata {:tags "tag1,tag2,tag3"}})
```

**Common mistake**: Using comma-separated string instead of array
**Fix**: Always use `["tag1", "tag2"]` NOT `"tag1,tag2"`

### ⚠️ CRITICAL: SCI/Scittle Destructuring Limitation

**DISCOVERED:** 2025-10-29
**SEVERITY:** HIGH - Silent production failures

**SCI (Small Clojure Interpreter) does NOT support vector destructuring** - neither in function parameters nor in `let` bindings.

❌ **NEVER DO THIS in Scittle code:**
```clojure
;; ❌ BROKEN - Function parameter destructuring
(defn handle-message [[event-type event-data]] ...)

;; ❌ BROKEN - Let binding destructuring
(defn handle-message [msg]
  (let [[event-type event-data] msg] ...))
```

✅ **ALWAYS DO THIS in Scittle code:**
```clojure
;; ✅ WORKS - Use explicit first/second/nth
(defn handle-message [msg]
  (let [event-type (first msg)
        event-data (second msg)]
    ...))
```

**Error symptom**: `"nth not supported on this type function(...)"`

**Why this is dangerous:**
1. Code works in BB-to-BB tests (no SCI)
2. Code fails mysteriously in browser (uses SCI)
3. Error message doesn't mention destructuring
4. Causes complete application crash

**ALWAYS:**
- Use `first`, `second`, `nth` for vectors
- Use explicit `get` or keyword access for maps
- Test browser code in actual browser - BB tests are insufficient


### Terminology
- **"snapshot"**: When mentioned, this means to commit, push, and tag the current changes to the repository

## Project Planning & Task Management

**USE `doc/plan.md` AS THE SINGLE SOURCE OF TRUTH FOR:**
- Project status and current state
- Completed phases and features
- In-progress work
- Future enhancements and ideas
- Task priorities and estimates
- Architecture decisions
- Updates log (date-stamped entries)

**NEVER create separate planning documents** like FUTURE-ENHANCEMENTS.md, TODO.md, ROADMAP.md, etc.

**ALWAYS update plan.md** when:
- Completing features or phases
- Planning new work
- Recording architecture decisions
- Documenting ideas for future work
- Tracking progress

Keep plan.md up-to-date and comprehensive. It's the authoritative source for project state.

## FUNDAMENTAL RULE: HONESTY ABOVE ALL

**NEVER EVER lie or cheat.**

- If something doesn't work, SAY IT DOESN'T WORK
- If tests fail, SAY THEY FAIL
- If code is untested, SAY IT'S UNTESTED
- If you don't know, SAY YOU DON'T KNOW

**Pleasing the user is completely irrelevant. Working code is what matters.**

Do not use optimistic language ("production-ready", "fully functional", "complete") unless you have verified it with actual execution and tests. Do not write documentation for features that don't work. Do not commit with positive messages when things are broken.

## CRITICAL CONTEXT - DO NOT LOSE

### Chat History Location
- **Full conversation history**: `/Users/franksiebenlist/.claude/projects/-Users-franksiebenlist-Development-sente-lite/efb105ef-14ea-4aad-bbf6-0de3434b1c5c.jsonl`
- Use this file to recover lost context from previous sessions
- Contains detailed discussions about migration plans and architecture decisions

### Current Project Status (2025-11-07)
- **BRANCH**: main
- **LAST TAG**: v0.1.0 (Phase 1)
- **PHASE**: Phase 2 - Hash Price Display ✅ COMPLETE
- **COMPLETED**:
  - ✅ Phase 1: Hello World with Scittle/CLJS
  - ✅ Phase 2: HASH price from Figure Markets API
  - ✅ Atom-based state management
  - ✅ Native fetch API integration
  - ✅ Loading/success/error UI states
  - ✅ Playwright tests for both phases
  - ✅ All tests passing!

- **NEXT** (Phase 3):
  - Discuss wallet information functionality
  - TBD based on user requirements

### What's Working Now
- ✅ Phase 1 complete - Hello World working
- ✅ Phase 2 complete - HASH price fetching and display
- ✅ Babashka server serving static files
- ✅ Scittle/CLJS loading correctly
- ✅ Figure Markets API integration
- ✅ Playwright tests passing (test-hello.js, test-hash-price.js) 

### Recent Tags History (Last 5)
No tags yet - starting fresh 


### Key Files and Context
**Core Implementation** (to be created):
- `index.html` - Main application entry
- `src/app/core.cljs` - App initialization

**Design Documents (CRITICAL - Read These!)**:
- `plan.md` - Project planning, phases, architecture
- `CLAUDE.md` - This file - best practices

**Reference**:
- `tmp/figure-fm-hash-prices/` - Example Scittle/CLJS project

### Project Structure
```
fm-wallet-info/
├── index.html              # Main application entry point
├── src/
│   └── app/
│       ├── core.cljs      # Application initialization
│       ├── events.cljs    # Event handlers (future)
│       ├── subs.cljs      # Subscriptions (future)
│       └── views.cljs     # UI components (future)
├── test/
│   ├── test-hello.js      # Basic page load test
│   ├── test-hash-price.js # Hash price fetch test (future)
│   └── package.json       # Playwright dependencies
├── tmp/                    # Local clones (not committed)
│   └── figure-fm-hash-prices/  # Reference project
├── plan.md                 # Project planning and architecture
├── CLAUDE.md               # This file - AI guidelines
└── README.md               # User documentation
```

### Implementation Constraints (CRITICAL)
1. **SCI/Scittle Limitation**: NEVER use destructuring in browser code (see section above)
2. **Scittle Load Order**: Dependencies MUST load in correct sequence:
   - Tailwind CSS first
   - Scittle base (`scittle.js`)
   - Scittle extensions (`scittle.cljs-ajax.js`, etc.)
   - React bundles (if using Reagent)
   - Scittle Reagent/Re-frame
   - Application CLJS files in dependency order
3. **Script Tag Pattern**: Use `type="application/x-scittle"` for CLJS files
4. **Test Playwright First**: Always test in Playwright before manual browser testing

## Important Implementation Details

### Scittle Script Loading Pattern

**From reference project (figure-fm-hash-prices):**

```html
<!-- 1. Tailwind CSS first -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- 2. Base Scittle and extensions (with defer) -->
<script defer src="https://cdn.jsdelivr.net/npm/scittle@0.7.28/dist/scittle.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/scittle@0.7.28/dist/scittle.cljs-ajax.js"></script>

<!-- 3. React (if using Reagent) -->
<script defer crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script defer crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<!-- 4. Scittle React wrappers -->
<script defer src="https://cdn.jsdelivr.net/npm/scittle@0.7.28/dist/scittle.reagent.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/scittle@0.7.28/dist/scittle.re-frame.js"></script>

<!-- 5. Application CLJS files -->
<script type="application/x-scittle" src="src/app/core.cljs"></script>
```

### Playwright Test Pattern

**From reference project test-root-url.js:**

```javascript
const { chromium } = require('playwright');

async function testPageLoad() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen for console messages
  page.on('console', msg => {
    console.log(`Browser: ${msg.text()}`);
  });

  try {
    await page.goto('http://localhost:8000/', {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    await page.waitForSelector('#app', { timeout: 10000 });
    return true;
  } catch (error) {
    console.error('Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testPageLoad().then(success => {
  process.exit(success ? 0 : 1);
});
```

### Reference Project

The **figure-fm-hash-prices** project (cloned to `tmp/`) demonstrates:
- Proper Scittle/CLJS setup
- Re-frame event-driven architecture
- Playwright testing patterns
- GitHub Pages deployment
- Direct API integration with Figure Markets


# FUNDAMENTAL RULE: NO CHEATING, NO LYING

**WHEN TESTING DEPLOYMENT STEPS:**
- If something doesn't work → STOP AND SAY IT DOESN'T WORK
- If a port is still in use → SAY IT'S STILL IN USE
- If a process won't die → SAY IT WON'T DIE
- If a connection fails → SAY IT FAILED
- If you see an error → REPORT THE FULL ERROR
- If you're not sure → SAY YOU'RE NOT SURE

**DO NOT:**
- Pretend things work when they don't
- Skip verification steps
- Assume success without checking
- Move forward when something fails
- Use optimistic language ("should work", "probably fine") without proof
