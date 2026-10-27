// Voie f8 : où sont les six houblons du brasseur (D191) si on range les variétés SEULEMENT par leur radar Beer Maverick ? Lecture directe des données, sans moteur ni pool.
//   node scripts/eval-hop/f8-radar.mjs
// Axes du radar (ordre BM_AXES) : 0 agrumes, 1 tropical, 2 noyau, 3 baies, 4 floral, 5 herbe, 6 herbacé, 7 épice, 8 résine.
import { readFileSync } from 'node:fs';
const d = JSON.parse(readFileSync(new URL('../../src/data/hopV4/proto-data.json', import.meta.url), 'utf8'));
const six = ['el-dorado', 'mosaic', 'mandarina-bavaria', 'calypso', 'pacific-jade', 'idaho-7'];
const avecRadar = d.varieties.filter((v) => v.bm?.arome);
console.log(`${d.varieties.length} variétés, ${avecRadar.length} avec radar`);
for (const [nom, axe] of [['agrumes', 0], ['tropical', 1]]) {
  const nb = (x) => avecRadar.filter((v) => v.bm.arome[axe] >= x).length;
  console.log(`${nom} : radar ≥5 : ${nb(5)}, ≥4 : ${nb(4)}, ≥3 : ${nb(3)}, ≥2 : ${nb(2)} variétés`);
  console.log('  ses six :', six.map((s) => { const v = d.varieties.find((x) => x.id === `beermaverick-${s}`); return `${s} ${v?.bm?.arome ? v.bm.arome[axe] : 'inconnu'}`; }).join(', '));
}
