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
  actionsRapides: /^Actions rapides/
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
  ['actionsRapides', ['Actions rapides', 'Actions rapides : Calendrier'], ['Les actions rapides']]
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
    await p.evaluate(src => { const d = document.querySelector('[role="dialog"]'); [...d.querySelectorAll('button')].find(b => new RegExp(src).test((b.textContent || '').trim()))?.click(); }, RE.marcheNoelExact.source);
    await attendre(200);
    await p.evaluate(src => { const d = document.querySelector('[role="dialog"]'); [...d.querySelectorAll('button')].find(b => new RegExp(src).test((b.textContent || '').trim()))?.click(); }, RE.ajouter.source);
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
  } else await p.close();
} catch (e) {
  note('EXECUTION', false, String(e && e.message ? e.message : e));
} finally {
  await nav.close();
}
const ko = bilan.filter(b => !b.ok).length;
console.log(ko || !bilan.length ? 'CAL-APP ECHEC' : 'CAL-APP OK');
process.exit(ko || !bilan.length ? 1 : 0);
