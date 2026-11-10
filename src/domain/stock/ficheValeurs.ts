import type { StockItem } from '../../types';
import type { Famille } from './ficheCle';

/**
 * Les valeurs qu'f4 écrit sur un article, et la règle qui les garde à leur place (voie f4-enrichir, P1, P2, D277, PLAN § 2, § 3.6, § 12).
 * Une valeur trouvée (catalogue, fiche retenue, en ligne) n'est JAMAIS une donnée lue : elle porte sa trace dans `fiche.remplis[champ]`, avec la
 * valeur écrite. Tant que l'article porte encore cette valeur, elle est « remplie par f4 » ; s'il la retouche, elle redevient la sienne.
 * Pur : aucun accès au stock, à l'écran ni au réseau.
 */
export type ParFiche = 'catalogue' | 'retenue' | 'en-ligne';
export type ChampFiche = 'colorEbc' | 'potentialPpg' | 'yeastLab' | 'yeastStrain' | 'yeastForm' | 'yeastAttenuationPct' | 'yeastTempMinC'
  | 'yeastTempMaxC' | 'yeastFlocculation' | 'yeastAlcoholTolerancePct' | 'yeastTechnicalFacts' | 'yeastFermentationFacts' | 'technicalSource';
export interface Rempli { par: ParFiche; source: string; url?: string; le: string; niveau: 'sur' | 'repris'; valeur: unknown; deduit?: string }
/**
 * La forme élargie de `StockItem.fiche` (PLAN § 3.6), type local tant que `src/types/index.ts` ne la porte pas (accord de schéma).
 * `id` et `approchee` sont ceux de s6 et ne sont jamais réécrits par f4.
 */
export interface FicheEnrichie {
  id: string; approchee: boolean;
  cle?: string; par?: ParFiche; aControler?: boolean; propose?: string | null;
  remplis?: Partial<Record<ChampFiche, Rempli>>;
  vu?: string;
}
export const ficheDe = (item: StockItem): FicheEnrichie | undefined => item.fiche as FicheEnrichie | undefined;

/** Les seuls champs qu'f4 peut écrire (jamais `currentStock`, `name`, `unit`, `category`, `alphaPct`, `yeastLot`, `supplier`, `origin`). */
export const CHAMPS_ECRIVABLES: readonly ChampFiche[] = ['colorEbc', 'potentialPpg', 'yeastLab', 'yeastStrain', 'yeastForm', 'yeastAttenuationPct',
  'yeastTempMinC', 'yeastTempMaxC', 'yeastFlocculation', 'yeastAlcoholTolerancePct', 'yeastTechnicalFacts', 'yeastFermentationFacts', 'technicalSource'];
/** Ce qu'un article de chaque famille doit avoir pour servir : rouge (inconnu) s'il manque. */
export const CHAMPS_UTILES: Readonly<Record<Famille, readonly string[]>> = {
  malt: ['colorEbc', 'potentialPpg'],
  houblon: ['alphaPct', 'fiche'],
  levure: ['yeastLab', 'yeastForm', 'temperatures', 'fiche'],
};
/** Les champs qu'une recherche peut combler, par famille. */
export const CHAMPS_DE_FAMILLE: Readonly<Record<Famille, readonly ChampFiche[]>> = {
  malt: ['colorEbc', 'potentialPpg', 'technicalSource'],
  houblon: [],
  levure: ['yeastLab', 'yeastStrain', 'yeastForm', 'yeastAttenuationPct', 'yeastTempMinC', 'yeastTempMaxC', 'yeastFlocculation',
    'yeastAlcoholTolerancePct', 'yeastTechnicalFacts', 'yeastFermentationFacts', 'technicalSource'],
};

/** Égalité profonde stable (clés triées) : un tableau ou un objet relu de Firestore ou d'IndexedDB est une copie (REVUE-bloquant n° 1). */
export function memeValeur(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  return stable(a) === stable(b);
}
function stable(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  if (v && typeof v === 'object') return `{${Object.keys(v as object).filter(k => (v as Record<string, unknown>)[k] !== undefined).sort()
    .map(k => `${JSON.stringify(k)}:${stable((v as Record<string, unknown>)[k])}`).join(',')}}`;
  return JSON.stringify(v) ?? 'undefined';
}

/** Le rempli d'un champ, seulement si l'article porte encore la valeur qu'f4 a écrite. */
export function rempliDe(item: StockItem, champ: keyof StockItem): Rempli | undefined {
  const r = ficheDe(item)?.remplis?.[champ as ChampFiche];
  return r && memeValeur(item[champ], r.valeur) ? r : undefined;
}
/** La valeur LUE (sur la facture, ou tapée) d'un champ : `undefined` quand elle a été remplie par f4 et n'a pas été retouchée (P1). */
export function valeurLueDe<K extends keyof StockItem>(item: StockItem, champ: K): StockItem[K] | undefined {
  return rempliDe(item, champ) ? undefined : item[champ];
}
/** Le lien posé par s6 à la création n'a pas de `par` ; tout lien posé par f4 en a un. */
export const ficheDeS6 = (item: StockItem): boolean => item.fiche !== undefined && ficheDe(item)?.par === undefined;
/** L'article porte une donnée lue écrite par s6 (remplace la condition de `porteDonneeS6`, `stockLineMatching.ts`). */
export const porteDonneeLue = (item: StockItem): boolean =>
  valeurLueDe(item, 'alphaPct') !== undefined || item.origin !== undefined || valeurLueDe(item, 'colorEbc') !== undefined || ficheDeS6(item);

