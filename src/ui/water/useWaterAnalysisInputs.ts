import { useCallback, useMemo } from "react";

import { WaterSource } from "../../types";
import {
  ACIDS,
  dilute,
  hopBalanceHint,
  raForGrist,
  raSaltCeilingForGrist,
  solveSalts,
  targetRaForGrist,
} from "../../domain/water";
import { styleByCode, styleFromTargetIons } from "../../domain/waterStyles";
import { waterProfileTarget, waterTreatmentTarget } from "../../domain/water/profileTarget";
import { calculateSpargeTreatment } from "../../domain/water/acid";
import { noloWaterModelIssue } from "../../domain/noloWaterModelIssue";
import type { WaterBrewContext, WaterState } from "./types";

/** Zero is only a calculation input for an unknown acid dose, never a saved choice. */
export function waterStateWithRetainedAcid(state: WaterState, waterModelIssue?: string): WaterState {
  return waterModelIssue ? { ...state, acidOverride: {
    mash: state.acidOverride?.mash ?? 0,
    sparge: state.acidOverride?.sparge ?? 0
  } } : state;
}

export interface WaterAnalysisInputsProps {
  source: WaterSource;
  beerEbc: number | null;
  beerVolumeL: number;
  brew?: WaterBrewContext;
  state: WaterState;
}

/**
 * Tout ce qu'il faut pour poser la question à l'analyse (plan de sels + minimum d'osmosée), et rien d'autre.
 * Un seul endroit : l'onglet Eau (`useWaterWorkshop`) et le préchargement de l'assistant (`useWaterPreload`) en
 * tirent la même entrée, donc la même clé, donc la même réponse. Pas de calcul lourd ici : des formules courtes, mémoïsées.
 */
export function useWaterAnalysisInputs({ source, beerEbc, beerVolumeL, brew, state }: WaterAnalysisInputsProps) {
  const totalWaterL = Math.round((state.mashWaterL + state.spargeWaterL) * 10) / 10;

  const style = useMemo(
    () => state.customTarget
      ? styleFromTargetIons(state.customTarget.ions, state.customTarget.name)
      : styleByCode(state.styleCode),
    [state.customTarget, state.styleCode],
  );
  const start = useMemo(() => dilute(source, state.diRatioPct), [source, state.diRatioPct]);
  const spargeDi = state.spargeDiRatioPct ?? state.diRatioPct;
  const startSparge = useMemo(() => dilute(source, spargeDi), [source, spargeDi]);

  const mashRatioLPerKg = brew?.totalGristKg && brew.totalGristKg > 0 ? state.mashWaterL / brew.totalGristKg : 0;
  const waterModelIssue = noloWaterModelIssue(brew?.nolo, mashRatioLPerKg);
  const retainedAcidState = useMemo(() => waterStateWithRetainedAcid(state, waterModelIssue), [state, waterModelIssue]);

  const raBand = useMemo(
    () => targetRaForGrist(beerEbc, brew?.grist, mashRatioLPerKg),
    [beerEbc, brew?.grist, mashRatioLPerKg],
  );
  const raCeiling = useMemo(
    () => raSaltCeilingForGrist(brew?.grist, mashRatioLPerKg),
    [brew?.grist, mashRatioLPerKg],
  );
  const raPreference = useMemo(() => raForGrist(brew?.grist, mashRatioLPerKg), [brew?.grist, mashRatioLPerKg]);
  const allSaltsInMash = state.allSaltsInMash !== false;

  const hopHint = useMemo(
    () => hopBalanceHint(brew?.hops, brew?.ibu ?? null, brew?.og ?? null, style.ratio),
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
                override: retainedAcidState.acidOverride?.sparge,
              },
            ).ions.hco3,
        mashAcidHco3Mg: (retainedAcidState.acidOverride?.mash ?? 0) * ACIDS[state.acidId].hco3NeutralizedPerUnit,
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
      retainedAcidState.acidOverride?.sparge,
      retainedAcidState.acidOverride?.mash,
      state.disabled,
      state.customTarget,
      raBand,
      raCeiling,
      raPreference,
      allSaltsInMash,
    ],
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
      acidOverride: retainedAcidState.acidOverride,
      saltOverrides: state.saltOverrides,
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
    retainedAcidState.acidOverride?.mash,
    retainedAcidState.acidOverride?.sparge,
    state.saltOverrides,
    beerVolumeL,
  ]);

  // Actual weighed water stays synchronous in the workshop. Searching alternative salt
  // plans and up to 21 RO dilutions must not block a manual acid keystroke.
  const solveInput = useMemo(() => planInputFor(wantedRatio), [planInputFor, wantedRatio]);

  return {
    totalWaterL, style, start, spargeDi, startSparge, mashRatioLPerKg, waterModelIssue, retainedAcidState,
    raBand, raCeiling, raPreference, allSaltsInMash, hopHint, wantedRatio, planInputFor, solveInput, dilutionInput,
  };
}
