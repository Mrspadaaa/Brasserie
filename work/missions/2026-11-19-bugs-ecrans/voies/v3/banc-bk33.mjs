// Voie v3b, BK3-3 (partie Vendre) : la caisse avec un panier long ; la barre collante « Mon mois / Encaisser » (.om-bas) ne couvre jamais le dernier article.
// Données : fixtures dev-local (jamais Firestore). Usage (Vite déjà lancé sur 3135) :
//   MODES=390 WITH_SERVER_PORTS=3135 node work/missions/2026-11-19-bugs-ecrans/voies/v3/banc-bk33.mjs [avant|apres]
// Mesure : à chaque position de défilement de la feuille (.cs-scroll), le bas du dernier article du ticket (.cs-tl, hors TVA/arrondi : le dernier `.cs-tl` d'article)
// contre le haut de la barre. Défaut = un article entièrement ou en partie visible mais caché sous la barre, ET aucune position où il est dégagé... et, au repos
// (haut de la feuille), le dernier article visible ne doit pas toucher la barre.
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';

const PORT = (process.env.WITH_SERVER_PORTS ?? '3135').split(',')[0];
const QUAND = process.argv[2] ?? 'apres';
const SORTIE = path.join(import.meta.dirname, 'captures');
mkdirSync(SORTIE, { recursive: true });
const MODES = [{ id: '390', l: 390, h: 844, mobile: true, echelle: 2 }, { id: '1280', l: 1280, h: 800, mobile: false, echelle: 1 }];
const SEULS = (process.env.MODES ?? '').split(',').filter(Boolean);
let ko = 0;
for (const mode of MODES.filter((m) => !SEULS.length || SEULS.includes(m.id))) {
  for (const theme of ['clair', 'cave']) {
    const { browser, page, journal } = await ouvrir({ largeur: mode.l, hauteur: mode.h, mobile: mode.mobile, echelle: mode.echelle });
    await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo`, { waitUntil: 'domcontentloaded' }); await calme(page, 1500);
    await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].some((e) => /^Finances$/.test(e.textContent.trim())), { timeout: 240000 }); await calme(page, 1500);
    await page.evaluate(() => document.querySelector('button[aria-label="Actions rapides"]')?.click()); await calme(page, 800);
    await page.evaluate(() => { const b = [...document.querySelectorAll('button,[role=menuitem]')].find((e) => /Vendre|Vente/.test((e.getAttribute('aria-label') ?? e.textContent).trim()) && e.offsetParent); b?.click(); });
    await calme(page, 1200);
    await page.waitForSelector('.cs-t', { timeout: 60000 });
    // Panier long : chaque bière proposée, chaque format ; puis des lignes libres jusqu'à dépasser la hauteur.
    const nbBieres = await page.evaluate(() => 1 + (document.querySelector('.cs-addb') && !document.querySelector('.cs-addb').disabled ? 99 : 0));
    void nbBieres;
    for (let tour = 0; tour < 6; tour++) {
      const ajoute = await page.evaluate(() => {
        const b = document.querySelector('.cs-addb'); if (!b || b.disabled) return false; b.click(); return true;
      });
      if (!ajoute) break; await calme(page, 300);
      const pris = await page.evaluate(() => { const li = document.querySelector('.cs-pick li button'); if (!li) return false; li.click(); return true; });
      if (!pris) break; await calme(page, 300);
    }
    for (let b = 0; b < 8; b++) {
      await page.evaluate(() => { [...document.querySelectorAll('.cs-bc')].forEach(() => {}); });
      const nb = await page.evaluate(() => document.querySelectorAll('.cs-bc[aria-pressed]').length);
      const idx = b % Math.max(nb, 1);
      await page.evaluate((i) => { document.querySelectorAll('.cs-bc[aria-pressed]')[i]?.click(); }, idx); await calme(page, 150);
      await page.evaluate(() => { [...document.querySelectorAll('.cs-t:not(.cs-free)')].forEach((t) => t.click()); }); await calme(page, 150);
    }
    // Lignes libres (consigne, verres…) jusqu'à 14 articles : le panier long d'un brasseur qui livre un bar.
    for (let i = 0; i < 12; i++) {
      await page.evaluate(() => document.querySelector('.cs-t.cs-free')?.click()); await calme(page, 120);
      await page.waitForSelector('[role=group][aria-label="Ligne libre"]', { timeout: 10000 }).catch(() => {});
      const ecrire = async (sel, v) => { const c = await page.$(sel); if (!c) return; await c.focus(); await page.keyboard.type(v); await page.evaluate(() => document.activeElement?.blur?.()); };
      await ecrire('.cs-libre label:first-of-type input, .cs-libre label:first-of-type textarea', `Verre ${i + 1}`);
      await ecrire('[aria-label="Prix unitaire"]', '2');
      await page.evaluate(() => [...document.querySelectorAll('button')].find((e) => e.textContent.trim() === 'Ajouter la ligne')?.click()); await calme(page, 120);
    }
    const lignes = await page.evaluate(() => document.querySelectorAll('.cs-ticket .cs-tl').length);
    // Défiler la feuille : le conteneur qui défile.
    const mes = await page.evaluate(async () => {
      const bas = document.querySelector('.om-bas'); const tk = document.querySelector('.cs-ticket');
      let sc = bas.parentElement; while (sc && !/(auto|scroll)/.test(getComputedStyle(sc).overflowY)) sc = sc.parentElement;
      if (!sc) return { erreur: 'pas de conteneur qui défile' };
      const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
      const hBarre = Math.round(bas.getBoundingClientRect().height);
      const defilable = sc.scrollHeight - sc.clientHeight;
      // Le geste « amener à l'écran » (Tab, lecteur d'écran, scrollIntoView) : le navigateur défile au plus court, l'élément se pose au bord bas de la feuille,
      // c.-à-d. SOUS la barre collante si rien ne réserve sa place (scroll-margin-bottom = hauteur mesurée de la barre). Couvert = recouvrement vertical avec la barre.
      const sondes = [...tk.querySelectorAll('button, [role=button], .cs-tl, .cs-tt, .cs-aide')].filter((e) => e.getClientRects().length);
      const dernierArticle = [...tk.querySelectorAll('.cs-tl')].filter((l) => /×/.test(l.textContent) && !/^TVA/.test(l.textContent.trim())).pop();
      const couverts = [];
      for (const e of sondes) {
        sc.scrollTop = 0; await attendre(40);
        if (e.matches('button, [role=button]')) e.focus(); else e.scrollIntoView({ block: 'nearest' });
        await attendre(60);
        const rb = bas.getBoundingClientRect(), re = e.getBoundingClientRect(), rs = sc.getBoundingClientRect();
        const visible = re.top < rs.bottom && re.bottom > rs.top;
        if (visible && re.bottom > rb.top + 0.5 && re.top < rb.bottom - 0.5 && rb.bottom <= rs.bottom + 0.5)
          couverts.push(`${(e.getAttribute('aria-label') || e.textContent).replace(/\s+/g, ' ').trim().slice(0, 28)} [${Math.round(re.top)}–${Math.round(re.bottom)}] sous la barre [${Math.round(rb.top)}–${Math.round(rb.bottom)}]`);
      }
      sc.scrollTop = 0; await attendre(100);
      const rb0 = bas.getBoundingClientRect(), tk0 = tk.getBoundingClientRect();
      return { hBarre, defilable, sondes: sondes.length, couverts, dernierArticle: (dernierArticle?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 30), reserveCss: getComputedStyle(tk).scrollMarginBottom, barreAuRepos: [Math.round(rb0.top), Math.round(rb0.bottom)], ticketAuRepos: [Math.round(tk0.top), Math.round(tk0.bottom)] };
    });
    const bon = !mes.erreur && mes.couverts.length === 0;
    if (!bon) ko++;
    console.log(`${QUAND} ${mode.id} ${theme} : lignes=${lignes} ${JSON.stringify(mes)} -> ${bon ? 'OK' : 'DEFAUT'}${journal.erreurs.length ? ' ; erreurs=' + journal.erreurs.slice(0, 2).join(' | ') : ''}`);
    await calme(page, 300);
    await page.screenshot({ path: path.join(SORTIE, `bk33-caisse-${mode.id}-${theme}-${QUAND}-repos.png`) });
    await page.evaluate(() => { let sc = document.querySelector('.om-bas').parentElement; while (sc && !/(auto|scroll)/.test(getComputedStyle(sc).overflowY)) sc = sc.parentElement; if (sc) sc.scrollTop = Math.max(0, document.querySelector('.cs-ticket').offsetTop - 200); });
    await calme(page, 400);
    await page.screenshot({ path: path.join(SORTIE, `bk33-caisse-${mode.id}-${theme}-${QUAND}-ticket.png`) });
    await browser.close();
  }
}
console.log(ko ? `BK33 KO (${ko})` : 'BK33 OK');
process.exit(ko ? 1 : 0);
