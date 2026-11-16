// node capturer.mjs <port> <point> : captures de la voie u1 sur le banc ?dev-local&finance-demo (jeu de démonstration local, aucune donnée réelle).
//   depense : Nouvelle dépense (18) ; apport : la fiche d'un apport, correction du paiement (19) ; retrait : « Retirer cette écriture » sur une dépense payée (20).
// -> cap/<point>-<largeur>-<thème>-<étape>.png
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
const PORT = process.argv[2] ?? '3000', POINT = process.argv[3] ?? 'depense', EXPLORER = process.argv.includes('explorer');
const OUT = fileURLToPath(new URL('./cap/', import.meta.url)); mkdirSync(OUT, { recursive: true });
const clic = (page, t, racine = 'body', exact = false) => page.evaluate(([t, racine, exact]) => {
  const e = [...document.querySelectorAll(`${racine} [role=tab], ${racine} button, ${racine} summary, ${racine} a`)].filter((e) => e.offsetParent && ((e.getAttribute('aria-label') || e.textContent).trim().startsWith(t)) && (!exact || (e.getAttribute('aria-label') || e.textContent).trim() === t));
  if (!e.length) return false; e.at(-1).click(); return true;
}, [t, racine, exact]);
const boutons = (page, racine = 'body') => page.evaluate((r) => [...document.querySelectorAll(`${r} button, ${r} summary`)].filter((e) => e.offsetParent).map((e) => (e.getAttribute('aria-label') || e.textContent).replace(/\s+/g, ' ').trim().slice(0, 45)).filter(Boolean).join(' | '), racine);
for (const [largeur, mobile, hauteur] of [[390, true, 1100], [1280, false, 900]]) for (const theme of ['clair', 'cave']) {
  const { browser, page } = await ouvrir({ largeur, hauteur, mobile, echelle: 1 });
  await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo`); await calme(page, 1500);
  await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload(); await calme(page, 1500);
  await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find((e) => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1200);
  const photo = async (etape) => { await calme(page, 700); await page.screenshot({ path: `${OUT}${POINT}-${largeur}-${theme}-${etape}.png` }); };
  if (POINT === 'depense') {
    await page.click('button[aria-label="Actions rapides"]'); await calme(page, 800);
    if (EXPLORER) console.log('1', await boutons(page));
    await clic(page, 'Nouvelle écriture'); await calme(page, 800);
    if (EXPLORER) console.log('2', await boutons(page));
    await clic(page, 'Saisir sans justificatif'); await calme(page, 1000);
    if (EXPLORER) { console.log('3', await boutons(page)); await browser.close(); break; }
    await photo('feuille');
  }
  if (POINT === 'apport' || POINT === 'retrait') {
    await clic(page, 'Opérations'); await calme(page, 1200);
    if (EXPLORER) console.log(await boutons(page));
  }
  await browser.close();
}
