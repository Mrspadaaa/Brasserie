import { lancer, ouvrir, feuilleDepense, capture, texte, champs, boutons, log, toucher, ecrireJournal, dormir } from './outil.mjs';
const nav = await lancer();
const barres = (p) => p.evaluate(() => [...document.querySelectorAll('[role=dialog] *, body *')].filter((e) => e.children.length === 0 && getComputedStyle(e).textDecorationLine.includes('line-through') && e.getClientRects().length).map((e) => e.textContent.trim()).filter(Boolean).slice(0, 30));
const rouges = (p) => p.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => e.children.length === 0 && e.getClientRects().length && /manquant|≠|écart|désaccord|en cours/i.test(e.textContent)).map((e) => `${e.textContent.trim().slice(0, 60)} [${getComputedStyle(e).color}]`).slice(0, 25));
const feuille = (p) => p.evaluate(() => (document.querySelector('[role=dialog]')?.innerText ?? document.body.innerText).replace(/[\u00a0\u202f]/g, ' ').replace(/\n+/g, ' ¦ ').slice(0, 2200));
try {
  { const p = await ouvrir(nav, '?dev-local', 1280, 'clair'); await dormir(5000); await p.reload({ waitUntil: 'networkidle0' }); await p.close(); log('chauffé'); }
  for (const [L, th] of [[390, 'clair'], [1280, 'cave']]) {
    // LR1-6
    const p = await feuilleDepense(nav, 'v3-lent', L, th, { attendreFinal: false });
    await dormir(2500); log(`LR1-6 prov ${L} ${th} : ${await feuille(p)}`); log(`  marques : ${JSON.stringify(await rouges(p))}`);
    log('  ' + await capture(p, 'lr16-provisoire'));
    await p.waitForFunction(() => document.body.dataset.apercu === 'v3-lent', { timeout: 60000 }).catch(() => log('  final non signalé'));
    await dormir(800); log(`LR1-6 final : ${await feuille(p)}`); log(`  marques : ${JSON.stringify(await rouges(p))}`); log('  ' + await capture(p, 'lr16-final')); await p.close();
    for (const e of ['reel-doc25', 'reel-doc14', 'reel-doc2']) {
      const q = await feuilleDepense(nav, e, L, th);
      log(`${e} ${L} ${th} : ${await feuille(q)}`); log(`  barrés : ${JSON.stringify(await barres(q))}`); log(`  marques : ${JSON.stringify(await rouges(q))}`); log(`  erreurs : ${JSON.stringify(q.erreurs)}`);
      log('  ' + await capture(q, e));
      if (e === 'reel-doc2') { if (await toucher(q, 'Voir le désaccord', { ms: 1200 })) { log(`  après Voir le désaccord : ${(await feuille(q)).slice(0, 1200)}`); log('  ' + await capture(q, 'lr19-desaccord')); } }
      await q.close();
    }
    // M9-3
    const m = await feuilleDepense(nav, '3', L, th);
    log(`M9-3 avant : ${(await feuille(m)).slice(0, 1500)}`);
    if (await toucher(m, 'Retirer la ligne 3', { label: true, ms: 1000 })) { log(`  après retrait : ${(await feuille(m)).slice(0, 1500)}`); log('  ' + await capture(m, 'm93-retrait')); }
    else log(`  boutons : ${JSON.stringify((await boutons(m)).filter((b) => /etir|ligne/i.test(b)))}`);
    await m.close();
    if (L === 1280) { const r = await feuilleDepense(nav, 'medicament', L, th); log(`medicament champs : ${JSON.stringify(await champs(r))}`); log(`  ${(await feuille(r)).slice(0, 800)}`); await r.close(); }
  }
} finally { await nav.close(); ecrireJournal('journal-g1'); }
