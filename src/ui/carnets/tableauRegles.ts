/**
 * Les règles du tableau du carnet, de « Selon la quantité » et de Comparer (port D451, voie greffe-p2 ; maquettes2/v01, ses mots B7 à B12).
 * Fonctions pures, testables sans écran. Aucun calcul de prix neuf : le rendu (TVA d'import, port) est celui de `prixRendu.ts` ; ici
 * seulement le choix des colonnes, le prix au kilo selon la quantité d'achat et le tri « ce qui diffère / ce qui est identique ».
 *
 * Honnêteté : l'inconnu est absent (`null`), jamais 0. Une règle se lit sur la catégorie et les caractéristiques lues, jamais sur un nom
 * de produit (B23).
 */
import { nomAlpha } from '../../domain/carnets/alpha';
import type { Article } from '../../domain/carnets/modele';
import { portCentimes, prixRendu, tauxVersChf, type PrixArticleDonnees } from '../../domain/carnets/prixRendu';
import { estMatierePesee, quantiteArticle } from '../../domain/carnets/prixUnitaire';
import { valeursLuesDe } from '../../domain/carnets/comparer';

/* ------------------------------------------------------------------------------------------------ colonnes */

/** Une caractéristique candidate au tableau du carnet : lue sur au moins un article, avec son sens et son rang de décision. */
export interface CandidatMesure { cle: string; nom: string; sens: string; distingue: boolean; rang: number }

/** Le tableau dit 2 ou 3 caractéristiques (B7, B8 : « Pas juste le prix, 2 ou 3 caractéristiques principales »), le prix compris : au plus 2 mesures. */
export const MESURES_MAX = 2;

/**
 * Les mesures du tableau d'un carnet qui n'est pas de matière : d'abord celles qui classent (critère : plus ou moins), puis celles qui
 * DISTINGUENT les articles (jamais « Tension 230 V » pour tous), chacune dans l'ordre de décision ; au plus `MESURES_MAX`. Si aucune ne
 * distingue, la première seulement (une valeur commune renseigne encore).
 */
export function choisirMesures(candidats: readonly CandidatMesure[], max = MESURES_MAX): CandidatMesure[] {
  const classe = candidats.filter(c => c.sens === 'plus' || c.sens === 'moins');
  const autres = candidats.filter(c => !classe.includes(c));
  const parRang = (a: CandidatMesure, b: CandidatMesure) => a.rang - b.rang || a.nom.localeCompare(b.nom, 'fr');
  const ordonnees = [...classe.sort(parRang), ...autres.filter(c => c.distingue).sort(parRang)];
  const choisies = ordonnees.slice(0, max);
  if (choisies.length === 0 && candidats.length) return [[...candidats].sort(parRang)[0]];
  return choisies;
}

type Valeurs = Record<string, { valeur: number | string | boolean; unite?: string }>;
export type ArticleRegle = Pick<Article, 'nom'> & { valeurs: Valeurs } & Partial<Pick<Article, 'prixCentimes' | 'devise' | 'taxe' | 'change' | 'conditionnement' | 'offres' | 'prixUnite' | 'livraison' | 'prixDes' | 'prixTTCCentimes' | 'doute' | 'vendeur' | 'pays' | 'domaine'>>;

/** Un carnet de matière pesée : tous ses articles se pèsent (houblon : un taux d'alpha ou un nom de matière). Vide : non. */
export const estCarnetDeMatiere = (articles: readonly ArticleRegle[]): boolean => articles.length > 0 && articles.every(a => estMatierePesee(a as never));

const NOM_RECOLTE = /^(?:r[ée]colte|erntejahr|ernte|crop(?: year)?|millesime|millésime|ann[ée]e de r[ée]colte)\b/i;
const sansAccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const texteValeur = (v: { valeur: number | string | boolean; unite?: string }): string | null => {
  if (typeof v.valeur === 'boolean') return null;
  const t = String(v.valeur).trim();
  if (!t) return null;
  return v.unite && !t.includes(v.unite) && !/%/.test(v.unite) ? `${t} ${v.unite}` : t;
};

/** Le taux d'acides alpha lu sur l'article, tel que la page le dit, sans le « % » (l'en-tête dit α) ; `null` : non lu. */
export function alphaDe(a: ArticleRegle): string | null {
  for (const [nom, v] of Object.entries(a.valeurs)) {
    if (nomAlpha(a.nom, nom, v) !== 'Alpha') continue;
    const t = texteValeur(v);
    if (t) return t.replace(/\s*%/g, '').replace('.', ',');
  }
  return null;
}

