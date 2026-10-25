// Comparer (r6a) : ce que l'écran lit du moteur, recalculé à chaque changement de houblons. Aucune grille figée :
// tout part de `comparer` (src/moteur), qui simule chaque houblon à 4 g/L, après fermentation, 3 j, levure de la
// recette (simulerCas). Les règles de lecture sont celles de r6a (fils22-comparer/r6a/generer.mjs), recopiées
// ici comme règles et non comme nombres :
//  - échelle au style : valeur / haut du domaine de la famille ; absolu : valeur / 125 (rien n'est rogné) ;
//  - inconnu : rien de simulé, ou une famille que ses fiches ne décrivent pas et que le moteur ne bouge pas ;
//  - écart en crans : (après − ta stout) / cran du style ;
//  - « sort de ta 16D » : au-dessus du haut de la bande alors que ta stout était dedans ;
//  - mis en avant au départ : le plus floral qui reste dans ta 16D.
import type { FamilyId } from '../../../../../../src/domain/hopIndex/v4';
import { biotransfoLevure, familyWords, hopRef, simulerCas } from '../../moteur/v4';
import type { RecettePouvoir } from '../../../../../../src/domain/hopIndex/v4/pouvoir';
import { S1_DIRECTION } from '../../../../src/pack/buildPack';
import { comparer, effetLevure, style, type Colonne, type HoublonLu } from '../../moteur';
import { placer } from '../../etat/quand';
import { CONDITIONS } from '../../donnees/cas';
import type { Quand, RecetteParcours } from '../../etat/types';
import { huile as huileSources } from './valeurs';
import { nombre } from '../../commun';

export const ABSOLU = 125;
/** Orangé « au-dessus du style » (D83 : la seule couleur hors famille admise sur un élément de famille). */
export const ORANGE = '#c2410c';

/** cmc (25.10, « les couleurs et contraste mieux dessiné […] car on peut confondre un peu ») : rouge, bleu, vert d'eau,
 * violet, magenta, bien séparés en teinte, chacun ≥ 4,8:1 sur le papier et sur la colonne retenue (#f4f4f4).
 * Avant : une couleur par houblon, la même que dans les lots 20 à 22 (fils20-dryhop/donnees-h.json ; Nelson Sauvin
 * comme r6c et r6n2). Les autres, choisies à plus de 25 ΔE des trois du cas (D77). */
const COULEURS_HOUBLON: Record<string, string> = {
  'beermaverick-cascade': '#1d5bd8',
  'beermaverick-idaho-7': '#d1043c',
  'beermaverick-galaxy': '#00796b',
  'beermaverick-citra': '#6d28d9',
  'beermaverick-citra:cryo': '#6d28d9',
  'beermaverick-nelson-sauvin': '#0b6e63',
  'beermaverick-motueka': '#8a5a00',
  'beermaverick-sabro': '#b5179e',
  'beermaverick-hallertau-blanc': '#4f6b00',
  'beermaverick-target': '#3d3d47',
  'beermaverick-nugget': '#0072b2',
};
export const couleurHoublon = (cle: string) => COULEURS_HOUBLON[cle] ?? '#3d3d47';

export interface CelluleLue {
  famille: FamilyId;
  inconnu: boolean;
  raison: string | null;
  bas: number; centre: number; haut: number;
  /** Ta stout aujourd'hui (le trait noir) ; null si inconnue. */
  avant: number | null;
  /** Haut de la bande de ta 16D (0–100) ; null si le style ne la documente pas. */
  bandeHaut: number | null;
  /** Haut du domaine de la piste au style. */
  domaine: number;
  cran: number;
  /** Écart simulé en crans du style ; null si inconnu. */
  dCran: number | null;
  hors: boolean;
}
export interface ColonneLue {
  cle: string;
  houblon: HoublonLu;
  couleur: string;
  colonne: Colonne;
  cellules: Record<FamilyId, CelluleLue>;
  /** Familles qui sortent de ta 16D. */
  sorties: FamilyId[];
}

const r2 = (x: number) => Math.round(x * 100) / 100;

