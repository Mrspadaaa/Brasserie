/**
 * Outils hors ligne du banc du compagnon (aucun appel Gemini) :
 *   --grille                      écrit GRILLE.md (la grille, figée avant les passes)
 *   --dossier [--moitie choix|jugement|tout] [--sans-notes]
 *                                 dossier du juge à l'aveugle + clé (sorties anonymisées, ordre mélangé)
 *   --tableau [--moitie ...]      tableau par cellule : sorties + clé + notes-juge.json (+ second regard automatique)
 * Dossier de travail : `--dir` (défaut work/missions/2026-11-14-gemini4/voies/g2).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { agreger, dossierJuge, grilleMarkdown, lireSorties, tableauMarkdown, type NotesJuge } from './banc-compagnon-grille';

export function main(args: string[]) {
  const valeur = (nom: string) => { const i = args.indexOf(nom); return i >= 0 ? args[i + 1] : undefined; };
  const dir = valeur('--dir') ?? 'work/missions/2026-11-14-gemini4/voies/g2';
  const moitie = (valeur('--moitie') ?? 'tout') as 'choix' | 'jugement' | 'tout';
  if (args.includes('--grille')) { writeFileSync(path.join(dir, 'GRILLE.md'), grilleMarkdown()); console.log('GRILLE.md écrit.'); return; }
  const sorties = lireSorties(path.join(dir, 'sorties'));
  if (args.includes('--dossier')) {
    // Les identifiants sont des hachages de « cellule|cas » : un nouveau dossier garde ceux déjà notés.
    const resultat = dossierJuge(sorties, path.join(dir, 'sorties'), moitie);
    console.log(`${resultat.ids} sorties dans dossier-juge-${moitie}.md (clé : cle-juge-${moitie}.json).`);
    return;
  }
  if (args.includes('--tableau')) {
    const cle: Record<string, { cas: string; cellule: string }> = {};
    const notes: NotesJuge = {};
    for (const nom of ['choix', 'jugement', 'tout']) {
      const fichierCle = path.join(dir, 'sorties', `cle-juge-${nom}.json`), fichierNotes = path.join(dir, `notes-juge-${nom}.json`);
      if (existsSync(fichierCle) && existsSync(fichierNotes)) { Object.assign(cle, JSON.parse(readFileSync(fichierCle, 'utf8'))); Object.assign(notes, JSON.parse(readFileSync(fichierNotes, 'utf8'))); }
    }
    const lignes = agreger(sorties, cle, notes).filter(ligne => moitie === 'tout' ? true : ligne.moitie === moitie);
    console.log(tableauMarkdown(lignes));
    return;
  }
  throw new Error('Une action : --grille, --dossier ou --tableau.');
}
if (!process.env.VITEST && (process.argv.includes('--grille') || process.argv.includes('--dossier') || process.argv.includes('--tableau'))) {
  try { main(process.argv.slice(2)); } catch (erreur) { console.error(String((erreur as Error).message)); process.exitCode = 1; }
}
