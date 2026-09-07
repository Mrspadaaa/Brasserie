/* Web Push natif : aucun setTimeout dans un worker éphémère. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));
self.addEventListener('push', (event) => {
  let payload;
  try {
    payload = event.data?.json();
  } catch {
    return;
  }
  const p = payload?.data;
  if (!p || typeof p.title !== 'string') return;
  const companion = p.kind === 'companion' && ['recipe', 'draft', 'batch', 'app'].includes(p.scopeKind) && /^[\w-]{1,100}$/.test(p.scopeId);
  if (!companion && typeof p.batchId !== 'string') return;
  // Expiry is checked by the server and the push provider's 300 s TTL.
  // A phone clock set ahead must not silently discard a current reminder.
  if (!Number.isFinite(Number(p.at)) || Number(p.at) < 0) return;
  event.waitUntil(
    self.registration.showNotification(p.title, {
      body: p.body || '',
      tag: p.tag,
      renotify: false,
      requireInteraction: !companion,
      vibrate: companion ? [150, 80, 150] : [700, 150, 700, 150, 1000, 300, 700, 150, 700, 150, 1000],
      data: companion ? { kind: 'companion', scopeKind: p.scopeKind, scopeId: p.scopeId } : { batchId: p.batchId }
    })
  );
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL('/', self.location.origin);
  const data = event.notification.data;
  if (data.kind === 'companion') {
    url.searchParams.set('companion', `${data.scopeKind}:${data.scopeId}`);
    event.waitUntil((async () => {
      // Focus an existing app without navigating away from an unsaved recipe.
      const windows = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      const app = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (app) { await app.focus(); app.postMessage({ kind: 'open-companion', scopeKind: data.scopeKind, scopeId: data.scopeId }); }
      else await clients.openWindow(url.href);
    })());
  } else {
    url.searchParams.set('brewday', data.batchId);
    event.waitUntil(clients.openWindow(url.href));
  }
});
