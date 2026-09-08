import { NumberInput } from "../NumberInput";
import { formatDecimal } from "../numericInput";

import { DilutionField } from "../DilutionField";

import { Link2, Link2Off, Droplets } from "lucide-react";

import type { WaterWorkshopModel } from "./useWaterWorkshop";
type Tab = "empatage" | "rincage";

type Props = Pick<
  WaterWorkshopModel,
  | "state"
  | "onChange"
  | "set"
  | "totalWaterL"
  | "spargeDi"
  | "spargeLinked"
  | "justEnough"
  | "hasSparge"
  | "totalOsmoseeL"
  | "totalReseauL"
>;
export function WaterDilution({
  state,
  onChange,
  set,
  totalWaterL,
  spargeDi,
  spargeLinked,
  justEnough,
  hasSparge,
  totalOsmoseeL,
  totalReseauL,
}: Props) {
  return (
    <>
      {" "}
      <div className="panel p-3 bg-cave-900/60 border border-cave-700 space-y-3">
        <h3 className="text-xs font-semibold text-cave-200 flex items-center gap-1.5">
          <Droplets className="w-3.5 h-3.5 text-water shrink-0" />
          Coupe à l’osmosée
        </h3>
        <details className="rounded-control border border-water/25 bg-water/5 px-3 py-1">
          <summary className="min-h-11 flex items-center cursor-pointer text-sm text-water">
            {state.roLimitL != null
              ? `Osmosée : ${formatDecimal(state.roLimitL)} L disponibles`
              : "Disponibilité & recalcul automatique"}
          </summary>
          <div className="space-y-3 py-2 text-sm">
            <label className="block text-cave-200">
              Osmosée disponible au total (L)
              <NumberInput
                aria-label="Osmosée disponible au total (L)"
                value={state.roLimitL}
                min={0}
                max={1000}
                emptyValue={undefined}
                placeholder="Sans limite"
                className="mt-1 w-full min-h-11 rounded-control bg-cave-900 border border-cave-700 px-3 text-base"
                onValue={(value) =>
                  set({
                    roLimitL:
                      value == null
                        ? undefined
                        : Math.max(0, Math.min(1000, value)),
                    autoTreatment: true,
                  })
                }
              />
            </label>
            <p className="text-cave-400">
              Empâtage et rinçage réunis. Le reste vient du réseau, les volumes
              de brassage sont conservés.
            </p>
            <label className="min-h-11 flex items-center gap-3 text-cave-200">
              <input
                type="checkbox"
                aria-label="Sels et acides suivent la recette"
                className="w-5 h-5 accent-water"
                checked={state.autoTreatment === true}
                onChange={(e) => set({ autoTreatment: e.target.checked })}
              />
              Sels et acides suivent la recette
            </label>
            {(state.saltOverrides || state.acidOverride) && (
              <button
                type="button"
                className="min-h-11 text-water underline"
                onClick={() =>
                  set({
                    saltOverrides: undefined,
                    acidOverride: undefined,
                    autoTreatment: true,
                  })
                }
              >
                Recalculer aussi les doses manuelles
              </button>
            )}
            <p className="text-cave-400">
              Les doses modifiées à la main restent prioritaires. Préparation de
              la recette uniquement.
            </p>
          </div>
        </details>

        <button
          type="button"
          onClick={() =>
            set({ diRatioPct: justEnough.pct, spargeDiRatioPct: undefined })
          }
          disabled={
            totalWaterL <= 0 ||
            !justEnough.feasible ||
            (state.roLimitL != null &&
              (totalWaterL * justEnough.pct) / 100 > state.roLimitL)
          }
          className="w-full text-2xs flex items-center gap-1.5 py-1.5 px-2 rounded-control bg-cave-800 border border-cave-700 hover:border-water transition-colors disabled:opacity-50"
        >
          <Droplets className="w-3.5 h-3.5 text-water shrink-0" />
          <span className="min-w-0 flex-1 text-left truncate text-cave-200">
            Juste ce qu’il faut d’osmosée
          </span>
          <span className="shrink-0 reading font-semibold text-water">
            {justEnough.pct} %
          </span>
        </button>
        {state.roLimitL != null &&
          (totalWaterL * justEnough.pct) / 100 > state.roLimitL && (
            <p className="text-xs text-water">
              Ce repère demanderait{" "}
              {formatDecimal(
                Math.round((totalWaterL * justEnough.pct) / 10) / 10,
              )}{" "}
              L d’osmosée. Ton plan reste limité à{" "}
              {formatDecimal(state.roLimitL)} L ; les écarts du profil restent
              visibles.
            </p>
          )}
        {totalWaterL > 0 && !justEnough.feasible && (
          <p className="text-sm text-ebc-straw">
            {justEnough.reasons.join(" ; ")}
          </p>
        )}
        {totalWaterL > 0 && justEnough.feasible && (
          <p className="text-2xs text-cave-400 leading-snug">
            {justEnough.pct === 0 ? (
              "Le réseau suffit tel quel : aucun ion ne dépasse le style, l’acide reste sous son seuil."
            ) : state.diRatioPct > justEnough.pct ? (
              <>
                Coupe en place {Number(state.diRatioPct.toFixed(2))} %, minimum{" "}
                {justEnough.pct} % — descendre plus bas buterait sur :{" "}
                {justEnough.reasons.join(" ; ")}.
              </>
            ) : state.diRatioPct === justEnough.pct ? (
              <>
                C’est le minimum : en dessous, {justEnough.reasons.join(" ; ")}.
              </>
            ) : (
              <>
                Sous le minimum de {justEnough.pct} % —{" "}
                {justEnough.reasons.join(" ; ")}.
              </>
            )}
          </p>
        )}

        <DilutionField
          label={hasSparge ? "Osmosée — empâtage" : "Part d’eau osmosée"}
          value={state.diRatioPct}
          onChange={(v) => set({ diRatioPct: v })}
          volumeL={hasSparge ? state.mashWaterL : totalWaterL}
        />

        {hasSparge && (
          <div className="pt-2 border-t border-cave-800 space-y-1.5">
            <button
              type="button"
              onClick={() =>
                set({
                  spargeDiRatioPct: spargeLinked ? state.diRatioPct : undefined,
                })
              }
              className="w-full text-2xs text-cave-200 hover:text-cave-50 flex items-center gap-1.5 py-1 px-2 rounded-control bg-cave-800 border border-cave-700 transition-colors"
            >
              {spargeLinked ? (
                <>
                  <Link2 className="w-3.5 h-3.5 text-hop shrink-0" />

                  <span className="min-w-0 flex-1 text-left truncate">
                    Rinçage identique · {state.spargeWaterL} L
                  </span>
                  <span className="shrink-0 text-cave-400">délier</span>
                </>
              ) : (
                <>
                  <Link2Off className="w-3.5 h-3.5 text-ebc-amber shrink-0" />
                  <span className="min-w-0 flex-1 text-left truncate">
                    Rinçage réglé à part
                  </span>
                  <span className="shrink-0 text-cave-400">
                    relier à {Number(state.diRatioPct.toFixed(2))} %
                  </span>
                </>
              )}
            </button>

            {!spargeLinked && (
              <DilutionField
                label="Osmosée — rinçage"
                value={spargeDi}
                onChange={(v) => set({ spargeDiRatioPct: v })}
                volumeL={state.spargeWaterL}
                hint="Très diluée à l’osmosée, l’eau de rinçage n’extrait pas de tanins."
              />
            )}
          </div>
        )}

        {totalWaterL > 0 && (
          <p className="pt-2 border-t border-cave-800 text-2xs text-cave-400 flex flex-wrap gap-x-2">
            <span>
              Osmosée{" "}
              <span className="reading text-water font-semibold">
                {totalOsmoseeL} L
              </span>
            </span>
            <span>·</span>
            <span>
              Réseau{" "}
              <span className="reading text-cave-200">{totalReseauL} L</span>
            </span>
            <span>·</span>
            <span>
              Total{" "}
              <span className="reading text-ebc-straw font-semibold">
                {totalWaterL} L
              </span>
            </span>
          </p>
        )}
      </div>
    </>
  );
}
