import React, { useState } from 'react';
import { NumberInput } from './NumberInput';
import { Trash2, Star } from 'lucide-react';
import { Batch, Recipe, StockItem } from '../types';
import { DateField, toIsoDate, toSwissDate } from './DateField';
import { todayISO } from '../domain/finance/ledger';
import { libelleDurabilite, liensArticle, motifNonSuppression, nombreFr, quantiteLue, statutDurabilite, verifierSeuil } from '../domain/stock/regles';
import { Units } from '../services/units';
import { computeStockLevel, pendingStockSummary, allocatedBatches, type RecipeStockComparison } from '../domain/stockLevel';
import { Suggestions } from '../services/suggestions';
import { Sheet, ConfirmSheet } from './Sheet';
import { LevelGauge } from './LevelGauge';
import { Button } from '../components/ui/Button';
import { FormNav, Field, TextInput, inputClass } from './FormNav';
import { Combobox } from './Combobox';
import { useSyncedDraft } from '../hooks/useLiveData';
import { canonicalStockCategory, memeNom } from '../services/stockLineMatching';
import { changerUniteArticle } from '../domain/stock/changerUnite';
import './stocks.css';

interface StockDetailSheetProps {
  item: StockItem | null;
  batches: Batch[];
  stockItems?: StockItem[];
  recipeCheck?: { recipeName: string; comparison: RecipeStockComparison } | null;
  onClose: () => void;
  /** `base` : l'article tel que la fiche l'a lu (sert à n'appliquer que les champs que le brasseur a changés, AM-53). */
  onSave: (item: StockItem, base: StockItem) => void;
  onDelete: (item: StockItem) => void;
  onCorrectInventory: (item: StockItem) => void;
  onToggleFavorite: (item: StockItem) => void;
  /** Les recettes enregistrées : un article qu'une recette cite ne se supprime pas (AM-55). */
  recipes?: Recipe[];
}

