#!/usr/bin/env node
// D124 (24.10) : « Ça a bien avancé mais le rail par exemple à perdu en fonctionnalités et certaines de mes choix ont
// été perdue ». CHOIX OK restait vert : ses inventaires ne relèvent que l'état au repos de chaque maquette choisie.
// Les voies p21a et p21b ont joué 113 états de ses maquettes choisies (toucher, appui long, survol, onglet, réglage) :
// work/refonte-frontend/v4/choix/etats/{etape,biere,fiche,suggerer,comparer,acquis}.json. Ce contrôle les REJOUE, pour
// qu'une perte ne passe plus jamais inaperçue.
//
// UN ÉTAT (dans le JSON) : { id, voulu, verif, … }
//   voulu : « » ou la ligne D qui a voulu l'écart (D109 croix, D116 fil d'étapes…) ; un état voulu n'est pas rejoué.
//   verif : { route, page_choisie, selecteur_choisie, geste, attendu[], interdit[],
//             rang?, fois?, avant?[], saisie?, appui_ms?, viewport?, page_construite?, url?, max_mots?, fond?, note? }
//     route               dossier de la maquette construite : <dossier>/<route>/<page_construite ?? etat.html>
//     page_choisie        la page de SA maquette choisie, jouée telle quelle pour le témoin positif
//     selecteur_choisie   sélecteur CSS dans cette page, ou « texte=Radar » (bouton, lien ou résumé dont le texte
//                         commence par Radar), ou « contient=Panel OSU » (l'élément affiché le plus profond qui contient
//                         ce texte) ; « rang » = n-ième correspondance (0 par défaut)
//     geste               repos | toucher | appui-long | survol | onglet | reglage (onglet et reglage = toucher)
//     fois / saisie       toucher n fois ; texte tapé dans un champ ; point [x, y] : toucher ce point de la page (l'élément
//                         marqué doit s'y trouver) ; appui_ms / tenu : durée de l'appui, effet lu doigt encore posé
//     avant               ids d'autres états du même fichier à jouer d'abord, dans l'ordre (ouvrir une ligne, puis « + »)
//     attendu / interdit  mots ou nombres lus après le geste : le texte visible, plus les libellés accessibles
//                         (aria-label, title, placeholder, valeur) des éléments affichés ; casse, espaces et tirets
//                         ne comptent pas. Ils ont été MESURÉS sur sa maquette choisie, jamais inventés.
//     url                 morceau d'adresse attendu après le geste (aller vers une autre page)
//     max_mots / fond / couleurs_min   mesures : mots du premier écran au plus ; couleur de fond du corps ; nombre minimal de
//                         couleurs franches (non grises) dans l'élément marqué et ses descendants (les arômes sont en couleur)
//
// LE CONTRAT DE LA MAQUETTE CONSTRUITE : l'élément déclencheur d'un état porte data-etat="<id>" (par exemple
// data-etat="etat-fiche-sources" sur le bouton « Sources › ») ; pour un état « repos », l'élément qui le montre.
// Un sélecteur absent, un geste sans effet, un mot manquant, un mot interdit : l'état échoue, avec la mesure.
//
// Usage : node controle-etats.mjs <dossier construit> [--ecran=etape|biere|fiche|suggerer|comparer|acquis]
//                                  [--etats=<dossier des JSON>] [--id=<état>] [--montre]
//         node controle-etats.mjs <dossier> --repli    (diagnostic : sans data-etat, jouer le sélecteur relevé sur 5345f6ad)
//         node controle-etats.mjs --choisie [--ecran=…]     (témoin : joue chaque état sur sa maquette choisie)
// Sortie : une ligne par état (« etat-… OK » ou « etat-… ECHEC : … »), puis « ETATS OK (n/n) » ou « ETATS ECHEC (k/n) ».
// --montre ajoute, par état, ce que le geste a fait apparaître (pour mesurer un « attendu »).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const ici = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ici, '..', '..', '..', '..', '..');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FICHIERS = ['etape', 'biere', 'fiche', 'suggerer', 'comparer', 'acquis', 'substituer'];

