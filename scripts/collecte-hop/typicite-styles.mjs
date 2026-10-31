// Voie f9 (D191, b de f8) : la typicité d'un houblon pour un style, dérivée de Beer Analytics (collecte c3h).
//   node scripts/collecte-hop/typicite-styles.mjs            écrit src/data/hopV4/typicite-styles.json
//   node scripts/collecte-hop/typicite-styles.mjs --verifier  recalcule et compare au fichier écrit (sortie : TYPICITE OK / ECART)
// Source : src/data/hopSources/beeranalytics-<lettre>.json (lecture seule), graphique « typical-styles-relative » de chaque houblon :
// la part des recettes du style qui contiennent ce houblon (« Used in % of the Style's Recipes »). Le site ne publie que les 16 styles où le
// houblon pèse le plus : un style absent de cette liste n'est PAS 0, c'est « au plus la plus petite part publiée » (`p16`). Le script garde donc
// la part des styles listés et le `p16` de chaque houblon ; l'absent reste inconnu (jamais 0).
// Le style d'une bière (code BJCP 2021) rejoint le style de Beer Analytics par son nom anglais (style-bands.json). Les styles voisins de la famille IPA
// (21A, 21C, 22A) sont déclarés ici, pour les lire ensemble.
// Voie t3 : la table porte aussi `auFrais` (part des recettes d'un houblon employées à l'arôme ou au dry hop, graphique « usage-types » du même site) et sa médiane (point neutre de R4, sans seuil).
// Licence des données : CC BY-SA 4.0 (Beer Analytics, www.beer-analytics.com). Le fichier dérivé la porte dans son en-tête ; à partager dans les mêmes conditions.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SOURCES = join(RACINE, 'src', 'data', 'hopSources');
const SORTIE = join(RACINE, 'src', 'data', 'hopV4', 'typicite-styles.json');
const BANDES = JSON.parse(readFileSync(join(RACINE, 'src', 'data', 'hopV4', 'style-bands.json'), 'utf8'));

/** Styles voisins (même famille de houblonnage) : lus avec le style visé, à moindre poids (voir `poidsVoisin`). */
const STOUTS = ['15B', '15C', '16A', '16B', '16C', '16D', '20B', '20C']; // les stouts : chacun lit les autres (les houblons anglais et irlandais y sont typés)
export const VOISINS = { '22A': ['21A', '21C'], '21A': ['21C', '22A'], '21C': ['21A', '22A'], ...Object.fromEntries(STOUTS.map((c) => [c, STOUTS.filter((x) => x !== c)])) };
/** Familles de styles de Beer Analytics (le style parent, tel qu'il compte les recettes de ses enfants) et les codes BJCP de l'app qui en font partie.
 * Servent à la CONCENTRATION : la part des recettes DU HOUBLON qui sont de cette famille (« typé IPA » : un houblon dont le tiers des recettes sont des IPA). */
export const FAMILLES = { ipa: { ba: 'IPA', codes: ['21A', '21C', '22A'] }, 'pale-americaine': { ba: 'Pale American Ale', codes: ['18B'] }, 'porter-stout-americain': { ba: 'American Porter and Stout', codes: ['20A', '20B'] } };
/** Un voisin pèse moitié moins que le style visé : la part de ce houblon dans le voisin, divisée par deux. */
export const POIDS_VOISIN = 0.5;
/** Houblons de Beer Analytics que la collecte c3h n'a pas rattachés (varietyId null) alors que le catalogue a la même variété sous un autre nom : nom du site -> identifiant du catalogue (sans « beermaverick- »).
 * Vérifié à la main : « East Kent Golding » du site est « East Kent Goldings » du catalogue (96 945 recettes ; British Bitter, Porter et Stout). Les cinq rattachements ambigus (Saaz, Magnum, Perle, Northern Brewer, Brewer's Gold) restent exclus. */
