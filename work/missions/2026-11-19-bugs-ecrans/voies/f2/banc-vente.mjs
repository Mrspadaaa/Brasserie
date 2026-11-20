// Voie f2 : LR3-NOTE-1 — la caisse (Vendre), tarif 75 cl faussé à 569,50 en LOCAL (fixtures dev-local, jamais Firestore) : alerte dans la ligne libre, puis sur le ticket.
// Usage : node scripts/with_server.mjs --server "npm run dev -- --port 3106 --strictPort" --port 3106 --env VITE_FIREBASE_API_KEY=fake \
//   -- node work/missions/2026-11-19-bugs-ecrans/voies/f2/banc-vente.mjs
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';

const PORT = (process.env.WITH_SERVER_PORTS ?? '3106').split(',')[0];
const SORTIE = path.join(import.meta.dirname, 'captures');
mkdirSync(SORTIE, { recursive: true });
const MODES = [{ id: '390', l: 390, h: 844, mobile: true, echelle: 2 }, { id: '1280', l: 1280, h: 800, mobile: false, echelle: 1 }];
const sortie = [];
let ko = 0;
for (const mode of MODES) {
  for (const theme of ['clair', 'cave']) {
    const { browser, page, journal } = await ouvrir({ largeur: mode.l, hauteur: mode.h, mobile: mode.mobile, echelle: mode.echelle });
    await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo`); await calme(page, 1500);
    await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload();
    await page.waitForFunction(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].some((e) => /^Finances$/.test(e.textContent.trim())), { timeout: 240000 }); await calme(page, 1500);
    // Vendre : le bouton « + » (actions rapides) puis « Vendre ».
    await page.evaluate(() => document.querySelector('button[aria-label="Actions rapides"]')?.click()); await calme(page, 800);
    const clic = await page.evaluate(() => { const b = [...document.querySelectorAll('button,[role=menuitem]')].find((e) => /Vendre|Vente/.test((e.getAttribute('aria-label') ?? e.textContent).trim()) && e.offsetParent); if (!b) return false; b.click(); return true; });
    await calme(page, 1200);
    await page.waitForSelector('.cs-t', { timeout: 60000 }).catch(() => {});
    // Le tarif 75 cl faussé (fixture locale seulement).
    await page.evaluate(async () => {
      const m = await import('/src/services/storage.ts');
      const t = m.StorageService.getTarifs().map((x) => (/75 cl/i.test(x.product) ? { ...x, priceHT: 569.5 } : x));
      m.StorageService.saveTarifs(t);
    });
    await calme(page, 600);
    await page.waitForFunction(() => [...document.querySelectorAll('.cs-t')].some((e) => /75 cl.*tarif à corriger/.test(e.getAttribute('aria-label') ?? '')), { timeout: 20000 }).catch(() => {});
    const tuile = await page.evaluate(() => { const b = [...document.querySelectorAll('.cs-t')].find((e) => /75 cl/.test(e.getAttribute('aria-label') ?? '')); if (!b) return null; const l = b.getAttribute('aria-label'); b.click(); return l; });
    await calme(page, 600);
    const champ = await page.waitForSelector('input[aria-label="Prix unitaire"]', { timeout: 20000 }).catch(() => null);
    if (champ) { await champ.focus(); await page.keyboard.type('569,50'); const lu = await page.evaluate((c) => c.value, champ); if (!lu) await page.evaluate((c) => { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(c, '569,50'); c.dispatchEvent(new Event('input', { bubbles: true })); c.dispatchEvent(new Event('change', { bubbles: true })); }, champ); console.log(`${mode.id} ${theme} champ après frappe : « ${lu} »`); await page.evaluate(() => document.activeElement?.blur?.()); }
    await calme(page, 500);
    const alerte = await page.evaluate(() => document.querySelector('.cs-alerte-prix')?.textContent ?? null);
    await page.screenshot({ path: path.join(SORTIE, `vente-libre-${mode.id}-${theme}.png`) });
    await page.evaluate(() => [...document.querySelectorAll('button')].find((e) => e.textContent.trim() === 'Ajouter la ligne')?.click()); await calme(page, 600);
    await page.evaluate(() => document.querySelector('.cs-ticket')?.scrollIntoView({ block: 'center' })); await calme(page, 400);
    const ticket = await page.evaluate(() => document.querySelector('.cs-tl-alerte')?.textContent ?? null);
    await page.screenshot({ path: path.join(SORTIE, `vente-ticket-${mode.id}-${theme}.png`) });
    if (!alerte || !ticket) ko++;
    sortie.push(`${mode.id} ${theme} : fab/vendre=${clic} ; tuile=${tuile} ; alerte libre=${alerte} ; ticket=${ticket}${journal.erreurs.length ? ' ; erreurs=' + journal.erreurs.slice(0, 2).join(' | ') : ''}`);
    await browser.close();
  }
}
console.log(sortie.join('\n'));
console.log(ko ? `VENTE KO (${ko})` : 'VENTE OK');
process.exit(ko ? 1 : 0);
