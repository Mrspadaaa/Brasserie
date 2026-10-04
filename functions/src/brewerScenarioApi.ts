import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { requireBrewer } from './brewSession.js';
import { createBrewerScenarioStore } from './brewerScenarioStore.js';

export const readBrewingScenario = onCall({ region: 'europe-west6', timeoutSeconds: 60, maxInstances: 3 }, async request => {
  const ownerKey = requireBrewer(request);
  if (typeof request.data?.scenarioId !== 'string') throw new HttpsError('invalid-argument', 'Identifiant de scénario requis.');
  return createBrewerScenarioStore({ database: getFirestore(), ownerKey }).read(request.data.scenarioId);
});
/** An authenticated UI saves its shared-domain result or an append-only event.
 * This endpoint never applies recipe, stock or performed-program mutations. */
export const writeBrewingScenario = onCall({ region: 'europe-west6', timeoutSeconds: 60, maxInstances: 3 }, async request => {
  const ownerKey = requireBrewer(request);
  if (!request.data || typeof request.data !== 'object') throw new HttpsError('invalid-argument', 'Commande de scénario requise.');
  return createBrewerScenarioStore({ database: getFirestore(), ownerKey }).write(request.data);
});
