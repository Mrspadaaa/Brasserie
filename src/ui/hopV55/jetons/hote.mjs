// BR-45 (09.11) : l'atelier dans la vraie coque de l'app (`?dev-local`, onglet Brassins → « Atelier Houblons V5.5 »), clair et cave,
// 390 tactile et 1280 : capture de l'écran et fond calculé de la coque. Usage (serveur sur 3117, voir banc.mjs) :
//   node src/ui/hopV55/jetons/hote.mjs <dossier des captures>
import { ouvrir, calme } from '../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
const S = process.argv[2];
for (const theme of ['clair', 'cave']) for (const [nom, largeur, hauteur, mobile] of [['390', 390, 844, true], ['1280', 1280, 900, false]]) {
  const { browser, page, journal } = await ouvrir({ largeur, hauteur, mobile, echelle: 1 });
  await page.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t); } catch {} }, theme);
  try {
    await page.goto('http://localhost:3117/?dev-local', { waitUntil: 'networkidle0' });
    await calme(page, 1500);
    const ok = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /Atelier Houblons V5\.5/.test(x.textContent)); if (b) { b.click(); return true; } return [...document.querySelectorAll('button')].map((x) => x.textContent.trim()).filter(Boolean).slice(0, 40).join(' | '); });
    if (ok !== true) {
      for (const t of ['Brassins', 'Recettes', 'Stocks', 'Houblons']) { await page.evaluate((t) => { const b = [...document.querySelectorAll('button,a,[role=tab]')].find((x) => x.textContent.trim().startsWith(t)); b?.click(); }, t); await calme(page, 800);
        const ok2 = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /Atelier Houblons V5\.5/.test(x.textContent)); if (b) { b.click(); return true; } return false; });
        if (ok2) break; }
    }
    await page.waitForSelector('.hop-v55-shell', { timeout: 30000 }).catch(() => console.log('coque absente', ok));
    await calme(page, 2500);
    await page.screenshot({ path: `${S}/hote-${theme}-${nom}.png` });
    console.log(theme, nom, await page.evaluate(() => { const m = document.querySelector('.hop-v55-shell>main'); return m ? getComputedStyle(m).backgroundColor + ' / ' + getComputedStyle(document.querySelector('.hop-v55')).backgroundColor : 'pas de main'; }));
  } finally { if (journal.erreurs.length) console.log(journal.erreurs.slice(0, 3)); await browser.close(); }
}
