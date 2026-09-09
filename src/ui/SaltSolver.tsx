import React from "react";
import { Droplets, Scale } from "lucide-react";
import { WaterTargetSheet } from "./WaterTargetSheet";
import type { SaltSolverProps } from "./water/types";
import { useWaterWorkshop } from "./water/useWaterWorkshop";
import { WaterPreparation } from "./water/WaterPreparation";
import { WaterWorkbench } from "./water/WaterWorkbench";
import { WaterFeedback } from "./water/WaterFeedback";
import { WaterSummary } from "./water/WaterSummary";
import "./water/workshop.css";
import { formatDecimal } from "./numericInput";
export type { WaterState, WaterBrewContext } from "./water/types";

/** Water workshop: navigation and composition only; domain and controls live separately. */
export const SaltSolver: React.FC<SaltSolverProps> = (props) => {
  const model = useWaterWorkshop(props);
  const {
    state,
    set,
    activeStep,
    targetOpen,
    setTargetOpen,
    handleStepChange,
    totalWaterL,
    totalDosesGrams,
  } = model;
  return (
    <div data-water-step={activeStep} className="water-workshop space-y-1 sm:space-y-6">
      <WaterTargetSheet
        open={targetOpen}
        onClose={() => setTargetOpen(false)}
        value={state.customTarget}
        onSave={(t) => set({ customTarget: t, ratioOverride: undefined })}
        onRemove={
          state.customTarget
            ? () => set({ customTarget: undefined, ratioOverride: undefined })
            : undefined
        }
      />

      <div data-water-navigation className="water-mobile-nav sm:hidden sticky top-0 z-20 bg-cave-950/95 backdrop-blur-md pt-0 pb-0.5 border-b border-cave-800">
        <div className="grid grid-cols-2 gap-1 p-0.5 bg-cave-900/90 rounded-control border border-cave-800">
          <button
            type="button"
            onClick={() => handleStepChange("eau")}
            aria-pressed={activeStep === "eau"}
            className={`h-11 px-2 rounded-control flex items-center justify-center gap-1.5 transition-all ${
              activeStep === "eau"
                ? "bg-cave-800 text-ebc-straw font-medium shadow-sm border border-cave-700/70"
                : "text-cave-400 hover:text-cave-200"
            }`}
          >
            <Droplets className="w-4 h-4 text-water shrink-0" />
            <span className="text-2xs font-semibold whitespace-nowrap">1. Eau</span>
            <span className="text-2xs text-cave-400 reading truncate">
              {formatDecimal(totalWaterL)} L
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleStepChange("sels")}
            aria-pressed={activeStep === "sels"}
            className={`h-11 px-2 rounded-control flex items-center justify-center gap-1.5 transition-all ${
              activeStep === "sels"
                ? "bg-cave-800 text-ebc-straw font-medium shadow-sm border border-cave-700/70"
                : "text-cave-400 hover:text-cave-200"
            }`}
          >
            <Scale className="w-4 h-4 text-hop shrink-0" />
            <span className="text-2xs font-semibold whitespace-nowrap">2. Sels</span>
            <span className="text-2xs text-cave-400 reading truncate">
              {formatDecimal(Math.round(totalDosesGrams*10)/10)} g
            </span>
          </button>
        </div>
      </div>

      <WaterPreparation {...model} />
      <div
        className={`space-y-2 sm:space-y-4 ${activeStep === "sels" ? "block" : "hidden sm:block"}`}
      >
        <div className="hidden sm:flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-cave-400 border-b border-cave-800 pb-1.5">
          <Scale className="w-4 h-4 text-hop" />
          <span>2 · Les sels — profil, balance SO₄ ⇄ Cl et pesée</span>
        </div>

        <WaterWorkbench {...model} />
        <WaterFeedback {...model} />
        <WaterSummary {...model} />
      </div>
    </div>
  );
};
