#!/usr/bin/env bb

;; Simple HTTP server for local development
;; Usage: bb server.bb [port]
;; Default port: 8000

(require '[babashka.fs :as fs]
         '[org.httpkit.server :as server]
         '[clojure.string :as str])

(def port (or (some-> *command-line-args* first parse-long) 8000))
(def root-dir (fs/path "."))

(defn mime-type [path]
  (let [fname (str path)]
    (cond
      (.endsWith fname ".html") "text/html"
      (.endsWith fname ".js") "text/javascript"
      (.endsWith fname ".css") "text/css"
      (.endsWith fname ".cljs") "text/plain"
      (.endsWith fname ".json") "application/json"
      (.endsWith fname ".png") "image/png"
      (.endsWith fname ".jpg") "image/jpeg"
      (.endsWith fname ".svg") "image/svg+xml"
      :else "text/plain")))

(defn handler [{:keys [uri]}]
  (let [uri (if (= uri "/") "/index.html" uri)
        f (fs/path root-dir (str/replace-first uri #"^/" ""))]
    (if (and (fs/readable? f) (not (fs/directory? f)))
      {:status 200
       :headers {"Content-Type" (mime-type f)}
       :body (fs/file f)}
      {:status 404
       :body "404 Not Found"})))

(server/run-server handler {:port port})

(println (str "🚀 Starting web server on http://localhost:" port))
(println (str "📁 Serving files from: " (fs/absolutize root-dir)))
(println "Press Ctrl+C to stop")

@(promise)
