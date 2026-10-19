// Moteur « pouvoir aromatique » (work/refonte-frontend/v4/ecran-1/fils19-choix/MOTEUR-POUVOIR.md ;
// recherche H §1, §7, §8). Par ajout et par recette : charge introduite, part retrouvée en bière,
// concentration et rapport au seuil, toujours en plage, avec leur base, leurs sources et leur niveau
// ([P] publié, [F] fabricant, [S] secondaire, [H] hypothèse du pilote).
// Jamais une intensité 0–100 : le « pouvoir aromatique » est une lecture ordinale des rapports au seuil
// (sous, autour, au-dessus ×N), et le signal d'une famille est le rapport au seuil de son marqueur
// dominant. Aucun chiffre hors de H ou du dépôt (data/composes-houblon.json) : une valeur absente est
// null avec sa raison, jamais 0. Pas de courbe inventée (durée, alcool, dose : plages entre mesures).
import dataFile from '../../data/composes-houblon.json';
import bandsFile from '../../data/style-bands.json';
import { POLICY, hopRef } from './data';
import { FAMILIES, FAMILY_NAMES, type FamilyId } from './families';
import { MOMENTS, additionIbu, type Addition, type MomentId, type Recipe } from './recipe';

// ---------- Types publics ----------
export type Niveau = 'P' | 'F' | 'S' | 'H';
export type ComposeId = 'myrcene' | 'linalol' | 'geraniol' | 'humulene' | 'caryophyllene' | 'farnesene' | '4MMP' | '3MH' | '3M4MP';
export const TERPENES: ComposeId[] = ['myrcene', 'linalol', 'geraniol', 'humulene', 'caryophyllene', 'farnesene'];
export const THIOLS: ComposeId[] = ['4MMP', '3MH', '3M4MP'];
export const COMPOSES: ComposeId[] = [...TERPENES, ...THIOLS];
/** Les cinq moments de la spécification, dans l'ordre du brassage. */
export const MOMENTS_POUVOIR: MomentId[] = ['b60', 'b10', 'wp', 'dryActive', 'dryPost'];
/** « Facteur élevé » au-dessus du seuil pour le drapeau « hors du style » : convention du prototype
 * [H], un ordre de grandeur ; aucune source ne relie un rapport au seuil à « faible ». À fixer par le brasseur. */
export const FACTEUR_ELEVE = 10;
export const MENTION_RAPPORT = 'Rapport au seuil, pas une intensité perçue.';
export const MENTION_SIGNAL = 'Signal de famille : rapport au seuil du marqueur dominant, en plage ; ni une intensité 0–100, ni une perception.';
export const BASE_COMMUNE = 'hopsteiner-2024';
export const POUVOIR_RULE = [
  'Charge = dose × huile × fraction × densité (µg/L) ; thiols : dose × teneur (ng/L). Plage = de la plus petite à la plus grande valeur publiée.',
  'Part retrouvée en bière selon le moment et sa base (H §8.2) ; concentration = charge × part ; rapport au seuil = concentration ÷ seuil (H §8.1), en plage.',
  'Repère central = produit et quotient des milieux de plage : ni une moyenne, ni une espérance.',
  'Lecture ordinale : sous le seuil (borne haute < 1), au-dessus (borne basse > 1), autour sinon ; jamais une intensité.',
  'Ajouts successifs : charges et concentrations additionnées composé par composé ; ordre, synergie et masquage inconnus.',
  `Face au style : « hors du style » si la borne basse dépasse ×${FACTEUR_ELEVE}, « peut-être » si le repère central la dépasse (convention du prototype [H]).`,
];

export interface Plage {
  min: number | null; max: number | null; central: number | null;
  /** La borne basse ignore un terme inconnu (positif) : la vraie valeur est au-dessus. */
  minAuMoins?: true;
  /** Le repère central ignore un terme sans repère (positif) : le vrai repère est au-dessus. */
  centralAuMoins?: true;
}
export interface SourceRef { cle: string; titre: string; url: string; annee: number | null; anneeNote?: string; niveau: Niveau; lecture: string | null }
/** Une grandeur calculée ou relevée : plage (null = inconnue), base, sources, niveau, hypothèses. */
export interface Grandeur {
  plage: Plage | null; unite: string; base: string; niveau: Niveau | null;
  sources: SourceRef[]; hypotheses: string[];
  /** Raison d'une plage absente ou d'une borne inconnue ; null si tout est connu. */
  inconnu: string | null;
}
export interface SeuilApplique { libelle: string; plage: Plage; unite: string; type: string; matrice: string; abv: number | null; facteurAlcool: Plage | null; niveau: Niveau | null; sources: SourceRef[] }
export interface Lecture { classe: 'sous le seuil' | 'autour du seuil' | 'au-dessus du seuil' | 'inconnu'; facteur: Plage | null; texte: string }
export interface Drapeau { id: string; titre: string; statut: string; pourquoi: string; sources: SourceRef[]; ajout?: string }

export interface BaseCommune { base: string; teneur: Grandeur; charge: Grandeur; concentration: Grandeur; rapport: Grandeur; rapportParSeuil: { seuil: string; plage: Plage | null }[]; lecture: Lecture }
export interface PouvoirCompose {
  compose: ComposeId; nom: string; type: 'terpene' | 'thiol';
  teneur: Grandeur; charge: Grandeur;
  transfert: Grandeur; transfertParBase: Grandeur[];
  concentration: Grandeur; concentrationParBase: Grandeur[];
  seuil: Grandeur; seuils: SeuilApplique[];
  rapport: Grandeur; rapportParSeuil: { seuil: string; plage: Plage | null }[];
  lecture: Lecture;
  /** Thiols : même calcul sur la seule base commune (Hopsteiner 2024, une méthode, 97 variétés). */
  baseCommune: BaseCommune | null;
  lotsHorsPlage: string[]; notes: string[];
}
export interface MarqueurFamille {
  compose: ComposeId; nom: string; sens: string; via: string | null;
  lienNiveau: Niveau | null; lienSources: SourceRef[];
  rapport: Plage | null; niveau: Niveau | null; inconnu: string | null;
  concentration: Plage | null; rapportBaseCommune: Plage | null; concentrationBaseCommune: Plage | null;
}
/** Signal d'une famille : rapport au seuil de son marqueur dominant (plage). Pas une intensité 0–100. */
export interface SignalFamille {
  famille: FamilyId; nom: string;
  signal: Plage | null; lecture: Lecture; dominant: ComposeId | null;
  niveau: Niveau | null; lienNiveau: Niveau | null;
  signalBaseCommune: Plage | null;
  marqueurs: MarqueurFamille[];
  /** Marqueurs reliés dont le rapport est inconnu : le signal de la famille peut être plus haut. */
  incomplet: string[];
  inconnu: string | null; mention: string;
}
export interface LecturePouvoir {
  mention: string;
  dominant: { compose: ComposeId; nom: string; rapport: Plage; lecture: Lecture; niveau: Niveau | null } | null;
  composes: { compose: ComposeId; nom: string; lecture: Lecture; niveau: Niveau | null }[];
  style: { code: string; nom: string | null; attendu: string | null; citation: string | null; sources: SourceRef[] };
  faceAuStyle: { statut: 'hors du style' | 'peut-être hors du style' | 'au-dessus du seuil, facteur < N' | 'autour du seuil' | 'sous le seuil' | 'inconnu' | 'non évalué'; texte: string; composes: ComposeId[] };
  famillesNonDecrites: FamilyId[];
  facteurEleve: { valeur: number; convention: string };
  biereNoire: string | null;
}
export interface PouvoirAjout {
  id: string; houblon: string; nom: string; donnees: string | null;
  moment: MomentId; momentLabel: string; doseGL: number;
  jour: number | null; dureeJours: number | null; temperatureC: number | null; forme: string; lot: string | null;
  huile: Grandeur; chargeHuile: Grandeur;
  composes: Record<ComposeId, PouvoirCompose>;
  familles: Record<FamilyId, SignalFamille>;
  pouvoir: LecturePouvoir;
  amertume: { alpha: { valeur: number; min: number; max: number; source: string } | null; ibu: { valeur: number; min: number; max: number } | null; lecture: string | null };
  classeHopsteiner: { classe: string; texte: string; sources: SourceRef[] }[];
  drapeaux: Drapeau[]; hypotheses: string[]; mention: string;
}
export interface PouvoirComposeRecette {
  compose: ComposeId; nom: string;
  charge: Grandeur; concentration: Grandeur; rapport: Grandeur; rapportParSeuil: { seuil: string; plage: Plage | null }[]; lecture: Lecture;
  baseCommune: { concentration: Grandeur; rapport: Grandeur; lecture: Lecture } | null;
  parAjout: { ajout: string; houblon: string; concentration: Plage | null; inconnu: string | null }[];
}
export interface PouvoirRecette {
  recette: string; style: string; abv: { plage: [number, number] | null; base: string };
  levure: { id: string | null; nom: string | null; documentee: boolean };
  ajouts: PouvoirAjout[];
  composes: Record<ComposeId, PouvoirComposeRecette>;
  familles: Record<FamilyId, SignalFamille>;
  pouvoir: LecturePouvoir;
  doseACruGL: number;
  contact: { debut: number | null; fin: number | null; jours: number | null; texte: string };
  drapeaux: Drapeau[]; mention: string;
}

