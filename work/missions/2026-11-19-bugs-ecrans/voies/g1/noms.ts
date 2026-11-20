/**
 * Voie g1 : relecture des noms en français (LR1-NOTE-1 à 3) avec la tâche de production `traduireNoms` (texte seul, gemini-3.8-flash), rejouée par le banc `scripts/banc-noms-fr.ts`
 * sur les lignes FINALES de la production déjà lue le 20.11 (sortie `banc-g1bugs-lot1`, variante Csv8+N, tirage 1). Journal et budget de la voie g1 (6,80 CHF, cumul du journal compris).
 *
 *   G1_MODE=estimer|payant   G1_DOCS=doc15,doc24,doc25   G1_SOURCE=<dossier>   G1_BUDGET=6.8   G1_OUT=<dossier>
 *   npx vite-node --config vitest.config.ts work/missions/2026-11-19-bugs-ecrans/voies/g1/noms.ts -- --confirm-paid-ai
 *
 * La clé n'est PAS dans port-carnet : `readLocalKey` la lit, dans le seul processus, au chemin du poste (worktree Brasserie), sans jamais l'afficher ni l'écrire. Les paires (nom de base, français)
 * restent dans le dossier de sortie (hors Git).
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chargerSource, estimerTexte, filtrerPieces, runNomsFr, ecrireSortie, resume } from '../../../../../scripts/banc-noms-fr';
import { spentInJournal } from '../../../../../scripts/banc-lecture-facture';
// @ts-ignore — module JavaScript sans déclarations
import { readLocalKey } from '../../../../../scripts/gemini-usage-bench-guard.mjs';

const BRASSERIE = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie';
const REELS = `${BRASSERIE}/work/finalisation-tickets-2026-10-08/H13-reels`;
const JOURNAL = path.join(path.dirname(fileURLToPath(import.meta.url)), 'journal-gemini.md');
const env = process.env;
const mode = env.G1_MODE ?? 'estimer';
const docs = (env.G1_DOCS ?? 'doc15,doc24,doc25').split(',').map(s => s.trim()).filter(Boolean);
const source = env.G1_SOURCE ?? `${REELS}/banc-g1bugs-lot1`;
const out = env.G1_OUT ?? `${REELS}/banc-g1bugs-noms`;

async function main() {
  const spent = spentInJournal(JOURNAL);
  if (mode === 'estimer') {
    const plans = filtrerPieces(chargerSource(source).plans, undefined, docs);
    console.log(estimerTexte(plans, ['38'], 1, spent).text.join('\n'));
    return;
  }
  const budgetChf = Number(env.G1_BUDGET);
  if (!(budgetChf > 0 && budgetChf <= 6.8)) throw new Error('G1_BUDGET attendu entre 0 et 6.8 (cumul du journal g1 compris).');
  const sortie = await runNomsFr({ mode: 'payant', modeles: ['38'], docs, source, budgetChf, plafondPasse: 1, out },
    { journalPath: JOURNAL, readKey: () => readLocalKey({ secretPath: `${BRASSERIE}/functions/.secret.local` }) });
  ecrireSortie(sortie);
  console.log(`PASSE FINIE : ${sortie.appels.length} appels, sortie ${sortie.outDir}${sortie.stopped ? `, ARRÊT : ${sortie.stopped}` : ''}`);
  console.log(resume(sortie.stats).join('\n'));
}
main().then(() => process.exit(0), error => { console.error(`G1 ECHEC : ${error instanceof Error ? error.message : String(error)}`); process.exit(1); });
