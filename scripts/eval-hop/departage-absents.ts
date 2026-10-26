// Voie g2a-departage : pourquoi des houblons phares sont absents des listes de la 21C ? Lecture seule du moteur.
// Lancement : npx vite-node scripts/eval-hop/departage-absents.ts
import { CATALOGUE } from '../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../src/domain/hopIndex/v4/moteur';
import { FAMILIES, FAMILY_NAMES } from '../../src/domain/hopIndex/v4/families';

const m = creerMoteur({ catalogue: CATALOGUE, stock: [] });
for (const code of ['21C', '16D']) {
  const style = m.getStyleScale(code);
  const indesirables = FAMILIES.filter((f) => style.families[f].status === 'indésirable');
  console.log(`\nStyle ${code} (${style.name}) : familles indésirables = ${indesirables.map((f) => FAMILY_NAMES[f]).join(', ') || 'aucune'} ; documenté = ${style.documented}`);
  for (const s of ['citra', 'nelson-sauvin', 'motueka', 'galaxy', 'mosaic', 'hallertau-blanc', 'cascade']) {
    const id = `beermaverick-${s}`, c = m.citations(id);
    const citees = FAMILIES.filter((f) => c[f].status === 'cité');
    const fautives = citees.filter((f) => indesirables.includes(f));
    console.log(`  ${s.padEnd(16)} cite : ${citees.map((f) => FAMILY_NAMES[f]).join(', ')} | exclu par le style (cite ${fautives.map((f) => FAMILY_NAMES[f]).join(', ') || '—'}) : ${fautives.length > 0}`);
  }
}
