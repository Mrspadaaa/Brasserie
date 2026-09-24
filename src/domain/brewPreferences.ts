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

export function snapshotBrewhouse(profile: BrewhouseProfile): BrewhouseProfile {
  const { calibrationHistory, ...frozen } = structuredClone(profile);
  return { ...frozen, ...(calibrationHistory?.length ? { calibrationEventIds: calibrationHistory.map(e=>e.id) } : {}) };
}
