// Moteur « profil aromatique simulé » (lot 21, fils21-choisir, 19.10.2026, soir). Le brasseur : « On peut
// aussi simuler un 'faux' profil aromatique, pour mieux de rendre compte […] Quitte à tricher un peu ».
// Couche de LECTURE au-dessus du moteur « pouvoir aromatique » (pouvoir.ts), toujours marquée « simulé » :
//  - la FORME vient des fiches (describeFamilies : familles marquées ou citées) ;
//  - la FORCE vient du moteur : charge introduite × part retrouvée selon le moment × part extraite selon les
//    jours, divisée par le seuil (rapport au seuil), puis la saturation par une courbe de dose (H22) ;
//  - les NUANCES viennent des composés, par la table src/data/hopV4/correspondance-familles.json ;
//  - la levure déplace le profil (géraniol → citronellol, thiols libérés) en dry hop actif, et lève des drapeaux.
// Chaque famille sort en { bas, centre, haut, crans, largeur } sur l'échelle 0–100 de style-bands.json, en
// crans du style (levels.ts). Le centre est une convention. Le rapport au seuil n'est jamais présenté comme
// une intensité : il reste, réel, dans mesures[] (MENTION_RAPPORT). Aucune plage n'est rognée : une borne
// haute non publiée est dite (hautPartiel), jamais remplacée. Déterministe : ni hasard, ni horloge.
import corrFile from '../../../data/hopV4/correspondance-familles.json';
import { getStyleScale, type StyleScale } from './style/scale';
import { hopRef } from './data';
import { FAMILIES, FAMILY_NAMES, type FamilyId } from './families';
import { describeFamilies } from './hops';
import { CRANS_RULE, classeDegustee, cransOf } from './levels';
import {
  DONNEES_POUVOIR, MENTION_RAPPORT, pouvoirAjout, pouvoirRecette, source, verifications,
  type AjoutPouvoir, type ComposeId, type Drapeau, type Plage, type PouvoirAjout, type RecettePouvoir, type SourceRef,
} from './pouvoir';
import { MOMENTS } from './recipe';
import type { Tasting } from './tasting';

// ---------- Types publics ----------
export type MomentSimule = 'b60' | 'b10' | 'wp' | 'dryActive' | 'dryPost';
export const MOMENTS_SIMULES: MomentSimule[] = ['b60', 'b10', 'wp', 'dryActive', 'dryPost'];
export type CompSim = ComposeId | 'citronellol';
export type Confiance = 'faible' | 'moyenne' | 'bonne';
export const MENTION_SIMULE = 'Profil simulé : couche de lecture, pas une mesure. Forme des fiches, force du moteur (charge, part retrouvée, jours, saturation), nuances des composés ; le centre est une convention. Les vraies valeurs sont dans mesures[].';
export const PROFIL_RULE = [
  'Rapport au seuil simulé d’un composé : R = charge (moteur) × part retrouvée simulée (moment) × part extraite (jours) ÷ seuil (moteur), en { bas, centre, haut }.',
  'Activité d’une famille : A = (1 − λ) × ΣR × forme des fiches + λ × Σ poids × R des composés reliés (correspondance-familles.json) ; λ = 0,5 [convention].',
  'Points 0–100 : x = 3,86 g/L × A ÷ A(agrumes de Cascade 3,86 g/L, 24 h, 4,75 % vol.) ; points = 26 × [x ÷ (x + K)] ÷ [3,86 ÷ (3,86 + K)] ; K = 4,5 (agrumes), 5,6 (intensité), 16 (herbacé) (H22, H §7.4).',
  'Plusieurs ajouts : activités additionnées avant la courbe : la saturation est partagée ; ordre, synergie et masquage inconnus.',
  'Levure, dry hop actif seulement : géraniol → citronellol (Pomona, centre 50 %) ; thiols libérés des précurseurs (Verdant, Diamond, centre 0,1 %) [convention].',
  'Dégustation du brasseur : elle prime (milieu de sa classe) ; l’ajout la décale de son effet simulé.',
  'Crans du style : CRANS_RULE de levels.ts, sur le centre. Aucune borne rognée ; largeur = haut ÷ bas, « inconnu » si le bas est nul ; hautPartiel nomme les composés sans borne haute publiée (le vrai haut peut être plus haut).',
];

/** Une famille du profil simulé, sur l'échelle 0–100 (jamais rognée à 100). */
export interface ValeurFamille {
  bas: number; centre: number; haut: number;
  /** Crans du style sur le centre (CRANS_RULE) : 0–3 dans la bande, 4 au-dessus, −1 en dessous ; null hors style documenté. */
  crans: number | null;
  /** haut ÷ bas, ou « inconnu » (bas nul). Avec hautPartiel : au moins cette largeur. */
  largeur: number | 'inconnu';
  source: 'simulé' | 'dégustation';
  /** Composés sans borne haute publiée qui touchent cette famille : le vrai haut peut être plus haut. */
  hautPartiel?: string[];
  /** Famille sans fiche ni composé relié, ou raison d'une borne. */
  inconnu?: string;
}
export type ProfilFamilles = Record<FamilyId, ValeurFamille>;
export interface DeltaFamille { bas: number; centre: number; haut: number; crans: number | '≈' }
export interface AjoutSimule { id?: string; houblon: string; dose_gL: number; moment: MomentSimule; jourDebut?: number | null; jours?: number | null }
export interface DrapeauSimule { id: string; titre: string; statut: string; pourquoi: string; sources: string[]; ajout?: string; familles?: FamilyId[] }
export interface MesureReelle {
  type: 'alpha' | 'huile' | 'chargeHuile' | 'dose' | 'jours' | 'compose' | 'ibu' | 'mesureEnBiere' | 'publiee';
  ajout?: string; houblon?: string; compose?: string; nom?: string;
  valeur?: number | string | null; plage?: Plage | null; unite: string;
  base?: string; niveau?: string | null; source: string[];
  largeur: number | 'inconnu';
  concentration?: { plage: Plage | null; unite: string; largeur: number | 'inconnu'; inconnu: string | null };
  rapport?: { plage: Plage | null; largeur: number | 'inconnu'; lecture: string; inconnu: string | null };
  rapportBaseCommune?: { plage: Plage | null; largeur: number | 'inconnu'; base: string } | null;
  mention?: string; texte?: string; inconnu?: string | null;
}
export interface ApportHoublon { id: string; houblon: string; nom: string; dose_gL: number; seul: Record<FamilyId, number>; part: Record<FamilyId, number>; apport: Record<FamilyId, number> }
type Tri = { bas: number; centre: number; haut: number };
export interface CasSimule {
  id: string; titre: string; simule: true; mention: string;
  ajouts: { id: string; houblon: string; nom: string; dose_gL: number; moment: MomentSimule; jourDebut: number | null; jours: number | null; levure: string }[];
  levure: string;
  avant: ProfilFamilles; apres: ProfilFamilles; delta: Record<FamilyId, DeltaFamille>;
  parJour: { jour: number; jourRecette: number | null; familles: Record<FamilyId, { bas: number; centre: number; haut: number; crans: number | null; largeur: number | 'inconnu' }> }[];
  apportsParHoublon: ApportHoublon[];
  saturation: { doseTotale_gL: number; doseACru_gL: number; zone: [number, number]; dansZone: boolean; facteur: Record<FamilyId, number | null> | null; texte: string };
  biotransformation: { actif: boolean; levure: string; geraniolCitronellol: Tri; rendementThiolsPct: Tri; parAjout: { ajout: string; citronellol_ugL: Tri | null; thiolsLiberes_ngL: Tri | null; raison: string | null }[] };
  drapeaux: DrapeauSimule[];
  /** Identifiants des drapeaux (aussi en mode léger, pour la grille). */
  drapeauxIds: string[];
  confiance: { niveau: Confiance; pourquoi: string[] };
  mesures: MesureReelle[];
}

