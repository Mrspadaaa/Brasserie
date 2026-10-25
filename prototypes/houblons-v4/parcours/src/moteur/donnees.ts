// Données du brasseur injectées dans l'adaptateur du moteur (B2, voie p8, 23.10). L'adaptateur ne lit plus la
// fixture en dur : il lit cet objet. Les valeurs par défaut SONT les fixtures actuelles (même stock, même catalogue,
// même dégustation), donc la maquette calcule les mêmes nombres. Dans l'app, `configurerDonnees` reçoit le stock réel
// (StockService, articles « Houblon » reliés à une variété), le catalogue de production (#120) et la dégustation du
// brasseur ; l'α du lot vient de chaque ajout de la recette (HopIngredient.alpha, conversion.ts).
//
// Le moteur v4 de l'adaptateur est créé PAR LA FABRIQUE (creerMoteur, #164) sur les fiches et le stock injectés : plus aucun
// singleton. `substitutes` et `proposeVoies` classent « en stock d'abord » sur le stock injecté. Mêmes tableaux = même
// moteur (mêmes caches) ; les écrans qui importent encore le moteur v4 directement lisent le moteur par défaut (fixtures).
import { CATALOGUE, STOCK, creerMoteur, type CatalogueHop, type Moteur, type StockHop, type Tasting } from '../../../../../src/domain/hopIndex/v4';
import { DEGUSTATION, recetteDegustee } from '../donnees/cas';
import type { AjoutParcours, RecetteParcours } from '../etat/types';

/** La dégustation du brasseur et la recette telle qu'il l'a dégustée (la base dont part Ma bière). */
export interface DegustationParcours {
  tasting: Tasting;
  /** La recette dégustée : une copie neuve à chaque appel. */
  recette: () => RecetteParcours;
}

export interface DonneesParcours {
  /** Variétés que les outils peuvent proposer (Substituer, Suggérer). App : le catalogue de production (#120).
   * Défaut : CATALOGUE du moteur (318 variétés Beer Maverick, fixture). Une variété absente des fiches du moteur
   * reste inconnue (le moteur n'a ni ses descripteurs ni ses huiles). */
  catalogue: CatalogueHop[];
  /** Fiches des variétés que le moteur connaît (descripteurs, huiles, α). Défaut : CATALOGUE (fixture, 318 variétés). Une
   * variété absente des fiches reste inconnue du moteur. */
  fiches: CatalogueHop[];
  /** Stock du brasseur : grammes libres et α du lot. Défaut : STOCK du moteur (fixture houblons-2026-10-17). */
  stock: StockHop[];
  /** Sa dégustation ; null = aucune : le profil de Ma bière est alors tout simulé (« ~ »). Défaut : S1 du 18.10. */
  degustation: DegustationParcours | null;
  /** α du lot d'un ajout, en % m/m : un nombre ; null = inconnu (IBU inconnu, jamais 0) ; undefined = l'α du stock,
   * sinon le milieu de la plage variétale. Défaut : `a.alphaLot` (posé par la conversion de la recette de l'app). */
  alphaDuLot: (a: AjoutParcours) => number | null | undefined;
}

const DEFAUT: DonneesParcours = {
  catalogue: CATALOGUE,
  fiches: CATALOGUE,
  stock: STOCK,
  degustation: { tasting: DEGUSTATION, recette: recetteDegustee },
  alphaDuLot: (a) => a.alphaLot,
};

let courantes: DonneesParcours = DEFAUT;
let index = { stock: new Map(STOCK.map((s) => [s.key, s])), catalogue: new Map(CATALOGUE.map((h) => [h.id, h])) };
let moteurCourant: Moteur = creerMoteur({ catalogue: DEFAUT.fiches, stock: DEFAUT.stock });
/** Le moteur v4 des données courantes (fabrique). */
export const moteur = (): Moteur => moteurCourant;
const ecouteurs: (() => void)[] = [];

/** Les données lues par l'adaptateur. */
export const donnees = (): DonneesParcours => courantes;
/** true quand le catalogue est celui du moteur (aucun filtre à appliquer). */
export const catalogueDuMoteur = (): boolean => courantes.catalogue === CATALOGUE;

