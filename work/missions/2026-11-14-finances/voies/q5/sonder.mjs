// Sonde : couleur calculée du bouton Enregistrer et du bouton Photo de Modifier (banc local seulement).
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
const { browser, page } = await ouvrir({ largeur: 390, hauteur: 1100, mobile: true, echelle: 1 });
await page.goto('http://localhost:3000/?dev-local&finance-demo'); await calme(page, 1500);
await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find((e) => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1200);
await page.evaluate(() => [...document.querySelectorAll('[role=tab], button')].filter((e) => e.offsetParent && e.textContent.trim().startsWith('Opérations')).at(-1)?.click()); await calme(page, 1200);
await page.evaluate(() => { [...document.querySelectorAll('button')].find((e) => e.offsetParent && /payé/.test(e.textContent) && e.textContent.trim().length < 140)?.click(); }); await calme(page, 900);
await page.evaluate(() => [...document.querySelectorAll('[role=dialog] button')].filter((e) => e.offsetParent && e.textContent.trim().startsWith('Modifier')).at(-1)?.click()); await calme(page, 1000);
console.log(JSON.stringify(await page.evaluate(() => {
  const g = (e) => { if (!e) return null; const c = getComputedStyle(e); return { texte: e.textContent, color: c.color, bg: c.backgroundColor, opacity: c.opacity, visible: !!e.offsetParent }; };
  return { enregistrer: g(document.querySelector('.mod-pied .mod-b1')), photo: g(document.querySelector('.mod-drop .mod-b1')), vars: [getComputedStyle(document.querySelector('.mod')).getPropertyValue('--mod-t1'), getComputedStyle(document.documentElement).getPropertyValue('--cave-950')] };
})));
await browser.close();
