// Reconnaissance a2 : NOLO (TE-14, TE-15). Active l'interrupteur NOLO dans Identité, capture, liste les textes.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const url = `http://localhost:${(process.env.WITH_SERVER_PORTS ?? '3104').split(',')[0]}`;
const SORTIE = path.join(import.meta.dirname, 'captures');
fs.mkdirSync(SORTIE, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const largeur = Number(process.argv[2] ?? 390);
const { browser, page, journal } = await ouvrir({ largeur, hauteur: 900, mobile: largeur < 600, echelle: 1 });
await page.goto(`${url}/?dev-local&etape=houblons&recette=identite`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(()=>document.body.innerText.includes('Abandonner'),{timeout:170000}).catch(() => console.log('pas de wizard'));
await dormir(2500);
const clic = async (texte) => { const h = await page.evaluateHandle((t) => [...document.querySelectorAll('button,[role=tab],a')].find((b) => b.textContent.trim().startsWith(t) && b.getClientRects().length), texte); if (h.asElement()) { await h.asElement().click(); await dormir(600); return true; } return false; };
await clic('Identité');
await page.click('[data-element="r4a-nolo"]'); await dormir(2500);
await clic('Adapter à mon matériel'); await dormir(2500);
await page.screenshot({ path: path.join(SORTIE, `rejeu2-${largeur}-nolo.png`), fullPage: true });
const info = await page.evaluate(() => {
  const w = document.querySelector('.recipe-wizard') ?? document.body;
  const champs = [...w.querySelectorAll('input,select,textarea')].filter((n) => n.getClientRects().length && n.type !== 'hidden');
  const deplis = [...w.querySelectorAll('details')].filter((n) => n.getClientRects().length);
  return { champs: champs.length, deplis: deplis.length, texte: w.innerText.replace(/\n+/g, ' ¶ ').slice(0, 4000) };
});
console.log(JSON.stringify(info, null, 1));
console.log('erreurs', JSON.stringify(journal.erreurs.slice(0, 3)));
await browser.close();
