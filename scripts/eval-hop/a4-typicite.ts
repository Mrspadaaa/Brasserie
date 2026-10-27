// Voie a4 : la typicité de chaque houblon pour un style, avec sa cause (part, voisin, concentration, borne p16). Lecture seule.
//   npx vite-node scripts/eval-hop/a4-typicite.ts -- --style=22A [--houblons=a,b,c] [--resume]
import { poserTypicite, typiciteDe } from '../../src/domain/hopIndex/v4/typicite';
import { SES_SIX, chargerTable, moteurPlein } from './f9-commun';

const arg = (n: string, d: string) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=')[1] ?? d;
async function main() {
  const table = chargerTable();
  const style = arg('style', '22A');
  if (process.argv.includes('--resume')) {
    const m = await moteurPlein(true);
    const n: Record<string, number> = {}, raisons: Record<string, number> = {};
    for (const c of m.catalogue) { const t = typiciteDe(c.id, style); const k = String(t.palier); n[k] = (n[k] ?? 0) + 1; if (t.palier === null) { const r = `${t.raison}${t.auPlus !== null ? ' (borné par p16)' : ''}`; raisons[r] = (raisons[r] ?? 0) + 1; } }
    console.log(`${style} : ${m.catalogue.length} houblons, paliers ${JSON.stringify(n)}`); console.log(JSON.stringify(raisons, null, 1));
  }
  console.log(`p16 : ${Object.keys(table.p16).length} houblons ; seuils : rare < 1 %, courant 1–5 %, typé ≥ 5 % (PALIERS_TYPICITE)`);
  for (const id of arg('houblons', SES_SIX.join(',')).split(',')) {
    const t = typiciteDe(id, style);
    console.log(`${id.padEnd(18)} palier ${t.palier ?? 'inconnue'} | part ${t.part ?? '–'} (${t.origine ?? '–'} ${t.code ?? ''}) | concentration ${t.concentration ?? '–'} | au plus ${t.auPlus ?? '–'} | ${t.raison ?? ''} | p16 ${table.p16[id] ?? '–'} | recettes ${table.recettes?.[id] ?? '–'}`);
  }
  poserTypicite(null);
}
void main();
