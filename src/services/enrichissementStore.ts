import Dexie, { type Table } from 'dexie';
import type { IngredientFacts } from '../domain/ingredientFacts';
import type { Famille } from '../domain/stock/ficheCle';
import type { ChampFiche } from '../domain/stock/ficheValeurs';

/**
 * Le magasin local de la procédure d'enrichissement (voie f4-enrichir, PLAN § 4.1) : les travaux (un par article neuf), les réponses des
 * recherches (une par clé de fiche : un produit n'est cherché qu'une fois) et le compteur du jour. IndexedDB, pas Firestore.
 */
export type EtatTravail = 'attend' | 'fait' | 'aControler' | 'introuvable' | 'aSaisir' | 'iaEteinte' | 'plafond' | 'echec' | 'abandonne';
export type Raison = 'rejet' | 'supprime' | 'ambigu' | 'proche' | 'propose' | 'horsCatalogue' | 'nonIdentifiable' | 'refus' | 'troisJours';
export interface TravailFiche {
  ref: string; submissionId: string; transactionId: string; uid: string; famille: Famille;
  ligne: { description: string; nomPropre: string; reference?: string; fournisseur?: string; unit: string; quantity?: number;
    kind?: string; stockCategory?: string; lu: { alpha?: number; origine?: string; ebc?: number } };
  s6: { cas: 'neuf' | 'incertain' | 'inconnu' | 'ambigu' | 'meme'; voisinRef?: string; motif?: 'bis' | 'origine' };
  cle: string; etat: EtatTravail; raison?: Raison; candidats?: string[];
  essais: { joursEchec: string[]; dernier?: number; vie?: string };
  remplis?: ChampFiche[]; creeLe: string; finiLe?: string; annonce: boolean;
  /** Jour de Zurich où l'état `plafond` a été posé : il reprend le jour suivant. */
  plafondLe?: string;
  /** M3 : les faits qu'il a acceptés dans une recette pour un produit `proche` d'une fiche (ref `RECETTE-…`) : gardés à contrôler, jamais écrits seuls. */
  faits?: Partial<Record<ChampFiche, unknown>>;
}
export interface ReponseFiche { cle: string; trouvee: boolean; facts?: IngredientFacts; le: string }
export interface CompteurJour { jour: string; recherches: number; tentatives: number }
export interface MagasinFiches {
  travaux: { put(t: TravailFiche): Promise<void>; get(ref: string): Promise<TravailFiche | undefined>; all(): Promise<TravailFiche[]>; delete(ref: string): Promise<void> };
  reponses: { put(r: ReponseFiche): Promise<void>; get(cle: string): Promise<ReponseFiche | undefined> };
  compteur: { get(jour: string): Promise<CompteurJour | undefined>; put(c: CompteurJour): Promise<void> };
}

export const FICHES_DATABASE_NAME = 'laffinee-fiches';
const DEXIE_SCHEMA_VERSION = 1;
const NATIVE_INDEXED_DB_VERSION = DEXIE_SCHEMA_VERSION * 10;

class FichesDatabase extends Dexie {
  travaux!: Table<TravailFiche, string>;
  reponses!: Table<ReponseFiche, string>;
  compteur!: Table<CompteurJour, string>;
  constructor(name: string, options?: ConstructorParameters<typeof Dexie>[1]) {
    super(name, options);
    this.version(DEXIE_SCHEMA_VERSION).stores({ travaux: 'ref, etat, uid', reponses: 'cle', compteur: 'jour' });
  }
}

/** Un schéma d'une autre version est refusé tel quel (même garde que `proofQueueStore.ts`) : jamais « réparer » la base d'un autre client. */
function dexieOptions(): ConstructorParameters<typeof Dexie>[1] | undefined {
  if (typeof indexedDB === 'undefined') return undefined;
  const native = indexedDB;
  return { indexedDB: { open(name: string, version?: number) {
    if (name !== FICHES_DATABASE_NAME) return native.open(name, version);
    if (version !== NATIVE_INDEXED_DB_VERSION) {
      const error = new Error(`La version IndexedDB de ${name} n’est pas prise en charge par ce client.`);
      error.name = 'VersionError';
      throw error;
    }
    const request = native.open(name, version);
    request.addEventListener('upgradeneeded', event => {
      if ((event as IDBVersionChangeEvent).oldVersion > 0) { event.stopImmediatePropagation(); request.transaction?.abort(); }
    }, { once: true });
    return request;
  } } } as ConstructorParameters<typeof Dexie>[1];
}

/** Le magasin Dexie ; `null` sans IndexedDB (node, jsdom, navigation privée refusée) : la procédure est alors sans effet. */
export function createDexieFichesStore(name = FICHES_DATABASE_NAME): MagasinFiches | null {
  if (typeof indexedDB === 'undefined') return null;
  let db: FichesDatabase | undefined;
  const open = () => (db ??= new FichesDatabase(name, dexieOptions()));
  return {
    travaux: { put: async t => { await open().travaux.put(t); }, get: async r => open().travaux.get(r), all: async () => open().travaux.toArray(), delete: async r => { await open().travaux.delete(r); } },
    reponses: { put: async r => { await open().reponses.put(r); }, get: async c => open().reponses.get(c) },
    compteur: { get: async j => open().compteur.get(j), put: async c => { await open().compteur.put(c); } },
  };
}

/** Un magasin en mémoire : les tests. */
export function createMemoryFichesStore(): MagasinFiches & { rows: { travaux: Map<string, TravailFiche>; reponses: Map<string, ReponseFiche>; compteur: Map<string, CompteurJour> } } {
  const rows = { travaux: new Map<string, TravailFiche>(), reponses: new Map<string, ReponseFiche>(), compteur: new Map<string, CompteurJour>() };
  const copie = <T>(v: T | undefined) => (v === undefined ? undefined : structuredClone(v));
  return {
    rows,
    travaux: { put: async t => { rows.travaux.set(t.ref, structuredClone(t)); }, get: async r => copie(rows.travaux.get(r)), all: async () => [...rows.travaux.values()].map(t => structuredClone(t)), delete: async r => { rows.travaux.delete(r); } },
    reponses: { put: async r => { rows.reponses.set(r.cle, structuredClone(r)); }, get: async c => copie(rows.reponses.get(c)) },
    compteur: { get: async j => copie(rows.compteur.get(j)), put: async c => { rows.compteur.set(c.jour, structuredClone(c)); } },
  };
}
