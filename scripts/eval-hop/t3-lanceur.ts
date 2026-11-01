// Voie t3 : lance un banc existant (s3-general, f5-phares, f9-nonreg…) AVEC la table de typicité posée, soit telle quelle (`--table=avec`, R4 lit la part au frais), soit sans sa part au frais
// (`--table=sans` : R4 ne trouve aucune clé, l'ordre d'avant t3 ; la R4 de 4a752523, qui lisait l'usage Beer Maverick, ne bougeait déjà rien sur ces bancs : s3-saturation/RESULTAT.md).
//   npx vite-node scripts/eval-hop/t3-lanceur.ts -- --table=sans|avec [--position=radar|fin] <banc.ts> [arguments du banc]
// Le banc est chargé après la pose de la table ; sa propre lecture du fichier de la table (f9-commun `chargerTable`) rend la même table, filtrée de la même façon.
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { resolve } from 'node:path';
import { poserTypicite, type TableTypicite } from '../../src/domain/hopIndex/v4/typicite';
import { COUPURE_FRAIS } from '../../src/domain/hopIndex/v4/voies';

const args = process.argv.slice(2).filter((a) => a !== '--');
const position = args.find((a) => a.startsWith('--position='))?.split('=')[1] ?? 'radar'; // radar : la clé de l'emploi au frais avant le radar (défaut du moteur) ; fin : après toute la clé de départage
if (position === 'fin') for (const k of Object.keys(COUPURE_FRAIS)) delete COUPURE_FRAIS[k as keyof typeof COUPURE_FRAIS];
const mode = args.find((a) => a.startsWith('--table='))?.split('=')[1] ?? 'avec';
const [banc, ...reste] = args.filter((a) => !a.startsWith('--table=') && !a.startsWith('--position='));
if (!banc) throw new Error('usage : t3-lanceur.ts -- --table=sans|avec <banc.ts> [arguments]');
const chemin = resolve('src/data/hopV4/typicite-styles.json');
const original = fs.readFileSync; // avant le filtre : la lecture du fichier lui-même ne passe pas par lui
const lire = (): TableTypicite => { const t = JSON.parse(original(chemin, 'utf8') as string) as TableTypicite; if (mode === 'sans') delete t.auFrais; return t; };
// @ts-expect-error : on filtre la lecture de la table, rien d'autre
fs.readFileSync = (p: unknown, ...r: unknown[]) => (typeof p === 'string' && resolve(p) === chemin && mode === 'sans' ? `${JSON.stringify(lire())}\n` : (original as (...a: unknown[]) => unknown)(p, ...r));
syncBuiltinESMExports();
poserTypicite(lire());
console.log(`# position ${position} ; table : ${mode === 'sans' ? 'SANS part au frais (avant t3)' : 'AVEC part au frais (t3)'} ; banc ${banc}`);
process.argv = [process.argv[0], resolve(banc), ...reste];
await import(resolve(banc));
