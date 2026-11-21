#!/usr/bin/env node
// CHASSE CALENDRIER 21.11, voie V11 — « Graduations et bande des semaines » : CH-V13, CH-V14 (CHV-19 : pris par une autre voie, sa propre étape CH-V19).
// Bloc distinct de chaines.mjs (id préfixé CH-<id>) : le pilote le fusionne. Fixture : scripts/parcours/fixtures/calendrier.mjs (simulée, jamais
// seedData.ts, aucun Gemini). 390×844 tactile (touchscreen.tap, rien n'est contourné) ; 1280 souris en option.
//
//   node scripts/parcours/chaines-v11.mjs <dossier-captures> [--build <dossier>] [--ref <tag>] [--etape V13,V14]
//                                          [--themes clair,cave] [--largeurs 390,1280] [--caps]
//   --ref : construit ce tag dans une copie du dossier temporaire du système. Sortie : « CHAINES V11 OK » (code 0) ou « CHAINES V11 ECHEC (n) » (code 1).
//   CH-V13 : 6 mois : les repères de la bande des semaines sont à pas régulier (colonnes) et passent le changement d'année (S53 et S1 comptés) ;
//            An : chaque janvier porte une marque d'année, lisible et dans sa colonne.
//   CH-V14 : S47 dépliée : la légende a un corps ≥ 12 px, tient dans sa case et n'en touche aucune voisine (S46, S48 : rectangles du texte).
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
const sortie = path.resolve(args.find((a, i) => !a.startsWith('--') && !String(args[i - 1]).startsWith('--')) ?? path.join(os.tmpdir(), 'chaines-v11'));
fs.mkdirSync(sortie, { recursive: true });
const ETAPES = opt('etape', 'V13,V14').split(',');
const THEMES = opt('themes', 'clair,cave').split(',');
const LARGEURS = opt('largeurs', '390').split(',').map(Number);
const CAPS = args.includes('--caps');
const echecs = [];
const echec = (c, m) => { echecs.push(`${c} : ${m}`); console.log(`  KO  ${c} : ${m}`); };
const ok = (c, m) => console.log(`  ok  ${c}${m ? ` : ${m}` : ''}`);
const NOMS_ECHELLE = { '2s': '2 sem.', '6s': null, '3m': '3 mois', '6m': '6 mois', an: 'An', aucune: null };

