#!/usr/bin/env node
// PARCOURS CHAINES (21.11) — les chaînes qui cassaient (PRODUIRE, VENDRE, ACHETER, Calendrier) rejouées AU DOIGT, 390×844 tactile,
// sur la fixture « ZZ TEST » (scripts/parcours/fixtures/chaines.mjs ; jamais seedData.ts). Une étape par bug, une page neuve par étape.
//
//   node scripts/parcours/chaines.mjs <dossier-captures> [--build <dossier>] [--ref <tag>] [--etape B1[,B4…]]
//     sans option : construit l'arbre de travail (vite build, config de test) dans un dossier temporaire ;
//     --build     : réutilise un build déjà fait par cette config ;
//     --ref <tag> : construit ce tag dans une copie temporaire (git worktree dans os.tmpdir()) ; PARCOURS_GARDER=1 garde le build ;
//     --etape     : ne joue que ces étapes.
//   Sortie : « PARCOURS CHAINES OK » (code 0) ou « PARCOURS CHAINES ECHEC (n) » + la liste (code 1) ; captures dans le dossier.
// Un geste du doigt ne se contourne jamais : un champ qui ne se remplit pas au doigt est un bug à noter, pas à contourner.
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
const sortie = path.resolve(args.find((a, i) => !a.startsWith('--') && !['--build', '--ref', '--etape'].includes(args[i - 1])) ?? path.join(os.tmpdir(), 'parcours-chaines'));
fs.mkdirSync(sortie, { recursive: true });
const seules = opt('etape') ? opt('etape').split(',') : null;
const echecs = [];
const echec = (c, m) => { echecs.push(`${c} : ${m}`); console.log(`  KO  ${c} : ${m}`); };
const ok = (c, m) => console.log(`  ok  ${c}${m ? ` : ${m}` : ''}`);

