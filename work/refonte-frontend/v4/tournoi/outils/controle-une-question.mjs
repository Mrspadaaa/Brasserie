// D98 (22.10, reprise du lot 21 ; leçon L10) : un écran d'outil pose UNE question et ne laisse libre
// qu'UN facteur. Les mots du brasseur, sur le lot 21 : « on a plusieur confusion entre timing,
// comparaison, houbons side by side, on aurais suggestions, comparer, substituer, dryhopper ect
// ect.. il faudrait voir ce que l'on peut faire. » Verdict du conseil (22.10,
// cerveau/decisions/2026-10-22-carte-outils-houblons.md) : « un seul facteur libre par écran, les
// autres fixés sur une ligne de contexte » ; un titre en forme de question ne suffit pas (y1b
// « Quand ? » laissait libres houblon, dose, levure et moment ; y3 « Quelle dose ? » laissait
// libres houblon, moment, levure et dose).
//
// Règle (au rendu, 390 px, tactile, éléments visibles au repos) :
//   1. TITRE : le premier titre visible (h1, h2, [data-role="titre"]) pose une question (« … ? »).
//   2. UN SEUL FACTEUR LIBRE. Les sélecteurs libres sont repérés PAR LEUR NATURE, balisés ou non :
//      boutons role=radio / aria-pressed / [data-role="reglage"] / [data-reglage], select, input,
//      role=slider, summary, pastilles qui s'ouvrent sur un choix. Chacun est rattaché à un ou
//      plusieurs facteurs d'après ses libellés (nom du houblon → houblon ; g/L → dose ; ′, min,
//      whirlpool, actif, après, jours → moment ; US-05, Pomona, Verdant… → levure) et d'après ses
//      attributs (data-eh, data-dose, data-lev, data-mom…). Un contrôle qui porte plusieurs
//      facteurs à la fois (« Idaho 7 après 4 g/L ») en fait varier plusieurs. Plus d'un facteur
//      libre sur la page = ECHEC, balisage ou pas. Un réglage sans facteur reconnu compte comme
//      facteur « inconnu » : il se balise ou se retire.
//   3. BALISAGE IMPOSÉ aux lots suivants (convention) :
//        data-libre="<facteur>"     sur le conteneur du groupe de sélecteurs libres (un seul
//                                   facteur : houblon | dose | moment | levure | base) ; deux
//                                   options au moins (ou un curseur / select) ;
//        data-role="contexte"       sur la ligne de contexte, qui contient
//        data-contexte="<facteur>"  un élément par facteur FIXÉ (texte non vide), au moins deux,
//                                   jamais le facteur libre ; sans contrôle ni bouton dedans ;
//        data-lecture               sur un groupe qui ne change que l'affichage (au style /
//                                   absolu, barres / radar), exclu du compte.
//      Tout sélecteur libre détecté hors d'un [data-libre], ou dont le facteur détecté diffère du
//      facteur déclaré, est une faute : on ne se fie jamais au seul balisage.
//   4. CONTEXTE : la ligne [data-role="contexte"] est visible, déclare ≥ 2 facteurs fixés, et le
//      facteur détecté dans le texte de chacun correspond à sa balise.
// Exclus du compte : légende, fermer, retour, échanger, lecture (au style / absolu), critère de
// classement, navigation (nav, [role=navigation]) et boutons d'ouverture de détail (aria-expanded
// ou aria-haspopup sans facteur reconnu : « pourquoi ? », « Preuve »).
// Usage : node controle-une-question.mjs <dossier> [ids…] [--page=etat.html[?requête]] ; imprime
// une ligne par page, puis « UNE-QUESTION OK (1 groupe libre : <facteur>) » (code 0), ou
// « UNE-QUESTION ECHEC n problème(s) » et la liste (code 1).
// Témoins : négatifs y1b et y3 du lot 21 (fils21-choisir) ; positif temoins/une-question-ok.
//
// OPTION --edition (D98 b, décision du pilote du 22.10, conforme au verdict du conseil : « la dose
// reste en contexte, réglable d'un toucher ») : dans la ligne de contexte, chaque facteur fixé peut
// porter UN SEUL bouton d'édition, <button data-edite="<facteur>"> placé dans l'élément
// [data-contexte="<facteur>"] du même facteur, avec aria-controls vers une feuille FERMÉE au repos
// (invisible : hidden, display:none…). Ce bouton ne compte pas comme groupe libre. Le contrôle joue
// le toucher pour de vrai (page rechargée, un seul tap) : la feuille doit apparaître, et ses
// réglages ne portent que ce facteur. Échecs : deux contrôles pour un même facteur ; un contrôle
// qui change la valeur directement dans la ligne (radio, curseur, select, champ) ou un bouton sans
// data-edite ; un bouton sans feuille (aria-controls absent ou cassé), une feuille ouverte au repos
// ou qui ne s'ouvre pas à un toucher ; data-edite différent du facteur de son élément. Sans
// --edition, la règle stricte (contexte sans contrôle) reste : le même témoin échoue.
// Témoins de --edition : temoins/une-question-edition-ok (positif), une-question-edition-ko (deux
// contrôles pour la dose), une-question-edition-direct-ko (un « − » règle la dose dans la ligne),
// une-question-edition-ouverte-ko (feuille ouverte au repos).
//
// LE CURSEUR PORTE LUI-MÊME data-libre : un [role="slider"] (ou input range, ou select) balisé
// data-libre="moment" compte comme un groupe à lui seul : ses crans se lisent par aria-valuemin,
// aria-valuemax et le pas (aria-step, data-pas, ou 1), ou par data-options (nombre d'options
// déclaré) ; un curseur sans bornes ni data-options a « 0 option » et échoue. Les descendants
// comptent toujours comme avant. Témoins : temoins/dryhopper-curseur-ok, dryhopper-curseur-ko.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const dir = path.resolve(args.find((a) => !a.startsWith('--')) || '.');
const only = args.filter((a) => !a.startsWith('--')).slice(1);
const pgArg = (args.find((a) => a.startsWith('--page=')) || '--page=etat.html').slice(7);
const [pg, requete = ''] = pgArg.split('?');
const edition = args.includes('--edition');
// Règle n° 1 (D117, 23.10) : quand sa maquette choisie n'a ni titre en question ni ligne de contexte (Suggestions de la
// base v4.10 et de q2b : les onglets en tête), les règles 1 et 4 sont levées ; la règle 2 (un seul facteur libre, L10)
// et le balisage restent. La raison est obligatoire et imprimée.
const regleN1 = (args.find((a) => a.startsWith('--regle-n1=')) || '').slice(11);
if (args.some((a) => a === '--regle-n1' || a === '--regle-n1=')) { console.log('UNE-QUESTION ECHEC 1 problème(s)\n  - --regle-n1 sans raison'); process.exit(1); }
const ids = (only.length ? only : fs.readdirSync(dir).filter((d) => fs.existsSync(path.join(dir, d, pg)))).sort();
const packPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../prototypes/houblons-v4/data/pack-fiches.json');
const noms = JSON.parse(fs.readFileSync(packPath, 'utf8')).fichesHoublons.map((h) => h.name.replace(/\s*\(.*\)\s*$/, ''));
// Houblons courants que les maquettes citent hors du pack.
for (const n of ['Citra', 'Idaho 7', 'Mosaic', 'Simcoe', 'Centennial', 'Amarillo', 'Hallertau']) if (!noms.includes(n)) noms.push(n);

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const problems = [];

