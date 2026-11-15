// node capturer.mjs <port> [explorer] : Modifier (m5mo-c) après une baisse sous le payé, sur le banc ?dev-local&finance-demo, 390 et 1280, clair et cave.
// -> cap/modifier-<largeur>-<thème>-baisse.png (feuille avec la baisse saisie, « Le paiement suit », aperçu avant / après)
//    cap/modifier-<largeur>-<thème>-apres.png (après « Enregistrer » : la liste Opérations, la rangée à son nouveau montant)
// Écrit seulement sur le jeu de démonstration local (?dev-local) ; aucune donnée réelle.
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const PORT = process.argv[2] ?? '3000';
const EXPLORER = process.argv.includes('explorer');
const OUT = fileURLToPath(new URL('./cap/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const clic = (page, t, racine = 'body') => page.evaluate(([t, racine]) => {
  const e = [...document.querySelectorAll(`${racine} [role=tab], ${racine} button`)].filter((e) => e.offsetParent && e.textContent.trim().startsWith(t));
  if (!e.length) return false; e.at(-1).click(); return true;
}, [t, racine]);

for (const [largeur, mobile, hauteur] of EXPLORER ? [[390, true, 1100]] : [[390, true, 1100], [1280, false, 900]]) for (const theme of EXPLORER ? ['clair'] : ['clair', 'cave']) {
  const { browser, page, journal } = await ouvrir({ largeur, hauteur, mobile, echelle: 1 });
  await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo`); await calme(page, 1500);
  await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload(); await calme(page, 1500);
  await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find((e) => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1200);
  await clic(page, 'Opérations'); await calme(page, 1200);
  if (EXPLORER) {
    console.log((await page.evaluate(() => [...document.querySelectorAll('button')].filter((e) => e.offsetParent && /payé/.test(e.textContent)).slice(0, 12).map((e) => e.textContent.replace(/\s+/g, ' ').slice(0, 110)))).join('\n'));
    await browser.close(); continue;
  }
  // La première pièce payée du jeu (« payé » sans « reste »), puis « Modifier » dans sa fiche.
  const nom = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((e) => e.offsetParent && /payé/.test(e.textContent) && !/reste|à payer|retard/.test(e.textContent) && e.textContent.trim().length < 140);
    if (!b) return null; const t = b.textContent.replace(/\s+/g, ' ').slice(0, 80); b.click(); return t;
  });
  await calme(page, 900);
  const modifier = await clic(page, 'Modifier', '[role=dialog]');
  await calme(page, 1000);
  console.log(largeur, theme, 'pièce', nom, 'modifier', modifier);
  // Baisse sous le payé : 1,00 CHF de moins que le montant lu dans le champ, « Le paiement suit » (défaut d'une baisse).
  const lu = await page.evaluate(() => document.querySelector('[aria-label="Montant (CHF)"]')?.value ?? null);
  const nouveau = lu ? String(Math.max(1, Math.round((parseFloat(lu.replace(/[^\d,.-]/g, '').replace(',', '.')) - 1) * 100) / 100)).replace('.', ',') : '1';
  await page.evaluate((v) => {
    const i = document.querySelector('[aria-label="Montant (CHF)"]'); if (!i) return;
    i.focus(); const set = Object.getOwnPropertyDescriptor(i.constructor.prototype, 'value').set; set.call(i, v); i.dispatchEvent(new Event('input', { bubbles: true })); i.blur();
  }, nouveau);
  await calme(page, 700);
  console.log(largeur, theme, 'montant lu', lu, '->', nouveau);
  await page.screenshot({ path: `${OUT}modifier-${largeur}-${theme}-baisse.png` });
  const ok = await clic(page, 'Enregistrer', '[role=dialog]'); await calme(page, 1500);
  await page.screenshot({ path: `${OUT}modifier-${largeur}-${theme}-apres.png` });
  console.log(largeur, theme, 'enregistré', ok, 'erreurs:', journal.erreurs.slice(0, 3).join(' | ') || 'aucune');
  await browser.close();
}
console.log('fin');