// ───────────── le build ─────────────
function construire(racine, dehors) {
  const r = spawnSync('npx', ['vite', 'build', '--config', path.join(ICI, 'vite.parcours.config.mjs'), '--outDir', dehors, '--emptyOutDir', '--logLevel', 'error'],
    { cwd: racine, env: { ...process.env, PARCOURS_RACINE: racine }, encoding: 'utf8', shell: true, maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`build en échec (${racine}) : ${(r.stdout + r.stderr).slice(-600)}`);
}
let dossier = opt('build'); let copie = null; const aNettoyer = [];
if (!dossier) {
  dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'cv11-build-')); aNettoyer.push(dossier);
  let racine = RACINE;
  if (opt('ref')) {
    copie = path.join(os.tmpdir(), `cv11-${Date.now() % 100000}`);
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
/** La bande des semaines : une entrée par colonne (numéro, lundi, texte posé) — pour le pas des repères. */
function lireSemaines() {
  const bande = document.querySelector('[data-bande-semaines]');
  if (!bande) return null;
  return { pas: bande.dataset.pas, cols: [...bande.querySelectorAll('.ent-bd-c')].map((c, k) => ({ k, n: Number(c.dataset.semaine), lundi: c.dataset.lundi, t: (c.querySelector('.ent-sem')?.textContent ?? '').trim() })) };
}
/** La bande de l'An : chaque mois, son texte lu et le rectangle réel de ses lettres dans sa case. */
function lireAn() {
  const bande = document.querySelector('[data-bande-annee]');
  if (!bande) return null;
  const rect = (el) => { const rg = document.createRange(); rg.selectNodeContents(el); const r = rg.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom }; };
  const br = bande.getBoundingClientRect();
  return { bande: { l: br.left, r: br.right }, mois: [...bande.querySelectorAll('.ent-an-m')].map((m) => {
    const l = m.querySelector('.ent-an-l'), a = m.querySelector('.ent-an-a');
    const c = m.getBoundingClientRect();
    return { mois: m.dataset.mois, texte: m.innerText.replace(/\s+/g, ' ').trim(), case: { l: c.left, r: c.right }, contenu: rect(m), lettre: l ? rect(l) : null, marque: a ? rect(a) : null, corps: a ? parseFloat(getComputedStyle(a).fontSize) : 0 };
  }) };
}
/** La semaine dépliée : sa légende (corps, rectangles réels du texte) et le texte de ses voisines. */
function lireDeplie() {
  const rep = document.querySelector('[data-replier]');
  if (!rep) return null;
  const rects = (el) => {
    const rg = document.createRange(); rg.selectNodeContents(el);
    return [...rg.getClientRects()].filter((r) => r.width > 0).map((r) => ({ l: r.left, r: r.right, t: r.top, b: r.bottom }));
  };
  const unir = (rs) => rs.length ? { l: Math.min(...rs.map((r) => r.l)), r: Math.max(...rs.map((r) => r.r)), t: Math.min(...rs.map((r) => r.t)), b: Math.max(...rs.map((r) => r.b)) } : null;
  const boite = rep.getBoundingClientRect();
  const visible = [...rep.childNodes].filter((n) => n.nodeType === 1 ? getComputedStyle(n).display !== 'none' : true);
  const corps = Math.min(...[rep, ...rep.querySelectorAll('small')].map((e) => parseFloat(getComputedStyle(e).fontSize)));
  const voisines = [...document.querySelectorAll('.ent-bj [data-semaine-bande]')].filter((b) => b !== rep).map((b) => ({ texte: b.innerText.trim(), rect: unir(rects(b)), boite: (() => { const r = b.getBoundingClientRect(); return { l: r.left, r: r.right }; })() }));
  return { texte: rep.innerText.replace(/\s+/g, ' ').trim(), legende: unir(rects(rep)), boite: { l: boite.left, r: boite.right }, corps, voisines, visibles: visible.length, bande: (() => { const b = document.querySelector('.ent-bj'); const r = b.getBoundingClientRect(); return { l: r.left, r: r.right, h: r.height }; })() };
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
    if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2];
  }, txt, dans, exact);
  const toucher = async (txt, o = {}) => { const c = await centre(txt, o); if (!c) throw new Error(`introuvable : « ${txt} »`); await sleep(150); const c2 = await centre(txt, o); await geste(c2[0], c2[1]); };
  await p.goto(banc.url, { waitUntil: 'load' });
  await p.waitForSelector('nav button', { timeout: 90000 });
  await sleep(1200);
  await toucher('Calendrier', { dans: 'nav button' }); await sleep(1500);
  if (NOMS_ECHELLE[echelle]) {
    await toucher('période, liste, tri et filtre', { exact: false }); await sleep(500);
    await toucher(NOMS_ECHELLE[echelle]); await sleep(1100);
  }
  const cap = async (nom) => { await p.screenshot({ path: path.join(sortie, `${nom}.png`) }); };
  return { p, ctx, toucher, geste, centre, cap, erreurs, fermer: () => ctx.close() };
}