// ---------- Données de la table ----------
type Trio = { bas: number | null; centre: number; haut: number | null; sources?: string[]; chiffre?: string };
interface Corr {
  liens: { composes: Record<CompSim, { sens: string; lien: string[]; familles: Partial<Record<FamilyId, { poids: number; chiffre: string }>> }> };
  forme: { poids: Record<'marqué' | 'cité' | 'non décrit', number>; lambda: { valeur: number } };
  partsRetrouvees: Record<string, Record<string, unknown>>;
  demiBornes: { seulementHaut: { facteur: number }; seulementBas: { facteur: number } };
  extraction: { tauHeures: { bas: number; centre: number; haut: number }; plafondJours: number; sources: string[] };
  courbes: { ancre: { houblon: string; doseGL: number; moment: MomentSimule; jours: number; abv: number; famille: FamilyId; points: number; sources: string[] } } & Record<'agrumes' | 'intensite' | 'herbace', { K: number; familles: FamilyId[]; sources: string[] }>;
  biotransformation: {
    moments: MomentSimule[];
    geraniolCitronellol: { parLevure: Record<string, Trio>; autres: Trio };
    thiolsLiberes: { rendementPct: Record<string, Trio>; precurseurs: Record<string, Trio & { unite: string }>; sansPrecurseurs: string };
  };
  sansComposes: { texte: string; sources: string[] };
}
export const CORRESPONDANCE = corrFile as unknown as Corr;
const C = CORRESPONDANCE;
const COMPOSES_SIM: ComposeId[] = ['linalol', 'geraniol', 'myrcene', 'humulene', 'caryophyllene', '4MMP', '3MH', '3M4MP'];
const HYDRO = new Set(C.partsRetrouvees.hydrocarbures.composes as string[]);
const CHAUD = new Set<MomentSimule>(['b60', 'b10', 'wp']);
const estSec = (m: MomentSimule) => m === 'dryActive' || m === 'dryPost';
const LAMBDA = C.forme.lambda.valeur;
const LIES = (f: FamilyId) => (Object.keys(C.liens.composes) as CompSim[]).filter((c) => C.liens.composes[c].familles[f]);

// ---------- Outils ----------
const tri = (bas: number, centre: number, haut: number): Tri => ({ bas, centre, haut });
const ZERO = (): Tri => tri(0, 0, 0);
const plus = (a: Tri, b: Tri): Tri => tri(a.bas + b.bas, a.centre + b.centre, a.haut + b.haut);
const fois = (a: Tri, k: number): Tri => tri(a.bas * k, a.centre * k, a.haut * k);
const foisT = (a: Tri, b: Tri): Tri => tri(a.bas * b.bas, a.centre * b.centre, a.haut * b.haut);
/** Arrondi d'écriture : 2 décimales ; une valeur non nulle sous 0,01 garde 2 chiffres significatifs (jamais un faux zéro). */
export const arrondi = (x: number): number => (x === 0 || !Number.isFinite(x) ? x : Math.abs(x) >= 0.01 ? Math.round(x * 100) / 100 : Number(x.toPrecision(2)));
/** haut ÷ bas, ou « inconnu ». */
export const largeur = (bas: number | null | undefined, haut: number | null | undefined): number | 'inconnu' => (bas != null && haut != null && bas > 0 && haut > 0 ? arrondi(haut / bas) : 'inconnu');
const sig3 = (x: number | null) => (x == null || x === 0 || !Number.isFinite(x) ? x : Number(x.toPrecision(3)));
const plage3 = (p: Plage | null): Plage | null => (p ? { ...p, min: sig3(p.min), max: sig3(p.max), central: sig3(p.central) } : null);
const cles = (xs: SourceRef[]) => [...new Set(xs.map((s) => s.cle))];
const triDe = (x: Trio): Tri => tri(x.bas ?? 0, x.centre, x.haut ?? x.centre);
const arrondiTri = (t: Tri): Tri => tri(arrondi(t.bas), arrondi(t.centre), arrondi(t.haut));

/** Charge du moteur en { bas, centre, haut } : borne basse inconnue → 0 ; centre par les demi-bornes [convention] ;
 * borne haute inconnue → le centre, et le composé est « ouvert » (hautPartiel). */
function triDePlage(p: Plage | null): { t: Tri; ouvert: boolean } | null {
  if (!p || (p.min == null && p.max == null)) return null;
  const centre = p.central ?? (p.min == null ? p.max! * C.demiBornes.seulementHaut.facteur : p.min * C.demiBornes.seulementBas.facteur);
  return { t: tri(p.min ?? 0, centre, p.max ?? centre), ouvert: p.max == null };
}
function partRetrouvee(c: ComposeId, m: MomentSimule): { t: Tri; sources: string[] } | { inconnu: string; sources: string[] } {
  const groupe = HYDRO.has(c) ? 'hydrocarbures' : c === '3M4MP' ? '4MMP' : c;
  const row = C.partsRetrouvees[groupe];
  if (!row) return { inconnu: `aucune part retrouvée simulée pour ${c}`, sources: [] };
  if (CHAUD.has(m) && row.chaud) { const x = row.chaud as { raison: string; sources: string[] }; return { inconnu: x.raison, sources: x.sources }; }
  const e = row[m] as Trio | undefined;
  if (!e) return { inconnu: `aucune part retrouvée simulée pour ${c} à ce moment`, sources: [] };
  return { t: tri((e.bas ?? 0) / 100, e.centre / 100, (e.haut ?? e.centre) / 100), sources: e.sources ?? [] };
}
/** Part extraite d'un dry hop après t jours de contact : 1 − e^(−t/τ), t plafonné à 3 j (H73). */
export function partExtraite(jours: number): Tri {
  const t = Math.max(0, Math.min(jours, C.extraction.plafondJours)) * 24;
  const { bas, centre, haut } = C.extraction.tauHeures;
  return tri(1 - Math.exp(-t / bas), 1 - Math.exp(-t / centre), 1 - Math.exp(-t / haut));
}
const SEUIL_CITRONELLOL = (() => {
  const vs = (DONNEES_POUVOIR.seuils as unknown as Record<string, { valeurs: { plage: [number, number]; sources: string[] }[] }>).citronellol.valeurs;
  const min = Math.min(...vs.map((v) => v.plage[0])), max = Math.max(...vs.map((v) => v.plage[1]));
  return { plage: { min, max, central: (min + max) / 2 } as Plage, sources: [...new Set(vs.flatMap((v) => v.sources))] };
})();

