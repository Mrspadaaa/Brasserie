// Preuve EN LIGNE du lot 4, NUIT-D1 : « 0110 » et « 1511 » tapés sans point posent la plage 01.10 → 15.11 (préférence d'affichage seulement,
// remise sur la période d’avant à la fin ; aucune donnée écrite). NUIT-F3 (Corriger l'inventaire) n'est pas rejoué en ligne : vider le champ d'un vrai article est interdit.
// node preuve-lot4-live.mjs <dossier captures>
import fs from 'node:fs';
import { ouvrir, cliquer, pause } from './lib.mjs';
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
const { page, fermer } = await ouvrir();
const res = []; const v = (id, ok, d) => { res.push({ id, ok }); console.log(`${ok ? 'OK' : 'KO'} ${id} ${JSON.stringify(d)}`); };
try {
  await page.goto('https://brasserie-l-affinee.web.app/', { waitUntil: 'domcontentloaded' }); await pause(9000);
  console.log('version', await page.evaluate(() => [...document.scripts].map(s => s.src).find(s => /index-/.test(s))?.split('/').pop()));
  await cliquer(page, 'Finances', 'nav', 1800); await cliquer(page, 'Opérations', 'body', 1500);
  const avant = await page.evaluate(() => document.querySelector("[aria-label^=\"Période :\"]")?.getAttribute("aria-label"));
  await page.evaluate(() => document.querySelector("[aria-label^=\"Période :\"]")?.click()); await pause(1200);
  if (!(await page.$("input[aria-label=\"Du (jj.mm)\"]"))) await page.screenshot({ path: `${out}/P00-sans-feuille.png` });
  const taper = async (lab, t) => { const el = await page.$(`input[aria-label="${lab}"]`); const b = await el.boundingBox(); await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await pause(300); await page.keyboard.type(t, { delay: 60 }); await pause(500); return el.evaluate(e => e.value); };
  const du = await taper('Du (jj.mm)', '0110'); const au = await taper('Au (jj.mm)', '1511'); await pause(800);
  const titre = await page.evaluate(() => document.querySelector('[role=dialog]')?.innerText.split('\n').slice(0, 2).join(' '));
  v('periode-sans-point', du === '01.10' && au === '15.11' && /1er oct\.? → 15 nov/.test(titre ?? ''), { avant, du, au, titre });
  await page.screenshot({ path: `${out}/P01-periode-0110.png` });
  // Remise de la période d’avant (« Tout » ou « Ce mois »).
  const rac = /Tout|toutes/i.test(avant ?? '') ? 'Tout' : 'Ce mois';
  await page.evaluate((r) => [...document.querySelectorAll('[role=dialog] [aria-label="Raccourcis de période"] button')].find(b => b.textContent.trim() === r)?.click(), rac); await pause(800);
  console.log('remis', await page.evaluate(() => document.querySelector('[role=dialog]')?.innerText.split('\n')[0]));
} finally { await fermer(); }
const ko = res.filter(r => !r.ok); console.log(ko.length ? `PREUVE KO ${ko.length}/${res.length}` : `PREUVE OK ${res.length}/${res.length}`);
