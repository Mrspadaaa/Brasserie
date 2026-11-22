import React from "react";
import { NumberInput } from "../NumberInput";
import { messageRefus, useHoldRepeat } from "../numericInput";
import { SaltId, WaterIons } from "../../types";

import { SaltDef, ION_SYMBOL_SHORT } from "../../domain/water";

import { Minus, Plus, Info } from "lucide-react";

import { SALT_SHORT } from "./constants";
import { actualQuantityMax, actualQuantityProblem } from "../../domain/brewQuantityBounds";

/** VI-9 à la recette (rejeu de 88ebd641) : la même borne que le jour de brassage (500 g, le plancher en grammes d'une micro-brasserie). */
export const SEL_DOSE_MAX_G = actualQuantityMax(0, "g");

/**
 * EAU-SELS-UN-ECRAN (REPRISE-2, 2) puis EAU-SELS-INTERRUPTEUR (22.11, « On peut plus désactiver les sels ??? ») :
 * sa composition choisie (14/15.11) — nom, ⓘ et interrupteur dans chaque cellule, − dose + dessous. Sur téléphone :
 * − [nom ⓘ ⏻ / dose g] +, la ligne du nom et celle de la dose à 24 px (cible de l'interrupteur 24 × 24, DESIGN.md).
 * Le nom (ⓘ) ouvre la feuille « Minéraux du sel » ; l'interrupteur écarte le sel d'un toucher (grisé, nom barré, dose 0).
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
  onToggle: (id: SaltId) => void;
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
  onToggle,
  onActivate,
}) => {
  const related = selectedIon != null && ions.includes(selectedIon);
  // La dose d'avant la frappe : une dose refusée la rétablit, comme le message le dit (jamais « conservée » avec 99 999 g dans le champ).
  const avant = React.useRef(grams);
  const [refus, setRefus] = React.useState<string | null>(null);
  const presse = useHoldRepeat(grams, onDose, (from, delta) =>
    Math.max(0, Math.round((from + delta) * 10) / 10),
  );
  const bouton = "w-6 sm:w-9 shrink-0 bg-cave-800 active:bg-cave-700 text-cave-50 flex items-center justify-center disabled:opacity-30";
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
      <div className="water-salt-dose flex items-stretch h-12 sm:h-14">
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
          {/* `!h-6` : `.recipe-wizard button` impose height: auto (spécificité 0,1,1) ; la cible de l'interrupteur tient ses 24 × 24 px. */}
          <div className="flex items-center h-6 shrink-0 min-w-0">
            <button
              type="button"
              onClick={() => onDetails(id)}
              aria-label={`Détail des minéraux de ${def.name}`}
              className={`water-salt-name !h-6 !min-h-0 !py-0 flex-1 flex items-center justify-center gap-0.5 min-w-0 pl-0.5 pr-0 !text-[11px] sm:!text-sm font-semibold leading-none
                ${off ? "text-cave-400 line-through" : "text-cave-50"}`}
            >
              <span className="truncate">{SALT_SHORT[id]}</span>
              <Info aria-hidden="true" className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 text-cave-400" />
              {related && <span className="whitespace-nowrap text-[9px] font-normal leading-none text-water">
                →{ION_SYMBOL_SHORT[selectedIon!]}
              </span>}
            </button>
            <button
              type="button"
              role="switch"
              aria-checked={!off}
              aria-label={`${def.name} — ${off ? "écarté" : "autorisé"}`}
              title={off ? "Écarté : « Doser » ne l'utilise pas" : "Autorisé : toucher pour l'écarter"}
              onClick={() => onToggle(id)}
              className="water-salt-switch w-6 !h-6 sm:w-8 !min-h-0 !p-0 shrink-0 flex items-center justify-center rounded-control"
            >
              <span aria-hidden="true" className={`block w-[22px] h-3 rounded-full relative transition-colors ${off ? "bg-cave-700" : "bg-hop"}`}>
                <span className="absolute top-0.5 w-2 h-2 rounded-full bg-cave-50 transition-all" style={{ left: off ? 2 : 12 }} />
              </span>
            </button>
          </div>
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