// ---------- Courbe : activité → points ----------
const ANCRE = C.courbes.ancre;
export function courbeDe(f: FamilyId): { K: number; id: 'agrumes' | 'intensite' | 'herbace' } {
  for (const id of ['agrumes', 'herbace', 'intensite'] as const) if (C.courbes[id].familles.includes(f)) return { K: C.courbes[id].K, id };
  return { K: C.courbes.intensite.K, id: 'intensite' };
}
let aRefCache: number | null = null;
/** Activité agrumes de l'ancre : Cascade 3,86 g/L, dry hop après fermentation, 24 h, bière à 4,75 % vol. (H22, vérifié par K). */
export function activiteAncre(): number {
  if (aRefCache != null) return aRefCache;
  const r: RecettePouvoir = { name: 'ancre H22', styleCode: '', volumeL: 20, og: 1.05, boilMin: 60, yeastId: 'fermentis-us05', abv: ANCRE.abv, additions: [] };
  const b = baseAjout({ id: 'ancre', houblon: ANCRE.houblon, dose_gL: ANCRE.doseGL, moment: ANCRE.moment, jours: ANCRE.jours }, r);
  aRefCache = activite(b, ANCRE.jours).A[ANCRE.famille].centre;
  return aRefCache;
}
/** Points 0–100 d'une activité, pour une famille (hyperbole de saturation passant par l'ancre ; jamais rognée). */
export function points(A: number, f: FamilyId): number {
  if (A <= 0) return 0;
  const { K } = courbeDe(f);
  const x = (ANCRE.doseGL * A) / activiteAncre();
  return (ANCRE.points * (x / (x + K))) / (ANCRE.doseGL / (ANCRE.doseGL + K));
}
const pointsTri = (a: Tri, f: FamilyId): Tri => tri(points(a.bas, f), points(a.centre, f), points(a.haut, f));

// ---------- Un ajout : moteur + concentrations potentielles ----------
interface Base {
  a: AjoutSimule; id: string; nom: string; p: PouvoirAjout; levure: string | null;
  sansDonnees: boolean;
  /** charge × part retrouvée, avant la part extraite : µg/L (terpènes) ou ng/L (thiols). */
  conc: Partial<Record<ComposeId, Tri>>;
  seuils: Partial<Record<ComposeId, Plage>>;
  /** Raisons des composés inconnus ou bornés d'un seul côté. */
  inconnus: Partial<Record<CompSim, string>>;
  /** Composés sans borne haute (teneur ouverte, ou composé entièrement inconnu). */
  ouverts: Set<CompSim>;
  forme: Record<FamilyId, number>; sommeForme: number;
  precurseurs: (Trio & { unite: string }) | null;
}
const cacheBase = new Map<string, Base>();
const formeCache = new Map<string, Record<FamilyId, number>>();
export function formeDe(hopKey: string): Record<FamilyId, number> {
  const k = hopRef(hopKey)?.varietyId ?? hopKey.replace(/:cryo$/, '');
  if (!formeCache.has(k)) {
    const d = describeFamilies(k);
    formeCache.set(k, Object.fromEntries(FAMILIES.map((f) => [f, C.forme.poids[d[f].level]])) as Record<FamilyId, number>);
  }
  return formeCache.get(k)!;
}
export const ajoutPouvoirDe = (a: AjoutSimule, recette: RecettePouvoir, id = a.id ?? `${a.houblon}@${a.moment}`): AjoutPouvoir =>
  ({ id, hopKey: a.houblon, moment: a.moment, grams: a.dose_gL * recette.volumeL, ...(a.jourDebut != null ? { day: a.jourDebut } : {}), ...(estSec(a.moment) ? { dureeJours: a.jours ?? 3 } : {}) });
function baseAjout(a: AjoutSimule, recette: RecettePouvoir): Base {
  if (!MOMENTS_SIMULES.includes(a.moment)) throw Error(`Moment non simulé : ${a.moment} (seuls ${MOMENTS_SIMULES.join(', ')})`);
  const id = a.id ?? `${a.houblon}@${a.moment}`;
  const key = [a.houblon, a.moment, a.dose_gL, a.jourDebut ?? '', a.jours ?? '', recette.yeastId, recette.styleCode, recette.abv ?? '', recette.volumeL, id].join('|');
  const hit = cacheBase.get(key);
  if (hit) return hit;
  const p = pouvoirAjout(ajoutPouvoirDe(a, recette, id), recette);
  const conc: Base['conc'] = {}, seuils: Base['seuils'] = {}, inconnus: Base['inconnus'] = {}, ouverts = new Set<CompSim>();
  for (const c of COMPOSES_SIM) {
    const x = p.composes[c];
    const ch = triDePlage(x.charge.plage);
    const tr = partRetrouvee(c, a.moment);
    if (!ch) { inconnus[c] = x.teneur.inconnu ?? x.charge.inconnu ?? 'charge inconnue'; ouverts.add(c); continue; }
    if ('inconnu' in tr) { inconnus[c] = tr.inconnu; ouverts.add(c); continue; }
    const s = x.seuil.plage;
    if (!s || s.min == null || s.max == null || s.central == null) { inconnus[c] = x.seuil.inconnu ?? 'seuil inconnu'; ouverts.add(c); continue; }
    conc[c] = foisT(ch.t, tr.t);
    seuils[c] = s;
    if (ch.ouvert) { ouverts.add(c); inconnus[c] = `borne haute de la teneur non publiée${x.teneur.inconnu ? ` (${x.teneur.inconnu})` : ''}`; }
    else if (x.charge.plage!.min == null) inconnus[c] = 'borne basse de la teneur non publiée';
  }
  const b: Base = { a, id, nom: p.nom, p, levure: recette.yeastId, sansDonnees: p.donnees == null, conc, seuils, inconnus, ouverts,
    forme: formeDe(a.houblon), sommeForme: 0, precurseurs: C.biotransformation.thiolsLiberes.precurseurs[a.houblon] ?? null };
  b.sommeForme = FAMILIES.reduce((s, f) => s + b.forme[f], 0);
  cacheBase.set(key, b);
  return b;
}

