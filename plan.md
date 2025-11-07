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
│   ├── test-hash-price.js # Hash price fetch test
│   ├── test-wallet-info.js # Wallet info test (future)
│   └── package.json       # Playwright dependencies
├── test-wallet-apis.bb    # Babashka API endpoint tests
├── server.bb              # Babashka HTTP server
├── run-test.bb            # Babashka test runner
├── plan.md                # This file
├── CLAUDE.md              # AI assistant guidelines
├── context.md             # Critical context preservation
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
- Uses cljs-ajax (ajax.core/GET) for idiomatic Clojure HTTP requests
- Scittle plugins: scittle.cljs-ajax.js and scittle.promesa.js
- Automatic JSON parsing with `:keywords? true`
- Handler/error-handler pattern for async responses
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

### Phase 3: Wallet Info ✅ COMPLETED
**Status**: ✅ Complete
**Goal**: Fetch and display wallet information for given address using Reagent + re-frame

**🔒 CRITICAL SECURITY REQUIREMENTS 🔒**

**WALLET ADDRESS CONFIDENTIALITY - MANDATORY:**
1. ❌ **NEVER store wallet addresses on any server**
2. ❌ **NEVER commit wallet addresses to GitHub**
3. ❌ **NEVER send wallet addresses to any backend**
4. ✅ **Keep wallet addresses in browser memory only**
5. ✅ **Local storage ONLY with explicit user consent**
6. ✅ **Pure client-side application - no backend needed**
7. ✅ **All API calls from browser directly to Figure Markets**

**Implementation Rules:**
- Wallet address stays in browser state atom only
- User inputs address in text field (not URL params that get logged)
- If using localStorage, show consent dialog first
- Clear localStorage option always available
- No analytics or logging that captures addresses
- All fetching happens client-side using cljs-ajax

**🔍 CORS Discovery & Solution**:

**The Problem**:
- **Figure Markets API**: ✅ Has CORS enabled - works directly from browser
  - URL: `https://www.figuremarkets.com/service-hft-exchange/api/v1/markets`
  - Direct browser access works fine
- **Provenance API**: ❌ No CORS headers - browser blocked
  - URL: `https://service-explorer.provenance.io/api/v2/accounts/{wallet}`
  - Error: "No 'Access-Control-Allow-Origin' header is present"
  - Blocks all wallet info fetching from browser

**The Solution** (Elegant Accident!):
- pb-fm-mcp server acts as CORS-enabled proxy
- Originally built REST API endpoints for testing/debugging MCP functions
- These REST endpoints have CORS middleware (FastAPI)
- Server-side fetches to Provenance API (no CORS restrictions)
- Returns CORS-enabled responses to browser

**Proxy Endpoint Used**:
```
GET https://pb-fm-mcp-dev.creativeapptitude.com/api/fetch_account_info/{wallet_address}
```

**Returns**:
```json
{
  "account_type": "BASE_ACCOUNT",
  "account_is_vesting": true/false,
  "account_aum": {
    "amount": "1234567890",
    "denom": "nhash"
  }
}
```

**Architecture Benefit**: The REST API layer serves dual purposes:
1. Easy testing/debugging of MCP functions
2. CORS-enabled browser access (no separate proxy infrastructure needed!)

**✅ Completed Implementation**:

**1. Architecture Migration**:
- ✅ Migrated from manual DOM manipulation to **Reagent components**
- ✅ Implemented **re-frame** for centralized state management
- ✅ React-based rendering with Hiccup syntax
- ✅ Proper event handling through React props (no manual `addEventListener`)

**2. Dependencies Added**:
- ✅ React 18 and ReactDOM (required for Reagent)
- ✅ Scittle Reagent plugin (`scittle.reagent.js`)
- ✅ Scittle re-frame plugin (`scittle.re-frame.js`)
- ✅ Already had cljs-ajax and promesa plugins

**3. State Management (re-frame)**:
```clojure
;; App state (via re-frame db)
{:status :idle           ; :idle, :loading-price, :loading-wallet, :success, :error
 :hash-price nil         ; Current HASH price
 :wallet-address ""      ; User input wallet address
 :wallet-data nil        ; Fetched wallet account info
 :error nil}             ; Error message

;; Events for state updates
::initialize, ::update-wallet-address, ::loading-wallet,
::wallet-success, ::wallet-error, ::loading-price, ::price-success

;; Subscriptions for reactive data
::status, ::hash-price, ::wallet-address, ::wallet-data, ::error
```

**4. Reagent Components Built**:
- ✅ `wallet-input-component` - Text input + Fetch button
- ✅ `hash-price-component` - Display current HASH price
- ✅ `wallet-data-component` - Display account info in table
- ✅ `main-component` - Top-level app component

