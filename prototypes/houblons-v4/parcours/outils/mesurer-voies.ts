// Mesure de proposer() (voies du moteur, Suggérer de q2b) sur le cas de la maquette : à froid puis à chaud.
// Usage (depuis prototypes/houblons-v4) : npx vite-node parcours/outils/mesurer-voies.ts
import { proposeVoies } from '../../../../src/domain/hopIndex/v4';
import { DEGUSTATION, recetteDegustee } from '../src/donnees/cas';

const r = recetteDegustee();
const d = { floral: 1, resin: -1 };
let t = performance.now();
const v = proposeVoies(r, d, { tasting: DEGUSTATION, assemblages: true });
const froid = performance.now() - t;
t = performance.now();
proposeVoies(r, d, { tasting: DEGUSTATION, assemblages: true });
const chaud = performance.now() - t;
console.log(`VOIES ${v.voies.length} (évaluées ${v.evaluated}) ; froid ${froid.toFixed(0)} ms ; chaud ${chaud.toFixed(0)} ms`);
console.log(v.voies.slice(0, 8).map((x: any) => `${x.type ?? x.kind}:${(x.actions ?? []).map((a: any) => a.hopKey ?? a.hop ?? '').join('+')}`).join(' | '));
