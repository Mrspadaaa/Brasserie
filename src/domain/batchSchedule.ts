import { breweryDay, hasBrewStarted, plannedBrewDate, type BatchDates } from '../../functions/src/batchSchedule';
export * from '../../functions/src/batchSchedule';

/**
 * TE-40 : une indication de date ancienne, en texte libre (« Planifié ~06,2026 »), s'affiche à la suisse : le mois et l'année se séparent par un
 * point comme partout (« 06.2026 », « 03.09.2026 »), jamais par une virgule. Le reste du texte est rendu tel quel.
 */
export function indicationDeDate(texte: string): string {
  return texte.replace(/(^|[^\d.,])(\d{1,2}),(\d{4})(?![\d,])/g, (_tout, avant: string, mois: string, annee: string) => `${avant}${mois}.${annee}`);
}

/** Un brassin « planifié » dont la date prévue est passée et qui n'a pas commencé : à signaler (test en ligne n° 33). */
export function plannedDateIsPast(batch: BatchDates, now: number = Date.now()): boolean {
  const date = plannedBrewDate(batch);
  if (!date || hasBrewStarted(batch)) return false;
  const key = (d: string) => d.split('.').reverse().join('-');
  return key(date) < key(breweryDay(now));
}
