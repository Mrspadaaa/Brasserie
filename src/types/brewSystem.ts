/** Physical preferences are distinct from measured system performance. Volumes here are hot. */
export interface BrewingPreferences {
  preferredMashRatioLPerKg: number;
  preferredSpargeHotL: number;
  maximumSpargeHotL: number;
  increaseMashToLimitSparge: boolean;
  coolingMethod?: 'immersion';
  regulatedCoolingAvailable?: boolean;
}

export interface RecipeInstallationChoice {
  fermenterHeadspacePct?: number;
  headspaceReason?: string;
  spargeExceptionAccepted?: boolean;
  /** User-selected split must be validated, never silently replaced. */
  manualWaterSplit?: boolean;
  /** Choix du brasseur (19.11) : quand le moût d'avant ébullition dépasse la cuve, ajouter l'eau qui dépasse pendant ou après l'ébullition. */
  kettleTopUp?: boolean;
  /** Cette eau, en litres froids, calculée par le plan d'eau ; comptée dans le volume final et la densité avant ébullition. */
  topUpL?: number;
}

export type SystemParameter = 'efficiencyPct' | 'boilOffLPerHour' | 'grainAbsorptionLPerKg' | 'heatingRateCPerMin';
export interface SystemCalibrationEvent {
  id: string;
  parameter: SystemParameter;
  previousValue: number;
  value: number;
  appliedAt: number;
  batchIds: string[];
  readingIds: string[];
  evidenceFingerprint: string;
  contextKey: string;
}

export type ThermalMethod = 'heating' | 'immersion' | 'chamber';
export interface BrewThermalSegment {
  id: string;
  stepId: string;
  method: ThermalMethod;
  startedAt: number;
  endedAt?: number;
  targetC: number;
  volumeL?: number;
  coolantC?: number;
  vesselRef?: string;
  note?: string;
}

export interface BrewThermalChoices {
  coolingMethod?: 'immersion' | 'chamber';
  pitchTargetC?: number;
  pitchingMode?: 'at-target' | 'chamber-before-pitch' | 'documented-warm';
  changedAt?: number;
  reason?: string;
  protocolSource?: string;
  protocolConditions?: string;
}
