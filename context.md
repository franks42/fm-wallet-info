# FM Wallet Info - Critical Context

**Last Updated**: 2025-11-07 after Phase 2 completion

## Project Status

- **Phase 1**: ✅ COMPLETE - Hello World with Scittle/CLJS
- **Phase 2**: ✅ COMPLETE - HASH price display from Figure Markets API using cljs-ajax
- **Phase 3**: TBD - Wallet information functionality

## Key Technical Decisions

### Why cljs-ajax Instead of Native fetch

**User requirement**: "we will be doing a lot of fetching in the near future for this project and I want us to use cljs where we can - use the ajax and promesa cdn packages"

The reference project (figure-fm-hash-prices) loads scittle.cljs-ajax.js but actually uses native js/fetch in their code. We corrected this to use idiomatic Clojure throughout.

### Current Stack

**HTML Setup** (index.html v0.3.0):
```html
<script defer src="https://cdn.jsdelivr.net/npm/scittle@0.7.28/dist/scittle.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/scittle@0.7.28/dist/scittle.cljs-ajax.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/scittle@0.7.28/dist/scittle.promesa.js"></script>
<script type="application/x-scittle" src="src/app/core.cljs?v=0.3.0"></script>
```

**CLJS Pattern** (src/app/core.cljs):
```clojure
(ns app.core
  (:require [ajax.core :refer [GET]]))

(GET "https://www.figuremarkets.com/service-hft-exchange/api/v1/markets"
  {:handler (fn [response] ...)
   :error-handler (fn [error] ...)
   :response-format :json
   :keywords? true})
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

### Scittle Load Order

Scripts MUST load in this order:
1. Tailwind CSS
2. Scittle base (scittle.js)
3. Scittle plugins (cljs-ajax, promesa, etc.)
4. Application CLJS files

Use `defer` attribute on all Scittle scripts.

## Available Scittle Plugins (v0.7.28)

From `https://cdn.jsdelivr.net/npm/scittle@0.7.28/dist/`:

- **scittle.js** - Core interpreter (required)
- **scittle.cljs-ajax.js** - HTTP (ajax.core) ✅ Currently using
- **scittle.promesa.js** - Promises ✅ Currently using
- **scittle.reagent.js** - React wrapper (needs React)
- **scittle.re-frame.js** - State mgmt (needs Reagent)
- **scittle.replicant.js** - Alt React wrapper
- **scittle.pprint.js** - Pretty printing
- **scittle.nrepl.js** - REPL connectivity

## Project Structure

```
fm-wallet-info/
├── index.html              # Entry point (v0.3.0)
├── src/app/core.cljs      # Main app logic
├── server.bb              # Babashka HTTP server (http-kit)
├── run-test.bb            # Test runner with lifecycle
├── test/
│   ├── test-hello.js      # Phase 1 test
│   ├── test-hash-price.js # Phase 2 test
│   └── package.json       # Playwright deps
├── tmp/
│   └── figure-fm-hash-prices/ # Reference project
├── plan.md                # Detailed planning
├── CLAUDE.md              # AI guidelines
├── context.md             # This file
└── README.md              # User docs
```

## Testing Workflow

```bash
# Run specific test
bb run-test.bb test-hash-price.js

# Manual server
bb server.bb 8000

# Run test directly (server must be running)
cd test && node test-hash-price.js
```

## Git Tags

- **v0.1.0** - Phase 1: Hello World
- **v0.2.0** - Phase 2: HASH price with native fetch
- **v0.3.0** - (pending) Phase 2 update: switched to cljs-ajax

## API Integration

**Figure Markets API**:
- Endpoint: `https://www.figuremarkets.com/service-hft-exchange/api/v1/markets`
- Returns array in `data` field
- Each market has: `symbol`, `midMarketPrice`, `high24h`, `low24h`, etc.
- Filter for `symbol: "HASH-USD"`
- Display `midMarketPrice` with 4 decimal places

**Current Response**:
- 21 markets total
- HASH-USD price: ~$0.0300

## State Management Pattern

```clojure
(defonce state (atom {:status :loading    ; or :success, :error
                      :hash-price nil
                      :error nil}))

(defn render []
  (let [{:keys [status hash-price error]} @state]
    (case status
      :loading "Loading..."
      :success (str "Price: $" hash-price)
      :error (str "Error: " error))))
```

## GitHub Pages

- **Repo**: https://github.com/franks42/fm-wallet-info
- **Live URL**: https://franks42.github.io/fm-wallet-info/
- **Config**: Settings → Pages → Source: main branch, / (root)
- **Special files**: .nojekyll (bypass Jekyll processing)

## Common Issues

1. **Port 8000 in use**: `lsof -ti:8000 | xargs kill -9`
2. **404 on .cljs files**: Check .nojekyll exists
3. **Caching issues**: Version query param in HTML (e.g., `?v=0.3.0`)
4. **Destructuring errors**: Use `first`, `second`, `nth` instead
5. **Script load order**: Scittle plugins must load after scittle.js

## Next Steps for Phase 3

User will define wallet information requirements. Be prepared to:
- Fetch wallet data from Figure Markets API
- Display wallet holdings, balances, transactions
- Handle multiple wallet addresses
- Add more complex UI components
- Consider using Reagent if UI complexity increases

## Reference Project Insights

**figure-fm-hash-prices**:
- Located in `tmp/figure-fm-hash-prices/`
- Uses Re-frame + Reagent (more complex)
- Loads scittle.cljs-ajax.js but uses native fetch (inconsistent)
- Good reference for API responses but we simplified approach
- Our project is simpler and more consistent with Clojure idioms

## Development Principles

1. **Test before deploy**: All Playwright tests must pass
2. **Keep it simple**: Don't add complexity until needed
3. **Idiomatic Clojure**: Use cljs-ajax, not js interop
4. **Document everything**: Update plan.md and CLAUDE.md
5. **Version control**: Tag every phase completion

## Latest Test Results

```
🎉 HASH PRICE TEST PASSED
✅ Data received from Figure Markets
📊 Response contains 21 markets
💰 HASH price: 0.03
✅ Price displayed in UI: $0.0300
✅ Price format correct
```

**Console logs working**:
- "🚀 Fetching HASH price from Figure Markets (using cljs-ajax)..."
- "✅ Data received from Figure Markets"
- "📊 Response contains 21 markets"
- "💰 HASH price: 0.03"

All detailed logging verified through Playwright console monitoring.
