// Données du moteur v4 tirées des sources de l'app (T8, #169, D65) : le stock (articles « Houblon » reliés à une variété
// du catalogue du moteur) et la dégustation d'une recette. Pur : aucun import de valeur (le catalogue et les axes sont
// passés en argument), donc léger et testable sans le chunk des outils. useHopData (src/ui/hopIndex) l'enveloppe.
//
// Règles :
// - on NE fusionne PAS les catalogues (Beer Maverick du moteur, index de l'app) : un article de stock est relié à une
//   variété du moteur par son nom ou son alias, rien d'autre ;
// - un article non relié reste visible : `inconnu:<nom>`, avec sa raison. Aucune variété devinée, aucune valeur inventée ;
// - l'inconnu n'est jamais 0 : un α absent ou hors ]0 ; 100] est null, une quantité absente ou négative n'entre pas dans
//   le stock (l'article est listé comme non relié, « quantité inconnue »).
import type { CatalogueHop, StockHop } from './data';

/** Ce que la reliure lit d'un article de stock de l'app (sous-ensemble de StockItem). */
export interface ArticleHoublon { name: string; currentStock?: number; unit?: string; alphaPct?: number; category?: string }

export type LienStock = 'nom' | 'alias' | 'préfixe';
export interface ArticleRelie { article: string; cle: string; varietyId: string; variete: string; lien: LienStock }
export interface ArticleNonRelie {
  /** `inconnu:<nom>` : la clé que l'on montre pour un article que le moteur ne connaît pas. */
  cle: string; nom: string;
  /** Quantité en grammes si elle est connue et convertible, sinon null (jamais 0 par défaut). */
  grams: number | null; alphaPct: number | null;
  raison: string;
}
export interface StockDeLApp { stock: StockHop[]; relies: ArticleRelie[]; nonRelies: ArticleNonRelie[] }

