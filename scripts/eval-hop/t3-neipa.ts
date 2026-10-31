// Voie t3 : la tête de Suggérer sur la neipa saturée (22A, Lotus 78 g à 15′ + 144 g au dry hop actif), « plus d'agrumes » au dry hop actif, SANS R4 (`usageAuFrais: false`, l'ordre d'avant t3 ; la R4 de
// 4a752523, qui lisait l'usage Beer Maverick, ne bougeait déjà rien ici : voies/s3-saturation/RESULTAT.md) et AVEC R4 (la part au frais continue de Beer Analytics). Mêmes options que l'écran (s3-sonde.ts).
//   npx vite-node scripts/eval-hop/t3-neipa.ts -- [--stock] [--demande=citrus] [--n=12] [--moment=dryActive]
// Rend, pour chaque état, les `n` premières voies (hors levure) avec la part au frais du houblon (Beer Analytics) et la clé de R4, puis la part au frais moyenne des 4 premiers.
import { chargerCataloguePlein } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import { STOCK } from '../../src/domain/hopIndex/v4';
import type { FamilyId } from '../../src/domain/hopIndex/v4/families';
import type { MomentId, Recipe } from '../../src/domain/hopIndex/v4/recipe';
import { poserTypicite, usageAuFrais } from '../../src/domain/hopIndex/v4/typicite';
import { COUPURE_FRAIS } from '../../src/domain/hopIndex/v4/voies';
import { chargerTable } from './f9-commun';

if (process.argv.includes('--position=fin')) for (const k of Object.keys(COUPURE_FRAIS)) delete COUPURE_FRAIS[k as keyof typeof COUPURE_FRAIS]; // fin : la clé de l'emploi au frais après toute la clé de départage
const arg = (k: string, d: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const famille = arg('demande', 'citrus') as FamilyId, n = Number(arg('n', '12')), moment = arg('moment', 'dryActive') as MomentId, avecStock = process.argv.includes('--stock');
const SATUREE: Recipe = { name: 'neipa v3 saturée', styleCode: '22A', volumeL: 24, og: 1.081, boilMin: 60, yeastId: 'lalbrew-verdant-ipa', ebc: 7,
  additions: [{ id: 'a1', hopKey: 'beermaverick-lotus', moment: 'b15', grams: 78 }, { id: 'a2', hopKey: 'beermaverick-lotus', moment: 'dryActive', grams: 144 }] };

async function main() {
  const table = chargerTable();
  const m = creerMoteur({ catalogue: await chargerCataloguePlein(), stock: avecStock ? STOCK : [] });
  const parts = (v: { actions: { op: string; hopKey: string }[] }) => v.actions.filter((a) => a.op !== 'retirer').map((a) => usageAuFrais(a.hopKey, table)?.part ?? null);
  const moyennes: Record<string, number> = {};
  for (const [nom, opts] of [['sans R4 (usageAuFrais: false)', { usageAuFrais: false }], ['avec R4 (part au frais continue)', {}]] as const) {
    const res = m.proposeVoies(SATUREE, { [famille]: 1 }, { assemblages: true, moments: [moment], typicite: true, intensite: false, ...opts });
    const voies = res.voies.filter((v) => v.type !== 'levure');
    console.log(`--- ${nom} : ${voies.length} voies (${avecStock ? 'stock' : 'catalogue plein, stock vide'}), ${famille} au ${moment}`);
    for (const v of voies.slice(0, n)) {
      const p = parts(v);
      console.log(`${String(v.rank).padStart(3)} ${v.type.padEnd(22)} ${v.actions.map((a) => `${a.op === 'retirer' ? '−' : ''}${a.hopName}@${a.moment}:${a.grams}`).join(' + ').padEnd(46)} frais=${p.map((x) => (x === null ? '?' : `${Math.round(x * 100)} %`)).join('/').padEnd(10)} cle=${v.cleFrais ?? 0}`);
    }
    const t4 = voies.slice(0, 4).flatMap(parts).filter((x): x is number => x !== null);
    moyennes[nom] = t4.length ? t4.reduce((s, x) => s + x, 0) / t4.length : NaN;
    console.log(`  4 premiers : part au frais moyenne ${Number.isNaN(moyennes[nom]) ? '?' : `${Math.round(moyennes[nom] * 100)} %`} (${t4.map((x) => `${Math.round(x * 100)}`).join(', ')})`);
  }
  poserTypicite(null);
}
void main();
