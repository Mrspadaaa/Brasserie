/**
 * La fiche de travail d'une levure : ses faits (catalogue effectif + faits sourcés verses), sa boisson, sa famille, sa forme,
 * son STA1. Construite une fois par levure et par contexte ; les axes et les filtres la lisent.
 */
import type { YeastCatalogueFact } from '../../../functions/src/yeastCatalogueSchema';
import { effectiveYeastCatalogueFacts, type YeastReference } from '../yeastReferences';
import faitsFichier from '../../data/levure/faitsSources.json';
import type { SourceCourte } from './contrat';
import type { Boisson, Famille } from './axes';
import { estSansAlcool, statutSta1 } from './lecture';

/** Ce que le fait verse dit, déjà structuré (niveau, POF, g/L, mots) : rien à deviner dans le texte. */
export interface LectureFait {
  niveau?: 'faible' | 'moyen' | 'eleve';
  ppm?: number;
  pof?: 'positif' | 'negatif' | 'non-declare';
  gL?: number;
  maltotrioseGL?: number;
  thiols?: 'faible' | 'moyen' | 'eleve';
  terpenes?: 'faible' | 'moyen' | 'eleve';
  betaLyase?: 'positif' | 'negatif';
  mots?: string[];
  ancien?: boolean;
  tableau?: boolean;
  etude?: boolean;
  parAnalogie?: boolean;
}

export interface Fait {
  cle: string;
  /** Texte de la source (anglais le plus souvent). */
  reported: string;
  fr?: string;
  range?: { min: number; max: number };
  unite?: string;
  /** Qualité de la source : fabricant et étude 3, revue 2, observation 1 ; −1 pour une fiche ancienne ; +0,5 pour un fait verse et relu. */
  prio: number;
  verse: boolean;
  source: SourceCourte;
  lecture?: LectureFait;
}

export interface Fiche {
  ref: YeastReference;
  id: string;
  labo: string;
  faits: Fait[];
  parCle: Map<string, Fait[]>;
  boisson: Boisson;
  famille: Famille;
  forme: 'seche' | 'liquide' | null;
  sta1: 'pos' | 'neg' | null;
  sansAlcool: boolean;
  /** Nom, arômes, styles et faits d'arôme : le texte que les descripteurs lisent. */
  descripteur: string;
  /** Lue au plus près des comptes de la passe 4 des maquettes (option `maquette`). */
  passe4: boolean;
  /** Les valeurs d'axe déjà lues (rempli par valeurs.ts). */
  lu: Map<string, unknown>;
  stylesDocumentes: boolean;
}

const KIND: Record<string, { prio: number; mot: string }> = {
  manufacturer: { prio: 3, mot: 'fiche' }, research: { prio: 3, mot: 'étude' }, study: { prio: 3, mot: 'étude' },
  review: { prio: 2, mot: 'revue' }, observation: { prio: 1, mot: 'observation' }
};

const normeMaison = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();
/** L'auteur d'une source est-il la maison du fabricant ? « Lallemand Brewing » et « Lallemand Brewing™ » oui ; « White Labs » sous une LalBrew non. */
export function auteurEstFabricant(auteur: string, fabricant: string): boolean {
  const a = normeMaison(auteur), f = normeMaison(fabricant);
  if (!a || !f) return false;
  if (a === f) return true;
  const mots = (x: string) => x.split(' ').filter((w) => w.length > 3);
  return mots(f).some((w) => mots(a).includes(w));
}

/** Les faits d'une fiche dont l'auteur est une autre maison que le fabricant (page d'un revendeur qui décrit le produit). */
export function faitsMalAttribues(ref: YeastReference): YeastCatalogueFact[] {
  const labo = ref.catalogue?.manufacturer;
  if (!labo) return [];
  return (ref.catalogue?.facts ?? []).filter((f) => f.source.kind === 'manufacturer' && !auteurEstFabricant(f.source.author, labo));
}

const sourceDeFait = (f: YeastCatalogueFact, labo: string): SourceCourte => {
  const k = KIND[f.source.kind]?.mot ?? 'source';
  const auteur = (f.source.author && f.source.author.length <= 40 ? f.source.author : labo).replace(/\s+/g, ' ').trim();
  return { libelle: `${auteur} · ${k}`, ...(f.source.reference && /^https?:/.test(f.source.reference) ? { url: f.source.reference } : {}) };
};

