// import { registerRoute } from './web_modules/workbox-routing.js';
// import { CacheFirst } from './web_modules/workbox-strategies.js';
// import { Plugin  as ExpirationPlugin} from './web_modules/workbox-expiration.js';
// import { precacheAndRoute } from './web_modules/workbox-precaching.js';

// npm install --global workbox-cli
// workbox injectManifest workbox-config.js
importScripts('./workbox_modules/workbox-sw.js')

workbox.setConfig({
	// modulePathCb: (moduleName) => `./workbox_modules/${moduleName}.dev.js`
	modulePathPrefix: './workbox_modules/',
})

// workbox.loadModule('workbox-core');
workbox.core._private.assert.isSWEnv = workbox.core._private.assert.isSwEnv;

workbox.precaching.precacheAndRoute([])