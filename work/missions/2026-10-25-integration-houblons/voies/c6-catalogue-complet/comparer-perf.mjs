// Aligne les sorties de `npm run check:hop-perf` (avant, après, après bis) : médiane et 95e centile, au ms près. Usage : node comparer-perf.mjs avant.txt apres.txt apres2.txt
import { readFileSync } from 'node:fs';

const lire = (f) => {
  const m = new Map();
  for (const l of readFileSync(f, 'utf8').split('\n')) {
    const p = l.split(' | ');
    if (p.length < 5 || !/^(glisser|toucher|repos)/.test(p[0].trim())) continue;
    const mm = p[2].match(/méd ([\d,]+) ms/), pp = p[2].match(/p95 ([\d,]+) ms/);
    m.set(`${p[0].trim()} | ${p[1].trim()}`, { med: mm ? mm[1] : '-', p95: pp ? pp[1] : '-', verdict: p[p.length - 1].trim() });
  }
  return m;
};
const [a, ...autres] = process.argv.slice(2).map(lire);
console.log('| mesure | avant méd / p95 | après méd / p95 | après (2e passe) | verdict avant → après |');
console.log('|---|---|---|---|---|');
for (const [k, v] of a) {
  const cols = autres.map((o) => { const x = o.get(k); return x ? `${x.med} / ${x.p95}` : '-'; });
  const v2 = autres[0]?.get(k)?.verdict ?? '-';
  console.log(`| ${k.slice(0, 110)} | ${v.med} / ${v.p95} | ${cols.join(' | ')} | ${v.verdict} → ${v2} |`);
}
