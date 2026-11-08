import type { Batch } from '../types';
import { isoDate } from './finance/ledger';

/**
 * AM n° 6 : le volume conditionné d'un brassin (assiette de la taxe sur la bière, LIB RS 641.411 art. 17, et du bilan de pertes) ne se saisissait nulle part.
 * Il se saisit au passage « Conditionné » : 0 < conditionné ≤ volume en fermenteur ; la date n'est ni avant le brassage ni dans le futur.
 */

/** Volume en fermenteur : celui mesuré au jour de brassage, sinon le volume visé. Inconnu : `null` (jamais 0, jamais sans limite). */
export function packagingLimitL(batch: Pick<Batch, 'volumeBrewedL' | 'volumeL'>): number | null {
  const mesure = Number(batch.volumeBrewedL), vise = Number(batch.volumeL);
  if (mesure > 0) return mesure;
  return vise > 0 ? vise : null;
}

export type PackagingCheck = { ok: true } | { ok: false; field: 'volume' | 'date'; error: string };

const litres = (n: number): string => `${String(Math.round(n * 100) / 100).replace('.', ',')} L`;

export function validatePackaging(input: { volumeL: number | null; maxL: number | null; date: string; brewDate?: string; today: string }): PackagingCheck {
  const { volumeL, maxL } = input;
  if (volumeL === null || !Number.isFinite(volumeL) || volumeL <= 0) return { ok: false, field: 'volume', error: 'Indique le volume mis en bouteilles ou en fûts, plus grand que 0 L.' };
  if (maxL === null) return { ok: false, field: 'volume', error: 'Le volume en fermenteur est inconnu : renseigne-le au jour de brassage avant de conditionner.' };
  if (volumeL > maxL + 1e-9) return { ok: false, field: 'volume', error: `Plus que le volume en fermenteur (${litres(maxL)}) : un brassin ne donne pas plus de bière qu’il n’en contient.` };
  const date = isoDate(input.date);
  if (!date) return { ok: false, field: 'date', error: 'Indique la date de conditionnement.' };
  const brew = isoDate(input.brewDate);
  if (brew && date < brew) return { ok: false, field: 'date', error: 'Le conditionnement ne peut pas précéder le jour de brassage.' };
  if (date > input.today) return { ok: false, field: 'date', error: 'La date de conditionnement est dans le futur.' };
  return { ok: true };
}

/** Un brassin déclaré « Conditionné » ou « Terminé » sans volume conditionné valide échappe à la taxe : le volume est alors demandé. */
export function needsPackagingVolume(batch: Pick<Batch, 'status' | 'volumePackagedL'>): boolean {
  return (batch.status === 'conditionne' || batch.status === 'termine') && !(Number(batch.volumePackagedL) > 0);
}