/** Ajout du moteur : un ajout du prototype, plus la durée de contact, la température, la forme, le lot. */
export interface AjoutPouvoir extends Addition {
  /** Durée de contact d'un dry hop, en jours ; `day` (hérité) est le jour de début (J+n). */
  dureeJours?: number;
  temperatureC?: number;
  forme?: 'T90' | 'cryo' | 'inconnue';
  /** Lot du fichier (certificat ou échantillon publié) : remplace la plage variétale pour ce qu'il mesure. */
  lot?: string;
  hsi?: number;
}
export interface RecettePouvoir extends Recipe {
  additions: AjoutPouvoir[];
  /** Garde de la bière finie (vieillissement) : température et durée. */
  garde?: { temperatureC: number; mois: number };
}

// ---------- Données ----------
type Borne = number | null;
interface Entree { plage?: [Borne, Borne]; selonDose?: [number, number][]; texte?: string; sources: string[]; portee?: string; base?: string; origine?: string; aConfirmer?: boolean; hypothese?: string; suppose?: boolean; abv?: number; sertAuFacteurAlcool?: boolean; type?: string; matrice?: string; raison?: string }
interface Info { texte: string; sources: string[]; classe?: string; hsi?: number }
interface Valeurs { valeurs: Entree[] | null; raison?: string; nonDetecte?: Info[]; nonRetenus?: Entree[]; indices?: Info[] }
interface Lot { id: string; sources: string[]; recolte: number | null; huile?: number; hsi?: number; uniteFractions?: string | null; fractionsTexte?: string; texte?: string; composes?: Partial<Record<ComposeId, number>> }
interface Mesure { id: string; compose: ComposeId; plage: [number, number]; unite: string; doseGL: number; moment: MomentId; dureeJours?: number; texte: string; momentNote?: string; sources: string[] }
interface Variete { nom: string; forme: string; origine: string; huile: Valeurs; composes: Record<ComposeId, Valeurs>; lots?: Lot[]; classeHopsteiner?: Info[]; precurseurs?: Info[]; mesuresEnBiere?: Mesure[]; hsi?: Info[]; autres?: Info[]; panel?: Info[] }
interface Levure { nom: string; betaLyase: string; betaGlucosidase: string; pof: string; esters: string; diastaticus: string; attenuation: string; biotransformation: string; geraniolCitronellol: string | null; notes: string[]; sources: string[] }
const D = dataFile as unknown as {
  sources: Record<string, Omit<SourceRef, 'cle'>>;
  composes: Record<ComposeId, { nom: string; classe: string; type: 'terpene' | 'thiol' }>;
  varietes: Record<string, Variete>;
  densites: Record<string, { plage: [number, number]; texte: string; note: string; sources: string[] }>;
  seuils: Record<string, { unite: string; valeurs: Entree[] | null; raison?: string }>;
  alcool: Record<string, { facteur?: number; deAbv?: number; aAbv?: number; texte: string; sources: string[] }> & { forme: string };
  transferts: Record<string, { tardif?: Entree[]; dryHop?: Entree[]; chaud?: (Entree & { minutes: number; temperatureC: number; perte: number })[] | Info; raison?: string }>;
  duree: Record<string, Info & { jours?: number }>;
  saturation: { zone: [number, number]; texte: string; portee: string; sources: string[]; complement: Info };
  ajoutsSuccessifs: Record<string, Info>;
  hopCreep: { texte: string; chiffres: Info[]; nonTrouve: string };
  biotransformation: Record<string, Info>;
  levures: Record<string, Levure>;
  vieillissement: (Info & { id: string; famille: string; conditions: string })[];
  hsi: { classes: { de: Borne; a: Borne; hsi: string; transformation: string }[]; texte: string; sources: string[] };
  styles: Record<string, { nom: string; abv: [number, number]; arome: string; attendu: string; familles: FamilyId[]; masquage: string; melanoidines: string; sources: string[] }>;
  biereNoire: { styles: string[]; texte: string; sources: string[] };
  familles: { liens: { compose: ComposeId; familles: FamilyId[]; sens: string; via?: string; sources: string[] }[] };
};
const BANDS = bandsFile as unknown as { styles: Record<string, { name?: string; statements?: { field: string; quote: string }[] }> };
export const DONNEES_POUVOIR = D;

// ---------- Outils ----------
const RANG: Record<Niveau, number> = { P: 3, F: 2, S: 1, H: 0 };
const plusFaible = (ns: (Niveau | null | undefined)[]): Niveau | null => ns.reduce<Niveau | null>((a, n) => (!n ? a : !a || RANG[n] < RANG[a] ? n : a), null);
const plusFort = (ns: (Niveau | null | undefined)[]): Niveau | null => ns.reduce<Niveau | null>((a, n) => (!n ? a : !a || RANG[n] > RANG[a] ? n : a), null);
const uniq = <T>(xs: T[]) => [...new Set(xs)];
const uniqSources = (xs: SourceRef[]) => [...new Map(xs.map((s) => [s.cle, s])).values()];
export function source(cle: string): SourceRef {
  const s = D.sources[cle];
  if (!s) throw Error(`Source inconnue dans composes-houblon.json : ${cle}`);
  return { cle, ...s, lecture: s.lecture ?? null };
}
const refs = (cles: string[]) => uniqSources(cles.map(source));
const niveauDe = (cles: string[]) => plusFaible(cles.map((c) => source(c).niveau));
const pl = (min: Borne, max: Borne): Plage => ({ min, max, central: min != null && max != null ? (min + max) / 2 : null });
const nom = (c: ComposeId) => D.composes[c].nom;
const uniteTeneur = (c: ComposeId) => (D.composes[c].type === 'thiol' ? 'µg/kg' : '% de l’huile');
const uniteConc = (c: ComposeId) => (D.composes[c].type === 'thiol' ? 'ng/L' : 'µg/L');
const fr = (x: number, n = 2) => (Math.abs(x) >= 100 ? Math.round(x).toLocaleString('fr-CH') : x.toLocaleString('fr-CH', { maximumSignificantDigits: n }));
export function texte(p: Plage | null, unite = ''): string {
  if (!p) return 'inconnu';
  const u = unite ? ` ${unite}` : '';
  if (p.min != null && p.max != null) return p.min === p.max ? `${fr(p.min)}${u}` : `${fr(p.min)}–${fr(p.max)}${u}`;
  if (p.min != null) return `≥ ${fr(p.min)}${u}${p.minAuMoins ? ' (au moins)' : ''}, borne haute inconnue`;
  if (p.max != null) return `≤ ${fr(p.max)}${u}, borne basse inconnue`;
  return 'inconnu';
}
function inconnue(unite: string, base: string, raison: string, sources: SourceRef[] = []): Grandeur {
  return { plage: null, unite, base, niveau: null, sources, hypotheses: [], inconnu: raison };
}
const constante = (x: number, unite: string, base: string): Grandeur => ({ plage: { min: x, max: x, central: x }, unite, base, niveau: null, sources: [], hypotheses: [], inconnu: null });

interface Item { min: Borne; max: Borne; niveau: Niveau | null }
/** Enveloppe de plages publiées (voir conventions.enveloppe du fichier). Les items sans aucune borne sont exclus. */
function enveloppe(items: Item[]): { plage: Plage; niveau: Niveau | null; inconnu: string | null } {
  const xs = items.filter((i) => i.min != null || i.max != null);
  const lows = xs.filter((i) => i.min != null), highs = xs.filter((i) => i.max != null);
  let min: Borne = lows.length ? Math.min(...lows.map((i) => i.min!)) : null;
  let max: Borne = highs.length ? Math.max(...highs.map((i) => i.max!)) : null;
  for (const i of xs) {
    if (i.min == null && min != null && i.max! < min) min = null;
    if (i.max == null && max != null && i.min! > max) max = null;
  }
  const nMin = min != null ? plusFort(lows.filter((i) => i.min === min).map((i) => i.niveau)) : plusFaible(xs.filter((i) => i.min == null).map((i) => i.niveau));
  const nMax = max != null ? plusFort(highs.filter((i) => i.max === max).map((i) => i.niveau)) : plusFaible(xs.filter((i) => i.max == null).map((i) => i.niveau));
  const pourquoi = [min == null ? 'borne basse non publiée' : '', max == null ? 'borne haute non publiée' : ''].filter(Boolean).join(' ; ');
  return { plage: pl(min, max), niveau: plusFaible([nMin, nMax]), inconnu: pourquoi || null };
}
function enveloppeG(gs: Grandeur[], unite: string, base: string): Grandeur {
  const ok = gs.filter((g) => g.plage && (g.plage.min != null || g.plage.max != null));
  if (!ok.length) return inconnue(unite, base, uniq(gs.map((g) => g.inconnu).filter(Boolean)).join(' ; ') || 'aucune valeur');
  const e = enveloppe(ok.map((g) => ({ min: g.plage!.min, max: g.plage!.max, niveau: g.niveau })));
  return { plage: e.plage, unite, base, niveau: e.niveau, sources: uniqSources(ok.flatMap((g) => g.sources)), hypotheses: uniq(ok.flatMap((g) => g.hypotheses)), inconnu: e.inconnu };
}
/** Produit de grandeurs positives × k ; une borne inconnue d'un facteur rend la borne du produit inconnue. */
function produit(parts: Grandeur[], k: number, unite: string, base: string): Grandeur {
  const sources = uniqSources(parts.flatMap((p) => p.sources)), hypotheses = uniq(parts.flatMap((p) => p.hypotheses));
  const manque = parts.find((p) => !p.plage);
  if (manque) return { plage: null, unite, base, niveau: null, sources, hypotheses, inconnu: manque.inconnu };
  const mul = (xs: Borne[]) => (xs.some((x) => x == null) ? null : xs.reduce<number>((s, x) => s * x!, k));
  const ps = parts.map((p) => p.plage!);
  const plage: Plage = { min: mul(ps.map((p) => p.min)), max: mul(ps.map((p) => p.max)), central: mul(ps.map((p) => p.central)) };
  return { plage, unite, base, niveau: plusFaible(parts.map((p) => p.niveau)), sources, hypotheses, inconnu: uniq(parts.map((p) => p.inconnu).filter(Boolean)).join(' ; ') || null };
}
function quotient(c: Plage, s: Plage): Plage {
  return { min: c.min != null && s.max != null ? c.min / s.max : null, max: c.max != null && s.min != null ? c.max / s.min : null,
    central: c.central != null && s.central != null ? c.central / s.central : null,
    ...(c.minAuMoins ? { minAuMoins: true as const } : {}), ...(c.centralAuMoins ? { centralAuMoins: true as const } : {}) };
}
/** Somme de grandeurs (ajouts successifs) : une concentration inconnue rend la borne haute inconnue ;
 * la borne basse et le repère central deviennent « au moins » (termes connus seulement), jamais un zéro. */