/** L'année de récolte lue sur l'article (« 2025 ») ; `null` : non lue (jamais l'année courante par défaut). */
export function recolteDe(a: ArticleRegle): string | null {
  for (const [nom, v] of Object.entries(a.valeurs)) {
    if (!NOM_RECOLTE.test(sansAccent(nom))) continue;
    const t = texteValeur(v);
    if (t) return t;
  }
  return null;
}

/** Les arômes écrits par la page (« agrumes, citron vert, mangue »), un mot par pastille ; vide : aucun. */
export function aromesDe(a: ArticleRegle): string[] {
  for (const [nom, v] of Object.entries(valeursLuesDe(a as never) as Record<string, { valeur: number | string | boolean; unite?: string }>)) {
    if (!/^(?:ar[oô]mes?|saveurs?|ar[oô]mes? et saveurs?|aroma|aromen|geschmack)\b/.test(sansAccent(nom))) continue;
    const t = texteValeur(v);
    if (t) return t.split(/\s*[,;/]\s*|\s+et\s+/i).map(s => s.trim()).filter(Boolean);
  }
  return [];
}

/** Les arômes que tous les articles disent, dans l'ordre de la page du premier ; ce que `aromesCommuns` rend s'écrit une fois (« catalogue Citra, les deux »). */
export function aromesCommuns(articles: readonly ArticleRegle[]): string[] {
  const listes = articles.map(aromesDe).filter(l => l.length);
  if (!listes.length) return [];
  const vus = new Set<string>();
  const sortie: string[] = [];
  for (const mot of listes.flat()) { const k = sansAccent(mot); if (!vus.has(k)) { vus.add(k); sortie.push(mot); } }
  return sortie;
}

/** Les colonnes d'un carnet de matière pesée : α, récolte si un article la dit, puis le prix au kilo (B7). */
export function colonnesMatiere(articles: readonly ArticleRegle[]): Array<'alpha' | 'recolte'> {
  const cols: Array<'alpha' | 'recolte'> = [];
  if (articles.some(a => alphaDe(a) !== null)) cols.push('alpha');
  if (articles.some(a => recolteDe(a) !== null)) cols.push('recolte');
  return cols;
}

/* ------------------------------------------------------------------------------------------------ prix selon la quantité */

/** Les quantités d'achat qu'on compare (kg). `pour` en est une ; 1 kg d'abord. */
export const QUANTITES_POUR: readonly number[] = [1, 5, 20];
export const QUANTITE_PAR_DEFAUT = 1;
export const texteQuantite = (kg: number): string => `${String(kg).replace('.', ',')} kg`;

/** Un conditionnement vendu : sa masse (kg) et son prix dans la devise de l'article (centimes). */
export interface Palier { kg: number; centimes: number }
const KG: Record<string, number> = { g: 0.001, kg: 1 };

/**
 * Les conditionnements qu'un article vend, du plus petit au plus gros : ses offres publiées (50 g, 250 g, 500 g, 1 kg) ; sinon le prix
 * donné à l'unité avec ses paliers (« 0,1044 CHF/g, 0,08 dès 1 000 g ») ; sinon le seul conditionnement que la page ou le nom disent.
 * Un prix sans quantité lisible ne donne aucun palier (jamais un prix au kilo deviné).
 */
export function paliersDe(a: ArticleRegle): Palier[] {
  const masse = (v: number, u: string) => (KG[u] !== undefined ? v * KG[u] : null);
  if (a.offres?.length) {
    const p = a.offres.map(o => ({ kg: masse(o.valeur, o.unite), centimes: o.prixCentimes })).filter((x): x is Palier => x.kg !== null && x.kg > 0 && Number.isFinite(x.centimes));
    if (p.length) return p.sort((x, y) => x.kg - y.kg);
  }
  const u = a.prixUnite;
  if (u && KG[u.unite] !== undefined) {
    const f = KG[u.unite];
    const base = [{ des: 1, prix: u.prix }, ...(u.paliers ?? [])].sort((x, y) => x.des - y.des);
    return base.map(b => ({ kg: b.des * f, centimes: b.prix * b.des * 100 })).filter(x => x.kg > 0 && Number.isFinite(x.centimes));
  }
  const q = a.prixCentimes !== undefined ? quantiteArticle(a as never) : null;
  if (q && q.dim === 'masse' && a.prixCentimes !== undefined && !q.depuisPoids) return [{ kg: q.base, centimes: a.prixCentimes }];
  return [];
}

