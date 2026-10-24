// Convertit les phrases BJCP 2021 (scripts/bjcp-statements.mjs) en bandes par style ET par
// famille, avec la table publique et versionnée « mots → bandes ». Écrit data/style-bands.json.
// Hypothèse [H] : table, règles et seuils sont « à valider par le brasseur ».
// Aucun multiplicateur par style : chaque bande vient des mots du style pour cette famille.
// Usage (depuis prototypes/houblons-v4) : node scripts/build-bands.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { STATEMENTS } from './bjcp-statements.mjs';

export const FAMILIES = ['citrus', 'tropical', 'stoneFruit', 'pomeFruit', 'berries', 'melon', 'floral', 'herbal', 'resin', 'spice', 'green', 'earthy'];

// Table « mots → bandes », version mots-bjcp-v1. Échelle des axes V5.5 : 0–100, classes
// faible 0–33, moyenne 33–66, forte 66–100 (src/data/hopKnowledgeBootstrap.json, lowMax/mediumMax).
export const WORDS = {
  version: 'mots-bjcp-v1',
  levels: [
    { id: 'none', band: [0, 5], words: ['none', 'no', 'absent', 'typically absent', 'undetectable'] },
    { id: 'very-low', band: [3, 15], words: ['very low', 'slight', 'subtle', 'hint', 'faint'] },
    { id: 'low', band: [8, 30], words: ['low', 'light', 'restrained', 'delicate'] },
    { id: 'medium-low', band: [22, 42], words: ['medium-low', 'moderately-low'] },
    { id: 'medium', band: [33, 55], words: ['medium', 'moderate', 'moderately'] },
    { id: 'medium-high', band: [45, 68], words: ['medium-high', 'moderately-high'] },
    { id: 'high', band: [58, 85], words: ['high', 'prominent', 'pronounced', 'strong', 'assertive', 'considerable'] },
    { id: 'very-high', band: [72, 100], words: ['very high', 'intense', 'aggressive', 'fairly aggressive', 'massively'] },
  ],
  why: [
    'Les huit niveaux suivent l’ordre des mots d’intensité du BJCP, posés sur les trois classes des axes V5.5 : « low » reste dans la classe faible, « medium » dans la moyenne, « high » chevauche moyenne et forte, « very high » occupe la forte.',
    'Deux niveaux voisins se chevauchent de 8 à 13 points : ce sont des mots de juge, pas des seuils mesurés ; le chevauchement évite une frontière nette que la donnée ne porte pas.',
    '« none » garde 0 à 5 : une trace n’est pas un défaut que le modèle saurait distinguer.',
  ],
};

// Mots BJCP → familles V5.5 (relevé à la main ; [H] pour « fruity »).
export const FAMILY_WORDS = {
  citrus: ['citrus', 'citrusy', 'citrus-orange'], tropical: ['tropical fruit'], stoneFruit: ['stone fruit', 'fruity [H]'],
  pomeFruit: ['fruity [H]', 'other fruity qualities [H]'], berries: ['berry', 'fruity [H]'], melon: ['melon', 'other fruity qualities [H]'],
  floral: ['floral', 'flowery', 'perfumy'], herbal: ['herbal', 'spicy-herbal'], resin: ['resin', 'resiny', 'pine'],
  spice: ['spicy', 'peppery', 'spicy-peppery', 'spicy-earthy', 'spicy-herbal'], green: ['grassy'], earthy: ['earthy', 'spicy-earthy'],
};

export const RULES = [
  'Phrase « X to Y » : [bas de X, haut de Y]. « up to Y » ou présence facultative (« optional », « may ») : bas = 0.',
  'Une famille prend le haut le plus élevé des phrases qui la nomment (arôme et saveur réunis : les axes V5.5 ne les séparent pas).',
  'Bas d’une famille : celui d’une phrase qui l’exige (« floral and spicy », famille seule) ; dans une liste d’alternatives (« or », « such as », « often »), aucune famille n’est exigée seule : bas = 0.',
  'Famille nommée : attendue. Famille exclue par le texte (« not grassy or herbal ») : indésirable, bande « none ».',
  'Famille non nommée : neutre, bande [0, min(haut de « low », haut du niveau général)] si le style nomme au moins une famille ; [0, haut du niveau général] s’il n’en nomme aucune.',
  'Style sans houblon (« No hop aroma », « No hop flavor » seulement) : toutes les familles indésirables, bande « none ».',
  'Niveau général du houblon du style : [plus petit bas, plus grand haut] des phrases ; sert au verdict d’ensemble (au moins une famille attendue dans cette bande).',
];

