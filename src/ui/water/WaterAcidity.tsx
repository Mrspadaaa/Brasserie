import { useId, useRef } from "react";
import { formatDecimal } from "../numericInput";
import { formatWaterMessage } from "../waterReadings";
import { Neuf } from "./Neuf";

import { ACIDS, MASH_PH_BAND, alkalinityAsCaCO3 } from "../../domain/water";
import { noloWaterModelIssue } from "../../domain/noloWaterModelIssue";

import type { WaterWorkshopModel } from "./useWaterWorkshop";
type Tab = "empatage" | "rincage";

type Props = Pick<
  WaterWorkshopModel,
  | "state"
  | "brew"
  | "mashRatioLPerKg"
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
  | "acideProfil"
  | "spargeAlkalinity"
  | "hasSparge"
  | "activeTab"
>;
const pct = (v: number, lo: number, hi: number) => Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100));

/** Jauge w1b : piste, fenêtre du repère (vert), point « avant l’acide » et point « après ». Décor : la valeur est lue dans la ligne au-dessus. */
function Jauge({ lo, hi, fenMin, fenMax, avant, apres, avantHors, apresHors, label }: {
  lo: number; hi: number; fenMin: number; fenMax: number; avant: number; apres: number;
  avantHors: boolean; apresHors: boolean; label: string;
}) {
  return (
    <div className="ew-jg" role="img" aria-label={label}>
      <b style={{ left: `${pct(fenMin, lo, hi)}%`, width: `${pct(fenMax, lo, hi) - pct(fenMin, lo, hi)}%` }} />
      <s style={{ left: `${pct(avant, lo, hi)}%`, background: avantHors ? "var(--ew-att)" : "var(--ew-hop)" }} />
      <s style={{ left: `${pct(apres, lo, hi)}%`, background: apresHors ? "var(--ew-att)" : "var(--ew-t0)" }} />
    </div>
  );
}

