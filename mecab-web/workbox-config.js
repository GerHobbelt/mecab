// npm install --global workbox-cli
// npx workbox-cli injectManifest workbox-config.js

// https://developers.google.com/web/tools/workbox/modules/workbox-webpack-plugin
module.exports = {
  "globDirectory": ".",
  "globPatterns": [
    "**/*.{js,utf8.txt,html,data,wasm,css}"
  ],
  "globIgnores": [
  	"dist/**/*",
  	"node_modules/**/*",
  	"test.html",
  	"edict2-indexer.js",
  	"sw.js",
  	"sw.precursor.js",
  	"workbox-config.js",
  	"src/tokenizer/unused.js"
  ],
  "swDest": "sw.js",
  "swSrc": "sw.precursor.js",
  "maximumFileSizeToCacheInBytes": 100 * 1024 * 1024
};