/* Web Push natif : aucun setTimeout dans un worker éphémère. */
self.addEventListener('push', (event) => {
  let payload;
  try {
    payload = event.data?.json();
  } catch {
    return;
  }
  const p = payload?.data;
  if (!p || typeof p.title !== 'string' || typeof p.batchId !== 'string') return;
  if (!Number.isFinite(Number(p.at)) || Date.now() - Number(p.at) > 300000) return;
  event.waitUntil(
    self.registration.showNotification(p.title, {
      body: p.body || '',
      tag: p.tag,
      renotify: false,
      requireInteraction: true,
      vibrate: [700, 150, 700, 150, 1000, 300, 700, 150, 700, 150, 1000],
      data: { batchId: p.batchId }
    })
  );
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL('/', self.location.origin);
  url.searchParams.set('brewday', event.notification.data.batchId);
  event.waitUntil(clients.openWindow(url.href));
});
