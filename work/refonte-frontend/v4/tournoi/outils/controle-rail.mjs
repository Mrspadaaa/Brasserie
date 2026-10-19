// Contrôle du rail des étapes (étape houblons), réécrit le 18.10 au soir pour la loupe (D47).
// Les mots du brasseur, dans l'ordre où ils ont fait naître chaque règle :
//   D27 « j'aimerais aussi pouvoir une fois mon houblons sélectionner pouvoir glisser comme un
//       slider le moment de l'ajout » ;
//   D28 « J'aime beaucoup l'intégration de la levure directement dans la p8 mais la p2 a un
//       meilleur visuel » ;
//   D34 « Je veux choisir pas de 10' défini, pas de timing imposé hein » ; « Soit pas supide,
//       c'est des tranche de 5'. » ;
//   D35 « Ça semble un peu bancale, c'est l'idée mais pas hyper bien réalisé » ;
//   D36 « Parcontre prendre en compte que le boil peut durer 120' ou d'autres timing que 60 » ;
//   D37 « toujours garder des variables dynamique » ; puis « C'est defini ailleur dans
//       l'application... » (l'ébullition se lit dans la recette, elle ne se règle pas ici) ;
//   D41 « On a un 10' qui sort de null part. […] les possible ajoute d'houblon sont vraiment à
//       la bonne place ? » ; D42 « Pourquoi celui choisi à de l'ombre ? » ;
//   D43 « Que de j+3 » ; D44 « Que du j+3 SI on est en dehors du boil » ; « Le slider
//       fonctionne pour le boil mais pas pour les autres étape, pas dechelle pour les autres que
//       des choix fix » ; D45 « le passage entre 10' et 5' de fait très mal car on doit passe au
//       dessus des houblons... » ; D46 « Et le slider est clancky pas fluide du tout » ;
//       « Probablement lié au recalcule de l'ibu pas forcément utile à la volée instantané.. » ;
//   D47 « Pas besoin d'afficher une échelle linéaire avec tout les gradient du raille, ça doit
//       rester cohérent. Juste les affiches quand on est à cette emplacement lors du changement
//       avec le houblon. Genre quand on focus sur un type on affiche mieux l'échelle un peu un
//       truc type UX apple qui zoom focus la où on est. »
//
// Usage : node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs <dossier> [ids…]
// Convention auteur, sur l'étape (index.html et cas-*) :
//   data-etape="<code>"   les étapes nommées du rail, visibles au repos : wp (whirlpool),
//                         levure, dryActive (fermentation), dryPost (post-fermentation) ; et les
//                         graduations, qui portent aussi data-graduation="ebullition|whirlpool|
//                         fermentation|post" : b<minute> (par 5′), wp<°C> (par 5), f<jour>,
//                         p<jour> (J+0 à J+14). Les graduations sont CACHÉES au repos et seules
//                         celles du segment sous le doigt se montrent pendant le geste (loupe).
//   data-role="glisser-moment"  la poignée de chaque ligne-houblon ; data-glisse sur l'élément
//                         qui suit le doigt pendant le geste ; data-role="quand" le moment écrit.
//   data-role="ebullition"  la durée de la recette, avec un renvoi (lien ou
//                         data-action="renvoi-ebullition"), sans champ ni −/+.
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
const STANDARD = new Set([60, 30, 15, 10, 5, 0]);

// État : la ligne (clé, moment, IBU, poignée) et les étapes VISIBLES du rail.
const etat = (page, cle) => page.evaluate((cle) => {
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.15; };
  const lignes = [...document.querySelectorAll('[data-role="ligne-houblon"]')];
  const l = cle ? lignes.find((x) => x.querySelector('[data-houblon="' + cle + '"]') || x.getAttribute('data-houblon') === cle) : lignes[0];
  const etapes = [...document.querySelectorAll('[data-etape]')].filter(vis).map((e) => { const r = e.getBoundingClientRect(); return { code: e.getAttribute('data-etape'), grad: e.getAttribute('data-graduation'), y: r.top + r.height / 2, levure: !!(e.matches('[data-role="levure"]') || e.querySelector('[data-role="levure"]')) }; });
  if (!l) return { etapes };
  const h = l.querySelector('[data-role="glisser-moment"]') || (l.matches('[data-role="glisser-moment"]') ? l : null);
  const hr = h ? h.getBoundingClientRect() : null;
  const q = l.querySelector('[data-role="quand"]');
  const ibu = (l.innerText.match(/(\d+([,.]\d+)?)\s*IBU|aucun IBU|sans IBU/i) || [''])[0];
  const k = l.querySelector('[data-houblon]')?.getAttribute('data-houblon') || l.getAttribute('data-houblon');
  return { cle: k, quand: q ? q.innerText.trim() : null, ibu, top: l.getBoundingClientRect().top, poignee: hr ? { x: hr.left + hr.width / 2, y: hr.top + hr.height / 2 } : null, etapes };
}, cle);