/** Les colonnes au moment `quand` (D128 : le sélecteur 60′ · 10′ · dry hop sur les rangées et le radar) ; sans
 * `quand`, au dry hop, après 3 j (le moment de r6a). « Ta stout » (le trait noir) reste la bière de base. */
export function lireColonnes(recette: RecetteParcours, cles: string[], doseGL?: number, quand?: Quand): ColonneLue[] {
  const sc = style(recette.styleCode);
  return comparer(recette, cles, { ...(doseGL ? { doseGL } : {}), ...(quand ? { quand } : {}) }).map((c) => {
    const cellules = {} as Record<FamilyId, CelluleLue>;
    for (const f of sc.order) {
      const fs = sc.families[f];
      const v = c.lu.apres.profil[f].valeur;
      const av = c.lu.avant.profil[f].valeur;
      const nonDecrit = c.houblon.familles[f].niveau === 'non décrit';
      const zero = !v || (v.bas === 0 && v.centre === 0 && v.haut === 0);
      const centre = v?.centre ?? 0;
      // Écart à ta stout. Ta stout inconnue sur la famille (rien de simulé ni dégusté) : l'apport se lit depuis 0,
      // comme r6a, mais le trait de ta stout n'est pas dessiné (inconnu ≠ 0).
      const delta = v ? centre - (av?.centre ?? 0) : null;
      const immobile = delta == null || Math.abs(delta) < 0.005;
      const inconnu = zero || (immobile && nonDecrit);
      const bandeHaut = fs.band ? fs.band[1] : null;
      cellules[f] = {
        famille: f, inconnu,
        raison: inconnu ? (zero ? c.lu.apres.profil[f].raison ?? 'rien de simulé' : 'famille absente de ses fiches, que le moteur ne bouge pas') : null,
        bas: v?.bas ?? 0, centre, haut: v?.haut ?? 0,
        avant: av?.centre ?? null,
        bandeHaut, domaine: fs.domain[1], cran: fs.cran,
        dCran: inconnu || delta == null ? null : r2(delta / fs.cran),
        hors: !inconnu && bandeHaut != null && centre > bandeHaut && (av?.centre ?? 0) <= bandeHaut,
      };
    }
    return { cle: c.cle, houblon: c.houblon, couleur: couleurHoublon(c.cle), colonne: c, cellules, sorties: sc.order.filter((f) => cellules[f].hors) };
  });
}

// ---------- Aux étapes (D107, à la manière de x3b) ----------
// « je voulais comparé au moins : les étapes 60' 10' dryhopping ect […] Et aussi le houblon de base ou bière de
// base » (23.10). Chaque houblon, à la même dose (4 g/L), posé à 60′, à 10′ et au dry hop (après, 3 j : le moment du
// radar et des rangées), simulé par le moteur à chaque changement de houblons ou de recette. Le moteur simule l'arôme
// à 60′, 10′, whirlpool et dry hop ; l'IBU à toute minute (ibuAjout) et pas à froid.
// D141 (25.10, « surtout pouvoir choisir quand comparé. 60' 10' dryhopping... ») : cinq moments ; le moteur pose chaque
// houblon à chacun, à la même dose (ébullition 60′ et 10′, whirlpool, dry hop pendant la fermentation active ou après, 3 j).
export type CodeEtape = 'b60' | 'b10' | 'wp' | 'dryActive' | 'dryPost';
export const ETAPES: { code: CodeEtape; dm: string; nom: string; court: string; dit: string; groupe: 'chaud' | 'froid'; quand: Quand }[] = [
  { code: 'b60', dm: '60', nom: '60′', court: '60′', dit: 'à 60′', groupe: 'chaud', quand: { type: 'ebullition', minutes: 60 } },
  { code: 'b10', dm: '10', nom: '10′', court: '10′', dit: 'à 10′', groupe: 'chaud', quand: { type: 'ebullition', minutes: 10 } },
  { code: 'wp', dm: 'whirlpool', nom: 'whirlpool', court: 'WP', dit: 'au whirlpool', groupe: 'chaud', quand: { type: 'whirlpool' } },
  { code: 'dryActive', dm: 'dryhop-actif', nom: 'dry hop actif', court: 'actif', dit: 'au dry hop actif', groupe: 'froid', quand: { type: 'dryhop', phase: 'actif', jours: CONDITIONS.jours } },
  { code: 'dryPost', dm: 'dryhop-apres', nom: 'dry hop après', court: 'après', dit: 'au dry hop après', groupe: 'froid', quand: { type: 'dryhop', phase: 'apres', jours: CONDITIONS.jours } },
];
export const etape = (code: CodeEtape) => ETAPES.find((e) => e.code === code)!;

