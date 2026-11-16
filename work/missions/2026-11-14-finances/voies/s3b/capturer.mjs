// node capturer.mjs <port> : s3b/cap/<état>-<largeur>-<thème>.png (choix, budget au repos, détail du litre c3a, après geste sur une rangée ; 390 tactile et 1280 ; clair et cave).
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { mkdirSync } from 'node:fs';
const PORT = process.argv[2] ?? '3000';
const OUT = new URL('./cap/', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
mkdirSync(OUT, { recursive: true });
const r = [];
for (const [largeur, mobile, hauteur] of [[390, true, 980], [1280, false, 1100]]) for (const theme of ['clair', 'cave']) {
  const { browser, page, journal } = await ouvrir({ largeur, hauteur, mobile, echelle: 2 });
  await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo`); await calme(page, 1500);
  await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload(); await calme(page, 1500);
  await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find((e) => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1200);
  const shot = async (n) => { await calme(page, 700); await page.screenshot({ path: `${OUT}${n}-${largeur}-${theme}.png` }); r.push(`${n}-${largeur}-${theme}`); };
  const clic = async (re) => page.evaluate((src) => { const re = new RegExp(src, 'i'); const b = [...document.querySelectorAll('button')].filter((e) => e.offsetParent && re.test((e.getAttribute('aria-label') || '') + ' ' + e.textContent))[0]; b?.click(); return Boolean(b); }, re);
  const ouvert = await page.evaluate(() => [...document.querySelectorAll('button')].find((e) => e.offsetParent && e.textContent.trim() === '+')?.click()).then(() => true);
  r.push(`ouverture ${largeur} ${theme}: ${ouvert}`);
  await calme(page, 1000);
  if (!(await page.$('.bbx-choix'))) { const bt = await page.evaluate(() => [...document.querySelectorAll('button')].filter((e) => e.offsetParent).map((e) => e.textContent.trim().slice(0, 40)).slice(0, 40).join(' | ')); r.push('boutons: ' + bt); }
  else {
    await shot('choix');
    await page.click('.bbx-row'); await calme(page, 1200);
    await shot('budget-repos');
    await page.screenshot({ path: `${OUT}budget-complet-${largeur}-${theme}.png`, fullPage: true });
    await page.click('.bbx-lit'); await shot('litre-c3a');
    await page.evaluate(() => [...document.querySelectorAll('button')].find((e) => /^Retour au budget/.test(e.textContent.trim()))?.click()); await calme(page, 700);
    await page.click('.bbx-op[data-noeud=emb], .bbx-op'); await shot('rangee-detail');
  }
  r.push(`erreurs ${largeur} ${theme}: ${journal.erreurs.slice(0, 3).join(' | ')}`);
  await browser.close();
}
console.log(r.join('\n'));