// Piste, cran et seuil [H] : fractions de la largeur effective de bande (plancher 15 points).
export const TRACK = {
  minWidth: 15, marginFraction: 0.5, cranFraction: 1 / 3, thresholdFraction: 0.25, overlapIndiscernable: 0.5,
  why: [
    'Plancher de 15 points : la moitié d’une classe V5.5 (33 points). Plus étroit, la piste zoomerait sur une finesse que ni les mots du BJCP ni le modèle (descripteurs cités ou non) ne portent.',
    'Marge : la moitié de la largeur de chaque côté, pour que les zones hors style hachurées restent visibles sans écraser la bande.',
    'Cran = 1/3 de la largeur : une bande couvre en général deux à quatre mots BJCP ; « monter d’un cran » fait passer du bas au cœur, ou du cœur au haut de la bande.',
    'Seuil d’écart sensible = 1/4 de la largeur, plus fin qu’un cran pour qu’une voie d’un cran soit toujours lisible, plus large que la moitié de l’écart type entre un descripteur cité et non cité dans les repères centraux V5.5 (environ 7 à 12 points sur une piste de 100).',
    'Recouvrement ≥ 50 % de la plus étroite des deux plages : « ≈ » quelle que soit la piste ; la donnée ne départage pas.',
  ],
};

const level = (id) => { const l = WORDS.levels.find((x) => x.id === id); if (!l) throw Error(`Niveau inconnu : ${id}`); return l.band; };
function statementBand(st) {
  const lo = st.upTo || st.optional ? 0 : level(st.from)[0];
  return [lo, level(st.to ?? st.from)[1]];
}

/** Applique les règles à un style. Pur ; exporté pour le test de cohérence. */
export function deriveStyle(code, statements) {
  const bands = statements.map(statementBand);
  const named = new Set(statements.flatMap((s) => s.families));
  const excluded = new Set(statements.flatMap((s) => s.exclude ?? []));
  const overall = [Math.min(...bands.map((b) => b[0])), Math.max(...bands.map((b) => b[1]))];
  const noHops = statements.every((s) => s.from === 'none' && !s.to && !s.families.length);
  const families = {};
  for (const f of FAMILIES) {
    if (noHops || excluded.has(f)) {
      const by = statements.filter((s) => (s.exclude ?? []).includes(f) || noHops).map((s) => s.field);
      families[f] = { status: 'indésirable', band: [...level('none')], from: by };
      continue;
    }
    if (named.has(f)) {
      const idx = statements.map((s, i) => (s.families.includes(f) ? i : -1)).filter((i) => i >= 0);
      const hi = Math.max(...idx.map((i) => bands[i][1]));
      const req = idx.filter((i) => statements[i].required && !statements[i].optional);
      const lo = req.length ? Math.max(...req.map((i) => bands[i][0])) : 0;
      families[f] = { status: 'attendue', band: [lo, hi], from: idx.map((i) => statements[i].field) };
      continue;
    }
    const ceiling = named.size ? Math.min(level('low')[1], overall[1]) : overall[1];
    families[f] = { status: 'neutre', band: [0, ceiling], from: [] };
  }
  return { code, overall, families };
}

const isMain = import.meta.url === pathToFileURL(process.argv[1] ?? '').href;
if (isMain) {
  const here = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const repo = path.resolve(here, '../..');
  const bjcp = JSON.parse(fs.readFileSync(path.join(repo, 'src/data/brewingStylesBootstrap.json'), 'utf8')).find((g) => g.id === 'styles-bjcp-2021');
  const styles = {};
  for (const [code, statements] of Object.entries(STATEMENTS)) {
    const st = bjcp.styles.find((s) => s.code === code);
    if (!st) throw Error(`Style BJCP absent : ${code}`);
    styles[code] = { id: st.id, name: st.name, url: st.source.reference, ibu: st.stats?.ibu ? [st.stats.ibu.min, st.stats.ibu.max] : null, statements, ...deriveStyle(code, statements) };
  }
  const out = {
    version: 'bandes-style-v1', date: '2026-10-18', status: 'à valider par le brasseur',
    hypothesis: '[H] Bandes tirées des mots d’intensité du guide BJCP 2021, converties par une table publique. Ni mesure sensorielle, ni panel : une lecture de juge, à valider par le brasseur.',
    source: { title: '2021 Beer Style Guidelines', author: 'BJCP', year: 2021, retrieved: '2026-10-18', note: 'Citations courtes des sections Aroma et Flavor, mot pour mot.' },
    scale: { min: 0, max: 100, classes: { faible: [0, 33], moyenne: [33, 66], forte: [66, 100] }, from: 'Axes V5.5, src/data/hopKnowledgeBootstrap.json' },
    families: FAMILIES, words: WORDS, familyWords: FAMILY_WORDS, rules: RULES, track: TRACK, styles,
  };
  fs.writeFileSync(path.join(here, 'data', 'style-bands.json'), JSON.stringify(out, null, 1) + '\n');
  console.log(`BANDS-V4 ${Object.keys(styles).length} styles documentés (table ${WORDS.version})`);
}
