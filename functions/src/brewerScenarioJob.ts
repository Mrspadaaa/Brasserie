import type { Firestore } from 'firebase-admin/firestore';
import { createBrewerScenarioStore } from './brewerScenarioStore.js';
import { guardBrewerJobMutation, type BrewerCatalogueJobIdentity } from './brewerCatalogueJob.js';

export function createBrewerScenarioForJob(database: Firestore, identity: BrewerCatalogueJobIdentity) {
  const observations = new WeakMap<object, any[]>();
  return createBrewerScenarioStore({ database, ownerKey: identity.uid,
    guard: async tx => {
      const job = await guardBrewerJobMutation(database, tx, identity);
      observations.set(tx, Array.isArray(job.scenarioReceipts) ? job.scenarioReceipts : []);
    },
    attachReceipt: (tx, receipt) => {
      const previous = observations.get(tx);
      if (!previous) throw Error('Le reçu scénario exige une analyse courante.');
      const next = [...previous.filter(item => item.operationId !== receipt.operationId), receipt];
      tx.update(database.doc(`brewerJobs/${identity.id}`), { scenarioReceipts: next, updatedAt: Date.now() });
      observations.set(tx, next);
    }
  });
}
