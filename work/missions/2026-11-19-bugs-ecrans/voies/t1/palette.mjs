// Banc t1 : ⌘K / loupe à 390 (tactile) et 1280, frappe réelle au clavier. Usage : node palette.mjs <largeur> <theme>
// App `?dev-local` (vide : aucune donnée réelle). Vérifie : le champ prend le focus, la frappe y entre, « Inclure les archives » existe.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const [largeur = '390', theme = 'clair'] = process.argv.slice(2);
const port = (process.env.WITH_SERVER_PORTS ?? '3111').split(',')[0];
const mobile = Number(largeur) < 700;
const { browser, page, journal } = await ouvrir({ largeur: Number(largeur), hauteur: mobile ? 844 : 800, mobile });
await page.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t); } catch { /* */ } }, theme);
await page.goto(`http://localhost:${port}/?dev-local`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('button[aria-label^="Rechercher"]', { timeout: 150000 }).catch(() => console.log('pas de loupe'));
await calme(page, 1500);
fs.mkdirSync(path.join(dir, 'captures'), { recursive: true });
const res = {};
// 1. par la loupe (geste tactile ou souris), puis frappe réelle
await (mobile ? page.tap('button[aria-label^="Rechercher"]') : page.click('button[aria-label^="Rechercher"]'));
await new Promise((r) => setTimeout(r, 600));
await page.keyboard.type('17,50 Cascade', { delay: 30 });
res.loupe = await page.evaluate(() => { const c = document.querySelector('[cmdk-input]'); return { present: !!c, valeur: c?.value ?? null, focus: document.activeElement === c }; });
await page.screenshot({ path: path.join(dir, 'captures', `palette-loupe-${largeur}-${theme}.png`) });
await page.keyboard.press('Escape');
await new Promise((r) => setTimeout(r, 400));
// 2. par Ctrl+K (⌘K), frappe réelle
await page.keyboard.down('Control'); await page.keyboard.press('KeyK'); await page.keyboard.up('Control');
await new Promise((r) => setTimeout(r, 600));
await page.keyboard.type('Versandkosten', { delay: 30 });
res.cmdk = await page.evaluate(() => { const c = document.querySelector('[cmdk-input]'); return { present: !!c, valeur: c?.value ?? null, focus: document.activeElement === c, archives: !!document.querySelector('[aria-label^="Inclure les archives"]') }; });
await page.screenshot({ path: path.join(dir, 'captures', `palette-cmdk-${largeur}-${theme}.png`) });
console.log(`palette ${largeur} ${theme}`, JSON.stringify(res), '| erreurs page', journal.erreurs.length);
await browser.close();
