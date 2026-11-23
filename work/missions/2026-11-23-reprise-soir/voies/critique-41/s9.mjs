import { ouvrir, log } from './outil.mjs';
import { outils } from './commun.mjs';
import fs from 'node:fs';
const { page, cdp, lacher } = await ouvrir();
setTimeout(() => { lacher(); process.exit(2); }, 120000);
const s = await outils(page, cdp).soldes('S9');
s.periode = await page.evaluate(() => localStorage.getItem('laffinee.calendrier.fenetre-locale'));
fs.writeFileSync('apres.json', JSON.stringify(s, null, 1));
lacher(); process.exit(0);
