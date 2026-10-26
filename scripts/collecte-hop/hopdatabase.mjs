// Collecte c3d — HopDatabase (kasperg3/HopDatabase, licence MIT), révision fixée dans scripts/scrape-hop-community.mjs.
// Tous les champs du fichier, sans tri ni fusion. Un 0-0, une case vide ou un « Unknown » : null, jamais 0.
// Lit le cache (déjà rempli) ; `--offline` interdit tout téléchargement. Même JSON à chaque lancement.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { offlineMode } from '../hop-source-cache.mjs';
import { lire, norm, json, rattacher } from './communautaire-commun.mjs';

export const REVISION = 'cf9aad4b59fe7c30441550ef703e095f8b1116ab';
export const URL_DONNEES = `https://raw.githubusercontent.com/kasperg3/HopDatabase/${REVISION}/website/public/data/hops.json`;
export const URL_LICENCE = `https://raw.githubusercontent.com/kasperg3/HopDatabase/${REVISION}/LICENSE`;
const BLOB = `https://github.com/kasperg3/HopDatabase/blob/${REVISION}/website/public/data/hops.json`;

const AXES = { Citrus: 'citrus', 'Resin/Pine': 'resinPine', Spice: 'spice', Herbal: 'herbal', Grassy: 'grassy', Floral: 'floral', Berry: 'berry', 'Stone Fruit': 'stoneFruit', 'Tropical Fruit': 'tropicalFruit' };
const nul = v => (v === undefined || v === null || v === '' ? null : v);
const num = v => { const n = typeof v === 'string' ? Number(v.replace(',', '.')) : v; return typeof n === 'number' && Number.isFinite(n) ? n : null; };

/**
 * Une plage `_from` / `_to`. Aucune unité n'est écrite dans le fichier : `unite` et `base` restent null (jamais déduits).
 * Une plage 0–0 est un défaut de l'agrégat (« zéro utilisé comme valeur par défaut ») : inconnue. `defaut` indique que 0–0 ne dit rien.
 */
export function plage(etiquette, de, a) {
  const min = num(de), max = num(a);
  const brut = nul(de) === null && nul(a) === null ? null : `${de ?? ''}–${a ?? ''}`;
  const base = { etiquette, brut, valeur: null, min: null, max: null, unite: null, base: null };
  if (min === null || max === null || min > max) return base;
  if (min === 0 && max === 0) return { ...base, zeroParDefaut: true };
  return { ...base, valeur: min === max ? min : null, min, max };
}

