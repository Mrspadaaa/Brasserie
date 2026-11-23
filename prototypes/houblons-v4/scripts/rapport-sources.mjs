// #131 : rapport par houblon des mesures à source unique et des manques.
// Lecture seule de data/pack-fiches.json ; n'écrit que le rapport demandé.
// Usage : node scripts/rapport-sources.mjs [sortie.md]
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ici = dirname(fileURLToPath(import.meta.url));
const pack = JSON.parse(readFileSync(join(ici, '..', 'data', 'pack-fiches.json'), 'utf8'));
const fiches = pack.fichesHoublons;

// Huiles attendues par #131 ; celles que le pack ne porte pas du tout sont des manques.
const HUILES = ['myrcene', 'humulene', 'caryophyllene', 'farnesene', 'linalool', 'geraniol', 'betaPinene'];
const NOM_HUILE = { myrcene: 'myrcène', humulene: 'humulène', caryophyllene: 'caryophyllène', farnesene: 'farnésène', linalool: 'linalol', geraniol: 'géraniol', betaPinene: 'β-pinène' };

function sourcesDe(mesure) {
  if (!mesure) return [];
  if (Array.isArray(mesure.sources)) return mesure.sources.map(s => s.source);
  if (mesure.source) return [mesure.source];
  return [];
}

const lignes = [];
const totaux = { unique: 0, bmSeul: 0, manque: 0, mesures: 0 };
const parHuile = Object.fromEntries(HUILES.map(h => [h, 0]));
const familles = { lues: 0, uneSeuleFiche: 0 };

for (const f of fiches) {
  const uniques = [];
  const manques = [];
  const mesures = [
    ['α', f.alpha],
    ['β', f.beta],
    ['huile totale', f.huiles?.totale],
    ...HUILES.map(h => [NOM_HUILE[h], f.huiles?.composants?.[h] ?? null]),
  ];
  for (const [nom, m] of mesures) {
    totaux.mesures++;
    const s = [...new Set(sourcesDe(m))];
    if (s.length === 0) {
      manques.push(nom);
      totaux.manque++;
      const cle = Object.keys(NOM_HUILE).find(k => NOM_HUILE[k] === nom);
      if (cle) parHuile[cle]++;
    } else if (s.length === 1) {
      uniques.push(`${nom} (${s[0]})`);
      totaux.unique++;
      if (s[0] === 'Beer Maverick') totaux.bmSeul++;
    }
  }
  const aromes = f.aromes ?? [];
  const fichesLues = aromes.length ? Math.max(...aromes.map(a => a.of ?? 0)) : 0;
  familles.lues++;
  if (fichesLues <= 1) familles.uneSeuleFiche++;
  lignes.push(`| ${f.name} | ${f.origin ?? '?'} | ${uniques.join(', ') || '—'} | ${manques.join(', ') || '—'} | ${fichesLues} |`);
}

const sortie = process.argv[2];
const md = [
  '# Sources des fiches houblons : mesures à source unique et manques',
  '',
  `Généré par \`prototypes/houblons-v4/scripts/rapport-sources.mjs\` depuis \`data/pack-fiches.json\` (${fiches.length} houblons, pack du ${pack.meta?.date ?? '?'}). Lecture seule.`,
  '',
  `- Mesures lues : ${totaux.mesures} (α, β, huile totale et ${HUILES.length} composants par houblon).`,
  `- À source unique : ${totaux.unique}, dont ${totaux.bmSeul} avec Beer Maverick pour seule source.`,
  `- Absentes : ${totaux.manque}. Par composant : ${HUILES.map(h => `${NOM_HUILE[h]} ${parHuile[h]}/${fiches.length}`).join(', ')}.`,
  `- Arômes : ${familles.uneSeuleFiche}/${familles.lues} houblons décrits par une seule fiche au plus (citations, pas d'intensité).`,
  '',
  '| Houblon | Origine | Source unique | Absent | Fiches d’arôme |',
  '|---|---|---|---|---|',
  ...lignes,
  '',
].join('\n');

if (sortie) writeFileSync(sortie, md, 'utf8');
else process.stdout.write(md);
console.error(`RAPPORT ${fiches.length} houblons, ${totaux.unique} uniques (${totaux.bmSeul} BM seul), ${totaux.manque} absentes`);
