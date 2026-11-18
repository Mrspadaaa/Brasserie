// Sonde : le choix d'une levure par le repli « Mon stock ou saisie libre » (YeastIngredientPicker -> choisirLevure du wizard) :
// la carte change, la dose se recalcule (#132), la barre « Annuler » apparaît, « Annuler » rétablit. Voir capturer.mjs pour le lancement.
import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const port = (process.env.WITH_SERVER_PORTS || '5656').split(',')[0];
const base = `http://127.0.0.1:${port}`;
const sortie = resolve(process.argv.find(a => a.startsWith('--sortie='))?.slice(9) ?? 'captures');
await mkdir(sortie, { recursive: true });
const attendre = ms => new Promise(fin => setTimeout(fin, ms));
const navigateur = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-first-run'] });
const page = await (await navigateur.createBrowserContext()).newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const erreurs = [];
page.on('pageerror', e => erreurs.push(e.message));
await page.setRequestInterception(true);
page.on('request', r => { const u = new URL(r.url()); return (u.origin === base || ['data:', 'blob:'].includes(u.protocol) || /fonts\.g/.test(u.hostname)) ? r.continue() : r.abort(); });
await page.goto(base + '/?dev-local&etape=levure', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('[data-lv="etape"]', { timeout: 90000 }); await attendre(1500);
const etat = () => page.evaluate(() => ({
  nom: document.querySelector('.lv-nom')?.textContent, dose: document.querySelector('[data-lv="dose"]')?.textContent,
  annule: document.querySelector('[data-lv="annuler"]')?.textContent, vue: document.querySelector('[data-lv="etape"]')?.getAttribute('data-vue'),
}));
console.log('AVANT', JSON.stringify(await etat()));
await page.evaluate(() => [...document.querySelectorAll('.lv-puce')].find(b => /Hors catalogue/.test(b.textContent))?.click());
await attendre(800);
console.log('REPLI', await page.evaluate(() => ({ ouvert: document.querySelector('[data-repli="stock"]')?.open, entrees: [...document.querySelectorAll('[data-repli="stock"] input, [data-repli="stock"] button')].map(e => e.tagName + ':' + (e.getAttribute('placeholder') || e.getAttribute('aria-label') || e.textContent).trim().slice(0, 50)) })));
await page.screenshot({ path: resolve(sortie, '6a-repli-stock-390.png') });
await page.evaluate(() => [...document.querySelectorAll('[data-repli="stock"] button')].find(b => /Ouvrir la liste/.test(b.textContent + b.getAttribute('aria-label')))?.click()); await attendre(800);
console.log('LISTE', await page.evaluate(() => [...document.querySelectorAll('[data-repli="stock"] input, [data-repli="stock"] [role="option"], [data-repli="stock"] [role="combobox"]')].map(e => e.tagName + '/' + e.getAttribute('role') + ':' + (e.getAttribute('placeholder') || e.textContent).trim().slice(0, 50)).slice(0, 8)));
const champ = await page.$('[data-repli="stock"] input');
if (champ) { await champ.type('Verdant', { delay: 40 }); await attendre(800); }
console.log('OPTIONS', await page.evaluate(() => [...document.querySelectorAll('[data-repli="stock"] [role="option"], [data-repli="stock"] li button')].map(e => e.textContent.trim().slice(0, 70)).slice(0, 6)));
await page.screenshot({ path: resolve(sortie, '6b-recherche-verdant-390.png') });
await page.evaluate(() => { const o = [...document.querySelectorAll('[data-repli="stock"] [role="option"], [data-repli="stock"] li button')].find(e => /Verdant/i.test(e.textContent)); o?.click(); });
await attendre(1500);
console.log('APRES CHOIX', JSON.stringify(await etat()));
await page.evaluate(() => document.querySelector('.lv-etape')?.scrollIntoView({ block: 'start' })); await attendre(300);
await page.screenshot({ path: resolve(sortie, '6c-apres-choix-verdant-390.png') });
await page.evaluate(() => [...document.querySelectorAll('[data-lv="annuler"] button')].find(b => /Annuler/.test(b.textContent))?.click());
await attendre(1200);
console.log('APRES ANNULER', JSON.stringify(await etat()));
await page.screenshot({ path: resolve(sortie, '6d-apres-annuler-390.png') });
console.log('ERREURS', erreurs.length, erreurs.slice(0, 3));
await navigateur.close();
