// HARNAIS OFFICIEL, LE SEUL AUTORISÉ : jamais un harnais du scratchpad (CRITIQUE-10 : les visions 11 ont joué des copies jetables,
// d'où c2-b jamais glissé, f2-a pris par le corps de la barre, le jalon de fin jamais tiré, Livrer jamais touché).
// Vision 12 (CRITIQUE-10, lot D) : états neufs, chacun avec un attendu qui ÉCHOUE s'il n'a pas été joué (L13) : 08s1 et 08s4 (f1-a de la Saison
// pas brassée d'une puis de quatre colonnes, la barre en S+1 puis S+4, jamais « S46 → ») ; 31s (Liste : « prévue le 10 nov. · S46 ») ; 39v
// (« Voir S20 › » touché : la frise règle 6 mois, barre S20 → S40, 5 points touchables) ; 49d (Hotte liée, détail, plage sur une ligne) ;
// 09 mesure +7 j ; 11d sur la Blonde ; 15 lit la date de Livrer sur la vente ; 20 et 20b exigent ± inchangé.
// Vision 9 (CRITIQUE-7, lot D) : le + volant touché par son BOUTON flottant (FAB), la regex `\s+` de l'état 64 rendue, l'état 42 refuse un
// rechargement sans rangée masquée, la période dev-local lue feuille fermée, la barre Travaux POSÉE (S20, 5 `[data-point]`) en An et en 6 mois,
// `fn` qui n'écrit plus son libellé sur une fonction partagée ; états neufs 18b (6 mois, bande lisible), 09s (bord de la Saison pas brassée),
// 35r (rien sous le + après rotation), 01b (une seule chose Brouwland −420), 49b (aperçu de la pastille sans nom répété), 20 exige « CHF · S · date ».
// Vision 8 (CRITIQUE-6, lot D) : la vision 7 reprise ici, plus (1) la réouverture lue APRÈS rechargement (épingle, étoile sur la courbe, rangée
// masquée avec la chose épinglée, ordre) ; (2) la barre Travaux S20 → S40 posée, vue en 6 sem. et en 6 mois (fenêtre déplacée jusqu'à S18) ;
// (3) la TVA T4 en 3 mois ; (4) les gestes 03, 06, 20, 47 mesurés par le texte de l'écran (faux ÉCHEC de la vision 7) ; (5) /?dev-local :
// la période de l'app et du calendrier à 390 (mois, puis « 6 sem. »), le détail des retards (⏰), Commander après la fin du chargement ;
// (6) un démarrage en échec (« Impossible de charger la brasserie ») est dit avec sa console, puis la page est rechargée une fois.
// Vision 7 du calendrier porté (CRITIQUE-5 n° 20 et 10, « Pour passer ») : copie de la vision 6 (scripts/agents/vision-calendrier.mjs de
// ee5092d00), corrigée : (1) l'état est remis à zéro avant chaque état joué (uiState `calendrier_*` vidé, page rechargée) ; (2) chaque geste est
// vérifié par un changement MESURÉ (sa mesure propre, sinon la signature de la frise) : avant = après → ÉCHEC, jamais une capture identique au
// repos ; (3) les états demandés par la critique 5 : Lier et sa pastille, tri puis rechargement, « Achats seuls » puis « Tout afficher »,
// Livrer, pose d'un brassin, d'une vente, d'une activité et leur effet sur le chiffre clé ; (4) /?dev-local : des articles « ZZ TEST » au stock
// (sans article, les Courses ne peuvent rien lister : cause de « Rien à commander », CRITIQUE-5 n° 17), Commander, achat dans Achats, période
// de l'app et du calendrier à 390 ; (5) les 5 tâches chronométrées écrites dans CHRONO.md.
// Vision du calendrier porté (CRITIQUE-2 n° 21 à 42, MISSION § Vérification) : chaque état joué par un vrai geste, capturé, et dit.
// « NE PERDS RIEN DANS LE PORTAGE, REGARDE BIEN TOUR CE QUI A ÉTÉ DEMANDER POUR CE CALENDRIER » (17.11).
//
// node scripts/agents/vision-calendrier.mjs <base> <dossier> [--configs m390,paysage,d1280] [--themes clair,cave] [--etats 01,05,56]
//                                           [--sans-dev-local] [--sans-chrono]
//   <base>    : le serveur Vite, ex. http://localhost:3017 (banc : <base>/?preview=calendrier ; app : <base>/?dev-local)
//   <dossier> : où écrire `<config>-<thème>-<nn>-<état>.png` et RAPPORT.md
//
// Gestes réels : contact tactile CDP (Input.dispatchTouchEvent) à 390 × 844 et 844 × 390, souris à 1280 × 800. Les éléments se trouvent par
// leur texte, leur rôle, leur aria-label (ou title) ou leur data-titre ; jamais par un id daté. Un état dont un élément ou le texte attendu manque
// est dit « ABSENT » dans RAPPORT.md ; sa capture porte le suffixe « -ECHEC » : rien n'est capturé en silence.
// Banc : fixture « banc — données simulées », en mémoire. /?dev-local : chaque requête vers Firestore est coupée avant de partir (rien n'est
// écrit en ligne) ; les saisies portent « ZZ TEST — ». Gemini n'est jamais appelé.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const req = createRequire(import.meta.url);
const puppeteer = req('puppeteer-core');
const args = process.argv.slice(2);
const pos = args.filter(a => !a.startsWith('--'));
const opt = n => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null; };
if (pos.length < 2) { console.log('usage : node scripts/agents/vision-calendrier.mjs <base> <dossier> [--configs …] [--themes …] [--etats …]'); process.exit(2); }
const BASE = pos[0].replace(/\/$/, '');
const DOSSIER = pos[1];
const BANC = `${BASE}/?preview=calendrier`;
const APP = `${BASE}/?dev-local`;
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
mkdirSync(DOSSIER, { recursive: true });

const CONFIGS = {
  m390: { w: 390, h: 844, tactile: true },
  paysage: { w: 844, h: 390, tactile: true },
  d1280: { w: 1280, h: 800, tactile: false }
};
const choixConfigs = (opt('configs') || 'm390,paysage,d1280').split(',').filter(c => CONFIGS[c]);
const choixThemes = (opt('themes') || 'clair,cave').split(',');
const choixEtats = opt('etats') ? new Set(opt('etats').split(',')) : null;
const attendre = ms => new Promise(r => setTimeout(r, ms));
const vue = cfg => (cfg.tactile ? { width: cfg.w, height: cfg.h, isMobile: true, hasTouch: true, deviceScaleFactor: 1, isLandscape: cfg.w > cfg.h } : { width: cfg.w, height: cfg.h, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });
const reSrc = re => (re ? { s: re.source, f: re.flags } : null);

const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--lang=fr-CH'] });
const nouveauContexte = () => (nav.createBrowserContext ? nav.createBrowserContext() : nav.createIncognitoBrowserContext());

class Absent extends Error {}

/* ------------------------------------------------------------------ la page et ses gestes */

async function ouvrir(cfg, theme, url, { coupeFirestore = false } = {}) {
  const ctx = await nouveauContexte();
  const p = await ctx.newPage();
  p.ctx = ctx; p.cfg = cfg; p.theme = theme; p.erreurs = []; p.coupees = 0; p.touchers = 0;
  p.on('pageerror', e => p.erreurs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') p.erreurs.push(m.text().slice(0, 160)); });
  if (coupeFirestore) {
    await p.setRequestInterception(true);
    p.on('request', r => {
      if (/firestore\.googleapis\.com|firebaseio\.com|firebasestorage|cloudfunctions\.net|generativelanguage|aiplatform/.test(r.url())) { p.coupees++; r.abort(); } else r.continue();
    });
  }
  await p.setViewport(vue(cfg));
  await charger(p, url);
  /* CRITIQUE-5 n° 20 : rien d'un état précédent (rangée masquée, ordre, épingle, étoile) ; vidé, puis la page relue */
  const vides = await p.evaluate(() => {
    const cle = 'laffinee_ui_state';
    let etat = {};
    try { etat = JSON.parse(localStorage.getItem(cle) || '{}') || {}; } catch { etat = {}; }
    const ote = Object.keys(etat).filter(k => k.startsWith('calendrier_'));
    ote.forEach(k => { delete etat[k]; });
    if (ote.length) localStorage.setItem(cle, JSON.stringify(etat));
    return ote.length;
  });
  if (vides) await charger(p, null);
  p.cdp = await p.target().createCDPSession();
  return p;
}
/** La signature de l'écran : l'ordre des rangées, chaque chose (nom, x, largeur), messages, menus et feuilles, la vue. */
const signature = p => p.evaluate(() => {
  const r = e => { const b = e.getBoundingClientRect(); return `${Math.round(b.left)},${Math.round(b.top)},${Math.round(b.width)}`; };
  const rangees = [...document.querySelectorAll('section[data-rangee]')].map(s => s.getAttribute('data-rangee')).join(',');
  const choses = [...document.querySelectorAll('[data-chose], [data-barre], [data-marque]')].map(e => `${e.getAttribute('data-titre') || e.getAttribute('aria-label') || ''}@${r(e)}`).join(';');
  const ouverts = [...document.querySelectorAll('[role="dialog"], [role="menu"], [role="status"], [role="alert"], [data-filtre], [data-tri-seg]')].map(e => (e.textContent || '').slice(0, 200)).join('|');
  const cal = document.querySelector('[data-calendrier]');
  return `${rangees}#${choses}#${ouverts}#${cal?.getAttribute('data-vue')}#${cal?.getAttribute('data-orientation')}#${innerWidth}x${innerHeight}`;
});
const ordreRangees = p => p.evaluate(() => [...document.querySelectorAll('section[data-rangee]')].map(s => s.getAttribute('data-rangee')).join(','));
const nbChoses = (p, r) => p.evaluate(x => document.querySelectorAll(`section[data-rangee="${x}"] [data-chose]`).length, r);
const choseLue = (p, titre) => p.evaluate(t => {
  const e = [...document.querySelectorAll('[data-chose], [data-barre]')].find(x => (x.getAttribute('data-titre') || x.getAttribute('aria-label') || '').startsWith(t));
  if (!e) return 'absente';
  const b = e.getBoundingClientRect();
  return `${Math.round(b.left)}/${Math.round(b.width)} · ${(e.getAttribute('aria-label') || '').slice(0, 120)} · ${(e.textContent || '').replace(/\s+/g, ' ').slice(0, 80)}`;
}, titre);
const chiffreCle = p => p.evaluate(() => {
  const e = [...document.querySelectorAll('[aria-label], button')].find(x => /à dépenser|coût à venir/.test(x.getAttribute('aria-label') || x.textContent || ''));
  return e ? (e.getAttribute('aria-label') || e.textContent || '').replace(/\s+/g, ' ').slice(0, 90) : 'chiffre clé introuvable';
});
async function charger(p, url) {
  if (url) await p.goto(url, { waitUntil: 'load', timeout: 60000 }); else await p.reload({ waitUntil: 'load', timeout: 60000 });
  await p.waitForSelector('[data-frise], [data-calendrier], nav', { timeout: 20000 }).catch(() => {});
  await p.evaluate(t => document.documentElement.setAttribute('data-theme', t), p.theme);
  await p.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
  await attendre(900);
}

/** Trouve un élément visible par texte, rôle, aria-label (ou title), data-titre ; le fait venir à l'écran ; rend son centre. */
async function trouver(p, spec, { defiler = true } = {}) {
  const r = await p.evaluate((sp, def) => {
    const RX = o => (o ? new RegExp(o.s, o.f) : null);
    const texte = RX(sp.texte), aria = RX(sp.aria), nom = (e) => (e.getAttribute('aria-label') || e.getAttribute('title') || '');
    const visible = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
    const norme = t => (t || '').replace(/\s+/g, ' ').trim();
    let racines = [document];
    if (sp.dans) {
      const d = sp.dans;
      const dAria = RX(d.aria), dTexte = RX(d.texte);
      const selRole = r => r.split('|').map(x => `[role="${x}"]${x === 'dialog' ? ', dialog' : ''}`).join(', ');
      racines = [...document.querySelectorAll(d.role ? selRole(d.role) : d.titre ? '[data-titre], [data-chose]' : '[aria-label], [title]')]
        .filter(visible)
        .filter(e => (!dAria || dAria.test(nom(e))) && (!dTexte || dTexte.test(norme(e.textContent))) && (!d.titre || e.getAttribute('data-titre') === d.titre || nom(e).startsWith(d.titre)));
      if (d.dernier) racines = racines.slice(-1);
      if (!racines.length) return { manque: `conteneur ${JSON.stringify(d)}` };
    }
    const ACT = 'button, a, [role="button"], [role="menuitem"], [role="tab"], [role="option"], [role="switch"], [role="checkbox"], summary, label, input, [tabindex]';
    let cands = [];
    for (const R of racines) {
      let liste;
      if (sp.titre) liste = [...R.querySelectorAll('[data-titre], [data-chose], [data-barre], [data-marque]')].filter(e => e.getAttribute('data-titre') === sp.titre || nom(e).startsWith(sp.titre));
      else if (sp.data) liste = [...R.querySelectorAll(`[${sp.data}]`)];
      else if (sp.role) liste = [...R.querySelectorAll(`[role="${sp.role}"]${sp.role === 'dialog' ? ', dialog' : sp.role === 'button' ? ', button' : ''}`)];
      else liste = [...R.querySelectorAll('*')];
      liste = liste.filter(visible);
      if (aria) liste = liste.filter(e => aria.test(nom(e)));
      if (texte) liste = liste.filter(e => texte.test(norme(e.textContent))).filter(e => ![...e.children].some(c => visible(c) && texte.test(norme(c.textContent))) || e.matches(ACT));
      cands.push(...liste);
    }
    if (sp.sous) cands = cands.flatMap(e => [...e.querySelectorAll(sp.sous)].filter(visible));
    cands = cands.map(e => (sp.texte && !sp.sous && !e.matches(ACT) ? (e.closest(ACT) || e) : e));
    cands = [...new Set(cands)];
    const e = cands[sp.index ?? 0];
    if (!e) return { manque: JSON.stringify({ ...sp, texte: sp.texte && sp.texte.s, aria: sp.aria && sp.aria.s }) };
    /* défiler seulement si la cible n'est pas déjà entière à l'écran (un défilement dans une feuille la fait bouger sous le doigt) */
    const a = e.getBoundingClientRect();
    /* vision 7 : une cible à l'écran mais couverte (barre d'onglets, + volant, en-tête collé) se ramène aussi au centre : le doigt la touche, pas ce qui la couvre */
    const dessus = a.width > 0 ? document.elementFromPoint(a.left + a.width / 2, a.top + a.height / 2) : null;
    const couverte = !!dessus && dessus !== e && !e.contains(dessus) && !dessus.contains(e);
    if (def && (a.top < 0 || a.left < 0 || a.bottom > innerHeight || a.right > innerWidth || couverte)) e.scrollIntoView({ block: 'center', inline: 'nearest' });
    const b = e.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2, g: b.left, d: b.right, h: b.top, w: b.width, t: norme(e.textContent).slice(0, 60) };
  }, { ...spec, texte: reSrc(spec.texte), aria: reSrc(spec.aria), dans: spec.dans ? { ...spec.dans, aria: reSrc(spec.dans.aria), texte: reSrc(spec.dans.texte) } : null }, defiler);
  if (r.manque) throw new Absent(`introuvable : ${r.manque}`);
  /* scrollIntoView est synchrone : la position rendue est déjà celle d'après le défilement */
  if (defiler) await attendre(250);
  return r;
}
const existe = async (p, spec) => { try { await trouver(p, spec, { defiler: false }); return true; } catch { return false; } };

const touche = (p, type, x, y) => p.cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }] });
async function appuyerXY(p, x, y, ms = 60) {
  p.touchers++;
  if (p.cfg.tactile) { await touche(p, 'touchStart', x, y); await attendre(ms); await touche(p, 'touchEnd'); }
  else { await p.mouse.move(x, y); await p.mouse.down(); await attendre(ms); await p.mouse.up(); }
  await attendre(450);
}
/** La cible relue jusqu'à ce qu'elle ne bouge plus (une feuille qui monte, un menu qui s'ouvre) : 1,5 s au plus. */
async function trouverStable(p, spec) {
  let r = await trouver(p, spec);
  for (let i = 0; i < 6; i++) {
    await attendre(200);
    const s = await trouver(p, spec, { defiler: false });
    if (Math.abs(s.x - r.x) < 1 && Math.abs(s.y - r.y) < 1) return s;
    r = s;
  }
  return r;
}
const toucher = async (p, spec) => { const r = await trouverStable(p, spec); await appuyerXY(p, r.x, r.y); return r; };
const appuiLong = async (p, spec, ms = 750) => { const r = await trouverStable(p, spec); await appuyerXY(p, r.x, r.y, ms); return r; };
/** Glisser : le doigt se pose 180 ms (sous l'appui long), glisse en 300 ms ; `tenu` laisse le doigt posé (état « pendant »). */
async function glisserXY(p, x, y, dx, dy = 0, { tenu = false } = {}) {
  p.touchers++;
  if (p.cfg.tactile) {
    await touche(p, 'touchStart', x, y); await attendre(180);
    for (let i = 1; i <= 12; i++) { await touche(p, 'touchMove', x + (dx * i) / 12, y + (dy * i) / 12); await attendre(25); }
  } else {
    await p.mouse.move(x, y); await p.mouse.down(); await attendre(180);
    for (let i = 1; i <= 12; i++) { await p.mouse.move(x + (dx * i) / 12, y + (dy * i) / 12); await attendre(25); }
  }
  p.doigt = { x: x + dx, y: y + dy };
  if (!tenu) await lacher(p); else await attendre(200);
}
async function lacher(p) {
  await attendre(80);
  if (p.cfg.tactile) await touche(p, 'touchEnd'); else await p.mouse.up();
  p.doigt = null; await attendre(500);
}
const largeurColonne = p => p.evaluate(() => {
  const f = document.querySelector('[data-frise]');
  const v = f ? parseFloat(f.getAttribute('data-largeur-colonne')) : NaN;
  return Number.isFinite(v) && v > 0 ? v : Math.max(40, innerWidth / 7);
});
/** Glisse une chose (par data-titre ou nom) de `n` colonnes ; avec `sous`, tire une partie (bord, jalon). */
async function glisserChose(p, titre, n, { sous = null, tenu = false } = {}) {
  const r = await trouver(p, sous ? { titre, sous } : { titre });
  const lc = await largeurColonne(p);
  /* la barre se prend là où le doigt ne tombe sur aucun jalon ni bord (un jalon tiré seul est un autre geste : E25) */
  const x = sous ? r.x : await p.evaluate((g, d, y) => {
    for (let x = g + 12; x <= d - 8; x += 3) {
      const e = document.elementFromPoint(x, y);
      if (e && e.closest('[data-barre]') && !e.closest('[data-jalon], [data-bord], [data-grip]')) return x;
    }
    return Math.min(d - 6, g + 20);
  }, r.g, r.d, r.y);
  await glisserXY(p, x, r.y, n * lc, 0, { tenu });
}
async function menuPeriode(p, choix) {
  await toucher(p, { data: 'data-ent-periode' });
  if (choix) await toucher(p, { dans: { role: 'dialog', aria: /Période/ }, texte: choix });
}
const ajouterDans = (p, rangee) => toucher(p, { aria: new RegExp(`^Ajouter dans ${rangee}`) });
/* la feuille ou la pile ouverte la plus haute (le + volant est un menu, la feuille d'ajout un dialogue) */
const dansFeuille = texte => ({ dans: { role: 'dialog|menu', dernier: true }, texte });
/* un bouton de la feuille (« Ajouter » est aussi le sous-titre de la feuille : le rôle tranche) */
const boutonFeuille = texte => ({ ...dansFeuille(texte), role: 'button' });
/* CRITIQUE-7 (faux ÉCHEC m390-25, 29, cave-70) : le + volant est le BOUTON flottant `button[aria-label^="Actions rapides"]` ; jamais le premier
   « Ajouter… » d'une rangée, ni la pile ouverte (role="menu", même nom) */