function somme(gs: Grandeur[], unite: string, base: string): Grandeur {
  const sources = uniqSources(gs.flatMap((g) => g.sources)), hypotheses = uniq(gs.flatMap((g) => g.hypotheses));
  const known = gs.filter((g) => g.plage);
  const raisons = uniq(gs.map((g) => g.inconnu).filter(Boolean)).join(' ; ') || null;
  if (!known.length) return { plage: null, unite, base, niveau: null, sources, hypotheses, inconnu: raisons };
  const partiel = known.length < gs.length || known.some((g) => g.plage!.min == null);
  const mins = known.map((g) => g.plage!.min).filter((x): x is number => x != null);
  const min = mins.length ? mins.reduce((s, x) => s + x, 0) : null;
  const max = known.length === gs.length && known.every((g) => g.plage!.max != null) ? known.reduce((s, g) => s + g.plage!.max!, 0) : null;
  const centraux = known.map((g) => g.plage!.central).filter((x): x is number => x != null);
  const central = centraux.length ? centraux.reduce((s, x) => s + x, 0) : null;
  const centralPartiel = centraux.length < gs.length || known.some((g) => g.plage!.centralAuMoins);
  if (min == null && max == null && central == null) return { plage: null, unite, base, niveau: null, sources, hypotheses, inconnu: raisons ?? 'aucune borne connue' };
  const plage: Plage ={ min, max, central, ...(partiel && min != null ? { minAuMoins: true as const } : {}), ...(centralPartiel && central != null ? { centralAuMoins: true as const } : {}) };
  return { plage, unite, base, niveau: plusFaible(known.map((g) => g.niveau)), sources, hypotheses, inconnu: raisons };
}
export function lire(p: Plage | null): Lecture {
  if (!p || (p.min == null && p.max == null)) return { classe: 'inconnu', facteur: null, texte: 'rapport au seuil inconnu' };
  const f = (x: number) => `×${fr(x)}`;
  if (p.max != null && p.max < 1) return { classe: 'sous le seuil', facteur: p, texte: `sous le seuil : ${p.min != null ? `${f(p.min)} à ` : 'au plus '}${f(p.max)}` };
  if (p.min != null && p.min > 1) return { classe: 'au-dessus du seuil', facteur: p, texte: `au-dessus du seuil : ${f(p.min)}${p.minAuMoins ? ' au moins' : ''}${p.max != null ? ` à ${f(p.max)}` : ', borne haute inconnue'}` };
  return { classe: 'autour du seuil', facteur: p, texte: `autour du seuil : ${p.min != null ? f(p.min) : 'borne basse inconnue'} à ${p.max != null ? f(p.max) : 'borne haute inconnue'} (selon la source du seuil et la base)` };
}

// ---------- Teneurs ----------
function teneurDe(v: Valeurs | undefined, unite: string, quoi: string, filtre?: (e: Entree) => boolean): Grandeur {
  if (!v || !v.valeurs) {
    const nd = (v?.nonDetecte ?? []).map((x) => x.texte);
    return inconnue(unite, quoi, [v?.raison ?? 'aucune valeur dans H ni le dépôt', ...nd].join(' ; '), refs((v?.nonDetecte ?? []).flatMap((x) => x.sources)));
  }
  const es = v.valeurs.filter((e) => e.portee !== 'lot' && (!filtre || filtre(e)));
  if (!es.length) return inconnue(unite, quoi, 'aucune valeur sur cette base');
  const env = enveloppe(es.map((e) => ({ min: e.plage![0], max: e.plage![1], niveau: niveauDe(e.sources) })));
  const origines = uniq(es.map((e) => e.origine).filter(Boolean));
  const hypotheses = [
    ...es.filter((e) => e.aConfirmer).map((e) => `valeur à confirmer : ${e.texte}`),
    ...(origines.length ? [`origines mêlées dans la plage : ${origines.join(', ')}`] : []),
  ];
  const base = `${quoi} : de la plus petite à la plus grande valeur publiée (${es.length} source${es.length > 1 ? 's' : ''}${es.some((e) => e.portee === 'littérature') ? ', dont une plage de littérature' : ''})`;
  return { plage: env.plage, unite, base, niveau: env.niveau, sources: refs(es.flatMap((e) => e.sources)), hypotheses, inconnu: env.inconnu };
}
const teneurLot = (lot: Lot, x: number, unite: string, quoi: string): Grandeur =>
  ({ plage: { min: x, max: x, central: x }, unite, base: `${quoi} : lot ${lot.id} (certificat ou échantillon publié), pas la plage variétale`, niveau: niveauDe(lot.sources), sources: refs(lot.sources), hypotheses: lot.texte ? [lot.texte] : [], inconnu: null });

function densite(c: ComposeId): Grandeur {
  const propre = D.densites[c], d = propre ?? D.densites.huile;
  return { plage: pl(d.plage[0], d.plage[1]), unite: 'g/mL', base: d.texte, niveau: propre ? null : 'H', sources: refs(d.sources), hypotheses: [d.note], inconnu: null };
}

// ---------- Moments et parts retrouvées ----------
type Categorie = { id: 'dryHop'; actif: boolean } | { id: 'tardif'; minutes: number | null; temperatureC: number; whirlpool: boolean } | { id: 'ebullition'; minutes: number };
function categorie(a: AjoutPouvoir, r: Recipe): { cat: Categorie; hypotheses: string[] } {
  if (a.moment === 'dryActive' || a.moment === 'dryPost') return { cat: { id: 'dryHop', actif: a.moment === 'dryActive' }, hypotheses: [] };
  if (a.moment === 'wp') {
    const t = a.temperatureC ?? POLICY.defaults.whirlpool.temperatureC.central;
    return { cat: { id: 'tardif', minutes: null, temperatureC: t, whirlpool: true }, hypotheses: a.temperatureC == null ? [`température du whirlpool non renseignée : préréglage du prototype (${t} °C, jugement L’Affinée)`] : [] };
  }
  const minutes = a.moment === 'fwh' ? r.boilMin : MOMENTS[a.moment].minutes!;
  return { cat: minutes <= 10 ? { id: 'tardif', minutes, temperatureC: 100, whirlpool: false } : { id: 'ebullition', minutes }, hypotheses: [] };
}
const pct = (min: Borne, max: Borne, base: string, sources: string[], niveau: Niveau | null, hypotheses: string[] = []): Grandeur =>
  ({ plage: pl(min, max), unite: '%', base, niveau, sources: refs(sources), hypotheses, inconnu: min == null && max == null ? 'inconnu' : min == null ? 'borne basse non chiffrée' : max == null ? 'borne haute non chiffrée' : null });
