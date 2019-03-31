// npm install --global workbox-cli
// npx workbox-cli injectManifest workbox-config.js
importScripts('./workbox_modules/workbox-sw.js')

workbox.setConfig({
	modulePathPrefix: './workbox_modules/',
})

// fix typo in version 4.1.1
workbox.core._private.assert.isSWEnv = workbox.core._private.assert.isSwEnv;

workbox.precaching.precacheAndRoute([])