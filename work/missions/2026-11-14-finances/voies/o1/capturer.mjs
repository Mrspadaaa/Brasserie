// node capturer.mjs <port> : Opérations (jeu de démonstration complet) en 390 et 1280, clair et cave -> cap/ops-<largeur>-<thème>.png
// + planche.html (l'app à gauche, la maquette v6a à droite) capturée en cap/planche-390.png
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';

const PORT = process.argv[2] ?? '3000';
const OUT = fileURLToPath(new URL('./cap/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const REF = fileURLToPath(new URL('../../ref/v6a/', import.meta.url));
const clic = (page, t) => page.evaluate((t) => { const e = [...document.querySelectorAll('[role=tab],button')].filter((e) => e.offsetParent && e.textContent.trim().startsWith(t)); if (!e.length) return false; e[0].click(); return true; }, t);

for (const [largeur, mobile, hauteur] of [[390, true, 1500], [1280, false, 1000]]) for (const theme of ['clair', 'cave']) {
  const { browser, page, journal } = await ouvrir({ largeur, hauteur, mobile, echelle: 1 });
  await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo`); await calme(page, 1500);
  await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload(); await calme(page, 1500);
  await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find((e) => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1200);
  await clic(page, 'Opérations'); await calme(page, 1200);
  await page.screenshot({ path: `${OUT}ops-${largeur}-${theme}.png` });
  // La ligne du loyer jusqu'à « Annuler » : l'état après « ✓ Payé » (écriture sur le jeu de démonstration local seulement).
  if (largeur === 390 && theme === 'clair') {
    const ok = await page.evaluate(() => { const b = [...document.querySelectorAll('.ops-act')].find((e) => /Payé/.test(e.textContent)); if (!b) return false; b.click(); return true; });
    await calme(page, 1200);
    await page.screenshot({ path: `${OUT}ops-apres-paye-390-clair.png` });
    console.log('geste Payé cliqué', ok, 'Annuler présent', await page.evaluate(() => [...document.querySelectorAll('.ops-act')].some((e) => /Annuler/.test(e.textContent))));
  }
  console.log(largeur, theme, 'erreurs:', journal.erreurs.slice(0, 3).join(' | ') || 'aucune');
  await browser.close();
}

// Planche : l'app (clair 390) et la maquette v6a côte à côte, même échelle.
const html = `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#888;display:flex;gap:12px;align-items:flex-start;font:14px sans-serif;color:#fff">
<figure style="margin:0"><figcaption>App (Opérations, banc, 390 clair)</figcaption><img src="${pathToFileURL(OUT + 'ops-390-clair.png').href}" width="390"></figure>
<figure style="margin:0"><figcaption>Maquette v6a (v6a-page.png)</figcaption><img src="${pathToFileURL(REF + 'v6a-page.png').href}" width="390"></figure>
<figure style="margin:0"><figcaption>App cave 390</figcaption><img src="${pathToFileURL(OUT + 'ops-390-cave.png').href}" width="390"></figure></body>`;
writeFileSync(OUT + 'planche.html', html);
const { browser, page } = await ouvrir({ largeur: 1230, hauteur: 1700, mobile: false, echelle: 1, externe: 'laisser' });
await page.goto(pathToFileURL(OUT + 'planche.html').href); await calme(page, 800);
await page.screenshot({ path: `${OUT}planche-390.png`, fullPage: true });
await browser.close();
console.log('captures écrites');
