#!/usr/bin/env node
// CHASSE CALENDRIER 21.11, voie V10 — « Courbe : étiquette, points, 2 semaines » : CH-D2, CH-V16, CH-V17.
// Bloc distinct de chaines.mjs (id préfixé CH-<id>) : le pilote le fusionne. Fixture : scripts/parcours/fixtures/calendrier.mjs (simulée, jamais
// seedData.ts, aucun Gemini). 390×844 tactile (touchscreen.tap, rien n'est contourné) ; 1280 souris en option.
//
//   node scripts/parcours/chaines-v10.mjs <dossier-captures> [--build <dossier>] [--ref <tag>] [--etape D2,V16,V17]
//                                          [--themes clair,cave] [--largeurs 390,1280] [--caps]
//   --ref : construit ce tag dans une copie du dossier temporaire du système. Sortie : « CHAINES V10 OK » (code 0) ou « CHAINES V10 ECHEC (n) » (code 1).
//   CH-D2  : 6 sem., S47 : l'étiquette « Emballage » de la courbe dit la somme des deux brassins Jhhh (−90), jamais −45.
//   CH-V16 : An aligné : aucun jeu de points gris n'est dessiné sans légende.
//   CH-V17 : 2 sem. : le trait du solde est à ≥ 4 px du bord du cadre, au moins une étiquette est lisible, le cadre n'est pas uniformément rose.
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
const sortie = path.resolve(args.find((a, i) => !a.startsWith('--') && !String(args[i - 1]).startsWith('--')) ?? path.join(os.tmpdir(), 'chaines-v10'));
fs.mkdirSync(sortie, { recursive: true });
const ETAPES = opt('etape', 'D2,V16,V17').split(',');
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
  dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'cv10-build-')); aNettoyer.push(dossier);
  let racine = RACINE;
  if (opt('ref')) {
    copie = path.join(os.tmpdir(), `cv10-${Date.now() % 100000}`);
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
/** La courbe (la petite de l'en-tête) : noms posés, tracé du solde, points, zones teintées, lus d'un coup. */
function lire() {
  const cb = document.querySelector('.ent-cbz .ent-cb') ?? document.querySelector('.ent-cb');
  if (!cb) return null;
  const svg = cb.querySelector('svg.ent-svg');
  const R = (e) => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom }; };
  const cadre = R(cb.querySelector('.ent-cadre') ?? svg); // le cadre de la fenêtre (bleu), pas le dessin entier
  const noms = [...cb.querySelectorAll('text[data-nom-courbe], text[data-niveau-courbe]')].filter((t) => !t.closest('.ent-nom-cache')).map((t) => ({
    texte: t.textContent.replace(/\s+/g, ' ').trim(), titre: t.parentElement.querySelector('title')?.textContent ?? ''
  }));
  const libre = cb.querySelector('.ent-libre');
  const caisse = cb.querySelector('.ent-caisse');
  // le tracé réellement dessiné : on échantillonne le chemin (marches comprises) en px d'écran
  const echantillon = (p) => {
    if (!p) return null; const m = p.getScreenCTM(), L = p.getTotalLength(); let t = Infinity, b = -Infinity;
    for (let k = 0; k <= L; k += 1) { const q = p.getPointAtLength(k), y = m.b * q.x + m.d * q.y + m.f; t = Math.min(t, y); b = Math.max(b, y); }
    return { t, b };
  };
  const pts = [...cb.querySelectorAll('circle.ent-pt')].map((c) => {
    const cs = getComputedStyle(c), r = c.getBoundingClientRect();
    return { dessine: cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0 && cs.fill !== 'none' && cs.fill !== 'transparent' && !/rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0\s*\)/.test(cs.fill) && r.width > 0 };
  });
  const legende = [...cb.querySelectorAll('text, title')].some((e) => /\bpoints?\b/i.test(e.textContent)) || !!document.querySelector('[data-legende-points]');
  return {
    cadre, nomsTexte: noms, libre: echantillon(libre), caisse: echantillon(caisse),
    pointsDessines: pts.filter((p) => p.dessine).length, pointsTotal: pts.length, legende,
    largeur: innerWidth
  };
}

/** Une page neuve : fixture calendrier, thème, taille ; le Calendrier ouvert, sur l'échelle voulue (par le menu de période, au doigt). */
async function pageCalendrier(banc, aujourdhui, { L, theme, echelle }) {
  const ctx = await banc.nav.createBrowserContext();
  const p = await ctx.newPage();
  const tactile = L < 600;
  await p.setViewport({ width: L, height: tactile ? 844 : 900, isMobile: tactile, hasTouch: tactile, deviceScaleFactor: 2 });
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
  const cap = async (nom) => { await p.screenshot({ path: path.join(sortie, `${nom}.png`) }); const el = await p.$('.ent-cbz'); if (el) await el.screenshot({ path: path.join(sortie, `${nom}-courbe.png`) }); };
  return { p, ctx, toucher, geste, centre, cap, lire: () => p.evaluate(lire), erreurs, fermer: () => ctx.close() };
}

