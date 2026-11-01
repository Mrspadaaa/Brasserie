#!/usr/bin/env node
// Voie p8-port : la série Chrome de l'étape Malts/sucres (s1 portée dans l'app), l'app et la maquette côte à côte, puis les cinq contrôles du
// registre sur l'app servie (controle-choix.mjs --url). Mécanique : à confier à l'exécutant.
//
// Usage (le serveur tourne dans le dossier de travail, jamais dans Documents/Brasserie) :
//   node scripts/with_server.mjs --server "npm run dev -- --port 5615 --strictPort" --port 5615 --env VITE_HOP_V4=on --env VITE_FIREBASE_API_KEY=fake \
//     -- node work/missions/2026-10-31-ecran-fermentescibles/voies/p8-port/capturer-malts.mjs --sortie=<dossier des captures>
// Fixtures seulement : `?dev-local&etape=houblons&recette=vide&malts=<état>` pose la recette et le stock SIMULÉS de la maquette (apercuDev.ts) ;
// l'app ne reçoit que localhost et les polices Google (fichiers statiques). Aucune donnée réelle, aucun Gemini.
// Sortie : « MALTS OK » (code 0) ou « MALTS ECHEC n » et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const argv = process.argv.slice(2);
const valeur = (n) => argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const port = (process.env.WITH_SERVER_PORTS ?? '').split(',')[0];
const ADRESSE = (valeur('url') ?? `http://localhost:${port}`).replace(/\/$/, '');
if (/localhost:$/.test(ADRESSE)) { console.log('MALTS ECHEC 1\n  - pas de serveur : with_server.mjs ou --url='); process.exit(1); }
const SORTIE = path.resolve(valeur('sortie') ?? path.join(import.meta.dirname, 'captures'));
fs.mkdirSync(SORTIE, { recursive: true });
const MAQUETTE = pathToFileURL(path.join(RACINE, 'work/missions/2026-10-31-ecran-fermentescibles/v7/s1/etat.html')).href;
const GABARIT = '{adresse}/?dev-local&etape=houblons&recette=vide&malts=maquette';
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const MODES = [
  { id: 'souris390', l: 390, h: 844, tactile: false, echelle: 1 },
  { id: 'tactile390', l: 390, h: 844, tactile: true, echelle: 2 },
  { id: 'pc1280', l: 1280, h: 800, tactile: false, echelle: 1 },
];

const fautes = [];
const infos = [];
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const noter = (ok, texte) => { infos.push(`${ok ? 'OK   ' : 'ECHEC'} ${texte}`); if (!ok) fautes.push(texte); };
const local = (u) => ['http://localhost', 'http://127.0.0.1', 'ws://localhost', 'ws://127.0.0.1', 'data:', 'blob:', 'about:', 'file:',
  'https://fonts.googleapis.com', 'https://fonts.gstatic.com'].some((d) => u.startsWith(d));

async function ouvrir(navigateur, mode, cible, etat = '') {
  const p = await navigateur.newPage();
  await p.setViewport({ width: mode.l, height: mode.h, isMobile: mode.tactile, hasTouch: mode.tactile, deviceScaleFactor: mode.echelle });
  p.erreurs = [];
  p.on('pageerror', (e) => p.erreurs.push(e.message));
  await p.setRequestInterception(true);
  p.on('request', (r) => (local(r.url()) ? r.continue() : r.abort('blockedbyclient')));
  p.setDefaultNavigationTimeout(120000);
  if (cible === 'app') {
    await p.goto(`${ADRESSE}/?dev-local&etape=houblons&recette=vide&malts=${etat || 'maquette'}`);
    await p.waitForFunction((e) => document.body.dataset.apercu === (e || 'repos') && document.querySelector('[data-sel]') !== null, { timeout: 120000 }, etat);
  } else {
    await p.goto(MAQUETTE + (etat ? '#' + etat : ''));
    await p.waitForSelector('[data-sel]', { timeout: 30000 });
  }
  await p.evaluate(() => document.fonts.ready);
  await dormir(500);
  // Vite recharge la page quand une autre voie écrit dans le dépôt (work/**/etat.html, src/domain/…) : on le compte, et la scène se rejoue.
  p.rechargements = 0;
  p.on('load', () => { p.rechargements++; });
  return p;
}
const toucher = async (p, mode, h) => { if (mode.tactile) await h.tap(); else await h.click(); await dormir(300); };
const el = async (p, sel) => { const h = await p.$(sel); if (!h) throw new Error(`introuvable : ${sel}`); return h; };
async function photo(p, nom, etape, cible) {
  const f = path.join(SORTIE, `${nom}-${etape}-${cible}.png`);
  await p.screenshot({ path: f, fullPage: true });
  return f;
}

