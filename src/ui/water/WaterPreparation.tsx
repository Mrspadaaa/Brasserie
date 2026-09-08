import { WaterAcidity } from "./WaterAcidity";
import { WaterDilution } from "./WaterDilution";
import { WaterVolumes } from "./WaterVolumes";

import { WaterAnalysisTable } from "../WaterAnalysisTable";

import { IonComparison } from "../IonComparison";

import { Droplets, ChevronRight } from "lucide-react";

import type { WaterWorkshopModel } from "./useWaterWorkshop";
type Tab = "empatage" | "rincage";

type Props = Pick<
  WaterWorkshopModel,
  | "source"
  | "onSourceChange"
  | "beerVolumeL"
  | "brew"
  | "onMashRatioChange"
  | "state"
  | "onChange"
  | "onNoSpargeChange"
  | "set"
  | "setTab"
  | "activeStep"
  | "handleStepChange"
  | "totalWaterL"
  | "style"
  | "start"
  | "spargeDi"
  | "spargeLinked"
  | "mashRatioLPerKg"
  | "vol"
  | "raBand"
  | "alkaliGoal"
  | "treatment"
  | "achievedSparge"
  | "ra"
  | "phEstimate"
  | "justEnough"
  | "spargeAcidCalcule"
  | "mashAcid"
  | "spargeAcid"
  | "raApresAcide"
  | "placeAcide"
  | "spargeAlkalinity"
  | "achievedTotalApresAcide"
  | "hasSparge"
  | "activeTab"
  | "totalOsmoseeL"
  | "totalReseauL"
>;
export function WaterPreparation(model: Props) {
  const {
    source,
    onSourceChange,
    beerVolumeL,
    brew,
    onMashRatioChange,
    state,
    onChange,
    onNoSpargeChange,
    set,
    setTab,
    activeStep,
    handleStepChange,
    totalWaterL,
    style,
    start,
    spargeDi,
    spargeLinked,
    mashRatioLPerKg,
    vol,
    raBand,
    alkaliGoal,
    treatment,
    achievedSparge,
    ra,
    phEstimate,
    justEnough,
    spargeAcidCalcule,
    mashAcid,
    spargeAcid,
    raApresAcide,
    placeAcide,
    spargeAlkalinity,
    achievedTotalApresAcide,
    hasSparge,
    activeTab,
    totalOsmoseeL,
    totalReseauL,
  } = model;
  return (
    <>
      {" "}
      <div
        className={`space-y-4 ${activeStep === "eau" ? "block" : "hidden sm:block"}`}
      >
        <div className="hidden sm:flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-cave-400 border-b border-cave-800 pb-1.5">
          <Droplets className="w-4 h-4 text-water" />
          <span>1 · L’eau — analyse, style et volumes</span>
        </div>

        <WaterAnalysisTable
          source={source}
          onChange={onSourceChange}
          display={{
            ions: start,
            caption:
              state.diRatioPct > 0
                ? `${source.name} · coupée à ${Number(state.diRatioPct.toFixed(2))} % d’osmosée`
                : source.name,
          }}
        />

        <IonComparison
          start={treatment.startTotal}
          achieved={achievedTotalApresAcide}
          style={style}
        />

        <WaterVolumes {...model} />
        <WaterDilution {...model} />
        <WaterAcidity {...model} />
        <div className="sm:hidden pt-2">
          <button
            type="button"
            onClick={() => handleStepChange("sels")}
            className="w-full min-h-touch py-3 px-4 rounded-control bg-cave-850 hover:bg-cave-800 text-cave-50 text-sm font-medium flex items-center justify-center gap-2 border border-cave-700 transition-colors shadow-sm"
          >
            <span>Profil & pesée des sels</span>
            <ChevronRight className="w-4 h-4 text-ebc-straw" />
          </button>
        </div>
      </div>
    </>
  );
}
