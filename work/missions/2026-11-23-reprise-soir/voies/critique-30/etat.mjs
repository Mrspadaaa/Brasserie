// node etat.mjs <nom> : photo + texte de l'écran courant (sans geste)
import { ouvrir, sleep, photo, log } from './outil.mjs';
const { page, lacher } = await ouvrir();
await photo(page, process.argv[2], process.argv[3] === 'entiere');
log(process.argv[2], (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ').slice(140, 1400));
lacher();
