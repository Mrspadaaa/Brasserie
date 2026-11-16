// node capturer.mjs <port> : captures Synthèse 390 et 1280, clair et cave, dans cap/, puis la planche côte à côte avec g3a.
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
const PORT = process.argv[2] ?? '3000';
const dossier = (u) => new URL(u, import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
const OUT = dossier('./cap/'), REF = dossier('../../ref/g3a/');
mkdirSync(OUT, { recursive: true });
for (const [largeur, mobile, hauteur] of [[390, true, 760], [1280, false, 900]]) for (const theme of ['clair', 'cave']) {
  const { browser, page } = await ouvrir({ largeur, hauteur, mobile, echelle: 1 });
  await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo=reel`); await calme(page, 1500);
  await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload(); await calme(page, 1500);
  await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find(x => /^Finances$/.test(x.textContent.trim()))?.click()); await calme(page, 1200);
  await page.evaluate(() => [...document.querySelectorAll('[role=tab],button')].find(x => x.offsetParent && x.textContent.trim().startsWith('Synthèse'))?.click()); await calme(page, 1000);
  await page.screenshot({ path: `${OUT}syn-${largeur}-${theme}.png` });
  await browser.close();
}
const html = `<body style="margin:0;background:#888;display:flex;gap:12px;padding:12px;font:12px sans-serif;align-items:flex-start">
<div>maquette g3a<br><img src="file:///${REF}g3a-page.png" style="width:390px;height:760px;object-fit:cover;object-position:top"></div>
<div>app clair 390<br><img src="file:///${OUT}syn-390-clair.png" style="width:390px"></div>
<div>app cave 390<br><img src="file:///${OUT}syn-390-cave.png" style="width:390px"></div></body>`;
writeFileSync(`${OUT}planche.html`, html);
const { browser, page } = await ouvrir({ largeur: 1250, hauteur: 830, mobile: false, echelle: 1, externe: 'laisser' });
await page.goto(`file:///${OUT}planche.html`); await calme(page, 600);
await page.screenshot({ path: `${OUT}planche-g3a.png` });
await browser.close();
console.log('CAPTURES OK');
