// t2 (D120) : sans table, la typicité par défaut ne change que le champ `typicite` (le rang est celui de k3k1) ; avec la table, l'ordre S1 change.
// Usage : npx vite-node work/missions/2026-10-25-integration-houblons/voies/t2-typicite-defaut/sans-table.ts
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as adapter from '../../../../../prototypes/houblons-v4/parcours/src/moteur';
import { recetteDegustee } from '../../../../../prototypes/houblons-v4/parcours/src/donnees/cas';
import { poserTypicite } from '../../../../../src/domain/hopIndex/v4/typicite';

const h = (x: unknown) => createHash('sha1').update(JSON.stringify(x)).digest('hex').slice(0, 12);
const recette = recetteDegustee();
const DIR = { floral: 1, resin: -1 } as const;
type V = { label: string; typicite?: unknown; stock?: { status: string } };
const sans = (voies: V[]) => voies.map((v) => { const { typicite, ...r } = v; void typicite; return r; });
const achats = (voies: V[]) => voies.filter((v) => v.stock?.status === 'à acheter').slice(0, 6).map((v) => v.label);

const a = adapter.proposer(recette, DIR).voies as unknown as V[];
console.log('sans table : empreinte voies', h(a), '; sans le champ typicite', h(sans(a)));
console.log('sans table : achats', achats(a));
const table = JSON.parse(readFileSync(new URL('../../../../../src/data/hopV4/typicite-styles.json', import.meta.url), 'utf8'));
poserTypicite(table);
adapter.configurerDonnees({});
const b = adapter.proposer(recette, DIR).voies as unknown as V[];
console.log('avec table : empreinte voies', h(b));
console.log('avec table : achats', achats(b));
