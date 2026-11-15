// Lit un résumé Vitest : VITEST OK si « Tests N passed » sans échec.
import { readFileSync, existsSync } from 'node:fs';
const t = (existsSync(process.argv[2]) ? readFileSync(process.argv[2], 'utf8') : '').replace(/[[0-9;]*m/g, '');
console.log(/Tests\s+\d+ passed/.test(t) && !/\d+ failed/.test(t) ? 'VITEST OK' : 'VITEST ECHEC');
