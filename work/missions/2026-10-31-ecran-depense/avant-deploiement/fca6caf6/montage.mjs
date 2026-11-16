// node montage.mjs : planches M-*.png (captures 390 côte à côte, nom au-dessus) pour la lecture du critique.
import { ouvrir } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { writeFileSync, existsSync } from 'node:fs';
const OUT = fileURLToPath(new URL('./', import.meta.url));
const P = {
  a: ['ret-liste-390-clair', 'ret-confirm-390-sombre', 'ret-fiche-390-clair', 'ret-apres-390-sombre'],
  b: ['ap-fiche-390-sombre', 'ap-corriger-390-clair', 'ap-annule-390-sombre', 'dep-feuille-390-clair'],
  c: ['pv-onglet-390-clair', 'pv-modifier-390-sombre', 'pv-confirm-390-clair', 'pv-supprime-390-sombre'],
  d: ['pj-liste-390-sombre', 'pj-pied-390-clair', 'pj-archiver-390-sombre', 'pj-supprimer-390-clair'],
  e: ['pj-apres-390-sombre', 'pf-frise-390-clair', 'bbr-prix-390-sombre', 'pvr-apres-390-clair'],
};
const { browser, page } = await ouvrir({ largeur: 1600, hauteur: 900, mobile: false, echelle: 1, externe: 'laisser' });
for (const [k, l] of Object.entries(P)) {
  const imgs = l.filter((n) => existsSync(OUT + n + '.png')).map((n) => `<figure><figcaption>${n}</figcaption><img src="${pathToFileURL(OUT + n + '.png')}"></figure>`).join('');
  writeFileSync(OUT + `_m-${k}.html`, `<body style="margin:0;display:flex;gap:8px;background:#888;font:14px sans-serif">${imgs}<style>figure{margin:0}img{width:390px;display:block}</style></body>`);
  await page.goto(pathToFileURL(OUT + `_m-${k}.html`).href); await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: OUT + `M-${k}.png`, fullPage: true });
}
await browser.close(); console.log('montage fait');
