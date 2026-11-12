/* Web Push natif : aucun setTimeout dans un worker éphémère. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));

/* --- Ajout en cuve : identifier l'ajout avant de proposer « Ajouté » (port-F1, G2) ----------------------
 * Le service worker ne coche rien sans un ajout identifié. Un ajout est identifié par `additionIds`
 * (charge utile enrichie du serveur), sinon par un tag `add-<ids>` dont les ids sont `hop-N` ou `grain-N`
 * (les seuls que sessionEvents produit : un id à tiret quelconque serait ambigu, donc refusé).
 * Ces fonctions ont leur jumelle dans src/services/brewNotifications.ts ; un test garde les deux d'accord. */
const BREW_ID = /^[A-Za-z0-9_]+(?:-[A-Za-z0-9_]+)*$/;
const BREW_TAG = /^add-((?:(?:hop|grain)-\d+)(?:-(?:hop|grain)-\d+)*)$/;
function brewAdditionIds(additionIds, tag) {
  let list = additionIds;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      list = null;
    }
  }
  if (Array.isArray(list)) {
    const ids = list.filter((id) => typeof id === 'string' && id.length <= 40 && BREW_ID.test(id)).slice(0, 20);
    return ids.length === list.length ? ids : [];
  }
  const m = typeof tag === 'string' ? BREW_TAG.exec(tag) : null;
  return m ? m[1].match(/(?:hop|grain)-\d+/g) : [];
}
/* Chrome n'affiche que Notification.maxActions actions (2) ; Safari iOS aucune. */
function brewActions(ids, snooze) {
  const max = typeof Notification !== 'undefined' && Number.isFinite(Notification.maxActions) ? Notification.maxActions : 2;
  const actions = [];
  if (ids.length) actions.push({ action: 'ajoute', title: 'Ajouté' });
  // « +1 min » exige quelqu'un pour rappeler : la page ouverte, ou un serveur qui sait reporter.
  if (snooze) actions.push({ action: 'plus1', title: '+1 min' });
  return actions.slice(0, Math.max(0, max));
}

/* File des touchers reçus sans page à qui les dire : lue et acquittée à la prochaine ouverture. */
const BREW_QUEUE_DB = 'brew-alerts';
const BREW_QUEUE_STORE = 'actions';
function queueBrewAction(entry) {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    try {
      const open = indexedDB.open(BREW_QUEUE_DB, 1);
      open.onupgradeneeded = () => open.result.createObjectStore(BREW_QUEUE_STORE, { autoIncrement: true });
      open.onerror = () => resolve(null);
      open.onsuccess = () => {
        const db = open.result;
        const tx = db.transaction(BREW_QUEUE_STORE, 'readwrite');
        const add = tx.objectStore(BREW_QUEUE_STORE).add(entry);
        tx.oncomplete = () => {
          db.close();
          resolve(add.result);
        };
        tx.onerror = tx.onabort = () => {
          db.close();
          resolve(null);
        };
      };
    } catch {
      resolve(null);
    }
  });
}

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
  const ids = companion ? [] : brewAdditionIds(p.additionIds, p.tag);
  const actions = companion ? [] : brewActions(ids, p.snooze === true || p.snooze === 'true' || p.snooze === '1');
  const options = {
    body: p.body || '',
    tag: p.tag,
    // Une relance du même ajout (serveur, chaque minute) doit sonner de nouveau ; renotify exige un tag.
    renotify: !companion && p.kind === 'ajout' && typeof p.tag === 'string' && p.tag.length > 0,
    requireInteraction: !companion,
    vibrate: companion ? [150, 80, 150] : [700, 150, 700, 150, 1000, 300, 700, 150, 700, 150, 1000],
    data: companion
      ? { kind: 'companion', scopeKind: p.scopeKind, scopeId: p.scopeId }
      : ids.length
        ? { batchId: p.batchId, additionIds: ids, tag: p.tag }
        : { batchId: p.batchId }
  };
  if (actions.length) options.actions = actions;
  event.waitUntil(self.registration.showNotification(p.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL('/', self.location.origin);
  const data = event.notification.data || {};
  const action = event.action || '';
  if (data.kind === 'companion') {
    url.searchParams.set('companion', `${data.scopeKind}:${data.scopeId}`);
    event.waitUntil((async () => {
      // Focus an existing app without navigating away from an unsaved recipe.
      const windows = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      const app = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (app) { await app.focus(); app.postMessage({ kind: 'open-companion', scopeKind: data.scopeKind, scopeId: data.scopeId }); }
      else await clients.openWindow(url.href);
    })());
    return;
  }
  if (typeof data.batchId !== 'string') return;
  url.searchParams.set('brewday', data.batchId);
  const ids = Array.isArray(data.additionIds) ? brewAdditionIds(data.additionIds) : [];
  event.waitUntil((async () => {
    const touchAt = Date.now();
    const windows = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const app = windows.find((client) => new URL(client.url).origin === self.location.origin);
    // « Ajouté » : seulement avec un ajout identifié. Toute autre action, connue ou non, ouvre sans rien cocher.
    if (action === 'ajoute' && ids.length) {
      const entry = { kind: 'ajoute', batchId: data.batchId, additionIds: ids, at: touchAt };
      // Le toucher est écrit d'abord : une page qui n'écoute pas encore ne le perd pas.
      const key = await queueBrewAction(entry);
      if (app) {
        await app.focus();
        app.postMessage({ kind: 'brew-ajoute', batchId: data.batchId, additionIds: ids, at: touchAt, key });
      } else {
        url.searchParams.set('ajoute', ids.join(','));
        url.searchParams.set('a', String(touchAt));
        await clients.openWindow(url.href);
      }
      return;
    }
    if (action === 'plus1' && app && typeof data.tag === 'string') {
      // Report d'une minute : tenu par la page ; sans page, rien à reporter (on ouvre seulement).
      await app.focus();
      app.postMessage({ kind: 'brew-report', batchId: data.batchId, tag: data.tag, minutes: 1, at: touchAt });
      return;
    }
    await clients.openWindow(url.href);
  })());
});
