(ns app.core
  (:require [reagent.dom :as rdom]
            [re-frame.core :as rf]
            [ajax.core :refer [GET]]))

;; =============================================================================
;; Re-frame Events
;; =============================================================================

;; Initialize app state
(rf/reg-event-db
  ::initialize
  (fn [_ _]
    {:status :idle  ; :idle, :loading-price, :loading-wallet, :success, :error
     :hash-price nil
     :wallet-address ""
     :wallet-data nil
     :error nil}))

;; Update wallet address input
(rf/reg-event-db
  ::update-wallet-address
  (fn [db [_ address]]
    (assoc db :wallet-address address)))

;; Start loading wallet data
(rf/reg-event-db
  ::loading-wallet
  (fn [db _]
    (assoc db :status :loading-wallet :error nil :wallet-data nil)))

;; Wallet data loaded successfully
(rf/reg-event-db
  ::wallet-success
  (fn [db [_ wallet-data]]
    (assoc db :status :success :wallet-data wallet-data)))

;; Wallet data error
(rf/reg-event-db
  ::wallet-error
  (fn [db [_ error-msg]]
    (assoc db :status :error :error error-msg)))

;; Start loading HASH price
(rf/reg-event-db
  ::loading-price
  (fn [db _]
    (assoc db :status :loading-price)))

;; HASH price loaded
(rf/reg-event-db
  ::price-success
  (fn [db [_ price]]
    (assoc db :status :idle :hash-price price)))

;; =============================================================================
;; Re-frame Subscriptions
;; =============================================================================

(rf/reg-sub ::status (fn [db _] (:status db)))
(rf/reg-sub ::hash-price (fn [db _] (:hash-price db)))
(rf/reg-sub ::wallet-address (fn [db _] (:wallet-address db)))
(rf/reg-sub ::wallet-data (fn [db _] (:wallet-data db)))
(rf/reg-sub ::error (fn [db _] (:error db)))

;; =============================================================================
;; API Calls
;; =============================================================================