// Les défauts du verdict de la critique (VERDICT-port.md), vérifiés sur l'app : chaque fonction rend la liste de ce qui ne va pas.
const lire = (p, fn) => p.evaluate(fn);
const verifs = {
  // n° 1 et 5 : « Suivant — Houblons » au premier écran ; rien entre le plateau et le pied ; pas de bloc « Données de fiche à compléter ».
  pied: async (p) => {
    const m = await lire(p, () => {
      const s = [...document.querySelectorAll('button')].find((b) => /Suivant/.test(b.textContent));
      const bal = document.querySelector('[data-role="bal"]');
      return { bas: s ? s.getBoundingClientRect().bottom : null, h: innerHeight, balBas: bal ? bal.getBoundingClientRect().bottom : null,
        sousPlateau: bal && s ? Math.round(s.getBoundingClientRect().top - bal.getBoundingClientRect().bottom) : null, bloc: /Données de fiche à compléter/.test(document.body.innerText) };
    });
    const f = [];
    if (m.bas === null) f.push('pas de « Suivant » trouvé');
    else if (m.bas > m.h) f.push(`« Suivant — Houblons » a son bas à ${Math.round(m.bas)} px, sous ${m.h}`);
    if (m.sousPlateau !== null && m.sousPlateau > 60) f.push(`${m.sousPlateau} px entre le plateau et le pied`);
    if (m.bloc) f.push('le bloc « Données de fiche à compléter » est encore là');
    return f;
  },
  // n° 3 : le plateau est entier, « J14 » hors du « + » flottant.
  plateauEntier: async (p) => {
    const m = await lire(p, () => {
      const bal = document.querySelector('[data-role="bal"]');
      const fab = [...document.querySelectorAll('button')].find((b) => /Actions rapides/.test(b.getAttribute('aria-label') ?? ''));
      const j14 = [...document.querySelectorAll('[data-role="bal"] .fer-jl-lab')].find((e) => /J14/.test(e.textContent));
      const rc = (e) => (e ? e.getBoundingClientRect() : null);
      const a = rc(j14), b = rc(fab);
      const croise = a && b && a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
      return { bas: bal ? rc(bal).bottom : null, h: innerHeight, croise: !!croise, j14: !!j14 };
    });
    const f = [];
    if (m.bas === null || m.bas > m.h) f.push(`le bas du plateau est à ${Math.round(m.bas)} px, sous ${m.h}`);
    if (m.croise) f.push('« J14 » est sous le « + » flottant');
    return f;
  },
  // n° 2 : aucun contour de focus hors de la ligne choisie et du curseur touché.
  contours: async (p) => {
    const l = await lire(p, () => [...document.querySelectorAll('*')].filter((e) => {
      const s = getComputedStyle(e);
      return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0 && !e.matches('.fer-cur') && e.getBoundingClientRect().width > 0;
    }).map((e) => e.tagName + '.' + String(e.className).slice(0, 30)));
    return l.length ? [`contour(s) de focus : ${l.slice(0, 3).join(', ')}`] : [];
  },
  // n° 4 : la pastille EBC du bandeau est à la teinte de la bière (jamais noire).
  bandeau: async (p) => {
    const c = await lire(p, () => { const d = document.querySelector('.recipe-metrics .rounded-full'); return d ? getComputedStyle(d).backgroundColor : null; });
    const m = c && c.match(/\d+/g);
    if (!m) return ['pas de pastille au bandeau'];
    const [R, G, B] = m.map(Number);
    return R + G + B < 300 || !(R >= G && G >= B) ? [`pastille du bandeau ${c} : pas une teinte de bière`] : [];
  },
  // n° 6 : la pilule du moment du plateau est teintée (ébullition, fermentation).
  pilule: async (p) => {
    const c = await lire(p, () => { const b = document.querySelector('[data-role="bal"] .fer-bmo'); return b ? [b.dataset.m, getComputedStyle(b).color] : null; });
    if (!c) return ['pas de pilule de moment au plateau'];
    const [R, G, B] = c[1].match(/\d+/g).map(Number);
    return Math.max(R, G, B) - Math.min(R, G, B) < 30 ? [`pilule « ${c[0]} » grise (${c[1]})`] : [];
  },
  // n° 9 : la phrase du lactose, mot pour mot.
  lactose: async (p) => {
    const tx = await lire(p, () => document.querySelector('[data-role="alertes"]')?.textContent.trim());
    return tx === 'Lactose : non fermentescible, il remonte la densité finale.' ? [] : [`phrase du lactose : « ${tx} »`];
  },
  // n° 12 : à 390, des sacs entiers seulement (aucun coupé au bord, aucun sans place) ; à 1280, jusqu'à cinq.
  sacs: async (p, m) => {
    const s = await lire(p, () => {
      const r = document.querySelector('[data-role="puces"]').getBoundingClientRect();
      return [...document.querySelectorAll('[data-role="puces"] .fer-pu')].filter((e) => getComputedStyle(e).visibility !== 'hidden')
        .map((e) => { const b = e.getBoundingClientRect(); return { nom: e.dataset.nom, coupe: b.right > r.right + 0.5 || b.left < r.left - 0.5 || b.bottom > r.bottom + 0.5 }; });
    });
    const f = s.filter((x) => x.coupe).map((x) => `sac coupé : ${x.nom}`);
    if (m.l <= 400 && (s.length < 2 || s.length > 4)) f.push(`${s.length} sacs visibles à 390`);
    if (m.l > 400 && s.length !== 5) f.push(`${s.length} sacs visibles à 1280 (cinq attendus)`);
    return f;
  },
  // n° 14 : l'ouverture montre les tuiles, le champ a le focus, aucun épuisé ne passe avant un disponible.
  ouverture: async (p) => {
    const m = await lire(p, () => ({
      actif: document.activeElement?.dataset?.role ?? '',
      tuiles: [...document.querySelectorAll('[data-role="puces"] [data-role="resultat"]')].map((e) => ({ nom: e.dataset.nom, epuise: /stock épuisé/.test(e.textContent), dispo: /en stock/.test(e.textContent), etoile: !!e.querySelector('[aria-label="épinglé"]') })),
    }));
    const f = [];
    if (m.actif !== 'ajout') f.push(`le focus est sur « ${m.actif} », pas sur le champ d'ajout`);
    if (m.tuiles.length < 5) f.push(`${m.tuiles.length} tuiles à l'ouverture (cinq attendues)`);
    const derniereDispo = m.tuiles.map((t) => t.dispo).lastIndexOf(true), premierEpuise = m.tuiles.findIndex((t) => t.epuise);
    if (premierEpuise >= 0 && premierEpuise < derniereDispo) f.push('une tuile « stock épuisé » passe avant une tuile disponible');
    if (!m.tuiles.some((t) => t.nom === 'Pale Ale Malz' && t.etoile)) f.push('pas d\'étoile sur Pale Ale Malz');
    return f;
  },
  // n° 11 : après un ajout réel, la ligne ajoutée est entourée et le plateau la montre.
  ajoutReel: async (p, mode) => {
    const m = await lire(p, () => ({ bal: document.querySelector('[data-role="bal"]')?.textContent ?? '',
      cur: document.querySelector('[data-sel][aria-current="true"] [data-role="nom"]')?.textContent ?? '',
      n: document.querySelectorAll('[data-sel]').length, actif: document.activeElement?.dataset?.role ?? '' }));
    m.tactile = mode.tactile;
    const f = [];
    if (!/Münchner Malz/.test(m.bal)) f.push('le plateau ne montre pas Münchner Malz');
    if (m.cur !== 'Münchner Malz') f.push(`la ligne entourée est « ${m.cur} »`);
    if (m.n !== 4) f.push(`${m.n} lignes après l'ajout (4 attendues)`);
    // `versMasse` de s1 (D230) : au toucher comme à la souris, le focus va dans la masse de la ligne ajoutée.
    if (m.actif !== 'kg-ligne') f.push(`le focus est sur « ${m.actif} », pas sur la masse`);
    return f;
  },
};
const tous = (...l) => async (p, m) => (await Promise.all(l.map((v) => v(p, m)))).flat();