/** Plusieurs conditionnements : le prix change avec la quantité, la pastille « pour 1 kg » et « Selon la quantité » ont un sens. */
export const aDesPaliers = (articles: readonly ArticleRegle[]): boolean => articles.some(a => paliersDe(a).length > 1);

export interface PrixAuKilo {
  /** francs par kg, au centime près (rendu chez le brasseur quand l'article est hors franc) */
  chf: number;
  /** vrai : estimé (conversion et TVA d'import) ; l'écran dit « ≈ » */
  estime: boolean;
  /** vrai : le port n'est pas lu, le prix est un plancher (D421) */
  plancher: boolean;
  /** le conditionnement dont il vient (kg) */
  palier: number;
}

/**
 * Le prix par kilo d'un achat de `pourKg` kg : le plus gros conditionnement qui ne dépasse pas la quantité, acheté autant de fois que
 * nécessaire. Hors franc, au cours posé (`taux`) ou lu avec la page, avec la TVA d'import et le port s'il est lu (`prixRendu`).
 * `null` : aucun conditionnement n'est assez petit, le prix ou le cours sont inconnus.
 */
export function prixAuKilo(a: ArticleRegle, pourKg: number, taux?: number): PrixAuKilo | null {
  if (!(pourKg > 0)) return null;
  const paliers = paliersDe(a);
  const retenu = [...paliers].reverse().find(p => p.kg <= pourKg + 1e-9);
  if (!retenu) return null;
  const fois = pourKg / retenu.kg;
  const totalDevise = retenu.centimes * fois;
  const devise = (a.devise ?? 'CHF').toUpperCase();
  if (devise === 'CHF') return { chf: totalDevise / 100 / pourKg, estime: false, plancher: false, palier: retenu.kg };
  const donnees: PrixArticleDonnees = { prixCentimes: totalDevise, devise, ...(a.change ? { change: a.change } : {}), ...(a.livraison ? { livraison: a.livraison } : {}) };
  const t = tauxVersChf(donnees, taux);
  if (!t) return null;
  const port = portCentimes(donnees);
  const r = prixRendu({ eurCentimes: totalDevise, taux: t.taux, ...(port !== undefined ? { portEurCentimes: port } : {}) });
  if (r.totalChf === undefined) return null;
  return { chf: r.totalChf / 100 / pourKg, estime: true, plancher: r.manque.includes('port'), palier: retenu.kg };
}

/** « ≈41 », « 80 », « 4,2 » : au franc près dès 10 CHF/kg, une décimale en dessous (un malt à 2,40 CHF/kg ne se dit pas « 2 »). */
export function texteChfKg(p: PrixAuKilo): string {
  const n = p.chf >= 10 ? Math.round(p.chf) : Math.round(p.chf * 10) / 10;
  return `${p.estime ? '≈' : ''}${n.toLocaleString('fr-CH', { maximumFractionDigits: 1 }).replace(/[ ’]/g, ' ')}`;
}

/** Les ids qui tiennent le plus bas prix au kilo de la quantité (ex æquo compris) ; aucun s'il y a moins de 2 prix connus. */
export function meilleursPrixAuKilo(prix: ReadonlyMap<string, PrixAuKilo | null>): Set<string> {
  const connus = [...prix].filter((e): e is [string, PrixAuKilo] => e[1] !== null);
  if (connus.length < 2) return new Set();
  const min = Math.min(...connus.map(([, p]) => Math.round(p.chf)));
  return new Set(connus.filter(([, p]) => Math.round(p.chf) === min).map(([id]) => id));
}

export interface LigneQuantite { kg: number; prix: Map<string, PrixAuKilo | null>; gagnants: Set<string> }
/** « Selon la quantité » : une ligne par quantité comparée ; une ligne où aucun article n'a de prix n'existe pas. */
export function lignesSelonLaQuantite(articles: ReadonlyArray<ArticleRegle & { id: string }>, taux?: number, quantites: readonly number[] = QUANTITES_POUR): LigneQuantite[] {
  return quantites.map(kg => {
    const prix = new Map(articles.map(a => [a.id, prixAuKilo(a, kg, taux)] as const));
    return { kg, prix, gagnants: meilleursPrixAuKilo(prix) };
  }).filter(l => [...l.prix.values()].some(p => p !== null));
}

