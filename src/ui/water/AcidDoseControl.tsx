import React from "react";
import { NumberInput } from "../NumberInput";
import { useHoldRepeat } from "../numericInput";

import { Minus, Plus } from "lucide-react";

export const AcidDoseControl: React.FC<{
  label: string;
  name: string;
  unit: string;
  amount: number;
  force: boolean;
  disabled?: boolean;
  onDose: (v: number) => void;
  onEditStart?: () => void;
  onEditEnd?: () => void;
}> = ({ label, name, unit, amount, force, disabled = false, onDose, onEditStart, onEditEnd }) => {
  const presse = useHoldRepeat(amount, onDose, (from, delta) =>
    Math.max(0, Math.round((from + delta) * 10) / 10),
  );
  return (
    <div className="water-acid-dose min-w-0"
      onFocusCapture={(event) => { if (event.target instanceof HTMLInputElement) onEditStart?.(); }}
      onBlur={(event) => { if (event.target instanceof HTMLInputElement) onEditEnd?.(); }}>
      <span className="block text-2xs leading-tight text-cave-400">
        {label} <span className="sm:hidden">({unit})</span>

        <span className={`hidden sm:inline ${force ? "text-ebc-straw" : "text-cave-400"}`}>
          {" "}
          · {force ? "manuel" : "calculé"} ({unit})
        </span>
      </span>
      <div className="flex items-stretch mt-0.5">
        <button
          type="button"
          disabled={disabled || amount <= 0}
          {...presse(-0.5)}
          aria-label={`Retirer 0.5 ${unit} — ${label}`}
          className="w-11 h-11 shrink-0 rounded-l-control bg-cave-800 active:bg-cave-700
                     text-cave-50 flex items-center justify-center disabled:opacity-30"
        >
          <Minus className="w-3 h-3" />
        </button>
        <NumberInput
          aria-label={name}
          min={0}
          value={amount}
          disabled={disabled}
          onValue={onDose}
          pad
          className={`w-full min-w-0 h-11 bg-cave-950 border-y reading text-base font-semibold disabled:opacity-50
                      text-center focus:outline-none focus:border-ebc-straw
                      ${force ? "border-ebc-straw/60 text-ebc-straw" : "border-cave-700 text-water"}`}
        />
        <button
          type="button"
          disabled={disabled}
          {...presse(0.5)}
          aria-label={`Ajouter 0.5 ${unit} — ${label}`}
          className="w-11 h-11 shrink-0 rounded-r-control bg-cave-800 active:bg-cave-700
                     text-cave-50 flex items-center justify-center disabled:opacity-30"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
