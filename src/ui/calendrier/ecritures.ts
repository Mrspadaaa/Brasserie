import type { Batch, CreativeItem, Recipe } from '../../types';
import type { FinancialPlan } from '../../domain/finance/types';
import { plannedBrewDate } from '../../domain/batchSchedule';
import type { Collection, Ecriture } from '../../domain/calendrierGestes';
import { StorageService } from '../../services/storage';
import { FinanceService } from '../../services/financeService';
import { saveBatchSchedule } from '../../services/batchSchedule';

/**
 * Une intention du calendrier devient une écriture dans la source, par les services existants, avec son inverse (Annuler).
 *
 * - `appliquer` lit l'état courant de chaque document AVANT d'écrire : l'inverse d'un `patch` remet les valeurs d'avant (`undefined` = le champ
 *   n'existait pas), l'inverse d'un `creer` retire ce qui vient d'être posé, jamais autre chose.
 * - On ne supprime rien d'ancien (L33) : seul l'inverse d'une création supprime ce que le geste vient de créer ; un plan créé et annulé passe
 *   à `cancelled` (il reste dans Finances).
 * - Le port est injectable : les tests passent une mémoire, l'app passe `portParDefaut()` (StorageService, FinanceService, saveBatchSchedule).
 */

export type Document = Record<string, unknown>;

export interface PortEcritures {
  lire(collection: Collection, id: string): Document | undefined;
  /** `undefined` dans le patch = retirer le champ. */
  patcher(collection: Collection, id: string, patch: Document): void | Promise<void>;
  creer(collection: Collection, document: Document & { id: string }, recetteId?: string): void | Promise<void>;
  supprimer(collection: Collection, id: string): void | Promise<void>;
}

export interface EcritureFaite {
  /** Les écritures appliquées. */
  ecritures: readonly Ecriture[];
  /** Défait tout, dans l'ordre inverse. Sans effet une deuxième fois. */
  annuler(): Promise<void>;
}

/** Ce qu'il faut réécrire pour revenir en arrière. */
function inverseDe(e: Ecriture, avant: Document | undefined): Ecriture | null {
  if (e.op === 'patch') {
    if (!avant) return null;
    return { op: 'patch', collection: e.collection, id: e.id, patch: Object.fromEntries(Object.keys(e.patch).map(k => [k, avant[k]])) };
  }
  if (e.op === 'creer') return { op: 'supprimer', collection: e.collection, id: e.document.id };
  return avant ? { op: 'creer', collection: e.collection, document: avant as Document & { id: string } } : null;
}

async function jouer(e: Ecriture, port: PortEcritures): Promise<void> {
  if (e.op === 'patch') await port.patcher(e.collection, e.id, e.patch);
  else if (e.op === 'creer') await port.creer(e.collection, e.document, e.recetteId);
  else await port.supprimer(e.collection, e.id);
}

/** Applique les écritures dans l'ordre ; si l'une échoue, les précédentes sont défaites et l'erreur remonte. */
export async function appliquer(ecritures: readonly Ecriture[], port: PortEcritures = portParDefaut()): Promise<EcritureFaite> {
  const faites: Ecriture[] = [];
  const inverses: Ecriture[] = [];
  const defaire = async () => { for (const inv of inverses.splice(0).reverse()) await jouer(inv, port); };
  try {
    for (const e of ecritures) {
      const id = e.op === 'creer' ? e.document.id : e.id;
      const avant = e.op === 'creer' ? undefined : port.lire(e.collection, id);
      const inverse = inverseDe(e, avant ? structuredClone(avant) : undefined);
      await jouer(e, port);
      faites.push(e);
      if (inverse) inverses.push(inverse);
    }
  } catch (erreur) {
    await defaire();
    throw erreur;
  }
  return { ecritures: faites, annuler: defaire };
}

const sansIndefini = (patch: Document): Document => Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));

/** Les vrais services de l'app. Aucune donnée réelle n'est touchée par les tests : ils passent leur propre port. */
export function portParDefaut(): PortEcritures {
  return {
    lire(collection, id) {
      if (collection === 'batches') return StorageService.getBatches().find(b => b.id === id) as unknown as Document | undefined;
      if (collection === 'creativeItems') return StorageService.getCreativeItems().find(i => i.id === id) as unknown as Document | undefined;
      return FinanceService.getPlans().find(p => p.id === id) as unknown as Document | undefined;
    },
    async patcher(collection, id, patch) {
      if (collection === 'batches') {
        const courant = StorageService.getBatches().find(b => b.id === id);
        if (!courant) throw new Error('Ce brassin n’existe plus. Rouvre la liste des brassins.');
        let batch: Batch = courant;
        // Une date de brassage s'écrit par le chemin qui protège un journal commencé sur un autre appareil (saveBatchSchedule).
        if ('plannedBrewDate' in patch) batch = await saveBatchSchedule(courant, String(patch.plannedBrewDate ?? plannedBrewDate(courant) ?? ''), b => StorageService.updateBatch(b));
        const reste: Document = { ...patch };
        delete reste.plannedBrewDate; delete reste.brewDate;
        // `finPrevue` retirée s'écrit « vide » : une écriture fusionnée ne sait pas effacer un champ.
        if ('finPrevue' in reste && reste.finPrevue === undefined) reste.finPrevue = '';
        if (Object.keys(reste).length) StorageService.updateBatch({ ...batch, ...sansIndefini(reste) } as Batch);
        return;
      }
      if (collection === 'creativeItems') {
        const courant = StorageService.getCreativeItems().find(i => i.id === id);
        if (!courant) throw new Error('Cette chose n’existe plus.');
        const suivant = { ...courant, ...patch } as CreativeItem;
        for (const [k, v] of Object.entries(patch)) if (v === undefined) delete (suivant as unknown as Document)[k];
        StorageService.updateCreativeItem(suivant);
        return;
      }
      const courant = FinanceService.getPlans().find(p => p.id === id);
      if (!courant) throw new Error('Cette prévision n’existe plus. Ouvre Finances.');
      const suivant = { ...courant, ...patch } as FinancialPlan;
      for (const [k, v] of Object.entries(patch)) if (v === undefined) delete (suivant as unknown as Document)[k];
      FinanceService.savePlan(suivant);
    },
    creer(collection, document, recetteId) {
      if (collection === 'batches') {
        const batch = document as unknown as Batch;
        const recette = recetteId ? StorageService.getRecipes().find((r: Recipe) => r.id === recetteId) : undefined;
        // La recette fige sa version dans le brassin (captureSnapshot) : le brassin planifié ne bouge plus si la recette change.
        if (recette) {
          const pose = StorageService.planRecipeBatch(recette, batch.id, batch.plannedBrewDate ?? '');
          if (batch.finPrevue) StorageService.updateBatch({ ...pose, finPrevue: batch.finPrevue });
        } else StorageService.addBatch(batch);
        return;
      }
      if (collection === 'creativeItems') { StorageService.addCreativeItem(document as unknown as CreativeItem); return; }
      FinanceService.savePlan(document as unknown as FinancialPlan);
    },
    supprimer(collection, id) {
      if (collection === 'batches') StorageService.deleteBatch(id);
      else if (collection === 'creativeItems') StorageService.deleteCreativeItem(id);
      else FinanceService.cancelPlan(id);
    }
  };
}