// ───────────── le build ─────────────
function construire(racine, dehors) {
  const r = spawnSync('npx', ['vite', 'build', '--config', path.join(ICI, 'vite.parcours.config.mjs'), '--outDir', dehors, '--emptyOutDir', '--logLevel', 'error'],
    { cwd: racine, env: { ...process.env, PARCOURS_RACINE: racine }, encoding: 'utf8', shell: true, maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`build en échec (${racine}) : ${(r.stdout + r.stderr).slice(-600)}`);
}
let dossierBuild = opt('build'); const aNettoyer = []; let copie = null;
try {
  if (!dossierBuild) {
    dossierBuild = fs.mkdtempSync(path.join(os.tmpdir(), 'chaines-build-'));
    aNettoyer.push(dossierBuild);
    let racine = RACINE;
    if (opt('ref')) {
      copie = path.join(os.tmpdir(), `chaines-copie-${Date.now()}`);
      const g = spawnSync('git', ['worktree', 'add', '--detach', copie, opt('ref')], { cwd: RACINE, encoding: 'utf8' });
      if (g.status !== 0) throw new Error(`git worktree add : ${g.stderr}`);
      fs.symlinkSync(path.join(RACINE, 'node_modules'), path.join(copie, 'node_modules'), 'junction');
      for (const n of fs.readdirSync(RACINE)) if (/^.env(..+)?$/.test(n) && !/example/.test(n)) fs.copyFileSync(path.join(RACINE, n), path.join(copie, n));
      // le tag n'a pas le banc : on lui prête celui de l'arbre de travail (config Vite de test, point d'entrée de fixture)
      fs.mkdirSync(path.join(copie, 'scripts', 'parcours', 'fixtures'), { recursive: true });
      for (const f of ['vite.parcours.config.mjs', path.join('fixtures', 'entree-app.mjs')]) fs.copyFileSync(path.join(ICI, f), path.join(copie, 'scripts', 'parcours', f));
      racine = copie;
    }
    console.log(`build ${opt('ref') ? `du tag ${opt('ref')}` : 'de l\'arbre de travail'} …`);
    construire(racine, dossierBuild);
  }
  await jouer(path.resolve(dossierBuild));
} catch (e) { echec('parcours', String(e.message ?? e).slice(0, 500)); }
finally {
  if (copie) { spawnSync('git', ['worktree', 'remove', '--force', copie], { cwd: RACINE }); fs.rmSync(copie, { recursive: true, force: true }); spawnSync('git', ['worktree', 'prune'], { cwd: RACINE }); }
  for (const d of aNettoyer) { if (process.env.PARCOURS_GARDER) console.log(`build gardé : ${d}`); else fs.rmSync(d, { recursive: true, force: true }); }
}
if (echecs.length) { console.log(`PARCOURS CHAINES ECHEC (${echecs.length})`); for (const e of echecs) console.log(`  - ${e}`); process.exit(1); }
console.log('PARCOURS CHAINES OK');

// ───────────── gestes communs ─────────────
/** Recette neuve par l'assistant : « Actions rapides » → « Recette », nom, volume (si dit), malts du stock (Caramünch laissé tel quel si `caramel` est faux). */
async function recetteNeuve(s, { nom = 'ZZ TEST Brune', volume = null, caramel = true, pils = true } = {}) {
  await s.toucher('Actions rapides'); await s.toucher('Recette'); await sleep(800);
  await s.ecrire('textarea[name=recipe_title_label]', nom);
  if (volume != null) await s.ecrire('textarea[aria-label="Volume en fermenteur"]', String(volume));
  await s.toucher('Suivant', { prefixe: true }); await sleep(800);
  await s.toucher('ZZ TEST Caramünch', { contient: true }); await sleep(700);
  if (caramel) await s.ecrire('textarea[aria-label^="Masse de ZZ TEST Caramünch"]', '0.6');
  if (pils) { await s.toucher('ZZ TEST Malt pilsner', { contient: true }); await sleep(700); await s.ecrire('textarea[aria-label^="Masse de ZZ TEST Malt pilsner"]', '5'); }
}
/** De l'étape Malts à l'étape Levure (Houblons passé), puis la levure du catalogue (dose par défaut posée par l'application). */
async function leveureCatalogue(s) {
  await s.toucher('Suivant', { prefixe: true }); await sleep(700);
  await s.toucher('Suivant', { prefixe: true }); await sleep(800);
  await s.ecrire('textarea[placeholder="Chercher une levure"]', 'US-05'); await sleep(900);
  await s.toucher('SafAle US-05', { contient: true }); await sleep(900);
}
async function versRecap(s) { for (let i = 0; i < 3; i++) { await s.toucher('Suivant', { prefixe: true }); await sleep(750); } }

// ───────────── les étapes ─────────────
function listeEtapes() { return [
  {
    id: 'B1', titre: 'Recette neuve, brouillon repris → « Enregistrer et préparer » ouvre Brasser (WFR-1)',
    async joue(s) {
      await recetteNeuve(s, { volume: 24 });
      await leveureCatalogue(s);
      // le brasseur quitte l'application et revient : le brouillon est repris sur l'étape où il l'a laissé
      await s.p.goto(s.banc.url, { waitUntil: 'load' }); await sleep(2500);
      if (!(await s.attendre(/Brouillon repris sur cet appareil/, 15000))) return echec('B1', 'le brouillon n\'est pas repris');
      await versRecap(s);
      await s.cap('B1-1-recap');
      await s.toucher('Enregistrer et préparer un brassin'); await sleep(2500);
      await s.cap('B1-2-apres');
      const t = await s.texte(2500);
      if (/n’est pas figé|ne sont pas figées/.test(t)) return echec('B1', `refus « matériel pas figé » : ${t.match(/Le matériel[^.]*\.[^.]*\./)?.[0] ?? ''}`);
      if (/Avant de lancer/.test(t)) return echec('B1', `refus au lancement : ${t.match(/Avant de lancer[^F]{0,120}/)?.[0] ?? ''}`);
      if (!/Planifier/.test(t)) return echec('B1', `la feuille Brasser ne s'ouvre pas (écran : ${t.slice(0, 160)})`);
      ok('B1', 'la feuille Brasser s\'ouvre');
    }
  }
]; }

// ───────────── le parcours ─────────────
async function jouer(dir) {
  const banc = await lancerBanc(dir);
  try {
    const aujourdhui = new Date().toISOString().slice(0, 10);
    for (const e of listeEtapes()) {
      if (seules && !seules.includes(e.id)) continue;
      console.log(`${e.id} — ${e.titre}`);
      const s = await pageNeuve(banc, fixtureChaines(aujourdhui).entrees, sortie);
      s.banc = banc;
      try {
        await s.demarrer();
        await e.joue(s);
        const fatales = s.erreurs.filter((x) => /^(?!console)/.test(x) || /Uncaught|TypeError|ReferenceError/.test(x));
        if (fatales.length) echec(e.id, `erreur de page : ${fatales[0]}`);
      } catch (err) { await s.cap(`${e.id}-echec`).catch(() => {}); echec(e.id, String(err.message ?? err).slice(0, 300)); }
      await s.fermer().catch(() => {});
    }
  } finally { await banc.fermer(); }
}
