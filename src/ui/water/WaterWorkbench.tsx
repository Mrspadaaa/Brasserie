import { useId, useState } from "react";
import { formatDecimal } from "../numericInput";
import { AcidId, SaltId, WaterIons } from "../../types";
import { SaltMineralDetails } from "../SaltMineralDetails";
import { Sheet } from "../Sheet";

import { SALTS, SALT_IDS, ACIDS, ION_LABEL, ION_SYMBOL_SHORT } from "../../domain/water";
import { STYLE_WATERS, styleIonRange } from "../../domain/waterStyles";

import { WaterRadar } from "../WaterRadar";
import { IonComparison } from "../IonComparison";
import { CycleTag } from "../CycleTag";
import { RatioSlider } from "../RatioSlider";

import { Combobox } from "../Combobox";

import { Sparkles, Target } from "lucide-react";

import type { WaterWorkshopModel } from "./useWaterWorkshop";
import { ACID_SHORT, SALT_SHORT } from "./constants";
import { SaltDoseControl } from "./SaltDoseControl";
import { AcidDoseControl } from "./AcidDoseControl";
import { WaterTargetStatus } from "./WaterTargetStatus";
import { WaterDoseImpact } from "./WaterDoseImpact";
import { PRACTICAL_RATIO_TOLERANCE } from "../../domain/water/saltFit";
import { useWaterControlsLayout } from "./useWaterControlsLayout";
type Props = Pick<
  WaterWorkshopModel,
  | "state"
  | "source"
  | "set"
  | "setDose"
  | "setAcidDose"
  | "beginEdit"
  | "endEdit"
  | "toggleSalt"
  | "phEstimate"
  | "manualImpact"
  | "activeSalt"
  | "setActiveSalt"
  | "setTargetOpen"
  | "workbenchRef"
  | "totalWaterL"
  | "style"
  | "treatment"
  | "raBand"
  | "beerEbc"
  | "waterModelIssue"
  | "brew"
  | "wantedRatio"
  | "applyDoses"
  | "diagnoses"
  | "planApplied"
  | "applyRatio"
  | "hasSparge"
  | "ionsOf"