/** Huile totale (mL/100 g) : l'enveloppe des sources (valeurs.ts, celle de « Valeurs »), sinon le catalogue (Beer
 * Maverick) ; null : inconnue, jamais 0. Échelle commune des têtes : 0 à 5 mL/100 g ; Saaz (catalogue) en repère « fade ». */
export const HUILE_MAX = 5;
export const SAAZ = 'beermaverick-saaz-cz';
export function huileDe(cle: string): { lo: number; hi: number; texte: string; source: string } | null {
  const v = huileSources(cle);
  if (v && v.hi != null) return { lo: v.lo, hi: v.hi, texte: v.texte, source: v.refs.join(', ') };
  const o = hopRef(cle)?.catalogue.oil;
  return o ? { lo: o[0], hi: o[1], texte: `${nombre(o[0], 1)}–${nombre(o[1], 1)}`, source: 'BM' } : null;
}
export interface ValeurEtape {
  /** Crans du style gagnés sur ta stout (floral, résineux) ; null : inconnu (rien de simulé), jamais 0. */
  floral: number | null;
  resineux: number | null;
  /** D128 : les crans gagnés de chaque famille (le critère de la pastille choisit celle que montre la bande). */
  crans: Record<FamilyId, number | null>;
  /** IBU de l'ajout à ce moment (valeur, min, max par la plage d'α) ; null à froid ou α inconnu, avec la raison. */
  ibu: { valeur: number; min: number; max: number } | null;
  raisonIbu: string | null;
  raison: string | null;
}
export type Etapes = Record<string, Record<CodeEtape, ValeurEtape>>;

export function lireEtapes(recette: RecetteParcours, cles: string[]): Etapes {
  const sc = style(recette.styleCode);
  const out: Etapes = {};
  for (const cle of cles) out[cle] = {} as Record<CodeEtape, ValeurEtape>;
  for (const e of ETAPES) {
    for (const c of comparer(recette, cles, { quand: e.quand })) {
      const cr = (f: FamilyId) => { const x = c.lu.ecart[f]; return x ? r2(x.centre / sc.families[f].cran) : null; };
      const crans = Object.fromEntries(sc.order.map((f) => [f, cr(f)])) as Record<FamilyId, number | null>;
      out[c.cle][e.code] = { floral: cr('floral'), resineux: cr('resin'), crans, ibu: c.lu.ibu.ibu, raisonIbu: c.lu.ibu.raison, raison: c.lu.raison };
    }
  }
  return out;
}

/** La référence aux mêmes étapes : le houblon de base de ta recette (le premier ajout à chaud, sinon le premier
 * ajout), s'il n'est pas déjà comparé ; à défaut, la bière de base (ta stout seule). */
export function houblonDeBase(recette: RecetteParcours, compares: string[]): string | null {
  const chaud = recette.additions.find((a) => /^(fwh|b\d+)$/.test(a.moment)) ?? recette.additions[0];
  const cle = chaud?.hopKey ?? null;
  return cle && !compares.includes(cle) ? cle : null;
}

/** Critère de classement (y1b, r6n2 : « Face à ta stout, par [floral ⌄] ») : la famille et le sens qu'on veut. La
 * pastille change le ★, la réponse, la colonne mise en avant et le Défi ; l'ordre des colonnes reste celui de la
 * question (le premier écran de r6a). */
