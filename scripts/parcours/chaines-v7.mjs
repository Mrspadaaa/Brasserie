#!/usr/bin/env node
// CHASSE CALENDRIER 21.11, voie V7 — « Pastilles de rangée justes » : CH-D3, CH-D4, CH-D5, CH-V12 (CHV-18 : CH-V18 de chaines-v2.mjs).
// Bloc distinct de chaines.mjs (id préfixé CH-<id>) : le pilote le fusionne. Fixture : scripts/parcours/fixtures/calendrier.mjs (simulée, jamais
// seedData.ts, aucun Gemini). 390×844 tactile (touchscreen.tap, rien n'est contourné) ; 1280 souris en option.
//
//   node scripts/parcours/chaines-v7.mjs <dossier-captures> [--build <dossier>] [--ref <tag>] [--etape D3,D4,D5,V12]
//                                         [--themes clair,cave] [--largeurs 390,1280] [--caps]
//   --ref : construit ce tag dans une copie courte du dossier temporaire du système (chemins longs de Windows).
//   DUMP=1 : écrit chaque pastille lue (rangée, texte, mot, lecture). Sortie : « CHAINES V7 OK » (code 0) ou « CHAINES V7 ECHEC (n) » (code 1).
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
const sortie = path.resolve(args.find((a, i) => !a.startsWith('--') && !String(args[i - 1]).startsWith('--')) ?? path.join(os.tmpdir(), 'chaines-v7'));
fs.mkdirSync(sortie, { recursive: true });
const ETAPES = (opt('etape', 'D3,D4,D5,V12')).split(',');
const THEMES = opt('themes', 'clair,cave').split(',');
const LARGEURS = opt('largeurs', '390').split(',').map(Number);
const CAPS = args.includes('--caps');
const echecs = [];
const echec = (c, m) => { echecs.push(`${c} : ${m}`); console.log(`  KO  ${c} : ${m}`); };
const ok = (c, m) => console.log(`  ok  ${c}${m ? ` : ${m}` : ''}`);
const NOMS_ECHELLE = { '2s': '2 sem.', '6s': null, '3m': '3 mois', '6m': '6 mois', an: 'An' };

