import type { StockItem } from '../../types';
import { normaliser, slugBeerAnalytics } from './noms';
import { libelleDuPalier, palierDansLaCle, typiciteChargee, typiciteDe, type TableTypicite, type Typicite } from './typicite';
import { nombreFr } from '../../domain/nombreAffiche';

/**
 * Les tuiles que le champ d'ajout de Malts/sucres propose à l'ouverture, avant toute frappe (D222 : « avec algo de reconnaissance
 * pour le style et autres comme pour les houblons », sur les tuiles de s1). Le modèle est l'ajout en un toucher des houblons
 * (`QUICK_ADD_RULE` de `hopIndex/v4/quickAdd.ts`, typicité f9) : un classement lexicographique, une donnée inconnue jamais 0.
 *
 * Contrat stable entre la voie a1-proposition (qui écrit la règle et sa donnée) et le port de l'étape (qui l'appelle) :
 * la signature ne change pas sans le pilote. La portée est l'ouverture seule : en tapant, la pertinence de la frappe prime (D221).
 */
export interface EntreeProposition {
  /** Articles du stock du rayon de la famille du champ (`KIND_DEF[famille].stock`). */
  articles: readonly StockItem[];
  /** Ce que la recette contient déjà : jamais proposé à l'ouverture (la frappe le retrouve, « déjà … kg »). `stockItemRef` est la `ref` de l'article (repli : son `id`). */
  dejaLa: readonly { name: string; stockItemRef?: string }[];
  /** Code BJCP 2021 du style visé, s'il est connu. */
  styleCode?: string | null;
  /** Teinte visée de la bière, en EBC, si elle est connue. N'entre PAS dans le classement (la couleur d'un malt n'est pas celle de la bière) : gardé pour que la tuile l'affiche. */
  ebcVise?: number | null;
  /** Ajouté par a1 (facultatif) : la borne haute d'EBC du style (la plage `ebcPlage.max`). Sert à la seule règle de plausibilité ; absente, `ebcVise` en tient lieu. */
  ebcMax?: number | null;
  /** Nombre de tuiles au plus. */
  max?: number;
  /** Ajouté par a1 (facultatif) : la table de typicité. Absente : celle que `chargerTypicite()` a posée (aucune : tout est inconnu) ; `null` : aucune, exprès. */
  table?: TableTypicite | null;
}

export interface Proposition {
  article: StockItem;
  /** Les clés du rang, dans l'ordre où elles ont compté : pour les tests et la relecture, jamais affichées (D222, lecture étroite). */
  cles: string[];
}

/** Plausibilité (décision du pilote, 31.10) : HYPOTHÈSE [H] — un fermentescible NON cité pour le style, dont la couleur connue dépasse ce multiple de la borne haute d'EBC du style, ne vient pas dans les tuiles (la recherche le trouve). */
export const PLAFOND_TEINTE_NON_CITE = 10;

export const PROPOSITION_RULE: readonly string[] = [
  'Écartés : les articles déjà dans la recette (même article, ou son nom entier, accents et casse ignorés). Un nom courant tapé (« Cara », « Munich ») n’écarte rien : la frappe le retrouve, « déjà … kg ».',
  'Classement lexicographique, comme l’ajout en un toucher des houblons : 1) disponible (stock > 0) avant épuisé (D226 : « disponibles d’abord, épuisés à part » ; un épuisé ne passe jamais devant un disponible, même d’un style plus typique) ; 2) à l’intérieur de chaque groupe, la typicité dans le style visé, par paliers de la part des recettes du style qui contiennent le fermentescible (Beer Analytics, CC BY-SA 4.0) : dans la plupart des recettes (50 % et plus), courant (15 %), présent (3 %), rare. Les stouts se lisent entre elles, à moitié de poids (le malt chocolat de la 16A compte pour la 15B).',
  'Un style hors des 16 premiers du fermentescible est inconnu mais borné (au plus la 16e part publiée) : il passe entre « rare » et « présent », et les inconnus bornés se départagent par leur borne, la plus haute d’abord (plus la borne est haute, plus le malt peut être courant : Pale Ale Malz, au plus 43 %, devant Lactose, au plus 6 %). Sans aucune donnée (nom hors table, absent de Beer Analytics, style sans correspondance) l’article passe après tout le connu ; il n’est jamais écarté, et l’inconnu n’est jamais 0.',
  '3) épinglé avant non épinglé : l’étoile départage deux articles que rien d’autre ne sépare, elle ne fait pas passer devant la typicité ; 4) le nom.',
  'La teinte n’est pas une clé : la couleur d’un malt n’est pas celle de la bière (une stout de 70 EBC se fait avec 5 à 10 % d’un malt à 1000 EBC), et la typicité du style porte déjà la couleur. `ebcVise` est accepté pour que l’appelant affiche la teinte de la tuile ; il ne change pas l’ordre.',
  `Une seule exception, de plausibilité (hypothèse, PLAFOND_TEINTE_NON_CITE = ${PLAFOND_TEINTE_NON_CITE}) : un fermentescible non cité pour le style (ni par le style ni par une stout voisine), dont la couleur connue dépasse ${PLAFOND_TEINTE_NON_CITE} fois la borne haute d’EBC du style, ne vient pas dans les tuiles ; la recherche le trouve. Un fermentescible cité n’est jamais écarté par la teinte ; une couleur inconnue, une teinte du style inconnue, ou une table non chargée : il reste.`,
  'Sans style, ou sans table chargée : disponible, épinglé, nom. Hors l’exception de plausibilité, jamais un filtre : tout article du rayon reste proposé, et la frappe retrouve aussi celui que la plausibilité écarte.',
];