export function WaterAcidity({
  state,
  brew,
  mashRatioLPerKg,
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
  acideProfil,
  spargeAlkalinity,
  hasSparge,
  activeTab,
}: Props) {
  const id = useId();
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  const tabs: Tab[] = hasSparge ? ["empatage", "rincage"] : ["empatage"];
  if (phEstimate === null) {
    const issue = noloWaterModelIssue(brew?.nolo, mashRatioLPerKg);
    return <div role="status" aria-label="Acidification à mesurer" className="panel p-2.5 space-y-1 text-sm text-cave-200">
      <p className="text-ebc-amber">{issue ?? 'pH non estimable pour cet empâtage : mesurer ou titrer avant de doser l’acide.'}</p>
      <p>Empâtage · {state.acidOverride?.mash != null
        ? `dose manuelle retenue : ${formatDecimal(state.acidOverride.mash)} ${mashAcid.unit} ; pH à mesurer.`
        : 'dose d’acide non calculée ; mesurer ou titrer.'}</p>
      {hasSparge && <p>Rinçage · {state.acidOverride?.sparge != null
        ? `dose manuelle retenue : ${formatDecimal(state.acidOverride.sparge)} ${spargeAcid.unit} ; pH à contrôler.`
        : 'dose d’acide non calculée ; mesurer ou titrer.'}</p>}
    </div>;
  }
  return (
    <>
      {" "}
      <div className="space-y-2">
        <div
          role="tablist"
          aria-label="Eau traitée"
          className="ew-tabs"
          style={{ gridTemplateColumns: hasSparge ? "1fr 1fr" : "1fr" }}
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
            className="ew-ar"
          >
            <div className="ew-arr">
              <span>
                {alkaliGoal.limitedByGrist
                  ? `Alcalinité résiduelle — repère pour les malts ≈ ${formatDecimal(alkaliGoal.target)} ppm (`
                  : `Alcalinité résiduelle — repère ${formatDecimal(raBand.min)} à ${formatDecimal(raBand.max)} ppm (`}
                {alkaliGoal.limitedByGrist
                  ? "estimation de l’empâtage"
                  : raBand.from === "facture"
                    ? "d’après ta facture"
                    : raBand.label}
                )
              </span>

              <Neuf v={Math.round(ra)}
                className={
                  alkaliGoal.limitedByGrist
                    ? ""
                    : ra >= raBand.min && ra <= raBand.max
                      ? "ew-dans"
                      : "ew-hors"
                }
              >
                {Math.round(ra)}
              </Neuf>
            </div>

            {!alkaliGoal.limitedByGrist && (
              <Jauge
                lo={-150}
                hi={150}
                fenMin={raBand.min}
                fenMax={raBand.max}
                avant={ra}
                apres={raApresAcide}
                avantHors={ra < raBand.min || ra > raBand.max}
                apresHors={placeAcide !== "juste"}
                label={`Alcalinité résiduelle ${Math.round(ra)}, après l’acide ${Math.round(raApresAcide)}, repère ${formatDecimal(raBand.min)} à ${formatDecimal(raBand.max)} sur −150 à 150`}
              />
            )}

            {Math.round(raApresAcide) !== Math.round(ra) && (
              <>
                <div className="ew-arr">
                  <span>Après l’acide : </span>
                  <Neuf v={Math.round(raApresAcide)}
                    className={
                      alkaliGoal.limitedByGrist
                        ? ""
                        : placeAcide === "juste"
                          ? "ew-dans"
                          : "ew-hors"
                    }
                  >
                    {Math.round(raApresAcide)}
                  </Neuf>
                </div>
                <p className="ew-note">
                  {alkaliGoal.limitedByGrist
                    ? "— effet inclus dans l’estimation du pH ci-dessous."
                    : acideProfil
                      ? `— ${acideProfil}`
                    : placeAcide === "juste"
                      ? "— dans le repère des malts."
                      : placeAcide === "haut"
                        ? "— au-dessus du repère des malts ; vérifier le pH au brassage."
                        : "— sous le repère des malts ; vérifier le pH au brassage."}
                </p>
              </>
            )}

            {phEstimate.known ? (
              <>
                <div className="ew-arr">
                  <span>
                    pH estimé — cible {formatDecimal(MASH_PH_BAND.min)}–{formatDecimal(MASH_PH_BAND.max)}
                  </span>
                  <span className="ew-v">
                    <Neuf v={phEstimate.phPredicted.toFixed(2)} className={phEstimate.position === 0 ? "ew-dans" : "ew-hors"}>
                      {phEstimate.phPredicted.toFixed(2).replace('.', ',')}
                    </Neuf>{" "}
                    <small>±{formatDecimal(phEstimate.uncertainty)}</small>
                  </span>
                </div>
                <p className="ew-note">
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
                  <p className="ew-note ew-dans">
                    {formatWaterMessage(raBand.hint)}
                  </p>
                )}
              </>
            ) : (
              <p className="ew-note">
                Le pH d’empâtage ne se prédit pas d’ici : renseigne la couleur
                EBC des malts. Sans elle, la couleur de la bière donne seulement
                un repère d’alcalinité.
              </p>
            )}

            <div className="ew-arr">
              <span>
                {ACIDS[state.acidId].name} — à l’empâtage
              </span>
              {mashAcid.amount > 0 ? (
                <span className="ew-v">
                  <Neuf v={mashAcid.amount}>{formatDecimal(mashAcid.amount)}</Neuf> <small>{mashAcid.unit}</small>
                </span>
              ) : (
                <span className="ew-dans">rien à corriger</span>
              )}
            </div>

            {!hasSparge && (
              <p className="ew-note">
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
            className="ew-ar"
          >
            <div className="ew-arr">
              <span>Alcalinité restante après acide</span>
              <span className="ew-v">
                <Neuf v={spargeAlkalinity} className={spargeAlkalinity <= 25 ? "ew-dans" : ""}>{formatDecimal(spargeAlkalinity)}</Neuf>{" "}
                <small>ppm CaCO₃</small>
              </span>
            </div>
            <Jauge
              lo={0}
              hi={200}
              fenMin={0}
              fenMax={25}
              avant={alkalinityAsCaCO3(achievedSparge.hco3)}
              apres={spargeAlkalinity}
              avantHors={alkalinityAsCaCO3(achievedSparge.hco3) > 25}
              apresHors={spargeAlkalinity > 25}
              label={`Alcalinité du rinçage ${Math.round(alkalinityAsCaCO3(achievedSparge.hco3))} avant l’acide, ${formatDecimal(spargeAlkalinity)} après, repère 0 à 25 sur 0 à 200 ppm CaCO₃`}
            />
            <div className="ew-arr">
              <span>HCO₃ · avant → après l’acide</span>
              <span className="ew-v">
                <b>{formatDecimal(Math.round(achievedSparge.hco3 * 10) / 10)}</b>
                {" "}→{" "}
                <b>{formatDecimal(Math.round(treatment.treated.sparge.hco3 * 10) / 10)}</b>{" "}
                <small>ppm</small>
              </span>
            </div>
            <div className="ew-arr">
              <span>Cible pH {formatDecimal(spargeAcid.targetPh)}, à vérifier au pH-mètre.</span>
            </div>
            {spargeAcid.amount > 0 ? (
              <p className="ew-note ew-n1">
                Avec{" "}
                <span className="reading text-water font-semibold">
                  {formatDecimal(spargeAcid.amount)} {spargeAcid.unit}
                </span>{" "}
                d’{ACIDS[state.acidId].name.charAt(0).toLowerCase()}
                {ACIDS[state.acidId].name.slice(1)} dans{" "}
                {formatDecimal(state.spargeWaterL)} L de rinçage.
              </p>
            ) : spargeAcidCalcule.amount > 0 ? (
              <p className="ew-note ew-nat">
                Dose retenue : 0 {spargeAcid.unit}. L’alcalinité reste à traiter
                ; le calcul propose {formatDecimal(spargeAcidCalcule.amount)}{" "}
                {spargeAcid.unit}.
              </p>
            ) : achievedSparge.hco3 > 0 ? (
              <p className="ew-note ew-n1">
                {formatWaterMessage(spargeAcid.warning ??
                  "Dose calculée nulle : vérifier le pH de cette eau avant tout ajout.")}
              </p>
            ) : (
              <p className="ew-note ew-dans">
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