/** Une entrée du fichier → une fiche de collecte. `index` : l'index du catalogue pour rattacher sans forcer. */
export function ficheHopDatabase(r, { index, releve } = {}) {
  const champs = {
    alpha: plage('alpha_from / alpha_to', r.alpha_from, r.alpha_to),
    beta: plage('beta_from / beta_to', r.beta_from, r.beta_to),
    huileTotale: plage('oil_from / oil_to', r.oil_from, r.oil_to),
    cohumulone: plage('co_h_from / co_h_to', r.co_h_from, r.co_h_to),
  };
  const ap = r.additional_properties ?? {};
  const AP = [['acid_hardresins', 'resinesDures'], ['polyphenoles', 'polyphenols'], ['xantholhumol', 'xanthohumol'], ['oils', 'huileTotaleHopsteiner'], ['humulen', 'humulene'], ['farnesen', 'farnesene'], ['linalool_oil', 'linalolHuile'], ['linalool_acid', 'linalolAcide']];
  for (const [src, cle] of AP) if (`${src}_from` in ap || `${src}_to` in ap) champs[cle] = plage(`${src}_from / ${src}_to`, ap[`${src}_from`], ap[`${src}_to`]);
  // Moyennes calculées par l'agrégat : gardées à part (dérivées des bornes, pas des mesures).
  const bs = r.brewing_stats ?? {};
  const derives = {};
  for (const [src, cle] of [['avg_alpha', 'moyenneAlpha'], ['avg_beta', 'moyenneBeta'], ['avg_oil', 'moyenneHuile'], ['avg_cohumulone', 'moyenneCohumulone']]) {
    if (src in bs) { const n = num(bs[src]); derives[cle] = { etiquette: src, brut: nul(bs[src]), valeur: n === 0 ? null : n, ...(n === 0 ? { zeroParDefaut: true } : {}) }; }
  }
  for (const [src, cle] of [['alpha_classification', 'classeAlpha'], ['oil_classification', 'classeHuile']]) if (nul(bs[src]) !== null) derives[cle] = { etiquette: src, brut: bs[src] };
  // Profil d'arôme : tout à zéro = pas de valeurs (la source l'écrit ainsi pour Adeena), donc null et non un profil plat.
  const axes = r.aromas && typeof r.aromas === 'object' ? Object.entries(r.aromas) : [];
  const tousZero = axes.length > 0 && axes.every(([, v]) => !(num(v) > 0));
  const aromas = !axes.length || tousZero ? null : Object.fromEntries(axes.map(([k, v]) => [AXES[k] ?? k, num(v)]));
  const alias = [];
  const rat = rattacher(r.name, alias, index);
  return {
    nom: norm(r.name), alias, varietyId: rat.varietyId, ...(rat.rattachement ? { rattachement: rat.rattachement } : {}), ...(rat.ambigu ? { rattachementAmbigu: rat.ambigu } : {}), ...(rat.douteux ? { rattachementDouteux: rat.douteux } : {}),
    url: nul(r.href), releve, publie: null, champs, derives,
    listes: {
      origine: nul(r.country) ? [norm(r.country)] : null,
      usage: nul(bs.brewing_purpose) ? [norm(bs.brewing_purpose)] : null,
      descripteurs: Array.isArray(r.notes) && r.notes.length ? r.notes.map(norm).filter(Boolean) : null,
      fournisseurs: nul(r.source) ? String(r.source).split('/').map(norm).filter(Boolean) : null,
    },
    arome: aromas,
    variantes: Array.isArray(r.product_variants) && r.product_variants.length ? r.product_variants.map(v => ({
      type: norm(v.type),
      champs: { alpha: plage('alpha_from / alpha_to', v.alpha_from, v.alpha_to), beta: plage('beta_from / beta_to', v.beta_from, v.beta_to), huileTotale: plage('oil_from / oil_to', v.oil_from, v.oil_to), cohumulone: plage('co_h_from / co_h_to', v.co_h_from, v.co_h_to) },
    })) : null,
  };
}

export async function main() {
  const donnees = await lire(URL_DONNEES), licence = await lire(URL_LICENCE);
  const lignes = JSON.parse(donnees.content);
  if (!Array.isArray(lignes)) throw Error('Format inattendu : HopDatabase');
  const { catalogue } = await import('./communautaire-commun.mjs');
  const index = catalogue().index;
  const fiches = lignes.map(r => ficheHopDatabase(r, { index, releve: donnees.retrievedAt })).sort((a, b) => a.nom.localeCompare(b.nom) || String(a.url).localeCompare(String(b.url)));
  return {
    source: { nom: 'HopDatabase (kasperg3)', hote: 'github.com/kasperg3/HopDatabase', type: 'base communautaire (agrégat des catalogues Barth Haas, Crosby, Hopsteiner, Yakima Chief)',
      licence: norm(licence.content.split('\n').slice(0, 3).join(' ')), conditions: 'MIT : copie autorisée, notice de droits à conserver', revision: REVISION, reference: BLOB,
      unites: 'Aucune unité écrite dans le fichier : unite et base restent null ; usage courant : α, β, cohumulone en %, huile en mL/100 g', releve: donnees.retrievedAt, sha256Donnees: donnees.sha256, sha256Licence: licence.sha256, entrees: lignes.length },
    fiches,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const sortie = await main(), texte = json(sortie);
  const cible = resolve(dirname(fileURLToPath(import.meta.url)), '../../src/data/hopSources/hopdatabase.json');
  await mkdir(dirname(cible), { recursive: true }); await writeFile(cible, texte);
  console.log(`hopdatabase : ${sortie.fiches.length} fiches ; sha256 ${createHash('sha256').update(texte).digest('hex')}`);
}
