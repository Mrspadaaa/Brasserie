import React, { useState } from 'react';
import type { StockItem } from '../../types';
import type { HopVariety } from '../../../functions/src/hopIndexSchema';
import { Combobox } from '../Combobox';
import { useHopCatalogue } from './useHopCatalogue';
import { CLES_RECHERCHE, optionsReference, optionsStock } from './pickerOptions';
import { hopFitsStyle, hopRecipeStyle } from '../../domain/hopRecipeDesign';
import type { TrialRecipe } from '../../domain/hopIndex/trials';

/** Stock and documentary references remain distinct, but share the same search field. */
export function HopIngredientPicker({ items, onChange, onReference, onCreate, placeholder, ariaLabel, onBusyChange, recipe }: {
  items: StockItem[]; onChange: (name: string, item?: StockItem) => void;
  onReference: (variety: HopVariety) => void; onCreate: (name: string) => void;
  placeholder: string; ariaLabel: string; onBusyChange?: (busy: boolean) => void;
  recipe?: TrialRecipe;
}) {
  const { varieties, error: catalogueError } = useHopCatalogue();
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [all, setAll] = useState(false);
  const style = recipe && hopRecipeStyle(recipe);
  const byStyle = style && style.family !== 'unknown';
  const fitsStyle = (v: HopVariety) => !!style && hopFitsStyle(v.name, style.family, v.aliases, recipe?.style);
  const stock = items.filter(i => i.category.toLocaleLowerCase('fr') === 'houblon');
  const options = [...optionsStock(stock),
    ...optionsReference(varieties.filter(v => !v.archived && (!byStyle || all || fitsStyle(v))), v => byStyle && fitsStyle(v) ? `Repères · ${style.name}` : 'Catalogue · autres usages')];
  return <div className="space-y-1"><Combobox compact value="" disabled={busy} options={options} searchKeys={CLES_RECHERCHE} ariaLabel={ariaLabel} placeholder={placeholder}
    allowCreate onCreate={onCreate} createLabel={name => `Créer « ${name} » (stock à zéro)`} onChange={value => {
      const item = stock.find(i => `stock:${i.ref}` === value);
      if (item) { onChange(item.name, item); return; }
      const variety = varieties.find(v => `ref:${v.id}` === value);
      if (!variety || busy) return;
      setBusy(true); onBusyChange?.(true); setError('');
      import('./guideData').then(({ ensureGuideReferences }) => ensureGuideReferences({ varieties: [variety] })).then(() => onReference(variety)).catch(e => setError(e instanceof Error ? e.message : 'Référence indisponible.'))
        .finally(() => { setBusy(false); onBusyChange?.(false); });
    }} />
    {byStyle && <label className="flex items-center gap-1.5 min-h-touch text-xs text-cave-200"><input type="checkbox" checked={all} onChange={e => setAll(e.target.checked)} className="accent-ebc-straw" />Tous les styles · stock toujours visible</label>}
    {(error || catalogueError) && <p role="alert" className="text-sm text-alert">{error || catalogueError}</p>}
  </div>;
}
