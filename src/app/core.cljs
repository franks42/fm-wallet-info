(ns app.core
  (:require [ajax.core :refer [GET]]))

;; State
(defonce state (atom {:status :loading
                      :hash-price nil
                      :error nil}))

;; Render function
(defn render []
  (when-let [app-div (js/document.getElementById "app")]
    (let [{:keys [status hash-price error]} @state]
      (set! (.-innerHTML app-div)
            (case status
              :loading
              "<div class='bg-gray-800 border border-blue-500 rounded-lg p-8'>
                 <h2 class='text-3xl font-bold text-blue-400 mb-4'>Loading HASH Price...</h2>
                 <p class='text-gray-300'>Fetching data from Figure Markets</p>
               </div>"

              :success
              (str "<div class='bg-gray-800 border border-green-500 rounded-lg p-8'>
                      <h2 class='text-3xl font-bold text-green-400 mb-4'>HASH Price</h2>
                      <div class='text-center my-8'>
                        <div class='text-6xl font-bold text-white'>$" hash-price "</div>
                        <p class='text-gray-400 mt-2'>HASH-USD</p>
                      </div>
                      <p class='text-gray-400 text-sm mt-4'>Data from Figure Markets API</p>
                      <p class='text-gray-500 text-xs mt-2'>Phase 2: HASH Price Display ✅</p>
                    </div>")

              :error
              (str "<div class='bg-gray-800 border border-red-500 rounded-lg p-8'>
                      <h2 class='text-3xl font-bold text-red-400 mb-4'>Error Loading Price</h2>
                      <p class='text-gray-300'>" error "</p>
                      <p class='text-gray-500 text-sm mt-4'>Please try refreshing the page</p>
                    </div>"))))))

;; Fetch HASH price from Figure Markets using cljs-ajax
(defn fetch-hash-price []
  (js/console.log "🚀 Fetching HASH price from Figure Markets (using cljs-ajax)...")

  (GET "https://www.figuremarkets.com/service-hft-exchange/api/v1/markets"
    {:handler (fn [response]
                (js/console.log "✅ Data received from Figure Markets")
                (js/console.log "📊 Response contains" (count (:data response)) "markets")

                (let [markets (:data response)
                      hash-market (first (filter #(= (:symbol %) "HASH-USD") markets))]
                  (if hash-market
                    (let [price (js/parseFloat (:midMarketPrice hash-market))]
                      (js/console.log "💰 HASH price:" price)
                      (swap! state assoc
                             :status :success
                             :hash-price (.toFixed price 4))
                      (render))
                    (do
                      (js/console.error "❌ HASH-USD not found in markets data")
                      (swap! state assoc
                             :status :error
                             :error "HASH-USD market not found")
                      (render)))))

     :error-handler (fn [error]
                      (js/console.error "❌ Error fetching HASH price:" error)
                      (let [error-msg (or (:status-text error)
                                          (:last-error error)
                                          "Network error")]
                        (swap! state assoc
                               :status :error
                               :error error-msg)
                        (render)))

     :response-format :json
     :keywords? true}))

;; Initialize the app
(defn init []
  (js/console.log "🚀 FM Wallet Info - ClojureScript loaded successfully!")
  (render)
  (fetch-hash-price))

;; Start the app
(init)
