// Voie a4 : la composition du pool « à acheter » d'une visée (tous les houblons qui citent la famille), par palier de typicité, et le rang de chacun des six par la clé du départage.
//   npx vite-node scripts/eval-hop/a4-pool.ts -- --viser=citrus [--style=22A]
import { cleHoublon, comparerCles } from '../../src/domain/hopIndex/v4/departage';
import type { FamilyId } from '../../src/domain/hopIndex/v4/families';
import { cites } from '../../src/domain/hopIndex/v4/hops';
import { poserTypicite, typiciteDe } from '../../src/domain/hopIndex/v4/typicite';
import { SES_SIX, chargerTable, moteurPlein } from './f9-commun';

const arg = (n: string, d: string) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=')[1] ?? d;
async function main() {
  chargerTable();
  const m = await moteurPlein(true);
  const f = arg('viser', 'citrus') as FamilyId, style = arg('style', '22A');
  const pool = m.catalogue.filter((c) => cites(c.id, f));
  const lignes = pool.map((c) => ({ id: c.id, cle: cleHoublon('k3k1t', c.id, f, style).cle, t: typiciteDe(c.id, style) }));
  lignes.sort((a, b) => comparerCles(a.cle, b.cle) || a.id.localeCompare(b.id));
  const parPalier: Record<string, number> = {};
  for (const l of lignes) { const k = String(l.t.palier); parPalier[k] = (parPalier[k] ?? 0) + 1; }
  console.log(`${f} en ${style} : ${pool.length} houblons le citent ; paliers ${JSON.stringify(parPalier)}`);
  for (const s of [...SES_SIX, "citra", "simcoe", "cascade", "nelson-sauvin", "galaxy"]) { const i = lignes.findIndex((l) => l.id.replace(/^beermaverick-/, '') === s); console.log(`  ${s} : ${i < 0 ? 'ne cite pas' : `rang ${i + 1} par la clé (${JSON.stringify(lignes[i].cle)}, typicité ${lignes[i].t.palier ?? 'inconnue'}${lignes[i].t.auPlus !== null ? ` au plus ${lignes[i].t.auPlus}` : ''})`}`); }
  poserTypicite(null);
}
void main();
