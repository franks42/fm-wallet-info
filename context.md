# FM Wallet Info - Critical Context

**Last Updated**: 2025-11-08 after Phase 5 display restructure and UNRESTRICTED rename

## Project Status

- **Phase 1**: ✅ COMPLETE - Hello World with Scittle/CLJS
- **Phase 2**: ✅ COMPLETE - HASH price display from Figure Markets API using cljs-ajax
- **Phase 3**: ✅ COMPLETE - Wallet information with Reagent + re-frame
- **Phase 4**: ✅ COMPLETE - Multi-endpoint parallel fetch architecture
- **Phase 5**: ✅ COMPLETE - All wallet data display with vesting support
  - ✅ Display restructure: Liquid + Committed + Delegated = WALLET TOTAL
  - ✅ Vesting accounts show: Unvested → UNRESTRICTED calculation
  - ✅ Delegation details with TOTAL DELEGATED
  - ✅ Comma formatting fixed (thousands separator)
  - ✅ HASH price showing 3 decimals (changed from 4)

## Current Session Changes (2025-11-08)

### 1. Display Restructure
**User Request**: Reorganize wallet display to show clearer calculations

**Changes Made**:
- **Account Balance Section**:
  - Shows: Liquid, Committed, Delegated
  - These add up to **WALLET TOTAL**
  - For vesting accounts: shows Unvested below total
  - Then calculates **UNRESTRICTED** = Wallet Total - Unvested

- **Delegation Details Section**:
  - Removed "# of validators" (not important at this level)
  - Shows: Staked, Rewards, Unbonding, Redelegated
  - These add up to **TOTAL DELEGATED**

- **HASH Price**: Changed from 4 decimals to 3 decimals ($0.030)

### 2. Comma Formatting Fix
**Issue**: Comma separators were not working correctly for thousands

**Root Cause**: ClojureScript regex literal didn't work with JavaScript's `.replace()`

**Fix**: Changed to JavaScript RegExp constructor:
```clojure
(let [regex (js/RegExp. "\\B(?=(\\d{3})+(?!\\d))" "g")]
  (.replace whole regex ","))
```

### 3. UNRESTRICTED Terminology
**User Request**: "Change name 'available' to 'unrestricted' - that sounds like a better description: unrestricted-hash are tokens that can be freely transferred, traded or delegated/unbonded"

**Changes**:
- Updated label from "AVAILABLE" to "UNRESTRICTED" in Account Balance table
- Updated test-phase5.js to check for "UNRESTRICTED" text
- Bumped cache-busting version to v0.8.1 to force browser reload

### Files Modified This Session
1. **src/app/core.cljs**: Lines 150, 163-171, 261-302, 312-329
2. **test-phase5.js**: Lines 26-63, 82-85
3. **index.html**: Line 39 (version bump to v0.8.1)

### Latest Test Results
```
🧪 Testing Phase 5: All Wallet Data (Multi-Endpoint)

=== Testing NO_VESTING Wallet ===
✅ Account Balance section present
✅ Liquid field present
✅ Committed field present
✅ Delegated field present
✅ Wallet total calculation present
✅ Delegation details section present
✅ Total delegated sum present
✅ Staked amount present
✅ Rewards amount present
NO_VESTING Result: 9/9 checks passed ✅

=== Testing VESTING Wallet ===
✅ Account Balance section present
✅ Liquid field present
✅ Committed field present
✅ Delegated field present
✅ Wallet total calculation present
✅ Delegation details section present
✅ Total delegated sum present
✅ Staked amount present
✅ Rewards amount present
✅ Unvested amount present
✅ Unrestricted amount present
VESTING Result: 11/11 checks passed ✅

✅ Phase 5 PASSED
```

## Current Stack

**HTML Setup** (index.html v0.8.1):
```html
<!-- React and ReactDOM (required for Reagent) -->
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<!-- Scittle Base -->
<script defer src="https://cdn.jsdelivr.net/npm/scittle@0.7.28/dist/scittle.js"></script>

<!-- Scittle Plugins -->
<script defer src="https://cdn.jsdelivr.net/npm/scittle@0.7.28/dist/scittle.cljs-ajax.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/scittle@0.7.28/dist/scittle.promesa.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/scittle@0.7.28/dist/scittle.reagent.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/scittle@0.7.28/dist/scittle.re-frame.js"></script>

<!-- Application CLJS -->
<script type="application/x-scittle" src="src/app/core.cljs?v=0.8.1"></script>
```

**CLJS Pattern** (src/app/core.cljs):
```clojure
(ns app.core
  (:require [reagent.dom :as rdom]
            [re-frame.core :as rf]
            [ajax.core :refer [GET]]))

;; Re-frame event handlers
(rf/reg-event-db ::initialize ...)
(rf/reg-event-db ::update-wallet-address ...)
(rf/reg-event-db ::loading-wallet ...)
(rf/reg-event-db ::wallet-success ...)

;; Re-frame subscriptions
(rf/reg-sub ::status ...)
(rf/reg-sub ::wallet-data ...)

;; Reagent components
(defn wallet-input-component [] ...)
(defn wallet-data-component [] ...)
```