function selonDose(pts: [number, number][], d: number): [number, number] | null {
  const [a, b] = [...pts].sort((x, y) => x[0] - y[0]);
  if (Math.abs(d - a[0]) < 1e-9) return [a[1], a[1]];
  if (Math.abs(d - b[0]) < 1e-9) return [b[1], b[1]];
  if (d > a[0] && d < b[0]) return [Math.min(a[1], b[1]), Math.max(a[1], b[1])];
  return null;
}
const HYDROCARBURES = new Set<ComposeId>(['myrcene', 'humulene', 'caryophyllene', 'farnesene']);
const SANS_TAUX = (raison: string, sources: string[] = []) => ({ parBase: [] as Grandeur[], enveloppe: inconnue('%', 'part retrouvée en bière', raison, refs(sources)) });
function transferts(c: ComposeId, cat: Categorie, dose: number): { parBase: Grandeur[]; enveloppe: Grandeur } {
  const ligne = HYDROCARBURES.has(c) ? 'myrcene' : c;
  const emprunt = HYDROCARBURES.has(c) && c !== 'myrcene' ? [`ligne « myrcène, hydrocarbures » de H §8.2 appliquée au ${nom(c)} : aucun taux propre à ce composé`] : [];
  const t = D.transferts[ligne];
  if (!t || t.raison) return SANS_TAUX(t?.raison ?? `aucun taux de transfert du ${nom(c)} dans H §8.2`);
  if (cat.id === 'dryHop') {
    const groupes = new Map<string, Grandeur[]>();
    const horsPlage: string[] = [];
    for (const e of t.dryHop ?? []) {
      let p = e.plage;
      if (e.selonDose) {
        const r = selonDose(e.selonDose, dose);
        if (!r) { horsPlage.push(`${e.base} : mesuré de ${e.selonDose[0][0]} à ${e.selonDose[1][0]} g/L, non appliqué à ${fr(dose)} g/L`); continue; }
        p = r;
      }
      const hyp = [...emprunt];
      let niveau = niveauDe(e.sources), min = p![0];
      if (e.suppose) { hyp.push(`${e.texte} : taux supposé par la source, non mesuré`); niveau = 'H'; }
      if (cat.actif && HYDROCARBURES.has(c)) { min = null; hyp.push('fermentation active : le CO₂ et la levure emportent les hydrocarbures (myrcène), perte non chiffrée : borne basse inconnue'); }
      if (cat.actif && c === 'geraniol') { min = null; hyp.push('fermentation active : géraniol transformé (→ citronellol) et ajout tôt = moins de géraniol, non chiffré : borne basse inconnue'); }
      if (cat.actif && THIOLS.includes(c)) { niveau = 'H'; hyp.push('taux du dry hop statique transposé à la fermentation active [H] : pertes par le CO₂ et libération par la levure non chiffrées'); }
      if (!groupes.has(e.base!)) groupes.set(e.base!, []);
      groupes.get(e.base!)!.push(pct(min, p![1], e.base!, e.sources, niveau, hyp));
    }
    const parBase = [...groupes].map(([base, gs]) => enveloppeG(gs, '%', base));
    if (!parBase.length) return SANS_TAUX(horsPlage.join(' ; ') || 'aucun taux de dry hop');
    const env = enveloppeG(parBase, '%', `enveloppe des bases : ${parBase.map((g) => g.base).join(' ; ')}`);
    env.hypotheses.push(...horsPlage);
    return { parBase, enveloppe: env };
  }
  const un = (g: Grandeur) => ({ parBase: [g], enveloppe: g });
  const minutes = cat.id === 'ebullition' ? cat.minutes : null;
  const plusLong = minutes != null ? [`à ${minutes}′ : part non mesurée dans H ; un ajout plus long n’en garde pas plus qu’un ajout tardif [H]`] : [];
  if (c === 'linalol') {
    const e = t.tardif![0];
    return un(minutes == null ? pct(e.plage![0], e.plage![1], e.base!, e.sources, niveauDe(e.sources)) : pct(null, e.plage![1], `au plus la part d’un ajout tardif (${e.plage![0]}–${e.plage![1]} %)`, e.sources, 'H', plusLong));
  }
  if (c === 'geraniol' || HYDROCARBURES.has(c)) {
    const e = t.tardif![0];
    return un(pct(e.plage![0], e.plage![1], e.base!, e.sources, e.hypothese || minutes != null ? 'H' : niveauDe(e.sources), [...(e.hypothese ? [e.hypothese] : []), ...emprunt, ...plusLong]));
  }
  if (c === '4MMP') {
    const chaud = t.chaud as (Entree & { minutes: number; temperatureC: number; perte: number })[];
    const a100 = chaud.find((x) => x.temperatureC === 100)!, a90 = chaud.find((x) => x.temperatureC === 90)!;
    const hyps = ['passage du houblon au moût non chiffré (au plus complet)', 'fermentation : ni perte ni libération depuis les précurseurs comptées [H]'];
    if (cat.id === 'tardif' && cat.whirlpool) {
      const T = cat.temperatureC;
      const base = T === 90 ? `thiol libre restant dans le moût : ${a90.texte}` : T > 90
        ? `thiol libre restant : entre ${a90.texte} et ${a100.texte} ; whirlpool à ${T} °C non mesuré`
        : `thiol libre restant : repère le plus proche, ${a90.texte} ; whirlpool à ${T} °C non mesuré`;
      return un(pct(null, 100 - a90.perte, base, a90.sources, 'H', hyps));
    }
    if (cat.id === 'ebullition' && cat.minutes >= a100.minutes) return un(pct(null, 100 - a100.perte, `thiol libre restant dans le moût : ${a100.texte}`, a100.sources, 'H', hyps));
    return SANS_TAUX(`perte du 4MMP à 100 °C mesurée après ${a100.minutes} min seulement (${a100.texte}) ; à ${minutes ?? (cat.id === 'tardif' ? cat.minutes : '?')}′ non mesurée`, a100.sources);
  }
  if (c === '3MH') { const i = t.chaud as Info; return SANS_TAUX(`3MH à chaud : ${i.texte}`, i.sources); }
  return SANS_TAUX(`aucun taux à chaud du ${nom(c)} dans H §8.2`);
}

// ---------- Seuils ----------
function seuils(c: ComposeId, abv: [number, number] | null): { liste: SeuilApplique[]; enveloppe: Grandeur } {
  const s = D.seuils[c];
  const unite = s?.unite ?? uniteConc(c);
  if (!s?.valeurs) return { liste: [], enveloppe: inconnue(unite, 'seuil de perception', s?.raison ?? `aucun seuil du ${nom(c)} dans H §8.1`) };
  const fa = D.alcool[c];
  let facteur: Plage | null = null;
  const hyp: string[] = [];
  if (fa?.facteur) {
    const fMin = abv && abv[0] >= fa.aAbv! ? fa.facteur : 1, fMax = abv && abv[1] <= fa.deAbv! ? 1 : fa.facteur;
    facteur = pl(fMin, fMax);
    hyp.push(`${fa.texte} ; facteur appliqué ×${fr(fMin)}–×${fr(fMax)}${abv ? ` pour ${fr(abv[0])}–${fr(abv[1])} % vol.` : ' (degré non renseigné)'}`);
    if (fMin !== fMax) hyp.push(D.alcool.forme);
    hyp.push('les seuils sans degré indiqué sont supposés mesurés vers 5 % vol. [H]');
  }
  const garde = (e: Entree) => !e.sertAuFacteurAlcool && (fa?.facteur || e.abv == null || !abv || (e.abv <= 5 ? abv[0] < 9.3 : abv[1] > 4.9));
  const liste: SeuilApplique[] = s.valeurs.filter(garde).map((e) => {
    const p0 = pl(e.plage![0], e.plage![1]);
    const p = facteur ? { min: p0.min! * facteur.min!, max: p0.max! * facteur.max!, central: p0.central! * facteur.central! } : p0;
    return { libelle: `${e.texte ?? texte(p0, unite)} (${e.type}, ${e.matrice}${e.abv ? `, ${fr(e.abv)} % vol.` : ''})`, plage: p, unite, type: e.type!, matrice: e.matrice!, abv: e.abv ?? null, facteurAlcool: facteur, niveau: niveauDe(e.sources), sources: refs(e.sources) };
  });
  const env = enveloppe(liste.map((x) => ({ min: x.plage.min, max: x.plage.max, niveau: x.niveau })));
  return { liste, enveloppe: { plage: env.plage, unite, base: 'enveloppe des seuils publiés (types et matrices mêlés, H §8.1)', niveau: env.niveau, sources: uniqSources(liste.flatMap((x) => x.sources)), hypotheses: hyp, inconnu: env.inconnu } };
}
function rapport(conc: Grandeur, s: { liste: SeuilApplique[]; enveloppe: Grandeur }): { rapport: Grandeur; parSeuil: { seuil: string; plage: Plage | null }[] } {
  const base = 'concentration ÷ seuil ; enveloppe : plus petite concentration ÷ plus haut seuil, plus grande ÷ plus bas seuil';
  if (!conc.plage) return { rapport: inconnue('× seuil', base, conc.inconnu ?? 'concentration inconnue', conc.sources), parSeuil: [] };
  if (!s.enveloppe.plage) return { rapport: inconnue('× seuil', base, s.enveloppe.inconnu ?? 'seuil inconnu'), parSeuil: [] };
  return {
    rapport: { plage: quotient(conc.plage, s.enveloppe.plage), unite: '× seuil', base, niveau: plusFaible([conc.niveau, s.enveloppe.niveau]),
      sources: uniqSources([...conc.sources, ...s.enveloppe.sources]), hypotheses: uniq([...conc.hypotheses, ...s.enveloppe.hypotheses]), inconnu: conc.inconnu },
    parSeuil: s.liste.map((t) => ({ seuil: t.libelle, plage: quotient(conc.plage!, t.plage) })),
  };
}

