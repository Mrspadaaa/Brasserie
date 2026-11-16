// Filtre de période (voie p3, COUVERTURE « Période de l'application ») : « Ce mois » par défaut cachait 3 brassins sur 5 au banc,
// dont des brassins en cours. Correctif étroit : la période de l'application ne juge que les brassins finis (conditionné, terminé,
// annulé) ; un brassin planifié, en fermentation ou en garde reste visible sous toute période. Le jugement d'un brassin fini reste
// celui du catalogue (`filterCatalog`) : la même date d'affichage.
// Fusion avec la période commune (m3r-a) : la période est celle de l'app (`PeriodeEntree`), lue par `dansPeriode` (même règle de date
// que `DateUtils.isDateInPeriod` pour les mois, trimestres et années ; les dates libres de Finances comptent aussi).
import type { Batch } from '../../../types';
import { batchEntries } from '../../../domain/productionCatalog';
import { dansPeriode, enPeriode, type PeriodeEntree } from '../../../components/periode/periode';

const EN_COURS = new Set(['planifie', 'fermentation', 'garde']);
export const estEnCours = (b: Batch) => EN_COURS.has(b.status);

export function batchesVisiblesSousPeriode(batches: Batch[], periode: PeriodeEntree): Batch[] {
  if (enPeriode(periode).genre === 'tout') return batches;
  const entrees = new Map(batchEntries(batches).map(e => [e.id, e]));
  return batches.filter(b => {
    if (estEnCours(b)) return true;
    const e = entrees.get(b.id);
    return !!e && e.timestamp !== undefined && dansPeriode(e.date ?? '', periode);
  });
}
