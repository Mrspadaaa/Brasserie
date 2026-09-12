import { useId, useRef } from "react";
import { formatDecimal } from "../numericInput";
import { formatWaterMessage } from "../waterReadings";

import { ACIDS, MASH_PH_BAND } from "../../domain/water";

import type { WaterWorkshopModel } from "./useWaterWorkshop";
type Tab = "empatage" | "rincage";

type Props = Pick<
  WaterWorkshopModel,
  | "state"
  | "setTab"
  | "raBand"
  | "alkaliGoal"
  | "treatment"
  | "achievedSparge"
  | "ra"
  | "phEstimate"
  | "spargeAcidCalcule"
  | "mashAcid"
  | "spargeAcid"
  | "raApresAcide"
  | "placeAcide"
  | "spargeAlkalinity"
  | "hasSparge"
  | "activeTab"
>;
export function WaterAcidity({
  state,
  setTab,
  raBand,
  alkaliGoal,
  treatment,
  achievedSparge,
  ra,
  phEstimate,
  spargeAcidCalcule,
  mashAcid,
  spargeAcid,
  raApresAcide,
  placeAcide,
  spargeAlkalinity,
  hasSparge,
  activeTab,
}: Props) {
  const id = useId();
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  const tabs: Tab[] = hasSparge ? ["empatage", "rincage"] : ["empatage"];
  return (
    <>
      {" "}
      <div className="space-y-2">
        <div
          role="tablist"
          aria-label="Eau traitée"
          className="flex border-b border-cave-800"
        >
          {tabs.map(
            (t, index) => (
              <button
                key={t}
                ref={node => { tabRefs.current[t] = node; }}
                type="button"
                role="tab"
                id={`${id}-tab-${t}`}
                aria-controls={`${id}-panel-${t}`}
                aria-selected={activeTab === t}
                tabIndex={activeTab === t ? 0 : -1}
                onClick={() => setTab(t)}
                onKeyDown={event => {
                  if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
                  event.preventDefault();
                  const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 :
                    (index + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
                  const next = tabs[nextIndex];
                  setTab(next);
                  tabRefs.current[next]?.focus();
                }}
                className={`flex-1 py-2 text-sm sm:text-base font-semibold transition-colors border-b-2 -mb-px ${
                  activeTab === t
                    ? "text-cave-50 border-ebc-straw"
                    : "text-cave-400 border-transparent hover:text-cave-200"
                }`}
              >
                {t === "empatage" ? "Empâtage" : "Rinçage"}
              </button>
            ),
          )}
        </div>

          <div
            role="tabpanel"
            id={`${id}-panel-empatage`}
            aria-labelledby={`${id}-tab-empatage`}
            tabIndex={0}
            hidden={activeTab !== "empatage"}
            className="panel p-2.5 sm:p-3 space-y-1"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs sm:text-sm text-cave-400">
                {alkaliGoal.limitedByGrist
                  ? `Alcalinité résiduelle — repère pour les malts ≈ ${formatDecimal(alkaliGoal.target)} ppm (`
                  : `Alcalinité résiduelle — repère ${formatDecimal(raBand.min)} à ${formatDecimal(raBand.max)} ppm (`}
                {alkaliGoal.limitedByGrist
                  ? "estimation du mash"
                  : raBand.from === "facture"
                    ? "d’après ta facture"
                    : raBand.label}
                )
              </span>

              <span
                className={`reading text-base sm:text-lg font-bold shrink-0 ${
                  alkaliGoal.limitedByGrist
                    ? "text-cave-50"
                    : ra >= raBand.min && ra <= raBand.max
                      ? "text-hop"
                      : "text-ebc-amber"
                }`}
              >
                {Math.round(ra)}
              </span>
            </div>

            {Math.round(raApresAcide) !== Math.round(ra) && (
              <p className="text-2xs sm:text-sm leading-snug">
                <span className="text-cave-400">Après l’acide : </span>
                <span
                  className={`reading font-semibold ${
                    alkaliGoal.limitedByGrist
                      ? "text-cave-50"
                      : placeAcide === "juste"
                        ? "text-hop"
                        : "text-ebc-amber"
                  }`}
                >
                  {Math.round(raApresAcide)} ppm
                </span>
                <span className="text-cave-400">
                  {alkaliGoal.limitedByGrist
                    ? " — effet inclus dans l’estimation du pH ci-dessous."
                    : placeAcide === "juste"
                      ? " — dans le repère des malts."
                      : placeAcide === "haut"
                        ? " — au-dessus du repère des malts ; vérifier le pH au brassage."
                        : " — sous le repère des malts ; vérifier le pH au brassage."}
                </span>
              </p>
            )}

            {phEstimate.known ? (
              <>
                <div className="flex items-baseline justify-between gap-3 pt-1 border-t border-cave-800">
                  <span className="text-2xs sm:text-sm text-cave-400">
                    pH estimé — cible {formatDecimal(MASH_PH_BAND.min)}–{formatDecimal(MASH_PH_BAND.max)}
                  </span>
                  <span
                    className={`reading text-sm sm:text-base font-bold shrink-0 ${
                      phEstimate.position === 0 ? "text-hop" : "text-ebc-amber"
                    }`}
                  >
                    {phEstimate.phPredicted.toFixed(2).replace('.', ',')}
                    <span className="reading-unit">
                      {" "}
                      ±{formatDecimal(phEstimate.uncertainty)}
                    </span>
                  </span>
                </div>
                <p className="text-2xs sm:text-sm text-cave-400 leading-snug">
                  Facture de grain seule : {phEstimate.phDistilled.toFixed(2).replace('.', ',')}{" "}
                  en eau distillée
                  {phEstimate.acidulatedPct > 0 && (
                    <>
                      {" "}
                      · {formatDecimal(phEstimate.acidulatedPct)} % de malt acidulé, que la
                      couleur ne voit pas
                    </>
                  )}
                  . {formatWaterMessage(phEstimate.note)}
                </p>

                {raBand.from === "facture" && (
                  <p className="text-2xs sm:text-sm text-hop leading-snug">
                    {formatWaterMessage(raBand.hint)}
                  </p>
                )}
              </>
            ) : (
              <p className="text-2xs sm:text-sm text-cave-400 leading-snug">
                Le pH d’empâtage ne se prédit pas d’ici : renseigne la couleur
                EBC des malts. Sans elle, la couleur de la bière donne seulement
                un repère d’alcalinité.
              </p>
            )}

            <div className="flex items-baseline justify-between gap-3 pt-1 border-t border-cave-800">
              <span className="text-2xs sm:text-sm text-cave-400 min-w-0">
                {ACIDS[state.acidId].name} — à l’empâtage
              </span>
              {mashAcid.amount > 0 ? (
                <span className="reading text-sm sm:text-base font-bold text-ebc-straw shrink-0">
                  {formatDecimal(mashAcid.amount)}
                  <span className="reading-unit"> {mashAcid.unit}</span>
                </span>
              ) : (
                <span className="text-2xs sm:text-sm text-hop shrink-0">
                  rien à corriger
                </span>
              )}
            </div>

            {!hasSparge && (
              <p className="text-2xs sm:text-sm text-cave-400 leading-snug">
                Aucun rinçage : toute l’eau passe par la maische, et tous les
                sels avec elle.
              </p>
            )}
          </div>
        {hasSparge && (
          <div
            role="tabpanel"
            id={`${id}-panel-rincage`}
            aria-labelledby={`${id}-tab-rincage`}
            tabIndex={0}
            hidden={activeTab !== "rincage"}
            className="panel p-2.5 sm:p-3 space-y-1.5"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs sm:text-sm text-cave-400">
                Alcalinité restante après acide
              </span>
              <span
                className={`reading text-base sm:text-lg font-bold shrink-0 ${
                  spargeAlkalinity <= 25 ? "text-hop" : "text-cave-50"
                }`}
              >
                {formatDecimal(spargeAlkalinity)}{" "}
                <span className="reading-unit text-2xs">ppm CaCO₃</span>
              </span>
            </div>
            <p className="text-2xs sm:text-sm text-cave-400 leading-snug">
              HCO₃ : {formatDecimal(Math.round(achievedSparge.hco3 * 10) / 10)}{" "}
              →{" "}
              {formatDecimal(
                Math.round(treatment.treated.sparge.hco3 * 10) / 10,
              )}{" "}
              ppm. Cible pH {formatDecimal(spargeAcid.targetPh)}, à vérifier au pH-mètre.
            </p>
            {spargeAcid.amount > 0 ? (
              <p className="text-2xs sm:text-sm text-cave-200 leading-snug">
                Avec{" "}
                <span className="reading text-water font-semibold">
                  {formatDecimal(spargeAcid.amount)} {spargeAcid.unit}
                </span>{" "}
                d’{ACIDS[state.acidId].name.charAt(0).toLowerCase()}
                {ACIDS[state.acidId].name.slice(1)} dans{" "}
                {formatDecimal(state.spargeWaterL)} L de rinçage.
              </p>
            ) : spargeAcidCalcule.amount > 0 ? (
              <p className="text-2xs sm:text-sm text-ebc-straw leading-snug">
                Dose retenue : 0 {spargeAcid.unit}. L’alcalinité reste à traiter
                ; le calcul propose {formatDecimal(spargeAcidCalcule.amount)}{" "}
                {spargeAcid.unit}.
              </p>
            ) : achievedSparge.hco3 > 0 ? (
              <p className="text-2xs sm:text-sm text-cave-200 leading-snug">
                {formatWaterMessage(spargeAcid.warning ??
                  "Dose calculée nulle : vérifier le pH de cette eau avant tout ajout.")}
              </p>
            ) : (
              <p className="text-2xs sm:text-sm text-hop leading-snug">
                Rien à acidifier : cette eau n’a plus d’alcalinité à
                neutraliser.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