// ---------- Un composé d'un ajout ----------
function calculCompose(c: ComposeId, v: Variete | null, lot: Lot | null, huile: Grandeur, dose: number, cat: Categorie, abv: [number, number] | null): PouvoirCompose {
  const type = D.composes[c].type, unite = uniteTeneur(c), uc = uniteConc(c);
  const val = v?.composes[c];
  const lotVal = lot?.composes?.[c] != null && (type === 'thiol' || lot.uniteFractions) ? lot.composes![c]! : null;
  const quoi = `teneur en ${nom(c)}`;
  const ten = !v ? inconnue(unite, quoi, 'variété absente de data/composes-houblon.json') : lotVal != null ? teneurLot(lot!, lotVal, unite, quoi) : teneurDe(val, unite, quoi);
  const dosage = constante(dose, 'g/L', 'dose de l’ajout');
  const chargeDe = (t: Grandeur) => (type === 'thiol' ? produit([dosage, t], 1, 'ng/L', 'dose × teneur en thiol libre')
    : produit([dosage, huile, t, densite(c)], 100, 'µg/L', 'dose × huile × fraction × densité'));
  const ch = chargeDe(ten);
  const tr = transferts(c, cat, dose);
  const concDe = (charge: Grandeur, t: Grandeur) => produit([charge, t], 1 / 100, uc, `charge × part retrouvée (${t.base})`);
  const conc = concDe(ch, tr.enveloppe);
  const s = seuils(c, abv);
  const r = rapport(conc, s);
  let baseCommune: BaseCommune | null = null;
  if (type === 'thiol' && lotVal == null && val?.valeurs?.some((e) => e.base === BASE_COMMUNE)) {
    const t = teneurDe(val, unite, `${quoi}, base commune`, (e) => e.base === BASE_COMMUNE);
    const chB = chargeDe(t), cB = concDe(chB, tr.enveloppe), rB = rapport(cB, s);
    baseCommune = { base: 'Hopsteiner 2024 : une méthode (LC-MS/MS), un laboratoire, 97 variétés, récoltes 2019–2023', teneur: t, charge: chB, concentration: cB, rapport: rB.rapport, rapportParSeuil: rB.parSeuil, lecture: lire(rB.rapport.plage) };
  }
  const lotsHorsPlage = (v?.lots ?? []).filter((l) => l.composes?.[c] != null && (type === 'thiol' || l.uniteFractions) && l !== lot).flatMap((l) => {
    const x = l.composes![c]!, p = ten.plage;
    return p && lotVal == null && ((p.min != null && x < p.min) || (p.max != null && x > p.max)) ? [`lot ${l.id} (${l.recolte ?? 'récolte non publiée'}) : ${fr(x)} ${unite}, hors de la plage variétale ${texte(p)}`] : [];
  });
  const notes = [
    ...(val?.indices ?? []).map((i) => i.texte),
    ...(val?.nonRetenus ?? []).map((e) => `non retenu : ${e.texte} (${e.raison})`),
    ...(val?.valeurs ? (val.nonDetecte ?? []).map((i) => i.texte) : []),
  ];
  return { compose: c, nom: nom(c), type, teneur: ten, charge: ch, transfert: tr.enveloppe, transfertParBase: tr.parBase,
    concentration: conc, concentrationParBase: tr.parBase.map((t) => concDe(ch, t)), seuil: s.enveloppe, seuils: s.liste,
    rapport: r.rapport, rapportParSeuil: r.parSeuil, lecture: lire(r.rapport.plage), baseCommune, lotsHorsPlage, notes };
}

// ---------- Familles ----------
type SourceFamille = Pick<PouvoirCompose, 'rapport' | 'concentration'> & { baseCommune?: { rapport: Grandeur; concentration: Grandeur } | null };
/** Le plus fort de deux rapports : un repère central l'emporte sur une plage sans repère ; entre deux
 * repères, le plus haut ; sans repère, la borne haute, puis la borne basse. */
const plusFortRapport = (a: Plage, b: Plage) => (a.central != null) !== (b.central != null) ? a.central != null
  : a.central != null ? a.central > b.central! : (a.max ?? a.min ?? -Infinity) > (b.max ?? b.min ?? -Infinity);
/** Signal de chaque famille : rapport au seuil du marqueur dominant (plusFortRapport). Une famille sans
 * marqueur, ou sans marqueur chiffré, est « inconnu ». */
export function signauxFamilles(composes: Partial<Record<ComposeId, SourceFamille>>): Record<FamilyId, SignalFamille> {
  return Object.fromEntries(FAMILIES.map((f) => {
    const liens = D.familles.liens.filter((l) => l.familles.includes(f));
    const marqueurs: MarqueurFamille[] = liens.map((l) => {
      const x = composes[l.compose];
      return { compose: l.compose, nom: nom(l.compose), sens: l.sens, via: l.via ?? null, lienNiveau: niveauDe(l.sources), lienSources: refs(l.sources),
        rapport: x?.rapport.plage ?? null, niveau: x?.rapport.niveau ?? null, inconnu: x?.rapport.plage ? null : (x?.rapport.inconnu ?? 'non calculé'),
        concentration: x?.concentration.plage ?? null, rapportBaseCommune: x?.baseCommune?.rapport.plage ?? null, concentrationBaseCommune: x?.baseCommune?.concentration.plage ?? null };
    });
    const chiffres = marqueurs.filter((m) => m.rapport && (m.rapport.min != null || m.rapport.max != null));
    const dom = chiffres.reduce<MarqueurFamille | null>((a, m) => (!a || plusFortRapport(m.rapport!, a.rapport!) ? m : a), null);
    const incomplet = marqueurs.filter((m) => !chiffres.includes(m)).map((m) => `${m.nom} : ${m.inconnu}`);
    const inconnu = !liens.length ? 'aucun composé marqueur relié à cette famille dans H' : !dom ? `aucun marqueur chiffré : ${incomplet.join(' ; ')}` : null;
    const s: SignalFamille = { famille: f, nom: FAMILY_NAMES[f], signal: dom?.rapport ?? null, lecture: lire(dom?.rapport ?? null), dominant: dom?.compose ?? null,
      niveau: dom?.niveau ?? null, lienNiveau: dom?.lienNiveau ?? null, signalBaseCommune: dom?.rapportBaseCommune ?? null, marqueurs, incomplet, inconnu, mention: MENTION_SIGNAL };
    return [f, s];
  })) as Record<FamilyId, SignalFamille>;
}

export type Sens = 'a au-dessus' | 'b au-dessus' | 'recouvrement' | 'inconnu';
/** Deux plages : l'une au-dessus de l'autre sans recouvrement, recouvrement, ou inconnu. */
export function sensPlages(a: Plage | null, b: Plage | null): Sens {
  if (!a || !b || (a.min == null && a.max == null) || (b.min == null && b.max == null)) return 'inconnu';
  if (a.min != null && b.max != null && a.min > b.max) return 'a au-dessus';
  if (b.min != null && a.max != null && b.min > a.max) return 'b au-dessus';
  return 'recouvrement';
}
export interface ComparaisonFamille {
  famille: FamilyId; nom: string; aDominant: ComposeId | null; bDominant: ComposeId | null;
  /** Enveloppes des signaux (l'incertitude du seuil comprise). */
  signaux: Sens;
  /** Même marqueur dominant : concentrations comparées. Dans une même bière, un même seuil divise les deux. */
  aSeuilEgal: Sens | null;
  /** Idem sur la base commune (thiols : Hopsteiner 2024). */
  baseCommune: Sens | null;
  central: { sens: 'a' | 'b' | 'égal' | null; facteur: number | null };
  texte: string;
}
export function comparerFamilles(a: { familles: Record<FamilyId, SignalFamille> }, b: { familles: Record<FamilyId, SignalFamille> }): Record<FamilyId, ComparaisonFamille> {
  return Object.fromEntries(FAMILIES.map((f) => {
    const x = a.familles[f], y = b.familles[f];
    const meme = x.dominant && x.dominant === y.dominant ? x.marqueurs.find((m) => m.compose === x.dominant)! : null;
    const my = meme ? y.marqueurs.find((m) => m.compose === y.dominant)! : null;
    const aSeuilEgal = meme ? sensPlages(meme.concentration, my!.concentration) : null;
    const baseCommune = meme && meme.concentrationBaseCommune && my!.concentrationBaseCommune ? sensPlages(meme.concentrationBaseCommune, my!.concentrationBaseCommune) : null;
    const ca = x.signal?.central ?? null, cb = y.signal?.central ?? null;
    const central = ca != null && cb != null ? { sens: (ca > cb ? 'a' : ca < cb ? 'b' : 'égal') as 'a' | 'b' | 'égal', facteur: cb > 0 ? ca / cb : null } : { sens: null, facteur: null };
    const signaux = sensPlages(x.signal, y.signal);
    const t = !x.signal || !y.signal ? `inconnu : ${[x.inconnu, y.inconnu].filter(Boolean).join(' / ')}`
      : `${signaux}${aSeuilEgal ? ` ; à seuil égal (${nom(x.dominant!)}) : ${aSeuilEgal}` : ''}${baseCommune ? ` ; base commune : ${baseCommune}` : ''}${central.facteur != null ? ` ; repère central ×${fr(central.facteur)}` : ''}`;
    return [f, { famille: f, nom: FAMILY_NAMES[f], aDominant: x.dominant, bDominant: y.dominant, signaux, aSeuilEgal, baseCommune, central, texte: t }];
  })) as Record<FamilyId, ComparaisonFamille>;
}
/** Deux ajouts ou recettes, composé par composé : concentrations (même bière, même seuil) et base commune. */
export function comparerComposes(a: { composes: Record<ComposeId, Pick<PouvoirCompose, 'concentration'> & { baseCommune?: { concentration: Grandeur } | null }> }, b: typeof a) {
  return Object.fromEntries(COMPOSES.map((c) => {
    const x = a.composes[c], y = b.composes[c];
    const ca = x.concentration.plage?.central, cb = y.concentration.plage?.central;
    return [c, { compose: c, nom: nom(c), concentration: sensPlages(x.concentration.plage, y.concentration.plage),
      baseCommune: x.baseCommune && y.baseCommune ? sensPlages(x.baseCommune.concentration.plage, y.baseCommune.concentration.plage) : null,
      facteurCentral: ca != null && cb != null && cb > 0 ? ca / cb : null }];
  })) as Record<ComposeId, { compose: ComposeId; nom: string; concentration: Sens; baseCommune: Sens | null; facteurCentral: number | null }>;
}