// Un geste comme celui du brasseur : poser, attendre la loupe, aller vers une graduation (sa
// position est relue à chaque pas, la loupe pouvant la déplacer), lâcher.
async function poser(page, mode) {
  const a = await etat(page);
  if (!a.poignee) return null;
  let y = a.poignee.y;
  const x = a.poignee.x;
  let t = null;
  if (mode === 'souris') { await page.mouse.move(x, y); await page.mouse.down(); }
  else t = await page.touchscreen.touchStart(x, y);
  const bouger = async (ny) => { y = ny; if (t) await t.move(x, y); else await page.mouse.move(x, y); await wait(25); };
  await bouger(y + 3);
  await wait(200);
  return {
    a, x, get y() { return y; }, bouger,
    async vers(code) {
      for (let i = 0; i < 200; i++) {
        const e = (await etat(page)).etapes.find((s) => s.code === code);
        if (!e) {
          // Graduation encore cachée : approcher de l'étape nommée de son segment, ou descendre.
          const seg = /^wp\d/.test(code) ? 'wp' : /^f\d/.test(code) ? 'dryActive' : /^p\d/.test(code) ? 'dryPost' : null;
          const s = seg && (await etat(page)).etapes.find((q) => q.code === seg);
          await bouger(s ? y + Math.sign(s.y + 6 - y) * Math.min(10, Math.abs(s.y + 6 - y)) : y + 6);
          continue;
        }
        const dy = e.y - y;
        if (Math.abs(dy) < 1.5) return true;
        await bouger(y + Math.sign(dy) * Math.min(8, Math.abs(dy)));
      }
      return false;
    },
    async lacher() { if (t) await t.end(); else await page.mouse.up(); await wait(450); },
  };
}
async function lacherSur(page, code, mode = 'doigt') {
  const g = await poser(page, mode);
  if (!g) return { ok: false, apres: null, avant: null };
  const ok = await g.vers(code);
  await g.lacher();
  return { ok, avant: g.a, apres: await etat(page, g.a.cle) };
}
const minute = (q) => { const m = (q || '').match(/(\d+)\s*(′|'|min)/); return m ? Number(m[1]) : null; };

// D35 : propreté du geste (le doigt posé, puis après le lâcher).
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
  const et = [...document.querySelectorAll('[data-etape]')].map((e) => e.getBoundingClientRect()).filter((r) => r.height > 0);
  if (et.length) {
    const y0 = Math.max(0, Math.min(...et.map((r) => r.top))), y1 = Math.min(innerHeight, Math.max(...et.map((r) => r.bottom)));
    const rows = new Uint8Array(Math.max(0, Math.ceil(y1 - y0)));
    for (const e of [...feuilles, ...document.querySelectorAll('[data-role="ligne-houblon"], [data-role="ajout-rapide"], input, [data-etape], [data-etape] > *')]) { const b = e.getBoundingClientRect(); if (!b.height) continue; for (let y = Math.max(y0, Math.floor(b.top)); y < Math.min(y1, Math.ceil(b.bottom)); y++) rows[y - Math.floor(y0)] = 1; }
    let run = 0, max = 0; for (const v of rows) { run = v ? 0 : run + 1; max = Math.max(max, run); }
    if (max > 64) out.push('vide de ' + max + ' px dans la colonne du rail');
  }
  return out;
});
const ombre = (page) => page.evaluate(() => [...document.querySelectorAll('[data-role="ligne-houblon"], [data-glisse]')].filter((e) => getComputedStyle(e).boxShadow !== 'none').length);
const gradsVisibles = (page) => page.evaluate(() => [...document.querySelectorAll('[data-graduation]')].filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.15; }).map((e) => { const r = e.getBoundingClientRect(); return { seg: e.getAttribute('data-graduation'), code: e.getAttribute('data-etape'), y: r.top + r.height / 2 }; }));

