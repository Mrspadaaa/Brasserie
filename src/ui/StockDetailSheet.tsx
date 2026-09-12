import React, { useState } from 'react';
import { NumberInput } from './NumberInput';
import { Trash2, Star } from 'lucide-react';
import { Batch, StockItem } from '../types';
import { Units } from '../services/units';
import { computeStockLevel, pendingStockQuantity, allocatedBatches } from '../domain/stockLevel';
import { Suggestions } from '../services/suggestions';
import { Sheet, ConfirmSheet } from './Sheet';
import { LevelGauge } from './LevelGauge';
import { Button } from '../components/ui/Button';
import { FormNav, Field, TextInput, inputClass } from './FormNav';
import { Combobox } from './Combobox';
import { useSyncedDraft } from '../hooks/useLiveData';
import './stocks.css';

interface StockDetailSheetProps {
  item: StockItem | null;
  batches: Batch[];
  stockItems?: StockItem[];
  onClose: () => void;
  onSave: (item: StockItem) => void;
  onDelete: (item: StockItem) => void;
  onCorrectInventory: (item: StockItem) => void;
  onToggleFavorite: (item: StockItem) => void;
}

/** Quantité et couverture d'abord ; propriétés techniques accessibles à la demande. */
export const StockDetailSheet: React.FC<StockDetailSheetProps> = ({
  item, batches, stockItems, onClose, onSave, onDelete, onCorrectInventory, onToggleFavorite
}) => {
  const [draft, setDraft] = useSyncedDraft(item, item?.ref);
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!item || !draft) return null;

  const level = computeStockLevel(draft, batches, stockItems);
  const allocated = allocatedBatches(item, batches, stockItems);
  const pending = batches.reduce((sum, batch) => sum + pendingStockQuantity(item, batch), 0);
  const canSave = !!draft.name.trim() && Number.isFinite(draft.minStock) && draft.minStock >= 0;
  const save = () => {
    if (!canSave) return;
    onSave({ ...draft, name: draft.name.trim(), favorite: item.favorite, reorder: draft.currentStock <= draft.minStock });
    onClose();
  };
  const unitOptions = Suggestions.knownUnits().map(value => ({ value, label: value }));
  const categoryOptions = Suggestions.knownCategories().map(value => ({ value, label: value }));
  const vendorOptions = Suggestions.vendors().map(v => ({ value: v.name, label: v.name }));
  const malt = draft.category === 'Malt' || /c[ée]r[ée]ale|sucre/i.test(draft.category);
  const technical = malt || draft.category === 'Houblon' || draft.category === 'Levure';

  return <>
    <Sheet open onClose={onClose} title={item.name} subtitle={`${item.category} · ${item.ref}`} className="sm:max-w-2xl sm:mx-auto"
      footer={<div className="flex gap-2">
        <Button onClick={onClose} full>Annuler</Button>
        <Button intent="primary" full disabled={!canSave} onClick={save}>Enregistrer</Button>
      </div>}>
      <div className="space-y-3">
        <section className="rounded-control border border-cave-800 p-2 space-y-2" aria-label="Disponibilité de l’article">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <dl>
              <dt className="text-xs text-cave-400">Stock actuel</dt>
              <dd className="reading text-base">{Units.format(item.currentStock, item.unit)}</dd>
            </dl>
            <Button onClick={() => onCorrectInventory(item)}>Corriger l’inventaire</Button>
          </div>
          <LevelGauge level={level}/>
          {pending > 0 && <dl className="grid grid-cols-2 gap-2 text-xs">
            <div><dt className="text-cave-400">Réservé en fermentation</dt><dd className="font-mono text-water">{Units.format(pending, item.unit)}</dd></div>
            <div><dt className="text-cave-400">Disponible hors réserve</dt><dd className="font-mono text-cave-50">{Units.format(Math.max(0, item.currentStock - pending), item.unit)}</dd></div>
          </dl>}
          {level.perBatch !== null && level.source !== 'minStock' && <p className="text-xs text-cave-400">
            Besoin moyen : <span className="font-mono text-cave-200">{Units.format(level.perBatch, item.unit)}</span> par brassin
            {level.source === 'planifie' ? ' planifié.' : ', selon l’historique.'}
          </p>}
          {allocated.length > 0 && <details>
            <summary className="cursor-pointer min-h-touch flex items-center text-2xs text-water">Besoins de {allocated.length} {allocated.length === 1 ? 'brassin' : 'brassins'}</summary>
            <table className="w-full text-xs">
              <caption className="sr-only">Quantités prévues par brassin</caption>
              <thead className="sr-only"><tr><th>Brassin</th><th>Quantité</th></tr></thead>
              <tbody>{allocated.map(batch => <tr key={batch.id} className="border-t border-cave-800">
                <th scope="row" className="text-left font-normal py-1 pr-2 break-words">{batch.name}</th>
                <td className="text-right font-mono whitespace-nowrap py-1">{Units.format(batch.qty, item.unit)}</td>
              </tr>)}</tbody>
            </table>
          </details>}
        </section>

        <FormNav className="stock-form space-y-2" onSubmit={save}>
          <Field label="Nom" htmlFor="stock-label" error={draft.name.trim() ? undefined : 'Indiquez le nom de l’article.'}>
            <TextInput id="stock-label" name="stock_sheet_item_label" required aria-invalid={!draft.name.trim()} value={draft.name} onChange={name => setDraft({ ...draft, name })}/>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Catégorie" htmlFor="stock-category">
              <Combobox id="stock-category" ariaLabel="Catégorie" value={draft.category} onChange={category => setDraft({ ...draft, category })}
                options={categoryOptions} placeholder="Malt, Houblon…" allowCreate onCreate={category => setDraft({ ...draft, category })}/>
            </Field>
            <Field label="Unité" htmlFor="stock-unit">
              <Combobox id="stock-unit" ariaLabel="Unité" value={draft.unit} onChange={unit => setDraft({ ...draft, unit })}
                options={unitOptions} placeholder="kg, g…" allowCreate onCreate={unit => setDraft({ ...draft, unit })}/>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label={`Seuil minimum (${draft.unit})`} htmlFor="stock-min">
              <NumberInput id="stock-min" value={draft.minStock} min={0} onValue={minStock => setDraft({ ...draft, minStock })} className={inputClass}/>
            </Field>
            <Field label="Fournisseur" htmlFor="stock-vendor">
              <Combobox id="stock-vendor" ariaLabel="Fournisseur" value={draft.supplier || ''} onChange={supplier => setDraft({ ...draft, supplier })}
                options={vendorOptions} placeholder="Choisir…" allowCreate onCreate={supplier => setDraft({ ...draft, supplier })}/>
            </Field>
          </div>

          {technical && <details className="border-y border-cave-800 py-1">
            <summary className="text-cave-200">Caractéristiques techniques
              {draft.category === 'Houblon' && draft.alphaPct != null && <span className="text-cave-400"> · α {draft.alphaPct} %</span>}
              {malt && draft.colorEbc != null && <span className="text-cave-400"> · {draft.colorEbc} EBC</span>}
            </summary>
            <div className="space-y-2 pt-1 pb-2">
              {draft.category === 'Houblon' && <Field label="Acide alpha (%)" htmlFor="stock-alpha">
                <NumberInput id="stock-alpha" value={draft.alphaPct} min={0} max={100} emptyValue={undefined}
                  onValue={alphaPct => setDraft({ ...draft, alphaPct })} className={inputClass}/>
              </Field>}
              {malt && <div className="grid grid-cols-2 gap-2">
                <Field label="Couleur (EBC)" htmlFor="stock-ebc">
                  <NumberInput id="stock-ebc" value={draft.colorEbc} min={0} emptyValue={undefined}
                    onValue={colorEbc => setDraft({ ...draft, colorEbc })} className={inputClass}/>
                </Field>
                <Field label="Potentiel (PPG)" htmlFor="stock-ppg">
                  <NumberInput id="stock-ppg" value={draft.potentialPpg} min={0} emptyValue={undefined}
                    onValue={potentialPpg => setDraft({ ...draft, potentialPpg })} className={inputClass}/>
                </Field>
              </div>}
              {draft.category === 'Levure' && <>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Laboratoire" htmlFor="stock-lab"><TextInput id="stock-lab" name="stock_sheet_yeast_lab" value={draft.yeastLab ?? ''} onChange={yeastLab => setDraft({ ...draft, yeastLab })}/></Field>
                  <Field label="Souche" htmlFor="stock-strain"><TextInput id="stock-strain" name="stock_sheet_yeast_strain" value={draft.yeastStrain ?? ''} onChange={yeastStrain => setDraft({ ...draft, yeastStrain })}/></Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Atténuation (%)" htmlFor="stock-att"><NumberInput id="stock-att" value={draft.yeastAttenuationPct} min={0} max={100} emptyValue={undefined} onValue={yeastAttenuationPct => setDraft({ ...draft, yeastAttenuationPct })} className={inputClass}/></Field>
                  <Field label="Temp. mini (°C)" htmlFor="stock-tmin"><NumberInput id="stock-tmin" value={draft.yeastTempMinC} emptyValue={undefined} onValue={yeastTempMinC => setDraft({ ...draft, yeastTempMinC })} className={inputClass}/></Field>
                  <Field label="Temp. maxi (°C)" htmlFor="stock-tmax"><NumberInput id="stock-tmax" value={draft.yeastTempMaxC} emptyValue={undefined} onValue={yeastTempMaxC => setDraft({ ...draft, yeastTempMaxC })} className={inputClass}/></Field>
                </div>
              </>}
            </div>
          </details>}
        </FormNav>

        <div className="flex items-center justify-between gap-2">
          <Button size="sm" aria-pressed={!!item.favorite} onClick={() => onToggleFavorite(item)}
            icon={<Star className={`w-3.5 h-3.5 ${item.favorite ? 'fill-ebc-straw text-ebc-straw' : ''}`}/>}>
            {item.favorite ? 'Épinglé' : 'Épingler'}
          </Button>
          <Button size="sm" intent="danger" onClick={() => setConfirmDelete(true)} icon={<Trash2 className="w-3.5 h-3.5"/>}>Supprimer</Button>
        </div>
      </div>
    </Sheet>
    <ConfirmSheet open={confirmDelete} onClose={() => setConfirmDelete(false)}
      onConfirm={() => { onDelete(item); setConfirmDelete(false); onClose(); }} title="Supprimer cet article ?"
      what={`${item.name} — ${Units.format(item.currentStock, item.unit)} en stock`}
      consequence="L’article disparaît du catalogue. Les écritures d’achat qui le mentionnent sont conservées, mais elles ne pourront plus être annulées avec restauration du stock."
      confirmLabel="Supprimer l’article"/>
  </>;
};