const args = process.argv.slice(2);
const opt = (nom) => { const a = args.find((x) => x.startsWith(`--${nom}=`)); return a ? a.slice(nom.length + 3) : null; };
const choisie = args.includes('--choisie');
const montre = args.includes('--montre');
const repli = args.includes('--repli');
const seulEcran = opt('ecran');
const seulId = opt('id');
// --captures=<dossier> : une capture de l'écran (390 × 844) après chaque geste, `<id>-construite.png` (ou `-choisie`
// avec --choisie), pour poser chaque état à côté de sa maquette choisie. --avec-voulus : les états voulus sont joués
// aussi, pour leur capture seulement ; leur verdict ne compte pas.
const dossierCaptures = opt('captures') ? path.resolve(RACINE, opt('captures')) : null;
const avecVoulus = args.includes('--avec-voulus');
if (dossierCaptures) fs.mkdirSync(dossierCaptures, { recursive: true });
const dossierEtats = path.resolve(RACINE, opt('etats') ?? 'work/refonte-frontend/v4/choix/etats');
const pos = args.filter((a) => !a.startsWith('--'));
if (!choisie && !pos[0]) {
  console.log('Usage : node controle-etats.mjs <dossier construit> [--ecran=…] [--etats=…] [--id=…] [--montre]   |   --choisie');
  process.exit(2);
}
if (seulEcran && !FICHIERS.includes(seulEcran)) { console.log(`ETATS ECHEC : --ecran=${seulEcran} inconnu (${FICHIERS.join(', ')})`); process.exit(1); }
const dossier = choisie ? null : path.resolve(RACINE, pos[0]);