## Key Implementation Details

### Wallet Data Formulas

**For ALL Wallets**:
- WALLET TOTAL = Liquid + Committed + Delegated
- TOTAL DELEGATED = Staked + Rewards + Unbonding + Redelegated

**For VESTING Wallets Only**:
- UNRESTRICTED = WALLET TOTAL - Unvested
- Unrestricted tokens can be freely transferred, traded, or delegated/unbonded

### Multi-Endpoint Fetch Architecture

Four parallel API calls with completion tracking:
1. `/fetch_total_delegation_data/{wallet}` → delegation data
2. `/wallet_liquid_balance/{wallet}` → liquid balance
3. `/fetch_available_committed_amount/{wallet}` → committed amount (may fail for non-exchange accounts)
4. `/fetch_vesting_total_unvested_amount/{wallet}` → vesting data (may fail for non-vesting accounts)

Error handling:
- Missing committed: defaults to 0 (no exchange account)
- Missing vesting: defaults to nil (non-vesting account)
- All 4 must complete before displaying results

### Number Formatting

**nhash to HASH conversion**: 1 HASH = 1,000,000,000 nhash

```clojure
(defn nhash->hash [nhash-amount]
  (when nhash-amount
    (let [amount-num (if (number? nhash-amount)
                      nhash-amount
                      (js/parseFloat nhash-amount))
          formatted (.toFixed (/ amount-num 1000000000) 2)]
      (format-number-with-commas formatted))))

(defn format-number-with-commas [num-str]
  (let [[whole decimal] (.split num-str ".")
        regex (js/RegExp. "\\B(?=(\\d{3})+(?!\\d))" "g")
        with-commas (.replace whole regex ",")]
    (if decimal
      (str with-commas "." decimal)
      with-commas)))
```

**CSS**: Uses `font-variant-numeric: tabular-nums` for aligned columns

## API Integration

### Figure Markets API

**Markets Endpoint**:
- URL: `https://www.figuremarkets.com/service-hft-exchange/api/v1/markets`
- Returns: `{data: [{symbol, midMarketPrice, ...}, ...]}`
- HASH-USD price displayed with 3 decimals

**Provenance Blockchain MCP API** (base: `https://pb-fm-mcp-dev.creativeapptitude.com/api`):
- `/fetch_total_delegation_data/{wallet}` - Delegation details
- `/wallet_liquid_balance/{wallet}` - Liquid balance in wallet
- `/fetch_available_committed_amount/{wallet}` - Committed to exchange
- `/fetch_vesting_total_unvested_amount/{wallet}` - Vesting schedule data

### Response Structures

**Delegation Response**:
```javascript
{
  staking_validators: 2,
  delegated_staked_amount: {amount: 123000000000, denom: "nhash"},
  delegated_rewards_amount: {amount: 45000000, denom: "nhash"},
  delegated_unbonding_amount: {amount: 0, denom: "nhash"},
  delegated_redelegated_amount: {amount: 0, denom: "nhash"},
  delegated_total_delegated_amount: {amount: 123045000000, denom: "nhash"}
}
```

**Vesting Response**:
```javascript
{
  vesting_total_unvested_amount: 500000000000  // in nhash
}
```

## Project Structure

```
fm-wallet-info/
├── index.html              # Entry point (v0.8.1)
├── src/app/core.cljs      # Main app logic (Reagent + re-frame)
├── server.bb              # Babashka HTTP server (http-kit)
├── run-test.bb            # Test runner with lifecycle
├── test-phase5.js         # Phase 5 comprehensive test
├── test/
│   ├── test-hello.js      # Phase 1 test
│   ├── test-hash-price.js # Phase 2 test
│   └── package.json       # Playwright deps
├── tmp/
│   └── (scratch files)
├── plan.md                # Detailed planning
├── CLAUDE.md              # AI guidelines
├── context.md             # This file
└── README.md              # User docs
```

## Testing Workflow

```bash
# Run Phase 5 test (uses hardcoded test wallets)
bb run-test.bb test-phase5.js

# Or run directly
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
bb server.bb 8000 &
sleep 3
node test-phase5.js

# Manual server
bb server.bb 8000
```

### Test Wallets (Hardcoded in test-phase5.js)

**NO_VESTING**: `pb1dsuqw9wn7r0g8m9pm6em8es3fh0l52zrlequcwvnw5yjfkwrqp5scax55t`
- Has liquid balance, delegations, committed amount
- No vesting schedule
- Tests 9 checks

**VESTING**: `pb1c9rqwfefggk3s3y79rh8quwvp8rf8ayr7qvmk8`
- Has liquid balance, delegations, vesting schedule
- Tests 11 checks (includes Unvested and UNRESTRICTED)

## Git History (Recent)

```
ae95a16 Bump cache-busting version to v0.8.1 to force browser reload
a049138 Rename AVAILABLE to UNRESTRICTED for better clarity
cd42c04 Fix comma separator using JavaScript RegExp constructor
7f3ab29 Phase 5 display restructure: WALLET TOTAL and TOTAL DELEGATED
```

