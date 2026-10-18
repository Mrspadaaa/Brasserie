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

// D34 (18.10, soir), sur « 10′ s'allume et l'IBU affiche 22 en direct » : « Je veux choisir pas
// de 10' défini, pas de timing imposé hein » ; puis : « Soit pas supide, c'est des tranche de
// 5'. » Le rail d'ébullition se règle par tranches de 5′ : lâcher la ligne entre deux repères
// donne une minute multiple de 5, pas forcément un repère (45′, 35′, 20′…), et l'IBU de cette
// minute ; deux lâchers différents donnent deux minutes et deux IBU.
// D36 : « Parcontre prendre en compte que le boil peut durer 120' ou d'autres timing que 60 » :
// sur cas-ebu120.html (même recette, ébullition de 120′), le rail commence à 120′
// (data-etape="b120") et une ligne se pose au-delà de 60′.
const STANDARD = new Set([60, 30, 15, 10, 5, 0]);
async function libre(page, p) {
  const minutes = [];
  for (const f of [0.42, 0.77]) {
    const a = await etat(page);
    if (!a.poignee) return;
    const y60 = a.etapes.find((e) => e.code === 'b60')?.y, y10 = a.etapes.find((e) => e.code === 'b10')?.y;
    if (y60 === undefined || y10 === undefined) { p('D34 : le rail ne montre pas les repères 60′ et 10′ (data-etape b60, b10)'); return; }
    const yc = y60 + (y10 - y60) * f;
    const t = await page.touchscreen.touchStart(a.poignee.x, a.poignee.y);
    for (let i = 1; i <= 12; i++) { await t.move(a.poignee.x, a.poignee.y + ((yc - a.poignee.y) * i) / 12); await wait(25); }
    await t.end();
    await wait(500);
    const b = await etat(page, a.cle);
    const m = (b.quand || '').match(/(\d+)\s*(′|'|min)/);
    minutes.push({ min: m ? Number(m[1]) : null, ibu: b.ibu, quand: b.quand });
  }
  if (minutes.some((x) => x.min === null)) p('D34 : lâchée entre deux repères, la ligne ne dit pas sa minute (« ' + minutes.map((x) => x.quand).join(' », « ') + ' »)');
  else if (minutes.some((x) => x.min % 5)) p('D34 : minute hors des tranches de 5′ (' + minutes.map((x) => x.min + '′').join(', ') + ')');
  else if (minutes.every((x) => STANDARD.has(x.min))) p('D34 : la ligne s\'accroche aux repères (' + minutes.map((x) => x.min + '′').join(', ') + ') : timing imposé');
  else if (minutes[0].min === minutes[1].min || minutes[0].ibu === minutes[1].ibu) p('D34 : deux lâchers différents donnent la même minute ou le même IBU (' + minutes.map((x) => x.min + '′ ' + x.ibu).join(' ; ') + ')');
}

// D35 (18.10, soir) : « Ça semble un peu bancale, c'est l'idée mais pas hyper bien réalisé »
// (capture pendant le glissement : la carte passe sous Motueka, recouvre « Ajouter » et une
// carte, deux pastilles « 10′ » se chevauchent, un trou reste à l'origine). Mesuré le doigt
// posé, à mi-chemin, puis après le lâcher. Convention : l'élément qui suit le doigt porte
// data-glisse. Échoue si : (a) il n'est pas au-dessus de tout en son centre ; (b) il cache au
// moins 30 % d'un autre texte (les autres lignes s'écartent pour lui faire place) ; (c) deux
// textes visibles se chevauchent ; (d) un vide de plus de 64 px s'ouvre dans la colonne du
// rail (pendant, ou après le lâcher).
const propre = (page) => page.evaluate(() => {
  const out = [];
  const g = document.querySelector('[data-glisse]');
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.2; };
  const feuilles = [...document.querySelectorAll('body *')].filter((e) => vis(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
  const inter = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  if (g) {
    const r = g.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(14, r.height / 2));
    if (top && !g.contains(top)) out.push('la ligne glissée passe sous un autre élément');
    const caches = feuilles.filter((e) => !g.contains(e)).filter((e) => { const b = e.getBoundingClientRect(); return inter(r, b) > 0.3 * b.width * b.height; });
    if (caches.length) out.push('la ligne glissée cache ' + caches.length + ' texte(s) (« ' + caches[0].innerText.trim().slice(0, 18) + ' ») au lieu de se faire une place');
  }
  const libres = feuilles.filter((e) => !g || !g.contains(e));
  let chev = 0, ex = '';
  for (let i = 0; i < libres.length; i++) for (let j = i + 1; j < libres.length; j++) {
    const a = libres[i], b = libres[j];
    if (a.contains(b) || b.contains(a)) continue;
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    if (inter(ra, rb) > 0.3 * Math.min(ra.width * ra.height, rb.width * rb.height)) { chev++; ex = ex || a.innerText.trim().slice(0, 10) + ' / ' + b.innerText.trim().slice(0, 10); }
  }
  if (chev) out.push(chev + ' chevauchement(s) de textes (' + ex + ')');
  // Vide dans la colonne du rail : du premier au dernier repère data-etape.
  const et = [...document.querySelectorAll('[data-etape]')].map((e) => e.getBoundingClientRect()).filter((r) => r.height > 0);
  if (et.length) {
    const y0 = Math.max(0, Math.min(...et.map((r) => r.top))), y1 = Math.min(innerHeight, Math.max(...et.map((r) => r.bottom)));
    const rows = new Uint8Array(Math.max(0, Math.ceil(y1 - y0)));
    for (const e of feuilles) { const b = e.getBoundingClientRect(); for (let y = Math.max(y0, Math.floor(b.top)); y < Math.min(y1, Math.ceil(b.bottom)); y++) rows[y - Math.floor(y0)] = 1; }
    for (const e of document.querySelectorAll('[data-role="ligne-houblon"], [data-role="ajout-rapide"], input, [data-etape], [data-etape] > *')) { const b = e.getBoundingClientRect(); if (!b.height) continue; for (let y = Math.max(y0, Math.floor(b.top)); y < Math.min(y1, Math.ceil(b.bottom)); y++) rows[y - Math.floor(y0)] = 1; }
    let run = 0, max = 0; for (const v of rows) { run = v ? 0 : run + 1; max = Math.max(max, run); }
    if (max > 64) out.push('vide de ' + max + ' px dans la colonne du rail');
  }
  return out;
});
async function geste(page, p) {
  const a = await etat(page);
  if (!a.poignee) return;
  const y60 = a.etapes.find((e) => e.code === 'b60')?.y, y10 = a.etapes.find((e) => e.code === 'b10')?.y;
  if (y60 === undefined || y10 === undefined) return;
  const yc = y60 + (y10 - y60) * 0.6;
  const t = await page.touchscreen.touchStart(a.poignee.x, a.poignee.y);
  for (let i = 1; i <= 10; i++) { await t.move(a.poignee.x, a.poignee.y + ((yc - a.poignee.y) * i) / 10); await wait(25); }
  await wait(200);
  if (!(await page.$('[data-glisse]'))) p('D35 : pendant le glissement, rien ne porte data-glisse (l\'élément qui suit le doigt)');
  for (const x of await propre(page)) p('D35 pendant : ' + x);
  await t.end();
  await wait(500);
  for (const x of await propre(page)) p('D35 après : ' + x);
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
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await wait(300);
  await libre(page, p);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await wait(300);
  await geste(page, p);
  await page.close();
  // D36 : ébullition de 120′.
  const f120 = path.join(dir, id, 'cas-ebu120.html');
  if (!fs.existsSync(f120)) p('D36 : cas-ebu120.html absente (la même recette avec une ébullition de 120′)');
  else {
    const q = await browser.newPage();
    await q.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await q.goto(pathToFileURL(f120).href, { waitUntil: 'networkidle0', timeout: 30000 });
    await wait(300);
    const a = await etat(q);
    const y120 = a.etapes.find((e) => e.code === 'b120')?.y, y60 = a.etapes.find((e) => e.code === 'b60')?.y;
    if (y120 === undefined) p('D36 : à 120′ d\'ébullition, le rail ne commence pas à 120′ (data-etape="b120")');
    else if (y60 === undefined || !a.poignee) p('D36 : à 120′, pas de repère 60′ ou pas de poignée sur la première ligne');
    else {
      const yc = y120 + (y60 - y120) * 0.45;
      const t = await q.touchscreen.touchStart(a.poignee.x, a.poignee.y);
      for (let i = 1; i <= 12; i++) { await t.move(a.poignee.x, a.poignee.y + ((yc - a.poignee.y) * i) / 12); await wait(25); }
      await t.end();
      await wait(500);
      const b = await etat(q, a.cle);
      const m = (b.quand || '').match(/(\d+)\s*(′|'|min)/);
      if (!m || !(Number(m[1]) > 60) || Number(m[1]) % 5) p('D36 : à 120′, une ligne lâchée entre 120′ et 60′ ne se pose pas au-delà de 60′ par tranche de 5′ (« ' + b.quand + ' »)');
    }
    await q.close();
  }
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