const FAB = { role: 'button', aria: /^Actions rapides/ };
/* « Poser un brassin S47 · prête le 16 déc. » le 18 nov. (CRITIQUE-7 n° 4) : brassé au plus tôt aujourd'hui, 28 j en cuve */
const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const PRETE_DANS_28 = (() => { const j = new Date(); const d = new Date(j.getFullYear(), j.getMonth(), j.getDate() + 28); return `${d.getDate()} ${MOIS_COURTS[d.getMonth()]}`; })();
async function taper(p, texte) { await p.keyboard.type(texte, { delay: 10 }); await attendre(200); }
async function tourner(p) {
  const { w, h } = p.cfg;
  p.cfg = { ...p.cfg, w: h, h: w };
  await p.setViewport(vue(p.cfg)); await attendre(900);
}
/** Le texte visible et les noms accessibles des éléments visibles. */
const lireTexte = p => p.evaluate(() => {
  const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  return `${document.body.innerText}\n${[...document.querySelectorAll('[aria-label]')].filter(vis).map(e => e.getAttribute('aria-label')).join('\n')}`;
});

/* ------------------------------------------------------------------ les états (§ Vérification, CRITIQUE-2 n° 21 à 42) */

const RANGEES = ['Brassins', 'Fêtes', 'Ventes', 'Achats', 'Travaux', 'Activités', 'Papiers'];
const LIGNES_PLUS = [
  ['23a', 'brassins', /^Poser un brassin/, 'Brassins'], ['23b', 'fetes', /^Poser une fête/, 'Fêtes'], ['23c', 'ventes', /^Poser une vente/, 'Ventes'],
  ['23d', 'achats', /^Prévoir un achat/, 'Achats'], ['23e', 'travaux', /^Prévoir des travaux/, 'Travaux'], ['23f', 'activites', /^Noter une activité/, 'Activités'],
  ['23g', 'papiers', /^Prévoir un papier/, 'Papiers']
];
const sansRotation = cfg => (cfg.tactile ? null : 'la rotation ne concerne que le téléphone (E10) ; au 1280, la vue large est centrée');
/* une enveloppe par appel : `Object.assign(f, …)` écrivait le libellé sur la fonction partagée (barreTravauxVue, memePeriode…), et le dernier
   libellé posé se lisait sous tous les états qui la partagent */
const fn = (f, dit) => Object.assign((...a) => f(...a), { dit });

