#!/usr/bin/env bb

;; Run Playwright tests with Babashka
;; Usage: bb run-test.bb [test-name]
;; Default: runs test-hello.js

(require '[babashka.process :refer [shell process]]
         '[clojure.java.io :as io])

(def test-name (or (first *command-line-args*) "test-hello.js"))
(def test-file (str "test/" test-name))

(defn start-server []
  (println "🚀 Starting web server on port 8000...")
  (let [proc (process ["bb" "server.bb" "8000"]
                      {:out :inherit
                       :err :inherit})]
    ;; Give server time to start
    (Thread/sleep 2000)
    (println "✅ Server started")
    proc))

(defn stop-server [proc]
  (println "🛑 Stopping web server...")
  (.destroy (:proc proc))
  (Thread/sleep 1000)
  (println "✅ Server stopped"))

(defn run-test [test-file]
  (println (str "🧪 Running test: " test-file))
  (try
    (shell {:dir "test"} "node" (str "../" test-file))
    (println "✅ Test passed!")
    true
    (catch Exception e
      (println "❌ Test failed!")
      (println (.getMessage e))
      false)))

(defn main []
  (when-not (.exists (io/file test-file))
    (println (str "❌ Test file not found: " test-file))
    (System/exit 1))

  (let [server (start-server)]
    (try
      (let [success (run-test test-file)]
        (System/exit (if success 0 1)))
      (finally
        (stop-server server)))))

(main)
