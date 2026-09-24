import { useMemo, useState } from 'react';
import type { StockItem, YeastSpec } from '../types';
import { yeastReferences, type YeastReference } from '../domain/yeastReferences';
import { resolveFermentationYeast } from '../domain/fermentationScenario';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import { useStorageValue } from '../hooks/useLiveData';
import { StorageService } from '../services/storage';
import { Units } from '../services/units';
import { Combobox } from './Combobox';
import { Input } from './Input';

/** A strain can be chosen before buying it. Stock and reference share one search. */
export function YeastIngredientPicker({ items, yeast, onStock, onReference, onCreate, personalChoice = false }: {
  items: StockItem[]; yeast: YeastSpec;
  onStock: (name: string, item?: StockItem) => void;
  onReference: (yeast: YeastReference) => void;
  onCreate: (name: string) => void;
  personalChoice?: boolean;
}) {
  const [manual, setManual] = useState(false), [name, setName] = useState('');
  const saved = useStorageValue(StorageService.getHopKnowledge);
  const references = useMemo(() => yeastReferences(saved), [saved]);
  const stock = useMemo(() => items.filter(i => i.category.toLocaleLowerCase('fr') === 'levure'), [items]);
  const readyStock = useMemo(() => stock.filter(i => i.currentStock > 0)
    .sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite) || a.name.localeCompare(b.name, 'fr'))
    .slice(0, 3), [stock]);
  const options = useMemo(() => [
    ...stock.map(i => ({ value: `stock:${i.ref}`, label: i.name, group: 'Mon stock', favorite: i.favorite,
      detail: `${i.ref}${i.supplier ? ` · ${i.supplier}` : ''} · ${Units.format(i.currentStock, i.unit)} en stock` })),
    ...references.map(y => ({ value: `reference:${y.id}`, label: y.name, group: 'Références documentées',
      detail: [y.form, y.catalogue?.manufacturer, 'Stock non renseigné'].filter(Boolean).join(' · '),
      keywords: [y.id, ...y.aliases ?? []].join(' ') }))
  ], [stock, references]);
  const sameName = stock.filter(i => i.name === yeast.name);
  const currentStock = yeast.stockItemRef
    ? stock.find(i => i.ref === yeast.stockItemRef)
    : sameName.length === 1 ? sameName[0] : undefined;
  const currentReference = resolveFermentationYeast({ yeast } as TrialRecipe, references);
  const value = currentStock ? `stock:${currentStock.ref}` : currentReference ? `reference:${currentReference.id}` : yeast.name;
  return <>{personalChoice && !yeast.name && readyStock.length > 0 && <div className="yc-stock-quick" role="group" aria-label="Levures disponibles dans mon stock">
    <span>Disponibles</span>{readyStock.map(item => <button key={item.ref} type="button" onClick={() => onStock(item.name, item)}
      aria-label={`Choisir ${item.name}, article ${item.ref}`} title={`${item.ref}${item.supplier ? ` · ${item.supplier}` : ''}`}>
      {item.name}<small>{Units.format(item.currentStock, item.unit)}</small>
    </button>)}
  </div>}
    <Combobox value={value} options={options} maxResults={40}
    ariaLabel="Souche de levure" placeholder="US-05, Verdant IPA, WLP095…"
    allowCreate onCreate={onCreate} createLabel={name => personalChoice ? `Utiliser « ${name} » dans la recette` : `Créer « ${name} » (stock à zéro)`}
    onChange={value => {
      const item = stock.find(i => `stock:${i.ref}` === value);
      if (item) { onStock(item.name, item); return; }
      const reference = references.find(y => `reference:${y.id}` === value);
      if (reference) onReference(reference);
    }} />
    {personalChoice && <><button type="button" className="yeast-link" aria-expanded={manual} onClick={() => setManual(value => !value)}>Saisir une levure hors catalogue</button>
      {manual && <div className="yc-personal-entry"><label>Nom de la souche<Input aria-label="Nom de la levure personnelle" value={name} onChange={e => setName(e.target.value)} placeholder="Nom exact, labo ou code…" /></label><button type="button" disabled={!name.trim()} onClick={() => { onCreate(name.trim()); setManual(false); }}>Utiliser cette levure</button></div>}
    </>}
  </>;
}
