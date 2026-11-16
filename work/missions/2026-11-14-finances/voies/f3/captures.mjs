// node captures.mjs 3000 : les captures de f3 (points 1, 2, 3, 4, 8, 11, 14) dans f3/cap/, 390 tactile et 1280, clair et cave. Banc local seulement, aucune donnée réelle.
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = process.argv[2] ?? '3000';
const DOSSIER = path.join(path.dirname(fileURLToPath(import.meta.url)), 'cap');
fs.mkdirSync(DOSSIER, { recursive: true });
const sortie = [];
const clic = (page, re, tag = 'button,[role=tab],a') => page.evaluate((src) => { const r = new RegExp(src); const e = [...document.querySelectorAll('button,[role=tab],a')].filter((x) => x.offsetParent && r.test(x.textContent.trim().replace(/\s+/g, ' ')))[0]; e?.click(); return !!e; }, re.source);
const touches = async (page, sel, touche, n) => { await page.focus(sel); for (let i = 0; i < n; i++) await page.keyboard.press(touche); await calme(page, 400); };

async function sur(largeur, theme, jeu, fn) {
  const { browser, page } = await ouvrir({ largeur, hauteur: largeur === 390 ? 1500 : 1100, mobile: largeur === 390, echelle: 1 });
  try {
    await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo${jeu ? '=' + jeu : ''}`); await calme(page, 1500);
    await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme === 'cave' ? 'cave' : 'clair'); await page.reload(); await calme(page, 1500);
    await clic(page, /^Finances$/); await calme(page, 1200);
    await fn(page, async (nom) => { const f = path.join(DOSSIER, `${nom}-${largeur}-${theme}.png`); await page.screenshot({ path: f }); sortie.push(f); });
  } finally { await browser.close(); }
}
const ops = async (page) => { await clic(page, /^Opérations/); await calme(page, 1000); };

for (const largeur of [390, 1280]) for (const theme of ['clair', 'cave']) {
  // point 1 : Annuel, brasserie complète
  await sur(largeur, theme, '', async (page, cap) => { await clic(page, /^Annuel/); await calme(page, 1200); await cap('p1-annuel-complete');
    const tva = await clic(page, /^TVA/); await calme(page, 800); if (tva) { await cap('p8-tva-feuille'); const t = await page.evaluate(() => [document.querySelector('.finance-form strong')?.textContent ?? '']); sortie.push(`TVA feuille : ${t[0]}`); } });
  // points 2 et 4 : frise, plage 1er → 14 nov., puis 1er → 25 ; point 14 : Doublons désactivé
  await sur(largeur, theme, '', async (page, cap) => { await ops(page);
    await page.click('button[aria-label^="Déplier les jours"]'); await calme(page, 600); await cap('p2-frise-mois');
    await touches(page, '[role=slider][aria-label=Fin]', 'PageDown', 2); await touches(page, '[role=slider][aria-label=Fin]', 'ArrowLeft', 2); await cap('p2p4-plage-14');
    await touches(page, '[role=slider][aria-label=Fin]', 'PageUp', 1); await touches(page, '[role=slider][aria-label=Fin]', 'ArrowRight', 4); await cap('p2-plage-25');
    const c = await page.evaluate(() => { const b = [...document.querySelectorAll('.ops-pu')].find((x) => /^Doublons/.test(x.textContent.trim())); if (!b) return null; const s = getComputedStyle(b); return { off: b.disabled, color: s.color, bg: getComputedStyle(document.querySelector('.ops')).backgroundColor, op: s.opacity }; });
    sortie.push(`Doublons ${largeur} ${theme} : ${JSON.stringify(c)}`); await page.evaluate(() => [...document.querySelectorAll('.ops-pu')].find((x) => /^Doublons/.test(x.textContent.trim()))?.scrollIntoView({ block: 'center' })); await cap('p14-doublons'); });
  // points 3 et 11 : états de la vraie app
  await sur(largeur, theme, 'reel', async (page, cap) => { await ops(page);
    await clic(page, /^Mois précédent|^‹$/); await page.evaluate(() => document.querySelector('button[aria-label="Mois précédent"]')?.click()); await calme(page, 800); await cap('p11-mois-vide');
    await page.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Archives')?.click()); await calme(page, 800); await cap('p3-archives');
    sortie.push(`archives ${largeur} ${theme} : ${await page.evaluate(() => document.querySelector('.ops-bande')?.innerText.replace(/\s+/g, ' ') ?? '')}`); });
}
console.log(sortie.join('\n'));
