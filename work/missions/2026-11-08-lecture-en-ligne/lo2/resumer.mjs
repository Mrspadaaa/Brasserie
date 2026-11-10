// LO-2 : résume les sorties de mesurer.mjs. Usage : node resumer.mjs <fichier.json> [<autre.json>]
//  - un fichier : par phase (decoupe, qr, lesDeux), la tâche longue la plus longue, le total le plus grand, le nombre de pièces avec une tâche > 50 ms ;
//  - deux fichiers (avant, après) : compare aussi les empreintes de plan (plan, pm, pm0) et les JPEG des morceaux ; et dans le second, pm contre pw.
import fs from 'node:fs';

const [a, b] = process.argv.slice(2);
const lire = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const resume = (nom, rs) => {
  for (const phase of ['decoupe', 'qr', 'lesDeux']) {
    const lignes = rs.filter(r => r[phase]);
    if (!lignes.length) continue;
    const max = lignes.reduce((m, r) => (r[phase].max > m.v ? { v: r[phase].max, p: r.nom } : m), { v: 0, p: '-' });
    const total = lignes.reduce((m, r) => (r[phase].total > m.v ? { v: r[phase].total, p: r.nom } : m), { v: 0, p: '-' });
    const bat = lignes.reduce((m, r) => (r[phase].battementMax > m.v ? { v: r[phase].battementMax, p: r.nom } : m), { v: 0, p: '-' });
    const longues = lignes.filter(r => r[phase].max > 0).length;
    console.log(`${nom} ${phase} : ${lignes.length} pièces ; plus longue tâche ${max.v} ms (${max.p}) ; plus grand total ${total.v} ms (${total.p}) ; battement max ${bat.v} ms (${bat.p}) ; pièces avec une tâche > 50 ms : ${longues}`);
  }
};
const x = lire(a);
resume(a.split(/[\\/]/).pop(), x);
const y = b ? lire(b) : null;
if (y) {
  resume(b.split(/[\\/]/).pop(), y);
  let pareil = 0, autre = 0;
  for (const p of x) {
    const q = y.find(z => z.nom === p.nom); if (!q) continue;
    for (const k of ['plan', 'pm', 'pm0']) if (k in p && k in q) { if (JSON.stringify(p[k]) === JSON.stringify(q[k])) pareil++; else { autre++; console.log('AVANT ≠ APRÈS', p.nom, k); } }
    if (p.decoupe?.jpeg && q.decoupe?.jpeg) { if (JSON.stringify(p.decoupe.jpeg) === JSON.stringify(q.decoupe.jpeg)) pareil++; else { autre++; console.log('JPEG ≠', p.nom); } }
    if (p.decoupe && q.decoupe) { if (p.decoupe.morceaux === q.decoupe.morceaux) pareil++; else { autre++; console.log('MORCEAUX ≠', p.nom, p.decoupe.morceaux, q.decoupe.morceaux); } }
    if (p.qr && q.qr) { const sp = `${p.qr.statut}/${p.qr.bulletins}/${p.qr.montant}`, sq = `${q.qr.statut}/${q.qr.bulletins}/${q.qr.montant}`; if (sp === sq) pareil++; else { autre++; console.log('QR ≠', p.nom, sp, sq); } }
  }
  console.log(`avant = après : ${pareil} comparaisons identiques, ${autre} différentes`);
}
const cible = y ?? x;
let ok = 0, ko = 0;
for (const p of cible) for (const [m, w] of [['pm', 'pw'], ['pm0', 'pw0']]) {
  if (!(m in p) || !(w in p)) continue;
  if (JSON.stringify(p[m]) === JSON.stringify(p[w])) ok++; else { ko++; console.log('PAGE ≠ WORKER', p.nom, m, w, JSON.stringify(p[w]) === '"SANS-WORKER"' ? '(sans worker)' : ''); }
}
if (ok + ko) console.log(`plan sur la page = plan dans le Worker : ${ok} identiques, ${ko} différents`);
