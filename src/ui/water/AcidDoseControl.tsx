import React, { useState } from "react";
import { NumberInput } from "../NumberInput";
import { useHoldRepeat, formatDecimal, messageRefus } from "../numericInput";

import { Minus, Plus } from "lucide-react";

/** TE-31 : un HCO₃ épuisé est 0 ppm (la carte le disait, le résumé écrivait −1,2) : jamais un négatif à l'écran. */
export const hco3Affiche = (v: number): string => formatDecimal(Math.max(0, Math.round(v * 10) / 10));

export const AcidDoseControl: React.FC<{
  label: string;
  /** Libellé court posé devant la dose sur téléphone (« emp. », « rinç. ») ; `label` reste le nom accessible. */
  court?: string;
  name: string;
  unit: string;
  amount: number;
  force: boolean;
  status?: "unknown" | "manual" | "calculated";
  hco3?: number;
  descriptionId?: string;
  disabled?: boolean;
  onDose: (v: number) => void;
  onEditStart?: () => void;
  onEditEnd?: () => void;
}> = ({ label, court, name, unit, amount, force, status, hco3, descriptionId, disabled = false, onDose, onEditStart, onEditEnd }) => {
  const doseStatus = status ?? (force ? "manual" : "calculated");
  // BR-85 : une dose négative est refusée et dite (« −1 mL : une valeur négative n’existe pas ici. La valeur précédente … »).
  const [refus, setRefus] = useState<string | null>(null);
  const presse = useHoldRepeat(amount, onDose, (from, delta) =>
    Math.max(0, Math.round((from + delta) * 10) / 10),
  );
  // EAU-SELS-UN-ECRAN (REPRISE-2, 1) : avec `court`, sur téléphone, une rangée de 32 px — « emp. » sur son unité, − dose + ;
  // le libellé entier reste dans le DOM (ordinateur) et le nom entier reste celui du champ.
  const bouton = `${court ? "w-7 sm:w-6" : "w-6"} min-h-8 shrink-0 bg-cave-800 active:bg-cave-700 text-cave-50 flex items-center justify-center disabled:opacity-30`;
  return (
    <div className="water-acid-dose min-w-0"
      onFocusCapture={(event) => { if (event.target instanceof HTMLInputElement) onEditStart?.(); }}
      onBlur={(event) => { if (event.target instanceof HTMLInputElement) onEditEnd?.(); }}>
      <span className={`${court ? "hidden sm:block" : "block"} text-xs leading-tight text-cave-400`}>
        {label} <span className="sm:hidden">({unit})</span>

        <span className={`hidden sm:inline ${doseStatus === "manual" ? "text-ebc-straw" : "text-cave-400"}`}>
          {" "}
          · {doseStatus === "unknown" ? "à déterminer" : doseStatus === "manual" ? "manuel" : "calculé"} ({unit})
        </span>
      </span>
      <div className={`water-acid-stepper flex items-stretch ${court ? "h-8 sm:h-auto sm:mt-0.5" : "mt-0.5"}`}>
        {court && <span aria-hidden="true"
          className={`water-acid-court sm:hidden shrink-0 flex flex-col justify-center pr-1 text-[11px] leading-[13px] ${doseStatus === "manual" ? "text-ebc-straw" : "text-cave-400"}`}>
          <span>{court}</span><span>{unit}</span>
        </span>}
        <button
          type="button"
          disabled={disabled || !Number.isFinite(amount) || amount <= 0}
          {...presse(-0.5)}
          aria-label={`Retirer 0,5 ${unit} — ${label}`}
          className={`${bouton} rounded-l-control`}
        >
          <Minus className="w-3 h-3" />
        </button>
        <NumberInput
          aria-label={name}
          aria-describedby={descriptionId}
          min={0}
          rejeter
          onRefus={(r) => setRefus(r ? messageRefus(r.saisi, r.retenu, { min: 0, unite: unit }) : null)}
          value={amount}
          disabled={disabled}
          onValue={onDose}
          pad
          className={`w-full min-w-0 h-8 bg-cave-950 border-y reading text-base font-semibold disabled:opacity-50
                      text-center focus:outline-none focus:border-ebc-straw
                      ${force ? "border-ebc-straw/60 text-ebc-straw" : "border-cave-700 text-water"}`}
        />
        <button
          type="button"
          disabled={disabled || !Number.isFinite(amount)}
          {...presse(0.5)}
          aria-label={`Ajouter 0,5 ${unit} — ${label}`}
          className={`${bouton} rounded-r-control`}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
      {refus && <p role="alert" data-role="refus" className="mt-0.5 text-xs leading-4 text-alert-strong">{refus}</p>}
      {hco3 != null && <p aria-label={`HCO₃ après acide — ${label}`}
        className={`${court ? "text-[11px] leading-[14px] sm:mt-0.5 sm:text-xs sm:leading-4" : "mt-0.5 text-xs leading-4"} text-cave-200`}>
        HCO₃ <strong className="tabular-nums text-cave-50">{hco3Affiche(hco3)}</strong> ppm
      </p>}
    </div>
  );
};
