// npm install --global workbox-cli
// npx workbox-cli injectManifest workbox-config.js
importScripts('./workbox_modules/workbox-sw.js')

workbox.setConfig({
	modulePathPrefix: './workbox_modules/',
})

// fix for Chrome Desktop what seems to be a typo in workbox 4.1.1
if ("localhost" === self.location.hostname) {
	if (!workbox.core._private.assert.isSWEnv) {
		workbox.core._private.assert.isSWEnv = workbox.core._private.assert.isSwEnv;
	}
}

workbox.precaching.precacheAndRoute([])