// Les gestes de la série, les mêmes sur l'app et sur la maquette (leurs data-role sont les mêmes).
const SCENES = [
  { etape: '01-repos', geste: async () => {}, verifier: tous(verifs.pied, verifs.contours, verifs.sacs) },
  { etape: '02-barre-tiree', geste: async (p, m) => {
    const b = await (await el(p, '[data-sel="0"] [data-role="masse-curseur"]')).boundingBox();
    const y = b.y + b.height / 2, x0 = b.x + b.width * 0.25, x1 = b.x + b.width * 0.55;
    if (m.tactile) { await p.touchscreen.touchStart(x0, y); for (let s = 1; s <= 6; s++) await p.touchscreen.touchMove(x0 + ((x1 - x0) * s) / 6, y); }
    else { await p.mouse.move(x0, y); await p.mouse.down(); await p.mouse.move(x1, y, { steps: 6 }); }
    await dormir(300);
    p.fin = async () => { if (m.tactile) await p.touchscreen.touchEnd(); else await p.mouse.up(); };
  }, verifierApresFin: verifs.contours },
  { etape: '03-moment', geste: async (p, m) => { await toucher(p, m, await el(p, '[data-sel="1"] [data-role="moment-ligne"]')); } },
  { etape: '04-ouverture', geste: async (p, m) => {
    await toucher(p, m, await el(p, '[data-role="ajout"]'));
    // Au toucher, le focus peut arriver après le toucher (machine chargée) : on attend les tuiles, app et maquette.
    await p.waitForSelector('.fer-tu, .p7s1-tu', { timeout: 8000 }).catch(() => {});
    await dormir(300);
  }, verifier: verifs.ouverture },
  ...[['05-mu', 'mu'], ['06-munich', 'Munich'], ['07-pils', 'pils'], ['08-abbey-malt', 'Abbey Malt'], ['09-cara-0-3', 'cara 0,3']].map(([etape, texte]) => ({
    etape, geste: async (p, m) => { await toucher(p, m, await el(p, '[data-role="ajout"]')); await p.keyboard.type(texte, { delay: 15 }); await dormir(300); },
  })),
  { etape: '10-sucre', etat: 'sucre', geste: async (p, m) => { await toucher(p, m, await el(p, '[data-sel="3"] [data-role="nom"]')); }, verifier: tous(verifs.pied, verifs.plateauEntier, verifs.bandeau, verifs.pilule) },
  { etape: '11-fruit-j3', etat: 'fruit', geste: async (p, m) => { await toucher(p, m, await el(p, '[data-sel="3"] [data-role="nom"]')); }, verifier: tous(verifs.plateauEntier, verifs.pilule, verifs.pied) },
  { etape: '12-retrait', geste: async (p, m) => { await toucher(p, m, await el(p, '[data-sel="1"] [data-role="retirer"]')); } },
  { etape: '13-retrait-annule', geste: async (p, m) => {
    await toucher(p, m, await el(p, '[data-sel="1"] [data-role="retirer"]'));
    await toucher(p, m, await el(p, '[data-role="annuler"]'));
  } },
  { etape: '14-huit-grains', etat: 'huit', geste: async () => {}, verifier: tous(verifs.lactose, verifs.contours) },
  { etape: '15-ajout-reel', geste: async (p, m) => {
    await toucher(p, m, await el(p, '[data-role="ajout"]')); await p.keyboard.type('Munich', { delay: 15 }); await p.keyboard.press('Enter'); await dormir(500);
  }, verifier: verifs.ajoutReel },
  { etape: '16-plus-moins', geste: async (p, m) => {
    for (let k = 0; k < 3; k++) await toucher(p, m, await el(p, '[data-role="bal"] [aria-label="Ajouter un cran"]'));
    await toucher(p, m, await el(p, '[data-role="bal"] [aria-label="Retirer un cran"]'));
    await dormir(300);
  } },
  { etape: '17-fiche-ouverte', geste: async (p, m) => {
    // La fiche technique n'existe que dans l'app : la maquette reste au repos (planche de comparaison à droite).
    if (p.url().startsWith('file:')) return;
    await toucher(p, m, await el(p, '[data-role="fiche"]'));
  }, verifier: async (p, m) => {
    const x = await lire(p, () => ({ masse: document.querySelector('[data-role="bal"] [data-role="bin"]')?.value ?? null,
      bandeau: document.querySelector('.recipe-metrics')?.textContent.replace(/\s+/g, ' ').trim() ?? null,
      motsFiche: document.querySelector('[data-role="fiche-zone"]')?.innerText.split(/\s+/).filter(Boolean).length ?? null,
      motsPage: document.body.innerText.split(/\s+/).length }));
    console.log(`${m.id} 17-fiche-ouverte : masse ${x.masse} · bandeau « ${x.bandeau} » · mots fiche-zone ${x.motsFiche} · mots page ${x.motsPage}`);
    // n° 17 : la zone de la fiche fait 12 mots au plus ; le pied est dans l'écran ; le bouton de l'assistant est entier et hors du « + » flottant.
    const g = await lire(p, () => {
      const rc = (e) => (e ? e.getBoundingClientRect() : null);
      const pied = [...document.querySelectorAll('button')].find((b) => /^Suivant/.test(b.textContent));
      const ia = [...document.querySelectorAll('[data-role="fiche-zone"] button')].find((b) => /Compléter avec l.IA/.test(b.textContent));
      const fab = [...document.querySelectorAll('button')].find((b) => /Actions rapides/.test(b.getAttribute('aria-label') ?? ''));
      const a = rc(ia), f = rc(fab);
      return { pied: pied ? rc(pied).bottom : null, h: innerHeight, ia: a && { haut: a.top, bas: a.bottom, gauche: a.left, droite: a.right }, w: innerWidth,
        couvert: !!(a && f && a.right > f.left && a.left < f.right && a.bottom > f.top && a.top < f.bottom),
        textes: document.body.innerText.includes('Ces valeurs sont publiées par le fabricant') };
    });
    const f = [];
    if (x.motsFiche === null || x.motsFiche > 12) f.push(`la zone de la fiche fait ${x.motsFiche} mots (12 au plus)`);
    if (g.textes) f.push('la phrase « Ces valeurs sont publiées par le fabricant » est encore là');
    if (g.pied === null || g.pied > g.h) f.push(`« Suivant — Houblons » a son bas à ${Math.round(g.pied)} px, sous ${g.h}`);
    if (!g.ia) f.push('le bouton de l\'assistant est absent');
    else if (g.ia.bas > g.h || g.ia.haut < 0 || g.ia.droite > g.w || g.ia.gauche < 0) f.push('le bouton de l\'assistant n\'est pas entier dans l\'écran');
    if (g.couvert) f.push('le « + » flottant couvre le bouton de l\'assistant');
    return f;
  } },
];

