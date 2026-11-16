// capturer.mjs <port> : Annuel (tête) et étape 4 au banc `reel`, 390 et 1280, clair et cave -> cap/, puis la planche côte à côte avec g6.
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { mkdirSync } from 'node:fs';
const PORT = process.argv[2] ?? '3000';
const DIR = new URL('./', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
const CAP = DIR + 'cap/'; mkdirSync(CAP, { recursive: true });
const clic = (page, t, sel = '[role=tab],button') => page.evaluate((t, sel) => { const e = [...document.querySelectorAll(sel)].filter(e => e.offsetParent && e.textContent.trim().replace(/\s+/g, ' ').startsWith(t)); if (!e.length) return false; e[0].click(); return true; }, t, sel);
const faits = [];
for (const [largeur, mobile, hauteur] of [[390, true, 900], [1280, false, 900]]) for (const theme of ['clair', 'cave']) {
  const { browser, page, journal } = await ouvrir({ largeur, hauteur, mobile, echelle: 1 });
  await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo=reel`); await calme(page, 1500);
  await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload(); await calme(page, 1500);
  await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find(e => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1200);
  await clic(page, 'Annuel'); await calme(page, 1000);
  await page.screenshot({ path: `${CAP}ann-${largeur}-${theme}.png` }); faits.push(`ann-${largeur}-${theme}`);
  await page.evaluate(() => [...document.querySelectorAll('.ann-scene .ann-pile button')].find(b => b.offsetParent)?.click()); await calme(page, 900);
  await page.screenshot({ path: `${CAP}etape4-${largeur}-${theme}.png` }); faits.push(`etape4-${largeur}-${theme}`);
  if (journal.erreurs.length) faits.push(`erreurs ${largeur} ${theme} : ${journal.erreurs.slice(0, 3).join(' | ')}`);
  await browser.close();
}
// Planche : g6 (maquette choisie) à gauche, l'app à droite, 390 clair puis cave et 1280.
const REF = DIR.replace('/voies/a1/', '/ref/g6/');
const { browser, page } = await ouvrir({ largeur: 1500, hauteur: 1000, mobile: false, echelle: 1 });
const f = (p) => 'file:///' + p.replace(/\\/g, '/');
const html = `<body style="margin:0;font:13px sans-serif;background:#ddd"><div style="display:flex;gap:12px;padding:12px;align-items:flex-start">
<div><b>g6 (choisi) : tête</b><br><img src="${f(REF + 'g6-haut.png')}" style="height:760px"></div>
<div><b>g6 : étape 4 matériel</b><br><img src="${f(REF + 'g6-4-materiel.png')}" style="height:760px"></div>
<div><b>app 390 clair</b><br><img src="${f(CAP + 'ann-390-clair.png')}" style="height:760px"></div>
<div><b>app 390 cave</b><br><img src="${f(CAP + 'ann-390-cave.png')}" style="height:760px"></div>
<div><b>app étape 4, 390 clair</b><br><img src="${f(CAP + 'etape4-390-clair.png')}" style="height:760px"></div></div></body>`;
const { writeFileSync } = await import('node:fs');
writeFileSync(DIR + 'planche.html', html);
await page.goto(f(DIR + 'planche.html')); await calme(page, 800);
await page.screenshot({ path: CAP + 'planche-390.png', fullPage: true }); faits.push('planche-390');
await browser.close();
console.log(faits.join('\n'));
