import { lancer, page, boutons, capture, texte, ecrireJournal, log, toucher } from './outil.mjs';
const nav = await lancer();
try {
  const p = await page(nav, '&theme=clair', 1280);
  await capture(p, 'recon-liste-1280', { plein: true });
  log('BOUTONS liste: ' + JSON.stringify(await boutons(p)));
  log('TEXTE liste: ' + (await texte(p)).slice(0, 1500));
  log('CHAMPS: ' + JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('textarea,input')].map(e => `${e.tagName} ${e.type} ph=${e.placeholder} vis=${e.getClientRects().length>0}`))));
  const q = await page(nav, '&theme=clair&ouvrir=ventilation', 1280);
  await capture(q, 'recon-ventil-1280', { plein: true });
  log('BOUTONS ventil: ' + JSON.stringify(await boutons(q)));
  log('TEXTE ventil: ' + (await texte(q)).slice(0, 2500));
} finally { await nav.close(); ecrireJournal('recon'); }
