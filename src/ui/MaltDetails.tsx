import React from 'react';
import { Fermentable } from '../types';
import { maltGrade } from '../domain/beerColor';
import {
  applyMaltFacts,
  factsForStock,
  ingredientGaps,
  LearnIngredient
} from '../domain/ingredientFacts';
import { NumberInput } from './NumberInput';
import { formatDecimal } from './numericInput';
import { AiAssist } from './AiAssist';

/** Technical data stay editable, including after an AI lookup. */
export function MaltDetails({
  malt,
  onChange,
  onLearnIngredient
}: {
  malt: Fermentable;
  onChange: (patch: Partial<Fermentable>) => void;
  onLearnIngredient?: LearnIngredient;
}) {
  const grade = maltGrade(malt.colorEbc);
  const missing = ingredientGaps([malt], [], { name: '' } as any)[0]?.missing ?? [];
  return (
    <details className="text-sm mt-1" aria-label={`Fiche technique de ${malt.name}`}>
      <summary className="cursor-pointer w-fit min-h-touch-sm rounded-control border border-cave-700 px-2 py-1.5 text-cave-200 marker:text-cave-400">
        <span className={grade?.tone}>
          {grade ? `${grade.label} · ${formatDecimal(malt.colorEbc)} EBC` : 'Couleur à renseigner'}
        </span>
        <span className="text-cave-400"> · modifier</span>
      </summary>
      <div className="pt-2 pb-1 space-y-2">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {(
            [
              { key: 'colorEbc', label: 'Couleur', unit: 'EBC', max: 5000, min: 0 },
              { key: 'potentialPpg', label: 'Potentiel', unit: 'PPG', max: 50, min: 1 }
            ] as const
          ).map((field) => (
            <label key={field.key} className="flex items-center gap-1 min-w-0 text-cave-400">
              {field.label}
              <NumberInput
                value={malt[field.key]}
                emptyValue={undefined}
                min={field.min}
                max={field.max}
                aria-label={`${field.label} de ${malt.name} en ${field.unit}`}
                onValue={(value) => onChange({ [field.key]: value })}
                className="w-14 min-h-touch-sm px-1 text-base rounded-control border border-cave-700 bg-cave-950 text-cave-50 text-right font-mono focus:border-ebc-straw focus:outline-none"
              />
              {field.unit}
            </label>
          ))}
        </div>
        <AiAssist
          kind="malt"
          name={malt.name}
          missing={missing}
          onApply={(facts) => {
            const next = applyMaltFacts(malt, facts);
            onChange({ colorEbc: next.colorEbc, potentialPpg: next.potentialPpg });
            onLearnIngredient?.(malt.name, factsForStock('malt', facts));
          }}
        />
      </div>
    </details>
  );
}
