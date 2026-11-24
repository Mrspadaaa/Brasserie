import { ouvrir, log } from './outil.mjs';
import { outils } from './commun.mjs';
import fs from 'node:fs';
const { page, cdp, lacher } = await ouvrir();
setTimeout(() => { lacher(); process.exit(2); }, 120000);
const s = await outils(page, cdp).soldes('S0');
const a = JSON.parse(fs.readFileSync('avant.json', 'utf8')); a.sCRA3 = s; fs.writeFileSync('avant.json', JSON.stringify(a, null, 1));
lacher(); process.exit(0);
