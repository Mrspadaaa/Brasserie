import { createHash } from 'node:crypto';
import webpush, { PushSubscription } from 'web-push';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getFunctions } from 'firebase-admin/functions';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { requireBrewer } from './brewSession.js';
import { sessionEvents, SessionState, SessionRecipe } from './brewSessionCore.js';

const hash = (s: string) => createHash('sha256').update(s).digest('hex');
/** Stable VAPID pair in a server-only collection, never a browser env variable. */
async function vapidKeys() {
  const db = getFirestore(),
    ref = db.doc('brewPrivate/webPush');
  return db.runTransaction(async (tx) => {
    const old = await tx.get(ref);
    if (old.exists) return old.data() as { publicKey: string; privateKey: string };
    const keys = webpush.generateVAPIDKeys();
    tx.create(ref, keys);
    return keys;
  });
}
export function validateSubscription(input: unknown): PushSubscription {
  const s = input as PushSubscription;
  if (!s || typeof s.endpoint !== 'string' || s.endpoint.length > 3000 || !s.keys)
    throw new HttpsError('invalid-argument', 'Abonnement invalide.');
  let url: URL;
  try {
    url = new URL(s.endpoint);
  } catch {
    throw new HttpsError('invalid-argument', 'Adresse push invalide.');
  }
  const allowed =
    url.hostname === 'fcm.googleapis.com' ||
    url.hostname === 'updates.push.services.mozilla.com' ||
    url.hostname.endsWith('.push.services.mozilla.com') ||
    url.hostname === 'web.push.apple.com' ||
    url.hostname.endsWith('.notify.windows.com');
  if (
    !allowed ||
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    (url.port && url.port !== '443') ||
    !/^[A-Za-z0-9_-]{80,100}=?$/.test(s.keys.p256dh) ||
    !/^[A-Za-z0-9_-]{20,30}={0,2}$/.test(s.keys.auth)
  )
    throw new HttpsError('invalid-argument', 'Service de notifications non reconnu.');
  return {
    endpoint: s.endpoint,
    keys: { p256dh: s.keys.p256dh, auth: s.keys.auth }
  };
}
export const getBrewAlertConfig = onCall(
  { region: 'europe-west6', maxInstances: 3 },
  async (request) => {
    requireBrewer(request);
    const keys = await vapidKeys();
    return { publicKey: keys.publicKey };
  }
);

export async function scheduleDevice(
  docId: string,
  batch: { brewDay?: SessionState; recipeSnapshot?: SessionRecipe },
  expectedUpdate?: number
) {
  const db = getFirestore(),
    ref = db.doc(`brewAlarmDevices/${docId}`),
    now = Date.now();
  const events = batch.brewDay
    ? sessionEvents(batch.brewDay, batch.recipeSnapshot ?? {}).filter(
        (e) => e.at >= now - 10000 && e.at <= now + 48 * 3600000
      )
    : [];
  // Canonical event content defines the revision: a note cannot retrigger an alarm.
  const revision = hash(JSON.stringify(events));
  const schedule = await db.runTransaction(async (tx) => {
    const current = await tx.get(ref),
      data = current.data();
    if (
      !data?.enabled ||
      !data.v2 ||
      (expectedUpdate != null && data.batchRevision > expectedUpdate)
    )
      return false;
    if (data.revision === revision && data.active) return false;
    tx.update(ref, {
      revision,
      active: false,
      events,
      batchRevision: expectedUpdate ?? 0
    });
    return true;
  });
  if (!schedule) return;
  const queue = getFunctions().taskQueue('locations/europe-west6/functions/deliverBrewAlarm');
  await Promise.all(
    events.map((e) =>
      queue.enqueue(
        { docId, revision, eventId: e.id },
        {
          scheduleTime: new Date(Math.max(now + 1500, e.at)),
          dispatchDeadlineSeconds: 60
        }
      )
    )
  );
  await db.runTransaction(async (tx) => {
    const data = (await tx.get(ref)).data();
    if (data?.revision === revision && data.enabled)
      tx.update(ref, { active: true, syncedAt: Timestamp.now() });
  });
}
export const registerBrewDevice = onCall(
  { region: 'europe-west6', timeoutSeconds: 60, maxInstances: 3 },
  async (request) => {
    const uid = requireBrewer(request),
      { batchId, enabled = true, test = false } = request.data ?? {};
    if (
      typeof batchId !== 'string' ||
      !/^[\w-]{1,100}$/.test(batchId) ||
      typeof enabled !== 'boolean'
    )
      throw new HttpsError('invalid-argument', 'Brassin invalide.');
    const subscription = validateSubscription(request.data.subscription),
      db = getFirestore();
    const batch = (await db.doc(`batches/${batchId}`).get()).data();
    if (!batch) throw new HttpsError('not-found', 'Brassin introuvable.');
    const docId = hash(`${uid}:${batchId}:${subscription.endpoint}`),
      ref = db.doc(`brewAlarmDevices/${docId}`);
    await ref.set(
      {
        uid,
        batchId,
        subscription,
        enabled,
        v2: true,
        ...(!enabled ? { active: false } : {}),
        expiresAt: Timestamp.fromMillis(Date.now() + 48 * 3600000)
      },
      { merge: true }
    );
    if (enabled) await scheduleDevice(docId, batch, batch.brewDay?.revision ?? 0);
    if (enabled && test) {
      const at = Date.now() + 10000,
        eventId = `test-${at}`,
        revision = (await ref.get()).data()!.revision;
      await ref.update({
        testEvent: {
          id: eventId,
          at,
          title: 'Test de brassage',
          body: 'Le rappel est arrivé depuis le serveur.'
        }
      });
      await getFunctions()
        .taskQueue('locations/europe-west6/functions/deliverBrewAlarm')
        .enqueue(
          { docId, revision, eventId },
          { scheduleTime: new Date(at), dispatchDeadlineSeconds: 60 }
        );
    }
    const data = (await ref.get()).data();
    return {
      enabled,
      count: data?.events?.length ?? 0,
      synced: !enabled || data?.active === true,
      testAt: test ? data?.testEvent?.at : null
    };
  }
);

export const rescheduleBrewAlarms = onDocumentWritten(
  {
    document: 'batches/{batchId}',
    region: 'europe-west6',
    retry: true,
    maxInstances: 3
  },
  async (event) => {
    const before = event.data?.before.data(),
      after = event.data?.after.data();
    if (JSON.stringify(before?.brewDay) === JSON.stringify(after?.brewDay)) return;
    const db = getFirestore(),
      devices = await db
        .collection('brewAlarmDevices')
        .where('batchId', '==', event.params.batchId)
        .get();
    // Read latest state: delayed/out-of-order triggers must never restore an old deadline.
    const latest = (await db.doc(`batches/${event.params.batchId}`).get()).data();
    await Promise.all(
      devices.docs.map(async (d) => {
        if (!d.data().v2) return;
        if (!latest) {
          await d.ref.update({ enabled: false, active: false });
          return;
        }
        await scheduleDevice(d.id, latest, latest.brewDay?.revision ?? 0);
      })
    );
  }
);

export async function sendNativePush(subscription: PushSubscription, data: Record<string, string>) {
  const keys = await vapidKeys();
  return webpush.sendNotification(subscription, JSON.stringify({ data }), {
    TTL: 300,
    urgency: 'high',
    timeout: 15000,
    topic: data.tag.slice(0, 32),
    vapidDetails: {
      ...keys,
      subject: `https://${process.env.GCLOUD_PROJECT}.web.app`
    }
  });
}
