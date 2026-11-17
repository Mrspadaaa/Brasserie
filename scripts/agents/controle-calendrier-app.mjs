// Contrôle CAL-APP (17.11, port du calendrier dans l'app) : l'onglet Calendrier de l'app, joué sur un vrai rendu Chrome.
// « Le bouton+ ici n'a pas du tout la bonne fonctionne… NE PERDS RIEN DANS LE PORTAGE » ; « Trop d'info quand on bouge qqch, ça devient illisible » ;
// « les évènements sont trop petites, peut être utilisé un icône » ; « Ça forcé pas à renverser le téléphone ??? ».
//
// node scripts/agents/controle-calendrier-app.mjs <url> [--sans-banc]   → CAL-APP OK | CAL-APP ECHEC
// node scripts/agents/controle-calendrier-app.mjs --test-regex          → REGEX OK n/n | REGEX ECHEC (chaque regex exercée, sans Chrome)
//   <url> : le banc `http://localhost:3017/?preview=calendrier` (fixture « banc — données simulées »), servi par `PORT=3017 npm run dev`.
//
// Mesures, 390 × 844 tactile, 844 × 390 tactile et 1280 × 800 souris :
//   ENTETE        courbe d'au moins 80 px, bande des semaines de 40 px au plus, en-tête de 180 px au plus (portrait)
//   BANDE         au repos, la bande ne contient que « S\d+ » (la semaine seule : ni solde, ni mouvement, ni icône)
//   PLUS          les carrés + des sept rangées forment une colonne (x à 2 px près) et sont des boutons
//   PLUS-AGIT     chaque carré ouvre la feuille d'ajout déjà réglée sur sa rangée
//   BRUIT         après f1-a puis f6-b : un seul role="status" ou "alert", deux lignes au plus
//   FAB           le + volant dans le tiers droit, de 4 à 24 px au-dessus des onglets
//   ROTATION      390 × 844 → 844 × 390 → 390 × 844 : une chose ajoutée reste, sans recharger
//   PAYS          en paysage : 13 semaines, en-tête de 120 px au plus, rangée médiane de 48 px au plus
//   BARRE-PETITE  en 6 mois : aucune barre de moins de 24 px ; la chose courte est une marque nommée
// Ajouts de la correction 2 (CRITIQUE-2, 17.11) :
//   J0            aucun « J0 / 0 » (un brassin à 0 jour en cuve n'existe pas, n° 2), en portrait et en paysage
//   GLISSE        f1-a par un vrai toucher CDP à 390 et par la souris à 1280 : la barre de la Hotte change de semaine et « Annuler » apparaît (n° 1)
//   MENU-BORNE    le menu f5-a, Retirer compris, est dans l'écran, au-dessus des onglets et du + (n° 3)
//   FAB-RECOUVRE  aucune étiquette de barre ne croise le rectangle du + au repos, à 390 et en paysage (n° 13)
//   TETE-LISIBLE  la boîte du chiffre clé ne croise aucun texte de la courbe (n° 7)
//   NOMS-390      au moins 6 mouvements nommés avec leur montant sur la courbe à 390 (n° 8, z2s en nomme 8)
//   MONTANT       la Blonde et le Marché de Noël ont un montant (n° 9)
//   PLUS-PAYSAGE  toutes les lignes du + volant ouvert sont dans 844 × 390 (n° 4)
// Ajouts de la correction 4 (CRITIQUE-4, lot q4-app) :
//   MESSAGE-NOM    la bulle « lâcher ici », le message de f1-a et celui de la vente acceptée : sur aucun nom, jamais tronqués (n° 13 a, b)
//   NOMS-COUPES    aucun nom de chose coupé quand la place libre à sa droite suffit (n° 24), à 390, en paysage, à 1280
//   LIE-DANS-ECRAN chaque pastille « lié à » dans l'écran, avec un nom lisible, non coupée (n° 15), à 390 en 6 sem. et 3 mois, à 1280
//   COURBE-PAYS    en 844 × 390 : courbe d'au moins 70 px, en-tête de 120 px au plus (n° 11)
//   MENU-PAYS      renforcé : le menu f5-a ne se pose ni sur l'en-tête ni sur la chose tenue (n° 12, E31)
//   BANC-FEUILLE   au banc, « Budget › » ouvre une feuille en bas marquée « banc », fermée par × ; aucune ligne du banc sur l'en-tête ;
//                  le renvoi de Retirer vers Finances n'est jamais visible avec le bandeau Annuler (n° 13 c)
//   Témoin : sur 21e0260c (arbre de travail du 17.11 au soir, lots q1 à q3 en cours), LIE-DANS-ECRAN et BANC-FEUILLE à KO, CAL-APP ECHEC ;
//   MESSAGE-NOM et NOMS-COUPES y passaient déjà (corrections q2 en cours dans l'arbre) : leur témoin reste à rejouer sur 21e0260c propre.
// Témoins négatifs (L13) : l'onglet v1 de `claude/ports-nuit-1611` rend CAL-APP ECHEC (pas de rangées, pas de carrés +) ; e4bdc173 (avant la
// correction 2) rend CAL-APP ECHEC avec J0, GLISSE ou MENU-BORNE, TETE-LISIBLE, NOMS-390 et PAYS à KO.
import { createRequire } from 'node:module';

