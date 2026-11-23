/**
 * Carnet d'idées : le magasin. Une interface, deux implémentations :
 * - Firestore (l'app) : lecture de `creativeItems` par `FirestoreRepo.all`, écriture **document par document** par `FirestoreRepo.put` et
 *   `FirestoreRepo.remove`, comme `StorageService.addCreativeItem`. Le local d'abord est le cache persistant de Firestore (une seule source,
 *   pas de Dexie : MISSION § Données). Jamais la réécriture de toute la liste (elle effacerait une idée créée sur un autre appareil).
 * - mémoire (banc `?preview=carnets`, tests).
 */
import type { CreativeItem } from '../types';
import { estDocCarnet } from '../domain/carnets/modele';
import { appliquerEcritures, type EcritureCarnet, type Journal } from '../domain/carnets/operations';
import { FirestoreRepo } from './firestoreRepo';
import { StorageService } from './storage';

export interface MagasinCarnets {
  /** Les documents du carnet (idées et messages), triés par id. */
  lire(): CreativeItem[];
  /** Prévient à chaque changement ; rend la fonction de désabonnement. */
  ecouter(rappel: () => void): () => void;
  /** Applique des écritures (celles d'une intention, ou son inverse pour Annuler) ; journalise si demandé. */
  appliquer(ecritures: readonly EcritureCarnet[], journal?: Journal): void;
}

/** Ce dont le magasin Firestore a besoin (injectable pour les tests). */
export interface PortFirestore {
  tous(): CreativeItem[];
  poser(id: string, doc: CreativeItem): void;
  retirer(id: string): void;
  sAbonner(rappel: () => void): () => void;
  journaliser?(journal: Journal): void;
}

const parId = (a: CreativeItem, b: CreativeItem) => a.id.localeCompare(b.id);

export function magasinSur(port: PortFirestore): MagasinCarnets {
  return {
    lire: () => port.tous().filter(estDocCarnet).sort(parId),
    ecouter: rappel => port.sAbonner(rappel),
    appliquer(ecritures, journal) {
      for (const w of ecritures) {
        if (w.op === 'put') {
          if (!estDocCarnet(w.doc)) throw new Error('Le magasin du carnet n’écrit que des idées et des messages.');
          port.poser(w.doc.id, w.doc);
        } else port.retirer(w.id);
      }
      if (journal) port.journaliser?.(journal);
    }
  };
}

/** Le magasin de l'app : Firestore, document par document, dans `creativeItems`. */
export function magasinFirestore(): MagasinCarnets {
  return magasinSur({
    tous: () => FirestoreRepo.all<CreativeItem>('creativeItems'),
    poser: (id, doc) => FirestoreRepo.put('creativeItems', id, doc),
    retirer: id => FirestoreRepo.remove('creativeItems', id),
    sAbonner: rappel => FirestoreRepo.subscribe(rappel),
    journaliser: j => StorageService.logAction(j.action, 'Stocks', j.entityId, j.resume)
  });
}

/** Le magasin mémoire (banc, tests) : `ecritures` garde chaque écriture reçue (espion). */
export function magasinMemoire(initial: readonly CreativeItem[] = []): MagasinCarnets & { ecritures: EcritureCarnet[]; journal: Journal[] } {
  let docs = appliquerEcritures([], initial.map(doc => ({ op: 'put', doc }) as EcritureCarnet));
  const rappels = new Set<() => void>();
  const ecritures: EcritureCarnet[] = [];
  const journal: Journal[] = [];
  return {
    ecritures, journal,
    lire: () => docs.filter(estDocCarnet).map(d => JSON.parse(JSON.stringify(d)) as CreativeItem),
    ecouter(rappel) { rappels.add(rappel); return () => { rappels.delete(rappel); }; },
    appliquer(liste, j) {
      for (const w of liste) if (w.op === 'put' && !estDocCarnet(w.doc)) throw new Error('Le magasin du carnet n’écrit que des idées et des messages.');
      ecritures.push(...liste);
      docs = appliquerEcritures(docs, liste);
      if (j) journal.push(j);
      rappels.forEach(r => r());
    }
  };
}
