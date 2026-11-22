import React from "react";
import { NumberInput } from "../NumberInput";
import { messageRefus, useHoldRepeat } from "../numericInput";
import { SaltId, WaterIons } from "../../types";

import { SaltDef, ION_SYMBOL_SHORT } from "../../domain/water";

import { Minus, Plus } from "lucide-react";

import { SALT_SHORT } from "./constants";
import { actualQuantityMax, actualQuantityProblem } from "../../domain/brewQuantityBounds";

/** VI-9 à la recette (rejeu de 88ebd641) : la même borne que le jour de brassage (500 g, le plancher en grammes d'une micro-brasserie). */
export const SEL_DOSE_MAX_G = actualQuantityMax(0, "g");

/**
 * EAU-SELS-UN-ECRAN (REPRISE-2, 2) : une cellule de 40 px sur téléphone — − [nom / dose g] +. Le nom ouvre la feuille
 * « Minéraux du sel », qui porte aussi l'interrupteur autorisé/écarté (plus d'interrupteur ni de ⓘ dans la cellule).
 * Un sel écarté est grisé et son nom barré.
 */
export const SaltDoseControl: React.FC<{
  id: SaltId;
  def: SaltDef;
  grams: number;
  off: boolean;
  active: boolean;
  selectedIon?: keyof WaterIons | null;
  ions: Array<keyof WaterIons>;
  onEditStart?: () => void;
  onEditEnd?: () => void;
  onDetails: (id: SaltId) => void;
  onDose: (v: number) => void;
  onActivate: (id: SaltId) => void;
}> = ({
  id,
  def,
  grams,
  off,
  active,
  selectedIon = null,
  ions,
  onEditStart,
  onEditEnd,
  onDetails,
  onDose,
  onActivate,
}) => {
  const related = selectedIon != null && ions.includes(selectedIon);
  // La dose d'avant la frappe : une dose refusée la rétablit, comme le message le dit (jamais « conservée » avec 99 999 g dans le champ).
  const avant = React.useRef(grams);
  const [refus, setRefus] = React.useState<string | null>(null);
  const presse = useHoldRepeat(grams, onDose, (from, delta) =>
    Math.max(0, Math.round((from + delta) * 10) / 10),
  );
  const bouton = "w-7 sm:w-9 shrink-0 bg-cave-800 active:bg-cave-700 text-cave-50 flex items-center justify-center disabled:opacity-30";
  return (
    <li
      key={id}
      id={`water-salt-${id}`}
      data-salt-dose={id}
      data-salt-off={off || undefined}
      data-affects-selected-ion={related || undefined}
      onPointerDown={() => onActivate(id)}
      onFocusCapture={(event) => {
        onActivate(id);
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) onEditStart?.();
      }}
      onBlur={(event) => { if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) onEditEnd?.(); }}
      className={`water-salt-cell rounded-control border transition-colors min-w-0 ${
        off
          ? "bg-cave-950/40 border-cave-800 opacity-60"
          : active
            ? "bg-cave-850 border-ebc-straw/60"
            : related
              ? "bg-water/10 border-water/70 ring-1 ring-water/30"
            : grams > 0
              ? "bg-cave-900/80 border-ebc-straw/30"
              : "bg-cave-900/50 border-cave-800"
      }`}
    >
      <div className="water-salt-dose flex items-stretch h-10 sm:h-14">
        <button
          type="button"
          disabled={off || grams <= 0}
          {...presse(-0.5)}
          aria-label={`Retirer 0,5 g de ${def.name}`}
          className={`${bouton} rounded-l-control`}
        >
          <Minus className="w-3 h-3" />
        </button>
        <div className="min-w-0 flex-1 flex flex-col items-stretch justify-center">
          <button
            type="button"
            onClick={() => onDetails(id)}
            aria-label={`Détail des minéraux de ${def.name}`}
            className={`water-salt-name h-4 sm:h-6 !min-h-0 !py-0 flex items-center justify-center gap-1 min-w-0 px-0.5 !text-[11px] sm:!text-sm font-semibold leading-none
              ${off ? "text-cave-400 line-through" : "text-cave-50"}`}
          >
            <span className="truncate">{SALT_SHORT[id]}</span>
            {related && <span className="whitespace-nowrap text-[9px] font-normal leading-none text-water">
              →{ION_SYMBOL_SHORT[selectedIon!]}
            </span>}
          </button>
          <span className="flex items-center justify-center min-w-0 h-6 sm:h-7" onFocus={() => { avant.current = grams; }}>
            <NumberInput
              aria-label={`Dose de ${def.name} en grammes`}
              aria-describedby={refus ? `water-salt-${id}-refus` : undefined}
              min={0}
              max={SEL_DOSE_MAX_G}
              value={grams}
              disabled={off}
              onValue={onDose}
              onRefus={(r) => {
                if (!r) { setRefus(null); return; }
                if (r.saisi > SEL_DOSE_MAX_G) { onDose(avant.current); setRefus(actualQuantityProblem(r.saisi, 0, "g", avant.current)); }
                // BR-85 : « −1 g » ramené à 0 sans un mot. La dose d'avant est rendue et la phrase le dit.
                else if (r.saisi < 0) { onDose(avant.current); setRefus(messageRefus(r.saisi, avant.current, { min: 0, unite: "g" })); }
              }}
              pad
              className="w-full min-w-0 !h-6 sm:!h-7 !min-h-0 !py-0 leading-6 bg-cave-950 border border-cave-700 rounded-sm
                         reading text-base font-semibold text-center focus:outline-none focus:border-ebc-straw disabled:opacity-50
                         [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                         [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span aria-hidden="true" className="shrink-0 pl-0.5 text-[11px] leading-none text-cave-400">g</span>
          </span>
        </div>
        <button
          type="button"
          disabled={off}
          {...presse(0.5)}
          aria-label={`Ajouter 0,5 g de ${def.name}`}
          className={`${bouton} rounded-r-control`}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
      {refus && <p id={`water-salt-${id}-refus`} role="alert" className="px-1 pb-1 text-2xs text-alert-strong">{refus}</p>}
    </li>
  );
};
