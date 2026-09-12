import React, { useMemo } from 'react';
import type { StockItem, YeastSpec } from '../types';
import { yeastReferences, type YeastReference } from '../domain/yeastReferences';
import { resolveFermentationYeast } from '../domain/fermentationScenario';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import { useStorageValue } from '../hooks/useLiveData';
import { StorageService } from '../services/storage';
import { Units } from '../services/units';
import { Combobox } from './Combobox';

/** A strain can be chosen before buying it. Stock and reference share one search. */
export function YeastIngredientPicker({ items, yeast, onStock, onReference, onCreate }: {
  items: StockItem[]; yeast: YeastSpec;
  onStock: (name: string, item?: StockItem) => void;
  onReference: (yeast: YeastReference) => void;
  onCreate: (name: string) => void;
}) {
  const saved = useStorageValue(StorageService.getHopKnowledge);
  const references = useMemo(() => yeastReferences(saved), [saved]);
  const stock = useMemo(() => items.filter(i => i.category.toLocaleLowerCase('fr') === 'levure'), [items]);
  const options = useMemo(() => [
    ...stock.map(i => ({ value: `stock:${i.id}`, label: i.name, group: 'Mon stock', favorite: i.favorite,
      detail: `${Units.format(i.currentStock, i.unit)} en stock` })),
    ...references.map(y => ({ value: `reference:${y.id}`, label: y.name, group: 'Références documentées',
      detail: [y.form, y.catalogue?.manufacturer, 'Stock non renseigné'].filter(Boolean).join(' · '),
      keywords: [y.id, ...y.aliases ?? []].join(' ') }))
  ], [stock, references]);
  const currentStock = stock.find(i => i.name === yeast.name);
  const currentReference = resolveFermentationYeast({ yeast } as TrialRecipe, references);
  const value = currentStock ? `stock:${currentStock.id}` : currentReference ? `reference:${currentReference.id}` : yeast.name;
  return <Combobox value={value} options={options} maxResults={40}
    ariaLabel="Souche de levure" placeholder="US-05, Verdant IPA, WLP095…"
    allowCreate onCreate={onCreate} createLabel={name => `Créer « ${name} » (stock à zéro)`}
    onChange={value => {
      const item = stock.find(i => `stock:${i.id}` === value);
      if (item) { onStock(item.name, item); return; }
      const reference = references.find(y => `reference:${y.id}` === value);
      if (reference) onReference(reference);
    }} />;
}