const ETATS = [
  { n: '01', nom: 'repos', geste: 'ouverture du banc', cave: true, repos: true, jouer: async () => {}, attendu: [/banc — données simulées/, ...RANGEES.map(r => new RegExp(r)), /Marché de Noël/, /Frigo/] },
  { n: '02', nom: 'plusminus', geste: 'toucher ±', cave: true, jouer: async p => { await toucher(p, { texte: /^±$/ }); },
    attendu: [fn(async p => p.evaluate(() => { const b = document.querySelector('[aria-label^="Semaines"]') || document.querySelector('[data-bande-semaines]'); return !!b && /[−+]\s?\d/.test(b.textContent || ''); }), 'la bande montre des + et −')] },
  { n: '03', nom: 'creux', geste: 'toucher le chiffre clé', mesure: lireTexte, jouer: async p => { await toucher(p, { aria: /à dépenser/ }); }, attendu: [/Le creux de S\d+/, /Solde et réglages/] },
  { n: '04', nom: 'retards', geste: 'toucher le badge des retards', jouer: async p => { await toucher(p, { aria: /retard/i }); },
    attendu: [/Saison de ferme/, /Hopfen/, /\d{1,2} (janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)/], interdit: [/en retard de \d+ ?j/, /depuis \d+ ?j/, /\bde \d+ j\b/] },
  { n: '05', nom: 'menu-periode', geste: 'toucher la période', cave: true, jouer: async p => { await menuPeriode(p, null); },
    /* la plage du menu porte l'année quand elle change (« 16 nov. 2026 → 14 févr. 2027 », paysage) */
    attendu: [/6 sem\./, /3 mois/, /6 mois/, /\bAn\b/, /Liste/, /Trier les rangées/, /Filtrer par type/, /Sans date · \d/, /\d{1,2} \p{L}+\.?( \d{4})? → \d{1,2} \p{L}+/u] },
  { n: '06', nom: 'semaine-date', geste: 'toucher une semaine de la bande', mesure: lireTexte, jouer: async p => { await toucher(p, { dans: { aria: /^Semaines/ }, texte: /^S\d+$/, index: 2 }); },
    attendu: [/S\d+, \d{1,2} ?[–-] ?\d{1,2} \p{L}+/u] },

  { n: '07', nom: 'f1a-pendant', geste: 'glisser la Hotte de 2 colonnes, doigt tenu', jouer: async p => { await glisserChose(p, 'Hotte', 2, { tenu: true }); }, attendu: [/lâcher ici/], fin: lacher },
  { n: '08', nom: 'f1a-apres', geste: 'glisser la Hotte de 2 colonnes, lâcher', jouer: async p => { await glisserChose(p, 'Hotte', 2); }, attendu: [/S\d+ : [−\d\s’']+ → [−\d\s’']+/, /Annuler/] },
  /* CRITIQUE-10 (preuve f2-a) : le BORD (`[data-bord]`), jamais le corps ni l'aria de la barre ; la barre s'allonge de 7 j, elle ne se déplace pas */
  { n: '09', nom: 'f2a-apres', geste: 'tirer le bord ([data-bord]) de la Blonde d’une colonne', mesure: p => choseLue(p, 'Blonde d’automne'),
    jouer: async p => {
      p.blondeAvant = await choseLue(p, 'Blonde d’automne');
      p.boiteAvant = await boiteChose(p, 'Blonde d’automne');
      await glisserChose(p, 'Blonde d’automne', 1, { sous: '[data-bord]' });
      p.blondeApres = await choseLue(p, 'Blonde d’automne');
      p.boiteApres = await boiteChose(p, 'Blonde d’automne');
      p.noteEtat = `avant « ${p.blondeAvant.slice(0, 90)} » ; après « ${p.blondeApres.slice(0, 90)} »`;
    },
    attendu: [/J\d+ \/ \d+/, /prête/, /promis|Annuler/, fn(async p => {
      const duree = t => Number((/J\d+ \/ (\d+)/.exec(t || '') || [])[1]);
      const a = duree(p.blondeAvant), b = duree(p.blondeApres);
      const lc = await largeurColonne(p);
      const A = p.boiteAvant, B = p.boiteApres;
      const memeDebut = !!A && !!B && Math.abs(A.g - B.g) < 3;
      const plusLongue = !!A && !!B && B.w - A.w > lc * 0.6;
      return { ok: memeDebut && ((Number.isFinite(a) && b === a + 7) || plusLongue), dit: `J0 / ${a} → J0 / ${b} ; début ${A ? Math.round(A.g) : '?'} → ${B ? Math.round(B.g) : '?'} px ; largeur ${A ? Math.round(A.w) : '?'} → ${B ? Math.round(B.w) : '?'} px (colonne ${Math.round(lc)})` };
    }, 'la Blonde s’allonge de 7 j par son bord, son début ne bouge pas')], interdit: [/J0\s*\/\s*0(?!\d)/] },
  { n: '10', nom: 'f4b-brassin', geste: 'toucher la Blonde', jouer: async p => { await toucher(p, { titre: 'Blonde d’automne' }); },
    attendu: [/Ouvrir le brassin/, /Commander/, /Budget ›/, /Dry hop/i, /Garde/] },
  { n: '11', nom: 'f5a-menu', geste: 'appui long sur la Hotte', cave: true, jouer: async p => { await appuiLong(p, { titre: 'Hotte' }); },
    attendu: [/Épingler/, /Étoile/, /Achats seul/, /Dupliquer/, /Lier/, /Retirer/, fn(async p => p.evaluate(() => {
      const m = document.querySelector('[role="menu"]'); if (!m) return false;
      const r = [...m.querySelectorAll('button, [role="menuitem"]')].find(b => /^Retirer/.test((b.textContent || '').trim())); if (!r) return false;
      const q = r.getBoundingClientRect(); const e = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2);
      return q.top >= 0 && q.bottom <= innerHeight && !!e && (r === e || r.contains(e));
    }), 'Retirer dans l’écran et touchable')] },
  /* CRITIQUE-9 n° 1 (E31, E46, D-48, D-114, D-192) : avant Retirer (13a), après Retirer (12), après Annuler (13), la page rechargée avant chaque
     état ; le Marché de Noël revient dans Fêtes, en S52, sans rechargement entre Retirer et Annuler */
  { n: '13a', nom: 'f5a-avant-retirer', geste: 'aller au Marché de Noël (aucun geste)', cave: true, repos: true, mesure: p => fetesLues(p), jouer: async p => { await trouver(p, { titre: 'Marché de Noël' }); await attendre(300); },
    attendu: [fn(noelEnS52, 'le Marché de Noël est dans Fêtes, en S52')] },
  { n: '12', nom: 'f5a-retirer', geste: 'appui long sur le Marché de Noël, puis Retirer', cave: true, mesure: p => fetesLues(p), jouer: async p => { await appuiLong(p, { titre: 'Marché de Noël' }); await toucher(p, { dans: { role: 'menu' }, texte: /^Retirer/ }); },
    attendu: [/Retirée? de S\d+/, /Sans date ›/, /Annuler/, fn(async p => { const t = await fetesLues(p); return { ok: !/Marché de Noël/.test(t), dit: `Fêtes : « ${t.slice(0, 60)} »` }; }, 'le Marché de Noël a quitté la rangée Fêtes')] },
  { n: '13', nom: 'f5a-annuler', geste: 'Retirer le Marché de Noël, puis Annuler (sans rechargement)', cave: true, /* l'effet voulu est le retour au repos : le changement est prouvé par 12 et par « il avait bien quitté Fêtes » */ repos: true, mesure: p => fetesLues(p),
    jouer: async p => {
      await appuiLong(p, { titre: 'Marché de Noël' }); await toucher(p, { dans: { role: 'menu' }, texte: /^Retirer/ });
      p.fetesRetiree = await fetesLues(p);
      await toucher(p, { dans: { role: 'status|alert' }, role: 'button', texte: /Annuler$/ });
      await attendre(400);
      p.noteEtat = `Fêtes après Retirer « ${p.fetesRetiree.slice(0, 50)} » ; après Annuler « ${(await fetesLues(p)).slice(0, 60)} »`;
    },
    attendu: [fn(noelEnS52, 'le Marché de Noël revient dans Fêtes, en S52'), fn(async p => ({ ok: !/Marché de Noël/.test(p.fetesRetiree || 'Marché de Noël'), dit: `entre les deux : « ${(p.fetesRetiree || '').slice(0, 40)} »` }), 'il avait bien quitté Fêtes'),
      fn(async p => p.evaluate(() => !document.querySelector('[data-message]')), 'le message est parti')] },
  { n: '14', nom: 'f6b-alerte', geste: 'glisser la Blonde de 2 colonnes (promesse La Cigogne)', jouer: async p => { await glisserChose(p, 'Blonde d’automne', 2); }, attendu: [/promis/, /Livrer le/] },
  /* CRITIQUE-10 (preuve f6-b) : Livrer TOUCHÉ ; la vente La Cigogne porte ensuite la date que le bouton promettait (le 29 déc. le 18 nov.) */
  { n: '15', nom: 'f6b-livrer', geste: 'glisser la Blonde, puis Livrer le …', mesure: p => choseLue(p, '3 fûts La Cigogne'),
    jouer: async p => {
      p.venteAvant = await choseLue(p, '3 fûts La Cigogne');
      await glisserChose(p, 'Blonde d’automne', 2);
      const r = await toucher(p, { texte: /^Livrer le/ });
      p.livrer = r.t;
      await attendre(400);
      await p.screenshot({ path: join(DOSSIER, `${p.cfgNom}-${p.theme}-15a-livrer-touche.png`) });
      /* livrée après S52, la vente sort de la fenêtre de 6 sem. : la période passe à 3 mois pour la lire */
      if (!(await existe(p, { titre: '3 fûts La Cigogne' }))) { await menuPeriode(p, /^3 mois/); await p.keyboard.press('Escape').catch(() => {}); await attendre(400); }
      await trouver(p, { titre: '3 fûts La Cigogne' }).catch(() => {});
      p.venteApres = await choseLue(p, '3 fûts La Cigogne');
      p.noteEtat = `bouton « ${p.livrer} » ; vente avant « ${p.venteAvant.slice(0, 80)} » ; après « ${p.venteApres.slice(0, 80)} »`;
    },
    attendu: [/La Cigogne/, fn(async p => {
      const voulu = jourDe(p.livrer);
      const dates = [...(p.venteApres || '').matchAll(/\d{1,2} (?:janv\.|févr\.|mars|avr\.|mai|juin|juil\.|août|sept\.|oct\.|nov\.|déc\.)/gu)].map(m => jourDe(m[0]));
      return { ok: voulu !== null && dates.includes(voulu), dit: `Livrer « ${p.livrer || '?'} » ; vente après « ${(p.venteApres || '').slice(0, 90)} »` };
    }, 'la vente La Cigogne porte la date de Livrer')] },

  { n: '16', nom: 'c1d-pendant', geste: 'tirer la poignée de fin jusqu’au bout, doigt tenu', jouer: async p => { await tirerPoignee(p, 1.0, true); }, attendu: [/S\d+ ?[–-] ?S\d+|l’année|An/] , fin: lacher },
  { n: '17', nom: 'an', geste: 'tirer la poignée de fin jusqu’au bout, lâcher', cave: true, jouer: async p => { await tirerPoignee(p, 1.0, false); }, attendu: [/janv/, /juin/, /oct/] },
  { n: '18', nom: 'marque-3mois', geste: 'période 3 mois', sansObjet: cfg => (cfg.tactile && cfg.w > cfg.h ? 'en paysage la vue est déjà de 13 semaines (3 mois, E10) : le menu 3 mois se prouve par l’état 05' : null), jouer: async p => { await menuPeriode(p, /^3 mois/); },
    attendu: [fn(async p => p.evaluate(() => document.querySelectorAll('[data-marque]').length > 0), 'au moins une marque (chose de moins de 24 px)')] },
  { n: '19', nom: 'marque-appui-long', geste: '3 mois, puis appui long sur une marque', jouer: async p => { await menuPeriode(p, /^3 mois/); await appuiLong(p, { data: 'data-marque' }); },
    attendu: [fn(async p => p.evaluate(() => Number(document.querySelector('[data-frise]')?.getAttribute('data-nb-colonnes')) <= 7), 'la vue 6 semaines revient')] },
  /* CRITIQUE-9 n° 9 (E11, D-195) : un vrai glissé (doigt posé, déplacé, tenu), parti HORS du cadre de la fenêtre et de ses poignées (vision 10 :
     le doigt avait pris le cadre, « S48 – S21 2027 ») ; la tête « CHF · S · date » pendant, le détail de la semaine après le lâcher (20b) */
  { n: '20', nom: 'c2b-lecture', geste: 'glisser le doigt le long de la courbe, hors du cadre, doigt tenu', mesure: lireTexte,
    jouer: async p => {
      await trouver(p, { aria: /^Libre et caisse/ });
      const d = await departCourbe(p);
      p.noteEtat = d.dit;
      if (!d.ok) throw new Absent(d.dit);
      p.cadreAvant = await cadreLu(p);
      p.pmAvant = await plusMinusLu(p);
      await glisserXY(p, d.x, d.y, d.dx, 0, { tenu: true });
    },
    attendu: [fn(plusMinusInchange, '± inchangé (le glissé n’a pas touché ±)'), /\d\s*CHF\s*·\s*S\d+\s*·\s*\d{1,2}\s\p{L}+/u, fn(async p => { const c = await cadreLu(p); return { ok: c === p.cadreAvant, dit: `cadre « ${p.cadreAvant} » → « ${c} »` }; }, 'le cadre de la fenêtre n’a pas bougé')], fin: lacher },
  { n: '20b', nom: 'c2b-detail', geste: 'glisser le doigt le long de la courbe, hors du cadre, puis lâcher : le détail de la semaine lue', mesure: lireTexte,
    jouer: async p => {
      await trouver(p, { aria: /^Libre et caisse/ });
      const d = await departCourbe(p);
      p.noteEtat = d.dit;
      if (!d.ok) throw new Absent(d.dit);
      p.cadreAvant = await cadreLu(p);
      p.pmAvant = await plusMinusLu(p);
      await glisserXY(p, d.x, d.y, d.dx, 0, { tenu: true });
      p.tete = await p.evaluate(() => document.body.innerText.match(/[−-]?[\d ’']+\s*CHF\s*·\s*S\d+\s*·\s*\d{1,2}\s\S+/u)?.[0] ?? '');
      await lacher(p);
      p.noteEtat += ` ; tête pendant « ${p.tete} »`;
    },
    attendu: [fn(plusMinusInchange, '± inchangé (le glissé n’a pas touché ±)'), /S\d+, \d{1,2}\s?[–-]\s?\d{1,2} \p{L}+/u, fn(async p => { const c = await cadreLu(p); return { ok: c === p.cadreAvant && !!p.tete, dit: `tête « ${p.tete} » ; cadre « ${p.cadreAvant} » → « ${c} »` }; }, 'la tête lue pendant, le cadre immobile')] },
  { n: '21', nom: 'c3a-graph', geste: 'appui long sur la courbe', jouer: async p => { await appuiLong(p, { aria: /^Libre et caisse/ }, 800); }, attendu: [/La courbe en grand|Revenir à la frise/] },

  { n: '22', nom: 'plus-volant', geste: 'toucher le bouton flottant (button[aria-label^="Actions rapides"])', cave: true, jouer: async p => { const r = await toucher(p, FAB); p.noteEtat = `bouton flottant touché en (${Math.round(r.x)}, ${Math.round(r.y)})`; },
    attendu: [/Sur\s+le calendrier/, /Partout/, /Poser un brassin/, /Noter une idée/,
      fn(async p => p.evaluate(() => { const m = document.querySelector('[role="menu"][aria-label="Actions rapides"]'); const f = document.querySelector('[data-feuille-rangee]'); return { ok: !!m && m.getBoundingClientRect().height > 0 && !f, dit: `pile ${m ? 'ouverte' : 'absente'}, feuille d’ajout ${f ? `ouverte (${f.getAttribute('data-feuille-rangee')})` : 'fermée'}` }; }), 'la pile du + volant est ouverte, aucune feuille de rangée'),
      fn(async p => p.evaluate(prete => { const e = document.querySelector('[data-page-action="brassin"] [data-plus-precision]'); const t = (e?.textContent || '').replace(/\s+/g, ' ').trim(); return { ok: new RegExp(`^S\\d+ · prête le ${prete}$`).test(t), dit: `« Poser un brassin ${t} »` }; }, PRETE_DANS_28), `« Poser un brassin S… · prête le ${PRETE_DANS_28} » (aujourd’hui + 28 j)`),
      fn(async p => p.evaluate(() => {
      const d = [...document.querySelectorAll('[role="dialog"], dialog, [role="menu"]')].filter(x => x.getBoundingClientRect().height > 0).pop();
      if (!d) return { ok: false, dit: 'aucune pile ouverte' };
      const dehors = [...d.querySelectorAll('button, [role="menuitem"]')].filter(b => b.getBoundingClientRect().height > 0)
        .filter(b => { const r = b.getBoundingClientRect(); return r.top < -0.5 || r.bottom > innerHeight + 0.5 || r.left < -0.5 || r.right > innerWidth + 0.5; })
        .map(b => (b.textContent || b.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 24));
      return { ok: dehors.length === 0, dit: dehors.length ? `lignes hors de l’écran : ${dehors.join(' | ')}` : 'toutes les lignes dans l’écran' };
    }), 'toutes les lignes dans l’écran')] },
  ...LIGNES_PLUS.map(([n, id, ligne, titre]) => ({ n, nom: `feuille-${id}`, geste: `+ volant, puis « ${ligne.source.replace(/^\^/, '')} »`, cave: true,
    jouer: async p => { await toucher(p, FAB); await toucher(p, dansFeuille(ligne)); },
    attendu: [new RegExp(titre), /Ajouter/, fn(async p => p.evaluate(i => document.querySelector('[data-feuille-rangee]')?.getAttribute('data-feuille-rangee') === i, id), `feuille réglée sur ${titre}`)] })),
  { n: '64', nom: 'pose-vente', geste: '+ de Ventes, puce du client La Cigogne (pas une vente probable), Ajouter', mesure: p => p.evaluate(() => { const s = document.querySelector('section[data-rangee="ventes"]'); return `${s ? s.querySelectorAll('[data-chose]').length : 0} choses · ${(s?.textContent || '').replace(/\s+/g, ' ').slice(0, 300)}`; }), chiffre: true,
    jouer: async p => { await ajouterDans(p, 'Ventes'); await toucher(p, dansFeuille(/^La Cigogne/)); await toucher(p, boutonFeuille(/^Ajouter/)); },
    attendu: [/Annuler/], interdit: [/Choisis un nom/] },
  { n: '24', nom: 'pose-brassin', geste: '+ de Brassins, recette Porter d’hiver, Ajouter', mesure: p => nbChoses(p, 'brassins'), chiffre: true, jouer: async p => { await ajouterDans(p, 'Brassins'); await toucher(p, dansFeuille(/^Porter d’hiver$/)); await toucher(p, boutonFeuille(/^Ajouter/)); },
    attendu: [/prête le/, /Annuler/] },
  { n: '25', nom: 'pose-vente-probable', geste: 'toucher la vente probable Café du Pont', jouer: async p => { await toucher(p, { titre: 'Café du Pont' }); },
    attendu: [/Café du Pont/, fn(async p => p.evaluate(() => ![...document.querySelectorAll('[data-probable]')].some(e => /^Café du Pont/.test(e.getAttribute('aria-label') || e.getAttribute('data-titre') || ''))), 'la vente n’est plus en pointillé')] },
  { n: '26', nom: 'pose-activite', geste: '+ d’Activités, nom récent, 3 j, Ajouter', mesure: p => nbChoses(p, 'activites'), chiffre: true, jouer: async p => { await ajouterDans(p, 'Activités'); await toucher(p, dansFeuille(/^Inventaire du stock$|^Ranger la réserve$/)); await toucher(p, dansFeuille(/^3 j$/)); await toucher(p, boutonFeuille(/^Ajouter/)); },
    attendu: [/Annuler/] },
  { n: '27', nom: 'deux-ventes', geste: 'aller aux Ventes', jouer: async p => { await trouver(p, { titre: 'Café du Pont' }); },
    attendu: [/Café du Pont/, /Épicerie du Bourg/, fn(async p => p.evaluate(() => {
      const r = t => [...document.querySelectorAll('[data-chose]')].find(e => (e.getAttribute('data-titre') || e.getAttribute('aria-label') || '').startsWith(t))?.getBoundingClientRect();
      const a = r('Café du Pont'), b = r('Épicerie du Bourg'); if (!a || !b) return false;
      return !(a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top);
    }), 'les deux ventes de la même semaine ne se chevauchent pas')] },

  { n: '28', nom: 'rotation-geste', geste: 'glisser la Hotte, doigt tenu, puis tourner le téléphone', sansObjet: sansRotation,
    mesure: p => p.evaluate(() => `${document.querySelector('[data-calendrier]')?.getAttribute('data-orientation')} · ${[...document.querySelectorAll('section[data-rangee]')].length} rangées · ${/lâcher ici/.test(document.body.innerText) ? 'lâcher ici' : ''}`),
    jouer: async p => { await glisserChose(p, 'Hotte', 1, { tenu: true }); await tourner(p); }, attendu: [/lâcher ici|Annuler/], fin: lacher },
  { n: '29', nom: 'rotation-apres-ajout', geste: 'ajouter le Marché de Noël par le + de Fêtes, puis tourner', sansObjet: sansRotation,
    jouer: async p => { await ajouterDans(p, 'Fêtes'); await toucher(p, dansFeuille(/^Marché de Noël$/)); await toucher(p, boutonFeuille(/^Ajouter/)); await tourner(p); },
    attendu: [fn(async p => p.evaluate(() => [...document.querySelectorAll('[data-chose]')].filter(e => /^Marché de Noël/.test(e.getAttribute('data-titre') || e.getAttribute('aria-label') || '')).length >= 2), 'la fête ajoutée est toujours là')] },
  { n: '30', nom: 'plein-ecran', geste: 'toucher ⛶', jouer: async p => { await toucher(p, { aria: /^Plein écran/ }); },
    attendu: [fn(async p => p.evaluate(() => !!document.fullscreenElement || /Tourne le téléphone/.test(document.body.innerText)), 'plein écran, ou l’invitation « Tourne le téléphone »')] },
  { n: '31', nom: 'liste', geste: 'période, puis Liste', cave: true, jouer: async p => { await menuPeriode(p, /^Liste/); }, attendu: [/Sans date/, /Hotte/, /Marché de Noël/] },
  { n: '32', nom: 'masquee-epinglee', geste: 'épingler la Hotte, puis masquer Achats', jouer: async p => { await appuiLong(p, { titre: 'Hotte' }); await toucher(p, { dans: { role: 'menu' }, texte: /^Épingler/ }); await toucher(p, { aria: /^Masquer Achats/ }); },
    attendu: [/cachée/, fn(async p => existe(p, { titre: 'Hotte' }), 'la Hotte épinglée reste visible')] },

  { n: '34', nom: 'brassin-planifie-glisse', geste: 'glisser le Porter d’hiver d’une colonne', jouer: async p => { await glisserChose(p, 'Porter d’hiver', 1); }, attendu: [/Annuler/, /S\d+/] },
  /* CRITIQUE-9 (harnais, D-81, D-103) : chaque jalon visé par son `data-jalon` ; ni menu f5-a, ni la Saison déplacée ; la fin glissée se
     vérifie par « prête le » changé et Annuler, le refus par son message, qui ne couvre aucun nom (n° 7) */
  { n: '35', nom: 'jalon-fin', geste: 'tirer le jalon de fin (conditionnement) du Porter d’une colonne', mesure: p => choseLue(p, 'Porter d’hiver'),
    jouer: async p => {
      p.saisonAvant = await choseLue(p, 'Saison de ferme');
      p.porterAvant = await choseLue(p, 'Porter d’hiver');
      if (!(await existe(p, { titre: 'Porter d’hiver', sous: '[data-jalon="conditionnement"]' }))) throw new Absent('jalon [data-jalon="conditionnement"] du Porter introuvable');
      await glisserChose(p, 'Porter d’hiver', 1, { sous: '[data-jalon="conditionnement"]' });
      p.message = await p.evaluate(() => (document.querySelector('[data-message]')?.textContent || '').replace(/\s+/g, ' ').trim());
      p.noteEtat = `Porter avant « ${p.porterAvant.slice(0, 80)} » ; message « ${p.message.slice(0, 90)} »`;
    },
    attendu: [/Annuler/, fn(async p => ({ ok: !!jourDe(p.message) && /prête (le )?\d/.test(p.message) && jourDe(p.message) !== jourDe(/prête (?:le )?([^·]+)/.exec(p.porterAvant || '')?.[1]), dit: `avant « ${(/prête[^·]*/.exec(p.porterAvant || '') || ['?'])[0]} » ; message « ${p.message.slice(0, 70)} »` }), '« prête le » a changé (message de la fin glissée)'),
      fn(async p => p.evaluate(() => !document.querySelector('[role="menu"]')), 'aucun menu f5-a ouvert'),
      fn(async p => { const s = await choseLue(p, 'Saison de ferme'); return { ok: s.split(' · ')[0] === p.saisonAvant.split(' · ')[0], dit: `Saison « ${s.slice(0, 50)} »` }; }, 'la Saison n’a pas bougé')] },
  { n: '36', nom: 'jalon-refuse', geste: 'tirer le jalon dry hop de la Blonde (intermédiaire)', jouer: async p => {
      const avant = await choseLue(p, 'Blonde d’automne');
      p.saisonAvant = await choseLue(p, 'Saison de ferme');
      if (!(await existe(p, { titre: 'Blonde d’automne', sous: '[data-jalon="dry-hop"]' }))) throw new Absent('jalon [data-jalon="dry-hop"] de la Blonde introuvable');
      await glisserChose(p, 'Blonde d’automne', 1, { sous: '[data-jalon="dry-hop"]' });
      const apres = await choseLue(p, 'Blonde d’automne');
      p.noteEtat = `la Blonde ${avant.split(' · ')[0] === apres.split(' · ')[0] ? 'n’a pas bougé (refus)' : 'A BOUGÉ'}`;
      if (avant.split(' · ')[0] !== apres.split(' · ')[0]) throw new Absent('le jalon intermédiaire a déplacé la Blonde');
    }, attendu: [/suit la recette du brassin/, /Ouvrir le brassin/, fn(async p => p.evaluate(() => !document.querySelector('[role="menu"]')), 'aucun menu f5-a ouvert'),
      fn(async p => { const s = await choseLue(p, 'Saison de ferme'); return { ok: s.split(' · ')[0] === p.saisonAvant.split(' · ')[0], dit: `Saison « ${s.slice(0, 50)} »` }; }, 'la Saison n’a pas bougé'),
      fn(messageSansNom, 'le refus ne couvre aucun nom (CRITIQUE-9 n° 7)')] },
  { n: '37', nom: 'mise-de-cote', geste: 'aucun (la courbe au repos)', repos: true, jouer: async () => {}, attendu: [/mis de côté/] },
  { n: '38', nom: 'travaux-fenetre', geste: '+ de Travaux, nom récent, S20 puis S40, 5 j', jouer: async p => { await fenetreTravaux(p); }, attendu: [/S20 → S40 · 21 sem\./] },
  { n: '39', nom: 'travaux-posee', geste: 'fenêtre S20 → S40, 5 j, Ajouter, puis l’An ; la barre posée (S20), pas celle de S8', mesure: barreTravauxPosee,
    jouer: async p => { await fenetreTravaux(p); await toucher(p, boutonFeuille(/^Ajouter/)); await attendre(500); await p.keyboard.press('Escape').catch(() => {}); await menuPeriode(p, /^An\b/); await p.keyboard.press('Escape').catch(() => {}); await attendre(300); },
    attendu: [fn(barreTravauxVue, 'la barre posée S20 → S40 est dans la frise de l’An, avec ses 5 points'), fn(pointsTouchables, 'chaque point touchable : elementFromPoint en son centre = le point')] },
  { n: '40', nom: 'sans-date-poche', geste: 'période, puis « Sans date · n »', jouer: async p => { await menuPeriode(p, /^Sans date · \d/); }, attendu: [/Appeler l’assurance/] },
  { n: '41', nom: 'poser', geste: 'poche, Appeler l’assurance, Poser', jouer: async p => { await menuPeriode(p, /^Sans date · \d/); await toucher(p, { texte: /Appeler l’assurance/ }); await toucher(p, { texte: /^Poser$/ }); }, attendu: [/Ajouter|Activités/] },
  /* CRITIQUE-6 n° 10 (E39, D-36, D-37) : la capture et chaque mesure sont prises APRÈS le rechargement (42a : juste avant, pour la comparaison) */
  { n: '42', nom: 'reouverture', geste: 'épingler la Hotte, étoile au Marché de Noël, masquer Achats, trier les rangées ; recharger la page',
    jouer: async p => {
      await appuiLong(p, { titre: 'Hotte' }); await toucher(p, { dans: { role: 'menu' }, texte: /^Épingler/ });
      await attendre(400); await p.keyboard.press('Escape').catch(() => {});
      await appuiLong(p, { titre: 'Marché de Noël' }); await toucher(p, { dans: { role: 'menu' }, texte: /^Étoile/ });
      await attendre(400);
      /* le message de l'étoile part au premier défilement : le premier toucher peut tomber pendant son départ ; on relit `calendrier_masquees` */
      const masquee = () => p.evaluate(() => { try { return (JSON.parse(localStorage.getItem('laffinee_ui_state') || '{}').calendrier_masquees || []).includes('achats'); } catch { return false; } });
      /* CRITIQUE-7 (m390-42 : « masquees null ») : un menu ou un message encore ouverts mangeaient le toucher ; on les ferme, puis on touche
         l'œil d'Achats jusqu'à ce que `calendrier_masquees` contienne « achats ». Sans masque, l'état est ABSENT : jamais un rechargement à vide */
      await p.keyboard.press('Escape').catch(() => {}); await attendre(300);
      for (let k = 0; k < 3 && !(await masquee()); k++) { await toucher(p, { role: 'button', aria: /^Masquer Achats/ }); await attendre(600); }
      if (!(await masquee())) throw new Absent('Achats non masquée avant le rechargement (calendrier_masquees sans « achats » après 3 touchers de l’œil)');
      /* k15 : « Trier les rangées » passe au critère suivant (genre → Urgent → Date → Montant) ; l'ordre obtenu est gardé (`calendrier_ordre`) */
      await menuPeriode(p, /^Trier les rangées/); await attendre(300);
      await p.keyboard.press('Escape').catch(() => {}); await attendre(300);
      p.ordreTrie = await ordreRangees(p);
      p.gardeAvant = await p.evaluate(() => { try { const e = JSON.parse(localStorage.getItem('laffinee_ui_state') || '{}'); return ['calendrier_epingles', 'calendrier_etoiles', 'calendrier_masquees'].map(k => `${k.slice(11)} ${JSON.stringify(e[k] ?? null)}`).join(' ; '); } catch { return 'illisible'; } });
      await p.screenshot({ path: join(DOSSIER, `${p.cfgNom}-${p.theme}-42a-avant-rechargement.png`) });
      await charger(p, null);
      /* la première chose à l'écran : le haut de la frise (rien ne défile seul) */
      await p.evaluate(() => window.scrollTo(0, 0)); await attendre(300);
      p.noteEtat = `gardé avant rechargement : ${p.gardeAvant}`;
    },
    mesure: ordreRangees,
    attendu: [
      fn(async p => p.evaluate(() => { const s = document.querySelector('section[data-rangee="achats"]'); const t = (s?.textContent || '').replace(/\s+/g, ' '); return { ok: /cachée/.test(t), dit: `rangée Achats : « ${t.slice(0, 80)} »` }; }), 'Achats masquée après rechargement (« n choses cachées »)'),
      fn(async p => p.evaluate(() => { const e = [...document.querySelectorAll('[data-chose], [data-barre]')].find(x => (x.getAttribute('data-titre') || x.getAttribute('aria-label') || '').startsWith('Hotte')); if (!e) return { ok: false, dit: 'Hotte absente' }; const b = e.getBoundingClientRect(); const lab = `${e.getAttribute('aria-label') || ''} ${e.textContent || ''}`; return { ok: b.width > 0, dit: `Hotte visible (${Math.round(b.left)}, ${Math.round(b.top)}), « ${lab.replace(/\s+/g, ' ').slice(0, 70)} »${/épingl/i.test(lab) || e.querySelector('[data-epingle]') ? ', épingle lue' : ''}` }; }), 'la Hotte épinglée reste visible, sa rangée masquée'),
      fn(etoileSurCourbe, 'l’étoile du Marché de Noël sur la courbe, après rechargement'),
      fn(async p => { const r = await ordreRangees(p); return { ok: r === p.ordreTrie, dit: `après tri « ${p.ordreTrie} », après rechargement « ${r} »` }; }, 'l’ordre trié revient au rechargement')] },
  /* CRITIQUE-6 (D-8, D-9, E45) : la barre Travaux S20 → S40 posée, vue dans la frise en 6 sem. et en 6 mois (la fenêtre déplacée jusqu'à S18) */
  { n: '39b', nom: 'travaux-posee-6sem', sansObjet: cfg => (cfg.w > cfg.h && cfg.tactile ? 'en paysage la fenêtre est de 13 semaines, sans 6 sem. ni 6 mois (E10)' : null), geste: 'fenêtre S20 → S40, 5 j, Ajouter ; poignée de début glissée jusqu’à S18 (6 sem.)', mesure: barreTravauxPosee,
    jouer: async p => { await fenetreTravaux(p); await toucher(p, boutonFeuille(/^Ajouter/)); await attendre(500); await p.keyboard.press('Escape').catch(() => {}); await deplacerFenetreJusqua(p, 18); },
    attendu: [fn(barreTravauxVue, 'la barre Travaux de S20 est dans la frise, avec ses points')] },
  { n: '39c', nom: 'travaux-posee-6mois', sansObjet: cfg => (cfg.w > cfg.h && cfg.tactile ? 'en paysage la fenêtre est de 13 semaines, sans 6 sem. ni 6 mois (E10)' : null), geste: 'fenêtre S20 → S40, 5 j, Ajouter ; période 6 mois ; poignée de début glissée jusqu’à S18 (fenêtre S18 – S43, qui contient S20 – S40)', mesure: barreTravauxPosee,
    jouer: async p => { await fenetreTravaux(p); await toucher(p, boutonFeuille(/^Ajouter/)); await attendre(500); await p.keyboard.press('Escape').catch(() => {}); await menuPeriode(p, /^6 mois/); await p.keyboard.press('Escape').catch(() => {}); await attendre(300); await deplacerFenetreJusqua(p, 18); },
    attendu: [fn(barreTravauxVue, 'la barre Travaux S20 → S40 est dans la frise, avec ses points'), fn(travauxS20aS40, 'la barre va de S20 à S40'), fn(pointsTouchables, 'chaque point touchable : elementFromPoint en son centre = le point')] },
  { n: '61', nom: 'tri-recharge', geste: 'période, « Trier les rangées » (Urgent) ; puis recharger la page', mesure: ordreRangees,
    jouer: async p => {
      await menuPeriode(p, /^Trier les rangées/); await attendre(400);
      p.ordreTrie = await ordreRangees(p);
      p.critere = await p.evaluate(() => document.querySelector('[data-tri-seg]')?.getAttribute('data-critere') ?? 'aucun bandeau de critère');
      await p.screenshot({ path: join(DOSSIER, `${p.cfgNom}-${p.theme}-61a-tri-avant-rechargement.png`) });
      await charger(p, null);
      p.noteEtat = `critère « ${p.critere} » ; ordre trié « ${p.ordreTrie} » ; capture avant rechargement : ${p.cfgNom}-${p.theme}-61a-tri-avant-rechargement.png`;
    },
    attendu: [fn(async p => { const r = await ordreRangees(p); return { ok: r === p.ordreTrie && r !== 'brassins,fetes,ventes,achats,travaux,activites,papiers', dit: `après rechargement « ${r} »` }; }, 'l’ordre trié (différent de l’ordre par genre) revient au rechargement')] },
  { n: '62', nom: 'filtre-achats-seuls', geste: 'période, « Filtrer par type », « Achats seuls »', cave: true, mesure: ordreRangees,
    jouer: async p => { await menuPeriode(p, /^Filtrer par type/); await toucher(p, { dans: { role: 'dialog', texte: /Filtrer par type/, dernier: true }, texte: /^Achats seuls$/ }); },
    attendu: [/Achats seuls · 6 rangées masquées · Tout afficher/, fn(async p => { const r = await ordreRangees(p); return { ok: r.split(',').includes('achats') && r.split(',').length <= 2, dit: `rangées « ${r} »` }; }, 'Achats seules (plus une rangée épinglée au plus)')] },
  { n: '63', nom: 'filtre-tout-afficher', geste: '« Achats seuls », puis « Tout afficher »', /* la mesure est l'état intermédiaire (sous le filtre) contre le repos : le filtre doit avoir changé les rangées */
    mesure: p => (p.filtreVu ? Promise.resolve(p.filtreVu) : ordreRangees(p)),
    jouer: async p => {
      await menuPeriode(p, /^Filtrer par type/); await toucher(p, { dans: { role: 'dialog', texte: /Filtrer par type/, dernier: true }, texte: /^Achats seuls$/ });
      const filtre = await ordreRangees(p);
      p.filtreVu = filtre;
      await p.screenshot({ path: join(DOSSIER, `${p.cfgNom}-${p.theme}-63a-achats-seuls.png`) });
      await toucher(p, { texte: /^Tout afficher$/, role: 'button' });
      p.noteEtat = `rangées sous le filtre « ${filtre} » (capture ${p.cfgNom}-${p.theme}-63a-achats-seuls.png)`;
      if (filtre.split(',').length > 2) throw new Absent(`le filtre laisse ${filtre.split(',').length} rangées`);
    },
    attendu: [fn(async p => { const n = await p.evaluate(() => document.querySelectorAll('section[data-rangee]').length); return { ok: n === 7, dit: `${n} rangées` }; }, 'les 7 rangées reviennent'), fn(async p => p.evaluate(() => !document.querySelector('[data-filtre]')), 'le bandeau du filtre est parti')] },
  { n: '43', nom: 'plus-de-details', geste: '+ d’Achats, S50, Plus de détails ›', jouer: async p => { await ajouterDans(p, 'Achats'); await toucher(p, dansFeuille(/^S50$/)); await toucher(p, dansFeuille(/^Plus de détails/)); },
    attendu: [/Prévoir une dépense/, /\d{1,2} \p{L}+/u] },
  { n: '44', nom: 'propositions', geste: 'aller aux Brassins', jouer: async p => { await trouver(p, { aria: /^Ajouter dans Brassins/ }); },
    attendu: [fn(async p => p.evaluate(() => document.querySelectorAll('[data-proposition="brassin-habituel"]').length > 0), 'brassin habituel en pointillé'),
      fn(async p => p.evaluate(() => document.querySelectorAll('[data-proposition="echeance"]').length > 0 || /Loyer du local/.test(document.body.innerText)), 'échéance en pointillé'), /Café du Pont/] },
  { n: '45', nom: 'propositions-acceptees', geste: 'toucher le brassin habituel proposé (pointillé), puis Ajouter', mesure: p => p.evaluate(() => `${document.querySelectorAll('[data-proposition="brassin-habituel"]').length} proposé(s) · ${document.querySelectorAll('section[data-rangee="brassins"] [data-chose]').length} chose(s) dans Brassins`), jouer: async p => { await toucher(p, { data: 'data-proposition="brassin-habituel"' }); await toucher(p, boutonFeuille(/^Ajouter/)); },
    attendu: [/Annuler/, fn(async p => p.evaluate(() => document.querySelectorAll('[data-proposition="brassin-habituel"]').length === 0), 'la proposition est devenue un brassin plein')] },
  { n: '46', nom: 'budget', geste: 'toucher la Blonde, puis Budget ›', jouer: async p => { await toucher(p, { titre: 'Blonde d’automne' }); await toucher(p, { texte: /^Budget ›/ }); }, attendu: [/budget/i] },

  { n: '47', nom: 'etoile-courbe', geste: 'appui long sur le Marché de Noël, Étoile', mesure: lireTexte, jouer: async p => { await appuiLong(p, { titre: 'Marché de Noël' }); await toucher(p, { dans: { role: 'menu' }, texte: /^Étoile/ }); },
    attendu: [fn(etoileSurCourbe, 'l’étoile est sur la courbe (dans l’en-tête, hors de la frise)')] },
  { n: '48', nom: 'achats-seuls', geste: 'appui long sur la Hotte, « Achats seules »', jouer: async p => { await appuiLong(p, { titre: 'Hotte' }); await toucher(p, { dans: { role: 'menu' }, texte: /^Achats seules/ }); },
    attendu: [/Tout afficher/, fn(async p => p.evaluate(() => document.querySelectorAll('section[data-rangee]').length <= 2), 'les 6 autres rangées sont filtrées')] },
  { n: '49', nom: 'lier', geste: 'appui long sur la Hotte, Lier, Blonde d’automne ; puis le message parti, la pastille', cave: true, mesure: p => choseLue(p, 'Hotte'),
    jouer: async p => {
      await appuiLong(p, { titre: 'Hotte' }); await toucher(p, { dans: { role: 'menu' }, texte: /^Lier/ }); await toucher(p, { dans: { role: 'menu' }, texte: /^Blonde d’automne$/ });
      await attendre(400);
      p.message = await p.evaluate(() => [...document.querySelectorAll('[role="status"], [role="alert"]')].map(e => (e.textContent || '').trim()).filter(Boolean).join(' | '));
      await p.screenshot({ path: join(DOSSIER, `${p.cfgNom}-${p.theme}-49a-lier-message.png`) });
      p.noteEtat = `message : « ${p.message.slice(0, 90)} » (capture ${p.cfgNom}-${p.theme}-49a-lier-message.png)`;
      /* la pastille se voit une fois le message parti (un toucher ailleurs le chasse, E33) : la Hotte amenée au centre de l'écran */
      await toucher(p, { data: 'data-banc' });
      await trouver(p, { titre: 'Hotte' });
      await attendre(300);
      /* CRITIQUE-7 n° 6 : l'aperçu de la pastille ne répète pas le nom (« lié à Blonde d'automne · Blonde d'automne · … ») */
      /* la pastille est posée à côté de la barre (pas dedans) : celle de la rangée de la Hotte, la plus proche d'elle en hauteur */
      const pastille = await p.evaluate(() => {
        const h = [...document.querySelectorAll('[data-chose], [data-barre]')].find(x => /^Hotte/.test(x.getAttribute('data-titre') || x.getAttribute('aria-label') || ''));
        if (!h) return null;
        const H = h.getBoundingClientRect(); const cy = H.top + H.height / 2;
        /* à 390 la pastille de la Hotte est l'icône courte posée sur la barre : `[data-lie]` ou un bouton « lié à … : aperçu » */
        const l = [...document.querySelectorAll('[data-lie], [aria-label$=": aperçu"], [aria-label^="lié à"], [aria-label^="Liée à"]')].map(e => ({ e, r: e.getBoundingClientRect() })).filter(o => o.r.width > 0).sort((a, b) => Math.abs(a.r.top + a.r.height / 2 - cy) - Math.abs(b.r.top + b.r.height / 2 - cy))[0];
        return l && Math.abs(l.r.top + l.r.height / 2 - cy) < 40 ? { x: l.r.left + l.r.width / 2, y: l.r.top + l.r.height / 2 }
          : { manque: `Hotte ${Math.round(H.left)},${Math.round(H.top)} ${Math.round(H.width)}×${Math.round(H.height)} ; pastilles ${[...document.querySelectorAll('[data-lie]')].map(e => { const r = e.getBoundingClientRect(); return `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}×${Math.round(r.height)}`; }).join(' | ') || 'aucune'}` };
      });
      if (pastille?.manque) p.noteEtat += ` ; pastille de la Hotte introuvable (${pastille.manque})`;
      if (pastille && !pastille.manque) {
        await appuyerXY(p, pastille.x, pastille.y); await attendre(300);
        p.apercu = await p.evaluate(() => (document.querySelector('[data-lie][aria-expanded="true"]')?.closest('[data-chose], [data-barre]')?.textContent || document.body.innerText).replace(/\s+/g, ' ').slice(0, 300));
        await p.screenshot({ path: join(DOSSIER, `${p.cfgNom}-${p.theme}-49b-lier-apercu.png`) });
        p.noteEtat += ` ; aperçu de la pastille (capture ${p.cfgNom}-${p.theme}-49b-lier-apercu.png) : « ${p.apercu.slice(0, 120)} »`;
      }
    },
    interdit: [/Blonde d’automne · Blonde d’automne/, /lié à Blonde d’automne · Blonde d’automne/],
    attendu: [fn(async p => ({ ok: /Lié/.test(p.message || ''), dit: `message « ${(p.message || '').slice(0, 60)} »` }), 'le message « Liée à Blonde d’automne · Annuler »'),
      fn(async p => p.evaluate(() => [...document.querySelectorAll('[data-chose], [data-barre]')].some(e => /^Hotte/.test(e.getAttribute('data-titre') || e.getAttribute('aria-label') || '') && /Blonde/.test(`${e.textContent} ${e.getAttribute('aria-label') || ''}`))), 'la pastille « lié à Blonde » sur la Hotte')] },
  { n: '50', nom: 'source-facture', geste: 'toucher la facture Brouwland', jouer: async p => { await toucher(p, { titre: 'Brouwland' }); }, attendu: [/Payé/] },
  { n: '51', nom: 'source-vente', geste: 'toucher la vente Noël privés', jouer: async p => {
    const r = await toucher(p, { titre: 'Noël privés' }); await attendre(400);
    /* CRITIQUE-6 (D-99) : ce que le doigt a touché, si Facturer ne vient pas */
    p.noteEtat = await p.evaluate((x, y) => { const e = document.elementFromPoint(x, y); return `sous le doigt (${Math.round(x)}, ${Math.round(y)}) : <${e?.tagName.toLowerCase()}> « ${(e?.closest('[data-titre]')?.getAttribute('data-titre') || e?.getAttribute('aria-label') || e?.textContent || '').replace(/\s+/g, ' ').slice(0, 50)} »`; }, r.x, r.y);
  }, attendu: [/Facturer/] },
  /* CRITIQUE-6 (D-76) : la TVA T4 est en S+10 (fixture du banc) : hors des 6 semaines ; on la cherche en 3 mois, où elle est posée dans Papiers */
  { n: '52', nom: 'source-tva', geste: 'période 3 mois, toucher la TVA T4 (Papiers)', jouer: async p => { await menuPeriode(p, /^3 mois/); await p.keyboard.press('Escape').catch(() => {}); await attendre(300); p.tvaVue = await p.evaluate(() => [...document.querySelectorAll('section[data-rangee="papiers"] [data-chose], section[data-rangee="papiers"] [data-marque]')].some(e => /TVA T4/.test(`${e.getAttribute('data-titre') || ''} ${e.getAttribute('aria-label') || ''}`))); await p.screenshot({ path: join(DOSSIER, `${p.cfgNom}-${p.theme}-52a-tva-dans-papiers.png`) }); await toucher(p, { titre: 'TVA T4' }); },
    attendu: [fn(async p => ({ ok: !!p.tvaVue, dit: `TVA T4 ${p.tvaVue ? 'posée' : 'absente'} dans la rangée Papiers (capture 52a)` }), 'la TVA T4 est dans Papiers'), /Finances/] },
  { n: '53', nom: 'idee-noter', geste: '+ volant, Noter une idée, texte, Noter', jouer: async p => { await toucher(p, FAB); await toucher(p, dansFeuille(/^Noter une idée/)); await noterIdee(p, 'ZZ TEST — idée houblon'); },
    attendu: [/idée|Idée/] },
  { n: '54', nom: 'idee-bande', geste: 'appui long sur une semaine de la bande', jouer: async p => { await appuiLong(p, { dans: { aria: /^Semaines/ }, texte: /^S\d+$/, index: 3 }); }, attendu: [/L’idée, en quelques mots|Noter une idée/] },
  { n: '55', nom: 'poignee-bout', geste: 'poignée de fin lâchée à mi-course, puis tirée au bout', jouer: async p => {
      await tirerPoignee(p, 0.45, false);
      const message = /Tire jusqu.au bout : l.année/.test(await lireTexte(p));
      p.noteEtat = `message « Tire jusqu'au bout : l'année » après le lâcher à mi-course : ${message ? 'vu' : 'ABSENT'}`;
      if (!message) throw new Absent('le message « Tire jusqu’au bout : l’année » n’apparaît pas au lâcher avant 80 %');
      await tirerPoignee(p, 1.0, false);
    }, attendu: [/janv/, /juin/] },

  /* ---------- CRITIQUE-7 « Pour passer » : les preuves à rejouer sur le commit qui suit e3548fa73 ---------- */
  /* n° 1 : 6 mois à 390, la bande des semaines lisible (aucune étiquette n'en chevauche une autre) */
  { n: '18b', nom: 'six-mois-bande', geste: 'période 6 mois ; lire la bande des semaines', cave: true, mesure: p => bandeLue(p),
    jouer: async p => { await menuPeriode(p, /^6 mois/); await p.keyboard.press('Escape').catch(() => {}); await attendre(400); await p.evaluate(() => window.scrollTo(0, 0)); await attendre(300); },
    attendu: [fn(bandeLisible, 'aucune étiquette de la bande n’en chevauche une autre')] },
  /* n° 2 : f2-a sur la Saison pas brassée : la date « prête le » suit le bord tiré, ou le refus est dit */
  { n: '09s', nom: 'f2a-saison', geste: 'tirer le bord de la Saison de ferme (pas brassée) d’une colonne', mesure: p => choseLue(p, 'Saison de ferme'),
    jouer: async p => {
      await trouver(p, { titre: 'Saison de ferme' });
      p.saisonAvant = await choseLue(p, 'Saison de ferme');
      await p.screenshot({ path: join(DOSSIER, `${p.cfgNom}-${p.theme}-09sa-f2a-saison-avant.png`) });
      await glisserChose(p, 'Saison de ferme', 1, { sous: '[data-bord]' });
      await attendre(300);
      p.saisonApres = await choseLue(p, 'Saison de ferme');
      p.message = await p.evaluate(() => [...document.querySelectorAll('[role="status"], [role="alert"]')].map(e => (e.textContent || '').trim()).filter(Boolean).join(' | '));
      p.noteEtat = `avant « ${p.saisonAvant.slice(0, 110)} » (capture ${p.cfgNom}-${p.theme}-09sa-f2a-saison-avant.png) ; après « ${p.saisonApres.slice(0, 110)} » ; message « ${p.message.slice(0, 90)} »`;
    },
    attendu: [fn(async p => {
      const pr = s => (/prête (?:le )?(\d{1,2} \p{L}+\.?)/u.exec(s) || [])[1] || null;
      const a = pr(p.saisonAvant || ''), b = pr(`${p.saisonApres || ''} ${p.message || ''}`);
      const refus = /ne se tire pas|ne s.allonge pas|pas encore brassée|suit la recette/i.test(p.message || '');
      return { ok: (!!a && !!b && a !== b) || refus, dit: refus ? `refus dit : « ${p.message.slice(0, 80)} »` : `« prête le » ${a ?? '?'} → ${b ?? '?'}` };
    }, '« prête le » change avec le bord, ou le refus est dit')] },
  /* n° 7 : revenu en portrait après une rotation, aucun montant sous le + (en haut, au milieu et au bout du défilement) */
  { n: '35r', nom: 'rotation-repos-plus', geste: 'tourner le téléphone puis le remettre en portrait ; défiler haut, milieu, bout', sansObjet: cfg => (cfg.tactile && cfg.h > cfg.w ? null : 'la rotation se juge depuis le portrait à 390'),
    mesure: p => p.evaluate(() => `${innerWidth}x${innerHeight} · ${scrollY}`),
    jouer: async p => {
      await tourner(p); await tourner(p);
      const vus = [];
      for (const part of [0, 0.5, 1]) {
        await p.evaluate(x => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * x), part); await attendre(400);
        vus.push(await sousLePlus(p));
        if (part === 0.5) await p.screenshot({ path: join(DOSSIER, `${p.cfgNom}-${p.theme}-35m-rotation-repos-milieu.png`) });
      }
      p.sousPlus = vus;
      p.noteEtat = vus.map((v, i) => `${['haut', 'milieu', 'bout'][i]} : ${v.length ? v.join(' / ') : 'rien sous le +'}`).join(' ; ');
    },
    attendu: [fn(async p => ({ ok: (p.sousPlus || []).every(v => !v.some(t => /[−+-]\s?\d/.test(t))), dit: (p.sousPlus || []).map(v => v.join(' / ') || 'rien').join(' ; ') }), 'aucun montant sous le + (haut, milieu, bout)')] },
  /* n° 8 : la livraison Brouwland et sa facture ne font qu'une chose dans Achats, avec −420 */
  { n: '01b', nom: 'achats-brouwland', geste: 'aller aux Achats ; compter les choses « Brouwland »', mesure: p => p.evaluate(() => scrollY),
    jouer: async p => { await trouver(p, { aria: /^Ajouter dans Achats/ }); await p.evaluate(() => window.scrollBy(0, 120)); await attendre(300); },
    attendu: [fn(async p => p.evaluate(() => {
      const l = [...document.querySelectorAll('section[data-rangee="achats"] [data-chose], section[data-rangee="achats"] [data-marque]')].map(e => `${e.getAttribute('aria-label') || e.getAttribute('data-titre') || ''}`).filter(t => /Brouwland/.test(t));
      return { ok: l.length === 1 && /[−-]\s?420\b/.test(l[0]), dit: `${l.length} chose(s) Brouwland : ${l.map(t => `« ${t.slice(0, 70)} »`).join(' ; ')}` };
    }), 'une seule chose Brouwland dans Achats, avec −420')] },

  /* ---------- CRITIQUE-9 : les problèmes 3, 4, 6, 8 et le retenu D-69, chacun mesuré ---------- */
  /* n° 3 (E25, E29) : au repos, la Saison et la Blonde disent « prête le … » sur leur ligne, comme le Porter */
  { n: '01p', nom: 'repos-prete', geste: 'aucun (repos) ; lire la ligne de la Saison et de la Blonde', cave: true, repos: true, jouer: async p => { await trouver(p, { titre: 'Saison de ferme' }); await attendre(200); },
    attendu: [fn(p => preteSur(p, 'Saison de ferme'), '« prête le … » sur la ligne de la Saison'), fn(p => preteSur(p, 'Blonde d’automne'), '« prête le … » sur la ligne de la Blonde')] },
  /* n° 4 (E38, L14) : dans le détail de la Saison, l'emballage est daté sur le brassin (« prête » − 7 j), jamais sur l'ancienne date prévue */
  { n: '10s', nom: 'f4b-saison-emballage', geste: 'toucher la Saison de ferme ; lire « prête le » et « emballage le »', mesure: lireTexte,
    jouer: async p => {
      await toucher(p, { titre: 'Saison de ferme' }); await attendre(300);
      p.detail = await p.evaluate(() => (document.querySelector('[role="region"][aria-label^="Détail"]')?.textContent || document.body.innerText).replace(/\s+/g, ' '));
      p.noteEtat = `détail « ${p.detail.slice(0, 200)} »`;
    },
    attendu: [fn(async p => {
      const prete = jourDe(/prête (?:le )?(\d{1,2} \S+)/u.exec(p.detail || '')?.[1]), emb = jourDe(/emballage (?:le )?(\d{1,2} \S+)/u.exec(p.detail || '')?.[1]);
      return { ok: prete !== null && emb !== null && prete - emb === 7, dit: `prête ${prete !== null ? new Date(prete * 864e5).toISOString().slice(0, 10) : '?'} ; emballage ${emb !== null ? new Date(emb * 864e5).toISOString().slice(0, 10) : '?'} ; écart ${prete !== null && emb !== null ? prete - emb : '?'} j` };
    }, 'emballage = prête − 7 j')] },
  /* n° 6 (E28, D-46) : f1-a sur un brassin qui change le libre : le message dit l'effet « S50 : a → b », pas seulement le trajet */
  /* la Saison pas brassée (prévue S46) est montrée en S47 : une colonne ne la fait pas bouger à l'écran ; trois colonnes, comme la vision 10 (S46 → S50) */
  { n: '08s', nom: 'f1a-saison-effet', geste: 'glisser la Saison de ferme de trois colonnes, lâcher', mesure: p => choseLue(p, 'Saison de ferme'),
    jouer: async p => { await glisserChose(p, 'Saison de ferme', 3); p.message = await p.evaluate(() => (document.querySelector('[data-message]')?.textContent || '').replace(/\s+/g, ' ').trim()); p.noteEtat = `message « ${p.message.slice(0, 90)} »`; },
    attendu: [/Annuler/, fn(async p => ({ ok: /S\d+ : [−\d\s’']+ → [−\d\s’']+/.test(p.message || ''), dit: `« ${(p.message || '').slice(0, 70)} »` }), 'le message dit l’effet « S… : a → b »')] },
  /* n° 8 (E31) : « Dupliquer en S… » sur un brassin dit son effet, comme sur la Hotte */
  { n: '11d', nom: 'f5a-menu-brassin', geste: 'appui long sur la Blonde d’automne ; lire « Dupliquer en S… » et son effet (CRITIQUE-10 n° 5)', cave: true,
    jouer: async p => { await appuiLong(p, { titre: 'Blonde d’automne' }); p.dup = await p.evaluate(() => { const m = document.querySelector('[role="menu"]'); const d = m && [...m.querySelectorAll('[role^="menuitem"], button')].find(b => /^Dupliquer en/.test((b.textContent || '').trim())); return d ? (d.textContent || '').replace(/\s+/g, ' ').trim() : ''; }); p.noteEtat = `« ${p.dup} »`; },
    attendu: [fn(async p => ({ ok: /^Dupliquer en S\d+.*S\d+ : [−\d\s’']+ → [−\d\s’']+/.test(p.dup || '') || /^Dupliquer en S\d+.*[−+]\s?\d/.test(p.dup || '') || /^Dupliquer en S\d+ · coût à venir$/.test(p.dup || ''), dit: `« ${p.dup || 'absent'} »` }), '« Dupliquer en S… » avec son effet, chiffré ou « coût à venir »')] },
  /* D-69 (retenu vu en texte seul) : un projet de matériel (Frigo) est dans Travaux, et s'ouvre */
  { n: '69', nom: 'travaux-projet-materiel', geste: 'période An ; toucher Frigo (Travaux)', mesure: lireTexte, jouer: async p => { await menuPeriode(p, /^An\b/); await p.keyboard.press('Escape').catch(() => {}); await attendre(400); await toucher(p, { titre: 'Frigo' }); await attendre(300); },
    attendu: [fn(async p => p.evaluate(() => [...document.querySelectorAll('section[data-rangee="travaux"] [data-chose], section[data-rangee="travaux"] [data-barre]')].some(e => /^Frigo/.test(e.getAttribute('aria-label') || e.getAttribute('data-titre') || ''))), 'Frigo dans la rangée Travaux'), /Frigo/] },

  /* ---------- CRITIQUE-10 (vision 12) : chaque attendu échoue si l'état n'a pas été joué (L13) ---------- */
  /* n° 1 (E28, D-46, D-189) : la Saison pas brassée (prévue le mardi de la semaine passée, montrée cette semaine) va où on la lâche, d'une puis de
     quatre colonnes ; la bulle et la barre posée disent la même semaine ; le message ne part jamais de la semaine prévue passée (« S46 → ») */
  ...[[1, '08s1', 'une'], [4, '08s4', 'quatre']].map(([k, n, mot]) => ({
    n, nom: `f1a-saison-${k}col`, cave: true, geste: `glisser la Saison de ferme (pas brassée) de ${mot} colonne${k > 1 ? 's' : ''} ; bulle lue doigt tenu, puis lâcher`, mesure: p => choseLue(p, 'Saison de ferme'),
    jouer: async p => {
      await trouver(p, { titre: 'Saison de ferme' });
      p.semAvant = await semaineDe(p, 'Saison de ferme');
      await p.screenshot({ path: join(DOSSIER, `${p.cfgNom}-${p.theme}-${n}a-avant.png`) });
      await glisserChose(p, 'Saison de ferme', k, { tenu: true });
      p.bulle = await p.evaluate(() => (document.querySelector('[data-ici]')?.textContent || '').replace(/\s+/g, ' ').trim());
      await p.screenshot({ path: join(DOSSIER, `${p.cfgNom}-${p.theme}-${n}p-pendant.png`) });
      await lacher(p);
      p.message = await messageLu(p);
      p.semApres = await semaineDe(p, 'Saison de ferme');
      p.noteEtat = `avant ${p.semAvant} ; bulle « ${p.bulle} » ; après ${p.semApres} ; message « ${p.message.slice(0, 80)} » (captures ${n}a-avant, ${n}p-pendant)`;
    },
    attendu: [
      fn(async p => ({ ok: p.semAvant === S(0), dit: `avant : ${p.semAvant}` }), `la Saison montrée en ${S(0)} avant le geste`),
      fn(async p => ({ ok: (p.bulle || '').startsWith(`${S(k)} · ${lisible(k * 7)}`), dit: `bulle « ${p.bulle || ''} »` }), `la bulle dit « ${S(k)} · ${lisible(k * 7)} »`),
      fn(async p => ({ ok: p.semApres === S(k), dit: `après : ${p.semApres}` }), `la barre posée en ${S(k)}, là où la bulle l’a dit`),
      fn(async p => ({ ok: !!p.message && !p.message.includes(`${S(-1)} →`), dit: `message « ${(p.message || '').slice(0, 70)} »` }), `un message, sans « ${S(-1)} → »`)]
  })),
  /* n° 3 (E08, D-19, E40) : la Liste dit la date prévue de la Saison, comme son détail : « prévue le 10 nov. · S46 » */
  { n: '31s', nom: 'liste-saison-prevue', geste: 'période, puis Liste ; lire la ligne de la Saison de ferme', mesure: lireTexte,
    jouer: async p => { await menuPeriode(p, /^Liste/); await attendre(300); p.ligne = await p.evaluate(() => { const l = document.querySelector('[data-vue-liste]'); const e = l && [...l.querySelectorAll('li, button, [role="button"]')].filter(x => /Saison de ferme/.test(x.textContent || '')).sort((a, b) => (a.textContent || '').length - (b.textContent || '').length)[0]; if (e) e.scrollIntoView({ block: 'center' }); return e ? (e.textContent || '').replace(/\s+/g, ' ').trim() : ''; }); await attendre(300); p.noteEtat = `ligne « ${p.ligne.slice(0, 100)} »`; },
    attendu: [fn(async p => ({ ok: (p.ligne || '').includes(`prévue le ${lisible(-6)} · ${S(-1)}`), dit: `« ${(p.ligne || 'ligne absente').slice(0, 90)} »` }), `« prévue le ${lisible(-6)} · ${S(-1)} » sur la ligne de la Saison`)],
    interdit: [new RegExp(`prévue le ${lisible(aujourdhuiDecale())} · ${S(0)}`)] },
  /* n° 2 (E34, E45, D-200, « J'ajoute et je vois rien ») : posée hors de la fenêtre, le message porte « Voir S20 › » ; son toucher règle la période
     sur la chose entière (6 mois, S19 à S44) ; la barre va de S20 à S40 avec 5 points, chacun touchable en son centre */
  { n: '39v', nom: 'travaux-voir-s20', geste: 'fenêtre S20 → S40, 5 j, Ajouter ; lire le message ; toucher « Voir S20 › »', mesure: barreTravauxPosee,
    jouer: async p => {
      await fenetreTravaux(p); await toucher(p, boutonFeuille(/^Ajouter/)); await attendre(500);
      p.message = await messageLu(p); p.lignesMessage = await lignesDe(p, '[data-message]');
      await p.screenshot({ path: join(DOSSIER, `${p.cfgNom}-${p.theme}-39m-message-voir.png`) });
      await toucher(p, { dans: { role: 'status|alert' }, role: 'button', texte: /^Voir S20/ });
      await attendre(600);
      p.noteEtat = `message « ${p.message.slice(0, 90)} » sur ${p.lignesMessage} ligne(s) (capture 39m-message-voir) ; ${await cadreLu(p)}`;
    },
    attendu: [fn(async p => ({ ok: /Voir S20 ›/.test(p.message || '') && /Annuler/.test(p.message || '') && p.lignesMessage >= 1 && p.lignesMessage <= 2, dit: `« ${(p.message || '').slice(0, 80)} », ${p.lignesMessage} ligne(s)` }), 'le message porte « Voir S20 › » et Annuler, sur deux lignes au plus'),
      fn(async p => p.evaluate(() => { const n = document.querySelector('[data-frise]')?.getAttribute('data-nb-colonnes'); return { ok: n === '26', dit: `${n} colonnes` }; }), 'la période passe à 6 mois (26 colonnes)'),
      fn(travauxS20aS40, 'la barre va de S20 à S40'), fn(barreTravauxVue, 'ses 5 points visibles'), fn(pointsTouchables, 'chaque point touchable : elementFromPoint en son centre = le point')] },
  /* n° 7 et n° 4 (D-113, D-126, E37) : la Hotte liée à la Blonde ; son détail dit « lié à Blonde d’automne » et sa plage tient sur une ligne */
  { n: '49d', nom: 'lier-detail-plage', geste: 'appui long sur la Hotte, Lier, Blonde d’automne ; ouvrir le détail de la Hotte ; lire « lié à » et la plage', mesure: lireTexte,
    jouer: async p => {
      await appuiLong(p, { titre: 'Hotte' }); await toucher(p, { dans: { role: 'menu' }, texte: /^Lier/ }); await toucher(p, { dans: { role: 'menu' }, texte: /^Blonde d’automne$/ });
      await attendre(500);
      p.message = await messageLu(p);
      const ouvert = () => p.evaluate(() => [...document.querySelectorAll('[role="region"][aria-label^="Détail"]')].some(d => /Hotte/.test(`${d.getAttribute('aria-label')} ${d.textContent}`)));
      if (!(await ouvert())) await toucher(p, { titre: 'Hotte' });
      await attendre(400);
      p.detail = await p.evaluate(() => { const d = [...document.querySelectorAll('[role="region"][aria-label^="Détail"]')].find(x => /Hotte/.test(`${x.getAttribute('aria-label')} ${x.textContent}`)); if (d) d.scrollIntoView({ block: 'center' }); return d ? (d.textContent || '').replace(/\s+/g, ' ').trim() : ''; });
      await attendre(300);
      p.plage = await p.evaluate(() => { const d = [...document.querySelectorAll('[role="region"][aria-label^="Détail"]')].find(x => /Hotte/.test(`${x.getAttribute('aria-label')} ${x.textContent}`)); const e = d?.querySelector('[data-plage]'); return e ? (e.textContent || '').trim() : ''; });
      p.lignesPlage = await lignesDe(p, '[role="region"][aria-label^="Détail"] [data-plage]');
      p.noteEtat = `message « ${p.message.slice(0, 60)} » ; détail « ${p.detail.slice(0, 120)} » ; plage « ${p.plage} » sur ${p.lignesPlage} ligne(s)`;
    },
    attendu: [fn(async p => ({ ok: /lié à Blonde d’automne/.test(p.detail || ''), dit: `détail « ${(p.detail || 'fermé').slice(0, 80)} »` }), 'le détail de la Hotte dit « lié à Blonde d’automne »'),
      fn(async p => ({ ok: /^\d{1,2} \p{L}+\.? – \d{1,2} \p{L}+\.?$/u.test(p.plage || '') && p.lignesPlage === 1, dit: `plage « ${p.plage || 'absente'} », ${p.lignesPlage} ligne(s)` }), 'la plage « 30 nov. – 6 déc. » sur une ligne')],
    interdit: [/lié à Blonde d’automne · Blonde d’automne/] }
];
/* ---------- CRITIQUE-10 : dates du banc (posé par rapport au jour) et lectures ---------- */
/** Le lundi de la semaine en cours (UTC), comme le banc (`lundiDe(aujourdhui)`). */
function lundiCourant() { const j = new Date(); return Date.UTC(j.getFullYear(), j.getMonth(), j.getDate() - ((j.getDay() + 6) % 7)); }
/** Jours entre le lundi courant et aujourd'hui (0 le lundi, 2 le mercredi). */
function aujourdhuiDecale() { const j = new Date(); return (j.getDay() + 6) % 7; }
/** La semaine ISO, « S47 », du lundi courant + n semaines. */
function S(n) {
  const d = new Date(lundiCourant() + n * 7 * 864e5 + 3 * 864e5);
  const a = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return `S${1 + Math.round(((d.getTime() - a.getTime()) / 864e5 - 3 + ((a.getUTCDay() + 6) % 7)) / 7)}`;
}
/** « 23 nov. » : le lundi courant + j jours. */
function lisible(j) { const d = new Date(lundiCourant() + j * 864e5); return `${d.getUTCDate()} ${MOIS_COURTS[d.getUTCMonth()]}`; }
/** La semaine (`data-semaine`) de la barre d'une chose. */
function semaineDe(p, titre) {
  return p.evaluate(t => { const e = [...document.querySelectorAll('[data-barre], [data-chose], [data-marque]')].find(x => (x.getAttribute('data-titre') || x.getAttribute('aria-label') || '').startsWith(t)); return e ? e.getAttribute('data-semaine') || 'sans semaine' : 'absente'; }, titre);
}
/** Le texte du message (E33). */
function messageLu(p) { return p.evaluate(() => (document.querySelector('[data-message]')?.textContent || '').replace(/\s+/g, ' ').trim()); }
/** Le nombre de lignes de texte d'un élément : les boîtes de ses nœuds texte, groupées par hauteur (10 px). */
function lignesDe(p, sel) {
  return p.evaluate(s => {
    const e = document.querySelector(s); if (!e) return 0;
    const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); const centres = [];
    for (let n = w.nextNode(); n; n = w.nextNode()) { if (!/\S/.test(n.textContent || '')) continue; const r = document.createRange(); r.selectNodeContents(n); for (const q of r.getClientRects()) if (q.width > 0) centres.push(q.top + q.height / 2); }
    centres.sort((a, b) => a - b);
    let lignes = 0, der = -1e9; for (const c of centres) { if (c - der > 10) { lignes++; der = c; } }
    return lignes;
  }, sel);
}
/** La boîte d'une barre (gauche, largeur). */
function boiteChose(p, titre) {
  return p.evaluate(t => { const e = [...document.querySelectorAll('[data-barre], [data-chose]')].find(x => (x.getAttribute('data-titre') || x.getAttribute('aria-label') || '').startsWith(t)); if (!e) return null; const b = e.getBoundingClientRect(); return { g: b.left, w: b.width }; }, titre);
}
/** L'état du bouton ± (E02) : appuyé ou non. */
function plusMinusLu(p) { return p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => (x.textContent || '').trim() === '±'); return b ? `${b.getAttribute('aria-pressed')}|${b.getAttribute('aria-expanded')}` : 'absent'; }); }
async function plusMinusInchange(p) { const a = await plusMinusLu(p); return { ok: !!p.pmAvant && a === p.pmAvant, dit: `± « ${p.pmAvant} » → « ${a} »` }; }
/** La barre posée de S20 (Travaux) : ses colonnes lues contre la piste, rapportées aux semaines du cadre de la fenêtre. */
function travauxS20aS40(p) {
  return p.evaluate(() => {
    const e = [...document.querySelectorAll('section[data-rangee="travaux"] [data-barre], section[data-rangee="travaux"] [data-chose]')].find(x => /\bS20\b/.test(`${x.getAttribute('aria-label') || ''} ${x.getAttribute('data-titre') || ''}`));
    if (!e) return { ok: false, dit: 'barre posée (S20) absente' };
    const lc = parseFloat(document.querySelector('[data-frise]')?.getAttribute('data-largeur-colonne') || 'NaN');
    const piste = e.closest('[data-lane]');
    if (!piste || !Number.isFinite(lc) || lc <= 0) return { ok: false, dit: 'piste ou largeur de colonne introuvable' };
    const L = piste.getBoundingClientRect(), b = e.getBoundingClientRect();
    const cadre = document.querySelector('.ent-cadre[role="group"]')?.getAttribute('aria-label') || '';
    const n0 = Number((/S(\d+)/.exec(cadre) || [])[1]);
    const a = Math.round((b.left - L.left) / lc), z = Math.round((b.right - L.left) / lc) - 1;
    const sem = i => ((n0 - 1 + i) % 52) + 1;
    return { ok: e.getAttribute('data-semaine') === 'S20' && sem(a) === 20 && sem(z) === 40, dit: `cadre « ${cadre} » ; colonnes ${a} → ${z} (S${sem(a)} → S${sem(z)}), colonne ${lc.toFixed(1)} px` };
  });
}
/** Chaque point de la barre posée est touchable : elementFromPoint en son centre rend le point lui-même. */
function pointsTouchables(p) {
  return p.evaluate(() => {
    const e = [...document.querySelectorAll('section[data-rangee="travaux"] [data-barre], section[data-rangee="travaux"] [data-chose]')].find(x => /\bS20\b/.test(`${x.getAttribute('aria-label') || ''} ${x.getAttribute('data-titre') || ''}`));
    if (!e) return { ok: false, dit: 'barre posée (S20) absente' };
    const r = e.getBoundingClientRect(); if (r.top < 80 || r.bottom > innerHeight - 100) window.scrollBy(0, r.top - innerHeight / 2);
    const pts = [...e.querySelectorAll('[data-point]')];
    /* les points, le nom et la durée ont `pointer-events: none` (le doigt prend la barre) : elementFromPoint les traverse. Pour lire ce qui est
       PEINT au-dessus, la frise est rendue touchable le temps de la mesure (une feuille de style posée puis retirée ; rien de l'app ne change) */
    const st = document.createElement('style');
    st.textContent = '[data-calendrier] * { pointer-events: auto !important; }';
    document.head.appendChild(st);
    /* une zone de prise transparente (le bord `.cal-grip` élargi de 12 px par son ::before, pour le doigt) n'est pas peinte : sans fond, sans bord,
       sans ombre ni texte propre, elle est écartée et la mesure regarde dessous ; elle est nommée dans le rapport */
    const transparente = s => { const c = getComputedStyle(s); const vide = v => !v || v === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(v); return vide(c.backgroundColor) && c.backgroundImage === 'none' && c.boxShadow === 'none' && (parseFloat(c.borderTopWidth) || 0) + (parseFloat(c.borderBottomWidth) || 0) + (parseFloat(c.borderLeftWidth) || 0) + (parseFloat(c.borderRightWidth) || 0) === 0 && ![...s.childNodes].some(n => n.nodeType === 3 && /\S/.test(n.textContent || '')); };
    const ecartes = [];
    const res = pts.map(x => {
      const q = x.getBoundingClientRect(); const cx = q.left + q.width / 2, cy = q.top + q.height / 2;
      let s = document.elementFromPoint(cx, cy); const traverses = [];
      for (let i = 0; i < 4 && s && s !== x && !x.contains(s) && !s.contains(x) && transparente(s); i++) { traverses.push(s); ecartes.push([s, s.style.pointerEvents]); s.style.setProperty('pointer-events', 'none', 'important'); s = document.elementFromPoint(cx, cy); }
      const nom = e => `${e.tagName.toLowerCase()}${typeof e.className === 'string' && e.className ? `.${e.className.split(' ')[0]}` : ''}`;
      return { ok: !!s && (s === x || x.contains(s)), sous: s ? nom(s) : 'rien', vide: traverses.map(nom).join('+'), cx: Math.round(cx), cy: Math.round(cy) };
    });
    ecartes.reverse().forEach(([e, v]) => { e.style.pointerEvents = v; });
    st.remove();
    res.forEach(o => { if (o.vide) o.sous = `${o.sous} (sous la zone transparente ${o.vide})`; });
    return { ok: pts.length === 5 && res.every(o => o.ok), dit: `${pts.length} point(s), mesurés ce qui est peint au-dessus : ${res.map(o => `${o.cx},${o.cy} → ${o.ok ? `le point${o.vide ? ` (zone transparente ${o.vide} écartée)` : ''}` : o.sous}`).join(' ; ')}` };
  });
}
/** L'étiquette du cadre de la fenêtre (« Fenêtre : S47 – S52 »). */
const cadreLu = p => p.evaluate(() => document.querySelector('.ent-cadre[role="group"]')?.getAttribute('aria-label') ?? 'cadre absent');
/**
 * Le départ de c2-b (CRITIQUE-9 n° 9) : sur la courbe, dans le plus grand intervalle libre du cadre de la fenêtre et de ses poignées (12 px de
 * marge), à mi-hauteur ; le glissé reste dans cet intervalle. Vérifié par elementFromPoint : le doigt ne tombe ni sur le cadre ni sur une poignée.
 */
