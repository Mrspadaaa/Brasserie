// node planche.mjs : planches côte à côte (maquette choisie | app 390 clair | app 390 sombre | app 1280) pour juger d'un coup d'œil.
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { writeFileSync, existsSync } from 'node:fs';
const OUT = fileURLToPath(new URL('./', import.meta.url));
const V = fileURLToPath(new URL('../../../2026-11-14-finances/voies/', import.meta.url));
const P = [
  ['dbl', 'm1/m1do-a/m1do-a.png', ['dbl-repos-390-clair', 'dbl-annule-390-sombre', 'dbl-repos-1280-clair']],
  ['arc', 'm1/m1ar-c/m1ar-c.png', ['arc-repos-390-clair', 'arc-poignee-390-sombre', 'arc-consulte-1280-clair']],
  ['pr', 'm3/m3pr-c/m3pr-c.png', ['pr-rempli-390-clair', 'pr-rempli-390-sombre', 'pr-rempli-1280-sombre']],
  ['pm', 'm3/m3pm-d/m3pm-d.png', ['pm-ouvert-390-clair', 'pm-pret-390-sombre', 'pm-pret-1280-clair']],
  ['im', 'm3/m3im-c/m3im-c.png', ['im-ouvert-390-clair', 'im-10pc-390-sombre', 'im-ouvert-1280-sombre']],
  ['pf', 'm4/m4pf-c/m4pf-c.png', ['pfd-ouvert-390-clair', 'pf-ouvert-390-sombre', 'pfd-ouvert-1280-clair']],
  ['bb', 'm4/m4bb-a/m4bb-a.png', ['bb-complet-390-clair', 'bb-c3a-390-sombre', 'bb-repos-1280-sombre']],
  ['ia', 'm4/m4ia-c/m4ia-c.png', ['ia-feuille-390-clair', 'ia-coche-390-sombre', 'ia-chat-1280-clair']],
];
const { browser, page } = await ouvrir({ largeur: 1800, hauteur: 1000, mobile: false, echelle: 1, externe: 'laisser' });
for (const [nom, maq, caps] of P) {
  const img = (f, w) => existsSync(f) ? `<figure><figcaption>${f.split(/[\\/]/).pop()}</figcaption><img src="${pathToFileURL(f).href}" style="width:${w}px"></figure>` : `<figure>absent ${f.split(/[\\/]/).pop()}</figure>`;
  const html = `<body style="margin:0;display:flex;gap:10px;align-items:flex-start;font:12px sans-serif;background:#ddd">${img(V + maq, 390)}${caps.map((c) => img(OUT + c + '.png', c.includes('1280') ? 760 : 390)).join('')}</body>`;
  writeFileSync(OUT + `_p-${nom}.html`, html);
  await page.goto(pathToFileURL(OUT + `_p-${nom}.html`).href); await calme(page, 500);
  await page.screenshot({ path: OUT + `planche-${nom}.png`, fullPage: true });
}
await browser.close(); console.log('planches faites');
