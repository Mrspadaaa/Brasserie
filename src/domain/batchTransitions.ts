import type { Batch, BatchStatus } from '../types';
import { BATCH_STATUS } from './batchStatus';

/**
 * Quelles étapes un brassin peut-il prendre depuis son étape actuelle ?
 *
 * La fermentation commence à l'ajout réel de la levure (`brewDay.pitchedAt`, consigné au jour de brassage),
 * pas quand on le décide dans une liste. Un brassin planifié n'offre donc « Fermentation » qu'une fois la
 * levure ajoutée. Ensuite on avance : fermentation → garde froide (facultative) → conditionné → terminé.
 * Un retour en arrière d'une étape reste possible (erreur de clic), mais se confirme et dit ce qu'il défait.
 * « Annulé » s'offre avant la fin. « Planifié » n'existe plus pour une bière déjà brassée.
 */

export type TransitionKind = 'forward' | 'back' | 'cancel';
export interface StatusOption { status: BatchStatus; kind: TransitionKind }

const pitched = (batch: Batch) => batch.brewDay?.pitchedAt != null;
const stockApplied = (batch: Batch) => !!batch.stockConsumption?.appliedAt;

/** Les étapes offertes en plus de l'étape actuelle, dans l'ordre du cycle de vie. */
export function statusOptions(batch: Batch): StatusOption[] {
  const forward = (...list: BatchStatus[]): StatusOption[] => list.map(status => ({ status, kind: 'forward' }));
  const back = (status: BatchStatus): StatusOption[] => [{ status, kind: 'back' }];
  const cancel: StatusOption[] = [{ status: 'annule', kind: 'cancel' }];
  switch (batch.status) {
    case 'planifie': return [...(pitched(batch) ? forward('fermentation') : []), ...cancel];
    case 'fermentation': return [...forward('garde', 'conditionne'), ...cancel];
    case 'garde': return [...back('fermentation'), ...forward('conditionne'), ...cancel];
    case 'conditionne': return [...back('garde'), ...forward('termine'), ...cancel];
    case 'termine': return back('conditionne');
    // Un brassin annulé qui a été brassé reprend en fermentation ; sinon il redevient planifié.
    case 'annule': return back(pitched(batch) || stockApplied(batch) ? 'fermentation' : 'planifie');
    default: return [];
  }
}

export function canMoveTo(batch: Batch, status: BatchStatus): boolean {
  return status === batch.status || statusOptions(batch).some(option => option.status === status);
}

/** L'étape suivante proposée en un geste : la première offerte vers l'avant. */
export function suggestedNextStatus(batch: Batch): BatchStatus | null {
  return statusOptions(batch).find(option => option.kind === 'forward')?.status ?? null;
}

/** Pourquoi la fermentation n'est pas offerte à un brassin planifié, ou `null`. */
export function fermentationBlockedReason(batch: Batch): string | null {
  return batch.status === 'planifie' && !pitched(batch)
    ? 'Reprends le jour de brassage pour consigner l’ajout réel de levure : la fermentation commence à cet instant.'
    : null;
}

/** Un retour en arrière et un abandon se confirment dans la page, même panneau (RJ-15 : l'abandon s'appliquait sans question, le retour en demandait une). */
export function needsConfirmation(batch: Batch, status: BatchStatus): boolean {
  const option = statusOptions(batch).find(o => o.status === status);
  return option?.kind === 'back' || option?.kind === 'cancel';
}

/** Ce que le changement défait : toujours le stock d'abord, car un statut ne remet rien en rayon. */
export function transitionConsequence(batch: Batch, status: BatchStatus): string {
  const label = BATCH_STATUS[status]?.label ?? status;
  const consumption = batch.stockConsumption;
  const lines: string[] = [];
  if (!consumption?.appliedAt) {
    lines.push('Rien n’a été déstocké pour ce brassin : le stock ne change pas.');
  } else {
    lines.push('Le stock déjà retiré reste retiré : aucun ingrédient n’est remis en rayon. En cas de besoin, corrige-le par une correction d’inventaire.');
    if (consumption.completedStages?.includes('remaining') && status !== 'annule' && BATCH_STATUS[status].order < BATCH_STATUS.conditionne.order)
      lines.push('Les ajouts de fermentation déjà confirmés restent aussi déstockés.');
  }
  if (status === 'annule') {
    lines.push('Le brassin est abandonné ; son historique est conservé.');
    if (consumption?.pendingItems?.length) lines.push('Les ajouts encore réservés ne sont pas libérés automatiquement.');
  }
  else lines.push(`Le brassin repasse à « ${label} » ; ses mesures et ses dates sont conservées.`);
  return lines.join(' ');
}
