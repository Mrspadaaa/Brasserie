import { InlineNum } from "../FormNav";
import { equipmentCheck, r1 } from "../../domain/brewEquipment";

import type { WaterWorkshopModel } from "./useWaterWorkshop";
type Props = Pick<
  WaterWorkshopModel,
  | "beerVolumeL"
  | "brew"
  | "onMashRatioChange"
  | "state"
  | "onNoSpargeChange"
  | "set"
  | "mashRatioLPerKg"
  | "vol"
  | "hasSparge"
>;
export function WaterVolumes({
  beerVolumeL,
  brew,
  onMashRatioChange,
  state,
  onNoSpargeChange,
  set,
  mashRatioLPerKg,
  vol,
  hasSparge,
}: Props) {
  const litres = (n: number) => n.toLocaleString('fr-CH', { maximumFractionDigits: 1 });
  const grainKg = brew?.totalGristKg ?? 0;
  const moreSparge = hasSparge && grainKg > 0 && state.spargeWaterL > state.mashWaterL;
  const check = equipmentCheck(brew?.equipment, {
    volumeL: beerVolumeL,
    grainKg,
    mashL: state.mashWaterL,
    spargeL: hasSparge ? state.spargeWaterL : 0,
    preBoilHotL: vol?.preBoilHotL,
  });
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

            <span className="text-sm font-semibold text-cave-50">
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
          <div className="border-t border-cave-800 pt-3 space-y-2 text-sm">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-cave-200">Eau à préparer · à froid</span>
              <span className="reading font-bold text-cave-50 shrink-0">
                {litres(r1(state.mashWaterL + state.spargeWaterL))} L
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-cave-400">Moût avant ébullition · à froid</span>
              <span className="reading text-cave-50 shrink-0">{litres(vol.preBoilVolumeL)} L</span>
            </div>
            {check && check.spargeLoads > 1 && (
              <p className="text-cave-200" role="status">
                <strong>Rinçage : {check.spargeLoads} chauffes.</strong>{' '}
                {check.loads.map(litres).join(' + ')} L à froid pour le réservoir de {litres(brew!.equipment!.spargeCapacityL)} L.
              </p>
            )}
            {check?.mashTooFull && (
              <p role="alert" className="text-cave-50">
                <strong>Empâtage trop volumineux.</strong> Avec le grain, environ {litres(check.occupiedL)} L à chaud pour {litres(brew!.equipment!.kettleWorkingL)} L utiles. {hasSparge ? 'Reporte une partie de l’eau au rinçage ou réduis le volume du brassin.' : 'Prévois un rinçage ou réduis le volume du brassin.'}
              </p>
            )}
            <details>
              <summary className="min-h-11 flex items-center gap-2 cursor-pointer text-cave-50 underline underline-offset-4 rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-water">
                {moreSparge ? 'Pourquoi plus d’eau au rinçage ?' : 'Comprendre les volumes'}
              </summary>
              <div className="space-y-2 pb-2 text-cave-200 leading-relaxed">
                <p>
                  Pour collecter {litres(vol.preBoilVolumeL)} L de moût, il faut environ {litres(r1(vol.preBoilVolumeL + vol.grainAbsorptionL))} L d’eau : {litres(vol.grainAbsorptionL)} L restent dans les drêches.
                </p>
                {moreSparge && <p>
                  Avec {litres(grainKg)} kg de grain et {litres(mashRatioLPerKg)} L/kg, l’empâtage utilise {litres(state.mashWaterL)} L. Le rinçage complète la collecte ; il peut dépasser l’empâtage avec peu de grain ou une longue ébullition.
                </p>}
                <p>
                  {brew?.boilMin != null ? `Ébullition de ${litres(brew.boilMin)} min` : 'Ébullition'} : {litres(vol.boilOffL)} L évaporés, en équivalent à froid. La collecte prévoit aussi les pertes pour atteindre {litres(beerVolumeL)} L en fermenteur.
                  {vol.preBoilHotL != null && <> À ébullition, les {litres(vol.preBoilVolumeL)} L occupent environ {litres(vol.preBoilHotL)} L.</>}
                </p>
                {check && check.spargeLoads > 1 && <p>
                  Maximum {litres(check.spargeFillL)} L à froid par chauffe, dilatation réservée. Répartis l’eau osmosée, les sels et l’acide proportionnellement entre les charges ; contrôle leur température avant de rincer.
                </p>}
              </div>
            </details>
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

            <p className="text-sm text-cave-400 leading-snug">
              Plus d’eau à l’empâtage réduit le rinçage, à volume total calculé identique. Après un changement, vérifie les doses de sels et d’acide.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
