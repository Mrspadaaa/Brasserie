#!/usr/bin/env node
// D141 (25.10), ses mots : « surtout pouvoir choisir quand comparé. 60' 10' dryhopping... ». Comparer doit laisser choisir
// le moment de la comparaison, et ce choix doit changer ce qui est comparé.
//
// Pour chaque page, à 390 x 844 :
//   1. un élément [data-role="quand-comparer"] existe et se voit ;
//   2. il porte au moins trois moments, dont 60', 10' et un dry hop (attribut data-moment, sinon texte) ;
//   3. toucher chacun de ces trois moments change les valeurs comparées : le texte de la page hors du sélecteur (colonnes,
//      rangées des familles), ses largeurs, hauteurs et tracés inline, une fois les mentions de moment retirées, diffèrent
//      d'un moment à l'autre. Un sélecteur qui ne fait que changer d'état actif échoue.
// Usage : node controle-quand-comparer.mjs <dossier> <id...> [--page=etat.html]   (page lue : <dossier>/<id>/<page>)
// Sortie : une ligne par page, puis « OK » ou « ECHEC (n) » précédés du nom du contrôle. Ne s'arrête pas au premier échec (M16).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const args = process.argv.slice(2);
const pageNom = (args.find((a) => a.startsWith('--page=')) ?? '--page=etat.html').slice(7);
const positionnels = args.filter((a) => !a.startsWith('--'));
const [dossier, ...ids] = positionnels;
if (!dossier || !ids.length) {
  console.log('Usage : node controle-quand-comparer.mjs <dossier> <id...> [--page=etat.html]');
  process.exit(2);
}

