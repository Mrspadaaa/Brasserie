import { useCallback, useMemo, useRef, useState } from "react";

import { SaltId, WaterIons } from "../../types";
import { describeTreatmentIssues } from "../../domain/water/solverMessages";
import {
  SALTS,
  calculateWaterTreatment,
  SALT_IDS,
  ACIDS,
  ION_LABEL,
  CAUTION_APPROACH,
  saltCautions,
  dilute,
  alkalinityAsCaCO3,
  residualAlkalinity,
  targetRaForGrist,
  raSaltCeilingForGrist,
  raForGrist,
  alkalineSaltGoal,
  estimateMashPh,
  hopBalanceHint,
  lactateInBeer,
  sulfateChlorideRatio,
  solveSalts,
  splitDoses,
} from "../../domain/water";
import {
  styleByCode,
  styleWaterForName,
  styleFromTargetIons,
} from "../../domain/waterStyles";

import { SaltSolverProps, WaterState } from "./types";
import { RADAR_IONS } from "./constants";
import { waterProfileTarget, waterTreatmentTarget } from "../../domain/water/profileTarget";
import { calculateSpargeTreatment } from "../../domain/water/acid";
import { manualWaterImpact, type ManualWaterEdit } from "../../domain/water/manualImpact";
import { diagnoseWaterProfile } from "../../domain/water/profileDiagnosis";
import { useWaterAnalysis } from "./useWaterAnalysis";
type Tab = "empatage" | "rincage";
type MobileStep = "eau" | "sels";

