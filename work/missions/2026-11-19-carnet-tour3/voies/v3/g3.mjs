import { lancer, ouvrir, feuilleDepense, capture, champs, boutons, log, toucher, saisir, ecrireJournal, dormir } from './outil.mjs';
const nav = await lancer();
const feuille = (p) => p.evaluate(() => (document.querySelector('[role=dialog]')?.innerText ?? document.body.innerText).replace(/[\u00a0\u202f]/g, ' ').replace(/\n+/g, ' ¦ ').slice(0, 1500));
const labels = (p, re) => p.evaluate((r) => [...document.querySelectorAll('[aria-label]')].filter((e) => e.getClientRects().length).map((e) => e.getAttribute('aria-label')).filter((l) => new RegExp(r, 'i').test(l)).slice(0, 40), re);
const manuel = async (L, th) => { const p = await ouvrir(nav, '?dev-local', L, th); await p.waitForSelector('[aria-label="Actions rapides"]', { timeout: 90000 }); await p.click('[aria-label="Actions rapides"]'); await dormir(800); await toucher(p, 'Facture, photo ou PDF', { label: true, ms: 1200 }); await toucher(p, 'Saisir sans justificatif', { ms: 1200 }); return p; };
try {
  for (const [L, th] of [[390, 'clair'], [1280, 'cave']]) {
    // LR1-7
    const r = await feuilleDepense(nav, 'medicament', L, th);
    await saisir(r, '[aria-label="Prix ligne 1"]', ''); await saisir(r, '[aria-label="Quantité ligne 1"]', '2'); await saisir(r, '[aria-label="Montant ligne 1"]', '50');
    log(`LR1-7 ${L} ${th} champs : ${JSON.stringify((await champs(r)).filter((c) => /ligne 1/.test(c)))}`);
    log(`  déduit : ${await r.evaluate(() => [...document.querySelectorAll('[data-dp-prix-deduit]')].map((e) => `${e.innerText} [${getComputedStyle(e).color}] title=${e.title}`).join(' | ') || 'aucun')}`);
    log(`  rangée : ${await r.evaluate(() => { const e = document.querySelector('[aria-label="Montant ligne 1"]'); let x = e; for (let i = 0; i < 6 && x; i++) x = x.parentElement; return (x?.innerText ?? '').replace(/\n+/g, ' ¦ ').slice(0, 300); })}`);
    await r.evaluate(() => document.querySelector('[aria-label="Montant ligne 1"]').scrollIntoView({ block: 'center' })); log('  ' + await capture(r, 'lr17-deduit')); await r.close();
    // M9-3
    const m = await feuilleDepense(nav, '3', L, th);
    const somme = () => m.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => e.children.length < 3 && /^Somme/.test(e.innerText ?? '') && e.getClientRects().length).map((e) => e.parentElement.innerText.replace(/\n+/g, ' ¦ ').slice(0, 120)).slice(0, 2).join(' || '));
    log(`M9-3 ${L} avant : ${await somme()} · lignes : ${(await feuille(m)).match(/\d+ ¦  lignes?/)?.[0]}`);
    await toucher(m, 'Retirer la ligne 3', { label: true, exact: true, ms: 1200 });
    log(`  après 1 : ${await somme()} · ${(await feuille(m)).match(/\d+ ¦  lignes?/)?.[0]} · labels : ${JSON.stringify(await labels(m, 'annul|confirm|retir.*3\b'))}`);
    log(`  feuille : ${(await feuille(m)).slice(0, 700)}`);
    log('  ' + await capture(m, 'm93-retrait')); await m.close();
    // T3-7 puis T3-6
    const p = await manuel(L, th);
    await saisir(p, '#purchase-total', '1');
    await toucher(p, 'Règlement', { ms: 900 }); log(`  règlement : ${JSON.stringify((await boutons(p)).filter((b) => /pay|régl|plus tard|crédit/i.test(b)))}`);
    await toucher(p, 'À payer', { ms: 900 });
    log(`T3-7 ${L} ${th} : ${await feuille(p)}`);
    log(`  Mon mois : ${await p.evaluate(() => [...document.querySelectorAll('button')].find((b) => /Mon mois/.test(b.innerText))?.innerText.replace(/\n+/g, ' ¦ '))}`);
    log('  ' + await capture(p, 't37-mon-mois'));
    await toucher(p, 'Enregistrer la dépense', { label: true, ms: 2500 });
    log(`T3-6 après Enregistrer : dialog=${await p.evaluate(() => !!document.querySelector('[role=dialog]'))} · ${(await feuille(p)).slice(0, 600)}`);
    log('  ' + await capture(p, 't36-apres'));
    await toucher(p, 'Finances', { exact: true, ms: 1800 }); log(`  Finances : ${(await feuille(p)).slice(0, 900)}`); log('  ' + await capture(p, 't36-finances'));
    await p.close();
  }
  // recon lignes manuelles
  const q = await manuel(1280, 'clair');
  await toucher(q, 'Articles, stock et matériel', { ms: 1000 });
  log(`lignes : ${await feuille(q)}`); log(`  labels : ${JSON.stringify(await labels(q, 'ligne|unit|ajout'))}`); log(`  boutons : ${JSON.stringify((await boutons(q)).slice(19))}`); log(await capture(q, 'recon-lignes')); await q.close();
} finally { await nav.close(); ecrireJournal('journal-g3'); }