const analyser = ({ NOMS, edition }) => {
  const vis = (e) => !!e && e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height > 0;
  const txt = (e) => (e.innerText || e.value || '').replace(/\s+/g, ' ').trim();
  const reNom = new RegExp('(^|[^\\p{L}])(' + NOMS.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![\\p{L}])', 'u');
  // Un libellé qui ouvre sur le nom du facteur (« Moment de Citra », « Dose par houblon ») ne porte que ce
  // facteur : le houblon cité y est l'objet du réglage, pas un second facteur.
  const NOMME = [[/^(moment|jours?|dur[ée]e)\b/i, 'moment'], [/^dose/i, 'dose'], [/^levure/i, 'levure'], [/^(houblons?|vari[ée]t[ée]s?)\b/i, 'houblon']];
  const facteursDe = (s, etiquette) => {
    const f = new Set();
    if (!s) return f;
    if (etiquette) for (const [re, k] of NOMME) if (re.test(s.trim())) return new Set([k]);
    if (/houblon|vari[ée]t[ée]|pastille de houblon/i.test(s) || reNom.test(s)) f.add('houblon');
    if (/\bdose\b|\bdoses\b|g\s*\/\s*L|\bg\/l\b/i.test(s)) f.add('dose');
    if (/moment|jours?\b|\d\s*j\b|minute|[′']|whirlpool|dry ?hop|\bapr[èe]s\b|\bactif\b|fermentation|contact/i.test(s)) f.add('moment');
    if (/levure|US-?05|Pomona|Verdant|Diamond|Kveik|Voss|Nottingham|Safale|London|Hornindal|biotransf/i.test(s)) f.add('levure');
    return f;
  };
  const NON = /lecture|l[ée]gende|fermer|retour|[ée]changer|crit[èe]re|classement|^\?$/i;
  const NONTXT = /^(au style|absolu|barres?|radar|\?)$/i;
  const grpLabel = (e) => { const g = e.closest('[role="group"],[role="radiogroup"]'); return g && g !== e ? g.getAttribute('aria-label') || '' : ''; };
  const hints = (e) => {
    const f = new Set();
    const d = (k) => e.hasAttribute(k);
    if (d('data-eh') || d('data-voie') || /^h\d$|^plus$/.test(e.getAttribute('data-pa') || '') || e.getAttribute('data-reglage') === 'ajout-cumule' || d('data-houblon')) f.add('houblon');
    if (d('data-dose') || d('data-ed')) f.add('dose');
    if (d('data-mom') || d('data-em') || d('data-k') || e.getAttribute('data-pa') === 'j') f.add('moment');
    if (d('data-lev') || e.getAttribute('data-reglage') === 'levure') f.add('levure');
    return f;
  };
  const SEL = 'button,select,input:not([type="hidden"]),textarea,summary,[role="radio"],[role="slider"],[role="switch"],[role="tab"],[role="option"],[role="checkbox"],[data-role="reglage"],[data-reglage]';
  const libres = [];
  const ignores = [];
  for (const e of document.querySelectorAll(SEL)) {
    if (!vis(e)) continue;
    if (e.closest('[data-role="legende"],[data-role="legende-voile"],[role="dialog"],nav,[role="navigation"],[data-lecture]')) continue;
    if (e.matches('[data-role="legende-bouton"],[data-role="legende-fermer"]')) continue;
    // --edition : un bouton d'édition dans la ligne de contexte n'est pas un groupe libre (il est contrôlé à part).
    if (edition && e.matches('button[data-edite]') && e.closest('[data-role="contexte"] [data-contexte]')) continue;
    const own = e.getAttribute('aria-label') || '';
    const gl = grpLabel(e);
    const label = own || txt(e);
    if (NON.test(own) || NON.test(gl) || NONTXT.test(txt(e))) continue;
    // Facteurs : attributs, puis libellé propre (aria-label prioritaire), puis libellé du groupe.
    let f = hints(e);
    const depuis = facteursDe(own, true);
    if (own && depuis.size) depuis.forEach((x) => f.add(x));
    else { facteursDe(txt(e)).forEach((x) => f.add(x)); facteursDe(gl, true).forEach((x) => f.add(x)); }
    const disclosure = (e.hasAttribute('aria-expanded') || e.hasAttribute('aria-haspopup')) && !f.size;
    const reglage = e.matches('[role="radio"],[role="slider"],[role="switch"],select,input,[data-role="reglage"],[data-reglage],[aria-pressed],[aria-checked]');
    if (disclosure) { ignores.push(label.slice(0, 30)); continue; }
    if (!f.size) {
      if (reglage) f.add('inconnu');
      else { ignores.push(label.slice(0, 30)); continue; }
    }
    const lib = e.closest('[data-libre]');
    const grp = e.closest('[data-libre],[role="group"],[role="radiogroup"]') || e.parentElement;
    libres.push({ f: [...f], label: label.slice(0, 40), declare: lib ? lib.getAttribute('data-libre') : null, grp, slider: e.matches('[role="slider"],input[type="range"],select') });
  }
  const facteurs = [...new Set(libres.flatMap((x) => x.f))];
  const exemples = {};
  for (const x of libres) for (const k of x.f) (exemples[k] = exemples[k] || []).push(x.label);
  const declares = [...document.querySelectorAll('[data-libre]')].filter(vis);
  const decl = [...new Set(declares.map((d) => d.getAttribute('data-libre')))];
  const horsBalise = libres.filter((x) => !x.declare);
  const discordants = libres.filter((x) => x.declare && x.f.some((k) => k !== x.declare));
  const nombre = (v, defaut) => { const x = parseFloat(v); return Number.isFinite(x) ? x : defaut; };
  const options = declares.map((d) => {
    let n = d.querySelectorAll('button,[role="radio"],[role="option"],[role="checkbox"],input[type="radio"],input[type="checkbox"],option').length;
    let cont = !!d.querySelector('[role="slider"],input[type="range"],select');
    // L'élément balisé lui-même : un curseur, un champ range ou un select porte ses crans.
    if (d.matches('[role="slider"],input[type="range"],select')) {
      const decl = parseInt(d.getAttribute('data-options') || '', 10);
      let crans = 0;
      if (d.matches('select')) crans = d.querySelectorAll('option').length;
      else if (d.matches('input[type="range"]')) {
        const min = nombre(d.getAttribute('min'), 0), max = nombre(d.getAttribute('max'), 100), pas = nombre(d.getAttribute('step') || d.getAttribute('data-pas'), 1);
        crans = pas > 0 && max >= min ? Math.floor((max - min) / pas) + 1 : 0;
      } else {
        const min = nombre(d.getAttribute('aria-valuemin'), NaN), max = nombre(d.getAttribute('aria-valuemax'), NaN), pas = nombre(d.getAttribute('aria-step') || d.getAttribute('data-pas'), 1);
        crans = Number.isFinite(min) && Number.isFinite(max) && pas > 0 && max >= min ? Math.floor((max - min) / pas) + 1 : 0;
      }
      if (Number.isFinite(decl) && decl > crans) crans = decl;
      if (crans >= 2) cont = true;
      n += crans;
    } else if (d.hasAttribute('data-options')) n += parseInt(d.getAttribute('data-options'), 10) || 0;
    return { facteur: d.getAttribute('data-libre'), n, cont };
  });
  const h = [...document.querySelectorAll('h1,h2,[data-role="titre"],[role="heading"]')].find(vis);
  const titre = h ? txt(h) : '';
  const ctx = [...document.querySelectorAll('[data-role="contexte"]')].find(vis);
  const items = ctx ? [...ctx.querySelectorAll('[data-contexte]')].filter(vis).map((i) => ({ k: i.getAttribute('data-contexte'), t: txt(i), detecte: [...facteursDe(txt(i))] })) : [];
  const CTRL = 'button,select,input,textarea,summary,[role="radio"],[role="slider"],[role="switch"],[role="checkbox"],[role="tab"],[data-role="reglage"],[data-reglage]';
  const ctxControles = ctx ? ctx.querySelectorAll(CTRL).length : 0;
  // --edition : bilan des contrôles de la ligne, un par un.
  const edit = { fautes: [], boutons: [] };
  if (edition && ctx) {
    const parFacteur = {};
    const feuillesDeclarees = [...ctx.querySelectorAll('button[data-edite]')].map((b) => document.getElementById((b.getAttribute('aria-controls') || '').split(/\s+/)[0])).filter(Boolean);
    for (const c of ctx.querySelectorAll(CTRL)) {
      const item = c.closest('[data-contexte]');
      const k = item ? item.getAttribute('data-contexte') : null;
      const nom = (c.getAttribute('aria-label') || txt(c) || c.tagName.toLowerCase()).slice(0, 30);
      if (feuillesDeclarees.some((fe) => fe.contains(c))) continue;
      if (!c.matches('button[data-edite]')) {
        const direct = c.matches('[role="radio"],[role="slider"],[role="switch"],[role="checkbox"],[role="tab"],select,input,textarea,[data-role="reglage"],[data-reglage],[aria-pressed],[aria-checked]');
        edit.fautes.push(direct ? 'contexte « ' + (k || '?') + ' » : « ' + nom + ' » change la valeur directement dans la ligne (un bouton data-edite qui ouvre une feuille, rien d\'autre)' : 'contexte « ' + (k || '?') + ' » : le bouton « ' + nom + ' » n\'est pas un bouton d\'édition (data-edite + aria-controls)');
        continue;
      }
      const ke = c.getAttribute('data-edite');
      if (!item) { edit.fautes.push('bouton d\'édition « ' + nom + ' » hors d\'un élément [data-contexte]'); continue; }
      if (ke !== k) { edit.fautes.push('bouton data-edite="' + ke + '" dans l\'élément de contexte « ' + k + ' »'); continue; }
      (parFacteur[ke] = parFacteur[ke] || []).push(c);
    }
    for (const k of Object.keys(parFacteur)) {
      const bs = parFacteur[k];
      if (bs.length > 1) edit.fautes.push('contexte « ' + k + ' » : ' + bs.length + ' contrôles d\'édition pour un même facteur (un seul)');
      const b = bs[0];
      const ids = (b.getAttribute('aria-controls') || '').split(/\s+/).filter(Boolean);
      const feuille = ids.length ? document.getElementById(ids[0]) : null;
      if (!ids.length) edit.fautes.push('contexte « ' + k + ' » : le bouton d\'édition n\'a pas d\'aria-controls');
      else if (!feuille) edit.fautes.push('contexte « ' + k + ' » : aria-controls="' + ids[0] + '" ne désigne aucun élément');
      else if (vis(feuille)) edit.fautes.push('contexte « ' + k + ' » : la feuille d\'édition est ouverte au repos (elle doit être fermée)');
      if (!vis(b)) edit.fautes.push('contexte « ' + k + ' » : le bouton d\'édition est invisible au repos');
      edit.boutons.push(k);
    }
  }
  return { titre, facteurs, exemples, decl, horsBalise: horsBalise.map((x) => x.label + ' (' + x.f.join('+') + ')'), discordants: discordants.map((x) => x.label + ' : balisé ' + x.declare + ', porte ' + x.f.join('+')), options, ctx: !!ctx, items, ctxControles, edit, nLibres: libres.length, ignores: ignores.length };
};

// Après un toucher sur le bouton d'édition du facteur k : la feuille est-elle ouverte, que règle-t-elle ?
const analyseFeuille = ({ k, NOMS }) => {
  const vis = (e) => !!e && e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height > 0;
  const b = document.querySelector('[data-role="contexte"] [data-contexte="' + k + '"] button[data-edite]');
  const f = b && document.getElementById((b.getAttribute('aria-controls') || '').split(/\s+/)[0]);
  const out = { ouverte: !!f && vis(f), controles: 0, etrangers: [] };
  if (!out.ouverte) return out;
  const reNom = new RegExp('(^|[^\\p{L}])(' + NOMS.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![\\p{L}])', 'u');
  const lire = (s) => {
    const r = new Set();
    if (/\bdoses?\b|g\s*\/\s*L/i.test(s)) r.add('dose');
    if (/moment|jours?\b|\d\s*j\b|minute|[′']|whirlpool|dry ?hop|\bapr[èe]s\b|\bactif\b/i.test(s)) r.add('moment');
    if (/levure|US-?05|Pomona|Verdant|Diamond|Kveik|Voss|Nottingham|Safale|London|Hornindal/i.test(s)) r.add('levure');
    if (/houblon|vari[ée]t[ée]/i.test(s) || reNom.test(s)) r.add('houblon');
    return r;
  };
  const SEL = 'button,select,input:not([type="hidden"]),[role="radio"],[role="slider"],[role="switch"],[role="checkbox"],[data-reglage]';
  const etr = new Set();
  for (const c of f.querySelectorAll(SEL)) {
    if (!vis(c)) continue;
    const t = (c.getAttribute('aria-label') || c.innerText || c.value || '').trim();
    const lus = lire(t);
    if (!lus.size && /^(fermer|ok|valider|annuler|retour|×|✕)/i.test(t)) continue;
    out.controles++;
    for (const x of lus) if (x !== k) etr.add(x);
  }
  out.etrangers = [...etr];
  return out;
};

const resume = [];
for (const id of ids) {
  const file = path.join(dir, id, pg);
  const f = [];
  if (!fs.existsSync(file)) { problems.push(id + ' ' + pg + ' : page absente'); console.log(id + ' · page absente'); continue; }
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(file).href + (requete ? '?' + requete : ''), { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
  const a = await page.evaluate(analyser, { NOMS: noms, edition });
  // --edition : un seul toucher sur chaque bouton d'édition, pour de vrai : la feuille doit s'ouvrir
  // et ne régler que son facteur.
  const feuilles = [];
  if (edition && a.ctx && !a.edit.fautes.length) {
    for (const k of a.edit.boutons) {
      await page.goto(pathToFileURL(file).href + (requete ? '?' + requete : ''), { waitUntil: 'networkidle0', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 300));
      const b = await page.$('[data-role="contexte"] [data-contexte="' + k + '"] button[data-edite]');
      if (!b) continue;
      await b.tap();
      await new Promise((r) => setTimeout(r, 450));
      feuilles.push({ k, ...(await page.evaluate(analyseFeuille, { k, NOMS: noms })) });
    }
  }
  await page.close();
  // 1. titre (sauf --regle-n1 : sa maquette choisie n'en a pas)
  if (regleN1) { /* règles 1 et 4 levées, raison imprimée au résumé */ }
  else if (!a.titre) f.push('aucun titre visible (h1, h2 ou [data-role="titre"])');
  else if (!/\?\s*$/.test(a.titre)) f.push('le titre « ' + a.titre.slice(0, 50) + ' » ne pose pas une question (« … ? »)');
  // 2. un seul facteur libre
  if (a.facteurs.length > 1) f.push(a.facteurs.length + ' facteurs libres : ' + a.facteurs.map((k) => k + ' (' + a.exemples[k].slice(0, 3).join(', ') + ')').join(' ; '));
  if (a.facteurs.length === 0) f.push('aucun sélecteur libre : l\'outil ne fait varier aucun facteur');
  // 3. balisage
  if (a.facteurs.length === 1 && a.horsBalise.length) f.push(a.horsBalise.length + ' sélecteur(s) libre(s) hors de [data-libre] : ' + a.horsBalise.slice(0, 3).join(', '));
  if (a.facteurs.length > 1 && !a.decl.length) f.push('aucun groupe balisé [data-libre]');
  if (a.decl.length > 1) f.push('plusieurs facteurs déclarés libres : ' + a.decl.join(', '));
  if (a.discordants.length) f.push('balisage discordant : ' + a.discordants.slice(0, 3).join(' ; '));
  if (a.facteurs.length === 1 && a.decl.length === 1 && a.decl[0] !== a.facteurs[0] && !a.discordants.length) f.push('facteur déclaré « ' + a.decl[0] + ' », facteur détecté « ' + a.facteurs[0] + ' »');
  for (const o of a.options) if (!o.cont && o.n < 2) f.push('groupe libre « ' + o.facteur + ' » : ' + o.n + ' option (deux au moins)');
  // 4. contexte (sauf --regle-n1)
  if (regleN1) { /* levée */ }
  else if (!a.ctx) f.push('pas de ligne de contexte visible [data-role="contexte"]');
  else {
    const ks = [...new Set(a.items.map((i) => i.k))];
    if (ks.length < 2) f.push('contexte : ' + ks.length + ' facteur fixé déclaré (deux au moins, [data-contexte])');
    for (const i of a.items) {
      if (!i.t) f.push('contexte « ' + i.k + ' » sans texte');
      if (a.facteurs.length === 1 && i.k === a.facteurs[0]) f.push('le facteur libre « ' + i.k + ' » figure aussi dans le contexte');
      if (i.detecte.length && !i.detecte.includes(i.k) && i.k !== 'base') f.push('contexte « ' + i.t + ' » déclaré « ' + i.k + ' » mais lu « ' + i.detecte.join('+') + ' »');
    }
    if (edition) {
      for (const x of a.edit.fautes) f.push(x);
      for (const fe of feuilles) {
        if (!fe.ouverte) f.push('contexte « ' + fe.k + ' » : un toucher sur son bouton d\'édition n\'ouvre pas la feuille (aria-controls)');
        else {
          if (!fe.controles) f.push('contexte « ' + fe.k + ' » : la feuille ouverte ne contient aucun réglage');
          if (fe.etrangers.length) f.push('contexte « ' + fe.k + ' » : la feuille règle aussi ' + fe.etrangers.join(', ') + ' (le seul facteur édité est « ' + fe.k + ' »)');
        }
      }
    } else if (a.ctxControles) f.push('la ligne de contexte contient ' + a.ctxControles + ' contrôle(s) : le contexte est fixé, il ne se règle pas');
  }
  const ok = f.length === 0;
  console.log(id + ' · titre « ' + a.titre.slice(0, 36) + ' » · libres : ' + (a.facteurs.join(', ') || 'aucun') + ' · ' + a.nLibres + ' contrôle(s) · contexte : ' + (a.items.map((i) => i.k).join(', ') || 'aucun') + (ok ? '' : ' · ' + f.length + ' faute(s)'));
  if (ok) resume.push(a.facteurs[0]);
  for (const x of f) problems.push(id + ' ' + pg + ' : ' + x);
}
await browser.close();
if (problems.length) { console.log('UNE-QUESTION ECHEC ' + problems.length + ' problème(s)'); for (const x of problems) console.log('  ' + x); process.exit(1); }
if (regleN1) console.log('  règles 1 (titre) et 4 (contexte) levées, règle n° 1 : ' + regleN1);
console.log('UNE-QUESTION OK (1 groupe libre : ' + [...new Set(resume)].join(', ') + ')');
