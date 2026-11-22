// Relève la caisse de l'année et ses mouvements dans le proto sources2 vivant (même source que g-d1) : en/p-serie.json
import path from 'node:path'; import fs from 'node:fs'; import os from 'node:os'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const HERE = path.dirname(fileURLToPath(import.meta.url));
let t = fs.readFileSync(path.join(HERE, '..', 'c85', 'sources2', 'proto.html'), 'utf8');
const k = 'function serie(hors){';
const i = t.indexOf(k); if (i < 0) throw new Error('serie absent');
t = t.slice(0, i) + 'window.__dbg=function(){return {E:E,serie:serie,flux:flux,lab:lab,dC:dC,jour:jour,moisDebut:moisDebut,N:N,T0:T0,SHORT:SHORT,HYP:HYP}};' + t.slice(i);
const tmp = path.join(os.tmpdir(), 'en-proto-dbg.html'); fs.writeFileSync(tmp, t);
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await p.goto('file:///' + tmp.split(path.sep).join('/')); await new Promise(r => setTimeout(r, 700));
const res = await p.evaluate(() => {
  const M = window.__dbg(), S = M.serie(), w = [];
  for (let r = M.T0; r < M.N; r++) { const ev = [];
    if (r > M.T0) ev.push({ n: 'ventes courantes', m: M.HYP.ventes, t: 'hyp' });
    for (const e of M.E) { if (e.m == null) continue; let x = 0;
      if (e.p === 'mensuel') { if (e.a <= r && r <= e.b && M.moisDebut(r) && r > M.T0) x = e.m / 12; }
      else if (e.p === 'debut') { if (r === e.a) x = e.m; } else if (r === e.b) x = e.m;
      if (x) ev.push({ id: e.id, n: e.n, c: M.SHORT[e.id] || e.n, m: Math.round(x), t: e.t, a: e.a, b: e.b, p: e.p }); }
    w.push({ r, s: M.lab(r), d: M.dC(M.jour(r, 0)), C: Math.round(S.C[r]), L: Math.round(S.L[r]), D: Math.round(S.D[r]), v: Math.round(M.flux(r).v), ev }); }
  return { pb: { r: S.pb.r, s: M.lab(S.pb.r), v: Math.round(S.pb.v) }, nE: M.E.length, w };
});
fs.writeFileSync(path.join(HERE, 'p-serie.json'), JSON.stringify(res, null, 1));
console.log('pb', JSON.stringify(res.pb), 'choses', res.nE);
for (const x of res.w) console.log(x.s.padEnd(4), x.d.padEnd(9), 'C', x.C, 'L', x.L, 'D', x.D, 'v', x.v, x.ev.filter(e => e.t !== 'hyp').map(e => e.c + ' ' + e.m).join(' | '));
await nav.close();
