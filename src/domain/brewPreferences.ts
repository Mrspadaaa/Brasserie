import type { AppConfig, BrewhouseProfile } from '../types';
import type { BrewingPreferences } from '../types/brewSystem';
import { practicalEquipment, brewingPreferenceErrors as validatePreferences } from './brewEquipment';

export const personalBrewingPreferences: BrewingPreferences = {
  preferredMashRatioLPerKg: 4.2,
  preferredSpargeHotL: 18,
  maximumSpargeHotL: 24,
  increaseMashToLimitSparge: true,
  coolingMethod: 'immersion',
  regulatedCoolingAvailable: true
};

/** Read-time upgrade of this brewery's active installation, never of a recipe snapshot. */
export function currentInstallation(profile: BrewhouseProfile): BrewhouseProfile {
  if (profile.preferences) return profile;
  if (!profile.equipment && profile.id !== 'bh-30') return profile;
  return {
    ...profile,
    preferences: { ...personalBrewingPreferences },
    equipment: profile.equipment ?? { ...practicalEquipment }
  };
}

export function withCurrentInstallation(config: AppConfig): AppConfig {
  return { ...config, brewhouses: config.brewhouses.map(p => p.id === config.activeBrewhouseId ? currentInstallation(p) : p) };
}

export function brewingPreferenceErrors(profile: BrewhouseProfile): string[] {
  return validatePreferences(profile.preferences);
}

/**
 * Le rapport eau/grain du matériel que la recette garde en instantané (RL-11).
 *
 * ⚠️ Il vivait d'une reprise : à l'ouverture, `mashRatioOverride` reprend `mash.ratioLPerKg` de l'enregistrement précédent, un QUOTIENT
 * (eau d'empâtage / grain) calculé sur la masse de grain de ce moment-là. Ajouter 0,1 kg puis le retirer, avec deux enregistrements, laissait
 * l'instantané à 2,9655 (25,8 L / 8,7 kg) pendant que `mash.ratioLPerKg` revenait à 3 : une valeur dérivée d'une masse périmée.
 * - sans reprise à la main (`override` absent) : le réglage du matériel, tel quel, jamais le quotient arrondi de l'eau ;
 * - avec reprise : la valeur reprise si l'eau suit le rapport ; si la répartition est saisie (`volumesEdited`), le quotient de l'eau
 *   actuelle sur le grain actuel, c'est-à-dire la valeur même que la recette écrit dans `mash.ratioLPerKg`.
 */
export function snapshotMashRatio(rig: BrewhouseProfile, override: number | null, volumesEdited: boolean, mashWaterL: number, grainKg: number): BrewhouseProfile {
  if (!(typeof override === 'number' && override > 0)) return rig;
  const quotient = grainKg > 0 ? mashWaterL / grainKg : NaN;
  const ratio = volumesEdited && Number.isFinite(quotient) && quotient > 0 ? quotient : override;
  return { ...rig, mashRatioLPerKg: ratio,
    ...(rig.preferences ? { preferences: { ...rig.preferences, preferredMashRatioLPerKg: ratio } } : {}) };
}

export function snapshotBrewhouse(profile: BrewhouseProfile): BrewhouseProfile {
  const { calibrationHistory, ...frozen } = structuredClone(profile);
  return { ...frozen, ...(calibrationHistory?.length ? { calibrationEventIds: calibrationHistory.map(e=>e.id) } : {}) };
}
