#!/usr/bin/env node
// D107 (23.10, soir, maquette publiée d332792c) : « Ah mais comparé est que le dryhopping ??? C'est pas ce que je
// voulais je voulais comparé au moins : les étapes 60' 10' dryhopping ect comme la maquette de base. Et aussi le
// houblon de base ou bière de base. Est-ce que cela est clair ? »
// Comparer (r6a) ne comparait qu'un moment fixé (l'étiquette « après, 3 j » de la ligne de contexte). Sa « maquette de
// base » est x3b (lot 21) : la bière de base en pointillé, les familles qui montent à chaque ajout.
//
// Règle : sur Comparer, rendu AU REPOS (aucun toucher), chaque houblon comparé a sa valeur à 60′, 10′ et au dry hop
// au moins, et une référence (un houblon de la recette, ou la bière de base) a les siennes aux mêmes étapes ;
// toutes ces valeurs sont visibles ensemble, dans un seul écran.
//
// Contrat de marqueurs (le même que la voie p3, qui refait Comparer) :
//   - houblon comparé : [data-houblon-compare="<clé du moteur>"] (au moins deux) ;
//   - valeur à une étape : [data-etape="<code>"][data-houblon="<clé>"], codes b60 b10 b5 wp dryActive dryPost ;
//     le texte porte un nombre (« ~ » devant s'il est simulé) ou « ? » ; jamais vide ; un [data-inconnu] ne montre
//     jamais « 0 » (l'inconnu n'est pas 0) ;
//   - exigé pour chaque houblon comparé et pour la référence : b60, b10, et dryActive ou dryPost ;
//   - visibles ensemble : ni cachées (display, visibility, opacity, hidden, <details> fermé, aria-hidden d'un
//     ancêtre, rognées par un ancêtre), ni couvertes (le point central, une fois l'élément défilé à l'écran, renvoie
//     l'élément ou un descendant : le dock « Placer » ne doit pas les cacher), ni hors de la largeur de la page ; et
//     l'écart vertical entre la plus haute et la plus basse tient dans la hauteur de la fenêtre ;
//   - étapes nommées : le texte visible contient 60′ (ou 60'), 10′ (ou 10') et « dry hop » (ou « à froid ») ;
//   - référence : un [data-reference] visible au repos, soit "houblon" + data-houblon=<clé d'un houblon de
//     window.__parcours.etat.recette.additions[].hopKey>, soit "biere" (la bière de base) ; ses valeurs sont les
//     [data-etape] qu'il contient, ou [data-etape][data-houblon=<clé de la référence>]. Elle n'est pas un houblon
//     comparé.
//
// Usage : node controle-comparer-etapes.mjs <dossier construit> [--page=etat.html] [--largeur=390|1280]
//   Page lue : <dossier>/comparer/<page>, à 390 × 844 tactile puis à 1280 × 800 (sans --largeur : les deux).
//   Une ligne par largeur, puis « COMPARER-ETAPES OK (n houblons + référence <clé|biere>, étapes …) » (code 0),
//   ou « COMPARER-ETAPES ECHEC » et une ligne « - D107 … » par manque (code 1). Code 2 si la page manque.
//
// D114 (23.10, soir, sur « Panel OSU, Cascade ») : « Beaucoup trop mis en avant ». Règle, à 390 × 844, au repos :
//   - le panel OSU (repéré par [data-element~="y3-panel-osu"] ou [data-acquis="osu"], sinon par son titre
//     « Panel OSU ») existe ;
//   - il est REPLIÉ au repos, comme les blocs voisins (« Chimie et vraies valeurs », « Égaler ») : on n'en voit que
//     le titre ou le déclencheur (un élément visible dont le texte commence par « Panel OSU »), pas son contenu
//     (graphique, notes, sources : tout élément visible hors de la ligne de titre) ;
//   - il s'ouvre d'un toucher : déclencheur visible au repos (<button>, <summary>, [role="button"] avec
//     aria-controls vers un conteneur qui le porte ou le contient, ou data-ouvre-acquis / data-ouvre-element qui
//     contient « osu » ; <details> fermé : son <summary>), le toucher étant joué pour de vrai (page rechargée, un
//     seul tap) ; le contenu est alors visible ;
//   - son titre ou déclencheur n'est pas dans les 844 premiers pixels ;
//   - son titre (l'élément le plus profond dont le texte commence par « Panel OSU ») n'est ni plus gras ni plus
//     grand que le plus fort des titres des autres blocs (h2 à h6, [role=heading], <summary>, <button
//     aria-controls> visibles, hors panel et hors h1) ; s'il n'y en a aucun, c'est un manque (rien à comparer).
//   Les lignes d'échec commencent par « - D114 ». Jouée à 390 px seulement (pas avec --largeur=1280).
// Témoins (temoins/comparer-etapes-<cas>/comparer/etat.html) : ok et ok-houblon → OK ; un-moment (forme r6a),
// cache (dry hop sous un <details> fermé), sans-reference, trop-haut (étapes sur deux écrans), panel-haut (panel OSU
// au premier écran, titre gras) → ECHEC.
// Sur d332792c (maquette rejetée) : ECHEC, « 0 valeur d'étape (une seule : après, 3 j) ».
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { versUrl, existe } from './lib/cible.mjs';