>;
export function WaterWorkbench({
  state,
  source,
  set,
  setDose,
  setAcidDose,
  beginEdit,
  endEdit,
  toggleSalt,
  phEstimate,
  manualImpact,
  activeSalt,
  setActiveSalt,
  setTargetOpen,
  workbenchRef,
  totalWaterL,
  style,
  treatment,
  raBand,
  beerEbc,
  waterModelIssue,
  brew,
  wantedRatio,
  applyDoses,
  diagnoses,
  planApplied,
  applyRatio,
  hasSparge,
  ionsOf,
}: Props) {
  const [detailsSalt, setDetailsSalt] = useState<SaltId | null>(null);
  const [acidProductChanged, setAcidProductChanged] = useState(false);
  const [selectedIon, setSelectedIon] = useState<keyof WaterIons | null>(null);
  // Every control edits the same recipe draft; only visual selection stays local.
  const unknownIons = (['ca', 'mg', 'na', 'so4', 'cl', 'hco3'] as Array<keyof WaterIons>)
    .filter(ion => !Number.isFinite(source[ion]));
  const sourceComplete = unknownIons.length === 0;
  const bicarbonateUnknown = unknownIons.includes('hco3');
  const acidDosesIncomplete = (bicarbonateUnknown || !!waterModelIssue) && (
    state.mashWaterL > 0 && state.acidOverride?.mash == null
    || hasSparge && state.spargeWaterL > 0 && state.acidOverride?.sparge == null
  );
  const mashAcidUnknown = (bicarbonateUnknown || !!waterModelIssue) && state.acidOverride?.mash == null;
  const spargeAcidUnknown = (bicarbonateUnknown || !!waterModelIssue) && state.acidOverride?.sparge == null;
  const sulfateChlorideKnown = !unknownIons.includes('so4') && !unknownIons.includes('cl');
  const selectIon = (ion: keyof WaterIons) => {
    setSelectedIon(ion);
    const related = SALT_IDS.find(id => (SALTS[id].ions[ion] ?? 0) > 0);
    setActiveSalt(related ?? (ion === 'hco3' ? 'acide' : null));
  };
  const focusAcid = () => {
    setActiveSalt('acide');
    const input = document.querySelector<HTMLElement>('[data-water-acids] input, [data-water-acids] textarea');
    input?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    input?.focus({ preventScroll: true });
  };
  const associatedSalts = selectedIon
    ? SALT_IDS.filter(id => (SALTS[id].ions[selectedIon] ?? 0) > 0)
    : [];
  const selectedIonReading = selectedIon ? (() => {
    const before = treatment.startTotal[selectedIon];
    const current = treatment.treatedTotal[selectedIon];
    const range = styleIonRange(style, selectedIon);
    const targeted = !style.untargetedIons?.includes(selectedIon);
    const unknown = unknownIons.includes(selectedIon) || !Number.isFinite(before) || !Number.isFinite(current);
    if (unknown) return {
      value: `${ION_SYMBOL_SHORT[selectedIon]} inconnu`,
      detail: targeted ? `Analyse manquante · cible ${range.min}–${range.max} mg/L` : 'Analyse source manquante',
      accessibleName: `${ION_LABEL[selectedIon]} inconnu; analyse source manquante${targeted ? `; cible ${range.min} à ${range.max} mg/L` : ''}`,
    };
    const delta = Math.round((current - before) * 10) / 10;
    const difference = `${delta > 0 ? '+' : ''}${formatDecimal(delta)}`;
    const status = !targeted ? 'sans cible' : current < range.min ? 'sous la cible'
      : current > range.max ? 'au-dessus de la cible' : 'dans la cible';
    return {
      value: `${ION_SYMBOL_SHORT[selectedIon]} ${formatDecimal(current)} mg/L`,
      detail: `Δ ${difference} · départ ${formatDecimal(before)} · ${targeted ? `cible ${range.min}–${range.max}` : status}`,
      accessibleName: `${ION_LABEL[selectedIon]}; départ ${formatDecimal(before)} mg/L; calcul ${formatDecimal(current)} mg/L; écart ${difference} mg/L; ${status}${targeted ? `; cible ${range.min} à ${range.max} mg/L` : ''}`,
    };
  })() : undefined;
  const focusSalt = (id: SaltId) => {
    setActiveSalt(id);
    const input = document.querySelector<HTMLElement>(`#water-salt-${id} input, #water-salt-${id} textarea`);
    input?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    input?.focus({ preventScroll: true });
  };
  const selectIonFromDetails = (ion: keyof WaterIons) => {
    selectIon(ion);
    if (ion === 'hco3') focusAcid();
    else {
      const first = SALT_IDS.find(id => (SALTS[id].ions[ion] ?? 0) > 0);
      if (first) focusSalt(first);
    }
  };
  const acidWarningId = useId();
  // Ignore at most half a dosing step from rounding at neutralization. Crossing
  // this water-only reference is not in itself proof of an over-acidified mash.
  const beyondWater = (['mash', 'sparge'] as const).filter(side =>
    (treatment.acidBalance[side]?.beyondWaterAmount ?? 0) > 0.05);
  useWaterControlsLayout(workbenchRef);
  return (
    <>
      {" "}
      <div
        ref={workbenchRef}
        data-water-controls
        className="water-controls space-y-0.5 sm:space-y-4"
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
            disabled={totalWaterL <= 0 || state.mashWaterL <= 0 || !sourceComplete}
            onClick={applyDoses}
            className="shrink-0 h-11 px-2.5 rounded-control bg-ebc-straw text-cave-950 font-bold text-sm
                       flex items-center gap-1 hover:bg-ebc-amber active:scale-[0.98] transition-all shadow-sm
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-ebc-straw"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Doser
          </button>
        </div>

        {!sourceComplete && <p role="status" className="rounded-control border border-attention/50 bg-cave-900 px-2 py-1.5 text-xs leading-snug text-attention">
          Analyse source incomplète : {unknownIons.map(ion => ION_SYMBOL_SHORT[ion]).join(', ')} inconnus. Les valeurs touchées et le bilan des cibles restent inconnus ; le dosage automatique est désactivé.
        </p>}

        {sourceComplete ? <div className="water-radar-panel panel relative p-1 sm:p-3">
          <WaterRadar fitToControls start={treatment.startTotal} achieved={treatment.treatedTotal}
            style={style} highlight={selectedIon ? [selectedIon] : activeSalt === "acide"
              ? (["hco3"] as Array<keyof WaterIons>) : activeSalt ? ionsOf(activeSalt) : undefined} />
          <div className="hidden sm:block mx-auto mt-2 w-full max-w-2xl">
            <IonComparison compact compactLayout="radar-rail"
              start={treatment.startTotal} achieved={treatment.treatedTotal} style={style}
              scenarioLabel="Plan" selectedIon={selectedIon}
              onSelectIon={selectIon} unknownIons={unknownIons} />
            {selectedIonReading && <p data-water-selected-ion-reading role="status" aria-label={selectedIonReading.accessibleName}
              className="mt-0.5 break-words text-[9px] leading-tight text-cave-200 sm:text-xs">
              <strong className="text-water">{selectedIonReading.value}</strong>
              <span className="block">{selectedIonReading.detail}</span>
            </p>}
            {selectedIon && <div role="group" aria-label={`Doses agissant sur ${ION_LABEL[selectedIon]}`}
              className="mt-0.5 flex flex-wrap items-center gap-0.5 sm:justify-center">
              {selectedIon === 'hco3' && <button type="button" onClick={focusAcid}
                aria-label="Aller à l’acidifiant lié au bicarbonate"
                className="min-h-7 rounded-control px-1 text-2xs text-cave-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-water">Acide</button>}
              {associatedSalts[0] && <button type="button" onClick={() => focusSalt(associatedSalts[0])}
                aria-label={`Aller à la dose de ${SALTS[associatedSalts[0]].name} liée à ${ION_LABEL[selectedIon]}`}
                className="min-h-7 rounded-control px-1 text-2xs text-cave-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-water">{SALT_SHORT[associatedSalts[0]]}</button>}
            </div>}
          </div>
        </div> : <p className="px-1 text-xs text-cave-400">Radar masqué : il ne peut pas tracer une analyse incomplète sans inventer une concentration.</p>}

        {!sourceComplete && <div className="hidden sm:flex min-w-0 items-stretch gap-1">
          <IonComparison compact className="flex-1"
            start={treatment.startTotal} achieved={treatment.treatedTotal} style={style}
            scenarioLabel="Plan" selectedIon={selectedIon}
            onSelectIon={selectIon} unknownIons={unknownIons} />
          {selectedIon && <div role="group" aria-label={`Doses agissant sur ${ION_LABEL[selectedIon]}`}
            className="flex shrink-0 items-center gap-0.5 rounded-control border border-water/50 bg-water/5 px-1">
            {selectedIon === 'hco3' && <button type="button" onClick={focusAcid}
              aria-label="Aller à l’acidifiant lié au bicarbonate"
              className="min-h-touch-sm rounded-control px-1 text-2xs text-cave-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-water">Acide</button>}
            {associatedSalts[0] && <button type="button" onClick={() => focusSalt(associatedSalts[0])}
              aria-label={`Aller à la dose de ${SALTS[associatedSalts[0]].name} liée à ${ION_LABEL[selectedIon]}`}
              className="min-h-touch-sm rounded-control px-1 text-2xs text-cave-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-water">{SALT_SHORT[associatedSalts[0]]}</button>}
          </div>}
        </div>}

        {sulfateChlorideKnown ? <RatioSlider
          className="water-ratio-compact"
          value={wantedRatio}
          onChange={applyRatio}
          followingTarget={state.ratioOverride != null || planApplied}
          ions={treatment.treatedTotal}
          target={
            !state.customTarget ||
            (state.customTarget.ions.so4 != null &&
              (state.customTarget.ions.cl ?? 0) > 0)
              ? style.ratio
              : undefined
          }
          /> : <p className="text-xs text-cave-400">Rapport SO₄/Cl indéfini : analyse du sulfate ou du chlorure manquante.</p>}
        <section className="space-y-1">
          <div className="sr-only sm:not-sr-only sm:flex items-center justify-between gap-2 sm:py-2 text-sm text-cave-200">
            <h3 className="font-semibold">Sels à peser</h3>
            <span className="text-2xs text-cave-400">
              {Object.values(state.doses).filter((g) => g > 0).length} utilisés
              sur {SALT_IDS.length}
            </span>
          </div>
          <ul aria-label="Sels à peser" className="water-salt-grid grid grid-cols-3 gap-1 sm:gap-2">
            {SALT_IDS.map((id) => {
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
                  selectedIon={selectedIon}
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

          <div
            data-water-acids
            onPointerDown={() => setActiveSalt("acide")}
            onFocusCapture={event => {
              setActiveSalt("acide");
              const target = event.target;
              if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
                const side = target.getAttribute('aria-label')?.includes('au rinçage') ? 'sparge' : 'mash';
                const from = side === 'mash' ? treatment.mashAcid.amount : treatment.spargeAcid.amount;
                beginEdit({ kind: 'acid', side, from, to: from });
              }
            }}
            className={`water-acid-controls rounded-control border p-1.5 sm:p-2.5 transition-colors ${acidDosesIncomplete ? '[&_.water-acid-dose>button]:hidden' : ''} ${
              activeSalt === "acide"
                ? "bg-cave-850 border-ebc-straw/60"
                : treatment.mashAcid.amount + treatment.spargeAcid.amount > 0
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
                    setAcidProductChanged(state.acidOverride?.mash != null || state.acidOverride?.sparge != null);
                    set({ acidId: id, acidOverride: undefined });
                  }}
                  label={(id) => ACID_SHORT[id]}
                  className="max-w-full min-w-0 min-h-touch mb-4 sm:mb-0 before:hidden"
                />

              </div>

              <AcidDoseControl
                label="empâtage"
                name={`Dose d’${ACIDS[state.acidId].name.toLowerCase()} à l’empâtage, en ${treatment.mashAcid.unit}`}
                unit={treatment.mashAcid.unit}
                amount={mashAcidUnknown ? Number.NaN : treatment.mashAcid.amount}
                force={state.acidOverride?.mash != null}
                status={mashAcidUnknown ? 'unknown' : state.acidOverride?.mash != null ? 'manual' : 'calculated'}
                hco3={!mashAcidUnknown && state.mashWaterL > 0 ? treatment.treated.mash.hco3 : undefined}
                descriptionId={!mashAcidUnknown && beyondWater.includes('mash') ? acidWarningId : undefined}
                disabled={state.mashWaterL <= 0}
                onDose={(v) => setAcidDose('mash', v)}
                onEditStart={() => beginEdit({ kind: 'acid', side: 'mash', from: treatment.mashAcid.amount, to: treatment.mashAcid.amount })}
                onEditEnd={endEdit}
              />
              {hasSparge && (
                <AcidDoseControl
                  label="rinçage"
                  name={`Dose d’${ACIDS[state.acidId].name.toLowerCase()} au rinçage, en ${treatment.spargeAcid.unit}`}
                  unit={treatment.spargeAcid.unit}
                  amount={spargeAcidUnknown ? Number.NaN : treatment.spargeAcid.amount}
                  force={state.acidOverride?.sparge != null}
                  status={spargeAcidUnknown ? 'unknown' : state.acidOverride?.sparge != null ? 'manual' : 'calculated'}
                  hco3={!spargeAcidUnknown ? treatment.treated.sparge.hco3 : undefined}
                  descriptionId={!spargeAcidUnknown && beyondWater.includes('sparge') ? acidWarningId : undefined}
                  disabled={
                    state.spargeWaterL <= 0 || state.acidId === "maltAcidule"
                  }
                  onDose={(v) => setAcidDose('sparge', v)}
                  onEditStart={() => beginEdit({ kind: 'acid', side: 'sparge', from: treatment.spargeAcid.amount, to: treatment.spargeAcid.amount })}
                  onEditEnd={endEdit}
                />
              )}
            </div>
            {bicarbonateUnknown && <p className="mt-1 text-xs text-attention">Dose automatique et HCO₃ incalculables : l’analyse source manque. Tu peux saisir une dose manuelle.</p>}
            {waterModelIssue && <p className="mt-1 text-xs text-attention">{waterModelIssue} Aucune dose automatique validée ; une dose manuelle exige une mesure ou un titrage.</p>}
            {beyondWater.length > 0 && <p id={acidWarningId} role="status" aria-label="Acide au-delà du bicarbonate"
              className="mt-1 border-t border-cave-700 pt-1 text-xs leading-snug text-attention">
              <strong>{beyondWater.map(side => side === 'mash' ? 'Empâtage' : 'Rinçage').join(' et ')} : HCO₃ épuisé.</strong>{' '}
              L’acide ajouté au-delà peut encore abaisser le pH. Vérifie la dose et mesure le pH.
            </p>}
          </div>
        </section>
      </div>
      {manualImpact && <WaterDoseImpact impact={manualImpact} unknownIons={unknownIons} />}
      <div data-water-ion-details>
        <IonComparison
          start={treatment.startTotal}
          achieved={treatment.treatedTotal}
          style={style}
          scenarioLabel="Plan"
          selectedIon={selectedIon}
          onSelectIon={selectIonFromDetails}
          unknownIons={unknownIons}
        />
      </div>
      <details className="text-xs text-cave-200">
        <summary className="min-h-touch cursor-pointer py-1">
          <span aria-label={waterModelIssue ? "HCO₃ après ajouts retenus — moyenne du graphique" : "HCO₃ après acide — moyenne du graphique"}>HCO₃ · moyenne du graphique :{' '}
            <strong className="tabular-nums text-cave-50">{bicarbonateUnknown ? 'inconnu' : `${formatDecimal(treatment.treatedTotal.hco3)} ppm`}</strong>
          </span>
        </summary>
        <div className="space-y-1 pb-1">
          <p>La moyenne pondérée sur {formatDecimal(totalWaterL)} L décrit les eaux préparées séparément.
            {!bicarbonateUnknown && hasSparge && treatment.treated.mash.hco3 === 0 && treatment.treated.sparge.hco3 > 0 &&
              ' Le HCO₃ encore affiché vient du rinçage : ajouter de l’acide à l’empâtage ne le fait plus baisser.'}
            {' '}Ce n’est pas le HCO₃ du moût après mélange avec les malts.</p>
          {bicarbonateUnknown && <p>Cette valeur reste inconnue jusqu’à la saisie de l’analyse HCO₃ de la source.</p>}
          {!bicarbonateUnknown && !waterModelIssue && beyondWater.map(side => {
            const balance = treatment.acidBalance[side]!;
            const acid = side === 'mash' ? treatment.mashAcid : treatment.spargeAcid;
            const decimal = (value: number) => formatDecimal(Math.round(value * 10) / 10);
            return <p key={side}>
              {side === 'mash' ? 'Empâtage' : 'Rinçage'} : ≈ {decimal(balance.neutralizationAmount)} {acid.unit} suffisent
              à neutraliser le HCO₃ de cette eau. Dose retenue : {formatDecimal(acid.amount)} {acid.unit},
              soit {decimal(balance.beyondWaterAmount)} {acid.unit} au-delà.
              Ce repère n’est pas une dose conseillée : les tampons du malt et le pH restent à prendre en compte.
            </p>;
          })}
        </div>
      </details>
      {(state.acidOverride?.mash != null || state.acidOverride?.sparge != null) && <div className="flex flex-wrap items-center justify-between gap-x-3 text-2xs text-ebc-straw">
        <p>Doses manuelles conservées, y compris avec « Doser ».</p>
        <button type="button" onClick={() => {
          set({ acidOverride: undefined });
        }}
          aria-label={waterModelIssue ? "Effacer les doses manuelles d’acide" : "Revenir aux doses d’acide calculées"}
          className="min-h-touch text-left underline underline-offset-2 hover:text-ebc-gold">
          {waterModelIssue ? 'Effacer les doses manuelles · à mesurer ou titrer' : <>Recalculer l’acide : {formatDecimal(treatment.mashAcidCalculated.amount)}{hasSparge && ` + ${formatDecimal(treatment.spargeAcidCalculated.amount)}`} {treatment.mashAcidCalculated.unit}</>}
        </button>
      </div>}
      {acidProductChanged && state.acidOverride?.mash == null && state.acidOverride?.sparge == null && <p role="status" className="text-2xs text-cave-200">
        {waterModelIssue ? 'Produit changé : les doses restent à mesurer ou titrer.' : 'Produit changé : doses recalculées selon sa concentration et son unité.'}
      </p>}
      {sourceComplete ? <WaterTargetStatus
        style={style} treatment={treatment} raBand={raBand} beerEbc={beerEbc}
        phEstimate={phEstimate} targetPh={brew?.targetPh} customTarget={!!state.customTarget}
        waterModelIssue={waterModelIssue} retainedAcid={state.acidOverride}
        mashWaterL={state.mashWaterL} spargeWaterL={state.spargeWaterL}
        diagnoses={diagnoses.filter(item => item.code !== 'ratio')}
      /> : <p className="px-1 text-xs leading-snug text-cave-400">Bilan des plages et estimation de pH indisponibles tant que l’analyse source est incomplète.</p>}
      {!unknownIons.includes('mg') && Number.isFinite(treatment.treatedTotal.mg)
        && treatment.treatedTotal.mg === 0 && style.ions.mg.min === 0
        && (brew?.totalGristKg ?? 0) > 0 && <p data-water-magnesium-note className="px-1 text-2xs text-cave-400 leading-snug">
          Mg : 0 ppm dans l’eau. Ajout facultatif pour ce profil ; les malts en apportent au moût, hors de ce graphique.
        </p>}
      {sourceComplete && diagnoses.filter(item => item.code === 'ratio').map(item => <p key={item.code}
        aria-label="Explication du rapport SO₄/Cl" className="px-1 text-xs leading-relaxed text-cave-200">{item.message}</p>)}
      <details className="px-1 text-xs leading-relaxed text-cave-200" aria-label="Critères du dosage automatique">
        <summary className="min-h-11 flex items-center cursor-pointer text-water underline underline-offset-2">Comment les doses sont choisies</summary>
        <div className="space-y-2 pb-2">
          <p>{waterModelIssue ? 'Les six plages minérales restent visibles avec les seuls acides saisis et retenus ; le pH et les doses absentes sont à mesurer.' : 'Les six plages passent en premier, après les deux acides. Les doses manuelles d’acide restent conservées.'}</p>
          <p>{state.customTarget
            ? 'Pour une cible chiffrée, le calcul cherche les concentrations demandées avec les produits autorisés.'
            : 'Le milieu bas est un point de départ pour Ca, SO₄ et Cl. Le rapport demandé, les apports liés des sels et l’eau déjà disponible déterminent le compromis utile à la recette.'}</p>
          {!state.customTarget && <>
            {!waterModelIssue && <p>{treatment.hco3Preferred != null
              ? `HCO₃ : repère ajusté à ${formatDecimal(Math.round(treatment.hco3Preferred))} ppm après les deux acides. Il tient compte de l’alcalinité que l’empâtage peut accepter et des volumes des deux eaux. Une eau déjà adaptée ne reçoit pas d’acide uniquement pour rejoindre le milieu bas.`
              : 'Le profil accepte un HCO₃ nul : aucun bicarbonate n’est ajouté pour centrer le graphique. L’acide suit les besoins estimés de l’empâtage, dans la plage du profil.'}</p>}
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
