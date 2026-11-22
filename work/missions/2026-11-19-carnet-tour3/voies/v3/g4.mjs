import { lancer, ouvrir, feuilleDepense, capture, champs, boutons, log, toucher, saisir, ecrireJournal, dormir } from './outil.mjs';
const nav = await lancer();
const feuille = (p) => p.evaluate(() => (document.querySelector('[role=dialog]')?.innerText ?? document.body.innerText).replace(/[\u00a0\u202f]/g, ' ').replace(/\n+/g, ' ¦ ').slice(0, 1500));
const labels = (p, re) => p.evaluate((r) => [...document.querySelectorAll('[aria-label]')].filter((e) => e.getClientRects().length).map((e) => e.getAttribute('aria-label')).filter((l) => new RegExp(r, 'i').test(l)).slice(0, 40), re);
const taper = async (p, sel, v) => { const e = await p.$(sel); if (!e) { log('  absent ' + sel); return; } await e.evaluate((x) => { x.scrollIntoView({ block: 'center' }); x.focus(); x.select?.(); }); await p.keyboard.down('Control'); await p.keyboard.press('a'); await p.keyboard.up('Control'); await p.keyboard.press('Backspace'); if (v !== '') await p.keyboard.type(v, { delay: 20 }); await p.keyboard.press('Tab'); await dormir(500); };
const domClic = (p, label) => p.evaluate((l) => { const e = [...document.querySelectorAll('[aria-label]')].find((x) => x.getAttribute('aria-label') === l); if (!e) return 'absent'; const r = e.getBoundingClientRect(); e.click(); return `cliqué ${e.tagName} ${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)} vis=${getComputedStyle(e).visibility}`; }, label);
const manuel = async (L, th) => { const p = await ouvrir(nav, '?dev-local', L, th); await p.waitForSelector('[aria-label="Actions rapides"]', { timeout: 90000 }); await p.click('[aria-label="Actions rapides"]'); await dormir(800); await toucher(p, 'Facture, photo ou PDF', { label: true, ms: 1200 }); await toucher(p, 'Saisir sans justificatif', { ms: 1200 }); return p; };
try {
  for (const [L, th] of [[390, 'clair'], [1280, 'cave']]) {
    const r = await feuilleDepense(nav, 'medicament', L, th);
    await taper(r, '[aria-label="Prix ligne 1"]', ''); log(`LR1-7 ${L} prix vidé : ${JSON.stringify((await champs(r)).filter((c) => /ligne 1/.test(c)))}`);
    await taper(r, '[aria-label="Quantité ligne 1"]', '2'); await taper(r, '[aria-label="Montant ligne 1"]', '50');
    log(`  champs : ${JSON.stringify((await champs(r)).filter((c) => /ligne 1/.test(c)))}`);
    log(`  déduit : ${await r.evaluate(() => [...document.querySelectorAll('[data-dp-prix-deduit]')].map((e) => `${e.innerText} [${getComputedStyle(e).color}] title=${e.title}`).join(' | ') || 'aucun')}`);
    log(`  rangée : ${(await feuille(r)).match(/MEFENACIDE.{0,160}/)?.[0]}`);
    log('  ' + await capture(r, 'lr17-deduit')); await r.close();
    const m = await feuilleDepense(nav, '3', L, th);
    log(`M9-3 ${L} : ${await domClic(m, 'Retirer la ligne 3')}`); await dormir(1200);
    const f = await feuille(m); log(`  après : ${f.match(/\d+ ¦  lignes?/)?.[0]} · ${f.match(/Somme[^¦]*¦[^¦]*¦[^¦]*/)?.[0]} · ${f.match(/[^¦]*retir[^¦]*¦[^¦]*/gi)?.slice(0, 3).join(' / ')}`);
    log('  ' + await capture(m, 'm93-retrait')); await m.close();
    const p = await manuel(L, th);
    await saisir(p, '#purchase-total', '1'); await toucher(p, 'Règlement', { ms: 900 }); await toucher(p, 'À payer', { exact: true, ms: 900 });
    await taper(p, '[aria-label="Pour quoi ?"], input[placeholder^="Malt pour"]', 'ZZ TEST — v3 dépense');
    await toucher(p, 'Enregistrer la dépense', { label: true, ms: 3000 });
    log(`T3-6 ${L} après Enregistrer : dialog=${await p.evaluate(() => !!document.querySelector('[role=dialog]'))} · ${(await feuille(p)).slice(0, 400)}`);
    log('  ' + await capture(p, 't36-apres'));
    await toucher(p, 'Finances', { exact: true, ms: 2000 }); log(`  Finances : ${(await feuille(p)).match(/.{0,200}ZZ TEST.{0,200}/)?.[0] ?? 'ZZ TEST absent : ' + (await feuille(p)).slice(0, 500)}`); log('  ' + await capture(p, 't36-finances'));
    await p.close();
  }
  const q = await manuel(1280, 'clair');
  await toucher(q, 'Articles, stock et matériel', { ms: 1000 });
  await q.select('[aria-label="Stock ligne 1"]', (await q.$$eval('[aria-label="Stock ligne 1"] option', (o) => o.map((x) => [x.value, x.textContent]))).find(([, t]) => /Nouvel/.test(t))?.[0] ?? ''); await dormir(800);
  log(`nouvel article : ${(await feuille(q)).match(/Ce que tu achètes.{0,900}/)?.[0]}`); log(`  labels : ${JSON.stringify(await labels(q, 'ligne|unit'))}`); log(await capture(q, 'recon-nouvel'));
  await q.close();
} finally { await nav.close(); ecrireJournal('journal-g4'); }
