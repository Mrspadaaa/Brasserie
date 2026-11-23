// Voie s3 (D195) : sonde du moteur sur sa neipa v3 (22A), cas « Lotus 84 g à 40′ + Columbus 100 g au dry hop actif » ou « saturation » (Lotus 78 g à 20′ + 144 g au dry hop actif).
//   npx vite-node scripts/eval-hop/s3-sonde.ts -- <colum|saturation> <famille:cran>[,<famille:cran>…]
// Rend, pour `saturation: false` (ae7c7a8d) puis `true` : les premières voies de l'écran (type, houblon, effet des familles visées, débordements dits).
import { chargerCataloguePlein } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import { CATALOGUE, STOCK } from '../../src/domain/hopIndex/v4';
import type { Recipe } from '../../src/domain/hopIndex/v4/recipe';
import { chargerTable } from './f9-commun';
import { poserTypicite } from '../../src/domain/hopIndex/v4/typicite';

let PLEIN: typeof CATALOGUE = [];
const [cas = 'colum', dir = 'tropical:1'] = process.argv.slice(2).filter((a) => a !== '--');
const direction = Object.fromEntries(dir.split(',').map((x) => { const [f, n] = x.split(':'); return [f, Number(n)]; }));
const recette = (): Recipe => ({
  name: 'neipa v3', styleCode: '22A', volumeL: 24, og: 1.081, boilMin: 60, yeastId: 'lalbrew-verdant-ipa', ebc: 10,
  additions: cas === 'colum'
    ? [{ id: 'a1', hopKey: 'beermaverick-lotus', moment: 'b30', grams: 84 }, { id: 'a2', hopKey: 'beermaverick-columbus', moment: 'dryActive', grams: 100 }]
    : [{ id: 'a1', hopKey: 'beermaverick-lotus', moment: 'b15', grams: 78 }, { id: 'a2', hopKey: 'beermaverick-lotus', moment: 'dryActive', grams: 144 }],
});
async function main() {
  chargerTable();
  const plein = !!process.env.S3_PLEIN; // S3_PLEIN=1 : catalogue plein et stock vide (l'app en dev-local)
  const catalogue = await chargerCataloguePlein();
  PLEIN = catalogue;
  const m = creerMoteur({ catalogue, stock: plein ? [] : STOCK });
  for (const saturation of [false, true]) {
    const res = m.proposeVoies(recette(), direction, { assemblages: true, saturation, usageAuFrais: saturation, moments: ['dryActive'], typicite: true, intensite: false });
    console.log(`--- saturation: ${saturation} : ${res.voies.length} voies`);
    for (const v of res.voies.filter((x) => x.type !== 'levure').slice(0, 14)) {
      const e = Object.keys(direction).map((f) => `${f} ${v.effect[f as keyof typeof v.effect].central ?? '?'}`).join(' ');
      const usage = (k: string) => { const c = (process.env.S3_PLEIN ? PLEIN : CATALOGUE).find((x) => x.id === k); return `${String(c?.purpose ?? '?').padEnd(9)} α${c?.alpha ? c.alpha.join('-') : '?'}`.padEnd(18); };
      console.log(`${String(v.rank).padStart(3)} ${usage(v.actions[0].hopKey)} ${v.reculeUsage ? 'RECULE' : '      '} ${v.type.padEnd(24)} ${v.actions.map((a) => `${a.op === 'retirer' ? '−' : ''}${a.hopName}@${a.moment}:${a.grams}`).join(' + ').padEnd(50)} ${e.padEnd(28)} rang=${v.overflowRang ?? '-'} hors=${v.styleOverflow.map((o) => `${o.family}${o.voulu ? '*' : ''}${o.minuscule ? '~' : ''}:${o.crans}`).join(',') || '-'}`);
    }
  }
  poserTypicite(null);
}
void main();
