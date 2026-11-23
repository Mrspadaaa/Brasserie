#!/usr/bin/env node
// PARCOURS MENU DU + (22.11, défaut PLUS-MENU-COUPE) — le menu du + joué AU DOIGT sur un BUILD, fixture « ZZ TEST » (jamais seedData.ts).
//   node scripts/parcours/menu-plus.mjs <dossier-captures> [--build <dossier>] [--ref <tag>] [--phase visible|actions|tout] [--theme clair|cave] [--onglets Calendrier,Stocks…]
//   VISIBLE  : à 390×660, 390×844 et 844×340 (tactile), chaque ligne du menu entière dans la zone visible, ou atteignable en défilant le menu ;
//              le menu ne sort pas de l'écran, le × (le + ouvert) reste libre et touchable.
//   ACTIONS  : chaque ligne ouvre SA vue et aboutit (voir `actions.mjs`-bloc plus bas) ; le tableau sort en JSON dans le dossier.
//   Sortie : « MENU-PLUS OK » ou « MENU-PLUS ECHEC (n) » + la liste (code 1).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..', '..');
const { lancerBanc, pageNeuve, sleep } = await import(pathToFileURL(path.join(ICI, 'chaines-outils.mjs')).href);
const { fixtureChaines } = await import(pathToFileURL(path.join(ICI, 'fixtures', 'chaines.mjs')).href);
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };
const sortie = path.resolve(args.find((a, i) => !a.startsWith('--') && !['--build', '--ref', '--phase', '--theme', '--onglets', '--tailles', '--ligne'].includes(args[i - 1])) ?? path.join(os.tmpdir(), 'parcours-menu-plus'));
fs.mkdirSync(sortie, { recursive: true });
const phase = opt('phase') ?? 'visible';
const themes = opt('theme') ? [opt('theme')] : ['clair'];
const ONGLETS = (opt('onglets') ?? 'Calendrier,Bord,Finances,Brassins,Stocks,Clients').split(',');
const TAILLES = { '390x660': [390, 660, true], '390x844': [390, 844, true], '844x340': [844, 340, true], '1280x800': [1280, 800, false] };
const tailles = (opt('tailles') ?? '390x660,390x844,844x340').split(',');
const echecs = [];
const echec = (c, m) => { echecs.push(`${c} : ${m}`); console.log(`  KO  ${c} : ${m}`); };
const ok = (c, m) => console.log(`  ok  ${c}${m ? ` : ${m}` : ''}`);

function construire(racine, dehors) {
  const r = spawnSync('npx', ['vite', 'build', '--config', path.join(ICI, 'vite.parcours.config.mjs'), '--outDir', dehors, '--emptyOutDir', '--logLevel', 'error'],
    { cwd: racine, env: { ...process.env, PARCOURS_RACINE: racine }, encoding: 'utf8', shell: true, maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`build en échec (${racine}) : ${(r.stdout + r.stderr).slice(-600)}`);
}
let dossierBuild = opt('build'); const aNettoyer = []; let copie = null;
try {
  if (!dossierBuild) {
    dossierBuild = fs.mkdtempSync(path.join(os.tmpdir(), 'menuplus-build-'));
    aNettoyer.push(dossierBuild);
    let racine = RACINE;
    if (opt('ref')) {
      copie = path.join(os.tmpdir(), `menuplus-copie-${Date.now()}`);
      const g = spawnSync('git', ['worktree', 'add', '--detach', copie, opt('ref')], { cwd: RACINE, encoding: 'utf8' });
      if (g.status !== 0) throw new Error(`git worktree add : ${g.stderr}`);
      fs.symlinkSync(path.join(RACINE, 'node_modules'), path.join(copie, 'node_modules'), 'junction');
      for (const n of fs.readdirSync(RACINE)) if (/^.env(..+)?$/.test(n) && !/example/.test(n)) fs.copyFileSync(path.join(RACINE, n), path.join(copie, n));
      fs.mkdirSync(path.join(copie, 'scripts', 'parcours', 'fixtures'), { recursive: true });
      for (const f of ['vite.parcours.config.mjs', path.join('fixtures', 'entree-app.mjs')]) fs.copyFileSync(path.join(ICI, f), path.join(copie, 'scripts', 'parcours', f));
      racine = copie;
    }
    console.log(`build ${opt('ref') ? `du tag ${opt('ref')}` : 'de l\'arbre de travail'} …`);
    construire(racine, dossierBuild);
  }
  await jouer(path.resolve(dossierBuild));
} catch (e) { echec('parcours', String(e.stack ?? e).slice(0, 700)); }
finally {
  if (copie) { spawnSync('git', ['worktree', 'remove', '--force', copie], { cwd: RACINE }); fs.rmSync(copie, { recursive: true, force: true }); spawnSync('git', ['worktree', 'prune'], { cwd: RACINE }); }
  for (const d of aNettoyer) { if (process.env.PARCOURS_GARDER) console.log(`build gardé : ${d}`); else fs.rmSync(d, { recursive: true, force: true }); }
}
if (echecs.length) { console.log(`MENU-PLUS ECHEC (${echecs.length})`); for (const e of echecs) console.log(`  - ${e}`); process.exit(1); }
console.log('MENU-PLUS OK');

/** La page, 390×660 etc., tactile ; le thème posé avant le premier rendu. */
async function ouvrirPage(banc, taille, theme, entrees, extra = {}) {
  const [w, h, tactile] = TAILLES[taille];
  const s = await pageNeuve(banc, entrees, sortie, extra);
  await s.p.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t); } catch { /* rien */ } }, theme);
  await s.p.setViewport({ width: w, height: h, isMobile: tactile, hasTouch: tactile, deviceScaleFactor: 1 });
  await s.demarrer();
  return s;
}

