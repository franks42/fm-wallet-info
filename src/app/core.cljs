(ns app.core)

;; Simple hello world message
(defn init []
  (js/console.log "🚀 FM Wallet Info - ClojureScript loaded successfully!")

  ;; Get the app div and update it
  (when-let [app-div (js/document.getElementById "app")]
    (set! (.-innerHTML app-div)
          "<div class='bg-gray-800 border border-green-500 rounded-lg p-8'>
             <h2 class='text-3xl font-bold text-green-400 mb-4'>Hello from ClojureScript! 👋</h2>
             <p class='text-gray-300'>Scittle is working correctly.</p>
             <p class='text-gray-400 text-sm mt-4'>Phase 1: Basic Scittle/CLJS setup ✅</p>
           </div>")))

;; Initialize the app
(init)
