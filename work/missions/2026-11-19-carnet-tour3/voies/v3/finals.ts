// Voie v3 : rejoue les réponses Gemini ENREGISTRÉES (H13-reels, hors Git) dans le vote de production (lireCsv8), comme
// tests/unit/depense/rejeu-enregistre.test.ts. Aucun appel Gemini. Sortie hors Git : <tmp>/v3-finals/<tirage>.json + résumé (comptes seulement).
// Usage (cwd port-carnet) : node_modules/.bin/vite-node <ce fichier>
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { normalizeInvoiceScan } from '../../../../../../port-carnet/functions/src/invoiceScanCore';
import { lireCsv8 } from '../../../../../../port-carnet/functions/src/invoiceScanVote';
const H13 = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/finalisation-tickets-2026-10-08/H13-reels';
const RUNS = ['banc-robuste-1', 'banc-robuste-2', 'banc-m9-payant', 'banc-m9-payant-t2'];
const DOCS = ['doc2', 'doc14', 'doc25'];
const OUT = `${tmpdir()}/v3-finals`; mkdirSync(OUT, { recursive: true });
const decode = (file: string) => {
  const c = JSON.parse(readFileSync(file, 'utf8')).candidates?.[0];
  if (c?.finishReason !== 'STOP') throw new Error('lecture coupée');
  const t = (c.content?.parts ?? []).filter((p: any) => p.thought !== true && typeof p.text === 'string').map((p: any) => p.text).join('');
  return normalizeInvoiceScan(JSON.parse(t.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')));
};
for (const run of RUNS) {
  const raw = `${H13}/${run}/raw`; if (!existsSync(raw)) continue;
  const tirages = new Set(readdirSync(raw).map(f => /^(doc\d+-t\d+)-Csv8[123]\.json$/.exec(f)?.[1]).filter((t): t is string => !!t && DOCS.includes(t.split('-')[0])));
  for (const tirage of tirages) {
    const f = [1, 2, 3].map(n => `${raw}/${tirage}-Csv8${n}.json`); if (!f.every(existsSync)) continue;
    try {
      let prov: any = null;
      const final = await lireCsv8({ readLite: async (n: 1 | 2) => decode(f[n - 1]), readStrong: async () => decode(f[2]), causeOf: () => null, deadlineReached: () => false, provisoire: (m: any) => { prov = m; } } as any);
      writeFileSync(`${OUT}/${run}__${tirage}.json`, JSON.stringify({ provisoire: prov, final }));
      const pts = final.points ?? [];
      const avant = (final.items ?? []).filter((i: any) => i.fusion?.avant).length;
      console.log(`${run}__${tirage} items=${final.items?.length} points=${pts.length} desaccords=${pts.filter((p: any) => p.source === 'désaccord').length} fusionAvant=${avant} retirees=${final.retirees?.lignes?.length ?? 0} readers=${final.review?.readers} prov=${prov ? prov.items?.length : 'non'} rang=${(final.items ?? []).filter((i: any) => typeof i.rangProvisoire === 'number').length}`);
    } catch (e: any) { console.log(`${run}__${tirage} ERREUR ${String(e.message).slice(0, 80)}`); }
  }
}