/** « 1 et 5 kg, MotlerHops ; 20 kg, Brau (39 CHF/kg). » : qui gagne à chaque quantité ; les quantités voisines du même gagnant se réunissent. `null` : un seul gagnant partout. */
export function phraseSelonLaQuantite(lignes: readonly LigneQuantite[], nom: (id: string) => string): string | null {
  const gagnant = (l: LigneQuantite) => (l.gagnants.size === 1 ? [...l.gagnants][0] : null);
  const groupes: Array<{ id: string; kgs: number[]; chf: number | null }> = [];
  for (const l of lignes) {
    const id = gagnant(l);
    if (!id) continue;
    const chf = l.prix.get(id)?.chf ?? null;
    const dernier = groupes[groupes.length - 1];
    if (dernier && dernier.id === id) { dernier.kgs.push(l.kg); dernier.chf = chf; } else groupes.push({ id, kgs: [l.kg], chf });
  }
  if (groupes.length < 2) return null;
  const dit = (g: (typeof groupes)[number], i: number) => {
    const kg = g.kgs.length > 1 ? `${g.kgs.slice(0, -1).map(k => String(k).replace('.', ',')).join(', ')} et ${texteQuantite(g.kgs[g.kgs.length - 1])}` : texteQuantite(g.kgs[0]);
    const prix = i > 0 && g.chf !== null ? ` (${Math.round(g.chf)} CHF/kg)` : '';
    return `${kg}, ${nom(g.id)}${prix}`;
  };
  return `${groupes.map(dit).join(' ; ')}.`;
}

/* ------------------------------------------------------------------------------------------------ prix par unité de la mesure */

const EXTENSIVES = /^(?:m³|m3|m²|m2|l|litres?|kg|g|m|pièces?|places?|fûts?)$/i;
/** Une mesure qui s'additionne (volume, surface, masse) a un prix « au m³ » ; une température ou une tension, non. */
export const uniteExtensive = (unite: string | undefined): boolean => !!unite && EXTENSIVES.test(unite.trim());

/**
 * Le prix d'une unité de la mesure (« 736 CHF le m³ » : 2 987,51 CHF pour 4,06 m³). `null` : prix ou mesure inconnus, ou mesure nulle
 * (jamais une division par zéro). Centimes de franc en entrée, francs en sortie.
 */
export function prixParMesure(prixCentimes: number | undefined, mesure: number | null | undefined): number | null {
  if (prixCentimes === undefined || !Number.isFinite(prixCentimes) || mesure === null || mesure === undefined || !(mesure > 0)) return null;
  return prixCentimes / 100 / mesure;
}

/** Les ids qui tiennent la plus petite valeur de `valeurs` (moins = mieux) ; aucun s'il y a moins de 2 valeurs connues. */
export function plusBasDe(valeurs: ReadonlyMap<string, number | null>): Set<string> {
  const connus = [...valeurs].filter((e): e is [string, number] => e[1] !== null);
  if (connus.length < 2) return new Set();
  const min = Math.min(...connus.map(([, v]) => Math.round(v)));
  return new Set(connus.filter(([, v]) => Math.round(v) === min).map(([id]) => id));
}

/** La largeur d'une barre « moins = mieux » : la plus petite valeur à 100 % de la place divisée par elle-même, la plus grande pleine (maquette : 71 % et 100 %). */
export function largeursBarres(valeurs: ReadonlyMap<string, number | null>): Map<string, number> {
  const connus = [...valeurs].filter((e): e is [string, number] => e[1] !== null && e[1] > 0);
  const max = connus.length ? Math.max(...connus.map(([, v]) => v)) : 0;
  return new Map(connus.map(([id, v]) => [id, Math.max(6, Math.round((v / max) * 100))]));
}

/* ------------------------------------------------------------------------------------------------ Comparer : ce qui diffère */

/** Une ligne de Comparer réduite à ses cellules dites (texte, ou `null` pour inconnu) : les articles en lice seulement. */
export interface LigneComparable { cle: string; cellules: ReadonlyArray<string | null> }

const nettoyer = (s: string) => s.normalize('NFKC').replace(/[\s  ]+/g, ' ').trim().toLowerCase();
/** Toutes les cellules disent la même chose et aucune n'est inconnue : la ligne ne départage pas. Une cellule inconnue fait toujours diffèrer (on ne sait pas). */
export function ligneIdentique(l: LigneComparable): boolean {
  if (l.cellules.length < 2) return false;
  if (l.cellules.some(c => c === null || !c.trim())) return false;
  return new Set(l.cellules.map(c => nettoyer(c as string))).size === 1;
}