## Critical Constraints

### SCI/Scittle Destructuring Limitation

**NEVER use vector destructuring in Scittle code:**
```clojure
;; ❌ BROKEN
(defn handler [[x y]] ...)
(let [[a b] data] ...)

;; ✅ WORKS
(defn handler [data]
  (let [x (first data)
        y (second data)] ...))
```

### Browser Caching

**When code doesn't update**: The cache-busting version in index.html forces browser reload:
```html
<script type="application/x-scittle" src="src/app/core.cljs?v=0.8.1"></script>
```

Increment the version number (e.g., v0.8.2) when deploying significant changes.

## 🔒 CRITICAL SECURITY REQUIREMENT 🔒

**WALLET ADDRESS CONFIDENTIALITY - ABSOLUTELY MANDATORY**

Wallet addresses are **CONFIDENTIAL INFORMATION**. This is not negotiable.

### What You MUST NEVER Do:
1. ❌ Store wallet addresses on any server
2. ❌ Commit wallet addresses to GitHub
3. ❌ Send wallet addresses to any backend
4. ❌ Log wallet addresses in production
5. ❌ Put wallet addresses in URL parameters
6. ❌ Include real wallet addresses in test files

### What You MAY Do:
1. ✅ Store in browser state atom (memory only)
2. ✅ Use localStorage ONLY with explicit user consent
3. ✅ Direct API calls: browser → Figure Markets / Provenance APIs
4. ✅ User text input (not URL params)
5. ✅ Provide "clear data" functionality

### Implementation Pattern:

```clojure
;; State management
(defonce state (atom {:wallet-address nil  ; Never persist by default
                      :wallet-data nil}))

;; Only store if user explicitly consents
(defn save-to-storage [address]
  (when (user-consented?)
    (js/localStorage.setItem "wallet-address" address)))

;; Always provide clear option
(defn clear-wallet-data []
  (js/localStorage.removeItem "wallet-address")
  (swap! state assoc :wallet-address nil))
```

**This is a fundamental privacy requirement. Violations are unacceptable.**

## Common Issues & Solutions

1. **Port 8000 in use**: `lsof -ti:8000 | xargs kill -9`
2. **Browser shows old code**: Bump version in index.html (e.g., v0.8.1 → v0.8.2)
3. **Comma formatting broken**: Use `js/RegExp` constructor, not regex literals
4. **Destructuring errors**: Use `first`, `second`, `nth` instead of vector destructuring
5. **Script load order**: Scittle plugins must load after scittle.js with `defer` attribute
6. **CORS errors on vesting endpoint**: Expected for non-vesting accounts, handled gracefully

## Development Principles

1. **Test before deploy**: All Playwright tests must pass
2. **Keep it simple**: Don't add complexity until needed
3. **Idiomatic Clojure**: Use cljs-ajax, Reagent, re-frame
4. **Document everything**: Update context.md for continuity
5. **Version control**: Commit with descriptive messages

## GitHub Pages

- **Repo**: https://github.com/franks42/fm-wallet-info
- **Live URL**: https://franks42.github.io/fm-wallet-info/
- **Config**: Settings → Pages → Source: main branch, / (root)
- **Special files**: .nojekyll (bypass Jekyll processing)

## Next Steps / Future Enhancements

Potential improvements (not started):
- Add validator names/details in delegation breakdown
- Historical price charts
- Transaction history
- Multiple wallet comparison
- Export to CSV
- Dark/light theme toggle
- Mobile responsive improvements

## Reference Information

**Scittle Plugins Available** (v0.7.28):
- ✅ scittle.cljs-ajax.js - HTTP (currently using)
- ✅ scittle.promesa.js - Promises (currently using)
- ✅ scittle.reagent.js - React wrapper (currently using)
- ✅ scittle.re-frame.js - State management (currently using)
- scittle.replicant.js - Alternative React wrapper
- scittle.pprint.js - Pretty printing
- scittle.nrepl.js - REPL connectivity

**Load Order** (MUST follow this):
1. Tailwind CSS
2. React + ReactDOM
3. Scittle base (scittle.js)
4. Scittle plugins (with `defer`)
5. Application CLJS files

## Current State Summary

**What Works**:
- ✅ HASH price from Figure Markets (3 decimals)
- ✅ Wallet address input
- ✅ Multi-endpoint parallel fetch (4 APIs)
- ✅ Account Balance display with WALLET TOTAL
- ✅ Vesting account support with UNRESTRICTED calculation
- ✅ Delegation Details with TOTAL DELEGATED
- ✅ Comma formatting for thousands
- ✅ Error handling for missing data
- ✅ Comprehensive Playwright tests (9/9 and 11/11)

**Known Limitations**:
- Vesting endpoint may fail with CORS (handled gracefully)
- Committed amount may fail for non-exchange accounts (defaults to 0)
- No localStorage persistence yet (security by design)
- Browser caching requires version bump for updates

**Ready to Resume**: All tests passing, code committed and pushed to GitHub.