// ───────────── les étapes ─────────────
const ETAPE = {
  D2: {
    titre: '6 sem., S47 : « Emballage » sur la courbe dit −90 (deux brassins Jhhh de −45), jamais −45 (CHD-2)',
    echelles: ['6s'],
    async joue(s) {
      const m = await s.lire(); if (!m) return ['la courbe est introuvable'];
      const emb = m.nomsTexte.filter((n) => /Emballage/i.test(n.texte));
      if (!emb.length) return [`aucune étiquette « Emballage » sur la courbe (noms : ${m.nomsTexte.map((n) => n.texte).join(' | ').slice(0, 200)})`];
      const pb = [];
      for (const n of emb) {
        if (/[−-]\s?45\b/.test(n.texte)) pb.push(`l'étiquette dit « ${n.texte} » : un seul des deux mouvements est nommé, la marche vaut −90`);
        else if (!/[−-]\s?90\b/.test(n.texte)) pb.push(`l'étiquette « ${n.texte} » ne dit pas −90`);
      }
      return pb;
    }
  },
  V16: {
    titre: 'An aligné : aucun jeu de points gris dessiné sans légende (CHV-16)',
    echelles: ['an'],
    async joue(s) {
      await s.toucher('Aligner la courbe sur la frise', { exact: true }); await sleep(900);
      const m = await s.lire(); if (!m) return ['la courbe est introuvable'];
      const pb = [];
      if (m.pointsDessines > 0 && !m.legende) pb.push(`${m.pointsDessines} cercles gris (ent-pt) dessinés sur ${m.pointsTotal}, sans légende ni nom`);
      return pb;
    }
  },
  V17: {
    titre: '2 sem. : le trait du solde à ≥ 4 px du bord, une étiquette lisible, cadre non tout rose (CHV-17)',
    echelles: ['2s'],
    async joue(s) {
      const m = await s.lire(); if (!m) return ['la courbe est introuvable'];
      const pb = [];
      const bas = m.cadre.b - (Math.max(m.libre?.b ?? -Infinity, m.caisse?.b ?? -Infinity) + 0.75); // 0,75 : la moitié du trait de 1,5 px
      const haut = Math.min(m.libre?.t ?? Infinity, m.caisse?.t ?? Infinity) - m.cadre.t;
      if (bas < 4) pb.push(`le trait du solde est à ${Math.round(bas * 10) / 10} px du bord bas du cadre (4 attendus)`);
      if (haut < 0) pb.push(`le trait du solde dépasse le bord haut du cadre (${Math.round(haut)} px)`);
      if (!m.nomsTexte.length) pb.push('aucune étiquette lisible sur la courbe');
      // « cadre non uniformément rose » : la part des pixels du cadre qui ont la couleur dominante (à 16 niveaux par canal près)
      const el = await s.p.$('.ent-cbz .ent-cadre') ?? await s.p.$('.ent-cadre');
      if (!el) pb.push('le cadre de la fenêtre est introuvable');
      else {
        const b64 = await el.screenshot({ encoding: 'base64' });
        const part = await s.p.evaluate(async (d) => {
          const img = new Image(); img.src = 'data:image/png;base64,' + d; await img.decode();
          const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
          const px = x.getImageData(Math.round(img.width * 0.04), Math.round(img.height * 0.04), Math.round(img.width * 0.92), Math.round(img.height * 0.92)).data; // l'intérieur : sans la bordure ni les poignées
          const h = new Map(); for (let i = 0; i < px.length; i += 4) { const k = (px[i] >> 4) * 256 + (px[i + 1] >> 4) * 16 + (px[i + 2] >> 4); h.set(k, (h.get(k) ?? 0) + 1); }
          return Math.max(...h.values()) / (px.length / 4);
        }, b64);
        if (part >= 0.9) pb.push(`le cadre est d'une seule couleur à ${Math.round(part * 100)} % (rien n'y est lisible)`);
        s.part = part;
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
        const lieu = `${L}-${theme}-${echelle}`;
        let s;
        try {
          s = await pageCalendrier(banc, aujourdhui, { L, theme, echelle });
          const pb = await e.joue(s, { echelle });
          if (CAPS || pb.length) await s.cap(`CH-${id}-${lieu}`);
          if (process.env.DUMP) console.log(JSON.stringify(await s.lire()).slice(0, 900), s.part !== undefined ? `part dominante ${Math.round(s.part * 100)} %` : '');
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
if (echecs.length) { console.log(`CHAINES V10 ECHEC (${echecs.length})`); for (const e of echecs) console.log(`  - ${e}`); process.exit(1); }
console.log('CHAINES V10 OK');
