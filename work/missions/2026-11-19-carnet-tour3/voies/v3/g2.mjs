import { lancer, ouvrir, feuilleDepense, capture, champs, boutons, log, toucher, ecrireJournal, dormir } from './outil.mjs';
const nav = await lancer();
const feuille = (p) => p.evaluate(() => (document.querySelector('[role=dialog]')?.innerText ?? document.body.innerText).replace(/[\u00a0\u202f]/g, ' ').replace(/\n+/g, ' ¦ ').slice(0, 1500));
const labels = (p, re) => p.evaluate((r) => [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).filter((l) => new RegExp(r, 'i').test(l)).slice(0, 30), re);
try {
  const m = await feuilleDepense(nav, '3', 1280, 'clair');
  log(`M9-3 labels retir : ${JSON.stringify(await labels(m, 'retir|supprim|enlever'))}`);
  log(`M9-3 labels ligne 3 : ${JSON.stringify(await labels(m, 'ligne 3\b'))}`);
  await m.close();
  const r = await feuilleDepense(nav, 'medicament', 1280, 'clair');
  log(`med : ${await feuille(r)}`); log(`med champs : ${JSON.stringify(await champs(r)).slice(0, 800)}`); log(`med labels ligne 1 : ${JSON.stringify(await labels(r, 'ligne 1\b'))}`); log(await capture(r, 'recon-med'));
  await r.close();
  const s = await feuilleDepense(nav, 'v3-lent', 1280, 'clair');
  log(`Sabro : ${await s.evaluate(() => [...document.querySelectorAll('li, [role=row], [data-dp-ligne]')].filter((e) => /Sabro|Citra/.test(e.innerText) && e.innerText.length < 200).map((e) => e.innerText.replace(/\n+/g, ' ¦ ') + ' || barré: ' + [...e.querySelectorAll('*')].filter((x) => getComputedStyle(x).textDecorationLine.includes('line-through')).map((x) => x.outerHTML.slice(0, 160)).join(' ; ')).slice(0, 4).join(' ## '))}`);
  await s.close();
  const p = await ouvrir(nav, '?dev-local', 1280, 'clair');
  await p.waitForSelector('[aria-label="Actions rapides"]', { timeout: 90000 }); await p.click('[aria-label="Actions rapides"]'); await dormir(800);
  await toucher(p, 'Facture, photo ou PDF', { label: true, ms: 1200 }); log(`scan : ${(await feuille(p)).slice(0, 500)}`); log(`  boutons : ${JSON.stringify(await boutons(p)).slice(0, 700)}`);
  await toucher(p, 'Saisir sans justificatif', { ms: 1200 });
  log(`manuel : ${await feuille(p)}`); log(`champs : ${JSON.stringify(await champs(p)).slice(0, 900)}`); log(`boutons : ${JSON.stringify(await boutons(p)).slice(0, 1200)}`); log(await capture(p, 'recon-manuel'));
  await p.close();
} finally { await nav.close(); ecrireJournal('journal-g2'); }
