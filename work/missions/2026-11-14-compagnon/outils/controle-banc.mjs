// Contrôle du banc du compagnon (mission 2026-11-14-compagnon).
// Usage : node work/missions/2026-11-14-compagnon/outils/controle-banc.mjs
// Exige : analyse/cap/etats.json (liste des états), pour chaque état 4 captures <id>-<390|1280>-<clair|cave>.png (> 15 ko),
// 4 planches planche-<format>.png, et analyse/cap/reseau.json avec "nonIntercepte": 0 (aucun appel réel aux fonctions).
import { existsSync, readFileSync, statSync } from 'node:fs';
const d = 'work/missions/2026-11-14-compagnon/analyse/cap/';
const ech = [];
const etats = existsSync(d + 'etats.json') ? JSON.parse(readFileSync(d + 'etats.json', 'utf8')) : [];
if (etats.length < 16) ech.push(`etats.json : ${etats.length} états (16 au moins)`);
const formats = ['390-clair', '390-cave', '1280-clair', '1280-cave'];
for (const e of etats) for (const f of formats) {
  const p = `${d}${e.id}-${f}.png`;
  if (!existsSync(p)) ech.push(`${p} absente`); else if (statSync(p).size < 15000) ech.push(`${p} trop petite`);
}
for (const f of formats) if (!existsSync(`${d}planche-${f}.png`)) ech.push(`planche-${f}.png absente`);
const r = existsSync(d + 'reseau.json') ? JSON.parse(readFileSync(d + 'reseau.json', 'utf8')) : null;
if (!r) ech.push('reseau.json absent'); else if (r.nonIntercepte !== 0) ech.push(`appels non interceptés : ${r.nonIntercepte}`);
console.log(ech.length ? 'BANC ECHEC\n' + ech.join('\n') : 'BANC OK');
process.exit(ech.length ? 1 : 0);
