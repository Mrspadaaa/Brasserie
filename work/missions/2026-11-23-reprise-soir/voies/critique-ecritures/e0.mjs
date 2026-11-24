import { ouvrir, sleep, photo, log, boutons, APP } from './outil.mjs';
import fs from 'node:fs';
const { page, lacher } = await ouvrir();
await page.goto(APP, { waitUntil: 'networkidle2' }); await sleep(3000);
log('paquet', await page.evaluate(() => [...document.scripts].map((s) => s.src).filter((s) => /index-/.test(s))));
await photo(page, 'E0-accueil');
log('boutons', await boutons(page));
log('texte', (await page.evaluate(() => document.body.innerText)).slice(0, 1500));
lacher();
