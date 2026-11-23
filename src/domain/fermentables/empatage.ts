/**
 * BR-31 : un empâtage de grain sans palier de saccharification ne convertit pas l'amidon (pas de moût sucré). L'écran le dit quand le dernier
 * palier est retiré, ou quand aucun ne tombe dans la plage des amylases.
 *
 * Plage : 62–72 °C (β-amylase dès 55–65, α-amylase 66–72 ; Palmer, How to Brew, ch. 14, déjà citée par `bornesProcede.empatageTempC`).
 * Un palier de 0 min (simple montée, mash-out) ne convertit rien.
 */
import { nombreFr } from '../nombreAffiche';

/** TE-29 : « Palier 2 », jamais deux fois le même nom (un palier ajouté s'appelait « Palier »). */
export function nomPalierAjoute(paliers: ReadonlyArray<{ name?: string }>): string {
  const pris = new Set(paliers.map((p) => (p.name ?? '').trim().toLowerCase()));
  let n = paliers.length + 1;
  while (pris.has(`palier ${n}`)) n += 1;
  return `Palier ${n}`;
}

export const SACCHARIFICATION_TEMP_C = { min: 62, max: 72 } as const;
export const SACCHARIFICATION_MIN_MIN = 15;

export function messageSansSaccharification(
  paliers: ReadonlyArray<{ tempC: number; durationMin: number }> | undefined,
  grainEmpateKg: number,
): string | null {
  if (!(Number.isFinite(grainEmpateKg) && grainEmpateKg > 0)) return null;
  const ok = (paliers ?? []).some((p) =>
    Number.isFinite(p.tempC) && Number.isFinite(p.durationMin)
    && p.tempC >= SACCHARIFICATION_TEMP_C.min && p.tempC <= SACCHARIFICATION_TEMP_C.max && p.durationMin >= SACCHARIFICATION_MIN_MIN);
  if (ok) return null;
  return `Aucun palier de saccharification (${nombreFr(SACCHARIFICATION_TEMP_C.min, 0)}–${nombreFr(SACCHARIFICATION_TEMP_C.max, 0)} °C, ${nombreFr(SACCHARIFICATION_MIN_MIN, 0)} min au moins) : sans lui, l’amidon du grain ne se convertit pas. Ajoute un palier ou choisis un programme.`;
}
