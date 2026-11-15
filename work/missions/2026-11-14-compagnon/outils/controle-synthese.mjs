// Contrôle de la synthèse du tri (mission 2026-11-14-compagnon).
// Exige critique/SYNTHESE.md : les 12 ids classés, une ligne « Candidates : a, b, c » de 3 ids du panel, une section Greffes.
import { existsSync, readFileSync } from 'node:fs';
const p = 'work/missions/2026-11-14-compagnon/critique/SYNTHESE.md';
const ids = ['s1a', 's1b', 's1c', 's1d', 's2a', 's2b', 's2c', 's2d', 's3a', 's3b', 's3c', 's3d'];
const ech = [];
const t = existsSync(p) ? readFileSync(p, 'utf8') : '';
if (!t) ech.push('SYNTHESE.md absent');
for (const id of ids) if (t && !t.includes(id)) ech.push(`${id} absent du classement`);
const c = (t.match(/Candidates\s*:\s*([^\n]+)/) ?? [])[1] ?? '';
const cs = ids.filter((id) => c.includes(id));
if (cs.length !== 3) ech.push(`candidates : ${cs.length} ids (3 attendus)`);
if (t && !/greffe/i.test(t)) ech.push('greffes absentes');
console.log(ech.length ? 'SYNTHESE ECHEC\n' + ech.join('\n') : 'SYNTHESE OK');
process.exit(ech.length ? 1 : 0);
