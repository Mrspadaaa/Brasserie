#!/usr/bin/env node
// Prépare le BUILD DE TEST servi aux tests Playwright (webServer de playwright.config.ts), puis rend la main à `vite preview`.
//   node e2e/outils/preparer.mjs <dossier-de-sortie>
//   E2E_REF=<tag ou commit> : construit cette version dans une copie temporaire (git worktree dans os.tmpdir(), node_modules en jonction,
//                             .env recopiés), comme `scripts/parcours/calendrier.mjs --ref`. Un build d'un commit fixe est gardé (même hash).
//   Sans E2E_REF : l'arbre de travail, reconstruit à chaque lancement (jamais un build périmé).
// Même config que les bancs : scripts/parcours/vite.parcours.config.mjs (DEV vrai pour `?dev-local`, fixture du parcours branchée à la place
// de la démo ; rien dans src/, rien dans la livraison).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..', '..');
const CONFIG = path.join(RACINE, 'scripts', 'parcours', 'vite.parcours.config.mjs');
const sortie = path.resolve(process.argv[2] ?? path.join(os.tmpdir(), 'affinee-e2e', 'arbre'));
const ref = process.env.E2E_REF || null;

function construire(racine) {
  const debut = Date.now();
  const r = spawnSync('npx', ['vite', 'build', '--config', CONFIG, '--outDir', sortie, '--emptyOutDir', '--logLevel', 'error'],
    { cwd: racine, env: { ...process.env, PARCOURS_RACINE: racine }, encoding: 'utf8', shell: true, maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`build en échec (${racine}) : ${(r.stdout + r.stderr).slice(-800)}`);
  console.log(`[e2e] build ${ref ?? 'arbre de travail'} → ${sortie} (${Math.round((Date.now() - debut) / 1000)} s)`);
}

const marque = path.join(sortie, '.e2e-version');
if (!ref) construire(RACINE);
else {
  const hash = spawnSync('git', ['rev-parse', `${ref}^{commit}`], { cwd: RACINE, encoding: 'utf8' }).stdout.trim();
  if (!hash) throw new Error(`version inconnue : ${ref}`);
  if (fs.existsSync(marque) && fs.readFileSync(marque, 'utf8') === hash && fs.existsSync(path.join(sortie, 'index.html'))) {
    console.log(`[e2e] build de ${ref} (${hash.slice(0, 9)}) déjà prêt : ${sortie}`);
  } else {
    const copie = path.join(os.tmpdir(), `affinee-e2e-copie-${Date.now()}`);
    const g = spawnSync('git', ['worktree', 'add', '--detach', copie, hash], { cwd: RACINE, encoding: 'utf8' });
    if (g.status !== 0) throw new Error(`git worktree add : ${g.stderr}`);
    try {
      fs.symlinkSync(path.join(RACINE, 'node_modules'), path.join(copie, 'node_modules'), 'junction');
      // la configuration Firebase publique (VITE_FIREBASE_*) vit dans des .env non suivis : sans eux, l'application ne démarre pas
      for (const n of fs.readdirSync(RACINE)) if (/^\.env(\..+)?$/.test(n) && !/example/.test(n)) fs.copyFileSync(path.join(RACINE, n), path.join(copie, n));
      construire(copie);
      fs.writeFileSync(marque, hash);
    } finally {
      spawnSync('git', ['worktree', 'remove', '--force', copie], { cwd: RACINE });
      fs.rmSync(copie, { recursive: true, force: true });
      spawnSync('git', ['worktree', 'prune'], { cwd: RACINE });
    }
  }
}