/** Mesure du menu ouvert : chaque ligne, défilée dans le menu si besoin, doit tenir entière dans l'écran ET dans la fenêtre du menu. */
function mesure(p) { return p.evaluate(() => {
  const menu = document.querySelector('[role=menu][aria-label="Actions rapides"]');
  if (!menu) return null;
  const W = innerWidth, H = innerHeight;
  const cs = getComputedStyle(menu);
  const defile = /(auto|scroll)/.test(cs.overflowY);
  const mr = menu.getBoundingClientRect();
  const lignes = [...menu.querySelectorAll('[role=menuitem]')];
  const nom = (e) => (e.getAttribute('data-page-action') ?? (e.getAttribute('aria-label') || e.innerText || '')).replace(/\s+/g, ' ').trim().slice(0, 40);
  const dedans = (r, c) => r.top >= c.top - 1 && r.bottom <= c.bottom + 1 && r.left >= c.left - 1 && r.right <= c.right + 1;
  const ecran = { top: 0, bottom: H, left: 0, right: W };
  const hors = [];
  const ligneAtteignable = (e) => {
    let r = e.getBoundingClientRect();
    if (dedans(r, ecran) && (!defile || dedans(r, mr))) return { vu: true, atteint: true };
    if (!defile) return { vu: false, atteint: false, y: [Math.round(r.top), Math.round(r.bottom)] };
    e.scrollIntoView({ block: 'nearest' }); r = e.getBoundingClientRect();
    return { vu: false, atteint: dedans(r, ecran) && dedans(r, mr), y: [Math.round(r.top), Math.round(r.bottom)] };
  };
  for (const e of lignes) { const a = ligneAtteignable(e); if (!a.atteint) hors.push(`${nom(e)} ${a.y ?? ''}`); }
  menu.scrollTop = 0;
  const croix = document.querySelector('button[aria-label^="Actions rapides"][aria-expanded="true"]');
  const cr = croix?.getBoundingClientRect();
  const sous = cr ? document.elementFromPoint(cr.x + cr.width / 2, cr.y + cr.height / 2) : null;
  const premiereVue = lignes.filter((e) => dedans(e.getBoundingClientRect(), ecran)).length;
  return {
    W, H, n: lignes.length, defile, scrollH: menu.scrollHeight, clientH: menu.clientHeight,
    menu: [Math.round(mr.top), Math.round(mr.bottom), Math.round(mr.left), Math.round(mr.right)],
    menuDansEcran: mr.top >= 0 && mr.bottom <= H && mr.left >= 0 && mr.right <= W,
    hors, premiereVue,
    croix: cr ? { dans: dedans(cr, ecran), libre: !!croix && (croix === sous || croix.contains(sous)), y: [Math.round(cr.top), Math.round(cr.bottom)] } : null,
    disposition: menu.getAttribute('data-plus-disposition')
  };
}); }

