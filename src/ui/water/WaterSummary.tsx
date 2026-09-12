import { WaterAdditivesTable } from "../WaterAdditivesTable";
import { formatDecimal } from "../numericInput";

import { ChevronLeft } from "lucide-react";

import type { WaterWorkshopModel } from "./useWaterWorkshop";

type Props = Pick<
  WaterWorkshopModel,
  | "state"
  | "set"
  | "handleStepChange"
  | "totalWaterL"
  | "style"
  | "allSaltsInMash"
  | "split"
  | "mashAcid"
  | "spargeAcid"
  | "lactate"
  | "hasSparge"
>;
export function WaterSummary({
  state,
  set,
  handleStepChange,
  totalWaterL,
  style,
  allSaltsInMash,
  split,
  mashAcid,
  spargeAcid,
  lactate,
  hasSparge,
}: Props) {
  return (
    <>
      {" "}
      {hasSparge && (
        <div className="p-3 rounded-control bg-cave-900/80 border border-cave-700 flex flex-wrap items-start gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={allSaltsInMash}
            aria-label="Tous les sels à l’empâtage"
            onClick={() => set({ allSaltsInMash: !allSaltsInMash })}
            className="shrink-0 p-2 -m-2 mt-0 rounded-full"
          >
            <span
              className={`block w-10 h-6 rounded-full relative transition-colors ${
                allSaltsInMash ? "bg-hop" : "bg-cave-700"
              }`}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full bg-cave-50 transition-all"
                style={{ left: allSaltsInMash ? 18 : 2 }}
              />
            </span>
          </button>
          <div className="min-w-min flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-semibold text-cave-50">
                Tous les sels à l’empâtage
              </span>
              <span className="text-2xs text-hop bg-hop/15 px-1.5 py-0.5 rounded font-medium">
                Recommandé
              </span>
            </div>
            <span className="block text-2xs sm:text-sm text-cave-400 leading-snug mt-0.5">
              {allSaltsInMash
                ? "100 % des sels sont versés dans la cuve d’empâtage. L’eau de rinçage est ajustée uniquement à l’acide."
                : "Répartition proportionnelle des sels entre empâtage et rinçage."}
            </span>
          </div>
        </div>
      )}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-cave-200">
          Total des additifs nécessaires
        </h2>
        <WaterAdditivesTable
          doses={state.doses}
          split={split}
          acidId={state.acidId}
          mashAcid={mashAcid}
          spargeAcid={spargeAcid}
          totalWaterL={totalWaterL}
          hasSparge={hasSparge}
          allSaltsInMash={allSaltsInMash}
          spargeTargetPh={spargeAcid.targetPh}
        />

        <p className="text-2xs sm:text-sm text-cave-400 leading-snug px-1">
          Chaque dose se verse dans son eau. L’acide calculé à l’empâtage
          respecte le HCO₃ total du profil ; le rinçage vise pH {formatDecimal(spargeAcid.targetPh)}.
          {" "}Le pH d’empâtage reste à mesurer avant une correction.
          {lactate > 0 && state.acidId === "lactique" && (
            <> Dans la bière finie, cela fait {formatDecimal(lactate)} g/L d’acide lactique.</>
          )}
        </p>
      </section>
      <div className="sm:hidden pt-2">
        <button
          type="button"
          onClick={() => handleStepChange("eau")}
          className="w-full min-h-touch-sm py-2.5 px-3 rounded-control bg-cave-900 hover:bg-cave-850 text-cave-400 text-2xs flex items-center justify-center gap-1 border border-cave-800"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Revoir l’eau et les volumes</span>
        </button>
      </div>
    </>
  );
}
