#!/usr/bin/env node
// CHASSE CALENDRIER 21.11, voie V2 — « Barres, étiquettes, bulle d'étape » : CH-V8, CH-V10, CH-V15, CH-V18.
// Bloc distinct de chaines.mjs (id préfixé CH-<id>) : le pilote le fusionne. Fixture : scripts/parcours/fixtures/calendrier.mjs (simulée, jamais
// seedData.ts, aucun Gemini). 390×844 tactile (touchscreen.tap, rien n'est contourné) ; 1280 souris en option.
//
//   node scripts/parcours/chaines-v2.mjs <dossier-captures> [--build <dossier>] [--ref <tag>] [--etape V8,V10,V15,V18]
//                                         [--themes clair,cave] [--largeurs 390,1280] [--echelles 6s,3m,6m,an] [--caps]
//   --ref : construit ce tag dans une copie courte du dossier temporaire du système (chemins longs de Windows).
//   Sortie : « CHAINES V2 OK » (code 0) ou « CHAINES V2 ECHEC (n) » + la liste (code 1). --caps : une capture par échelle et par thème.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..', '..');
const { lancerBanc, sleep } = await import(pathToFileURL(path.join(ICI, 'chaines-outils.mjs')).href);
const { fixtureCalendrier } = await import(pathToFileURL(path.join(ICI, 'fixtures', 'calendrier.mjs')).href);
const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const sortie = path.resolve(args.find((a, i) => !a.startsWith('--') && !String(args[i - 1]).startsWith('--')) ?? path.join(os.tmpdir(), 'chaines-v2'));
fs.mkdirSync(sortie, { recursive: true });
const ETAPES = (opt('etape', 'V8,V10,V15,V18')).split(',');
const THEMES = opt('themes', 'clair,cave').split(',');
const LARGEURS = opt('largeurs', '390').split(',').map(Number);
const ECHELLES = opt('echelles', '6s,3m,6m,an').split(',');
const CAPS = args.includes('--caps');
const echecs = [];
const echec = (c, m) => { echecs.push(`${c} : ${m}`); console.log(`  KO  ${c} : ${m}`); };
const ok = (c, m) => console.log(`  ok  ${c}${m ? ` : ${m}` : ''}`);
const NOMS_ECHELLE = { '6s': null, '3m': '3 mois', '6m': '6 mois', an: 'An' };

// ───────────── le build ─────────────
function construire(racine, dehors) {
  const r = spawnSync('npx', ['vite', 'build', '--config', path.join(ICI, 'vite.parcours.config.mjs'), '--outDir', dehors, '--emptyOutDir', '--logLevel', 'error'],
    { cwd: racine, env: { ...process.env, PARCOURS_RACINE: racine }, encoding: 'utf8', shell: true, maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`build en échec (${racine}) : ${(r.stdout + r.stderr).slice(-600)}`);
}
let dossier = opt('build'); let copie = null; const aNettoyer = [];
if (!dossier) {
  dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'cv2-build-')); aNettoyer.push(dossier);
  let racine = RACINE;
  if (opt('ref')) {
    copie = path.join(os.tmpdir(), `cv2-${Date.now() % 100000}`);
    const g = spawnSync('git', ['worktree', 'add', '--detach', copie, opt('ref')], { cwd: RACINE, encoding: 'utf8' });
    if (g.status !== 0) throw new Error(`git worktree add : ${g.stderr.slice(-300)}`);
    fs.symlinkSync(path.join(RACINE, 'node_modules'), path.join(copie, 'node_modules'), 'junction');
    for (const n of fs.readdirSync(RACINE)) if (/^.env(..+)?$/.test(n) && !/example/.test(n)) fs.copyFileSync(path.join(RACINE, n), path.join(copie, n));
    fs.mkdirSync(path.join(copie, 'scripts', 'parcours', 'fixtures'), { recursive: true });
    for (const f of ['vite.parcours.config.mjs', path.join('fixtures', 'entree-app.mjs')]) fs.copyFileSync(path.join(ICI, f), path.join(copie, 'scripts', 'parcours', f));
    racine = copie;
  }
  construire(racine, dossier);
}