const attente = (ms) => new Promise((r) => setTimeout(r, ms));
// Casse, espaces insécables, apostrophes et tirets ne comptent pas.
const norm = (s) => String(s).normalize('NFC').toLowerCase().replace(/[\u00a0\u202f\u2009]/g, ' ').replace(/[’‘`]/g, "'").replace(/[\u2212\u2013\u2014]/g, '-').replace(/\s+/g, ' ').trim();

// 1. Les états à rejouer.
const fichiers = (seulEcran ? [seulEcran] : FICHIERS);
const parFichier = {};
const aJouer = [];
let voulus = 0;
const enAttente = [];
for (const f of fichiers) {
  const chemin = path.join(dossierEtats, `${f}.json`);
  if (!fs.existsSync(chemin)) { console.log(`ETATS ECHEC : ${path.relative(RACINE, chemin)} absent`); process.exit(1); }
  const j = JSON.parse(fs.readFileSync(chemin, 'utf8'));
  parFichier[f] = new Map(j.etats.map((s) => [s.id, s]));
  for (const s of j.etats) {
    if (seulId && s.id !== seulId) continue;
    // attend_choix : un acquis d'un écran au choix encore ouvert (D123 : rien d'un écran au choix ouvert) ; rejoué quand
    // il aura choisi, compté à part.
    if (s.attend_choix) { enAttente.push(`${s.id} (${s.attend_choix})`); continue; }
    if (s.voulu) { voulus++; if (avecVoulus) aJouer.push({ fichier: f, etat: s, voulu: true }); continue; }
    aJouer.push({ fichier: f, etat: s });
  }
}
if (!aJouer.length) { console.log(`ETATS ECHEC (0/0) : aucun état à rejouer${seulId ? ` (id ${seulId})` : ''}${enAttente.length ? ` ; en attente de son choix : ${enAttente.join(', ')}` : ''}`); process.exit(1); }

// 2. Le lecteur de page : texte visible + libellés accessibles des éléments affichés.
const LIRE = () => {
  const vus = (e) => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
  const bouts = [document.body.innerText];
  for (const e of document.querySelectorAll('[aria-label],[title],input,textarea')) {
    if (!vus(e)) continue;
    for (const a of ['aria-label', 'title', 'placeholder']) { const v = e.getAttribute(a); if (v) bouts.push(v); }
    if (e.value && typeof e.value === 'string') bouts.push(e.value);
  }
  return bouts.join('\n');
};
const MOTS_PREMIER_ECRAN = () => {
  let n = 0;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) {
    const t = w.currentNode; const p = t.parentElement;
    if (!p || !t.textContent.trim() || getComputedStyle(p).visibility === 'hidden') continue;
    const r = document.createRange(); r.selectNodeContents(t);
    const q = r.getClientRects();
    if (q.length && q[0].height > 0 && q[0].top < innerHeight && q[0].bottom > 0) n += t.textContent.split(/\s+/).filter((x) => /[\p{L}\p{N}]/u.test(x)).length;
  }
  return n;
};
// Couleurs franches (non grises) portées par l'élément et ses descendants : texte, fond, remplissage, trait.
const COULEURS = (racine) => {
  const vus = new Set();
  for (const e of [racine, ...racine.querySelectorAll('*')]) {
    if (e.getClientRects().length === 0) continue;
    const cs = getComputedStyle(e);
    for (const c of [cs.color, cs.backgroundColor, cs.fill, cs.stroke]) {
      const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(c || '');
      if (!m || (m[4] !== undefined && Number(m[4]) < 0.5)) continue;
      const [r, g, b] = [m[1], m[2], m[3]].map(Number);
      if (Math.max(r, g, b) - Math.min(r, g, b) >= 45) vus.add([r >> 4, g >> 4, b >> 4].join('.'));
    }
  }
  return vus.size;
};
const lire = async (page) => {
  for (let i = 0; i < 12; i++) {
    try { return await page.evaluate(LIRE); } catch (e) { await attente(250); }
  }
  return page.evaluate(LIRE);
};
const empreinte = async (page) => {
  for (let i = 0; i < 12; i++) {
    try { return await page.evaluate(() => location.href + '\u0001' + document.body.innerHTML + '\u0001' + [...document.querySelectorAll('input,textarea')].map((i) => i.value).join('|')); } catch (e) { await attente(250); }
  }
  return '';
};

// 3. Trouver l'élément d'un état : sur la maquette construite (data-etat) ou sur sa maquette choisie (sélecteur).
const trouver = async (page, e, mode) => {
  const v = e.verif;
  if (mode === 'construite') {
    const h = await page.$$(`[data-etat~="${e.id}"]`);
    if (h[0] || !repli) return h[0] ?? null;
    // --repli (diagnostic) : sans data-etat, tenter le sélecteur que p21a/p21b ont joué sur 5345f6ad, pour voir si la
    // perte est réelle (mots absents) ou seulement le contrat non posé.
    const rs = String(e.jeu?.selecteur_5345f6ad ?? e.jeu?.geste_5345f6ad ?? '');
    const m = /^(?:button )?« (.+) »$/.exec(rs);
    const sel2 = m ? 'texte=' + m[1] : /^[\[.#a-z]/i.test(rs) && !rs.includes('(') ? rs : null;
    try { return sel2 ? await trouver(page, { ...e, verif: { ...v, selecteur_choisie: sel2, rang: 0 } }, 'choisie') : null; } catch (err) { return null; }
  }
  const sel = v.selecteur_choisie;
  const rang = v.rang ?? 0;
  if (sel.startsWith('texte=')) {
    const txt = sel.slice(6);
    const l = await page.evaluateHandle((t, r) => {
      const n = (s) => s.replace(/\s+/g, ' ').trim().toLowerCase();
      const c = [...document.querySelectorAll('button,a,[role=button],summary')].filter((x) => x.getClientRects().length > 0 && n(x.innerText || '').startsWith(n(t)));
      return c[r] ?? null;
    }, txt, rang);
    return l.asElement();
  }
  if (sel.startsWith('contient=')) {
    // l'élément affiché le plus profond dont le texte contient ce texte
    const l = await page.evaluateHandle((t, r) => {
      const n = (x) => x.replace(/\s+/g, ' ').trim().toLowerCase();
      const dedans = (e) => e.getClientRects().length > 0 && n(e.innerText || '').includes(n(t));
      const c = [...document.querySelectorAll('body *')].filter((e) => dedans(e) && ![...e.children].some(dedans));
      return c[r] ?? null;
    }, sel.slice(9), rang);
    return l.asElement();
  }
  const hs = await page.$$(sel);
  return hs[rang] ?? null;
};
const toucher = async (page, h, v) => {
  await h.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await attente(120);
  // Le centre de sa boîte, déjà au centre de l'écran : `h.tap()` attendait un IntersectionObserver, qui ne répond qu'à une
  // image peinte (24.10 : les doses de l'étape bloquaient plus de 180 s dans le rejeu complet).
  if (!v.point) {
    const b = await h.boundingBox();
    if (!b) throw new Error('élément sans boîte (caché)');
    await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
    return;
  }
  // Un point précis de la page (le fond d'une feuille) : l'élément marqué doit être celui qui s'y trouve.
  const [x, y] = v.point;
  const bon = await h.evaluate((e, px, py) => { const c = document.elementFromPoint(px, py); return !!c && (e === c || e.contains(c)); }, x, y);
  if (!bon) throw new Error(`l'élément marqué n'est pas celui qui se trouve au point (${x}, ${y})`);
  await page.touchscreen.tap(x, y);
};
const geste = async (page, h, v, retrouver, capturer) => {
  const g = v.geste;
  if (g === 'repos') return;
  if (g === 'toucher' || g === 'onglet' || g === 'reglage') {
    if (v.saisie) { await h.evaluate((e) => { e.scrollIntoView({ block: 'center' }); e.focus(); }); await page.keyboard.type(v.saisie, { delay: 40 }); }
    else {
      for (let i = 0; i < (v.fois ?? 1); i++) {
        if (i > 0) h = (await retrouver()) ?? h; // la page se redessine après un toucher
        await toucher(page, h, v); await attente(300);
      }
    }
  } else if (g === 'appui-long') {
    await h.evaluate((e) => e.scrollIntoView({ block: 'center' }));
    await attente(120);
    const t = await h.touchStart(); await attente(v.appui_ms ?? 700);
    // « tenu » : l'effet se lit PENDANT l'appui, doigt encore posé (D112 : « L'appui prolonger fait pas l'effet escompté »).
    if (v.tenu) { const tenu = { apres: await empreinte(page), texte: await lire(page) }; if (capturer) await capturer(); await t.end(); await attente(300); return tenu; }
    await t.end();
  } else if (g === 'survol') {
    await h.evaluate((e) => e.scrollIntoView({ block: 'center' }));
    await h.hover(); await attente(v.survol_ms ?? 2600);
  } else throw new Error(`geste « ${g} » inconnu (repos, toucher, appui-long, survol, onglet, reglage)`);
  await attente(650);
};

// 4. Un état.
// Quatre onglets à la fois : sans ces drapeaux, Chrome suspend le rendu des onglets d'arrière-plan, et un toucher y attend
// que les autres se ferment (24.10 : les doses de l'étape attendaient 24 s seules, plus de 180 s dans le rejeu complet).
const navigateur = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding'],
});
// ETATS_TRACE=1 : chaque étape d'un état, horodatée, sur la sortie d'erreur (diagnostic d'un délai dépassé).
const T0 = Date.now();
// Seul l'onglet au premier plan reçoit vite un toucher : un onglet d'arrière-plan l'attend jusqu'à passer devant (24.10 : les
// doses de l'étape, 108 ms seules, 24 s à quatre onglets, plus de 180 s dans le rejeu complet). Les pages se chargent à
// quatre ; les gestes et leurs lectures passent un par un, au premier plan. Un onglet neuf prend le premier plan : sa
// création passe par le même verrou (page = null), pour ne jamais tomber pendant un geste.
let verrou = Promise.resolve();
const auPremierPlan = (page, f) => {
  const tour = verrou.then(async () => { if (page) await page.bringToFront(); return f(); });
  verrou = tour.catch(() => {});
  return tour;
};
const trace = process.env.ETATS_TRACE ? (id, quoi) => process.stderr.write(`[${((Date.now() - T0) / 1000).toFixed(1)} s] ${id} ${quoi}\n`) : () => {};
const jouerEtat = async (fichier, e) => {
  const v = e.verif ?? {};
  const mode = choisie ? 'choisie' : 'construite';
  const manques = [];
  if (!v.route || !v.geste) return { ko: [`verif incomplète (route, geste) dans ${fichier}.json`] };
  let adresse;
  if (choisie) {
    if (!v.page_choisie || !v.selecteur_choisie) return { ko: ['verif incomplète (page_choisie, selecteur_choisie)'] };
    const f = path.resolve(RACINE, v.page_choisie);
    if (!fs.existsSync(f)) return { ko: [`page choisie absente (${v.page_choisie})`] };
    adresse = pathToFileURL(f).href;
  } else {
    const f = path.join(dossier, v.route, v.page_construite ?? 'etat.html');
    if (!fs.existsSync(f)) return { ko: [`page absente (${path.relative(RACINE, f)})`] };
    adresse = pathToFileURL(f).href;
  }
  const [lw, lh] = (v.viewport ?? '390x844').split('x').map(Number);
  const page = await auPremierPlan(null, () => navigateur.newPage());
  try {
    const hover = v.geste === 'survol';
    await page.setViewport({ width: lw, height: lh, deviceScaleFactor: 1, isMobile: !hover && lw < 800, hasTouch: !hover && lw < 800 });
    trace(e.id, 'goto');
    await page.goto(adresse, { waitUntil: 'networkidle0', timeout: 30000 });
    trace(e.id, 'chargée');
    await attente(350);
    return await auPremierPlan(page, async () => {
    trace(e.id, 'au premier plan');
    const trouve = async (s) => {
      const h = await trouver(page, s, mode);
      if (!h) manques.push(mode === 'construite' ? `[data-etat="${s.id}"] absent de ${path.relative(RACINE, path.join(dossier, v.route, v.page_construite ?? 'etat.html'))} (le déclencheur de l'état n'est pas posé)` : `sélecteur « ${s.verif.selecteur_choisie} »${s.verif.rang ? ` (rang ${s.verif.rang})` : ''} absent de sa maquette choisie`);
      return h;
    };
    // Les préalables (« avant »), eux-mêmes précédés des leurs, dans l'ordre, sans jamais rejouer deux fois le même.
    const ordre = [];
    const empiler = (ids, pile = []) => {
      for (const idAvant of ids) {
        const pre = parFichier[fichier].get(idAvant);
        if (!pre) { manques.push(`avant : état ${idAvant} inconnu`); continue; }
        if (pile.includes(idAvant)) { manques.push(`avant : boucle sur ${idAvant}`); continue; }
        empiler(pre.verif?.avant ?? [], [...pile, idAvant]);
        if (!ordre.includes(pre)) ordre.push(pre);
      }
    };
    empiler(v.avant ?? []);
    for (const pre of ordre) {
      const hp = await trouve(pre);
      if (!hp) break;
      await geste(page, hp, pre.verif, () => trouver(page, pre, mode));
    }
    if (manques.length) return { ko: manques };
    const h = await trouve(e);
    if (!h) return { ko: manques };
    trace(e.id, 'trouvé');
    const avant = await empreinte(page);
    const texteAvant = await lire(page);
    trace(e.id, 'lu avant le geste');
    const capturer = dossierCaptures
      ? () => page.screenshot({ path: path.join(dossierCaptures, `${e.id}-${mode}.png`) }).catch(() => {})
      : null;
    const tenu = await geste(page, h, v, () => trouver(page, e, mode), capturer);
    trace(e.id, 'geste fait');
    if (capturer && !tenu) await capturer();
    const apres = tenu?.apres ?? await empreinte(page);
    const texte = tenu?.texte ?? await lire(page);
    trace(e.id, 'lu après le geste');
    if (v.geste !== 'repos' && apres === avant) manques.push(`geste « ${v.geste}${v.fois > 1 ? ' ×' + v.fois : ''} » sans effet (la page n'a pas changé)`);
    if (v.url && !page.url().includes(v.url)) manques.push(`adresse « ${decodeURI(page.url()).split('/').slice(-2).join('/')} » ne contient pas « ${v.url} »`);
    const t = norm(texte);
    const absents = (v.attendu ?? []).filter((m) => !t.includes(norm(m)));
    const presents = (v.interdit ?? []).filter((m) => t.includes(norm(m)));
    if (absents.length) manques.push(`mots absents ${absents.map((m) => `« ${m} »`).join(' ')} (${(v.attendu.length - absents.length)}/${v.attendu.length} lus)`);
    if (presents.length) manques.push(`mots interdits présents ${presents.map((m) => `« ${m} »`).join(' ')}`);
    if (v.max_mots) {
      const n = await page.evaluate(MOTS_PREMIER_ECRAN);
      if (n > v.max_mots) manques.push(`${n} mots au premier écran (au plus ${v.max_mots})`);
    }
    if (v.couleurs_min) {
      const n = await h.evaluate(COULEURS);
      if (n < v.couleurs_min) manques.push(`${n} couleur(s) franche(s) dans l'élément (au moins ${v.couleurs_min})`);
    }
    if (v.fond) {
      const f = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      if (f.replace(/\s/g, '') !== v.fond.replace(/\s/g, '')) manques.push(`fond ${f} au lieu de ${v.fond}`);
    }
    let nouveau = null;
    if (montre) {
      const vieux = new Set(texteAvant.split('\n').map(norm));
      nouveau = texte.split('\n').map((l) => l.trim()).filter((l) => l && !vieux.has(norm(l)));
    }
    return { ko: manques, nouveau };
    });
  } catch (err) {
    return { ko: [`erreur : ${String(err.message ?? err).split('\n')[0]}`] };
  } finally {
    await page.close();
  }
};

