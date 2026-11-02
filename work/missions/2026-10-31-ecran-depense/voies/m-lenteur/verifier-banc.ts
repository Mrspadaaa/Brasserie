// Témoin : le jugement du banc (judgeBench, l'oracle) sur les résultats déjà écrits d'une passe : les chiffres que `mesurer.ts` doit retrouver pour l'option A.
// Usage : npx tsx work/missions/2026-10-31-ecran-depense/voies/m-lenteur/verifier-banc.ts --banc=banc-k6-C --banc=banc-d272b-hl
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { judgeBench } from '../../../../../scripts/banc-lecture-facture-juger';
import { loadCases } from '../../../../../scripts/banc-lecture-facture';

const REELS = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/finalisation-tickets-2026-10-08/H13-reels';
const cases = loadCases(['cas.json', 'cas-2.json', 'cas-3.json', 'cas-4.json', 'cas-5.json'].map(f => path.join(REELS, f)));
for (const arg of process.argv.filter(a => a.startsWith('--banc='))) {
  const dir = arg.slice(7);
  const banc = JSON.parse(readFileSync(path.join(REELS, dir, 'results.json'), 'utf8'));
  const { stats } = judgeBench(banc.records, cases);
  for (const [id, s] of Object.entries(stats)) console.log(`${dir} ${id} : champs ${s.right}/${s.judged} · lignes ${s.lineRight}/${s.lineJudged} · faux verts ${s.fauxVerts}`);
}