export interface Critere { id: string; famille: FamilyId; sens: 1 | -1; nom: string }
export const CRITERES: Critere[] = [
  { id: 'floral', famille: 'floral', sens: 1, nom: 'floral' },
  { id: 'agrumes', famille: 'citrus', sens: 1, nom: 'agrumes' },
  { id: 'tropicaux', famille: 'tropical', sens: 1, nom: 'tropicaux' },
  { id: 'moins-resineux', famille: 'resin', sens: -1, nom: 'moins résineux' },
];

/** Mis en avant au départ (règle de r6a, écrite dans la légende) : le plus de la famille visée sans sortir de ta
 * 16D ; à défaut, le plus de la famille visée. Sens −1 : le moins (« moins résineux »). */
export function depart(cols: ColonneLue[], visee: FamilyId, sens: 1 | -1 = 1): string | null {
  const v = (c: ColonneLue) => { const d = c.cellules[visee].dCran; return d == null ? -Infinity : sens * d; };
  const parVisee = (a: ColonneLue, b: ColonneLue) => v(b) - v(a);
  const dans = cols.filter((c) => !c.sorties.length).sort(parVisee);
  return (dans[0] ?? [...cols].sort(parVisee)[0])?.cle ?? null;
}

/** La réponse face à ta stout (y1b, r6n2) et « contre ★ » chiffré (r6p2) : sur la famille visée, le meilleur
 * houblon (★, même règle que le départ) et l'écart en crans du houblon retenu contre lui, ou du suivant. */
export interface Reponse { etoile: ColonneLue; autre: ColonneLue | null; ecart: number | null; retenuEstEtoile: boolean }
export function reponse(cols: ColonneLue[], retenu: string, visee: FamilyId, sens: 1 | -1 = 1): Reponse | null {
  const cleEtoile = depart(cols, visee, sens);
  const etoile = cols.find((c) => c.cle === cleEtoile);
  if (!etoile) return null;
  const v = (c: ColonneLue) => c.cellules[visee].dCran;
  if (retenu !== etoile.cle) {
    const r = cols.find((c) => c.cle === retenu) ?? null;
    const a = r ? v(r) : null, b = v(etoile);
    return { etoile, autre: r, ecart: a != null && b != null ? r2(a - b) : null, retenuEstEtoile: false };
  }
  const suivants = cols.filter((c) => c.cle !== etoile.cle && v(c) != null).sort((a, b) => sens * ((v(b) ?? 0) - (v(a) ?? 0)));
  const s = suivants[0] ?? null;
  const a = v(etoile), b = s ? v(s) : null;
  return { etoile, autre: s, ecart: a != null && b != null ? r2(a - b) : null, retenuEstEtoile: true };
}

/** « Égaler » (y3) : la dose de chaque autre houblon qui donne, sur la famille visée, l'écart que le retenu donne
 * à 4 g/L. Recherche par dichotomie sur 0,5–16 g/L (le moteur, à chaque pas ; l'effet croît avec la dose).
 * null : jamais atteint à 16 g/L (le moteur ne l'atteint pas sur cette plage : écrit, jamais un nombre). */
export function egaler(recette: RecetteParcours, cible: ColonneLue, autres: ColonneLue[], visee: FamilyId, max = 16): { cle: string; doseGL: number | null }[] {
  const sc = style(recette.styleCode);
  const but = cible.cellules[visee].dCran;
  if (but == null) return autres.map((a) => ({ cle: a.cle, doseGL: null }));
  const effet = (cle: string, d: number) => {
    const e = comparer(recette, [cle], { doseGL: d })[0].lu.ecart[visee];
    return e ? e.centre / sc.families[visee].cran : null;
  };
  return autres.map((a) => {
    let bas = 0.5, haut = max;
    const h = effet(a.cle, haut);
    if (h == null || h < but) return { cle: a.cle, doseGL: null };
    for (let i = 0; i < 7; i++) {
      const m = (bas + haut) / 2;
      const x = effet(a.cle, m);
      if (x != null && x >= but) haut = m; else bas = m;
    }
    return { cle: a.cle, doseGL: Math.round(haut * 2) / 2 };
  });
}