const departCourbe = p => p.evaluate(() => {
  const c = [...document.querySelectorAll('[aria-label^="Libre et caisse"]')].find(e => e.getBoundingClientRect().width > 100);
  if (!c) return { ok: false, dit: 'courbe introuvable' };
  const C = c.getBoundingClientRect();
  const obstacles = [...document.querySelectorAll('.ent-cadre, [data-poignee], [data-cadre-tirage], [data-cadre-etiquette]')].map(e => e.getBoundingClientRect()).filter(r => r.width > 0 && r.bottom > C.top && r.top < C.bottom).map(r => [r.left - 12, r.right + 12]).sort((a, b) => a[0] - b[0]);
  const libres = []; let x = C.left + 8;
  for (const [g, d] of obstacles) { if (g > x) libres.push([x, g]); x = Math.max(x, d); }
  if (C.right - 8 > x) libres.push([x, C.right - 8]);
  const [g, d] = libres.sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]))[0] || [0, 0];
  if (d - g < 40) return { ok: false, dit: `aucun intervalle libre de 40 px sur la courbe (obstacles ${obstacles.map(o => o.map(Math.round).join('–')).join(', ')})` };
  const y = C.top + C.height * 0.55, x0 = g + 10;
  const sous = document.elementFromPoint(x0, y);
  const pris = sous && sous.closest('.ent-cadre, [data-poignee], [data-cadre-tirage]');
  return { ok: !pris, x: x0, y, dx: (d - g - 20) * 0.7, dit: `départ (${Math.round(x0)}, ${Math.round(y)}), glissé ${Math.round((d - g - 20) * 0.7)} px dans l’intervalle libre ${Math.round(g)}–${Math.round(d)} ; sous le doigt : <${sous?.tagName.toLowerCase()}>${pris ? ' DANS LE CADRE' : ''}` };
});
/** Le texte de la rangée Fêtes (CRITIQUE-9 n° 1). */
const fetesLues = p => p.evaluate(() => (document.querySelector('section[data-rangee="fetes"]')?.textContent || 'rangée Fêtes absente').replace(/\s+/g, ' ').trim());
/** Le Marché de Noël posé dans Fêtes, en S52 (sa barre porte `data-rangee` et `data-semaine`). */
function noelEnS52(p) {
  return p.evaluate(() => {
    const b = [...document.querySelectorAll('[data-barre], [data-marque]')].find(e => /^Marché de Noël/.test(e.getAttribute('aria-label') || e.getAttribute('data-titre') || ''));
    if (!b) return { ok: false, dit: 'Marché de Noël absent de la frise' };
    return { ok: b.getAttribute('data-rangee') === 'fetes' && b.getAttribute('data-semaine') === 'S52', dit: `Marché de Noël : rangée ${b.getAttribute('data-rangee')}, ${b.getAttribute('data-semaine')}` };
  });
}
/** Les étiquettes « prête le … » posées sur la ligne d'un brassin (dans sa barre ou à côté), à l'écran (CRITIQUE-9 n° 3, E25, E29). */
const preteSur = (p, titre) => p.evaluate(t => {
  const b = [...document.querySelectorAll('section[data-rangee="brassins"] [data-barre], section[data-rangee="brassins"] [data-chose]')].find(e => (e.getAttribute('aria-label') || e.getAttribute('data-titre') || '').startsWith(t));
  if (!b) return { ok: false, dit: `${t} absente` };
  const B = b.getBoundingClientRect(), cy = B.top + B.height / 2;
  const vis = [...document.querySelectorAll('section[data-rangee="brassins"] *')].filter(e => e.children.length === 0 && /prête/.test(e.textContent || '')).filter(e => {
    const r = document.createRange(); r.selectNodeContents(e); const q = r.getBoundingClientRect();
    return q.width > 0 && Math.abs(q.top + q.height / 2 - cy) < Math.max(14, B.height / 2 + 4) && q.left >= 0 && q.right <= innerWidth + 1;
  }).map(e => (e.textContent || '').trim());
  return { ok: vis.some(x => /prête (le )?\d{1,2} \p{L}+/u.test(x)), dit: `${t} : ${vis.length ? vis.map(x => `« ${x.slice(0, 40)} »`).join(' ') : 'aucun « prête » sur sa ligne'}` };
}, titre);
/** Le message (status/alert) ne couvre aucun nom de chose ni de rangée (CRITIQUE-9 n° 7, E33, D-200). */
function messageSansNom(p) { return p.evaluate(() => {
  const m = document.querySelector('[data-message]');
  if (!m) return { ok: false, dit: 'aucun message' };
  const M = m.getBoundingClientRect();
  const couverts = [...document.querySelectorAll('[data-calendrier] [data-barre] *, [data-calendrier] [data-chose] *, [data-nom-rangee], [data-rangee] .cal-nom')].filter(e => !m.contains(e) && e.children.length === 0 && /\S/.test(e.textContent || '')).filter(e => {
    const r = document.createRange(); r.selectNodeContents(e); const q = r.getBoundingClientRect();
    return q.width > 0 && q.left < M.right - 1 && q.right > M.left + 1 && q.top < M.bottom - 1 && q.bottom > M.top + 1;
  }).map(e => (e.textContent || '').trim().slice(0, 24));
  return { ok: couverts.length === 0, dit: couverts.length ? `le message (${m.dataset.place || '?'}) couvre : ${[...new Set(couverts)].slice(0, 5).join(' | ')}` : `rien de couvert (place ${m.dataset.place || '?'})` };
}); }
const MOIS_NUM = { 'janv.': 0, 'févr.': 1, mars: 2, 'avr.': 3, mai: 4, juin: 5, 'juil.': 6, 'août': 7, 'sept.': 8, 'oct.': 9, 'nov.': 10, 'déc.': 11 };
/** « 16 déc. » → jour de l'année suivant aujourd'hui (le banc est daté du jour) ; null si illisible. */
function jourDe(t) {
  const m = /(\d{1,2}) (janv\.|févr\.|mars|avr\.|mai|juin|juil\.|août|sept\.|oct\.|nov\.|déc\.)/u.exec(t || '');
  if (!m) return null;
  const j = new Date(); const an = MOIS_NUM[m[2]] < j.getMonth() - 1 ? j.getFullYear() + 1 : j.getFullYear();
  return Date.UTC(an, MOIS_NUM[m[2]], Number(m[1])) / 86400000;
}
/** La bande des semaines : les étiquettes visibles (texte « Snn »), leurs boîtes. */
function bandeLue(p) {
  return p.evaluate(() => [...document.querySelectorAll('[aria-label^="Semaines"] *')].filter(e => e.children.length === 0 && /^S\d+|^[A-ZÉ]$/.test((e.textContent || '').trim()) && e.getBoundingClientRect().width > 0).map(e => (e.textContent || '').trim()).join(' '));
}
async function bandeLisible(p) {
  return p.evaluate(() => {
    const els = [...document.querySelectorAll('[aria-label^="Semaines"] *')].filter(e => e.children.length === 0 && (e.textContent || '').trim() && e.getBoundingClientRect().width > 0 && getComputedStyle(e).visibility !== 'hidden');
    /* la boîte du texte lui-même (Range), pas celle de sa case : deux cases jointives ne se chevauchent pas, deux textes oui */
    const boites = els.map(e => { const r = document.createRange(); r.selectNodeContents(e); const b = r.getBoundingClientRect(); return { t: (e.textContent || '').trim(), g: b.left, d: b.right, h: b.top, b: b.bottom }; }).sort((a, b) => a.g - b.g);
    const chev = [];
    for (let i = 0; i < boites.length; i++) for (let j = i + 1; j < boites.length; j++) {
      const a = boites[i], c = boites[j];
      if (a.g < c.d - 0.5 && c.g < a.d - 0.5 && a.h < c.b - 0.5 && c.h < a.b - 0.5) chev.push(`${a.t}/${c.t}`);
    }
    return { ok: boites.length > 0 && chev.length === 0, dit: `${boites.length} étiquettes : « ${boites.map(b => b.t).join(' ').slice(0, 120)} » ; ${chev.length ? `chevauchent : ${chev.slice(0, 6).join(', ')}` : 'aucun chevauchement'}` };
  });
}
/** Les textes visibles (feuilles du DOM) dont la boîte croise celle du + volant. */
function sousLePlus(p) {
  return p.evaluate(() => {
    const f = document.querySelector('button[aria-label^="Actions rapides"]');
    if (!f) return ['+ introuvable'];
    const F = f.getBoundingClientRect();
    return [...document.querySelectorAll('[data-calendrier] *')].filter(e => e.children.length === 0 && /\S/.test(e.textContent || '') && !f.contains(e)).filter(e => {
      const r = document.createRange(); r.selectNodeContents(e); const b = r.getBoundingClientRect();
      return b.width > 0 && b.left < F.right && b.right > F.left && b.top < F.bottom && b.bottom > F.top;
    }).map(e => (e.textContent || '').trim().slice(0, 30));
  });
}
async function tirerPoignee(p, part, tenu) {
  const r = await trouver(p, { aria: /^Poignée de fin/ });
  const bord = await p.evaluate(() => { const s = [...document.querySelectorAll('svg')].map(x => x.getBoundingClientRect()).filter(b => b.width > 150).sort((a, b) => b.width - a.width)[0]; return s ? s.right : innerWidth; });
  await glisserXY(p, r.x, r.y, Math.max(10, (bord - r.x) * part + (part >= 1 ? 6 : 0)), 0, { tenu });
}
async function fenetreTravaux(p) {
  await ajouterDans(p, 'Travaux');
  await toucher(p, dansFeuille(/^Sols : colle et joints$|^Rénovation/));
  await toucher(p, dansFeuille(/^S20$/)); await toucher(p, dansFeuille(/^S40$/)); await toucher(p, dansFeuille(/^5 j$/));
}
async function toucherSiPresent(p, spec) { if (await existe(p, spec)) await toucher(p, spec); }
/** L'étoile sur la courbe (E31, D-37) : un élément de l'en-tête (zone collée, hors de la frise) qui nomme le Marché de Noël en étoile, ou porte ★. */
async function etoileSurCourbe(p) {
  return p.evaluate(() => {
    const zone = document.querySelector('[data-entete-zone]');
    if (!zone) return { ok: false, dit: 'en-tête introuvable' };
    const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const cands = [...zone.querySelectorAll('[data-etoile], [aria-label], title, text')].filter(e => {
      const t = `${e.getAttribute?.('data-etoile') ?? ''} ${e.getAttribute?.('aria-label') ?? ''} ${e.tagName === 'title' || e.tagName === 'text' ? e.textContent : ''}`;
      return /Marché de Noël/.test(t) && (/[Éé]toile|★/.test(t) || e.hasAttribute?.('data-etoile'));
    });
    const etoiles = [...zone.querySelectorAll('*')].filter(e => e.children.length === 0 && /★/.test(e.textContent || '') && vis(e));
    const e = cands[0] || etoiles[0];
    if (!e) return { ok: false, dit: 'aucune étoile dans l’en-tête' };
    const r = (e.closest?.('svg') && e.tagName !== 'svg' ? e : e).getBoundingClientRect();
    return { ok: true, dit: `étoile lue dans l’en-tête : « ${(e.getAttribute?.('aria-label') || e.textContent || e.getAttribute?.('data-etoile') || '').replace(/\s+/g, ' ').slice(0, 60)} » (${Math.round(r.left)}, ${Math.round(r.top)})` };
  });
}
/** Glisse la poignée de début de la fenêtre pour que la fenêtre commence à la prochaine semaine ISO `n` (52 semaines sur la largeur de la courbe). */
async function deplacerFenetreJusqua(p, n) {
  const cible = lundiSemaine(n);
  if (!cible) throw new Absent(`semaine S${n} hors de l’horizon`);
  const lundi = (() => { const j = new Date(); return new Date(Date.UTC(j.getFullYear(), j.getMonth(), j.getDate() - ((j.getDay() + 6) % 7))); })();
  const decalage = Math.round((Date.parse(cible) - lundi.getTime()) / (7 * 86400000));
  const r = await trouver(p, { aria: /^Poignée de début/ });
  const larg = await p.evaluate(() => { const s = [...document.querySelectorAll('[data-entete-zone] svg')].map(x => x.getBoundingClientRect()).filter(b => b.width > 150).sort((a, b) => b.width - a.width)[0]; return s ? s.width : innerWidth; });
  await glisserXY(p, r.x, r.y, (larg / 52) * decalage, 0);
  await attendre(500);
  const cadre = () => p.evaluate(() => document.querySelector('[aria-label^="Fenêtre :"]')?.getAttribute('aria-label') || 'cadre introuvable');
  let lu = await cadre();
  let clavier = 0;
  /* le doigt n'a pas tout fait (en 6 sem., la poignée est étroite) : la poignée de début suit aussi ← → (une semaine par touche) */
  if (!new RegExp(`: S${n}\\b`).test(lu)) {
    await p.evaluate(() => document.querySelector('[data-poignee="debut"]')?.focus());
    for (let k = 0; k < 52 && !new RegExp(`: S${n}\\b`).test(lu); k++) { await p.keyboard.press('ArrowRight'); clavier++; await attendre(60); lu = await cadre(); }
  }
  p.noteEtat = `${p.noteEtat ? `${p.noteEtat} ; ` : ''}poignée de début glissée de ${decalage} semaines (${Math.round((larg / 52) * decalage)} px)${clavier ? `, puis ${clavier} × → au clavier` : ''} ; ${lu}`;
}
/**
 * CRITIQUE-7 n° 3 (D-8, D-9, E24, E45) : la barre POSÉE de S20 à S40, pas « Sols : colle et joints, 22 févr., S8 », la barre de la fixture qui
 * porte le même nom. La posée se reconnaît à sa semaine de début (S20) dans son nom accessible ; elle doit être dans la frise, visible, avec
 * exactement 5 points (`[data-point]`, un par jour actif). Elle est amenée à l'écran (défilement vertical seulement) pour la capture.
 */
