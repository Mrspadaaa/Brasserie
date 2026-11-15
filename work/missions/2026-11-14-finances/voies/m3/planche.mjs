// planche.mjs <ids> <sortie.png> : met côte à côte les captures (contrôle visuel du concepteur)
import { writeFileSync } from 'node:fs';
import { ouvrir } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
const D = new URL('./', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');
const [ids, out] = [process.argv[2].split(','), process.argv[3]];
writeFileSync(D + 'planche.html', `<body style="margin:0;background:#888;display:flex;gap:6px;padding:6px;align-items:flex-start;font:14px sans-serif">${ids.map(i => `<div><b style="color:#fff">${i}</b><br><img src="${i}/${i}.png" style="width:390px"></div>`).join('')}</body>`);
const { browser, page } = await ouvrir({ largeur: 400 * ids.length + 10, hauteur: 900, mobile: false, echelle: 1 });
await page.goto('file:///' + D + 'planche.html'); await new Promise(r => setTimeout(r, 600));
await page.screenshot({ path: out, fullPage: true }); await browser.close();