// ---------- Style ----------
function degre(r: Recipe): { plage: [number, number] | null; base: string } {
  if (typeof r.abv === 'number') return { plage: [r.abv, r.abv], base: 'degré de la recette' };
  const s = D.styles[r.styleCode];
  if (s) return { plage: s.abv, base: `plage du style ${r.styleCode} (BJCP 2021)` };
  return { plage: null, base: 'degré non renseigné : facteur d’alcool en plage' };
}
const biereNoire = (code: string) => (D.biereNoire.styles.includes(code) ? D.biereNoire.texte : null);
function lirePouvoir(code: string, composes: Partial<Record<ComposeId, { rapport: Grandeur }>>, familles: Record<FamilyId, SignalFamille>): LecturePouvoir {
  const N = FACTEUR_ELEVE;
  const rows = COMPOSES.filter((c) => composes[c]).map((c) => ({ compose: c, nom: nom(c), lecture: lire(composes[c]!.rapport.plage), niveau: composes[c]!.rapport.niveau, p: composes[c]!.rapport.plage }));
  const chiffres = rows.filter((r) => r.p && (r.p.min != null || r.p.max != null));
  const dom = chiffres.reduce<(typeof rows)[number] | null>((a, r) => (!a || plusFortRapport(r.p!, a.p!) ? r : a), null);
  const st = D.styles[code];
  const quote = BANDS.styles[code]?.statements?.find((s) => s.field === 'aroma')?.quote ?? null;
  const style = { code, nom: st?.nom ?? BANDS.styles[code]?.name ?? null, attendu: st?.attendu ?? null, citation: st?.arome ?? quote, sources: st ? refs(st.sources) : [] };
  let faceAuStyle: LecturePouvoir['faceAuStyle'];
  if (!st) faceAuStyle = { statut: 'non évalué', texte: `Seule la 16D est lue face au style dans ce prototype${quote ? ` ; le style dit : « ${quote} »` : ''}.`, composes: [] };
  else if (!chiffres.length) faceAuStyle = { statut: 'inconnu', texte: 'Aucun rapport au seuil chiffré.', composes: [] };
  else {
    const hors = chiffres.filter((r) => r.p!.min != null && r.p!.min >= N).map((r) => r.compose);
    // Un repère central « au moins » au-dessus de N l'est a fortiori.
    const peut = chiffres.filter((r) => !hors.includes(r.compose) && r.p!.central != null && r.p!.central >= N).map((r) => r.compose);
    const dessus = chiffres.filter((r) => r.p!.min != null && r.p!.min > 1).map((r) => r.compose);
    const attendu = `le style attend un ${st.attendu}`;
    faceAuStyle = hors.length ? { statut: 'hors du style', texte: `${hors.map(nom).join(', ')} : au-dessus du seuil d’un facteur ≥ ${N} quelle que soit la source ; ${attendu}.`, composes: hors }
      : peut.length ? { statut: 'peut-être hors du style', texte: `${peut.map(nom).join(', ')} : repère central ≥ ×${N}, borne basse en dessous ; selon la source du seuil et la base ; ${attendu}.`, composes: peut }
      : dessus.length ? { statut: 'au-dessus du seuil, facteur < N', texte: `${dessus.map(nom).join(', ')} : au-dessus du seuil d’un facteur < ${N} ; le moteur ne dit pas si c’est « faible » ; ${attendu}.`, composes: dessus }
      : chiffres.every((r) => r.p!.max != null && r.p!.max < 1) ? { statut: 'sous le seuil', texte: `Tous les composés chiffrés sous le seuil ; ${attendu}.`, composes: [] }
      : { statut: 'autour du seuil', texte: `Selon la source du seuil et la base ; ${attendu}.`, composes: [] };
  }
  const famillesNonDecrites = st ? FAMILIES.filter((f) => !st.familles.includes(f) && familles[f].lecture.classe === 'au-dessus du seuil') : [];
  return { mention: MENTION_RAPPORT, dominant: dom ? { compose: dom.compose, nom: dom.nom, rapport: dom.p!, lecture: dom.lecture, niveau: dom.niveau } : null,
    composes: rows.map(({ p: _p, ...r }) => r), style, faceAuStyle, famillesNonDecrites,
    facteurEleve: { valeur: N, convention: 'convention du prototype [H] : un ordre de grandeur au-dessus du seuil ; pas une donnée, à fixer par le brasseur' },
    biereNoire: biereNoire(code) };
}

// ---------- Drapeaux ----------
const drapeau = (id: string, titre: string, statut: string, pourquoi: string, sources: string[], ajout?: string): Drapeau => ({ id, titre, statut, pourquoi, sources: refs(sources), ...(ajout ? { ajout } : {}) });
const dit = (i: Info) => i.texte;
function drapeauxAjout(a: AjoutPouvoir, r: RecettePouvoir, v: Variete | null, composes: Record<ComposeId, PouvoirCompose>, cat: Categorie, dose: number): Drapeau[] {
  const out: Drapeau[] = [];
  const nomH = v?.nom ?? hopRef(a.hopKey)?.name ?? a.hopKey;
  const levure = D.levures[r.yeastId ?? ''] ?? null;
  if (MOMENTS[a.moment].kind === 'amertume') out.push(drapeau('amertume', 'Surtout de l’amertume à ce moment', 'à chaud', 'L’arôme d’un ajout long est peu chiffré : linalol et hydrocarbures au plus la part d’un ajout tardif, 4MMP −91 % en 60 min à 100 °C ; le moteur garde des bornes hautes, sans borne basse.', ['H30', 'H13'], a.id));
  if (cat.id !== 'dryHop') {
    out.push(drapeau('thiols-chaud', 'Thiols à chaud : pertes chiffrées, gains non chiffrés', 'non chiffré', `4MMP : ${(D.transferts['4MMP'].chaud as Info[]).map(dit).join(' ; ')}. 3MH : ${(D.transferts['3MH'].chaud as Info).texte}. Libération par la levure en fermentation non comptée.`, ['H13'], a.id));
    return out;
  }
  // Durée de contact (H §7.2) : pas de courbe.
  const j = a.dureeJours;
  if (j == null) out.push(drapeau('duree', 'Durée de contact non renseignée', 'non renseignée', D.duree.essentiel24h.texte, D.duree.essentiel24h.sources, a.id));
  else if (j < 1) out.push(drapeau('duree-courte', 'Moins de 24 h : extraction peut-être incomplète', `${fr(j)} j`, `${D.duree.essentiel24h.texte} ${D.duree.agite.texte} Pas de courbe : la part retrouvée n’est pas réduite par le moteur.`, [...D.duree.essentiel24h.sources, ...D.duree.agite.sources], a.id));
  else if (j <= D.duree.auDela.jours!) out.push(drapeau('duree', 'L’essentiel est extrait en 24 h', `${fr(j)} j`, `${D.duree.essentiel24h.texte} ${D.duree.thiols.texte}`, [...D.duree.essentiel24h.sources, ...D.duree.thiols.sources], a.id));
  else out.push(drapeau('duree-longue', 'Au-delà de 3 j : pas d’arôme mesuré en plus ; végétal et hop creep', `${fr(j)} j`,
    `${D.duree.auDela.texte} Végétal : ${D.duree.vegetal.texte} Hop creep : le risque monte avec la durée si la levure est vivante. ${D.duree.oxydation.texte}`, [...D.duree.auDela.sources, ...D.duree.vegetal.sources, 'H68', 'H85'], a.id));
  // Hop creep (H §6.1, §6.5).
  out.push(drapeau('hop-creep', 'Hop creep : refermentation, atténuation, diacétyle', cat.actif ? 'risque : levure vivante' : 'risque si la levure est encore présente',
    `${D.hopCreep.texte} ${D.hopCreep.chiffres.map(dit).join(' ; ')}. ${['Galaxy', 'Idaho 7'].includes(nomH) ? D.hopCreep.nonTrouve : ''}${a.temperatureC != null ? ` Contact à ${a.temperatureC} °C : plus rapide au chaud.` : ''} Ampleur pour ce brassin non chiffrée.`,
    D.hopCreep.chiffres.flatMap((c) => c.sources), a.id));
  // Saturation (Cascade seulement).
  if (dose >= D.saturation.zone[0]) out.push(drapeau('saturation', 'Les agrumes plafonnent, l’herbacé monte', dose <= D.saturation.zone[1] ? `${fr(dose)} g/L : dans la zone ${D.saturation.zone[0]}–${D.saturation.zone[1]} g/L` : `${fr(dose)} g/L : au-delà de ${D.saturation.zone[1]} g/L`,
    `${D.saturation.texte} Preuve : ${D.saturation.portee}.`, D.saturation.sources, a.id));
  // Géraniol → citronellol (H §6.2, §8.4).
  const ger = composes.geraniol.teneur;
  out.push(drapeau('geraniol-citronellol', 'Géraniol → citronellol : le floral peut glisser vers les agrumes',
    !ger.plage ? 'non évaluable' : !cat.actif ? 'hors du cas documenté' : levure?.geraniolCitronellol ? 'documenté pour cette levure' : 'possible, non documenté pour cette levure',
    [!ger.plage ? `Géraniol de ${nomH} : ${ger.inconnu}.` : `Géraniol de ${nomH} : ${texte(ger.plage, '% de l’huile')}.`,
      !cat.actif ? 'Le glissement est documenté pendant la fermentation active ; après fermentation, non documenté.' : '',
      D.biotransformation.geraniolCitronellol.texte,
      levure ? `${levure.nom} : ${levure.geraniolCitronellol ? `biotransformation ${levure.biotransformation}` : `biotransformation ${levure.biotransformation}`}.${levure.notes.length ? ' ' + levure.notes.join(' ') : ''}` : 'Levure absente du fichier : non documentée.'].filter(Boolean).join(' '),
    [...D.biotransformation.geraniolCitronellol.sources, ...(levure?.sources ?? [])], a.id));
  // Thiols libérés des précurseurs.
  const prec = v?.precurseurs ?? [];
  out.push(drapeau('thiols-precurseurs', 'Thiols libérés des précurseurs : potentiel tropical, rendement inconnu', cat.actif ? (prec.length ? 'possible' : 'non évaluable (précurseurs non publiés)') : 'peu documenté après fermentation',
    [prec.length ? `Précurseurs de ${nomH} : ${prec.map(dit).join(' ; ')}.` : `Précurseurs de ${nomH} : non publiés.`, D.biotransformation.thiolsPrecurseurs.texte, D.biotransformation.irc7.texte,
      levure ? `${levure.nom} : β-lyase ${levure.betaLyase}.${levure.notes.length ? ' ' + levure.notes.join(' ') : ''}` : 'Levure absente du fichier.'].join(' '),
    [...prec.flatMap((p) => p.sources), ...D.biotransformation.thiolsPrecurseurs.sources, ...D.biotransformation.irc7.sources, ...(levure?.sources ?? [])], a.id));
  if (v?.forme === 'cryo') out.push(drapeau('cryo', 'Cryo : huile chiffrée, composés inconnus', 'inconnu', `${v.composes.linalol.raison}. ${(v.autres ?? []).map(dit).join(' ; ')}.`, ['H1', 'H74'], a.id));
  return out;
}
function drapeauxCommuns(a: AjoutPouvoir, v: Variete | null, composes: Record<ComposeId, PouvoirCompose>, lot: Lot | null): Drapeau[] {
  const out: Drapeau[] = [];
  const hors = COMPOSES.flatMap((c) => composes[c].lotsHorsPlage);
  if (hors.length) out.push(drapeau('lots-hors-plage', 'Le lot pèse autant que la variété', 'lots publiés hors de la plage variétale', `${hors.join(' ; ')}. Saisir le certificat du lot remplace la plage.`, (v?.lots ?? []).flatMap((l) => l.sources), a.id));
  if (lot) out.push(drapeau('lot', `Lot ${lot.id}`, 'valeurs du lot', `Le lot remplace la plage variétale pour ce qu’il mesure${lot.texte ? ` ; ${lot.texte}` : ''}${lot.fractionsTexte ? ` ; ${lot.fractionsTexte}` : ''}.`, lot.sources, a.id));
  const hsi = a.hsi ?? lot?.hsi;
  if (hsi != null) {
    const k = D.hsi.classes.find((x) => (x.de == null || hsi > x.de) && (x.a == null || hsi <= x.a));
    out.push(drapeau('hsi', 'Fraîcheur du houblon (HSI)', `HSI ${fr(hsi, 3)} : ${k?.hsi ?? '?'}, transformation ${k?.transformation ?? '?'}`, `${D.hsi.texte}${(v?.hsi ?? []).length ? ' ' + v!.hsi!.map((h) => `HSI ${fr(h.hsi!, 3)} : ${h.texte}`).join(' ; ') + '.' : ''}`, [...D.hsi.sources, ...(v?.hsi ?? []).flatMap((h) => h.sources)], a.id));
  }
  return out;
}

