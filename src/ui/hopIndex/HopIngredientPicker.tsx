import React, { useState } from 'react';
import type { StockItem } from '../../types';
import type { HopVariety } from '../../../functions/src/hopIndexSchema';
import { Units } from '../../services/units';
import { Combobox } from '../Combobox';
import { useHopCatalogue } from './useHopCatalogue';
import { ensureGuideReferences } from './guideData';
import { HOP_FORM_LABELS, hopReferenceSource } from '../../domain/hopIndex/labels';

/** Stock and documentary references remain distinct, but share the same search field. */
export function HopIngredientPicker({ items, onChange, onReference, onCreate, placeholder, ariaLabel, onBusyChange }: {
  items: StockItem[]; onChange: (name: string, item?: StockItem) => void;
  onReference: (variety: HopVariety) => void; onCreate: (name: string) => void;
  placeholder: string; ariaLabel: string; onBusyChange?: (busy: boolean) => void;
}) {
  const { varieties, error: catalogueError } = useHopCatalogue();
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const stock = items.filter(i => i.category.toLocaleLowerCase('fr') === 'houblon');
  const options = [...stock.map(i => ({ value: `stock:${i.id}`, label: i.name, group: 'Mes articles',
    detail: `${Units.format(i.currentStock, i.unit)} en stock${i.alphaPct ? ` · ${i.alphaPct} % AA` : ''}`, favorite: i.favorite })),
    ...varieties.filter(v => !v.archived).map(v => ({ value: `ref:${v.id}`, label: v.name, group: 'Catalogue documenté',
      detail: `${hopReferenceSource(v)} · ${HOP_FORM_LABELS[v.form]} · ${v.aliases.join(', ')} · disponibilité non renseignée` }))];
  return <div className="space-y-1"><Combobox value="" disabled={busy} options={options} ariaLabel={ariaLabel} placeholder={placeholder}
    allowCreate onCreate={onCreate} createLabel={name => `Créer « ${name} » (stock à zéro)`} onChange={value => {
      const item = stock.find(i => `stock:${i.id}` === value);
      if (item) { onChange(item.name, item); return; }
      const variety = varieties.find(v => `ref:${v.id}` === value);
      if (!variety || busy) return;
      setBusy(true); onBusyChange?.(true); setError('');
      ensureGuideReferences({ varieties: [variety] }).then(() => onReference(variety)).catch(e => setError(e instanceof Error ? e.message : 'Référence indisponible.'))
        .finally(() => { setBusy(false); onBusyChange?.(false); });
    }} />
    <p className="text-xs text-cave-400">Recherche dans tes articles et le catalogue. L’alpha du lot reste à saisir pour une référence documentaire.</p>
    {(error || catalogueError) && <p role="alert" className="text-sm text-alert">{error || catalogueError}</p>}
  </div>;
}