// ---------- Activité d'un ajout après t jours de contact ----------
interface Activite { R: Partial<Record<CompSim, Tri>>; F: Tri; A: Record<FamilyId, Tri>; ouverts: Record<FamilyId, string[]>; citronellol: Tri | null; thiolsLiberes: Tri | null; raisonBio: string | null }
/** Biotransformation de la levure à ce moment (dry hop actif seulement) : géraniol → citronellol, rendement des thiols. */
export function biotransfoLevure(levure: string | null, moment: MomentSimule) {
  const actif = C.biotransformation.moments.includes(moment);
  const g = C.biotransformation.geraniolCitronellol, t = C.biotransformation.thiolsLiberes.rendementPct;
  const eg = g.parLevure[levure ?? ''] ?? g.autres, et = t[levure ?? ''] ?? t.autres;
  return { actif, conv: actif ? triDe(eg) : ZERO(), rend: actif ? triDe(et) : ZERO(), texteConv: eg.chiffre ?? '', texteRend: et.chiffre ?? '',
    sources: actif ? [...new Set([...(eg.sources ?? []), ...(et.sources ?? [])])] : [] };
}
function activite(b: Base, contactJours: number | null): Activite {
  const E = estSec(b.a.moment) ? partExtraite(contactJours ?? b.a.jours ?? 3) : tri(1, 1, 1);
  const conc: Partial<Record<CompSim, Tri>> = {};
  for (const c of COMPOSES_SIM) if (b.conc[c]) conc[c] = foisT(b.conc[c]!, E);
  // Levure (dry hop actif) : géraniol → citronellol ; 3MH libéré des précurseurs.
  const bio = biotransfoLevure(b.levure, b.a.moment);
  let citronellol: Tri | null = null, thiolsLiberes: Tri | null = null;
  const raisons: string[] = [];
  if (bio.actif) {
    const ger = conc.geraniol;
    if (ger) {
      const k = bio.conv;
      conc.geraniol = tri(ger.bas * (1 - k.haut), ger.centre * (1 - k.centre), ger.haut * (1 - k.bas));
      citronellol = foisT(ger, k);
      conc.citronellol = citronellol;
    } else raisons.push(`géraniol de ${b.nom} : ${b.inconnus.geraniol ?? 'inconnu'} ; glissement vers le citronellol non évaluable`);
    if (b.precurseurs) {
      // mg/kg × g/L = µg/L ; × 1000 = ng/L ; × rendement (%) ÷ 100.
      thiolsLiberes = foisT(fois(foisT(triDe(b.precurseurs), bio.rend), (b.a.dose_gL * 1000) / 100), E);
      conc['3MH'] = conc['3MH'] ? plus(conc['3MH'], thiolsLiberes) : thiolsLiberes;
    } else raisons.push(`précurseurs de ${b.nom} : ${C.biotransformation.thiolsLiberes.sansPrecurseurs}`);
  }
  const R: Activite['R'] = {};
  for (const [c, x] of Object.entries(conc) as [CompSim, Tri][]) {
    const s = c === 'citronellol' ? SEUIL_CITRONELLOL.plage : b.seuils[c as ComposeId] ?? (c === '3MH' ? b.p.composes['3MH'].seuil.plage : null);
    if (!s || s.min == null || s.max == null || s.central == null) continue;
    R[c] = tri(x.bas / s.max, x.centre / s.central, x.haut / s.min);
  }
  const F = Object.values(R).reduce<Tri>((s, x) => plus(s, x!), ZERO());
  const A = {} as Record<FamilyId, Tri>, ouverts = {} as Record<FamilyId, string[]>;
  const nomC = (c: CompSim) => `${b.nom} : ${c}`;
  for (const f of FAMILIES) {
    let N = ZERO();
    for (const [c, x] of Object.entries(R) as [CompSim, Tri][]) {
      const w = C.liens.composes[c]?.familles[f]?.poids ?? 0;
      if (w) N = plus(N, fois(x, w));
    }
    const formeActive = b.sommeForme > 0 && b.forme[f] > 0;
    A[f] = b.sommeForme > 0 ? plus(fois(fois(F, b.forme[f] / b.sommeForme), 1 - LAMBDA), fois(N, LAMBDA)) : N;
    const lies = LIES(f);
    ouverts[f] = [...b.ouverts].filter((c) => formeActive || lies.includes(c)).map(nomC);
  }
  return { R, F, A, ouverts, citronellol, thiolsLiberes, raisonBio: raisons.length ? raisons.join(' ; ') : null };
}
/** Houblon sans données de composés : force de Cascade au même moment et à la même dose, forme des fiches seules. */
function activiteSansDonnees(b: Base, recette: RecettePouvoir, contactJours: number | null): Activite {
  const ref = baseAjout({ ...b.a, id: `${b.id}~cascade`, houblon: 'beermaverick-cascade' }, recette);
  const r = activite(ref, contactJours);
  const A = Object.fromEntries(FAMILIES.map((f) => [f, b.sommeForme > 0 ? fois(r.F, b.forme[f] / b.sommeForme) : ZERO()])) as Record<FamilyId, Tri>;
  const ouverts = Object.fromEntries(FAMILIES.map((f) => [f, b.forme[f] > 0 ? [`${b.nom} : tous ses composés (aucune donnée)`] : []])) as Record<FamilyId, string[]>;
  return { R: {}, F: r.F, A, ouverts, citronellol: null, thiolsLiberes: null, raisonBio: 'houblon sans données de composés : biotransformation non évaluable' };
}
const activiteDe = (b: Base, recette: RecettePouvoir, contactJours: number | null) => (b.sansDonnees ? activiteSansDonnees(b, recette, contactJours) : activite(b, contactJours));
interface Somme { A: Record<FamilyId, Tri>; ouverts: Record<FamilyId, string[]> }
const sommeA = (xs: Activite[]): Somme => ({
  A: Object.fromEntries(FAMILIES.map((f) => [f, xs.reduce((s, x) => plus(s, x.A[f]), ZERO())])) as Record<FamilyId, Tri>,
  ouverts: Object.fromEntries(FAMILIES.map((f) => [f, [...new Set(xs.flatMap((x) => x.ouverts[f]))]])) as Record<FamilyId, string[]>,
});
const fusion = (a: Somme, b: Somme | null): Somme => (b ? { A: Object.fromEntries(FAMILIES.map((f) => [f, plus(a.A[f], b.A[f])])) as Record<FamilyId, Tri>,
  ouverts: Object.fromEntries(FAMILIES.map((f) => [f, [...new Set([...a.ouverts[f], ...b.ouverts[f]])]])) as Record<FamilyId, string[]> } : a);

