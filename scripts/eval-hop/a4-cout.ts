// Voie a4 (L20) : le coût de la liste principale de Suggérer sur le catalogue PLEIN, à froid (premier appel du processus) et à chaud (doses du Lotus qui changent : aucun cache de voie).
//   npx vite-node scripts/eval-hop/a4-cout.ts -- [--maxbuy=80] [--sans-remplacements] [--style=22A|21C]
// Un processus = un « premier passage ». Non déterministe (millisecondes) : jamais dans une empreinte. Typicité posée (le défaut de l'app).
import type { FamilyId } from '../../src/domain/hopIndex/v4/families';
import type { Recipe } from '../../src/domain/hopIndex/v4/recipe';
import { poserTypicite } from '../../src/domain/hopIndex/v4/typicite';
import { R22A, chargerTable, moteurPlein } from './f9-commun';

const arg = (n: string) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=')[1];
const t = <T>(f: () => T): number => { const a = performance.now(); f(); return Math.round((performance.now() - a) * 10) / 10; };
async function main() {
  chargerTable();
  const m = await moteurPlein(true);
  const maxBuy = arg('maxbuy') === undefined ? undefined : Number(arg('maxbuy'));
  const remplacements = !process.argv.includes('--sans-remplacements');
  const rec = (g: number): Recipe => ({ ...R22A, additions: [{ id: 'a1', hopKey: 'beermaverick-lotus', moment: 'b30', grams: g }] });
  const dir: [string, Partial<Record<FamilyId, number>>][] = [['agrumes', { citrus: 1 }], ['tropicaux', { tropical: 1 }]];
  const opts = { assemblages: true, ...(maxBuy === undefined ? {} : { maxBuy }), ...(remplacements ? {} : { remplacements: false as const }) };
  const out: Record<string, number> = {};
  for (const [nom, d] of dir) {
    out[`${nom}-froid`] = t(() => m.proposeVoies(rec(84), d, opts));
    out[`${nom}-chaud`] = Math.round([85, 86, 87].map((g) => t(() => m.proposeVoies(rec(g), d, opts))).reduce((a, b) => a + b, 0) / 3 * 10) / 10;
  }
  console.log(JSON.stringify({ maxBuy: maxBuy ?? 'défaut', remplacements, ...out }));
  poserTypicite(null);
}
void main();
