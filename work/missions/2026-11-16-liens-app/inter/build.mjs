// Assemble les mini maquettes : node build.mjs (depuis n'importe où). Concaténation simple, aucun remplacement dans les bases.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const lire = f => fs.readFileSync(path.join(ICI, f), 'utf8');
const sprite = lire('sprite.svg.txt').replace('</svg>', `<symbol id="i-bout" viewBox="0 0 24 24"><path d="M10 2h4v4l2 3v12a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3z"/><path d="M8 13h8"/></symbol></svg>`);
const css = lire('src/commun.css'), commun = lire('src/commun.js');
const page = (titre, version, etats) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${titre} (exemple)</title><style>${css}</style></head><body>${sprite}<div id="app"></div>
<script>(()=>{window.VERSION=${JSON.stringify(version)};\n${commun}\n${etats}\nrendre(window.ETATS);})();</script></body></html>`;
for (const v of ['a', 'b', 'c']) {
  fs.mkdirSync(path.join(ICI, 'l9-' + v), { recursive: true });
  fs.writeFileSync(path.join(ICI, 'l9-' + v, 'index.html'), page('L9 ' + v + ' · chaque geste décompte ce qu’il use', v, lire('src/l9.js')));
}
fs.mkdirSync(path.join(ICI, 'l4-b'), { recursive: true });
fs.writeFileSync(path.join(ICI, 'l4-b', 'index.html'), page('L4 b · le jalon dans la fiche', 'b', lire('src/l4b.js')));
// l4-a : g-d1 tel quel, plus un bloc ajouté avant </body> (split/join sur la dernière balise)
const base = fs.readFileSync(path.join(ICI, '../../2026-11-16-calendrier/paliers/g-d1.html'), 'utf8');
const k = base.lastIndexOf('</body>');
const ajout = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="ix-d" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></symbol></svg>
<style>
.ix-doigt{position:absolute;width:50px;height:50px;margin:-25px 0 0 -25px;border-radius:50%;background:rgba(17,17,17,.2);border:2.5px solid rgba(17,17,17,.55);z-index:200;pointer-events:none}
html[data-theme=cave] .ix-doigt{background:rgba(245,240,234,.26);border-color:rgba(245,240,234,.7)}
.ix-doigt.long::after{content:'';position:absolute;inset:-14px;border-radius:50%;border:2.5px dashed rgba(17,17,17,.55)}
html[data-theme=cave] .ix-doigt.long::after{border-color:rgba(245,240,234,.7)}
.ix-neuf{outline:3px solid var(--ok,#2f7d6b);outline-offset:3px;border-radius:10px}
#toast{bottom:62px;right:98px;height:auto;min-height:48px;border-radius:16px;padding:4px 4px 4px 14px}
#toast button{min-height:40px;padding:0 10px;font-weight:700;text-decoration:underline;text-underline-offset:3px;background:none;color:inherit;border:0;font-size:15px}
.ix-bulle{position:absolute;z-index:80;background:var(--bg);border:1.5px solid var(--line2);border-radius:16px;box-shadow:0 14px 30px rgba(0,0,0,.22);padding:10px 12px;font-size:16px;color:var(--ink)}
.ix-bulle::before{content:'';position:absolute;top:-8px;left:var(--ax,40px);width:14px;height:14px;background:var(--bg);border-left:1.5px solid var(--line2);border-top:1.5px solid var(--line2);transform:rotate(45deg)}
.ix-bulle p{margin:0}.ix-bulle .t{font-size:17px;font-weight:700;display:flex;align-items:center;gap:8px;color:var(--e-brassage,var(--prod))}.ix-bulle .t .ico{width:20px;height:20px}
.ix-bulle .s{font-size:14px;color:var(--mut);margin:2px 0 4px}
.ix-bulle .l{display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid var(--line)}.ix-bulle .l b{font-family:"IBM Plex Mono",Consolas,monospace}
.ix-bulle .f{display:flex;justify-content:flex-end;margin-top:6px}.ix-bulle .c{height:44px;padding:0 10px 0 14px;border-radius:12px;background:var(--act);color:var(--onact);font-weight:700;font-size:16px;display:inline-flex;align-items:center;gap:2px;border:0}
.ix-bulle .ico{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
</style>
<script>${lire('src/l4a.js')}</script>
`;
fs.mkdirSync(path.join(ICI, 'l4-a'), { recursive: true });
fs.writeFileSync(path.join(ICI, 'l4-a', 'index.html'), base.slice(0, k) + ajout + base.slice(k));
console.log('BUILD OK');
