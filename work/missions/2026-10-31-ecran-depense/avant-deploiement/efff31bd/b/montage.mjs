// node montage.mjs <sortie> <largeurImg> <img1> <img2> ... : assemble des captures côte à côte (fichiers du dossier, ou chemins depuis voies/).
import { ouvrir } from '../../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { existsSync, writeFileSync } from 'node:fs';
const OUT = fileURLToPath(new URL('./', import.meta.url));
const V = fileURLToPath(new URL('../../../../2026-11-14-finances/voies/', import.meta.url));
const [nom, w, ...imgs] = process.argv.slice(2);
const f = (x) => existsSync(OUT + x) ? OUT + x : V + x;
const rangs = imgs.join(' ').split(' | ').map((r) => r.split(' ').filter(Boolean));
const fig = (x) => `<figure style="margin:0"><figcaption>${x.split('/').pop()}</figcaption><img src="${pathToFileURL(f(x)).href}" style="width:${x.includes('1280') ? w * 2 : w}px"></figure>`;
const html = `<body style="margin:0;font:13px sans-serif;background:#bbb">${rangs.map((r) => `<div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:10px">${r.map(fig).join('')}</div>`).join('')}</body>`;
const { browser, page } = await ouvrir({ largeur: 1900, hauteur: 1000, mobile: false, echelle: 1, externe: 'laisser' });
writeFileSync(OUT + `_m-${nom}.html`, html); await page.goto(pathToFileURL(OUT + `_m-${nom}.html`).href); await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: OUT + 'M-' + nom + '.png', fullPage: true }); await browser.close(); console.log('M-' + nom);
