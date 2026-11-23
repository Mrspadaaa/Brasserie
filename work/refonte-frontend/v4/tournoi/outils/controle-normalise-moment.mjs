#!/usr/bin/env node
// D142 (25.10), ses mots : « Les barre semble pas être normalisé au temps et au style » (passe 2), puis « Pas normalisé au
// timing. Pareil pour les barre » (passe 3, vue à 60′). À 60′, les apports sont dix fois plus petits qu'au dry hop : si les
// barres des familles et le radar gardent l'échelle du dry hop, les écarts entre deux houblons sont écrasés. Au moment
// choisi, chaque famille doit être mise à l'échelle de son plus fort apport de ce moment.
//
// Pour chaque page, à 390 x 844, on touche chaque moment utile (60′, puis chaque dry hop du sélecteur
// [data-role="quand-comparer"]) et on mesure, une fois la page stable :
//   1. barres : dans chaque rangée de famille ([data-famille-ligne]) qui a un apport non nul, la plus grande barre remplit
//      au moins 40 % de sa piste. Une famille où tout est à zéro, ou inconnu (pas de barre), n'est pas jugée (l'inconnu
//      n'est jamais 0). Avec --barres=globale : seule la plus grande barre de toute la page doit remplir 40 % (lecture large) ;
//   2. écart : au moins une famille montre, entre deux houblons, un écart d'au moins 15 % de la piste ;
//   3. radar : s'il existe, chaque radar a au moins un sommet de série (élément [data-serie]) au-delà de 40 % du rayon.
// Repères lus (le premier qui existe) :
//   barre   : [data-role="barre-famille"], sinon dans une cellule [data-col] l'élément [data-famille] hors svg et sans data-role ;
//   piste   : [data-role="piste-famille"] englobant la barre, sinon le parent direct de la barre ;
//   radar   : [data-role="radar"], sinon le svg qui contient des [data-serie] ; centre et rayon : les lignes d'axe (point de départ
//             commun, la plus longue), sinon le plus grand cercle.
// Exemption (D67) : une cellule dont l'apport est sous 0,05 cran (attribut data-valeur en crans, sinon « ~+0,1 cran » de l'aria-label
//   de la cellule ; « ~+0 cran » = sous 0,05) s'affiche « ~0 », sans barre : elle n'est jugée dans aucune des mesures de barres.
// Si un repère manque, le contrôle le dit (ligne ECHEC « repère manquant : … ») au lieu de deviner.
// Usage : node controle-normalise-moment.mjs <dossier> <id...> [--page=etat.html] [--barres=globale]   (page lue : <dossier>/<id>/<page>)
// Sortie : une ligne par page et par moment, puis le nom du contrôle suivi de OK ou « ECHEC (n) ». Ne s'arrête pas au premier échec (M16).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const args = process.argv.slice(2);
const pageNom = (args.find((a) => a.startsWith('--page=')) ?? '--page=etat.html').slice(7);
const globale = (args.find((a) => a.startsWith('--barres=')) ?? '').slice(9) === 'globale';
const [dossier, ...ids] = args.filter((a) => !a.startsWith('--'));
if (!dossier || !ids.length) {
  console.log('Usage : node controle-normalise-moment.mjs <dossier> <id...> [--page=etat.html] [--barres=globale]');
  process.exit(2);
}
const SEUIL_BARRE = 40;
const SEUIL_ECART = 15;
const SEUIL_RADAR = 40;
const SEUIL_NUL = 0.05; // crans : en dessous, l'apport est « ~0 », sans barre, non jugé (D67)

