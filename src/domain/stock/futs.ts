/**
 * Règles du remplissage d'un fût (AM-70, 08.11) — une seule maison : la fiche les montre, l'écriture peut les rappeler.
 *
 * Trois fautes que la fiche laissait passer :
 * 1. un fût rempli depuis un brassin qui n'est pas fini (planifié, ou encore en fermentation) ;
 * 2. des fûts dont la contenance dépasse ce que le brassin a produit ;
 * 3. un fût « livré » sans dire chez qui.
 */
import type { Batch, KegItem } from '../../types';
import { nombreFr } from '../nombreAffiche';

/**
 * Un fût se remplit d'un brassin déjà brassé : en fermentation (le tableau des fûts l'admettait : « au moins en fermentation »), en garde ou conditionné.
 * Un brassin planifié n'existe pas encore, un annulé n'a rien produit, un terminé est vendu : aucun ne remplit un fût.
 * Fermentation admise = choix prudent (transfert en fût fermé) ; à confirmer par le brasseur (voir RESULTAT, AM-70).
 */
export const STATUTS_FUTABLES: ReadonlyArray<Batch['status']> = ['fermentation', 'garde', 'conditionne'];

export function brassinFutable(batch: Pick<Batch, 'status'>): boolean {
  return STATUTS_FUTABLES.includes(batch.status);
}

/** Les brassins proposés dans la fiche d'un fût ; le contenu déjà enregistré du fût reste proposé (`dejaChoisi`). */
export function brassinsAFuter<T extends Pick<Batch, 'id' | 'status'>>(batches: T[], dejaChoisi?: string): T[] {
  return batches.filter((b) => brassinFutable(b) || b.id === dejaChoisi);
}

/** Le volume que le brassin a vraiment donné : conditionné, sinon récolté en cuve, sinon visé. `undefined` s'il est inconnu (jamais 0). */
export function volumeProduit(batch: Pick<Batch, 'volumePackagedL' | 'volumeBrewedL' | 'volumeL'>): number | undefined {
  const ok = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
  if (ok(batch.volumePackagedL)) return batch.volumePackagedL;
  if (ok(batch.volumeBrewedL)) return batch.volumeBrewedL;
  return ok(batch.volumeL) ? batch.volumeL : undefined;
}

/** Contenance des AUTRES fûts pleins ou livrés de ce brassin. */
export function litresDansLesAutresFuts(batchId: string, kegs: KegItem[], gardeId: string): number {
  return kegs
    .filter((k) => k.id !== gardeId && k.batchRef === batchId && (k.state === 'plein' || k.state === 'livre'))
    .reduce((somme, k) => somme + (Number.isFinite(k.capacityL) ? k.capacityL : 0), 0);
}

/**
 * Ce fût-ci ne peut pas être rempli quand les autres fûts du brassin couvrent déjà tout ce qu'il a produit.
 * Un fût peut rester en partie vide (20 L dans un fût de 30 L) : seule la contenance DÉJÀ suffisante ailleurs est refusée.
 */
export function problemeRemplissage(keg: KegItem, batches: Array<Pick<Batch, 'id' | 'volumePackagedL' | 'volumeBrewedL' | 'volumeL'>>, kegs: KegItem[]): string | undefined {
  if ((keg.state !== 'plein' && keg.state !== 'livre') || !keg.batchRef) return undefined;
  const batch = batches.find((b) => b.id === keg.batchRef);
  const volume = batch ? volumeProduit(batch) : undefined;
  if (volume === undefined) return undefined;
  const ailleurs = litresDansLesAutresFuts(keg.batchRef, kegs, keg.id);
  if (ailleurs >= volume)
    return `Les autres fûts de ce brassin contiennent déjà ${nombreFr(ailleurs, 1)} L pour ${nombreFr(volume, 1)} L produits : il n’en reste rien pour ce fût.`;
  return undefined;
}

/** Un fût livré dit chez qui. */
export function problemeLivraison(keg: Pick<KegItem, 'state' | 'clientName'>): string | undefined {
  return keg.state === 'livre' && !keg.clientName?.trim() ? 'Indique le client chez qui ce fût est livré.' : undefined;
}
