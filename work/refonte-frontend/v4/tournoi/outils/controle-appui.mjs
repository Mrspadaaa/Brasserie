// Contrôle du lot 12 (#140, 19.10, soir) : les carrés d'arômes d'un houblon, expliqués au long appui.
// Les mots du brasseur : « On va refaire un batch de description de houblons, et notamment montrer à
// quoi correspond exactement ces valeurs facile lors du long appuie sur le houblons » (capture : les
// carrés de la carte Motueka entourés).
// Convention auteur, deux pages par variante : <id>/vue.html (au repos) et <id>/appui.html (le long
// appui sur Motueka, montré ouvert). Sur la carte : data-houblon="beermaverick-motueka" ; les carrés
// [data-role="aromes"] [data-famille][data-niveau] (0, 1, 2). Au long appui : [data-role="appui"]
// visible, et pour chaque famille citée ou marquée de Motueka un [data-explique="<famille>"].
// Règles :
//   A1 au repos, rien n'explique les carrés : pas de [data-role="appui"] visible, ni « marqué »,
//      « cité » ou « non décrit » écrits (pas de légende) ;
//   A2 au long appui, chaque famille citée ou marquée dit son nom, son niveau (marqué, cité) et ses
//      fiches (« 2 fiches sur 2 », ou le nom des sources) ;
//   A3 le non décrit se dit « non décrit » (D65 : jamais zéro) ;
//   A4 l'appui dit que ce sont des citations des fiches (« fiche » ou « source » écrit) ;
//   A5 les carrés de Motueka portent les niveaux du pack (pack-fiches.json).
// D70 (19.10, soir, sur le lot 12) : « Non c'est très mauvais. Tu as pas du tout bien compris le
// besoin, c'est entre la version actuelle qui est déjà vraiment plutôt bien et une de ces versions ».
//   A6 au repos, la carte est celle de la base (ecran-1/base/consolide/index.html) : mêmes mots, même
//      hauteur à 6 px près, carrés de même taille à 1 px près ;
//   A7 au long appui, l'explication reste légère : 30 mots au plus, 160 px de haut au plus, collée à la
//      carte (à 12 px au plus) ;
//   A8 elle ne couvre ni le titre « Houblons » ni le champ « Ajouter — houblon… ».
// Usage : node controle-appui.mjs <dossier du lot> [ids…]   Imprime APPUI OK, ou APPUI ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { versUrl, existe, liste } from './lib/cible.mjs';
import puppeteer from 'puppeteer-core';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../../../../..');
const FICHES = JSON.parse(fs.readFileSync(path.join(root, 'prototypes/houblons-v4/data/pack-fiches.json'), 'utf8')).fichesHoublons;
const MOT = FICHES.find((f) => f.key === 'beermaverick-motueka');
const COURT = { citrus: 'Agrumes', tropical: 'Tropicaux', stoneFruit: 'Noyau', pomeFruit: 'Pépins', berries: 'Baies', melon: 'Melon', floral: 'Floral', green: 'Végétal', herbal: 'Herbacé', spice: 'Épicé', earthy: 'Terreux', resin: 'Résineux' };
const dir = path.resolve(process.argv[2] || '.');
const only = process.argv.slice(3).filter((a) => !a.startsWith('--'));
const ids = (only.length ? only : liste(dir).filter((d) => /^[a-z]+\d+$/.test(d) && existe(path.join(dir, d, 'vue.html')))).sort();
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];
// ===== Mode --etape : critère A9 (D112, voie p13-controles-etape, 23.10, soir) =====
// Les mots du brasseur, sur l'étape Houblons de la maquette publiée : « L'appui prolonger fait pas l'effet
// escompté ». Dans Chrome l'appui long ouvre bien la fiche g1 (SPEC), mais aucun retour ne se voit pendant l'appui
// (sa base v4.10 remplit le nom en 500 ms) et le texte de la carte reste sélectionnable (menu du système sur
// iPhone).
//   A9 sur la carte de Nugget de l'étape (<dossier>/ma-biere/etat.html, ou <dossier>/etat.html, ou --page=…) :
//      a) pendant l'appui, le rendu de la carte ou du nom change avant 300 ms (classe, style, couleurs, ombre,
//         fond, transformation, texte, boîte : le doigt tenu, rien d'autre ne bouge) ;
//      b) la fiche s'ouvre ensuite (hash qui change, [role="dialog"], [data-role="fiche"], ou un calque qui couvre
//         la moitié de l'écran) avant 1,5 s ;
//      c) le nom qui porte l'appui (le texte le plus bas de la carte qui dit « Nugget ») n'est pas sélectionnable :
//         user-select calculé à none, et -webkit-touch-callout à none (Chrome ne le calcule pas : lu dans les
//         feuilles de style locales, <style> et <link> de la page, et dans l'attribut style). La base ne garde que ce
//         nom ([data-houblon] : user-select none, touch-callout none) : c'est la référence.
// Usage : node controle-appui.mjs <dossier> --etape [--page=index.html] [--houblon=Nugget]
// Sortie : « A9 … » et APPUI-ETAPE OK, ou APPUI-ETAPE ECHEC et les lignes « - A9 … ».
// Appels existants (M15) : le mode par défaut (lot 12, A1 à A8) n'est pas touché.
if (process.argv.includes('--etape')) {
  const ARGS = process.argv.slice(2);
  const opt = (n, d) => ((ARGS.find((a) => a.startsWith('--' + n + '=')) || '').slice(n.length + 3)) || d;
  const houblon = opt('houblon', 'Nugget');
  const pageArg = opt('page', '');
  const fichier = pageArg ? path.join(dir, pageArg) : existe(path.join(dir, 'ma-biere', 'etat.html')) ? path.join(dir, 'ma-biere', 'etat.html') : path.join(dir, 'etat.html');
  const attente = (ms) => new Promise((r) => setTimeout(r, ms));
  const infos = [];
  const sortir = async () => {
    await browser.close();
    for (const x of infos) console.log(x);
    if (problems.length) { console.log('APPUI-ETAPE ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('- A9 ' + x); process.exit(1); }
    console.log('APPUI-ETAPE OK');
    process.exit(0);
  };
  if (!existe(fichier)) { problems.push('page absente : ' + fichier); await sortir(); }
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(versUrl(fichier).href, { waitUntil: 'load', timeout: 30000 });
  await attente(1200);
  // Le nom qui porte l'appui, dans la carte de Nugget.
  const cible = () => page.evaluate((nom) => {
    const vis = (e) => { for (let x = e; x && x !== document.documentElement; x = x.parentElement) { const cs = getComputedStyle(x); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) <= 0.15) return false; } const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
    const cartes = [...document.querySelectorAll('[data-role="ligne-houblon"]')].filter((l) => vis(l) && l.innerText.toLowerCase().includes(nom.toLowerCase()));
    const carte = cartes[0];
    if (!carte) return null;
    const noms = [...carte.querySelectorAll('*')].filter((e) => !e.children.length && vis(e) && e.textContent.trim().toLowerCase() === nom.toLowerCase());
    const e = noms[0];
    if (!e) return { carte: true, nom: false };
    const b = e.getBoundingClientRect();
    document.querySelectorAll('[data-a9]').forEach((x) => x.removeAttribute('data-a9'));
    carte.setAttribute('data-a9', 'carte'); e.setAttribute('data-a9', 'nom');
    return { carte: true, nom: true, x: b.left + b.width / 2, y: b.top + b.height / 2 };
  }, houblon);
  const instantane = () => page.evaluate(() => {
    const carte = document.querySelector('[data-a9="carte"]'), nom = document.querySelector('[data-a9="nom"]');
    if (!carte || !nom) return null;
    const P = ['backgroundColor', 'backgroundImage', 'backgroundSize', 'backgroundPosition', 'boxShadow', 'transform', 'opacity', 'color', 'outlineColor', 'outlineWidth', 'borderColor', 'borderWidth', 'textDecorationLine', 'textDecorationColor', 'filter', 'scale'];
    const css = (e, ps) => P.map((p) => { const cs = getComputedStyle(e, ps); return cs[p]; }).join('|');
    const r = (e) => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height].map((v) => Math.round(v * 2)).join(','); };
    return JSON.stringify([carte.className, carte.getAttribute('style'), nom.className, nom.getAttribute('style'), carte.innerText, css(carte), css(nom), css(carte, '::before'), css(carte, '::after'), css(nom, '::before'), css(nom, '::after'), r(carte), r(nom),
      [...carte.querySelectorAll('[class]')].map((x) => x.className).join(' ')]);
  });
  const calque = () => page.evaluate(() => {
    const vis = (e) => { for (let x = e; x && x !== document.documentElement; x = x.parentElement) { const cs = getComputedStyle(x); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) <= 0.15) return false; } const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
    const grands = [...document.querySelectorAll('body *')].filter((e) => { const cs = getComputedStyle(e); if (cs.position !== 'fixed' && cs.position !== 'absolute') return false; const b = e.getBoundingClientRect(); return vis(e) && b.width * b.height >= 0.5 * innerWidth * innerHeight; }).length;
    const dialogues = [...document.querySelectorAll('[role="dialog"], [data-role="fiche"], [data-fiche]')].filter(vis).length;
    return { hash: location.hash, grands, dialogues };
  });
  let t = null;
  for (let i = 0; i < 40 && !t; i++) { t = await cible(); if (!t) await attente(100); }
  if (!t) problems.push('la carte de ' + houblon + ' ([data-role="ligne-houblon"]) est introuvable');
  else if (!t.nom) problems.push('aucun texte « ' + houblon + ' » dans la carte : rien à presser');
  else {
    // Le rendu doit être stable au repos : un fond animé en continu ne prouverait rien.
    const r1 = await instantane(); await attente(120); const r2 = await instantane();
    if (r1 !== r2) problems.push('le rendu de la carte change tout seul au repos (animation continue) : un retour ne se distingue plus');
    const avant = await calque();
    const doigt = await page.touchscreen.touchStart(t.x, t.y);
    const t0 = Date.now();
    let premier = null, fiche = null, dernier = Date.now();
    while (Date.now() - t0 < 1600 && (premier === null || fiche === null)) {
      const s = await instantane(), c = await calque(), dt = Date.now() - t0;
      if (premier === null && s !== r1) premier = dt;
      if (fiche === null && (c.hash !== avant.hash || c.dialogues > avant.dialogues || c.grands > avant.grands)) fiche = dt;
      dernier = dt;
      await attente(15);
    }
    await doigt.end();
    infos.push('retour pendant l\'appui : ' + (premier === null ? 'aucun en ' + dernier + ' ms' : premier + ' ms') + ' · fiche : ' + (fiche === null ? 'jamais ouverte' : fiche + ' ms'));
    if (premier === null) problems.push('aucun retour visible pendant l\'appui : le rendu de la carte et du nom ne bouge pas (' + dernier + ' ms de doigt posé)');
    else if (premier >= 300) problems.push('le retour vient trop tard : ' + premier + ' ms (moins de 300 ms)');
    if (fiche === null) problems.push('la fiche ne s\'ouvre pas à l\'appui long (hash, dialogue ou calque)');
    // Sélection : user-select calculé, touch-callout lu dans les feuilles locales.
    const sources = await page.evaluate(() => [...document.styleSheets].map((s) => (s.ownerNode && s.ownerNode.tagName === 'LINK' ? { href: s.href } : { texte: s.ownerNode ? s.ownerNode.textContent : '' })));
    let css = '';
    for (const s of sources) {
      if (s.texte) css += '\n' + s.texte;
      else if (s.href && s.href.startsWith('file:')) { try { css += '\n' + fs.readFileSync(new URL(s.href), 'utf8'); } catch { /* feuille absente */ } }
      else if (s.href && /^https?:/.test(s.href) && s.href.startsWith(new URL(page.url()).origin)) css += '\n' + await page.evaluate((h) => fetch(h).then((r) => r.text()).catch(() => ''), s.href); // page servie (#161)
    }
    const selecteurs = [];
    for (const m of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)) if (/-webkit-touch-callout\s*:\s*none/.test(m[2])) for (const s of m[1].split(',')) selecteurs.push(s.trim());
    const sel = await page.evaluate((selecteurs) => {
      const e = document.querySelector('[data-a9="nom"]');
      const cs = getComputedStyle(e);
      let callout = false;
      for (let x = e; x && !callout; x = x.parentElement) {
        if (/-webkit-touch-callout\s*:\s*none/.test(x.getAttribute('style') || '')) callout = true;
        for (const s of selecteurs) { try { if (x.matches(s)) { callout = true; break; } } catch { /* sélecteur étranger */ } }
      }
      return { us: cs.userSelect, callout, selection: String(getSelection()) };
    }, selecteurs);
    infos.push('nom pressé : user-select ' + sel.us + ' · touch-callout none ' + (sel.callout ? 'oui' : 'non') + ' (' + selecteurs.length + ' règle(s) de touch-callout dans les feuilles)');
    if (sel.us !== 'none') problems.push('le texte « ' + houblon + ' » de la carte reste sélectionnable : user-select ' + sel.us + ' (none attendu)');
    if (!sel.callout) problems.push('le menu du système n\'est pas coupé sur le texte de la carte : -webkit-touch-callout none est absent (sur iPhone, l\'appui tenu ouvre le menu)');
    if (sel.selection) problems.push('du texte est sélectionné après l\'appui (« ' + sel.selection.slice(0, 30) + ' »)');
  }
  await sortir();
}
const lire = async (f) => {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(versUrl(f).href, { waitUntil: 'networkidle0', timeout: 30000 });
  const r = await page.evaluate(() => {
    const vis = (e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.15; };
    let carte = document.querySelector('[data-houblon="beermaverick-motueka"]');
    // La base porte data-houblon sur le nom : sa carte est le bouton de l'ajout proposé.
    if (carte && carte.tagName === 'B' && carte.closest('.rapide')) carte = carte.closest('.rapide');
    const rect = (e) => { const b = e.getBoundingClientRect(); return { t: b.top, b: b.bottom, l: b.left, r: b.right, h: b.height }; };
    const repos = carte ? (() => {
      const cl = carte.cloneNode(true); cl.querySelectorAll('[data-role="appui"]').forEach((x) => x.remove());
      const box = document.createElement('div'); box.style.cssText = 'position:absolute;left:-9999px;width:' + carte.getBoundingClientRect().width + 'px'; box.append(cl); document.body.append(box);
      const txt = cl.innerText.replace(/\s+/g, ' ').trim(); box.remove();
      const cs = [...carte.querySelectorAll('[data-famille], [data-role="aromes"] .c')].filter((x) => !x.closest('[data-role="appui"]')).slice(0, 12).map((x) => { const b = x.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; });
      return { txt, h: carte.getBoundingClientRect().height, cs, rc: rect(carte) };
    })() : null;
    const zones = [...document.querySelectorAll('h1')].filter((e) => /Houblons/.test(e.innerText)).map(rect)
      .concat([...document.querySelectorAll('input, [data-role="champ"]')].filter(vis).map(rect))
      .concat([...document.querySelectorAll('body *')].filter((e) => vis(e) && [...e.childNodes].some((n) => n.nodeType === 3 && /^\s*Ajouter\s*—\s*houblon/.test(n.textContent))).map(rect));
    const cases = carte ? [...carte.querySelectorAll('[data-role="aromes"] [data-famille]')].map((c) => ({ f: c.dataset.famille, n: Number(c.dataset.niveau) })) : null;
    const appui = [...document.querySelectorAll('[data-role="appui"]')].filter(vis);
    const explique = Object.fromEntries([...document.querySelectorAll('[data-explique]')].filter(vis).map((e) => [e.dataset.explique, e.innerText.replace(/\s+/g, ' ').trim()]));
    // La légende se cherche sur les cartes des houblons (« Boisé et résineux trop marqué », plus bas, est le goût de ma bière).
    const texte = [...document.querySelectorAll('[data-houblon]')].filter(vis).map((e) => e.innerText).join(' ');
    const ra = appui.map(rect);
    const boite = ra.length ? { t: Math.min(...ra.map((x) => x.t)), b: Math.max(...ra.map((x) => x.b)), l: Math.min(...ra.map((x) => x.l)), r: Math.max(...ra.map((x) => x.r)) } : null;
    const appuiTexte = appui.map((a) => a.innerText).join(' ').replace(/\s+/g, ' ');
    const couvre = boite ? zones.some((z) => boite.t < z.b - 1 && z.t < boite.b - 1 && boite.l < z.r - 1 && z.l < boite.r - 1) : false;
    return { carte: !!carte, cases, appui: appui.length, appuiTexte, explique, legende: /(^|[^\p{L}])(marqué|cité|non décrit)(?!\p{L})/iu.test(texte), repos, boite, mots: appuiTexte.split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w)).length, couvre };
  });
  await page.close();
  return r;
};
// La carte de référence : l'ajout proposé Motueka de la base courante.
const BASE = (await lire(path.join(root, 'work/refonte-frontend/v4/ecran-1/base/consolide/index.html'))).repos;
for (const id of ids) {
  const p = (m) => problems.push(id + ' : ' + m);
  const vue = path.join(dir, id, 'vue.html'), app = path.join(dir, id, 'appui.html');
  if (!existe(app)) { p('pas de page appui.html (le long appui sur Motueka, montré ouvert)'); continue; }
  const r = await lire(vue), a = await lire(app);
  for (const [nom, x] of [['vue', r], ['appui', a]]) {
    if (!x.carte) { p(nom + ' : pas de carte data-houblon="beermaverick-motueka"'); continue; }
    if (!x.cases || x.cases.length < 12) p(nom + ' : les carrés de Motueka ne portent pas data-famille et data-niveau (' + (x.cases ? x.cases.length : 0) + ' sur 12)');
    else for (const ar of MOT.aromes) { const c = x.cases.find((y) => y.f === ar.family); if (!c || c.n !== ar.level) p(nom + ' : A5, ' + ar.name + ' au niveau ' + (c ? c.n : '?') + ' au lieu de ' + ar.level + ' (' + ar.label + ')'); }
  }
  if (r.appui) p('A1 : au repos, l\'explication est déjà ouverte');
  if (r.legende) p('A1 : au repos, « marqué », « cité » ou « non décrit » est écrit (une légende)');
  if (!a.appui) p('A2 : au long appui, pas d\'explication visible ([data-role="appui"])');
  for (const ar of MOT.aromes.filter((x) => x.level > 0)) {
    const t = a.explique[ar.family];
    if (!t) { p('A2 : au long appui, ' + ar.name + ' (' + ar.label + ') n\'est pas expliqué ([data-explique="' + ar.family + '"])'); continue; }
    if (!t.toLowerCase().includes(COURT[ar.family].toLowerCase()) && !t.toLowerCase().includes(ar.name.toLowerCase())) p('A2 : ' + ar.family + ' expliqué sans son nom (« ' + t.slice(0, 40) + ' »)');
    if (!t.includes(ar.label)) p('A2 : ' + ar.name + ' expliqué sans son niveau « ' + ar.label + ' »');
    if (!(new RegExp(ar.sources + '\\s*(fiches?|sources?)?\\s*sur\\s*' + ar.of).test(t) || ar.authors.every((n) => t.includes(n)))) p('A2 : ' + ar.name + ' expliqué sans ses fiches (« ' + ar.sources + ' sur ' + ar.of + ' » ou ' + ar.authors.join(', ') + ')');
  }
  if (!/non décrit/i.test(a.appuiTexte)) p('A3 : au long appui, le non décrit n\'est pas dit « non décrit »');
  if (!/fiche|source/i.test(a.appuiTexte)) p('A4 : au long appui, rien ne dit que ce sont des citations des fiches');
  // D70 : à mi-chemin entre la carte actuelle et une idée du lot.
  if (r.repos && BASE) {
    if (r.repos.txt !== BASE.txt) p('A6 : au repos, la carte ne dit plus la même chose que la base (« ' + r.repos.txt + ' » au lieu de « ' + BASE.txt + ' »)');
    if (Math.abs(r.repos.h - BASE.h) > 6) p('A6 : au repos, la carte fait ' + Math.round(r.repos.h) + ' px de haut au lieu de ' + Math.round(BASE.h) + ' (base)');
    const [bw, bh] = BASE.cs[0] || [0, 0];
    const autre = r.repos.cs.find(([w, hh]) => Math.abs(w - bw) > 1 || Math.abs(hh - bh) > 1);
    if (autre || r.repos.cs.length < 12) p('A6 : au repos, les carrés ne sont plus ceux de la base (' + (autre ? autre.join('×') : r.repos.cs.length + ' carrés') + ' au lieu de ' + bw + '×' + bh + ')');
  }
  if (a.boite && a.repos) {
    if (a.mots > 30) p('A7 : au long appui, ' + a.mots + ' mots (30 au plus) : l\'explication reste légère');
    const hb = a.boite.b - a.boite.t;
    if (hb > 160) p('A7 : au long appui, l\'explication fait ' + Math.round(hb) + ' px de haut (160 au plus)');
    const ecart = Math.max(0, a.boite.t - a.repos.rc.b, a.repos.rc.t - a.boite.b);
    if (ecart > 12) p('A7 : au long appui, l\'explication est à ' + Math.round(ecart) + ' px de la carte (12 au plus)');
    if (a.couvre) p('A8 : au long appui, l\'explication couvre le titre ou le champ « Ajouter — houblon… »');
  }
  console.log(id + ' · appui contrôlé');
}
await browser.close();
// Audit du 23.10 : un contrôle qui ne lit aucune page n'est pas un OK (« OK 0/0 »).
if (ids.length === 0) problems.push('aucune maquette lue : 0 page au format attendu ; ce contrôle ne garde rien ici (voir portee-defauts.json)');
if (problems.length) { console.log('APPUI ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); }
else console.log('APPUI OK ' + ids.length + '/' + ids.length);
