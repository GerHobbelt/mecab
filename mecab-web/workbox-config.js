// npm install --global workbox-cli
// workbox injectManifest workbox-config.js

// https://developers.google.com/web/tools/workbox/modules/workbox-webpack-plugin
module.exports = {
  "globDirectory": ".",
  "globPatterns": [
    "**/*.{js,utf8.txt,html,data,wasm,css}"
  ],
  "globIgnores": [
  	"node_modules/**/*",
  	"test.html",
  	"edict2-indexer.js",
  	"sw.js",
  	"sw.precursor.js",
  	"src/tokenizer/unused.js"
  ],
  "swDest": "sw.js",
  "swSrc": "sw.precursor.js",
  "maximumFileSizeToCacheInBytes": 100 * 1024 * 1024
};