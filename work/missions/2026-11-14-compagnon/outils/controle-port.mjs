// Contrôle du port p2a du compagnon (mission 2026-11-14-compagnon), sur le worktree du port.
// Usage : node work/missions/2026-11-14-compagnon/outils/controle-port.mjs [noms|tsc|tests|build|tout]
// noms  : aucun nom de modèle ou de fournisseur d'IA rendu à l'écran par le compagnon (textes JSX et chaînes, hors commentaires),
//         aucun champ de modèle (`.model`, `reviewModel`) rendu dans le JSX.
// tsc   : npx tsc --noEmit sans erreur.
// tests : vitest sur les tests du compagnon (fichiers dont le nom contient brewer ou companion), tous verts.
// build : VITE_HOP_V4=on npx vite build sans erreur.
// Imprime PORT OK ou PORT ECHEC et le détail.
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const W = 'C:/Users/mrspa/AppData/Local/Temp/compagnon-p2a';
const quoi = process.argv[2] ?? 'tout';
const ech = [];
const run = (cmd, env = {}) => {
  try { return { ok: true, out: execSync(cmd, { cwd: W, env: { ...process.env, ...env }, stdio: 'pipe', maxBuffer: 64e6 }).toString() }; }
  catch (e) { return { ok: false, out: `${e.stdout ?? ''}${e.stderr ?? ''}` }; }
};
if (quoi === 'noms' || quoi === 'tout') {
  const fichiers = ['src/ui/BrewerChat.tsx', 'src/ui/BrewerProposalCard.tsx', 'src/ui/BrewerActivity.tsx', 'src/ui/BrewerBudget.tsx',
    'src/ui/BrewerNotifications.tsx', 'src/ui/finance/FinanceAssistant.tsx'];
  const dossier = join(W, 'src/ui/companion');
  if (existsSync(dossier)) for (const f of readdirSync(dossier)) if (/\.tsx?$/.test(f)) fichiers.push(`src/ui/companion/${f}`);
  for (const f of fichiers) {
    const p = join(W, f);
    if (!existsSync(p)) continue;
    const lignes = readFileSync(p, 'utf8').split('\n');
    lignes.forEach((l, i) => {
      const t = l.trim();
      if (/^(\/\/|\*|\/\*)/.test(t) || /^import\b/.test(t)) return;
      const sansCode = t.replace(/\/\/.*$/, '');
      if (/(['"`>]|\s)[^'"`<>{}]*\b(Gemini|Google|Hydrogen|Flash)\b[^'"`<>{}]*(['"`<]|$)/.test(sansCode) && !/(code|key|kind|id|type)\s*[=:]==?\s*['"]/.test(sansCode))
        ech.push(`${f}:${i + 1} nom de fournisseur ou de modèle : ${t.slice(0, 120)}`);
      if (/\{[^}]*\b(t|turn|record\.turn|e|job)\.(model|reviewModel)\b[^}]*\}/.test(sansCode) && /[>}]\s*$|<|\{[^}]*\.(model|reviewModel)\}\s*</.test(sansCode))
        ech.push(`${f}:${i + 1} modèle rendu : ${t.slice(0, 120)}`);
    });
  }
}
if (quoi === 'tsc' || quoi === 'tout') { const r = run('npx tsc --noEmit'); if (!r.ok) ech.push('tsc : ' + r.out.split('\n').filter((l) => /error TS/.test(l)).slice(0, 8).join('\n')); }
if (quoi === 'tests' || quoi === 'tout') {
  const r = run('npx vitest run brewer companion BrewerChat --reporter=dot');
  const ligne = r.out.split('\n').filter((l) => /Test Files|Tests /.test(l)).join(' | ');
  if (!r.ok || /failed/.test(ligne)) ech.push('tests : ' + (ligne || r.out.slice(-600)));
}
if (quoi === 'build' || quoi === 'tout') { const r = run('npx vite build', { VITE_HOP_V4: 'on' }); if (!r.ok) ech.push('build : ' + r.out.slice(-800)); }
console.log(ech.length ? 'PORT ECHEC\n' + ech.join('\n') : 'PORT OK');
process.exit(ech.length ? 1 : 0);
