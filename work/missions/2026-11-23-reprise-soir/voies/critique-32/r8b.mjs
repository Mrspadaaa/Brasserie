import { ouvrir, sleep, photo, log, toucher, ou } from './outil.mjs';
import { etat } from './lire.mjs';
import { court } from './commun.mjs';
const { page, cdp, lacher } = await ouvrir();
const agenda = () => page.evaluate(() => { const t = document.body.innerText; const i = t.indexOf('Agenda'); return i < 0 ? '(pas d’agenda)' : t.slice(i, i + 330).replace(/\n+/g, ' | '); });
const cases = () => page.evaluate(() => [...document.querySelectorAll('input[type=checkbox],[role=checkbox]')].filter((c) => c.getBoundingClientRect().width > 0 || c.closest('label')?.getBoundingClientRect().width > 0).map((c) => { const e = c.getBoundingClientRect().width > 0 ? c : c.closest('label'); const r = e.getBoundingClientRect(); return { a: c.getAttribute('aria-label'), checked: c.checked ?? c.getAttribute('aria-checked'), x: r.left + r.width / 2, y: r.top + r.height / 2 }; }));
log('url', page.url());
await page.evaluate(() => { const x = [...document.querySelectorAll('body *')].find((x) => x.childElementCount === 0 && /ZZ TEST/.test(x.textContent)); x?.scrollIntoView({ block: 'center' }); }); await sleep(600);
await photo(page, 'R11-02-case-zz', false);
log('agenda', await agenda()); const c = await cases(); log('cases', c);
const z = c.find((x) => /ZZ TEST/.test(x.a || ''));
if (z && (z.checked === true || z.checked === 'true')) { await toucher(cdp, z.x, z.y); await sleep(1500); log('décoché ->', (await cases()).filter((x) => /ZZ|vi|Marché/.test(x.a || ''))); log('agenda', await agenda()); await photo(page, 'R11-03-decoche', true); }
const cs = await ou(page, 'Cette semaine au calendrier', 'button,a,[role=button]');
if (cs) { await toucher(cdp, cs.x, cs.y); await sleep(2500); await photo(page, 'R11-04-cette-semaine', false); log('cette semaine →', court(await etat(page)), (await etat(page)).periode); }
lacher();
