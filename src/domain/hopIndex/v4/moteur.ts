// Fabrique du moteur v4 (#164, B2) : creerMoteur(donnees) rend toutes les fonctions de l'API (api.ts) liées à SES
// données (catalogue des fiches, stock du brasseur) et à SES caches. Aucun module du moteur ne lit les fixtures en dur :
// chacun lit le contexte actif (data.ts : courant), que chaque fonction du moteur pose le temps de son appel.
// Le moteur est synchrone ; une fonction rendue par un appel (aucune aujourd'hui) relirait le contexte de son propre appel.
// Mêmes données = même contexte (T8, #169) : les caches, purs, ne dépendent que du contenu des données ; deux moteurs créés
// sur les mêmes tableaux, ou sur des tableaux neufs de même contenu (empreinte), les partagent. Le moteur par défaut (les
// exports d'api.ts) est celui des fixtures.
import * as api from './api';
import { DONNEES_FIXTURE, contexte, contexteParDefaut, dansContexte, type CatalogueHop, type Contexte, type DonneesMoteur, type StockHop } from './data';

type Api = typeof api;
type Fonctions = { [K in keyof Api as Api[K] extends (...a: never[]) => unknown ? K : never]: Api[K] };
export type Moteur = Fonctions & {
  /** Empreinte du contenu des données ; null pour le moteur des fixtures. Deux moteurs d'empreinte égale partagent leurs caches. */
  readonly empreinte: string | null;
  readonly donnees: DonneesMoteur; readonly catalogue: CatalogueHop[]; readonly stock: StockHop[];
  /** Exécute f dans le contexte de ce moteur (pour une fonction de module hors de l'API). */
  dans<T>(f: () => T): T;
};

// ---------- Empreinte des données (T8, #169) ----------
// Un snapshot Firestore ou Dexie rend les MÊMES données dans des tableaux neufs : sans empreinte, chaque snapshot créerait
// un contexte neuf, donc des caches vides et un premier calcul relancé (banc #166 : ×25). L'empreinte est calculée sur le
// CONTENU qui compte pour le moteur : le catalogue tel quel (son ordre fait foi), le stock trié par clé (l'ordre des
// articles n'a pas d'effet sur un calcul : vérifié par tests/unit/hopIndexV4/empreinteDonnees.test.ts).
// Deux contextes au plus sont gardés (les données courantes et les précédentes) : la mémoire reste bornée.
function cyrb53(texte: string, graine = 0): number {
  let h1 = 0xdeadbeef ^ graine, h2 = 0x41c6ce57 ^ graine;
  for (let i = 0; i < texte.length; i++) {
    const c = texte.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
const hex = (texte: string) => cyrb53(texte).toString(16).padStart(14, '0') + cyrb53(texte, 1).toString(16).padStart(14, '0');
/** Empreinte du contenu des données du moteur : égale pour des données égales, quel que soit l'ordre des articles du stock. */
export function empreinteDonnees(d: DonneesMoteur): string {
  const stock = [...d.stock].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  return `${d.catalogue.length}.${stock.length}.${hex(JSON.stringify(d.catalogue))}.${hex(JSON.stringify(stock))}`;
}

interface Garde { catalogue: CatalogueHop[]; stock: StockHop[]; empreinte: string; ctx: Contexte }
const MAX_CONTEXTES = 2;
let gardes: Garde[] = [];
const compte = { crees: 0, parIdentite: 0, parEmpreinte: 0 };
/** Compteurs du moteur (journal des tests et du banc) : contextes construits, réutilisés par identité des tableaux,
 * réutilisés par empreinte. Un snapshot identique incrémente `parEmpreinte` et jamais `crees`. */
export const statistiquesMoteur = () => ({ ...compte, gardes: gardes.length });
/** Pour les tests : oublie les contextes gardés et remet les compteurs à zéro. */
export function oublierContextes(): void { gardes = []; compte.crees = compte.parIdentite = compte.parEmpreinte = 0; }

function contexteDe(d: DonneesMoteur): { ctx: Contexte; empreinte: string | null } {
  if (d.catalogue === DONNEES_FIXTURE.catalogue && d.stock === DONNEES_FIXTURE.stock) return { ctx: contexteParDefaut(), empreinte: null };
  const idem = gardes.find((g) => g.catalogue === d.catalogue && g.stock === d.stock);
  if (idem) { compte.parIdentite++; return { ctx: idem.ctx, empreinte: idem.empreinte }; }
  const empreinte = empreinteDonnees(d);
  const pareil = gardes.find((g) => g.empreinte === empreinte);
  if (pareil) {
    compte.parEmpreinte++;
    // Les nouveaux tableaux remplacent les anciens dans la garde : le prochain snapshot identique sera reconnu par identité.
    gardes = [{ ...pareil, catalogue: d.catalogue, stock: d.stock }, ...gardes.filter((g) => g !== pareil)];
    return { ctx: pareil.ctx, empreinte };
  }
  const ctx = contexte(d);
  compte.crees++;
  gardes = [{ catalogue: d.catalogue, stock: d.stock, empreinte, ctx }, ...gardes].slice(0, MAX_CONTEXTES);
  return { ctx, empreinte };
}

/** Un moteur sur ces données ; une donnée absente garde sa valeur par défaut (fixture). Les tableaux sont lus, jamais
 * modifiés : un stock qui change de contenu donne une autre empreinte, donc un moteur neuf (caches vides). */
export function creerMoteur(donnees: Partial<DonneesMoteur> = {}): Moteur {
  const d: DonneesMoteur = { catalogue: donnees.catalogue ?? DONNEES_FIXTURE.catalogue, stock: donnees.stock ?? DONNEES_FIXTURE.stock };
  const { ctx: c, empreinte } = contexteDe(d);
  const m: Record<string, unknown> = { empreinte, donnees: d, catalogue: d.catalogue, stock: d.stock, dans: <T>(f: () => T) => dansContexte(c, f) };
  for (const [nom, v] of Object.entries(api)) {
    if (typeof v === 'function') m[nom] = (...a: unknown[]) => dansContexte(c, () => (v as (...x: unknown[]) => unknown)(...a));
  }
  return m as Moteur;
}