// ───────────── mesures dans la page ─────────────
/** Tout ce que les étapes lisent, d'un coup : barres (rectangle, nom écrit, rectangle du texte du nom), durées rognées, étiquettes de jalons. */
function lire() {
  const R = (e) => { const r = e.getBoundingClientRect(); return { x0: r.left, x1: r.right, y0: r.top, y1: r.bottom, w: r.width, h: r.height }; };
  const texteRect = (e) => {
    const rg = document.createRange(); rg.selectNodeContents(e);
    const rs = [...rg.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
    if (!rs.length) return null;
    return { x0: Math.min(...rs.map((r) => r.left)), x1: Math.max(...rs.map((r) => r.right)), y0: Math.min(...rs.map((r) => r.top)), y1: Math.max(...rs.map((r) => r.bottom)) };
  };
  const barres = [...document.querySelectorAll('.cal-barre')].map((b) => {
    const lbl = b.nextElementSibling?.classList.contains('cal-lbl') ? b.nextElementSibling : null;
    const nom = lbl?.querySelector('.cal-lbl-t');
    const cote = lbl ? (/cal-lbl-(gauche|droite|dedans)/.exec(lbl.className) ?? [])[1] ?? null : null;
    const dureeIn = [...b.querySelectorAll('.cal-duree')].map((d) => { const cs = getComputedStyle(d), rg = document.createRange(); rg.selectNodeContents(d); const tw = rg.getBoundingClientRect().width, bw = d.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); return { texte: d.textContent.trim(), rogne: d.scrollWidth > d.clientWidth + 1 || tw > bw + 0.5, tw: Math.round(tw), bw: Math.round(bw), cw: d.clientWidth, sw: d.scrollWidth }; });
    return { titre: b.getAttribute('data-titre'), id: b.getAttribute('data-chose-id'), rect: R(b), cote, nom: nom ? nom.textContent.trim() : null, nomRect: nom && getComputedStyle(lbl).visibility !== 'hidden' ? texteRect(nom) : null, dureeIn };
  });
  const jalons = [...document.querySelectorAll('.cal-marque')].map((m) => {
    const lbl = m.nextElementSibling?.classList.contains('cal-lbl') ? m.nextElementSibling : null;
    const cote = lbl ? (/cal-lbl-(gauche|droite|dedans)/.exec(lbl.className) ?? [])[1] ?? null : null;
    const nom = lbl?.querySelector('.cal-lbl-t');
    /* CHV-18 : la place à droite se mesure sur l'étiquette ENTIÈRE (nom, montant, pastille « lié à »), jusqu'au bord droit de la frise moins sa marge de
       8 px, et moins la zone du + volant quand la rangée passe à sa hauteur (Frise.tsx, mesurerSousFab) : le nom seul sous-estimait la place nécessaire. */
    const rang = m.closest('section[data-rangee]');
    const fab = [...document.querySelectorAll('button[aria-label]')].find((b) => /^Actions rapides/.test(b.getAttribute('aria-label') ?? ''));
    const f = fab ? fab.getBoundingClientRect() : null, z = rang ? rang.getBoundingClientRect() : null;
    const sous = !!(f && z && f.height && z.bottom > f.top - 4 && z.top < f.bottom + 4);
    const limite = z ? z.right - (sous ? Math.max(0, z.right - (f.left - 8)) : 0) : innerWidth;
    return { titre: m.getAttribute('data-titre') ?? m.getAttribute('aria-label'), rect: R(m), cote, nom: nom?.textContent.trim() ?? null, nomRect: nom ? texteRect(nom) : null, lblRect: lbl ? R(lbl) : null, limite };
  });
  return { barres, jalons, largeur: innerWidth };
}

/** Une page neuve : fixture calendrier, thème, taille ; le Calendrier ouvert, sur l'échelle voulue (par le menu de période, au doigt). */
async function pageCalendrier(banc, aujourdhui, { L, theme, echelle }) {
  const ctx = await banc.nav.createBrowserContext();
  const p = await ctx.newPage();
  const tactile = L < 600;
  await p.setViewport({ width: L, height: tactile ? 844 : 900, isMobile: tactile, hasTouch: tactile, deviceScaleFactor: 1 });
  await p.evaluateOnNewDocument((j, t) => { if (!localStorage.getItem('parcours-chaines:fixture')) { localStorage.setItem('parcours-chaines:fixture', j); localStorage.setItem('laffinee.theme', t); } },
    JSON.stringify(fixtureCalendrier(aujourdhui).entrees), theme);
  const erreurs = []; p.on('pageerror', (e) => erreurs.push(String(e).slice(0, 200)));
  const geste = async (x, y) => { if (tactile) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); await sleep(650); };
  const centre = (txt, { dans = 'button,[role=button],[role=menuitem],[role=option],[role=tab]', exact = true } = {}) => p.evaluate((t, d, ex) => {
    const n = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
    const e = [...document.querySelectorAll(d)].find((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (ex ? (n(e.getAttribute('aria-label')) === t || n(e.innerText) === t) : (n(e.getAttribute('aria-label')).includes(t) || n(e.innerText).includes(t))); });
    if (!e) return null; const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2];
  }, txt, dans, exact);
  const toucher = async (txt, o = {}) => { const c = await centre(txt, o); if (!c) throw new Error(`introuvable : « ${txt} »`); await geste(c[0], c[1]); };
  await p.goto(banc.url, { waitUntil: 'load' });
  await p.waitForSelector('nav button', { timeout: 90000 });
  await sleep(1200);
  await toucher('Calendrier', { dans: 'nav button' }); await sleep(1500);
  if (NOMS_ECHELLE[echelle]) {
    await toucher('période, liste, tri et filtre', { exact: false }); await sleep(500);
    await toucher(NOMS_ECHELLE[echelle]); await sleep(1100);
  }
  const cap = async (nom) => p.screenshot({ path: path.join(sortie, `${nom}.png`) });
  return { p, ctx, toucher, geste, centre, cap, lire: () => p.evaluate(lire), erreurs, fermer: () => ctx.close() };
}