/** Sépare les lignes qui diffèrent de celles qui sont identiques ; `gardees` : lignes à garder en vue même identiques (le prix, ce qui classe). */
export function departager<T extends LigneComparable>(lignes: readonly T[], gardees: ReadonlySet<string> = new Set()): { diffèrent: T[]; identiques: T[] } {
  const diffèrent: T[] = [], identiques: T[] = [];
  for (const l of lignes) (gardees.has(l.cle) || !ligneIdentique(l) ? diffèrent : identiques).push(l);
  return { diffèrent, identiques };
}

/** « 5 diffèrent » / « 1 diffère » ; « 18 identiques » / « 1 identique ». */
export const ditDiffèrent = (n: number): string => `${n} ${n > 1 ? 'diffèrent' : 'diffère'}`;
export const ditIdentiques = (n: number): string => `${n} ${n > 1 ? 'identiques' : 'identique'}`;

/* ------------------------------------------------------------------------------------------------ « pour 1 kg » : la quantité d'achat, par carnet */

/**
 * La quantité d'achat de référence (« pour 1 kg ▾ ») est un réglage de lecture, par carnet, tenu sur l'appareil le temps de la session :
 * le tableau, « Selon la quantité », les cartes et Comparer la lisent ensemble. Un réglage de vue ne s'écrit pas dans le carnet.
 */
const pourParCarnet = new Map<string, number>();
const ecouteurs = new Set<() => void>();
export const quantitePour = (cle: string): number => pourParCarnet.get(cle) ?? QUANTITE_PAR_DEFAUT;
export function poserQuantitePour(cle: string, kg: number): void {
  if (!QUANTITES_POUR.includes(kg)) return;
  pourParCarnet.set(cle, kg);
  ecouteurs.forEach(f => f());
}
export function ecouterQuantitePour(f: () => void): () => void { ecouteurs.add(f); return () => { ecouteurs.delete(f); }; }

/* ------------------------------------------------------------------------------------------------ cartes, fiche : « le choix fait le prix » */

/** Le nom court d'un vendeur pour une tête de colonne ou une barre (« Brau- und Rauchshop » → « Brau »). */
export const vendeurCourt = (a: Pick<ArticleRegle, 'vendeur' | 'nom' | 'domaine'>): string => {
  const v = (a.vendeur ?? a.domaine ?? a.nom ?? '').trim();
  return v.length > 14 ? (v.split(/[\s-]+/)[0] || v) : v;
};

/** Une ligne de « je prends » (fiche) et de « Conditionnement de … » (carte) : ce que vend le vendeur, son prix dans sa devise, le kilo rendu. */
export interface LigneConditionnement {
  kg: number;
  /** « 50 g », « 1 kg », « au gramme » */
  libelle: string;
  /** prix de ce conditionnement dans la devise de l'article, en centimes (au gramme : le prix d'un gramme) */
  centimes: number;
  devise: string;
  auGramme: boolean;
  chfKg: PrixAuKilo | null;
}

const texteMasse = (kg: number): string => (kg < 1 ? `${Math.round(kg * 1000)} g` : `${String(Math.round(kg * 100) / 100).replace('.', ',')} kg`);

/**
 * Les conditionnements d'un article, du plus petit au plus gros, chacun avec son prix et le kilo rendu chez le brasseur. Le prix donné au gramme
 * (« 0,1044 CHF/g ») est une ligne « au gramme ». Aucun conditionnement lisible : liste vide (jamais un prix deviné).
 */
export function conditionnementsDe(a: ArticleRegle, taux?: number): LigneConditionnement[] {
  const devise = (a.devise ?? 'CHF').toUpperCase();
  return paliersDe(a).map(p => {
    const auGramme = a.prixUnite?.unite === 'g' && Math.abs(p.kg - 0.001) < 1e-9;
    return { kg: p.kg, libelle: auGramme ? 'au gramme' : texteMasse(p.kg), centimes: p.centimes, devise, auGramme, chfKg: prixAuKilo(a, p.kg, taux) };
  });
}