(defn fetch-all-wallet-data [wallet-address]
  (js/console.log "🔍 Fetching wallet data from multiple endpoints for:" wallet-address)
  (rf/dispatch [::loading-wallet])

  (let [base-url "https://pb-fm-mcp-dev.creativeapptitude.com/api"
        results (atom {:count 0 :data {}})]

    (letfn [(check-complete []
              (when (= (:count @results) 4)
                (js/console.log "✅ All wallet data received" @results)
                (rf/dispatch [::wallet-success (:data @results)])))]

      ;; Fetch delegation data
      (GET (str base-url "/fetch_total_delegation_data/" wallet-address)
        {:handler (fn [resp]
                    (js/console.log "✅ Delegation data received")
                    (swap! results update :count inc)
                    (swap! results assoc-in [:data :delegation] resp)
                    (check-complete))
         :error-handler (fn [_]
                          (js/console.error "❌ Delegation error - using default")
                          (swap! results update :count inc)
                          (swap! results assoc-in [:data :delegation] nil)
                          (check-complete))
         :response-format :json :keywords? true})

      ;; Fetch liquid balance
      (GET (str base-url "/wallet_liquid_balance/" wallet-address)
        {:handler (fn [resp]
                    (js/console.log "✅ Liquid balance received")
                    (swap! results update :count inc)
                    (swap! results assoc-in [:data :liquid] (:wallet_liquid_balance resp))
                    (check-complete))
         :error-handler (fn [_]
                          (js/console.error "❌ Liquid balance error - using default")
                          (swap! results update :count inc)
                          (swap! results assoc-in [:data :liquid] {:amount 0 :denom "nhash"})
                          (check-complete))
         :response-format :json :keywords? true})

      ;; Fetch committed amount (may fail due to CORS or no exchange account)
      (GET (str base-url "/fetch_available_committed_amount/" wallet-address)
        {:handler (fn [resp]
                    (js/console.log "✅ Committed amount received")
                    (swap! results update :count inc)
                    (swap! results assoc-in [:data :committed] (:available_committed_amount resp))
                    (check-complete))
         :error-handler (fn [_]
                          (js/console.log "ℹ️ No committed amount (no exchange account or CORS)")
                          (swap! results update :count inc)
                          (swap! results assoc-in [:data :committed] {:amount 0 :denom "nhash"})
                          (check-complete))
         :response-format :json :keywords? true})

      ;; Fetch vesting data (may fail for non-vesting accounts - that's okay)
      (GET (str base-url "/fetch_vesting_total_unvested_amount/" wallet-address)
        {:handler (fn [resp]
                    (js/console.log "✅ Vesting data received")
                    (swap! results update :count inc)
                    (swap! results assoc-in [:data :vesting] resp)
                    (check-complete))
         :error-handler (fn [_]
                          (js/console.log "ℹ️ No vesting data (expected for non-vesting accounts)")
                          (swap! results update :count inc)
                          (swap! results assoc-in [:data :vesting] nil)
                          (check-complete))
         :response-format :json :keywords? true}))))

(defn fetch-hash-price []
  (js/console.log "🚀 Fetching HASH price from Figure Markets...")
  (rf/dispatch [::loading-price])

  (GET "https://www.figuremarkets.com/service-hft-exchange/api/v1/markets"
    {:handler (fn [response]
                (js/console.log "✅ Markets data received")
                (let [markets (:data response)
                      hash-market (first (filter #(= (:symbol %) "HASH-USD") markets))]
                  (if hash-market
                    (let [price (js/parseFloat (:midMarketPrice hash-market))]
                      (js/console.log "💰 HASH price:" price)
                      (rf/dispatch [::price-success (.toFixed price 3)]))
                    (js/console.error "❌ HASH-USD not found in markets"))))

     :error-handler (fn [error]
                      (js/console.error "❌ Error fetching HASH price:" error))

     :response-format :json
     :keywords? true}))

;; =============================================================================
;; Helper Functions
;; =============================================================================

(defn format-number-with-commas
  "Add commas to a number string for thousands separation"
  [num-str]
  (let [[whole decimal] (.split num-str ".")
        regex (js/RegExp. "\\B(?=(\\d{3})+(?!\\d))" "g")
        with-commas (.replace whole regex ",")]
    (if decimal
      (str with-commas "." decimal)
      with-commas)))

(defn nhash->hash
  "Convert nhash (nanohash) to HASH with comma formatting. 1 HASH = 1,000,000,000 nhash"
  [nhash-amount]
  (when nhash-amount
    (let [amount-num (if (number? nhash-amount)
                      nhash-amount
                      (js/parseFloat nhash-amount))
          formatted (.toFixed (/ amount-num 1000000000) 2)]
      (format-number-with-commas formatted))))

(defn format-delegation-amount
  "Format delegation amount from API response (without HASH suffix)"
  [amount-obj]
  (when amount-obj
    (let [amount (:amount amount-obj)]
      (if (and amount (> amount 0))
        (nhash->hash amount)
        "0.00"))))

;; =============================================================================
;; Reagent Components (return Hiccup)
;; =============================================================================

(defn wallet-input-component []
  (let [wallet-address @(rf/subscribe [::wallet-address])
        status @(rf/subscribe [::status])
        loading? (= status :loading-wallet)]
    [:div {:class "bg-gray-800 border border-blue-500 rounded-lg p-8 mb-6"}
     [:h2 {:class "text-2xl font-bold text-blue-400 mb-4"} "Enter Wallet Address"]
     [:div {:class "flex gap-4"}
      [:input {:type "text"
               :id "wallet-address-input"
               :value wallet-address
               :placeholder "pb1..."
               :on-change #(rf/dispatch [::update-wallet-address (-> % .-target .-value)])
               :class "flex-1 px-4 py-2 bg-gray-900 border border-gray-600 rounded text-white focus:border-blue-500 focus:outline-none"}]
      [:button {:id "fetch-wallet-data-button"
                :disabled loading?
                :on-click #(when-not (empty? wallet-address)
                            (fetch-all-wallet-data wallet-address))
                :class "px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold disabled:bg-gray-600 disabled:cursor-not-allowed"}
       (if loading? "Loading..." "Fetch Data")]]]))

(defn hash-price-component []
  (let [hash-price @(rf/subscribe [::hash-price])
        status @(rf/subscribe [::status])]
    (cond
      (= status :loading-price)
      [:div {:class "bg-gray-800 border border-blue-500 rounded-lg p-6 mb-6"}
       [:p {:class "text-gray-400"} "Loading HASH price..."]]

      hash-price
      [:div {:class "bg-gray-800 border border-green-500 rounded-lg p-6 mb-6"}
       [:div {:class "flex justify-between items-center"}
        [:span {:class "text-gray-400"} "Current HASH Price:"]
        [:span {:class "text-2xl font-bold text-green-400"} (str "$" hash-price)]]]

      :else
      [:div {:class "bg-gray-800 border border-gray-600 rounded-lg p-6 mb-6"}
       [:p {:class "text-gray-500"} "HASH price not loaded"]])))

(defn wallet-data-component []
  (let [wallet-data @(rf/subscribe [::wallet-data])
        status @(rf/subscribe [::status])
        error @(rf/subscribe [::error])]
    (cond
      (= status :loading-wallet)
      [:div {:class "bg-gray-800 border border-blue-500 rounded-lg p-8"}
       [:h2 {:class "text-2xl font-bold text-blue-400 mb-4"} "Loading Wallet Data..."]
       [:p {:class "text-gray-400"} "Fetching account information..."]]

      (= status :error)
      [:div {:class "bg-gray-800 border border-red-500 rounded-lg p-8"}
       [:h2 {:class "text-2xl font-bold text-red-400 mb-4"} "Error"]
       [:p {:class "text-gray-300"} error]
       [:p {:class "text-gray-500 text-sm mt-4"} "Please check the wallet address and try again"]]

      wallet-data
(let [liquid (:liquid wallet-data)
      committed (:committed wallet-data)
      vesting (:vesting wallet-data)
      delegation (:delegation wallet-data)

      ;; Calculate amounts (all in nhash)
      liquid-amt (get liquid :amount 0)
      committed-amt (get committed :amount 0)
      unvested-amt (get vesting :vesting_total_unvested_amount 0)
      delegated-amt (get-in delegation [:delegated_total_delegated_amount :amount] 0)

      ;; Wallet Total = liquid + committed + delegated
      wallet-total (+ liquid-amt committed-amt delegated-amt)
      ;; Available = wallet total - unvested
      available-amt (- wallet-total unvested-amt)]

  [:div {:class "space-y-6"}
   ;; Balance Overview Section
   [:div {:class "bg-gray-800 border border-green-500 rounded-lg p-8"}
    [:h2 {:class "text-2xl font-bold text-green-400 mb-4"} "Account Balance"]
    [:table {:class "w-full text-left"}
     [:thead
      [:tr {:class "border-b border-gray-700"}
       [:th {:class "py-2 text-gray-400"} "Category"]
       [:th {:class "py-2 text-gray-400 text-right"} "Amount [HASH]"]]]
     [:tbody
      [:tr {:class "border-b border-gray-700"}
       [:td {:class "py-3 text-gray-400"} "Liquid"]
       [:td {:class "py-3 text-white text-right" :style {:font-variant-numeric "tabular-nums"}} (nhash->hash liquid-amt)]]
      [:tr {:class "border-b border-gray-700"}
       [:td {:class "py-3 text-gray-400"} "Committed"]
       [:td {:class "py-3 text-white text-right" :style {:font-variant-numeric "tabular-nums"}} (nhash->hash committed-amt)]]
      [:tr {:class "border-b border-gray-700"}
       [:td {:class "py-3 text-gray-400"} "Delegated"]
       [:td {:class "py-3 text-white text-right" :style {:font-variant-numeric "tabular-nums"}} (nhash->hash delegated-amt)]]

      ;; Wallet Total row
      [:tr {:class "border-t-2 border-gray-600 font-bold"}
       [:td {:class "py-3 text-gray-300"} "WALLET TOTAL"]
       [:td {:class "py-3 text-gray-300 text-right text-xl" :style {:font-variant-numeric "tabular-nums"}} (nhash->hash wallet-total)]]

      ;; Show unvested if present
      (when (and vesting (> unvested-amt 0))
        [:tr {:class "border-b border-gray-700"}
         [:td {:class "py-3 text-gray-400"} "Unvested"]
         [:td {:class "py-3 text-yellow-400 text-right" :style {:font-variant-numeric "tabular-nums"}} (nhash->hash unvested-amt)]])

      ;; Unrestricted row (only show if unvested exists)
      (when (and vesting (> unvested-amt 0))
        [:tr {:class "border-t-2 border-green-500 font-bold"}
         [:td {:class "py-3 text-green-300"} "UNRESTRICTED"]
         [:td {:class "py-3 text-green-300 text-right text-xl" :style {:font-variant-numeric "tabular-nums"}} (nhash->hash available-amt)]])]]]

   ;; Delegation Details Section
   (when delegation
     [:div {:class "bg-gray-800 border border-purple-500 rounded-lg p-8"}
      [:h2 {:class "text-2xl font-bold text-purple-400 mb-4"} "Delegation Details"]
      [:table {:class "w-full text-left"}
       [:thead
        [:tr {:class "border-b border-gray-700"}
         [:th {:class "py-2 text-gray-400"} "Category"]
         [:th {:class "py-2 text-gray-400 text-right"} "Amount [HASH]"]]]
       [:tbody
        [:tr {:class "border-b border-gray-700"}
         [:td {:class "py-3 text-gray-400"} "Staked"]
         [:td {:class "py-3 text-white text-right" :style {:font-variant-numeric "tabular-nums"}} (format-delegation-amount (:delegated_staked_amount delegation))]]
        [:tr {:class "border-b border-gray-700"}
         [:td {:class "py-3 text-gray-400"} "Rewards"]
         [:td {:class "py-3 text-green-400 text-right" :style {:font-variant-numeric "tabular-nums"}} (format-delegation-amount (:delegated_rewards_amount delegation))]]
        [:tr {:class "border-b border-gray-700"}
         [:td {:class "py-3 text-gray-400"} "Unbonding"]
         [:td {:class "py-3 text-yellow-400 text-right" :style {:font-variant-numeric "tabular-nums"}} (format-delegation-amount (:delegated_unbonding_amount delegation))]]
        [:tr {:class "border-b border-gray-700"}
         [:td {:class "py-3 text-gray-400"} "Redelegated"]
         [:td {:class "py-3 text-white text-right" :style {:font-variant-numeric "tabular-nums"}} (format-delegation-amount (:delegated_redelegated_amount delegation))]]

        ;; Total Delegated row
        [:tr {:class "border-t-2 border-purple-500 font-bold"}
         [:td {:class "py-3 text-purple-300"} "TOTAL DELEGATED"]
         [:td {:class "py-3 text-purple-300 text-right text-xl" :style {:font-variant-numeric "tabular-nums"}} (format-delegation-amount (:delegated_total_delegated_amount delegation))]]]]])

   [:p {:class "text-gray-500 text-xs mt-4"} "✅ Wallet information loaded"]])

      :else
      [:div {:class "bg-gray-800 border border-gray-600 rounded-lg p-8"}
       [:p {:class "text-gray-500"} "Enter a wallet address above to view information"]])))

(defn main-component []
  [:div
   [wallet-input-component]
   [hash-price-component]
   [wallet-data-component]])

;; =============================================================================
;; Initialize and Mount
;; =============================================================================

(defn ^:export init []
  (js/console.log "🚀 FM Wallet Info - Phase 3: Wallet Information (Reagent + re-frame)")
  (rf/dispatch-sync [::initialize])
  (rdom/render [main-component] (js/document.getElementById "app"))
  (fetch-hash-price))

;; Start the app
(init)