interface FaitVerse {
  yeastId: string; key: string; reported: string; fr: string; sourceKind: string;
  source: { libelle: string; reference: string }; lecture: LectureFait;
}
const versesParId = new Map<string, FaitVerse[]>();
for (const f of [...(faitsFichier.faits as FaitVerse[]), ...(faitsFichier.complements as FaitVerse[])]) {
  const l = versesParId.get(f.yeastId) ?? []; l.push(f); versesParId.set(f.yeastId, l);
}
/** Les faits sourcés verses pour une levure (vide si le contexte les écarte). */
export const faitsVersesDe = (id: string): readonly FaitVerse[] => versesParId.get(id) ?? [];
export const NB_FAITS_VERSES = faitsFichier.faits.length;

/** `brut` : le catalogue tel que collecté, sans les remplacements revus (comptes de la passe 4 des maquettes). */
export function lireFaits(ref: YeastReference, avecVerses: boolean, brut = false): Fait[] {
  const labo = ref.catalogue?.manufacturer ?? '';
  const vus = new Set<string>();
  const faits: Fait[] = [];
  const labo0 = ref.catalogue?.manufacturer;
  for (const f of brut ? ref.catalogue?.facts ?? [] : effectiveYeastCatalogueFacts(ref)) {
    const cle = JSON.stringify([f.key, f.reported, f.context, f.range]);
    if (vus.has(cle)) continue;
    vus.add(cle);
    // Une page de revendeur qui décrit le produit (White Labs ou Escarpment Labs sous une LalBrew) n'est pas la fiche du fabricant :
    // son texte n'est jamais attribué au fabricant ni affiché sous son nom (VERDICT-port M3). Le catalogue brut des maquettes la garde.
    if (!brut && labo0 && f.source.kind === 'manufacturer' && !auteurEstFabricant(f.source.author, labo0)) continue;
    faits.push({
      cle: f.key, reported: f.reported, ...(f.range ? { range: { min: f.range.min, max: f.range.max } } : {}), ...(f.unit ? { unite: f.unit } : {}),
      prio: KIND[f.source.kind]?.prio ?? 1, verse: false, source: sourceDeFait(f, labo)
    });
  }
  if (avecVerses) {
    for (const v of faitsVersesDe(ref.id)) {
      faits.push({
        cle: v.key, reported: v.reported, fr: v.fr, prio: (KIND[v.sourceKind]?.prio ?? 3) + 0.5 - (v.lecture.ancien ? 1 : 0), verse: true,
        source: { libelle: v.source.libelle, url: v.source.reference }, lecture: v.lecture
      });
    }
  }
  return faits;
}

// ─── Boisson : bière par défaut ; vin, cidre et distillerie repérés par le fabricant, le nom et les catégories (estimé) ───

const FABRICANTS_NON_BIERE = new Set(['Lallemand Wine', 'AB Biotek / Maurivin', 'AEB', 'Lallemand Distilling', 'AB Biotek / Pinnacle']);
const NOM_NON_BIERE = /Œno|Spirit|Cider|Mead|Coffee|Kvas|Sorghum|Teq|wine|saké|sake\b|malolactic|sparkling|cidre|hydromel|fortified|^4[0-9]{3}\b/i;
/** Noms que la passe 4 ne voyait pas (hors option `maquette`). */
const NOM_NON_BIERE_PLUS = /champagne/i;
const CATEGORIES_NON_BIERE = new Set(['yeast: wine/mead/cider', 'distilling', 'distilling yeast', 'wine yeast', 'champagne yeast', 'dry wine yeast', 'winemaking yeast']);
/**
 * Une catégorie de catalogue range la levure hors de la bière seulement si aucune autre catégorie ne la range en bière :
 * White Labs liste WLP001 (California Ale) aussi sous « Wine/Mead/Cider ». Lallemand Brewing est exemptée (CBC-1 refermente la bière).
 */
const SIGNE_BIERE = /\b(?:ale|lager|beer|belgian|wheat|specialty|brewing|sour|kveik|saison|stout|ipa|hybrid)\b/i;
const categorieNonBiere = (ref: YeastReference) => {
  const cats = (ref.catalogue?.categories ?? []).map((c) => c.trim());
  return ref.catalogue?.manufacturer !== 'Lallemand Brewing'
    && cats.some((c) => CATEGORIES_NON_BIERE.has(c.toLowerCase())) && !cats.some((c) => SIGNE_BIERE.test(c));
};

