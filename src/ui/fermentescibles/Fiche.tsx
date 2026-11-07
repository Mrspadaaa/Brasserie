import React, { useState } from 'react';
import type { Fermentable } from '../../types';
import { applyMaltFacts, factsForStock, ingredientGaps, type LearnIngredient } from '../../domain/ingredientFacts';
import { maltGrade } from '../../domain/beerColor';
import { Input } from '../Input';
import { formatDecimal } from '../numericInput';
import { AiAssist } from '../AiAssist';
import { lit } from './modele';

/**
 * Un nombre de la fiche, borné (banc d'actionneurs N5) : une valeur hors de [min, max], négative (« -1 ») ou illisible n'est PAS retenue ; le champ la garde lisible
 * et se marque invalide (`aria-invalid`, trait et chiffre rouges, infobulle des bornes). Quitter le champ rend la valeur retenue. Vide : « non renseigné », jamais 0.
 * Jamais `type="number"` : le composant protégé `Input`.
 */
const ChampFiche: React.FC<{ valeur: number | undefined; min: number; max: number; unite: string; libelle: string; onValue: (v: number | undefined) => void }> = ({ valeur, min, max, unite, libelle, onValue }) => {
  const [texte, setTexte] = useState<string | null>(null);
  const [ko, setKo] = useState(false);
  const affiche = texte ?? (valeur != null ? formatDecimal(valeur) : '');
  return (
    <Input
      type="text" inputMode="decimal" enterKeyHint="next" autoComplete="off" aria-label={libelle}
      aria-invalid={ko || undefined} title={ko ? `De ${min} à ${max} ${unite}` : undefined}
      value={affiche}
      onFocus={(e) => { setTexte(affiche); e.currentTarget.select(); }}
      onChange={(e) => {
        const t = e.target.value, s = t.trim();
        setTexte(t);
        if (!s) { setKo(false); onValue(undefined); return; }
        const v = lit(s);
        const bon = v !== null && !/^[-−–]/.test(s) && v >= min && v <= max;
        setKo(!bon);
        if (bon) onValue(Math.round((v as number) * 10) / 10);
      }}
      onBlur={() => { setTexte(null); setKo(false); }}
      className={`fer-fi-in${ko ? ' fer-ko' : ''} w-14 min-h-touch-sm px-1 text-base rounded-control border border-cave-700 bg-cave-950 text-cave-50 text-right font-mono focus:border-ebc-straw focus:outline-none`}
    />
  );
};

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
              { key: 'colorEbc', label: 'Couleur', unit: 'EBC', max: 1500, min: 1 },
              { key: 'potentialPpg', label: 'Potentiel', unit: 'PPG', max: 50, min: 1 },
            ] as const).map((c) => (
              <label key={c.key}>
                {c.label}
                <ChampFiche valeur={malt[c.key]} min={c.min} max={c.max} unite={c.unit} libelle={`${c.label} de ${malt.name} en ${c.unit}`}
                  onValue={(v) => onChange({ [c.key]: v })} />
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