const ici = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ici, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const args = process.argv.slice(2);
const opt = (nom, defaut) => { const a = args.find((x) => x.startsWith('--' + nom + '=')); return a ? a.slice(nom.length + 3) : defaut; };
const dossier = path.resolve(RACINE, args.find((a) => !a.startsWith('--')) ?? '.');
const page = opt('page', 'etat.html');
const seule = opt('largeur', null);
const TAILLES = [
  { l: 390, h: 844, mobile: true, nom: '390x844 tactile' },
  { l: 1280, h: 800, mobile: false, nom: '1280x800' },
].filter((t) => !seule || String(t.l) === String(seule));
const fichier = path.join(dossier, 'comparer', page);
if (!existe(fichier)) { console.log('COMPARER-ETAPES ECHEC : page absente (' + path.relative(RACINE, fichier) + ')'); process.exit(2); }
if (!TAILLES.length) { console.log('COMPARER-ETAPES ECHEC : --largeur=390 ou 1280'); process.exit(2); }

const NOMS = { b60: '60′', b10: '10′', dry: 'dry hop (dryActive ou dryPost)' };

// Tout ce qui se mesure dans la page, au repos. Retourne des faits ; le jugement est fait hors de la page.
function mesurer() {
  const H = window.innerHeight;
  const L = document.documentElement.clientWidth;
  const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();

  // Pourquoi un élément n'est pas visible (null s'il l'est), sans le défiler.
  const pourquoiCache = (el) => {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === 'none') return 'display:none';
      if (cs.visibility === 'hidden' || cs.visibility === 'collapse') return 'visibility:hidden';
      if (parseFloat(cs.opacity) === 0) return 'opacity:0';
      if (n.hasAttribute('hidden')) return 'attribut hidden';
      if (n.getAttribute('aria-hidden') === 'true') return 'aria-hidden';
      if (n.parentElement && n.parentElement.tagName === 'DETAILS' && !n.parentElement.open && n.tagName !== 'SUMMARY') return '<details> fermé';
    }
    if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return 'non rendu (checkVisibility)';
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return 'taille nulle';
    // Rogné par un ancêtre qui défile ou coupe : le centre doit être dans son cadre.
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (let n = el.parentElement; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
      const a = n.getBoundingClientRect();
      if (cx < a.left - 0.5 || cx > a.right + 0.5 || cy < a.top - 0.5 || cy > a.bottom + 0.5) return 'rogné ou à défiler dans un cadre (hors de son cadre au repos)';
    }
    return null;
  };

  // Un élément : texte, visibilité, largeur, position absolue (au repos, défilement 0), puis couverture.
  const fait = (el) => {
    const r = el.getBoundingClientRect();
    const txt = norm(el.innerText || el.textContent);
    return {
      el,
      texte: txt,
      inconnu: el.hasAttribute('data-inconnu'),
      cache: pourquoiCache(el),
      hors: r.left < -0.5 || r.right > L + 0.5,
      haut: r.top + window.scrollY,
      bas: r.bottom + window.scrollY,
      couvert: null,
    };
  };
  const tous = [...document.querySelectorAll('[data-etape]')].map((el) => ({
    code: el.getAttribute('data-etape'),
    cle: el.getAttribute('data-houblon') || '',
    dansRef: [...document.querySelectorAll('[data-reference]')].map((r) => r.contains(el)),
    ...fait(el),
  }));
  const compares = [...new Set([...document.querySelectorAll('[data-houblon-compare]')].map((e) => e.getAttribute('data-houblon-compare')))];
  const refs = [...document.querySelectorAll('[data-reference]')].map((el) => ({
    type: el.getAttribute('data-reference'),
    cle: el.getAttribute('data-houblon') || '',
    estCompare: el.hasAttribute('data-houblon-compare'),
    cache: pourquoiCache(el),
    ...(() => { const r = el.getBoundingClientRect(); return { hors: r.left < -0.5 || r.right > L + 0.5 }; })(),
  }));
  const additions = (window.__parcours && window.__parcours.etat && window.__parcours.etat.recette && window.__parcours.etat.recette.additions) || null;
  const texteVisible = norm(document.body.innerText);

  // Couverture : chaque valeur visible est défilée à l'écran (centrée), on regarde ce qui est au point central.
  for (const t of tous) {
    if (t.cache) continue;
    t.el.scrollIntoView({ block: 'center', inline: 'center' });
    const r = t.el.getBoundingClientRect();
    const cx = Math.min(Math.max(r.left + r.width / 2, 0), L - 1), cy = Math.min(Math.max(r.top + r.height / 2, 0), H - 1);
    const hit = document.elementFromPoint(cx, cy);
    if (!hit || !(t.el === hit || t.el.contains(hit))) {
      const d = hit ? hit.tagName.toLowerCase() + (hit.id ? '#' + hit.id : '') + (hit.className && typeof hit.className === 'string' ? '.' + hit.className.trim().split(/\s+/)[0] : '') : 'rien';
      t.couvert = d;
    }
  }
  window.scrollTo(0, 0);
  return {
    H, L, compares, refs, additions, texteVisible,
    tous: tous.map(({ el, ...reste }) => reste),
  };
}

