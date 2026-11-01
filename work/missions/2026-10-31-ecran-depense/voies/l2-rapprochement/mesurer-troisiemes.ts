/**
 * Voie l2 : combien de troisièmes lectures partent sur des paires de lectures simulées (aucun appel Gemini).
 * Lancement, depuis la racine : npx vite-node work/missions/2026-10-31-ecran-depense/voies/l2-rapprochement/mesurer-troisiemes.ts
 * Une « troisième lecture » part quand reconcileInvoiceVision([a, b]).needsCorrection est vrai. Le jeu (20 paires) est celui des tests :
 * tests/unit/depense/rapprochement/aide.ts (corpus).
 */
import { reconcileInvoiceVision } from '../../../../../functions/src/invoiceVisionReview';
import { corpus, lire } from '../../../../../tests/unit/depense/rapprochement/aide';

let departs = 0;
const cas = corpus();
for (const [nom, a, b, attendu] of cas) {
  const part = reconcileInvoiceVision([lire(a), lire(b)]).needsCorrection;
  if (part) departs++;
  console.log(`${part ? 'TROISIEME LECTURE' : 'pas de 3e lecture '} | attendu après l2 : ${attendu ? 'oui' : 'non'} | ${nom}`);
}
console.log(`TROISIEMES LECTURES : ${departs} sur ${cas.length} paires`);
