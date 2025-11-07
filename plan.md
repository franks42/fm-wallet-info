# FM Wallet Info - Project Plan

## Project Overview

**Goal**: Build a pure Scittle/ClojureScript browser application that retrieves and displays wallet information from the Figure marketplace.

**Deployment**: GitHub Pages (static hosting, no build process, no GitHub Actions)

**Testing**: Playwright for local automated testing before deployment

**Philosophy**: Start simple, iterate incrementally, test everything locally before pushing

---

## Architecture

### Technology Stack

- **Frontend**: Pure HTML5 + Scittle (ClojureScript browser interpreter)
- **UI Library**: Reagent (React wrapper for ClojureScript)
- **Styling**: Tailwind CSS (via CDN)
- **API**: Figure Markets public API
- **Testing**: Playwright (Node.js)
- **Build Tools**: None (pure browser-based, no compilation)

### Key Constraints

1. **No Build Process**: All CLJS code runs interpreted in browser via Scittle
2. **SCI Limitations**: Cannot use vector destructuring (see CLAUDE.md)
3. **Load Order Matters**: Scittle dependencies must load in correct sequence
4. **Test-First**: All features must pass Playwright tests before deployment

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
├── plan.md                # This file
├── CLAUDE.md              # AI assistant guidelines
└── README.md              # User documentation
```

---

## Development Phases

### Phase 1: Hello World ✅ COMPLETED
**Status**: ✅ Complete
**Goal**: Validate basic Scittle/CLJS setup

**Tasks**:
- [x] Create project structure
- [x] Review reference project (figure-fm-hash-prices)
- [x] Create simple HTML hello-world page
- [x] Add Scittle with minimal CLJS code
- [x] Setup Babashka server with http-kit
- [x] Setup Playwright testing
- [x] Create test-hello.js to validate page loads
- [x] Verify in browser and with tests

**Success Criteria**: ✅ ALL MET
- ✅ Page loads in browser
- ✅ "Hello World" displays from CLJS code
- ✅ Playwright test passes
- ✅ No critical console errors (only Tailwind CDN warning)

---

### Phase 2: Hash Price Display ✅ COMPLETED
**Status**: ✅ Complete
**Goal**: Fetch and display current HASH price from Figure Markets

**Tasks**:
- [x] Study Figure Markets API (from reference project)
- [x] Create minimal API fetch function using native fetch
- [x] Display HASH price in simple UI
- [x] Add error handling for API failures
- [x] Create test-hash-price.js test
- [x] Verify data updates correctly

**API Endpoint**:
```
GET https://www.figuremarkets.com/service-hft-exchange/api/v1/markets
```

**Implementation Details**:
- Uses native JavaScript `fetch` API (no external HTTP library needed)
- Parses response to find HASH-USD market
- Extracts `midMarketPrice` field
- Displays price with 4 decimal places
- Three states: loading, success, error
- Atom-based state management

**Success Criteria**: ✅ ALL MET
- ✅ HASH-USD price fetches successfully ($0.0300)
- ✅ Price displays in browser with large, clear format
- ✅ Playwright test validates correct data display
- ✅ Error states handled gracefully with user-friendly messages

---

### Phase 3: Wallet Info (FUTURE)
**Status**: ⏸️ Not Started
**Goal**: Fetch and display wallet information for given address

**Details**: TBD after Phase 2 completion

---

## Reference Projects

### figure-fm-hash-prices
**URL**: https://github.com/franks42/figure-fm-hash-prices

**Key Learnings**:
1. **Scittle Load Order**: Must load dependencies in specific sequence
   - Tailwind CSS first
   - Scittle base + extensions (ajax, reagent, re-frame)
   - React bundles
   - Application CLJS files in dependency order

2. **Script Loading Pattern**:
   ```html
   <script defer src="https://cdn.jsdelivr.net/npm/scittle@0.6.15/dist/scittle.js"></script>
   <script defer type="application/x-scittle" src="src/app/core.cljs"></script>
   ```

3. **Testing Pattern**:
   - Playwright tests in JavaScript
   - Test localhost:8000 before GitHub Pages
   - Validate console logs and DOM elements
   - Exit codes: 0 = success, 1 = failure

4. **SCI Constraint**:
   - No vector destructuring in function params or let bindings
   - Use `first`, `second`, `nth` instead
   - This catches many developers off-guard!

---

## Current Status

**Last Updated**: 2025-11-07

**Active Phase**: Phase 2 - Hash Price Display ✅ COMPLETE

**Recent Changes** (Phase 2):
- ✅ Studied Figure Markets API from reference project
- ✅ Updated src/app/core.cljs with fetch logic
- ✅ Implemented atom-based state management
- ✅ Added three UI states: loading, success, error
- ✅ Created test-hash-price.js Playwright test
- ✅ All tests passing!

**Test Results**:
```
Phase 1:
🎉 HELLO WORLD TEST PASSED

Phase 2:
🎉 HASH PRICE TEST PASSED
✅ HASH price fetched: $0.03
✅ Price displayed in UI: $0.0300
✅ Price format correct
```

**Next Steps (Phase 3)**:
Discuss with user what wallet information functionality to implement next.

---

## Testing Strategy

### Local Development
1. Start local server: `python3 -m http.server 8000`
2. Open browser: http://localhost:8000
3. Check console for errors
4. Verify visual output

### Automated Testing
1. Install Playwright: `npm install playwright`
2. Run test: `node test/test-hello.js`
3. Fix any failures before moving forward

### Deployment Verification
1. Push to GitHub
2. Enable GitHub Pages
3. Test live URL
4. Verify no CORS or loading issues

---

## Known Issues & Gotchas

### SCI/Scittle Destructuring
❌ **NEVER** use vector destructuring:
```clojure
;; BROKEN in Scittle
(defn handler [[x y]] ...)
(let [[a b] data] ...)
```

✅ **ALWAYS** use explicit access:
```clojure
;; WORKS in Scittle
(defn handler [data]
  (let [x (first data)
        y (second data)] ...))
```

### Scittle Load Order
Dependencies must load in correct order. If things break mysteriously, check script tag sequence.

### GitHub Pages Caching
Sometimes GitHub Pages caches aggressively. Add version query params to force refresh:
```html
<script src="src/app/core.cljs?v=1.0.1"></script>
```

---

## Future Enhancements (Ideas)

- Multiple wallet support
- Transaction history display
- Portfolio value calculations
- Real-time price updates
- Export data to CSV
- Responsive mobile UI
- Dark mode toggle

---

## Success Metrics

1. **Development Speed**: Iterate quickly without build step overhead
2. **Testing Coverage**: All features have passing Playwright tests
3. **Zero Bugs Deployed**: Only push working, tested code
4. **User Experience**: Fast load times, responsive UI
5. **Maintainability**: Clear code structure, good documentation

---

## Notes

- Keep it simple - resist adding complexity too early
- Test in actual browser, not just Playwright (visual validation matters)
- Document all learnings in plan.md
- Update CLAUDE.md with project-specific best practices
- Commit often with clear messages
