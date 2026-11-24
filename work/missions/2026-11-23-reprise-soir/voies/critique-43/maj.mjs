// Avis « Nouvelle version » : attendre, capturer, Recharger ; sinon update SW + reload. Vérifie le paquet servi.
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
const { page, cdp, lacher } = await ouvrir();
setTimeout(() => { log('MAJ délai'); lacher(); process.exit(2); }, 200000);
const avis = () => page.evaluate(() => { const e = [...document.querySelectorAll('*')].filter((x) => x.childElementCount === 0 && /Nouvelle version/.test(x.textContent) && x.getBoundingClientRect().width > 0)[0]; if (!e) return null; const p = e.parentElement.getBoundingClientRect(); return { t: e.parentElement.innerText.replace(/\n/g, ' '), l: Math.round(p.left), top: Math.round(p.top), w: Math.round(p.width), h: Math.round(p.height) }; });
const src = () => page.evaluate(() => [...document.scripts].map((s) => s.src).filter((s) => /index-/.test(s)));
log('MAJ src', await src());
log('MAJ sw update', await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); if (!r) return 'pas de SW'; await r.update(); return { active: r.active && r.active.scriptURL, waiting: !!r.waiting, installing: !!r.installing }; }));
for (let i = 0; i < 20 && !(await avis()); i++) await sleep(3000);
const a = await avis(); log('MAJ avis', a);
if (a) { await photo(page, 'M1-avis'); const r = await ou(page, 'Recharger', 'button'); log('MAJ recharger', r); if (r) { await toucher(cdp, r.x, r.y); await sleep(7000); } }
for (let k = 0; k < 3 && !(await src()).some((x) => /QdtCMGhp/.test(x)); k++) { await page.reload({ waitUntil: 'networkidle2' }); await sleep(5000); log('MAJ reload', k, await src(), 'avis', await avis()); if (await avis()) { await photo(page, `M1-avis-${k}`); const r = await ou(page, 'Recharger', 'button'); if (r) { await toucher(cdp, r.x, r.y); await sleep(7000); } } }
log('MAJ src fin', await src());
await photo(page, 'M2-apres');
lacher(); process.exit(0);