// ---------- Un ajout ----------
const lotDe = (v: Variete | null, id?: string) => (id && v ? (v.lots ?? []).find((l) => l.id === id) ?? null : null);
function varieteDe(a: AjoutPouvoir): { cles: string; v: Variete | null; hypotheses: string[] } {
  let k = a.hopKey;
  if (a.forme === 'cryo' && !k.endsWith(':cryo') && D.varietes[`${k}:cryo`]) k = `${k}:cryo`;
  const v = D.varietes[k] ?? null;
  const hypotheses = v && v.forme === 'T-90' && (a.forme ?? 'inconnue') === 'inconnue' ? ['forme du lot non renseignée : valeurs des fiches T-90'] : [];
  return { cles: k, v, hypotheses };
}
/** Pouvoir aromatique d'un ajout dans une recette : par composé, charge, concentration et rapport au
 * seuil en plage ; signal par famille ; lecture ordinale face au style ; drapeaux. */
export function pouvoirAjout(a: AjoutPouvoir, recette: RecettePouvoir): PouvoirAjout {
  const dose = a.grams / recette.volumeL;
  const { cles, v, hypotheses } = varieteDe(a);
  const lot = lotDe(v, a.lot);
  const { cat, hypotheses: hypCat } = categorie(a, recette);
  const abv = degre(recette).plage;
  const huile = !v ? inconnue('mL/100 g', 'huile totale', 'variété absente de data/composes-houblon.json')
    : lot?.huile != null ? teneurLot(lot, lot.huile, 'mL/100 g', 'huile totale') : teneurDe(v.huile, 'mL/100 g', 'huile totale');
  if (hypotheses.length || hypCat.length) huile.hypotheses = uniq([...huile.hypotheses, ...hypotheses, ...hypCat]);
  const composes = Object.fromEntries(COMPOSES.map((c) => [c, calculCompose(c, v, lot, huile, dose, cat, abv)])) as Record<ComposeId, PouvoirCompose>;
  const familles = signauxFamilles(composes);
  const ref = hopRef(a.hopKey);
  const amer = MOMENTS[a.moment].kind === 'amertume';
  const ibu = cat.id === 'dryHop' || !ref?.alpha ? null : additionIbu(a, recette);
  return {
    id: a.id, houblon: a.hopKey, nom: v?.nom ?? ref?.name ?? a.hopKey, donnees: v ? cles : null,
    moment: a.moment, momentLabel: MOMENTS[a.moment].label, doseGL: dose,
    jour: a.day ?? null, dureeJours: a.dureeJours ?? null, temperatureC: a.temperatureC ?? null, forme: a.forme ?? v?.forme ?? 'inconnue', lot: lot?.id ?? null,
    // mL/100 g × g/L = 0,01 mL/L par point = 1 mL/hL : huile × dose. H §5 écrit « ÷ 10 », incohérent avec
    // ses propres chiffres de §7.4 (Citra à 4 g/L : 4–12 mL/hL) ; le calcul suit §7.4.
    huile, chargeHuile: produit([constante(dose, 'g/L', 'dose de l’ajout'), huile], 1, 'mL/hL', 'huile (mL/100 g) × dose (g/L) = mL/hL (H §7.4)'),
    composes, familles, pouvoir: lirePouvoir(recette.styleCode, composes, familles),
    amertume: { alpha: ref?.alpha ? { valeur: ref.alpha.value, min: ref.alpha.min, max: ref.alpha.max, source: ref.alpha.from } : null,
      ibu: ibu ? { valeur: ibu.value, min: ibu.min, max: ibu.max } : null,
      lecture: amer ? 'Surtout de l’amertume à ce moment : l’arôme du houblon y est peu chiffré (H §8.2).' : cat.id === 'dryHop' ? 'Dry hop : pas d’IBU calculé ; humulinones : brique existante (Maye 2016), non reprise ici.' : null },
    classeHopsteiner: (v?.classeHopsteiner ?? []).map((k) => ({ classe: k.classe!, texte: k.texte, sources: refs(k.sources) })),
    drapeaux: [...drapeauxAjout(a, recette, v, composes, cat, dose), ...drapeauxCommuns(a, v, composes, lot)],
    hypotheses: uniq([...hypotheses, ...hypCat]), mention: MENTION_RAPPORT,
  };
}

// ---------- Une recette ----------
const estACru = (m: MomentId) => m === 'dryActive' || m === 'dryPost';
/** Pouvoir aromatique d'une recette : ajouts successifs additionnés composé par composé ; ordre,
 * synergie et masquage « inconnus » ; lecture face au style ; drapeaux de la bière. */