/** « 3,72 € », « 80,00 », « 0,1044 » : le prix d'une ligne ; la devise ne se dit que si ce n'est pas le franc (la colonne d'à côté est en CHF). */
export function textePrixConditionnement(l: Pick<LigneConditionnement, 'centimes' | 'devise' | 'auGramme'>): string {
  const francs = l.centimes / 100;
  const n = francs.toLocaleString('fr-CH', l.auGramme ? { minimumFractionDigits: 2, maximumFractionDigits: 4 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/[ ’]/g, ' ');
  const sym = l.devise === 'CHF' ? '' : l.devise === 'EUR' ? ' €' : l.devise === 'USD' ? ' $' : ` ${l.devise}`;
  return `${n}${sym}`;
}

/** La ligne de conditionnement que la quantité d'achat `pourKg` utilise (le plus gros qui ne la dépasse pas) ; `null` : aucune. */
export function ligneDuPour(lignes: readonly LigneConditionnement[], a: ArticleRegle, pourKg: number, taux?: number): LigneConditionnement | null {
  const p = prixAuKilo(a, pourKg, taux);
  return p ? lignes.find(l => Math.abs(l.kg - p.palier) < 1e-9) ?? null : null;
}

/** « TVA d'import 8,1 % comptée · port non lu » sous le tableau « je prends » ; `null` : le prix est en francs (rien à dire de plus), ou inconnu. */
export function noteImport(a: ArticleRegle, pourKg: number, taux?: number, tva = 0.081): string | null {
  const p = prixAuKilo(a, pourKg, taux);
  if (!p || !p.estime) return null;
  const pc = `${(tva * 100).toLocaleString('fr-CH', { maximumFractionDigits: 1 })} %`;
  return `TVA d'import ${pc} comptée · ${p.plancher ? 'port non lu' : 'port compté'}`;
}

/** Un doute D450 qui porte sur la disponibilité (« la page dit en stock, la lecture dit épuisé ») ; sinon « à vérifier » seulement. */
export const douteSurDispo = (doute: string | undefined): boolean => !!doute?.trim() && /dispo|stock|[ée]puis|rupture|lager|verf[uü]gbar|disponib/i.test(doute);

/** La puce d'un doute D450 : « dispo ? » quand il porte sur la disponibilité, « à vérifier » sinon ; `null` : aucun doute. */
export const puceDoute = (doute: string | undefined): string | null => (!doute?.trim() ? null : douteSurDispo(doute) ? 'dispo ?' : 'à vérifier');

const nombreAlpha =(a: ArticleRegle): number | null => { const t = alphaDe(a); const n = t === null ? null : Number(t.replace(',', '.')); return n !== null && Number.isFinite(n) ? n : null; };

/**
 * « MotlerHops, 39 CHF de moins au kilo ; tu perds 0,4 point d'α et la dispo est douteuse. » : le compromis d'un carnet de matière, calculé ici sur
 * le prix au kilo rendu à la quantité d'achat. Le gagnant (le moins cher) contre le suivant ; ce qu'on perd ne se dit que si on le sait (α lu des
 * deux côtés, doute sur la dispo). `null` : moins de 2 prix au kilo connus, ou écart nul.
 */
export function compromisMatiere(articles: ReadonlyArray<ArticleRegle & { id: string }>, pourKg: number, taux?: number): string | null {
  const classes = articles.map(a => ({ a, p: prixAuKilo(a, pourKg, taux) })).filter((x): x is { a: (typeof articles)[number]; p: PrixAuKilo } => x.p !== null).sort((x, y) => x.p.chf - y.p.chf);
  if (classes.length < 2) return null;
  const [gagnant, suivant] = classes;
  const ecart = Math.round(suivant.p.chf) - Math.round(gagnant.p.chf);
  if (ecart <= 0) return null;
  const pertes: string[] = [];
  const ag = nombreAlpha(gagnant.a), as = nombreAlpha(suivant.a);
  if (ag !== null && as !== null && as - ag > 0.049) pertes.push(`tu perds ${(Math.round((as - ag) * 10) / 10).toLocaleString('fr-CH', { maximumFractionDigits: 1 })} point d’α`);
  if (douteSurDispo(gagnant.a.doute)) pertes.push('la dispo est douteuse');
  const nom = (gagnant.a.vendeur ?? gagnant.a.domaine ?? gagnant.a.nom ?? 'le moins cher').trim();
  return `${nom}, ${ecart} CHF de moins au kilo${pertes.length ? ` ; ${pertes.join(' et ')}` : ''}.`;
}

/** Le texte du bouton Choisir de Comparer : « Choisir · MotlerHops, 1 kg » (matière pesée) ; sinon « Choisir la 4,06 m³ » (la valeur de tête du 1er) ou « Choisir ». */
export function libelleChoisir(args: { vendeur?: string; pourKg?: number; tete?: string | null }): string {
  if (args.vendeur && args.pourKg) return `Choisir · ${args.vendeur}, ${texteQuantite(args.pourKg)}`;
  return args.tete ? `Choisir la ${args.tete}` : 'Choisir';
}