// Dans la page : repère les éléments-moments du sélecteur et les marque data-nm (index). Rend {racine, visible, moments:[{cle,nom}]}.
function reperer() {
  const racine = document.querySelector('[data-role="quand-comparer"]');
  if (!racine) return { racine: false };
  const vu = (e) => {
    const b = e.getBoundingClientRect();
    return b.width > 0 && b.height > 0 && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden]');
  };
  const source = (e) => {
    const dm = (e.getAttribute('data-moment') ?? '').toLowerCase();
    const tx = (e.innerText ?? e.textContent ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
    return { dm, tx, src: dm || tx };
  };
  const cle = (e) => {
    const { src } = source(e);
    if (/dry\s*-?\s*hop|dryhop|^dh$/.test(src)) return 'dryhop';
    if (/(^|\D)60\s*(′|'|’|min|m$|$)/.test(src)) return '60';
    return '';
  };
  let cands = [...racine.querySelectorAll('[data-moment]')];
  if (!cands.length) cands = [...racine.querySelectorAll('button,[role=tab],[role=radio],[role=button],[role=option],a,label,li,[onclick],[tabindex]')];
  let liste = cands.filter((e) => vu(e) && cle(e));
  if (!liste.length) liste = [...racine.querySelectorAll('*')].filter((e) => !e.children.length && vu(e) && cle(e));
  liste = liste.filter((e) => !liste.some((o) => o !== e && e.contains(o)));
  racine.querySelectorAll('[data-nm]').forEach((e) => e.removeAttribute('data-nm'));
  const moments = [];
  const noms = new Set();
  liste.forEach((e) => {
    const k = cle(e);
    const { dm, tx } = source(e);
    const nom = k === '60' ? '60′' : ('dry hop ' + (dm.replace(/^.*dry-?hop-?/, '') || tx.replace(/dry\s*-?\s*hop/, '').trim())).trim();
    if (k === '60' && moments.some((m) => m.cle === '60')) return;
    if (noms.has(nom)) return;
    noms.add(nom);
    e.setAttribute('data-nm', String(moments.length));
    moments.push({ cle: k, nom });
  });
  const r = racine.getBoundingClientRect();
  return { racine: true, visible: r.width > 0 && r.height > 0, moments };
}

// Dans la page : les mesures. Rend {rangees:[{famille, barres:[% ou null]}], manque:[...], radars:[{rayon, parSerie:{nom:%}, max}]}.
function mesurer() {
  const manque = [];
  const rangees = [];
  const lignes = [...document.querySelectorAll('[data-famille-ligne]')];
  if (!lignes.length) manque.push('rangées de familles [data-famille-ligne] avec une cellule [data-col] par houblon');
  for (const l of lignes) {
    const cellules = [...l.querySelectorAll('[data-col]')];
    // Apport en crans de la cellule : data-valeur (cellule ou barre), sinon « ~+0,1 cran » de l'aria-label de la cellule.
    const apportDe = (c) => {
      const dv = c.getAttribute('data-valeur') ?? c.querySelector('[data-valeur]')?.getAttribute('data-valeur');
      if (dv !== null && dv !== undefined && dv !== '' && !Number.isNaN(Number(String(dv).replace(',', '.')))) return Math.abs(Number(String(dv).replace(',', '.')));
      const m = /([+\-−]?\s*\d+(?:[.,]\d+)?)\s*cran/.exec(c.getAttribute('aria-label') ?? '');
      return m ? Math.abs(Number(m[1].replace(/[+\-−\s]/g, '').replace(',', '.'))) : null;
    };
    const barres = cellules.map((c) => {
      let bs = [...c.querySelectorAll('[data-role="barre-famille"]')];
      if (!bs.length) bs = [...c.querySelectorAll('[data-famille]')].filter((e) => !(e instanceof SVGElement) && !e.hasAttribute('data-role'));
      if (!bs.length) return null;
      let meilleur = null;
      for (const b of bs) {
        const piste = b.closest('[data-role="piste-famille"]') ?? b.parentElement;
        const w = piste.getBoundingClientRect().width;
        if (w <= 0) continue;
        const v = (b.getBoundingClientRect().width / w) * 100;
        if (meilleur === null || v > meilleur) meilleur = v;
      }
      return meilleur === null ? null : { v: meilleur, apport: apportDe(c) };
    });
    if (barres.some((b) => b !== null)) rangees.push({ famille: l.getAttribute('data-famille-ligne'), barres });
  }
  if (lignes.length && !rangees.length) manque.push('barres de famille : [data-role="barre-famille"] (et [data-role="piste-famille"] si le parent direct n\'est pas la piste)');

  const nombres = (s) => (String(s ?? '').match(/-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []).map(Number);
  const pointsDe = (e) => {
    const t = e.tagName.toLowerCase();
    if (t === 'circle') return [[+e.getAttribute('cx'), +e.getAttribute('cy')]];
    if (t === 'polygon' || t === 'polyline') {
      const n = nombres(e.getAttribute('points'));
      const pts = [];
      for (let i = 0; i + 1 < n.length; i += 2) pts.push([n[i], n[i + 1]]);
      return pts;
    }
    if (t === 'path') {
      const pts = [];
      let x = 0; let y = 0; let x0 = 0; let y0 = 0;
      const re = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
      let m;
      while ((m = re.exec(e.getAttribute('d') ?? ''))) {
        const c = m[1];
        const n = nombres(m[2]);
        const rel = c === c.toLowerCase();
        const C = c.toUpperCase();
        const pas = { M: 2, L: 2, T: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, A: 7, Z: 0 }[C];
        if (C === 'Z') { x = x0; y = y0; continue; }
        for (let i = 0; i + pas <= n.length; i += pas) {
          const f = n.slice(i, i + pas);
          if (C === 'H') x = rel ? x + f[0] : f[0];
          else if (C === 'V') y = rel ? y + f[0] : f[0];
          else {
            const ex = f[pas - 2]; const ey = f[pas - 1];
            x = rel ? x + ex : ex; y = rel ? y + ey : ey;
          }
          if (C === 'M' && i === 0) { x0 = x; y0 = y; }
          pts.push([x, y]);
        }
      }
      return pts;
    }
    return [];
  };

  let svgs = [...document.querySelectorAll('[data-role="radar"]')].map((e) => (e instanceof SVGSVGElement ? e : e.querySelector('svg')) ?? e.closest('svg')).filter(Boolean);
  if (!svgs.length) svgs = [...new Set([...document.querySelectorAll('[data-serie]')].map((e) => e.closest('svg')).filter(Boolean))];
  const radars = [];
  for (const s of svgs) {
    const rc = s.getBoundingClientRect();
    if (rc.width <= 0 || rc.height <= 0) continue;
    let cx = null; let cy = null; let rayon = 0;
    const lignesAxe = [...s.querySelectorAll('line')];
    if (lignesAxe.length) {
      const compte = new Map();
      lignesAxe.forEach((l) => { const k = l.getAttribute('x1') + ',' + l.getAttribute('y1'); compte.set(k, (compte.get(k) ?? 0) + 1); });
      const [k] = [...compte.entries()].sort((a, b) => b[1] - a[1])[0];
      [cx, cy] = k.split(',').map(Number);
      lignesAxe.filter((l) => l.getAttribute('x1') + ',' + l.getAttribute('y1') === k).forEach((l) => {
        rayon = Math.max(rayon, Math.hypot(+l.getAttribute('x2') - cx, +l.getAttribute('y2') - cy));
      });
    }
    if (!(rayon > 0)) {
      const cercles = [...s.querySelectorAll('circle')].filter((c) => !c.closest('[data-serie]') && !c.hasAttribute('data-serie'));
      if (cercles.length) {
        const g = cercles.sort((a, b) => +b.getAttribute('r') - +a.getAttribute('r'))[0];
        cx = +g.getAttribute('cx'); cy = +g.getAttribute('cy'); rayon = +g.getAttribute('r');
      }
    }
    if (!(rayon > 0)) { manque.push('radar : lignes d\'axe (<line> partant du centre) ou cercle de grille pour lire le rayon'); continue; }
    const parSerie = {};
    const series = [...s.querySelectorAll('[data-serie]')];
    for (const e of series) {
      const nom = e.getAttribute('data-serie');
      const formes = [e, ...e.querySelectorAll('path,polygon,polyline,circle')];
      for (const f of formes) {
        for (const [x, y] of pointsDe(f)) {
          const d = (Math.hypot(x - cx, y - cy) / rayon) * 100;
          if (parSerie[nom] === undefined || d > parSerie[nom]) parSerie[nom] = d;
        }
      }
    }
    if (!series.length) { manque.push('radar : séries [data-serie] sur les formes des houblons'); continue; }
    const max = Math.max(...Object.values(parSerie));
    radars.push({ rayon, parSerie, max });
  }
  return { rangees, manque: [...new Set(manque)], radars };
}

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
async function stable(p) {
  let prec = JSON.stringify(await p.evaluate(mesurer));
  for (let i = 0; i < 8; i += 1) {
    await attendre(250);
    const cur = JSON.stringify(await p.evaluate(mesurer));
    if (cur === prec) return JSON.parse(cur);
    prec = cur;
  }
  return null;
}

const ent = (v) => Math.round(v);
// Juge une mesure : rend {ok, texte}.
function juger(m) {
  const pb = [];
  if (m.manque.length) return { ok: false, texte: 'repère manquant : ' + m.manque.join(' ; ') };
  // 1. barres
  // Exemption (D67) : une cellule dont l'apport est sous 0,05 cran s'affiche « ~0 », sans barre : elle n'est pas jugée.
  let exemptees = 0;
  const rangees = m.rangees.map((r) => ({
    famille: r.famille,
    barres: r.barres.map((b) => {
      if (b === null) return null;
      if (b.apport !== null && b.apport < SEUIL_NUL) { exemptees += 1; return null; }
      return b.v;
    }),
  }));
  const jugees = rangees.filter((r) => r.barres.some((v) => v !== null && v > 0));
  const zeros = rangees.length - jugees.length;
  const maxPar = jugees.map((r) => ({ famille: r.famille, max: Math.max(...r.barres.filter((v) => v !== null)) }));
  const globalMax = maxPar.length ? Math.max(...maxPar.map((r) => r.max)) : 0;
  let basses;
  if (globale) basses = globalMax < SEUIL_BARRE ? [{ famille: 'page', max: globalMax }] : [];
  else basses = maxPar.filter((r) => r.max < SEUIL_BARRE);
  if (!jugees.length) pb.push('barres : aucune famille avec un apport non nul');
  else if (basses.length) pb.push(`barres sous ${SEUIL_BARRE} % de la piste pour leur plus grande valeur : ${basses.map((r) => `${r.famille} ${ent(r.max)} %`).join(', ')}`);
  // 2. écart
  let ecart = { v: 0, famille: '-' };
  for (const r of jugees) {
    const k = r.barres.filter((v) => v !== null);
    if (k.length < 2) continue;
    const e = Math.max(...k) - Math.min(...k);
    if (e > ecart.v) ecart = { v: e, famille: r.famille };
  }
  if (ecart.v < SEUIL_ECART) pb.push(`écart : au plus ${ent(ecart.v)} points de piste entre deux houblons (${SEUIL_ECART} au moins)`);
  // 3. radar
  let radarTxt = 'pas de radar';
  if (m.radars.length) {
    const faibles = m.radars.filter((r) => r.max <= SEUIL_RADAR);
    radarTxt = `radar : sommet le plus loin à ${m.radars.map((r) => ent(r.max)).join(' / ')} % du rayon`;
    if (faibles.length) pb.push(`radar : sommet le plus loin à ${faibles.map((r) => ent(r.max)).join(' / ')} % du rayon (plus de ${SEUIL_RADAR} % attendu)`);
  }
  const resume = `barre max ${ent(globalMax)} % (${jugees.length} familles jugées${zeros ? `, ${zeros} à zéro` : ''}${exemptees ? `, ${exemptees} cellules « ~0 » non jugées` : ''}) ; écart max ${ent(ecart.v)} pts (${ecart.famille}) ; ${radarTxt}`;
  return pb.length ? { ok: false, texte: pb.join(' ; ') + ' — ' + resume } : { ok: true, texte: resume };
}

async function page(navigateur, id) {
  const fichier = path.resolve(RACINE, dossier, id, pageNom);
  if (!fs.existsSync(fichier)) return [{ ok: false, nom: '-', texte: `page absente (${path.relative(RACINE, fichier)})` }];
  const p = await navigateur.newPage();
  const lignes = [];
  try {
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await p.goto(pathToFileURL(fichier).href, { waitUntil: 'networkidle0', timeout: 30000 });
    await attendre(500);
    const etat = await p.evaluate(reperer);
    if (!etat.racine) return [{ ok: false, nom: '-', texte: 'aucun élément [data-role="quand-comparer"] (le moment ne se choisit pas)' }];
    if (!etat.visible) return [{ ok: false, nom: '-', texte: 'le sélecteur de moment existe mais ne se voit pas à 390 px' }];
    if (!etat.moments.some((m) => m.cle === '60')) lignes.push({ ok: false, nom: '60′', texte: 'moment 60′ absent du sélecteur' });
    if (!etat.moments.some((m) => m.cle === 'dryhop')) lignes.push({ ok: false, nom: 'dry hop', texte: 'aucun dry hop dans le sélecteur' });
    const utiles = etat.moments.filter((m) => m.cle === '60' || m.cle === 'dryhop');
    for (const m of utiles) {
      const e2 = await p.evaluate(reperer);
      const idx = e2.moments.findIndex((x) => x.nom === m.nom);
      const h = idx < 0 ? null : await p.$(`[data-role="quand-comparer"] [data-nm="${idx}"]`);
      if (!h) { lignes.push({ ok: false, nom: m.nom, texte: 'moment impossible à toucher' }); continue; }
      await h.evaluate((e) => e.scrollIntoView({ block: 'center' }));
      await h.click();
      await attendre(300);
      const mesure = await stable(p);
      if (mesure === null) { lignes.push({ ok: false, nom: m.nom, texte: 'valeurs instables après le toucher' }); continue; }
      lignes.push({ nom: m.nom, ...juger(mesure) });
    }
  } catch (e) {
    lignes.push({ ok: false, nom: '-', texte: `plantage de la page : ${String(e.message ?? e).slice(0, 120)}` });
  } finally {
    await p.close();
  }
  return lignes;
}

const navigateur = await puppeteer.launch({ executablePath: CHROME, headless: true });
let echecs = 0;
for (const id of ids) {
  for (const l of await page(navigateur, id)) {
    if (!l.ok) echecs += 1;
    console.log(`${id} · ${l.nom} : ${l.ok ? 'OK' : 'ECHEC'} — ${l.texte}`);
  }
}
await navigateur.close();
const jeton = ['NORMAL', 'ISE'].join('');
console.log(echecs ? `${jeton} ECHEC (${echecs})` : `${jeton} OK`);
process.exit(echecs ? 1 : 0);