// ---------- Profil : points, crans, dégustation ----------
const SCALES = new Map<string, StyleScale>();
const scaleDe = (code: string) => { if (!SCALES.has(code)) SCALES.set(code, getStyleScale(code)); return SCALES.get(code)!; };
function valeur(f: FamilyId, t: Tri, scale: StyleScale, src: ValeurFamille['source'], ouverts: string[], inconnu?: string): ValeurFamille {
  const crans = scale.documented ? cransOf(f, t.centre, scale).crans : null;
  return { bas: arrondi(t.bas), centre: arrondi(t.centre), haut: arrondi(t.haut), crans, largeur: largeur(t.bas, t.haut), source: src,
    ...(ouverts.length ? { hautPartiel: ouverts } : {}), ...(inconnu ? { inconnu } : {}) };
}
const percu = (tasting: Tasting | null | undefined, f: FamilyId) => tasting?.axes.find((x) => x.family === f && x.perceived)?.perceived ?? null;
const VIDE = 'non décrite par les fiches, aucun composé relié chiffré : rien de simulé (pas une preuve d’absence)';
/** Profil d'une bière : activité de base (avant) et activité ajoutée ; la dégustation prime et l'ajout la décale. */
function profils(av: Somme, add: Somme | null, scale: StyleScale, tasting: Tasting | null | undefined): ProfilFamilles {
  const tot = fusion(av, add);
  const out = {} as ProfilFamilles;
  for (const f of FAMILIES) {
    const pAv = pointsTri(av.A[f], f), pTot = pointsTri(tot.A[f], f);
    const p = percu(tasting, f);
    if (p) {
      // La classe dégustée décalée par l'effet simulé ; bornes ordonnées (bas ≤ centre ≤ haut), jamais rognées.
      const d = classeDegustee(f, p);
      const eff = tri(pTot.bas - pAv.bas, pTot.centre - pAv.centre, pTot.haut - pAv.haut);
      out[f] = valeur(f, tri(d.bas + Math.min(eff.bas, eff.centre), d.centre + eff.centre, d.haut + Math.max(eff.haut, eff.centre)), scale, 'dégustation', add ? add.ouverts[f] : []);
    } else out[f] = valeur(f, pTot, scale, 'simulé', tot.ouverts[f], pTot.haut === 0 ? VIDE : undefined);
  }
  return out;
}
function deltaDe(av: ProfilFamilles, ap: ProfilFamilles, scale: StyleScale): Record<FamilyId, DeltaFamille> {
  return Object.fromEntries(FAMILIES.map((f) => {
    const d = ap[f].centre - av[f].centre, fs = scale.families[f];
    return [f, { bas: arrondi(ap[f].bas - av[f].bas), centre: arrondi(d), haut: arrondi(ap[f].haut - av[f].haut), crans: Math.abs(d) < fs.threshold ? '≈' : Math.round(d / fs.cran) }];
  })) as Record<FamilyId, DeltaFamille>;
}

// ---------- Confiance ----------
function confianceDe(bases: Base[], levure: string): { niveau: Confiance; pourquoi: string[] } {
  const faible: string[] = [], moyenne: string[] = [];
  for (const b of bases) {
    const m = b.a.moment;
    if (b.sansDonnees) faible.push(`${b.nom} : aucune donnée de composés ; forme des fiches seules, force de Cascade [convention]`);
    else if (!b.conc['4MMP'] && !b.conc['3MH'] && estSec(m)) faible.push(`${b.nom} : thiols non chiffrés dans H (tropical par les fiches seules)`);
    if (m === 'b60') faible.push(`${b.nom} à 60′ : part retrouvée bornée en haut seulement ; centre [convention] au dixième`);
    if (m === 'b10' || m === 'wp') moyenne.push(`${b.nom} à ${MOMENTS[m].label} : centres des parts retrouvées en partie par convention (moitié de la borne haute)`);
    if (m === 'dryActive') moyenne.push(`${b.nom} en fermentation active : pertes par le CO₂ non chiffrées`);
    const bornes = (['4MMP', 'linalol'] as ComposeId[]).filter((c) => b.inconnus[c]);
    if (!b.sansDonnees && bornes.length && estSec(m)) moyenne.push(`${b.nom} : ${bornes.map((c) => `${c}, ${b.inconnus[c]}`).join(' ; ')}`);
    const bio = biotransfoLevure(levure, m);
    if (bio.actif && ((bio.conv.centre > 0 && b.conc.geraniol) || (bio.rend.centre > 0 && b.precurseurs))) faible.push(`biotransformation simulée par convention (${levure}) : aucun taux publié en bière`);
    if (estSec(m) && (b.a.jours ?? 3) > 3) moyenne.push(`${b.nom} ${b.a.jours} j : au-delà de 3 j, pas d’arôme mesuré en plus ; végétal non chiffré`);
  }
  if (bases.length > 1) moyenne.push('plusieurs ajouts : activités additionnées ; ordre, synergie et masquage inconnus');
  const niveau: Confiance = faible.length ? 'faible' : moyenne.length ? 'moyenne' : 'bonne';
  const toujours = 'toujours : perception en bière noire non documentée (H §8.3) ; échelle ancrée sur un seul panel (Cascade, H22)';
  return { niveau, pourquoi: [...new Set([...faible, ...moyenne]), ...(niveau === 'bonne' ? ['teneurs bornées, moment le mieux documenté (dry hop)'] : []), toujours] };
}