/** Un vrai geste du doigt sur le menu : il défile (si sa hauteur le demande). */
async function glisserMenu(s) {
  const c = await s.p.evaluate(() => { const m = document.querySelector('[role=menu][aria-label="Actions rapides"]'); const r = m.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, h: r.height, st: m.scrollTop }; });
  const cdp = await s.p.createCDPSession();
  const pt = (x, y) => [{ x: Math.round(x), y: Math.round(y), id: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(c.x, c.y - c.h / 4) });
  for (let k = 1; k <= 12; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(c.x, c.y - c.h / 4 + (c.h / 2) * (k / 12)) }); await sleep(16); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(500);
  const apres = await s.p.evaluate(() => document.querySelector('[role=menu][aria-label="Actions rapides"]').scrollTop);
  await cdp.detach();
  return { avant: c.st, apres };
}

async function jouer(dir) {
  const banc = await lancerBanc(dir);
  try {
    const aujourdhui = new Date().toISOString().slice(0, 10);
    const entrees = fixtureChaines(aujourdhui, { cuve: true, rayons: true }).entrees ?? fixtureChaines(aujourdhui, { cuve: true, rayons: true });
    if (phase === 'visible' || phase === 'tout') {
      for (const theme of themes) for (const taille of tailles) {
        const s = await ouvrirPage(banc, taille, theme, entrees);
        try {
          for (const onglet of ONGLETS) {
            const C = `VISIBLE ${onglet} ${taille} ${theme}`;
            try { await s.toucher(onglet, { dans: 'nav button', prefixe: true }); } catch (e) { echec(C, 'onglet introuvable'); continue; } await sleep(900);
            await s.toucher('Actions rapides', { dans: 'button[aria-label^="Actions rapides"]', prefixe: true });
            await sleep(600);
            const m = await mesure(s.p);
            if (!m) { echec(C, 'le menu ne s’ouvre pas'); continue; }
            await s.cap(`menu-${onglet.toLowerCase()}-${taille}-${theme}`);
            const pb = [];
            if (!m.menuDansEcran) pb.push(`le menu sort de l’écran (haut ${m.menu[0]}, bas ${m.menu[1]} sur ${m.H}, bord ${m.menu[2]}–${m.menu[3]} sur ${m.W})`);
            if (m.hors.length) pb.push(`${m.hors.length} ligne(s) hors d’atteinte : ${m.hors.slice(0, 4).join(' ; ')}`);
            if (!m.croix || !m.croix.dans || !m.croix.libre) pb.push(`× non atteignable (${JSON.stringify(m.croix)})`);
            if (m.defile && m.scrollH > m.clientH + 2) {
              const g = await glisserMenu(s);
              if (g.apres === g.avant) pb.push(`le doigt ne fait pas défiler le menu (scrollTop ${g.avant} → ${g.apres})`);
            }
            pb.length ? echec(C, pb.join(' | ')) : ok(C, `${m.n} lignes, ${m.premiereVue} vues d’emblée${m.defile && m.scrollH > m.clientH + 2 ? `, menu défilant (${m.clientH}/${m.scrollH})` : ''}${m.disposition ? `, ${m.disposition}` : ''}`);
            await s.p.keyboard.press('Escape'); await sleep(300);
          }
          // Le banc (chaines-outils.mjs l.39) lit localStorage sans garde dans le document initial opaque : à 1280 non tactile,
          // cela lève une SecurityError qui n'est pas celle de l'app. On l'écarte ; toute autre erreur reste un échec.
          const vraies = s.erreurs.filter((x) => !/Failed to read the 'localStorage' property/.test(x));
          if (vraies.length) echec(`VISIBLE ${taille} ${theme}`, `erreurs page : ${vraies.slice(0, 2).map((x) => x.slice(0, 400)).join(' | ')}`);
        } finally { await s.fermer(); }
      }
    }
    if (phase === 'actions' || phase === 'tout') {
      const { jouerActions } = await import(pathToFileURL(path.join(ICI, 'menu-plus-actions.mjs')).href);
      await jouerActions({ banc, ouvrirPage, sortie, entrees, echec, ok, sleep, themes, opt });
    }
  } finally { await banc.fermer(); }
}