// ---------- Le dock de r6n2 : Défi, Preuve, Frise, Souche, et la biotransformation de x3b ----------
// Tout se lit dans le moteur à l'instant (simulerCas par l'adaptateur), mémoïsé par l'écran.

/** Ta demande en crans (S1_DIRECTION du moteur : floral +1, résineux −1), la visée du Défi. */
export const VISEES = S1_DIRECTION as Partial<Record<FamilyId, number>>;

export type Verdict = 'atteint' | 'approche' | 'aucune' | 'inconnu';
/** Verdict d'un houblon face à une visée signée (crans) : atteint au-delà, approche dans le bon sens, aucune sinon. */
export function verdict(d: number | null, visee: number): Verdict {
  if (d == null) return 'inconnu';
  const s = Math.sign(visee);
  return s * d >= Math.abs(visee) - 0.005 ? 'atteint' : s * d > 0.05 ? 'approche' : 'aucune';
}
/** Le score du Défi (r6n2 « Défi 2/4 ») : plus floral, moins résineux, amertume tenue, dans ta 16D. L'amertume du
 * dry hop n'est pas modélisée à cru : jamais comptée comme tenue (inconnu ≠ réussi). */
export function scoreDefi(c: ColonneLue): { points: number; sur: number } {
  let points = 0;
  for (const [f, v] of Object.entries(VISEES) as [FamilyId, number][]) if (verdict(c.cellules[f].dCran, v) === 'atteint') points++;
  if (!c.sorties.length) points++;
  return { points, sur: Object.keys(VISEES).length + 2 };
}

