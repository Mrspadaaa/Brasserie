// Captures f3 (non déployé, ?dev-local, données simulées, réseau externe coupé) : 390 tactile et 1280, clair et cave.
// BR-27 : wizard (banc etape=levure) › Récap. › « Estimer le budget de ce brassin » › Énergie « -1 » puis sortie du champ.
// TE-36 : banc carnets › À venir › fiche du projet (interrupteur) et « Modifier » (feuille du projet).
// node captures.mjs http://localhost:5183/ captures [combo...]   combo = 390-clair | 390-cave | 1280-clair | 1280-cave
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
const [BASE, DOSSIER, ...demandes] = process.argv.slice(2);
const combos = demandes.length ? demandes : ['1280-clair', '390-cave', '390-clair', '1280-cave'];
const attendre = ms => new Promise(r => setTimeout(r, ms));
const clic = (page, debut, sel = 'button, [role=button], [role=switch], summary') => page.evaluate((d, s) => {
  const e = [...document.querySelectorAll(s)].filter(x => x.offsetParent !== null).find(x => ((x.getAttribute('aria-label') || x.textContent || '').trim()).startsWith(d));
  if (e) { e.scrollIntoView({ block: 'center' }); e.click(); } return !!e;
}, debut, sel);
const theme = (page, t) => page.evaluate(t => { document.documentElement.setAttribute('data-theme', t); document.documentElement.classList.toggle('dark', t === 'cave'); }, t);

for (const combo of combos) {
  const [l, t] = combo.split('-'), w = Number(l), mobile = w === 390;
  const { browser, page, journal } = await ouvrir({ largeur: w, hauteur: mobile ? 844 : 800, mobile, echelle: 1 });
  try {
    // BR-27
    await page.goto(BASE + '?dev-local&etape=levure', { waitUntil: 'networkidle0' }); await calme(page, 1500); await theme(page, t);
    const etapes = [await clic(page, 'Récap'), (await calme(page, 900), await clic(page, 'Estimer le budget de ce brassin'))];
    await calme(page, 1200);
    if (!(await page.$('[aria-label="Énergie en CHF"]'))) { await clic(page, 'Frais'); await calme(page, 600); }
    if (!(await page.$('[aria-label="Énergie en CHF"]'))) { await clic(page, 'Détail du litre'); await calme(page, 600); await clic(page, 'Énergie :'); await calme(page, 600); }
    const champ = await page.$('[aria-label="Énergie en CHF"]');
    if (champ) {
      await champ.evaluate(e => e.scrollIntoView({ block: 'center' }));
      await champ.click({ clickCount: 3 }); await page.keyboard.type('-1'); await attendre(200);
      await page.keyboard.press('Tab'); await attendre(500);
      await champ.evaluate(e => e.scrollIntoView({ block: 'center' })); await attendre(300);
    }
    const etat = await page.evaluate(() => { const c = document.querySelector('[aria-label="Énergie en CHF"]'); const a = [...document.querySelectorAll('[role=alert]')].map(x => x.textContent); return { champ: c?.value ?? null, invalide: c?.getAttribute('aria-invalid'), alertes: a }; });
    await page.screenshot({ path: `${DOSSIER}/br27-${combo}.png` });
    console.log('BR-27', combo, JSON.stringify({ etapes, ...etat }));
    // TE-36
    await page.goto(BASE + '?dev-local&preview=carnets', { waitUntil: 'networkidle0' }); await calme(page, 1200); await theme(page, t);
    await clic(page, 'À venir'); await calme(page, 800);
    const fiche = await clic(page, 'ZZ TEST — Frigo de garde pour fûts'); await calme(page, 900);
    const sw = await page.evaluate(() => { const s = document.querySelector('[role=switch].kh-sw'); s?.scrollIntoView({ block: 'center' }); return s?.textContent ?? null; });
    await attendre(300); await page.screenshot({ path: `${DOSSIER}/te36-fiche-${combo}.png` });
    await page.keyboard.press('Escape'); await calme(page, 600);
    const modif = await clic(page, 'Modifier ZZ TEST'); await calme(page, 900);
    const incl = await page.evaluate(() => { const b = document.querySelector('.pjd-incl b'); b?.scrollIntoView({ block: 'center' }); return b?.textContent ?? null; });
    await attendre(300); await page.screenshot({ path: `${DOSSIER}/te36-feuille-${combo}.png` });
    console.log('TE-36', combo, JSON.stringify({ fiche, sw, modif, incl, erreurs: journal.erreurs.slice(0, 3) }));
  } finally { await browser.close(); }
}
