// Ressemblance de chaque paire, d'après les mesures écrites par controle-panel.mjs --ecrire-mesures=<f.json>.
// Usage : node paires-sim.mjs <f.json>
import fs from 'node:fs';
const { mesures } = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const g = mesures.map((m) => ({ id: m.id, v: [...Buffer.from(m.gris, 'base64')] }));
const r = (a, b) => 1 - a.reduce((s, x, i) => s + Math.abs(x - b[i]), 0) / a.length / 255;
let t = 0, n = 0;
for (let i = 0; i < g.length; i++) for (let j = i + 1; j < g.length; j++) { const s = r(g[i].v, g[j].v); t += s; n++; console.log(`${g[i].id} ~ ${g[j].id} : ${s.toFixed(3)}`); }
console.log(`moyenne ${(t / n).toFixed(3)}`);