export const ALIAS_BA = { 'East Kent Golding': 'east-kent-goldings' };
const arrondi = (x) => Math.round(x * 1e4) / 1e4;
/** Voie t3 (R4, D195) : la PART AU FRAIS d'un houblon = (recettes Aroma + recettes Dry Hop) ÷ (somme des recettes des cinq moments Mash, First Wort, Boil, Aroma, Dry Hop), lue dans le graphique « usage-types » de Beer Analytics.
 * Le dénominateur est la somme des moments, pas le nombre de recettes du houblon : une recette peut l'employer à deux moments, la part reste ainsi dans [0, 1]. Sous `MIN_RECETTES_AU_FRAIS` recettes, la part est trop fragile : inconnue (jamais 0). */
export const MOMENTS_AU_FRAIS = ['Aroma', 'Dry Hop'];
export const MIN_RECETTES_AU_FRAIS = 1000;
/** Aucun seuil, aucune étiquette (le brasseur, 31.10 : « le rôle d'un houblon n'est jamais vraiment totalement défini ») : la part est une valeur continue. La table porte seulement la MÉDIANE des parts lues,
 * le point neutre de R4 : un houblon sans donnée vaut la médiane (ni devant, ni derrière). */
const medianeDe = (xs) => { const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

/** Le nom anglais de chaque style de l'app (code BJCP → nom Beer Analytics, même nom). */
function stylesDeLApp() {
  return Object.fromEntries(Object.entries(BANDES.styles).map(([code, s]) => [code, s.name]).sort(([a], [b]) => a.localeCompare(b)));
}

export function calculer() {
  const noms = stylesDeLApp();
  const fichiers = readdirSync(SOURCES).filter((f) => /^beeranalytics-[A-Z]\.json$/.test(f)).sort();
  let releve = null, lues = 0, avecGraphique = 0;
  const parts = {}; // code BJCP -> { id -> part }
  const p16 = {};
  const recettes = {}; // nombre de recettes du site qui contiennent le houblon
  const concentration = {}; // famille -> { id -> part des recettes du houblon qui sont de cette famille }
  const vus = new Set();
  const vusFrais = new Set(), auFrais = {}; // id -> part au frais
  for (const f of fichiers) {
    const d = JSON.parse(readFileSync(join(SOURCES, f), 'utf8'));
    releve = releve && releve > d.source.releve ? releve : d.source.releve;
    for (const h of d.fiches) {
      lues++;
      const liste = h.stats?.['typical-styles-relative']?.parStyle;
      const brut = h.varietyId ?? (ALIAS_BA[h.nom] ? `beermaverick-${ALIAS_BA[h.nom]}` : null);
      // t3 : la part au frais (graphique usage-types), indépendante du graphique des styles ; un houblon à moins de `MIN_RECETTES_AU_FRAIS` recettes n'en a pas.
      const moments = h.stats?.['usage-types']?.parMoment, nRecettes = h.champs?.recettes?.valeur;
      if (brut && Array.isArray(moments) && Number.isFinite(nRecettes) && nRecettes >= MIN_RECETTES_AU_FRAIS && !vusFrais.has(brut)) {
        const total = moments.reduce((s, x) => s + (x.recettes > 0 ? x.recettes : 0), 0);
        const frais = moments.filter((x) => MOMENTS_AU_FRAIS.includes(x.moment)).reduce((s, x) => s + (x.recettes > 0 ? x.recettes : 0), 0);
        if (total > 0) { vusFrais.add(brut); auFrais[brut.replace(/^beermaverick-/, '')] = arrondi(frais / total); }
      }
      if (!brut || !Array.isArray(liste) || !liste.length) continue;
      const id = brut.replace(/^beermaverick-/, '');
      if (vus.has(id)) continue;
      vus.add(id);
      avecGraphique++;
      p16[id] = arrondi(Math.min(...liste.map((s) => s.part)));
      const n = h.champs?.recettes?.valeur;
      const absolu = h.stats?.['typical-styles-absolute']?.parStyle;
      if (Number.isFinite(n) && n > 0) {
        recettes[id] = n;
        for (const [fam, { ba }] of Object.entries(FAMILLES)) {
          const c = Array.isArray(absolu) ? absolu.find((x) => x.style === ba) : null;
          if (c) (concentration[fam] ??= {})[id] = arrondi(Math.min(1, c.recettes / n));
        }
      }
      for (const [code, nom] of Object.entries(noms)) {
        const s = liste.find((x) => x.style === nom);
        if (s) (parts[code] ??= {})[id] = arrondi(s.part);
      }
    }
  }
  const classe = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
  const stylesPresents = Object.keys(parts).sort();
  const mediane = arrondi(medianeDe(Object.values(auFrais)));
  return {
    source: {
      id: 'beeranalytics', nom: 'Beer Analytics', url: 'https://www.beer-analytics.com', licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/', releve,
      graphique: 'typical-styles-relative : part des recettes du style qui contiennent ce houblon (fraction de 0 à 1) ; les 16 styles où le houblon pèse le plus',
      derive: 'Table dérivée, générée par scripts/collecte-hop/typicite-styles.mjs depuis src/data/hopSources/beeranalytics-<lettre>.json (collecte c3h). À citer et à partager dans les mêmes conditions (CC BY-SA 4.0).',
    },
    lecture: 'parts[code du style][identifiant sans « beermaverick- »] = part. Un style absent de la liste d’un houblon est INCONNU, jamais 0 : il vaut au plus `p16[identifiant]`, la plus petite part publiée pour ce houblon.',
    voisins: VOISINS, poidsVoisin: POIDS_VOISIN,
    familles: Object.fromEntries(Object.entries(FAMILLES).map(([k, v]) => [k, { nom: v.ba, codes: v.codes }])),
    concentrationLecture: 'concentration[famille][identifiant] = part des recettes DU HOUBLON qui sont de cette famille de styles (graphique typical-styles-absolute, style parent / nombre de recettes du houblon). Une famille absente de la liste du houblon est INCONNUE, jamais 0. `recettes[identifiant]` = taille de l’échantillon (peu de recettes : concentration fragile).',
    auFraisLecture: 'auFrais.parts[identifiant] = part au frais : (recettes Aroma + Dry Hop) ÷ (somme des recettes de Mash, First Wort, Boil, Aroma, Dry Hop), graphique usage-types de Beer Analytics (CC BY-SA 4.0), pour les houblons de `minRecettes` recettes ou plus. Un houblon absent est INCONNU, jamais 0 : R4 le tient pour neutre (il vaut `mediane`, la médiane des parts lues). La part est continue, sans seuil : plus un houblon est employé au frais, plus il passe devant au whirlpool et au dry hop (R4, voie t3).',
    auFrais: { moments: MOMENTS_AU_FRAIS, minRecettes: MIN_RECETTES_AU_FRAIS, mediane, parts: classe(auFrais) },
    couverture: { houblonsLus: lues, houblonsAvecGraphique: avecGraphique, stylesAvecParts: stylesPresents.length },
    styles: classe(Object.fromEntries(stylesPresents.map((c) => [c, noms[c]]))),
    p16: classe(p16),
    recettes: classe(recettes),
    concentration: classe(Object.fromEntries(Object.entries(concentration).map(([k, v]) => [k, classe(v)]))),
    parts: classe(Object.fromEntries(stylesPresents.map((c) => [c, classe(parts[c])]))),
  };
}

const texte = (t) => `${JSON.stringify(t)}\n`;
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const t = calculer();
  if (process.argv.includes('--verifier')) {
    let ecrit = '';
    try { ecrit = readFileSync(SORTIE, 'utf8'); } catch { /* absent */ }
    console.log(ecrit === texte(t) ? 'TYPICITE OK' : 'TYPICITE ECART');
  } else {
    writeFileSync(SORTIE, texte(t));
    console.log(`typicite-styles.json écrit : ${t.couverture.houblonsAvecGraphique} houblons, ${t.couverture.stylesAvecParts} styles, ${texte(t).length} octets`);
  }
}