// ───────────── les étapes ─────────────
const ecart = (a, b) => Math.max(0, a.x0 - b.x1, b.x0 - a.x1);
const recouvre = (a, b) => a.x0 < b.x1 - 0.5 && b.x0 < a.x1 - 0.5 && a.y0 < b.y1 - 0.5 && b.y0 < a.y1 - 0.5;

const ETAPE = {
  /** CHV-8 : une barre d'au moins 100 px a son nom à 24 px au plus d'elle (dedans, ou contre elle) ; jamais à 100 px sur la grille vide. */
  V8: {
    titre: 'le nom d\'une barre large (≥ 100 px) reste dans sa barre ou contre elle (≤ 24 px)',
    async joue(s, ctx) {
      const m = await s.lire();
      const pb = [];
      if (process.env.DUMP) for (const b of m.barres) console.log('   ', b.titre, Math.round(b.rect.x0), Math.round(b.rect.w), b.cote, JSON.stringify(b.nom), b.nomRect && [Math.round(b.nomRect.x0), Math.round(b.nomRect.x1)], JSON.stringify(b.dureeIn));
      for (const b of m.barres) {
        if (!b.nomRect || b.cote === "dedans") continue;
        const g = ecart(b.nomRect, b.rect);
        if (g > 24) pb.push(`« ${b.nom} » à ${Math.round(g)} px de sa barre (${Math.round(b.rect.w)} px, ${b.cote})`);
      }
      return pb;
    }
  },
  /** CHV-10 : aucune durée écrite DANS une barre n'est rognée par une ellipse quand le nom est écrit hors de la barre. */
  V10: {
    titre: 'une durée écrite dans une barre n\'est jamais rognée (« J0 / … ») quand le nom est dehors',
    async joue(s) {
      const m = await s.lire();
      const pb = [];
      for (const b of m.barres) for (const d of b.dureeIn) if (d.rogne && b.cote !== 'dedans') pb.push(`« ${b.titre} » : durée rognée « ${d.texte} », nom écrit dehors (${b.cote})`);
      return pb;
    }
  },
  /** CHV-18 : le côté d'un jalon est constant ; une étiquette qui passe à gauche doit avoir une raison (le bord de la fenêtre). */
  V18: {
    titre: 'les étiquettes de jalons se posent toutes du même côté, sauf au bord de la fenêtre',
    async joue(s) {
      const m = await s.lire();
      const pb = [];
      const L = m.largeur;
      for (const j of m.jalons) {
        if (!j.nomRect || j.cote !== 'gauche') continue;
        /* raison lisible : l'étiquette entière (nom, montant, pastille) ne tient pas à droite du picto avant le bord de la frise (ou du +) */
        const largeurLbl = j.lblRect ? j.lblRect.w : j.nomRect.x1 - j.nomRect.x0;
        /* 4 px de tolérance : la largeur estimée par Rangee.tsx (largeurEtiquette) dépasse de 1 à 3 px la largeur rendue ; à ce jeu près, la gauche est juste */
        if (j.rect.x1 + 8 + largeurLbl + 4 <= j.limite) pb.push(`« ${j.nom} » à gauche de son picto alors qu'il y a la place à droite`);
      }
      return pb;
    }
  }
};