/** Graine fixe (mulberry32) : le même tirage à chaque rendu ; « 20 autres » change la graine. */
function hasard(graine: number) {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export interface Tirage { points: boolean[]; hors: number; deja: boolean }
/** Les 20 bières tirées (y1b, r6n2) : 20 valeurs au hasard dans la bande du moteur (bas–haut), et combien sortent
 * de ta 16D. Inconnu : null (rien à tirer, jamais 0). Ta stout déjà au-dessus : « déjà hors ». Une hypothèse
 * (tirage uniforme), marquée « ~ ». */
export function tirer(cols: ColonneLue[], familles: FamilyId[], graine: number, n = 20): Record<string, Partial<Record<FamilyId, Tirage | null>>> {
  const out: Record<string, Partial<Record<FamilyId, Tirage | null>>> = {};
  cols.forEach((c, i) => {
    out[c.cle] = {};
    familles.forEach((f, j) => {
      const cel = c.cellules[f];
      if (cel.inconnu || cel.bandeHaut == null) { out[c.cle][f] = null; return; }
      const deja = cel.avant != null && cel.avant > cel.bandeHaut;
      const h = hasard(graine * 7919 + i * 131 + j * 17 + 1);
      const points = Array.from({ length: n }, () => cel.bas + (cel.haut - cel.bas) * h() > cel.bandeHaut!);
      out[c.cle][f] = { points, hors: points.filter(Boolean).length, deja };
    });
  });
  return out;
}

const ACTIF: Quand = { type: 'dryhop', phase: 'actif', jours: CONDITIONS.jours };
const APRES: Quand = { type: 'dryhop', phase: 'apres', jours: CONDITIONS.jours };
const enCrans = (sc: ReturnType<typeof style>, f: FamilyId, x: number) => r2(x / sc.families[f].cran);

/** Ce qui bouge dans Dryhopper (r6n2, Frise) : le même ajout pendant la fermentation active au lieu d'après, en
 * crans du style, famille par famille. */
export function enActif(recette: RecetteParcours, cles: string[]): Record<string, Partial<Record<FamilyId, number>>> {
  const sc = style(recette.styleCode);
  const a = comparer(recette, cles, { quand: ACTIF }), p = comparer(recette, cles, { quand: APRES });
  const out: Record<string, Partial<Record<FamilyId, number>>> = {};
  a.forEach((c, i) => {
    out[c.cle] = {};
    for (const f of sc.order) {
      const x = c.lu.apres.profil[f].valeur, y = p[i].lu.apres.profil[f].valeur;
      if (x && y) out[c.cle][f] = enCrans(sc, f, x.centre - y.centre);
    }
  });
  return out;
}

/** Jour après jour (r6n2, Frise) : le centre simulé d'une famille, sur 100, après 1 à 7 j de contact. */
export function jourApresJour(recette: RecetteParcours, cles: string[], f: FamilyId, jours = 7): Record<string, (number | null)[]> {
  const out: Record<string, (number | null)[]> = Object.fromEntries(cles.map((k) => [k, [] as (number | null)[]]));
  for (let j = 1; j <= jours; j++) {
    for (const c of comparer(recette, cles, { quand: { type: 'dryhop', phase: 'apres', jours: j } })) out[c.cle].push(c.lu.apres.profil[f].valeur?.centre ?? null);
  }
  return out;
}

/** La souche (r6n2, Souche) : l'autre levure (Pomona, ou US-05 si la recette est déjà en Pomona) face à celle de ta
 * recette, le même ajout à 4 g/L, après fermentation puis pendant la fermentation active, en crans du style. */
export const POMONA = 'lalbrew-pomona';
export interface SoucheLue { levure: string; autre: string; apres: Record<string, Partial<Record<FamilyId, number>>>; actif: Record<string, Partial<Record<FamilyId, number>>> }
export function souche(recette: RecetteParcours, cles: string[]): SoucheLue {
  const sc = style(recette.styleCode);
  const levure = recette.yeastId ?? CONDITIONS.levure;
  const autre = levure === POMONA ? CONDITIONS.levure : POMONA;
  const lire = (q: Quand) => {
    const out: Record<string, Partial<Record<FamilyId, number>>> = {};
    for (const cle of cles) {
      const ajout = placer({ id: `souche-${cle}`, hopKey: cle, grams: CONDITIONS.doseGL * recette.volumeL, moment: 'dryPost' }, q, recette);
      const e = effetLevure({ ...recette, yeastId: levure }, ajout, [levure, autre]).find((x) => x.levure === autre)!;
      out[cle] = {};
      for (const f of sc.order) { const d = e.ecart[f]; if (d) out[cle][f] = enCrans(sc, f, d.centre); }
    }
    return out;
  };
  return { levure, autre, apres: lire(APRES), actif: lire(ACTIF) };
}

/** La biotransformation de x3b (« La biotransformation de ce plan »), lue dans le moteur : au dry hop de Comparer
 * (après fermentation), la levure est au repos ; pendant la fermentation active, géraniol → citronellol et thiols
 * libérés des précurseurs, pour la levure de ta recette, à 4 g/L, 3 j. */
type Tri = { bas: number; centre: number; haut: number };
export interface BioLue { cle: string; citronellol: Tri | null; thiols: Tri | null; raison: string | null }
export interface Bio { levure: string; actifIci: boolean; conv: Tri; rend: Tri; texteConv: string; texteRend: string; sources: string[]; parHoublon: BioLue[] }
export function biotransformation(recette: RecetteParcours, cles: string[]): Bio {
  const levure = recette.yeastId ?? CONDITIONS.levure;
  const b = biotransfoLevure(levure, 'dryActive');
  const parHoublon = cles.map((cle): BioLue => {
    const cas = simulerCas({
      id: `bio-${cle}`, titre: 'biotransformation', levure, recette: { ...recette, additions: [] } as unknown as RecettePouvoir, degustation: null, complet: false,
      ajouts: [{ id: 'bio', houblon: cle, dose_gL: CONDITIONS.doseGL, moment: 'dryActive', jourDebut: CONDITIONS.jourDebut.dryActive, jours: CONDITIONS.jours }],
    });
    const x = cas.biotransformation.parAjout[0];
    return { cle, citronellol: x?.citronellol_ugL ?? null, thiols: x?.thiolsLiberes_ngL ?? null, raison: x?.raison ?? null };
  });
  return { levure, actifIci: biotransfoLevure(levure, 'dryPost').actif, conv: b.conv, rend: b.rend, texteConv: b.texteConv, texteRend: b.texteRend, sources: b.sources, parHoublon };
}

// ---------- Ses mots (D128 bis) ----------
// Sur flb5 (24.10) : « J'aime beaucoup le 9 car ont voit que c'est pas que du 16d, le houblon a vraiment beaucoup plus
// de subtilité. À montré aussi, notamment pour la comparaison ». Ce que chaque houblon dit en plus des familles de la
// 16D : les mots de ses fiches (familyWords du moteur : chaque descripteur, rangé dans sa famille ou hors des 12),
// traduits (D97), sans le nom d'une famille (il redit le radar) ni un mot générique (« fruité » : 77 houblons, il ne
// signe personne) ; jamais inventés. « Lui seul » : aucun des autres houblons comparés ne le dit (la manière de flb5).
const VERS_FR: Record<string, string> = {
  'white wine': 'vin blanc', fruity: 'fruité', gooseberry: 'groseille à maquereau', gooseberries: 'groseille à maquereau', grape: 'raisin', grapes: 'raisin',
  pineapple: 'ananas', woody: 'boisé', resinous: 'résineux', resiny: 'résineux', 'fresh lime': 'citron vert', lime: 'citron vert', 'lemon zest': 'zeste de citron',
  lemon: 'citron', citrus: 'agrumes', 'black currant': 'cassis', blackcurrant: 'cassis', herbal: 'herbacé', spicy: 'épicé', pine: 'pin', grapefruit: 'pamplemousse',
  'passion fruit': 'fruit de la passion', peach: 'pêche', lychee: 'litchi', coconut: 'noix de coco', geranium: 'géranium', ginger: 'gingembre', earthy: 'terreux',
  'tropical fruit': 'fruits tropicaux', tropical: 'fruits tropicaux', floral: 'floral', 'résine': 'résine',
};
const GENERIQUES = new Set(['fruité']);
const NOMS_FAMILLE = new Set(['agrumes', 'floral', 'épicé', 'herbacé', 'terreux', 'résineux', 'fruits tropicaux', 'tropicaux', 'végétal', 'baies', 'melon', 'noyau', 'pépins']);
const versFr = (m: string) => { const k = m.trim().toLowerCase(); return VERS_FR[k] ?? k; };
export interface MotLu { mot: string; famille: FamilyId | null; fiches: string[]; seul: boolean; aussi: string[] }
export function sesMots(cles: string[]): Record<string, MotLu[]> {
  const brut: Record<string, Map<string, { famille: FamilyId | null; fiches: string[] }>> = {};
  for (const cle of cles) {
    const h = hopRef(cle);
    const m = new Map<string, { famille: FamilyId | null; fiches: string[] }>();
    brut[cle] = m;
    if (!h) continue;
    const w = familyWords(h.varietyId, h.catalogue);
    const ajoute = (mot: string, source: string, famille: FamilyId | null) => {
      const k = versFr(mot);
      if (!k || GENERIQUES.has(k) || NOMS_FAMILLE.has(k)) return;
      const c = m.get(k) ?? { famille, fiches: [] };
      if (famille && !c.famille) c.famille = famille;
      if (!c.fiches.includes(source)) c.fiches.push(source);
      m.set(k, c);
    };
    for (const f of Object.keys(w.mots) as FamilyId[]) for (const r of w.mots[f]) for (const mot of r.mots) ajoute(mot, r.source, f);
    for (const x of w.sansFamille) ajoute(x.mot, x.source, null);
  }
  const out: Record<string, MotLu[]> = {};
  for (const cle of cles) {
    const autres = cles.filter((k) => k !== cle);
    out[cle] = [...brut[cle].entries()].map(([mot, c]) => {
      const aussi = autres.filter((k) => brut[k].has(mot)).map((k) => hopRef(k)?.name ?? k);
      return { mot, famille: c.famille, fiches: c.fiches, seul: aussi.length === 0, aussi };
    // Lui seul d'abord, puis les mots cités par plus de fiches, puis hors des 12 familles avant les autres.
    }).sort((a, b) => Number(b.seul) - Number(a.seul) || b.fiches.length - a.fiches.length || Number(a.famille != null) - Number(b.famille != null));
  }
  return out;
}