function barreTravauxPosee(p) {
  return p.evaluate(() => {
    const e = [...document.querySelectorAll('section[data-rangee="travaux"] [data-chose], section[data-rangee="travaux"] [data-barre]')]
      .find(x => /\bS20\b/.test(`${x.getAttribute('aria-label') || ''} ${x.getAttribute('data-titre') || ''}`));
    if (!e) return 'absente';
    const b = e.getBoundingClientRect();
    return `${Math.round(b.left)}/${Math.round(b.width)} · ${(e.getAttribute('aria-label') || '').slice(0, 110)} · ${e.querySelectorAll('[data-point]').length} point(s)`;
  });
}
async function barreTravauxVue(p) {
  return p.evaluate(() => {
    const e = [...document.querySelectorAll('section[data-rangee="travaux"] [data-chose], section[data-rangee="travaux"] [data-barre]')]
      .find(x => /\bS20\b/.test(`${x.getAttribute('aria-label') || ''} ${x.getAttribute('data-titre') || ''}`));
    if (!e) return { ok: false, dit: 'barre posée (S20) absente de la frise visible' };
    const r = e.getBoundingClientRect();
    if (r.top < 0 || r.bottom > innerHeight) { window.scrollBy(0, r.top - innerHeight / 2); }
    const b = e.getBoundingClientRect();
    const pts = [...e.querySelectorAll('[data-point]')];
    const points = pts.length;
    /* CRITIQUE-9 n° 2 (vision 11) : un point compte s'il se VOIT : rien ne le couvre en son centre (le nom de la barre, son fond) */
    /* elementFromPoint saute ce qui a `pointer-events: none` (le nom de la barre) : on compare aussi aux boîtes des textes de la barre */
    /* le nom peut être posé hors de l'élément de la barre (un frère, `pointer-events: none`) : tous les textes de la rangée */
    const noms = [...(e.closest('section[data-rangee]') || e).querySelectorAll('*')].filter(x => !x.closest('[data-point]') && x.children.length === 0 && /\S/.test(x.textContent || '')).map(x => { const r = document.createRange(); r.selectNodeContents(x); const q = x.getBoundingClientRect(); const t = r.getBoundingClientRect(); return { g: Math.min(q.left, t.left), d: Math.max(q.right, t.right), h: Math.min(q.top, t.top), b: Math.max(q.bottom, t.bottom) }; });
    const vus = pts.filter(x => {
      const q = x.getBoundingClientRect(); if (q.width <= 0) return false;
      const cx = q.left + q.width / 2, cy = q.top + q.height / 2;
      if (noms.some(n => cx >= n.g && cx <= n.d && cy >= n.h && cy <= n.b)) return false;
      const s = document.elementFromPoint(cx, cy); return !!s && (s === x || x.contains(s) || s.contains(x) || e.contains(s));
    }).length;
    const dans = b.width > 0 && b.left >= -1 && b.right <= innerWidth + 1;
    return { ok: dans && points === 5 && vus === 5, dit: `« ${(e.getAttribute('aria-label') || '').slice(0, 90)} », ${Math.round(b.left)} → ${Math.round(b.right)} px, ${points} point(s) dont ${vus} visible(s) (5 attendus) ; points x ${pts.map(x => { const q = x.getBoundingClientRect(); return `${Math.round(q.left + q.width / 2)},${Math.round(q.top + q.height / 2)}`; }).join(' ')} ; textes ${noms.map(n => `${Math.round(n.g)}–${Math.round(n.d)}/${Math.round(n.h)}–${Math.round(n.b)}`).join(' ')} ; <${e.tagName.toLowerCase()} ${e.hasAttribute('data-barre') ? 'data-barre' : 'data-chose'}>` };
  });
}
/** L'idée datée (E36) : le champ « L’idée, en quelques mots » touché (le clavier s'ouvre : une idée s'écrit), le texte, puis le bouton de la feuille. */
async function noterIdee(p, texte) {
  await toucher(p, dansFeuille(/L’idée, en quelques mots/));
  await taper(p, texte);
  await toucher(p, boutonFeuille(/^(Noter|Ajouter|Enregistrer)/));
}

