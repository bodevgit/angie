import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

// Add OneSignal
importScripts('https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js');

cleanupOutdatedCaches()

precacheAndRoute(self.__WB_MANIFEST)

// Removed self.skipWaiting() to prevent aggressive activation loop
// self.skipWaiting()
clientsClaim()
