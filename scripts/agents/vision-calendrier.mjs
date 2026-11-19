// HARNAIS OFFICIEL, LE SEUL AUTORISÉ : jamais un harnais du scratchpad (CRITIQUE-10 : les visions 11 ont joué des copies jetables,
// d'où c2-b jamais glissé, f2-a pris par le corps de la barre, le jalon de fin jamais tiré, Livrer jamais touché).
// Vision 13 (CRITIQUE-11, lot corr11-D) : chaque état part d'un contexte neuf, avec une garde d'entrée « 0 choses cachées » (la rangée masquée
// d'un état ne contamine plus les suivants) ; ET-PER (33) joué à 390, en paysage et à 1280, deux thèmes : 3 mois, 6 mois puis l'An au calendrier,
// Finances lu après chaque changement (Finances à l'écran exigé), puis Du et Au changés dans Finances et la frise qui suit ; c3-a (21) par un
// appui long de 800 ms sur la courbe ; jalons (34, 35 avec l'écriture `finPrevue` lue dans la trace du banc, 36 avec un seul role=status) ;
// Ajouter compté (+1) ; un nom récent choisi avant Ajouter (Travaux) ; états neufs, un par n° de CRITIQUE-11 : 31a, 09c, 08c, 08m, 12m, 11f,
// 15 (« (S53) »), 07b, 07m, 31d, 49m, 30d, et 20/20b partis de `.ent-cb` à 50 % / 50 %.
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
// Vision 14 (CRITIQUE-12, lot corr12-D) : <base> et <dossier> facultatifs (VISION_BASE, sinon http://localhost:3017 ; dossier dans os.tmpdir()) ;
// `p844` = le paysage 844 × 390 (nom des captures de la critique) ; 01 attend la frise et la courbe rendues ; 07m/07b lisent les étiquettes
// `[data-axe]` de la courbe zoomée (`placerAxe`) ; 16 jugé sur le cadre ; 21x : le retour au repos est l'effet voulu ; 27 et 44 touchent
// vraiment ; 48 « Achats seuls » ; M1 à M7 (n° 1) : boîte du message, `data-place` ∈ {pres, bas}, 0 intersection avec NOMS_MESSAGE et le +,
// jamais au-dessus de la première rangée visible (« MESSAGE OK ») ; 49m : dates du détail sur une ligne (n° 3) ; 35r/35p : rien sous le +
// (n° 4) ; 21 : légende hors du + et entière (n° 5) ; 08x : Annuler au doigt, aucune feuille 1 s après (doute paysage) ; 39c : fin de la
// barre Travaux contre la colonne S40 en px ; ET-PER : capture `33-finances-plage` (3 mois au calendrier, Finances par la barre).
// Groupes pour --etats : `msg` (M1 à M7), `et-per` ou `finances` (= 33), `budget-app` (= app, D-71 dans /?dev-local).
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const req = createRequire(import.meta.url);
const puppeteer = req('puppeteer-core');
const args = process.argv.slice(2);
const opt = n => { const i = args.indexOf(`--${n}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : null; };
/* les positionnels : ce qui n'est ni une option ni la valeur d'une option */
const AVEC_VALEUR = new Set(['--configs', '--themes', '--etats']);
const pos = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && AVEC_VALEUR.has(args[i - 1])));
if (args.includes('--aide')) { console.log('usage : node scripts/agents/vision-calendrier.mjs [<base>] [<dossier>] [--configs m390,p844,d1280] [--themes clair,cave] [--etats …] [--sans-dev-local] [--sans-chrono]'); process.exit(2); }
const BASE = (pos[0] || process.env.VISION_BASE || 'http://localhost:3017').replace(/\/$/, '');
const DOSSIER = pos[1] || join(tmpdir(), 'vision-calendrier');
const BANC = `${BASE}/?preview=calendrier`;
const APP = `${BASE}/?dev-local`;
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
mkdirSync(DOSSIER, { recursive: true });

const CONFIGS = {
  m390: { w: 390, h: 844, tactile: true },
  paysage: { w: 844, h: 390, tactile: true },
  /* CRITIQUE-12 : la critique nomme le paysage « p844 » ; même écran que `paysage` */
  p844: { w: 844, h: 390, tactile: true },
  d1280: { w: 1280, h: 800, tactile: false }
};
const choixConfigs = (opt('configs') || 'm390,p844,d1280').split(',').filter(c => CONFIGS[c]);
const inconnues = (opt('configs') || '').split(',').filter(c => c && !CONFIGS[c]);
if (inconnues.length) { console.log(`configuration inconnue : ${inconnues.join(', ')} (connues : ${Object.keys(CONFIGS).join(', ')})`); process.exit(2); }
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

/**
 * CRITIQUE-12 (m390-clair-01 : capture de chargement) : le premier état d'un serveur Vite neuf part avant la fin du rendu (modules compilés à la
 * demande). Le banc est prêt quand la ligne « banc — données simulées », les 7 rangées, au moins une chose et le tracé de la courbe sont là ;
 * 30 s au plus, puis les polices ; sinon l'état est ABSENT (jamais une capture du squelette).
 */
async function attendreBanc(p) {
  const pret = () => p.evaluate(() => {
    const courbe = [...document.querySelectorAll('[aria-label^="Libre et caisse"]')].find(e => e.getBoundingClientRect().width > 100);
    const trace = courbe && (courbe.tagName.toLowerCase() === 'svg' ? courbe : courbe.querySelector('svg'))?.querySelector('path');
    return /banc — données simulées/.test(document.body.innerText) && document.querySelectorAll('section[data-rangee]').length >= 7
      && document.querySelectorAll('[data-frise] [data-chose], [data-frise] [data-barre]').length > 0 && !!trace && trace.getBoundingClientRect().width > 0;
  }).catch(() => false);
  const t0 = Date.now();
  let recharge = false;
  while (!(await pret())) {
    /* « Impossible de charger la brasserie » : import('./App') en échec (Vite réoptimise, ou un module en cours d'écriture) ; une fois rechargé */
    if (!recharge && await p.evaluate(() => /Impossible de charger la brasserie/.test(document.body.innerText)).catch(() => false)) { recharge = true; await charger(p, null); continue; }
    if (Date.now() - t0 > 30000) throw new Absent(`banc non rendu après 30 s (frise, rangées ou courbe absentes${await p.evaluate(() => /Impossible de charger la brasserie/.test(document.body.innerText)).catch(() => false) ? ' ; « Impossible de charger la brasserie », même rechargé' : ''}${p.erreurs.length ? ` ; console : ${p.erreurs.slice(0, 2).join(' / ').slice(0, 200)}` : ''}) : capture de chargement refusée`);
    await attendre(300);
  }
  await p.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
  await attendre(400);
  return Date.now() - t0;
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
  /* en ligne 1, n° 4 (18.11) : le bandeau du glissé dit l'effet sur le chiffre clé (« À dépenser −672 : creux S48 → S50 », ou « S50 : a → b ·
     à dépenser inchangé »), plus « S48 : −672 → −660 » seul, qui faisait croire à un gain */
  { n: '08', nom: 'f1a-apres', geste: 'glisser la Hotte de 2 colonnes, lâcher', jouer: async p => { await glisserChose(p, 'Hotte', 2); }, attendu: [/À dépenser [−\d\s’']+ : creux S\d+ → S\d+|À dépenser : [−\d\s’']+ → [−\d\s’']+ · S\d+|À dépenser : [−\d\s’']+ · S\d+ → [−\d\s’']+ · S\d+|S\d+ : [−\d\s’']+ → [−\d\s’']+ · à dépenser inchangé|à dépenser inchangé[\s·]*S\d+ : [−\d\s’']+ → [−\d\s’']+/, /Annuler/] },
  /* ---------- en ligne 1 (18.11), correctifs du test en ligne et plaintes du brasseur au téléphone ---------- */
  /* n° 1 (« C’est quoi ces deux paniers ? ») : en 3 mois et dans l'An, chaque picto de la frise porte son nom à côté */
  ...[['L1a', 'marques-3mois', /^3 mois/], ['L1b', 'marques-an', /^An\b/]].map(([n, nom, choix]) => ({
    n, nom, geste: `menu période : ${choix.source.replace(/[\^\\b]/g, '')}`, cave: n === 'L1a', jouer: async p => { await menuPeriode(p, choix); },
    attendu: [fn(async p => p.evaluate(() => {
      const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.right > 0 && r.left < innerWidth; };
      const marques = [...document.querySelectorAll('[data-frise] [data-marque], [data-frise] [data-caddie]')].filter(vis);
      const noms = [...document.querySelectorAll('[data-frise] .cal-lbl')].filter(vis).filter(e => (e.textContent || '').trim().length > 1);
      /* un nom rendu à 0 px (une pastille de lien qui prend toute la place) n'est pas un nom : chaque nom d'étiquette fait 24 px au moins */
      const ecrases = noms.flatMap(e => [...e.querySelectorAll('.cal-lbl-t')]).filter(t => t.getBoundingClientRect().width < 24);
      return marques.length > 0 && noms.length >= marques.length && ecrases.length === 0;
    }), 'chaque picto visible a un nom visible à côté, aucun nom écrasé')]
  })),
  /* CAL-POINTS-MUETS (« Les petits points là donne pas d’info » ; « plutot utiliser des mini icone. et une couleur pour le type de procédé ») */
  { n: 'L7', nom: 'point-etape', geste: 'toucher l’icône dry hop de la Blonde', cave: true,
    jouer: async p => { await toucher(p, { titre: 'Blonde d’automne', sous: '[data-jalon="dry-hop"]' }); },
    attendu: [fn(async p => p.evaluate(() => {
      const s = [...document.querySelectorAll('[data-point-bulle]')].find(e => e.getBoundingClientRect().width > 0);
      return !!s && /^Dry hop · \d{1,2} \S+/.test((s.textContent || '').trim()) && !!s.querySelector('svg');
    }), 'la bulle « Dry hop · date » avec son picto'), fn(async p => p.evaluate(() => {
      const pts = [...document.querySelectorAll('[data-frise] [data-jalon]:not([data-jalon="commander"])')].filter(e => e.getBoundingClientRect().width > 0);
      return pts.length > 0 && pts.every(e => !!e.querySelector('svg') && /rgb\(var\(--/.test(e.style.getPropertyValue('--e')));
    }), 'chaque point d’étape est un picto coloré')] },
  /* CAL-PERIODE-LIBRE (« Je peux pas choisir une période donnée ») : la fin de la fenêtre posée au doigt devient la période ; l'étiquette dit la
     même fin que la bande des semaines (les colonnes de la frise) */
  { n: 'L6', nom: 'periode-libre', geste: 'tirer la poignée de fin de la fenêtre de 4 semaines vers la droite', cave: true,
    mesure: p => p.evaluate(() => document.querySelector('.ent-cadre')?.getAttribute('aria-label') || ''),
    jouer: async p => {
      /* la fenêtre de 6 semaines au repos : 4 semaines de plus, le doigt posé sur sa poignée de fin (bord droit du cadre) */
      const c = await p.evaluate(() => { const r = document.querySelector('.ent-cadre')?.getBoundingClientRect(); return r ? { x: r.right - 2, y: r.top + r.height / 2, w: r.width } : null; });
      if (!c) throw new Absent('fenêtre .ent-cadre introuvable');
      await glisserXY(p, c.x, c.y, (c.w / 6) * 4);
    },
    attendu: [fn(async p => p.evaluate(() => {
      const lbl = document.querySelector('.ent-cadre')?.getAttribute('aria-label') || '';
      const fin = lbl.match(/– S(\d+)/)?.[1];
      const bande = document.querySelector('[aria-label^="Semaines"]') || document.querySelector('[data-bande-semaines]');
      const nums = bande ? (bande.textContent || '').match(/S\d+/g) || [] : [];
      return !!fin && nums.length > 6 && nums[nums.length - 1] === `S${fin}` && !/Tire jusqu’au bout/.test(document.body.innerText);
    }), 'la fenêtre prend la fin posée : la bande des semaines finit à la même semaine que l’étiquette')] },
  /* CRITIQUE-10 (preuve f2-a) : le BORD (`[data-bord]`), jamais le corps ni l'aria de la barre ; la barre s'allonge de 7 j, elle ne se déplace pas */
  { n: '09', nom: 'f2a-apres', geste: 'tirer le bord ([data-bord]) de la Blonde d’une colonne', mesure: p => choseLue(p, 'Blonde d’automne'),
    jouer: async p => {
      /* vision 13 (d1280-09) : en 6 sem., la Blonde finit au bord droit de la fenêtre ; son allongement ne se voit pas. La fenêtre passe alors à
         3 mois (dit dans le rapport), pour que la largeur puisse grandir d'une colonne */
      const coupee = await p.evaluate(() => { const b = [...document.querySelectorAll('[data-barre]')].find(x => (x.getAttribute('data-titre') || x.getAttribute('aria-label') || '').startsWith('Blonde')); const f = document.querySelector('[data-frise]'); if (!b || !f) return false; const lane = b.closest('[data-lane]') || f; return Math.abs(b.getBoundingClientRect().right - lane.getBoundingClientRect().right) < 4 || b.getBoundingClientRect().right > lane.getBoundingClientRect().right - 2 * parseFloat(f.getAttribute('data-largeur-colonne') || '0'); });
      if (coupee && !(p.cfg.tactile && p.cfg.w > p.cfg.h)) { await menuPeriode(p, /^3 mois/); await p.keyboard.press('Escape').catch(() => {}); await attendre(400); p.noteEtat = 'Blonde au bord de la fenêtre en 6 sem. : période 3 mois d’abord'; }
      p.blondeAvant = await choseLue(p, 'Blonde d’automne');
      p.boiteAvant = await boiteChose(p, 'Blonde d’automne');
      await glisserChose(p, 'Blonde d’automne', 1, { sous: '[data-bord]' });
      p.blondeApres = await choseLue(p, 'Blonde d’automne');
      p.boiteApres = await boiteChose(p, 'Blonde d’automne');
      p.noteEtat = `${p.noteEtat ? `${p.noteEtat} ; ` : ''}avant « ${p.blondeAvant.slice(0, 90)} » ; après « ${p.blondeApres.slice(0, 90)} »`;
    },
    attendu: [/J\d+ \/ \d+/, /prête/, /promis|Annuler/, fn(async p => {
      const duree = t => Number((/J\d+ \/ (\d+)/.exec(t || '') || [])[1]);
      const a = duree(p.blondeAvant), b = duree(p.blondeApres);
      const lc = await largeurColonne(p);
      const A = p.boiteAvant, B = p.boiteApres;
      const memeDebut = !!A && !!B && Math.abs(A.g - B.g) < 3;
      const plusLongue = !!A && !!B && B.w - A.w > lc * 0.6;
      /* CRITIQUE-11 (p844-10, d1280-08 et 09 identiques au repos) : les trois ensemble, plus d'une alternative qui passe sans geste */
      return { ok: memeDebut && plusLongue && Number.isFinite(a) && b === a + 7, dit: `J0 / ${a} → J0 / ${b} ; début ${A ? Math.round(A.g) : '?'} → ${B ? Math.round(B.g) : '?'} px ; largeur ${A ? Math.round(A.w) : '?'} → ${B ? Math.round(B.w) : '?'} px (colonne ${Math.round(lc)})` };
    }, 'la Blonde s’allonge de 7 j par son bord, son début ne bouge pas')], interdit: [/J0\s*\/\s*0(?!\d)/] },
  { n: '10', nom: 'f4b-brassin', geste: 'toucher la Blonde', jouer: async p => { await toucher(p, { titre: 'Blonde d’automne' }); },
    attendu: [/Ouvrir le brassin/, /Commander/, /Budget ›/, /Dry hop/i, /Garde/] },
  { n: '11', nom: 'f5a-menu', geste: 'appui long sur la Hotte', cave: true, jouer: async p => { await appuiLong(p, { titre: 'Hotte' }); },
    attendu: [/Épingler/, /Étoile/, /Achats seul/, /Dupliquer/, /Lier/, /Retirer/, fn(async p => p.evaluate(() => {
      const m = document.querySelector('[role="menu"]'); if (!m) return false;
      const r = [...m.querySelectorAll('button, [role="menuitem"]')].find(b => /^(Retirer|Ranger sans date|Annuler l|Annuler la|Annuler le)/.test((b.textContent || '').trim())); if (!r) return false;
      const q = r.getBoundingClientRect(); const e = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2);
      return q.top >= 0 && q.bottom <= innerHeight && !!e && (r === e || r.contains(e));
    }), 'Retirer dans l’écran et touchable')] },
  /* CRITIQUE-9 n° 1 (E31, E46, D-48, D-114, D-192) : avant Retirer (13a), après Retirer (12), après Annuler (13), la page rechargée avant chaque
     état ; le Marché de Noël revient dans Fêtes, en S52, sans rechargement entre Retirer et Annuler */
  { n: '13a', nom: 'f5a-avant-retirer', geste: 'aller au Marché de Noël (aucun geste)', cave: true, repos: true, mesure: p => fetesLues(p), jouer: async p => { await trouver(p, { titre: 'Marché de Noël' }); await attendre(300); },
    attendu: [fn(noelEnS52, 'le Marché de Noël est dans Fêtes, en S52')] },
  { n: '12', nom: 'f5a-retirer', geste: 'appui long sur le Marché de Noël, puis Retirer', cave: true, mesure: p => fetesLues(p), jouer: async p => { await appuiLong(p, { titre: 'Marché de Noël' }); await toucher(p, { dans: { role: 'menu' }, texte: /^(Retirer|Ranger sans date|Annuler l|Annuler la|Annuler le)/ }); },
    attendu: [/Retirée? de S\d+/, /Sans date ›/, /Annuler/, fn(async p => { const t = await fetesLues(p); return { ok: !/Marché de Noël/.test(t), dit: `Fêtes : « ${t.slice(0, 60)} »` }; }, 'le Marché de Noël a quitté la rangée Fêtes')] },
  { n: '13', nom: 'f5a-annuler', geste: 'Retirer le Marché de Noël, puis Annuler (sans rechargement)', cave: true, /* l'effet voulu est le retour au repos : le changement est prouvé par 12 et par « il avait bien quitté Fêtes » */ repos: true, mesure: p => fetesLues(p),
    jouer: async p => {
      await appuiLong(p, { titre: 'Marché de Noël' }); await toucher(p, { dans: { role: 'menu' }, texte: /^(Retirer|Ranger sans date|Annuler l|Annuler la|Annuler le)/ });
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
      p.messageLivrer = await messageLu(p);
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
    }, 'la vente La Cigogne porte la date de Livrer'),
    /* CRITIQUE-11 n° 5 : « 3 fûts La Cigogne : 29 déc. (S53) · S52 : 1 754 → 854 » : la semaine de la date suit la date, entre parenthèses */
    fn(async p => ({ ok: RE_DATE_SEMAINE.test(p.messageLivrer || ''), dit: `message de Livrer « ${(p.messageLivrer || 'absent').slice(0, 90)} »` }), 'le message de Livrer dit la semaine de la date : « 29 déc. (S53) »')] },

  /* CRITIQUE-12 (m16 « ECHEC » à tort) : pendant le tirer, les rangées ne bougent pas ; ce qui change est le CADRE de la fenêtre, qui couvre
     toute la courbe et dit « S47 – S44 2027 ». Mesure : l'aria du cadre ; attendus : le cadre couvre la courbe (bords à 4 px), son étiquette. */
  { n: '16', nom: 'c1d-pendant', geste: 'tirer la poignée de fin jusqu’au bout, doigt tenu', mesure: p => cadreLu(p), jouer: async p => { await tirerPoignee(p, 1.0, true); },
    attendu: [fn(async p => p.evaluate(() => {
      const c = document.querySelector('.ent-cadre[role="group"]');
      const courbe = [...document.querySelectorAll('[aria-label^="Libre et caisse"]')].find(e => e.getBoundingClientRect().width > 100);
      const svg = courbe && (courbe.tagName.toLowerCase() === 'svg' ? courbe : courbe.querySelector('svg'));
      if (!c || !svg) return { ok: false, dit: `${c ? '' : 'cadre absent '}${svg ? '' : 'courbe absente'}` };
      /* la courbe = son tracé (les chemins dessinés), pas la boîte du svg, qui garde une marge à droite pour les noms */
      const traces = [...svg.querySelectorAll('path')].map(e => e.getBoundingClientRect()).filter(r => r.width > 20);
      if (!traces.length) return { ok: false, dit: 'tracé de la courbe absent' };
      const S = { left: Math.min(...traces.map(r => r.left)), right: Math.max(...traces.map(r => r.right)) };
      const C = c.getBoundingClientRect();
      const lab = c.getAttribute('aria-label') || '';
      /* 8 px : le point de fin de la courbe (cercle) et le bout du trait débordent de la dernière colonne (m16 vu : le cadre couvre tout) */
      return { ok: C.left <= S.left + 8 && C.right >= S.right - 8 && /S\d+ – S\d+ \d{4}/.test(lab), dit: `cadre ${Math.round(C.left)} → ${Math.round(C.right)} px, tracé de la courbe ${Math.round(S.left)} → ${Math.round(S.right)} px ; « ${lab} »` };
    }), 'le cadre couvre toute la courbe et dit « S… – S… année »')], fin: lacher },
  { n: '17', nom: 'an', geste: 'tirer la poignée de fin jusqu’au bout, lâcher', cave: true, jouer: async p => { await tirerPoignee(p, 1.0, false); }, attendu: [/janv/, /juin/, /oct/] },
  { n: '18', nom: 'marque-3mois', geste: 'période 3 mois', sansObjet: cfg => (cfg.tactile && cfg.w > cfg.h ? 'en paysage la vue est déjà de 13 semaines (3 mois, E10) : le menu 3 mois se prouve par l’état 05' : null), jouer: async p => { await menuPeriode(p, /^3 mois/); },
    attendu: [fn(async p => p.evaluate(() => document.querySelectorAll('[data-marque]').length > 0), 'au moins une marque (chose de moins de 24 px)')] },
  { n: '19', nom: 'marque-appui-long', geste: '3 mois, puis appui long sur une marque', jouer: async p => { await menuPeriode(p, /^3 mois/); await appuiLong(p, { data: 'data-marque' }); },
    attendu: [fn(async p => p.evaluate(() => Number(document.querySelector('[data-frise]')?.getAttribute('data-nb-colonnes')) <= 7), 'la vue 6 semaines revient')] },
  /* CRITIQUE-9 n° 9 (E11, D-195) : un vrai glissé (doigt posé, déplacé, tenu), parti HORS du cadre de la fenêtre et de ses poignées (vision 10 :
     le doigt avait pris le cadre, « S48 – S21 2027 ») ; la tête « CHF · S · date » pendant, le détail de la semaine après le lâcher (20b) */
  { n: '20', nom: 'c2b-lecture', cave: true, geste: 'glisser le doigt le long de la courbe, hors du cadre, doigt tenu', mesure: lireTexte,
    jouer: async p => {
      await trouver(p, { aria: /^Libre et caisse/ });
      const d = await departCB(p);
      p.noteEtat = d.dit;
      if (!d.ok) throw new Absent(d.dit);
      p.cadreAvant = await cadreLu(p);
      p.pmAvant = await plusMinusLu(p);
      await glisserXY(p, d.x, d.y, d.dx, 0, { tenu: true });
    },
    attendu: [fn(plusMinusInchange, '± inchangé (le glissé n’a pas touché ±)'), /\d\s*CHF\s*·\s*S\d+\s*·\s*\d{1,2}\s\p{L}+/u, fn(async p => { const c = await cadreLu(p); return { ok: c === p.cadreAvant, dit: `cadre « ${p.cadreAvant} » → « ${c} »` }; }, 'le cadre de la fenêtre n’a pas bougé'),
      fn(curseurSousNoms, 'le curseur passe sous les noms de la courbe (E11, doute c2-b de CRITIQUE-11)')], fin: lacher },
  { n: '20b', nom: 'c2b-detail', cave: true, geste: 'glisser le doigt le long de la courbe, hors du cadre, puis lâcher : le détail de la semaine lue', mesure: lireTexte,
    jouer: async p => {
      await trouver(p, { aria: /^Libre et caisse/ });
      const d = await departCB(p);
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
  /* CRITIQUE-11 (c3-a jamais atteint : le mode graph n'est pas une entrée de menu, E12) : un appui long de 800 ms sur la courbe, hors du cadre ;
     puis le doigt glisse sur la grande courbe, tenu : la lecture suit le doigt. Chaque attendu lit la grande courbe : sans elle, tout échoue. */
  { n: '21', nom: 'c3a-graph', geste: 'appui long de 800 ms sur la courbe (hors du cadre), puis glisser sur la grande courbe, doigt tenu', mesure: p => p.evaluate(() => document.querySelector('[data-vue="graph"]') ? 'graph' : 'frise'),
    jouer: async p => {
      await trouver(p, { aria: /^Libre et caisse/ });
      const d = await departCourbe(p);
      if (!d.ok) throw new Absent(d.dit);
      await appuyerXY(p, d.x, d.y, 800);
      await attendre(500);
      if (!(await p.evaluate(() => !!document.querySelector('[data-vue="graph"]')))) throw new Absent(`la grande courbe ne s’ouvre pas après 800 ms (${d.dit})`);
      p.lectures = await lectureGrande(p);
      p.noteEtat = `${d.dit} ; ${p.lectures.dit}`;
    },
    attendu: [/La courbe en grand|Revenir à la frise/, fn(grandeSegments, 'segments colorés (au moins deux couleurs de rangée)'), fn(grandeCreux, 'le creux marqué (point et étiquette)'),
      fn(grandeBande, 'la frise en fine bande sous la courbe'), fn(async p => ({ ok: !!p.lectures && p.lectures.ok, dit: p.lectures ? p.lectures.dit : 'non lu' }), 'la lecture suit le doigt (deux semaines lues, détail ouvert)'),
      fn(grandeCote, 'en paysage, la courbe et le détail côte à côte'), fn(async p => { const r = await legendeLibre(p); p.noteEtat = `${p.noteEtat ? `${p.noteEtat} ; ` : ''}légende : ${r.dit}`; return r; }, 'la légende hors du + et entière, aucun « … » (n° 5 de CRITIQUE-12)')], fin: lacher },
  /* CRITIQUE-12 (m21x « ECHEC » à tort) : revenir au repos est l'effet voulu du × ; l'ouverture est exigée (grandeVue), le retour est l'attendu */
  { n: '21x', nom: 'c3a-fermer', geste: 'appui long de 800 ms sur la courbe, puis × (Revenir à la frise)', repos: true,
    jouer: async p => {
      await trouver(p, { aria: /^Libre et caisse/ });
      const d = await departCourbe(p);
      if (!d.ok) throw new Absent(d.dit);
      await appuyerXY(p, d.x, d.y, 800); await attendre(500);
      p.grandeVue = await p.evaluate(() => !!document.querySelector('[data-vue="graph"]'));
      if (!p.grandeVue) throw new Absent('la grande courbe ne s’ouvre pas');
      await p.screenshot({ path: join(DOSSIER, `${p.cfgNom}-${p.theme}-21o-c3a-ouverte.png`) });
      await toucher(p, { role: 'button', aria: /^Revenir à la frise/ });
    },
    attendu: [fn(async p => ({ ok: p.grandeVue === true, dit: `grande courbe ${p.grandeVue ? 'ouverte' : 'jamais ouverte'} avant le × (capture 21o)` }), 'la grande courbe était ouverte'),
      fn(async p => p.evaluate(() => ({ ok: !document.querySelector('[data-vue="graph"]') && !!document.querySelector('[data-frise]'), dit: `grande courbe ${document.querySelector('[data-vue="graph"]') ? 'encore ouverte' : 'fermée'}, frise ${document.querySelector('[data-frise]') ? 'revenue' : 'absente'}` })), '× ferme la grande courbe, la frise revient')] },

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
    jouer: async p => { p.nAvant = await nbToutes(p, 'ventes'); await ajouterDans(p, 'Ventes'); await toucher(p, dansFeuille(/^La Cigogne/)); p.ajoute = await toucherAjouter(p); p.nApres = await nbToutes(p, 'ventes'); },
    attendu: [/Annuler/, fn(plusUne('Ventes'), 'Ajouter touché : Ventes compte une chose de plus')], interdit: [/Choisis un nom/] },
  { n: '24', nom: 'pose-brassin', geste: '+ de Brassins, recette Porter d’hiver, Ajouter', mesure: p => nbChoses(p, 'brassins'), chiffre: true,
    jouer: async p => { p.nAvant = await nbToutes(p, 'brassins'); await ajouterDans(p, 'Brassins'); await toucher(p, dansFeuille(/^Porter d’hiver/)); p.ajoute = await toucherAjouter(p); p.nApres = await nbToutes(p, 'brassins'); },
    attendu: [/prête le/, /Annuler/, fn(plusUne('Brassins'), 'Ajouter touché : Brassins compte une chose de plus')], interdit: [/Choisis un nom/] },
  /* CRITIQUE-11 (m390-24 à 26 : Ajouter jamais touché) : la vente probable touchée ; si une feuille s'ouvre, son Ajouter est touché ; Ventes compte
     une vente pleine de plus (une probable en pointillé ne compte pas) */
  { n: '25', nom: 'pose-vente-probable', geste: 'toucher la vente probable Café du Pont (puis Ajouter si la feuille s’ouvre)',
    jouer: async p => {
      p.nAvant = await nbPleines(p, 'ventes');
      await toucher(p, { titre: 'Café du Pont' }); await attendre(300);
      if (await existe(p, boutonFeuille(/^Ajouter/))) p.ajoute = await toucherAjouter(p);
      p.nApres = await nbPleines(p, 'ventes');
    },
    attendu: [/Café du Pont/, fn(async p => p.evaluate(() => ![...document.querySelectorAll('[data-probable]')].some(e => /^Café du Pont/.test(e.getAttribute('aria-label') || e.getAttribute('data-titre') || ''))), 'la vente n’est plus en pointillé'),
      fn(plusUne('Ventes (pleines)'), 'Ventes compte une vente pleine de plus')] },
  { n: '26', nom: 'pose-activite', geste: '+ d’Activités, nom récent, 3 j, Ajouter', mesure: p => nbChoses(p, 'activites'), chiffre: true,
    jouer: async p => { p.nAvant = await nbToutes(p, 'activites'); await ajouterDans(p, 'Activités'); await toucher(p, { dans: { role: 'dialog|menu', dernier: true }, role: 'button', texte: /^Inventaire du stock|^Ranger la réserve/ }); await toucher(p, dansFeuille(/^3 j$/)); p.ajoute = await toucherAjouter(p); p.nApres = await nbToutes(p, 'activites'); },
    attendu: [/Annuler/, fn(plusUne('Activités'), 'Ajouter touché : Activités compte une chose de plus')], interdit: [/Choisis un nom/] },
  /* CRITIQUE-12 (m27 identique au repos : rien touché) : les deux ventes de la même semaine (fixture : Café du Pont et Épicerie du Bourg en S+3)
     sont TOUCHÉES l'une après l'autre ; chaque toucher ouvre ce qui la nomme (détail, ou feuille d'ajout pour la vente probable), capturé */
  { n: '27', nom: 'deux-ventes', geste: 'aux Ventes, toucher Café du Pont (capture 27a), fermer, puis toucher Épicerie du Bourg',
    mesure: p => p.evaluate(() => [...document.querySelectorAll('[data-detail], [role="dialog"], dialog')].filter(e => e.getBoundingClientRect().height > 0).map(e => (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60)).join(' | ') || 'rien d’ouvert'),
    jouer: async p => {
      await trouver(p, { titre: 'Café du Pont' });
      p.semCafe = await semaineDe(p, 'Café du Pont'); p.semEpicerie = await semaineDe(p, 'Épicerie du Bourg');
      const ouvert = () => p.evaluate(() => [...document.querySelectorAll('[data-detail], [role="dialog"], dialog')].filter(e => e.getBoundingClientRect().height > 0).map(e => (e.textContent || '').replace(/\s+/g, ' ').trim()).join(' | '));
      await toucher(p, { titre: 'Café du Pont' }); await attendre(300);
      p.ouvertCafe = await ouvert();
      /* la vente probable (pointillé) s'accepte d'un toucher (E26) : « Vente acceptée · S50 : a → b · Annuler », plus de pointillé */
      p.messageCafe = await messageLu(p);
      p.cafeProbable = await p.evaluate(() => [...document.querySelectorAll('[data-probable]')].some(e => /^Café du Pont/.test(e.getAttribute('aria-label') || e.getAttribute('data-titre') || '')));
      await p.screenshot({ path: join(DOSSIER, `${p.cfgNom}-${p.theme}-27a-vente-cafe-touchee.png`) });
      /* fermer ce qui s'est ouvert : le × de la feuille ou du détail, sinon Échap */
      for (let k = 0; k < 2 && (await ouvert()); k++) {
        if (await existe(p, { role: 'button', aria: /^Fermer/ })) await toucher(p, { role: 'button', aria: /^Fermer/ }); else { await p.keyboard.press('Escape').catch(() => {}); await attendre(400); }
      }
      await toucher(p, { titre: 'Épicerie du Bourg' }); await attendre(300);
      p.ouvertEpicerie = await ouvert();
      p.noteEtat = `semaines ${p.semCafe} et ${p.semEpicerie} ; Café du Pont touché : « ${(p.ouvertCafe || 'rien').slice(0, 70)} » ; Épicerie touchée : « ${(p.ouvertEpicerie || 'rien').slice(0, 70)} »`;
    },
    attendu: [fn(async p => ({ ok: !!p.semCafe && p.semCafe === p.semEpicerie, dit: `${p.semCafe} / ${p.semEpicerie}` }), 'les deux ventes sont de la même semaine'),
      fn(async p => ({ ok: /Café du Pont/.test(p.ouvertCafe || '') || (/Vente acceptée/.test(p.messageCafe || '') && !p.cafeProbable), dit: `ouvert « ${(p.ouvertCafe || 'rien').slice(0, 50)} » ; message « ${(p.messageCafe || 'aucun').slice(0, 60)} » ; ${p.cafeProbable ? 'encore en pointillé' : 'plus en pointillé'}` }), 'le toucher de Café du Pont (vente probable) l’accepte ou ouvre ce qui la nomme (capture 27a)'),
      fn(async p => ({ ok: /Épicerie du Bourg/.test(p.ouvertEpicerie || ''), dit: (p.ouvertEpicerie || 'rien d’ouvert').slice(0, 60) }), 'le toucher d’Épicerie du Bourg ouvre ce qui la nomme'),
      fn(async p => p.evaluate(() => {
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

  /* CRITIQUE-11 (décision c, D-81, E25) : le brassin planifié glissé d'une colonne ; ses jalons suivent (chacun décalé d'une colonne, à 30 % près) */
  { n: '34', nom: 'brassin-planifie-glisse', geste: 'glisser le Porter d’hiver d’une colonne ; ses jalons lus avant et après', mesure: p => choseLue(p, 'Porter d’hiver'),
    jouer: async p => {
      await trouver(p, { titre: 'Porter d’hiver' });
      p.lc = await largeurColonne(p);
      p.jalonsAvant = await jalonsDe(p, 'Porter d’hiver');
      await glisserChose(p, 'Porter d’hiver', 1);
      p.jalonsApres = await jalonsDe(p, 'Porter d’hiver');
    },
    attendu: [/Annuler/, fn(async p => {
      const a = p.jalonsAvant || {}, b = p.jalonsApres || {};
      const ids = Object.keys(a);
      const ecarts = ids.map(k => (b[k] === undefined ? NaN : b[k] - a[k]));
      const ok = ids.length > 0 && ecarts.every(e => Number.isFinite(e) && Math.abs(e - p.lc) < p.lc * 0.3);
      return { ok, dit: `${ids.length} jalon(s) : ${ids.map((k, i) => `${k} ${Number.isFinite(ecarts[i]) ? `${ecarts[i] > 0 ? '+' : ''}${Math.round(ecarts[i])} px` : 'disparu'}`).join(', ') || 'aucun'} (colonne ${Math.round(p.lc || 0)} px)` };
    }, 'les jalons du Porter suivent la barre (une colonne)')] },
  /* CRITIQUE-9 (harnais, D-81, D-103) : chaque jalon visé par son `data-jalon` ; ni menu f5-a, ni la Saison déplacée ; la fin glissée se
     vérifie par « prête le » changé et Annuler, le refus par son message, qui ne couvre aucun nom (n° 7) */
  { n: '35', nom: 'jalon-fin', geste: 'tirer le jalon de fin (conditionnement) du Porter d’une colonne', mesure: p => choseLue(p, 'Porter d’hiver'),
    jouer: async p => {
      p.saisonAvant = await choseLue(p, 'Saison de ferme');
      p.porterAvant = await choseLue(p, 'Porter d’hiver');
      if (!(await existe(p, { titre: 'Porter d’hiver', sous: '[data-jalon="conditionnement"]' }))) throw new Absent('jalon [data-jalon="conditionnement"] du Porter introuvable');
      await p.evaluate(() => { window.__bancAppels = []; });
      await glisserChose(p, 'Porter d’hiver', 1, { sous: '[data-jalon="conditionnement"]' });
      p.appels = await p.evaluate(() => JSON.stringify((window.__bancAppels || []).map(a => ({ op: a.op, id: a.id, patch: a.patch }))));
      p.message = await p.evaluate(() => (document.querySelector('[data-message]')?.textContent || '').replace(/\s+/g, ' ').trim());
      p.noteEtat = `Porter avant « ${p.porterAvant.slice(0, 80)} » ; message « ${p.message.slice(0, 90)} »`;
    },
    attendu: [/Annuler/, fn(async p => ({ ok: !!jourDe(p.message) && /prête (le )?\d/.test(p.message) && jourDe(p.message) !== jourDe(/prête (?:le )?([^·]+)/.exec(p.porterAvant || '')?.[1]), dit: `avant « ${(/prête[^·]*/.exec(p.porterAvant || '') || ['?'])[0]} » ; message « ${p.message.slice(0, 70)} »` }), '« prête le » a changé (message de la fin glissée)'),
      fn(async p => p.evaluate(() => !document.querySelector('[role="menu"]')), 'aucun menu f5-a ouvert'),
      fn(async p => { const s = await choseLue(p, 'Saison de ferme'); return { ok: s.split(' · ')[0] === p.saisonAvant.split(' · ')[0], dit: `Saison « ${s.slice(0, 50)} »` }; }, 'la Saison n’a pas bougé'),
      /* CRITIQUE-11 (décision c) : l'écriture elle-même, lue dans la trace du banc (`window.__bancAppels`, CalendrierPreview) */
      fn(async p => { let l = []; try { l = JSON.parse(p.appels || '[]'); } catch { l = []; } const f = l.find(a => a.op === 'patch' && a.id === 'LOT-PORTER' && a.patch && typeof a.patch.finPrevue === 'string' && a.patch.finPrevue); return { ok: !!f, dit: f ? `écrit : LOT-PORTER finPrevue = ${f.patch.finPrevue}` : `trace : ${(p.appels || 'vide').slice(0, 120)}` }; }, 'une écriture `finPrevue` sur le Porter')] },
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
      fn(messageSansNom, 'le refus ne couvre aucun nom (CRITIQUE-9 n° 7)'),
      /* CRITIQUE-11 (décision c, E33) : un seul message à l'écran, et c'est le refus */
      fn(async p => p.evaluate(() => { const l = [...document.querySelectorAll('[role="status"]')].filter(e => e.getBoundingClientRect().height > 0 && /\S/.test(e.textContent || '')); return { ok: l.length === 1 && /suit la recette du brassin/.test(l[0].textContent || ''), dit: `${l.length} role=status : ${l.map(e => `« ${(e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 70)} »`).join(' | ')}` }; }), 'un seul role=status, le refus')] },
  { n: '37', nom: 'mise-de-cote', geste: 'aucun (la courbe au repos)', repos: true, jouer: async () => {}, attendu: [/mis de côté/] },
  { n: '38', nom: 'travaux-fenetre', geste: '+ de Travaux, nom récent, S20 puis S40, 5 j', jouer: async p => { await fenetreTravaux(p); }, attendu: [/S20 → S40 · 21 sem\./] },
  { n: '39', nom: 'travaux-posee', geste: 'fenêtre S20 → S40, 5 j, Ajouter, puis l’An ; la barre posée (S20), pas celle de S8', mesure: barreTravauxPosee,
    jouer: async p => { await fenetreTravaux(p); await toucherAjouter(p); await attendre(500); await p.keyboard.press('Escape').catch(() => {}); await menuPeriode(p, /^An\b/); await p.keyboard.press('Escape').catch(() => {}); await attendre(300); },
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
    jouer: async p => { await fenetreTravaux(p); await toucherAjouter(p); await attendre(500); await p.keyboard.press('Escape').catch(() => {}); await deplacerFenetreJusqua(p, 18); },
    attendu: [fn(barreTravauxVue, 'la barre Travaux de S20 est dans la frise, avec ses points')] },
  { n: '39c', nom: 'travaux-posee-6mois', sansObjet: cfg => (cfg.w > cfg.h && cfg.tactile ? 'en paysage la fenêtre est de 13 semaines, sans 6 sem. ni 6 mois (E10)' : null), geste: 'fenêtre S20 → S40, 5 j, Ajouter ; période 6 mois ; poignée de début glissée jusqu’à S18 (fenêtre S18 – S43, qui contient S20 – S40)', mesure: barreTravauxPosee,
    jouer: async p => { await fenetreTravaux(p); await toucherAjouter(p); await attendre(500); await p.keyboard.press('Escape').catch(() => {}); await menuPeriode(p, /^6 mois/); await p.keyboard.press('Escape').catch(() => {}); await attendre(300); await deplacerFenetreJusqua(p, 18); },
    attendu: [fn(barreTravauxVue, 'la barre Travaux S20 → S40 est dans la frise, avec ses points'), fn(travauxS20aS40, 'la barre va de S20 à S40'), fn(pointsTouchables, 'chaque point touchable : elementFromPoint en son centre = le point'),
      fn(async p => { const r = await finTravauxS40(p); p.noteEtat = `${p.noteEtat ? `${p.noteEtat} ; ` : ''}fin contre S40 : ${r.dit}`; return r; }, 'la fin de la barre tombe sur le bord droit de la colonne S40 (à une demi-colonne près, mesurée en px ; doute 39c de CRITIQUE-12)')] },
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
  /* CRITIQUE-12 (m44 identique au repos : rien touché) : le brassin habituel en pointillé TOUCHÉ ouvre la feuille Brassins préréglée (capture
     44a) ; fermée, l'échéance en pointillé TOUCHÉE renvoie à Finances (au banc, la feuille « banc — l’app ouvrirait Finances » ; la vraie
     Finances se prouve par 33 dans /?dev-local). Hors de la fenêtre de 6 sem., la période passe à 3 mois (dit). */
  { n: '44', nom: 'propositions', geste: 'toucher le brassin habituel en pointillé (capture 44a), fermer, puis toucher l’échéance en pointillé',
    mesure: p => p.evaluate(() => [...document.querySelectorAll('[role="dialog"], dialog, [data-feuille-rangee]')].filter(e => e.getBoundingClientRect().height > 0).map(e => (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60)).join(' | ') || 'rien d’ouvert'),
    jouer: async p => {
      const vu = sel => p.evaluate(s => [...document.querySelectorAll(s)].some(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }), sel);
      if (!(await vu('[data-proposition="brassin-habituel"]')) || !(await vu('[data-proposition="echeance"]'))) {
        await menuPeriode(p, /^3 mois/).catch(() => {}); await p.keyboard.press('Escape').catch(() => {}); await attendre(400);
        p.noteEtat = 'proposition hors de la fenêtre de 6 sem. : période 3 mois d’abord';
      }
      await toucher(p, { data: 'data-proposition="brassin-habituel"' }); await attendre(400);
      p.feuilleBrassin = await p.evaluate(() => ({ rangee: document.querySelector('[data-feuille-rangee]')?.getAttribute('data-feuille-rangee') || null, presse: [...document.querySelectorAll('[data-feuille-rangee] [aria-pressed="true"]')].map(b => (b.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30)) }));
      await p.screenshot({ path: join(DOSSIER, `${p.cfgNom}-${p.theme}-44a-brassin-habituel-feuille.png`) });
      for (let k = 0; k < 2 && (await p.evaluate(() => !!document.querySelector('[data-feuille-rangee]'))); k++) {
        if (await existe(p, { dans: { role: 'dialog', dernier: true }, role: 'button', aria: /^Fermer/ })) await toucher(p, { dans: { role: 'dialog', dernier: true }, role: 'button', aria: /^Fermer/ }); else { await p.keyboard.press('Escape').catch(() => {}); await attendre(400); }
      }
      await toucher(p, { data: 'data-proposition="echeance"' }); await attendre(400);
      p.renvoi = await p.evaluate(() => [...document.querySelectorAll('[role="dialog"], dialog')].filter(e => e.getBoundingClientRect().height > 0).map(e => (e.textContent || '').replace(/\s+/g, ' ').trim()).join(' | '));
      p.noteEtat = `${p.noteEtat ? `${p.noteEtat} ; ` : ''}feuille du brassin habituel : rangée ${p.feuilleBrassin.rangee || 'aucune'}, pressées ${p.feuilleBrassin.presse.join(', ') || 'aucune'} ; échéance touchée : « ${(p.renvoi || 'rien').slice(0, 90)} »`;
    },
    attendu: [fn(async p => ({ ok: p.feuilleBrassin?.rangee === 'brassins' && p.feuilleBrassin.presse.length > 0, dit: `rangée ${p.feuilleBrassin?.rangee || 'aucune'}, puces pressées : ${(p.feuilleBrassin?.presse || []).join(', ') || 'aucune'}` }), 'le brassin habituel ouvre la feuille Brassins, recette pressée (capture 44a)'),
      fn(async p => ({ ok: /Finances/.test(p.renvoi || ''), dit: (p.renvoi || 'rien d’ouvert').slice(0, 80) }), 'l’échéance renvoie à Finances')] },
  { n: '45', nom: 'propositions-acceptees', geste: 'toucher le brassin habituel proposé (pointillé), puis Ajouter', mesure: p => p.evaluate(() => `${document.querySelectorAll('[data-proposition="brassin-habituel"]').length} proposé(s) · ${document.querySelectorAll('section[data-rangee="brassins"] [data-chose]').length} chose(s) dans Brassins`), jouer: async p => { await toucher(p, { data: 'data-proposition="brassin-habituel"' }); await toucher(p, boutonFeuille(/^Ajouter/)); },
    attendu: [/Annuler/, fn(async p => p.evaluate(() => document.querySelectorAll('[data-proposition="brassin-habituel"]').length === 0), 'la proposition est devenue un brassin plein')] },
  { n: '46', nom: 'budget', geste: 'toucher la Blonde, puis Budget ›', jouer: async p => { await toucher(p, { titre: 'Blonde d’automne' }); await toucher(p, { texte: /^Budget ›/ }); }, attendu: [/budget/i] },

  { n: '47', nom: 'etoile-courbe', geste: 'appui long sur le Marché de Noël, Étoile', mesure: lireTexte, jouer: async p => { await appuiLong(p, { titre: 'Marché de Noël' }); await toucher(p, { dans: { role: 'menu' }, texte: /^Étoile/ }); },
    attendu: [fn(etoileSurCourbe, 'l’étoile est sur la courbe (dans l’en-tête, hors de la frise)')] },
  /* CRITIQUE-12 (m48) : le menu dit « Achats seuls · 6 rangées masquées » ; le sélecteur prend l'accord, masculin ou féminin */
  { n: '48', nom: 'achats-seuls', geste: 'appui long sur la Hotte, « Achats seuls »', jouer: async p => { await appuiLong(p, { titre: 'Hotte' }); await toucher(p, { dans: { role: 'menu' }, texte: /^Achats seul/ }); },
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
    attendu: [fn(async p => ({ ok: (p.sousPlus || []).every(v => !v.some(t => /[−+-]\s?\d/.test(t))), dit: (p.sousPlus || []).map(v => v.join(' / ') || 'rien').join(' ; ') }), 'aucun montant sous le + (haut, milieu, bout) : « +640 » de Noël privés hors du rect du + (n° 4 de CRITIQUE-12)')] },
  /* CRITIQUE-12 n° 4 : au repos à 390, sans rotation (m27, m21x, c01) : la pastille « +640 » de Noël privés hors du rect du +, en haut, au milieu, au bout */
  { n: '35p', nom: 'repos-plus-montants', cave: true, repos: true, geste: 'aucun (repos) ; défiler haut, milieu, bout ; lire les textes sous le +', sansObjet: cfg => (cfg.tactile && cfg.h > cfg.w ? null : 'le + se juge à 390 portrait (en paysage et à 1280, FAB-RECOUVRE de controle-calendrier-app)'),
    jouer: async p => {
      const vus = [];
      for (const part of [0, 0.5, 1]) {
        await p.evaluate(x => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * x), part); await attendre(400);
        vus.push(await sousLePlus(p));
        if (part === 0) await p.screenshot({ path: join(DOSSIER, `${p.cfgNom}-${p.theme}-35p-repos-plus-haut.png`) });
      }
      p.sousPlus = vus;
      p.noteEtat = vus.map((v, i) => `${['haut', 'milieu', 'bout'][i]} : ${v.length ? v.join(' / ') : 'rien sous le +'}`).join(' ; ');
    },
    attendu: [fn(async p => ({ ok: (p.sousPlus || []).every(v => !v.some(t => /[−+-]\s?\d/.test(t))), dit: (p.sousPlus || []).map(v => v.join(' / ') || 'rien').join(' ; ') }), 'aucun montant sous le + au repos (« +640 » hors du rect du +)')] },
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
      await fenetreTravaux(p); await toucherAjouter(p); await attendre(500);
      p.message = await messageLu(p); p.lignesMessage = await lignesDe(p, '[data-message]');
      await p.screenshot({ path: join(DOSSIER, `${p.cfgNom}-${p.theme}-39m-message-voir.png`) });
      await toucher(p, { dans: { role: 'status|alert' }, role: 'button', texte: /^Voir S20/ });
      await attendre(600);
      /* vision 13 (paysage-39v) : ce que « Voir S20 › » montre, AVANT que le harnais ne défile : la barre à l'écran, sous l'en-tête collé */
      p.vueApresVoir = await p.evaluate(() => {
        const e = [...document.querySelectorAll('section[data-rangee="travaux"] [data-barre], section[data-rangee="travaux"] [data-chose]')].find(x => /\bS20\b/.test(`${x.getAttribute('aria-label') || ''} ${x.getAttribute('data-titre') || ''}`));
        if (!e) return { ok: false, dit: 'barre S20 absente' };
        const r = e.getBoundingClientRect(); const h = document.querySelector('[data-entete-zone]')?.getBoundingClientRect().bottom ?? 0;
        return { ok: r.top >= h - 1 && r.bottom <= innerHeight, dit: `barre ${Math.round(r.top)}–${Math.round(r.bottom)} px, bas de l’en-tête ${Math.round(h)} px, écran ${innerHeight} px` };
      });
      await p.screenshot({ path: join(DOSSIER, `${p.cfgNom}-${p.theme}-39w-apres-voir.png`) });
      p.noteEtat = `message « ${p.message.slice(0, 90)} » sur ${p.lignesMessage} ligne(s) (capture 39m-message-voir) ; ${await cadreLu(p)}`;
    },
    attendu: [fn(async p => ({ ok: /Voir S20 ›/.test(p.message || '') && /Annuler/.test(p.message || '') && p.lignesMessage >= 1 && p.lignesMessage <= 2, dit: `« ${(p.message || '').slice(0, 80)} », ${p.lignesMessage} ligne(s)` }), 'le message porte « Voir S20 › » et Annuler, sur deux lignes au plus'),
      fn(async p => ({ ok: !!p.vueApresVoir && p.vueApresVoir.ok, dit: p.vueApresVoir ? p.vueApresVoir.dit : 'non lu' }), '« Voir S20 › » amène la barre à l’écran, sous l’en-tête (capture 39w, avant tout défilement du harnais)'),
      fn(async p => p.evaluate(() => { const n = document.querySelector('[data-frise]')?.getAttribute('data-nb-colonnes'); const pay = innerWidth > innerHeight && matchMedia('(pointer: coarse)').matches; return { ok: n === '26' || (pay && n === '13'), dit: `${n} colonnes${pay ? ' (paysage : 13 semaines, E10)' : ''}` }; }), 'la période passe à 6 mois (26 colonnes ; 13 en paysage)'),
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
    interdit: [/lié à Blonde d’automne · Blonde d’automne/] },

  /* ---------- CRITIQUE-11 : un état par n°, chaque attendu échoue si l'état n'a pas été joué (L13) ---------- */
  /* n° 1 (E04, E13, E40 ; D-184, D-194, D-204) : Liste en An ; aucun libellé de la bande n'en chevauche un autre ; le cadre dit « nov. – nov. 2027 » */
  { n: '31a', nom: 'liste-an-bande', cave: true, geste: 'période An (menu), puis Liste ; lire la bande et le cadre',
    mesure: p => p.evaluate(() => `${document.querySelector('[data-vue-liste]') ? 'liste' : 'frise'} · ${document.querySelector('.ent-cadre[role="group"]')?.getAttribute('aria-label') || ''}`),
    jouer: async p => {
      await menuPeriode(p, /^An\b/); await p.keyboard.press('Escape').catch(() => {}); await attendre(400);
      await menuPeriode(p, /^Liste/); await p.keyboard.press('Escape').catch(() => {}); await attendre(400);
      await p.evaluate(() => window.scrollTo(0, 0)); await attendre(300);
      if (!(await p.evaluate(() => !!document.querySelector('[data-vue-liste]')))) throw new Absent('la Liste ne s’ouvre pas');
    },
    attendu: [fn(bandeListeLisible, 'aucun libellé de la bande n’en chevauche un autre (ou la Liste masque la bande)'), fn(cadreEnMois, 'le cadre suit la période : « mois – mois année »')] },
  /* n° 2 (E29, E22, E33) : en 6 mois, une colonne ne fait qu'environ 14 px à 390 ; au lâcher, la rangée Brassins reste visible (aucun clic sur l'œil) */
  ...[['09c', 'f2a-6mois-1col', 'période 6 mois ; tirer le bord ([data-bord]) de la Blonde d’une colonne, lâcher', true],
    ['08c', 'f1a-6mois-1col', 'période 6 mois ; glisser la Blonde d’une colonne, lâcher', false]].map(([n, nom, geste, bord]) => ({
    n, nom, geste, sansObjet: cfg => (cfg.tactile && cfg.w > cfg.h ? 'en paysage la fenêtre est de 13 semaines, sans 6 mois (E10)' : null), mesure: p => choseLue(p, 'Blonde d’automne'),
    jouer: async p => {
      await menuPeriode(p, /^6 mois/); await p.keyboard.press('Escape').catch(() => {}); await attendre(400);
      await trouver(p, { titre: 'Blonde d’automne' });
      p.lc = await largeurColonne(p);
      p.boiteAvant = await boiteChose(p, 'Blonde d’automne'); p.blondeAvant = await choseLue(p, 'Blonde d’automne');
      await glisserChose(p, 'Blonde d’automne', 1, bord ? { sous: '[data-bord]' } : {});
      await attendre(600);
      p.boiteApres = await boiteChose(p, 'Blonde d’automne'); p.blondeApres = await choseLue(p, 'Blonde d’automne');
      p.noteEtat = `colonne ${p.lc.toFixed(1)} px ; avant « ${p.blondeAvant.slice(0, 70)} » ; après « ${p.blondeApres.slice(0, 70)} »`;
    },
    attendu: [fn(brassinsVisibles, 'la rangée Brassins reste visible, sans « choses cachées »'), bord
      ? fn(async p => { const d = t => Number((/J\d+ \/ (\d+)/.exec(t || '') || [])[1]); const a = d(p.blondeAvant), b = d(p.blondeApres); const A = p.boiteAvant, B = p.boiteApres; return { ok: Number.isFinite(a) && b === a + 7 && !!A && !!B && Math.abs(A.g - B.g) < 3 && B.w > A.w, dit: `J0 / ${a} → J0 / ${b} ; début ${A ? Math.round(A.g) : '?'} → ${B ? Math.round(B.g) : '?'} ; largeur ${A ? Math.round(A.w) : '?'} → ${B ? Math.round(B.w) : '?'}` }; }, 'la Blonde allongée de 7 j (« J0 / 35 »), début immobile')
      : fn(async p => { const A = p.boiteAvant, B = p.boiteApres; const dx = A && B ? B.g - A.g : NaN; return { ok: Number.isFinite(dx) && Math.abs(dx - p.lc) < p.lc * 0.45, dit: `barre déplacée de ${Number.isFinite(dx) ? Math.round(dx) : '?'} px (colonne ${Math.round(p.lc || 0)} px)` }; }, 'la barre de la Blonde déplacée d’une colonne')] })),
  /* ---------- CRITIQUE-12 n° 1 (bloquant) : les 7 messages, à m390, p844, d1280, clair et cave ; « MESSAGE OK » si place ∈ {pres, bas},
     0 intersection avec NOMS_MESSAGE et le +, jamais au-dessus de la première rangée visible. Groupe `--etats msg`. ---------- */
  ...[
    ['M1', 'message-f1a', 'glisser la Hotte de 2 colonnes, lâcher', async p => { await glisserChose(p, 'Hotte', 2); }],
    ['M2', 'message-f2a', 'tirer le bord ([data-bord]) de la Blonde d’une colonne (3 mois si elle finit au bord de la fenêtre)', async p => { await gesteF2a(p); }],
    ['M3', 'message-f6b', 'glisser la Blonde de 2 colonnes (promesse La Cigogne : alerte)', async p => { await glisserChose(p, 'Blonde d’automne', 2); }],
    ['M4', 'message-livrer', 'glisser la Blonde de 2 colonnes, puis « Livrer le … »', async p => { await glisserChose(p, 'Blonde d’automne', 2); await toucher(p, { texte: /^Livrer le/ }); }],
    ['M5', 'message-lier', 'appui long sur la Hotte, Lier, Blonde d’automne', async p => { await appuiLong(p, { titre: 'Hotte' }); await toucher(p, { dans: { role: 'menu' }, texte: /^Lier/ }); await toucher(p, { dans: { role: 'menu' }, texte: /^Blonde d’automne$/ }); }],
    ['M6', 'message-retirer', 'appui long sur le Marché de Noël, Retirer', async p => { await appuiLong(p, { titre: 'Marché de Noël' }); await toucher(p, { dans: { role: 'menu' }, texte: /^(Retirer|Ranger sans date|Annuler l|Annuler la|Annuler le)/ }); }],
    ['M7', 'message-refus-jalon', 'tirer le jalon dry hop de la Blonde (intermédiaire) : refus', async p => {
      if (!(await existe(p, { titre: 'Blonde d’automne', sous: '[data-jalon="dry-hop"]' }))) throw new Absent('jalon [data-jalon="dry-hop"] de la Blonde introuvable');
      await glisserChose(p, 'Blonde d’automne', 1, { sous: '[data-jalon="dry-hop"]' });
    }]
  ].map(([n, nom, geste, faire]) => ({
    n, nom, geste: `${geste} ; mesurer la boîte du message`, cave: true, mesure: messageLu,
    jouer: async p => {
      await faire(p);
      await attendre(700); /* le message se replace à 150 et 500 ms (Message.tsx) */
      p.mesureMsg = await mesureMessage(p);
      p.noteEtat = p.mesureMsg.dit;
      console.log(`${p.mesureMsg.ok ? 'MESSAGE OK' : 'MESSAGE ECHEC'} ${p.cfgNom}-${p.theme}-${n}-${nom} : ${p.mesureMsg.dit.replace(/^MESSAGE (OK|ECHEC) : /, '').slice(0, 220)}`);
    },
    attendu: [fn(async p => ({ ok: !!p.mesureMsg && p.mesureMsg.ok, dit: p.mesureMsg ? p.mesureMsg.dit : 'non mesuré' }), 'message à sa place (pres ou bas), 0 intersection avec un nom ou le +, jamais au-dessus de la première rangée')]
  })),
  /* CRITIQUE-12, doute paysage (p10, p12 : feuille « Brassins · Ajouter en S52 » après l'Annuler de f1-a) : Annuler touché AU DOIGT (CDP
     Input.dispatchTouchEvent), capture 1 s après ; attendu : aucune feuille d'ajout, la Hotte revenue */
  { n: '08x', nom: 'f1a-annuler-doigt', cave: true, repos: true, geste: 'glisser la Hotte de 2 colonnes, lâcher, puis Annuler au doigt ; capture 1 s après',
    jouer: async p => {
      p.hotteAvant = await choseLue(p, 'Hotte');
      await glisserChose(p, 'Hotte', 2); await attendre(300);
      p.hotteGlissee = await choseLue(p, 'Hotte');
      await toucher(p, { dans: { role: 'status|alert' }, role: 'button', texte: /Annuler$/ });
      await attendre(1000);
      p.hotteApres = await choseLue(p, 'Hotte');
      p.noteEtat = `Hotte avant « ${p.hotteAvant.slice(0, 40)} », glissée « ${p.hotteGlissee.slice(0, 40)} », après Annuler « ${p.hotteApres.slice(0, 40)} » ; toucher ${p.cfg.tactile ? 'CDP (doigt)' : 'souris'}`;
    },
    attendu: [fn(async p => p.evaluate(() => { const f = [...document.querySelectorAll('[data-feuille-rangee], [role="dialog"], dialog')].filter(e => e.getBoundingClientRect().height > 0); return { ok: f.length === 0, dit: f.length ? `ouvert : ${f.map(e => `${e.getAttribute('data-feuille-rangee') || ''} « ${(e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50)} »`).join(' | ')}` : 'aucune feuille ni dialogue' }; }), 'aucune feuille « Ajouter » 1 s après Annuler'),
      fn(async p => ({ ok: p.hotteGlissee.split(' · ')[0] !== p.hotteAvant.split(' · ')[0] && p.hotteApres.split(' · ')[0] === p.hotteAvant.split(' · ')[0], dit: `${p.hotteAvant.split(' · ')[0]} → ${p.hotteGlissee.split(' · ')[0]} → ${p.hotteApres.split(' · ')[0]}` }), 'la Hotte a bougé, puis est revenue à sa place')] },
  /* n° 3 (E33, E35, D-200) : le message de f1-a et celui de Retirer ne couvrent aucun nom ; Annuler est touchable (rien, ni le +, posé dessus) */
  { n: '08m', nom: 'f1a-message-place', geste: 'glisser la Hotte de 2 colonnes, lâcher ; lire la place du message et de son Annuler', mesure: p => choseLue(p, 'Hotte'),
    jouer: async p => { await glisserChose(p, 'Hotte', 2); await attendre(300); p.message = await messageLu(p); p.noteEtat = `message « ${p.message.slice(0, 80)} »`; },
    attendu: [/Annuler/, fn(messageSansNom, 'le message ne couvre aucun nom'), fn(annulerTouchable, 'Annuler touchable : elementFromPoint en son centre = Annuler')] },
  { n: '12m', nom: 'retirer-message-place', geste: 'appui long sur le Marché de Noël, Retirer ; lire la place du message et de son Annuler', mesure: p => fetesLues(p),
    jouer: async p => { await appuiLong(p, { titre: 'Marché de Noël' }); await toucher(p, { dans: { role: 'menu' }, texte: /^(Retirer|Ranger sans date|Annuler l|Annuler la|Annuler le)/ }); await attendre(300); p.message = await messageLu(p); p.noteEtat = `message « ${p.message.slice(0, 80)} »`; },
    attendu: [/Retirée? de S\d+/, fn(messageSansNom, 'le message ne couvre aucun nom'), fn(annulerTouchable, 'Annuler touchable : elementFromPoint en son centre = Annuler')] },
  /* n° 4 (E31, D-192) : le menu d'une fête dit l'effet de Dupliquer et de Retirer */
  { n: '11f', nom: 'f5a-menu-fete', cave: true, geste: 'appui long sur le Marché de Noël ; lire Dupliquer et Retirer avec leur effet',
    jouer: async p => { await appuiLong(p, { titre: 'Marché de Noël' }); await attendre(200); p.items = await itemsMenu(p); p.noteEtat = p.items.map(i => `« ${i.texte} »`).join(' ; ').slice(0, 300); },
    attendu: [fn(async p => effetDit(p, /^Dupliquer en S\d+/), '« Dupliquer en S… » avec son effet'), fn(async p => effetDit(p, /^(Retirer|Ranger sans date|Annuler l|Annuler la|Annuler le)/), '« Retirer » avec son effet')] },
  /* n° 6 (E33) : pendant f1-a (la Saison, sur la rangée Brassins, comme m390-09), la bulle ne croise ni un titre de rangée ni une pastille, et le tracé
     de la courbe ne barre aucune étiquette d'axe ; en 6 sem. puis en 6 mois */
  ...[['07b', 'f1a-bulle-6sem', null], ['07m', 'f1a-bulle-6mois', /^6 mois/]].map(([n, nom, periode]) => ({
    n, nom, geste: `${periode ? 'période 6 mois ; ' : ''}glisser la Saison de ferme de 2 colonnes, doigt tenu ; la bulle et les étiquettes d’axe de la courbe`,
    sansObjet: cfg => (periode && cfg.tactile && cfg.w > cfg.h ? 'en paysage, pas de 6 mois (E10)' : null),
    mesure: p => p.evaluate(() => (document.querySelector('[data-ici]')?.textContent || '').trim() || 'pas de bulle'),
    jouer: async p => {
      if (periode) { await menuPeriode(p, periode); await p.keyboard.press('Escape').catch(() => {}); await attendre(400); }
      await glisserChose(p, 'Saison de ferme', 2, { tenu: true }); await attendre(250);
    },
    attendu: [/lâcher ici/, fn(bulleLibre, 'la bulle ne croise ni un titre de rangée (.cal-rh) ni une pastille'), fn(axesNonBarres, 'aucune étiquette d’axe de la courbe barrée par le tracé')], fin: lacher })),
  /* n° 7 : dans la Liste, chaque date tient sur une ligne (« prête 7 / déc. » refusé) */
  { n: '31d', nom: 'liste-dates-une-ligne', cave: true, geste: 'période, puis Liste ; chaque date lue sur une seule ligne', mesure: p => p.evaluate(() => (document.querySelector('[data-vue-liste]') ? 'liste' : 'frise')),
    jouer: async p => { await menuPeriode(p, /^Liste/); await p.keyboard.press('Escape').catch(() => {}); await attendre(400); },
    attendu: [fn(datesUneLigne, 'chaque date de la Liste sur une seule ligne (getClientRects : une ligne)')] },
  /* n° 8 (E31, E37, D-113, D-126) : après Lier, « Liée à Blonde d’automne » et Annuler visibles en même temps que le détail ouvert de la Hotte */
  { n: '49m', nom: 'lier-message-detail', cave: true, geste: 'appui long sur la Hotte, Lier, Blonde d’automne ; le détail de la Hotte ouvert ; message et Annuler lus en même temps', mesure: p => choseLue(p, 'Hotte'),
    jouer: async p => {
      await appuiLong(p, { titre: 'Hotte' }); await toucher(p, { dans: { role: 'menu' }, texte: /^Lier/ }); await toucher(p, { dans: { role: 'menu' }, texte: /^Blonde d’automne$/ });
      await attendre(500);
      p.messageLier = await messageLu(p);
      const ouvert = () => p.evaluate(() => [...document.querySelectorAll('[role="region"][aria-label^="Détail"]')].some(d => /Hotte/.test(`${d.getAttribute('aria-label')} ${d.textContent}`)));
      if (!(await ouvert())) await toucher(p, { titre: 'Hotte' });
      await attendre(500);
      p.noteEtat = `message après Lier « ${p.messageLier.slice(0, 70)} » ; après le détail « ${(await messageLu(p)).slice(0, 70)} »`;
    },
    attendu: [fn(async p => p.evaluate(() => {
      const vis = e => { if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight; };
      const m = document.querySelector('[data-message]'); const t = (m?.textContent || '').replace(/\s+/g, ' ').trim();
      const an = m && [...m.querySelectorAll('button')].find(b => /Annuler$/.test((b.textContent || '').trim()));
      const d = [...document.querySelectorAll('[role="region"][aria-label^="Détail"]')].find(x => /Hotte/.test(`${x.getAttribute('aria-label')} ${x.textContent}`));
      return { ok: /Liée? à Blonde d’automne/.test(t) && vis(m) && vis(an) && vis(d), dit: `message « ${t.slice(0, 60) || 'absent'} » ${vis(m) ? 'visible' : 'invisible'}, Annuler ${vis(an) ? 'visible' : 'absent'}, détail de la Hotte ${vis(d) ? 'ouvert à l’écran' : 'absent'}` };
    }), '« Liée à Blonde d’automne · Annuler » et le détail de la Hotte, à l’écran ensemble'),
      /* CRITIQUE-12 n° 3 (m49m : « prête 21 » puis « déc. ») : chaque date du détail de la Hotte liée sur une seule ligne */
      fn(async p => datesUneLigne(p, '[role="region"][aria-label^="Détail : Hotte"], [data-detail]'), 'chaque date du détail de la Hotte sur une seule ligne (n° 3 de CRITIQUE-12)')] },
  /* reste corr10 (m38) : plein écran à 390, puis 30 px de défilement : l'invite « Tourne le téléphone » est partie, ou ne couvre aucun nom */
  { n: '30d', nom: 'plein-ecran-invite-defile', geste: 'toucher ⛶, lire l’invite, puis défiler de 30 px', sansObjet: cfg => (cfg.tactile && cfg.h > cfg.w ? null : 'l’invite de rotation ne concerne que le téléphone en portrait'),
    mesure: p => p.evaluate(() => `${Math.round(scrollY)}`),
    jouer: async p => {
      await toucher(p, { aria: /^Plein écran/ }); await attendre(500);
      p.inviteAvant = /Tourne le téléphone/.test(await lireTexte(p));
      await p.screenshot({ path: join(DOSSIER, `${p.cfgNom}-${p.theme}-30a-invite-avant-defilement.png`) });
      await p.evaluate(() => window.scrollBy(0, 30)); await attendre(600);
      p.messageApres = await messageLu(p);
      p.noteEtat = `invite avant le défilement : ${p.inviteAvant ? 'vue' : 'ABSENTE'} (capture 30a) ; message après « ${p.messageApres.slice(0, 60)} »`;
    },
    attendu: [fn(async p => ({ ok: !!p.inviteAvant, dit: p.inviteAvant ? 'invite vue' : 'invite jamais vue' }), 'l’invite « Tourne le téléphone » est montrée par ⛶'),
      fn(async p => (/Tourne le téléphone/.test(p.messageApres || '') ? messageSansNom(p) : { ok: true, dit: 'invite partie au défilement' }), 'après 30 px, l’invite est partie ou ne couvre aucun nom')] }
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
/* ---------- CRITIQUE-11 : lectures des états neufs ---------- */
/** « 29 déc. (S53) » : une date suivie de sa semaine entre parenthèses (n° 5). */
const RE_DATE_SEMAINE = /\d{1,2} (?:janv\.|févr\.|mars|avr\.|mai|juin|juil\.|août|sept\.|oct\.|nov\.|déc\.) \(S\d{1,2}\)/u;
/** Une date de la Liste, « 7 déc. » (l'espace peut être insécable). */
const RE_DATE_LISTE = /\d{1,2}\s(?:janv\.|févr\.|mars|avr\.|mai|juin|juil\.|août|sept\.|oct\.|nov\.|déc\.)/gu;
/** Le cadre d'une période en mois : « nov. – nov. 2027 » ou « nov. 2026 – nov. 2027 » ; jamais des semaines (n° 1). */
const RE_CADRE_MOIS = /\p{L}{3,}\.?(?: \d{4})? – \p{L}{3,}\.? \d{4}/u;
/** Les rangées qui disent « n choses cachées » (garde d'entrée : 0 attendu, CRITIQUE-11 contamination). */
function chosesCachees(p) {
  return p.evaluate(() => [...document.querySelectorAll('section[data-rangee]')].filter(s => /cachée/.test(s.textContent || '')).map(s => s.getAttribute('data-rangee')));
}
/** Départ de c2-b (corr10-B) : `.ent-cb` à 50 % / 50 % ; glissé de 80 px vers la droite (moins s'il sort), hors du cadre et de ses poignées. */
function departCB(p) {
  return p.evaluate(() => {
    const cb = [...document.querySelectorAll('.ent-cb')].find(e => e.getBoundingClientRect().width > 100);
    if (!cb) return { ok: false, dit: '.ent-cb introuvable' };
    const C = cb.getBoundingClientRect();
    const x = C.left + C.width / 2, y = C.top + C.height / 2;
    const sous = document.elementFromPoint(x, y);
    const pris = sous && sous.closest('.ent-cadre, [data-poignee], [data-cadre-tirage], button');
    const dx = Math.min(80, C.right - 8 - x);
    return { ok: !pris && dx > 20, x, y, dx, dit: `départ .ent-cb 50 % / 50 % (${Math.round(x)}, ${Math.round(y)}), glissé ${Math.round(dx)} px ; sous le doigt : <${sous?.tagName.toLowerCase()}${sous?.getAttribute?.('class') ? `.${String(sous.getAttribute('class')).split(' ')[0]}` : ''}>${pris ? ' PRIS PAR UN CADRE OU UN BOUTON' : ''}` };
  });
}
/** Le curseur de lecture (E11) passe SOUS les noms de la courbe : chaque nom que sa ligne croise est peint après lui (au-dessus). */
function curseurSousNoms(p) {
  return p.evaluate(() => {
    const c = document.querySelector('[data-curseur]');
    if (!c) return { ok: false, dit: 'curseur absent (aucune lecture en cours)' };
    const ligne = c.querySelector('line') || c; const L = ligne.getBoundingClientRect();
    const svg = c.closest('svg');
    const noms = [...svg.querySelectorAll('text')].filter(t => !c.contains(t) && /\p{L}/u.test(t.textContent || '')).filter(t => { const r = t.getBoundingClientRect(); return r.width > 0 && r.left < L.right && r.right > L.left && r.top < L.bottom && r.bottom > L.top; });
    const dessous = noms.filter(t => !(c.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING));
    return { ok: dessous.length === 0, dit: `${noms.length} nom(s) croisé(s) par le curseur${noms.length ? ` : ${noms.map(t => `« ${(t.textContent || '').slice(0, 24)} »`).join(', ')}` : ''}${dessous.length ? ` ; peints SOUS le curseur : ${dessous.map(t => `« ${(t.textContent || '').slice(0, 24)} »`).join(', ')}` : ''}` };
  });
}
/** Sur la grande courbe, le doigt glisse de 30 % à 70 % de sa largeur, tenu : deux semaines lues (« S… » du curseur), détail ouvert. */
async function lectureGrande(p) {
  const z = await p.evaluate(() => { const w = document.querySelector('[data-vue="graph"] .ent-gc-w'); if (!w) return null; const r = w.getBoundingClientRect(); return { x: r.left + r.width * 0.3, y: r.top + r.height * 0.45, w: r.width }; });
  if (!z) return { ok: false, dit: 'zone de la grande courbe introuvable' };
  const lire = () => p.evaluate(() => ({ s: (document.querySelector('[data-vue="graph"] .ent-cur-s')?.textContent || '').trim(), d: (document.querySelector('[data-vue="graph"] .ent-gc-d')?.textContent || '').replace(/\s+/g, ' ').trim() }));
  await glisserXY(p, z.x, z.y, z.w * 0.1, 0, { tenu: true });
  const a = await lire();
  for (let i = 1; i <= 8; i++) { const x = z.x + z.w * 0.1 + (z.w * 0.3 * i) / 8; if (p.cfg.tactile) await touche(p, 'touchMove', x, z.y); else await p.mouse.move(x, z.y); await attendre(25); }
  p.doigt = { x: z.x + z.w * 0.4, y: z.y };
  await attendre(250);
  const b = await lire();
  return { ok: !!a.s && !!b.s && a.s !== b.s && !!b.d, dit: `lecture sous le doigt « ${a.s || '—'} » puis « ${b.s || '—'} » ; détail « ${b.d.slice(0, 60) || 'absent'} »` };
}
function grandeSegments(p) {
  return p.evaluate(() => { const l = [...document.querySelectorAll('[data-vue="graph"] path.ent-sgm')]; const c = new Set(l.map(e => [...e.classList].find(k => k.startsWith('ent-c-'))).filter(Boolean)); return { ok: l.length > 4 && c.size >= 2, dit: `${l.length} segments, ${c.size} couleur(s) : ${[...c].join(' ')}` }; });
}
function grandeCreux(p) {
  return p.evaluate(() => { const g = document.querySelector('[data-vue="graph"] .ent-gc-creux'); const t = (g?.querySelector('[data-creux-etiquette]')?.textContent || '').trim(); return { ok: !!g && !!g.querySelector('.ent-creux-pt') && !!t, dit: g ? `creux « ${t} »` : 'creux non marqué' }; });
}
function grandeBande(p) {
  return p.evaluate(() => {
    const l = [...document.querySelectorAll('[data-vue="graph"] rect.ent-bd-fin')].map(e => e.getBoundingClientRect()).filter(r => r.width > 0);
    const w = document.querySelector('[data-vue="graph"] .ent-gs')?.getBoundingClientRect();
    const h = l.length ? Math.max(...l.map(r => r.height)) : 0; const bas = l.length && w ? Math.min(...l.map(r => r.top)) > w.top + w.height * 0.6 : false;
    return { ok: l.length >= 10 && h <= 14 && bas, dit: `${l.length} case(s) de frise, ${Math.round(h)} px de haut, ${bas ? 'sous la courbe' : 'PAS sous la courbe'}` };
  });
}
function grandeCote(p) {
  return p.evaluate(() => {
    const paysage = innerWidth > innerHeight && matchMedia('(pointer: coarse)').matches;
    if (!paysage) return { ok: true, dit: 'sans objet hors paysage' };
    const w = document.querySelector('[data-vue="graph"] .ent-gc-w')?.getBoundingClientRect(), c = document.querySelector('[data-vue="graph"] .ent-gc-cote')?.getBoundingClientRect();
    if (!w || !c) return { ok: false, dit: `courbe ${w ? 'lue' : 'absente'}, colonne du détail ${c ? 'lue' : 'absente'}` };
    return { ok: w.right <= c.left + 1 && w.top < c.bottom && c.top < w.bottom && c.width > 60, dit: `courbe ${Math.round(w.left)}–${Math.round(w.right)} px, détail ${Math.round(c.left)}–${Math.round(c.right)} px` };
  });
}
/** La bande de la Liste en An : ses libellés (semaines ou mois) ne se chevauchent pas deux à deux ; une Liste sans bande passe aussi (correction admise). */
function bandeListeLisible(p) {
  return p.evaluate(() => {
    const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
    const zones = [...document.querySelectorAll('[data-bande-semaines], [aria-label^="L’année en"], [aria-label^="Semaines"]')].filter(vis);
    if (!zones.length) return { ok: true, dit: 'la Liste masque la bande' };
    const els = [...new Set(zones.flatMap(z => [...z.querySelectorAll('*')]))].filter(e => e.children.length === 0 && (e.textContent || '').trim() && vis(e));
    const boite = e => { if (e instanceof SVGElement) return e.getBoundingClientRect(); const r = document.createRange(); r.selectNodeContents(e); return r.getBoundingClientRect(); };
    const b = els.map(e => { const q = boite(e); return { t: (e.textContent || '').trim(), g: q.left, d: q.right, h: q.top, b: q.bottom }; }).filter(o => o.d > o.g);
    const chev = [];
    for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) { const a = b[i], c = b[j]; if (a.g < c.d - 0.5 && c.g < a.d - 0.5 && a.h < c.b - 0.5 && c.h < a.b - 0.5) chev.push(`${a.t}/${c.t}`); }
    return { ok: chev.length === 0, dit: `${b.length} libellé(s) : « ${b.map(o => o.t).join(' ').slice(0, 100)} » ; ${chev.length ? `${chev.length} chevauchement(s) : ${chev.slice(0, 6).join(', ')}` : 'aucun chevauchement'}` };
  });
}
async function cadreEnMois(p) {
  const t = await p.evaluate(() => { const c = document.querySelector('.ent-cadre[role="group"]'); return c ? (c.getAttribute('aria-label') || '').replace(/^Fenêtre : /, '') : `bouton « ${(document.querySelector('[data-ent-periode]')?.textContent || '').trim()} »`; });
  return { ok: RE_CADRE_MOIS.test(t) && !/S\d+/.test(t), dit: `cadre « ${t} »` };
}
/** La rangée Brassins à l'écran, sans « choses cachées », la Blonde visible, `calendrier_masquees` sans « brassins ». */
function brassinsVisibles(p) {
  return p.evaluate(() => {
    const s = document.querySelector('section[data-rangee="brassins"]'); const t = (s?.textContent || '').replace(/\s+/g, ' ');
    let m = []; try { m = JSON.parse(localStorage.getItem('laffinee_ui_state') || '{}').calendrier_masquees || []; } catch { m = []; }
    const b = [...document.querySelectorAll('section[data-rangee="brassins"] [data-barre], section[data-rangee="brassins"] [data-chose]')].find(e => (e.getAttribute('data-titre') || e.getAttribute('aria-label') || '').startsWith('Blonde'));
    return { ok: !!s && !/cachée/.test(t) && !m.includes('brassins') && !!b && b.getBoundingClientRect().width > 0, dit: `Brassins ${s ? (/cachée/.test(t) ? `« ${(/\d+ choses? cachées?/.exec(t) || ['cachée'])[0]} »` : 'visible') : 'absente'} ; masquées ${JSON.stringify(m)} ; Blonde ${b ? 'visible' : 'absente'}` };
  });
}
/** Annuler du message : rien n'est posé dessus en son centre (le + volant compris). */
function annulerTouchable(p) {
  return p.evaluate(() => {
    const m = document.querySelector('[data-message]'); const a = m && [...m.querySelectorAll('button')].find(b => /Annuler$/.test((b.textContent || '').trim()));
    if (!a) return { ok: false, dit: 'Annuler absent du message' };
    const r = a.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { ok: !!e && (e === a || a.contains(e)), dit: `au centre d’Annuler (${Math.round(r.left + r.width / 2)}, ${Math.round(r.top + r.height / 2)}) : <${e?.tagName.toLowerCase()}> « ${(e?.closest('button')?.getAttribute('aria-label') || e?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30)} » ; message ${m.dataset.place || 'à sa place'}` };
  });
}
/** Les lignes du menu ouvert : l'action et ce qui suit (l'effet). */
function itemsMenu(p) {
  return p.evaluate(() => {
    const m = document.querySelector('[role="menu"]'); if (!m) return [];
    return [...m.querySelectorAll('[role^="menuitem"], button')].filter(b => b.getBoundingClientRect().height > 0).map(b => {
      const effet = [...b.querySelectorAll('em, small, [data-effet], [data-effet-dupliquer]')].map(x => (x.textContent || '').trim()).filter(Boolean).join(' ');
      return { texte: (b.innerText || b.textContent || '').replace(/\s*\n\s*/g, ' · ').replace(/\s+/g, ' ').trim(), effet };
    });
  });
}
async function effetDit(p, re) {
  const i = (p.items || []).find(x => re.test(x.texte));
  if (!i) return { ok: false, dit: `ligne ${re.source} absente du menu` };
  const apres = /·\s*(\S.*)$/.exec(i.texte)?.[1] || '';
  return { ok: !!i.effet || !!apres, dit: `« ${i.texte} »${i.effet ? ` (effet « ${i.effet} »)` : ''}` };
}
/** La bulle « lâcher ici » ne croise aucun texte de titre de rangée (`.cal-rh`) ni aucune pastille (n° 6). */
function bulleLibre(p) {
  return p.evaluate(() => {
    const b = document.querySelector('[data-ici]'); if (!b) return { ok: false, dit: 'aucune bulle' };
    const B = b.getBoundingClientRect();
    const boite = e => { const r = document.createRange(); r.selectNodeContents(e); return r.getBoundingClientRect(); };
    const obst = [...[...document.querySelectorAll('.cal-rh *')].filter(e => e.children.length === 0 && /\S/.test(e.textContent || '')).map(e => ({ n: (e.textContent || '').trim().slice(0, 20), r: boite(e) })),
      ...[...document.querySelectorAll('.cal-pastille, [data-pastille]')].map(e => ({ n: `pastille ${e.getAttribute('data-pastille') || ''}`, r: e.getBoundingClientRect() }))]
      .filter(o => o.r.width > 0 &&o.r.left < B.right && o.r.right > B.left && o.r.top < B.bottom && o.r.bottom > B.top);
    return { ok: obst.length === 0, dit: `bulle « ${(b.textContent || '').trim().slice(0, 40)} » (${Math.round(B.left)}, ${Math.round(B.top)}) ; ${obst.length ? `croise : ${obst.map(o => o.n).join(' | ')}` : 'ne croise rien'}` };
  });
}
/**
 * Aucune étiquette d'axe de la courbe n'est traversée par le tracé : `isPointInStroke` sur 5 × 3 points de sa boîte. CRITIQUE-12 (07m/07b :
 * « 0 étiquette d'axe ») : pendant f1-a, la courbe est la courbe ZOOMÉE (`svg.ent-zoom`, « La courbe zoomée… »), et ses étiquettes sont
 * posées par `placerAxe` (Courbe.tsx) dans `g[data-axe] > text.ent-axe` ; l'ancienne lecture cherchait la courbe « Libre et caisse ».
 */
function axesNonBarres(p) {
  return p.evaluate(() => {
    const vis = e => e && e.getBoundingClientRect().width > 0;
    const zoom = [...document.querySelectorAll('svg.ent-zoom, svg[aria-label^="La courbe zoomée"]')].find(vis);
    const zone = zoom || [...document.querySelectorAll('[aria-label^="Libre et caisse"]')].find(e => e.getBoundingClientRect().width > 100);
    const svg = zone && (zone.tagName.toLowerCase() === 'svg' ? zone : zone.querySelector('svg'));
    if (!svg) return { ok: false, dit: 'courbe introuvable' };
    const parAxe = [...svg.querySelectorAll('[data-axe] text, text.ent-axe')].filter(vis);
    const textes = parAxe.length ? [...new Set(parAxe)] : [...svg.querySelectorAll('text')].filter(t => /^[−-]?\d[\d\s’']*$/.test((t.textContent || '').trim()) && vis(t));
    const traces = [...svg.querySelectorAll('path')].filter(e => !e.closest('[data-curseur]') && getComputedStyle(e).stroke !== 'none' && (parseFloat(getComputedStyle(e).strokeWidth) || 0) > 0);
    const barres = textes.filter(t => {
      const r = t.getBoundingClientRect();
      for (let i = 0; i <= 4; i++) for (let j = 0; j <= 2; j++) {
        const x = r.left + 1 + ((r.width - 2) * i) / 4, y = r.top + 1 + ((r.height - 2) * j) / 2;
        for (const e of traces) { const m = e.getScreenCTM(); if (!m) continue; const q = new DOMPoint(x, y).matrixTransform(m.inverse()); if (e.isPointInStroke(q)) return true; }
      }
      return false;
    });
    return { ok: textes.length > 0 && barres.length === 0, dit: `${textes.length} étiquette(s) d’axe : ${textes.map(t => (t.textContent || '').trim()).join(', ')} ; ${barres.length ? `barrée(s) : ${barres.map(t => (t.textContent || '').trim()).join(', ')}` : 'aucune barrée'}` };
  });
}
/** Chaque date de la Liste (ou de `sel`) tient sur une ligne : les boîtes de la plage de la date (Range) sont sur une seule hauteur. */
function datesUneLigne(p, sel = '[data-vue-liste]') {
  return p.evaluate((src, s) => {
    const l = [...document.querySelectorAll(s)].find(e => e.getBoundingClientRect().height > 0); if (!l) return { ok: false, dit: `${s} absent` };
    const re = new RegExp(src, 'gu'); const w = document.createTreeWalker(l, NodeFilter.SHOW_TEXT); const coupees = []; let n = 0;
    for (let t = w.nextNode(); t; t = w.nextNode()) {
      const s = t.textContent || '';
      for (const m of s.matchAll(re)) {
        const r = document.createRange(); r.setStart(t, m.index); r.setEnd(t, m.index + m[0].length);
        const rs = [...r.getClientRects()].filter(q => q.width > 0); if (!rs.length) continue; n++;
        const hauts = new Set(rs.map(q => Math.round(q.top / 4)));
        if (hauts.size > 1) coupees.push(`${m[0]} (« ${s.trim().slice(0, 30)} »)`);
      }
    }
    return { ok: n > 0 && coupees.length === 0, dit: `${n} date(s) lue(s) ; ${coupees.length ? `coupée(s) : ${coupees.slice(0, 5).join(' ; ')}` : 'aucune coupée'}` };
  }, RE_DATE_LISTE.source, sel);
}
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
    const hautZ = document.querySelector('[data-entete-zone]')?.getBoundingClientRect().bottom ?? 80;
    const r = e.getBoundingClientRect(); if (r.top < hautZ || r.bottom > innerHeight - 100) window.scrollBy(0, r.top - (hautZ + (innerHeight - hautZ) / 2));
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
/*
 * CRITIQUE-12 n° 1 (bloquant, D-200, E33, règle n° 1) : la place du message d'un geste. Sa maquette (`as/JOURNAL.md` l. 224, `p-f1a-apres`,
 * `p-f6b-apres`) : « près de la chose là où il ne cache aucun texte, sinon en bas au-dessus des onglets ; … à gauche du + volant ».
 * La mesure : la boîte de `[data-message]`, son `data-place` (∈ {pres, bas}), ses intersections avec chaque nom de `NOMS_MESSAGE`
 * (Message.tsx : titres de rangée, noms, montants, pastilles, renvois ; lu dans le module servi, sinon la copie ci-dessous) et avec le + ;
 * jamais au-dessus du titre de la première rangée visible (la surimpression « sous-entete » de ea05c6bb8 l'était).
 */
const NOMS_MESSAGE_REPLI = '[data-nom-rangee], [data-rangee] .cal-nom, [data-frise] .cal-lbl-t, [data-frise] .cal-lbl-m, [data-frise] .cal-lbl-j, [data-frise] .cal-duree, [data-frise] .cal-lie, [data-frise] .cal-pastille-p, [data-frise] .cal-renvoi';
/* PC-107, PC-109 : l'alerte f6-b, et un message sans place libre, se posent dans le flux de la frise, sous leur chose (data-place="flux") */
const PLACES_MESSAGE = ['pres', 'bas', 'flux'];
async function mesureMessage(p) {
  const sel = await p.evaluate(async repli => {
    try { const m = await import('/src/ui/calendrier/frise/Message.tsx'); return typeof m.NOMS_MESSAGE === 'string' && m.NOMS_MESSAGE ? { s: m.NOMS_MESSAGE, d: 'Message.tsx' } : { s: repli, d: 'copie du harnais' }; }
    catch { return { s: repli, d: 'copie du harnais' }; }
  }, NOMS_MESSAGE_REPLI);
  return p.evaluate((s, places) => {
    const m = [...document.querySelectorAll('[data-message]')].find(e => e.getBoundingClientRect().height > 0);
    if (!m) return { ok: false, dit: 'aucun message à l’écran', place: null, croise: [] };
    const M = m.getBoundingClientRect();
    const place = m.dataset.place || '(aucune)';
    const boite = e => { const r = document.createRange(); r.selectNodeContents(e); const q = r.getBoundingClientRect(); return q.width > 0 ? q : e.getBoundingClientRect(); };
    const coupe = q => q.width > 0 && q.height > 0 && q.left < M.right - 1 && q.right > M.left + 1 && q.top < M.bottom - 1 && q.bottom > M.top + 1;
    const croise = [...document.querySelectorAll(s)].filter(e => !m.contains(e) && !e.contains(m)).filter(e => coupe(boite(e))).map(e => (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 28) || `<${e.tagName.toLowerCase()}>`);
    const fab = document.querySelector('button[aria-label^="Actions rapides"]');
    if (fab && coupe(fab.getBoundingClientRect())) croise.push('le + volant');
    /* la première rangée visible : le premier titre de rangée entier sous l'en-tête collé */
    const z = document.querySelector('[data-entete-zone]'); const bas = z ? z.getBoundingClientRect().bottom : 0;
    const titres = [...document.querySelectorAll('[data-nom-rangee], [data-rangee] .cal-nom')].map(boite).filter(q => q.width > 0 && q.top >= bas - 1 && q.bottom <= innerHeight);
    const premier = titres.length ? Math.min(...titres.map(q => q.top)) : null;
    const auDessus = premier !== null && M.top < premier - 1;
    const ok = croise.length === 0 && places.includes(place) && !auDessus;
    const raisons = [...(places.includes(place) ? [] : [`place « ${place} » hors de {${places.join(', ')}}`]), ...(auDessus ? [`au-dessus de la première rangée visible (message ${Math.round(M.top)} px, premier titre ${Math.round(premier)} px)`] : []), ...(croise.length ? [`croise ${croise.length} : ${[...new Set(croise)].slice(0, 6).join(' | ')}`] : [])];
    return { ok, place, croise, dit: `${ok ? 'MESSAGE OK' : 'MESSAGE ECHEC'} : boîte ${Math.round(M.left)},${Math.round(M.top)} ${Math.round(M.width)}×${Math.round(M.height)}, place « ${place} », ${ok ? '0 intersection' : raisons.join(' ; ')} — « ${(m.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60)} »` };
  }, sel.s, PLACES_MESSAGE).then(r => ({ ...r, dit: `${r.dit} (noms lus dans ${sel.d})` }));
}
/** Le message ne couvre aucun nom ni le +, et se pose à sa place (n° 1 de CRITIQUE-12 ; avant : CRITIQUE-9 n° 7, E33, D-200). */
function messageSansNom(p) { return mesureMessage(p); }
/** CRITIQUE-12 n° 5 (m21) : en mode graph, la légende n'est pas sous le + et aucun de ses libellés n'est coupé (« rien de nommé (tend… »). */
function legendeLibre(p) {
  return p.evaluate(() => {
    const g = document.querySelector('[data-vue="graph"]'); if (!g) return { ok: false, dit: 'mode graph absent' };
    const lis = [...g.querySelectorAll('[data-legende]')].filter(e => e.getBoundingClientRect().height > 0);
    if (!lis.length) return { ok: false, dit: 'légende absente' };
    const fab = document.querySelector('button[aria-label^="Actions rapides"]'); const F = fab ? fab.getBoundingClientRect() : null;
    const sous = [], coupes = [];
    for (const li of lis) {
      const r = document.createRange(); r.selectNodeContents(li); const q = r.getBoundingClientRect(); const L = li.getBoundingClientRect();
      const t = (li.textContent || '').trim();
      if (F && F.width > 0 && q.left < F.right && q.right > F.left && q.top < F.bottom && q.bottom > F.top) sous.push(t);
      if (/…/.test(t) || li.scrollWidth > li.clientWidth + 1 || q.right > L.right + 1 || q.right > innerWidth) coupes.push(t);
    }
    return { ok: sous.length === 0 && coupes.length === 0, dit: `${lis.length} libellé(s) : ${lis.map(e => (e.textContent || '').trim()).join(', ')} ; ${sous.length ? `sous le + : ${sous.join(', ')}` : 'rien sous le +'} ; ${coupes.length ? `coupé(s) : ${coupes.join(', ')}` : 'aucun coupé'}` };
  });
}
/** f2-a (comme l'état 09) : le bord de la Blonde tiré d'une colonne ; en 6 sem., si elle finit au bord droit de la fenêtre, 3 mois d'abord. */
async function gesteF2a(p) {
  const coupee = await p.evaluate(() => { const b = [...document.querySelectorAll('[data-barre]')].find(x => (x.getAttribute('data-titre') || x.getAttribute('aria-label') || '').startsWith('Blonde')); const f = document.querySelector('[data-frise]'); if (!b || !f) return false; const lane = b.closest('[data-lane]') || f; return Math.abs(b.getBoundingClientRect().right - lane.getBoundingClientRect().right) < 4; });
  if (coupee && !(p.cfg.tactile && p.cfg.w > p.cfg.h)) { await menuPeriode(p, /^3 mois/); await p.keyboard.press('Escape').catch(() => {}); await attendre(400); }
  await glisserChose(p, 'Blonde d’automne', 1, { sous: '[data-bord]' });
}
/** Doute 39c de CRITIQUE-12 : la fin de la barre Travaux posée (S20 → S40) contre le bord droit de la colonne S40, en px. */
function finTravauxS40(p) {
  return p.evaluate(() => {
    const e = [...document.querySelectorAll('section[data-rangee="travaux"] [data-barre], section[data-rangee="travaux"] [data-chose]')].find(x => /\bS20\b/.test(`${x.getAttribute('aria-label') || ''} ${x.getAttribute('data-titre') || ''} ${x.getAttribute('data-semaine') || ''}`));
    if (!e) return { ok: false, dit: 'barre posée (S20) absente' };
    const lc = parseFloat(document.querySelector('[data-frise]')?.getAttribute('data-largeur-colonne') || 'NaN');
    const piste = e.closest('[data-lane]'); if (!piste || !(lc > 0)) return { ok: false, dit: 'piste ou largeur de colonne introuvable' };
    const cadre = document.querySelector('.ent-cadre[role="group"]')?.getAttribute('aria-label') || '';
    const n0 = Number((/S(\d+)/.exec(cadre) || [])[1]); if (!n0) return { ok: false, dit: `cadre illisible « ${cadre} »` };
    const L = piste.getBoundingClientRect(), b = e.getBoundingClientRect();
    const i40 = (40 - n0 + 52) % 52; const fin40 = L.left + (i40 + 1) * lc;
    /* la case S40 de la bande, si elle est écrite : son bord droit, l'autre preuve */
    const caseS40 = [...document.querySelectorAll('[data-bande-semaines] button, [data-bande-semaines] [role="button"]')].find(x => /\bS40\b/.test(`${x.getAttribute('aria-label') || ''} ${x.textContent || ''}`));
    const finBande = caseS40 ? caseS40.getBoundingClientRect().right : null;
    const ecart = b.right - fin40;
    return { ok: Math.abs(ecart) <= lc / 2, dit: `fin de la barre ${b.right.toFixed(1)} px ; bord droit de S40 (piste) ${fin40.toFixed(1)} px${finBande !== null ? `, case S40 de la bande ${finBande.toFixed(1)} px` : ''} ; écart ${ecart.toFixed(1)} px (colonne ${lc.toFixed(1)} px, cadre « ${cadre} »)` };
  });
}
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
/* CRITIQUE-11 (m390-32 : « Choisis un nom. ») : la puce d'un nom récent (« Sols : colle et joints », suivie de son montant) est touchée dans le
   groupe « Noms récents » ; le champ du nom doit être rempli, sinon l'état est ABSENT avant même Ajouter */
async function fenetreTravaux(p) {
  await ajouterDans(p, 'Travaux');
  await toucher(p, { dans: { role: 'dialog|menu', dernier: true }, role: 'button', texte: /^Sols : colle et joints|^Rénovation/ });
  await attendre(200);
  p.nomChoisi = await nomDeLaFeuille(p);
  if (!p.nomChoisi) throw new Absent('aucun nom dans la feuille Travaux après le toucher de la puce « Sols : colle et joints »');
  await toucher(p, dansFeuille(/^S20$/)); await toucher(p, dansFeuille(/^S40$/)); await toucher(p, dansFeuille(/^5 j$/));
}
/** Le nom écrit dans la feuille ouverte : le premier champ texte (ni montant ni date) ; « » s'il est vide. */
function nomDeLaFeuille(p) {
  return p.evaluate(() => {
    const d = [...document.querySelectorAll('[role="dialog"], dialog')].filter(x => x.getBoundingClientRect().height > 0).pop();
    const c = d && [...d.querySelectorAll('input, textarea')].find(i => (i.type === 'text' || i.type === '' || i.tagName === 'TEXTAREA') && !/decimal|numeric/.test(i.inputMode || ''));
    return c ? (c.value || '').trim() : '';
  });
}
/** Ajouter de la feuille touché ; refusé (« Choisis un nom. ») ou feuille restée ouverte sans message : ABSENT. Rend le texte du bouton. */
async function toucherAjouter(p) {
  const r = await toucher(p, boutonFeuille(/^Ajouter/));
  await attendre(400);
  const t = await lireTexte(p);
  if (/Choisis un nom/.test(t)) throw new Absent(`Ajouter (« ${r.t} ») refusé : « Choisis un nom. »`);
  return r.t;
}
/** Les choses d'une rangée (barres, choses, marques), sans compter deux fois une chose imbriquée. */
const nbToutes = (p, r) => p.evaluate(x => { const s = document.querySelector(`section[data-rangee="${x}"]`); if (!s) return -1; const l = [...s.querySelectorAll('[data-chose], [data-barre], [data-marque]')]; return l.filter(e => !l.some(o => o !== e && o.contains(e))).length; }, r);
/** Les choses pleines d'une rangée : ni vente probable ni proposition en pointillé. */
const nbPleines = (p, r) => p.evaluate(x => { const s = document.querySelector(`section[data-rangee="${x}"]`); if (!s) return -1; const l = [...s.querySelectorAll('[data-chose], [data-barre], [data-marque]')].filter(e => !e.closest('[data-probable], [data-proposition]')); return l.filter(e => !l.some(o => o !== e && o.contains(e))).length; }, r);
function plusUne(nom) { return async p => ({ ok: Number.isFinite(p.nAvant) && p.nAvant >= 0 && p.nApres === p.nAvant + 1, dit: `${nom} : ${p.nAvant ?? '?'} → ${p.nApres ?? '?'}${p.ajoute ? ` (bouton « ${p.ajoute} »)` : ''}` }); }
/** Les jalons d'une barre : leur centre x, par `data-jalon`. */
const jalonsDe = (p, titre) => p.evaluate(t => {
  const b = [...document.querySelectorAll('[data-barre], [data-chose]')].find(x => (x.getAttribute('data-titre') || x.getAttribute('aria-label') || '').startsWith(t));
  if (!b) return {};
  const o = {};
  for (const j of b.querySelectorAll('[data-jalon]')) { const r = j.getBoundingClientRect(); if (r.width > 0) o[j.getAttribute('data-jalon')] = r.left + r.width / 2; }
  return o;
}, titre);
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
    /* vision 13 : sous l'en-tête collé (paysage), la barre n'est pas vue ; on la ramène au milieu de ce qui reste sous l'en-tête */
    const hautZ = document.querySelector('[data-entete-zone]')?.getBoundingClientRect().bottom ?? 0;
    if (r.top < hautZ || r.bottom > innerHeight) { window.scrollBy(0, r.top - (hautZ + (innerHeight - hautZ) / 2)); }
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
    /* CRITIQUE-11 (contamination, E39) : un contexte neuf par état ; garde d'entrée « 0 choses cachées » ; sinon stockage local et IndexedDB vidés,
       page relue ; toujours caché : l'état est ABSENT (jamais une capture prise sur une rangée masquée par un autre état) */
    let rendu = null;
    try { rendu = await attendreBanc(p); } catch (e) { rendu = e; }
    let cachees = rendu instanceof Error ? [] : await chosesCachees(p);
    if (cachees.length) {
      await p.evaluate(async () => { localStorage.clear(); sessionStorage.clear(); for (const d of ((await indexedDB.databases?.()) || [])) if (d.name) indexedDB.deleteDatabase(d.name); });
      await charger(p, null); await attendreBanc(p).catch(() => {}); cachees = await chosesCachees(p);
    }
    const contamine = cachees.length ? `contamination : ${cachees.join(', ')} « cachée » à l’entrée, même après stockage vidé` : null;
    let statut = 'OK', dit = '';
    try {
      if (rendu instanceof Error) throw rendu;
      if (contamine) throw new Absent(contamine);
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

/**
 * ET-PER (décision b de CRITIQUE-11 ; D-12 à D-14, D-78 ; E07 ; P5), à 390, en paysage et à 1280, clair et cave. Dans `/?dev-local` (requêtes
 * Firestore coupées, contexte jeté), trois écritures « ZZ TEST » locales : dans la plage (aujourd'hui), dans 5 mois (+150 j : hors des 3 mois,
 * dans 6 mois et l'An) et hors plage (+400 j). Bord puis Calendrier ; puis trois vrais changements de période au calendrier : menu 3 mois, menu
 * 6 mois, l'An par la poignée tirée au bout. Après chacun, Finances par la barre d'onglets (le rail à 1280), Opérations : la plage écrite
 * (« 16 nov. → 14 févr. »), Du et Au égaux à la fenêtre du calendrier, les écritures filtrées. Chaque attendu exige Finances à l'écran (`.finance`
 * présent, `[data-frise]` absent) : il ne peut pas passer sur le calendrier (p844-36 et d1280-34 de la vision 12 le montraient). Puis le sens
 * inverse : Au réglé dans Opérations à Du + 27 j, retour au Calendrier : 4 colonnes, première semaine = celle de Du.
 */
async function etPer(cfgNom, theme) {
  const cfg = CONFIGS[cfgNom];
  let p; const pas = [];
  const iso = d => d.toISOString().slice(0, 10);
  const lisibleIso = j => { const d = new Date(`${j}T00:00:00Z`); return `${d.getUTCDate()} ${MOIS_COURTS[d.getUTCMonth()]}`; };
  const auj = new Date();
  const ECRITURES = [['ZZ TEST — dans la plage', iso(auj)], ['ZZ TEST — dans 5 mois', iso(new Date(auj.getTime() + 150 * 864e5))], ['ZZ TEST — hors plage', iso(new Date(auj.getTime() + 400 * 864e5))]];
  /* la fenêtre du calendrier : première semaine de la bande (sinon la semaine en cours, l'An part d'elle), nombre de colonnes de la frise */
  const fenetreCalendrier = () => p.evaluate(() => {
    /* la première case de la bande, par son nom accessible (en 6 mois, son texte peut être masqué une semaine sur deux) */
    const s = [...document.querySelectorAll('[data-bande-semaines] button, [data-bande-semaines] [role="button"]')].map(b => (/S\d+/.exec(`${b.getAttribute('aria-label') || ''} ${b.textContent || ''}`) || [])[0]).find(Boolean) || null;
    const vueC = document.querySelector('[data-calendrier]')?.getAttribute('data-vue') || '';
    const cadre = document.querySelector('.ent-cadre[role="group"]')?.getAttribute('aria-label') || '';
    /* l'An (E13) : la frise compte ses colonnes en mois ; la fenêtre est de 52 semaines depuis la semaine en cours */
    const an = vueC === 'annee' || /^Fenêtre : \p{L}{3,}\.?( \d{4})? – \p{L}{3,}\.? \d{4}$/u.test(cadre);
    const n = an ? 52 : Number(document.querySelector('[data-frise]')?.getAttribute('data-nb-colonnes'));
    return { s: an ? null : s, n, an, cadre };
  });
  const attenduePlage = f => {
    const num = f.s ? Number(f.s.slice(1)) : Number(S(0).slice(1));
    const du = lundiSemaine(num);
    if (!du || !Number.isFinite(f.n) || f.n <= 0) return null;
    const au = iso(new Date(Date.parse(`${du}T00:00:00Z`) + (7 * f.n - 1) * 864e5));
    /* l'An : la fin doit tomber dans le mois écrit au bout du cadre (« … – nov. 2027 ») */
    if (f.an) { const m = /– (\p{L}{3,}\.?) (\d{4})$/u.exec(f.cadre); const d = new Date(`${au}T00:00:00Z`); if (!m || MOIS_COURTS[d.getUTCMonth()].replace('.', '') !== m[1].replace('.', '') || String(d.getUTCFullYear()) !== m[2]) return null; }
    return { du, au };
  };
  const financesALEcran = q => q.evaluate(() => ({ ok: !!document.querySelector('.finance') && !document.querySelector('[data-frise]'), dit: `.finance ${document.querySelector('.finance') ? 'présent' : 'ABSENT'}, frise du calendrier ${document.querySelector('[data-frise]') ? 'PRÉSENTE' : 'absente'}` }));
  const lireFinances = () => p.evaluate(() => {
    const v = s => document.querySelector(s)?.value || '';
    const titre = document.querySelector('.ops-plage-titre');
    return { du: v('input[aria-label="Du"]'), au: v('input[aria-label="Au"]'), titre: (titre?.textContent || '').replace(/\s+/g, ' ').trim(), titreAria: titre?.getAttribute('aria-label') || '' };
  });
  const versFinances = async () => {
    await ongletApp(p, 'Finances');
    for (let i = 0; i < 40 && !(await p.evaluate(() => !!document.querySelector('.finance'))); i++) await attendre(500);
    if (await existe(p, { role: 'tab', texte: /^Opérations$/ })) await toucher(p, { role: 'tab', texte: /^Opérations$/ });
    await attendre(700); await p.evaluate(() => window.scrollTo(0, 0)); await attendre(300);
  };
  const versCalendrier = async () => { await ongletApp(p, 'Calendrier'); await p.waitForSelector('[data-frise]', { timeout: 20000 }); await attendre(500); };
  /* une étape : le changement au calendrier, la fenêtre lue, Finances, puis les attendus (Finances à l'écran d'abord) */
  const etapePeriode = async (n, nom, geste, changer, voulues, { exigeChangement = true } = {}) => {
    let f = null, attendue = null;
    await etape(p, `${cfgNom}-${theme}-${n}-${nom}`, geste, async () => {
      await versCalendrier();
      const avant = await fenetreCalendrier();
      const so = await changer();
      if (so) throw new Absent(so);
      await p.keyboard.press('Escape').catch(() => {}); await attendre(400);
      f = await fenetreCalendrier();
      if (exigeChangement && f.n === avant.n && f.s === avant.s && f.cadre === avant.cadre) throw new Absent(`la période du calendrier n’a pas changé (${f.n} colonnes, ${f.cadre})`);
      attendue = attenduePlage(f);
      pas.push(`${nom} : ${f.n} colonnes depuis ${f.s || S(0)}`);
      await versFinances();
    }, [fn(financesALEcran, 'Finances à l’écran (pas le calendrier)'),
      fn(async () => { const l = await lireFinances(); return { ok: !!attendue && l.du === attendue.du && l.au === attendue.au, dit: `calendrier ${f ? `${f.n} colonnes, ${f.cadre}` : '?'} → attendu ${attendue ? `${attendue.du} → ${attendue.au}` : '?'} ; Du « ${l.du} », Au « ${l.au} »` }; }, 'Du et Au égaux à la fenêtre du calendrier'),
      fn(async () => { const l = await lireFinances(); const ok = !!attendue && l.titre.includes('→') && l.titre.includes(lisibleIso(attendue.du)) && l.titre.includes(lisibleIso(attendue.au)); return { ok, dit: `en-tête « ${l.titre || 'absent'} » (attendu « ${attendue ? `${lisibleIso(attendue.du)} → ${lisibleIso(attendue.au)}` : '?'} »)` }; }, 'la plage écrite dans l’en-tête de Finances'),
      /* une opération de la plage est une ligne de la liste ; une opération à régler hors de la plage n'est qu'un rappel gris « hors plage »
         (`.ops-hors-nom`, ni comptée ni additionnée, TransactionJournal s2ap2) : elle compte comme absente de la plage */
      fn(async () => {
        const l = await p.evaluate(libs => {
          const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
          const feuilles = [...document.querySelectorAll('.finance *')].filter(e => e.children.length === 0 && vis(e));
          const nb = (/(\d+)\s*opérations?/.exec((document.querySelector('.ops-bande')?.textContent || '').replace(/\s+/g, ' ')) || [])[1] ?? '?';
          return { nb, vus: libs.map(x => { const els = feuilles.filter(e => (e.textContent || '').includes(x)); return [x, els.some(e => !e.closest('.ops-hors-nom')) ? 'listée' : els.length ? 'rappel hors plage' : 'absente']; }) };
        }, ECRITURES.map(([x]) => x));
        const ok = l.vus.every(([x, v]) => (v === 'listée') === voulues.includes(x)) && String(l.nb) === String(voulues.length);
        return { ok, dit: `${l.nb} opération(s) dans la plage ; ${l.vus.map(([x, v]) => `« ${x.replace('ZZ TEST — ', '')} » ${v}`).join(', ')}` };
      }, `Opérations filtrées : ${voulues.map(l => `« ${l.replace('ZZ TEST — ', '')} »`).join(' et ')} seulement (${voulues.length} opération(s))`)],
    undefined, n);
  };
  try {
    p = await ouvrir(cfg, theme, APP, { coupeFirestore: true });
    p.cfgNom = cfgNom;
    const demarrage = await demarrageApp(p, `${cfgNom}-${theme}-33`);
    /* Finances chauffé d'abord (Vite découvre ses dépendances et peut recharger), puis les données ZZ TEST locales : un solde de départ simulé
       (sans lui, pas de courbe, donc ni cadre ni poignée de fin pour l'An) et les trois écritures, comme la facture du parcours app */
    const chaud = await chaufferFinances(p);
    const pose = await p.evaluate(async l => {
      const { StorageService } = await import('/src/services/storage.ts');
      const { FinanceService } = await import('/src/services/financeService.ts');
      FinanceService.saveProfile({ ...FinanceService.getProfile(), historyCompleteFrom: '2026-01-01', openingCash: { date: '2026-01-01', amountCents: 400000, confirmed: true } });
      for (const [desc, jour, id] of l) StorageService.addTransaction({ id, date: jour, description: desc, category: 'brassage', subcategory: 'malt', amountHT: 12, amountTTC: 12, tvaAmount: 0, tvaRate: 0, finance: { version: 1, kind: 'expense', amountCents: 1200, lines: [], paymentStatus: 'unpaid', dueDate: jour, vendor: 'ZZ TEST — fournisseur' } });
      return StorageService.getTransactions().filter(t => /^ZZ-TEST-ETPER/.test(t.id)).length;
    }, ECRITURES.map(([d, j], i) => [d, j, `ZZ-TEST-ETPER-${i}`]));
    if (pose !== ECRITURES.length) throw new Absent(`${pose} écriture(s) ZZ TEST relue(s) sur ${ECRITURES.length}`);
    pas.push(`${demarrage} ; ${chaud} ; solde de départ simulé 4 000 CHF au 1er janv. 2026 et écritures ${ECRITURES.map(([l, j]) => `« ${l} » le ${j}`).join(', ')} (stockage local du contexte jeté)`);
    await ongletApp(p, 'Bord'); await versCalendrier(); pas.push('Bord puis Calendrier');
    const D = ECRITURES.map(([l]) => l);
    const paysage = cfg.tactile && cfg.w > cfg.h;
    const parMenu = re => async () => {
      await toucher(p, { data: 'data-ent-periode' });
      if (!(await existe(p, { dans: { role: 'dialog', aria: /Période/ }, texte: re }))) { await p.keyboard.press('Escape').catch(() => {}); return paysage ? `le menu n’offre pas « ${re.source.replace('^', '')} » en paysage (13 semaines, E10)` : `« ${re.source} » absent du menu`; }
      await toucher(p, { dans: { role: 'dialog', aria: /Période/ }, texte: re });
      return null;
    };
    /* CRITIQUE-12 (D-14, D-78 sans preuve depuis la v7 : d1280-43 et p844-44 de la vision 13 restaient sur le calendrier) : la capture
       `<config>-<thème>-33-finances-plage.png` est Finances › Opérations après « 3 mois » réglé au calendrier. En paysage, le menu n'offre
       pas 3 mois (13 semaines, E10) : le téléphone est remis en portrait, 3 mois choisi au menu, puis retourné en paysage (vrais gestes). */
    const troisMois = paysage
      ? async () => {
        if (await existe(p, { data: 'data-ent-periode' }) && (await parMenu(/^3 mois/)()) === null) return null;
        await tourner(p); await p.waitForSelector('[data-frise]', { timeout: 20000 }); await attendre(400);
        const so = await parMenu(/^3 mois/)();
        await p.keyboard.press('Escape').catch(() => {}); await attendre(300);
        await tourner(p); await attendre(600);
        pas.push('paysage : portrait, 3 mois au menu, paysage');
        return so;
      }
      : parMenu(/^3 mois/);
    await etapePeriode('33', 'finances-plage', `${paysage ? 'portrait, menu 3 mois, paysage' : 'menu 3 mois au calendrier'}, puis Finances par la barre › Opérations`, troisMois, [D[0]], { exigeChangement: !paysage });
    if (paysage) {
      for (const [n, nom] of [['33b', 'finances-6mois'], ['33c', 'finances-an']]) rapport.push({ cfgNom, theme, n, nom, geste: '—', statut: 'SANS OBJET', dit: 'en paysage, la fenêtre est de 13 semaines, sans 6 mois ni An (E10) : prouvé à 390 et à 1280', capture: '—' });
    } else {
      await etapePeriode('33b', 'finances-6mois', 'menu 6 mois au calendrier, puis Finances › Opérations', parMenu(/^6 mois/), [D[0], D[1]]);
      await etapePeriode('33c', 'finances-an', 'poignée de fin tirée au bout (l’An), puis Finances › Opérations', async () => { await tirerPoignee(p, 1.0, false); return null; }, [D[0], D[1]]);
    }
    /* le sens inverse : Du et Au changés dans Finances (Au = Du + 27 j, par le champ « Au » d'Opérations), retour au calendrier */
    let voulu = null;
    if (paysage) rapport.push({ cfgNom, theme, n: '33d', nom: 'calendrier-depuis-finances', geste: '—', statut: 'SANS OBJET', dit: 'en paysage, la frise montre toujours 13 semaines (E10) : le sens inverse se prouve à 390 et à 1280', capture: '—' });
    else await etape(p, `${cfgNom}-${theme}-33d-calendrier-depuis-finances`, 'Finances › Opérations : Au = Du + 27 j ; puis Calendrier', async () => {
      if (!(await p.evaluate(() => !!document.querySelector('.finance')))) await versFinances();
      voulu = await p.evaluate(() => {
        const d = document.querySelector('input[aria-label="Du"]'), a = document.querySelector('input[aria-label="Au"]');
        if (!d || !a || !d.value) return null;
        const v = new Date(Date.parse(`${d.value}T00:00:00Z`) + 27 * 864e5).toISOString().slice(0, 10);
        const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(a, v);
        a.dispatchEvent(new Event('input', { bubbles: true })); a.dispatchEvent(new Event('change', { bubbles: true }));
        return { du: d.value, au: v, champsVisibles: d.getBoundingClientRect().width > 0 };
      });
      if (!voulu) throw new Absent('champs Du et Au introuvables (ou vides) dans Opérations');
      await attendre(700);
      voulu.lu = await lireFinances();
      await p.screenshot({ path: join(DOSSIER, `${cfgNom}-${theme}-33e-finances-au-change.png`) });
      await versCalendrier(); await p.evaluate(() => window.scrollTo(0, 0)); await attendre(300);
      pas.push(`Au réglé à ${voulu.au} (champs ${voulu.champsVisibles ? 'visibles' : 'masqués à cette largeur : réglés par leur écouteur'})`);
    }, [fn(async q => q.evaluate(() => ({ ok: !!document.querySelector('[data-frise]') && !document.querySelector('.finance'), dit: 'calendrier à l’écran' })), 'le calendrier à l’écran'),
      fn(async () => { const f = await fenetreCalendrier(); const a = attenduePlage(f); return { ok: !!voulu && f.n === 4 && !!a && a.du === voulu.du, dit: `Finances ${voulu ? `${voulu.du} → ${voulu.au} (en-tête « ${voulu.lu?.titre || '?'} »)` : '?'} ; frise ${f.n} colonnes depuis ${f.s || '?'} (${a ? a.du : '?'}) ; cadre « ${f.cadre} »` }; }, 'la frise suit : 4 colonnes, première semaine = celle de Du'),
      fn(async () => { const f = await fenetreCalendrier(); return { ok: /S\d+ – S\d+/.test(f.cadre) || /Fenêtre/.test(f.cadre), dit: `cadre « ${f.cadre || 'absent'} »` }; }, 'le cadre de la fenêtre suit')],
    undefined, '33d');
    rapport.push({ cfgNom, theme, n: '33z', nom: 'finances-plage-parcours', geste: `/?dev-local : ${pas.join(' ; ')}`, statut: 'OK', dit: `parcours ET-PER joué jusqu’au bout ; les verdicts sont aux lignes 33a à 33d ; requêtes Firestore coupées : ${p.coupees}`, capture: '—' });
  } catch (e) {
    let f = '—';
    if (p) { f = `${cfgNom}-${theme}-33-finances-plage-ECHEC.png`; await p.screenshot({ path: join(DOSSIER, f) }).catch(() => {}); }
    rapport.push({ cfgNom, theme, n: '33', nom: 'finances-plage', geste: `/?dev-local : ${pas.join(' ; ') || 'rien'}`, statut: 'ABSENT', dit: e instanceof Absent ? e.message : String(e.message || e).slice(0, 160), capture: f });
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
const cfgDe = p => p.cfgNom || (p.cfg.w === 1280 ? 'd1280' : p.cfg.w > p.cfg.h ? 'paysage' : 'm390');
async function capturer(p, nom, attendu, geste, extra = '', n = 'app') {
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
  rapport.push({ cfgNom: cfgDe(p), theme: p.theme, n, nom, geste, statut, dit,capture: f });
  console.log(`${statut === 'OK' ? 'ok' : statut} ${nom} : ${dit.slice(0, 160)}`);
  return statut === 'OK';
}
async function etape(p, nom, geste, faire, attendu, extra, n = 'app') {
  try { await faire(); return await capturer(p, nom, attendu, geste, typeof extra === 'function' ? extra() : extra, n); }
  catch (e) {
    const f = `${nom}-ECHEC.png`;
    await p.screenshot({ path: join(DOSSIER, f) }).catch(() => {});
    rapport.push({ cfgNom: cfgDe(p), theme: p.theme, n, nom, geste, statut: 'ABSENT', dit: e instanceof Absent ? e.message : String(e.message || e).slice(0, 160), capture: f });
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
    /* CRITIQUE-12 (D-71 : au banc, « l’app ouvrirait le budget ») : la vraie BrewBudgetSheet, sur le brassin posé par + Brassins › Ajouter */
    await etape(p, `m390-${theme}-46-budget-app`, `toucher le brassin « ${RECETTE} », puis Budget ›`, async () => {
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

/* groupes (CRITIQUE-12) : `msg` = M1 à M7 ; `et-per` ou `finances` = 33 (le parcours /?dev-local, jamais une capture du banc) ; `budget-app` = app (D-71) */
const GROUPES = { msg: n => /^M\d$/.test(n), 'et-per': n => n === '33', finances: n => n === '33', 'budget-app': n => n === 'app' };
const garde = n => !choixEtats || choixEtats.has(n) || [...choixEtats].some(g => GROUPES[g] && GROUPES[g](n));
try {
  for (const cfgNom of choixConfigs) {
    for (const theme of choixThemes) {
      for (const etat of ETATS) {
        if (!garde(etat.n)) continue;
        if (theme !== 'clair' && !etat.cave) continue;
        await jouerEtat(cfgNom, theme, etat);
      }
      if (!args.includes('--sans-dev-local')) {
        if (theme === 'clair' && garde('56')) await devLocal(cfgNom, theme);
        /* CRITIQUE-11 (décision b) : ET-PER dans chaque configuration et chaque thème */
        if (garde('33')) await etPer(cfgNom, theme);
      }
    }
  }
  /* CRITIQUE-4 (lot q4-app) : --etats app (l'app réelle, 390), plage (Finances ↔ calendrier, 1280), banc-budget (n° 13 c) ; deux thèmes */
  for (const theme of choixThemes) {
    if (garde('app') && !args.includes('--sans-dev-local')) await parcoursApp(theme);
    /* « plage » (ancien parcours du 1280) : le parcours ET-PER lui-même, à 1280, s'il n'a pas déjà été joué par l'état 33 */
    if (garde('plage') && !args.includes('--sans-dev-local') && !(garde('33') && choixConfigs.includes('d1280'))) await etPer('d1280', theme);
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
  '# Vision du calendrier porté, état par état, chaque geste mesuré (harnais officiel scripts/agents/vision-calendrier.mjs)',
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
/* CRITIQUE-12 n° 1 : le bilan des messages (M1 à M7), une ligne */
const msgs = rapport.filter(r => /^M\d$/.test(r.n) && r.statut !== 'SANS OBJET');
if (msgs.length) {
  const ko = msgs.filter(r => r.statut !== 'OK');
  const ligne = `MESSAGE ${ko.length ? 'ECHEC' : 'OK'} : ${msgs.length - ko.length}/${msgs.length} messages à leur place, 0 intersection${ko.length ? ` ; en échec : ${ko.map(r => `${r.cfgNom}-${r.theme}-${r.n}`).join(', ')}` : ''}`;
  lignes.push('## n° 1 de CRITIQUE-12 : place des messages', '', ligne, '');
  console.log(ligne);
}
writeFileSync(join(DOSSIER, 'RAPPORT.md'), lignes.join('\n'));
console.log(`VISION ${absents.length ? 'ABSENT' : 'OK'} : ${rapport.length} états, ${absents.length} ABSENT ou INTERDIT → ${join(DOSSIER, 'RAPPORT.md')}`);
process.exit(0);
