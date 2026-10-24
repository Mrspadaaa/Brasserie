// Contrôle du lot 13 (#140, 19.10, soir) : la carte et la fiche d'un houblon, ensemble.
// Les mots du brasseur, dans l'ordre :
//   « Non... Un appuie long ouvre sa fiche. Comme avant, saufe que sa fiche est plus fourni avec les
//   labels » ; puis, sur les problèmes relevés dans la fiche actuelle : « Non, il faut changer la carte
//   et tout. Mais c'est déjà pas mal comme visuel de base. Mais il y a quelques problèmes dessus...
//   Donc fait moi des mini maquettes de ça ».
// Les quatre problèmes relevés dans la base v4.8 (fiche de Nugget, cartes des ajouts proposés) :
//   P1 rien ne relie une case de la carte à sa famille dans la fiche : les carrés sont en couleur,
//      la roue est grise ;
//   P2 deux codes qui se contredisent : la carte dit un niveau, la roue un compte ; Agrumes et Épicé
//      de Nugget sont à 1/4, mais l'un est clair (cité), l'autre plein (marqué, nommé en premier) ;
//   P3 les mots des fiches, qui font les couleurs, sont cachés dans « Sources » ;
//   P4 une fiche unique s'écrit « 1/1 » et se lit comme un plein (17 houblons sur 32).
// Convention auteur (dans <lot>/<id>/) : vue.html (l'écran au repos : la ligne Nugget du rail et les
// ajouts proposés), fiche-nugget.html et fiche-citra.html (l'appui long : la fiche ouverte). Chaque
// carte porte data-houblon="<clé>" ; chaque case data-famille, data-n et data-of (le compte des
// fiches, du pack) et data-niveau (ce que la case montre, 0 à 2). Dans la fiche, [data-role="fiche"]
// et, pour chaque famille décrite, un [data-explique="<famille>"].
// Règles :
//   F1 (P1) dans la fiche, chaque famille décrite a un élément de la couleur de sa famille, la même
//      que sa case sur la carte ;
//   F2 (P2) deux familles au même compte qui n'ont pas la même case sur la carte : la fiche dit
//      pourquoi (« premier ») ;
//   F3 (P3) dans la fiche, sans rien déplier, au moins 3 mots propres de Beer Maverick sont écrits
//      (pas ceux qui sont aussi des noms de familles) ;
//   F4 (P4) la fiche de Citra cryo n'écrit pas « 1/1 » et dit qu'il n'y a qu'une fiche (« seule ») ;
//   F5 chaque famille décrite dit son nom et ses fiches (« 2 sur 4 », ou le nom des sources) ;
//      « non décrit » est écrit (D65) ;
//   F7 (D72, 19.10, soir, sur g1, Épicé 1/4 et Tropicaux 2/4 entourés au même rayon : « 1/4, 2/4 mais
//      même valeur ??? ») : sur la roue, la place suit le nombre écrit. Deux familles au même nombre
//      de fiches sont au même rayon ; plus de fiches, plus loin du centre (contrat de la base :
//      svg[data-radar][data-axes] et [data-serie][data-valeurs]) ;
//   F8 (D73, 19.10, soir, sur la fiche de la base v4.9, le bloc des étiquettes entouré : « Attention,
//      trop de texte ») : les étiquettes de la fiche ([data-role="fiche-labels"]) tiennent en 45 mots (la fiche de Citra cryo, 40 mots : « Ça c'est très bien ») ;
//   F6 la carte reste une carte : au repos, ses mots de la base (nom, α, dose, IBU, moment), 14 mots
//      au plus, 72 px de haut au plus pour un ajout proposé ; aucune légende écrite au repos.
// Usage : node controle-carte-fiche.mjs <dossier du lot> [ids…]
//         node controle-carte-fiche.mjs --base   (témoin : la base courante, fiches ouvertes par ouvrirFiche)
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../../../../..');
const FICHES = JSON.parse(fs.readFileSync(path.join(root, 'prototypes/houblons-v4/data/pack-fiches.json'), 'utf8')).fichesHoublons;
const PAR = Object.fromEntries(FICHES.map((f) => [f.key, f]));
const COULEUR = { citrus: '#d9b414', tropical: '#ee9b2f', melon: '#6fc09b', stoneFruit: '#e88d68', pomeFruit: '#a3bd38', berries: '#9b3f74', floral: '#bf86d6', green: '#6aa33a', herbal: '#3f8a5f', spice: '#7a4e3a', earthy: '#9a8a66', resin: '#2f6b5f' };
const COURT = { citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', floral: 'Floral', green: 'Végétal', herbal: 'Herbacé', spice: 'Épicé', earthy: 'Terreux', resin: 'Résineux' };
const NUG = 'beermaverick-nugget', CIT = 'beermaverick-citra:cryo';
const base = process.argv.some((a) => a === '--base' || a.startsWith('--base='));
const dir = base ? null : path.resolve(process.argv[2] || '.');
const only = process.argv.slice(3).filter((a) => !a.startsWith('--'));
const ids = base ? ['base'] : (only.length ? only : fs.readdirSync(dir).filter((d) => /^[a-z]+\d+$/.test(d) && fs.existsSync(path.join(dir, d, 'vue.html')))).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
// Les teintes de la famille : pleine, ou mêlée de blanc (cité, 42 % dans la base) ; tolérance large.
const teintes = (f) => { const c = hex(COULEUR[f]); return [c, c.map((v) => Math.round(v * 0.42 + 255 * 0.58)), c.map((v) => Math.round(v * 0.6 + 255 * 0.4))]; };

async function lire(f, ouvrir) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(f).href, { waitUntil: 'networkidle0', timeout: 30000 });
  if (ouvrir) { await page.evaluate((k) => { if (typeof ouvrirFiche === 'function') ouvrirFiche(k, { mode: 'feuille', anim: false, epingle: true }); }, ouvrir); await new Promise((r) => setTimeout(r, 400)); }
  const r = await page.evaluate(() => {
    const vis = (e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.15 && (!e.checkVisibility || e.checkVisibility({ opacityProperty: true, visibilityProperty: true })); };
    // rgb(a) ; ou color(srgb r g b), la forme que Chrome rend pour un color-mix (la case claire).
    const rgb = (s) => {
      const c = (s || '').match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/);
      if (c) return c[4] != null && Number(c[4]) < 0.3 ? null : [1, 2, 3].map((i) => Math.round(Number(c[i]) * 255));
      const m = (s || '').match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map((x) => parseFloat(x)); return p.length > 3 && p[3] < 0.3 ? null : p.slice(0, 3);
    };
    const couleurs = (el) => { const out = []; for (const e of [el, ...el.querySelectorAll('*')]) { if (!vis(e) && e !== el) continue; const cs = getComputedStyle(e); for (const v of [cs.backgroundColor, cs.color, cs.borderTopColor, cs.borderLeftColor, cs.borderBottomColor, cs.fill, cs.stroke, cs.outlineColor]) { const c = rgb(v); if (c) out.push(c); } } return out; };
    const cartes = Object.fromEntries([...document.querySelectorAll('[data-houblon]')].filter(vis).map((c) => {
      let el = c; if (el.tagName === 'B' && el.closest('.rapide, [data-role="ligne-houblon"]')) el = el.closest('.rapide, [data-role="ligne-houblon"]');
      if (el.closest('[data-role="fiche"], .fiche, [data-role="fiche-racine"]')) return null;
      let cases = [...el.querySelectorAll('[data-famille]')].filter(vis).map((x) => ({ f: x.dataset.famille, n: x.dataset.n != null ? Number(x.dataset.n) : null, of: x.dataset.of != null ? Number(x.dataset.of) : null, niv: x.dataset.niveau != null ? Number(x.dataset.niveau) : null, c: rgb(getComputedStyle(x).backgroundColor) }));
      // La base : les carrés .mini .c.f-<famille>, plein (m) ou clair (ci).
      if (!cases.length) cases = [...el.querySelectorAll('.mini .c')].map((x) => { const m = x.className.match(/f-(\w+)/); return m ? { f: m[1], n: null, of: null, niv: x.classList.contains('m') ? 2 : x.classList.contains('ci') ? 1 : 0, c: rgb(getComputedStyle(x).backgroundColor) } : null; }).filter(Boolean);
      const txt = el.innerText.replace(/\s+/g, ' ').trim();
      return [c.dataset.houblon, { txt, h: el.getBoundingClientRect().height, cases, rapide: !!el.closest('.rapide, [data-role="ajout-rapide"], [data-role="ajouts-proposes"], .ajouts') || el.matches('.rapide') }];
    }).filter(Boolean));
    const fiche = [...document.querySelectorAll('[data-role="fiche"], .fiche')].filter(vis)[0] || null;
    const ex = fiche ? Object.fromEntries([...fiche.querySelectorAll('[data-explique]')].filter(vis).map((e) => [e.dataset.explique, { t: e.innerText.replace(/\s+/g, ' ').trim(), c: couleurs(e) }])) : {};
    const rd = fiche ? fiche.querySelector('svg[data-radar]') : null;
    const se = rd ? rd.querySelector('[data-serie][data-valeurs]') : null;
    const roue = rd && se ? { axes: rd.dataset.axes.split(','), vals: se.dataset.valeurs.split(',').map((v) => (v === '' || v === 'null' ? null : Number(v))) } : null;
    const lab = fiche ? fiche.querySelector('[data-role="fiche-labels"]') : null;
    const motsLab = lab ? lab.innerText.split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w)).length : null;
    return { cartes, fiche: !!fiche, ficheTexte: fiche ? fiche.innerText.replace(/\s+/g, ' ') : '', ex, roue, motsLab };
  });
  await page.close();
  return r;
}
const proche = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) <= 40;

