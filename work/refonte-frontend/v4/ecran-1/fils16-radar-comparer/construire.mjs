// Lot 16 (D77, 19.10, soir) : le radar de Comparer, où « très compliqué à voir les différence avec les
// cileur sur le spider graph » ; « surtout genant là ». Les variantes partent de la page jouable de la
// base (consolide/comparer-radar.html, régénérée par base/generateur/build.mjs) : seul le rendu du
// radar change (window.RENDU_RADAR, lu par radar.js et comparer.js). Chaque variante à 3 houblons
// (Nugget, East Kent Goldings, Fuggle, comme la base) et à 4 (avec Motueka, quatrième couleur).
// Usage : node construire.mjs ; écrit rN/comparer-radar.html et rN/comparer-radar-4.html.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(ici, '../base/consolide/comparer-radar.html'), 'utf8');
const DEFAUT = '"comparerDefaut":["Nugget","East Kent Goldings","Fuggle"]';
if (!source.includes(DEFAUT)) throw new Error('comparerDefaut introuvable dans la base');
const VARIANTES = { r0: 'actuel', r1: 'r1', r2: 'r2', r3: 'r3', r4: 'r4' };
for (const [id, rendu] of Object.entries(VARIANTES)) {
  const d = path.join(ici, id);
  fs.mkdirSync(d, { recursive: true });
  const avec = (html) => html.replace(/<head>|<meta charset="utf-8">/i, (m) => m + '<script>window.RENDU_RADAR = ' + JSON.stringify(rendu) + ';</script>');
  const p3 = avec(source), p4 = avec(source).replace(DEFAUT, '"comparerDefaut":["Nugget","East Kent Goldings","Fuggle","Motueka"]');
  if (!p3.includes('RENDU_RADAR')) throw new Error(id + ' : script non injecté');
  fs.writeFileSync(path.join(d, 'comparer-radar.html'), p3);
  fs.writeFileSync(path.join(d, 'comparer-radar-4.html'), p4);
  console.log(id + ' (' + rendu + ') · comparer-radar.html, comparer-radar-4.html');
}