export function pouvoirRecette(recette: RecettePouvoir): PouvoirRecette {
  const ajouts = recette.additions.filter((a) => a.grams > 0).map((a) => pouvoirAjout(a, recette));
  const abv = degre(recette);
  // La raison d'un terme inconnu nomme son ajout : c'est lui qui rend la somme « au moins ».
  const tag = (g: Grandeur, p: PouvoirAjout): Grandeur => (g.inconnu ? { ...g, inconnu: `${p.nom} (${p.momentLabel}) : ${g.inconnu}` } : g);
  const composes = Object.fromEntries(COMPOSES.map((c) => {
    const xs = ajouts.map((p) => p.composes[c]);
    const uc = uniteConc(c);
    const charge = somme(xs.map((x, i) => tag(x.charge, ajouts[i])), uc, 'somme des charges des ajouts');
    const conc = somme(xs.map((x, i) => tag(x.concentration, ajouts[i])), uc, 'somme des concentrations des ajouts (ordre, synergie, masquage inconnus)');
    const s = seuils(c, abv.plage);
    const r = rapport(conc, s);
    let baseCommune: PouvoirComposeRecette['baseCommune'] = null;
    if (xs.some((x) => x.baseCommune)) {
      const cB = somme(xs.map((x, i) => tag(x.baseCommune?.concentration ?? inconnue(uc, 'base commune', `pas de valeur sur la base commune`), ajouts[i])), uc, 'somme des concentrations sur la base commune');
      const rB = rapport(cB, s);
      baseCommune = { concentration: cB, rapport: rB.rapport, lecture: lire(rB.rapport.plage) };
    }
    return [c, { compose: c, nom: nom(c), charge, concentration: conc, rapport: r.rapport, rapportParSeuil: r.parSeuil, lecture: lire(r.rapport.plage), baseCommune,
      parAjout: ajouts.map((p) => ({ ajout: p.id, houblon: p.nom, concentration: p.composes[c].concentration.plage, inconnu: p.composes[c].concentration.plage ? null : p.composes[c].concentration.inconnu })) }];
  })) as Record<ComposeId, PouvoirComposeRecette>;
  const familles = signauxFamilles(composes);
  const froids = ajouts.filter((p) => estACru(p.moment));
  const doseACruGL = froids.reduce((s, p) => s + p.doseGL, 0);
  const jours = froids.filter((p) => p.jour != null);
  const debut = jours.length ? Math.min(...jours.map((p) => p.jour!)) : null;
  const fin = jours.length && jours.every((p) => p.dureeJours != null) ? Math.max(...jours.map((p) => p.jour! + p.dureeJours!)) : null;
  const contact = { debut, fin, jours: debut != null && fin != null ? fin - debut : null,
    texte: !froids.length ? 'aucun ajout à cru' : debut == null ? 'jours de début non renseignés' : fin == null ? `à partir de J+${debut}, durée non renseignée` : `houblon au contact du J+${debut} au J+${fin} (${fin - debut} j)` };
  const levure = D.levures[recette.yeastId ?? ''] ?? null;
  const drapeaux: Drapeau[] = [];
  if (froids.length && doseACruGL >= D.saturation.zone[0]) drapeaux.push(drapeau('saturation', 'Les agrumes plafonnent, l’herbacé monte', `dose totale à cru ${fr(doseACruGL)} g/L${doseACruGL <= D.saturation.zone[1] ? ` : dans la zone ${D.saturation.zone[0]}–${D.saturation.zone[1]} g/L` : ` : au-delà de ${D.saturation.zone[1]} g/L`}`,
    `${D.saturation.texte} Preuve : ${D.saturation.portee}. ${D.ajoutsSuccessifs.saturationSecondAjout.texte} ${D.saturation.complement.texte}`, [...D.saturation.sources, ...D.saturation.complement.sources]));
  const aromes = ajouts.filter((p) => MOMENTS[p.moment].kind === 'arôme');
  drapeaux.push(drapeau('ordre', 'Ordre des ajouts : inconnu', 'inconnu', `${D.ajoutsSuccessifs.ordre.texte}${aromes.length > 1 ? ` ${D.ajoutsSuccessifs.deuxAjouts.texte}` : ''}`, [...D.ajoutsSuccessifs.ordre.sources, ...(aromes.length > 1 ? D.ajoutsSuccessifs.deuxAjouts.sources : [])]));
  drapeaux.push(drapeau('synergie', 'Synergie : inconnue', 'inconnu', `${D.ajoutsSuccessifs.synergie.texte} Le moteur additionne, il ne pondère pas.`, D.ajoutsSuccessifs.synergie.sources));
  const st = D.styles[recette.styleCode];
  drapeaux.push(drapeau('masquage', 'Masquage : inconnu', 'inconnu', `${D.ajoutsSuccessifs.masquage.texte}${st ? ` ${st.masquage} ${st.melanoidines}` : ''}`, [...D.ajoutsSuccessifs.masquage.sources, ...(st ? st.sources : [])]));
  const noire = biereNoire(recette.styleCode);
  if (noire) drapeaux.push(drapeau('biere-noire', 'Perception en bière noire non documentée', 'inconnu', `${noire} Aucun seuil mesuré dans une stout.`, D.biereNoire.sources));
  if (froids.length) drapeaux.push(drapeau('hop-creep', 'Hop creep sur toute la recette', froids.some((p) => p.moment === 'dryActive') ? 'risque : levure vivante' : 'risque si la levure est encore présente',
    `${contact.texte} ; dose à cru ${fr(doseACruGL)} g/L. ${D.hopCreep.texte} Ordres de grandeur publiés : ${D.hopCreep.chiffres.slice(0, 2).map(dit).join(' ; ')}.`, D.hopCreep.chiffres.flatMap((c) => c.sources)));
  drapeaux.push(drapeau('levure', `Levure : ${levure?.nom ?? recette.yeastId ?? 'non renseignée'}`, levure ? 'fiche relevée (H §8.4)' : 'non documentée',
    levure ? `β-lyase : ${levure.betaLyase} ; β-glucosidase : ${levure.betaGlucosidase} ; POF : ${levure.pof} ; esters : ${levure.esters} ; diastaticus : ${levure.diastaticus} ; atténuation : ${levure.attenuation} ; biotransformation : ${levure.biotransformation}.${levure.notes.length ? ' ' + levure.notes.join(' ') : ''} ${(D.levures as unknown as { aucune: string }).aucune}` : 'Souche absente de H §8.4 : biotransformation non documentée.',
    levure?.sources ?? []));
  const g = recette.garde;
  drapeaux.push(drapeau('vieillissement', 'Vieillissement : pertes par famille, selon la température', g ? `garde à ${g.temperatureC} °C, ${g.mois} mois : non chiffrée pour ce brassin` : 'garde non renseignée',
    `${D.vieillissement.map((x) => `${x.famille} (${x.conditions}) : ${x.texte}`).join(' ; ')}. Aucune courbe : chaque chiffre vaut pour ses conditions.`, D.vieillissement.flatMap((x) => x.sources)));
  return { recette: recette.name, style: recette.styleCode, abv, levure: { id: recette.yeastId, nom: levure?.nom ?? null, documentee: !!levure },
    ajouts, composes, familles, pouvoir: lirePouvoir(recette.styleCode, composes, familles), doseACruGL, contact, drapeaux, mention: MENTION_RAPPORT };
}

// ---------- Profils par moment (les deux profils d'une variété : à chaud, à froid) ----------
export interface ProfilMoment { moment: MomentId; label: string; pouvoir: PouvoirAjout }
export function profilParMoment(hopKey: string, doseGL: number, recette: RecettePouvoir, moments: MomentId[] = MOMENTS_POUVOIR, extra: Partial<AjoutPouvoir> = {}): ProfilMoment[] {
  return moments.map((m) => ({ moment: m, label: MOMENTS[m].label,
    pouvoir: pouvoirAjout({ id: `${hopKey}@${m}`, hopKey, moment: m, grams: doseGL * recette.volumeL, ...(estACru(m) ? { dureeJours: 3 } : {}), ...extra }, recette) }));
}

// ---------- Vérification sur les mesures en bière ----------
export interface Verification { id: string; houblon: string; compose: ComposeId; texte: string; mesure: Plage; unite: string; calcul: Plage | null; calculBaseCommune: Plage | null; verdict: string; verdictBaseCommune: string | null; note: string | null; sources: SourceRef[] }
function verdict(c: Plage | null, m: Plage): string {
  if (!c) return 'calcul inconnu';
  if (c.max != null && c.max < m.min!) return 'calcul sous la mesure';
  if (c.min != null && c.min > m.max!) return 'calcul au-dessus de la mesure';
  if (c.min != null && c.max != null && c.min <= m.min! && c.max >= m.max!) return 'le calcul encadre la mesure';
  if (c.min != null && c.max != null && c.min >= m.min! && c.max <= m.max!) return 'le calcul tombe dans la mesure';
  if (c.min == null && c.max != null && c.max >= m.max!) return 'la mesure est sous la borne haute du calcul (borne basse inconnue)';
  if (c.max == null && c.min != null && c.min <= m.min!) return 'la mesure est au-dessus de la borne basse du calcul (borne haute inconnue)';
  return 'recouvrement partiel';
}
/** Rejoue chaque mesure en bière du fichier (H §5, §7.4) et dit si la chaîne l'encadre. */
export function verifications(): Verification[] {
  return Object.entries(D.varietes).flatMap(([k, v]) => (v.mesuresEnBiere ?? []).map((m) => {
    const recette: RecettePouvoir = { name: 'vérification', styleCode: '', volumeL: 20, og: 1.05, boilMin: 60, yeastId: null, abv: 5, additions: [] };
    const p = pouvoirAjout({ id: m.id, hopKey: k, moment: m.moment, grams: m.doseGL * 20, dureeJours: m.dureeJours }, recette).composes[m.compose];
    const mesure = pl(m.plage[0], m.plage[1]);
    return { id: m.id, houblon: v.nom, compose: m.compose, texte: m.texte, mesure, unite: m.unite, calcul: p.concentration.plage, calculBaseCommune: p.baseCommune?.concentration.plage ?? null,
      verdict: verdict(p.concentration.plage, mesure), verdictBaseCommune: p.baseCommune ? verdict(p.baseCommune.concentration.plage, mesure) : null, note: m.momentNote ?? null, sources: refs(m.sources) };
  }));
}
