import { useState } from "react";
import { formatDecimal } from "../numericInput";
import { AcidId, SaltId, WaterIons } from "../../types";
import { SaltMineralDetails } from "../SaltMineralDetails";
import { Sheet } from "../Sheet";

import { SALTS, SALT_IDS, ACIDS } from "../../domain/water";
import { STYLE_WATERS } from "../../domain/waterStyles";

import { WaterRadar } from "../WaterRadar";
import { CycleTag } from "../CycleTag";
import { RatioSlider } from "../RatioSlider";

import { Combobox } from "../Combobox";

import { Sparkles, Target } from "lucide-react";

import type { WaterWorkshopModel } from "./useWaterWorkshop";
import { ACID_SHORT } from "./constants";
import { SaltDoseControl } from "./SaltDoseControl";
import { AcidDoseControl } from "./AcidDoseControl";
import { WaterTargetStatus } from "./WaterTargetStatus";
import { WaterDoseImpact } from "./WaterDoseImpact";
import { PRACTICAL_RATIO_TOLERANCE } from "../../domain/water/saltFit";
import { useWaterControlsLayout } from "./useWaterControlsLayout";
type Props = Pick<
  WaterWorkshopModel,
  | "state"
  | "onChange"
  | "set"
  | "setDose"
  | "setAcidDose"
  | "manualImpact"
  | "beginEdit"
  | "endEdit"
  | "activeSalt"
  | "setActiveSalt"
  | "setTargetOpen"
  | "workbenchRef"
  | "totalWaterL"
  | "style"
  | "start"
  | "treatment"
  | "raBand"
  | "beerEbc"
  | "phEstimate"
  | "brew"
  | "achievedTotal"
  | "ratio"
  | "wantedRatio"
  | "applyDoses"
  | "diagnoses"
  | "planApplied"
  | "rienAProposer"
  | "applyRatio"
  | "mashAcidCalcule"
  | "spargeAcidCalcule"
  | "mashAcid"
  | "spargeAcid"
  | "acideForce"
  | "achievedTotalApresAcide"
  | "hasSparge"
  | "ionsOf"
  | "toggleSalt"
