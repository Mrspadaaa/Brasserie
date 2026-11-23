// node bouton.mjs <photo> <texte> [attente ms] : un toucher, une capture, le texte autour de ZZ
import { ouvrir, sleep, photo, log, ou, toucher } from './outil.mjs';
const [nom, txt, ms = '1500'] = process.argv.slice(2);
const { page, cdp, lacher } = await ouvrir();
const r = await ou(page, txt, 'button,[role=button]'); if (!r) { log(nom, 'INTROUVABLE', txt); lacher(); process.exit(0); }
await sleep(400); const r2 = await ou(page, txt, 'button,[role=button]');
await toucher(cdp, r2.x, r2.y); await sleep(Number(ms));
await photo(page, nom);
const tx = (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ');
const i = Math.max(0, tx.indexOf('ZZ TEST — tour 28')); log(nom, txt, '→', tx.slice(i, i + 420));
log(nom, 'focus', await page.evaluate(() => ({ tag: document.activeElement?.tagName, ph: document.activeElement?.placeholder, v: document.activeElement?.value })));
lacher();
