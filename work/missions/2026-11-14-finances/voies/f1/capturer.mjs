// node capturer.mjs <port> : f1/cap/<état>-<largeur>-<thème>.png (repos, frise dépliée, après la plage, à cheval ; 390 tactile et 1280 ; clair et cave).
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { mkdirSync } from 'node:fs';
const PORT = process.argv[2] ?? '3000';
const OUT = new URL('./cap/', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
mkdirSync(OUT, { recursive: true });
const touches = async (page, sel, touche, n) => { await page.focus(sel); for (let i = 0; i < n; i++) await page.keyboard.press(touche); await calme(page, 500); };
const r = [];
for (const [largeur, mobile, hauteur] of [[390, true, 980], [1280, false, 1100]]) for (const theme of ['clair', 'cave']) {
  const { browser, page, journal } = await ouvrir({ largeur, hauteur, mobile, echelle: 2 });
  await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo`); await calme(page, 1500);
  await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload(); await calme(page, 1500);
  await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find((e) => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1200);
  await page.evaluate(() => [...document.querySelectorAll('[role=tab],button')].filter((e) => e.offsetParent && e.textContent.trim().startsWith('Opérations'))[0]?.click()); await calme(page, 1200);
  const shot = async (n) => { await calme(page, 700); await page.screenshot({ path: `${OUT}${n}-${largeur}-${theme}.png` }); r.push(`${n}-${largeur}-${theme}`); };
  await shot('repos');
  await page.click('button[aria-label^="Déplier les jours"]'); await shot('frise');
  await touches(page, '[role=slider][aria-label=Fin]', 'PageDown', 2); await touches(page, '[role=slider][aria-label=Fin]', 'ArrowLeft', 2);
  await shot('apres');
  await touches(page, '[role=slider][aria-label=Début]', 'ArrowLeft', 3); await shot('acheval');
  await touches(page, '[role=slider][aria-label=Début]', 'ArrowRight', 3); await touches(page, '[role=slider][aria-label=Fin]', 'ArrowLeft', 1); await shot('hors');
  r.push(`erreurs ${largeur} ${theme}: ${journal.erreurs.slice(0, 3).join(' | ')}`);
  await browser.close();
}
console.log(r.join('\n'));
