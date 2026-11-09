// Voie t1, 3e passe, complément b-divers à 390 : « + » flottant › Nouveau tarif (Marge brute), Réglages › Brasserie › capacité 5000 (AM-49), Atelier R&D.
import puppeteer from 'puppeteer-core';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const arg = (nom, defaut) => process.argv.find((a) => a.startsWith(`--${nom}=`))?.slice(nom.length + 3) ?? defaut;
const base = `http://127.0.0.1:${arg('port', '5660')}`;
const sortie = resolve('work/missions/2026-11-09-levure-port/critique/captures-3/divers');
const attendre = (ms) => new Promise((fin) => setTimeout(fin, ms));
const navigateur = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const journal = { erreurs: [], notes: {} };
const page = await (await navigateur.createBrowserContext()).newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
page.on('pageerror', (e) => journal.erreurs.push(e.message));
await page.setRequestInterception(true);
page.on('request', (r) => { const u = new URL(r.url()); if (u.origin === base || ['data:', 'blob:'].includes(u.protocol) || /fonts\.g/.test(u.hostname)) return r.continue(); return r.abort(); });
await page.evaluateOnNewDocument(() => { try { localStorage.setItem('laffinee.theme', 'clair'); } catch { /* */ } });
await page.goto(`${base}/?dev-local`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.querySelector('nav[aria-label="Navigation principale"]'), { timeout: 90000 });
await attendre(1500);
const cliquer = async (re, sel = 'button,a,[role=tab],[role=menuitem],summary') => {
  const ok = await page.evaluate((src, s) => { const el = [...document.querySelectorAll(s)].find((b) => b.offsetParent !== null && new RegExp(src, 'i').test((b.getAttribute('aria-label') || b.innerText || '').trim())); if (!el) return false; el.click(); return true; }, re.source, sel);
  if (!ok) journal.notes['introuvable:' + re.source] = true; await attendre(700); return ok;
};
const capturer = async (nom) => { await page.screenshot({ path: resolve(sortie, `${nom}-390-clair.png`) }); console.log('CAPTURE', nom); };
// 1. Clients › Prix et marges › + flottant › Nouveau tarif
await cliquer(/^Clients/); await cliquer(/Prix et marges/); await attendre(500);
journal.notes.fab = await page.evaluate(() => [...document.querySelectorAll('.floating-actions button, [class*="floating"] button, button[aria-label*="rapide"], button[aria-label*="Ajouter"]')].filter((b) => b.offsetParent !== null).map((b) => b.getAttribute('aria-label') || b.innerText));
await page.evaluate(() => { const b = [...document.querySelectorAll('.floating-actions button, [class*="floating"] button')].find((x) => x.offsetParent !== null); b?.click(); }); await attendre(700);
await capturer('clients-plus-2');
journal.notes.menuPlus = await page.evaluate(() => [...document.querySelectorAll('[role=menuitem],[role=dialog] button, button')].filter((b) => b.offsetParent !== null).map((b) => b.innerText.trim()).filter((t) => t && t.length < 40).slice(0, 30));
await cliquer(/Nouveau tarif|tarif/i); await attendre(900); await capturer('clients-nouveau-tarif-2');
journal.notes.tarif = await page.evaluate(() => [...document.querySelectorAll('[role=dialog] *')].filter((e) => e.children.length === 0 && /Marge brute|Coût de revient|Prix TTC|À renseigner/.test(e.textContent ?? '')).map((e) => ({ t: e.textContent.trim().slice(0, 30), fs: getComputedStyle(e).fontSize })).slice(0, 12));
await page.keyboard.press('Escape'); await attendre(500);
// 2. Menu › Réglages › Brasserie › Cuve · capacité totale = 5000
await cliquer(/^Menu|Ouvrir le menu|Compte|Plus d.options/i, 'button'); await attendre(400);
if (!(await cliquer(/^Réglages$/))) { await page.evaluate(() => { const b = [...document.querySelectorAll('header button')].pop(); b?.click(); }); await attendre(400); await cliquer(/^Réglages$/); }
await attendre(800); await cliquer(/^Brasserie$/); await attendre(600);
const ok = await page.evaluate(() => { const lab = [...document.querySelectorAll('label')].find((l) => /Cuve · capacité totale/.test(l.innerText)); const inp = lab ? (lab.querySelector('input') || document.getElementById(lab.getAttribute('for') || '') || lab.parentElement?.querySelector('input')) : null; if (!inp) return false; inp.scrollIntoView({ block: 'center' }); inp.focus(); return true; });
journal.notes.champCuve = ok;
if (ok) { await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control'); await page.keyboard.type('5000'); await page.keyboard.press('Tab'); await attendre(700); journal.notes.am49 = await page.evaluate(() => document.body.innerText.match(/Saisis[^\n]{0,30}/)?.[0] ?? null); }
await capturer('reglages-cuve-5000');
await page.keyboard.press('Escape'); await attendre(500);
// 3. Menu › Atelier R&D
await cliquer(/^Menu|Ouvrir le menu|Compte|Plus d.options/i, 'button'); await attendre(400);
if (!(await cliquer(/Atelier R&D/))) { await page.evaluate(() => { const b = [...document.querySelectorAll('header button')].pop(); b?.click(); }); await attendre(400); await cliquer(/Atelier R&D/); }
await attendre(900); journal.notes.atelier = await page.evaluate(() => [...document.querySelectorAll('h1,h2')].filter((e) => e.offsetParent !== null).map((e) => e.textContent?.trim()).slice(0, 4)); await capturer('atelier-2');
await writeFile(resolve(sortie, 'journal-2-390-clair.json'), JSON.stringify(journal, null, 2));
console.log(JSON.stringify(journal, null, 1).slice(0, 1500));
await navigateur.close();
