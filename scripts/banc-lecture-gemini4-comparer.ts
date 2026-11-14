/**
 * Voie g1 (mission 2026-11-14-gemini4) : compare des CELLULES du banc (un modèle « fort » × un niveau de réflexion), une sortie du banc par cellule.
 * Réglage sur une moitié des pièces, jugement sur l'autre (L20) : `--docs` limite le tableau à une moitié.
 * Aucune valeur des documents : des comptes, des durées, des coûts.
 *
 *   npx vite-node --config vitest.config.ts scripts/banc-lecture-gemini4-comparer.ts -- --docs=doc1,doc3 "--cellule=<étiquette>::<dossier>" …
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { casPath, loadCases, type DrawRecord } from './banc-lecture-facture';
import { judgeBench, lignesSansPort } from './banc-lecture-facture-juger';
import { coutDecembre } from './banc-lecture-modeles';

const quantile = (values: number[], q: number): number | null => {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b), at = (s.length - 1) * q, lo = Math.floor(at), hi = Math.ceil(at);
  return s[lo] + (s[hi] - s[lo]) * (at - lo);
};
const sec = (ms: number | null) => (ms === null ? '—' : `${(ms / 1000).toFixed(1).replace('.', ',')} s`);
const chf = (micro: number | null, digits = 4) => (micro === null ? '—' : (micro / 1e6).toFixed(digits).replace('.', ','));

export interface LigneCellule {
  label: string; pieces: number; echecs: number; champs: string; lignes: string; perdues: number; inventees: number; totalJuste: string; fauxVerts: number;
  troisiemes: number; coupees: number; troisiemeP50: number | null; troisiemeP90: number | null; parcoursP50: number | null; parcoursP90: number | null;
  coutParPieceMicro: number | null; coutTotalMicro: number; coutTroisiemeMicro: number | null; coutDecembreTotalMicro: number | null;
}

export function comparerCellule(label: string, records: DrawRecord[], cases: ReturnType<typeof loadCases>, docs?: string[]): LigneCellule {
  const kept = records.filter(record => !docs || docs.includes(record.doc));
  const { stats, draws } = judgeBench(kept, cases);
  const id = Object.keys(stats).find(key => key.endsWith('+N')) ?? Object.keys(stats)[0];
  const s = stats[id];
  const byId = new Map(cases.map(c => [c.id, c]));
  let perdues = 0, inventees = 0, totalJuste = 0, totalJuge = 0;
  for (const record of kept) {
    const run = record.variants[id], expected = byId.get(record.doc)?.expected;
    if (!run?.result || !expected) continue;
    const attendues = Array.isArray(expected.items) ? lignesSansPort(expected.items).filter((line: any) => line?.invisible !== true).length : 0;
    const lues = lignesSansPort(run.result.items).length, cachees = Number.isInteger(expected.lignesInvisibles) ? expected.lignesInvisibles : 0;
    perdues += Math.max(0, attendues - cachees - lues);
    inventees += Math.max(0, lues - attendues);
  }
  for (const draw of draws.filter(d => d.variant === id && d.verdict)) {
    totalJuge++;
    if (!draw.wrong.some(route => route === 'amountTTC')) totalJuste++;
  }
  const thirds = kept.flatMap(record => record.readings.filter(read => read.meta.lecture === 3));
  const all = kept.flatMap(record => record.readings);
  const costs = s.costMicro, totalMicro = costs.reduce((sum, value) => sum + value, 0);
  const decembre = all.some(read => read.inputTokens !== null && read.outputTokens !== null)
    ? thirds.reduce((sum, read) => sum + coutDecembre(read.meta.model, read.inputTokens ?? 0, read.outputTokens ?? 0), 0) + all.filter(read => read.meta.lecture !== 3).reduce((sum, read) => sum + (read.costMicroChf ?? 0), 0) : null;
  return {
    label, pieces: s.draws, echecs: s.failures, champs: `${s.right}/${s.judged}`, lignes: `${s.lineRight}/${s.lineJudged}`, perdues, inventees, totalJuste: `${totalJuste}/${totalJuge}`, fauxVerts: s.fauxVerts,
    troisiemes: thirds.length, coupees: thirds.filter(read => read.finishReason !== null && read.finishReason !== 'STOP').length,
    troisiemeP50: quantile(thirds.map(read => read.ms), 0.5), troisiemeP90: quantile(thirds.map(read => read.ms), 0.9),
    parcoursP50: quantile(s.ms, 0.5), parcoursP90: quantile(s.ms, 0.9),
    coutParPieceMicro: s.draws ? totalMicro / s.draws : null, coutTotalMicro: totalMicro,
    coutTroisiemeMicro: thirds.length ? thirds.reduce((sum, read) => sum + (read.costMicroChf ?? 0), 0) / thirds.length : null, coutDecembreTotalMicro: decembre
  };
}

export function renderCellules(lines: LigneCellule[]): string {
  const rows = [
    '| cellule | pièces (échecs) | champs justes | lignes justes | perdues | inventées | total TTC juste | faux verts | 3ᵉ lectures (coupées) | 3ᵉ p50 / p90 | parcours p50 / p90 | coût par pièce CHF | coût par 3ᵉ CHF | coût total CHF (au 1.12) |',
    `|${Array(14).fill('---').join('|')}|`,
    ...lines.map(l => `| ${l.label} | ${l.pieces} (${l.echecs}) | ${l.champs} | ${l.lignes} | ${l.perdues} | ${l.inventees} | ${l.totalJuste} | ${l.fauxVerts} | ${l.troisiemes} (${l.coupees}) | ${sec(l.troisiemeP50)} / ${sec(l.troisiemeP90)} | ${sec(l.parcoursP50)} / ${sec(l.parcoursP90)} | ${chf(l.coutParPieceMicro)} | ${chf(l.coutTroisiemeMicro)} | ${chf(l.coutTotalMicro, 3)} (${chf(l.coutDecembreTotalMicro, 3)}) |`)
  ];
  return rows.join('\n');
}

const args = process.argv.slice(2).filter(arg => arg !== '--');
// Tous les arguments sont de la forme `--nom=valeur` : le jugement du banc, importé plus haut, réagit à tout argument qui ne commence pas par `--`.
if (!process.env.VITEST && args.some(arg => arg.startsWith('--cellule='))) {
  const value = (flag: string) => args.find(arg => arg.startsWith(`${flag}=`))?.slice(flag.length + 1);
  const docs = value('--docs')?.split(',').map(item => item.trim()).filter(Boolean);
  const casFiles = (value('--cas') ?? 'cas.json,cas-2.json,cas-3.json,cas-4.json,cas-5.json,cas-6.json').split(',').map(casPath);
  const cases = loadCases(casFiles);
  const cells = args.filter(arg => arg.startsWith('--cellule=')).map(arg => { const spec = arg.slice('--cellule='.length), at = spec.indexOf('::'); return [spec.slice(0, at), spec.slice(at + 2)] as const; });
  const lines = cells.map(([label, dir]) => comparerCellule(label, (JSON.parse(readFileSync(path.join(dir, 'results.json'), 'utf8')) as { records: DrawRecord[] }).records, cases, docs));
  console.log(renderCellules(lines));
}
