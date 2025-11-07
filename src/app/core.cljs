(ns app.core
  (:require [reagent.core :as r]
            [reagent.dom :as rdom]
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

(defn fetch-wallet-complete-summary [wallet-address]
  (js/console.log "🔍 Fetching complete wallet summary for:" wallet-address)
  (rf/dispatch [::loading-wallet])

  ;; Use comprehensive summary endpoint - gets everything in one call
  (GET (str "https://pb-fm-mcp-dev.creativeapptitude.com/api/fetch_complete_wallet_summary/" wallet-address)
    {:handler (fn [response]
                (js/console.log "✅ Complete wallet summary received" response)
                ;; Summary returns: account_info, is_vesting, vesting_data,
                ;; available_committed, delegation_summary
                (let [account-info (:account_info response)
                      delegation (:delegation_summary response)
                      wallet-data {:accountType (:account_type account-info)
                                  :isVesting (:account_is_vesting account-info)
                                  :aum (:account_aum account-info)
                                  :delegation delegation}]
                  (rf/dispatch [::wallet-success wallet-data])))

     :error-handler (fn [error]
                      (js/console.error "❌ Error fetching wallet summary:" error)
                      (js/console.log "Error keys:" (js->clj (js/Object.keys error)))
                      (let [error-msg (try
                                       (or (get error "status-text")
                                           (get error :status-text)
                                           (.-statusText error)
                                           (str "HTTP Error: " (or (get error "status") (get error :status) "Unknown")))
                                       (catch js/Error e
                                         "Failed to fetch wallet information"))]
                        (rf/dispatch [::wallet-error error-msg])))

     :response-format :json
     :keywords? true}))

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
                      (rf/dispatch [::price-success (.toFixed price 4)]))
                    (js/console.error "❌ HASH-USD not found in markets"))))

     :error-handler (fn [error]
                      (js/console.error "❌ Error fetching HASH price:" error))

     :response-format :json
     :keywords? true}))

;; =============================================================================
;; Helper Functions
;; =============================================================================

(defn nhash->hash
  "Convert nhash (nanohash) to HASH. 1 HASH = 1,000,000,000 nhash"
  [nhash-amount]
  (when nhash-amount
    (let [amount-num (if (number? nhash-amount)
                      nhash-amount
                      (js/parseFloat nhash-amount))]
      (.toFixed (/ amount-num 1000000000) 2))))

(defn format-delegation-amount
  "Format delegation amount from API response"
  [amount-obj]
  (when amount-obj
    (let [amount (:amount amount-obj)]
      (if (and amount (> amount 0))
        (str (nhash->hash amount) " HASH")
        "0 HASH"))))

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
                            (fetch-wallet-complete-summary wallet-address))
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
      [:div {:class "space-y-6"}
       ;; Account Info Section
       [:div {:class "bg-gray-800 border border-green-500 rounded-lg p-8"}
        [:h2 {:class "text-2xl font-bold text-green-400 mb-4"} "Account Information"]
        [:table {:class "w-full text-left"}
         [:thead
          [:tr {:class "border-b border-gray-700"}
           [:th {:class "py-2 text-gray-400"} "Property"]
           [:th {:class "py-2 text-gray-400"} "Value"]]]
         [:tbody
          [:tr {:class "border-b border-gray-700"}
           [:td {:class "py-3 text-gray-400"} "Account Type"]
           [:td {:class "py-3 text-white font-mono"} (:accountType wallet-data)]]
          [:tr {:class "border-b border-gray-700"}
           [:td {:class "py-3 text-gray-400"} "Is Vesting"]
           [:td {:class "py-3 text-white"} (if (:isVesting wallet-data) "✅ Yes" "❌ No")]]
          [:tr
           [:td {:class "py-3 text-gray-400"} "Assets Under Management"]
           [:td {:class "py-3 text-white"} (str "$" (get-in wallet-data [:aum :amount] "0"))]]]]]

       ;; Delegation Section
       (let [delegation (:delegation wallet-data)]
         (when delegation
           [:div {:class "bg-gray-800 border border-purple-500 rounded-lg p-8"}
            [:h2 {:class "text-2xl font-bold text-purple-400 mb-4"} "Delegation Summary"]
            [:table {:class "w-full text-left"}
             [:thead
              [:tr {:class "border-b border-gray-700"}
               [:th {:class "py-2 text-gray-400"} "Category"]
               [:th {:class "py-2 text-gray-400 text-right"} "Amount"]]]
             [:tbody
              [:tr {:class "border-b border-gray-700"}
               [:td {:class "py-3 text-gray-400"} "Validators"]
               [:td {:class "py-3 text-white text-right"} (:staking_validators delegation)]]
              [:tr {:class "border-b border-gray-700"}
               [:td {:class "py-3 text-gray-400"} "Staked"]
               [:td {:class "py-3 text-white text-right"} (format-delegation-amount (:delegated_staked_amount delegation))]]
              [:tr {:class "border-b border-gray-700"}
               [:td {:class "py-3 text-gray-400"} "Rewards"]
               [:td {:class "py-3 text-green-400 text-right"} (format-delegation-amount (:delegated_rewards_amount delegation))]]
              [:tr {:class "border-b border-gray-700"}
               [:td {:class "py-3 text-gray-400"} "Unbonding"]
               [:td {:class "py-3 text-yellow-400 text-right"} (format-delegation-amount (:delegated_unbonding_amount delegation))]]
              [:tr {:class "border-b border-gray-700"}
               [:td {:class "py-3 text-gray-400"} "Redelegated"]
               [:td {:class "py-3 text-white text-right"} (format-delegation-amount (:delegated_redelegated_amount delegation))]]
              [:tr {:class "border-b border-gray-700 font-bold"}
               [:td {:class "py-3 text-gray-300"} "Total Delegated"]
               [:td {:class "py-3 text-purple-400 text-right"} (format-delegation-amount (:delegated_total_delegated_amount delegation))]]]]]))

       [:p {:class "text-gray-500 text-xs mt-4"} "✅ Wallet information loaded"]]

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
