// Contrôle du verdict de passe 2 (mission 2026-11-14-compagnon) : une ligne « pXx : ACCEPT|REJET » par candidate.
import { existsSync, readFileSync } from 'node:fs';
const p = 'work/missions/2026-11-14-compagnon/critique/VERDICT-P2.md';
const t = existsSync(p) ? readFileSync(p, 'utf8') : '';
const ech = [];
if (!t) ech.push('VERDICT-P2.md absent');
for (const id of ['p2a', 'p2b', 'p2c']) if (t && !new RegExp(`^\\W*${id}\\W*:\\W*(ACCEPT|REJET)`, 'm').test(t)) ech.push(`${id} : verdict absent`);
console.log(ech.length ? 'VERDICT ECHEC\n' + ech.join('\n') : 'VERDICT OK');
process.exit(ech.length ? 1 : 0);
