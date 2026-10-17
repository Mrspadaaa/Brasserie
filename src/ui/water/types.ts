import { WaterSource, SaltId, AcidId, WaterPlan, WaterIons } from "../../types";

export interface CustomTarget {
  name: string;
  ions: Partial<WaterIons>;
}

export interface WaterState {
  roLimitL?: number;
  autoTreatment?: boolean;
  saltOverrides?: WaterPlan["saltOverrides"];

  diRatioPct: number;

  spargeDiRatioPct?: number;

  allSaltsInMash?: boolean;

  styleCode: string;

  customTarget?: CustomTarget;
  doses: Partial<Record<SaltId, number>>;

  saltSplit?: {
    mash: Partial<Record<SaltId, number>>;
    sparge: Partial<Record<SaltId, number>>;
  };
  disabled: SaltId[];
  acidId: AcidId;
  mashWaterL: number;
  spargeWaterL: number;

  ratioOverride?: number;

  acidOverride?: { mash?: number; sparge?: number };

  mashPh?: number;
  spargePh?: number;
}

export interface WaterBrewContext {
  style?: string;
  styleRef?: import('../../../functions/src/brewingStyleSchema').BrewingStyleRef;
  nolo?: import('../../../functions/src/noloSchema').NoloConfig;
  /** Mash pH setpoint for measurement; the automatic dose targets alkalinity. */
  targetPh?: number;

  grist?: Array<{
    name?: string;
    weightKg?: number;
    kind?: string;
    use?: string;
    colorEbc?: number;
  }>;
  totalGristKg?: number;

  hops?: Array<{ weightG?: number; stage?: string; timeMin?: number }>;
  ibu?: number | null;
  og?: number | null;

  volumes?: {
    preBoilVolumeL: number;
    preBoilHotL?: number;
    grainAbsorptionL: number;
    boilOffL: number;
    hopLossL: number;
    mashRatioLPerKg: number;
  };
  equipment?: import('../../types').BrewingEquipment;
  preferences?: import('../../types/brewSystem').BrewingPreferences;
  boilMin?: number;
}

/**
 * Why a water change was emitted. `profile-choice`: the brewer committed a target (listed profile or numeric
 * target), which is a choice even when the committed value equals the displayed one. Other edits carry no intent.
 */
export type WaterChangeIntent = 'profile-choice';

export interface SaltSolverProps {
  source: WaterSource;
  onSourceChange: (source: WaterSource) => void;

  beerEbc: number | null;

  beerVolumeL: number;
  brew?: WaterBrewContext;

  onMashRatioChange?: (lPerKg: number) => void;
  state: WaterState;
  onChange: (next: WaterState, intent?: WaterChangeIntent) => void;
  /** How the recipe holds its target profile, when the host knows it: followed from the beer style, chosen, or kept without provenance. */
  profileMode?: 'style' | 'choice' | 'legacy';

  noSparge: boolean;
  onNoSpargeChange: (next: boolean) => void;
}
