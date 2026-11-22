// node mg/data.mjs : flux par semaine et par genre, rejoué depuis c85/sources2/proto.html (E, HYP, flux), vérifié contre en/q-data.json.
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(HERE, '..', 'c85', 'sources2', 'proto.html'), 'utf8').split('\n');
const code = src.slice(338, 367).join('\n');
const ctx = {}; vm.createContext(ctx); vm.runInContext(code + ';this.E=E;this.HYP=HYP;this.N=N;this.T0=T0;this.serie=serie;this.mDeb=moisDebut;', ctx);
const { E, HYP, N, T0 } = ctx;
// trois pièces de la base gi2/r2-c absentes de proto.html (bouteilles au comptoir S49, factures S50 et S52)
E.push({ id: 'x-bout', t: 'vente', n: 'Bouteilles au comptoir', a: 3, b: 3, m: 260, p: 'fin' }, { id: 'x-hs', t: 'charge', n: 'Facture Houblons Suisse', a: 4, b: 4, m: -312, p: 'fin' }, { id: 'x-bw', t: 'charge', n: 'Facture Brouwland', a: 6, b: 6, m: -94, p: 'fin' });
const S = ctx.serie();
const q = JSON.parse(fs.readFileSync(path.join(HERE, '..', 'en', 'q-data.json'), 'utf8'));
const G = { brassage: 'brassins', evenement: 'fetes', vente: 'ventes', achat: 'achats', renovation: 'travaux', activite: 'activites', charge: 'papiers', taxe: 'papiers', fut: 'activites' };
const sem = [];
for (let r = 0; r < N; r++) {
  if (r < T0) { sem.push(null); continue; }
  const o = { r, ventesCourantes: r > T0 ? HYP.ventes : 0, items: [] }; if (r > T0) o.items.push({ id: 'courantes', n: 'Ventes de la semaine', t: 'vente', g: 'ventes', m: HYP.ventes });
  E.forEach((e) => { if (e.m == null) return; let x = 0;
    if (e.p === 'mensuel') { if (e.a <= r && r <= e.b && ctx.mDeb(r) && r > T0) x = e.m / 12; }
    else if (e.p === 'debut') { if (r === e.a) x = e.m; } else if (r === e.b) x = e.m;
    if (x) o.items.push({ id: e.id, n: e.n, t: e.t, g: G[e.t] || e.t, m: Math.round(x * 100) / 100 }); });
  sem.push(o);
}
let ok = true; for (let r = T0; r < N; r++) { if (Math.abs(S.C[r] - q.C[r]) > 0.5 || Math.abs(S.L[r] - q.L[r]) > 0.5) { ok = false; console.log('ECART', r, S.C[r], q.C[r], S.L[r], q.L[r]); } }
// somme des flux = delta de caisse
for (let r = T0 + 1; r < N; r++) { const d = sem[r].items.reduce((a, i) => a + i.m, 0); if (Math.abs(d - (q.C[r] - q.C[r - 1])) > 0.5) { ok = false; console.log('DELTA', r, d, q.C[r] - q.C[r - 1]); } }
const types = [...new Set(E.map((e) => e.t))];
const act = []; for (let r = 0; r < N; r++) { const a = new Set(); E.forEach((e) => { if (e.p === 'mensuel') return; if (e.a <= r && r <= e.b) a.add(G[e.t]); }); act.push([...a]); }
const T2 = { evenement: 'fetes', vente: 'ventes', achat: 'achats', renovation: 'travaux', charge: 'papiers' };
q.MV.forEach((m) => { m.g = T2[m.t]; const hit = sem[m.r].items.find((i) => i.m === m.m); if (!hit) { ok = false; console.log('MV absent', m.n); } });
let pb = { r: T0, v: 1e12 }; for (let r = T0; r < N; r++) if (q.L[r] < pb.v) pb = { r, v: q.L[r] };
fs.writeFileSync(path.join(HERE, 'data.json'), JSON.stringify({ C: q.C, L: q.L, caisse0: HYP.caisse, ventesSem: HYP.ventes, sem: sem.map((o) => o && o.items.map(({ n, g, m }) => ({ n, g, m }))), act, mois: q.mois, MV: q.MV, pb }));
console.log(ok ? 'DONNEES OK' : 'DONNEES ECART', 'types', types.join(','), 'events', E.length);
console.log(E.map((e) => `${e.t}|${e.n}|${e.a}-${e.b}|${e.m}|${e.p}`).join('\n'));
