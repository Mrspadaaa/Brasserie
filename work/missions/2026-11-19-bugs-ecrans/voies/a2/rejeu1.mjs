// Reconnaissance a2 : TL-30 (nom tronqué), TE-13 (OG retenue), TE-15 (NOLO). Fixture dev-local `recette=identite`.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const { ouvrir, calme } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const url = `http://localhost:${(process.env.WITH_SERVER_PORTS ?? '3104').split(',')[0]}`;
const SORTIE = path.join(import.meta.dirname, 'captures');
fs.mkdirSync(SORTIE, { recursive: true });
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const largeur = Number(process.argv[2] ?? 500);
const { browser, page, journal } = await ouvrir({ largeur, hauteur: 900, mobile: largeur < 600, echelle: 1 });
await page.goto(`${url}/?dev-local&etape=houblons&recette=identite`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(()=>document.body.innerText.includes('Abandonner'),{timeout:170000}).catch(()=>console.log('pas de wizard')); await dormir(2500);
// aller à Identité
const clic = async (texte) => { const h = await page.evaluateHandle((t) => [...document.querySelectorAll('button,[role=tab],a')].find((b) => b.textContent.trim().startsWith(t) && b.getClientRects().length), texte); if (h.asElement()) { await h.asElement().click(); await dormir(500); return true; } return false; };
console.log('clic Identité', await clic('Identité'), await clic('1. Identité'));
await dormir(800);
await page.screenshot({ path: path.join(SORTIE, `rejeu1-${largeur}-avant.png`) });
// nom long
await page.click('[data-element="r4a-nom"]', { clickCount: 3 });
await page.keyboard.type('Nuage Banane — Hefeweisse');
await dormir(300);
await page.screenshot({ path: path.join(SORTIE, 'rejeu1-apres-frappe.png') }); console.log('erreurs', JSON.stringify(journal.erreurs.slice(0,3)));
const m = await page.$eval('[data-element="r4a-nom"]', (n) => { const r = n.getBoundingClientRect(); return { w: Math.round(r.width), sw: n.scrollWidth, cw: n.clientWidth }; });
const pas = await page.$eval('.idn-pas', (n) => Math.round(n.getBoundingClientRect().width));
console.log('nom', JSON.stringify(m), 'pastille', pas);
await page.screenshot({ path: path.join(SORTIE, `rejeu1-${largeur}-nom.png`) });
// ligne OG
console.log('ecart-og', await page.$$eval('[data-role="ecart-og"]', (l) => l.map((n) => n.textContent)));
console.log('journal', JSON.stringify(journal.erreurs.slice(0, 3)), journal.bloquees.length);
await browser.close();