let ok = 0;
const echecs = [];
// Quatre pages à la fois ; la sortie reste dans l'ordre des fichiers.
const resultats = new Array(aJouer.length);
let suivant = 0;
const ouvrier = async () => {
  while (suivant < aJouer.length) {
    const i = suivant++;
    resultats[i] = await jouerEtat(aJouer[i].fichier, aJouer[i].etat);
  }
};
await Promise.all(Array.from({ length: Math.min(4, aJouer.length) }, ouvrier));
let n = 0;
for (const [i, { etat, voulu }] of aJouer.entries()) {
  const r = resultats[i];
  if (voulu) { console.log(`${etat.id} voulu (${etat.voulu}) : joué pour sa capture${r.ko.length ? ` ; ${r.ko.join(' ; ')}` : ''}`); continue; }
  n++;
  if (!r.ko.length) { ok++; console.log(`${etat.id} OK`); }
  else { echecs.push(etat.id); console.log(`${etat.id} ECHEC : ${r.ko.join(' ; ')}`); }
  if (montre && r.nouveau) console.log('    + ' + (r.nouveau.slice(0, 10).map((l) => l.replace(/\s+/g, ' ').slice(0, 100)).join(' | ') || '(rien de nouveau)'));
}
await navigateur.close();
const suite = (voulus ? ` ; ${voulus} voulu(s) ${avecVoulus ? 'joué(s) pour leur capture, hors verdict' : 'non rejoué(s)'}` : '')
  + (enAttente.length ? ` ; ${enAttente.length} en attente de son choix : ${enAttente.join(', ')}` : '');
if (echecs.length) { console.log(`ETATS ECHEC (${echecs.length}/${n})${suite}`); process.exit(1); }
console.log(`ETATS OK (${ok}/${n})${suite}${choisie ? ' sur ses maquettes choisies' : ''}`);