async function ouvrir(f, w = 390) {
  const page = await browser.newPage();
  if (w === 390) await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  else await page.setViewport({ width: w, height: 900, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(f).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await wait(300);
  return page;
}

for (const id of ids) {
  const p = (m) => problems.push(id + ' : ' + m);
  const index = path.join(dir, id, 'index.html');
  let page = await ouvrir(index);
  const recharger = async () => { await page.close(); page = await ouvrir(index); };
  const e = await etat(page);
  if (!e.cle) { p('D27 : aucune ligne de houblon repérable (data-role="ligne-houblon" et data-houblon)'); await page.close(); continue; }
  if (!e.poignee) { p('D27 : pas de poignée data-role="glisser-moment" sur la première ligne'); await page.close(); continue; }
  const y = (c) => e.etapes.find((x) => x.code === c)?.y;
  // D28 : la levure, étape du rail entre le whirlpool et la fermentation.
  const lev = e.etapes.find((x) => x.code === 'levure');
  if (!lev) p('D28 : la levure n\'est pas une étape du rail (data-etape="levure")');
  else {
    if (!lev.levure) p('D28 : l\'étape levure du rail ne porte pas la levure (data-role="levure")');
    if (y('wp') === undefined || y('dryActive') === undefined) p('D28 : le rail ne montre pas le whirlpool (wp) et la fermentation (dryActive) autour de la levure');
    else if (!(y('wp') < lev.y && lev.y < y('dryActive'))) p('D28 : la levure n\'est pas entre le whirlpool et la fermentation');
  }
  // D47 : au repos, aucune graduation ; D41 : le rail ne porte que la recette ; D42 : pas d'ombre.
  const repos = await gradsVisibles(page);
  if (repos.length) p('D47 : au repos, ' + repos.length + ' graduation(s) visibles : l\'échelle ne s\'ouvre que sous le doigt');
  const r41 = await page.evaluate(() => {
    const out = [];
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const dansRail = [...document.querySelectorAll('[data-role="ajout-rapide"]')].filter(vis).filter((a) => a.closest('[data-etape]'));
    if (dansRail.length) out.push(dansRail.length + ' ajout(s) proposé(s) rangé(s) dans une étape du rail');
    const quand = new Set([...document.querySelectorAll('[data-role="ligne-houblon"] [data-role="quand"]')].map((q) => (q.innerText.match(/(\d+)\s*(′|')/) || [])[1]).filter(Boolean).map(Number));
    const eb = (document.querySelector('[data-role="ebullition"]')?.innerText.match(/(\d+)\s*(′|')/) || [])[1];
    if (eb) quand.add(Number(eb));
    quand.add(0);
    const lignes = [...document.querySelectorAll('[data-role="ligne-houblon"], [data-role="ajout-rapide"]')];
    const libres = [...document.querySelectorAll('[data-etape], [data-etape] *')].filter(vis).filter((x) => !lignes.some((l) => l.contains(x)))
      .filter((x) => [...x.childNodes].some((n) => n.nodeType === 3 && /^\s*\d+\s*(′|')\s*$/.test(n.textContent)))
      .map((x) => Number(x.innerText.match(/\d+/)[0])).filter((m) => !quand.has(m));
    if (libres.length) out.push('minute(s) écrite(s) sur le rail sans ligne de la recette : ' + [...new Set(libres)].map((m) => m + '′').join(', '));
    return out;
  });
  for (const x of r41) p('D41 : ' + x);
  if (await ombre(page)) p('D42 : au repos, une carte du rail porte une ombre');
  // D37 : l'ébullition lue dans la recette, avec un renvoi.
  const eb = await page.evaluate(() => {
    const el = document.querySelector('[data-role="ebullition"]');
    if (!el) return null;
    return { valeur: /\d+\s*(′|'|min)/.test(el.innerText), champ: !!el.querySelector('input, select, textarea') || el.matches('input'), plusMoins: !!document.querySelector('[data-action="ebullition-plus"], [data-action="ebullition-moins"]'), renvoi: !!(el.querySelector('a, [data-action="renvoi-ebullition"]') || el.matches('a, [data-action="renvoi-ebullition"]')) };
  });
  if (!eb) p('D37 : la durée d\'ébullition de la recette n\'est pas affichée sur l\'étape (data-role="ebullition")');
  else {
    if (!eb.valeur) p('D37 : data-role="ebullition" ne dit pas la durée (« 60′ »)');
    if (eb.champ || eb.plusMoins) p('D37 : l\'ébullition se modifie sur l\'étape alors qu\'elle est « defini ailleur dans l\'application » : un renvoi suffit');
    if (!eb.renvoi) p('D37 : pas de renvoi vers l\'endroit où se règle l\'ébullition');
  }

  // D47, D45, D35, D46, D55 pendant un même geste dans l'ébullition.
  {
    // D55 (18.10, soir, capture de la base v4 entourée) : « Ça semble un peu étrange d'avoir autant
    // d'espace, j'avais dit à la apple en mode zoom loop ». Une loupe grossit le voisinage du doigt ;
    // le reste du rail reste compact et presque à sa place. Pendant le geste : aucun vide de plus de
    // 80 px entre deux éléments du rail, et le premier ajout proposé (sous le rail) ne descend pas de
    // plus de 120 px.
    const releve = () => page.evaluate(() => {
      const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.15 && (!e.checkVisibility || e.checkVisibility({ opacityProperty: true, visibilityProperty: true })); };
      const items = [...document.querySelectorAll('[data-etape], [data-role="ligne-houblon"], [data-role="levure"]')].filter(vis).map((e) => { const r = e.getBoundingClientRect(); return { top: r.top + scrollY, bottom: r.bottom + scrollY }; }).sort((a, b) => a.top - b.top);
      let fin = -Infinity, vide = 0;
      for (const it of items) { if (fin > -Infinity) vide = Math.max(vide, it.top - fin); fin = Math.max(fin, it.bottom); }
      const a = [...document.querySelectorAll('[data-role="ajout-rapide"]')].find(vis);
      return { vide, apres: a ? a.getBoundingClientRect().top + scrollY : null };
    });
    const auRepos = await releve();
    const g = await poser(page, 'doigt');
    const pendant = await gradsVisibles(page);
    const eb5 = pendant.filter((x) => x.seg === 'ebullition');
    if (eb5.length < 6) p('D47 : le doigt posé dans l\'ébullition, l\'échelle des minutes ne s\'ouvre pas (' + eb5.length + ' graduation(s) visibles)');
    if (pendant.some((x) => x.seg && x.seg !== 'ebullition')) p('D47 : pendant le geste dans l\'ébullition, des graduations d\'autres segments restent ouvertes (pas de focus)');
    const enGeste = await releve();
    if (enGeste.vide > 80) p('D55 : pendant le geste, un vide de ' + Math.round(enGeste.vide) + ' px dans le rail (80 au plus) : la loupe grossit le voisinage du doigt, elle n\'étire pas le rail');
    if (auRepos.apres !== null && enGeste.apres !== null && enGeste.apres - auRepos.apres > 120) p('D55 : pendant le geste, les ajouts proposés descendent de ' + Math.round(enGeste.apres - auRepos.apres) + ' px (120 au plus) : le reste du rail doit rester compact');
    // D45 : régularité mesurée sur les 5 graduations voisines du doigt (une loupe resserre au loin).
    const proches = [...eb5].sort((a, b) => Math.abs(a.y - g.y) - Math.abs(b.y - g.y)).slice(0, 5);
    if (proches.length >= 4) {
      const tri = [...proches].sort((a, b) => a.y - b.y);
      const gaps = tri.slice(1).map((t, i) => t.y - tri[i].y).filter((d) => d > 0);
      const m = gaps.reduce((s, d) => s + d, 0) / gaps.length, sd = Math.sqrt(gaps.reduce((s, d) => s + (d - m) ** 2, 0) / gaps.length);
      if (m > 0 && sd / m > 0.25) p('D45 : échelle d\'ébullition irrégulière sous le doigt (' + Math.round(Math.min(...gaps)) + ' à ' + Math.round(Math.max(...gaps)) + ' px)');
    }
    if (!(await page.$('[data-glisse]'))) p('D35 : pendant le glissement, rien ne porte data-glisse (l\'élément qui suit le doigt)');
    // D46 : la carte suit le doigt.
    const haut = () => page.evaluate(() => { const x = document.querySelector('[data-glisse]'); return x ? x.getBoundingClientRect().top : null; });
    let prec = await haut(), bouge = 0, ecarts = [];
    for (let i = 1; i <= 10; i++) { await g.bouger(g.y + 6); await wait(15); const h = await haut(); if (h !== null && prec !== null) { if (Math.abs(h - prec) > 0.5) bouge++; ecarts.push(h - prec - 6); } prec = h; }
    if (!ecarts.length) p('D46 : impossible de suivre la carte (rien ne porte data-glisse)');
    else { const pire = Math.max(...ecarts.map(Math.abs)); if (bouge < 9 || pire > 4) p('D46 : la carte ne suit pas le doigt (' + bouge + ' mouvements sur 10, écart jusqu\'à ' + Math.round(pire) + ' px) : geste saccadé'); }
    for (const x of await propre(page)) p('D35 pendant : ' + x);
    await g.lacher();
    for (const x of await propre(page)) p('D35 après : ' + x);
    if ((await gradsVisibles(page)).length) p('D47 : après le lâcher, l\'échelle reste ouverte');
  }
  // D27, D34 : poser à 45′ puis à 20′ (tranches libres), le moment et l'IBU suivent.
  await recharger();
  const r45 = await lacherSur(page, 'b45');
  await recharger();
  const r20 = await lacherSur(page, 'b20');
  if (!r45.ok || !r20.ok) p('D34 : le doigt n\'atteint pas les graduations 45′ et 20′ (data-etape="b45", "b20" pendant le geste)');
  else {
    const m45 = minute(r45.apres.quand), m20 = minute(r20.apres.quand);
    if (m45 !== 45 || m20 !== 20) p('D34 : lâchée sur 45′ puis 20′, la ligne dit « ' + r45.apres.quand + ' » puis « ' + r20.apres.quand + ' »');
    if (r45.apres.ibu === r45.avant.ibu) p('D27 : le moment change mais pas les IBU de la ligne (' + r45.avant.ibu + ')');
    if (r45.apres.ibu === r20.apres.ibu) p('D34 : 45′ et 20′ donnent le même IBU (' + r20.apres.ibu + ')');
  }
  // D44 : whirlpool (85 °C / 70 °C) puis fermentation (J+2 / J+6).
  for (const [c1, c2, re, nom] of [['wp85', 'wp70', /(\d+)\s*°C/, 'whirlpool'], ['f2', 'f6', /J\s*\+\s*(\d+)/i, 'fermentation']]) {
    await recharger();
    const a1 = await lacherSur(page, c1);
    await recharger();
    const a2 = await lacherSur(page, c2);
    if (!a1.ok || !a2.ok) { p('D44 : le doigt n\'atteint pas les graduations ' + c1 + ' et ' + c2 + ' du segment ' + nom + ' (pas d\'échelle sous le doigt)'); continue; }
    const v1 = (a1.apres.quand || '').match(re), v2 = (a2.apres.quand || '').match(re);
    if (!v1 || !v2) p('D44 : lâchée dans le segment ' + nom + ', la ligne ne dit pas son réglage (« ' + a1.apres.quand + ' », « ' + a2.apres.quand + ' »)');
    else if (v1[0] === v2[0]) p('D44 : deux graduations du segment ' + nom + ' donnent le même réglage (« ' + v1[0] + ' ») : choix figé');
  }
  // D42 : geste interrompu.
  await recharger();
  {
    const client = await page.target().createCDPSession();
    const a = await etat(page);
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a.poignee.x, y: a.poignee.y }] });
    for (let i = 1; i <= 8; i++) { await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: a.poignee.x, y: a.poignee.y + i * 12 }] }); await wait(25); }
    await client.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await wait(500);
    if (await page.$('[data-glisse]')) p('D42 : après un geste interrompu (touchcancel), la carte reste soulevée');
    if (await ombre(page)) p('D42 : après un geste interrompu, une carte garde son ombre');
  }
  await page.close();
  // D27 à la souris, à 1280.
  {
    const d = await ouvrir(index, 1280);
    const r = await lacherSur(d, 'b30', 'souris');
    if (!r.ok || minute(r.apres?.quand) !== 30) p('D27 (1280 px, à la souris) : glisser vers 30′ ne pose pas la ligne à 30′ (« ' + (r.apres?.quand || '') + ' »)');
    await d.close();
  }
  // D36, D37 : la même recette à 45′, 120′, 200′ d'ébullition.
  for (const [c, cible] of [[45, null], [120, 'b90'], [200, 'b150']]) {
    const f = path.join(dir, id, 'cas-ebu' + c + '.html');
    if (!fs.existsSync(f)) { p('D37 : cas-ebu' + c + '.html absente (la même recette avec une ébullition de ' + c + '′)'); continue; }
    const q = await ouvrir(f);
    const dom = await q.evaluate((c) => ({ debut: !!document.querySelector('[data-etape="b' + c + '"]'), audela: [...document.querySelectorAll('[data-etape^="b"]')].map((e) => Number(e.getAttribute('data-etape').slice(1))).filter((m) => m > c).length }), c);
    if (!dom.debut) p('D37 : à ' + c + '′ d\'ébullition, le rail ne commence pas à ' + c + '′ (data-etape="b' + c + '")');
    if (dom.audela) p('D37 : à ' + c + '′, le rail a des graduations au-delà de ' + c + '′');
    if (c === 45) { const m = minute((await etat(q)).quand); if (m !== null && m > 45) p('D37 : à 45′, la première ligne reste à ' + m + '′'); }
    if (cible) {
      const r = await lacherSur(q, cible);
      if (!r.ok || minute(r.apres?.quand) !== Number(cible.slice(1))) p('D36 : à ' + c + '′, la ligne ne se pose pas à ' + cible.slice(1) + '′ (« ' + (r.apres?.quand || '') + ' »)');
    }
    await q.close();
  }
  // D43 : le jour de l'ajout à froid se règle (recette chargée).
  const k3 = path.join(dir, id, 'cas-k3.html');
  if (fs.existsSync(k3)) {
    const q = await ouvrir(k3);
    const jour = () => q.evaluate(() => { const l = [...document.querySelectorAll('[data-role="ligne-houblon"]')].find((x) => /J\s*\+\s*\d+/.test(x.innerText)); const m = l && l.innerText.match(/J\s*\+\s*(\d+)/); return m ? Number(m[1]) : null; });
    const j0 = await jour();
    if (j0 === null) p('D43 : cas-k3.html sans ajout à froid daté (J+N)');
    else for (const [action, attendu] of [['jour-plus', j0 + 1], ['jour-moins', j0]]) {
      const b = await q.$('[data-role="ligne-houblon"] [data-action="' + action + '"]');
      if (!b) { p('D43 : pas de geste data-action="' + action + '" sur la ligne à froid'); break; }
      try { await b.tap(); } catch { await b.click(); }
      await wait(350);
      const j = await jour();
      if (j !== attendu) { p('D43 : « ' + action + ' » laisse le jour à J+' + j + ' (J+' + attendu + ' attendu)'); break; }
    }
    await q.close();
  }
  // D56 (18.10, soir, sa capture à deux houblons : « 0′ » et « Nugget » l'un sur l'autre) : « Avec
  // deux houblons ça marche aussi un peu moins bien ». Recette à plusieurs houblons (cas-k3) : la
  // première ligne descend dans l'ébullition par pas de 10 px ; à chaque pas, aucun texte du rail
  // (graduations, étapes, autres lignes) n'en chevauche un autre, hors de la carte qui suit le doigt.
  if (fs.existsSync(k3)) {
    const q = await ouvrir(k3);
    const chevauche = () => q.evaluate(() => {
      const glisse = document.querySelector('[data-glisse]');
      const vus = new Set(), rects = [];
      for (const z of document.querySelectorAll('[data-etape], [data-role="ligne-houblon"], [data-role="levure"]')) {
        const w = document.createTreeWalker(z, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) {
          if (vus.has(n) || !n.textContent.trim()) continue;
          vus.add(n);
          const el = n.parentElement;
          if (!el || (glisse && glisse.contains(el))) continue;
          if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
          const r = document.createRange(); r.selectNodeContents(n);
          for (const b of r.getClientRects()) if (b.width > 1 && b.height > 1) rects.push({ t: n.textContent.trim().slice(0, 14), el, x0: b.left, x1: b.right, y0: b.top, y1: b.bottom });
        }
      }
      for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i], b = rects[j];
        if (a.el === b.el) continue;
        if (Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > 2 && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > 2) return '« ' + a.t + ' » sur « ' + b.t + ' »';
      }
      return null;
    });
    const g = await poser(q, 'doigt');
    if (g) {
      let vu = null;
      for (let i = 0; i < 40 && !vu; i++) { await g.bouger(g.y + 10); await wait(20); vu = await chevauche(); }
      await g.lacher();
      if (vu) p('D56 : cas-k3.html, pendant le geste, ' + vu + ' (textes du rail l\'un sur l\'autre)');
    } else p('D56 : cas-k3.html, aucune ligne à saisir');
    await q.close();
  }
  // D61 (18.10, soir, ses deux captures de la base v4.1 au téléphone) : « on est à 35' et on a
  // l'impression d'être quasiment à 60' » ; « Aussi les deux sont à 25' mais on dirait que l'autre
  // est à 0' ». Pendant le geste dans l'ébullition, la hauteur dit le temps : chaque houblon de
  // l'ébullition (celui qu'on tient et les autres) est à sa place entre le début (E′) et 0′, à
  // 12 % de la descente près ; deux houblons au même moment sont à la même hauteur.
  {
    const place = (q, cleTenue) => q.evaluate((cleTenue) => {
      const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.15; };
      const yc = (e) => { const r = e.getBoundingClientRect(); return r.top + r.height / 2; };
      const ebEl = document.querySelector('[data-role="ebullition"]');
      const E = Number(((ebEl && ebEl.innerText) || '').match(/(\d+)\s*(′|'|min)/)?.[1] || 60);
      const tete = [...document.querySelectorAll('[data-etape="b' + E + '"]')].find(vis) || ebEl;
      const zero = [...document.querySelectorAll('[data-etape="b0"]')].find(vis)
        || [...document.querySelectorAll('[data-etape] *, [data-etape]')].filter(vis).find((e) => /^\s*0\s*(′|')\s*$/.test(e.innerText || ''));
      if (!tete || !zero) return { E, err: 'début ' + (tete ? 'vu' : 'introuvable') + ', 0′ ' + (zero ? 'vu' : 'introuvable') };
      const y0 = yc(tete), y1 = yc(zero);
      const lignes = [...document.querySelectorAll('[data-role="ligne-houblon"]')].map((l) => {
        const k = l.querySelector('[data-houblon]')?.getAttribute('data-houblon') || l.getAttribute('data-houblon');
        const h = l.querySelector('[data-role="glisser-moment"]') || l;
        const q = l.querySelector('[data-role="quand"]');
        const m = ((q && q.innerText) || h.innerText || '').match(/^\s*(\d+)\s*(′|')/);
        return { k, tenue: k === cleTenue, t: m ? Number(m[1]) : null, y: vis(h) ? yc(h) : null };
      });
      return { E, y0, y1, lignes };
    }, cleTenue);
    const juger = (cas, r, tTenue) => {
      if (r.err) { p('D61 : ' + cas + ', ' + r.err + ' pendant le geste'); return; }
      const L = r.y1 - r.y0;
      if (L <= 0) { p('D61 : ' + cas + ', 0′ n\'est pas sous le début de l\'ébullition'); return; }
      for (const l of r.lignes) {
        const t = l.tenue ? tTenue : l.t;
        if (t === null || t > r.E || l.y === null) continue;
        const f = (l.y - r.y0) / L, att = (r.E - t) / r.E;
        if (Math.abs(f - att) > 0.12) p('D61 : ' + cas + ', ' + l.k + (l.tenue ? ' (tenu)' : '') + ' à ' + t + '′ est placé aux ' + Math.round(f * 100) + ' % de la descente ' + r.E + '′ → 0′ (' + Math.round(att * 100) + ' % attendus) : la hauteur ne dit plus le temps');
      }
    };
    const q1 = await ouvrir(index);
    const g1 = await poser(q1, 'doigt');
    let descente = null;
    if (g1 && await g1.vers('b35')) {
      juger('index, tenu à 35′', await place(q1, g1.a.cle), 35); descente = g1.y - g1.a.poignee.y;
      // D63 (18.10, soir, base v4.2 : « Ça fait pas zoom focus sur l'emplacement ») : une loupe
      // sous le doigt, mesurée ici où rien ne s'intercale dans l'ébullition : une bulle
      // [data-role="loupe"] qui écrit au moins 5 minutes, ou une tranche de 5′ au moins 2 fois
      // plus haute (et de 12 px au moins) près du doigt qu'au loin (médiane, à 20′ et plus).
      const lp = await q1.evaluate(() => {
        const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.15; };
        const bulle = [...document.querySelectorAll('[data-role="loupe"]')].find(vis);
        const grads = Object.fromEntries([...document.querySelectorAll('[data-graduation="ebullition"]')].filter(vis).map((e) => { const r = e.getBoundingClientRect(); return [Number((e.getAttribute('data-etape') || '').slice(1)), r.top + r.height / 2]; }));
        return { minutesBulle: bulle ? (bulle.innerText.match(/\d+\s*(′|')/g) || []).length : 0, grads };
      });
      if (lp.minutesBulle < 5) {
        const pas = Object.keys(lp.grads).map(Number).filter((m) => lp.grads[m - 5] !== undefined).map((m) => ({ m: m - 2.5, d: Math.abs(lp.grads[m - 5] - lp.grads[m]) }));
        const pres = pas.filter((x) => Math.abs(x.m - 35) <= 5), loin = pas.filter((x) => Math.abs(x.m - 35) >= 20);
        if (!pres.length || !loin.length) p('D63 : index, tenu à 35′, pas de loupe mesurable (' + pas.length + ' tranches de 5′ visibles, aucune bulle data-role="loupe")');
        else {
          const s = loin.map((x) => x.d).sort((u, v) => u - v), dl = s[Math.floor(s.length / 2)], dp = Math.min(...pres.map((x) => x.d));
          if (!(dp >= 12 && dp >= 2 * dl)) p('D63 : index, tenu à 35′, pas de loupe : une tranche de 5′ fait ' + Math.round(dp) + ' px sous le doigt et ' + Math.round(dl) + ' px au loin (2 fois plus et 12 px au moins), aucune bulle data-role="loupe"');
        }
      }
    }
    else p('D61 : index, le doigt n\'atteint pas 35′');
    if (g1) await g1.lacher();
    await q1.close();
    // La même descente du doigt, d'un trait (trois bonds) : le même point du rail doit donner le
    // même moment, quelle que soit la vitesse du doigt (± 5′).
    if (descente !== null) {
      const q3 = await ouvrir(index);
      const g3 = await poser(q3, 'doigt');
      if (g3) {
        const y0 = g3.y;
        for (let i = 1; i <= 3; i++) { await g3.bouger(y0 + (descente * i) / 3); await wait(16); }
        await wait(150);
        const lu = await q3.evaluate((cle) => { const l = [...document.querySelectorAll('[data-role="ligne-houblon"]')].find((x) => x.querySelector('[data-houblon="' + cle + '"]')); const q = l && l.querySelector('[data-role="quand"]'); return q ? q.innerText.trim() : null; }, g3.a.cle);
        const m = (lu || '').match(/^(\d+)\s*(′|')/);
        if (!m || Math.abs(Number(m[1]) - 35) > 5) p('D61 : index, la même descente du doigt (' + Math.round(descente) + ' px) donne 35′ lentement et « ' + lu + ' » d\'un trait : le moment dépend de la vitesse du doigt');
        else juger('index, d\'un trait jusqu\'à ' + m[1] + '′', await place(q3, g3.a.cle), Number(m[1]));
        await g3.lacher();
      }
      await q3.close();
    }
    if (fs.existsSync(k3)) {
      const q2 = await ouvrir(k3);
      const g2 = await poser(q2, 'doigt');
      if (g2) {
        for (const [code, t] of [['b35', 35], ['b10', 10]]) {
          if (await g2.vers(code)) juger('cas-k3, tenu à ' + t + '′', await place(q2, g2.a.cle), t);
          else p('D61 : cas-k3, le doigt n\'atteint pas ' + t + '′');
        }
        await g2.lacher();
      }
      await q2.close();
    }
  }
  // D67 (19.10, au téléphone, base v4.5 : Nugget glissé de 60′ jusqu'au whirlpool, à 75 °C) :
  // « L'échelle ne s'adapte pas ni de focus, pas là où je suis. L'échelle ébullition est très grande
  // alors que celle où l'on est, Whirlpool, est toute petite ». Le doigt passé dans un autre segment,
  // ce segment devient la loupe : une tranche sous le doigt (deux graduations voisines du doigt) fait
  // au moins 2 fois une tranche du segment quitté (sa descente ÷ ses intervalles) et 12 px au moins.
  {
    const q = await ouvrir(index);
    const g = await poser(q, 'doigt');
    if (g && await g.vers('wp75')) {
      const m = await q.evaluate((yF) => {
        const yc = (e) => { const r = e.getBoundingClientRect(); return r.top + r.height / 2; };
        const wp = [...document.querySelectorAll('[data-graduation="whirlpool"]')].map(yc).sort((a, b) => a - b);
        const eb = [...document.querySelectorAll('[data-graduation="ebullition"]')].map(yc).sort((a, b) => a - b);
        let gap = null;
        for (let i = 1; i < wp.length; i++) if (wp[i - 1] <= yF + 0.5 && wp[i] >= yF - 0.5) { const d = Math.max(wp[i] - wp[i - 1], i + 1 < wp.length ? wp[i + 1] - wp[i] : 0); gap = gap === null ? d : Math.max(gap, d); }
        return { gap, pas: eb.length > 1 ? (eb[eb.length - 1] - eb[0]) / (eb.length - 1) : null };
      }, g.y);
      if (m.gap === null || m.pas === null) p('D67 : index, tenu à 75 °C, graduations du whirlpool ou de l\'ébullition introuvables');
      else if (!(m.gap >= 12 && m.gap >= 2 * m.pas)) p('D67 : index, Nugget glissé au whirlpool (75 °C) : une tranche sous le doigt fait ' + Math.round(m.gap) + ' px, une tranche de l\'ébullition quittée ' + Math.round(m.pas * 10) / 10 + ' px : la loupe n\'a pas suivi le doigt dans son segment');
    } else p('D67 : index, le doigt n\'atteint pas 75 °C dans le whirlpool');
    if (g) await g.lacher();
    await q.close();
  }
  // D63, D64, D61 bis (18.10, soir, base v4.2 au téléphone) : « Ça fait pas zoom focus sur
  // l'emplacement. Les ajouter déjà présent saute à droite. C'est moins bien qu'avant... » ;
  // « L'échelle est plus du tout respecter quand on passe dessus... ». La loupe (D47, D55) et la
  // hauteur qui dit le temps (D61) tiennent ensemble.
  // D63 : pendant le geste, une loupe : une bulle [data-role="loupe"] visible qui écrit au moins
  //   5 minutes, ou, sur le rail, les graduations voisines du doigt au moins 2 fois plus espacées
  //   que les plus lointaines de l'ébullition (et 12 px au moins).
  // D64 : les houblons déjà posés ne sautent pas de côté (x à 8 px près de leur place au repos)
  //   et restent dans le segment de leur moment (whirlpool entre wp et la levure ; à froid sous
  //   la fermentation).
  // D61 bis : en descendant l'ébullition par pas de 10 px, le moment tenu ne remonte jamais et ne
  //   saute pas de plus de 10′ ; aucun autre houblon ne bouge de plus de 24 px d'un pas à l'autre.
  if (fs.existsSync(k3)) {
    const lignes = (q) => q.evaluate(() => [...document.querySelectorAll('[data-role="ligne-houblon"]')].map((l) => {
      const k = l.querySelector('[data-houblon]')?.getAttribute('data-houblon') || l.getAttribute('data-houblon');
      const h = l.querySelector('[data-role="glisser-moment"]') || l;
      const r = h.getBoundingClientRect();
      const qd = l.querySelector('[data-role="quand"]');
      return { k, x: r.left + r.width / 2, y: r.top + r.height / 2, quand: qd ? qd.innerText.trim() : '', glisse: !!l.closest('[data-glisse]') };
    }));
    const q = await ouvrir(k3);
    const repos = await lignes(q);
    const g = await poser(q, 'doigt');
    if (g && await g.vers('b35')) {
      const now = await lignes(q);
      const et = (await etat(q)).etapes;
      const yE = (c) => et.find((x) => x.code === c)?.y;
      for (const l of now.filter((x) => !x.glisse && x.k !== g.a.cle)) {
        const r0 = repos.find((x) => x.k === l.k);
        if (r0 && Math.abs(l.x - r0.x) > 8) p('D64 : cas-k3, pendant le geste, ' + l.k + ' (' + l.quand + ') saute de côté de ' + Math.round(l.x - r0.x) + ' px : un houblon déjà posé reste à sa place');
        if (/°C/.test(l.quand) && yE('wp') !== undefined && yE('levure') !== undefined && !(l.y >= yE('wp') - 4 && l.y <= yE('levure') + 4)) p('D64 : cas-k3, pendant le geste, ' + l.k + ' (' + l.quand + ') n\'est plus dans le segment du whirlpool');
        if (/J\s*\+/.test(l.quand) && yE('dryActive') !== undefined && l.y < yE('dryActive') - 4) p('D64 : cas-k3, pendant le geste, ' + l.k + ' (' + l.quand + ') remonte au-dessus de la fermentation');
      }
    } else p('D63 : cas-k3, le doigt n\'atteint pas 35′');
    if (g) await g.lacher();
    await q.close();
    const q2 = await ouvrir(k3);
    const g2 = await poser(q2, 'doigt');
    if (g2) {
      let prevT = null, prevPos = null, pire = null, cote = false;
      for (let i = 0; i < 60 && !pire; i++) {
        await g2.bouger(g2.y + 10); await wait(30);
        const ls = await lignes(q2);
        const tenu = ls.find((x) => x.k === g2.a.cle);
        const m = tenu && tenu.quand.match(/^(\d+)\s*(′|')/);
        if (!m) break;
        const t = Number(m[1]);
        if (prevT !== null && (t > prevT || prevT - t > 10)) pire = 'le moment tenu passe de ' + prevT + '′ à ' + t + '′ en 10 px';
        const pos = Object.fromEntries(ls.filter((x) => x.k !== g2.a.cle).map((x) => [x.k, x]));
        if (prevPos && !pire) for (const [k, l] of Object.entries(pos)) {
          const a = prevPos[k]; if (!a) continue;
          if (Math.abs(l.y - a.y) > 24) { pire = k + ' bondit de ' + Math.round(l.y - a.y) + ' px en un pas de 10 px (tenu à ' + t + '′)'; break; }
          if (Math.abs(l.x - a.x) > 8 && !cote) { p('D64 : cas-k3, en passant à ' + t + '′, ' + k + ' (' + l.quand + ') saute de côté de ' + Math.round(l.x - a.x) + ' px : un houblon déjà posé reste à sa place'); cote = true; }
        }
        prevT = t; prevPos = pos;
      }
      await g2.lacher();
      if (pire) p('D61 bis : cas-k3, en descendant l\'ébullition par pas de 10 px, ' + pire + ' : l\'échelle ne tient pas quand on passe sur un autre houblon');
    }
    await q2.close();
  }
  console.log(id + ' · rail contrôlé');
}
await browser.close();
if (problems.length === 0) console.log('RAIL OK ' + ids.length + '/' + ids.length);
else { console.log('RAIL ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exitCode = 1; }
