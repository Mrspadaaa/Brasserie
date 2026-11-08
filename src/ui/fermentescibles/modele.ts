// Étape Malts/sucres (s1, choisie le 31.10 : D220 sur p6-b2, D222 pour la recherche). Les fonctions pures de l'écran : formats, crans de
// la masse, part du grain, échelle de la piste, teinte d'une couleur, recherche. Reprises de `work/missions/2026-10-31-ecran-fermentescibles/
// v7/s1/etat.html`. Aucun calcul de la bière ici (OG, EBC, IBU, part viennent du moteur de l'app) : ce sont les gestes et l'affichage.
import type { Fermentable, FermentableKind, FermentableUse, StockItem } from '../../types';
// Les noms courants (« Munich » → Münchner Malz) viennent de la voie a1 (D220, D222) : une seule table, celle des tuiles aussi.
import { nomsParAlias, normaliser } from '../../domain/fermentables/noms';
import { BORNES } from '../../domain/bornesMetier';
import {
  grainEmpate, grainHorsEmpatage, messageMoment, momentParDefaut, momentPermis, momentsPermis, momentSuivant, momentTourne,
} from '../../domain/fermentables/moments';

export const MOMENTS: readonly FermentableUse[] = ['empatage', 'ebullition', 'fermentation'];
/** Le mot du moment sur la ligne (D218, forme m1 : sans pilule). */
export const MOT_MOMENT: Record<FermentableUse, string> = { empatage: 'empâtage', ebullition: 'ébullition', fermentation: 'fermentation' };
/**
 * Le moment suivant d'une ligne, dans les moments que sa famille permet (table unique `domain/fermentables/moments.ts`, audit du 08.11, AM 1 et 2) :
 * un grain reste à l'empâtage, un sucre tourne entre ébullition et fermentation. Un moment interdit (donnée ancienne) revient au premier permis.
 */
export const MOMENT_SUIVANT = (f: Pick<Fermentable, 'kind' | 'use'>): FermentableUse => momentSuivant(f);
export { grainEmpate, grainHorsEmpatage, momentPermis, momentTourne, messageMoment, momentParDefaut, momentsPermis };
export const JOUR_PAR_DEFAUT = 3;

export const FAMILLES: readonly FermentableKind[] = ['grain', 'sucre', 'fruit'];

// ---------------------------------------------------------------------------------------------------------------- formats
export const fr = (x: number, d: number) => x.toFixed(d).replace('.', ',');
/** 5 → « 5,0 », 0,3 → « 0,30 », 0 → « 0 » (la maquette). */
export function kgTxt(x: number): string {
  if (!x) return '0';
  let s = x < 1 ? x.toFixed(2) : x.toFixed(1);
  if (Math.abs(parseFloat(s) - x) > 1e-9) s = x.toFixed(3).replace(/0+$/, '');
  return s.replace('.', ',');
}
export const qteTxt = (x: number) => String(Math.round(x * 100) / 100).replace('.', ',');
/**
 * Un nombre tapé : « 2,5 », « 2.5 kg », « J+3 ». Rien de lisible : `null` (jamais 0). Seule une unité (kg, g, EBC, PPG, °C) ou le « J+ » d'un jour
 * s'accepte autour du nombre : « Crystal 60 » tapé dans un jour n'est PAS 60 (BR-18 : « J+60 » depuis du texte).
 */
export function lit(s: string): number | null {
  const t = String(s).trim().replace(/^j\s*\+?\s*/i, '').replace(/\s*(kg|g|ebc|ppg|°\s*c)\s*$/i, '').replace(/(\d)[\s  ](?=\d)/g, '$1').replace(',', '.');
  if (!/^(\d+(\.\d*)?|\.\d+)$/.test(t)) return null;
  const v = parseFloat(t);
  return Number.isFinite(v) ? v : null;
}
/** La masse la plus grande qu'une ligne accepte (10 t) : au-delà, la saisie est ramenée là (fuzzSaisie : 999999999999) et l'écran le dit (B1 n° 12). */
export const MASSE_MAX_KG = BORNES.masseLigneKg.max;
/**
 * Une masse tapée, au centième de kg (10 g : la précision d'une balance de brasserie ; « 0,004 » devient 0, à compléter, au lieu d'un bandeau à trois décimales).
 * Le plafond n'est PAS appliqué ici : `setKg` de l'étape le fait et le dit. Illisible ou infini : le plafond.
 */
export const arrondiKg = (v: number) => (Number.isFinite(v) ? Math.round(v * 100) / 100 : MASSE_MAX_KG);

