// Voie f8 : la liste de Suggérer du brasseur en stout S1 (« plus floral, moins résineux », fixtures du prototype), avant (departage 'aucun') et après D118 (défaut). Les 14 voies montrées.
//   npx vite-node scripts/eval-hop/f8-s1.ts
import { proposeVoies } from '../../src/domain/hopIndex/v4';
import { s1Recipe } from '../../prototypes/houblons-v4/src/pack/buildPack';

for (const [nom, opts] of [['aucun (avant D118)', { departage: 'aucun' as const }], ['défaut (k3k1)', {}]] as const) {
  const r = proposeVoies(s1Recipe(), { floral: 1, resin: -1 }, opts);
  console.log(`== ${nom} : ${r.voies.length} voies`);
  r.voies.forEach((v, i) => console.log(`${String(i + 1).padStart(2)} ${v.domain.padEnd(9)} ${v.label.slice(0, 52).padEnd(52)} déb ${v.overflowRang ?? v.overflowTotal} dist ${v.distance.total} clé ${JSON.stringify(v.departage?.cle?.slice(0, 3) ?? null)}`));
}
