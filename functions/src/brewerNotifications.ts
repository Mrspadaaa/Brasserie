import { createHash } from 'node:crypto';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { requireBrewer } from './brewSession.js';
import { validateSubscription, sendNativePush } from './brewPush.js';
import { HOP_ADVICE_PROTOCOL_V1, HOP_ADVICE_V1_COLLECTIONS, hasHopAdviceV1Stamp } from './brewerHopAdviceLaneV1.js';

const hash = (s: string) => createHash('sha256').update(s).digest('hex');
export const registerBrewerNotifications = onCall(
  { region: 'europe-west6', maxInstances: 3 },
  async (request) => {
    const uid = requireBrewer(request),
      subscription = validateSubscription(request.data?.subscription);
    if (typeof request.data?.enabled !== 'boolean')
      throw new HttpsError('invalid-argument', 'Préférence invalide.');
    await getFirestore()
      .doc(`brewerNotificationDevices/${hash(`${uid}:${subscription.endpoint}`)}`)
      .set({
        uid,
        subscription,
        enabled: request.data.enabled,
        updatedAt: Date.now()
      });
    return { enabled: request.data.enabled };
  }
);

type NotificationLane = 'ordinary' | 'hopAdviceReadonlyV1';
const notificationPaths = (lane: NotificationLane) => lane === 'hopAdviceReadonlyV1'
  ? { jobs: HOP_ADVICE_V1_COLLECTIONS.jobs, conversations: HOP_ADVICE_V1_COLLECTIONS.conversations }
  : { jobs: 'brewerJobs', conversations: 'brewerConversations' };

/** Same delivery helper; the server-selected lane fixes both receipt and session paths. */
async function notifyBrewerAnswerInLane(event: any, lane: NotificationLane) {
    const before = event.data?.before.data(),
      job = event.data?.after.data();
    if (!job || before?.status === job.status || !['done', 'error'].includes(job.status)) return;
    const paths = notificationPaths(lane);
    if (lane === 'hopAdviceReadonlyV1' && !hasHopAdviceV1Stamp(job)) return;
    const db = getFirestore(), ref = db.doc(`${paths.jobs}/${event.params.jobId}`);
    const devices = await db
      .collection('brewerNotificationDevices')
      .where('uid', '==', job.uid)
      .get();
    await Promise.all(
      devices.docs
        .filter((d) => d.data().enabled)
        .map(async (device) => {
          const current = (await ref.get()).data();
          const session = (await db.doc(`${paths.conversations}/${job.threadId}`).get()).data();
          if (
            !current ||
            current.status !== job.status ||
            (lane === 'hopAdviceReadonlyV1' && !hasHopAdviceV1Stamp(current)) ||
            current.readAt ||
            current.notified?.[device.id] ||
            (session?.generation ?? 0) !== job.generation
          )
            return;
          try {
            await sendNativePush(
              device.data().subscription,
              {
                kind: 'companion',
                ...(lane === 'hopAdviceReadonlyV1' ? { protocol: HOP_ADVICE_PROTOCOL_V1.name } : {}),
                title:
                  job.status === 'done'
                    ? 'Ton compagnon a répondu'
                    : 'Ton compagnon n’a pas pu conclure',
                body:
                  job.status === 'done'
                    ? 'Ta réponse est enregistrée. Touche ici pour la lire.'
                    : 'Ta question est conservée. Consulte le détail pour la relancer.',
                scopeKind: job.scope.kind,
                scopeId: job.scope.id,
                operationId: job.operationId,
                tag: hash(`${lane === 'hopAdviceReadonlyV1' ? `${HOP_ADVICE_PROTOCOL_V1.name}:` : ''}companion:${job.id}`),
                at: String(job.finishedAt)
              },
              86400
            );
            // A reset may remove the job while the push is in flight: do not recreate it.
            await db.runTransaction(async (tx) => {
              if ((await tx.get(ref)).exists)
                tx.update(ref, { [`notified.${device.id}`]: Date.now() });
            });
          } catch (error) {
            if ([404, 410].includes((error as any)?.statusCode)) {
              await device.ref.update({ enabled: false, lastError: 'Abonnement expiré' });
              return;
            }
            throw error;
          }
        })
    );
}

/** Legacy notification listener remains tied to the old outbox. */
export const notifyBrewerAnswer = onDocumentUpdated(
  { document: 'brewerJobs/{jobId}', region: 'europe-west6', retry: true, maxInstances: 3 },
  (event) => notifyBrewerAnswerInLane(event, 'ordinary')
);

/** Assisted notifications are emitted only from their own versioned outbox. */
export const notifyBrewerHopAdviceAnswerV1 = onDocumentUpdated(
  { document: `${HOP_ADVICE_V1_COLLECTIONS.jobs}/{jobId}`, region: 'europe-west6', retry: true, maxInstances: 3 },
  (event) => notifyBrewerAnswerInLane(event, 'hopAdviceReadonlyV1')
);
