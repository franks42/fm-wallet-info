#!/usr/bin/env bb

(require '[babashka.http-client :as http]
         '[cheshire.core :as json]
         '[clojure.string :as str])

(defn fetch-json [url]
  (try
    (let [response (http/get url {:headers {"Accept" "application/json"}})]
      (json/parse-string (:body response) true))
    (catch Exception e
      {:error (str "HTTP Error: " (.getMessage e))})))

(defn test-account-info [wallet-address env-var-name]
  (println (str "\n🔍 Testing Account Info (" env-var-name ")"))
  (let [url (str "https://service-explorer.provenance.io/api/v2/accounts/" wallet-address)
        result (fetch-json url)]
    (if (:error result)
      (println (str "  ❌ Error: " (:error result)))
      (do
        (println (str "  ✅ Account Type: " (:accountType result)))
        (println (str "  ✅ Is Vesting: " (get-in result [:flags :isVesting])))
        (when-let [aum (:accountAum result)]
          (println (str "  ✅ AUM: " (:amount aum) " " (:denom aum))))))))

(defn test-vesting-info [wallet-address env-var-name]
  (println (str "\n🔍 Testing Vesting Info (" env-var-name ")"))
  (let [url (str "https://service-explorer.provenance.io/api/v3/accounts/" wallet-address "/vesting")
        result (fetch-json url)]
    (if (:error result)
      (println (str "  ⚠️  No vesting data (may be normal for non-vesting accounts)"))
      (do
        (when-let [original (first (:originalVestingList result))]
          (println (str "  ✅ Original Vesting: " (:amount original) " " (:denom original))))
        (println (str "  ✅ Start Time: " (:startTime result)))
        (println (str "  ✅ End Time: " (:endTime result)))))))

(defn test-delegations [wallet-address env-var-name]
  (println (str "\n🔍 Testing Delegations (" env-var-name ")"))
  (let [url (str "https://service-explorer.provenance.io/api/v2/accounts/" wallet-address "/delegations")
        result (fetch-json url)]
    (if (:error result)
      (println (str "  ❌ Error: " (:error result)))
      (let [total (:total result)
            bonded (get-in result [:rollupTotals :bondedTotal])]
        (println (str "  ✅ Validators: " total))
        (when bonded
          (println (str "  ✅ Bonded Total: " (:amount bonded) " " (:denom bonded))))))))

(defn test-rewards [wallet-address env-var-name]
  (println (str "\n🔍 Testing Rewards (" env-var-name ")"))
  (let [url (str "https://service-explorer.provenance.io/api/v2/accounts/" wallet-address "/rewards")
        result (fetch-json url)]
    (if (:error result)
      (println (str "  ❌ Error: " (:error result)))
      (when-let [total (first (:total result))]
        (println (str "  ✅ Rewards: " (:amount total) " " (:denom total)))))))

(defn test-unbonding [wallet-address env-var-name]
  (println (str "\n🔍 Testing Unbonding (" env-var-name ")"))
  (let [url (str "https://service-explorer.provenance.io/api/v2/accounts/" wallet-address "/unbonding")
        result (fetch-json url)]
    (if (:error result)
      (println (str "  ❌ Error: " (:error result)))
      (let [unbonding (get-in result [:rollupTotals :unbondingTotal])]
        (when unbonding
          (println (str "  ✅ Unbonding: " (:amount unbonding) " " (:denom unbonding))))))))

(defn test-redelegations [wallet-address env-var-name]
  (println (str "\n🔍 Testing Redelegations (" env-var-name ")"))
  (let [url (str "https://service-explorer.provenance.io/api/v2/accounts/" wallet-address "/redelegations")
        result (fetch-json url)]
    (if (:error result)
      (println (str "  ❌ Error: " (:error result)))
      (let [redelegation (get-in result [:rollupTotals :redelegationTotal])]
        (when redelegation
          (println (str "  ✅ Redelegation: " (:amount redelegation) " " (:denom redelegation))))))))

(defn test-balances [wallet-address env-var-name]
  (println (str "\n🔍 Testing Liquid Balance (" env-var-name ")"))
  (let [url (str "https://service-explorer.provenance.io/api/v2/accounts/" wallet-address "/balances")
        result (fetch-json url)]
    (if (:error result)
      (println (str "  ❌ Error: " (:error result)))
      (when-let [results (:results result)]
        (let [nhash-balance (first (filter #(= (:denom %) "nhash") results))]
          (if nhash-balance
            (println (str "  ✅ Liquid Balance: " (:amount nhash-balance) " " (:denom nhash-balance)))
            (println "  ⚠️  No nhash balance found")))))))

(defn test-commitments [wallet-address env-var-name]
  (println (str "\n🔍 Testing Commitments (" env-var-name ")"))
  (let [url (str "https://api.provenance.io/provenance/exchange/v1/commitments/account/" wallet-address)
        result (fetch-json url)]
    (if (:error result)
      (println (str "  ⚠️  No commitments (may be normal)"))
      (when-let [commitments (:commitments result)]
        (let [market1 (first (filter #(= (:market_id %) 1) commitments))
              nhash-amount (when market1
                            (first (filter #(= (:denom %) "nhash") (:amount market1))))]
          (if nhash-amount
            (println (str "  ✅ Committed: " (:amount nhash-amount) " " (:denom nhash-amount)))
            (println "  ⚠️  No nhash commitments")))))))

(defn test-wallet [env-var-name]
  (let [wallet-address (System/getenv env-var-name)]
    (if (nil? wallet-address)
      (println (str "❌ Environment variable " env-var-name " not set"))
      (do
        (println (str "\n" "=" 60))
        (println (str "🧪 Testing Wallet APIs for: " env-var-name))
        (println (str "=" 60))

        ;; Test all 8 endpoints
        (test-account-info wallet-address env-var-name)
        (test-vesting-info wallet-address env-var-name)
        (test-delegations wallet-address env-var-name)
        (test-rewards wallet-address env-var-name)
        (test-unbonding wallet-address env-var-name)
        (test-redelegations wallet-address env-var-name)
        (test-balances wallet-address env-var-name)
        (test-commitments wallet-address env-var-name)

        (println (str "\n✅ Completed tests for " env-var-name))))))

;; Main execution
(println "🚀 FM Wallet Info - API Testing")
(println "Testing all wallet scenarios...\n")

;; Test all wallet scenarios
(test-wallet "WALLET_EMPTY")
(test-wallet "WALLET_NO_VESTING")
(test-wallet "WALLET_VESTING")
(test-wallet "WALLET_INVALID")

(println "\n" "=" 60)
(println "✅ All API tests completed!")
(println "=" 60)