/** Un champ vide, selon la règle de `learnIngredient` (`storage.ts`) : absent, texte vide, 0 pour potentiel, α, atténuation ; liste vide. */
export function estVide(item: StockItem, champ: keyof StockItem): boolean {
  const v = item[champ];
  if (v == null || v === '') return true;
  if (Array.isArray(v)) return v.length === 0;
  return v === 0 && (champ === 'potentialPpg' || champ === 'alphaPct' || champ === 'yeastAttenuationPct');
}
export const trousDe = (item: StockItem, famille: Famille): ChampFiche[] => CHAMPS_DE_FAMILLE[famille].filter(c => estVide(item, c));
/** Une valeur proposée est-elle écrivable (définie, nombre fini, texte non vide, liste non vide) ? */
const utilisable = (v: unknown) => v !== undefined && v !== null && v !== '' && !(typeof v === 'number' && !Number.isFinite(v)) && !(Array.isArray(v) && !v.length);

export interface Provenance { par: ParFiche; source: string; url?: string; niveau: 'sur' | 'repris'; deduit?: Partial<Record<ChampFiche, string>> }
/** Le lien à poser quand l'article n'a pas de fiche (toujours avec `par`) ; ignoré si une fiche existe déjà (ses `id` et `approchee` restent). */
export interface Lien { id: string; approchee: boolean; par: ParFiche }
export interface ResultatPatch {
  patch: Partial<StockItem>;
  remplis: ChampFiche[];
  /** Les valeurs proposées qui contredisent une valeur lue ou tapée : jamais écrites, dites au journal. */
  ecarts: Array<{ champ: ChampFiche; lue: unknown; trouvee: unknown }>;
}

/**
 * Le patch d'un article : seulement les champs VIDES de la liste blanche, et `fiche`. Une fiche existante garde `id` et `approchee` (s6) ; f4 n'y
 * ajoute que `cle`, `remplis`, `aControler`, `propose`. Sans fiche, le lien est posé avec `par` (jamais un `fiche` sans `par` : `ficheDeS6`).
 * Lève si des valeurs devaient être écrites sans fiche ni lien (elles n'auraient pas de trace : P1 ne tiendrait pas).
 */
export function patchDeTrous(item: StockItem, valeurs: Partial<Record<ChampFiche, unknown>>, provenance: Provenance, le: string,
  options: { lien?: Lien; cle?: string; aControler?: boolean; propose?: string | null } = {}): ResultatPatch {
  const patch: Partial<StockItem> = {};
  const remplis: Partial<Record<ChampFiche, Rempli>> = {};
  const ecarts: ResultatPatch['ecarts'] = [];
  for (const champ of CHAMPS_ECRIVABLES) {
    const v = valeurs[champ];
    if (!utilisable(v)) continue;
    if (!estVide(item, champ)) {
      if (champ !== 'technicalSource' && !rempliDe(item, champ) && !memeValeur(item[champ], v)) ecarts.push({ champ, lue: item[champ], trouvee: v });
      continue;
    }
    (patch as Record<string, unknown>)[champ] = v;
    remplis[champ] = { par: provenance.par, source: provenance.source, ...(provenance.url ? { url: provenance.url } : {}), le, niveau: provenance.niveau, valeur: v,
      ...(provenance.deduit?.[champ] ? { deduit: provenance.deduit[champ] } : {}) };
  }
  const existante = ficheDe(item);
  const champs = Object.keys(remplis) as ChampFiche[];
  const cleNeuve = options.cle !== undefined && !existante?.cle;
  const aControlerChange = options.aControler !== undefined && Boolean(existante?.aControler) !== options.aControler;
  const proposeChange = options.propose !== undefined && (existante?.propose ?? null) !== options.propose;
  const changeFiche = champs.length > 0 || cleNeuve || aControlerChange || proposeChange || (!existante && options.lien);
  if (changeFiche) {
    if (!existante && !options.lien) throw new Error('f4 : aucune valeur ne s’écrit sans fiche ni lien.');
    const base: FicheEnrichie = existante ? { ...existante } : { id: options.lien!.id, approchee: options.lien!.approchee, par: options.lien!.par };
    const fiche: FicheEnrichie = {
      ...base,
      ...(options.cle !== undefined && !base.cle ? { cle: options.cle } : {}),
      ...(aControlerChange || (!existante && options.aControler) ? { aControler: options.aControler } : {}),
      ...(proposeChange ? { propose: options.propose } : {}),
      ...(champs.length ? { remplis: { ...(base.remplis ?? {}), ...remplis } } : {}),
    };
    patch.fiche = fiche as StockItem['fiche'];
  }
  return { patch, remplis: champs, ecarts };
}

