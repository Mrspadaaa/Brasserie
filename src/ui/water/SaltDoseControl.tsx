import React from "react";
import { NumberInput } from "../NumberInput";
import { useHoldRepeat } from "../numericInput";
import { SaltId, WaterIons } from "../../types";

import { SaltDef, ION_SYMBOL_SHORT } from "../../domain/water";

import { Minus, Plus, Info } from "lucide-react";

import { SALT_SHORT } from "./constants";
import type { ManualWaterImpact } from "../../domain/water/manualImpact";
import { WaterDoseImpact } from "./WaterDoseImpact";
export const SaltDoseControl: React.FC<{
  id: SaltId;
  def: SaltDef;
  grams: number;
  off: boolean;
  active: boolean;
  ions: Array<keyof WaterIons>;
  impact?: ManualWaterImpact | null;
  onEditStart?: () => void;
  onEditEnd?: () => void;
  onDetails: (id: SaltId) => void;
  onDose: (v: number) => void;
  onToggle: (id: SaltId) => void;
  onActivate: (id: SaltId) => void;
}> = ({
  id,
  def,
  grams,
  off,
  active,
  ions,
  impact,
  onEditStart,
  onEditEnd,
  onDetails,
  onDose,
  onToggle,
  onActivate,
}) => {
  const presse = useHoldRepeat(grams, onDose, (from, delta) =>
    Math.max(0, Math.round((from + delta) * 10) / 10),
  );
  return (
    <li
      key={id}
      onPointerDown={() => onActivate(id)}
      onFocusCapture={(event) => {
        onActivate(id);
        if (event.target instanceof HTMLInputElement) onEditStart?.();
      }}
      onBlur={(event) => { if (event.target instanceof HTMLInputElement) onEditEnd?.(); }}
      className={`p-1 sm:p-2 rounded-control border transition-colors min-w-0 ${
        off
          ? "bg-cave-950/40 border-cave-800"
          : active
            ? "bg-cave-850 border-ebc-straw/60"
            : grams > 0
              ? "bg-cave-900/80 border-ebc-straw/30"
              : "bg-cave-900/50 border-cave-800"
      }`}
    >
      <div className="flex items-center sm:items-start justify-between gap-1 min-w-0">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onDetails(id)}
            aria-label={`Détail des minéraux de ${def.name}`}
            className="flex flex-col justify-center items-start gap-0.5 min-h-11 text-sm font-semibold text-cave-50 text-left"
          >
            <span className="flex items-center gap-1">
              {SALT_SHORT[id]}{" "}
              <Info size={13} className="text-cave-400 shrink-0" />
            </span>
            <span className="block text-2xs font-normal leading-tight text-cave-400">
              {ions.map((ion) => ION_SYMBOL_SHORT[ion]).join(" · ")}{" "}
            </span>
          </button>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={!off}
          aria-label={`${def.name} — ${off ? "écarté" : "autorisé"}`}
          onClick={() => onToggle(id)}
          className="shrink-0 w-11 h-11 flex items-center justify-center rounded-control"
        >
          <span
            className={`block w-7 h-4 rounded-full relative transition-colors ${
              off ? "bg-cave-700" : "bg-hop"
            }`}
          >
            <span
              className="absolute top-0.5 w-3 h-3 rounded-full bg-cave-50 transition-all"
              style={{ left: off ? 2 : 14 }}
            />
          </span>
        </button>
      </div>

      <div className="flex items-stretch mt-1">
        <button
          type="button"
          disabled={off || grams <= 0}
          {...presse(-0.5)}
          aria-label={`Retirer 0.5 g de ${def.name}`}
          className="w-11 h-11 shrink-0 rounded-l-control bg-cave-800 active:bg-cave-700
                         text-cave-50 flex items-center justify-center disabled:opacity-30"
        >
          <Minus className="w-3 h-3" />
        </button>
        <NumberInput
          aria-label={`Dose de ${def.name} en grammes`}
          min={0}
          value={grams}
          disabled={off}
          onValue={onDose}
          pad
          className="w-full min-w-0 h-11 bg-cave-950 border-y border-cave-700
                         reading text-base font-semibold text-center focus:outline-none focus:border-ebc-straw disabled:opacity-50
                         [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                         [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          disabled={off}
          {...presse(0.5)}
          aria-label={`Ajouter 0.5 g de ${def.name}`}
          className="w-11 h-11 shrink-0 rounded-r-control bg-cave-800 active:bg-cave-700
                         text-cave-50 flex items-center justify-center disabled:opacity-30"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
      {impact && <WaterDoseImpact impact={impact} />}
      <p className="pt-1 text-2xs text-cave-400">
        {off
          ? "Écarté du calcul"
          : grams > 0
            ? "À peser · g"
            : "Non utilisé · g"}
      </p>
    </li>
  );
};
