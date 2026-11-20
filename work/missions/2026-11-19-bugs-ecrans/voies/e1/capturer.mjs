// Voie e1 : captures APRÈS correctif (T3B-7, T3B-8, T3B-9). Banc local `?dev-local&malts=maquette` (fixture SIMULÉE de la maquette s1), aucune donnée réelle.
// Usage : node scripts/with_server.mjs --server "npm run dev" --port 3109 --env PORT=3109 -- node work/missions/2026-11-19-bugs-ecrans/voies/e1/capturer.mjs
import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sortie = resolve(dirname(fileURLToPath(import.meta.url)), 'captures');
await mkdir(sortie, { recursive: true });
const port = (process.env.WITH_SERVER_PORTS || '3109').split(',')[0];
const base = `http://localhost:${port}/?dev-local&etape=houblons&recette=vide&malts=maquette`;
const navigateur = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const tailles = [{ nom: '390', w: 390, h: 844, mobile: true }, { nom: '1280', w: 1280, h: 900, mobile: false }];
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const rapport = [];
try {
  for (const theme of ['clair', 'cave']) {
    for (const t of tailles) {
      const contexte = await navigateur.createBrowserContext(); const page = await contexte.newPage();
      await page.setViewport({ width: t.w, height: t.h, deviceScaleFactor: 1, isMobile: t.mobile, hasTouch: t.mobile });
      await page.evaluateOnNewDocument((th) => { localStorage.setItem('laffinee.theme', th); }, theme);
      page.on('pageerror', (e) => rapport.push(`erreur page ${theme} ${t.nom} : ${e.message}`));
      await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await page.waitForSelector('body[data-apercu]', { timeout: 90000 });
      await attendre(700);
      // T3B-9 : repos, les cinq noms de famille
      await page.screenshot({ path: `${sortie}/malts-repos-${t.nom}-${theme}.png` });
      const noms = await page.$$eval('[data-role="fam-noms"] button', (b) => b.map((x) => `${x.textContent}${x.getAttribute('aria-current') === 'true' ? '*' : ''}`));
      rapport.push(`${theme} ${t.nom} noms : ${noms.join(' | ')}`);
      // T3B-8 : coriandre
      await page.click('[data-role="ajout"]');
      await page.type('[data-role="ajout"]', 'coriandre');
      await attendre(300);
      await page.screenshot({ path: `${sortie}/malts-coriandre-${t.nom}-${theme}.png` });
      const creer = await page.$eval('[data-role="creer"]', (e) => e.textContent);
      rapport.push(`${theme} ${t.nom} créer : ${creer}`);
      // T3B-7 : Identité, NOLO allumé
      await page.keyboard.press('Escape');
      await page.evaluate(() => { const b = [...document.querySelectorAll('button, [role="tab"]')].find((x) => /^Identité$/.test(x.textContent.trim())); b?.click(); });
      await attendre(600);
      const aInterrupteur = await page.$('[aria-label="Objectif NOLO · ≤ 0,5 %"]');
      if (aInterrupteur) {
        const actif = await page.$eval('[aria-label="Objectif NOLO · ≤ 0,5 %"]', (e) => e.getAttribute('aria-checked'));
        if (actif !== 'true') await aInterrupteur.click();
        await attendre(1200);
        const adopter = await page.evaluateHandle(() => [...document.querySelectorAll('button')].find((x) => /Adapter à mon matériel/.test(x.textContent)));
        if (adopter.asElement()) { await adopter.asElement().click(); await attendre(1500); }
        await page.$eval('.nolo-simulator, [aria-label="Objectif NOLO"]', (e) => e.scrollIntoView({ block: 'start' })).catch(() => {});
        await attendre(300);
        await page.screenshot({ path: `${sortie}/nolo-${t.nom}-${theme}.png` });
        const n = await page.evaluate(() => {
          const d = [...document.querySelectorAll('.nolo-panel details, .nolo-simulator details')].filter((x) => !x.parentElement.closest('details'));
          return { premierPlan: d.length, appliquer: document.querySelector('.nolo-solver-apply')?.disabled, resume: d.map((x) => x.querySelector('summary')?.textContent) };
        });
        rapport.push(`${theme} ${t.nom} NOLO : ${JSON.stringify(n)}`);
      } else rapport.push(`${theme} ${t.nom} NOLO : interrupteur introuvable`);
      await page.close(); await contexte.close();
    }
  }
} finally {
  await navigateur.close();
}
console.log(rapport.join('\n'));
