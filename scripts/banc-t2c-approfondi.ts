/**
 * Banc t2c — mode APPROFONDI du compagnon : dossier du juge à l'aveugle et tableau, sur les sorties de `banc-compagnon.ts --voie t2c --mode deep`.
 * Les passes se jouent avec `banc-compagnon.ts` (cellules `prod`, `analysis=gemini-4-hydrogen@medium`, `…@high`) ; la relecture reste la production (3.8, réflexion haute en Approfondi).
 * La grille, les facettes et le juge sont ceux de g2 (`banc-compagnon-grille.ts`) : vérité écrite avant (GRILLE.md de g2), juge à l'aveugle, moitié choix / moitié jugement (L20).
 *
 *   npx vite-node --config vitest.config.ts scripts/banc-t2c-approfondi.ts -- --dossier   écrit dossier-juge-<moitié>.md et cle-juge-<moitié>.json
 *   npx vite-node --config vitest.config.ts scripts/banc-t2c-approfondi.ts -- --tableau   lit notes-juge-<moitié>.json, écrit tableau-<moitié>.md
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { agreger, dossierJuge, lireSorties, tableauMarkdown, type NotesJuge, type ResultatLu } from './banc-compagnon-grille';
import { MISSION_DIR } from './banc-compagnon';

export const DOSSIER_APPROFONDI = `${MISSION_DIR}/voies/t2c/approfondi`;
type Moitie = 'choix' | 'jugement' | 'tout';

export function ecrireDossier(dossier: string, moitie: Moitie): { ids: number } {
  const resultats = lireSorties(dossier);
  const { ids } = dossierJuge(resultats, dossier, moitie);
  return { ids };
}
export function ecrireTableau(dossier: string, moitie: Moitie): string {
  const fichierNotes = path.join(dossier, `notes-juge-${moitie}.json`), fichierCle = path.join(dossier, `cle-juge-${moitie}.json`);
  if (!existsSync(fichierNotes) || !existsSync(fichierCle)) throw new Error(`Il manque ${fichierNotes} ou ${fichierCle} : écrire le dossier, puis noter à l'aveugle.`);
  const resultats: ResultatLu[] = lireSorties(dossier);
  const cle = JSON.parse(readFileSync(fichierCle, 'utf8'));
  const notes = JSON.parse(readFileSync(fichierNotes, 'utf8')) as NotesJuge;
  const texte = tableauMarkdown(agreger(resultats, cle, notes));
  writeFileSync(path.join(dossier, `tableau-${moitie}.md`), `${texte}\n`);
  return texte;
}

export function main(args: string[]) {
  const une = (nom: string) => args.flatMap((a, i) => (a === nom && args[i + 1] !== undefined ? [args[i + 1]] : []))[0];
  const dossier = une('--out') ?? DOSSIER_APPROFONDI;
  const moitie = (une('--moitie') ?? 'tout') as Moitie;
  if (args.includes('--dossier')) console.log(`dossier du juge : ${ecrireDossier(dossier, moitie).ids} sorties`);
  else if (args.includes('--tableau')) console.log(ecrireTableau(dossier, moitie));
  else throw new Error('--dossier ou --tableau.');
}
const estPrincipal = () => !process.env.VITEST && ['--dossier', '--tableau'].some(drapeau => process.argv.includes(drapeau));
if (estPrincipal()) { try { main(process.argv.slice(2)); } catch (erreur) { console.error(String((erreur as Error).message)); process.exitCode = 1; } }
