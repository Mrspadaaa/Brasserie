import React, { useMemo, useState } from 'react';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import { noloScience } from '../domain/noloScience';
import { useStorageValue } from '../hooks/useLiveData';
import { StorageService } from '../services/storage';
import { applyCatalogueYeast } from '../domain/yeastCatalogue';
import { Input } from './Input';
import { inputClass } from './FormNav';
import { NoloRecipeSimulator } from './NoloRecipeSimulator';
import { YeastCataloguePanel } from './YeastCataloguePanel';
import { NoloPanel } from './NoloPanel';

/** The yeast step and identity step share one goal-driven simulator. */
export function NoloFermentationWorkshop({ recipe, onChange, variant = false }: { recipe: TrialRecipe; onChange: (r: TrialRecipe) => void; variant?: boolean }) {
  const saved = useStorageValue(StorageService.getHopKnowledge);
  const science = useMemo(() => recipe.nolo?.scienceSnapshot ?? noloScience(saved), [recipe.nolo?.scienceSnapshot, saved]);
  const [catalogue, setCatalogue] = useState(false);
  const intent = recipe.fermentationIntent ?? { version: 1 as const, aroma: '', fruit: '', acidity: '' };
  return <section aria-label="Atelier des arômes de levure" className="space-y-2">
    <h3 className="text-sm font-semibold text-cave-50">Levure et conduite NOLO</h3>
    {science ? <NoloRecipeSimulator recipe={recipe} onChange={onChange} science={science} saved={saved} variant={variant}/>
      : <p role="alert" className="nolo-error">Références NOLO indisponibles : compléter les données de fermentation.</p>}
    <details><summary className="min-h-touch cursor-pointer text-xs text-cave-200">Profil aromatique, fruit et acidité</summary>
      <div className="grid gap-2 py-1">{(['aroma', 'fruit', 'acidity'] as const).map(key => <label key={key} className="text-xs text-cave-200">
        {{ aroma: 'Profil recherché, libre', fruit: 'Fruit et apport envisagé', acidity: 'Acidité et méthode envisagée' }[key]}
        <Input className={inputClass} value={intent[key]} maxLength={1000} onChange={event => onChange({ ...recipe, fermentationIntent: { ...intent, [key]: event.target.value } })}/>
      </label>)}<p className="text-xs text-cave-400">Le profil recherché classe les souches documentées. Saisir les fruits et leurs doses dans les ingrédients pour calculer leur contribution.</p></div>
    </details>
    <details onToggle={event => setCatalogue(event.currentTarget.open)}><summary className="min-h-touch cursor-pointer text-xs text-cave-200">Catalogue complet des levures</summary>
      {catalogue && <YeastCataloguePanel selectedId={recipe.yeast.hopIndexId} initialForm={recipe.yeast.form} onSelect={(yeast, form) => onChange(applyCatalogueYeast(recipe, yeast, form))}/>}
    </details>
    <details><summary className="min-h-touch cursor-pointer text-xs text-cave-200">Analyses et suivi NOLO</summary>
      <NoloPanel recipe={recipe} onChange={onChange} hideStrainPicker measurementOnly showOverview={false}/>
    </details>
  </section>;
}
