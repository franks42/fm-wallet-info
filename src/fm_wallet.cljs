(ns fm-wallet
  "Simple Figure Markets HASH price tracker"
  (:require [reagent.core :as r]
            [reagent.dom :as rdom]))

(js/console.log "📦 CLJS: Namespace fm-wallet loading...")
(js/console.log "📦 CLJS: Reagent core:", (if r "✅ Found" "❌ Missing"))
(js/console.log "📦 CLJS: Reagent dom:", (if rdom "✅ Found" "❌ Missing"))

;; ============================================================================
;; State Management
;; ============================================================================

(js/console.log "📦 CLJS: Creating app-state atom...")
(defonce app-state
  (r/atom {:loading? true
           :error nil
           :hash-data nil
           :last-updated nil}))
(js/console.log "✅ CLJS: app-state created:", @app-state)

;; ============================================================================
;; Figure Markets API
;; ============================================================================

(def figure-markets-api "https://www.figuremarkets.com/service-hft-exchange/api/v1/markets")

(defn fetch-hash-price!
  "Fetch HASH price from Figure Markets API"
  []
  (js/console.log "🚀 CLJS: fetch-hash-price! called")
  (js/console.log "🚀 CLJS: API URL:", figure-markets-api)
  (swap! app-state assoc :loading? true :error nil)
  (js/console.log "🚀 CLJS: State updated to loading")

  (-> (js/fetch figure-markets-api)
      (.then (fn [response]
               (js/console.log "📡 CLJS: Got response, status:" (.-status response) "ok:" (.-ok response))
               (if (.-ok response)
                 (do
                   (js/console.log "📡 CLJS: Response OK, parsing JSON...")
                   (.json response))
                 (throw (js/Error. (str "HTTP Error: " (.-status response)))))))
      (.then (fn [data]
               (js/console.log "✅ CLJS: JSON parsed, data received")
               (js/console.log "✅ CLJS: Data keys:", (js/Object.keys data))
               (let [markets (.-data data)]
                 (js/console.log "✅ CLJS: Markets array length:" (.-length markets))
                 (let [hash-market (->> markets
                                       (filter #(= (.-symbol %) "HASH-USD"))
                                       first)]
                   (js/console.log "✅ CLJS: HASH-USD market:" (if hash-market "Found" "NOT FOUND"))
                   (if hash-market
                     (let [hash-info {:symbol (.-symbol hash-market)
                                   :price (js/parseFloat (.-midMarketPrice hash-market))
                                   :change-24h (* (js/parseFloat (.-percentageChange24h hash-market)) 100)
                                   :volume-24h (js/parseFloat (.-volume24h hash-market))
                                   :high-24h (js/parseFloat (.-high24h hash-market))
                                   :low-24h (js/parseFloat (.-low24h hash-market))
                                   :bid (js/parseFloat (.-bestBid hash-market))
                                   :ask (js/parseFloat (.-bestAsk hash-market))
                                   :last-price (js/parseFloat (.-lastTradedPrice hash-market))
                                   :trades-24h (js/parseInt (.-tradeCount24h hash-market))}]
                       (js/console.log "📊 CLJS: HASH data extracted:" (clj->js hash-info))
                       (js/console.log "📊 CLJS: Updating app-state with HASH data...")
                       (swap! app-state assoc
                              :hash-data hash-info
                              :loading? false
                              :last-updated (js/Date.))
                       (js/console.log "✅ CLJS: App state updated successfully, loading=false"))
                     (do
                       (js/console.error "❌ CLJS: HASH-USD market not found in response")
                       (swap! app-state assoc
                              :loading? false
                              :error "HASH-USD market not found")))))))
      (.catch (fn [error]
                (js/console.error "❌ CLJS: Fetch error occurred")
                (js/console.error "❌ CLJS: Error message:", (.-message error))
                (js/console.error "❌ CLJS: Error object:", error)
                (swap! app-state assoc
                       :loading? false
                       :error (.-message error))))))

;; ============================================================================
;; Formatting Helpers
;; ============================================================================

(defn format-price [price]
  (if (and price (not (js/isNaN price)))
    (.toFixed price 4)
    "N/A"))

(defn format-volume [volume]
  (if (and volume (not (js/isNaN volume)))
    (let [vol (js/parseFloat volume)]
      (cond
        (>= vol 1000000) (str (.toFixed (/ vol 1000000) 2) "M")
        (>= vol 1000) (str (.toFixed (/ vol 1000) 2) "K")
        :else (.toFixed vol 2)))
    "N/A"))

(defn format-change [change]
  (if (and change (not (js/isNaN change)))
    (str (if (pos? change) "+" "") (.toFixed change 2) "%")
    "N/A"))

(defn change-color-class [change]
  (cond
    (nil? change) "text-gray-400"
    (pos? change) "text-neon-green"
    (neg? change) "text-neon-red"
    :else "text-gray-400"))

(defn change-bg-class [change]
  (cond
    (nil? change) "bg-gray-800/20"
    (pos? change) "bg-neon-green/10"
    (neg? change) "bg-neon-red/10"
    :else "bg-gray-800/20"))

(defn format-time [date]
  (if date
    (let [hours (.getHours date)
          minutes (.getMinutes date)
          seconds (.getSeconds date)]
      (str (.padStart (str hours) 2 "0") ":"
           (.padStart (str minutes) 2 "0") ":"
           (.padStart (str seconds) 2 "0")))
    ""))

;; ============================================================================
;; Components
;; ============================================================================

(defn loading-spinner []
  [:div.flex.flex-col.items-center.justify-center.py-12
   [:svg.animate-spin.h-16.w-16.text-neon-cyan.mb-4
    {:xmlns "http://www.w3.org/2000/svg"
     :fill "none"
     :viewBox "0 0 24 24"}
    [:circle.opacity-25
     {:cx "12" :cy "12" :r "10"
      :stroke "currentColor"
      :stroke-width "4"}]
    [:path.opacity-75
     {:fill "currentColor"
      :d "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"}]]
   [:p.text-gray-400.text-lg "Loading HASH price..."]])

(defn error-display [error]
  [:div.bg-red-900/20.border-2.border-red-500/50.rounded-lg.p-6.text-center
   [:div.text-5xl.mb-4 "⚠️"]
   [:h2.text-2xl.font-bold.text-red-400.mb-2 "Error Loading Data"]
   [:p.text-gray-300.mb-4 error]
   [:button.bg-neon-cyan.hover:bg-neon-cyan/80.text-black.font-bold.py-2.px-6.rounded-lg.transition-colors
    {:on-click fetch-hash-price!}
    "Retry"]])

(defn stat-item [label value & [custom-class]]
  [:div.flex.justify-between.items-center.py-2.border-b.border-gray-700/50
   [:span.text-gray-400.text-sm label]
   [:span {:class (or custom-class "text-white font-semibold")} value]])

(defn hash-card [{:keys [symbol price change-24h volume-24h high-24h low-24h
                         bid ask last-price trades-24h]}]
  [:div.bg-gradient-to-br.from-gray-900.to-gray-800.border-2.border-neon-green/30.rounded-2xl.p-8.shadow-2xl.hover:border-neon-green/50.transition-all.duration-300

   ;; Header with symbol and current price
   [:div.flex.justify-between.items-start.mb-6
    [:div
     [:h2.text-4xl.font-black.text-neon-green.mb-1 "HASH"]
     [:p.text-gray-400.text-sm "Figure Markets Hash Token"]]
    [:div.text-right
     [:div.text-4xl.font-bold.text-white (str "$" (format-price price))]
     [:div {:class (str "text-lg font-semibold mt-1 px-3 py-1 rounded-lg inline-block "
                       (change-bg-class change-24h) " " (change-color-class change-24h))}
      (format-change change-24h)]]]

   ;; Divider
   [:div.border-t.border-gray-700.my-6]

   ;; Market Stats
   [:div.space-y-1
    [:h3.text-sm.font-bold.text-gray-400.uppercase.tracking-wider.mb-3 "24 Hour Statistics"]
    [stat-item "Volume" (str "$" (format-volume volume-24h))]
    [stat-item "High" (str "$" (format-price high-24h))]
    [stat-item "Low" (str "$" (format-price low-24h))]
    [stat-item "Trades" trades-24h]]

   ;; Divider
   [:div.border-t.border-gray-700.my-6]

   ;; Order Book
   [:div.space-y-1
    [:h3.text-sm.font-bold.text-gray-400.uppercase.tracking-wider.mb-3 "Order Book"]
    [stat-item "Best Bid" (str "$" (format-price bid)) "text-neon-green font-semibold"]
    [stat-item "Best Ask" (str "$" (format-price ask)) "text-neon-red font-semibold"]
    [stat-item "Last Price" (str "$" (format-price last-price))]
    [stat-item "Spread"
     (let [spread (if (and bid ask (not (js/isNaN bid)) (not (js/isNaN ask)))
                   (- ask bid)
                   0)]
       (str "$" (format-price spread)))]]])

(defn main-view []
  (let [{:keys [loading? error hash-data last-updated]} @app-state]
    [:div
     (cond
       loading? [loading-spinner]
       error [error-display error]
       hash-data [hash-card hash-data]
       :else [:div.text-center.text-gray-400 "No data available"])

     ;; Last updated and refresh button
     (when (and (not loading?) hash-data)
       [:div.mt-6.flex.justify-between.items-center
        [:div.text-gray-500.text-sm
         "Last updated: " (format-time last-updated)]
        [:button.bg-neon-cyan/20.hover:bg-neon-cyan/30.border.border-neon-cyan/40.text-neon-cyan.font-semibold.py-2.px-6.rounded-lg.transition-all.duration-200
         {:on-click fetch-hash-price!}
         "🔄 Refresh"]])]))

;; ============================================================================
;; App Initialization
;; ============================================================================

(defn ^:dev/after-load mount-root []
  (js/console.log "🎯 CLJS: mount-root called")
  (let [app-element (.getElementById js/document "app")]
    (if app-element
      (do
        (js/console.log "🎯 CLJS: Found #app element")
        (js/console.log "🎯 CLJS: Rendering Reagent component...")
        (rdom/render [main-view] app-element)
        (js/console.log "✅ CLJS: Reagent render complete"))
      (js/console.error "❌ CLJS: #app element NOT FOUND"))))

(defn init []
  (js/console.log "🚀 CLJS: init function called")
  (js/console.log "🚀 CLJS: Calling mount-root...")
  (mount-root)
  (js/console.log "🚀 CLJS: Calling fetch-hash-price...")
  (fetch-hash-price!)

  ;; Auto-refresh every 30 seconds
  (js/console.log "🚀 CLJS: Setting up 30s auto-refresh interval...")
  (js/setInterval fetch-hash-price! 30000)
  (js/console.log "✅ CLJS: App initialization complete!"))

;; Start the app
(js/console.log "🎬 CLJS: About to call init()...")
(init)
(js/console.log "🎬 CLJS: init() call completed")
