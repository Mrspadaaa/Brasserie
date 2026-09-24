import React from 'react';
import type { Recipe, BrewhouseProfile } from '../types';
import { fermenterRecommendation } from '../domain/fermenterPlanning';
import { equipmentCheck } from '../domain/brewEquipment';
import { NumberInput } from './NumberInput';
import { inputClass } from './FormNav';
import './recipe-installation.css';

export function RecipeInstallationChoice({recipe,profile,onChange}:{recipe:Recipe;profile?:BrewhouseProfile;onChange:(recipe:Recipe)=>void}) {
  const rig=recipe.brewhouse ?? profile, e=rig?.equipment;
  if(!e) return null;
  const recommendation=fermenterRecommendation(recipe,e);
  const grain=(recipe.fermentables??[]).filter(f=>f.kind==='grain'&&f.use==='empatage').reduce((s,f)=>s+f.weightKg,0);
  const check=equipmentCheck(e,{volumeL:recipe.volumeL,grainKg:grain,mashL:recipe.waterPlan?.mashWaterL??0,spargeL:recipe.waterPlan?.spargeWaterL??0,preBoilHotL:recipe.preBoilHotL,preferences:rig?.preferences,fermenterHeadspacePct:recommendation?.headspacePct});
  const patch=(installation:NonNullable<Recipe['installation']>)=>onChange({...recipe,installation:{...recipe.installation,...installation}});
  const hotSparge=check?.spargeHotL ?? 0;
  const preferred=check?.spargePreferredHotL;
  const maximum=check?.spargeMaximumHotL;
  const volumeKnown=Number.isFinite(recipe.volumeL) && recipe.volumeL>0;
  return <section className="recipe-installation" aria-label="Choix pour cette installation">
    <h3>Choix pour ce brassin</h3>
    <p><strong>{volumeKnown ? `${recipe.volumeL} / ${e.fermenterCapacityL} L` : 'Volume à renseigner'}</strong> · {volumeKnown ? `${Math.max(0,e.fermenterCapacityL-recipe.volumeL).toLocaleString('fr-CH',{maximumFractionDigits:1})} L libres.` : 'Espace libre inconnu.'}</p>
    {recommendation && <><p>{recommendation.reason}</p><div className="recipe-installation-fields">
      <label>Espace libre choisi (%)<NumberInput aria-label="Espace libre choisi pour cette recette (%)" className={inputClass} value={recipe.installation?.fermenterHeadspacePct ?? recommendation.headspacePct} min={0} max={99} emptyValue={undefined} onValue={value=>patch({fermenterHeadspacePct:value})}/></label>
      <div><small>Remplissage conseillé</small><p className="reading">{recommendation.recommendedFillL} L</p></div>
    </div>{recipe.installation?.fermenterHeadspacePct != null && <button type="button" onClick={()=>{ const installation={...recipe.installation}; delete installation.fermenterHeadspacePct;delete installation.headspaceReason;onChange({...recipe,installation}); }}>Reprendre le conseil de la levure</button>}</>}
    {check?.fermenterTooFull && <p role="alert">Le volume atteint ou dépasse la capacité physique du fermenteur. Réduis la cible.</p>}
    {preferred != null && hotSparge > preferred+1e-8 && <div>
      <p>{hotSparge.toLocaleString('fr-CH',{maximumFractionDigits:1})} L de rinçage à chaud, au-dessus des {preferred} L habituels.</p>
      {maximum != null && !check?.spargeTooMuch ? <label className="flex items-center gap-2 min-h-touch text-xs"><input type="checkbox" checked={!!recipe.installation?.spargeExceptionAccepted} onChange={event=>patch({spargeExceptionAccepted:event.target.checked})}/>Prévoir le complément avec la bouilloire annexe pour cette recette</label> : <p role="alert">Le maximum exceptionnel de {maximum} L est dépassé : revois la répartition ou réduis le brassin.</p>}
    </div>}
  </section>;
}