// ───────────── le build ─────────────
function construire(racine, dehors) {
  const r = spawnSync('npx', ['vite', 'build', '--config', path.join(ICI, 'vite.parcours.config.mjs'), '--outDir', dehors, '--emptyOutDir', '--logLevel', 'error'],
    { cwd: racine, env: { ...process.env, PARCOURS_RACINE: racine }, encoding: 'utf8', shell: true, maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`build en échec (${racine}) : ${(r.stdout + r.stderr).slice(-600)}`);
}
let dossier = opt('build'); let copie = null; const aNettoyer = [];
if (!dossier) {
  dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'cv7-build-')); aNettoyer.push(dossier);
  let racine = RACINE;
  if (opt('ref')) {
    copie = path.join(os.tmpdir(), `cv7-${Date.now() % 100000}`);
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
/** Les pastilles de rangée, d'un coup : texte du chiffre, mot posé à côté, lecture (aria-label), et si ce mot est rogné. */
function lire() {
  const pastilles = [...document.querySelectorAll('[data-pastille]')].map((el) => {
    const conf = el.querySelector('.cal-conf');
    const t = el.querySelector('.cal-pastille-t');
    const q = (e) => { if (!e) return null; const cs = getComputedStyle(e), rg = document.createRange(); rg.selectNodeContents(e); const tw = rg.getBoundingClientRect().width; return { w: e.clientWidth, sw: e.scrollWidth, tw: Math.round(tw), rogne: e.scrollWidth > e.clientWidth + 1 || tw > e.clientWidth + 0.5, vide: cs.display === 'none' }; };
    const r = el.getBoundingClientRect();
    return { rangee: el.getAttribute('data-pastille'), texte: t?.textContent.trim() ?? '', conf: conf?.textContent.trim() ?? '', lecture: el.getAttribute('aria-label') ?? '', mesureConf: q(conf), rect: { x0: r.left, x1: r.right, y0: r.top, y1: r.bottom }, largeur: innerWidth };
  });
  return { pastilles, largeur: innerWidth };
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
const de = (m, rangee) => m.pastilles.find((x) => x.rangee === rangee);
const dire = (x) => `« ${x.texte} » · « ${x.conf} »`;

const ETAPE = {
  /**
   * CHD-3 : la pastille Brassins compte les mouvements de la fenêtre, par date. 2 sem. (26.10–08.11) : aucun mouvement, donc ni « −90 » ni
   * « confirmé » ; 6 sem. : −183 (45 + 45 le 21.11, 24 le 25.11, 45 + 24 le 30.11), pas −228 (l'emballage de Ttt du 21.12 est hors fenêtre).
   */
  D3: {
    titre: 'Brassins : 2 sem. ni « −90 » ni « confirmé » ; 6 sem. « −183 » par date, pas « −228 »',
    echelles: ['2s', '6s'],
    async joue(s, { echelle }) {
      const m = await s.lire();
      const b = de(m, 'brassins');
      if (!b) return ['la pastille Brassins est introuvable'];
      if (process.env.DUMP) console.log('   ', echelle, dire(b), '|', b.lecture);
      const pb = [];
      if (echelle === '2s') {
        if (/90/.test(b.texte) || /90/.test(b.lecture)) pb.push(`2 sem. : Brassins dit ${dire(b)}, des mouvements qui tombent hors de la fenêtre (« ${b.lecture} »)`);
        if (/confirmé/.test(b.conf) || /confirmé/.test(b.lecture)) pb.push(`2 sem. : Brassins se dit « confirmé » sans mouvement dans la fenêtre : ${dire(b)}`);
      } else {
        if (!/183/.test(b.texte)) pb.push(`6 sem. : Brassins dit ${dire(b)}, attendu −183 (la somme des mouvements par date)`);
        if (/228/.test(b.texte)) pb.push('6 sem. : Brassins compte −228 (le budget entier des barres)');
      }
      return pb;
    }
  },
  /**
   * CHD-4 : le loyer (−400 par mois, plan récurrent) est dans la pastille Papiers. 6 sem. : −1 000 (loyer −400 + lol −600) ; An : le loyer
   * seul fait −4 800 (12 × 400), la pastille se lit « prévu ».
   */
  D4: {
    titre: 'Papiers compte le loyer : 6 sem. « −1 000 » ; An « −5 851 » (−1 051 d\'avant et −4 800 de loyer), dit « prévu »',
    echelles: ['6s', 'an'],
    async joue(s, { echelle }) {
      const m = await s.lire();
      const b = de(m, 'papiers');
      if (!b) return ['la pastille Papiers est introuvable'];
      if (process.env.DUMP) console.log('   ', echelle, dire(b), '|', b.lecture);
      const pb = [];
      const attendu = echelle === '6s' ? /1\D?000/ : /5\D?851/;
      if (!attendu.test(b.texte)) pb.push(`${echelle === '6s' ? '6 sem.' : 'An'} : Papiers dit ${dire(b)} sans le loyer (attendu ${echelle === '6s' ? '−1 000' : '−5 851'})`);
      if (!/prévu/.test(b.conf)) pb.push(`${echelle === '6s' ? '6 sem.' : 'An'} : Papiers ne se dit pas « prévu » (le loyer est une prévision) : ${dire(b)}`);
      return pb;
    }
  },
  /**
   * CHD-5 : « confirmé » = encaissé ou payé. 3 mois : Ventes (+27 encaissé, +1 200 à encaisser, des plans) et Achats (475 à payer, des plans) disent
   * « prévu », « à encaisser » ou « à payer », jamais « confirmé ». Contre-épreuve : en 6 sem., Ventes n'a que le +27 encaissé : « confirmé ».
   */
  D5: {
    titre: '3 mois : Ventes et Achats jamais « confirmé » (prévu, à encaisser, à payer) ; 6 sem. Ventes encaissée : « confirmé »',
    echelles: ['3m', '6s'],
    async joue(s, { echelle }) {
      const m = await s.lire();
      const pb = [];
      for (const r of ['ventes', 'achats']) {
        const b = de(m, r);
        if (!b) { pb.push(`la pastille ${r} est introuvable`); continue; }
        if (process.env.DUMP) console.log('   ', echelle, r, dire(b), '|', b.lecture);
        if (echelle === '3m') {
          if (/confirmé/.test(b.conf) || /confirmé/.test(b.lecture)) pb.push(`3 mois : ${r} se dit « confirmé » : ${dire(b)}`);
          if (!/prévu|à encaisser|à payer/.test(b.conf)) pb.push(`3 mois : ${r} ne dit ni « prévu », ni « à encaisser », ni « à payer » : ${dire(b)}`);
        } else if (r === 'ventes' && !/confirmé/.test(b.conf)) pb.push(`6 sem. : Ventes (le seul +27 encaissé) ne se dit pas « confirmé » : ${dire(b)}`);
      }
      return pb;
    }
  },
  /** CHV-12 : à 390, An et 6 mois, le mot posé à côté de chaque pastille (« prévu S44–S49 ») n'est jamais rogné ; la pastille « coût à venir » cède ou passe à la ligne. */
  V12: {
    titre: 'à 390, An et 6 mois : le mot de chaque pastille est entier (jamais « prévu oct.–o… »)',
    echelles: ['6s', '6m', 'an'],
    async joue(s, { echelle }) {
      const m = await s.lire();
      const pb = [];
      for (const b of m.pastilles) {
        if (process.env.DUMP) console.log('   ', echelle, b.rangee, dire(b), JSON.stringify(b.mesureConf));
        if (b.mesureConf && !b.mesureConf.vide && b.mesureConf.rogne) pb.push(`${echelle} : ${b.rangee} coupe « ${b.conf} » (${b.mesureConf.tw} px de texte dans ${b.mesureConf.w})`);
        if (b.rect.x1 > b.largeur + 0.5) pb.push(`${echelle} : la pastille ${b.rangee} dépasse l'écran (${Math.round(b.rect.x1)} > ${b.largeur})`);
      }
      return pb;
    }
  }
};

// ───────────── le parcours ─────────────
const banc = await lancerBanc(path.resolve(dossier));
try {
  const aujourdhui = new Date().toISOString().slice(0, 10);
  for (const id of ETAPES) {
    const e = ETAPE[id];
    if (!e) { echec(`CH-${id}`, 'étape inconnue'); continue; }
    console.log(`CH-${id} — ${e.titre}`);
    for (const L of LARGEURS) for (const theme of THEMES) {
      for (const echelle of e.echelles) {
        if (id === 'V12' && L >= 600) continue; // la plainte est à 390
        const lieu = `${L}-${theme}-${echelle}`;
        let s;
        try {
          s = await pageCalendrier(banc, aujourdhui, { L, theme, echelle });
          const pb = await e.joue(s, { echelle });
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
if (echecs.length) { console.log(`CHAINES V7 ECHEC (${echecs.length})`); for (const e of echecs) console.log(`  - ${e}`); process.exit(1); }
console.log('CHAINES V7 OK');
