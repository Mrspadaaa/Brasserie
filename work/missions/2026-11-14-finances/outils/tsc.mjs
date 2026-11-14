// Typage du projet : TSC OK ou TSC ECHEC et les premières erreurs.
import { execSync } from 'node:child_process';
try { execSync('npx tsc --noEmit', { stdio: 'pipe' }); console.log('TSC OK'); }
catch (e) { console.log('TSC ECHEC\n' + String(e.stdout).slice(0, 2000)); }
