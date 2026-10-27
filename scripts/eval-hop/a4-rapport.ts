// Voie a4 : le RAPPORT (pas une porte) du rang de ses six houblons sur sa vraie recette (neipa v3, 22A), en agrumes et en tropicaux, au dry hop actif et au whirlpool.
//   npx vite-node scripts/eval-hop/a4-rapport.ts -- --sortie=avant     écrit voies/a4-algo-biais/rapport-avant.json (et l'imprime)
// Liste principale de l'écran : pool de 80 (production) et pool entier (maxBuy 400), pour séparer la borne du rang. Typicité posée (le défaut de l'app).
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MomentId } from '../../src/domain/hopIndex/v4/recipe';
import { poserTypicite } from '../../src/domain/hopIndex/v4/typicite';
import { R22A, SES_SIX, VISEES, chargerTable, houblonsDe, listePrincipale, moteurPlein } from './f9-commun';

const arg = (n: string) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=')[1];
const nom = arg('sortie') ?? 'avant';
const DOSSIER = join(process.cwd(), 'work', 'missions', '2026-10-25-integration-houblons', 'voies', 'a4-algo-biais');
const MOMENTS: [string, MomentId][] = [['dry hop actif', 'dryActive'], ['whirlpool', 'wp']];

async function main() {
  chargerTable();
  const m = await moteurPlein(true);
  const sortie: Record<string, Record<string, number | null>> = {};
  const lignes: string[] = [];
  for (const [bornes, maxBuy] of [['pool80', 80], ['entier', 400]] as const) {
    for (const [qn, f] of VISEES) {
      const res = m.proposeVoies(R22A, { [f]: 1 }, { maxBuy, limit: 2000, buyLimit: 2000, perHop: 100, assemblages: false, moments: ['wp', 'dryActive'] });
      for (const [mn, mo] of MOMENTS) {
        const h = houblonsDe(listePrincipale(res, mo));
        const cle = `${bornes} | ${qn} | ${mn}`;
        sortie[cle] = Object.fromEntries(SES_SIX.map((s) => [s, h.indexOf(s) + 1 || null]));
        lignes.push(`${cle.padEnd(42)} (${String(h.length).padStart(3)} houblons) ${SES_SIX.map((s) => `${s.slice(0, 9)} ${h.indexOf(s) + 1 || '–'}`).join(' · ')}  | tête : ${h.slice(0, 6).join(', ')}`);
      }
    }
  }
  writeFileSync(join(DOSSIER, `rapport-${nom}.json`), `${JSON.stringify(sortie, null, 1)}\n`);
  console.log(lignes.join('\n'));
  poserTypicite(null);
}
void main();