>;
export function WaterWorkbench({
  state,
  onChange,
  set,
  setDose,
  setAcidDose,
  manualImpact,
  beginEdit,
  endEdit,
  activeSalt,
  setActiveSalt,
  setTargetOpen,
  workbenchRef,
  totalWaterL,
  style,
  start,
  treatment,
  raBand,
  beerEbc,
  phEstimate,
  brew,
  achievedTotal,
  ratio,
  wantedRatio,
  applyDoses,
  diagnoses,
  planApplied,
  rienAProposer,
  applyRatio,
  mashAcidCalcule,
  spargeAcidCalcule,
  mashAcid,
  spargeAcid,
  acideForce,
  achievedTotalApresAcide,
  hasSparge,
  ionsOf,
  toggleSalt,
}: Props) {
  const [detailsSalt, setDetailsSalt] = useState<SaltId | null>(null);
  const [acidProductChanged, setAcidProductChanged] = useState(false);
  const [showUnused,setShowUnused]=useState(false);
  return (
    <>
      {" "}
      <div
        ref={workbenchRef}
        data-water-controls
        className="water-controls space-y-1 sm:space-y-4"
        aria-label="Profil et commandes de dosage"
      >
        <div className="flex items-center gap-2 px-1">
          <label
            htmlFor="w-style"
            className="sr-only sm:not-sr-only text-2xs text-cave-400 shrink-0"
          >
            Cible
          </label>
          <div className="min-w-0 flex-1">
            {state.customTarget ? (
              <button
                type="button"
                onClick={() => setTargetOpen(true)}
                className="w-full min-h-touch-sm px-3 rounded-control border border-ebc-straw/50
                           bg-cave-900 text-left flex items-center gap-2"
              >
                <Target className="w-4 h-4 text-ebc-straw shrink-0" />
                <span className="text-2xs text-cave-50 truncate">
                  {style.name}
                </span>
                <span className="text-2xs text-cave-400 shrink-0 ml-auto">
                  modifier
                </span>
              </button>
            ) : (
              <Combobox
                id="w-style"
                value={style.code}
                onChange={(code) =>
                  set({ styleCode: code, ratioOverride: undefined })
                }
                options={STYLE_WATERS.map((s) => ({
                  value: s.code,
                  label: s.code === "—" ? s.name : `${s.code} — ${s.name}`,
                  detail: s.note,
                }))}
                placeholder="NEIPA, Pils, Imperial Stout…"
              />
            )}
          </div>

          {!state.customTarget && (
            <button
              type="button"
              onClick={() => setTargetOpen(true)}
              aria-label="Créer une cible d’eau chiffrée"
              title="La recette donne son eau en ppm ?"
              className="shrink-0 w-11 h-11 rounded-control border border-cave-700 text-cave-200
                         flex items-center justify-center hover:text-ebc-straw hover:border-cave-600"
            >
              <Target className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            aria-label="Proposer les doses"
            disabled={totalWaterL <= 0 || state.mashWaterL <= 0}
            onClick={applyDoses}
            className="shrink-0 h-11 px-2.5 rounded-control bg-ebc-straw text-cave-950 font-bold text-sm
                       flex items-center gap-1 hover:bg-ebc-amber active:scale-[0.98] transition-all shadow-sm
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-ebc-straw"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Doser
          </button>
        </div>

        <details><summary className="min-h-touch cursor-pointer text-sm text-water">Radar et équilibre sulfate / chlorure</summary><div className="panel p-3">
          <WaterRadar

            start={treatment.startTotal}
            achieved={achievedTotalApresAcide}
            style={style}
            highlight={
              activeSalt === "acide"
                ? (["hco3"] as Array<keyof WaterIons>)
                : activeSalt
                  ? ionsOf(activeSalt)
                  : undefined
            }
          />
        </div>

        <RatioSlider
          className="water-ratio-compact"
          value={wantedRatio}
          onChange={applyRatio}
          achieved={ratio.ratio}
          followingTarget={state.ratioOverride != null || planApplied}
          ions={achievedTotalApresAcide}
          target={
            !state.customTarget ||
            (state.customTarget.ions.so4 != null &&
              (state.customTarget.ions.cl ?? 0) > 0)
              ? style.ratio
              : undefined
          }
        />

        </details>
        <section className="space-y-1">
          <div className="sr-only sm:not-sr-only sm:flex items-center justify-between gap-2 sm:py-2 text-sm text-cave-200">
            <h3 className="font-semibold">Sels à peser</h3>
            <span className="text-2xs text-cave-400">
              {Object.values(state.doses).filter((g) => g > 0).length} utilisés
              sur {SALT_IDS.length}
            </span>
          </div>
          <ul aria-label="Sels à peser" className="water-salt-grid grid grid-cols-3 gap-1 sm:gap-2">
            {SALT_IDS.filter(id=>showUnused||(state.doses[id]??0)>0).map((id) => {
              const def = SALTS[id];
              const off = state.disabled.includes(id);
              const grams = state.doses[id] ?? 0;
              const active = activeSalt === id;
              return (
                <SaltDoseControl
                  key={id}
                  id={id}
                  def={def}
                  grams={grams}
                  off={off}
                  active={active}
                  ions={ionsOf(id)}
                  onEditStart={() => beginEdit({ kind: 'salt', id, from: grams, to: grams })}
                  onEditEnd={endEdit}
                  onDetails={setDetailsSalt}
                  onDose={(v) => setDose(id, v)}
                  onToggle={toggleSalt}
                  onActivate={setActiveSalt}
                />
              );
            })}
          </ul>
          <button type="button" className="min-h-touch text-xs text-water" aria-expanded={showUnused} onClick={()=>setShowUnused(v=>!v)}>{showUnused?"Masquer les sels inutilisés":"Sels autorisés et inutilisés"}</button>

          <div
            data-water-acids
            onPointerDown={() => setActiveSalt("acide")}
            onFocusCapture={() => setActiveSalt("acide")}
            className={`water-acid-controls rounded-control border p-1.5 sm:p-2.5 transition-colors ${
              activeSalt === "acide"
                ? "bg-cave-850 border-ebc-straw/60"
                : mashAcid.amount + spargeAcid.amount > 0
                  ? "bg-cave-900/80 border-ebc-straw/30"
                  : "bg-cave-900/50 border-cave-800"
            }`}
          >
            <div
              className={`water-acid-row grid gap-1 sm:gap-2 items-end ${
                hasSparge ? "grid-cols-[0.85fr_1fr_1fr] sm:grid-cols-2" : "grid-cols-[1fr_2fr] sm:grid-cols-1"
              }`}
            >
              <div
                className={`min-w-0 flex flex-wrap items-center justify-between gap-2 ${hasSparge ? "sm:col-span-2" : ""}`}
              >
                <CycleTag<AcidId>
                  name="Acidifiant"
                  value={state.acidId}
                  options={Object.keys(ACIDS) as AcidId[]}
                  onChange={(id) => {
                    setAcidProductChanged(acideForce);
                    set({ acidId: id, acidOverride: undefined });
                  }}
                  label={(id) => ACID_SHORT[id]}
                  className="max-w-full min-w-0 min-h-11"
                />

              </div>

              <AcidDoseControl
                label="empâtage"
                name={`Dose d’${ACIDS[state.acidId].name.toLowerCase()} à l’empâtage, en ${mashAcid.unit}`}
                unit={mashAcid.unit}
                amount={mashAcid.amount}
                force={state.acidOverride?.mash != null}
                disabled={state.mashWaterL <= 0}
                onDose={(v) => setAcidDose('mash', v)}
                onEditStart={() => beginEdit({ kind: 'acid', side: 'mash', from: mashAcid.amount, to: mashAcid.amount })}
                onEditEnd={endEdit}
              />
              {hasSparge && (
                <AcidDoseControl
                  label="rinçage"
                  name={`Dose d’${ACIDS[state.acidId].name.toLowerCase()} au rinçage, en ${spargeAcid.unit}`}
                  unit={spargeAcid.unit}
                  amount={spargeAcid.amount}
                  force={state.acidOverride?.sparge != null}
                  disabled={
                    state.spargeWaterL <= 0 || state.acidId === "maltAcidule"
                  }
                  onDose={(v) => setAcidDose('sparge', v)}
                  onEditStart={() => beginEdit({ kind: 'acid', side: 'sparge', from: spargeAcid.amount, to: spargeAcid.amount })}
                  onEditEnd={endEdit}
                />
              )}
            </div>
            <div className="water-acid-readings flex flex-wrap gap-x-2 gap-y-0.5 pt-1 text-2xs text-cave-200">
              <span>HCO₃ <span className="hidden sm:inline">après acide</span></span>
              {state.mashWaterL > 0 && <span aria-label="HCO₃ après acide — empâtage">
                <span className="sm:hidden">Emp.</span><span className="hidden sm:inline">Empâtage</span>{" "}
                <strong className="reading text-water">
                  {formatDecimal(
                    Math.round(treatment.treated.mash.hco3 * 10) / 10,
                  )}
                </strong>{" "}
                <span className="hidden sm:inline">ppm</span>
              </span>}
              {hasSparge && (
                <span aria-label="HCO₃ après acide — rinçage">
                  <span className="sm:hidden">Rinç.</span><span className="hidden sm:inline">Rinçage</span>{" "}
                  <strong className="reading text-water">
                    {formatDecimal(
                      Math.round(treatment.treated.sparge.hco3 * 10) / 10,
                    )}
                  </strong>{" "}
                  <span className="hidden sm:inline">ppm</span>
                </span>
              )}
            {totalWaterL > 0 && <p className="water-acid-mean text-2xs sm:mt-2 sm:w-full sm:border-t sm:border-cave-700 sm:pt-2 sm:text-sm text-cave-200" aria-label="HCO₃ après acide — moyenne du graphique">
              <span className="sm:hidden">Total</span><span className="hidden sm:inline">Moyenne du graphique ({formatDecimal(totalWaterL)} L) :</span>{" "}
              <strong className="tabular-nums text-water">{formatDecimal(treatment.treatedTotal.hco3)} ppm</strong>
            </p>}
            </div>
          </div>
        </section>
      </div>
      {manualImpact && <WaterDoseImpact impact={manualImpact} />}
      {acideForce && <div className="flex flex-wrap items-center justify-between gap-x-3 text-2xs text-ebc-straw">
        <p>Doses manuelles conservées, y compris avec « Doser ».</p>
        <button type="button" onClick={() => set({ acidOverride: undefined })}
          aria-label="Revenir aux doses d’acide calculées"
          className="min-h-11 text-left underline underline-offset-2 hover:text-ebc-gold">
          Recalculer l’acide : {formatDecimal(mashAcidCalcule.amount)}{hasSparge && ` + ${formatDecimal(spargeAcidCalcule.amount)}`} {mashAcidCalcule.unit}
        </button>
      </div>}
      {acidProductChanged && !acideForce && <p role="status" className="text-2xs text-cave-200">
        Produit changé : doses recalculées selon sa concentration et son unité.
      </p>}
      <WaterTargetStatus
        style={style} treatment={treatment} raBand={raBand} beerEbc={beerEbc}
        phEstimate={phEstimate} targetPh={brew?.targetPh} customTarget={!!state.customTarget}
        mashWaterL={state.mashWaterL} spargeWaterL={state.spargeWaterL}
        diagnoses={diagnoses.filter(item => item.code !== 'ratio')}
      />
      {diagnoses.filter(item => item.code === 'ratio').map(item => <p key={item.code}
        aria-label="Explication du rapport SO₄/Cl" className="px-1 text-xs leading-relaxed text-cave-200">{item.message}</p>)}
      <details className="px-1 text-xs leading-relaxed text-cave-200" aria-label="Critères du dosage automatique">
        <summary className="min-h-11 flex items-center cursor-pointer text-water underline underline-offset-2">Comment les doses sont choisies</summary>
        <div className="space-y-2 pb-2">
          <p>Les six plages passent en premier, après les deux acides. Les doses manuelles d’acide restent conservées.</p>
          <p>{state.customTarget
            ? 'Pour une cible chiffrée, le calcul cherche les concentrations demandées avec les produits autorisés.'
            : 'Le milieu bas est un point de départ pour Ca, SO₄ et Cl. Le rapport demandé, les apports liés des sels et l’eau déjà disponible déterminent le compromis utile à la recette.'}</p>
          {!state.customTarget && <>
            <p>{treatment.hco3Preferred != null
              ? `HCO₃ : repère ajusté à ${formatDecimal(Math.round(treatment.hco3Preferred))} ppm après les deux acides. Il tient compte de l’alcalinité que l’empâtage peut accepter et des volumes des deux eaux. Une eau déjà adaptée ne reçoit pas d’acide uniquement pour rejoindre le milieu bas.`
              : 'Le profil accepte un HCO₃ nul : aucun bicarbonate n’est ajouté pour centrer le graphique. L’acide suit les besoins estimés de l’empâtage, dans la plage du profil.'}</p>
            <p>Le malt fournit déjà du magnésium. Le sodium reste modéré, sauf si le profil demande une eau salée. Le calcium a un repère souple pour éviter de le remplacer inutilement par du magnésium ou du potassium.</p>
            {treatment.bicarbonatePreference?.reason === 'manual-acid' && <p>L’acide manuel est conservé. Le calcul ne rajoute pas de bicarbonate pour annuler cet acide dans le seul but de centrer le graphique.</p>}
            <p>Le calcul rapproche les concentrations de ces repères, parmi les dosages proches du meilleur rapport SO₄/Cl trouvé (marge {formatDecimal(PRACTICAL_RATIO_TOLERANCE)}). À résultats proches, il préfère moins de sels différents. Un écart au repère ne signifie pas que la plage du profil est manquée.</p>
          </>}
          <p>Les pesées sont vérifiées au dixième de gramme. Un sel autorisé à 0 g n’est pas utilisé dans la proposition. Appuie sur son nom pour voir ses minéraux. Le pH reste évalué séparément.</p>
        </div>
      </details>
      <Sheet open={detailsSalt != null} onClose={() => setDetailsSalt(null)} title="Minéraux du sel"
        subtitle="Contribution de la dose à l’eau totale" className="water-workshop">
        {detailsSalt && <SaltMineralDetails saltId={detailsSalt} grams={state.doses[detailsSalt] ?? 0}
          totalWaterL={totalWaterL} disabled={state.disabled.includes(detailsSalt)} />}
      </Sheet>
    </>
  );
}
