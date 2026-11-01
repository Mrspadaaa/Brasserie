import React, { useState } from 'react';
import type { Fermentable } from '../../types';
import { applyMaltFacts, factsForStock, ingredientGaps, type LearnIngredient } from '../../domain/ingredientFacts';
import { maltGrade } from '../../domain/beerColor';
import { NumberInput } from '../NumberInput';
import { formatDecimal } from '../numericInput';
import { AiAssist } from '../AiAssist';

/**
 * La fiche technique du malt de la ligne choisie, une ligne discrète DANS son plateau : « PPG — · fiche › » (D226). Un toucher l'ouvre :
 * couleur et potentiel (PPG) se corrigent, l'assistant de fiche (AiAssist, à la demande, jamais lancé seul) les retrouve et les apprend
 * au stock (`onLearnIngredient`). Sans PPG la recette n'a pas d'OG : il se renseigne ici, depuis la recette. Un PPG inconnu s'écrit « — », jamais 0.
 */
export const Fiche: React.FC<{
  malt: Fermentable;
  onChange: (patch: Partial<Fermentable>) => void;
  onLearnIngredient?: LearnIngredient;
}> = ({ malt, onChange, onLearnIngredient }) => {
  const [ouverte, setOuverte] = useState(false);
  const grade = maltGrade(malt.colorEbc);
  const manque = ingredientGaps([malt], [], { name: '' } as never)[0]?.missing ?? [];
  const ppg = malt.potentialPpg != null ? formatDecimal(malt.potentialPpg) : '—';
  return (
    <div className="fer-fi" data-role="fiche-zone">
      <button type="button" className="fer-fi-bt" data-role="fiche" aria-expanded={ouverte} aria-label={`Fiche technique de ${malt.name} : PPG ${ppg}`}
        onClick={() => setOuverte((o) => !o)}>
        <span>PPG <b>{ppg}</b> · fiche</span><i aria-hidden="true">›</i>
      </button>
      {ouverte && (
        <div className="fer-fi-corps">
          <div className="fer-fi-champs">
            {([
              { key: 'colorEbc', label: 'Couleur', unit: 'EBC', max: 5000, min: 0 },
              { key: 'potentialPpg', label: 'Potentiel', unit: 'PPG', max: 50, min: 1 },
            ] as const).map((c) => (
              <label key={c.key}>
                {c.label}
                <NumberInput
                  value={malt[c.key]} emptyValue={undefined} min={c.min} max={c.max}
                  aria-label={`${c.label} de ${malt.name} en ${c.unit}`}
                  onValue={(v) => onChange({ [c.key]: v })}
                  className="w-14 min-h-touch-sm px-1 text-base rounded-control border border-cave-700 bg-cave-950 text-cave-50 text-right font-mono focus:border-ebc-straw focus:outline-none"
                />
                {c.unit}
              </label>
            ))}
            {grade && <span className="fer-fi-classe">{grade.label}</span>}
          </div>
          <AiAssist
            kind="malt" name={malt.name} missing={manque} sansExplication
            onApply={(facts) => {
              const suite = applyMaltFacts(malt, facts);
              onChange({ colorEbc: suite.colorEbc, potentialPpg: suite.potentialPpg });
              onLearnIngredient?.(malt.name, { ...factsForStock('malt', facts), ...(malt.stockItemRef ? { ref: malt.stockItemRef } : {}) });
            }}
          />
        </div>
      )}
    </div>
  );
};
