// node cote-a-cote.mjs : cap/cote-a-cote-<largeur>-<thème>.png = la maquette m5fo-a (gauche) et l'app, état « paye » (droite).
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const ICI = new URL('./', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
const MAQ = `${ICI}../m5/m5fo-a/m5fo-a.png`;
const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`;
mkdirSync(`${ICI}cap`, { recursive: true });
for (const largeur of [390, 1280]) for (const theme of ['clair', 'cave']) {
  const { browser, page } = await ouvrir({ largeur: 1700, hauteur: 1300, mobile: false, echelle: 1, externe: 'laisser' });
  const html = `<body style="margin:0;background:#888;display:flex;gap:16px;align-items:flex-start;padding:12px;font:14px sans-serif;color:#fff">
    <figure style="margin:0"><figcaption>maquette m5fo-a</figcaption><img style="height:1250px" src="${b64(MAQ)}"></figure>
    <figure style="margin:0"><figcaption>app ${largeur} ${theme} (état payé)</figcaption><img style="height:1250px" src="${b64(`${ICI}cap/paye-${largeur}-${theme}.png`)}"></figure></body>`;
  await page.setContent(html); await calme(page, 300);
  await page.screenshot({ path: `${ICI}cap/cote-a-cote-${largeur}-${theme}.png` });
  await browser.close();
}
console.log('COTE OK');