for (const id of ids) {
  const p = (m) => problems.push(id + ' : ' + m);
  // --base=<dossier> : une autre base consolidée (un témoin), sinon la base courante.
  const baseDir = (process.argv.find((a) => a.startsWith('--base=')) || '').slice(7) || path.join(root, 'work/refonte-frontend/v4/ecran-1/base/consolide');
  const f = (n) => (base ? path.join(baseDir, 'index.html') : path.join(dir, id, n));
  for (const n of ['vue.html', 'fiche-nugget.html', 'fiche-citra.html']) if (!base && !fs.existsSync(f(n))) p('pas de page ' + n);
  if (!base && !fs.existsSync(f('fiche-citra.html'))) continue;
  const vue = await lire(f('vue.html'));
  const fn = await lire(f('fiche-nugget.html'), base ? NUG : null), fc = await lire(f('fiche-citra.html'), base ? CIT : null);
  // F6 : la carte reste une carte.
  for (const [cle, c] of Object.entries(vue.cartes)) {
    const F = PAR[cle]; if (!F) continue;
    const mots = c.txt.split(' ').filter((w) => /[\p{L}\d]/u.test(w)).length;
    if (mots > 14) p('F6 : au repos, la carte ' + F.name + ' a ' + mots + ' mots (14 au plus)');
    if (c.rapide && c.h > 72) p('F6 : au repos, l\'ajout proposé ' + F.name + ' fait ' + Math.round(c.h) + ' px de haut (72 au plus)');
    if (/(^|[^\p{L}])(marqué|cité|non décrit)(?!\p{L})/iu.test(c.txt)) p('F6 : au repos, la carte ' + F.name + ' écrit une légende (« marqué », « cité », « non décrit »)');
    if (!c.txt.includes(F.name.split(' ')[0])) p('F6 : la carte ' + F.name + ' ne dit plus son nom');
  }
  for (const [nom, fi, cle] of [['fiche de Nugget', fn, NUG], ['fiche de Citra cryo', fc, CIT]]) {
    const F = PAR[cle];
    if (!fi.fiche) { p(nom + ' : pas de fiche ouverte ([data-role="fiche"])'); continue; }
    const carte = vue.cartes[cle] || fi.cartes[cle];
    const decrites = F.aromes.filter((a) => a.level > 0);
    for (const a of decrites) {
      const e = fi.ex[a.family];
      if (!e) { p(nom + ' : F5, ' + a.name + ' n\'a pas d\'étiquette ([data-explique="' + a.family + '"])'); continue; }
      if (!e.t.toLowerCase().includes(COURT[a.family].toLowerCase()) && !e.t.toLowerCase().includes(a.name.toLowerCase())) p(nom + ' : F5, ' + a.family + ' étiqueté sans son nom');
      if (!(new RegExp(a.sources + '\\s*(fiches?|sources?)?\\s*(sur|/)\\s*' + a.of).test(e.t) || a.authors.every((n) => e.t.includes(n)) || (a.of === 1 && /seule?/.test(e.t + fi.ficheTexte)))) p(nom + ' : F5, ' + a.name + ' étiqueté sans ses fiches (« ' + a.sources + ' sur ' + a.of + ' » ou ' + a.authors.join(', ') + ')');
      // F1 : la couleur de la famille, dans la fiche et sur la carte.
      if (!e.c.some((c) => teintes(a.family).some((t) => proche(c, t)))) p(nom + ' : F1, l\'étiquette de ' + a.name + ' n\'a pas la couleur de sa famille');
      const cs = carte && carte.cases.find((x) => x.f === a.family);
      if (carte && cs && cs.c && !teintes(a.family).some((t) => proche(cs.c, t))) p(nom + ' : F1, la case ' + a.name + ' de la carte n\'a pas la couleur de sa famille');
    }
    if (!/non décrit/i.test(fi.ficheTexte)) p(nom + ' : F5, « non décrit » n\'est pas écrit');
    // F2 : même compte, cases différentes sur la carte → la fiche dit pourquoi.
    if (carte && carte.cases.length) {
      const vu = new Set();
      for (const a of decrites) for (const b of decrites) {
        if (a === b || a.sources !== b.sources) continue;
        const ca = carte.cases.find((x) => x.f === a.family), cb = carte.cases.find((x) => x.f === b.family);
        if (!ca || !cb || ca.niv == null || cb.niv == null || ca.niv <= cb.niv) continue;
        const k = a.family + b.family; if (vu.has(k)) continue; vu.add(k);
        if (!/premier/i.test((fi.ex[a.family] || {}).t || '')) p(nom + ' : F2, ' + a.name + ' et ' + b.name + ' sont à ' + a.sources + ' sur ' + a.of + ', mais leurs cases diffèrent sur la carte ; la fiche ne dit pas pourquoi (« premier »)');
      }
    } else p(nom + ' : la carte du houblon n\'est pas sur la page (ses cases data-famille)');
    // F8 : « Attention, trop de texte ».
    if (fi.motsLab != null && fi.motsLab > 45) p(nom + ' : F8, les étiquettes de la fiche ont ' + fi.motsLab + ' mots (45 au plus) : trop de texte');
    // F7 : sur la roue, la place suit le nombre de fiches écrit.
    if (!fi.roue) p(nom + ' : F7, la roue ne suit pas le contrat de la base (svg[data-radar][data-axes], [data-serie][data-valeurs])');
    else {
      const val = (f) => { const k = fi.roue.axes.indexOf(f); return k < 0 ? undefined : fi.roue.vals[k]; };
      const vu = new Set();
      for (const a of decrites) for (const b of decrites) {
        if (a === b || a.sources < b.sources) continue;
        const va = val(a.family), vb = val(b.family);
        if (va == null || vb == null) continue;
        const k = [a.family, b.family].sort().join(); if (vu.has(k)) continue; vu.add(k);
        if (a.sources === b.sources && Math.abs(va - vb) > 0.01) p(nom + ' : F7, ' + a.name + ' et ' + b.name + ' sont à ' + a.sources + ' sur ' + a.of + ', mais pas au même rayon sur la roue (' + va + ' et ' + vb + ')');
        if (a.sources > b.sources && !(va > vb + 0.01)) p(nom + ' : F7, ' + a.name + ' (' + a.sources + ' sur ' + a.of + ') et ' + b.name + ' (' + b.sources + ' sur ' + b.of + ') sont au même rayon sur la roue (' + va + ', ' + vb + ') : la place ne suit pas le nombre écrit');
      }
    }
    if (carte) for (const a of F.aromes) { const c = carte.cases.find((x) => x.f === a.family); if (c && c.n != null && (c.n !== a.sources || c.of !== a.of)) p(nom + ' : la case ' + a.name + ' porte ' + c.n + '/' + c.of + ' au lieu de ' + a.sources + '/' + a.of + ' (pack)'); }
  }
  // F3 : les mots de Beer Maverick, sans rien déplier.
  // Les mots qui sont aussi des noms de familles (« agrumes », « terreux ») ne comptent pas : la roue les écrit déjà.
  if (fn.fiche) { const noms = Object.values(COURT).map((x) => x.toLowerCase()); const mots = PAR[NUG].descripteurs.beerMaverick.filter((w) => !noms.includes(w.toLowerCase()) && fn.ficheTexte.toLowerCase().includes(w.toLowerCase())); if (mots.length < 3) p('fiche de Nugget : F3, ' + mots.length + ' mot(s) propres de Beer Maverick écrits sans déplier (3 au moins, parmi gingembre, ananas, géranium, litchi, noix de coco) : les mots des fiches restent cachés'); }
  // F4 : une seule fiche.
  if (fc.fiche) {
    if (/\b1\s*\/\s*1\b/.test(fc.ficheTexte)) p('fiche de Citra cryo : F4, « 1/1 » est écrit : une seule fiche se lit comme un plein');
    if (!/seule?\s+(fiche|source)|(fiche|source)\s+seule|une seule/i.test(fc.ficheTexte)) p('fiche de Citra cryo : F4, la fiche ne dit pas qu\'elle repose sur une seule fiche');
  }
  console.log(id + ' · carte et fiche contrôlées');
}
await browser.close();
// Audit du 23.10 : un contrôle qui ne lit aucune page n'est pas un OK (« OK 0/0 »).
if (ids.length === 0) problems.push('aucune maquette lue : 0 page au format attendu ; ce contrôle ne garde rien ici (voir portee-defauts.json)');
if (problems.length) { console.log('CARTE-FICHE ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); }
else console.log('CARTE-FICHE OK ' + ids.length + '/' + ids.length);