async function serie(navigateur, mode) {
  for (const s of SCENES) {
    const produits = {};
    for (const cible of ['app', 'maquette']) {
      for (let essai = 1; essai <= 3; essai++) {
        let p, rejouer = false;
        try {
          const delai = new Promise((_, no) => setTimeout(() => no(new Error('scène au-delà de 90 s')), 90000));
          await Promise.race([(async () => {
          p = await ouvrir(navigateur, mode, cible, s.etat ?? '');
          await s.geste(p, mode);
          produits[cible] = await photo(p, mode.id, s.etape, cible);
          if (p.fin) await p.fin();
          if (cible === 'app') {
            const v = [...(s.verifier ? await s.verifier(p, mode) : []), ...(s.verifierApresFin ? await s.verifierApresFin(p, mode) : [])];
            if (!(p.rechargements > 0 && essai < 3)) for (const x of v) noter(false, `${mode.id} ${s.etape} : ${x}`);
            if (!v.length && (s.verifier || s.verifierApresFin)) noter(true, `${mode.id} ${s.etape} : défauts du verdict vérifiés`);
          }
          })(), delai]);
          if (p.rechargements > 0 && essai < 3) rejouer = true;
          else if (cible === 'app' && p.erreurs.length) noter(false, `${mode.id} ${s.etape} : erreur de page (${p.erreurs[0].slice(0, 120)})`);
        } catch (e) {
          if (essai < 3) rejouer = true; else noter(false, `${mode.id} ${s.etape} ${cible} : ${String(e.message).split('\n')[0]}`);
        } finally { if (p) await p.close(); }
        if (!rejouer) break;
      }
    }
    if (produits.app && produits.maquette) {
      // La planche côte à côte : l'app à gauche, la maquette à droite.
      const q = await navigateur.newPage();
      const b64 = (f) => fs.readFileSync(f).toString('base64');
      await q.setViewport({ width: mode.l * 2 + 60, height: 900 });
      await q.setContent(`<body style="margin:0;background:#888;display:flex;gap:20px;padding:10px;align-items:flex-start;font:14px sans-serif">
        <div><b style="color:#fff">app</b><br><img style="width:${mode.l}px" src="data:image/png;base64,${b64(produits.app)}"></div>
        <div><b style="color:#fff">maquette</b><br><img style="width:${mode.l}px" src="data:image/png;base64,${b64(produits.maquette)}"></div></body>`);
      await q.screenshot({ path: path.join(SORTIE, `${mode.id}-${s.etape}-cote-a-cote.png`), fullPage: true });
      await q.close();
      noter(true, `${mode.id} ${s.etape} : app et maquette prises, côte à côte`);
    }
  }
}