// Le panel OSU, au repos, sans défiler : trouvé, ouvert ou replié, son titre ou déclencheur visible (haut, style),
// les titres des autres blocs, et les déclencheurs visibles qui pourraient l'ouvrir (avec un index, pour les rejouer).
function mesurerOsu() {
  const norm = (t) => String(t || '').replace(/\s+/g, ' ').trim();
  const cache = (el) => {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.visibility === 'collapse' || parseFloat(cs.opacity) === 0) return true;
      if (n.hasAttribute('hidden') || n.getAttribute('aria-hidden') === 'true') return true;
      if (n.parentElement && n.parentElement.tagName === 'DETAILS' && !n.parentElement.open && n.tagName !== 'SUMMARY') return true;
    }
    const r = el.getBoundingClientRect();
    return !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) || r.width <= 0 || r.height <= 0;
  };
  const debut = (el) => /^Panel OSU/i.test(norm(el.textContent));
  const plusProfond = (racine) => {
    let courant = racine, change = true;
    while (change) { change = false; for (const c of courant.children) if (debut(c)) { courant = c; change = true; break; } }
    return courant;
  };
  let panel = document.querySelector('[data-element~="y3-panel-osu"], [data-acquis="osu"]');
  let titre = null;
  if (panel) {
    const t = panel === document.body ? null : (debut(panel) ? panel : [...panel.querySelectorAll('*')].find(debut));
    titre = t ? plusProfond(t) : null;
  } else {
    const t = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,summary,legend,b,strong,p,span,div,button')].filter(debut).filter((e) => norm(e.textContent).length < 80)[0];
    if (t) { titre = plusProfond(t); panel = t.closest('section, article, details, [role="region"]') || t.parentElement; }
  }
  const out = { trouve: !!panel, titreTexte: titre ? norm(titre.textContent).slice(0, 40) : '' };
  if (!panel) return out;
  const poids = (e) => { const w = getComputedStyle(e).fontWeight; return w === 'bold' ? 700 : w === 'normal' ? 400 : parseInt(w, 10) || 400; };
  const taille = (e) => parseFloat(getComputedStyle(e).fontSize) || 0;
  const DECL = 'button, summary, [role="button"]';

  // Les déclencheurs visibles au repos qui ouvrent le panel.
  out.declencheurs = [...document.querySelectorAll(DECL)].map((d, i) => {
    if (cache(d)) return null;
    const ouvre = (d.getAttribute('data-ouvre-acquis') || '') + ' ' + (d.getAttribute('data-ouvre-element') || '');
    let ok = /(^|[^a-z])osu([^a-z]|$)/i.test(ouvre);
    for (const id of (d.getAttribute('aria-controls') || '').split(/\s+/).filter(Boolean)) {
      const c = document.getElementById(id);
      if (c && (c === panel || c.contains(panel) || panel.contains(c))) ok = true;
    }
    const det = d.tagName === 'SUMMARY' ? d.parentElement : null;
    if (det && det.tagName === 'DETAILS' && det.contains(panel)) ok = true;
    return ok ? i : null;
  }).filter((i) => i !== null);

  // Le contenu : tout élément visible du panel hors de la ligne de titre (le fils du panel qui porte le titre).
  let ligneTitre = titre;
  while (ligneTitre && ligneTitre.parentElement && ligneTitre.parentElement !== panel && panel.contains(ligneTitre.parentElement)) ligneTitre = ligneTitre.parentElement;
  const contenu = [...panel.querySelectorAll('*')].filter((e) => {
    if (ligneTitre && (ligneTitre === e || ligneTitre.contains(e) || e.contains(ligneTitre))) return false;
    if (cache(e)) return false;
    const propre = [...e.childNodes].some((n) => n.nodeType === 3 && norm(n.textContent));
    return propre || /^(svg|canvas|img)$/i.test(e.tagName);
  });
  out.ouvert = contenu.length > 0;
  out.contenuVu = contenu.slice(0, 3).map((e) => e.tagName.toLowerCase() + (norm(e.textContent) ? ' « ' + norm(e.textContent).slice(0, 24) + ' »' : ''));

  // Ce qu'on voit au repos : le titre, ou le déclencheur dont le texte commence par « Panel OSU ».
  let entete = titre && !cache(titre) ? titre : null;
  if (!entete) {
    const hs = [...document.querySelectorAll(DECL)].filter((d) => !cache(d) && debut(d));
    if (hs.length) entete = plusProfond(hs[0]);
  }
  if (!entete && out.declencheurs.length) {
    const d = [...document.querySelectorAll(DECL)][out.declencheurs[0]];
    if (d) entete = d;
  }
  out.entete = !!entete;
  const cible = entete || titre;
  const r = (entete || panel).getBoundingClientRect();
  out.haut = Math.round(r.top + window.scrollY);
  out.titre = cible ? { poids: poids(cible), taille: taille(cible) } : null;
  out.autres = [...document.querySelectorAll('h2,h3,h4,h5,h6,[role="heading"],summary,button[aria-controls]')]
    .filter((e) => !panel.contains(e) && !e.contains(panel) && !(cible && (e === cible || e.contains(cible) || cible.contains(e))) && !cache(e) && norm(e.textContent).length > 2 && norm(e.textContent).length < 80)
    .map((e) => ({ texte: norm(e.textContent).slice(0, 36), poids: poids(e), taille: taille(e) }));
  return out;
}

