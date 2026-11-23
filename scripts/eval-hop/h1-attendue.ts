// Voie h1 : sonde. Quels styles « attendent » l'herbacé (statut `attendue`) ? Bande de l'herbacé et du végétal par style, et statut.
//   npx vite-node scripts/eval-hop/h1-attendue.ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const j = JSON.parse(readFileSync(join(process.cwd(), 'src', 'data', 'hopV4', 'style-bands.json'), 'utf8')) as Record<string, unknown>;
const styles = (j.styles ?? j) as Record<string, { families?: Record<string, { status?: string; band?: number[] }> }>;
const lignes: string[] = [];
for (const [code, s] of Object.entries(styles)) {
  const f = s.families;
  if (!f) continue;
  const h = f.herbal, g = f.green;
  if (!h && !g) continue;
  lignes.push(`${code.padEnd(5)} herbal ${h?.status ?? '?'} [${h?.band?.join('–') ?? '?'}]  green ${g?.status ?? '?'} [${g?.band?.join('–') ?? '?'}]`);
}
console.log(lignes.length, 'styles\n' + lignes.join('\n'));
