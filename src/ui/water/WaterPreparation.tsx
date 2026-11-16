import { WaterAcidity } from "./WaterAcidity";
import { WaterDilution } from "./WaterDilution";
import { WaterVolumes } from "./WaterVolumes";

import { WaterAnalysisTable } from "../WaterAnalysisTable";

import { IonComparison } from "../IonComparison";
import { formatDecimal } from "../numericInput";

import { Droplets, ChevronRight, ChevronDown } from "lucide-react";
import "./eau.css";

import type { WaterIons } from "../../types";
import type { WaterWorkshopModel } from "./useWaterWorkshop";

/** Onglet « 1. Eau » : la maquette w1b (15.11). L'analyse source se replie sur une ligne ; puis les deux cuves, la coupe à l'osmosée, l'acidité. */
export function WaterPreparation(props: WaterWorkshopModel & { sousVolumes?: import("react").ReactNode }) {
  const { sousVolumes, ...model } = props;
  const {
    source,
    onSourceChange,
    state,
    activeStep,
    handleStepChange,
    style,
    start,
    treatment,
    achievedTotalApresAcide,
  } = model;
  const unknownIons = (['ca', 'mg', 'na', 'so4', 'cl', 'hco3'] as Array<keyof WaterIons>)
    .filter(ion => !Number.isFinite(source[ion]));
  return (
    <div className={`ew ${activeStep === "eau" ? "block" : "hidden"}`} data-ew-tab="eau">
      <details className="ew-srcd" data-action="source-eau">
        <summary aria-label={`Analyse source : ${source.name}`}>
          <Droplets size={16} aria-hidden="true" />
          <span>Analyse source · {source.name}</span>
          {unknownIons.length > 0 && <em className="ew-tag">à confirmer</em>}
          <ChevronDown size={18} aria-hidden="true" />
        </summary>
        <div className="ew-srcb">
          <WaterAnalysisTable
            source={source}
            onChange={onSourceChange}
            display={{
              ions: start,
              caption:
                state.diRatioPct > 0
                  ? `${source.name} · coupée à ${formatDecimal(Number(state.diRatioPct.toFixed(2)))} % d’osmosée`
                  : source.name,
            }}
          />
          <IonComparison
            start={treatment.startTotal}
            achieved={achievedTotalApresAcide}
            style={style}
            unknownIons={unknownIons}
          />
        </div>
      </details>
      {source.note && <p className="ew-note">{source.note}</p>}
      <WaterVolumes {...model} />
      {sousVolumes}
      <WaterDilution {...model} />
      <WaterAcidity {...model} />
      <button type="button" data-action="onglet-sels" onClick={() => handleStepChange("sels")} className="ew-lien">
        <span>Profil et pesée des sels</span>
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
