import React, { useId, useState } from 'react';
import type { TrialRecipe } from '../../domain/hopIndex/trials';
import type { ListedStyle } from '../../domain/brewingStyles';
import { mashProgramForStyle, fermentProgramForStyle } from '../../domain/brewPrograms';
import { HopSourceLink } from '../hopIndex/HopTechnicalPanel';
import { Button } from '../../components/ui/Button';
import { plageEbc, positionDansPlage, texteSuisse, type PositionPlage } from './plages';

export interface ValeursRecette { og?: number | null; ibu?: number | null; fg?: number | null; abv?: number | null; ebc?: number | null }

const CHEVRON = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
);
const fleche = (p: PositionPlage) => (p === 'sous' ? ' sous ↓' : p === 'au-dessus' ? ' au-dessus ↑' : '');

function Pastille({ nom, texte, position }: { nom: string; texte: string; position: PositionPlage }) {
  return (
    <span className={`idn-pl${position === 'sous' || position === 'au-dessus' ? ' idn-hs' : ''}`}>
      {nom} <b>{texte}</b>{fleche(position)}
    </span>
  );
}

/**
 * Les plages du style sous le style (r4-a) : OG et IBU en pastilles, « Repères ⌄ » pour le reste (FG, alcool, EBC,
 * source) et pour les propositions d'empâtage et de conduite du style, qui vivaient dans « Repères du style ».
 * Une plage que la recette manque passe en ambre avec sa flèche ; la recette garde ses valeurs au bandeau.
 */
export function PlagesStyle({ recipe, style, styles, onChange, valeurs }: {
  recipe: TrialRecipe;
  style: ListedStyle | undefined;
  styles: ListedStyle[];
  onChange?: (r: TrialRecipe) => void;
  valeurs: ValeursRecette;
}) {
  const [ouvert, setOuvert] = useState(false);
  const idReperes = useId();
  if (!style) {
    return recipe.styleRef ? <p className="text-xs text-cave-400">Édition du style conservée indisponible : paramètres personnels conservés.</p> : null;
  }
  const s = style.stats;
  const ebc = plageEbc(s.srm);
  const sug = style.suggestions;
  const mash = sug?.mash ? mashProgramForStyle(style.name, style.ref, styles) : undefined;
  const conduite = sug?.fermentation ? fermentProgramForStyle(style.name, style.ref, styles) : undefined;
  return (
    <>
      <div className="idn-plages" data-element="r4a-plages" role="group" aria-label="Plages du style">
        {s.og && <Pastille nom="OG" texte={texteSuisse(s.og, 3)} position={positionDansPlage(valeurs.og, s.og)} />}
        {s.ibu && <Pastille nom="IBU" texte={texteSuisse(s.ibu)} position={positionDansPlage(valeurs.ibu, s.ibu)} />}
        <button type="button" className="idn-rep" aria-expanded={ouvert} aria-controls={idReperes} data-role="repbtn" onClick={() => setOuvert((o) => !o)}>
          Repères {CHEVRON}
        </button>
      </div>
      <div id={idReperes} className="idn-reps" data-role="reps" data-element="r4a-reperes" hidden={!ouvert}>
        <div className="idn-reps-ligne">
          {s.fg && <Pastille nom="FG" texte={texteSuisse(s.fg, 3)} position={positionDansPlage(valeurs.fg, s.fg)} />}
          {s.abv && <Pastille nom="Alcool" texte={`${texteSuisse(s.abv)} %`} position={positionDansPlage(valeurs.abv, s.abv)} />}
          {ebc && <Pastille nom="EBC" texte={texteSuisse(ebc)} position={positionDansPlage(valeurs.ebc, ebc)} />}
          <span className="idn-src">{style.code} · {style.edition}</span>
        </div>
        <HopSourceLink source={style.source} />
        {recipe.nolo?.enabled && <p className="text-xs text-cave-400">Ces plages décrivent le style de référence. Ton objectif d’alcool reste celui du mode NOLO.</p>}
        {onChange && !recipe.nolo?.enabled && (
          <div className="flex flex-col gap-2">
            {mash && <Button onClick={() => onChange({ ...recipe, mash: { ...recipe.mash, steps: structuredClone(mash.steps) } })}>Proposer l’empâtage « {mash.name} »</Button>}
            {conduite && <Button onClick={() => onChange({ ...recipe, fermentation: structuredClone(conduite.steps), yeastGuide: undefined })}>Proposer la conduite « {conduite.name} »</Button>}
            <p className="text-xs text-cave-400">{sug?.fermentation ? 'Points de départ de L’Affinée : les adapter à la souche choisie.' : 'Ce style appelle une conduite spécifique à définir avec la souche et le procédé.'}</p>
          </div>
        )}
      </div>
    </>
  );
}
