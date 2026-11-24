// Avis « Nouvelle version » : présence, position, Recharger ; vérifie le paquet servi
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
import { outils } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
setTimeout(() => { log('MAJ délai'); lacher(); process.exit(2); }, 150000);
const avis = () => page.evaluate(() => { const e = [...document.querySelectorAll('*')].filter((x) => x.childElementCount === 0 && /Nouvelle version/.test(x.textContent) && x.getBoundingClientRect().width > 0)[0]; if (!e) return null; const p = e.parentElement.getBoundingClientRect(); return { t: e.parentElement.innerText.replace(/\n/g, ' '), l: Math.round(p.left), top: Math.round(p.top), w: Math.round(p.width), h: Math.round(p.height) }; });
const src = () => page.evaluate(() => [...document.scripts].map((s) => s.src).filter((s) => /index-/.test(s)));
log('MAJ src', await src(), 'avis', await avis());
await photo(page, 'M0-saisie-avis');
for (let i = 0; i < 20 && !(await avis()); i++) { await sleep(3000); }
const a = await avis(); log('MAJ avis après attente', a);
if (a) { await photo(page, 'M1-avis'); const r = await ou(page, 'Recharger', 'button'); log('MAJ recharger', r); if (r) { await toucher(cdp, r.x, r.y); await sleep(6000); } }
else { await page.reload({ waitUntil: 'networkidle2' }); await sleep(4000); }
log('MAJ src après', await src());
await o.nav('Calendrier'); await sleep(1500); await photo(page, 'M2-cal-apres', true);
log('MAJ avis fin', await avis());
lacher(); process.exit(0);