/** Toutes les regex du contrôle, en un lieu : `--test-regex` les exerce sur des cas vrais et faux. */
export const RE = {
  semaineSeule: /^S\d+$/,
  semaineQuelconque: /S\d+/,
  marcheNoelExact: /^Marché de Noël$/,
  marcheNoelDebut: /^Marché de Noël/,
  ajouter: /^Ajouter( en S\d+)?$/,
  sixMois: /^6 mois/,
  hotte: /^Hotte/,
  blonde: /^Blonde d’automne/,
  /** « J0 / 0 », « J0/0 » : un brassin à zéro jour ; « J0 / 28 », « J0 / 05 » ne sont pas visés. */
  j0Zero: /J0\s*\/\s*0(?!\d)/,
  annuler: /^Annuler$/,
  retirer: /^Retirer/,
  /** Un mouvement nommé avec son montant signé : « Frigo −1 800 », « TVA T4 −300 », « Marché de Noël +1 180 ». */
  mouvementNomme: /\p{L}{2,}.*?(^|[\s·(])[−+-]\s?\d/u,
  /** Un montant signé, précédé d'un blanc, d'une virgule ou d'un point médian : « , −148 », « +1 180 » ; jamais le tiret de « S47 – S52 ». */
  montantSigne: /(^|[\s,·(])[−+-]\s?\d/,
  chiffreCle: /à dépenser/,
  actionsRapides: /^Actions rapides/,
  /** CRITIQUE-3 n° 1 : un « J0 » sur un brassin déjà en cuve ; « J10 », « J07 » ne sont pas visés. */
  jourZero: /(^|[^\d])J0(?!\d)/,
  ipa: /^IPA de printemps/,
  /** CRITIQUE-3 n° 2 : ni l'impôt ni l'énergie ne sont des courses. */
  pasDesCourses: /imp[ôo]t|[ée]nergie/i,
  poigneeFin: /^Poignée de fin/,
  /* CRITIQUE-4 (tour 4, lot q4-app) */
  lacherIci: /lâcher ici/,
  /** n° 13 c : l'ancienne ligne du banc, posée sur l'en-tête. */
  bancLigne: /^banc — l’app ouvrirait/,
  /** n° 13 c : la feuille du banc dit qu'elle est le banc. */
  bancFeuille: /\bbanc\b/,
  budgetLien: /^Budget ›$/,
  /** Le lien du message de Retirer vers Finances (« … · dans Finances › »). */
  financesLien: /Finances ›$/,
  /** n° 15 : une pastille « lié à » sans nom lisible : « lié … », « lié à … », « lié à » seul. */
  lieSansNom: /^lié( à)?\s*…?$/,
  fermer: /^Fermer/,
  cafeDuPont: /^Café du Pont/
};

const CAS_REGEX = [
  ['semaineSeule', ['S47', 'S5'], ['S47 −900', 'S', ' S47']],
  ['semaineQuelconque', ['Ajouter en S47', 'S1'], ['Actions rapides', 'S x']],
  ['marcheNoelExact', ['Marché de Noël'], ['Marché de Noël +1 180', 'Le Marché de Noël']],
  ['marcheNoelDebut', ['Marché de Noël, 14 déc.', 'Marché de Noël'], ['Un Marché de Noël']],
  ['ajouter', ['Ajouter', 'Ajouter en S47'], ['Ajouter une fête', 'Ajouter en S']],
  ['sixMois', ['6 mois', '6 mois S47 – S20'], ['16 mois', '3 mois']],
  ['hotte', ['Hotte, 30 nov., −900'], ['La Hotte']],
  ['blonde', ['Blonde d’automne, 23 nov.'], ["Blonde d'automne", 'La Blonde d’automne']],
  ['j0Zero', ['Stout maison J0 / 0 · prête 25 nov.', 'J0/0', 'J0 / 0'], ['J0 / 28 · prête 21 déc.', 'J0 / 05', 'J7 / 28', 'J10 / 0']],
  ['annuler', ['Annuler'], ['Annuler la vente', ' Annuler']],
  ['retirer', ['Retirer', 'Retirer (S49) 2 312 → 3 212'], ['Ne pas retirer']],
  ['mouvementNomme', ['Frigo −1 800', 'TVA T4 −300', 'Marché de Noël +1 180', 'Hotte -900'], ['−1 800', 'S47 – S52', 'Frigo', '113 CHF à dépenser']],
  ['montantSigne', ['Blonde d’automne, 23 nov., −148', 'Marché de Noël +1 180', '−900'], ['Blonde d’automne, 23 nov. – 21 déc.', 'S47 – S52', 'J0 / 28']],
  ['chiffreCle', ['113 CHF à dépenser sans passer sous 0 (S24)'], ['à payer']],
  ['actionsRapides', ['Actions rapides', 'Actions rapides : Calendrier'], ['Les actions rapides']],
  ['jourZero', ['J0 / 28 · prête 7 déc.', 'IPA de printemps, J0', 'J0'], ['J7 / 28', 'J10 / 28', 'J07', 'SJ0x'.replace('x', '1')]],
  ['ipa', ['IPA de printemps, 9 nov.'], ['Une IPA de printemps', 'IPA brume']],
  ['pasDesCourses', ['énergie le 23 nov.', 'impôt le 30 janv.', 'Energie', 'impot'], ['malt pilsner 12 kg', 'Saaz 300 g']],
  ['poigneeFin', ['Poignée de fin : tirer jusqu’au bout pour l’année'], ['Poignée de début : déplacer la fenêtre']],
  ['lacherIci', ['S51 · 14 déc. · lâcher ici'], ['lâcher', 'Lâcher ici']],
  ['bancLigne', ['banc — l’app ouvrirait : le budget du brassin Stout maison'], ['banc — données simulées', 'Le banc — l’app ouvrirait']],
  ['bancFeuille', ['banc — l’app ouvrirait', 'Budget (banc)'], ['bancs publics', 'Abanc']],
  ['budgetLien', ['Budget ›'], ['Budget', 'Budget › du brassin']],
  ['financesLien', ['dans Finances ›', 'Finances ›'], ['Finances', 'Finances › Solde']],
  ['lieSansNom', ['lié …', 'lié à …', 'lié à', 'lié'], ['lié à La Cigogne', 'La Cigogne', 'lié à Épicerie du Bourg']],
  ['fermer', ['Fermer', 'Fermer la feuille'], ['Refermer', 'Ne pas fermer']],
  ['cafeDuPont', ['Café du Pont, 1 fût', 'Café du Pont'], ['Le Café du Pont']]
];

if (process.argv.includes('--test-regex')) {
  let ok = 0; const faux = [];
  for (const [nom, oui, non] of CAS_REGEX) {
    const re = RE[nom];
    const bons = oui.every(t => re.test(t)) && non.every(t => !re.test(t));
    if (bons) ok++; else faux.push(`${nom} (oui : ${oui.filter(t => !re.test(t)).join(' | ') || '—'} ; non : ${non.filter(t => re.test(t)).join(' | ') || '—'})`);
  }
  const sansCas = Object.keys(RE).filter(k => !CAS_REGEX.some(c => c[0] === k));
  for (const k of sansCas) faux.push(`${k} : aucun cas`);
  console.log(faux.length ? `REGEX ECHEC ${ok}/${Object.keys(RE).length} : ${faux.join(' ; ')}` : `REGEX OK ${ok}/${Object.keys(RE).length}`);
  process.exit(faux.length ? 1 : 0);
}

const req = createRequire(import.meta.url);
const puppeteer = req('puppeteer-core');
const url = process.argv.slice(2).find(a => !a.startsWith('--'));
if (!url) { console.log('usage : node scripts/agents/controle-calendrier-app.mjs <url>'); process.exit(2); }
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const attendre = ms => new Promise(r => setTimeout(r, ms));
const ecran = (w, h) => ({ width: w, height: h, isMobile: true, hasTouch: true, deviceScaleFactor: 1, isLandscape: w > h });
const bureau = (w, h) => ({ width: w, height: h, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });

const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const bilan = [];
const note = (nom, ok, dit) => { bilan.push({ nom, ok }); console.log(`${ok ? 'ok' : 'KO'} ${nom} : ${dit}`); };

async function page(w, h, vue = ecran(w, h)) {
  const p = await nav.newPage();
  const erreurs = [];
  p.on('pageerror', e => erreurs.push(e.message));
  await p.setViewport(vue);
  await p.goto(url, { waitUntil: 'load', timeout: 60000 });
  await p.waitForSelector('[data-frise], [data-calendrier]', { timeout: 20000 }).catch(() => {});
  /* les polices chargées d'abord : une police tardive élargit le chiffre clé et le fait passer sur deux lignes (CRITIQUE-2 n° 7) */
  await p.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
  await attendre(900);
  p.erreurs = erreurs;
  p.cdp = await p.target().createCDPSession();
  return p;
}
async function glisser(p, sel, nomRe, colonnes) {
  const c = await p.evaluate((s, re) => {
    const e = [...document.querySelectorAll(s)].find(x => new RegExp(re).test(x.getAttribute('aria-label') || ''));
    if (!e) return null;
    e.scrollIntoView({ block: 'center' });
    const r = e.getBoundingClientRect();
    const lc = parseFloat(document.querySelector('[data-frise]').getAttribute('data-largeur-colonne'));
    /* une prise sur la barre elle-même, jamais sur un jalon ni un bord (le jalon intermédiaire refuse le glisser, D-103) */
    for (const fy of [0.3, 0.5, 0.15]) for (let x = r.left + 20; x < r.right - 12; x += 8) {
      const d = document.elementFromPoint(x, r.top + r.height * fy);
      if (d && (d === e || e.contains(d)) && !d.closest('[data-jalon], [data-bord], .cal-jalon')) return { x, y: r.top + r.height * fy, lc };
    }
    return { x: r.left + Math.min(r.width / 2, 20), y: r.top + r.height / 2, lc };
  }, sel, nomRe);
  if (!c) return false;
  await p.mouse.move(c.x, c.y); await p.mouse.down();
  for (let i = 1; i <= 6; i++) { await p.mouse.move(c.x + (colonnes * c.lc * i) / 6, c.y); await attendre(15); }
  await p.mouse.up(); await attendre(350);
  return true;
}

/* ---- gestes tactiles réels (CDP Input.dispatchTouchEvent) ---- */
const touche = (p, type, x, y) => p.cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }] });
async function toucherXY(p, x, y) { await touche(p, 'touchStart', x, y); await attendre(60); await touche(p, 'touchEnd'); await attendre(450); }
async function appuiLongXY(p, x, y, ms = 750) { await touche(p, 'touchStart', x, y); await attendre(ms); await touche(p, 'touchEnd'); await attendre(450); }
/* Un doigt réel se pose, reste un instant (180 ms, sous l'appui long de 500 ms), puis glisse en 300 ms : un geste trop vif ne prouve rien. */
const POSE_MS = 180;
async function glisserTactileXY(p, x, y, dx) {
  await touche(p, 'touchStart', x, y); await attendre(POSE_MS);
  for (let i = 1; i <= 12; i++) { await touche(p, 'touchMove', x + (dx * i) / 12, y); await attendre(25); }
  await attendre(80); await touche(p, 'touchEnd'); await attendre(500);
}
async function glisserSourisXY(p, x, y, dx) {
  await p.mouse.move(x, y); await p.mouse.down(); await attendre(POSE_MS);
  for (let i = 1; i <= 12; i++) { await p.mouse.move(x + (dx * i) / 12, y); await attendre(25); }
  await attendre(80); await p.mouse.up(); await attendre(500);
}

/** La barre d'une chose, par `data-titre` d'abord, sinon par le début de son nom accessible ; sa semaine, par `data-semaine` ou sa colonne. */
const lireBarre = (p, titre) => p.evaluate(t => {
  const barres = [...document.querySelectorAll('[data-barre]')];
  const b = barres.find(x => x.getAttribute('data-titre') === t) || barres.find(x => (x.getAttribute('aria-label') || '').startsWith(t));
  if (!b) return null;
  const r = b.getBoundingClientRect();
  const frise = document.querySelector('[data-frise]');
  const lc = frise ? parseFloat(frise.getAttribute('data-largeur-colonne')) : NaN;
  const lane = b.closest('[data-lane]') || b.parentElement;
  const l = lane.getBoundingClientRect();
  const sem = b.getAttribute('data-semaine') ?? (Number.isFinite(lc) && lc > 0 ? `col${Math.round((r.left - l.left) / lc)}` : null);
  /* la prise : sur la barre, hors jalon et hors bord */
  for (const fy of [0.3, 0.5, 0.15]) for (let x = r.left + 20; x < r.right - 12; x += 8) {
    const d = document.elementFromPoint(x, r.top + r.height * fy);
    if (d && (d === b || b.contains(d)) && !d.closest('[data-jalon], [data-bord], .cal-jalon')) return { x, y: r.top + r.height * fy, lc, sem, haut: r.top, bas: r.bottom };
  }
  return { x: r.left + Math.min(r.width / 2, 20), y: r.top + r.height / 2, lc, sem, haut: r.top, bas: r.bottom };
}, titre);
const amenerBarre = (p, titre) => p.evaluate(t => {
  const barres = [...document.querySelectorAll('[data-barre]')];
  const b = barres.find(x => x.getAttribute('data-titre') === t) || barres.find(x => (x.getAttribute('aria-label') || '').startsWith(t));
  if (b) b.scrollIntoView({ block: 'center' });
  return !!b;
}, titre);
const annulerVisible = p => p.evaluate(src => [...document.querySelectorAll('button, [role="button"]')].some(b => {
  const r = b.getBoundingClientRect();
  return new RegExp(src).test((b.textContent || '').trim()) && r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
}), RE.annuler.source);

