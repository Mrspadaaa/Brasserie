#!/usr/bin/env node
// Captures « sa base | la maquette », écran par écran, aux mêmes états (voie p18-cote-a-cote, 24.10).
//
// Pourquoi (D117, 23.10 soir) : « J'ai l'impression que cette vue suggestions n'est pas la bonne que j'ai vraiment
// choisie ?? ». La maquette d332792c a été publiée sur CHOIX OK et critique ACCEPTÉ, sans que personne ne la pose
// à côté de sa base. Cet outil produit les deux colonnes ; la page `outils/pages/2026-10-24-cote-a-cote/index.html`
// les montre ; le concepteur, le critique et le pilote la regardent avant de publier une version.
//
// Usage : node prototypes/houblons-v4/parcours/outils/captures-cote-a-cote.mjs <dossier construit> --sortie=<dossier img>
//         [--plein] [--etats=etape,fiche,…]
//   <dossier construit> : par exemple prototypes/houblons-v4/maquettes/parcours-p3 (pages <écran>/etat.html).
//   Chrome 390 × 844, tactile, deviceScaleFactor 2. Par état, deux captures du premier écran (844 px de haut) :
//     <etat>-base.png     sa base, JOUÉE quand elle est une page du dépôt, sinon sa capture existante recadrée
//     <etat>-maquette.png la maquette, jouée
//   Une troisième colonne facultative (`<etat>-<suffixe>.png`) pour une autre variante qu'il a choisie (q2b, x3b).
//   --plein : en plus, la page entière de chaque côté (`<etat>-base-plein.png`, `<etat>-maquette-plein.png`) : la
//   fenêtre est agrandie à la hauteur du plus long défilement de la page. Pas pour un geste tenu (le doigt tenu ne
//   survit pas à un redimensionnement) : l'état le dit dans etats.json.
//   etats.json : par état, son nom, ses deux côtés (source, geste, joué ou repris d'une capture, fichiers) et ce qui
//   n'existe pas dans sa base (`base: null` et `sansBase`). Un état en échec est écrit avec `erreur` et sans fichier.
// Aucun fichier du dépôt n'est écrit hors du dossier --sortie. Gestes repris de : controle-geste-etape.mjs (D111),
// controle-appui.mjs --etape (D112), controle-visee.mjs (D108), controle-traits.mjs (D110), sans les modifier.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const args = process.argv.slice(2);
const opt = (n, d) => { const a = args.find((x) => x.startsWith('--' + n + '=')); return a ? a.slice(n.length + 3) : d; };
const construit = path.resolve(args.find((a) => !a.startsWith('--')) || '');
const sortie = path.resolve(opt('sortie', ''));
const PLEIN = args.includes('--plein');
const seuls = opt('etats', '') ? opt('etats', '').split(',') : null;
if (!args.find((a) => !a.startsWith('--')) || !opt('sortie', '') || !fs.existsSync(construit)) {
  console.log('Usage : node captures-cote-a-cote.mjs <dossier construit> --sortie=<dossier img> [--plein] [--etats=a,b]');
  process.exit(2);
}
fs.mkdirSync(sortie, { recursive: true });

const V4 = path.join(RACINE, 'work/refonte-frontend/v4/ecran-1');
const BASE = path.join(V4, 'base/consolide');
const rel = (f) => path.relative(RACINE, f).split(path.sep).join('/');
const attente = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- lectures injectées dans les pages (aucun $ dans ce code) ----------
function lirePoignee() {
  const vis = (e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05; };
  const s = [...document.querySelectorAll('[data-role="glisser-moment"]')].find(vis);
  if (!s) return null;
  const r = s.getBoundingClientRect();
  const t = s.getAttribute('aria-valuetext') || s.textContent || '';
  const m = /(\d+)\s*[′']/.exec(t);
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, texte: t.trim(), minutes: m ? Number(m[1]) : null };
}
function lireNom(houblon) {
  const vis = (e) => { for (let x = e; x && x !== document.documentElement; x = x.parentElement) { const cs = getComputedStyle(x); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) <= 0.15) return false; } const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
  const cartes = [...document.querySelectorAll('[data-role="ligne-houblon"]')].filter((l) => vis(l) && l.innerText.toLowerCase().includes(houblon.toLowerCase()));
  const carte = cartes[0];
  if (!carte) return null;
  const e = [...carte.querySelectorAll('*')].find((x) => !x.children.length && vis(x) && x.textContent.trim().toLowerCase() === houblon.toLowerCase());
  if (!e) return null;
  const b = e.getBoundingClientRect();
  return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
}
function hauteurPleine() {
  let extra = 0;
  for (const e of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(e);
    if (!/(auto|scroll)/.test(cs.overflowY)) continue;
    if (e.scrollHeight > e.clientHeight + 4) extra = Math.max(extra, e.scrollHeight - e.clientHeight);
  }
  extra = Math.max(extra, document.documentElement.scrollHeight - innerHeight);
  return innerHeight + extra;
}