// ---------- Mesures réelles ----------
const SOURCES_EN_PLUS: Record<string, Omit<SourceRef, 'cle'>> = {
  'stock-affinee': { titre: 'Stock de L’Affinée : α lu sur la fiche de stock ou l’article (src/data/hopV4/proto-data.json)', url: 'src/data/hopV4/proto-data.json', annee: 2026, niveau: 'F', lecture: 'dépôt' },
  'recette-s1': { titre: 'Recette du lot 20 : stout 16D S1, Nugget 46 g à 60′, 20 L (prototypes/houblons-v4/src/pack/buildPack.ts)', url: 'prototypes/houblons-v4/src/pack/buildPack.ts', annee: 2026, niveau: 'H', lecture: 'dépôt' },
};
export function sourceSimulee(cle: string): Omit<SourceRef, 'cle'> | null {
  if (SOURCES_EN_PLUS[cle]) return SOURCES_EN_PLUS[cle];
  if (!(DONNEES_POUVOIR.sources as Record<string, unknown>)[cle]) return null;
  const { cle: _c, ...s } = source(cle);
  return s;
}
const bmCle = (hopKey: string) => { const k = `bm-${hopKey.replace(/^beermaverick-/, '').replace(/:cryo$/, '')}`; return (DONNEES_POUVOIR.sources as Record<string, unknown>)[k] ? k : null; };
export const MESURES_COMPOSES: ComposeId[] = ['linalol', 'geraniol', '4MMP', '3MH', '3M4MP', 'myrcene'];
function mesuresAjout(b: Base): MesureReelle[] {
  const p = b.p, h = hopRef(b.a.houblon), out: MesureReelle[] = [];
  const bm = bmCle(b.a.houblon);
  if (h?.alpha) out.push({ type: 'alpha', ajout: b.id, houblon: p.nom, valeur: h.alpha.value, plage: { min: h.alpha.min, max: h.alpha.max, central: h.alpha.value }, unite: '% α',
    base: h.stock ? `lot en stock : ${h.alpha.from}` : h.alpha.from, source: h.stock ? ['stock-affinee'] : bm ? [bm] : [], largeur: largeur(h.alpha.min, h.alpha.max) });
  if (h?.catalogue.alpha && h.stock) out.push({ type: 'alpha', ajout: b.id, houblon: p.nom, valeur: null, plage: { min: h.catalogue.alpha[0], max: h.catalogue.alpha[1], central: null }, unite: '% α', base: 'plage des fiches', source: bm ? [bm] : [], largeur: largeur(h.catalogue.alpha[0], h.catalogue.alpha[1]) });
  const cryo = b.a.houblon.endsWith(':cryo') ? null : hopRef(`${b.a.houblon}:cryo`);
  if (cryo?.stock && cryo.alpha) out.push({ type: 'alpha', ajout: b.id, houblon: `${p.nom} cryo (en stock)`, valeur: cryo.alpha.value, plage: null, unite: '% α', base: `${cryo.alpha.from} ; le stock est du cryo, pas des pellets T-90`, source: ['stock-affinee'], largeur: 'inconnu' });
  out.push({ type: 'dose', ajout: b.id, houblon: p.nom, valeur: b.a.dose_gL, unite: 'g/L', source: ['recette-s1'], largeur: 'inconnu' });
  if (estSec(b.a.moment)) out.push({ type: 'jours', ajout: b.id, houblon: p.nom, valeur: b.a.jours ?? 3, unite: 'j', source: ['recette-s1'], largeur: 'inconnu' });
  out.push({ type: 'huile', ajout: b.id, houblon: p.nom, plage: plage3(p.huile.plage), unite: p.huile.unite, base: p.huile.base, niveau: p.huile.niveau, source: cles(p.huile.sources), largeur: largeur(p.huile.plage?.min, p.huile.plage?.max), inconnu: p.huile.inconnu });
  out.push({ type: 'chargeHuile', ajout: b.id, houblon: p.nom, plage: plage3(p.chargeHuile.plage), unite: p.chargeHuile.unite, base: p.chargeHuile.base, niveau: p.chargeHuile.niveau, source: cles(p.chargeHuile.sources), largeur: largeur(p.chargeHuile.plage?.min, p.chargeHuile.plage?.max), inconnu: p.chargeHuile.inconnu });
  for (const c of MESURES_COMPOSES) {
    const x = p.composes[c];
    out.push({ type: 'compose', ajout: b.id, houblon: p.nom, compose: c, nom: x.nom, plage: plage3(x.teneur.plage), unite: x.teneur.unite, base: x.teneur.base, niveau: x.rapport.niveau ?? x.teneur.niveau,
      source: cles([...x.teneur.sources, ...x.concentration.sources, ...x.seuil.sources]), largeur: largeur(x.teneur.plage?.min, x.teneur.plage?.max), inconnu: x.teneur.inconnu,
      concentration: { plage: plage3(x.concentration.plage), unite: x.concentration.unite, largeur: largeur(x.concentration.plage?.min, x.concentration.plage?.max), inconnu: x.concentration.inconnu },
      rapport: { plage: plage3(x.rapport.plage), largeur: largeur(x.rapport.plage?.min, x.rapport.plage?.max), lecture: x.lecture.texte, inconnu: x.rapport.inconnu },
      rapportBaseCommune: x.baseCommune ? { plage: plage3(x.baseCommune.rapport.plage), largeur: largeur(x.baseCommune.rapport.plage?.min, x.baseCommune.rapport.plage?.max), base: x.baseCommune.base } : null,
      mention: MENTION_RAPPORT });
  }
  if (p.amertume.ibu) out.push({ type: 'ibu', ajout: b.id, houblon: p.nom, valeur: arrondi(p.amertume.ibu.valeur), plage: { min: arrondi(p.amertume.ibu.min), max: arrondi(p.amertume.ibu.max), central: arrondi(p.amertume.ibu.valeur) }, unite: 'IBU',
    base: `IBU de l’ajout (BrewingMath de l’app) ; α : ${h?.alpha?.from ?? 'inconnu'}`, source: h?.stock ? ['stock-affinee'] : bm ? [bm] : [], largeur: largeur(p.amertume.ibu.min, p.amertume.ibu.max), texte: p.amertume.lecture ?? undefined });
  for (const v of verificationsDe(p.nom)) out.push({ type: 'mesureEnBiere', ajout: b.id, houblon: p.nom, compose: v.compose, plage: plage3(v.mesure), unite: v.unite, texte: v.texte, source: cles(v.sources), largeur: largeur(v.mesure.min, v.mesure.max), base: `calcul du moteur : ${v.verdict}` });
  return out;
}
let VERIFS: ReturnType<typeof verifications> | null = null;
const verificationsDe = (nom: string) => (VERIFS ??= verifications()).filter((v) => v.houblon === nom);
type PouvoirRecette_ = ReturnType<typeof pouvoirRecette>;
function mesuresRecette(pr: PouvoirRecette_, bases: Base[]): MesureReelle[] {
  if (bases.length < 2) return [];
  return MESURES_COMPOSES.map((c) => {
    const x = pr.composes[c];
    return { type: 'compose' as const, ajout: 'recette', compose: c, nom: x.nom, unite: x.concentration.unite, base: 'somme des ajouts de la recette, Nugget compris (moteur) ; ordre, synergie, masquage inconnus', niveau: x.rapport.niveau,
      source: cles([...x.concentration.sources, ...x.rapport.sources]), largeur: largeur(x.concentration.plage?.min, x.concentration.plage?.max),
      concentration: { plage: plage3(x.concentration.plage), unite: x.concentration.unite, largeur: largeur(x.concentration.plage?.min, x.concentration.plage?.max), inconnu: x.concentration.inconnu },
      rapport: { plage: plage3(x.rapport.plage), largeur: largeur(x.rapport.plage?.min, x.rapport.plage?.max), lecture: x.lecture.texte, inconnu: x.rapport.inconnu }, mention: MENTION_RAPPORT };
  });
}