/** Minuscules, sans accents ni ponctuation : la forme sous laquelle on compare deux noms. */
export const plier = (nom: string): string =>
  nom.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Écritures du stock qui ne sont ni le nom ni un alias du catalogue (cas lus dans la production du 17.10, #120). Table
 * explicite : toute autre écriture non reconnue reste « non reliée ». Clés et valeurs sont pliées. */
export const ECRITURES_DU_STOCK: Readonly<Record<string, string>> = {
  'hallertauer blanc': 'hallertau blanc',
  'goldings east kent': 'east kent goldings',
  nuget: 'nugget',
};

/** Le nom d'un article sans le bruit de l'étiquette : « Houblon », « Cryo Hops », le pourcentage d'α et ce qui le suit. */
export function nomDeVariete(article: string): string {
  const n = plier(article.replace(/\s+\d+(?:[.,]\d+)?\s*%.*$/, ''))
    .replace(/^houblon /, '').replace(/\bcryo hops\b ?/, '').replace(/\bcryo\b ?/, '').trim();
  return ECRITURES_DU_STOCK[n] ?? n;
}
const alphaValide = (a: unknown): a is number => typeof a === 'number' && Number.isFinite(a) && a > 0 && a <= 100;
/** L'α lu dans l'étiquette (« Houblon Galaxy 17.2% ») ; null s'il n'y est pas. */
export function alphaDuNom(article: string): number | null {
  const m = article.match(/(\d+(?:[.,]\d+)?)\s*%/);
  const a = m ? Number(m[1].replace(',', '.')) : NaN;
  return alphaValide(a) ? a : null;
}

type Index = { noms: Map<string, CatalogueHop[]>; alias: Map<string, CatalogueHop[]>; liste: { nom: string; h: CatalogueHop }[] };
const indexes = new WeakMap<CatalogueHop[], Index>();
function indexDe(catalogue: CatalogueHop[]): Index {
  let i = indexes.get(catalogue);
  if (i) return i;
  const ajouter = (m: Map<string, CatalogueHop[]>, k: string, h: CatalogueHop) => { const l = m.get(k); if (!l) m.set(k, [h]); else if (!l.includes(h)) l.push(h); };
  i = { noms: new Map(), alias: new Map(), liste: catalogue.map((h) => ({ nom: plier(h.name), h })) };
  for (const h of catalogue) {
    ajouter(i.noms, plier(h.name), h);
    for (const a of h.aliases ?? []) ajouter(i.alias, plier(a), h);
  }
  indexes.set(catalogue, i);
  return i;
}

// ---------- L'origine qu'un nom écrit (c7, #187) ----------
// « Cascade CHE », « NZ Cascade », « Cascade (UK) » : un code d'origine (2 ou 3 capitales) en queue, en tête ou entre parenthèses. Cette lecture relie
// l'article à sa variété (varieteDe) ; sa traduction en pays, et l'astérisque, sont dans ui/hopIndex/fiche/MarquesVue.tsx (chargé à la demande).
/** Le code d'origine écrit dans un nom, et le nom sans lui ; null si le nom n'en écrit pas. Le pourcentage d'α de l'étiquette est ignoré. */
export function origineDuNom(nom: string): { ecrit: string; sansOrigine: string } | null {
  const mots = nom.replace(/\s+\d+(?:[.,]\d+)?\s*%.*$/, '').split(/[\s(),/]+/).filter(Boolean);
  const i = mots.length < 2 ? -1 : /^[A-Z]{2,3}$/.test(mots[mots.length - 1]) ? mots.length - 1 : /^[A-Z]{2,3}$/.test(mots[0]) ? 0 : -1;
  return i < 0 ? null : { ecrit: mots[i], sansOrigine: mots.filter((_, k) => k !== i).join(' ') };
}

/** La variété du moteur d'un article : le nom, sinon un alias, sinon (un seul candidat) le début du nom. Sinon une raison. */
export function varieteDe(article: string, catalogue: CatalogueHop[]): { h: CatalogueHop; lien: LienStock } | { raison: string } {
  const n = nomDeVariete(article);
  if (!n) return { raison: 'nom vide' };
  const i = indexDe(catalogue);
  const choix = (l: CatalogueHop[] | undefined, lien: LienStock) => (l?.length === 1 ? { h: l[0], lien } : null);
  const nom = i.noms.get(n), alias = i.alias.get(n);
  if (nom && nom.length > 1) return { raison: `nom ambigu : ${nom.length} variétés du catalogue s'appellent « ${nom[0].name} »` };
  const direct = choix(nom, 'nom'); if (direct) return direct;
  if (alias && alias.length > 1) return { raison: `alias ambigu : ${alias.map((h) => h.name).join(', ')}` };
  const parAlias = choix(alias, 'alias'); if (parAlias) return parAlias;
  const debuts = i.liste.filter((x) => x.nom.startsWith(`${n} `));
  if (debuts.length === 1) return { h: debuts[0].h, lien: 'préfixe' };
  // c7 : « Cascade CHE », « NZ Cascade » : le nom sans le code d'origine, s'il désigne une seule variété (l'origine écrite reste lue par
  // origineDuNom : l'écran met un astérisque quand elle diffère de celle du catalogue).
  const o = origineDuNom(article);
  if (o) { const r = varieteDe(o.sansOrigine, catalogue); if ('h' in r) return r; }
  return { raison: debuts.length > 1 ? `plusieurs variétés commencent par « ${n} » : ${debuts.slice(0, 4).map((x) => x.h.name).join(', ')}` : 'aucune variété du catalogue du moteur ne porte ce nom ni cet alias' };
}

const gramsDe = (a: ArticleHoublon): { grams: number } | { raison: string } => {
  const q = a.currentStock;
  if (typeof q !== 'number' || !Number.isFinite(q) || q < 0) return { raison: 'quantité inconnue' };
  const u = (a.unit ?? 'g').trim().toLowerCase();
  if (u === 'g') return { grams: q };
  if (u === 'kg') return { grams: q * 1000 };
  return { raison: `unité « ${a.unit} » non convertie en grammes` };
};

/** Relie les articles « Houblon » du stock aux variétés du catalogue du moteur. Un article par variété (et par forme cryo)
 * est cumulé : grammes additionnés, α de l'article en stock (sinon le premier lu). Le résultat est trié (stock par clé) : l'ordre
 * des articles de l'app n'y change rien. */
export function relierStock(articles: ArticleHoublon[], catalogue: CatalogueHop[]): StockDeLApp {
  const parCle = new Map<string, StockHop>();
  const relies: ArticleRelie[] = [], nonRelies: ArticleNonRelie[] = [];
  // Ordre canonique (le nom, puis la quantité) : le résultat ne dépend pas de l'ordre des articles de l'app, donc deux snapshots
  // qui rendent les mêmes articles dans un autre ordre donnent les mêmes données (même empreinte).
  const ordonnes = [...articles].sort((x, y) => (x.name < y.name ? -1 : x.name > y.name ? 1 : (x.currentStock ?? -1) - (y.currentStock ?? -1)));
  for (const a of ordonnes) {
    const alphaFiche = alphaValide(a.alphaPct) ? a.alphaPct : null;
    const non = (raison: string, grams: number | null) => nonRelies.push({ cle: `inconnu:${a.name}`, nom: a.name, grams, alphaPct: alphaFiche ?? alphaDuNom(a.name), raison });
    const q = gramsDe(a);
    const v = varieteDe(a.name, catalogue);
    if ('raison' in v) { non(v.raison, 'grams' in q ? q.grams : null); continue; }
    if ('raison' in q) { non(q.raison, null); continue; }
    const cryo = /cryo/i.test(a.name);
    const cle = v.h.id + (cryo ? ':cryo' : '');
    const alpha = alphaFiche ?? alphaDuNom(a.name);
    const cur = parCle.get(cle) ?? { key: cle, varietyId: v.h.id, form: cryo ? 'cryo' as const : 'unknown' as const, grams: 0, alpha: null, alphaFrom: null, items: [] };
    cur.grams += q.grams;
    cur.items.push(a.name);
    if (alpha != null && (q.grams > 0 || cur.alpha == null)) { cur.alpha = alpha; cur.alphaFrom = alphaFiche != null ? 'fiche de stock' : 'lu sur l’article'; }
    parCle.set(cle, cur);
    relies.push({ article: a.name, cle, varietyId: v.h.id, variete: v.h.name, lien: v.lien });
  }
  const stock = [...parCle.values()].sort((x, y) => (x.key < y.key ? -1 : x.key > y.key ? 1 : 0));
  return { stock, relies, nonRelies };
}

// ---------- Dégustation de la recette ----------
/** Une dégustation de l'app (HopTasting) : seulement ce que la lecture utilise. */
export interface DegustationApp {
  id: string; name: string; date: string; origin: 'batch' | 'commercial'; batchId?: string; notes?: string;
  axes: { axis: { id: string; scale: { min: number; max: number }; lowMax: number; mediumMax: number }; perceived: { min: number; max: number } | null }[];
}
export interface BrassinApp { id: string; brewDate?: string; recipeRef?: string }
export interface RecetteApp { id: string; batchRef?: string }
export type Niveau = 'faible' | 'moyen' | 'marqué';

/** Classe perçue d'une plage dégustée sur l'axe V5.5 : faible [min ; lowMax], moyen [lowMax ; mediumMax], marqué [mediumMax ; max].
 * Une plage qui chevauche deux classes, ou absente, est inconnue (null) : on ne choisit pas à la place du brasseur. */
export function niveauDePlage(axe: DegustationApp['axes'][number]['axis'], plage: { min: number; max: number } | null): Niveau | null {
  if (!plage || !Number.isFinite(plage.min) || !Number.isFinite(plage.max) || plage.min > plage.max) return null;
  const { scale: s, lowMax, mediumMax } = axe;
  if (plage.min >= s.min && plage.max <= lowMax) return 'faible';
  if (plage.min >= lowMax && plage.max <= mediumMax) return 'moyen';
  if (plage.min >= mediumMax && plage.max <= s.max) return 'marqué';
  return null;
}
/** Les niveaux dits par le brasseur, famille par famille (seules les familles dites sont présentes). */
export function niveauxDegustes(d: DegustationApp): Record<string, Niveau> {
  const dit: Record<string, Niveau> = {};
  for (const e of d.axes) { const n = niveauDePlage(e.axis, e.perceived); if (n) dit[e.axis.id] = n; }
  return dit;
}

/** La dégustation d'une recette : la plus récente des dégustations de ses brassins (brassin dont `recipeRef` est la recette, ou
 * `batchRef` de la recette). Une dégustation commerciale n'est jamais celle de la recette. Null = aucune. */
export function degustationDeRecette(recette: RecetteApp | null | undefined, brassins: BrassinApp[], degustations: DegustationApp[]): { degustation: DegustationApp; brassin: BrassinApp } | null {
  if (!recette) return null;
  const siens = new Map(brassins.filter((b) => b.recipeRef === recette.id || b.id === recette.batchRef).map((b) => [b.id, b]));
  let meilleur: { degustation: DegustationApp; brassin: BrassinApp } | null = null;
  for (const d of degustations) {
    const b = d.origin === 'batch' && d.batchId ? siens.get(d.batchId) : undefined;
    if (!b) continue;
    if (!meilleur || d.date > meilleur.degustation.date) meilleur = { degustation: d, brassin: b };
  }
  return meilleur;
}