/** Remplace tout ou partie des données (les autres gardent leur valeur par défaut) et vide les caches de l'adaptateur.
 * Sans argument : revient aux fixtures. À appeler avant le premier calcul, ou quand le stock ou la dégustation changent. */
export function configurerDonnees(d: Partial<DonneesParcours> = {}): void {
  courantes = { ...DEFAUT, ...d };
  index = { stock: new Map(courantes.stock.map((s) => [s.key, s])), catalogue: new Map(courantes.catalogue.map((h) => [h.id, h])) };
  moteurCourant = creerMoteur({ catalogue: courantes.fiches, stock: courantes.stock });
  for (const f of ecouteurs) f();
}
/** Abonné au changement de données (mesure.ts : vider les caches). */
export function siDonneesChangent(f: () => void): void { ecouteurs.push(f); }

/** Stock libre (g) d'un houblon ; null s'il n'est pas au stock (catalogue seul). */
export function stockLibre(cle: string): number | null {
  const s = index.stock.get(cle);
  return s ? s.grams : null;
}
/** Le houblon est-il proposable (au stock, ou dans le catalogue injecté) ? */
export function proposable(cle: string): boolean {
  if (catalogueDuMoteur() || index.stock.has(cle)) return true;
  const ref = moteurCourant.hopRef(cle);
  return !!ref && index.catalogue.has(ref.varietyId);
}

/** α retenu pour une clé : celui du lot au stock, sinon le milieu de la plage variétale (même règle que hopRef du
 * moteur, appliquée aux données injectées). null : inconnu. */
export function alphaDeCle(cle: string): { value: number; min: number; max: number; from: string } | null {
  const s = index.stock.get(cle) ?? null;
  if (s?.alpha != null) return { value: s.alpha, min: s.alpha, max: s.alpha, from: s.alphaFrom ?? 'stock' };
  const ref = moteurCourant.hopRef(cle);
  const c = ref ? index.catalogue.get(ref.varietyId) ?? ref.catalogue : null;
  return c?.alpha ? { value: (c.alpha[0] + c.alpha[1]) / 2, min: c.alpha[0], max: c.alpha[1], from: 'plage variétale (Beer Maverick)' } : null;
}

/** α d'un ajout : l'α de son lot dans la recette s'il est donné (un nombre, ou null = inconnu), sinon celui de sa clé. */
export function alphaDeAjout(a: AjoutParcours): { value: number; min: number; max: number; from: string } | null {
  const lot = courantes.alphaDuLot(a);
  if (lot === null) return null;
  if (lot !== undefined) return { value: lot, min: lot, max: lot, from: 'lot de la recette' };
  return alphaDeCle(a.hopKey);
}

// ---------- Données clonables, pour le worker des calculs (#171) ----------
/** Les données injectées en données simples (postMessage) : seulement ce qui diffère des fixtures (le worker les a
 * déjà), la recette dégustée en valeur. null : non clonables (un α du lot calculé par une fonction propre), le worker
 * n'est alors pas employé. */
export interface DonneesClonables {
  catalogue?: CatalogueHop[]; fiches?: CatalogueHop[]; stock?: StockHop[];
  degustation?: { tasting: Tasting; recette: RecetteParcours } | null;
}
export function donneesClonables(): DonneesClonables | null {
  const d = courantes;
  if (d.alphaDuLot !== DEFAUT.alphaDuLot) return null;
  const c: DonneesClonables = {};
  if (d.catalogue !== DEFAUT.catalogue) c.catalogue = d.catalogue;
  if (d.fiches !== DEFAUT.fiches) c.fiches = d.fiches;
  if (d.stock !== DEFAUT.stock) c.stock = d.stock;
  if (d.degustation !== DEFAUT.degustation) c.degustation = d.degustation ? { tasting: d.degustation.tasting, recette: d.degustation.recette() } : null;
  return c;
}
/** Dans le worker : les données reçues deviennent les données injectées (configurerDonnees). */
export function configurerDonneesClonables(c: DonneesClonables): void {
  const { degustation, ...reste } = c;
  configurerDonnees({
    ...reste,
    ...(degustation === undefined ? {} : {
      degustation: degustation && { tasting: degustation.tasting, recette: () => structuredClone(degustation.recette) },
    }),
  });
}
