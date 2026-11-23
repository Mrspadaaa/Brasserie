// Voie f4-cout-et-usage : le tableau du coût, la médiane des passes de f4-banc.ts (`perf/banc-complet-N.json`, `perf/banc-rapide-N.json`), au ms près.
//   node scripts/eval-hop/f4-tableau.mjs <dossier perf>
import fs from 'node:fs';
import path from 'node:path';

const dossier = process.argv[2];
const lire = (variante) => fs.readdirSync(dossier).filter((f) => f.startsWith(`banc-${variante}-`) && f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(dossier, f), 'utf8').trim().split('\n').pop()));
const med = (xs) => { const s = [...xs].sort((a, b) => a - b); const k = Math.floor(s.length / 2); return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };
const f = (x) => (x == null ? '—' : (Math.round(x * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const C = lire('complet'), R = lire('rapide');
const ids = ['toucher:suggerer-sans-prechauffage', 'toucher:suggerer-prechauffe-cache', 'repos:tranche-voies-de-suggerer', 'repos:voies-proposer', 'repos:voies-leviers-levure', 'repos:remplacements-au-repos-apres-rapide', 'repos:total-premier-ecran-et-prechauffage', 'toucher:ma-biere-apres-un-outil', 'toucher:substituer-classement'];
console.log(`passes : complet ${C.length}, rapide ${R.length}`);
console.log('| mesure | complet : méd (p95) | rapide : méd (p95) | écart de la médiane |');
console.log('|---|---|---|---|');
for (const id of ids) {
  const v = (S, k) => { const xs = S.map((j) => j.mesures[id]?.[k]).filter((x) => x != null); return xs.length ? med(xs) : null; };
  const c = [v(C, 'med'), v(C, 'p95')], r = [v(R, 'med'), v(R, 'p95')];
  console.log(`| ${id} | ${f(c[0])} (${f(c[1])}) | ${f(r[0])} (${f(r[1])}) | ${c[0] != null && r[0] != null ? f(r[0] - c[0]) : '—'} |`);
}
