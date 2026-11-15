// node capturer.mjs <port> : la feuille Payer (m5pa-d) sur le banc ?dev-local&finance-demo, 390 et 1280, clair et cave.
// -> cap/payer-<largeur>-<thème>-ouvert.png (feuille ouverte depuis la fiche du loyer), cap/payer-<largeur>-<thème>-apres.png (après « ✓ Payer »)
// + cap/planche-390-<thème>.png (l'app à gauche, la maquette m5pa-d à droite). Écrit seulement sur le jeu de démonstration local.
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';

const PORT = process.argv[2] ?? '3000';
const OUT = fileURLToPath(new URL('./cap/', import.meta.url));
const MAQ = fileURLToPath(new URL('../m5/m5pa-d/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const clic = (page, t, racine = 'body') => page.evaluate(([t, racine]) => {
  const e = [...document.querySelectorAll(`${racine} [role=tab], ${racine} button`)].filter((e) => e.offsetParent && e.textContent.trim().startsWith(t));
  if (!e.length) return false; e.at(-1).click(); return true;
}, [t, racine]);

for (const [largeur, mobile, hauteur] of [[390, true, 1100], [1280, false, 900]]) for (const theme of ['clair', 'cave']) {
  const { browser, page, journal } = await ouvrir({ largeur, hauteur, mobile, echelle: 1 });
  await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo`); await calme(page, 1500);
  await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload(); await calme(page, 1500);
  await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find((e) => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1200);
  await clic(page, 'Opérations'); await calme(page, 1200);
  // La fiche d'une pièce « à payer » du jeu (le loyer de l'atelier), puis son bouton Payer.
  const fiche = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((e) => e.offsetParent && /Loyer de l.atelier/.test(e.textContent)); if (!b) return false; b.click(); return true; });
  await calme(page, 900);
  const payer = await clic(page, 'Noter un paiement', '[role=dialog]') || await clic(page, 'Payer', '[role=dialog]') || await clic(page, 'Enregistrer un paiement', '[role=dialog]') || await clic(page, 'Régler', '[role=dialog]');
  await calme(page, 1200);
  const titre = await page.evaluate(() => [...document.querySelectorAll('[role=dialog]')].map((d) => d.getAttribute('aria-label') || d.textContent.slice(0, 40)).join(' | '));
  console.log(largeur, theme, 'fiche', fiche, 'payer', payer, 'dialogues:', titre);
  await page.screenshot({ path: `${OUT}payer-${largeur}-${theme}-ouvert.png` });
  // Le geste : 300 sur les pièces, ✓ Payer (écrit sur le jeu de démonstration local seulement).
  await page.evaluate(() => { const i = document.querySelector('[aria-label="Montant du virement (CHF)"]'); if (!i) return; const set = Object.getOwnPropertyDescriptor(i.constructor.prototype, 'value').set; set.call(i, '300'); i.dispatchEvent(new Event('input', { bubbles: true })); });
  await calme(page, 500);
  await page.screenshot({ path: `${OUT}payer-${largeur}-${theme}-300.png` });
  const ok = await clic(page, '✓ Payer', '[role=dialog]'); await calme(page, 1500);
  await page.screenshot({ path: `${OUT}payer-${largeur}-${theme}-apres.png` });
  console.log(largeur, theme, 'payé cliqué', ok, 'erreurs:', journal.erreurs.slice(0, 3).join(' | ') || 'aucune');
  await browser.close();
}

for (const theme of ['clair', 'cave']) {
  const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#888;display:flex;gap:12px;align-items:flex-start;font:14px sans-serif;color:#fff">
<figure style="margin:0"><figcaption>App (${theme}, 390, ouvert)</figcaption><img src="${pathToFileURL(OUT + `payer-390-${theme}-ouvert.png`).href}" width="390"></figure>
<figure style="margin:0"><figcaption>App (${theme}, 390, 300 saisi)</figcaption><img src="${pathToFileURL(OUT + `payer-390-${theme}-300.png`).href}" width="390"></figure>
<figure style="margin:0"><figcaption>Maquette m5pa-d</figcaption><img src="${pathToFileURL(MAQ + 'm5pa-d.png').href}" width="390"></figure></body>`;
  writeFileSync(OUT + `planche-390-${theme}.html`, html);
  const { browser, page } = await ouvrir({ largeur: 1230, hauteur: 1200, mobile: false, echelle: 1, externe: 'laisser' });
  await page.goto(pathToFileURL(OUT + `planche-390-${theme}.html`).href); await calme(page, 800);
  await page.screenshot({ path: `${OUT}planche-390-${theme}.png`, fullPage: true });
  await browser.close();
}
console.log('captures écrites');
