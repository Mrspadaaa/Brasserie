// Médiane et dispersion (min–max) par action et par build, à partir de out/ab-<build>-<i>/sortie.txt
import fs from 'node:fs';
import path from 'node:path';
const B = 'C:/Users/mrspa/AppData/Local/Temp/lenteurs-22-11-b/out';
const med = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); };
const RE = /^\s*(ok|KO)\s+(\S+)\s+INP\s+(\d+) ms.*?tâches longues (\d+) \(max (\d+) ms/;
const res = {};
for (const d of fs.readdirSync(B).filter((x) => x.startsWith('ab-'))) {
  const [, v] = d.split('-');
  const f = path.join(B, d, 'sortie.txt');
  if (!fs.existsSync(f)) continue;
  for (const l of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = RE.exec(l); if (!m) continue;
    const r = ((res[v] ??= {})[m[2]] ??= { inp: [], lt: [], ko: 0 });
    r.inp.push(+m[3]); r.lt.push(+m[5]); if (m[1] === 'KO') r.ko++;
  }
}
const actions = [...new Set(Object.values(res).flatMap((o) => Object.keys(o)))];
const fmt = (r) => r ? `${String(med(r.inp)).padStart(4)} (${Math.min(...r.inp)}–${Math.max(...r.inp)}) tâche ${String(med(r.lt)).padStart(4)} (${Math.min(...r.lt)}–${Math.max(...r.lt)}) n=${r.inp.length} KO ${r.ko}` : '-';
console.log('action'.padEnd(22), 'tour7 INP médiane (min–max)  tâche max médiane'.padEnd(66), 'tour9');
for (const a of actions) console.log(a.padEnd(22), fmt(res.tour7?.[a]).padEnd(66), fmt(res.tour9?.[a]));
