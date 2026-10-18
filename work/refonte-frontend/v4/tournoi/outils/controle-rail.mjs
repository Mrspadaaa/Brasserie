// D27 et D28 (18.10, soir), sur la capture de p2 avec une flèche de 60′ à 10′ :
// D27 : « j'aimerais aussi pouvoir une fois mon houblons sélectionner pouvoir glisser comme
//        un slider le moment de l'ajout » ;
// D28 : « J'aime beaucoup l'intégration de la levure directement dans la p8 mais la p2 a un
//        meilleur visuel ».
// Usage : node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs <dossier> [ids…]
// Convention auteur, sur index.html (l'étape) :
//   data-etape="<code>"            chaque étape du rail, codes du pack : fwh, b60, b30, b15,
//                                  b10, b5, b0, wp, dryActive, dryPost ; et "levure" ;
//   data-role="glisser-moment"     dans chaque ligne-houblon, la poignée qu'on glisse le long
//                                  du rail (la pastille du moment, ou la carte elle-même).
// Vérifie : (D28) une étape data-etape="levure" porte la levure (data-role="levure") et se
// place sur le rail après le whirlpool (wp) et avant le dry hop en fermentation (dryActive) ;
// (D27) à 390 px au doigt, puis à 1280 px à la souris, glisser la poignée de la première ligne
// jusqu'à une autre étape du rail change son moment (data-role="quand") et ses IBU, et range
// la ligne sous cette étape.
// Imprime RAIL OK si tout passe, sinon RAIL ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const dir = path.resolve(process.argv[2] || '.');
const only = process.argv.slice(3).filter((a) => !a.startsWith('--'));
const ids = fs.readdirSync(dir).filter((d) => /^p\d+$|^consolide$|^version-/.test(d) && fs.existsSync(path.join(dir, d, 'index.html')))
  .filter((d) => !only.length || only.includes(d)).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const problems = [];

// État de la première ligne : clé, moment, IBU, position ; et les étapes du rail.
const etat = (page, cle) => page.evaluate((cle) => {
  const lignes = [...document.querySelectorAll('[data-role="ligne-houblon"]')];
  const l = cle ? lignes.find((x) => x.querySelector('[data-houblon="' + cle + '"]') || x.getAttribute('data-houblon') === cle) : lignes[0];
  const etapes = [...document.querySelectorAll('[data-etape]')].map((e) => { const r = e.getBoundingClientRect(); return { code: e.getAttribute('data-etape'), y: r.top + r.height / 2, x: r.left + r.width / 2, levure: !!(e.matches('[data-role="levure"]') || e.querySelector('[data-role="levure"]')) }; });
  if (!l) return { etapes };
  const h = l.querySelector('[data-role="glisser-moment"]') || (l.matches('[data-role="glisser-moment"]') ? l : null);
  const hr = h ? h.getBoundingClientRect() : null;
  const q = l.querySelector('[data-role="quand"]');
  const ibu = (l.innerText.match(/(\d+([,.]\d+)?)\s*IBU|aucun IBU|sans IBU/i) || [''])[0];
  const k = l.querySelector('[data-houblon]')?.getAttribute('data-houblon') || l.getAttribute('data-houblon');
  return { cle: k, quand: q ? q.innerText.trim() : null, ibu, top: l.getBoundingClientRect().top, poignee: hr ? { x: hr.left + hr.width / 2, y: hr.top + hr.height / 2 } : null, etapes };
}, cle);

async function glisser(page, mode, id, p) {
  const a = await etat(page);
  if (!a.cle) { p('D27 : aucune ligne de houblon repérable (data-role="ligne-houblon" et data-houblon)'); return; }
  if (!a.poignee) { p('D27 : pas de poignée data-role="glisser-moment" sur la ligne « ' + a.cle + ' »'); return; }
  // Étape cible : la première étape du rail, sous la poignée, d'un autre moment que l'actuel.
  const cible = a.etapes.filter((e) => e.code !== 'levure' && e.y > a.poignee.y + 24).sort((x, y) => x.y - y.y)[0];
  if (!cible) { p('D27 : aucune autre étape du rail sous la ligne (data-etape)'); return; }
  const pas = 12;
  if (mode === 'doigt') {
    const t = await page.touchscreen.touchStart(a.poignee.x, a.poignee.y);
    for (let i = 1; i <= pas; i++) { await t.move(a.poignee.x, a.poignee.y + ((cible.y - a.poignee.y) * i) / pas); await wait(25); }
    await t.end();
  } else {
    await page.mouse.move(a.poignee.x, a.poignee.y);
    await page.mouse.down();
    for (let i = 1; i <= pas; i++) { await page.mouse.move(a.poignee.x, a.poignee.y + ((cible.y - a.poignee.y) * i) / pas); await wait(25); }
    await page.mouse.up();
  }
  await wait(500);
  const b = await etat(page, a.cle);
  const m = mode === 'doigt' ? '390 px, au doigt' : '1280 px, à la souris';
  if (b.quand === a.quand) p('D27 (' + m + ') : glisser « ' + a.cle + ' » vers ' + cible.code + ' ne change pas son moment (' + a.quand + ')');
  else if (b.ibu === a.ibu) p('D27 (' + m + ') : le moment change mais pas les IBU de la ligne (' + a.ibu + ')');
  const etapeApres = b.etapes.find((e) => e.code === cible.code);
  if (b.quand !== a.quand && etapeApres && !(b.top > etapeApres.y - 30)) p('D27 (' + m + ') : la ligne ne se range pas sous l\'étape ' + cible.code);
}

for (const id of ids) {
  const p = (m) => problems.push(id + ' : ' + m);
  const url = pathToFileURL(path.join(dir, id, 'index.html')).href;
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await wait(300);
  const e = await etat(page);
  const y = (c) => e.etapes.find((x) => x.code === c)?.y;
  const lev = e.etapes.find((x) => x.code === 'levure');
  if (!lev) p('D28 : la levure n\'est pas une étape du rail (data-etape="levure")');
  else {
    if (!lev.levure) p('D28 : l\'étape levure du rail ne porte pas la levure (data-role="levure")');
    if (y('wp') === undefined || y('dryActive') === undefined) p('D28 : le rail ne montre pas le whirlpool (wp) et le dry hop en fermentation (dryActive) autour de la levure');
    else if (!(y('wp') < lev.y && lev.y < y('dryActive'))) p('D28 : la levure n\'est pas entre le whirlpool et le dry hop en fermentation');
  }
  await glisser(page, 'doigt', id, p);
  await page.close();
  const d = await browser.newPage();
  await d.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  await d.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await wait(300);
  await glisser(d, 'souris', id, p);
  await d.close();
  console.log(id + ' · rail contrôlé');
}
await browser.close();
if (problems.length === 0) console.log('RAIL OK ' + ids.length + '/' + ids.length);
else { console.log('RAIL ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exitCode = 1; }
