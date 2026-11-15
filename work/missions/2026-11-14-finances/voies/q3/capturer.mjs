// node capturer.mjs <port> : q3/cap/<état>-<largeur>-<thème>.png sur le banc ?dev-local&finance-demo (données d'exemple, jamais réelles).
// États : paye (comme la maquette : 4 lignes, facture jointe, payé), impaye (2 lignes sans justificatif, Noter un paiement), sanslignes (le loyer : ni barre ni lignes),
//         apres (après le geste : un segment de la barre ouvre l'article du stock).
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { mkdirSync } from 'node:fs';
const PORT = process.argv[2] ?? '3000';
const OUT = new URL('./cap/', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
mkdirSync(OUT, { recursive: true });
const r = [];
const LIGNES = [['malt-1', 'Malt Pilsner', 7250, 25, 'kg'], ['malt-2', 'Malt Munich', 3840, 10, 'kg'], ['hop-1', 'Houblon Citra', 4890, 500, 'g'], ['hop-2', 'Houblon Cascade', 2700, 500, 'g']]
  .map(([id, description, amountCents, quantity, unit]) => ({ id, description, kind: 'ingredient', amountCents, quantity, unit, stockItemRef: `DEMO-${id}` }));
const NETTOYAGE = [
  { id: 'cl-1', description: 'Nettoyant alcalin', kind: 'cleaning', amountCents: 3000, quantity: 5, unit: 'L', stockItemRef: 'DEMO-cl-1' },
  { id: 'cl-2', description: 'Désinfectant', kind: 'cleaning', amountCents: 1200, quantity: 1, unit: 'L' }];
for (const [largeur, mobile, hauteur] of [[390, true, 1500], [1280, false, 1200]]) for (const theme of ['clair', 'cave']) {
  const { browser, page, journal } = await ouvrir({ largeur, hauteur, mobile, echelle: 2 });
  await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo`); await calme(page, 1500);
  await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload(); await calme(page, 1500);
  await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find((e) => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1200);
  await page.evaluate(() => [...document.querySelectorAll('[role=tab],button')].filter((e) => e.offsetParent && e.textContent.trim().startsWith('Opérations'))[0]?.click()); await calme(page, 1200);
  const prep = await page.evaluate(async (lignes, nettoyage) => {
    const { StorageService } = await import('/src/services/storage.ts');
    const tous = StorageService.getTransactions();
    const t1 = tous.find((t) => t.id === 'DEMO-T1'), t3 = tous.find((t) => t.id === 'DEMO-T3');
    if (!t1 || !t3) return 'DEMO-T1 ou T3 absent';
    StorageService.updateTransaction({ ...t1, date: '2026-11-07', proofUrl: 'data:application/pdf;base64,JVBERi0xLjQK', proofFileName: 'comptoir-1187.pdf', proofType: 'application/pdf', finance: { ...t1.finance, lines: lignes } });
    StorageService.updateTransaction({ ...t3, finance: { ...t3.finance, lines: nettoyage } });
    return 'ok';
  }, LIGNES, NETTOYAGE);
  r.push(`prépa ${largeur} ${theme}: ${prep}`);
  const shot = async (n) => { await calme(page, 700); await page.screenshot({ path: `${OUT}${n}-${largeur}-${theme}.png` }); r.push(`${n}-${largeur}-${theme}`); };
  const ouvrirFiche = async (mot) => { await page.evaluate((m) => [...document.querySelectorAll('button')].find((e) => e.offsetParent && e.textContent.includes(m))?.click(), mot); await calme(page, 1000); };
  await ouvrirFiche('Nettoyant alcalin'); await shot('impaye'); await page.keyboard.press('Escape'); await calme(page, 800);
  await ouvrirFiche('Loyer de l’atelier'); await shot('sanslignes'); await page.keyboard.press('Escape'); await calme(page, 800);
  await ouvrirFiche('Malt et houblons'); await shot('paye');
  await page.evaluate(() => document.querySelector('.fiche-fseg[data-ligne="hop-1"]')?.click()); await shot('apres');
  r.push(`erreurs ${largeur} ${theme}: ${journal.erreurs.slice(0, 3).join(' | ')}`);
  await browser.close();
}
console.log(r.join('\n'));
