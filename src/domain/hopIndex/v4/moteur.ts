// Fabrique du moteur v4 (#164, B2) : creerMoteur(donnees) rend toutes les fonctions de l'API (api.ts) liées à SES
// données (catalogue des fiches, stock du brasseur) et à SES caches. Aucun module du moteur ne lit les fixtures en dur :
// chacun lit le contexte actif (data.ts : courant), que chaque fonction du moteur pose le temps de son appel.
// Le moteur est synchrone ; une fonction rendue par un appel (aucune aujourd'hui) relirait le contexte de son propre appel.
// Mêmes données (mêmes tableaux) = même contexte : les caches, purs, ne dépendent que des données ; deux moteurs créés sur
// les mêmes tableaux les partagent, et le moteur par défaut (les exports d'api.ts) est celui des fixtures.
import * as api from './api';
import { DONNEES_FIXTURE, contexte, contexteParDefaut, dansContexte, type CatalogueHop, type Contexte, type DonneesMoteur, type StockHop } from './data';

type Api = typeof api;
type Fonctions = { [K in keyof Api as Api[K] extends (...a: never[]) => unknown ? K : never]: Api[K] };
export type Moteur = Fonctions & {
  readonly donnees: DonneesMoteur; readonly catalogue: CatalogueHop[]; readonly stock: StockHop[];
  /** Exécute f dans le contexte de ce moteur (pour une fonction de module hors de l'API). */
  dans<T>(f: () => T): T;
};

const contextes = new WeakMap<CatalogueHop[], WeakMap<StockHop[], Contexte>>();
function contexteDe(d: DonneesMoteur): Contexte {
  if (d.catalogue === DONNEES_FIXTURE.catalogue && d.stock === DONNEES_FIXTURE.stock) return contexteParDefaut();
  let parStock = contextes.get(d.catalogue);
  if (!parStock) contextes.set(d.catalogue, (parStock = new WeakMap()));
  let c = parStock.get(d.stock);
  if (!c) parStock.set(d.stock, (c = contexte(d)));
  return c;
}

/** Un moteur sur ces données ; une donnée absente garde sa valeur par défaut (fixture). Les tableaux sont lus, jamais
 * modifiés : un stock qui change est un nouveau tableau, donc un nouveau moteur. */
export function creerMoteur(donnees: Partial<DonneesMoteur> = {}): Moteur {
  const d: DonneesMoteur = { catalogue: donnees.catalogue ?? DONNEES_FIXTURE.catalogue, stock: donnees.stock ?? DONNEES_FIXTURE.stock };
  const c = contexteDe(d);
  const m: Record<string, unknown> = { donnees: d, catalogue: d.catalogue, stock: d.stock, dans: <T>(f: () => T) => dansContexte(c, f) };
  for (const [nom, v] of Object.entries(api)) {
    if (typeof v === 'function') m[nom] = (...a: unknown[]) => dansContexte(c, () => (v as (...x: unknown[]) => unknown)(...a));
  }
  return m as Moteur;
}