// ---------- Drapeaux ----------
const versSimule = (d: Drapeau, ajout?: string): DrapeauSimule => ({ id: d.id, titre: d.titre, statut: d.statut, pourquoi: d.pourquoi, sources: cles(d.sources), ...((ajout ?? d.ajout) ? { ajout: ajout ?? d.ajout } : {}) });
const sortentDuStyle = (av: ProfilFamilles, ap: ProfilFamilles) => FAMILIES.filter((f) => ap[f].crans === 4 && av[f].crans !== 4);
function drapeauxSimules(bases: Base[], av: ProfilFamilles, ap: ProfilFamilles, levure: string, scale: StyleScale, doseACru: number): DrapeauSimule[] {
  const out: DrapeauSimule[] = [{ id: 'simule', titre: 'Profil simulé', statut: 'simulé', pourquoi: MENTION_SIMULE, sources: [] }];
  const sortent = sortentDuStyle(av, ap);
  if (scale.documented && sortent.length) {
    const st = DONNEES_POUVOIR.styles[scale.code];
    out.push({ id: 'hors-du-style', titre: `Sort du style ${scale.code} (simulé) : ${sortent.map((f) => FAMILY_NAMES[f]).join(', ')}`, statut: 'simulé', familles: sortent,
      pourquoi: `Centre simulé au-dessus de la bande du style.${st ? ` Le style attend un ${st.attendu} (« ${st.arome} »).` : ''} Lecture simulée, pas une mesure ; perception en bière noire non documentée.`, sources: st ? st.sources : [] });
  }
  for (const b of bases) {
    const bio = biotransfoLevure(levure, b.a.moment);
    if (!bio.actif) continue;
    if (bio.conv.centre > 0 && b.conc.geraniol) out.push({ id: 'biotransformation-geraniol', ajout: b.id, titre: 'Simulé : géraniol → citronellol, vers les agrumes', statut: `convention : ${Math.round(bio.conv.centre * 100)} % au centre`, familles: ['citrus', 'floral'], pourquoi: bio.texteConv, sources: bio.sources });
    else if (b.conc.geraniol) out.push({ id: 'biotransformation-geraniol', ajout: b.id, titre: 'Géraniol → citronellol : possible, non documenté pour cette levure', statut: 'centre 0, haut 87 % [convention]', familles: ['citrus', 'floral'], pourquoi: bio.texteConv, sources: bio.sources });
    if (b.precurseurs) out.push({ id: 'biotransformation-thiols', ajout: b.id, titre: bio.rend.centre > 0 ? 'Simulé : thiols libérés des précurseurs (3MH)' : 'Thiols libérés : β-lyase non publiée pour cette levure', statut: bio.rend.centre > 0 ? `convention : ${bio.rend.centre} % au centre` : 'centre 0, haut 0,35 % [convention]', familles: ['citrus', 'tropical'],
      pourquoi: `${bio.texteRend} Précurseurs : ${b.precurseurs.chiffre ?? ''}.`, sources: [...bio.sources, ...(b.precurseurs.sources ?? [])] });
  }
  for (const b of bases.filter((x) => x.sansDonnees)) out.push({ id: 'sans-composes', ajout: b.id, titre: `${b.nom} : forme des fiches seules`, statut: 'confiance faible', pourquoi: C.sansComposes.texte, sources: C.sansComposes.sources });
  if (bases.filter((b) => estSec(b.a.moment)).length > 1) out.push({ id: 'saturation-partagee', titre: 'Saturation partagée : la dose totale compte', statut: `dose à cru ${arrondi(doseACru)} g/L`,
    pourquoi: `Les activités des ajouts s’additionnent avant la courbe de saturation (H22) : ensemble, ils donnent moins que la somme de chacun seul. ${DONNEES_POUVOIR.ajoutsSuccessifs.saturationSecondAjout.texte}`, sources: [...C.courbes.agrumes.sources, ...DONNEES_POUVOIR.ajoutsSuccessifs.saturationSecondAjout.sources] });
  return out;
}
function drapeauxMoteur(pr: PouvoirRecette_, bases: Base[]): DrapeauSimule[] {
  const out: DrapeauSimule[] = [], vus = new Set<string>();
  for (const d of pr.drapeaux) if (!vus.has(d.id)) { vus.add(d.id); out.push(versSimule(d)); }
  for (const a of pr.ajouts.filter((x) => bases.some((b) => b.id === x.id))) for (const d of a.drapeaux) {
    const k = `${a.id}:${d.id}`;
    if (!vus.has(k)) { vus.add(k); out.push(versSimule(d, a.id)); }
  }
  return out;
}
/** Identifiants des drapeaux, sans textes (grille). */
function idsDrapeaux(bases: Base[], av: ProfilFamilles, ap: ProfilFamilles, levure: string, doseACru: number): string[] {
  const ids = new Set<string>(['simule', 'biere-noire']);
  for (const b of bases) {
    for (const d of b.p.drapeaux) if (['amertume', 'duree-longue', 'saturation', 'hop-creep', 'geraniol-citronellol', 'cryo'].includes(d.id)) ids.add(d.id);
    const bio = biotransfoLevure(levure, b.a.moment);
    if (bio.actif && b.conc.geraniol) ids.add('biotransformation-geraniol');
    if (bio.actif && b.precurseurs) ids.add('biotransformation-thiols');
    if (b.sansDonnees) ids.add('sans-composes');
  }
  if (sortentDuStyle(av, ap).length) ids.add('hors-du-style');
  if (bases.length > 1) { ids.add('ordre'); ids.add('synergie'); ids.add('masquage'); }
  if (bases.filter((b) => estSec(b.a.moment)).length > 1) ids.add('saturation-partagee');
  if (doseACru >= DONNEES_POUVOIR.saturation.zone[0]) ids.add('saturation');
  return [...ids];
}

// ---------- Un cas ----------
export interface CasEntree {
  id: string; titre: string; ajouts: AjoutSimule[]; levure: string;
  /** Bière de départ : ses ajouts sont l'« avant » (ex. Nugget à 60′ de la 16D S1). */
  recette: RecettePouvoir;
  degustation?: Tasting | null;
  /** Par défaut : mesures, drapeaux complets et parJour (J0–J10). false pour la grille (drapeaux en identifiants). */
  complet?: boolean;
}
const ajoutDeBase = (x: AjoutPouvoir, r: RecettePouvoir): AjoutSimule => ({ id: x.id, houblon: x.hopKey, dose_gL: x.grams / r.volumeL, moment: x.moment as MomentSimule, jourDebut: x.day ?? null, jours: x.dureeJours ?? null });
const fam = <T>(fn: (f: FamilyId) => T) => Object.fromEntries(FAMILIES.map((f) => [f, fn(f)])) as Record<FamilyId, T>;
/** Profil simulé d'un cas : avant (la bière de départ), après (avec les ajouts), écart, par jour, part de chacun,
 * saturation, biotransformation, drapeaux, confiance, mesures réelles. */