/** Le rectangle du + volant, et les rectangles des textes des barres visibles à l'écran (nœuds de texte, au pixel). */
const recouvrement = p => p.evaluate(() => {
  const f = document.querySelector('button[aria-label^="Actions rapides"]');
  if (!f) return null;
  const R = f.getBoundingClientRect();
  const croisent = [];
  for (const c of document.querySelectorAll('[data-chose]')) {
    const w = document.createTreeWalker(c, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (!n.textContent.trim()) continue;
      const g = document.createRange(); g.selectNodeContents(n);
      for (const r of g.getClientRects()) {
        if (r.width < 1 || r.bottom < 0 || r.top > innerHeight) continue;
        if (r.left < R.right - 1 && r.right > R.left + 1 && r.top < R.bottom - 1 && r.bottom > R.top + 1) croisent.push(n.textContent.trim().slice(0, 24));
      }
    }
  }
  return { fab: [Math.round(R.left), Math.round(R.top), Math.round(R.right), Math.round(R.bottom)], croisent: [...new Set(croisent)] };
});

/** Le chiffre clé et les textes posés sur la courbe (SVG `text` et HTML qui la recouvrent) ; les mouvements nommés parmi eux. */
const lireTete = (p, srcMouvement, srcCle) => p.evaluate((srcM, srcC) => {
  const ent = document.querySelector('[data-calendrier-entete]') || document.querySelector('[data-entete-zone]');
  if (!ent) return null;
  const svgs = [...ent.querySelectorAll('svg')].map(s => ({ s, r: s.getBoundingClientRect() })).filter(x => x.r.width > 150).sort((a, b) => b.r.width * b.r.height - a.r.width * a.r.height);
  if (!svgs.length) return { courbe: null };
  const C = svgs[0].r;
  const cle = ent.querySelector('[data-ent-cle]') || [...ent.querySelectorAll('[aria-label]')].find(e => new RegExp(srcC).test(e.getAttribute('aria-label') || ''));
  const rectsTexte = el => {
    const out = [];
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (!n.textContent.trim()) continue;
      const g = document.createRange(); g.selectNodeContents(n);
      for (const r of g.getClientRects()) if (r.width > 0) out.push(r);
    }
    return out;
  };
  /* la boîte des glyphes du chiffre clé : chaque ligne de texte, rentrée de 25 % en haut et en bas (l'interligne n'est pas de l'encre) */
  const boiteCle = (cle ? rectsTexte(cle) : []).map(r => ({ left: r.left + 2, right: r.right - 2, top: r.top + r.height * 0.25, bottom: r.bottom - r.height * 0.25 }));
  const dedans = r => r.left < C.right && r.right > C.left && r.top < C.bottom && r.bottom > C.top;
  /* les textes de la courbe : chaque élément qui porte un nœud de texte propre, hors chiffre clé et hors bande des semaines */
  const textes = [];
  for (const el of ent.querySelectorAll('*')) {
    if (cle && (cle === el || cle.contains(el))) continue;
    if (el.closest('[data-bande-semaines]')) continue;
    const propre = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (!propre) continue;
    const t = (el.tagName.toLowerCase() === 'text' ? el.textContent : [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' ')).replace(/\s+/g, ' ').trim();
    const rs = rectsTexte(el).filter(dedans);
    if (rs.length) textes.push({ t, rs });
  }
  const croise = [];
  const coupe = (k, r) => k.left < r.right - 1 && k.right > r.left + 1 && k.top < r.bottom - 1 && k.bottom > r.top + 1;
  for (const k of boiteCle) for (const x of textes) for (const r of x.rs) if (coupe(k, r)) croise.push(x.t.slice(0, 30));
  /* n° 7 : « sans passer sous 0 · S43 » écrit SUR la courbe et sur le cadre de la fenêtre ; le tracé et le cadre comptent comme texte de la courbe */
  const cadre = [...ent.querySelectorAll('[role="group"]')].find(g => /^Fenêtre/.test(g.getAttribute('aria-label') || ''));
  for (const k of boiteCle) {
    if (coupe(k, C)) croise.push('le tracé de la courbe');
    if (cadre && coupe(k, cadre.getBoundingClientRect())) croise.push('le cadre de la fenêtre');
  }
  /* les mouvements nommés : un texte (ou un nom et son montant voisins dans le même parent) qui porte un nom et un montant signé */
  const parents = new Map();
  for (const x of textes) {
    const el = [...ent.querySelectorAll('*')].find(e => e.textContent && e.textContent.replace(/\s+/g, ' ').trim() === x.t) || null;
    const cleP = el && el.parentElement ? el.parentElement : null;
    if (cleP) parents.set(cleP, (cleP.textContent || '').replace(/\s+/g, ' ').trim());
  }
  const re = new RegExp(srcM, 'u');
  const noms = new Set([...textes.map(x => x.t), ...parents.values()].filter(t => t.length < 60 && re.test(t)).map(t => t.replace(/[−+-]\s?[\d\s’'.]+.*$/, '').trim()));
  return { courbe: Math.round(C.height), cle: !!cle, croise: [...new Set(croise)], noms: [...noms] };
}, srcMouvement, srcCle);

try {
  /* ---- portrait ---- */
  let p = await page(390, 844);
  const aRangees = await p.evaluate(() => document.querySelectorAll('section[data-rangee]').length);
  if (!aRangees) {
    note('ENTETE', false, 'aucune rangée de la frise : ce n’est pas l’onglet Calendrier du port');
    note('PLUS', false, 'aucun carré + de rangée');
  }

  const ent = await p.evaluate(() => {
    const zone = document.querySelector('[data-entete-zone]') || document.querySelector('[data-calendrier-entete]');
    const svg = [...document.querySelectorAll('[data-calendrier-entete] svg')].map(s => s.getBoundingClientRect()).filter(r => r.width > 150);
    const bande = document.querySelector('[data-bande-semaines]');
    return {
      zone: zone ? Math.round(zone.getBoundingClientRect().height) : 0,
      courbe: Math.max(0, ...svg.map(r => Math.round(r.height))),
      bande: bande ? Math.round(bande.getBoundingClientRect().height) : 0,
      bandeTexte: bande ? [...bande.querySelectorAll('button')].map(b => (b.textContent || '').trim()) : []
    };
  });
  if (aRangees) {
    note('ENTETE', ent.courbe >= 80 && ent.bande > 0 && ent.bande <= 40 && ent.zone <= 180, `courbe ${ent.courbe} px (min 80), bande ${ent.bande} px (max 40), en-tête ${ent.zone} px (max 180)`);
    const sales = ent.bandeTexte.filter(t => !RE.semaineSeule.test(t));
    note('BANDE', ent.bandeTexte.length > 0 && sales.length === 0, `${ent.bandeTexte.length} semaines, ${sales.length} avec autre chose que « S\\d+ »${sales.length ? ` (${sales.slice(0, 2).join(' | ')})` : ''}`);

    /* J0, TETE-LISIBLE, NOMS-390, MONTANT, FAB-RECOUVRE (390) : au repos, avant tout geste */
    const textePortrait = await p.evaluate(() => `${document.body.innerText}\n${[...document.querySelectorAll('[aria-label]')].map(e => e.getAttribute('aria-label')).join('\n')}`);
    const j0Portrait = (textePortrait.match(new RegExp(RE.j0Zero.source, 'g')) || []).length;
    const tete = await lireTete(p, RE.mouvementNomme.source, RE.chiffreCle.source);
    /* TETE-LISIBLE se note en paysage, avec la mesure de 390 (l'en-tête w3s est plus serré) */
    const teteOk = t => !!t && t.courbe !== null && t.cle && t.croise.length === 0;
    const teteDit = t => (!t || t.courbe === null ? 'en-tête ou courbe introuvable' : !t.cle ? 'chiffre clé introuvable' : `${t.croise.length} texte(s) de la courbe sous le chiffre clé${t.croise.length ? ` (${t.croise.slice(0, 3).join(' | ')})` : ''}`);
    const nbNoms = tete && tete.noms ? tete.noms.length : 0;
    note('NOMS-390', nbNoms >= 6, `${nbNoms} mouvement(s) nommé(s) avec leur montant sur la courbe (min 6)${nbNoms ? ` : ${tete.noms.slice(0, 8).join(', ')}` : ''}`);
    const montants = await p.evaluate((srcB, srcM, srcS) => {
      const lire = re => {
        const b = [...document.querySelectorAll('[data-barre]')].find(x => re.test(x.getAttribute('data-titre') || '') || re.test(x.getAttribute('aria-label') || ''));
        if (!b) return { trouve: false };
        const t = `${b.getAttribute('aria-label') || ''} ${b.textContent || ''}`;
        return { trouve: true, montant: new RegExp(srcS).test(t), t: t.replace(/\s+/g, ' ').trim().slice(0, 70) };
      };
      return { blonde: lire(new RegExp(srcB)), noel: lire(new RegExp(srcM)) };
    }, RE.blonde.source, RE.marcheNoelDebut.source, RE.montantSigne.source);
    const dire = (n, m) => (m.trouve ? `${n} ${m.montant ? 'avec' : 'sans'} montant (« ${m.t} »)` : `${n} introuvable`);
    note('MONTANT', montants.blonde.montant === true && montants.noel.montant === true, `${dire('Blonde', montants.blonde)} ; ${dire('Marché de Noël', montants.noel)}`);
    const rec390 = await recouvrement(p);

    const plus = await p.evaluate(() => [...document.querySelectorAll('button[data-plus]')].map(b => { const r = b.getBoundingClientRect(); return { x: Math.round(r.left), id: b.getAttribute('data-plus') }; }));
    const xs = plus.map(q => q.x);
    note('PLUS', plus.length === 7 && Math.max(...xs) - Math.min(...xs) <= 2, `${plus.length} carrés + ; écart de colonne ${xs.length ? Math.max(...xs) - Math.min(...xs) : '—'} px`);

    let ouverts = 0; const faux = [];
    for (const q of plus) {
      await p.evaluate(id => document.querySelector(`button[data-plus="${id}"]`).scrollIntoView({ block: 'center' }), q.id);
      await p.click(`button[data-plus="${q.id}"]`); await attendre(500);
      const d = await p.evaluate(() => { const f = document.querySelector('[data-feuille-rangee]'); return f ? f.getAttribute('data-feuille-rangee') : null; });
      if (d === q.id) ouverts++; else faux.push(`${q.id}→${d}`);
      await p.keyboard.press('Escape'); await attendre(450);
    }
    note('PLUS-AGIT', ouverts === 7 && plus.length === 7, `${ouverts}/${plus.length} carrés ouvrent la feuille sur leur rangée${faux.length ? ` (${faux.join(', ')})` : ''}`);
    await p.close();

    /* BRUIT : f1-a (un achat glissé) puis f6-b (un brassin lié à une vente promise) */
    p = await page(390, 844);
    const f1 = await glisser(p, '[data-barre]', RE.hotte.source, 1);
    const f6 = await glisser(p, '[data-barre]', RE.blonde.source, 1);
    const msg = await p.evaluate(() => {
      const m = [...document.querySelectorAll('[role="status"], [role="alert"]')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
      const ligne = document.querySelector('.cal-msg-ligne');
      const lh = ligne ? parseFloat(getComputedStyle(ligne).lineHeight) || 18 : 18;
      return { n: m.length, roles: m.map(e => e.getAttribute('role')), lignes: ligne ? Math.round(ligne.getBoundingClientRect().height / lh) : 0 };
    });
    note('BRUIT', f1 && f6 && msg.n === 1 && msg.lignes <= 2, `${msg.n} message(s) [${msg.roles.join(',')}], ${msg.lignes} ligne(s)${f1 && f6 ? '' : ' (geste non joué : barre introuvable)'}`);
    await p.close();

    /* GLISSE (390, toucher réel) : la Hotte glissée de 2 colonnes change de semaine, « Annuler » apparaît */
    const glisse = [];
    p = await page(390, 844);
    if (await amenerBarre(p, 'Hotte')) {
      await attendre(300);
      const a = await lireBarre(p, 'Hotte');
      await glisserTactileXY(p, a.x, a.y, 2 * a.lc);
      const b = await lireBarre(p, 'Hotte');
      const ann = await annulerVisible(p);
      glisse.push({ ou: '390 toucher', ok: !!b && b.sem !== a.sem && ann, dit: `semaine ${a.sem} → ${b ? b.sem : 'barre perdue'}, Annuler ${ann ? 'visible' : 'absent'}` });
    } else glisse.push({ ou: '390 toucher', ok: false, dit: 'barre Hotte introuvable' });
    await p.close();

    /* MENU-BORNE (390, appui long réel) : le menu et Retirer dans l'écran, au-dessus des onglets et du +. Deux places de la barre : là où
       elle est au repos, puis basse (son bas 80 px au-dessus des onglets), le pire cas d'un menu qui s'ouvre sous elle (« pas borné à l'écran »). */
    const bornes = [];
    for (const place of ['repos', 'basse']) {
    p = await page(390, 844);
    let borne = { ok: false, dit: 'barre Hotte introuvable' };
    const posee = await p.evaluate((t, pl) => {
      const barres = [...document.querySelectorAll('[data-barre]')];
      const b = barres.find(x => x.getAttribute('data-titre') === t) || barres.find(x => (x.getAttribute('aria-label') || '').startsWith(t));
      if (!b) return false;
      const nv = document.querySelector('nav[aria-label="Navigation principale"]');
      const N = nv ? nv.getBoundingClientRect().top : innerHeight;
      const r = b.getBoundingClientRect();
      if (pl === 'repos') { if (r.top < 0 || r.bottom > N) b.scrollIntoView({ block: 'nearest' }); }
      else window.scrollBy(0, r.bottom - (N - 80));
      return true;
    }, 'Hotte', place);
    if (posee) {
      await attendre(300);
      const a = await lireBarre(p, 'Hotte');
      await appuiLongXY(p, a.x, a.y);
      borne = await p.evaluate(srcR => {
        const m = document.querySelector('[role="menu"]');
        if (!m) return { ok: false, dit: 'aucun menu après l’appui long' };
        const r = m.getBoundingClientRect();
        const ret = [...m.querySelectorAll('button, [role="menuitem"]')].find(b => new RegExp(srcR).test((b.textContent || '').trim()));
        const nv = document.querySelector('nav[aria-label="Navigation principale"]');
        const fab = document.querySelector('button[aria-label^="Actions rapides"]');
        const N = nv ? nv.getBoundingClientRect().top : innerHeight;
        const F = fab ? fab.getBoundingClientRect() : null;
        const croiseFab = Q => !!F && Q.left < F.right && Q.right > F.left && Q.top < F.bottom && Q.bottom > F.top;
        const dansEcran = r.top >= 0 && r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight;
        if (!ret) return { ok: false, dit: `menu ${Math.round(r.top)}–${Math.round(r.bottom)} px, Retirer absent du menu` };
        const R = ret.getBoundingClientRect();
        const dessus = document.elementFromPoint(R.left + R.width / 2, R.top + R.height / 2);
        const touchable = !!dessus && (ret === dessus || ret.contains(dessus));
        const ok = dansEcran && r.bottom <= N && !croiseFab(r) && touchable;
        return { ok, dit: `menu ${Math.round(r.top)}–${Math.round(r.bottom)} px (écran ${innerHeight}, onglets à ${Math.round(N)}) ; dans l’écran ${dansEcran} ; croise le + ${croiseFab(r)} ; Retirer ${Math.round(R.top)}–${Math.round(R.bottom)} px, touchable ${touchable}` };
      }, RE.retirer.source);
      borne.dit = `barre ${Math.round(a.haut)}–${Math.round(a.bas)} px, ${borne.dit}`;
    }
    bornes.push({ place, ...borne });
    await p.close();
    }
    note('MENU-BORNE', bornes.every(b => b.ok), bornes.map(b => `${b.place} : ${b.dit}`).join(' ; '));

    /* GLISSE (1280, souris) */
    p = await page(1280, 800, bureau(1280, 800));
    if (await amenerBarre(p, 'Hotte')) {
      await attendre(300);
      const a = await lireBarre(p, 'Hotte');
      await glisserSourisXY(p, a.x, a.y, 2 * a.lc);
      const b = await lireBarre(p, 'Hotte');
      const ann = await annulerVisible(p);
      glisse.push({ ou: '1280 souris', ok: !!b && b.sem !== a.sem && ann, dit: `semaine ${a.sem} → ${b ? b.sem : 'barre perdue'}, Annuler ${ann ? 'visible' : 'absent'}` });
    } else glisse.push({ ou: '1280 souris', ok: false, dit: 'barre Hotte introuvable' });
    await p.close();
    note('GLISSE', glisse.every(g => g.ok), glisse.map(g => `${g.ou} : ${g.dit}`).join(' ; '));

    /* FAB : tiers droit, 4 à 24 px au-dessus des onglets */
    p = await page(390, 844);
    const fab = await p.evaluate(() => {
      const f = document.querySelector('button[aria-label^="Actions rapides"]');
      const nv = document.querySelector('nav[aria-label="Navigation principale"]');
      if (!f || !nv) return null;
      const r = f.getBoundingClientRect(), n = nv.getBoundingClientRect();
      return { droite: r.left + r.width / 2 >= innerWidth * (2 / 3), ecart: Math.round(n.top - r.bottom), nom: f.getAttribute('aria-label') };
    });
    note('FAB', !!fab && fab.droite && fab.ecart >= 4 && fab.ecart <= 24 && !RE.semaineQuelconque.test(fab.nom), fab ? `tiers droit ${fab.droite}, ${fab.ecart} px au-dessus des onglets, nom « ${fab.nom} »` : 'bouton ou onglets introuvables');

    /* ROTATION : une chose ajoutée reste */
    await p.evaluate(() => { window.__jeton = 'portrait-1'; });
    await p.evaluate(() => document.querySelector('button[data-plus="fetes"]').scrollIntoView({ block: 'center' }));
    await p.click('button[data-plus="fetes"]'); await attendre(500);
    await p.evaluate(src => { /* la feuille d'ajout ouverte (la dernière), pas un autre dialogue du document (CRITIQUE-5 n° 19) */ const d = [...document.querySelectorAll('[role="dialog"]')].filter(x => x.getBoundingClientRect().height > 0 && /Ajouter/.test(x.textContent || '')).pop(); if (!d) return; [...d.querySelectorAll('button')].find(b => new RegExp(src).test((b.textContent || '').trim()))?.click(); }, RE.marcheNoelExact.source);
    await attendre(200);
    await p.evaluate(src => { /* la feuille d'ajout ouverte (la dernière), pas un autre dialogue du document (CRITIQUE-5 n° 19) */ const d = [...document.querySelectorAll('[role="dialog"]')].filter(x => x.getBoundingClientRect().height > 0 && /Ajouter/.test(x.textContent || '')).pop(); if (!d) return; [...d.querySelectorAll('button')].find(b => new RegExp(src).test((b.textContent || '').trim()))?.click(); }, RE.ajouter.source);
    await attendre(700);
    const compte = () => p.evaluate(src => [...document.querySelectorAll('[data-chose]')].filter(e => new RegExp(src).test(e.getAttribute('aria-label') || '')).length, RE.marcheNoelDebut.source);
    const avant = await compte();
    const vues = [];
    for (const [w, h] of [[844, 390], [390, 844]]) {
      await p.setViewport(ecran(w, h)); await attendre(800);
      vues.push(await p.evaluate(src => ({ jeton: window.__jeton, n: [...document.querySelectorAll('[data-chose]')].filter(e => new RegExp(src).test(e.getAttribute('aria-label') || '')).length, o: document.querySelector('[data-calendrier]')?.getAttribute('data-orientation'), w: innerWidth }), RE.marcheNoelDebut.source));
      if (w === 844) {
        /* PAYS : mesuré ici, au même état */
        const pays = await p.evaluate(() => {
          const z = document.querySelector('[data-entete-zone]');
          const hs = [...document.querySelectorAll('section[data-rangee]')].map(s => s.getBoundingClientRect().height).sort((a, b) => a - b);
          return { cols: Number(document.querySelector('[data-frise]')?.getAttribute('data-nb-colonnes')), tete: z ? Math.round(z.getBoundingClientRect().height) : 0, mediane: Math.round(hs[Math.floor(hs.length / 2)] || 0) };
        });
        note('PAYS', pays.cols === 13 && pays.tete <= 120 && pays.mediane <= 48, `${pays.cols} semaines, en-tête ${pays.tete} px (max 120), rangée médiane ${pays.mediane} px (max 48)`);
      }
    }
    const garde = avant >= 2 && vues.every(v => v.n === avant && v.jeton === 'portrait-1') && vues[0].o === 'paysage' && vues[1].o === 'portrait';
    note('ROTATION', garde, `la chose ajoutée : ${avant} avant, ${vues.map(v => `${v.n} en ${v.o}`).join(', ')} ; page non rechargée ${vues.every(v => v.jeton === 'portrait-1')}`);
    await p.close();

    /* Paysage 844 × 390, chargé tel quel : J0, FAB-RECOUVRE, PLUS-PAYSAGE */
    p = await page(844, 390);
    const textePaysage = await p.evaluate(() => `${document.body.innerText}\n${[...document.querySelectorAll('[aria-label]')].map(e => e.getAttribute('aria-label')).join('\n')}`);
    const j0Paysage = (textePaysage.match(new RegExp(RE.j0Zero.source, 'g')) || []).length;
    note('J0', j0Portrait === 0 && j0Paysage === 0, `« J0 / 0 » : ${j0Portrait} à 390, ${j0Paysage} en paysage`);
    const tetePays = await lireTete(p, RE.mouvementNomme.source, RE.chiffreCle.source);
    note('TETE-LISIBLE', teteOk(tete) && teteOk(tetePays), `390 : ${teteDit(tete)} ; paysage : ${teteDit(tetePays)}`);
    const recPays = await recouvrement(p);
    const dRec = (o, r) => (r ? `${o} : + [${r.fab.join(',')}], ${r.croisent.length} étiquette(s) dessous${r.croisent.length ? ` (${r.croisent.slice(0, 3).join(' | ')})` : ''}` : `${o} : + introuvable`);
    note('FAB-RECOUVRE', !!rec390 && !!recPays && rec390.croisent.length === 0 && recPays.croisent.length === 0, `${dRec('390', rec390)} ; ${dRec('paysage', recPays)}`);
    const fabP = await p.evaluate(() => { const f = document.querySelector('button[aria-label^="Actions rapides"]'); if (!f) return null; const r = f.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    let volant = { ok: false, dit: '+ volant introuvable' };
    if (fabP) {
      await toucherXY(p, fabP.x, fabP.y); await attendre(400);
      volant = await p.evaluate(() => {
        const d = [...document.querySelectorAll('[role="dialog"], [role="menu"]')].filter(x => x.getBoundingClientRect().height > 0).pop();
        if (!d) return { ok: false, dit: 'le + touché n’ouvre aucune feuille' };
        const lignes = [...d.querySelectorAll('button, [role="menuitem"], h2, h3, [role="heading"]')].filter(b => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (b.textContent || '').trim(); });
        const dehors = lignes.filter(b => { const r = b.getBoundingClientRect(); return r.top < -0.5 || r.left < -0.5 || r.bottom > innerHeight + 0.5 || r.right > innerWidth + 0.5; }).map(b => (b.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 28));
        return { ok: lignes.length > 0 && dehors.length === 0, dit: `${lignes.length} ligne(s), ${dehors.length} hors de ${innerWidth} × ${innerHeight}${dehors.length ? ` (${dehors.slice(0, 4).join(' | ')})` : ''}` };
      });
    }
    note('PLUS-PAYSAGE', volant.ok, volant.dit);
    await p.close();

    /* BARRE-PETITE : 6 mois */
    p = await page(390, 844);
    await p.click('[data-ent-periode]'); await attendre(300);
    await p.evaluate(src => { const d = document.querySelector('[role="dialog"][aria-label="Période et vue"]'); [...d.querySelectorAll('button')].find(b => new RegExp(src).test((b.textContent || '').trim()))?.click(); }, RE.sixMois.source);
    await attendre(700);
    const petit = await p.evaluate(() => {
      const barres = [...document.querySelectorAll('[data-barre]')].map(b => b.getBoundingClientRect().width);
      const marques = [...document.querySelectorAll('[data-marque]')];
      return { barres: barres.length, min: barres.length ? Math.round(Math.min(...barres)) : null, marques: marques.length, nommees: marques.filter(m => (m.getAttribute('aria-label') || '').length > 3).length, cols: Number(document.querySelector('[data-frise]')?.getAttribute('data-nb-colonnes')) };
    });
    note('BARRE-PETITE', petit.cols === 26 && (petit.min === null || petit.min >= 24) && petit.marques > 0 && petit.nommees === petit.marques, `${petit.cols} semaines : ${petit.barres} barres (la plus étroite ${petit.min} px, min 24), ${petit.marques} marques dont ${petit.nommees} nommées`);
    if (p.erreurs.length) note('ERREURS', false, `${p.erreurs.length} erreur(s) de page : ${p.erreurs[0]}`);
    await p.close();

    /* ---------- CRITIQUE-3 (tour 3, lot t3-d) : six contrôles qui échouent sur 40d11da1 (L13) ---------- */

    /** Les messages visibles (role status|alert, hors lecteurs d'écran) et ceux qui recouvrent un titre de rangée. */
    const lireMessages = q => q.evaluate(() => {
      const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && s.display !== 'none' && r.bottom > 0 && r.top < innerHeight; };
      const m = [...document.querySelectorAll('[role="status"], [role="alert"]')].filter(vis).filter(e => !e.closest('.sr-only'));
      const titres = [...document.querySelectorAll('[data-rangee] .cal-nom, section[data-rangee] h3')].filter(vis);
      const sur = [];
      for (const e of m) {
        const R = e.getBoundingClientRect();
        for (const t of titres) {
          const g = document.createRange(); g.selectNodeContents(t); const T0 = g.getBoundingClientRect(); const T = T0.width > 0 ? T0 : t.getBoundingClientRect();
          if (R.left < T.right - 1 && R.right > T.left + 1 && R.top < T.bottom - 1 && R.bottom > T.top + 1) sur.push(`${(e.textContent || '').trim().slice(0, 24)} sur ${(t.textContent || '').trim()}`);
        }
      }
      return { n: m.length, textes: m.map(e => (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 32)), sur };
    });
    const ditMsg = (o, r) => `${o} : ${r.n} message(s)${r.n ? ` [${r.textes.join(' | ')}]` : ''}${r.sur.length ? `, sur un titre (${r.sur.join(' ; ')})` : ''}`;

    /* BRUIT-SUITE (390 × 844 tactile) : f1-a, puis la poignée de fin tirée à mi-chemin et lâchée, puis la rotation ; à chaque état, au plus un
       message, et aucun sur un titre de rangée (« Brassins » compris ; n° 7, D-200, E33) */
    let q = await page(390, 844);
    const suite = [];
    if (await amenerBarre(q, 'Hotte')) {
      await attendre(300);
      const a = await lireBarre(q, 'Hotte');
      await glisserTactileXY(q, a.x, a.y, a.lc);
      suite.push(['f1-a', await lireMessages(q)]);
      const pg = await q.evaluate(src => {
        window.scrollTo(0, 0);
        const ps = [...document.querySelectorAll('[data-poignee]')];
        const b = ps.find(x => new RegExp(src).test(x.getAttribute('aria-label') || '')) || ps[ps.length - 1];
        const bande = document.querySelector('[data-bande-semaines]');
        if (!b || !bande) return null;
        const r = b.getBoundingClientRect(), B = bande.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, reste: B.right - (r.left + r.width / 2) };
      }, RE.poigneeFin.source);
      if (pg) {
        await attendre(200);
        await touche(q, 'touchStart', pg.x, pg.y); await attendre(POSE_MS);
        for (let i = 1; i <= 10; i++) { await touche(q, 'touchMove', pg.x + (pg.reste * 0.5 * i) / 10, pg.y); await attendre(25); }
        await touche(q, 'touchEnd'); await attendre(500);
        suite.push(['poignée lâchée à 50 %', await lireMessages(q)]);
      } else suite.push(['poignée', { n: 9, textes: ['poignée de fin introuvable'], sur: [] }]);
      await q.setViewport(ecran(844, 390)); await attendre(800);
      suite.push(['rotation', await lireMessages(q)]);
    } else suite.push(['f1-a', { n: 9, textes: ['barre Hotte introuvable'], sur: [] }]);
    note('BRUIT-SUITE', suite.every(([, r]) => r.n <= 1 && r.sur.length === 0), suite.map(([o, r]) => ditMsg(o, r)).join(' ; '));
    await q.close();

    /* JOUR (banc) : l'IPA de printemps, en cuve depuis S-1, n'affiche pas « J0 » (n° 1) */
    q = await page(390, 844);
    const ipa = await q.evaluate((srcI, srcJ) => {
      const b = [...document.querySelectorAll('[data-barre], [data-marque]')].find(x => new RegExp(srcI).test(x.getAttribute('data-titre') || x.getAttribute('aria-label') || ''));
      if (!b) return null;
      const t = `${b.getAttribute('aria-label') || ''} ${b.textContent || ''}`.replace(/\s+/g, ' ');
      return { t: t.trim().slice(0, 80), j0: new RegExp(srcJ).test(t) };
    }, RE.ipa.source, RE.jourZero.source);
    note('JOUR', !!ipa && !ipa.j0, ipa ? `IPA de printemps : « ${ipa.t} »${ipa.j0 ? ' contient J0' : ''}` : 'barre de l’IPA de printemps introuvable');

    /* COURSES (390) : le détail f4-b de la Blonde ne range ni l'impôt ni l'énergie dans ses courses (n° 2) */
    const blondeB = await amenerBarre(q, 'Blonde d’automne') ? await lireBarre(q, 'Blonde d’automne') : null;
    let courses = { ok: false, dit: 'barre de la Blonde introuvable' };
    if (blondeB) {
      await toucherXY(q, blondeB.x, blondeB.y);
      courses = await q.evaluate(src => {
        const d = document.querySelector('[data-detail]');
        if (!d) return { ok: false, dit: 'aucun détail f4-b après le toucher' };
        /* la ligne des courses seule (`data-courses`), sinon le texte qui suit « Courses » jusqu'à la ligne suivante */
        const ligne = d.querySelector('[data-courses]');
        const t = ((ligne || d).textContent || '').replace(/\s+/g, ' ');
        const i = t.indexOf('Courses');
        if (i < 0) return { ok: true, dit: 'aucune ligne « Courses » dans le détail' };
        const apres = ligne ? t.slice(i) : t.slice(i, i + 160);
        const faux = new RegExp(src, 'i').test(apres);
        return { ok: !faux, dit: `« ${apres.slice(0, 90)} »${faux ? ' : impôt ou énergie dans les courses' : ''}` };
      }, RE.pasDesCourses.source);
    }
    note('COURSES', courses.ok, courses.dit);
    await q.close();

    /* MARQUE-6S (390, 3 mois) : un appui long réel sur une marque ouvre la vue 6 semaines, aucun menu (n° 5, D-199, E27) */
    q = await page(390, 844);
    await q.click('[data-ent-periode]'); await attendre(300);
    await q.evaluate(() => { const d = document.querySelector('[role="dialog"][aria-label="Période et vue"]'); [...d.querySelectorAll('button')].find(b => /^3 mois/.test((b.textContent || '').trim()))?.click(); });
    await attendre(700);
    const mq = await q.evaluate(() => {
      const ms = [...document.querySelectorAll('[data-marque]')];
      const m = ms.find(x => { const n = Number((x.getAttribute('data-semaine') || 'S0').slice(1)); return n >= 50 || (n > 0 && n < 20); }) || ms[0];
      if (!m) return null;
      m.scrollIntoView({ block: 'center' });
      const r = m.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, nom: (m.getAttribute('aria-label') || '').slice(0, 40), cols: Number(document.querySelector('[data-frise]')?.getAttribute('data-nb-colonnes')) };
    });
    let six = { ok: false, dit: 'aucune marque en 3 mois' };
    if (mq) {
      await attendre(300);
      await appuiLongXY(q, mq.x, mq.y);
      const apres = await q.evaluate(() => ({ cols: Number(document.querySelector('[data-frise]')?.getAttribute('data-nb-colonnes')), menu: !!document.querySelector('[role="menu"]') }));
      six = { ok: mq.cols === 13 && apres.cols === 6 && !apres.menu, dit: `« ${mq.nom} » : ${mq.cols} → ${apres.cols} semaines, menu ${apres.menu ? 'ouvert' : 'aucun'}` };
    }
    note('MARQUE-6S', six.ok, six.dit);
    await q.close();

    /* MENU-PAYS (844 × 390) : les six actions du menu f5-a dans l'écran (n° 4, D-192, E31) ; COMPACT-PAYS : rangée médiane ≤ 48 px (n° 10, D-174) */
    q = await page(844, 390);
    const compact = await q.evaluate(() => {
      const hs = [...document.querySelectorAll('section[data-rangee]')].map(s => s.getBoundingClientRect().height).sort((a, b) => a - b);
      return { n: hs.length, mediane: Math.round(hs[Math.floor(hs.length / 2)] || 0) };
    });
    note('COMPACT-PAYS', compact.n === 7 && compact.mediane > 0 && compact.mediane <= 48, `${compact.n} rangées, médiane ${compact.mediane} px (max 48)`);
    let menuPays = { ok: false, dit: 'barre Hotte introuvable' };
    if (await amenerBarre(q, 'Hotte')) {
      await attendre(300);
      const a = await lireBarre(q, 'Hotte');
      await appuiLongXY(q, a.x, a.y);
      /* dans l'écran, touchable (rien posé dessus : en-tête collant, +, onglets), et près de sa barre (« loin de la Hotte », n° 4) */
      menuPays = await q.evaluate((haut, bas) => {
        const m = document.querySelector('[role="menu"]');
        if (!m) return { ok: false, dit: 'aucun menu après l’appui long' };
        const M = m.getBoundingClientRect();
        const acts = [...m.querySelectorAll('[role="menuitem"], button')].filter(b => (b.textContent || '').trim() && !/^Fermer$/.test(b.getAttribute('aria-label') || ''));
        const noms = acts.map(b => (b.textContent || '').replace(/\s+/g, ' ').trim().split(' ')[0]);
        const dehors = acts.filter(b => {
          const r = b.getBoundingClientRect();
          if (r.height < 1 || r.top < -0.5 || r.left < -0.5 || r.bottom > innerHeight + 0.5 || r.right > innerWidth + 0.5) return true;
          const d = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return !d || !(d === b || b.contains(d));
        }).map(b => (b.textContent || '').trim().slice(0, 16));
        const ecart = M.top >= bas - 2 ? Math.round(M.top - bas) : M.bottom <= haut + 2 ? Math.round(haut - M.bottom) : 0;
        const pres = ecart <= 48;
        /* CRITIQUE-4 n° 12 (E31) : le menu ne se pose ni sur l'en-tête ni sur la chose tenue */
        const coupe = (A, B) => A.left < B.right - 1 && A.right > B.left + 1 && A.top < B.bottom - 1 && A.bottom > B.top + 1;
        const zone = document.querySelector('[data-entete-zone]');
        const surEntete = !!zone && coupe(M, zone.getBoundingClientRect());
        const barre = [...document.querySelectorAll('[data-barre]')].find(x => x.getAttribute('data-titre') === 'Hotte' || (x.getAttribute('aria-label') || '').startsWith('Hotte'));
        const surBarre = !!barre && coupe(M, barre.getBoundingClientRect());
        return { ok: acts.length >= 6 && dehors.length === 0 && pres && !surEntete && !surBarre, dit: `${acts.length} action(s) (${noms.join(', ')}), ${dehors.length} hors de ${innerWidth} × ${innerHeight} ou couverte(s)${dehors.length ? ` (${dehors.join(' | ')})` : ''} ; menu ${Math.round(M.top)}–${Math.round(M.bottom)} px, barre ${Math.round(haut)}–${Math.round(bas)} px, écart ${ecart} px (max 48) ; sur l’en-tête ${surEntete}, sur la Hotte tenue ${surBarre}` };
      }, a.haut, a.bas);
    }
    note('MENU-PAYS', menuPays.ok, menuPays.dit);
    await q.close();

    /* ---------- CRITIQUE-4 (tour 4, lot q4-app) : six contrôles, témoin sur 21e0260c (L13) ---------- */

    /** Les rectangles des noms posés (titres des choses, titres des rangées), hors de la chose `sauf` (celle qu'on tient). */
    const NOMS_SRC = `(sauf) => {
      const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && s.display !== 'none' && r.bottom > 0 && r.top < innerHeight; };
      const out = [];
      for (const e of document.querySelectorAll('[data-chose] .cal-lbl-t, section[data-rangee] h3, [data-rangee] .cal-nom')) {
        if (!vis(e)) continue;
        const c = e.closest('[data-chose]');
        if (sauf && c && ((c.getAttribute('data-titre') || '') === sauf || (c.getAttribute('aria-label') || '').startsWith(sauf))) continue;
        const g = document.createRange(); g.selectNodeContents(e);
        for (const r of g.getClientRects()) if (r.width > 1) out.push({ t: (e.textContent || '').trim().slice(0, 24), l: r.left, r: r.right, h: r.top, b: r.bottom });
      }
      return out;
    }`;
    /** Les messages visibles et la bulle du glisser : sur quel nom ils se posent, et s'ils sont tronqués. */
    const lireMessagesNoms = (q, sauf, srcIci) => q.evaluate((src, s, srcI) => {
      const noms = (0, eval)(src)(s);
      const vis = e => { const r = e.getBoundingClientRect(); const st = getComputedStyle(e); return r.width > 1 && r.height > 1 && st.visibility !== 'hidden' && st.display !== 'none' && r.bottom > 0 && r.top < innerHeight; };
      const boites = [...document.querySelectorAll('[role="status"], [role="alert"]')].filter(vis).filter(e => !e.closest('.sr-only') && (e.textContent || '').trim());
      /* la bulle « lâcher ici » : l'élément qui porte ce texte en propre */
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) if (new RegExp(srcI).test(n.textContent) && n.parentElement && vis(n.parentElement) && !boites.includes(n.parentElement)) boites.push(n.parentElement);
      const res = [];
      for (const m of boites) {
        const R = m.getBoundingClientRect();
        const sur = noms.filter(x => R.left < x.r - 1 && R.right > x.l + 1 && R.top < x.b - 1 && R.bottom > x.h + 1).map(x => x.t);
        const tronque = [m, ...m.querySelectorAll('*')].some(e => vis(e) && e.scrollWidth > e.clientWidth + 1 && /hidden|clip/.test(getComputedStyle(e).overflowX)) || /…\s*$/.test((m.textContent || '').trim());
        res.push({ t: (m.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40), sur: [...new Set(sur)], tronque });
      }
      return res;
    }, NOMS_SRC, sauf, srcIci);
    const okMessages = l => l.every(m => m.sur.length === 0 && !m.tronque);
    const ditMessages = (o, l) => `${o} : ${l.length ? l.map(m => `« ${m.t} »${m.sur.length ? ` sur ${m.sur.join(', ')}` : ''}${m.tronque ? ' tronqué' : ''}`).join(' ; ') : 'aucun message'}`;

    /* MESSAGE-NOM (390 tactile, n° 13 a et b, E33, D-200) : la bulle « lâcher ici » pendant f1-a, le message après, et le bandeau de la vente
       acceptée (Café du Pont) ne se posent sur aucun nom et ne sont pas tronqués */
    q = await page(390, 844);
    const mn = [];
    if (await amenerBarre(q, 'Hotte')) {
      await attendre(300);
      const a = await lireBarre(q, 'Hotte');
      await touche(q, 'touchStart', a.x, a.y); await attendre(POSE_MS);
      for (let i = 1; i <= 12; i++) { await touche(q, 'touchMove', a.x + (2 * a.lc * i) / 12, a.y); await attendre(25); }
      await attendre(200);
      const pendant = await lireMessagesNoms(q, 'Hotte', RE.lacherIci.source);
      mn.push(['f1-a pendant', pendant, pendant.some(m => RE.lacherIci.test(m.t))]);
      await touche(q, 'touchEnd'); await attendre(500);
      mn.push(['f1-a après', await lireMessagesNoms(q, 'Hotte', RE.lacherIci.source), true]);
    } else mn.push(['f1-a', [{ t: 'barre Hotte introuvable', sur: ['?'], tronque: true }], false]);
    await q.close();
    q = await page(390, 844);
    if (await amenerBarre(q, 'Café du Pont')) {
      await attendre(300);
      const c = await lireBarre(q, 'Café du Pont');
      await toucherXY(q, c.x, c.y);
      const l = await lireMessagesNoms(q, 'Café du Pont', RE.lacherIci.source);
      mn.push(['vente acceptée', l, l.some(m => RE.cafeDuPont.test(m.t) || /vente/i.test(m.t))]);
    } else mn.push(['vente', [{ t: 'Café du Pont introuvable', sur: ['?'], tronque: true }], false]);
    await q.close();
    note('MESSAGE-NOM', mn.every(([, l, vu]) => vu && okMessages(l)), mn.map(([o, l, vu]) => `${ditMessages(o, l)}${vu ? '' : ' (message attendu non vu)'}`).join(' ; '));

    /* NOMS-COUPES (n° 24) : aucun nom de chose coupé (« … » ou débordement masqué) quand la place libre à sa droite, dans sa rangée,
       suffit à l'écrire entier ; à 390, en paysage et à 1280 */
    const coupes = [];
    for (const [w, h, v] of [[390, 844, ecran(390, 844)], [844, 390, ecran(844, 390)], [1280, 800, bureau(1280, 800)]]) {
      q = await page(w, h, v);
      const c = await q.evaluate(() => {
        const cv = document.createElement('canvas').getContext('2d');
        const largeur = (el, t) => { const s = getComputedStyle(el); cv.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`; return cv.measureText(t).width; };
        const choses = [...document.querySelectorAll('[data-chose]')].map(e => ({ e, R: e.getBoundingClientRect() })).filter(x => x.R.width > 0);
        const out = [];
        for (const lbl of document.querySelectorAll('[data-chose] .cal-lbl-t')) {
          const L = lbl.getBoundingClientRect(); if (L.width < 1 || L.bottom < 0 || L.top > innerHeight) continue;
          const c = lbl.closest('[data-chose]');
          const entier = (c.getAttribute('data-titre') || '').trim(); if (!entier) continue;
          const vu = (lbl.textContent || '').trim();
          const debord = lbl.scrollWidth > lbl.clientWidth + 1;
          if (!debord && !/…$/.test(vu) && vu.length >= entier.length) continue;
          const manque = Math.max(0, largeur(lbl, entier) - L.width);
          const R = c.getBoundingClientRect();
          const sec = c.closest('section[data-rangee]'); const S = sec ? sec.getBoundingClientRect() : { right: innerWidth };
          const voisins = choses.filter(x => x.e !== c && !c.contains(x.e) && !x.e.contains(c) && x.R.top < R.bottom - 2 && x.R.bottom > R.top + 2 && x.R.left >= L.right - 1).map(x => x.R.left);
          const limite = Math.min(S.right, innerWidth, ...voisins);
          const place = limite - L.right;
          if (manque > 0 && place >= manque + 4) out.push(`« ${vu} » (${Math.round(manque)} px manquent, ${Math.round(place)} libres)`);
        }
        return out;
      });
      coupes.push([`${w}`, c]);
      await q.close();
    }
    note('NOMS-COUPES', coupes.every(([, c]) => c.length === 0), coupes.map(([o, c]) => `${o} : ${c.length}${c.length ? ` (${c.slice(0, 3).join(' ; ')})` : ''}`).join(' ; '));

    /* LIE-DANS-ECRAN (n° 15, E37) : chaque pastille « lié à » est dans l'écran, porte un nom lisible et n'est pas coupée ; 390 en 6 sem. et en
       3 mois, 1280 */
    const lies = [];
    for (const [o, w, h, v, trois] of [['390', 390, 844, ecran(390, 844), false], ['390 3 mois', 390, 844, ecran(390, 844), true], ['1280', 1280, 800, bureau(1280, 800), false]]) {
      q = await page(w, h, v);
      if (trois) {
        await q.click('[data-ent-periode]'); await attendre(300);
        await q.evaluate(() => { const d = document.querySelector('[role="dialog"][aria-label="Période et vue"]'); [...d.querySelectorAll('button')].find(b => /^3 mois/.test((b.textContent || '').trim()))?.click(); });
        await attendre(700);
      }
      const l = await q.evaluate(src => [...document.querySelectorAll('[data-lie]')].map(e => {
        const r = e.getBoundingClientRect();
        if (r.width < 1) return null;
        const t = (e.textContent || '').replace(/\s+/g, ' ').trim();
        const dehors = r.left < -0.5 || r.right > innerWidth + 0.5;
        const coupe = [e, ...e.querySelectorAll('*')].some(x => x.scrollWidth > x.clientWidth + 1 && /hidden|clip/.test(getComputedStyle(x).overflowX));
        const sansNom = new RegExp(src).test(t) || !/\p{L}{3,}/u.test(t.replace(/^lié( à)?/, ''));
        return { t: t.slice(0, 30), ok: !dehors && !coupe && !sansNom, dit: `${dehors ? 'hors écran ' : ''}${coupe ? 'coupée ' : ''}${sansNom ? 'sans nom' : ''}`.trim() };
      }).filter(Boolean), RE.lieSansNom.source);
      lies.push([o, l]);
      await q.close();
    }
    note('LIE-DANS-ECRAN', lies.every(([, l]) => l.length > 0 && l.every(x => x.ok)), lies.map(([o, l]) => `${o} : ${l.length} pastille(s)${l.filter(x => !x.ok).length ? ` dont ${l.filter(x => !x.ok).map(x => `« ${x.t} » ${x.dit}`).slice(0, 3).join(', ')}` : ', toutes lisibles'}`).join(' ; '));

    /* COURBE-PAYS (n° 11, E02, D-183) : en 844 × 390, la courbe garde au moins 70 px et l'en-tête 120 px au plus */
    q = await page(844, 390);
    const cp = await q.evaluate(() => {
      const zone = document.querySelector('[data-entete-zone]');
      const svg = [...document.querySelectorAll('[data-calendrier-entete] svg')].map(s => s.getBoundingClientRect()).filter(r => r.width > 150);
      return { courbe: Math.max(0, ...svg.map(r => Math.round(r.height))), tete: zone ? Math.round(zone.getBoundingClientRect().height) : 0 };
    });
    note('COURBE-PAYS', cp.courbe >= 70 && cp.tete > 0 && cp.tete <= 120, `courbe ${cp.courbe} px (min 70), en-tête ${cp.tete} px (max 120)`);
    await q.close();

    /* BANC-FEUILLE (n° 13 c, E33) : « Budget › » au banc ouvre une feuille en bas, marquée « banc », fermée par × (44 px) ; aucune ligne du banc
       sur l'en-tête ; le renvoi de Retirer (« dans Finances › ») n'est jamais visible en même temps que le bandeau Annuler */
    const lireBanc = q2 => q2.evaluate((srcL, srcB, srcF) => {
      const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 1 && r.height > 1 && s.visibility !== 'hidden' && s.display !== 'none'; };
      const zone = document.querySelector('[data-entete-zone]'); const Z = zone && vis(zone) ? zone.getBoundingClientRect() : null;
      const coupe = (A, B) => A.left < B.right - 1 && A.right > B.left + 1 && A.top < B.bottom - 1 && A.bottom > B.top + 1;
      const lignes = [...document.querySelectorAll('body *')].filter(e => vis(e) && [...e.childNodes].some(n => n.nodeType === 3 && new RegExp(srcL).test(n.textContent.trim())));
      const surTete = lignes.filter(e => Z && coupe(e.getBoundingClientRect(), Z)).length;
      const d = [...document.querySelectorAll('[role="dialog"], dialog')].filter(vis).find(x => new RegExp(srcB).test(x.textContent || ''));
      const D = d ? d.getBoundingClientRect() : null;
      const x = d ? [...d.querySelectorAll('button')].find(b => new RegExp(srcF).test(b.getAttribute('aria-label') || b.textContent.trim())) : null;
      const X = x ? x.getBoundingClientRect() : null;
      const annuler = [...document.querySelectorAll('button')].filter(vis).some(b => /^Annuler$/.test((b.textContent || '').trim()) && !(d && d.contains(b)));
      return { lignes: lignes.length, surTete, feuille: !!d, enBas: !!D && D.bottom >= innerHeight - 2 && D.top > innerHeight * 0.2, texte: d ? (d.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 70) : '',
        x: X ? { cx: X.left + X.width / 2, cy: X.top + X.height / 2, w: Math.round(X.width), h: Math.round(X.height) } : null, annuler };
    }, RE.bancLigne.source, RE.bancFeuille.source, RE.fermer.source);
    const bf = [];
    q = await page(390, 844);
    if (await amenerBarre(q, 'Blonde d’automne')) {
      await attendre(300);
      const b = await lireBarre(q, 'Blonde d’automne');
      await toucherXY(q, b.x, b.y);
      const lien = await q.evaluate(src => { const e = [...document.querySelectorAll('button')].find(x => new RegExp(src).test((x.textContent || '').trim())); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, RE.budgetLien.source);
      if (lien) {
        await attendre(250); await toucherXY(q, lien.x, lien.y); await attendre(400);
        const s = await lireBanc(q);
        let ferme = false;
        if (s.x) { await toucherXY(q, s.x.cx, s.x.cy); await attendre(400); ferme = !(await lireBanc(q)).feuille; }
        /* le × est celui de la vraie feuille de l'app (`Sheet`) : sa taille est dite, pas jugée ici */
        bf.push(['Budget ›', s.feuille && s.enBas && s.surTete === 0 && !!s.x && ferme,
          `feuille ${s.feuille ? `« ${s.texte} »` : 'absente'}, en bas ${s.enBas}, ${s.surTete} ligne(s) du banc sur l’en-tête, × ${s.x ? `${s.x.w} × ${s.x.h} px` : 'absent'}, fermée par × ${ferme}`]);
      } else bf.push(['Budget ›', false, 'lien « Budget › » absent du détail de la Blonde']);
    } else bf.push(['Budget ›', false, 'barre de la Blonde introuvable']);
    await q.close();
    q = await page(390, 844);
    if (await amenerBarre(q, 'Hotte')) {
      await attendre(300);
      const a = await lireBarre(q, 'Hotte');
      await appuiLongXY(q, a.x, a.y);
      const ret = await q.evaluate(src => { const m = document.querySelector('[role="menu"]'); const e = m && [...m.querySelectorAll('button, [role="menuitem"]')].find(x => new RegExp(src).test((x.textContent || '').trim())); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, RE.retirer.source);
      if (ret) {
        await toucherXY(q, ret.x, ret.y); await attendre(700);
        const lien = await q.evaluate(src => { const e = [...document.querySelectorAll('[role="status"] button, [role="status"] a, [role="alert"] button')].find(x => new RegExp(src).test((x.textContent || '').trim())); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, RE.financesLien.source);
        if (lien) {
          await toucherXY(q, lien.x, lien.y);
          let s = await lireBanc(q);
          for (let i = 0; i < 8 && !s.feuille; i++) { await attendre(250); s = await lireBanc(q); }
          bf.push(['Retirer › Finances', s.feuille && s.surTete === 0 && !s.annuler, `feuille ${s.feuille ? `« ${s.texte} »` : 'absente'}, ${s.surTete} ligne(s) sur l’en-tête, Annuler visible en même temps ${s.annuler}`]);
        } else bf.push(['Retirer › Finances', false, 'lien « … Finances › » absent du message de Retirer']);
      } else bf.push(['Retirer › Finances', false, 'Retirer absent du menu']);
    } else bf.push(['Retirer › Finances', false, 'barre Hotte introuvable']);
    await q.close();
    note('BANC-FEUILLE', bf.every(([, ok]) => ok), bf.map(([o, , d]) => `${o} : ${d}`).join(' ; '));
  } else await p.close();
} catch (e) {
  note('EXECUTION', false, String(e && e.message ? e.message : e));
} finally {
  await nav.close();
}
const ko = bilan.filter(b => !b.ok).length;
console.log(ko || !bilan.length ? 'CAL-APP ECHEC' : 'CAL-APP OK');
process.exit(ko || !bilan.length ? 1 : 0);
