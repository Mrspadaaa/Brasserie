import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { stampSession } from './brewSessionCore.js';

export function requireBrewer(request: CallableRequest) {
  const allowed = (process.env.AUTHORIZED_ACCOUNTS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!request.auth) throw new HttpsError('unauthenticated', 'Connexion requise.');
  if (
    request.auth.token.email_verified !== true ||
    !allowed.includes(String(request.auth.token.email ?? '').toLowerCase())
  )
    throw new HttpsError('permission-denied', 'Compte non autorisé.');
  return request.auth.uid;
}
function batchId(data: any) {
  if (typeof data?.batchId !== 'string' || !/^[\w-]{1,100}$/.test(data.batchId))
    throw new HttpsError('invalid-argument', 'Brassin invalide.');
  return data.batchId as string;
}
export const getBrewSession = onCall(
  { region: 'europe-west6', maxInstances: 3 },
  async (request) => {
    requireBrewer(request);
    const snapshot = await getFirestore()
      .doc(`batches/${batchId(request.data)}`)
      .get();
    if (!snapshot.exists) throw new HttpsError('not-found', 'Brassin introuvable.');
    return { state: snapshot.data()?.brewDay ?? null, serverNow: Date.now() };
  }
);
export const saveBrewSession = onCall(
  { region: 'europe-west6', timeoutSeconds: 30, maxInstances: 3 },
  async (request) => {
    const uid = requireBrewer(request),
      id = batchId(request.data);
    const { operationId, baseRevision, clientNow, state } = request.data ?? {};
    if (
      typeof operationId !== 'string' ||
      !/^[\w-]{1,100}$/.test(operationId) ||
      !Number.isInteger(baseRevision) ||
      baseRevision < 0 ||
      !Number.isFinite(clientNow)
    )
      throw new HttpsError('invalid-argument', 'Enregistrement invalide.');
    const db = getFirestore(),
      ref = db.doc(`batches/${id}`),
      receipt = db.doc(`brewSessionOperations/${uid}-${id}-${operationId}`);
    const saved = await db.runTransaction(async (tx) => {
      const [batch, seen] = await Promise.all([tx.get(ref), tx.get(receipt)]);
      if (!batch.exists) throw new HttpsError('not-found', 'Brassin introuvable.');
      const previous = batch.data()?.brewDay;
      if (seen.exists) {
        if (seen.data()?.revision !== previous?.revision)
          throw new HttpsError(
            'aborted',
            'Cet enregistrement a réussi, puis le journal a changé. Recharge la version serveur ; ton brouillon est conservé.'
          );
        return previous;
      }
      if ((previous?.revision ?? 0) !== baseRevision)
        throw new HttpsError(
          'aborted',
          'Le journal a changé sur un autre appareil. Recharge sa version avant de continuer.'
        );
      let next;
      try {
        next = stampSession(state, previous, clientNow, Date.now());
      } catch (e) {
        throw new HttpsError(
          'invalid-argument',
          e instanceof Error ? e.message : 'Journal invalide.'
        );
      }
      tx.update(ref, { brewDay: next });
      tx.create(receipt, {
        batchId: id,
        revision: next.revision,
        at: new Date(),
        expiresAt: new Date(Date.now() + 7 * 86400000)
      });
      return next;
    });
    return { state: saved, serverNow: Date.now() };
  }
);
