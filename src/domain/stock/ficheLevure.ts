/**
 * Le rapprochement d'un libellé de levure de facture au catalogue des levures du dépôt (voie f4-enrichir, E2, PLAN § 3.4 bis).
 * Pur : les références sont passées en argument (type structurel ci-dessous), aucun accès au stock, à l'écran ni au réseau.
 * Le rapprochement des recettes (`findRecipeYeastMatches`) compare des noms entiers : « LALLEMAND Windsor 11g » n'y trouve rien. Ici, la même
 * normalisation s'applique des deux côtés (marques, ™, tirets Unicode, poids du sachet) et l'on compare des ensembles de mots entiers ou un code
 * produit. Dans le doute, rien n'est lié : un seul candidat sans fabricant lu est « à contrôler », deux candidats sont « ambigus ».
 */

/** Ce que f4 lit d'une référence de levure du catalogue (forme de `HopYeast`, sans l'importer). */
export interface ReferenceLevure {
  id: string;
  name: string;
  aliases?: readonly string[];
  catalogue?: { manufacturer?: string | null; productCode?: string | null; aliases?: readonly string[] } | null;
}
export type CasLevure = 'sur' | 'aControler' | 'ambigu' | 'aucun';
export interface FicheLevure { cas: CasLevure; reference?: ReferenceLevure; candidats: ReferenceLevure[] }

/** Les mots d'un fabricant de levure, ramenés à un seul nom. */
const FABRICANT_DU_MOT: Readonly<Record<string, string>> = {
  lallemand: 'lallemand', lalbrew: 'lallemand',
  fermentis: 'fermentis', safale: 'fermentis', saflager: 'fermentis', safbrew: 'fermentis', safspirit: 'fermentis', safcider: 'fermentis',
  wyeast: 'wyeast', wlp: 'whitelabs', whitelabs: 'whitelabs',
  omega: 'omega', oyl: 'omega', imperial: 'imperial', mangrove: 'mangrovejacks',
};
/** Mots d'emballage ou de genre : ils ne désignent pas le produit. */
const MOTS_VIDES = new Set(['brewing', 'yeast', 'levure', 'levures', 'hefe', 'trockenhefe', 'sachet', 'style']);

/** Minuscules, sans accents ni ™ ® © ·, tirets Unicode ramenés à `-`, parenthèses ouvertes, poids d'emballage retirés. */
function plier(texte: string): string {
  // ™ ® © d'abord : NFKD écrirait « TM » collé au mot (« Windsor™ » → « windsortm »).
  return (texte ?? '')
    .replace(/[™®©·()[\]]/g, ' ')
    .normalize('NFKD').replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[‐-―−]/g, '-')
    .replace(/(?<![a-z0-9])\d+(?:[.,]\d+)?\s*(?:g|gr|kg|ml|l)(?![a-z0-9])/g, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ');
}

export interface JetonsLevure { fabricant?: string; jetons: string[]; codes: string[] }
/** Le fabricant lu (s'il est écrit), les mots qui désignent le produit, et les codes (un mot qui porte un chiffre, sans ses tirets). */
export function jetonsLevure(texte: string): JetonsLevure {
  const mots = plier(texte).split(/\s+/).map(m => m.replace(/^-+|-+$/g, '')).filter(Boolean);
  let fabricant: string | undefined;
  const reste: string[] = [];
  const blanc = mots.includes('white') && mots.includes('labs');
  for (const m of mots) {
    const f = FABRICANT_DU_MOT[m] ?? (blanc && (m === 'white' || m === 'labs') ? 'whitelabs' : undefined);
    if (f) { fabricant ??= f; continue; }
    if (MOTS_VIDES.has(m)) continue;
    if (fabricant === 'mangrovejacks' && (m === 'jack' || m === 'jacks' || m === 's')) continue;
    reste.push(m);
  }
  const jetons = [...new Set(reste)].sort();
  const codes = jetons.filter(j => /\d/.test(j)).map(j => j.replace(/-/g, ''));
  return { ...(fabricant ? { fabricant } : {}), jetons, codes };
}

/** Une référence commerciale d'emballage (« LAL-WINDSOR-500 ») : capitales, tirets, nombre final. Elle ne nomme pas le produit. */
const REFERENCE_COMMERCIALE = /^[A-Z0-9]+(?:-[A-Z0-9]+)*-\d+$/;
const fabricantDeReference = (r: ReferenceLevure): string | undefined => {
  const brut = r.catalogue?.manufacturer;
  if (!brut) return undefined;
  const lu = jetonsLevure(brut);
  return lu.fabricant ?? (plier(brut).split(/\s+/).filter(Boolean)[0] || undefined);
};
interface Indexee { ref: ReferenceLevure; fabricant?: string; designations: Set<string>; code?: string }
const index = new WeakMap<readonly ReferenceLevure[], Indexee[]>();
function indexer(references: readonly ReferenceLevure[]): Indexee[] {
  const deja = index.get(references);
  if (deja) return deja;
  const out = references.map(ref => {
    const noms = [ref.name, ...(ref.aliases ?? []), ...(ref.catalogue?.aliases ?? [])].filter(n => n && !REFERENCE_COMMERCIALE.test(n.trim()));
    const designations = new Set(noms.map(n => jetonsLevure(n).jetons.join(' ')).filter(Boolean));
    const code = ref.catalogue?.productCode ? plier(ref.catalogue.productCode).replace(/[\s-]/g, '') : undefined;
    const fabricant = fabricantDeReference(ref);
    return { ref, designations, ...(code ? { code } : {}), ...(fabricant ? { fabricant } : {}) };
  });
  index.set(references, out);
  return out;
}

/**
 * La fiche de levure d'un libellé : `sur` (un seul produit, et fabricant lu compatible ou code produit égal), `aControler` (un seul produit, aucun
 * fabricant lu), `ambigu` (deux produits ou plus : rien n'est lié), `aucun`.
 */
export function ficheLevureDe(libelle: string, references: readonly ReferenceLevure[]): FicheLevure {
  const lu = jetonsLevure(libelle);
  const designation = lu.jetons.join(' ');
  if (!designation) return { cas: 'aucun', candidats: [] };
  const parCode = new Set<Indexee>();
  const candidats = indexer(references).filter(x => {
    const nom = x.designations.has(designation);
    const code = x.code !== undefined && lu.codes.includes(x.code);
    if (code) parCode.add(x);
    if (!nom && !code) return false;
    return !(lu.fabricant && x.fabricant && lu.fabricant !== x.fabricant);
  });
  if (candidats.length === 0) return { cas: 'aucun', candidats: [] };
  if (candidats.length > 1) return { cas: 'ambigu', candidats: candidats.slice(0, 3).map(x => x.ref) };
  const [seul] = candidats;
  const sur = (lu.fabricant !== undefined && seul.fabricant === lu.fabricant) || parCode.has(seul);
  return { cas: sur ? 'sur' : 'aControler', reference: seul.ref, candidats: [seul.ref] };
}
