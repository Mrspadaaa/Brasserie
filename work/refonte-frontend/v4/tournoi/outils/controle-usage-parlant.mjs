// D90 et D91 (19.10, soir), deux plaintes du brasseur sur l8e, capture à l'appui.
//   D90 « Les icône sont pas parlant du tout » (entourés dans la légende : la goutte pour amérisant, le
//       souffle pour aromatique, les deux pour double usage). Règle : chaque usage visible
//       ([data-role="usage"]) se lit sans légende, par un mot visible dans l'élément : amer(isant),
//       arôme / aromatique, mixte, double. Un picto peut l'accompagner, jamais le remplacer.
//   D91 « Ça c'est inutile » (entourée : la bande « ‹ visée | visée » et ses deux flèches d'axe, au-dessus
//       des voies). Règle : hors des objectifs ([data-role="objectif"]), aucune étiquette visible dont
//       tout le texte est « visée » ; la visée se dit sur la piste de l'objectif (D92), pas dans une
//       bande d'axe.
// Usage : node controle-usage-parlant.mjs <dossier> [ids…] [--page=etat-b.html] ; imprime PARLANT OK,
// ou PARLANT ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const only = args.filter((a) => !a.startsWith('--')).slice(1);
const pg = (args.find((a) => a.startsWith('--page=')) || '--page=etat-b.html').slice(7);
const ids = (only.length ? only : fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, pg)))).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
for (const id of ids) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.join(dir, id, pg)).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  const r = await page.evaluate(() => {
    const vis = (e) => { if (e.closest('[hidden]')) return false; const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05; };
    const MOT = /\b(amer|amérisant|amérisante|arôme|aromatique|mixte|double)\b/i;
    const usages = [...document.querySelectorAll('[data-role="usage"]')].filter(vis).filter((e) => !e.closest('[data-role="legende"]'));
    const muets = usages.filter((e) => !MOT.test((e.innerText || '').replace(/\s+/g, ' ')));
    const visee = [...document.querySelectorAll('body *')].filter((e) => vis(e) && !e.closest('[data-role="legende"], [data-role="objectif"]') && (e.innerText || '').trim().toLowerCase() === 'visée' && ![...e.children].some((c) => (c.innerText || '').trim().toLowerCase() === 'visée'));
    return { n: usages.length, muets: muets.map((e) => (e.dataset.houblon || '?') + ' (' + (e.dataset.usage || '?') + ')'), visee: visee.length };
  });
  await page.close();
  if (r.muets.length) problems.push(id + ' ' + pg + ' : D90, ' + r.muets.length + ' usage(s) sur ' + r.n + ' sans mot (' + [...new Set(r.muets)].slice(0, 5).join(', ') + ')');
  if (r.visee) problems.push(id + ' ' + pg + ' : D91, ' + r.visee + ' étiquette(s) d\'axe « visée »');
  console.log(id + ' · ' + r.n + ' usages, ' + r.muets.length + ' sans mot · ' + r.visee + ' étiquette(s) « visée »');
}
await browser.close();
if (problems.length) { console.log('PARLANT ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exit(1); }
console.log('PARLANT OK');
