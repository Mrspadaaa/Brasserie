// Lecture seule de listes.json (f9) : imprime ce dont la page m9 a besoin (rangs de ses six, barres après le premier).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = dirname(fileURLToPath(import.meta.url));
const j = JSON.parse(readFileSync(join(ici, '..', 'f9-intensite-typicite', 'listes.json'), 'utf8'));
const r = (x) => (x == null ? '—' : Math.round(x));
for (const c of j.combinaisons) {
  console.log('\n===', c.combinaison);
  for (const q of c.questions) {
    if (q.moment === 'whirlpool') continue;
    console.log(' ', q.question, '|', q.moment, '| six', JSON.stringify(q.sesSix), '| n', q.nbHoublons);
    console.log('    dix', q.dix.map((d) => `${d.houblon} ${d.alphaPct}% ${d.grammes}g c${r(d.apport.citrus)} t${r(d.apport.tropical)}${d.typicite ? ' T' + d.typicite.palier : ''}${d.intensite ? ' I' + d.intensite.radar + 'x' + d.intensite.facteur : ''}`).join(' | '));
    const b = q.barresApresLePremier;
    console.log('    barres après', b.houblon, Object.entries(b.familles).map(([f, v]) => `${f}:${r(v.central)}[${r(v.min)}-${r(v.max)}] st${v.bandeStyle?.join('-')}`).join(' '));
  }
}
