// capturer.mjs <port> : captures r1 dans cap/ (390 tactile et 1280 ; clair et cave ; Synthèse nov., sept., Annuel, Mois par mois, TVA). Noms distincts (Windows ignore la casse).
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { mkdirSync } from 'node:fs';
const PORT = process.argv[2] ?? '3000', OUT = new URL('./cap/', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
mkdirSync(OUT, { recursive: true });
for (const [largeur, mobile, hauteur] of [[390, true, 900], [1280, false, 1000]]) for (const theme of ['clair', 'cave']) {
  const { browser, page } = await ouvrir({ largeur, hauteur, mobile, echelle: 1 });
  await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo=reel`); await calme(page, 1200);
  await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload(); await calme(page, 1500);
  await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find(e => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1000);
  const tab = async (nom) => { await page.evaluate((nom) => [...document.querySelectorAll('[role=tab],button')].find(e => e.offsetParent && e.textContent.trim().startsWith(nom))?.click(), nom); await calme(page, 900); };
  const shot = async (n) => { await calme(page, 600); await page.screenshot({ path: `${OUT}r1-${n}-${largeur}-${theme}.png` }); };
  await tab('Synthèse'); await shot('syn-nov');
  if (largeur === 390) {
    await page.evaluate(() => [...document.querySelectorAll('.syn-seg button')].find(b => /^sept/.test(b.textContent.trim()))?.click()); await shot('syn-sept');
    await page.evaluate(() => [...document.querySelectorAll('.syn-seg button')].find(b => /^nov/.test(b.textContent.trim()))?.click());
  }
  await tab('Annuel'); await shot('ann-tete');
  await page.evaluate(() => document.querySelector('.ann-tool')?.click()); await shot('ann-mois'); await page.keyboard.press('Escape'); await calme(page, 500);
  await page.evaluate(() => [...document.querySelectorAll('.ann-row')].find(b => /^TVA/.test(b.textContent.trim()))?.click()); await shot('ann-tva'); await page.keyboard.press('Escape'); await calme(page, 500);
  await page.evaluate(() => [...document.querySelectorAll('.ann-row')].find(b => /Impôts Fribourg/.test(b.textContent))?.click()); await shot('ann-etape8');
  await browser.close();
}
console.log('captures OK');
