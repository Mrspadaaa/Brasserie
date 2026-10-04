import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { requireBrewer } from './brewSession.js';
import { createBrewerCatalogueStore } from './brewerCatalogueStore.js';
import { loadBrewingCatalogueReferences } from './brewerTools.js';

/** The UI invokes the same commands/provider as Gemini; no extra model call. */
export const readBrewingCatalogue = onCall({ region: 'europe-west6', timeoutSeconds: 60, maxInstances: 3 }, async request => {
  const ownerKey = requireBrewer(request);
  return createBrewerCatalogueStore({ database: getFirestore(), ownerKey, namespace: 'catalogue-ui', loadReferences: loadBrewingCatalogueReferences }).lookup(request.data);
});

export const writeBrewingCatalogue = onCall({ region: 'europe-west6', timeoutSeconds: 60, maxInstances: 3 }, async request => {
  const ownerKey = requireBrewer(request);
  if (!request.data || typeof request.data !== 'object') throw new HttpsError('invalid-argument', 'Commande de catalogue requise.');
  return createBrewerCatalogueStore({ database: getFirestore(), ownerKey, namespace: 'catalogue-ui', loadReferences: loadBrewingCatalogueReferences }).write(request.data);
});
