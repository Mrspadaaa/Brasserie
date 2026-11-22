import { lancer, feuilleDepense, capture, texte, champs, boutons, log, toucher, ecrireJournal, dormir } from './outil.mjs';
const nav = await lancer();
try {
  for (const etat of (process.argv[2] ?? 'medicament').split(',')) {
    const p = await feuilleDepense(nav, etat, 1280, 'clair');
    log(`== ${etat} texte : ${(await texte(p)).slice(0, 1500).replace(/\n+/g, ' ¦ ')}`);
    log(`boutons : ${JSON.stringify(await boutons(p))}`);
    log(`champs : ${JSON.stringify(await champs(p))}`);
    log(`erreurs : ${JSON.stringify(p.erreurs)}`);
    log('capture ' + await capture(p, `recon-${etat}`));
    await p.close();
  }
} finally { await nav.close(); ecrireJournal('journal-recon'); }
