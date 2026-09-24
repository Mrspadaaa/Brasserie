import { InlineNum } from "../FormNav";
import { NumberInput } from '../NumberInput';
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
  const litres = (n: number) => Number.isFinite(n) ? n.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) : '—';
  const grainKg = brew?.totalGristKg ?? 0;
  const moreSparge = hasSparge && grainKg > 0 && state.spargeWaterL > state.mashWaterL;
  const check = equipmentCheck(brew?.equipment, {
    volumeL: beerVolumeL,
    grainKg,
    mashL: state.mashWaterL,
    spargeL: hasSparge ? state.spargeWaterL : 0,
    preBoilHotL: vol?.preBoilHotL,
    preferences: brew?.preferences,
  });
  const physicalRatio = brew?.equipment && grainKg > 0 ? (brew.equipment.kettleWorkingL-grainKg*brew.equipment.grainDisplacementLPerKg)/1.03/grainKg : 6;
  const ratioMax = Math.max(6,Number.isFinite(physicalRatio)?physicalRatio:6,Number.isFinite(mashRatioLPerKg)?mashRatioLPerKg:6);
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
            id="wz-mash-water"
            emptyValue={Number.NaN}
            required
            aria-invalid={!Number.isFinite(state.mashWaterL)}
            label="Empâtage"
            name="Volume d’eau d’empâtage, en litres"
            unit="L"
            min={0}
            value={state.mashWaterL}
            onValue={(v) => set({ mashWaterL: v })}
          />
          {hasSparge && (
            <InlineNum
              id="wz-sparge-water"
              emptyValue={Number.NaN}
              required
              aria-invalid={!Number.isFinite(state.spargeWaterL)}
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
            {check && hasSparge && (
              <p className="text-cave-200" role="status">
                <strong>Rinçage à chaud : {litres(check.spargeHotL)} L.</strong>{' '}
                {litres(check.spargeMainHotL)} L dans le récipient principal{check.spargeAuxiliaryHotL > .01 ? ` + ${litres(check.spargeAuxiliaryHotL)} L avec la bouilloire annexe` : ''}.
              </p>
            )}
            {check?.spargeTooMuch && <p role="alert" className="text-ebc-amber">Au-dessus des {check.spargeMaximumHotL} L exceptionnels à chaud. Augmente l’eau d’empâtage si la cuve le permet, ou réduis le brassin.</p>}
            {check?.spargeStatus === 'exception' && <p className="text-ebc-amber">Rinçage exceptionnel : confirme la bouilloire annexe dans les choix de cette recette.</p>}
            {check?.mashTooFull && (
              <p role="alert" className="text-cave-50">
                <strong>Empâtage trop volumineux.</strong> Avec le grain, environ {litres(check.occupiedL)} L à chaud pour {litres(brew!.equipment!.kettleWorkingL)} L utiles. {hasSparge ? 'Reporte une partie de l’eau au rinçage ou réduis le volume du brassin.' : 'Prévois un rinçage ou réduis le volume du brassin.'}
              </p>
            )}
            <details>
              <summary className="min-h-touch flex items-center gap-2 cursor-pointer text-cave-50 underline underline-offset-4 rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-water">
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
                {check && check.spargeAuxiliaryHotL > .01 && <p>
                  Répartis l’eau osmosée, les sels et l’acide proportionnellement entre le récipient principal et la bouilloire annexe ; contrôle les températures avant de rincer. Le complément calculé n’est pas une capacité supposée de la bouilloire.
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
              <span className="reading text-sm text-cave-50 flex items-center gap-1 shrink-0">
                <NumberInput aria-label="Rapport eau grain exact en litres par kilogramme" value={Number(mashRatioLPerKg.toPrecision(15))} onValue={onMashRatioChange} min={0.1} className="w-16 min-h-touch-lg rounded-control border border-cave-600 bg-cave-950 px-1 text-base"/>
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
              max={ratioMax}
              step={0.1}
              value={Math.max(2.5, Number.isFinite(mashRatioLPerKg) ? mashRatioLPerKg : 4.2)}
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
            {mashRatioLPerKg > 8 && <p className="text-xs text-ebc-amber">Au-delà de 8 L/kg, l’estimation de pH sort de son domaine. Mesure le pH ; aucun résultat chiffré fiable n’est déduit de ce ratio.</p>}
          </div>
        )}
      </div>
    </>
  );
}
