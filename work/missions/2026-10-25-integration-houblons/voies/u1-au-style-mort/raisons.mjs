// u1 : pourquoi les 12 barres sont hachurées sur une recette ordinaire ? Lit les raisons (title) des barres et des « arôme ? ».
// Usage : node raisons.mjs <port> <vide|reelle|maquette>
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const [port, mode = 'reelle'] = process.argv.slice(2);
const { browser, page } = await ouvrir({ largeur: 390, hauteur: 844 });
await page.goto(`http://localhost:${port}/?dev-local&etape=houblons${mode === 'maquette' ? '' : `&recette=${mode}`}`, { waitUntil: 'networkidle0' });
await page.waitForSelector('[data-ecran="ma-biere"]', { timeout: 120000 });
await new Promise((r) => setTimeout(r, 1500));
const r = await page.evaluate(() => ({
  barres: [...document.querySelectorAll('[data-barre]')].map((b) => `${b.getAttribute('data-barre')}: ${b.getAttribute('title')}`),
  titres: [...new Set([...document.querySelectorAll('[title]')].map((e) => e.getAttribute('title')).filter((t) => /simul|moteur|fiche|situ|inconnu/i.test(t)))],
}));
console.log(JSON.stringify(r, null, 1));
await browser.close();
