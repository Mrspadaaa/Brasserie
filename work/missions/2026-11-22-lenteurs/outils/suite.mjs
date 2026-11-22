// A/B alterné des gestes WF* (pas2.mjs, CPU ×4, fixture passe 2) puis profils sur un build non minifié de tour9.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const B = 'C:/Users/mrspa/AppData/Local/Temp/lenteurs-22-11-b';
const O = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-22-lenteurs/outils';
const fichiers = ['calendrier', 'vente', 'brassin', 'recherche', 'onglets'];
fs.mkdirSync(path.join(B, 'out/pas'), { recursive: true });
const jouer = (build, f, tag, extra = {}) => {
  const r = spawnSync('node', [path.join(O, 'pas2.mjs'), path.join(O, `pas/${f}.txt`), tag], { encoding: 'utf8', maxBuffer: 1 << 26, env: { ...process.env, BUILD: path.join(B, build), CPU: '4', OUT: path.join(B, 'out/pas'), ...extra } });
  fs.writeFileSync(path.join(B, `out/pas/${tag}.log`), r.stdout + r.stderr);
};
for (let i = 1; i <= 5; i++) {
  const ordre = i % 2 ? ['tour7', 'tour9'] : ['tour9', 'tour7'];
  for (const v of ordre) for (const f of fichiers) jouer(`build-${v}`, f, `${v}-${i}-${f}`);
  console.log('tour', i, 'fini');
}
// build non minifié de tour9 (noms de fonctions lisibles) puis profils
const racine = path.join(B, 'tour9');
const b = spawnSync('npx', ['vite', 'build', '--config', path.join(B, 'tour9/scripts/parcours/vite.parcours.config.mjs'), '--outDir', path.join(B, 'build-tour9-nm'), '--emptyOutDir', '--logLevel', 'error', '--configLoader', 'runner', '--minify', 'false'],
  { cwd: racine, env: { ...process.env, PARCOURS_RACINE: racine }, encoding: 'utf8', shell: true, maxBuffer: 1 << 26 });
console.log('build non minifié', b.status);
for (const f of ['calendrier', 'vente', 'brassin', 'recherche', 'onglets']) jouer('build-tour9-nm', f, `prof-${f}`, { PROFIL: '1' });
console.log('profils finis');
