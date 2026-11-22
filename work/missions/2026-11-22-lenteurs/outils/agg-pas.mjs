// Médiane (min–max) de l'INP par pas et par build, à partir de out/pas/<build>-<i>-<fichier>.log
import fs from 'node:fs';
import path from 'node:path';
const D = 'C:/Users/mrspa/AppData/Local/Temp/lenteurs-22-11-b/out/pas';
const med = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); };
const RE_OK = /^\s+ok (.+?) \| (\d+) ms(?: calme \d+ cible \S+)?(?: INP (\d+))?/;
const RE_KO = /^\s+ECHEC (.+?) :/;
const res = new Map(); const ordre = [];
for (const f of fs.readdirSync(D).filter((x) => /^tour[79]-\d-.+\.log$/.test(x))) {
  const [v, , ...r] = f.replace(/\.log$/, '').split('-'); const fich = r.join('-');
  for (const l of fs.readFileSync(path.join(D, f), 'utf8').split('\n')) {
    let m = RE_OK.exec(l); let ok = true; if (!m) { m = RE_KO.exec(l); ok = false; if (!m) continue; }
    const cle = `${fich} › ${m[1]}`; if (!res.has(cle)) { res.set(cle, { tour7: { inp: [], ko: 0 }, tour9: { inp: [], ko: 0 } }); ordre.push(cle); }
    const e = res.get(cle)[v]; if (!ok) e.ko++; else if (m[3] !== undefined) e.inp.push(+m[3]);
  }
}
const fmt = (e) => e.inp.length ? `${String(med(e.inp)).padStart(5)} (${Math.min(...e.inp)}–${Math.max(...e.inp)}) n=${e.inp.length}${e.ko ? ` échec ${e.ko}` : ''}` : `    - ${e.ko ? `échec ${e.ko}` : ''}`;
console.log('pas'.padEnd(52), 'tour7 INP ms'.padEnd(34), 'tour9 INP ms');
for (const k of ordre) console.log(k.slice(0, 50).padEnd(52), fmt(res.get(k).tour7).padEnd(34), fmt(res.get(k).tour9));