export type NiveauD277 = 'sur' | 'repris' | 'inconnu';
export type MotifFiche = 'lu' | 'catalogue' | 'retenue' | 'enLigne' | 'deduit' | 'aControler' | 'approchee' | 'ambigu' | 'horsCatalogue' | 'alphaAbsent' | 'aSaisir';
export interface NiveauChamp { niveau: NiveauD277; motif: MotifFiche; source?: string; url?: string; deduit?: string }
const vuApres = (r: Rempli, vu: string | undefined) => vu !== undefined && r.le <= vu;
const motifDePar: Readonly<Record<ParFiche, MotifFiche>> = { catalogue: 'catalogue', retenue: 'retenue', 'en-ligne': 'enLigne' };

/** Le niveau d'un champ de valeur. */
function niveauValeur(item: StockItem, champ: keyof StockItem, motifVide: MotifFiche): NiveauChamp {
  if (estVide(item, champ)) return { niveau: 'inconnu', motif: motifVide };
  const r = rempliDe(item, champ);
  if (!r) return { niveau: 'sur', motif: 'lu' };
  const f = ficheDe(item)!;
  const ref = { source: r.source, ...(r.url ? { url: r.url } : {}), ...(r.deduit ? { deduit: r.deduit } : {}) };
  if (vuApres(r, f.vu)) return { niveau: 'sur', motif: motifDePar[r.par], ...ref };
  if (r.deduit) return { niveau: 'repris', motif: 'deduit', ...ref };
  if (f.aControler) return { niveau: 'repris', motif: 'aControler', ...ref };
  if (r.niveau === 'sur') return { niveau: 'sur', motif: motifDePar[r.par], ...ref };
  return { niveau: 'repris', motif: motifDePar[r.par], ...ref };
}

/**
 * Le niveau D277 de chaque champ utile d'un article (rien si sûr ; jaune si repris ; rouge si inconnu), avec un motif CODÉ (jamais un texte :
 * l'écran l'écrit). `varieteConnue: false` dit que le catalogue des houblons est chargé et ne connaît pas la variété (`horsCatalogue`).
 */
export function niveauxDeFiche(item: StockItem, famille: Famille, options: { varieteConnue?: boolean; ambigu?: boolean } = {}): Record<string, NiveauChamp> {
  const out: Record<string, NiveauChamp> = {};
  const f = ficheDe(item);
  for (const champ of CHAMPS_UTILES[famille]) {
    if (champ === 'fiche') {
      if (!f) out.fiche = { niveau: 'inconnu', motif: options.ambigu ? 'ambigu' : famille === 'houblon' && options.varieteConnue === false ? 'horsCatalogue' : 'aSaisir' };
      else if (f.aControler) out.fiche = { niveau: 'repris', motif: 'aControler' };
      else if (f.approchee) out.fiche = { niveau: 'repris', motif: 'approchee' };
      else out.fiche = { niveau: 'sur', motif: f.par ? motifDePar[f.par] : 'catalogue' };
    } else if (champ === 'temperatures') {
      const min = niveauValeur(item, 'yeastTempMinC', 'aSaisir'), max = niveauValeur(item, 'yeastTempMaxC', 'aSaisir');
      const observees = !estVide(item, 'yeastTechnicalFacts') ? niveauValeur(item, 'yeastTechnicalFacts', 'aSaisir') : undefined;
      const pire = [min, max].find(n => n.niveau === 'inconnu') ?? [min, max].find(n => n.niveau === 'repris') ?? min;
      out.temperatures = pire.niveau === 'inconnu' && observees ? observees : pire;
    } else {
      out[champ] = niveauValeur(item, champ as keyof StockItem, champ === 'alphaPct' ? 'alphaAbsent' : 'aSaisir');
    }
  }
  return out;
}

/**
 * L'origine des faits d'un article pour une recette (P2, `factsFromStock`) : `ai` si une valeur remplie en ligne ou retenue n'a pas été vue,
 * `manufacturer` s'il ne reste que des valeurs du catalogue, `personal` sinon (les siennes, ou vues). Une fiche « à contrôler » (levure proche du
 * catalogue) n'est pas une valeur du fabricant : sa valeur de catalogue non vue sert sous `ai` (REVUE-code D4).
 */
export function origineDesValeurs(item: StockItem): 'ai' | 'manufacturer' | 'personal' {
  const f = ficheDe(item);
  if (!f?.remplis) return 'personal';
  let catalogue = false;
  for (const champ of Object.keys(f.remplis) as ChampFiche[]) {
    const r = rempliDe(item, champ);
    if (!r) continue;
    if (r.par === 'catalogue' && !(f.aControler && !vuApres(r, f.vu))) { catalogue = true; continue; }
    if (!vuApres(r, f.vu)) return 'ai';
  }
  return catalogue ? 'manufacturer' : 'personal';
}