**5. API Integration**:
- ✅ HASH price: Direct call to Figure Markets (no CORS issues)
- ✅ Wallet info: Proxy call via pb-fm-mcp-dev (CORS-enabled)
- ✅ Error handling for invalid wallets
- ✅ Loading states for better UX

**Test Results**: ✅ 4/4 Passed
- ✅ Empty Wallet: Displays correctly
- ✅ No Vesting Wallet: Displays correctly
- ✅ Vesting Wallet: Displays correctly
- ✅ Invalid Wallet: Error handling works

**Version**: 0.6.0

---

## Wallet API Reference (from pb-fm-mcp)

### API Endpoints Overview

All endpoints are from **Provenance Blockchain Explorer API** and **Figure Markets API**.
Wallet address is passed as path parameter in format: `{wallet_address}` (Bech32 format).

### 1. Account Information

**Endpoint**: `https://service-explorer.provenance.io/api/v2/accounts/{wallet_address}`

**Purpose**: Get account type, vesting status, and AUM

**Returns**:
```json
{
  "flags": {
    "isVesting": true/false
  },
  "accountType": "BASE_ACCOUNT",
  "accountAum": {
    "amount": "1234567890",
    "denom": "nhash"
  }
}
```

**Key Fields**:
- `flags.isVesting` - Boolean: Is this a vesting account?
- `accountType` - String: Account type
- `accountAum` - Object: Assets under management

---

### 2. Vesting Information

**Endpoint**: `https://service-explorer.provenance.io/api/v3/accounts/{wallet_address}/vesting`

**Purpose**: Get vesting schedule and calculate vested/unvested amounts

**Returns**:
```json
{
  "originalVestingList": [
    {
      "amount": "1000000000000",
      "denom": "nhash"
    }
  ],
  "startTime": "2024-01-01T00:00:00Z",
  "endTime": "2026-01-01T00:00:00Z"
}
```

**Calculations** (done client-side):
- `vesting_original_amount` - Total HASH subject to vesting
- `vesting_total_vested_amount` - Amount vested as of current date (linear schedule)
- `vesting_total_unvested_amount` - Amount still vesting (not yet available)

**Formula**:
```
if now < start_time: vested = 0
if now > end_time: vested = original_amount
else: vested = original_amount * (now - start_time) / (end_time - start_time)
unvested = original_amount - vested
```

---

### 3. Delegation: Staked Amount

**Endpoint**: `https://service-explorer.provenance.io/api/v2/accounts/{wallet_address}/delegations`

**Purpose**: Get staked HASH with validators (earning rewards)

**Returns**:
```json
{
  "total": 5,
  "rollupTotals": {
    "bondedTotal": {
      "amount": "5000000000",
      "denom": "nhash"
    }
  }
}
```

**Key Fields**:
- `total` - Number of validators staked with
- `rollupTotals.bondedTotal.amount` - Total staked HASH (earns rewards)

---

### 4. Delegation: Rewards

**Endpoint**: `https://service-explorer.provenance.io/api/v2/accounts/{wallet_address}/rewards`

**Purpose**: Get earned rewards from staking (can be claimed immediately)

**Returns**:
```json
{
  "total": [
    {
      "amount": "123456789",
      "denom": "nhash"
    }
  ]
}
```

**Key Fields**:
- `total[0].amount` - Total rewards earned (can claim immediately)

---

### 5. Delegation: Unbonding

**Endpoint**: `https://service-explorer.provenance.io/api/v2/accounts/{wallet_address}/unbonding`

**Purpose**: Get HASH that is unbonding (21-day waiting period, no rewards)

**Returns**:
```json
{
  "rollupTotals": {
    "unbondingTotal": {
      "amount": "2000000000",
      "denom": "nhash"
    }
  }
}
```

**Key Fields**:
- `rollupTotals.unbondingTotal.amount` - Total unbonding HASH

---

### 6. Delegation: Redelegation

**Endpoint**: `https://service-explorer.provenance.io/api/v2/accounts/{wallet_address}/redelegations`

**Purpose**: Get HASH being redelegated between validators (earns rewards, 21-day period)

**Returns**:
```json
{
  "rollupTotals": {
    "redelegationTotal": {
      "amount": "1000000000",
      "denom": "nhash"
    }
  }
}
```

**Key Fields**:
- `rollupTotals.redelegationTotal.amount` - Total redelegated HASH

---

### 7. Liquid Balance

**Endpoint**: `https://service-explorer.provenance.io/api/v2/accounts/{wallet_address}/balances?count=20&page=1`

**Purpose**: Get liquid HASH available in wallet (not delegated or committed)

**Returns**:
```json
{
  "results": [
    {
      "denom": "nhash",
      "amount": "10000000000"
    }
  ]
}
```

**Key Fields**:
- Find entry where `denom === "nhash"`
- `amount` - Liquid HASH available for immediate use