// ---------------------------------------------------------------------------------------------------------------- crans
/** Le cran de la masse : 50 g sous 1 kg, 100 g au-dessus (la piste du plateau). */
export function pas(x: number, dir: number): number {
  const s = dir > 0 ? (x < 1 - 1e-9 ? 0.05 : 0.1) : x <= 1 + 1e-9 ? 0.05 : 0.1;
  return Math.max(0, Math.round((x + dir * s) * 1000) / 1000);
}
export function cran(v: number): number {
  v = Math.max(0, v);
  return v < 1 ? Math.round(v * 20) / 20 : Math.round(v * 10) / 10;
}
/** Un cran posé sur la grille (le curseur au clavier). */
export function cranPas(x: number, dir: number): number {
  const v = dir > 0
    ? (x < 1 - 1e-9 ? Math.floor(x * 20 + 1e-6) / 20 + 0.05 : Math.floor(x * 10 + 1e-6) / 10 + 0.1)
    : (x <= 1 + 1e-9 ? Math.ceil(x * 20 - 1e-6) / 20 - 0.05 : Math.ceil(x * 10 - 1e-6) / 10 - 0.1);
  return Math.max(0, Math.round(v * 1000) / 1000);
}
/** La plage de la piste du plateau : 0–2 kg sous 1 kg, sinon la graduation ronde au-dessus d'une fois et demie la masse. */
export function pmax(kg: number): number {
  // Une masse absente (champ vidé au récapitulatif : NaN, « à renseigner ») garde la piste de 0 à 2 kg, jamais « NaN › » (monkey, graine 3, 08.11).
  if (!(kg >= 1)) return 2;
  const N = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50];
  for (const n of N) if (n >= kg * 1.5) return n;
  return Math.ceil((kg * 1.5) / 10) * 10;
}

/** Le nombre de graduations au plus sur la piste du plateau : au-delà, sur 330 px, le trait fait une barre noire (B1 n° 12). */
export const GRADUATIONS_MAX = 60;
/**
 * Les graduations de la piste du plateau (0 à `m` kg) : un pas de 0,1 sous 2 kg, 0,5 sous 6, 1 au-delà ; jamais plus de 60 intervalles.
 * Au-delà, le pas monte sur une suite ronde (1, 2, 5, 10, 20, 50…) et le gros trait tombe sur une valeur ronde (tous les 5 pas, tous les 2 pour un pas de 5).
 */
export function graduationsPiste(m: number): Array<{ v: number; grosse: boolean }> {
  let gros = m <= 6 ? 1 : m <= 12 ? 2 : 5;
  let pas = m <= 2 ? 0.1 : m <= 6 ? 0.5 : 1;
  if (m / pas > GRADUATIONS_MAX) {
    pas = Math.pow(10, Math.floor(Math.log10(m / GRADUATIONS_MAX)));
    for (const f of [1, 2, 5, 10]) if (m / (pas * f) <= GRADUATIONS_MAX) { pas *= f; break; }
    gros = pas * (Math.round(pas / Math.pow(10, Math.floor(Math.log10(pas)))) === 5 ? 2 : 5);
  }
  const n = Math.floor(m / pas + 1e-9);
  const g: Array<{ v: number; grosse: boolean }> = [];
  for (let k = 0; k <= n; k++) {
    const v = k * pas;
    g.push({ v, grosse: Math.abs(v / gros - Math.round(v / gros)) < 1e-6 });
  }
  return g;
}

// ---------------------------------------------------------------------------------------------------------------- part du grain
// La part se calcule sur le grain EMPÂTÉ : un grain mal placé (donnée ancienne, au fermenteur ou bouilli) n'est pas dans la maische (A10, 08.11).
export const grainsDe = (l: readonly Fermentable[]) => l.filter(grainEmpate);
export const grainKg = (l: readonly Fermentable[]) => grainsDe(l).reduce((s, f) => s + f.weightKg, 0);
/** Masse des autres grains empâtés que la ligne i. */
export const autresKg = (l: readonly Fermentable[], i: number) => l.reduce((s, f, k) => s + (k !== i && grainEmpate(f) ? f.weightKg : 0), 0);
/** La masse qui donne la part p (en %) à la ligne i, les autres grains restant ce qu'ils sont ; `null` si impossible. */
export function kgPourPart(l: readonly Fermentable[], i: number, p: number | null): number | null {
  const o = autresKg(l, i);
  if (p == null || p < 0 || p >= 100 || o <= 0) return null;
  return Math.round(((p / 100) * o) / (1 - p / 100) * 100) / 100;
}
/** La part affichée sur la ligne (entier) : une présentation de la masse et du total du grain, pas un résultat de brassage. */
export function partN(l: readonly Fermentable[], f: Fermentable): number {
  const t = grainKg(l);
  return t > 0 ? Math.round((f.weightKg / t) * 100) : 0;
}

