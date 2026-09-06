import { createHash, randomUUID } from 'node:crypto';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onTaskDispatched } from 'firebase-functions/v2/tasks';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getFunctions } from 'firebase-admin/functions';
import { getMessaging } from 'firebase-admin/messaging';

export interface AlarmEvent {
  id: string;
  at: number;
  title: string;
  body: string;
}
export function validAlarmEvents(input: unknown, now: number): AlarmEvent[] {
  if (!Array.isArray(input) || input.length > 64)
    throw new HttpsError('invalid-argument', '64 rappels maximum.');
  const seen = new Set<string>();
  return input.map((e: AlarmEvent) => {
    if (
      !e ||
      typeof e.id !== 'string' ||
      !e.id ||
      e.id.length > 160 ||
      seen.has(e.id) ||
      typeof e.title !== 'string' ||
      e.title.length > 120 ||
      typeof e.body !== 'string' ||
      e.body.length > 900 ||
      !Number.isFinite(e.at) ||
      e.at < now - 10000 ||
      e.at > now + 48 * 3600000
    )
      throw new HttpsError(
        'invalid-argument',
        'Rappel invalide ou hors de la journée de brassage.'
      );
    seen.add(e.id);
    return { id: e.id, at: e.at, title: e.title, body: e.body };
  });
}
const digest = (s: string) => createHash('sha256').update(s).digest('hex');

/** Documents privés, écrits uniquement par le serveur ; aucune nouvelle règle publique. */
export const syncBrewAlarms = onCall(
  { region: 'europe-west6', timeoutSeconds: 60, maxInstances: 3 },
  async (request) => {
    const authorized = (process.env.AUTHORIZED_ACCOUNTS ?? '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (!request.auth)
      throw new HttpsError('unauthenticated', 'Connexion requise pour les alertes.');
    if (
      request.auth.token.email_verified !== true ||
      !authorized.includes(String(request.auth.token.email ?? '').toLowerCase())
    )
      throw new HttpsError('permission-denied', 'Compte non autorisé.');
    const { batchId, token } = request.data ?? {};
    if (
      typeof batchId !== 'string' ||
      !/^[\w-]{1,100}$/.test(batchId) ||
      typeof token !== 'string' ||
      token.length < 30 ||
      token.length > 4096
    )
      throw new HttpsError('invalid-argument', 'Brassin ou appareil invalide.');
    const events = validAlarmEvents(request.data.events, Date.now());
    const db = getFirestore();
    if (!(await db.doc(`batches/${batchId}`).get()).exists)
      throw new HttpsError('not-found', 'Brassin introuvable.');
    const docId = digest(`${request.auth.uid}:${batchId}:${token}`);
    const ref = db.doc(`brewAlarmDevices/${docId}`);
    const revision = randomUUID();
    // Invalider immédiatement les anciens rappels, y compris si une nouvelle
    // mise en file échoue. Le client affiche alors « non synchronisé ».
    await ref.set({
      uid: request.auth.uid,
      batchId,
      token,
      revision,
      active: false,
      events,
      expiresAt: Timestamp.fromMillis(Date.now() + 48 * 3600000)
    });
    const queue = getFunctions().taskQueue('locations/europe-west6/functions/deliverBrewAlarm');
    await Promise.all(
      events.map((e) =>
        queue.enqueue(
          { docId, revision, eventId: e.id },
          { scheduleTime: new Date(Math.max(Date.now() + 3000, e.at)), dispatchDeadlineSeconds: 60 }
        )
      )
    );
    // Une deuxième synchronisation concurrente doit conserver sa propre version.
    await db.runTransaction(async (tx) => {
      const current = await tx.get(ref);
      if (current.data()?.revision === revision) tx.update(ref, { active: true });
    });
    return { count: events.length, revision };
  }
);

export const deliverBrewAlarm = onTaskDispatched(
  {
    region: 'europe-west6',
    retryConfig: { maxAttempts: 3, minBackoffSeconds: 10 },
    rateLimits: { maxConcurrentDispatches: 5 }
  },
  async (request) => {
    const { docId, revision, eventId } = request.data ?? {};
    if (
      typeof docId !== 'string' ||
      !/^[a-f0-9]{64}$/.test(docId) ||
      typeof revision !== 'string' ||
      typeof eventId !== 'string'
    )
      return;
    const ref = getFirestore().doc(`brewAlarmDevices/${docId}`);
    const data = (await ref.get()).data();
    if (!data || data.revision !== revision) return;
    if (!data.active) throw new Error('Synchronisation encore en cours.');
    const batch = (await getFirestore().doc(`batches/${data.batchId}`).get()).data();
    if (!batch || batch.brewDay?.finishedAt != null) return;
    const event = (data.events as AlarmEvent[]).find((e) => e.id === eventId);
    if (!event || Date.now() - event.at > 5 * 60000 || event.at > Date.now() + 5000) return;
    const eventTag = digest(`${docId}:${revision}:${eventId}`);
    // Le même tag remplace une éventuelle notification issue d'une nouvelle
    // livraison Cloud Tasks. TTL court : pas d'alarme houblon des heures après.
    await getMessaging().send({
      token: data.token,
      data: {
        title: event.title,
        body: event.body,
        batchId: data.batchId,
        tag: eventTag,
        at: String(event.at)
      },
      webpush: { headers: { Urgency: 'high', TTL: '300' } }
    });
  }
);
