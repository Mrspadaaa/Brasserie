// node materiel.mjs <port> : Synthèse → lien « Matériel à part » → Opérations ; capture f2/cap/materiel-<largeur>-<thème>.png et dit si « Aucune opération » paraît.
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { mkdirSync } from 'node:fs';
const PORT = process.argv[2] ?? '3000';
const OUT = new URL('./cap/', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
mkdirSync(OUT, { recursive: true });
const r = [];
for (const [largeur, mobile, hauteur] of [[390, true, 1000], [1280, false, 1100]]) for (const theme of ['clair', 'cave']) {
  const { browser, page, journal } = await ouvrir({ largeur, hauteur, mobile, echelle: 2 });
  await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo=reel`); await calme(page, 1200);
  await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload(); await calme(page, 1500);
  await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find((e) => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1000);
  await page.evaluate(() => [...document.querySelectorAll('[role=tab],button')].find((e) => e.offsetParent && e.textContent.trim().startsWith('Synthèse'))?.click()); await calme(page, 900);
  const clique = await page.evaluate(() => { const e = [...document.querySelectorAll('.syn-pile-mat')].find((b) => b.offsetParent); e?.click(); return !!e; });
  await calme(page, 1300);
  const texte = await page.evaluate(() => document.body.innerText);
  const filtre = await page.evaluate(() => [...document.querySelectorAll('.ops-actif')].map((e) => e.textContent.trim()));
  await page.screenshot({ path: `${OUT}materiel-${largeur}-${theme}.png` });
  r.push(`${largeur} ${theme}: lien touché ${clique} ; « Aucune opération » ${/Aucune opération/.test(texte)} ; filtre actif ${JSON.stringify(filtre)} ; erreurs ${journal.erreurs.slice(0, 2).join(' | ') || 'aucune'}`);
  await browser.close();
}
console.log(r.join('\n'));