// ---------------------------------------------------------------------------------------------------------------- teinte
const TE: Array<[number, [number, number, number]]> = [
  [2, [246, 233, 170]], [4, [242, 214, 110]], [7, [234, 186, 64]], [12, [219, 150, 40]],
  [20, [184, 98, 30]], [35, [128, 52, 20]], [60, [74, 30, 12]], [150, [30, 14, 8]],
];
function rgb(e: number): [number, number, number] {
  if (e <= TE[0][0]) return TE[0][1];
  for (let i = 1; i < TE.length; i++) {
    if (e <= TE[i][0]) {
      const a = TE[i - 1], b = TE[i], t = (e - a[0]) / (b[0] - a[0]);
      return a[1].map((c, k) => Math.round(c + (b[1][k] - c) * t)) as [number, number, number];
    }
  }
  return TE[TE.length - 1][1];
}
/** La couleur d'un malt, d'après sa teinte en EBC (une pastille : la valeur chiffrée reste celle de la fiche). */
export const teinte = (e: number) => `rgb(${rgb(e).join(',')})`;
export const voile = (e: number) => `rgba(${rgb(e).join(',')},.35)`;
export const texteSurTeinte = (e: number) => (e >= 18 ? '#fff' : '#111');
export const pc = (v: number, a: number, b: number) => Math.max(0, Math.min(100, ((v - a) / (b - a)) * 100));

