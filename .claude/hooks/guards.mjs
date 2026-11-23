// Hooks Claude Code PRÉPARÉS pour la refonte houblons (#119, phase 4). Inactifs tant que
// docs/qualite/hooks-settings.json n'est pas fusionné dans .claude/settings.json, sur accord
// du brasseur. Chaque garde lit l'appel d'outil sur stdin (JSON) ; code 2 = appel bloqué,
// le message sur stderr est renvoyé à l'agent.
//
//   node .claude/hooks/guards.mjs issue-close    : gh issue close N → scripts/check-issue-closure.mjs N
//   node .claude/hooks/guards.mjs lost-feature   : un test qui affirme qu'une fonction n'est plus là
//                                                  exige « Accord du brasseur : » avec un lien ou un Cnnn
//   node .claude/hooks/guards.mjs big-commit     : git commit de plus de 80 fichiers indexés
//   node .claude/hooks/guards.mjs --selftest
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const MAX_FILES = 80;
const LOST = /no longer (mounted|shown|visible|rendered|available)|is no longer|has been removed|n['’]est plus (monté|affiché|visible|disponible)|a été retiré/i;
const CONSENT = /Accord du brasseur : (https:\/\/github\.com\/\S+#issuecomment-\d+|C\d{3})/;

export function decide(guard, input, env = {}) {
  const tool = input.tool_name, ti = input.tool_input || {};
  if (guard === 'issue-close' && tool === 'Bash') {
    const m = String(ti.command || '').match(/\bgh\s+issue\s+close\s+(\d+)|issues\/(\d+)\b[^\n]*state=closed/);
    if (!m) return null;
    const n = m[1] || m[2];
    const check = env.closure ?? ((num) => { try { execFileSync('node', ['scripts/check-issue-closure.mjs', num], { encoding: 'utf8', stdio: 'pipe' }); return null; } catch (e) { return String(e.stdout || e.message).trim(); } });
    const refused = check(n);
    return refused ? `Clôture de #${n} refusée par les garde-fous (docs/qualite/garde-fous.md) : ${refused}` : null;
  }
  if (guard === 'lost-feature' && /^(Edit|Write|MultiEdit)$/.test(tool)) {
    const file = String(ti.file_path || '').replace(/\\/g, '/');
    if (!/\/(scripts|tests)\//.test(file)) return null;
    const added = [ti.new_string, ti.content, ...(ti.edits || []).map((e) => e.new_string)].filter(Boolean).join('\n');
    if (!LOST.test(added)) return null;
    const whole = added + '\n' + (fs.existsSync(ti.file_path || '') ? fs.readFileSync(ti.file_path, 'utf8') : '');
    if (CONSENT.test(whole)) return null;
    return `Ce test affirme qu'une fonction n'est plus là (${added.match(LOST)[0]}). Une perte de fonction visible exige l'accord du brasseur : ajoute en commentaire « Accord du brasseur : <lien du commentaire GitHub ou Cnnn> », ou rends la fonction.`;
  }
  if (guard === 'big-commit' && tool === 'Bash') {
    if (!/\bgit\s+commit\b/.test(String(ti.command || ''))) return null;
    const count = env.staged ?? (() => { try { return execFileSync('git', ['diff', '--cached', '--name-only'], { encoding: 'utf8' }).split('\n').filter(Boolean).length; } catch { return 0; } })();
    return count > MAX_FILES ? `Commit de ${count} fichiers : trop gros pour une revue (cause A1, commit 4add7b51 de 289 fichiers). Découpe-le par geste ou par ticket.` : null;
  }
  return null;
}

if (process.argv[2] === '--selftest') {
  const cases = [
    ['issue-close bloque', 'issue-close', { tool_name: 'Bash', tool_input: { command: 'gh issue close 76 --reason completed' } }, { closure: () => 'CLOSURE REFUSED #76 : aucune citation' }, true],
    ['issue-close laisse passer', 'issue-close', { tool_name: 'Bash', tool_input: { command: 'gh issue close 76' } }, { closure: () => null }, false],
    ['issue-close ignore le reste', 'issue-close', { tool_name: 'Bash', tool_input: { command: 'gh issue view 76' } }, { closure: () => 'x' }, false],
    ['lost-feature bloque', 'lost-feature', { tool_name: 'Edit', tool_input: { file_path: 'C:/w/scripts/check-x.mjs', new_string: "assert.equal(x, null, 'The panel is no longer mounted')" } }, {}, true],
    ['lost-feature avec accord', 'lost-feature', { tool_name: 'Edit', tool_input: { file_path: 'C:/w/scripts/check-x.mjs', new_string: "// Accord du brasseur : C150\nassert.equal(x, null, 'The panel is no longer mounted')" } }, {}, false],
    ['lost-feature hors tests', 'lost-feature', { tool_name: 'Edit', tool_input: { file_path: 'C:/w/docs/a.md', new_string: 'is no longer mounted' } }, {}, false],
    ['big-commit bloque', 'big-commit', { tool_name: 'Bash', tool_input: { command: 'git commit -m x' } }, { staged: 289 }, true],
    ['big-commit laisse passer', 'big-commit', { tool_name: 'Bash', tool_input: { command: 'git commit -m x' } }, { staged: 20 }, false],
  ];
  let bad = 0;
  for (const [name, guard, input, env, block] of cases) if (!!decide(guard, input, env) !== block) { bad++; console.log('SELFTEST FAIL ' + name); }
  console.log(bad ? 'SELFTEST FAILED' : `HOOKS SELFTEST OK ${cases.length}`);
  process.exitCode = bad ? 1 : 0;
} else if (process.argv[2]) {
  let raw = '';
  process.stdin.on('data', (d) => { raw += d; });
  process.stdin.on('end', () => {
    let input = {};
    try { input = JSON.parse(raw || '{}'); } catch { process.exit(0); }
    const msg = decide(process.argv[2], input);
    if (msg) { process.stderr.write(msg + '\n'); process.exit(2); }
    process.exit(0);
  });
}
