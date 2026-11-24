import { ouvrir, sleep, photo, log, toucher, glisser, ou, taper } from './outil.mjs';
import { etat } from './lire.mjs';
const { page, cdp, lacher } = await ouvrir();
const pas = async (nom, f, demi = false) => { if (f) await f(); await sleep(1200); await photo(page, nom, demi); const e = await etat(page); log(nom, e); return e; };
await pas('R1-03-plage4ans-frise', async () => { const r = await ou(page, 'Fermer', 'button'); await toucher(cdp, r.x, r.y); await sleep(600); await page.evaluate(() => scrollTo(0, 0)); });
const poignee = (d) => ou(page, d === 'fin' ? 'Poignée de fin' : 'Poignée de début', 'button,[role=button],[role=slider]');
// poignée de fin tenue, tirée vers la gauche (réduire) puis à droite
let p = await poignee('fin'); log('poignée fin', p);
await pas('R1-04-fin-gauche', async () => glisser(cdp, p.x, p.y, p.x - 90, p.y, { tenir: 350, pendant: async () => { await photo(page, 'R1-04p-fin-gauche-pendant'); log('pendant', await etat(page)); } }));
p = await poignee('fin');
await pas('R1-05-fin-droite', async () => glisser(cdp, p.x, p.y, Math.min(385, p.x + 120), p.y, { tenir: 350 }));
p = await poignee('début'); log('poignée début', p);
await pas('R1-06-debut-gauche', async () => glisser(cdp, p.x, p.y, Math.max(2, p.x - 60), p.y, { tenir: 350, pendant: async () => { await photo(page, 'R1-06p-debut-pendant'); } }));
p = await poignee('début');
await pas('R1-07-debut-droite', async () => glisser(cdp, p.x, p.y, p.x + 70, p.y, { tenir: 350 }));
// le cadre entier glissé (déplacer)
const c = await page.evaluate(() => { const r = document.querySelector('.ent-cadre')?.getBoundingClientRect(); return r && { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
await pas('R1-08-cadre-glisse-droite', async () => glisser(cdp, c.x, c.y, c.x + 80, c.y, { tenir: 150 }));
lacher();
