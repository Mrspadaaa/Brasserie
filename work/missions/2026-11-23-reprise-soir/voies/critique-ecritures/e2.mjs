import { ouvrir, sleep, photo, log } from './outil.mjs';
import { outils, texte } from './commun.mjs';
import fs from 'node:fs';
const { page, cdp, lacher } = await ouvrir();
const o = outils(page, cdp);
const s = await o.soldes('AVANT'); fs.writeFileSync('avant.json', JSON.stringify(s, null, 1));
await o.nav('Finances');
await o.plus(); await photo(page, 'E2-plus'); log('plus', await o.b());
lacher();