// ---------------------------------------------------------------------------------------------------------------- recherche
/** Sans accents ni majuscules. */
export const nu = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function lev(a: string, b: string): number {
  const m = a.length, n = b.length, d: number[][] = [];
  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

/**
 * Le rang d'un nom pour ce qui est tapé (`t`, déjà sans accents) : 0 son nom courant (alias) ; 1 le début du nom ; 2 le début d'un mot ;
 * 3 ailleurs dans le nom ; 4 une lettre près (un seul mot tapé, 4 lettres au moins) ; -1 rien.
 */
export function rang(nom: string, t: string): number {
  const a = nu(nom), ws = a.split(/[\s-]+/);
  if (t.length >= 2 && nomsParAlias(t).some((c) => normaliser(c) === normaliser(nom))) return 0;
  if (a.indexOf(t) === 0) return 1;
  if (ws.some((w) => w.indexOf(t) === 0)) return 2;
  if (a.indexOf(t) >= 0) return 3;
  if (t.length >= 4 && !/\s/.test(t) && ws.some((w) => lev(t, w.slice(0, t.length)) <= 1 || lev(t, w) <= 1)) return 4;
  return -1;
}

export interface Candidat {
  nom: string;
  rang: number;
  /** L'article du stock, quand il existe. */
  article?: StockItem;
  /** L'indice de la ligne de la recette, quand l'article y est déjà. */
  ligne: number;
  /** La famille de l'article quand il vient d'un autre rayon que celle du champ (« dext » en Grain trouve Dextrose, rayon Sucre) ; absent : celle du champ. */
  famille?: FermentableKind;
}

/**
 * Les autres rayons : pour chaque article trouvé hors de la famille du champ, la famille qui l'accueille (critique B1 n° 4, 07.11).
 * Une famille par article : la première, dans l'ordre des familles, dont le rayon le contient, mais celle qui porte son nom d'abord (Lactose → famille Lactose).
 */
export function chercherAilleurs(
  texte: string,
  courante: FermentableKind,
  familles: readonly FermentableKind[],
  rayons: Record<FermentableKind, { label: string; stock: string[] }>,
  stockItems: readonly StockItem[],
  fermentables: readonly Fermentable[],
): Candidat[] {
  const dans = (k: FermentableKind, a: StockItem) => rayons[k].stock.some((c) => c.toLowerCase() === a.category.toLowerCase());
  const autres = familles.filter((k) => k !== courante);
  const familleDe = (a: StockItem): FermentableKind | undefined => {
    const ks = autres.filter((k) => dans(k, a));
    return ks.find((k) => nu(k) === nu(a.name)) ?? ks[0]; // « Lactose » (l'article) va dans la famille `lactose`
  };
  const o: Candidat[] = [];
  for (const k of autres) {
    const articles = stockItems.filter((a) => !dans(courante, a) && familleDe(a) === k);
    const lignes = fermentables.map((f, i) => ({ f, i })).filter(({ f }) => f.kind === k);
    // Pas de faute d'une lettre dans un autre rayon (rang 4) : trop de bruit.
    for (const c of chercher(texte, articles, lignes)) if (c.rang <= 3) o.push({ ...c, famille: k });
  }
  return o.sort((x, y) => x.rang - y.rang);
}

/** Cette ligne de la recette est-elle cet article du stock ? Par le lien `stockItemRef`, sinon par le nom (les recettes importées). */
export function memeArticle(f: { name: string; stockItemRef?: string }, a: StockItem): boolean {
  if (f.stockItemRef) return f.stockItemRef === a.ref;
  return nu(f.name.trim()) === nu(a.name.trim());
}
export function articleDe(f: Fermentable, articles: readonly StockItem[]): StockItem | undefined {
  return articles.find((a) => memeArticle(f, a));
}

/**
 * La recherche du champ d'ajout. La pertinence prime ; à rang égal, la ligne déjà dans la recette passe devant, puis l'épinglé (l'app),
 * puis l'ordre du stock. `lignes` : les lignes de la recette de la famille du champ, avec leur indice dans la recette entière.
 */
export function chercher(texte: string, articles: readonly StockItem[], lignes: ReadonlyArray<{ f: Fermentable; i: number }>): Candidat[] {
  const t = nu(texte.trim());
  if (!t) return [];
  const o: Array<Candidat & { k: number }> = [];
  for (const { f, i } of lignes) {
    const r = rang(f.name, t);
    if (r >= 0) o.push({ nom: f.name, rang: r, ligne: i, article: articleDe(f, articles), k: o.length });
  }
  for (const a of articles) {
    if (lignes.some(({ f }) => memeArticle(f, a))) continue;
    const r = rang(a.name, t);
    if (r >= 0) o.push({ nom: a.name, rang: r, ligne: -1, article: a, k: o.length });
  }
  return o.sort((x, y) => x.rang - y.rang || Number(y.ligne >= 0) - Number(x.ligne >= 0)
    || Number(Boolean(y.article?.favorite)) - Number(Boolean(x.article?.favorite)) || x.k - y.k)
    .map(({ k: _k, ...c }) => c);
}

/**
 * « cara 0,3 » : le nom, puis la masse si elle est tapée. Un nombre ENTIER sans « kg » n'est une masse que derrière un nom connu (`connu`) qui ne
 * le contient pas lui-même : « Crystal 60 », « Munich 10 » sont des noms (critique B1 n° 2, 07.11 : « Crystal 60 » devenait 60 kg).
 */
/**
 * `sucre` : hors du grain (sucre, sucre de lait, fruit, extrait), un entier de 1 à 25 au bout d'un nom inconnu est une masse (RO-2, 08.11 : « sirop candi 1 » créait un sucre
 * à 0 kg ; MV-10 : « Mangue 20 » créait un fruit « Mangue 20 » à 0 kg).
 * Les noms de sucre ne finissent pas par un petit entier (« Candi D-180 », « Candi D 90 » : au-delà de 25) ; ceux des malts si (« Caramunich 2 »).
 */
export function lireAjout(v: string, connu?: (nom: string) => boolean, sucre = false, exact?: (nom: string) => boolean): { nom: string; kg: number | null } {
  const s = v.trim(), m = s.match(/^(.*?)\s+(\d+(?:[.,]\d+)?)\s*(kg)?$/);
  if (!m) return { nom: s, kg: null };
  const petitEntier = /^\d+$/.test(m[2]) && Number(m[2]) >= 1 && Number(m[2]) <= 25;
  const masse = Boolean(m[3]) || /[.,]/.test(m[2]) || (sucre && petitEntier && !((exact ?? connu)?.(s) ?? false)) || (connu !== undefined && connu(m[1].trim()) && !connu(s));
  return masse ? { nom: m[1].trim(), kg: lit(m[2]) } : { nom: s, kg: null };
}

/** Un nom d'ingrédient a au moins une lettre : « 0,2 » ou « 60 » seuls ne créent rien (critique B1 n° 3, 07.11). */
export const nomPossible = (t: string) => /\p{L}/u.test(t);

/** Les lettres tapées, en gras dans le nom (rien en gras si le nom courant ou une faute l'a trouvé). */
export function decouper(nom: string, texte: string): [string, string, string] {
  const t = nu(texte.trim()), i = nu(nom).indexOf(t);
  if (!t || i < 0) return [nom, '', ''];
  return [nom.slice(0, i), nom.slice(i, i + t.length), nom.slice(i + t.length)];
}
