import { lancer, ouvrir, feuilleDepense, capture, champs, boutons, log, toucher, ecrireJournal, dormir } from './outil.mjs';
const nav = await lancer();
const feuille = (p) => p.evaluate(() => (document.querySelector('[role=dialog]')?.innerText ?? document.body.innerText).replace(/[  ]/g, ' ').replace(/\n+/g, ' ¦ ').slice(0, 1500));
const sonde = (p, l) => p.evaluate((l) => [...document.querySelectorAll(`[aria-label="${l}"]`)].map((e) => { const r = e.getBoundingClientRect(); const c = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return `${e.tagName} ro=${e.readOnly} dis=${e.disabled} val=${e.value} vis=${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.x)},${Math.round(r.y)} dessus=${c === e || e.contains(c) ? 'lui' : (c?.tagName + '.' + String(c?.className).slice(0, 50) + ' «' + (c?.innerText ?? '').slice(0, 30) + '»')}`; }), l);
try {
  // LR1-7 sonde
  const r = await feuilleDepense(nav, 'medicament', 390, 'clair');
  log(`LR1-7 sonde : ${JSON.stringify(await sonde(r, 'Quantité ligne 1'))} | ${JSON.stringify(await sonde(r, 'Prix ligne 1'))}`);
  await toucher(r, 'MEFENACIDE', { ms: 900 }); log(`  après toucher la ligne : ${JSON.stringify(await sonde(r, 'Quantité ligne 1'))}`);
  const qs = await r.$$('[aria-label="Quantité ligne 1"]'); const ps = await r.$$('[aria-label="Prix ligne 1"]'); const ms = await r.$$('[aria-label="Montant ligne 1"]');
  const tape = async (e, v) => { await e.evaluate((x) => x.scrollIntoView({ block: 'center' })); await e.tap().catch(() => e.click()); await dormir(200); await r.keyboard.down('Control'); await r.keyboard.press('a'); await r.keyboard.up('Control'); await r.keyboard.press('Backspace'); if (v) await r.keyboard.type(v, { delay: 30 }); await r.keyboard.press('Enter'); await dormir(500); };
  if (ps.length) { await tape(ps.at(-1), ''); await tape(qs.at(-1), '2'); await tape(ms.at(-1), '50'); }
  log(`  champs : ${JSON.stringify((await champs(r)).filter((c) => /ligne 1/.test(c)))}`);
  log(`  déduit : ${await r.evaluate(() => [...document.querySelectorAll('[data-dp-prix-deduit]')].map((e) => `${e.innerText} [${getComputedStyle(e).color}] title=${e.title}`).join(' | ') || 'aucun')}`);
  log(`  texte : ${(await feuille(r)).match(/MEFENACIDE.{0,300}/)?.[0]}`); log('  ' + await capture(r, 'lr17-deduit')); await r.close();
  // M9-3 sonde du toucher
  const m = await feuilleDepense(nav, '3', 390, 'clair');
  const b = await m.$('[aria-label="Retirer la ligne 3"]'); await b.evaluate((x) => x.scrollIntoView({ block: 'center' })); await dormir(400);
  log(`M9-3 sonde : ${JSON.stringify(await sonde(m, 'Retirer la ligne 3'))}`); log('  ' + await capture(m, 'm93-bouton'));
  await b.tap(); await dormir(1200); log(`  après tap : ${(await feuille(m)).match(/\d+ ¦  lignes?/)?.[0]}`); await m.close();
  // BE-23 : « Stk » dans les états
  for (const e of ['3', 'reel-doc25', 'reel-doc14']) {
    const q = await feuilleDepense(nav, e, 1280, 'clair');
    log(`BE-23 ${e} : Stk=${await q.evaluate(() => /\bStk\b/.test(document.body.innerText))} barres=${JSON.stringify(await q.evaluate(() => [...document.querySelectorAll('span')].filter((s) => /^imprimé .* \? ·/.test(s.innerText)).map((s) => s.parentElement.innerText.replace(/\n+/g, ' ')).slice(0, 4)))}`);
    await q.close();
  }
  // BE-27
  for (const [L, th] of [[390, 'clair'], [1280, 'cave']]) {
    const s = await ouvrir(nav, '?dev-local', L, th);
    await toucher(s, 'Stocks', { exact: true, ms: 1500 }); await toucher(s, 'Matériel', { exact: true, ms: 1500 });
    if (!(await toucher(s, 'Enregistrer un achat', { ms: 1500 }))) log(`  matériel boutons : ${JSON.stringify((await boutons(s)).slice(18, 60))}`);
    log(`BE-27 ${L} : ${(await feuille(s)).slice(0, 500)}`);
    log(`  champs : ${JSON.stringify(await champs(s)).slice(0, 600)}`);
    if (await s.$('[aria-label="Matériel ligne 1"]')) { await s.select('[aria-label="Matériel ligne 1"]', 'new'); await dormir(700); }
    await s.evaluate(() => { const d = document.querySelector('[role=dialog]') ?? document; [...d.querySelectorAll('*')].filter((x) => x.scrollHeight > x.clientHeight + 20 && /auto|scroll/.test(getComputedStyle(x).overflowY)).forEach((x) => { x.scrollTop = x.scrollHeight; }); });
    await dormir(600);
    log(`  phrase : ${await s.evaluate(() => { const p = [...document.querySelectorAll('p')].find((x) => /La fiche reprendra/.test(x.innerText)); if (!p) return 'absente'; const a = p.getBoundingClientRect(); const btn = [...document.querySelectorAll('button')].find((x) => /Enregistrer/.test(x.innerText) && x.getClientRects().length); const c = btn?.getBoundingClientRect(); return `${p.innerText.slice(0, 90)} | p ${Math.round(a.top)}-${Math.round(a.bottom)} | bouton ${c ? Math.round(c.top) : '?'} | viewport ${innerHeight}`; })}`);
    log('  ' + await capture(s, 'be27-bas')); await s.close();
  }
  // E1-2 recon unité
  const q = await ouvrir(nav, '?dev-local', 390, 'clair'); await q.waitForSelector('[aria-label="Actions rapides"]'); await q.click('[aria-label="Actions rapides"]'); await dormir(800);
  await toucher(q, 'Facture, photo ou PDF', { label: true, ms: 1200 }); await toucher(q, 'Saisir sans justificatif', { ms: 1200 }); await toucher(q, 'Articles, stock et matériel', { ms: 1000 });
  log(`E1-2 labels : ${JSON.stringify(await q.evaluate(() => [...document.querySelectorAll('[aria-label]')].filter((e) => e.getClientRects().length).map((e) => e.getAttribute('aria-label')).filter((l) => /ligne|Unité/i.test(l))))}`);
  await q.close();
} finally { await nav.close(); ecrireJournal('journal-g5'); }
