import React, { useState } from "react";
import { NumberInput } from "../NumberInput";
import { useHoldRepeat, formatDecimal, messageRefus } from "../numericInput";

import { Minus, Plus } from "lucide-react";

/** TE-31 : un HCO₃ épuisé est 0 ppm (la carte le disait, le résumé écrivait −1,2) : jamais un négatif à l'écran. */
export const hco3Affiche = (v: number): string => formatDecimal(Math.max(0, Math.round(v * 10) / 10));

export const AcidDoseControl: React.FC<{
  label: string;
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
}> = ({ label, name, unit, amount, force, status, hco3, descriptionId, disabled = false, onDose, onEditStart, onEditEnd }) => {
  const doseStatus = status ?? (force ? "manual" : "calculated");
  // BR-85 : une dose négative est refusée et dite (« −1 mL : une valeur négative n’existe pas ici. La valeur précédente … »).
  const [refus, setRefus] = useState<string | null>(null);
  const presse = useHoldRepeat(amount, onDose, (from, delta) =>
    Math.max(0, Math.round((from + delta) * 10) / 10),
  );
  return (
    <div className="water-acid-dose min-w-0"
      onFocusCapture={(event) => { if (event.target instanceof HTMLInputElement) onEditStart?.(); }}
      onBlur={(event) => { if (event.target instanceof HTMLInputElement) onEditEnd?.(); }}>
      <span className="block text-xs leading-tight text-cave-400">
        {label} <span className="sm:hidden">({unit})</span>

        <span className={`hidden sm:inline ${doseStatus === "manual" ? "text-ebc-straw" : "text-cave-400"}`}>
          {" "}
          · {doseStatus === "unknown" ? "à déterminer" : doseStatus === "manual" ? "manuel" : "calculé"} ({unit})
        </span>
      </span>
      <div className="flex items-stretch mt-0.5">
        <button
          type="button"
          disabled={disabled || !Number.isFinite(amount) || amount <= 0}
          {...presse(-0.5)}
          aria-label={`Retirer 0,5 ${unit} — ${label}`}
          className="w-6 min-h-8 shrink-0 rounded-l-control bg-cave-800 active:bg-cave-700
                     text-cave-50 flex items-center justify-center disabled:opacity-30"
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
          className="w-6 min-h-8 shrink-0 rounded-r-control bg-cave-800 active:bg-cave-700
                     text-cave-50 flex items-center justify-center disabled:opacity-30"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
      {refus && <p role="alert" data-role="refus" className="mt-0.5 text-xs leading-4 text-alert-strong">{refus}</p>}
      {hco3 != null && <p aria-label={`HCO₃ après acide — ${label}`} className="mt-0.5 text-xs leading-4 text-cave-200">
        HCO₃ <strong className="tabular-nums text-cave-50">{hco3Affiche(hco3)}</strong> ppm
      </p>}
    </div>
  );
};
