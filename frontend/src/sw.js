import { clientsClaim, setCacheNameDetails } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL, matchPrecache } from 'workbox-precaching';
import { registerRoute, setCatchHandler, setDefaultHandler } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';
import { technicalPath, shellPath } from './pwa/policy.js';
setCacheNameDetails({ prefix: 'pwa-framework', suffix: self.registration.scope });
// Only the explicit public build files are injected; no API runtime caches.
precacheAndRoute(self.__WB_MANIFEST, { ignoreURLParametersMatching: [] });
cleanupOutdatedCaches();
clientsClaim();
const shell = createHandlerBoundToURL('/index.html');
registerRoute(({ request, url }) => request.mode === 'navigate' && url.origin === self.location.origin && shellPath(url.pathname) && !technicalPath(url.pathname), shell);
setDefaultHandler(new NetworkOnly());
setCatchHandler(async ({ request, url }) => {
  if (request.method === 'GET' && request.mode === 'navigate' && url.origin === self.location.origin && !technicalPath(url.pathname)) return (await matchPrecache('/offline.html')) || Response.error();
  return Response.error();
});
// Activation is explicit; never skip waiting on install or force a page reload here.
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
});
