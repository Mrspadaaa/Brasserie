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
    // Au doigt (pointeur grossier, 390), `Input` rend un textarea : le champ se vise par son aria-label, quel que soit l'élément.
    await page.waitForSelector('[role=group][aria-label="Ligne libre"]', { timeout: 20000 }).catch(() => {});
    const champ = await page.waitForSelector('[aria-label="Prix unitaire"]', { timeout: 20000 }).catch(() => null);
    if (champ) { await champ.focus(); await page.keyboard.type('569,50'); const lu = await page.evaluate((c) => c.value, champ); if (!lu) await page.evaluate((c) => { const set = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(c), 'value').set; set.call(c, '569,50'); c.dispatchEvent(new Event('input', { bubbles: true })); c.dispatchEvent(new Event('change', { bubbles: true })); }, champ); console.log(`${mode.id} ${theme} champ après frappe : « ${lu} »`); await page.evaluate(() => document.activeElement?.blur?.()); }
    await calme(page, 500);
    const alerte = await page.evaluate(() => document.querySelector('.cs-alerte-prix')?.textContent ?? null);
    const mesLibre = await page.evaluate(() => {
      const r = (e) => { const b = e?.getBoundingClientRect(); return b ? [Math.round(b.top), Math.round(b.bottom)] : null; };
      const bas = document.querySelector('.om-bas'); const cs = document.querySelector('.cs-scroll');
      let parent = bas?.parentElement; const chaine = [];
      while (parent && chaine.length < 8) { const s = getComputedStyle(parent); chaine.push(`${parent.className.toString().slice(0, 30)}[${r(parent)}] ov=${s.overflowY} pb=${s.paddingBottom}`); parent = parent.parentElement; }
      return { h: innerHeight, barre: r(bas), scroll: r(cs), scrollTop: cs?.scrollTop, hauteurScroll: cs?.scrollHeight, chaine };
    });
    console.log(`${mode.id} ${theme} libre : ${JSON.stringify(mesLibre)}`);
    await page.screenshot({ path: path.join(SORTIE, `vente-libre-${mode.id}-${theme}.png`) });
    await page.evaluate(() => [...document.querySelectorAll('button')].find((e) => e.textContent.trim() === 'Ajouter la ligne')?.click()); await calme(page, 600);
    await page.evaluate(() => document.querySelector('.cs-ticket')?.scrollIntoView({ block: 'center' })); await calme(page, 400);
    const ticket = await page.evaluate(() => document.querySelector('.cs-tl-alerte')?.textContent ?? null);
    await page.screenshot({ path: path.join(SORTIE, `vente-ticket-${mode.id}-${theme}.png`) });
    // k3 n° 16 et 17 : « Encaisser » est-il désactivé ? et où la barre « Mon mois / Encaisser » se pose-t-elle par rapport au bas de l'écran et au panier ?
    const mes = await page.evaluate(() => {
      const go = document.querySelector('.cs-go'); const bas = document.querySelector('.om-bas'); const r = bas?.getBoundingClientRect();
      const sc = bas?.closest('.cs-scroll, [class*=overflow]'); const tk = document.querySelector('.cs-ticket')?.getBoundingClientRect();
      const cl = go ? getComputedStyle(go) : null;
      return { encaisserDisabled: go?.disabled ?? null, libelle: go?.textContent.trim() ?? null, couleur: cl ? `${cl.color} sur ${cl.backgroundColor} opacité ${cl.opacity}` : null,
        barre: r ? { haut: Math.round(r.top), bas: Math.round(r.bottom) } : null, ticket: tk ? { haut: Math.round(tk.top), bas: Math.round(tk.bottom) } : null, h: innerHeight, scrollBas: sc ? Math.round(sc.getBoundingClientRect().bottom) : null };
    });
    console.log(`${mode.id} ${theme} mesures : ${JSON.stringify(mes)}`);
    if (!alerte || !ticket) ko++;
    sortie.push(`${mode.id} ${theme} : fab/vendre=${clic} ; tuile=${tuile} ; alerte libre=${alerte} ; ticket=${ticket}${journal.erreurs.length ? ' ; erreurs=' + journal.erreurs.slice(0, 2).join(' | ') : ''}`);
    await browser.close();
  }
}
console.log(sortie.join('\n'));
console.log(ko ? `VENTE KO (${ko})` : 'VENTE OK');
process.exit(ko ? 1 : 0);
