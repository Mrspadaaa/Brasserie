// Voie d99 : l'empreinte `proposer` du banc ×1 (celle de client-async.test.ts), avec le défaut D99 et avec apportMinoritaire: 'aucun' (ancien défaut), sur les données actuelles.
// Lancement : npx vite-node .../empreinte-proposer.ts            (défaut D99)
//             APPORT=aucun npx vite-node .../empreinte-proposer.ts (ancien défaut)
import { createHash } from 'node:crypto';
import * as adapter from '../../../../../prototypes/houblons-v4/parcours/src/moteur';
import { recetteDegustee } from '../../../../../prototypes/houblons-v4/parcours/src/donnees/cas';
import { moteur } from '../../../../../src/ui/hopIndex/parcours/donnees';

const empreinte = (x: unknown) => createHash('sha1').update(JSON.stringify(x)).digest('hex').slice(0, 12);
const DIR = { floral: 1, resin: -1 } as const;
if (process.env.APPORT === 'aucun') {
  const mt = moteur() as unknown as { proposeVoies: (r: unknown, d: unknown, o: Record<string, unknown>) => unknown };
  const orig = mt.proposeVoies.bind(mt);
  mt.proposeVoies = (r, d, o) => orig(r, d, { ...o, apportMinoritaire: 'aucun' });
}
const v = adapter.proposer(recetteDegustee(), DIR);
console.log(`APPORT=${process.env.APPORT ?? 'défaut D99'} : proposer ${empreinte(v.voies)} (${v.voies.length} voies)`);
