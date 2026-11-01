// Voie port-total, P7 : compare, hors ligne, trois jugements des mêmes lectures (sorties `banc-port-avant-<doc>`). Comptes seulement.
//   1. ancien juge (portEnLigne) x anciennes vérités (copies .avant-port) = « avant » ; doit reproduire le RESULTAT-BANC.md de HEAD
//   2. nouveau juge x nouvelles vérités = « après »
//   3. contrôle : nouveau juge x anciennes vérités ; doit égaler le n° 2 tirage par tirage
// Lancer depuis la racine du worktree : npx vite-node --config vitest.config.ts <ce fichier>
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const racine = process.cwd();
const juger = await import(path.join(racine, 'scripts/banc-lecture-facture-juger.ts').split(path.sep).join('/'));
const banc = await import(path.join(racine, 'scripts/banc-lecture-facture.ts').split(path.sep).join('/'));
const REELS = path.join(racine, 'work/finalisation-tickets-2026-10-08/H13-reels');
const anciennes = ['cas.json', 'cas-2.avant-port.json', 'cas-3.json', 'cas-4.avant-port.json'].map(f => path.join(REELS, f));
const nouvelles = ['cas.json', 'cas-2.json', 'cas-3.json', 'cas-4.json'].map(f => path.join(REELS, f));
const casAnciens = banc.loadCases(anciennes), casNouveaux = banc.loadCases(nouvelles);
const autreGenre = new Set<string>(process.argv.includes('--autre-genre') ? [] : []);

let ok = true;
const dire = (texte: string) => console.log(texte);
for (const doc of ['doc5', 'doc8', 'doc9']) {
  const dir = path.join(REELS, `banc-port-avant-${doc}`);
  const file = JSON.parse(readFileSync(path.join(dir, 'results.json'), 'utf8'));
  const j1 = juger.judgeBench(file.records, casAnciens, { portEnLigne: true });
  const j2 = juger.judgeBench(file.records, casNouveaux);
  const j3 = juger.judgeBench(file.records, casAnciens);
  // 1. l'option rend HEAD : le tableau recalculé égale celui que le banc a écrit sur HEAD
  const attendu = readFileSync(path.join(dir, 'RESULTAT-BANC.md'), 'utf8');
  const recalcule = juger.renderTable(file, j1.stats, undefined, j1.draws);
  const memeTableau = attendu === recalcule;
  // 3. contrôle : mêmes verdicts, tirage par tirage
  const memeControle = JSON.stringify(j2.draws.map((d: any) => [d.variant, d.tirage, d.verdict])) === JSON.stringify(j3.draws.map((d: any) => [d.variant, d.tirage, d.verdict]));
  const cellules = juger.comparerJugements(j1.draws, j2.draws, autreGenre);
  const pertes = cellules.filter((c: any) => c.perte);
  const delta = cellules.map((c: any) => `${c.cellule}: lignes jugées ${c.avant.lineJudged}→${c.apres.lineJudged}, écart lignes ${c.avant.lineJudged - c.avant.lineRight}→${c.apres.lineJudged - c.apres.lineRight}, écart champs ${c.avant.judged - c.avant.right}→${c.apres.judged - c.apres.right}, ajoutés ${c.ajoutes.length}, retirés ${c.retires.length}${c.perte ? ' PERTE' : ''}`);
  dire(`== ${doc} : ${cellules.length} cellules`);
  dire(`   (1) option portEnLigne = tableau de HEAD : ${memeTableau ? 'OUI' : 'NON'}`);
  dire(`   (3) cellule de contrôle (nouveau juge x anciennes vérités = x nouvelles) : ${memeControle ? 'IDENTIQUE' : 'DIFFERENT'}`);
  for (const ligne of delta) dire(`   ${ligne}`);
  dire(`   pertes : ${pertes.length}`);
  if (!memeTableau || !memeControle || pertes.length) ok = false;
}
dire(ok ? 'REJEU PORT OK' : 'REJEU PORT ECHEC');
process.exitCode = ok ? 0 : 1;