/* ------------------------------------------------------------------ jouer un état */

const rapport = [];
const chrono = [];
const parcours = [];

async function jugerAttendu(p, etat) {
  const texte = await lireTexte(p);
  const manques = [];
  for (const a of etat.attendu || []) {
    if (a instanceof RegExp) { if (!a.test(texte)) manques.push(`« ${a.source} »`); continue; }
    const r = await a(p);
    if (r && typeof r === 'object') { if (!r.ok) manques.push(`${a.dit} (${r.dit})`); }
    else if (!r) manques.push(a.dit);
  }
  const interdits = (etat.interdit || []).filter(re => re.test(texte)).map(re => `« ${re.source} »`);
  return { manques, interdits };
}

async function jouerEtat(cfgNom, theme, etat) {
  const cfg = CONFIGS[cfgNom];
  const base = `${cfgNom}-${theme}-${etat.n}-${etat.nom}`;
  const so = etat.sansObjet ? etat.sansObjet(cfg) : null;
  if (so) { rapport.push({ cfgNom, theme, n: etat.n, nom: etat.nom, geste: etat.geste, statut: 'SANS OBJET', dit: so, capture: '—' }); return; }
  let p;
  try {
    p = await ouvrir(cfg, theme, BANC);
    p.cfgNom = cfgNom;
    let statut = 'OK', dit = '';
    try {
      /* CRITIQUE-5 n° 20 : le geste doit changer ce qu'il vise ; sa mesure propre (`mesure`), sinon la signature de l'écran */
      const mesurer = etat.mesure || signature;
      const avant = etat.repos ? null : await mesurer(p);
      const cleAvant = etat.repos ? null : await chiffreCle(p);
      await etat.jouer(p);
      await attendre(350);
      if (!etat.repos) {
        const apres = await mesurer(p);
        if (apres === avant) { statut = 'ECHEC'; dit = `aucun changement mesuré (${etat.mesure ? 'mesure de l’état' : 'signature de l’écran'} : « ${String(avant).slice(0, 90)} ») : capture identique au repos`; }
        else if (etat.mesure) p.noteEtat = `${p.noteEtat ? `${p.noteEtat} ; ` : ''}mesuré : « ${String(avant).slice(0, 90)} » → « ${String(apres).slice(0, 90)} »`;
        if (etat.chiffre) { const cleApres = await chiffreCle(p); p.noteEtat = `${p.noteEtat ? `${p.noteEtat} ; ` : ''}chiffre clé : « ${cleAvant} » → « ${cleApres} »`; }
      }
      const { manques, interdits } = await jugerAttendu(p, etat);
      if (manques.length) { statut = statut === 'OK' ? 'ABSENT' : `${statut} + ABSENT`; dit += `${dit ? ' ; ' : ''}attendu non trouvé : ${manques.join(', ')}`; }
      if (interdits.length) { statut = statut === 'OK' ? 'INTERDIT' : `${statut} + INTERDIT`; dit += `${dit ? ' ; ' : ''}texte refusé présent : ${interdits.join(', ')}`; }
      if (!dit) dit = `attendu trouvé : ${(etat.attendu || []).map(a => (a instanceof RegExp ? `« ${a.source} »` : a.dit)).join(', ')}`;
    } catch (e) {
      statut = 'ABSENT'; dit = e instanceof Absent ? e.message : `erreur du geste : ${String(e.message || e).slice(0, 160)}`;
    }
    if (p.noteEtat) dit += ` (${p.noteEtat})`;
    const nomFichier = `${base}${statut === 'OK' ? '' : '-ECHEC'}.png`;
    await p.screenshot({ path: join(DOSSIER, nomFichier) });
    if (etat.fin && p.doigt) await etat.fin(p).catch(() => {});
    const err = p.erreurs.length ? ` ; ${p.erreurs.length} erreur(s) de console : ${p.erreurs[0]}` : '';
    rapport.push({ cfgNom, theme, n: etat.n, nom: etat.nom, geste: etat.geste, statut, dit: dit + err, capture: nomFichier });
    console.log(`${statut === 'OK' ? 'ok' : statut} ${base} : ${dit.slice(0, 140)}`);
  } catch (e) {
    rapport.push({ cfgNom, theme, n: etat.n, nom: etat.nom, geste: etat.geste, statut: 'ABSENT', dit: `page non ouverte : ${String(e.message || e).slice(0, 160)}`, capture: '—' });
    console.log(`ABSENT ${base} : page non ouverte`);
  } finally {
    if (p) await p.ctx.close().catch(() => {});
  }
}

/* ------------------------------------------------------------------ /?dev-local : l'onglet dans l'app, et ET-PER */

