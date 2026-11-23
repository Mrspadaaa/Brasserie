// Temps propre par fonction (nom, fichier:ligne) d'un .cpuprofile, hors repos ; part du total actif. Usage : node top-profil.mjs <profil> [n=8]
import fs from 'node:fs';
const p = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const n = Number(process.argv[3] ?? 8);
const parNoeud = new Map();
p.samples.forEach((id, i) => parNoeud.set(id, (parNoeud.get(id) ?? 0) + (p.timeDeltas[i] ?? 0)));
const noeud = new Map(p.nodes.map((x) => [x.id, x]));
const parent = new Map(); for (const x of p.nodes) for (const c of x.children ?? []) parent.set(c, x.id);
const pas = new Map(); let actif = 0;
for (const x of p.nodes) {
  const us = parNoeud.get(x.id) ?? 0; if (!us) continue;
  const f = x.callFrame; if (/^\((idle|program|root)\)/.test(f.functionName)) continue;
  actif += us;
  let cle = `${f.functionName || '(anonyme)'} ${(f.url ?? '').split('/').pop()}:${f.lineNumber + 1}`;
  if (!f.url) { // natif : rattaché à l'appelant JS le plus proche
    let q = noeud.get(parent.get(x.id)); while (q && !q.callFrame.url) q = noeud.get(parent.get(q.id));
    cle = `${f.functionName} ← ${q ? `${q.callFrame.functionName || '(anonyme)'} ${q.callFrame.url.split('/').pop()}:${q.callFrame.lineNumber + 1}` : '?'}`;
  }
  pas.set(cle, (pas.get(cle) ?? 0) + us);
}
console.log(`actif ${Math.round(actif / 1000)} ms`);
for (const [k, us] of [...pas.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)) console.log(`${String(Math.round(us / 1000)).padStart(5)} ms ${String(Math.round((100 * us) / actif)).padStart(3)} %  ${k}`);
