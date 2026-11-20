/**
 * Voie g1 (bugs-ecrans) : lance le banc de lecture sur la PRODUCTION déployée (functions/ de port-carnet, variante Csv8 + normalisation N),
 * avec un journal et un budget à soi (7 CHF au plus pour tout le budget IA du 20.11), sans toucher le journal de la mission 11-01.
 *
 * Pas de `--payant` ni `--simuler` dans argv (le banc se lancerait de lui-même) : le mode vient de G1_MODE.
 *   G1_MODE=estimer|simuler|payant   G1_DOCS=doc2,doc7   G1_REPEAT=1   G1_OUT=<dossier>   G1_BUDGET=6.8   G1_PLAFOND=1
 *   G1_VARIANTES=Csv8   (clé : GEMINI_API_KEY lue par readLocalKey du banc, jamais affichée)
 * Lancement (depuis la racine de port-carnet) :
 *   G1_MODE=payant ... npx vite-node --config vitest.config.ts work/missions/2026-11-19-bugs-ecrans/voies/g1/lancer.ts -- --confirm-paid-ai
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCases, runBench, estimateBench, spentInJournal } from '../../../../../scripts/banc-lecture-facture';
import { preparerAllegement } from '../../../../../scripts/banc-lecture-alleger';

const REELS = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/finalisation-tickets-2026-10-08/H13-reels';
const CAS = path.join(REELS, 'g1-cas.json');
const JOURNAL = path.join(path.dirname(fileURLToPath(import.meta.url)), 'journal-gemini.md');
const env = process.env;
const mode = (env.G1_MODE ?? 'simuler') as 'estimer' | 'simuler' | 'payant';
const docs = env.G1_DOCS?.split(',').map(s => s.trim()).filter(Boolean);
const repeat = Number(env.G1_REPEAT ?? 1);
const variantes = (env.G1_VARIANTES ?? 'Csv8').split(',').map(s => s.trim()) as any;
const out = env.G1_OUT ? path.resolve(env.G1_OUT) : undefined;

async function main() {
  const base = { repeat, docs, variantes, normaliser: true, cas: [CAS], faults: false, out } as any;
  if (mode === 'estimer') {
    const cases = loadCases([CAS]).filter(c => !docs || docs.includes(c.id));
    await preparerAllegement(cases);
    const spent = spentInJournal(JOURNAL);
    console.log(estimateBench({ ...base, mode: 'payant', budgetChf: Number(env.G1_BUDGET ?? 6.8) } as any, cases, undefined, spent).text.join('\n'));
    return;
  }
  if (mode === 'simuler') {
    await runBench({ ...base, mode: 'simuler', out: out ?? path.join(process.env.TEMP ?? '.', `g1-sim-${Date.now()}`) } as any, { cases: loadCases([CAS]).filter(c => !docs || docs.includes(c.id)) } as any);
    console.log('BANC SIMULE OK');
    return;
  }
  const budgetChf = Number(env.G1_BUDGET);
  if (!(budgetChf > 0 && budgetChf <= 6.8)) throw new Error('G1_BUDGET attendu entre 0 et 6.8 (cumul du journal g1 compris).');
  const plafondPasse = Number(env.G1_PLAFOND ?? 1);
  const cases = loadCases([CAS]).filter(c => !docs || docs.includes(c.id));
  const result = await runBench({ ...base, mode: 'payant', budgetChf, plafondPasse } as any, { journalPath: JOURNAL, cases } as any);
  console.log(`PASSE FINIE : ${result.records.length} tirages, sortie ${result.outDir}${result.stopped ? `, ARRÊT : ${result.stopped}` : ''}`);
}
main().then(() => process.exit(0), error => { console.error(`G1 ECHEC : ${error instanceof Error ? error.message : String(error)}`); process.exit(1); });