// ---------- ouvrir une page ----------
const nouvelle = async (navigateur, fichier) => {
  const p = await navigateur.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(pathToFileURL(fichier).href, { waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {});
  await p.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
  await attente(1200);
  return p;
};

// Un toucher tenu sur la poignée de Nugget, de 60′ vers 35′ (controle-geste-etape.mjs : y += 3 par mouvement).
const glisser = async (p) => {
  let h = null;
  for (let i = 0; i < 60 && !h; i++) { h = await p.evaluate(lirePoignee); if (!h) await attente(100); }
  if (!h) throw new Error('pas de poignée [data-role="glisser-moment"] visible');
  if (h.minutes !== 60) throw new Error('le départ n\'est pas à 60′ (« ' + h.texte + ' »)');
  const doigt = await p.touchscreen.touchStart(h.x, h.y);
  let y = h.y, dernier = h;
  for (let i = 0; i < 500; i++) {
    y += 3;
    await doigt.move(h.x, y);
    await attente(18);
    const m = await p.evaluate(lirePoignee);
    if (m) dernier = m;
    if (m && m.minutes !== null && m.minutes <= 35) break;
  }
  // La mise en page se resserre sous le doigt : on laisse poser, puis on remet le doigt sur 35′ (au pixel près),
  // pour que la capture montre le même moment des deux côtés.
  let fin = dernier;
  for (let i = 0; i < 40; i++) {
    await attente(450);
    fin = (await p.evaluate(lirePoignee)) || fin;
    if (fin.minutes === 35) break;
    y += fin.minutes !== null && fin.minutes < 35 ? -2 : 2;
    await doigt.move(h.x, y);
  }
  await attente(450);
  fin = (await p.evaluate(lirePoignee)) || fin;
  return { doigt, minutes: fin.minutes, texte: fin.texte };
};

// L'appui tenu sur le nom de Nugget, capturé à 250 ms (controle-appui.mjs --etape).
const appuyer = async (p) => {
  let c = null;
  for (let i = 0; i < 40 && !c; i++) { c = await p.evaluate(lireNom, 'Nugget'); if (!c) await attente(100); }
  if (!c) throw new Error('le nom « Nugget » de la carte ([data-role="ligne-houblon"]) est introuvable');
  const doigt = await p.touchscreen.touchStart(c.x, c.y);
  await attente(250);
  return { doigt };
};

// « + » sur Tropicaux, ligne ouverte (controle-visee.mjs : la ligne s'ouvre par [aria-expanded], puis « + »).
const viseeMaquette = async (p) => {
  const ligne = await p.$('[data-famille-ligne="tropical"] [aria-expanded]');
  if (!ligne) throw new Error('pas de ligne [data-famille-ligne="tropical"]');
  const ouverte = await p.evaluate((e) => e.getAttribute('aria-expanded') === 'true', ligne);
  if (!ouverte) { await ligne.tap(); await attente(550); }
  const plus = await p.$('[data-famille-ligne="tropical"] [data-visee="plus"]');
  if (!plus) throw new Error('pas de [data-visee="plus"] sur Tropicaux');
  await plus.tap();
  await attente(650);
};
// Sa base n'est pas balisée : la ligne est le bouton « Tropicaux » (.nom-f), « + » son bouton « Augmenter ma visée ».
const viseeBase = async (p) => {
  const ligne = await p.evaluateHandle(() => [...document.querySelectorAll('button.nom-f')].find((b) => /^Tropicaux/.test(b.innerText.trim())) || null);
  const el = ligne.asElement();
  if (!el) throw new Error('pas de bouton « Tropicaux » dans sa base');
  const ouverte = await p.evaluate((e) => e.getAttribute('aria-expanded') === 'true', el);
  if (!ouverte) { await el.tap(); await attente(550); }
  const plus = (await p.evaluateHandle(() => [...document.querySelectorAll('button')].find((b) => /^Augmenter ma visée de Fruits tropicaux/.test(b.getAttribute('aria-label') || '')) || null)).asElement();
  if (!plus) throw new Error('pas de bouton « Augmenter ma visée de Fruits tropicaux » dans sa base');
  await plus.tap();
  await attente(650);
};

// Un toucher sur le premier picto de la première voie (controle-traits.mjs : li[data-role="ligne-houblon"] avec
// [data-famille][data-crans], picto svg et traits dessous).
const toucherPicto = async (p) => {
  await p.waitForSelector('li[data-role="ligne-houblon"] [data-famille][data-crans]', { timeout: 8000 });
  const h = (await p.evaluateHandle(() => {
    const vis = (e) => { if (!e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    for (const l of document.querySelectorAll('li[data-role="ligne-houblon"]')) {
      for (const e of l.querySelectorAll('[data-famille][data-crans]')) if (vis(e) && e.querySelector('svg')) return e;
    }
    return null;
  })).asElement();
  if (!h) throw new Error('aucun picto à traits [data-famille][data-crans] dans une ligne de voie');
  await p.evaluate((e) => e.scrollIntoView({ block: 'center' }), h);
  await attente(250);
  const info = await p.evaluate((e) => ({ famille: e.getAttribute('data-famille'), crans: e.getAttribute('data-crans') }), h);
  await h.tap();
  await attente(450);
  return info;
};

// ---------- les captures d'une page ----------
const photo = async (p, fichier) => { await p.screenshot({ path: fichier, type: 'png' }); };
const photoPleine = async (p, fichier) => {
  for (let i = 0; i < 2; i++) {
    const h = Math.min(6000, Math.max(844, Math.ceil(await p.evaluate(hauteurPleine))));
    await p.setViewport({ width: 390, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await attente(500);
  }
  await p.screenshot({ path: fichier, type: 'png' });
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
};

// Une capture existante, recadrée au premier écran (390 × 844 à ×2), ou copiée telle quelle pour la page entière.
const recadrer = async (navigateur, source, fichier) => {
  const p = await navigateur.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  const b64 = fs.readFileSync(source).toString('base64');
  await p.setContent('<!doctype html><body style="margin:0;background:#fff"><img id="i" style="display:block;width:390px" src="data:image/png;base64,' + b64 + '">');
  await p.evaluate(() => document.getElementById('i').decode());
  await p.screenshot({ path: fichier, type: 'png', clip: { x: 0, y: 0, width: 390, height: 844 } });
  await p.close();
};

// ---------- les douze états ----------
const E = (m) => path.join(construit, m);
const CAP = (f) => path.join(V4, f);
const ETATS = [
  {
    nom: 'etape', titre: 'L\'étape Houblons, au repos',
    base: { page: path.join(BASE, 'index.html') }, maquette: { page: E('ma-biere/etat.html') }, plein: true,
  },
  {
    nom: 'etape-glisser', titre: 'Nugget glissé de 60′ vers 35′, doigt tenu',
    base: { page: path.join(BASE, 'index.html'), geste: 'glisser', ref: CAP('base/captures/consolide-nugget-35-pendant.png') },
    maquette: { page: E('ma-biere/etat.html'), geste: 'glisser' },
    gesteTenu: true,
    geste: 'touchStart sur [data-role="glisser-moment"] à 60′, mouvements de 3 px vers le bas jusqu\'à 35′, doigt tenu, capture (controle-geste-etape.mjs)',
  },
  {
    nom: 'etape-appui', titre: 'L\'appui long sur Nugget, à 250 ms',
    base: { page: path.join(BASE, 'index.html'), geste: 'appui' }, maquette: { page: E('ma-biere/etat.html'), geste: 'appui' },
    gesteTenu: true,
    geste: 'touchStart sur le nom « Nugget » de la carte, doigt tenu 250 ms, capture (controle-appui.mjs --etape)',
  },
  {
    nom: 'fiche', titre: 'La fiche de Nugget ouverte',
    base: { page: path.join(BASE, 'fiche.html'), ref: CAP('base/captures/consolide-fiche-390.png') }, maquette: { page: E('fiche/etat.html') }, plein: true,
    geste: 'pages qui s\'ouvrent déjà sur la fiche de Nugget (sa base : fiche.html ; la maquette : fiche/etat.html)',
  },
  {
    nom: 'biere', titre: 'L\'onglet Ma bière, au repos',
    base: { page: path.join(BASE, 'biere.html') }, maquette: { page: E('biere/etat.html') }, plein: true,
  },
  {
    nom: 'biere-visee', titre: '« + » sur Tropicaux, ligne ouverte',
    base: { page: path.join(BASE, 'biere.html'), geste: 'visee-base' }, maquette: { page: E('biere/etat.html'), geste: 'visee-maquette' }, plein: true,
    geste: 'toucher sur la ligne Tropicaux (elle s\'ouvre), puis sur « + » (controle-visee.mjs)',
  },
  {
    nom: 'suggerer', titre: 'Suggestions',
    base: { capture: CAP('base/captures/consolide-b-390.png') }, maquette: { page: E('suggerer/etat.html') }, plein: true,
    refs: [{ suffixe: 'q2b', source: CAP('fils15-s5-complexe/captures/q2b-b-390.png'), titre: 'q2b (fils15-s5-complexe), « C\'est effectivement qb2 reprise le mieux »' }],
  },
  {
    nom: 'suggerer-toucher', titre: 'Un toucher sur le premier picto de la première voie',
    base: null, sansBase: 'sa base n\'avait pas ce geste : un toucher sur un picto de voie n\'y montrait rien (D110, « Un peu dur à comprendre ce système de petit bar »)',
    maquette: { page: E('suggerer/etat.html'), geste: 'picto' },
    geste: 'toucher sur le premier [data-famille][data-crans] de la première ligne de voie, capture à 450 ms (controle-traits.mjs)',
  },
  {
    nom: 'comparer', titre: 'Comparer',
    base: { capture: CAP('fils22-comparer/captures/r6a-premier-ecran.png') }, maquette: { page: E('comparer/etat.html') }, plein: true,
    refs: [{ suffixe: 'x3b', source: CAP('fils21-choisir/captures/x3b-plans-390.png'), titre: 'x3b (fils21-choisir), l\'état au moment de l\'ajout (D107)' }],
  },
  {
    nom: 'dryhopper', titre: 'Dryhopper',
    base: { capture: CAP('fils23-dryhopper/serie-a/captures/a1-390.png') }, maquette: { page: E('dryhopper/etat.html') }, plein: true,
  },
  {
    nom: 'levure', titre: 'La levure',
    base: { capture: CAP('fils22-carte/captures/levure-etape-390.png') }, maquette: { page: E('levure/etat.html') }, plein: true,
    sansBase: 'choix encore ouvert : la capture de base est celle de la carte des outils (fils22-carte), pas une maquette qu\'il a choisie',
  },
  {
    nom: 'substituer', titre: 'Substituer',
    base: { capture: CAP('base/captures/consolide-substitution-390.png') }, maquette: { page: E('substituer/etat.html') }, plein: true,
  },
];

// ---------- jeu ----------
const jouerCote = async (navigateur, etat, cote) => {
  const def = etat[cote];
  const sortieCote = { source: null, joue: null, geste: null, fichier: etat.nom + '-' + cote + '.png', plein: null, erreur: null };
  if (def.capture) {
    sortieCote.source = rel(def.capture);
    sortieCote.joue = false;
    sortieCote.geste = 'capture existante, recadrée au premier écran (390 × 844 à ×2)';
    await recadrer(navigateur, def.capture, path.join(sortie, sortieCote.fichier));
    if (PLEIN) {
      sortieCote.plein = etat.nom + '-' + cote + '-plein.png';
      fs.copyFileSync(def.capture, path.join(sortie, sortieCote.plein));
    }
    return sortieCote;
  }
  sortieCote.source = rel(def.page);
  sortieCote.joue = true;
  if (!fs.existsSync(def.page)) throw new Error('page absente : ' + sortieCote.source);
  const p = await nouvelle(navigateur, def.page);
  let doigt = null;
  try {
    if (def.geste === 'glisser') { const g = await glisser(p); doigt = g.doigt; sortieCote.geste = 'glissé jusqu\'à « ' + g.texte + ' », doigt tenu'; }
    else if (def.geste === 'appui') { const g = await appuyer(p); doigt = g.doigt; sortieCote.geste = 'appui tenu 250 ms sur « Nugget »'; }
    else if (def.geste === 'visee-maquette') { await viseeMaquette(p); sortieCote.geste = 'ligne Tropicaux ouverte, « + » touché'; }
    else if (def.geste === 'visee-base') { await viseeBase(p); sortieCote.geste = 'ligne Tropicaux ouverte, « + » touché'; }
    else if (def.geste === 'picto') { const i = await toucherPicto(p); sortieCote.geste = 'premier picto touché (' + i.famille + ', ' + i.crans + ' crans)'; }
    else sortieCote.geste = 'au repos, page chargée';
    await photo(p, path.join(sortie, sortieCote.fichier));
    if (doigt) await doigt.end().catch(() => {});
    if (PLEIN) {
      if (etat.gesteTenu || def.geste === 'picto') sortieCote.plein = 'non : geste tenu ou toucher, la fenêtre agrandie le défait';
      else {
        sortieCote.plein = etat.nom + '-' + cote + '-plein.png';
        await photoPleine(p, path.join(sortie, sortieCote.plein));
      }
    }
  } finally { await p.close(); }
  return sortieCote;
};

const navigateur = await puppeteer.launch({ executablePath: CHROME, headless: true });
const resultat = [];
let echecs = 0;
try {
  for (const etat of ETATS) {
    if (seuls && !seuls.includes(etat.nom)) continue;
    const ligne = { nom: etat.nom, titre: etat.titre, geste: etat.geste || 'au repos', base: null, maquette: null, refs: [] };
    if (etat.sansBase) ligne.sansBase = etat.sansBase;
    for (const cote of ['base', 'maquette']) {
      if (!etat[cote]) continue;
      try {
        ligne[cote] = await jouerCote(navigateur, etat, cote);
        console.log('OK   ' + etat.nom + ' · ' + cote + ' · ' + ligne[cote].geste);
      } catch (e) {
        echecs++;
        ligne[cote] = { source: etat[cote].page ? rel(etat[cote].page) : null, fichier: null, erreur: String(e.message || e) };
        console.log('ECHEC ' + etat.nom + ' · ' + cote + ' · ' + ligne[cote].erreur);
      }
    }
    const refBase = etat.base && etat.base.ref;
    const refs = [...(etat.refs || []).map((r) => ({ suffixe: r.suffixe, source: r.source, titre: r.titre })),
      ...(refBase ? [{ suffixe: 'base-ref', source: refBase, titre: 'la capture de référence de sa base' }] : [])];
    for (const r of refs) {
      const f = etat.nom + '-' + r.suffixe + '.png';
      try {
        await recadrer(navigateur, r.source, path.join(sortie, f));
        ligne.refs.push({ suffixe: r.suffixe, titre: r.titre, source: rel(r.source), fichier: f, joue: false });
        console.log('OK   ' + etat.nom + ' · ' + r.suffixe + ' · capture existante recadrée');
      } catch (e) { echecs++; console.log('ECHEC ' + etat.nom + ' · ' + r.suffixe + ' · ' + e.message); }
    }
    resultat.push(ligne);
  }
} finally { await navigateur.close(); }

const doc = {
  outil: 'prototypes/houblons-v4/parcours/outils/captures-cote-a-cote.mjs',
  construction: rel(construit),
  fenetre: '390 × 844, tactile, deviceScaleFactor 2',
  plein: PLEIN,
  etats: resultat,
};
fs.writeFileSync(path.join(sortie, 'etats.json'), JSON.stringify(doc, null, 2) + '\n');
console.log('etats.json : ' + resultat.length + ' états, ' + echecs + ' échec(s)');
process.exit(echecs ? 1 : 0);
