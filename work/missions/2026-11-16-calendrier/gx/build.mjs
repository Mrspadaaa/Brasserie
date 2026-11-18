// node gx/build.mjs : écrit gx/<v>-<avant|apres>.html depuis paliers/g-d1.html (non modifié) + gx.css + gx.js
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const H = path.dirname(fileURLToPath(import.meta.url));
const base = fs.readFileSync(path.join(H, '..', 'paliers', 'g-d1.html'), 'utf8');
const css = fs.readFileSync(path.join(H, 'gx.css'), 'utf8'), js = fs.readFileSync(path.join(H, 'gx.js'), 'utf8'), S = fs.readFileSync(path.join(H, 'serie.json'), 'utf8');
const V = ['c1-a', 'c1-b', 'c2-b', 'c3-a', 'c3-b', 'c4-a', 'c5-a', 'c5-b']; // gardées le 16.11 soir (c2-a, c4-b écartées)
for (const v of V) for (const e of ['avant', 'apres']) {
  let h = base.split('</head>').join(`<style id="gx">${css}</style></head>`).replace(/<title>[^<]*<\/title>/, `<title>${v} ${e} · courbe sur g-d1</title>`);
  h = h.split('</body>').join(`<script>window.GXS=${S};window.GXE={v:'${v}',e:'${e}'}</script><script>${js}</script></body>`);
  fs.writeFileSync(path.join(H, `${v}-${e}.html`), h);
}
console.log('BUILD OK', V.length * 2, 'pages');
