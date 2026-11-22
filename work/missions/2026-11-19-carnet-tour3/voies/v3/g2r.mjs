import { lancer, ouvrir, capture, texte, champs, boutons, log, toucher, ecrireJournal, dormir } from './outil.mjs';
const nav = await lancer();
const feuille = (p) => p.evaluate(() => (document.querySelector('[role=dialog]')?.innerText ?? document.body.innerText).replace(/[\u00a0\u202f]/g, ' ').replace(/\n+/g, ' ¦ ').slice(0, 1800));
try {
  const p = await ouvrir(nav, '?dev-local', 1280, 'clair');
  await p.waitForSelector('[aria-label="Actions rapides"]', { timeout: 90000 }); await p.click('[aria-label="Actions rapides"]'); await dormir(800);
  await toucher(p, 'Facture, photo ou PDF', { ms: 1200 }); await toucher(p, 'Saisir sans justificatif', { ms: 1200 });
  log(`manuel : ${await feuille(p)}`); log(`champs : ${JSON.stringify(await champs(p))}`); log(`boutons : ${JSON.stringify(await boutons(p))}`); log(await capture(p, 'recon-manuel'));
  await p.close();
  const a = await ouvrir(nav, '?dev-local', 1280, 'clair');
  log(`accueil boutons : ${JSON.stringify(await boutons(a))}`);
  await toucher(a, 'Stocks', { exact: true, ms: 1500 }); log(`stocks : ${(await feuille(a)).slice(0, 600)}`); log(`  boutons : ${JSON.stringify((await boutons(a)).slice(0, 40))}`);
  await a.close();
} finally { await nav.close(); ecrireJournal('journal-g2r'); }
