// node capturer.mjs <port> : r2/cap/fiche-pj-<largeur>-<thème>.png — la fiche de « Malt et houblons » (pièce payée, facture jointe) dont le paiement porte un justificatif de virement.
// Banc ?dev-local&finance-demo (données d'exemple, jamais réelles). Le paiement PAI-DEMO-T1 reçoit proofDocumentId / proofFileName dans la mémoire du navigateur seulement.
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
import { mkdirSync } from 'node:fs';
const PORT = process.argv[2] ?? '3000';
const OUT = new URL('./cap/', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
mkdirSync(OUT, { recursive: true });
const r = [];
for (const [largeur, mobile, hauteur] of [[390, true, 1500], [1280, false, 1200]]) for (const theme of ['clair', 'cave']) {
  const { browser, page, journal } = await ouvrir({ largeur, hauteur, mobile, echelle: 2 });
  await page.goto(`http://localhost:${PORT}/?dev-local&finance-demo`); await calme(page, 1500);
  await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme); await page.reload(); await calme(page, 1500);
  await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find((e) => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1200);
  await page.evaluate(() => [...document.querySelectorAll('[role=tab],button')].filter((e) => e.offsetParent && e.textContent.trim().startsWith('Opérations'))[0]?.click()); await calme(page, 1200);
  const prep = await page.evaluate(async () => {
    const { StorageService } = await import('/src/services/storage.ts');
    const { FinanceService } = await import('/src/services/financeService.ts');
    const t = StorageService.getTransactions().find((x) => x.id === 'DEMO-T2');
    if (!t) return 'DEMO-T2 absent';
    StorageService.updateTransaction({ ...t, proofUrl: 'data:application/pdf;base64,JVBERi0xLjQK', proofFileName: 'bail-atelier.pdf', proofType: 'application/pdf' });
    FinanceService.recordPayment({ id: 'PAI-R2-VIR', transactionId: 'DEMO-T2', date: '2026-11-09', amountCents: t.finance.amountCents, direction: 'out', method: 'bank', recordedAt: '2026-11-09T09:00:00.000Z', proofDocumentId: 'proof-demo-virement', proofFileName: 'Virement 9 nov. 2026.pdf' });
    return 'ok';
  });
  r.push(`prépa ${largeur} ${theme}: ${prep}`);
  await page.evaluate((m) => [...document.querySelectorAll('button')].find((e) => e.offsetParent && e.textContent.includes(m))?.click(), 'Loyer de l’atelier'); await calme(page, 1500);
  await page.evaluate(() => document.querySelector('.fiche-hist')?.scrollIntoView({ block: 'center' })); await calme(page, 700);
  const lien = await page.evaluate(() => !!document.querySelector('.fiche-hist-pj button'));
  r.push(`lien du paiement ${largeur} ${theme}: ${lien}`);
  await page.screenshot({ path: `${OUT}fiche-pj-${largeur}-${theme}.png` });
  r.push(`erreurs ${largeur} ${theme}: ${journal.erreurs.slice(0, 3).join(' | ')}`);
  await browser.close();
}
console.log(r.join('\n'));