// Dans la page : trouve les éléments-moments du sélecteur, les marque data-qc (index) et rend leur description.
function reperer() {
  const racine = document.querySelector('[data-role="quand-comparer"]');
  if (!racine) return { racine: false };
  const r = racine.getBoundingClientRect();
  const vu = (e) => {
    const b = e.getBoundingClientRect();
    return b.width > 0 && b.height > 0 && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]');
  };
  const cle = (e) => {
    const dm = (e.getAttribute('data-moment') ?? '').toLowerCase();
    const tx = (e.innerText ?? e.textContent ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
    const src = dm || tx;
    if (/dry\s*-?\s*hop|dryhop|^dh$/.test(src)) return 'dryhop';
    if (/(^|\D)60\s*(′|'|’|min|m\b|$)/.test(src) || /^60$/.test(src)) return '60';
    if (/(^|\D)10\s*(′|'|’|min|m\b|$)/.test(src) || /^10$/.test(src)) return '10';
    return dm ? dm : (tx.length && tx.length <= 20 ? tx : '');
  };
  let cands = [...racine.querySelectorAll('[data-moment]')];
  if (!cands.length) cands = [...racine.querySelectorAll('button,[role=tab],[role=radio],[role=button],[role=option],a,label,li,[onclick],[tabindex]')];
  const reconnus = (liste) => liste.filter((e) => vu(e) && cle(e));
  let liste = reconnus(cands);
  if (!liste.some((e) => ['60', '10', 'dryhop'].includes(cle(e)))) {
    // repli : feuilles dont le texte nomme un moment (le toucher remonte au parent cliquable)
    liste = [...racine.querySelectorAll('*')].filter((e) => !e.children.length && vu(e) && ['60', '10', 'dryhop'].includes(cle(e)));
  }
  liste = liste.filter((e) => !liste.some((o) => o !== e && e.contains(o)));
  racine.querySelectorAll('[data-qc]').forEach((e) => e.removeAttribute('data-qc'));
  const vus = new Map();
  liste.forEach((e) => { const k = cle(e); if (!vus.has(k)) vus.set(k, e); });
  const moments = [];
  let i = 0;
  for (const [k, e] of vus) { e.setAttribute('data-qc', String(i)); moments.push(k); i += 1; }
  return { racine: true, visible: r.width > 0 && r.height > 0, moments };
}

// Signature des valeurs comparées : tout sauf le sélecteur, mentions de moment retirées.
function signature() {
  const racine = document.querySelector('[data-role="quand-comparer"]');
  const mention = /(dry\s*-?\s*hop(ping)?|(^|[^\d])(60|10)\s*(′|'|’|min)\s?)/gi;
  const textes = [];
  const marques = [];
  const parcours = (n) => {
    if (n === racine) return;
    if (n.nodeType === 3) { const t = n.textContent.replace(/\s+/g, ' ').trim(); if (t) textes.push(t); return; }
    if (n.nodeType !== 1 || ['SCRIPT', 'STYLE'].includes(n.tagName)) return;
    const st = n.getAttribute('style');
    if (st && /width|height|transform|left|top|flex/.test(st)) marques.push(st.replace(/\s+/g, ''));
    if (n instanceof SVGElement) {
      for (const a of ['width', 'height', 'd', 'points', 'x', 'y', 'cx', 'cy', 'r', 'transform']) {
        const v = n.getAttribute(a);
        if (v) marques.push(a + '=' + v);
      }
    }
    n.childNodes.forEach(parcours);
  };
  parcours(document.body);
  return (textes.join('|') + '#' + marques.join('|')).replace(mention, '~');
}

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
async function stable(p) {
  let prec = await p.evaluate(signature);
  for (let i = 0; i < 8; i += 1) {
    await attendre(250);
    const cur = await p.evaluate(signature);
    if (cur === prec) return cur;
    prec = cur;
  }
  return null;
}

async function juger(navigateur, id) {
  const fichier = path.resolve(RACINE, dossier, id, pageNom);
  if (!fs.existsSync(fichier)) return { ok: false, texte: `page absente (${path.relative(RACINE, fichier)})` };
  const p = await navigateur.newPage();
  try {
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await p.goto(pathToFileURL(fichier).href, { waitUntil: 'networkidle0', timeout: 30000 });
    await attendre(500);
    const etat = await p.evaluate(reperer);
    if (!etat.racine) return { ok: false, texte: 'aucun élément [data-role="quand-comparer"] (le moment ne se choisit pas)' };
    if (!etat.visible) return { ok: false, texte: 'le sélecteur de moment existe mais ne se voit pas à 390 px' };
    const requis = ['60', '10', 'dryhop'];
    const manque = requis.filter((m) => !etat.moments.includes(m));
    if (etat.moments.length < 3 || manque.length) {
      return { ok: false, texte: `moments trouvés : ${etat.moments.join(', ') || 'aucun'} ; manque ${manque.map((m) => (m === 'dryhop' ? 'dry hop' : m + '′')).join(', ') || 'un 3e moment'}` };
    }
    if ((await stable(p)) === null) return { ok: false, texte: 'valeurs instables avant tout geste (la page bouge seule)' };
    const sigs = {};
    for (const m of etat.moments) {
      const e2 = await p.evaluate(reperer);
      const idx = e2.moments.indexOf(m);
      if (idx < 0) return { ok: false, texte: `le moment ${m} disparaît du sélecteur après un toucher` };
      const h = await p.$(`[data-role="quand-comparer"] [data-qc="${idx}"]`);
      if (!h) return { ok: false, texte: `le moment ${m} ne peut pas être touché` };
      await h.evaluate((e) => e.scrollIntoView({ block: 'center' }));
      await h.click();
      await attendre(300);
      const s = await stable(p);
      if (s === null) return { ok: false, texte: `valeurs instables après le toucher de ${m}` };
      sigs[m] = s;
    }
    const mortes = [];
    for (let i = 0; i < requis.length; i += 1) {
      for (let j = i + 1; j < requis.length; j += 1) if (sigs[requis[i]] === sigs[requis[j]]) mortes.push(`${requis[i]} = ${requis[j]}`);
    }
    if (mortes.length) return { ok: false, texte: `toucher un autre moment ne change pas les valeurs comparées (identiques : ${mortes.join(' ; ')})` };
    const noms = etat.moments.map((m) => (m === 'dryhop' ? 'dry hop' : m + '′'));
    return { ok: true, texte: `${noms.length} moments (${noms.join(', ')}), les valeurs changent d'un moment à l'autre` };
  } catch (e) {
    return { ok: false, texte: `plantage de la page : ${String(e.message ?? e).slice(0, 120)}` };
  } finally {
    await p.close();
  }
}

const navigateur = await puppeteer.launch({ executablePath: CHROME, headless: true });
let echecs = 0;
for (const id of ids) {
  const r = await juger(navigateur, id);
  if (!r.ok) echecs += 1;
  console.log(`${id} : ${r.ok ? 'OK' : 'ECHEC'} — ${r.texte}`);
}
await navigateur.close();
const jeton = ['QUAN', 'D'].join('');
console.log(echecs ? `${jeton} ECHEC (${echecs})` : `${jeton} OK`);
process.exit(echecs ? 1 : 0);