/**
 * CRITIQUE-6 n° 13 : « Impossible de charger la brasserie » est l'écran de `bootstrap()` (main.tsx) quand `import('./App')` échoue. Sous
 * `npm run dev`, cela arrive quand Vite réoptimise ses dépendances pendant le démarrage (« new dependencies optimized … reloading ») : le
 * scan des dépendances échoue sur `prototypes/houblons-v4` (alias `@app/…` non résolus), et `node_modules` (lien vers ports-nuit) est
 * partagé par d'autres serveurs, qui réécrivent le même `node_modules/.vite`. Le harnais attend la fin du démarrage (40 s), dit la console
 * et, en échec, capture `<nom>-demarrage-ECHEC.png` puis recharge une fois : jamais un échec muet, jamais un « OK » caché.
 */
async function demarrageApp(p, nom) {
  const lire = () => p.evaluate(() => (/Impossible de charger la brasserie/.test(document.body.innerText) ? 'echec' : document.querySelector('nav') ? 'ok' : 'attente')).catch(() => 'attente');
  const t0 = Date.now();
  let etat = 'attente';
  for (let i = 0; i < 80 && etat === 'attente'; i++) { etat = await lire(); if (etat === 'attente') await attendre(500); }
  if (etat === 'ok') return `app démarrée en ${Date.now() - t0} ms${p.erreurs.length ? ` (console : ${p.erreurs.slice(0, 2).join(' / ')})` : ''}`;
  const console1 = p.erreurs.slice(0, 4).join(' / ') || 'console vide';
  await p.screenshot({ path: join(DOSSIER, `${nom}-demarrage-ECHEC.png`) }).catch(() => {});
  await charger(p, null);
  etat = 'attente';
  for (let i = 0; i < 80 && etat === 'attente'; i++) { etat = await lire(); if (etat === 'attente') await attendre(500); }
  return `PREMIER DÉMARRAGE EN ÉCHEC (« ${etat === 'echec' ? 'Impossible de charger la brasserie' : 'rien'} », console : ${console1} ; capture ${nom}-demarrage-ECHEC.png), rechargé une fois : ${etat === 'ok' ? 'app démarrée' : 'toujours en échec'}`;
}

/**
 * E07, ET-PER (CRITIQUE-6 n° 11) : la période de l'app (`app_global_time_filter`, lue par la barre de l'app) et la fenêtre du calendrier sont
 * la même. Un mois : le bouton du calendrier dit le libellé de la barre (« Nov. »). Une plage : ses semaines ISO sont celles du cadre (« S47 – S52 »).
 */
async function memePeriode(p) {
  return p.evaluate(async () => {
    const { StorageService } = await import('/src/services/storage.ts');
    const brut = StorageService.getUiState('app_global_time_filter', null);
    const txt = s => (document.querySelector(s)?.textContent || '').replace(/\s+/g, ' ').trim();
    const app = txt('[data-periode-pastille]');
    const cal = txt('[data-ent-periode]');
    /* les semaines de la frise : la bande (« S47 … S52 ») ; sans solde de départ, il n'y a pas de courbe ni de cadre, la bande reste */
    const bande = [...document.querySelectorAll('[aria-label^="Semaines"] button, [aria-label^="Semaines"] [role="button"]')].map(b => (b.textContent || '').trim()).filter(t => /^S\d+$/.test(t));
    const frise = `${bande[0] || '?'} – ${bande[bande.length - 1] || '?'} (${document.querySelector('[data-frise]')?.getAttribute('data-nb-colonnes') ?? '?'} colonnes)`;
    const iso = d => { const t = new Date(Date.parse(d) + 3 * 86400000); const a = new Date(Date.UTC(t.getUTCFullYear(), 0, 4)); return 1 + Math.round(((t - a) / 86400000 - 3 + ((a.getUTCDay() + 6) % 7)) / 7); };
    const m = typeof brut === 'string' ? /^range-(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})$/.exec(brut) : null;
    let ok;
    /* `au` est un dimanche : sa semaine est celle de son lundi (au − 6 j) */
    if (m) ok = bande[0] === `S${iso(m[1])}` && bande[bande.length - 1] === `S${iso(new Date(Date.parse(m[2]) - 6 * 86400000).toISOString().slice(0, 10))}`;
    else ok = !!cal && !!app && (app === cal || app.includes(cal) || cal.includes(app));
    return { ok, dit: `période de l’app « ${JSON.stringify(brut)} », barre de l’app « ${app || 'non visible'} », bouton du calendrier « ${cal} », frise ${frise}` };
  });
}

async function ongletApp(p, nom) { await toucher(p, { dans: { aria: /^Navigation principale/ }, texte: new RegExp(`^${nom}$`) }); await attendre(800); }

async function devLocal(cfgNom, theme) {
  const cfg = CONFIGS[cfgNom];
  /* 56 : Bord → Calendrier, données vides, 7 rangées, le + reste la voie d'ajout */
  let p;
  const base56 = `${cfgNom}-${theme}-56-dev-local-onglet`;
  try {
    p = await ouvrir(cfg, theme, APP, { coupeFirestore: true });
    let statut = 'OK', dit;
    const demarrage = await demarrageApp(p, `${cfgNom}-${theme}-56`);
    try {
      await ongletApp(p, 'Bord'); await ongletApp(p, 'Calendrier');
      const m = await p.evaluate(() => ({
        rangees: document.querySelectorAll('section[data-rangee]').length,
        vides: (document.body.innerText.match(/\bvide\b/g) || []).length,
        plus: !!document.querySelector('button[aria-label^="Actions rapides"]'),
        exemple: /exemple/i.test(document.body.innerText)
      }));
      dit = `${m.rangees} rangées, ${m.vides} « vide », + volant ${m.plus ? 'présent' : 'absent'}, « exemple » ${m.exemple ? 'présent' : 'absent'}`;
      if (m.rangees !== 7 || !m.plus || m.exemple) statut = 'ABSENT';
    } catch (e) { statut = 'ABSENT'; dit = e instanceof Absent ? e.message : String(e.message || e).slice(0, 160); }
    if (statut === 'OK' && demarrage.startsWith('PREMIER')) statut = 'OK APRÈS RECHARGEMENT';
    const f = `${base56}${statut === 'OK' ? '' : '-ECHEC'}.png`;
    await p.screenshot({ path: join(DOSSIER, f) });
    rapport.push({ cfgNom, theme, n: '56', nom: 'dev-local-onglet', geste: '/?dev-local, Bord puis Calendrier', statut, dit: `${dit} ; démarrage : ${demarrage} ; requêtes Firestore coupées : ${p.coupees}`, capture: f });
    console.log(`${statut === 'OK' ? 'ok' : statut} ${base56} : ${dit}`);
  } catch (e) {
    rapport.push({ cfgNom, theme, n: '56', nom: 'dev-local-onglet', geste: '/?dev-local', statut: 'ABSENT', dit: `page non ouverte : ${String(e.message || e).slice(0, 160)}`, capture: '—' });
  } finally { if (p) await p.ctx.close().catch(() => {}); }
}

/** ET-PER (n° 24, D-12 à D-14) : deux opérations « ZZ TEST » saisies par l'interface, 3 mois au calendrier, puis Finances filtre sur la plage. */
async function etPer(cfgNom, theme) {
  const cfg = CONFIGS[cfgNom];
  const base33 = `${cfgNom}-${theme}-33-finances-plage`;
  let p; const pas = [];
  try {
    p = await ouvrir(cfg, theme, APP, { coupeFirestore: true });
    const auj = new Date();
    const iso = d => d.toISOString().slice(0, 10);
    const dans = iso(auj), hors = iso(new Date(auj.getTime() + 200 * 86400000));
    for (const [libelle, jour] of [['ZZ TEST — dans la plage', dans], ['ZZ TEST — hors plage', hors]]) {
      await toucher(p, FAB);
      await toucher(p, dansFeuille(/^Écriture/));
      const rempli = await p.evaluate((lib, j) => {
        const d = [...document.querySelectorAll('[role="dialog"], dialog')].filter(x => x.getBoundingClientRect().height > 0).pop();
        if (!d) return 'aucune feuille';
        const pose = (el, v) => { const s = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set; s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
        const champs = [...d.querySelectorAll('input, textarea')].filter(i => i.getBoundingClientRect().height > 0);
        const texte = champs.find(i => (i.type === 'text' || i.tagName === 'TEXTAREA') && !/decimal|numeric/.test(i.inputMode) && !/date|jj/i.test(`${i.placeholder} ${i.name} ${i.getAttribute('aria-label') || ''}`));
        const montant = champs.find(i => /decimal|numeric/.test(i.inputMode));
        const date = champs.find(i => i.type === 'date') || champs.find(i => /date|jj/i.test(`${i.placeholder} ${i.name} ${i.getAttribute('aria-label') || ''}`));
        if (!texte || !montant || !date) return `champs introuvables (texte ${!!texte}, montant ${!!montant}, date ${!!date})`;
        pose(texte, lib); pose(montant, '12');
        pose(date, date.type === 'date' ? j : `${j.slice(8, 10)}.${j.slice(5, 7)}.${j.slice(0, 4)}`);
        return 'ok';
      }, libelle, jour);
      if (rempli !== 'ok') throw new Absent(`écriture « ${libelle} » : ${rempli}`);
      await toucher(p, dansFeuille(/^(Enregistrer|Ajouter|Valider)/));
      pas.push(`« ${libelle} » saisie le ${jour}`);
    }
    await ongletApp(p, 'Calendrier');
    await menuPeriode(p, /^3 mois/); pas.push('3 mois au calendrier');
    await p.keyboard.press('Escape'); await attendre(300);
    await ongletApp(p, 'Finances'); pas.push('Finances ouvert');
    const t = await lireTexte(p);
    const plage = /\d{1,2} \p{L}+\.? → \d{1,2} \p{L}+/u.test(t), dansVu = /ZZ TEST — dans la plage/.test(t), horsVu = /ZZ TEST — hors plage/.test(t);
    const ok = plage && dansVu && !horsVu;
    const f = `${base33}${ok ? '' : '-ECHEC'}.png`;
    await p.screenshot({ path: join(DOSSIER, f) });
    rapport.push({ cfgNom, theme, n: '33', nom: 'finances-plage', geste: `/?dev-local : ${pas.join(', ')}`, statut: ok ? 'OK' : 'ABSENT',
      dit: `plage affichée ${plage}, « dans la plage » listée ${dansVu}, « hors plage » listée ${horsVu} ; requêtes Firestore coupées : ${p.coupees}`, capture: f });
  } catch (e) {
    let f = '—';
    if (p) { f = `${base33}-ECHEC.png`; await p.screenshot({ path: join(DOSSIER, f) }).catch(() => {}); }
    rapport.push({ cfgNom, theme, n: '33', nom: 'finances-plage', geste: `/?dev-local : ${pas.join(', ') || 'rien'}`, statut: 'ABSENT', dit: e instanceof Absent ? e.message : String(e.message || e).slice(0, 160), capture: f });
  } finally { if (p) await p.ctx.close().catch(() => {}); }
}

/* ------------------------------------------------------------------ CRITIQUE-4 n° 5, 9, 13 c (lot q4-app) : l'app réelle et la feuille du banc */

/**
 * N° 5 : au premier Finances d'un serveur Vite neuf, Vite découvre `react-virtuoso` (chunk de Finances), réoptimise ses dépendances et recharge
 * la page (« optimized dependencies changed. reloading ») ; un autre serveur qui partage `node_modules/.vite` peut aussi invalider le cache.
 * Le banc chauffe donc Finances une fois, attend `.finance` 30 s au plus, recharge une fois s'il le faut, et dit le temps : jamais 25 s muettes.
 */
async function chaufferFinances(p) {
  const t0 = Date.now();
  for (let essai = 0; essai < 2; essai++) {
    await ongletApp(p, 'Finances').catch(() => {});
    for (let i = 0; i < 60; i++) { if (await p.evaluate(() => !!document.querySelector('.finance')).catch(() => false)) return `Finances monté en ${Date.now() - t0} ms${essai ? ' (après un rechargement)' : ''}`; await attendre(500); }
    await charger(p, null);
  }
  throw new Absent(`Finances toujours en « Chargement de l’écran… » après ${Math.round((Date.now() - t0) / 1000)} s et un rechargement`);
}
/** Un champ d'une feuille rempli comme au clavier (le setter natif, puis input et change). */
const remplir = (p, aria, valeur) => p.evaluate((a, v) => {
  const d = [...document.querySelectorAll('[role="dialog"], dialog')].filter(x => x.getBoundingClientRect().height > 0).pop();
  const c = d && [...d.querySelectorAll('input, textarea')].find(i => (i.getAttribute('aria-label') || i.placeholder || '').startsWith(a));
  if (!c) return false;
  const s = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(c), 'value').set; s.call(c, v);
  c.dispatchEvent(new Event('input', { bubbles: true })); c.dispatchEvent(new Event('change', { bubbles: true })); c.dispatchEvent(new Event('blur', { bubbles: true }));
  return true;
}, aria, valeur);
/** Le lundi de la prochaine semaine ISO `n`, depuis aujourd'hui (le même calcul que la fixture). */
function lundiSemaine(n) {
  const j = new Date(); const l = new Date(Date.UTC(j.getFullYear(), j.getMonth(), j.getDate() - ((j.getDay() + 6) % 7)));
  for (let k = 0; k <= 53; k++) {
    const d = new Date(l.getTime() + k * 7 * 86400000); const t = new Date(d.getTime() + 3 * 86400000);
    const a = new Date(Date.UTC(t.getUTCFullYear(), 0, 4)); const num = 1 + Math.round(((t - a) / 86400000 - 3 + ((a.getUTCDay() + 6) % 7)) / 7);
    if (num === n) return d.toISOString().slice(0, 10);
  }
  return null;
}

/** Une capture nommée de ce qu'elle montre ; `-ECHEC` si le texte attendu n'est pas dans le DOM. */
async function capturer(p, nom, attendu, geste, extra = '') {
  const texte = await lireTexte(p);
  const manques = [];
  const lus = [];
  for (const a of attendu) {
    if (a instanceof RegExp) { if (!a.test(texte)) manques.push(`« ${a.source} »`); continue; }
    const r = await a(p);
    if (r && typeof r === 'object') { lus.push(r.dit); if (!r.ok) manques.push(`${a.dit} (${r.dit})`); } else if (!r) manques.push(a.dit);
  }
  if (lus.length) extra = `${extra ? `${extra} ; ` : ''}lu : ${lus.join(' ; ')}`;
  const statut = manques.length ? 'ABSENT' : 'OK';
  const f = `${nom}${manques.length ? '-ECHEC' : ''}.png`;
  await p.screenshot({ path: join(DOSSIER, f) });
  const dit = `${manques.length ? `attendu non trouvé : ${manques.join(', ')}` : `attendu trouvé : ${attendu.map(a => (a instanceof RegExp ? `« ${a.source} »` : a.dit)).join(', ')}`}${extra ? ` ; ${extra}` : ''} ; requêtes Firestore coupées : ${p.coupees ?? 0}${p.erreurs && p.erreurs.length ? ` ; ${p.erreurs.length} erreur(s) de page : ${p.erreurs[0]}` : ''}`;
  rapport.push({ cfgNom: p.cfg.w === 1280 ? 'd1280' : p.cfg.w > p.cfg.h ? 'paysage' : 'm390', theme: p.theme, n: 'app', nom, geste, statut, dit, capture: f });
  console.log(`${statut === 'OK' ? 'ok' : statut} ${nom} : ${dit.slice(0, 160)}`);
  return statut === 'OK';
}
async function etape(p, nom, geste, faire, attendu, extra) {
  try { await faire(); return await capturer(p, nom, attendu, geste, typeof extra === 'function' ? extra() : extra); }
  catch (e) {
    const f = `${nom}-ECHEC.png`;
    await p.screenshot({ path: join(DOSSIER, f) }).catch(() => {});
    rapport.push({ cfgNom: p.cfg.w === 1280 ? 'd1280' : 'm390', theme: p.theme, n: 'app', nom, geste, statut: 'ABSENT', dit: e instanceof Absent ? e.message : String(e.message || e).slice(0, 160), capture: f });
    console.log(`ABSENT ${nom} : ${String(e.message || e).slice(0, 140)}`);
    return false;
  }
}

/**
 * N° 9 (D-33, D-45, D-49, D-68, D-71, E38) : dans /?dev-local, données locales seulement, nommées « ZZ TEST — … ». La recette du brassin est une
 * fixture (dev-local démarre sans recette, et la feuille Brassins ne pose qu'une recette de l'app) ; le brassin, la prévision et le reste se font
 * par les gestes de l'app. Gemini n'est jamais appelé (les requêtes vers ses hôtes sont coupées comme Firestore).
 */