export function boissonDe(ref: YeastReference, parCategories = true): Boisson {
  const m = ref.catalogue?.manufacturer ?? '';
  const nom = ref.name.replace(/^Wyeast · /, '');
  const nonBiere = FABRICANTS_NON_BIERE.has(m) || NOM_NON_BIERE.test(nom) || (parCategories && NOM_NON_BIERE_PLUS.test(nom)) || (parCategories && categorieNonBiere(ref));
  if (!nonBiere) return 'biere';
  if (/Distill|Pinnacle/.test(m) || /Spirit|whisk|rum/i.test(nom)) return 'distillerie';
  if (/Cider|Mead|cidre|hydromel/i.test(nom)) return 'cidre';
  if (/Coffee|Kvas|Sorghum|Teq/i.test(nom)) return 'autre';
  return 'vin';
}

// ─── Famille : espèce, usage et nom (estimé tant qu'aucun champ normalisé n'existe) ───

const NOM_FORT: Array<[Famille, RegExp]> = [
  ['ble', /\bw-?68\b|\bwb-?06\b|\bwlp300\b|\bwlp380\b|\b3068\b|\b3638\b|\b3333\b|\bm20\b|weizen|weiss|hefe|witbier|\bwit\b|blanche|wheat/i],
  ['belge', /abbaye|abbey|trappist|tripel|dubbel|\bbe-?256\b|\bbe-?134\b|belgia|belgian/i],
  ['anglaise', /nottingham|windsor|\bs-?04\b|london|ringwood|\benglish\b|\bbritish\b|\bbritannique\b/i]
];
export function familleDe(ref: YeastReference, texte: string): Famille {
  const t = texte.toLowerCase();
  if (/brett/.test(t)) return 'brett';
  if (/lacto|pedio|bacter/.test(t)) return 'bacteries';
  if (/kveik|kviek|voss|hornindal/.test(t)) return 'kveik';
  if (/blend|mélange/.test(t)) return 'melange';
  if (/pastorianus|lager|pils/.test(t)) return 'lager';
  if (/saison|farmhouse/.test(t)) return 'saison';
  const nom = `${ref.name} ${ref.catalogue?.productCode ?? ''}`;
  for (const [f, re] of NOM_FORT) if (re.test(nom)) return f;
  if (/weizen|hefe|wheat|\bwit\b|blanche/.test(t)) return 'ble';
  if (/belg|abbey|abbaye|trappist|tripel/.test(t)) return 'belge';
  if (/english|british|london|irish|scottish|bitter|\besb\b/.test(t)) return 'anglaise';
  return 'ale';
}

const CLES_ARÔME = ['aroma', 'styles', 'esters', 'pof', 'biotransformation', 'betaLyase'];
const CLES_FAMILLE = ['aroma', 'species', 'application', 'styles', 'form'];

export function construireFiche(ref: YeastReference, avecVerses: boolean, mode: { categories: boolean; brut: boolean } = { categories: true, brut: false }): Fiche {
  const faits = lireFaits(ref, avecVerses, mode.brut);
  const parCle = new Map<string, Fait[]>();
  for (const f of faits) { const l = parCle.get(f.cle) ?? []; l.push(f); parCle.set(f.cle, l); }
  const labo = ref.catalogue?.manufacturer ?? '';
  const texteFamille = [ref.name, labo, ...(ref.catalogue?.categories ?? []), ...faits.filter((f) => CLES_FAMILLE.includes(f.cle)).map((f) => f.reported)].join(' ');
  const texteForme = (parCle.get('form') ?? []).map((f) => f.reported).join(' ');
  const forme: Fiche['forme'] = ref.form === 'sèche' ? 'seche' : ref.form === 'liquide' ? 'liquide'
    : /sèche|\bdry\b/i.test(texteForme) ? 'seche' : /liquid|liquide|culture/i.test(texteForme) ? 'liquide' : null;
  const sta1Textes = [...(parCle.get('sta1') ?? []), ...(parCle.get('diastatic') ?? [])].map((f) => f.reported);
  const sta1 = statutSta1(sta1Textes) ?? (/diastaticus/i.test(texteFamille) ? 'pos' : null);
  return {
    ref, id: ref.id, labo, faits, parCle,
    boisson: boissonDe(ref, mode.categories), famille: familleDe(ref, texteFamille), forme, sta1,
    sansAlcool: estSansAlcool(texteFamille),
    // Un pof « non déclaré » est une absence, pas un arôme : son texte ne se lit pas comme un descripteur.
    descripteur: [ref.name, ...faits.filter((f) => CLES_ARÔME.includes(f.cle) && f.lecture?.pof !== 'non-declare').map((f) => `${f.reported} ${f.fr ?? ''}`)].join(' '),
    passe4: mode.brut,
    lu: new Map(), stylesDocumentes: (parCle.get('styles') ?? []).length > 0
  };
}