export function simulerCas(e: CasEntree): CasSimule {
  const complet = e.complet !== false;
  const recette: RecettePouvoir = { ...e.recette, yeastId: e.levure };
  const scale = scaleDe(recette.styleCode);
  const ajouts = e.ajouts.map((a, i) => ({ ...a, id: a.id ?? `ajout${i + 1}` }));
  const basesAvant = recette.additions.map((x) => baseAjout(ajoutDeBase(x, recette), recette));
  const bases = ajouts.map((a) => baseAjout(a, recette));
  const Sav = sommeA(basesAvant.map((b) => activiteDe(b, recette, null)));
  const avant = profils(Sav, null, scale, e.degustation);
  const acts = bases.map((b) => activiteDe(b, recette, null));
  const Sadd = sommeA(acts);
  const apres = profils(Sav, Sadd, scale, e.degustation);
  const delta = deltaDe(avant, apres, scale);
  // Part de chacun : l'écart d'ensemble au prorata des activités ; « seul » : l'écart de l'ajout sans les autres.
  const apportsParHoublon: ApportHoublon[] = bases.map((b, i) => {
    const seulP = profils(Sav, sommeA([acts[i]]), scale, e.degustation);
    const part = fam((f) => { const tot = acts.reduce((s, x) => s + x.A[f].centre, 0); return tot > 0 ? arrondi(acts[i].A[f].centre / tot) : 0; });
    return { id: b.id, houblon: b.a.houblon, nom: b.nom, dose_gL: b.a.dose_gL, seul: fam((f) => arrondi(seulP[f].centre - avant[f].centre)), part, apport: fam((f) => arrondi(delta[f].centre * part[f])) };
  });
  const doseTotale = bases.reduce((s, b) => s + b.a.dose_gL, 0);
  const doseACru = bases.filter((b) => estSec(b.a.moment)).reduce((s, b) => s + b.a.dose_gL, 0);
  const zone = DONNEES_POUVOIR.saturation.zone as [number, number];
  const facteur = bases.length > 1 ? fam((f) => { const s = apportsParHoublon.reduce((t, x) => t + x.seul[f], 0); return s > 0 ? arrondi(delta[f].centre / s) : null; }) : null;
  // Par jour, depuis le premier dry hop (J0) : chaque ajout à cru compte ses jours de contact, plafonnés à sa durée.
  const secs = ajouts.filter((a) => estSec(a.moment));
  const j0 = secs.length ? Math.min(...secs.map((a) => a.jourDebut ?? 0)) : null;
  const parJour = complet && j0 != null ? Array.from({ length: 11 }, (_, t) => {
    const actsT = bases.map((b) => (estSec(b.a.moment) ? activiteDe(b, recette, Math.max(0, Math.min(t - ((b.a.jourDebut ?? 0) - j0), b.a.jours ?? 3))) : activiteDe(b, recette, null)));
    const p = profils(Sav, sommeA(actsT), scale, e.degustation);
    return { jour: t, jourRecette: secs.some((a) => a.jourDebut != null) ? j0 + t : null,
      familles: fam((f) => ({ bas: p[f].bas, centre: p[f].centre, haut: p[f].haut, crans: p[f].crans, largeur: p[f].largeur })) };
  }) : [];
  const pr = complet ? pouvoirRecette({ ...recette, additions: [...recette.additions, ...ajouts.map((a) => ajoutPouvoirDe(a, recette, a.id))] }) : null;
  const bio = biotransfoLevure(e.levure, secs[0]?.moment ?? 'dryPost');
  return {
    id: e.id, titre: e.titre, simule: true, mention: MENTION_SIMULE,
    ajouts: bases.map((b) => ({ id: b.id, houblon: b.a.houblon, nom: b.nom, dose_gL: b.a.dose_gL, moment: b.a.moment, jourDebut: b.a.jourDebut ?? null, jours: estSec(b.a.moment) ? b.a.jours ?? 3 : null, levure: e.levure })),
    levure: e.levure, avant, apres, delta, parJour, apportsParHoublon,
    saturation: { doseTotale_gL: arrondi(doseTotale), doseACru_gL: arrondi(doseACru), zone, dansZone: doseACru >= zone[0] && doseACru <= zone[1], facteur,
      texte: `${DONNEES_POUVOIR.saturation.texte} Preuve : ${DONNEES_POUVOIR.saturation.portee}. Simulé : une courbe de saturation sur l’activité totale ; « facteur » = écart d’ensemble ÷ somme des écarts de chacun seul.` },
    biotransformation: { actif: bio.actif, levure: e.levure, geraniolCitronellol: bio.conv, rendementThiolsPct: bio.rend,
      parAjout: bases.map((b, i) => ({ ajout: b.id, citronellol_ugL: acts[i].citronellol && arrondiTri(acts[i].citronellol!), thiolsLiberes_ngL: acts[i].thiolsLiberes && arrondiTri(acts[i].thiolsLiberes!), raison: acts[i].raisonBio })) },
    drapeaux: complet ? [...drapeauxSimules(bases, avant, apres, e.levure, scale, doseACru), ...drapeauxMoteur(pr!, bases)] : [],
    drapeauxIds: idsDrapeaux(bases, avant, apres, e.levure, doseACru),
    confiance: confianceDe(bases, e.levure),
    mesures: complet ? [...bases.flatMap(mesuresAjout), ...mesuresRecette(pr!, bases)] : [],
  };
}
/** Profil simulé de la bière de départ seule (ses ajouts), la dégustation primant. */
export function profilAvant(recette: RecettePouvoir, levure: string, degustation?: Tasting | null): ProfilFamilles {
  return simulerCas({ id: 'avant', titre: 'avant', ajouts: [], levure, recette, degustation, complet: false }).avant;
}

// ---------- Échelle et style, pour le fichier de données ----------
export function echelleSimulee(code = '16D') {
  const s = scaleDe(code);
  return {
    min: 0, max: 100, classes: { faible: [0, 33], moyenne: [33, 66], forte: [66, 100] },
    source: 'src/data/hopV4/style-bands.json (échelle des axes V5.5) ; crans : src/domain/hopIndex/v4/levels.ts',
    crans: CRANS_RULE, statut: s.table.status, rognage: 'aucun : une valeur simulée peut dépasser la bande du style (crans 4) ; elle n’est jamais ramenée dans 0–100 de force',
    parFamille: fam((f) => { const fs = s.families[f]; return { bande: fs.band, cran: arrondi(fs.cran), seuilEcart: arrondi(fs.threshold), domaine: fs.domain, courbe: courbeDe(f).id }; }),
  };
}
export function styleSimule(code = '16D') {
  const s = scaleDe(code), st = DONNEES_POUVOIR.styles[code];
  return { code, nom: s.name, url: s.url, attendu: st?.attendu ?? null, citation: st?.arome ?? null, abv: st?.abv ?? null, ordre: s.order, general: s.overall,
    zone: fam((f) => { const fs = s.families[f]; return { statut: fs.status, bande: fs.band, crans: fs.band ? { min: 0, max: Math.round((fs.band[1] - fs.band[0]) / fs.cran) } : null, citations: fs.quotes }; }),
    biereNoire: DONNEES_POUVOIR.biereNoire.texte, sources: st?.sources ?? [] };
}
