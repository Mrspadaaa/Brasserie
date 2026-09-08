import { InlineNum } from "../FormNav";

import type { WaterWorkshopModel } from "./useWaterWorkshop";
type Tab = "empatage" | "rincage";

type Props = Pick<
  WaterWorkshopModel,
  | "beerVolumeL"
  | "brew"
  | "onMashRatioChange"
  | "state"
  | "onChange"
  | "onNoSpargeChange"
  | "set"
  | "style"
  | "mashRatioLPerKg"
  | "vol"
  | "hasSparge"
>;
export function WaterVolumes({
  beerVolumeL,
  brew,
  onMashRatioChange,
  state,
  onChange,
  onNoSpargeChange,
  set,
  style,
  mashRatioLPerKg,
  vol,
  hasSparge,
}: Props) {
  return (
    <>
      {" "}
      <div className="panel p-3 bg-cave-900/60 border border-cave-700 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-cave-800/80">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              role="switch"
              aria-checked={hasSparge}
              aria-label={`Eau de rinçage — ${hasSparge ? "utilisée" : "aucune"}`}
              onClick={() => onNoSpargeChange(hasSparge)}
              className="shrink-0 p-2 -m-2 rounded-full"
            >
              <span
                className={`block w-10 h-6 rounded-full relative transition-colors ${
                  hasSparge ? "bg-hop" : "bg-cave-700"
                }`}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-cave-50 transition-all"
                  style={{ left: hasSparge ? 18 : 2 }}
                />
              </span>
            </button>

            <span className="text-xs sm:text-sm font-semibold text-cave-50">
              {hasSparge
                ? "Eau de rinçage"
                : "Sans rinçage — tout à l’empâtage"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <InlineNum
            label="Empâtage"
            name="Volume d’eau d’empâtage, en litres"
            unit="L"
            min={0}
            value={state.mashWaterL}
            onValue={(v) => set({ mashWaterL: v })}
          />
          {hasSparge && (
            <InlineNum
              label="Rinçage"
              name="Volume d’eau de rinçage, en litres"
              unit="L"
              min={0}
              value={state.spargeWaterL}
              onValue={(v) => set({ spargeWaterL: v })}
            />
          )}
        </div>

        {hasSparge && (brew?.totalGristKg ?? 0) <= 0 && (
          <p className="text-2xs text-ebc-amber leading-snug">
            Aucun grain saisi : le partage empâtage / rinçage ne veut encore
            rien dire. Il se recalculera dès que la facture de grain sera posée.
          </p>
        )}

        {vol && vol.preBoilVolumeL > 0 && (
          <div className="rounded-control bg-cave-950/70 border border-cave-800 p-2.5 space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xs sm:text-sm text-cave-400">
                Moût à collecter avant ébullition
              </span>
              <span className="reading text-sm sm:text-base font-bold text-cave-50 shrink-0">
                {vol.preBoilVolumeL} L
              </span>
            </div>

            <p className="text-2xs text-cave-400 leading-snug">
              {beerVolumeL} L en cuve
              {vol.boilOffL > 0 && <> + {vol.boilOffL} évaporés</>}
              {vol.hopLossL > 0 && <> + {vol.hopLossL} au houblon</>}
              {vol.grainAbsorptionL > 0 && (
                <> + {vol.grainAbsorptionL} aux drêches</>
              )}{" "}
              + fond de cuve.
            </p>
          </div>
        )}

        {onMashRatioChange && hasSparge && (brew?.totalGristKg ?? 0) > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <label
                htmlFor="w-mash-ratio"
                className="text-2xs sm:text-sm text-cave-200"
              >
                Épaisseur de maische
              </label>
              <span className="reading text-sm text-cave-50 shrink-0">
                {mashRatioLPerKg.toFixed(1)}
                <span className="reading-unit"> L/kg</span>
              </span>
            </div>
            <input
              id="w-mash-ratio"
              name="water_mash_ratio_range"
              type="range"
              autoComplete="off"
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
              min={2.5}
              max={6}
              step={0.1}
              value={Math.min(6, Math.max(2.5, mashRatioLPerKg || 4.2))}
              onChange={(e) => onMashRatioChange(parseFloat(e.target.value))}
              className="w-full h-11 cursor-pointer appearance-none bg-transparent focus:outline-none
                           [&::-webkit-slider-runnable-track]:h-1.5
                           [&::-webkit-slider-runnable-track]:rounded-full
                           [&::-webkit-slider-runnable-track]:bg-cave-800
                           [&::-webkit-slider-thumb]:appearance-none
                           [&::-webkit-slider-thumb]:w-7
                           [&::-webkit-slider-thumb]:h-7
                           [&::-webkit-slider-thumb]:-mt-2.5
                           [&::-webkit-slider-thumb]:rounded-full
                           [&::-webkit-slider-thumb]:bg-ebc-straw
                           [&::-webkit-slider-thumb]:border-2
                           [&::-webkit-slider-thumb]:border-cave-950
                           [&::-moz-range-track]:h-1.5
                           [&::-moz-range-track]:rounded-full
                           [&::-moz-range-track]:bg-cave-800
                           [&::-moz-range-thumb]:w-7
                           [&::-moz-range-thumb]:h-7
                           [&::-moz-range-thumb]:rounded-full
                           [&::-moz-range-thumb]:bg-ebc-straw
                           [&::-moz-range-thumb]:border-2
                           [&::-moz-range-thumb]:border-cave-950"
            />

            <p className="text-2xs text-cave-400 leading-snug">
              En monocuve, 4 à 4.5 L/kg.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
