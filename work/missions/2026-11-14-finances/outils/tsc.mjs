// Typage du projet : TSC OK ou TSC ECHEC et les premières erreurs. Les erreurs de functions/ (dépendances absentes du worktree) sont ignorées.
import { execSync } from 'node:child_process';
let out = '';
try { execSync('npx tsc --noEmit', { stdio: 'pipe' }); }
catch (e) { out = String(e.stdout); }
const err = out.split('\n').filter(l => /error TS/.test(l) && !/^functions[\/]/.test(l.trim()));
console.log(err.length ? 'TSC ECHEC\n' + err.slice(0, 20).join('\n') : 'TSC OK');