---

### 8. Committed Amount (Figure Markets Exchange)

**Endpoint**: `https://api.provenance.io/provenance/exchange/v1/commitments/account/{wallet_address}`

**Purpose**: Get HASH committed to Figure Markets exchange

**Returns**:
```json
{
  "commitments": [
    {
      "market_id": 1,
      "amount": [
        {
          "denom": "nhash",
          "amount": "5000000000"
        }
      ]
    }
  ]
}
```

**Key Fields**:
- Filter for `market_id === 1` (Figure Markets)
- Find entry where `denom === "nhash"`
- `amount` - HASH committed to exchange

---

### Aggregated Delegation Summary

**Calculated client-side from endpoints 3-6**:

```javascript
delegated_earning_amount = staked_amount + redelegated_amount
delegated_not_earning_amount = rewards_amount + unbonding_amount
delegated_total_amount = earning_amount + not_earning_amount
```

**Categories**:
- **Earning rewards**: Staked + Redelegated
- **Not earning**: Rewards (claimable) + Unbonding (waiting)
- **Total delegated**: Sum of all above

---

### HASH Amount Denomination

**CRITICAL**: All amounts returned in **nhash** (nano-HASH)

**Conversion**:
```
1 HASH = 1,000,000,000 nhash
Display HASH = nhash / 1,000,000,000
```

**Example**:
```
nhash: 5000000000 → Display: 5.0000 HASH
nhash: 123456789 → Display: 0.1235 HASH (rounded to 4 decimals)
```

---

### Total HASH Holdings Formula

```
total_hash = liquid_balance
           + delegated_total_amount
           + committed_amount

available_hash = liquid_balance
               + rewards_amount (claimable)

committed_hash = staked_amount
               + redelegated_amount
               + unbonding_amount
               + committed_to_exchange

unvested_hash = vesting_total_unvested_amount (if vesting account)
```

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

**Active Phase**: Phase 3 - Wallet Information ✅ COMPLETE

**Recent Changes** (Phase 3):
- ✅ Discovered CORS issue with Provenance API
- ✅ Found elegant solution: pb-fm-mcp server as CORS proxy
- ✅ Migrated from manual DOM to Reagent + re-frame architecture
- ✅ Added React 18, ReactDOM, Reagent, and re-frame dependencies
- ✅ Complete rewrite of core.cljs with Reagent components
- ✅ Implemented re-frame events and subscriptions
- ✅ Created comprehensive Playwright tests for 4 wallet scenarios
- ✅ All tests passing: 4/4 wallet scenarios validated

**Test Results**:
```
Phase 1:
🎉 HELLO WORLD TEST PASSED

Phase 2:
🎉 HASH PRICE TEST PASSED
✅ HASH price: $0.0300

Phase 3:
🎉 WALLET INFO TESTS PASSED
✅ Empty Wallet: Passed
✅ No Vesting Wallet: Passed
✅ Vesting Wallet: Passed
✅ Invalid Wallet: Passed (error handling)
```

**Key Achievement**:
Discovered that pb-fm-mcp server's REST API (originally built for MCP function testing)
naturally solves browser CORS restrictions - no separate proxy infrastructure needed!

**Next Steps (Phase 4)**:
- Add remaining 7 API endpoints for complete wallet data
- Implement concurrent fetching with promesa
- Display comprehensive wallet information (delegations, rewards, vesting, etc.)

---

## Testing Strategy

### API Endpoint Testing (Babashka)

**Before implementing UI, validate all 8 wallet API endpoints:**

```bash
# Source wallet environment variables
. ~/.wallet-env.sh

# Run API tests (tests all 4 wallet scenarios)
bb test-wallet-apis.bb
```

**What it tests**:
- All 8 Provenance/Figure Markets API endpoints
- WALLET_EMPTY - Zero balances (empty wallet)
- WALLET_NO_VESTING - Normal wallet with holdings
- WALLET_VESTING - Vesting account with delegations
- WALLET_INVALID - Error handling for invalid addresses

**Security**: Script only logs environment variable NAMES, never actual wallet addresses.

**Output**: Shows all amounts in nhash, validates API response structures

---

### Local Development
1. Start local server: `bb server.bb 8000`
2. Open browser: http://localhost:8000
3. Check console for errors
4. Verify visual output

### Automated Testing (Playwright)
1. Install Playwright: `npm install playwright`
2. Source wallet env vars: `. ~/.wallet-env.sh`
3. Run test: `bb run-test.bb test-wallet-info.js`
4. Fix any failures before moving forward

**Playwright tests use environment variables**:
- Reads from WALLET_EMPTY, WALLET_NO_VESTING, etc.
- Fills wallet input field programmatically
- Verifies data displays correctly
- Never stores wallet addresses

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