// V15 : toucher le picto d'étape de « Ssr » ; la bulle ne recouvre le nom d'aucune autre barre.
async function joueV15(s) {
  const c = await s.p.evaluate(() => {
    const b = [...document.querySelectorAll('.cal-barre')].find((x) => x.getAttribute('data-titre') === 'Ssr');
    if (!b) return null;
    b.scrollIntoView({ block: 'center', inline: 'center' });
    const j = b.querySelector('.cal-jalon');
    if (!j) return { sans: true };
    const r = j.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  if (!c) return ['la barre « Ssr » est introuvable'];
  if (c.sans) return ['« Ssr » n\'a aucun picto d\'étape à toucher'];
  await sleep(300);
  await s.geste(c.x, c.y);
  const m = await s.p.evaluate(() => {
    const bulle = document.querySelector('.cal-point-bulle');
    if (!bulle) return null;
    const r = bulle.getBoundingClientRect();
    const noms = [...document.querySelectorAll('.cal-lbl-t')].filter((n) => getComputedStyle(n.closest('.cal-lbl')).visibility !== 'hidden').map((n) => {
      const rg = document.createRange(); rg.selectNodeContents(n); const q = [...rg.getClientRects()].filter((x) => x.width > 0 && x.height > 0);
      return q.length ? { t: n.textContent.trim(), x0: Math.min(...q.map((x) => x.left)), x1: Math.max(...q.map((x) => x.right)), y0: Math.min(...q.map((x) => x.top)), y1: Math.max(...q.map((x) => x.bottom)) } : null;
    }).filter(Boolean);
    const barres = [...document.querySelectorAll('.cal-barre')].map((b) => { const q = b.getBoundingClientRect(); return { t: b.getAttribute('data-titre'), x0: q.left, x1: q.right, y0: q.top, y1: q.bottom }; });
    return { bulle: { x0: r.left, x1: r.right, y0: r.top, y1: r.bottom, texte: bulle.textContent.trim() }, noms, barres };
  });
  if (!m) return ['aucune bulle d\'étape après le toucher du picto'];
  const pb = [];
  const sien = (t) => t.startsWith('Ssr');
  for (const n of m.noms) if (!sien(n.t) && recouvre(m.bulle, n)) pb.push(`la bulle « ${m.bulle.texte} » [${[m.bulle.x0, m.bulle.x1, m.bulle.y0, m.bulle.y1].map(Math.round)}] recouvre le nom « ${n.t} » [${[n.x0, n.x1, n.y0, n.y1].map(Math.round)}]`);
  /* ni une autre barre : la bulle ne se pose que sur la sienne ou sur la grille vide */
  for (const b of m.barres) if (!sien(b.t) && recouvre(m.bulle, b)) pb.push(`la bulle « ${m.bulle.texte} » recouvre la barre « ${b.t} »`);
  return pb;
}

// ───────────── le parcours ─────────────
const banc = await lancerBanc(path.resolve(dossier));
try {
  const aujourdhui = new Date().toISOString().slice(0, 10);
  for (const id of ETAPES) {
    const e = ETAPE[id] ?? { titre: 'la bulle d\'une étape ne recouvre le nom d\'aucune autre barre', joue: joueV15 };
    console.log(`CH-${id} — ${e.titre}`);
    for (const L of LARGEURS) for (const theme of THEMES) {
      const echelles = id === 'V15' ? ['6s'] : ECHELLES;
      for (const echelle of echelles) {
        const lieu = `${L}-${theme}-${echelle}`;
        let s;
        try {
          s = await pageCalendrier(banc, aujourdhui, { L, theme, echelle });
          const pb = await e.joue(s);
          if (CAPS || pb.length) await s.cap(`CH-${id}-${lieu}`);
          if (pb.length) echec(`CH-${id}`, `${lieu} : ${pb.join(' ; ')}`); else ok(`CH-${id}`, lieu);
        } catch (err) { echec(`CH-${id}`, `${lieu} : ${String(err.message ?? err).slice(0, 240)}`); }
        await s?.fermer().catch(() => {});
      }
    }
  }
} finally {
  await banc.fermer();
  if (copie) { spawnSync('git', ['worktree', 'remove', '--force', copie], { cwd: RACINE }); fs.rmSync(copie, { recursive: true, force: true }); spawnSync('git', ['worktree', 'prune'], { cwd: RACINE }); }
  for (const d of aNettoyer) fs.rmSync(d, { recursive: true, force: true });
}
if (echecs.length) { console.log(`CHAINES V2 ECHEC (${echecs.length})`); for (const e of echecs) console.log(`  - ${e}`); process.exit(1); }
console.log('CHAINES V2 OK');
