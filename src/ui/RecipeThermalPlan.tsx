import React from 'react';
import type { Recipe, RecipeSnapshot } from '../types';
import { recipeThermalPlan, withoutMashout } from '../domain/recipeThermalPlan';
import { pitchingPlan } from '../domain/pitchingPlan';
import './recipe-installation.css';

export function RecipeThermalPlan({recipe,onChange}:{recipe:Recipe | RecipeSnapshot;onChange?:(recipe:Recipe)=>void}) {
  const plan = recipeThermalPlan(recipe);
  const pitch = pitchingPlan(recipe as RecipeSnapshot);
  if (!plan.rows.length) return null;
  return <section className="recipe-installation" aria-label="Temps et conduite du brassage">
    <h3>Temps et conduite</h3>
    <div className="recipe-thermal-table" role="table" aria-label="Montées et maintiens prévus">
      <div role="row" className="recipe-thermal-row"><span role="columnheader">Palier</span><span role="columnheader">Montée</span><span role="columnheader">Maintien</span></div>
      {plan.rows.map((row,i)=><div role="row" className="recipe-thermal-row" key={`${i}-${row.name}`}>
        <span role="cell">{row.name}<small>{row.tempC != null ? `${row.fromC != null ? `${row.fromC} → ` : ''}${row.tempC} °C` : 'Température à renseigner'}</small></span>
        <span role="cell">{row.rampMin != null ? `≈ ${Math.ceil(row.rampMin)} min` : row.tempC == null || (i > 0 && row.fromC == null) ? 'À renseigner' : 'À mesurer'}</span>
        <span role="cell">{row.durationMin != null ? `${row.durationMin} min` : 'À renseigner'}</span>
      </div>)}
    </div>
    <p>{plan.holdMin != null ? `${plan.holdMin} min de maintien` : 'Durées de maintien à renseigner'}{plan.rampMin != null ? ` + ≈ ${Math.ceil(plan.rampMin)} min de montées entre paliers` : plan.rows.some(row => row.tempC == null) ? ' + températures de montée à renseigner' : ' + montées à mesurer'}. Chauffe initiale et refroidissement en plus.</p>
    <p className="recipe-installation-muted">{plan.rate != null ? `Repère de chauffe : ${Number(plan.rate.toFixed(2)).toLocaleString('fr-CH')} °C/min, à confirmer pour ce volume et cette plage. ` : ''}Les maintiens commencent à température atteinte.</p>
    {plan.canConsiderSkipping && <details><summary>Comparer sans mash-out</summary>
      <p>{plan.beforeFiltrationSavedMin != null ? `Filtration possible ≈ ${Math.ceil(plan.beforeFiltrationSavedMin)} min plus tôt selon ce repère. ` : ''}La chauffe vers l’ébullition reste nécessaire : ce n’est pas un gain garanti sur toute la journée.</p>
      <p>À envisager avec conversion terminée et filtration fluide. Le traitement thermique change ; son effet sur la bière n’est pas chiffré.</p>
      <a href="https://howtobrew.com/section-3/chapter-17/" target="_blank" rel="noreferrer">Repères de Palmer</a>
      {onChange && <button type="button" onClick={()=>onChange(withoutMashout(recipe) as Recipe)}>Choisir le programme sans mash-out</button>}
    </details>}
    {recipe.mash?.mashoutEnabled === false && <p>Programme sans mash-out choisi.{onChange && <button type="button" onClick={()=>onChange({...recipe,mash:{...recipe.mash!,mashoutEnabled:true}} as Recipe)}>Rétablir le mash-out</button>}</p>}
    <details><summary>Refroidissement et ajout de levure{pitch.targetC != null && Number.isFinite(pitch.targetC) ? ` · ${pitch.targetC} °C prévus` : ' · cible à renseigner'}</summary>
      <p>Le temps dépend de la température de départ et de tes relevés. Le suivi du jour estimera chaque méthode séparément.</p>
      <ul>{pitch.choices.map(choice=><li key={choice.id}><strong>{choice.label}</strong><span>{choice.reason}</span></li>)}</ul>
    </details>
  </section>;
}