/** Quantité et couverture d'abord ; propriétés techniques accessibles à la demande. */
export const StockDetailSheet: React.FC<StockDetailSheetProps> = ({
  item, batches, stockItems, recipeCheck, onClose, onSave, onDelete, onCorrectInventory, onToggleFavorite, recipes = []
}) => {
  const [draft, setDraft] = useSyncedDraft(item, item?.ref);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uniteRefus, setUniteRefus] = useState('');
  const [uniteNote, setUniteNote] = useState('');
  if (!item || !draft) return null;

  const level = computeStockLevel(draft, batches, stockItems);
  const allocated = allocatedBatches(item, batches, stockItems);
  const pending = pendingStockSummary(item, batches);
  const physical = Number.isFinite(item.currentStock) && item.currentStock >= 0 ? item.currentStock : null;
  const available = physical !== null && pending.known ? Math.max(0, physical - pending.knownQuantity) : null;
  // MV-43, BR-76 : un seuil de 999 999 kg est une faute de frappe, pas un seuil.
  const seuil = verifierSeuil(draft.minStock, draft.unit);
  const seuilErreur = 'refus' in seuil ? seuil.refus : undefined;
  const canSave = !!draft.name.trim() && seuil.ok;
  const save = () => {
    if (!canSave) return;
    onSave({ ...draft, name: draft.name.trim(), favorite: item.favorite, reorder: draft.currentStock <= draft.minStock }, item);
    onClose();
  };
  // AM-55 : ce qui retient l'article (brassin qui le réserve, recette qui le cite).
  const nonSuppression = motifNonSuppression(liensArticle(item, batches, recipes, stockItems ?? [item]));
  // AM-56 : date de durabilité d'une levure (AAAA-MM-JJ dans le lot, JJ.MM.AAAA à l'écran).
  const aujourdhui = todayISO();
  const durabilite = statutDurabilite(draft.yeastLot?.expiresOn, aujourdhui);
  /* AM n° 8 : l'unité ne se change pas sans convertir le stock, le seuil et le maximum ; d'une famille à l'autre, le changement est refusé et dit pourquoi. */
  const changeUnit = (unit: string) => {
    const changement = changerUniteArticle(draft, unit, allocated.length > 0);
    if ('refus' in changement) { setUniteRefus(changement.refus); setUniteNote(''); return; }
    setUniteRefus(''); setUniteNote(changement.note ? `${changement.note} Enregistre pour l’appliquer.` : '');
    setDraft(changement.item);
  };
  const unitOptions = Suggestions.knownUnits().map(value => ({ value, label: value }));
  const categoryOptions = Suggestions.knownCategories().map(value => ({ value, label: value }));
  const vendorOptions = Suggestions.vendors().map(v => ({ value: v.name, label: v.name }));
  // Un article créé par une ancienne lecture peut porter « malt » ou « houblon » : il garde ses champs techniques.
  const category = canonicalStockCategory(draft.category);
  const malt = category === 'Malt' || /c[ée]r[ée]ale|sucre/i.test(category);
  const technical = malt || category === 'Houblon' || category === 'Levure';
  // Choix B (voie n1-nom-fr) : les noms imprimés de l'article sur les factures, en petit sous « Nom » ; jamais le nom de l'article lui-même ; lecture seule.
  const nomsFacture = (draft.nomsFacture ?? []).filter(nom => nom.trim() && !memeNom(nom, draft.name)); // la même égalité que l'écriture (N2, N4) : `memeNom`

  return <>
    <Sheet open onClose={onClose} title={item.name} subtitle={`${canonicalStockCategory(item.category)} · ${item.ref}`} className="sm:max-w-2xl sm:mx-auto"
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
          {(() => { const d = libelleDurabilite(item.yeastLot?.expiresOn, aujourdhui); return d && <p data-stock-durabilite className={`text-xs ${d.perime ? 'text-alert-strong' : 'text-attention'}`}>{d.texte}</p>; })()}
          {level.band === 'inconnu' && <button type="button" className="text-xs text-ebc-straw underline underline-offset-2 self-start" data-role="fixer-seuil"
            onClick={() => { const champ = document.getElementById('stock-min'); champ?.scrollIntoView({ block: 'center' }); champ?.focus(); }}>
            Fixer le seuil minimum</button>}
          {pending.known && pending.knownQuantity > 0 && <dl className="grid grid-cols-2 gap-2 text-xs">
            <div><dt className="text-cave-400">Réservé en fermentation</dt><dd className="font-mono text-water">{Units.format(pending.knownQuantity, item.unit)}</dd></div>
            <div><dt className="text-cave-400">Libre hors réserve</dt><dd className="font-mono text-cave-50">{available === null ? 'Inconnu' : Units.format(available, item.unit)}</dd></div>
          </dl>}
          {!pending.known && <dl className="grid grid-cols-2 gap-2 text-xs">
            <div><dt className="text-cave-400">Réservé en fermentation</dt><dd className="text-attention">{pending.knownQuantity > 0 ? `Au moins ${Units.format(pending.knownQuantity, item.unit)} · total inconnu` : 'Quantité inconnue'}</dd></div>
            <div><dt className="text-cave-400">Libre hors réserve</dt><dd className="text-attention">Inconnu · unité incompatible</dd></div>
          </dl>}
          {recipeCheck && recipeCheck.comparison.stockItem?.ref === item.ref && <div className="border-t border-cave-800 pt-2 space-y-1">
            <p className="text-xs text-cave-400">Besoin prévu · {recipeCheck.recipeName}</p>
            <dl className="grid grid-cols-3 gap-2 text-xs">
              <div><dt className="text-cave-400">Besoin</dt><dd className="font-mono text-cave-50">{recipeCheck.comparison.quantity === null || !recipeCheck.comparison.unit ? 'Inconnu' : quantiteLue(recipeCheck.comparison.quantity, recipeCheck.comparison.unit)}</dd></div>
              <div><dt className="text-cave-400">Libre</dt><dd className="font-mono text-cave-50">{recipeCheck.comparison.available === null ? 'Inconnu' : quantiteLue(recipeCheck.comparison.available, recipeCheck.comparison.unit!)}</dd></div>
              <div><dt className="text-cave-400">Manque</dt><dd className={`font-mono ${recipeCheck.comparison.shortage === null ? 'text-cave-200' : recipeCheck.comparison.shortage > 0 ? 'text-alert-strong' : 'text-hop'}`}>{recipeCheck.comparison.shortage === null || !recipeCheck.comparison.unit ? 'Inconnu' : quantiteLue(recipeCheck.comparison.shortage, recipeCheck.comparison.unit)}</dd></div>
            </dl>
            {recipeCheck.comparison.issue && <p className="text-xs text-attention">{recipeCheck.comparison.issue}</p>}
            {recipeCheck.comparison.availabilityIssue && <p className="text-xs text-attention">{recipeCheck.comparison.availabilityIssue}</p>}
            <p className="text-xs text-cave-400">Cette prévision ne réserve pas le stock.</p>
          </div>}
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
          {nomsFacture.length > 0 && <p data-stock-noms-facture className="-mt-1 text-xs text-cave-400">Sur la facture : {nomsFacture.join(' · ')}</p>}
          <div className="grid grid-cols-2 gap-2">
            <Field label="Catégorie" htmlFor="stock-category">
              <Combobox id="stock-category" ariaLabel="Catégorie" value={draft.category} onChange={category => setDraft({ ...draft, category })}
                options={categoryOptions} placeholder="Malt, Houblon…" allowCreate onCreate={category => setDraft({ ...draft, category })}/>
            </Field>
            <Field label="Unité" htmlFor="stock-unit" error={uniteRefus || undefined}>
              <Combobox id="stock-unit" ariaLabel="Unité" value={draft.unit} onChange={changeUnit}
                options={unitOptions} placeholder="kg, g…" allowCreate onCreate={changeUnit}/>
              {uniteNote && !uniteRefus && <p data-stock-unite-note className="mt-1 text-xs text-cave-400">{uniteNote}</p>}
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label={`Seuil minimum (${draft.unit})`} htmlFor="stock-min" error={seuilErreur}>
              <NumberInput id="stock-min" value={draft.minStock} min={0} aria-invalid={!seuil.ok} onValue={minStock => setDraft({ ...draft, minStock })} className={inputClass}/>
            </Field>
            <Field label="Fournisseur" htmlFor="stock-vendor">
              <Combobox id="stock-vendor" ariaLabel="Fournisseur" value={draft.supplier || ''} onChange={supplier => setDraft({ ...draft, supplier })}
                options={vendorOptions} placeholder="Choisir…" allowCreate onCreate={supplier => setDraft({ ...draft, supplier })}/>
            </Field>
          </div>

          {technical && <details className="border-y border-cave-800 py-1">
            <summary className="text-cave-200">Caractéristiques techniques
              {category === 'Houblon' && draft.alphaPct != null && <span className="text-cave-400"> · α {nombreFr(draft.alphaPct, 2)} %</span>}
              {malt && draft.colorEbc != null && <span className="text-cave-400"> · {nombreFr(draft.colorEbc, 1)} EBC</span>}
            </summary>
            <div className="space-y-2 pt-1 pb-2">
              {category === 'Houblon' && <Field label="Acide alpha (%)" htmlFor="stock-alpha">
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
              {category === 'Levure' && <>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Laboratoire" htmlFor="stock-lab"><TextInput id="stock-lab" name="stock_sheet_yeast_lab" value={draft.yeastLab ?? ''} onChange={yeastLab => setDraft({ ...draft, yeastLab })}/></Field>
                  <Field label="Souche" htmlFor="stock-strain"><TextInput id="stock-strain" name="stock_sheet_yeast_strain" value={draft.yeastStrain ?? ''} onChange={yeastStrain => setDraft({ ...draft, yeastStrain })}/></Field>
                </div>
                <DateField label="À utiliser avant (DDM)" shortcuts={[]} value={toSwissDate(draft.yeastLot?.expiresOn ?? '')}
                  hint={durabilite.statut === 'perime' ? undefined : 'Sans date, aucune alerte de péremption.'}
                  error={durabilite.statut === 'perime' ? 'Sachet périmé : ne le brasse pas sans l’avoir testé.' : undefined}
                  onChange={swiss => { const expiresOn = toIsoDate(swiss) || undefined; setDraft({ ...draft, yeastLot: { ...(draft.yeastLot ?? {}), expiresOn } }); }}/>
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
          <Button size="sm" intent="danger" disabled={Boolean(nonSuppression)} aria-describedby={nonSuppression ? 'stock-delete-blocked' : undefined}
            onClick={() => setConfirmDelete(true)} icon={<Trash2 className="w-3.5 h-3.5"/>}>Supprimer</Button>
        </div>
        {nonSuppression && <p id="stock-delete-blocked" role="status" data-stock-suppression-bloquee className="text-xs text-attention">{nonSuppression}</p>}
      </div>
    </Sheet>
    <ConfirmSheet open={confirmDelete} onClose={() => setConfirmDelete(false)}
      onConfirm={() => { onDelete(item); setConfirmDelete(false); onClose(); }} title="Supprimer cet article ?"
      what={`${item.name} — ${Units.format(item.currentStock, item.unit)} en stock`}
      consequence="L’article disparaît du catalogue. Les écritures d’achat qui le mentionnent sont conservées, mais elles ne pourront plus être annulées avec restauration du stock."
      confirmLabel="Supprimer l’article"/>
  </>;
};
