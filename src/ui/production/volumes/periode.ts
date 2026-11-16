// Filtre de période (voie p3, COUVERTURE « Période de l'application ») : « Ce mois » par défaut cachait 3 brassins sur 5 au banc,
// dont des brassins en cours. Correctif étroit : la période de l'application ne juge que les brassins finis (conditionné, terminé,
// annulé) ; un brassin planifié, en fermentation ou en garde reste visible sous toute période. Le jugement d'un brassin fini reste
// celui du catalogue (`filterCatalog`) : la même date d'affichage et la même `DateUtils.isDateInPeriod`.
import type { Batch, TimeFilterPeriod } from '../../../types';
import { batchEntries } from '../../../domain/productionCatalog';
import { DateUtils } from '../../../services/dateUtils';

const EN_COURS = new Set(['planifie', 'fermentation', 'garde']);
export const estEnCours = (b: Batch) => EN_COURS.has(b.status);

export function batchesVisiblesSousPeriode(batches: Batch[], periode: TimeFilterPeriod): Batch[] {
  if (periode === 'all') return batches;
  const entrees = new Map(batchEntries(batches).map(e => [e.id, e]));
  return batches.filter(b => {
    if (estEnCours(b)) return true;
    const e = entrees.get(b.id);
    return !!e && e.timestamp !== undefined && DateUtils.isDateInPeriod(e.date ?? '', periode);
  });
}