const libelleTypicite = (t: Typicite): string => {
  const pct = (x: number) => `${nombreFr(Math.round(x * 1000) / 10, 1)} %`.replace('.', ',');
  if (t.palier !== null) {
    const base = `typicité ${libelleDuPalier(t.palier)}`;
    if (t.part !== null) return t.origine === 'voisin' ? `${base} (${pct(t.part)} : un style voisin, à moitié)` : `${base} (${pct(t.part)} des recettes du style)`;
    return `${base} (au plus ${pct(t.auPlus ?? 0)} : hors des 16 premiers)`;
  }
  return t.auPlus !== null ? `typicité inconnue, au plus ${pct(t.auPlus)} (hors des 16 premiers)` : `typicité inconnue (${t.raison})`;
};

const normal = (s: string) => normaliser(s);
/** Écarter : le même article ou son nom entier. Jamais un alias de frappe : « Cara » ne cache pas Carapils.
 * Une ligne de recette se lie à l'article par sa `ref` (BrewWizard pose `stockItemRef = article.ref`) ; `id` seulement si l'article n'a pas de `ref`. */
const memeArticle = (a: StockItem, l: { name: string; stockItemRef?: string }) =>
  (l.stockItemRef !== undefined && l.stockItemRef === (a.ref || a.id)) || normal(l.name) === normal(a.name);

export function proposerFermentables({ articles, dejaLa, styleCode, ebcVise, ebcMax, max = 6, table }: EntreeProposition): Proposition[] {
  const t: TableTypicite | null = table === undefined ? typiciteChargee() : table;
  const avecStyle = Boolean(styleCode) && t !== null;
  const borneEbc = [ebcMax, ebcVise].find((x): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0) ?? null;
  return articles
    .filter((a) => !dejaLa.some((l) => memeArticle(a, l)))
    .map((a) => {
      const cles: string[] = [];
      const rang: number[] = [];
      let implausible = false;
      // D226 : disponibles d'abord, épuisés à part. Un épuisé ne passe jamais devant un disponible ; la typicité ordonne à l'intérieur de chaque groupe.
      cles.push(a.currentStock > 0 ? 'disponible' : 'épuisé');
      rang.push(a.currentStock > 0 ? 0 : 1);
      if (avecStyle) {
        const ty = typiciteDe(slugBeerAnalytics(a.name), styleCode, t);
        cles.push(libelleTypicite(ty));
        // Non cité (aucune part, ni du style ni d'une voisine) et trop foncé pour le style : hors des tuiles. Un cité n'est jamais écarté par la teinte.
        implausible = ty.part === null && borneEbc !== null && typeof a.colorEbc === 'number' && Number.isFinite(a.colorEbc) && a.colorEbc > PLAFOND_TEINTE_NON_CITE * borneEbc;
        rang.push(-(palierDansLaCle(ty) ?? 0)); // inconnu sans borne : après tout le connu, jamais écarté
        rang.push(ty.palier === null ? -(ty.auPlus ?? 0) : 0); // inconnus bornés : la borne la plus haute d'abord
      }
      cles.push(a.favorite ? 'épinglé' : 'non épinglé');
      rang.push(a.favorite ? 0 : 1);
      cles.push(a.name);
      return { a, cles, rang, implausible };
    })
    .filter((x) => !x.implausible)
    .sort((x, y) => {
      for (let i = 0; i < x.rang.length; i++) if (x.rang[i] !== y.rang[i]) return x.rang[i] - y.rang[i];
      return x.a.name.localeCompare(y.a.name, 'fr');
    })
    .slice(0, max)
    .map(({ a, cles }) => ({ article: a, cles }));
}