const manques114 = []; // lignes « D114 … »
const manques = new Map(); // message -> largeurs où il tombe
const lignes = [];
let resume = null;
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
try {
  for (const t of TAILLES) {
    const p = await browser.newPage();
    await p.setViewport({ width: t.l, height: t.h, deviceScaleFactor: 1, isMobile: t.mobile, hasTouch: t.mobile });
    await p.goto(versUrl(fichier).href, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
    await p.waitForSelector('[data-houblon-compare], [data-etape]', { timeout: 6000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 700));
    const m = await p.evaluate(mesurer);
    await p.close();
    if (t.l === 390) {
      const q = await browser.newPage();
      await q.setViewport({ width: t.l, height: t.h, deviceScaleFactor: 1, isMobile: t.mobile, hasTouch: t.mobile });
      const charger = async () => {
        await q.goto(versUrl(fichier).href, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
        await q.waitForSelector('[data-houblon-compare], [data-etape], [data-acquis]', { timeout: 6000 }).catch(() => {});
        await new Promise((r) => setTimeout(r, 700));
      };
      await charger();
      const o = await q.evaluate(mesurerOsu);
      const mal114 = (x) => manques114.push(x);
      if (!o.trouve) mal114('panel OSU absent (ni [data-element~="y3-panel-osu"], ni [data-acquis="osu"], ni titre « Panel OSU ») : l\'acquis du panel doit rester, replié');
      else {
        let ou;
        if (o.ouvert) {
          ou = 'OUVERT au repos (' + o.contenuVu.join(', ') + '), haut à ' + o.haut + ' px';
          mal114('panel OSU ouvert au repos, seul bloc détaillé déplié (contenu visible : ' + o.contenuVu.join(', ') + ') : trop mis en avant, le replier comme « Chimie et vraies valeurs » et « Égaler » (titre ou déclencheur seulement, contenu à un toucher)');
        } else if (!o.entete) {
          ou = 'replié, sans titre ni déclencheur visible';
          mal114('panel OSU replié mais sans titre ni déclencheur visible au repos (un élément dont le texte commence par « Panel OSU », ou un déclencheur avec aria-controls vers lui)');
        } else {
          let atteint = false;
          for (const i of o.declencheurs) {
            await charger();
            const hs = await q.$$('button, summary, [role="button"]');
            if (!hs[i]) continue;
            await hs[i].tap().catch(() => {});
            await new Promise((r) => setTimeout(r, 450));
            const a = await q.evaluate(mesurerOsu);
            if (a.trouve && a.ouvert) { atteint = true; break; }
          }
          ou = atteint ? 'replié, titre ou déclencheur visible, s\'ouvre d\'un toucher' : 'replié, titre visible, mais pas ouvert par un toucher';
          if (!atteint) mal114('panel OSU replié qui ne s\'ouvre pas d\'un toucher (déclencheur visible avec aria-controls vers lui, ou <summary> d\'un <details>)' + (o.declencheurs.length ? ' : ' + o.declencheurs.length + ' déclencheur(s) joué(s) sans effet' : ' : aucun déclencheur'));
        }
        if (o.entete && o.haut < t.h) mal114('titre ou déclencheur du panel OSU au premier écran (haut à ' + o.haut + ' px, sous ' + t.h + ' px) : le descendre sous le premier écran');
        if (!o.titre) mal114('panel OSU : titre « Panel OSU » introuvable');
        else if (!o.autres.length) mal114('panel OSU : aucun autre titre de bloc visible (h2 à h6, summary, button[aria-controls]) pour comparer le sien (' + o.titre.poids + ', ' + o.titre.taille + ' px)');
        else {
          const pm = Math.max(...o.autres.map((a) => a.poids)), tm = Math.max(...o.autres.map((a) => a.taille));
          const ref = o.autres.map((a) => '« ' + a.texte + ' » ' + a.poids + '/' + a.taille + ' px').join(', ');
          if (o.titre.poids > pm) mal114('titre du panel OSU plus gras (' + o.titre.poids + ' contre ' + pm + ') que les autres blocs : ' + ref);
          if (o.titre.taille > tm) mal114('titre du panel OSU plus grand (' + o.titre.taille + ' px contre ' + tm + ' px) que les autres blocs : ' + ref);
        }
        lignes.push('panel OSU (' + t.nom + ') : ' + ou + ', titre ' + (o.titre ? o.titre.poids + ' / ' + o.titre.taille + ' px' : '?') + ', ' + o.autres.length + ' autre(s) titre(s) de bloc');
      }
      await q.close();
    }

    const sortie = []; // problèmes de cette largeur
    const mal = (s) => sortie.push(s);
    const nomHoublon = (c) => c;
    const valide = (v) => {
      if (!v.texte) return 'texte vide';
      if (!/^(~\s*)?-?\d+([.,]\d+)?|^\?/.test(v.texte)) return 'texte « ' + v.texte.slice(0, 24) + ' » (un nombre, « ~ » devant s\'il est simulé, ou « ? »)';
      if (v.inconnu && /^(~\s*)?0([.,]0+)?(?![\d.,])/.test(v.texte)) return 'inconnu affiché « ' + v.texte.slice(0, 12) + ' » (l\'inconnu n\'est pas 0)';
      return null;
    };
    const etatEtape = (v) => valide(v) || (v.cache ? 'caché au repos (' + v.cache + ')' : null) || (v.hors ? 'hors de la largeur de la page' : null) || (v.couvert ? 'couvert (' + v.couvert + ' au point central)' : null);
    const exige = [['b60', ['b60']], ['b10', ['b10']], ['dry', ['dryActive', 'dryPost']]];
    const retenues = []; // valeurs bonnes, pour l'écart vertical
    const verifier = (qui, candidats) => {
      for (const [nom, codes] of exige) {
        const c = candidats.filter((v) => codes.includes(v.code));
        if (!c.length) { mal(qui + ' : pas de valeur à ' + NOMS[nom] + ' (aucun [data-etape="' + codes.join('"] ni [data-etape="') + '"])'); continue; }
        const bonne = c.find((v) => !etatEtape(v));
        if (bonne) retenues.push(bonne);
        else mal(qui + ' : valeur à ' + NOMS[nom] + ' ' + etatEtape(c[0]));
      }
    };

    // Les houblons comparés.
    if (m.compares.length < 2) mal('moins de deux houblons comparés (' + m.compares.length + ' [data-houblon-compare])');
    if (m.tous.length) for (const cle of m.compares) verifier('houblon ' + nomHoublon(cle), m.tous.filter((v) => v.cle === cle));
    if (!m.tous.length) {
      const seul = (m.texteVisible.match(/apr[èe]s,?\s*\d+\s*j/i) || [])[0];
      mal('0 valeur d\'étape' + (seul ? ' (une seule : ' + seul + ')' : ' (aucun [data-etape])') + ' pour ' + (m.compares.length ? m.compares.join(', ') : 'aucun houblon') + ' : Comparer ne compare pas les étapes 60′, 10′, dry hop');
    }

    // La référence.
    const visibles = m.refs.filter((r) => !r.cache);
    let refNom = null;
    if (!m.refs.length) mal('pas de référence : ni houblon de base ni bière de base (aucun [data-reference])');
    else if (!visibles.length) mal('référence cachée au repos (' + m.refs[0].cache + ')');
    else {
      const idx = m.refs.indexOf(visibles[0]);
      const r = visibles[0];
      if (r.estCompare) mal('la référence est un houblon comparé (data-houblon-compare) : elle doit être à part');
      if (r.hors) mal('référence hors de la largeur de la page');
      if (r.type === 'biere') refNom = 'biere';
      else if (r.type === 'houblon') {
        if (!r.cle) mal('référence houblon sans data-houblon');
        else if (!m.additions) mal('référence houblon « ' + r.cle + ' » : window.__parcours.etat.recette.additions absent (clé non vérifiable)');
        else if (!m.additions.some((a) => a && a.hopKey === r.cle)) mal('référence « ' + r.cle + ' » n\'est pas un houblon de la recette (hopKey : ' + m.additions.map((a) => a && a.hopKey).join(', ') + ')');
        refNom = r.cle || null;
      } else mal('data-reference="' + r.type + '" : « houblon » (avec data-houblon) ou « biere »');
      if (refNom) {
        const siennes = m.tous.filter((v) => v.dansRef[idx] || (r.type === 'houblon' && v.cle === r.cle));
        verifier('référence ' + refNom, siennes);
      }
    }

    // Les étapes nommées, dites à l'écran.
    const tv = m.texteVisible;
    if (!/60\s*[′'’]/.test(tv)) mal('l\'étape « 60′ » n\'est pas nommée dans le texte visible');
    if (!/10\s*[′'’]/.test(tv)) mal('l\'étape « 10′ » n\'est pas nommée dans le texte visible');
    if (!/dry\s*-?\s*hop|à froid/i.test(tv)) mal('l\'étape « dry hop » (ou « à froid ») n\'est pas nommée dans le texte visible');

    // Un seul écran.
    let ecart = 0;
    if (retenues.length) {
      ecart = Math.round(Math.max(...retenues.map((v) => v.bas)) - Math.min(...retenues.map((v) => v.haut)));
      if (ecart > m.H) mal('les valeurs des étapes ne tiennent pas dans un seul écran (écart vertical ' + ecart + ' px, fenêtre ' + m.H + ' px)');
    }

    const codes = [...new Set(retenues.map((v) => v.code))].sort();
    lignes.push(t.nom + ' : ' + m.compares.length + ' houblon(s) comparé(s), référence ' + (refNom || 'aucune') + ', ' + retenues.length + ' valeur(s) visibles ensemble, écart vertical ' + ecart + ' / ' + m.H + ' px' + (sortie.length ? ' → ' + sortie.length + ' manque(s)' : ''));
    for (const s of sortie) { if (!manques.has(s)) manques.set(s, []); manques.get(s).push(t.l); }
    if (!resume || sortie.length === 0) resume = { n: m.compares.length, ref: refNom || 'aucune', codes };
  }
} finally {
  await browser.close();
}

for (const l of lignes) console.log(l);
if (manques.size || manques114.length) {
  console.log('COMPARER-ETAPES ECHEC (' + (manques.size + manques114.length) + ' manque(s))');
  for (const x of manques114) console.log('- D114 ' + x);
  for (const [s, ls] of manques) console.log('- D107 ' + (TAILLES.length > 1 ? (ls.length === TAILLES.length ? 'aux deux largeurs' : 'à ' + ls.join(' et ') + ' px') + ' : ' : '') + s);
  process.exit(1);
}
console.log('COMPARER-ETAPES OK (' + resume.n + ' houblons + référence ' + resume.ref + ', étapes ' + resume.codes.join(' ') + ')');