async function parcoursApp(theme) {
  let p;
  const RECETTE = 'ZZ TEST — Blonde du banc';
  try {
    p = await ouvrir(CONFIGS.m390, theme, APP, { coupeFirestore: true });
    const demarrage = await demarrageApp(p, `m390-${theme}-app`);
    const chaud = `${demarrage} ; ${await chaufferFinances(p)}`;
    await ongletApp(p, 'Calendrier');
    await p.waitForSelector('[data-frise]', { timeout: 20000 });
    /* CRITIQUE-6 n° 11 (E07 ET-PER, D-12, D-13) : à 390, la barre de l'app et le calendrier disent la même période. D'abord la période de
       l'app au démarrage (le mois en cours) ; puis « 6 sem. » choisi au calendrier, que la barre de l'app doit reprendre. */
    await etape(p, `devlocal-periode-390-mois-${theme}`, 'Calendrier ouvert, période de l’app au démarrage (le mois) : lire la barre de l’app et le calendrier', async () => { await p.evaluate(() => window.scrollTo(0, 0)); await attendre(300); },
      [fn(memePeriode, 'même période dans la barre de l’app et dans le calendrier')]);
    await etape(p, `devlocal-periode-390-6sem-${theme}`, 'au calendrier, période « 6 sem. » : lire la barre de l’app et le calendrier', async () => {
      await menuPeriode(p, /^6 sem/); await p.keyboard.press('Escape').catch(() => {}); await attendre(500); await p.evaluate(() => window.scrollTo(0, 0)); await attendre(300);
    }, [fn(memePeriode, 'même période dans la barre de l’app et dans le calendrier')]);
    await p.evaluate(async nom => {
      const { StorageService } = await import('/src/services/storage.ts');
      StorageService.addRecipe({ id: 'ZZ-TEST-RECETTE', name: nom, style: 'Blonde', volumeL: 100, ingredients: [], fermentables: [{ name: 'Malt pilsner', weightKg: 20 }], hops: [{ name: 'Saaz', weightG: 250, stage: 'boil', time: 60 }], ogTarget: 1.048 });
      /* CRITIQUE-5 n° 17 : les Courses ne listent que des articles du stock (`articlesACommander`, appariés par nom) ; dev-local démarre sans
         article, d'où « Rien à commander » malgré 20 kg de malt à acheter. Deux articles ZZ TEST, au stock bas, locaux seulement. */
      StorageService.addStockItem('rawMaterials', { id: 'ZZ-TEST-MALT', ref: 'ZZ-TEST-MALT', name: 'Malt pilsner', category: 'Malt', unit: 'kg', currentStock: 2, minStock: 0, notes: 'ZZ TEST — dev-local' });
      StorageService.addStockItem('rawMaterials', { id: 'ZZ-TEST-SAAZ', ref: 'ZZ-TEST-SAAZ', name: 'Saaz', category: 'Houblon', unit: 'g', currentStock: 0, minStock: 0, notes: 'ZZ TEST — dev-local' });
    }, RECETTE);
    await attendre(800);
    const lundi50 = lundiSemaine(50);
    await etape(p, 'devlocal-calendrier-sources-zz-test', `${chaud} ; recette « ${RECETTE} » posée en fixture ; + Brassins, puce de la recette, Ajouter ; + Achats, S50, Plus de détails ›, « ZZ TEST — houblon Citra » 240 CHF, Enregistrer`, async () => {
      await ajouterDans(p, 'Brassins'); await toucher(p, dansFeuille(new RegExp(`^${RECETTE}`))); await toucher(p, boutonFeuille(/^Ajouter/));
      await attendre(600);
      await ajouterDans(p, 'Achats'); await toucher(p, dansFeuille(/^S50/)); await toucher(p, dansFeuille(/^Plus de détails/));
      await p.waitForFunction(() => [...document.querySelectorAll('[role="dialog"]')].some(d => /Prévoir une dépense/.test(d.textContent || '')), { timeout: 15000 });
      if (!(await remplir(p, 'Loyer, commande', 'ZZ TEST — houblon Citra')) || !(await remplir(p, 'Montant', '240'))) throw new Absent('champs Libellé ou Montant introuvables dans Prévoir une dépense');
      await toucher(p, { dans: { role: 'dialog', texte: /Prévoir une dépense/ }, texte: /^Enregistrer$/, role: 'button' });
      await attendre(900);
    }, [new RegExp(RECETTE), /ZZ TEST — houblon Citra/, fn(async q => q.evaluate(n => [...document.querySelectorAll('section[data-rangee="brassins"] [data-chose]')].some(e => (e.getAttribute('data-titre') || e.getAttribute('aria-label') || '').startsWith(n)), RECETTE), 'le brassin dans la rangée Brassins'),
      fn(async q => q.evaluate(() => [...document.querySelectorAll('section[data-rangee="achats"] [data-chose]')].some(e => /ZZ TEST — houblon Citra/.test(e.getAttribute('data-titre') || e.getAttribute('aria-label') || ''))), 'la prévision dans la rangée Achats')]);
    await etape(p, 'devlocal-budget-brassin-feuille', `toucher le brassin « ${RECETTE} », puis Budget ›`, async () => {
      await toucher(p, { titre: RECETTE }); await toucher(p, { texte: /^Budget ›/ });
      await p.waitForFunction(n => [...document.querySelectorAll('[role="dialog"]')].some(d => (d.getAttribute('aria-labelledby') ? (document.getElementById(d.getAttribute('aria-labelledby'))?.textContent || '') : d.textContent || '').includes(n)), { timeout: 15000 }, RECETTE).catch(() => {});
    }, [fn(async q => q.evaluate(n => [...document.querySelectorAll('[role="dialog"]')].some(d => (d.textContent || '').includes(n)), RECETTE), 'la feuille de budget porte le nom du brassin'), fn(async q => q.evaluate(() => !/l’app ouvrirait/.test(document.body.innerText)), 'aucune ligne du banc')]);
    await p.keyboard.press('Escape'); await attendre(500);
    await etape(p, 'devlocal-plus-de-details-prevoir-une-depense-S50', '+ Achats, S50, Plus de détails ›', async () => {
      await ajouterDans(p, 'Achats'); await toucher(p, dansFeuille(/^S50/)); await toucher(p, dansFeuille(/^Plus de détails/));
      await p.waitForFunction(() => [...document.querySelectorAll('[role="dialog"]')].some(d => /Prévoir une dépense/.test(d.textContent || '')), { timeout: 15000 });
    }, [/Prévoir une dépense/, fn(async q => q.evaluate(l => [...document.querySelectorAll('input[type="date"]')].some(i => i.value === l), lundi50), `date = lundi de S50 (${lundi50})`),
      fn(async q => q.evaluate(() => { const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }; const d = [...document.querySelectorAll('[role="dialog"]')].filter(vis).filter(x => /Prévoir une dépense/.test(x.textContent || '')).pop(); const s = d ? d.querySelector('select[aria-label="Catégorie"]') : null; const lu = s ? (s.options[s.selectedIndex]?.textContent || s.value) : 'introuvable'; return { ok: !!s && s.value === 'brassage', dit: `catégorie affichée « ${lu} » (${s ? s.value : '—'}) sur ${document.querySelectorAll('select[aria-label="Catégorie"]').length} sélecteur(s)` }; }), 'catégorie « Brassage » (achat de matières, CRITIQUE-5 n° 3)')]);
    /* CRITIQUE-5 n° 18 (E07) : à 390, la pastille de période de l'app et le bouton de période du calendrier disent la même période */
    /* CRITIQUE-7 : la capture ECHEC montrait « Prévoir une dépense » par-dessus. La feuille est fermée (son ×, sinon Échap) avant de lire. */
    await etape(p, 'devlocal-periode-app-et-calendrier-390', 'fermer « Prévoir une dépense » ; lire la pastille de l’app et la période du calendrier', async () => {
      for (let k = 0; k < 3 && await p.evaluate(() => [...document.querySelectorAll('[role="dialog"]')].some(d => d.getBoundingClientRect().height > 0 && /Prévoir une dépense/.test(d.textContent || ''))); k++) {
        if (await existe(p, { dans: { role: 'dialog', texte: /Prévoir une dépense/ }, role: 'button', aria: /^Fermer/ })) await toucher(p, { dans: { role: 'dialog', texte: /Prévoir une dépense/ }, role: 'button', aria: /^Fermer/ });
        else { await p.keyboard.press('Escape').catch(() => {}); await attendre(500); }
      }
      await attendre(400); await p.evaluate(() => window.scrollTo(0, 0)); await attendre(300);
    }, [fn(async q => q.evaluate(() => ![...document.querySelectorAll('[role="dialog"]')].some(d => d.getBoundingClientRect().height > 0 && /Prévoir une dépense/.test(d.textContent || ''))), '« Prévoir une dépense » fermée'),
      fn(memePeriode, 'même période dans la barre de l’app et dans le calendrier')]);
    await p.keyboard.press('Escape'); await attendre(500);
    /* doute de la critique 6 : « ⏰1 » dans l'app presque vide. Le détail des retards dit d'où il vient. */
    await etape(p, `devlocal-retards-detail-${theme}`, 'toucher le badge des retards (⏰) du calendrier', async () => {
      if (!(await existe(p, { aria: /retard/i }))) { p.noteRetards = 'aucun badge de retard'; return; }
      await toucher(p, { aria: /retard/i }); await attendre(400);
      p.noteRetards = await p.evaluate(() => [...document.querySelectorAll('[role="dialog"], [role="region"], [data-retards]')].map(d => (d.textContent || '').replace(/\s+/g, ' ')).filter(t => /retard|Maintenant/i.test(t)).join(' | ').slice(0, 300) || 'détail introuvable');
    }, [fn(async () => ({ ok: true, dit: p.noteRetards }), 'le détail des retards est lu')]);
    await p.keyboard.press('Escape'); await attendre(500);
    await etape(p, 'devlocal-commander-courses', `toucher le brassin « ${RECETTE} », puis Commander ; attendre la fin de « Chargement de l’écran… » (20 s au plus)`, async () => {
      await toucher(p, { titre: RECETTE }); await toucher(p, { texte: /^Commander/ });
      const t0 = Date.now();
      await p.waitForFunction(() => !/Chargement de l’écran/.test(document.body.innerText) && !document.querySelector('[data-frise]'), { timeout: 20000 }).catch(() => {});
      await attendre(800);
      p.noteEtat = `Courses montées en ${Date.now() - t0} ms`;
    }, [/Courses/, fn(async q => q.evaluate(() => !document.querySelector('[data-frise]')), 'le calendrier a laissé place aux Courses'),
      fn(async q => q.evaluate(() => !/Rien à commander/.test(document.body.innerText)), 'pas « Rien à commander »'), /Malt pilsner/]);
    /*
     * CRITIQUE-9 (D-75, D-77, D-108, E37) : « Payé » d'un toucher par la VRAIE pièce de l'app. Le banc ne la monte pas : ses feuilles écrivent par
     * StorageService / FirestoreRepo, qui hors /?dev-local partent vers Firestore (données réelles) ; elle se prouve donc ici, sur une facture de
     * malt « ZZ TEST » locale (cache dev-local, requêtes Firestore coupées), touchée dans la rangée Achats.
     */
    await ongletApp(p, 'Calendrier'); await p.waitForSelector('[data-frise]', { timeout: 20000 });
    await etape(p, `devlocal-piece-facture-payee-${theme}`, 'facture de malt « ZZ TEST — malt Brouwland » (cache local), toucher sa chose dans Achats', async () => {
      await p.evaluate(async echeance => {
        const { StorageService } = await import('/src/services/storage.ts');
        StorageService.addTransaction({ id: 'ZZ-TEST-FACTURE-MALT', date: new Date().toISOString().slice(0, 10), description: 'ZZ TEST — malt Brouwland', category: 'brassage', subcategory: 'malt', amountHT: 420, amountTTC: 420, tvaAmount: 0, tvaRate: 0, finance: { version: 1, kind: 'expense', amountCents: 42000, lines: [], paymentStatus: 'unpaid', dueDate: echeance, vendor: 'ZZ TEST — Brouwland' } });
      }, new Date(Date.now() + 9 * 864e5).toISOString().slice(0, 10));
      await attendre(900);
      await toucher(p, { titre: 'ZZ TEST — malt Brouwland' });
      await attendre(400);
      if (await existe(p, { role: 'button', texte: /^(Payé|Ouvrir la pièce|Pièce)/ })) await toucher(p, { role: 'button', texte: /^(Payé|Ouvrir la pièce|Pièce)/ });
      await p.waitForFunction(() => !document.querySelector('[data-frise]'), { timeout: 15000 }).catch(() => {});
      await attendre(1200);
    }, [fn(async q => q.evaluate(() => !document.querySelector('[data-frise]') && !!document.querySelector('.finance')), 'Finances a remplacé le calendrier'), /ZZ TEST — malt Brouwland/, /Noter un paiement/, /À payer/, fn(async q => q.evaluate(() => !/l’app ouvrirait/.test(document.body.innerText)), 'aucune fiche de remplacement du banc')]);
  } catch (e) {
    rapport.push({ cfgNom: 'm390', theme, n: 'app', nom: 'devlocal', geste: '/?dev-local', statut: 'ABSENT', dit: e instanceof Absent ? e.message : String(e.message || e).slice(0, 160), capture: '—' });
    console.log(`ABSENT devlocal : ${String(e.message || e).slice(0, 160)}`);
  } finally { if (p) await p.ctx.close().catch(() => {}); }
}

/** ET-PER au 1280 (parcours 6, D-12 à D-14, D-78) : 3 mois au calendrier → la plage dans Finances ; une fin réglée dans Opérations → la fenêtre. */
async function plageApp(theme) {
  let p;
  try {
    p = await ouvrir(CONFIGS.d1280, theme, APP, { coupeFirestore: true });
    const chaud = await chaufferFinances(p);
    await ongletApp(p, 'Calendrier'); await p.waitForSelector('[data-frise]', { timeout: 20000 });
    await menuPeriode(p, /^3 mois/); await p.keyboard.press('Escape'); await attendre(300);
    const plage = await p.evaluate(() => { const f = document.querySelector('[data-frise]'); return f ? f.getAttribute('data-nb-colonnes') : null; });
    await etape(p, `d1280-${theme}-finances-plage-du-calendrier`, `${chaud} ; Calendrier, période 3 mois (${plage} semaines), puis Finances › Opérations`, async () => {
      await ongletApp(p, 'Finances'); await toucher(p, { role: 'tab', texte: /^Opérations$/ }); await attendre(600);
    }, [/\d{1,2} \p{L}+\.?( \d{4})? → \d{1,2} \p{L}+/u, fn(async q => q.evaluate(() => { const d = document.querySelector('input[aria-label="Du"]'), a = document.querySelector('input[aria-label="Au"]'); return !!d && !!a && d.value && a.value && (Date.parse(a.value) - Date.parse(d.value)) / 86400000 === 90; }), 'Opérations filtré du lundi au dimanche + 12 semaines (Du et Au)')]);
    await etape(p, `d1280-${theme}-calendrier-plage-de-finances`, 'Finances › Opérations, « Au » réglé 4 semaines après « Du », puis Calendrier', async () => {
      const ok = await p.evaluate(() => { const d = document.querySelector('input[aria-label="Du"]'), a = document.querySelector('input[aria-label="Au"]'); if (!d || !a) return false; const v = new Date(Date.parse(d.value) + 27 * 86400000).toISOString().slice(0, 10); const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(a, v); a.dispatchEvent(new Event('input', { bubbles: true })); a.dispatchEvent(new Event('change', { bubbles: true })); return true; });
      if (!ok) throw new Absent('champs Du et Au introuvables dans Opérations');
      await attendre(600); await ongletApp(p, 'Calendrier'); await p.waitForSelector('[data-frise]', { timeout: 20000 }); await attendre(500);
    }, [fn(async q => q.evaluate(() => document.querySelector('[data-frise]')?.getAttribute('data-nb-colonnes') === '4'), 'la frise a 4 semaines')]);
  } catch (e) {
    rapport.push({ cfgNom: 'd1280', theme, n: 'app', nom: 'plage', geste: '/?dev-local', statut: 'ABSENT', dit: e instanceof Absent ? e.message : String(e.message || e).slice(0, 160), capture: '—' });
    console.log(`ABSENT plage ${theme} : ${String(e.message || e).slice(0, 160)}`);
  } finally { if (p) await p.ctx.close().catch(() => {}); }
}

/** N° 13 c au banc, 390 tactile : « Budget › » ouvre la feuille en bas, marquée « banc » ; rien sur l'en-tête. */
async function bancBudget(theme) {
  let p;
  try {
    p = await ouvrir(CONFIGS.m390, theme, BANC);
    await etape(p, `m390-${theme}-banc-budget-feuille-bas`, 'toucher la Blonde, puis Budget ›', async () => { await toucher(p, { titre: 'Blonde d’automne' }); await toucher(p, { texte: /^Budget ›/ }); await attendre(500); },
      [/banc — l’app ouvrirait/, /le budget du brassin Blonde d’automne/, fn(async q => q.evaluate(() => {
        const d = [...document.querySelectorAll('[role="dialog"]')].find(x => /banc — l’app ouvrirait/.test(x.textContent || '')); const z = document.querySelector('[data-entete-zone]');
        if (!d) return false; const D = d.getBoundingClientRect(); const Z = z ? z.getBoundingClientRect() : null;
        return D.bottom >= innerHeight - 2 && (!Z || D.top >= Z.bottom - 1 || Z.height === 0);
      }), 'la feuille est en bas, sous l’en-tête'), fn(async q => q.evaluate(() => !!document.querySelector('[role="dialog"] button[aria-label="Fermer"]')), 'la feuille se ferme par ×')]);
  } finally { if (p) await p.ctx.close().catch(() => {}); }
}

/* ------------------------------------------------------------------ D-45 : 5 tâches chronométrées au banc (390 tactile, clair) */

async function chronometrer() {
  const taches = [
    ['poser un brassin', async p => { await ajouterDans(p, 'Brassins'); await toucher(p, dansFeuille(/^Porter d’hiver$/)); await toucher(p, boutonFeuille(/^Ajouter/)); }, /Annuler/],
    ['décaler une fête', async p => { await glisserChose(p, 'Marché de Noël', -1); }, /Annuler/],
    ['voir le creux', async p => { await toucher(p, { aria: /à dépenser/ }); }, /Le creux de S\d+/],
    ['masquer une rangée', async p => { await toucher(p, { aria: /^Masquer Achats/ }); }, /cachée/],
    ['noter une idée', async p => { await toucher(p, FAB); await toucher(p, dansFeuille(/^Noter une idée/)); await noterIdee(p, 'ZZ TEST — idée'); }, /idée notée|Idée notée|carnet|Annuler/]
  ];
  for (const [nom, faire, attendu] of taches) {
    let p;
    try {
      p = await ouvrir(CONFIGS.m390, 'clair', BANC);
      p.touchers = 0;
      const t0 = Date.now();
      let ok = true, dit = '';
      try { await faire(p); } catch (e) { ok = false; dit = e instanceof Absent ? e.message : String(e.message || e).slice(0, 120); }
      let vu = false;
      for (let i = 0; i < 20 && ok && !vu; i++) { vu = attendu.test(await lireTexte(p)); if (!vu) await attendre(100); }
      const ms = Date.now() - t0;
      chrono.push({ nom, touchers: p.touchers, ms, ok: ok && vu, dit: dit || (vu ? `« ${attendu.source} » vu` : `« ${attendu.source} » ABSENT`) });
    } catch (e) { chrono.push({ nom, touchers: 0, ms: 0, ok: false, dit: String(e.message || e).slice(0, 120) }); }
    finally { if (p) await p.ctx.close().catch(() => {}); }
  }
}

/* ------------------------------------------------------------------ tout jouer */

const garde = n => !choixEtats || choixEtats.has(n);
try {
  for (const cfgNom of choixConfigs) {
    for (const theme of choixThemes) {
      for (const etat of ETATS) {
        if (!garde(etat.n)) continue;
        if (theme !== 'clair' && !etat.cave) continue;
        await jouerEtat(cfgNom, theme, etat);
      }
      if (theme === 'clair' && !args.includes('--sans-dev-local')) {
        if (garde('56')) await devLocal(cfgNom, theme);
        if (garde('33')) await etPer(cfgNom, theme);
      }
    }
  }
  /* CRITIQUE-4 (lot q4-app) : --etats app (l'app réelle, 390), plage (Finances ↔ calendrier, 1280), banc-budget (n° 13 c) ; deux thèmes */
  for (const theme of choixThemes) {
    if (garde('app') && !args.includes('--sans-dev-local')) await parcoursApp(theme);
    if (garde('plage') && !args.includes('--sans-dev-local')) await plageApp(theme);
    if (garde('banc-budget')) await bancBudget(theme);
  }
  if (!args.includes('--sans-chrono') && choixConfigs.includes('m390') && (!choixEtats || choixEtats.has('chrono'))) await chronometrer();
} finally {
  await nav.close();
}

/* ------------------------------------------------------------------ RAPPORT.md */

const ordre = e => `${e.cfgNom}|${e.theme}|${e.n}`;
rapport.sort((a, b) => ordre(a).localeCompare(ordre(b), 'fr', { numeric: true }));
const absents = rapport.filter(r => r.statut !== 'OK' && r.statut !== 'SANS OBJET');
const lignes = [
  '# Vision 7 : le calendrier porté, état par état, chaque geste mesuré (vision-7/vision-calendrier.mjs)',
  '',
  `Joué le ${new Date().toISOString().slice(0, 16).replace('T', ' ')} sur ${BASE}. Banc : ${BANC} (« banc — données simulées »). App : ${APP} (requêtes Firestore coupées avant de partir).`,
  'Gestes : contact tactile CDP à 390 × 844 et 844 × 390, souris à 1280 × 800. Éléments trouvés par texte, rôle, aria-label ou data-titre.',
  `Bilan : ${rapport.length} états joués, ${rapport.filter(r => r.statut === 'OK').length} OK, ${absents.length} ABSENT ou INTERDIT, ${rapport.filter(r => r.statut === 'SANS OBJET').length} sans objet.`,
  '',
  '| Config | Thème | État | Geste fait | Résultat | Ce qui a été trouvé | Capture |',
  '|---|---|---|---|---|---|---|',
  ...rapport.map(r => `| ${r.cfgNom} | ${r.theme} | ${r.n}-${r.nom} | ${r.geste} | ${r.statut} | ${r.dit.replace(/\|/g, '/')} | ${r.capture} |`),
  ''
];
if (chrono.length) {
  lignes.push('## D-45 : cinq tâches chronométrées au banc (390 tactile, clair)', '', '| Tâche | Touchers | Temps (ms, script) | Résultat |', '|---|---|---|---|',
    ...chrono.map(c => `| ${c.nom} | ${c.touchers} | ${c.ms} | ${c.ok ? 'OK' : 'ABSENT'} : ${c.dit.replace(/\|/g, '/')} |`),
    '', 'Le temps est celui du script (attentes de 450 ms après chaque toucher comprises) : il borne le nombre de gestes, pas la vitesse d’un brasseur.', '');
  /* CRITIQUE-5 n° 10 (D-45) : les 5 tâches dans leur propre fichier */
  writeFileSync(join(DOSSIER, 'CHRONO.md'), [
    '# D-45 : cinq tâches chronométrées au banc (390 tactile, thème clair)', '',
    `Joué le ${new Date().toISOString().slice(0, 16).replace('T', ' ')} sur ${BANC} (« banc — données simulées »), chaque tâche sur une page neuve (état remis à zéro).`, '',
    '| Tâche | Touchers | Temps (ms, script) | Résultat |', '|---|---|---|---|',
    ...chrono.map(c => `| ${c.nom} | ${c.touchers} | ${c.ms} | ${c.ok ? 'OK' : 'ÉCHEC'} : ${c.dit.replace(/\|/g, '/')} |`),
    '', 'Le temps est celui du script : chaque toucher est suivi de 450 ms d’attente (animations). Il borne le nombre de gestes, pas la vitesse d’un brasseur ; le brasseur les rejoue sur son téléphone après son accord pour déployer (MISSION § Vérification).', ''
  ].join('\n'));
}
writeFileSync(join(DOSSIER, 'RAPPORT.md'), lignes.join('\n'));
console.log(`VISION ${absents.length ? 'ABSENT' : 'OK'} : ${rapport.length} états, ${absents.length} ABSENT ou INTERDIT → ${join(DOSSIER, 'RAPPORT.md')}`);
process.exit(0);