// Les cinq contrôles du registre sur l'app servie (#161).
function registre() {
  return new Promise((resolve) => {
    const c = spawn(process.execPath, [path.join(RACINE, 'work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs'), `--url=${ADRESSE}`,
      '--registre=work/refonte-frontend/v4/choix/ecrans-app.json', '--ecran=fermentescibles', `--gabarit=${GABARIT}`], { cwd: RACINE });
    let sortie = '';
    c.stdout.on('data', (d) => { sortie += d; }); c.stderr.on('data', (d) => { sortie += d; });
    c.on('close', (code) => resolve({ code, sortie }));
  });
}

const navigateurs = await Promise.all(MODES.map(() => puppeteer.launch({ executablePath: CHROME, headless: true })));
const [, ctl] = await Promise.all([
  Promise.all(MODES.map((m, k) => serie(navigateurs[k], m))),
  registre(),
]);
await Promise.all(navigateurs.map((n) => n.close()));
const choix = ctl.sortie.trim().split('\n');
noter(ctl.code === 0 && /^CHOIX OK/m.test(ctl.sortie), `controle-choix.mjs --url (masse, moment, recherche, volée, gestes) : ${choix.slice(-3).join(' | ')}`);
const attendus = MODES.length * SCENES.length;
const planches = fs.readdirSync(SORTIE).filter((f) => f.endsWith('cote-a-cote.png') && MODES.some((m) => f.startsWith(m.id + '-')) && SCENES.some((s) => f.includes(s.etape))).length;
noter(planches >= attendus, `${planches} planches côte à côte sur ${attendus}`);
for (const l of infos) console.log(l);
if (fautes.length) { console.log(`MALTS ECHEC ${fautes.length}`); process.exit(1); }
console.log('CHOIX OK');
console.log('MALTS OK');