// ───────────── les étapes ─────────────
const ETAPE = {
  V13: {
    titre: '6 mois : repères de la bande à pas régulier, année passée ; An : marque d\'année à chaque janvier (CHV-14 → CHV-13)',
    echelles: ['6m', 'an'],
    async joue(s, { echelle }) {
      const pb = [];
      if (echelle === '6m') {
        const b = await s.p.evaluate(lireSemaines); if (!b) return ['la bande des semaines est introuvable'];
        const lab = b.cols.filter((c) => c.t !== '');
        const ecarts = lab.slice(1).map((c, i) => c.k - lab[i].k);
        const jonction = b.cols.findIndex((c, i) => i > 0 && c.n < b.cols[i - 1].n); // S52/S53 → S1
        s.texte = `pas ${b.pas} : ${lab.map((c) => c.t).join(' ')} (écarts ${ecarts.join(',')})`;
        if (b.pas !== '1') {
          if (lab.length < 3) pb.push(`moins de trois repères (${s.texte})`);
          if (new Set(ecarts).size > 1) pb.push(`repères à pas irrégulier : ${s.texte}`);
          if (jonction >= 0 && !(lab.some((c) => c.k < jonction) && lab.some((c) => c.k >= jonction))) pb.push(`aucun repère de part et d'autre du changement d'année (${s.texte})`);
        }
        if (jonction < 0) pb.push('la fenêtre de 6 mois ne passe pas le changement d\'année : la fixture ne mesure rien');
      } else {
        const lu = await s.p.evaluate(lireAn); if (!lu?.mois.length) return ["la bande de l'An est introuvable"];
        const mois = lu.mois;
        const janv = mois.filter((m) => /-01$/.test(m.mois));
        s.texte = mois.map((m) => m.texte).join(' | ');
        if (!janv.length) pb.push("aucun janvier dans la bande de l'An : la fixture ne mesure rien");
        for (const m of janv) {
          if (!m.marque || !/^[’']?(?:20)?\d\d$/.test(m.texte.replace(/^J\s*/, ''))) { pb.push(`le janvier ${m.mois} ne porte aucune marque d'année (« ${m.texte} »)`); continue; }
          if (m.corps < 12) pb.push(`la marque d'année de ${m.mois} est écrite en ${m.corps} px (12 attendus)`);
          if (m.marque.l < lu.bande.l - 0.5 || m.marque.r > lu.bande.r + 0.5) pb.push(`la marque d'année de ${m.mois} sort de la bande`);
          for (const v of mois) if (v !== m && v.lettre && m.marque.l < v.lettre.r && v.lettre.l < m.marque.r) pb.push(`la marque d'année de ${m.mois} touche la lettre du mois ${v.mois}`);
        }
      }
      return pb;
    }
  },
  V14: {
    titre: 'S47 dépliée : la légende a un corps ≥ 12 px et ne touche ni S46 ni S48 (CHV-14)',
    echelles: ['6s'],
    async joue(s) {
      await s.toucher('S47', { dans: '.ent-bd-c, .ent-bj [data-semaine-bande]', exact: false }); await sleep(900);
      const d = await s.p.evaluate(lireDeplie); if (!d) return ['la semaine S47 ne se déplie pas (aucun [data-replier])'];
      s.texte = `« ${d.texte} » corps ${d.corps} px, ${d.legende ? Math.round(d.legende.r - d.legende.l) : '?'} px de texte dans ${Math.round(d.boite.r - d.boite.l)} px`;
      const pb = [];
      if (d.corps < 12) pb.push(`légende en ${d.corps} px (12 attendus : libellé compact, DESIGN.md) : ${s.texte}`);
      const l = d.legende;
      if (!l) pb.push('la légende n\'a aucun rectangle');
      else {
        for (const v of d.voisines) {
          if (!v.rect) continue;
          const touche = l.l < v.rect.r + 1 && v.rect.l < l.r + 1 && l.t < v.rect.b && v.rect.t < l.b;
          if (touche) pb.push(`la légende ${s.texte} touche « ${v.texte} » voisine`);
        }
        if (l.r > d.boite.r + 1 || l.l < d.boite.l - 1) pb.push(`la légende sort de sa case : ${s.texte}`);
        if (l.r > d.bande.r + 0.5) pb.push('la légende sort de la bande, à droite');
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
          if (pb.length) echec(`CH-${id}`, `${lieu} : ${pb.join(' ; ')}`); else ok(`CH-${id}`, `${lieu}${s.texte ? ` — ${s.texte}` : ''}`);
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
if (echecs.length) { console.log(`CHAINES V11 ECHEC (${echecs.length})`); for (const e of echecs) console.log(`  - ${e}`); process.exit(1); }
console.log('CHAINES V11 OK');
