// Voie f9 (D105) : la liste de Suggérer du brasseur en stout S1 (« plus floral, moins résineux », fixtures du prototype), sans option et avec la typicité. Les achats à 10′ et la liste complète.
//   npx vite-node scripts/eval-hop/f9-s1.ts
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import { poserTypicite } from '../../src/domain/hopIndex/v4/typicite';
import { s1Recipe } from '../../prototypes/houblons-v4/src/pack/buildPack';
import { COMBINAISONS, chargerTable } from './f9-commun';

chargerTable();
const m = creerMoteur();
for (const c of COMBINAISONS) {
  const r = m.proposeVoies(s1Recipe(), { floral: 1, resin: -1 }, { intensite: c.intensite, typicite: c.typicite });
  console.log(`== ${c.nom} : ${r.voies.length} voies`);
  r.voies.forEach((v, i) => console.log(`${String(i + 1).padStart(2)} ${v.domain.padEnd(9)} ${v.label.slice(0, 52).padEnd(52)} typ ${v.typicite ? v.typicite.palier : '-'} dist ${v.distance.total}`));
}
poserTypicite(null);
