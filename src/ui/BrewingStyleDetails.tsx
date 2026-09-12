import React, { useMemo } from 'react';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import { brewingStyles, resolveBrewingStyle } from '../domain/brewingStyles';
import { mashProgramForStyle, fermentProgramForStyle } from '../domain/brewPrograms';
import { StorageService } from '../services/storage';
import { useStorageValue } from '../hooks/useLiveData';
import { HopSourceLink } from './hopIndex/HopTechnicalPanel';
import { Button } from '../components/ui/Button';

/** Factual style identity is separate from optional, explicit recipe suggestions. */
export function BrewingStyleDetails({recipe,onChange}:{recipe:TrialRecipe;onChange?:(r:TrialRecipe)=>void}) {
  const saved=useStorageValue(StorageService.getHopKnowledge);
  const styles=useMemo(()=>brewingStyles(saved),[saved]);
  const style=resolveBrewingStyle(recipe.style,recipe.styleRef,styles);
  if(!style)return recipe.styleRef?<p className="text-xs text-cave-400">Édition du style conservée indisponible : paramètres personnels conservés.</p>:null;
  const mash=mashProgramForStyle(style.name,style.ref,styles),ferment=fermentProgramForStyle(style.name,style.ref,styles);
  const labels={og:'OG · SG',fg:'FG · SG',abv:'Alcool · % vol.',ibu:'IBU',srm:'Couleur · SRM'};
  return <details className="text-sm min-w-0"><summary className="min-h-touch cursor-pointer text-water">Repères du style · {style.code} · {style.edition}</summary>
    <div className="space-y-3 py-2">
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">{Object.entries(style.stats).map(([k,r])=><div key={k}><dt className="text-cave-400">{labels[k]}</dt><dd className="font-mono text-cave-100">{r.min.toLocaleString('fr')}–{r.max.toLocaleString('fr')}</dd></div>)}</dl>
      {recipe.nolo?.enabled&&<p className="text-xs text-cave-400">Ces plages décrivent le style de référence. Ton objectif d’alcool reste celui du mode NOLO.</p>}
      <HopSourceLink source={style.source}/>
      {onChange&&!recipe.nolo?.enabled&&<div className="flex flex-col gap-2">
        {style.suggestions?.mash&&<Button onClick={()=>onChange({...recipe,mash:{...recipe.mash,steps:structuredClone(mash.steps)}})}>Proposer l’empâtage « {mash.name} »</Button>}
        {style.suggestions?.fermentation&&<Button onClick={()=>onChange({...recipe,fermentation:structuredClone(ferment.steps),yeastGuide:undefined})}>Proposer la conduite « {ferment.name} »</Button>}
        <p className="text-xs text-cave-400">{style.suggestions?.fermentation?'Points de départ de L’Affinée : les adapter à la souche choisie.':'Ce style appelle une conduite spécifique à définir avec la souche et le procédé.'}</p>
      </div>}
    </div>
  </details>;
}