/** Coordinates edits and derives the workshop from the shared water domain. */
export function useWaterWorkshop({
  source,
  onSourceChange,
  beerEbc,
  beerVolumeL,
  brew,
  onMashRatioChange,
  state,
  onChange,
  noSparge,
  onNoSpargeChange,
}: SaltSolverProps) {
  const [lastEdit, setLastEdit] = useState<{
    edit: ManualWaterEdit;
    before: ReturnType<typeof calculateWaterTreatment>;
    beforePh: ReturnType<typeof estimateMashPh>;
    context: string;
  } | null>(null);
  const editing = useRef<NonNullable<typeof lastEdit> | null>(null);
  const set = (patch: Partial<WaterState>) => {
    setLastEdit(null);
    onChange({
      ...state,
      ...patch,
      ...(patch.allSaltsInMash != null &&
      patch.allSaltsInMash !== state.allSaltsInMash
        ? { saltSplit: undefined }
        : {}),
    });
  };
  const setDose = (id: SaltId, value: number) => {
    if (state.disabled.includes(id) || !Number.isFinite(value)) return;
    const doses = { ...state.doses, [id]: Math.max(0, value) };
    if (!doses[id]) delete doses[id];
    const split = splitDoses(
      doses,
      state.mashWaterL,
      state.spargeWaterL,
      state.allSaltsInMash !== false,
    );
    const saltOverrides = state.autoTreatment
      ? {
          mash: { ...state.saltOverrides?.mash, [id]: split.mash[id] ?? 0 },
          sparge: {
            ...state.saltOverrides?.sparge,
            [id]: split.sparge[id] ?? 0,
          },
        }
      : state.saltOverrides;
    set({
      doses,
      saltOverrides,
      saltSplit: undefined,
      ratioOverride: undefined,
    });
    if ((state.doses[id] ?? 0) !== Math.max(0, value))
      rememberEdit({ kind: 'salt', id, from: state.doses[id] ?? 0, to: Math.max(0, value) });
  };
  const [tab, setTab] = useState<Tab>("empatage");
  const [activeStep, setActiveStep] = useState<MobileStep>("eau");

  const [activeSalt, setActiveSalt] = useState<SaltId | "acide" | null>(null);
  const [targetOpen, setTargetOpen] = useState(false);
  const workbenchRef = useRef<HTMLDivElement>(null);

  const handleStepChange = (step: MobileStep) => {
    setActiveStep(step);
    if (typeof document !== "undefined") {
      const main = document.querySelector("main");
      if (main) main.scrollTop = 0;
    }
  };

  const totalWaterL =
    Math.round((state.mashWaterL + state.spargeWaterL) * 10) / 10;

  const style = useMemo(
    () =>
      state.customTarget
        ? styleFromTargetIons(state.customTarget.ions, state.customTarget.name)
        : styleByCode(state.styleCode),
    [state.customTarget, state.styleCode],
  );
  const recipeStyle = styleWaterForName(brew?.style ?? "");
  const differentProfile =
    !state.customTarget &&
    recipeStyle.code !== "—" &&
    recipeStyle.code !== style.code;
  const start = useMemo(
    () => dilute(source, state.diRatioPct),
    [source, state.diRatioPct],
  );

  const spargeDi = state.spargeDiRatioPct ?? state.diRatioPct;
  const spargeLinked = state.spargeDiRatioPct == null;
  const startSparge = useMemo(
    () => dilute(source, spargeDi),
    [source, spargeDi],
  );

  const mashRatioLPerKg =
    brew?.totalGristKg && brew.totalGristKg > 0
      ? state.mashWaterL / brew.totalGristKg
      : 0;

  const vol = brew?.volumes;

  const raBand = useMemo(
    () => targetRaForGrist(beerEbc, brew?.grist, mashRatioLPerKg),
    [beerEbc, brew?.grist, mashRatioLPerKg],
  );

  const raCeiling = useMemo(
    () => raSaltCeilingForGrist(brew?.grist, mashRatioLPerKg),
    [brew?.grist, mashRatioLPerKg],
  );
  const raPreference = useMemo(() => raForGrist(brew?.grist, mashRatioLPerKg), [brew?.grist, mashRatioLPerKg]);
  const alkaliGoal = alkalineSaltGoal(raBand, raCeiling);

  const allSaltsInMash = state.allSaltsInMash !== false;

  const treatment = useMemo(
    () =>
      calculateWaterTreatment(
        source,
        { ...state, ...waterTreatmentTarget(style, state.customTarget?.ions, { ceiling: raCeiling, target: raPreference }) },
        raBand,
      ),
    [source, state, raBand, style, raCeiling, raPreference],
  );
  const achievedMash = treatment.raw.mash;
  const achievedSparge = treatment.raw.sparge;
  const achievedTotal = treatment.total;

  const ra = residualAlkalinity(achievedMash);
  const ratio = sulfateChlorideRatio(achievedTotal);

  const phEstimate = useMemo(
    () => estimateMashPh(brew?.grist, treatment.mashPhRa, mashRatioLPerKg),
    [brew?.grist, treatment.mashPhRa, mashRatioLPerKg],
  );

  // Do not keep a before/after claim across a different source, recipe,
  // volume, dilution or acid product. The snapshot is UI state, never saved.
  const editContext = JSON.stringify([source, state.styleCode, state.customTarget,
    state.diRatioPct, spargeDi, state.mashWaterL, state.spargeWaterL,
    state.allSaltsInMash, state.acidId, beerEbc, brew?.grist]);
  const beginEdit = (edit: ManualWaterEdit) => {
    editing.current = { edit, before: treatment, beforePh: phEstimate, context: editContext };
  };
  const endEdit = () => { editing.current = null; };
  const rememberEdit = (edit: ManualWaterEdit) => {
    const start = editing.current;
    const sameControl = start?.context === editContext && start.edit.kind === edit.kind
      && (edit.kind === 'salt' ? start.edit.kind === 'salt' && start.edit.id === edit.id
        : start.edit.kind === 'acid' && start.edit.side === edit.side);
    setLastEdit(sameControl ? { ...start, edit: { ...edit, from: start.edit.from } }
      : { edit, before: treatment, beforePh: phEstimate, context: editContext });
  };
  const manualImpact = lastEdit?.context === editContext ? manualWaterImpact({
    ...lastEdit, after: treatment, afterPh: phEstimate, totalWaterL,
    ranges: style.ions, targeted: RADAR_IONS.filter(ion => !style.untargetedIons?.includes(ion)),
  }) : null;
  const setAcidDose = (side: 'mash' | 'sparge', value: number) => {
    if (!Number.isFinite(value) || value < 0) return;
    const before = side === 'mash' ? treatment.mashAcid.amount : treatment.spargeAcid.amount;
    set({ acidOverride: { ...state.acidOverride, [side]: value } });
    if (value !== before) rememberEdit({ kind: 'acid', side, from: before, to: value });
  };

  const hopHint = useMemo(
    () =>
      hopBalanceHint(
        brew?.hops,
        brew?.ibu ?? null,
        brew?.og ?? null,
        style.ratio,
      ),
    [brew?.hops, brew?.ibu, brew?.og, style.ratio],
  );

  const customSo4 = state.customTarget?.ions.so4 ?? start.so4;
  const customCl = state.customTarget?.ions.cl ?? start.cl;
  const wantedRatio =
    state.ratioOverride ??
    (state.customTarget
      ? customCl > 0
        ? customSo4 / customCl
        : customSo4 > 0
          ? Infinity
          : 0
      : (hopHint?.ratio ?? (style.ratio.min + style.ratio.max) / 2));

  const planInputFor = useCallback(
    (ratio: number, forceRatio = false): Parameters<typeof solveSalts>[0] => {
      return {
        ...waterProfileTarget(
          style,
          start,
          state.customTarget?.ions,
          ratio,
          !state.customTarget || state.ratioOverride != null || forceRatio,
        ),
        start,
        startSparge,
        totalWaterL,
        mashWaterL: state.mashWaterL,
        disabled: state.disabled,
        targetRa: raBand,
        raCeiling,
        raPreference,
        ratio,
        allSaltsInMash,
        spargeHco3AfterAcid: calculateSpargeTreatment(
              startSparge,
              state.spargeWaterL,
              state.acidId,
              {
                sourcePh: source.ph,
                override: state.acidOverride?.sparge,
              },
            ).ions.hco3,
        mashAcidHco3Mg: (state.acidOverride?.mash ?? 0) * ACIDS[state.acidId].hco3NeutralizedPerUnit,
      };
    },
    [
      style,
      start,
      startSparge,
      source.ph,
      totalWaterL,
      state.ratioOverride,
      state.mashWaterL,
      state.spargeWaterL,
      state.acidId,
      state.acidOverride?.sparge,
      state.acidOverride?.mash,
      state.disabled,
      state.customTarget,
      raBand,
      raCeiling,
      raPreference,
      allSaltsInMash,
    ],
  );
  const planFor = useCallback((ratio: number, forceRatio = false) =>
    solveSalts(planInputFor(ratio, forceRatio)), [planInputFor]);

  const ionsAuPlafond = useMemo(
    () =>
      (["ca", "mg", "na", "so4", "cl"] as Array<keyof WaterIons>)
        .filter(
          (ion) =>
            style.ions[ion] && treatment.startTotal[ion] > style.ions[ion].max,
        )
        .map(
          (ion) =>
            `${ION_LABEL[ion].toLowerCase()} (${Math.round(treatment.startTotal[ion])} pour ${style.ions[ion].max})`,
        ),
    [treatment.startTotal, style],
  );

  // The minimum required dilution is independent of the currently selected
  // dilution for a style. Editing that percentage must not rerun its search.
  const dilutionStart = state.customTarget ? start : source;
  const dilutionTarget = useMemo(() => waterProfileTarget(
        style,
        dilutionStart,
        state.customTarget?.ions,
        wantedRatio,
        !state.customTarget || state.ratioOverride != null,
      ), [style, dilutionStart, state.customTarget, wantedRatio, state.ratioOverride]);
  const dilutionInput = useMemo(() => {
    return {
      ...dilutionTarget,
      source,
      totalWaterL,
      mashWaterL: state.mashWaterL,
      spargeWaterL: state.spargeWaterL,
      targetRa: raBand,
      raCeiling,
      raPreference,
      ratio: wantedRatio,
      disabled: state.disabled,
      allSaltsInMash,
      acid: state.acidId,
      ...waterTreatmentTarget(style, state.customTarget?.ions, { ceiling: raCeiling, target: raPreference }),
      acidOverride: state.acidOverride,
      beerVolumeL,
      sourcePh: source.ph ?? 7.4,
    };
  }, [
    style,
    dilutionTarget,
    wantedRatio,
    source,
    totalWaterL,
    state.mashWaterL,
    state.spargeWaterL,
    raBand,
    raCeiling,
    raPreference,
    state.disabled,
    state.customTarget,
    allSaltsInMash,
    state.acidId,
    state.acidOverride?.mash,
    state.acidOverride?.sparge,
    beerVolumeL,
  ]);

  // Actual weighed water above stays synchronous. Searching alternative salt
  // plans and up to 21 RO dilutions must not block a manual acid keystroke.
  const solveInput = useMemo(() => planInputFor(wantedRatio), [planInputFor, wantedRatio]);
  const analysis = useWaterAnalysis({ solve: solveInput, dilution: dilutionInput });
  const solution = analysis.result?.solution;
  const justEnough = analysis.result?.justEnough;
  const diagnoses = useMemo(() => {
    // Do not describe a stale proposal, or claim a search failed while pending.
    if (!solution) return [];
    const input = { ...state, ...waterTreatmentTarget(style, state.customTarget?.ions, { ceiling: raCeiling, target: raPreference }) };
    const proposal = calculateWaterTreatment(source,
      { ...input, doses: solution.doses, saltSplit: undefined }, raBand);
    const automaticAcid = state.acidOverride?.mash != null || state.acidOverride?.sparge != null
      ? calculateWaterTreatment(source, { ...input, acidOverride: undefined }, raBand) : undefined;
    return diagnoseWaterProfile({ actual: treatment, proposal, automaticAcid,
      ranges: { ...style.ions, ...(state.customTarget && treatment.hco3Range ? { hco3: treatment.hco3Range } : {}) },
      targeted: RADAR_IONS.filter(ion => !style.untargetedIons?.includes(ion)),
      disabled: state.disabled, totalWaterL, spargeWaterL: state.spargeWaterL,
      requestedRatio: wantedRatio,
    });
  }, [state, style, source, solution, raBand, raCeiling, raPreference, treatment, totalWaterL, wantedRatio]);
  const planApplied = !!solution && SALT_IDS.every(id =>
    Math.abs((state.doses[id] ?? 0) - (solution.doses[id] ?? 0)) < 0.05);
  const rienAProposer = !!solution && SALT_IDS.every(id => !((solution.doses[id] ?? 0) > 0));
  const applyDoses = () => set({
    // Explicit Doser always uses this entry, even before its background result.
    doses: (solution ?? planFor(wantedRatio)).doses,
    saltSplit: undefined,
    saltOverrides: undefined,
  });

  const applyRatio = (ratio: number) => {
    setLastEdit(null);
    onChange({
      ...state,
      ratioOverride: ratio,
      doses: planFor(ratio, true).doses,
      saltSplit: undefined,
      saltOverrides: undefined,
    });
  };

  const split = useMemo(() => treatment.split, [treatment]);

  const mashAcidCalcule = treatment.mashAcidCalculated;
  const spargeAcidCalcule = treatment.spargeAcidCalculated;
  const mashAcid = treatment.mashAcid;
  const spargeAcid = treatment.spargeAcid;

  const acideForce =
    state.acidOverride?.mash != null || state.acidOverride?.sparge != null;
  const mashAcidDiffers =
    state.acidOverride?.mash != null &&
    Math.abs(mashAcid.amount - mashAcidCalcule.amount) >= 0.05;

  const raApresAcide = treatment.raAfter;

  const placeAcide: "haut" | "juste" | "bas" =
    raApresAcide > raBand.max + 5
      ? "haut"
      : raApresAcide < raBand.min - 5
        ? "bas"
        : "juste";

  const acideSuffit = placeAcide !== "haut";

  const messagesSolveur = useMemo(
    () =>
      planApplied
        ? describeTreatmentIssues(
            (solution?.issues ?? []).filter((issue) => issue.code !== "grist"),
            treatment,
            raBand,
            // The bicarbonate diagnosis is already shown beside the acid controls.
            { includeBicarbonateTarget: !state.customTarget },
          )
        : [],
    [planApplied, solution?.issues, treatment, raBand, state.customTarget],
  );

  const spargeAlkalinity = Math.round(
    alkalinityAsCaCO3(treatment.treated.sparge.hco3),
  );

  const achievedTotalApresAcide = treatment.treatedTotal;

  const lactate =
    state.acidId === "lactique"
      ? lactateInBeer(mashAcid.amount + spargeAcid.amount, beerVolumeL)
      : 0;

  const cautions = useMemo(
    () =>
      saltCautions(
        state.doses,
        state.disabled,
        achievedTotalApresAcide,
        totalWaterL,
      ),
    [state.doses, state.disabled, achievedTotalApresAcide, totalWaterL],
  );

  const seuilGoutProche = useMemo(() => {
    const t = ACIDS[state.acidId].taste;
    return !!t && lactate >= t.gPerL * CAUTION_APPROACH && lactate <= t.gPerL;
  }, [state.acidId, lactate]);

  const caShort =
    totalWaterL > 0 &&
    achievedTotal.ca < style.ions.ca.min &&
    !(planApplied && solution?.unreachable.some((m) => m.startsWith("Calcium")));

  const hasSparge = !noSparge;
  const activeTab: Tab = hasSparge ? tab : "empatage";

  const round1 = (n: number) => Math.round(n * 10) / 10;
  const mashOsmoseeL = round1((state.mashWaterL * state.diRatioPct) / 100);
  const mashReseauL = round1(state.mashWaterL - mashOsmoseeL);
  const spargeOsmoseeL = hasSparge
    ? round1((state.spargeWaterL * spargeDi) / 100)
    : 0;
  const spargeReseauL = hasSparge
    ? round1(state.spargeWaterL - spargeOsmoseeL)
    : 0;
  const totalOsmoseeL = round1(mashOsmoseeL + spargeOsmoseeL);
  const totalReseauL = round1(mashReseauL + spargeReseauL);

  const ionsOf = (id: SaltId) =>
    RADAR_IONS.filter((ion) => (SALTS[id].ions[ion] ?? 0) > 0);

  const bump = (id: SaltId, delta: number) => {
    const next = Math.max(
      0,
      Math.round(((state.doses[id] ?? 0) + delta) * 10) / 10,
    );
    setDose(id, next);
  };

  const toggleSalt = (id: SaltId) => {
    const off = state.disabled.includes(id);
    const disabled = off
      ? state.disabled.filter((d) => d !== id)
      : [...state.disabled, id];
    const doses = { ...state.doses };
    if (!off) delete doses[id];
    const saltOverrides = state.saltOverrides
      ? structuredClone(state.saltOverrides)
      : undefined;
    if (saltOverrides) {
      delete saltOverrides.mash?.[id];
      delete saltOverrides.sparge?.[id];
    }
    set({ disabled, doses, saltSplit: undefined, saltOverrides });
    if (!off && (state.doses[id] ?? 0) > 0)
      rememberEdit({ kind: 'salt', id, from: state.doses[id]!, to: 0 });
  };

  const totalDosesGrams = Object.values(state.doses).reduce(
    (acc, d) => acc + (d || 0),
    0,
  );

  return {
    source,
    onSourceChange,
    beerEbc,
    beerVolumeL,
    brew,
    onMashRatioChange,
    state,
    onChange,
    noSparge,
    onNoSpargeChange,
    set,
    setDose,
    setAcidDose,
    manualImpact,
    beginEdit,
    endEdit,
    tab,
    setTab,
    activeStep,
    setActiveStep,
    activeSalt,
    setActiveSalt,
    targetOpen,
    setTargetOpen,
    workbenchRef,
    handleStepChange,
    totalWaterL,
    style,
    recipeStyle,
    differentProfile,
    start,
    spargeDi,
    spargeLinked,
    startSparge,
    mashRatioLPerKg,
    vol,
    raBand,
    raCeiling,
    alkaliGoal,
    allSaltsInMash,
    treatment,
    achievedMash,
    achievedSparge,
    achievedTotal,
    ra,
    ratio,
    phEstimate,
    hopHint,
    wantedRatio,
    planFor,
    applyDoses,
    solution,
    diagnoses,
    planApplied,
    rienAProposer,
    ionsAuPlafond,
    justEnough,
    applyRatio,
    split,
    mashAcidCalcule,
    spargeAcidCalcule,
    mashAcid,
    spargeAcid,
    acideForce,
    mashAcidDiffers,
    raApresAcide,
    placeAcide,
    acideSuffit,
    messagesSolveur,
    spargeAlkalinity,
    achievedTotalApresAcide,
    lactate,
    cautions,
    seuilGoutProche,
    caShort,
    hasSparge,
    activeTab,
    round1,
    mashOsmoseeL,
    mashReseauL,
    spargeOsmoseeL,
    spargeReseauL,
    totalOsmoseeL,
    totalReseauL,
    ionsOf,
    bump,
    toggleSalt,
    totalDosesGrams,
  };
}
export type WaterWorkshopModel = ReturnType<typeof useWaterWorkshop>;
