import { pushDestination, pushNotification } from './pwa/push-payload.js';
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

self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let data;
    try { data = event.data?.json(); } catch { data = null; }
    const message = pushNotification(data, self.location.origin);
    await self.registration.showNotification(message.title, message.options);
  })());
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const target = pushDestination(event.notification.data?.url, self.location.origin);
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find(client => client.url === target);
    if (existing) await existing.focus();
    else await self.clients.openWindow(target);
  })());
});
self.addEventListener('pushsubscriptionchange', event => {
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windows => {
    for (const client of windows) client.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED' });
  }));
});
