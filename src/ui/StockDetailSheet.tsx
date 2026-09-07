import React, { useState, useEffect } from 'react';
import { NumberInput } from './NumberInput';
import { Trash2, Star } from 'lucide-react';
import { Batch, StockItem } from '../types';
import { Units } from '../services/units';
import { computeStockLevel } from '../domain/stockLevel';
import { Suggestions } from '../services/suggestions';
import { Sheet, ConfirmSheet } from './Sheet';
import { QuantityStepper } from './QuantityStepper';
import { LevelGauge } from './LevelGauge';
import { Button } from '../components/ui/Button';
import { FormNav, Field, TextInput, inputClass } from './FormNav';
import { Combobox, ComboOption } from './Combobox';
import { useSyncedDraft } from '../hooks/useLiveData';

/**
 * Fiche d'un article de stock : ajuster, modifier, épingler, supprimer.
 *
 * Une seule feuille pour toutes les catégories. Les propositions (unité,
 * catégorie, fournisseur) viennent de ce qui existe DÉJÀ dans la base — jamais
 * d'une liste inventée.
 */

interface StockDetailSheetProps {
  item: StockItem | null;
  batches: Batch[];
  onClose: () => void;
  onSave: (item: StockItem) => void;
  onDelete: (item: StockItem) => void;
  /** Ouvre la correction d'inventaire : stock compté + motif, journalisé. */
  onCorrectInventory: (item: StockItem) => void;
  onToggleFavorite: (item: StockItem) => void;
}

export const StockDetailSheet: React.FC<StockDetailSheetProps> = ({
  item,
  batches,
  onClose,
  onSave,
  onDelete,
  onCorrectInventory,
  onToggleFavorite
}) => {
  const [draft, setDraft] = useSyncedDraft(item, item?.ref);
  const [confirmDelete, setConfirmDelete] = useState(false);


  if (!item || !draft) return null;

  const level = computeStockLevel(draft, batches);
  const changed = draft.currentStock !== item.currentStock;
  // Toutes les propositions viennent de la base — aucune liste inventée.
  const unitOptions: ComboOption[] = Suggestions.knownUnits().map((u) => ({
    value: u,
    label: u
  }));
  const categoryOptions: ComboOption[] = Suggestions.knownCategories().map((c) => ({
    value: c,
    label: c
  }));
  const vendorOptions: ComboOption[] = Suggestions.vendors().map((v) => ({
    value: v.name,
    label: v.name,
    detail: `${v.count} achat${v.count > 1 ? 's' : ''} enregistré${v.count > 1 ? 's' : ''}`
  }));

  return (
    <>
      <Sheet
        open={!!item}
        onClose={onClose}
        title={item.name}
        subtitle={`${item.category} · ${item.ref}`}
        footer={
          <div className="flex gap-3">
            <Button intent="secondary" onClick={onClose} full>
              Annuler
            </Button>
            <Button
              intent="primary"
              full
              onClick={() => {
                onSave({ ...draft, reorder: draft.currentStock <= draft.minStock });
                onClose();
              }}
            >
              Enregistrer
            </Button>
          </div>
        }
      >
        <div className="space-y-7">
          <section className="space-y-3">
            <LevelGauge level={level} />
            {level.perBatch !== null && (
              <p className="text-sm text-cave-400 leading-relaxed">
                Un brassin consomme environ{' '}
                <span className="font-mono text-cave-100">
                  {Units.format(level.perBatch, draft.unit)}
                </span>{' '}
                de cet article
                {level.source === 'planifie'
                  ? ', d’après les brassins planifiés.'
                  : level.source === 'historique'
                    ? ', d’après les brassins passés.'
                    : ', d’après le stock minimum défini.'}
              </p>
            )}
          </section>

          {/*
            Le stock ne se règle plus librement ici.

            ⚠️ Il bouge par deux événements métier : l'ACHAT le fait monter, le
            BRASSAGE le fait descendre. Le corriger à la main est une exception
            — un comptage, une casse, une erreur de saisie — et cette exception
            mérite d'être nommée et journalisée. D'où un bouton dédié plutôt
            qu'un compteur libre.
          */}
          <section className="panel p-3 flex items-center justify-between gap-3">
            <span className="min-w-0">
              <span className="block text-sm text-cave-500">Stock actuel</span>
              <span className="reading text-xl">
                {Units.format(item.currentStock, item.unit)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => onCorrectInventory(item)}
              className="min-h-touch px-4 rounded-control border border-cave-700
                         text-sm text-cave-100 hover:border-ebc-straw hover:text-ebc-straw
                         transition-colors shrink-0"
            >
              Corriger l’inventaire
            </button>
          </section>

          {/* FormNav : Entrée passe au champ suivant, Ctrl/⌘+Entrée enregistre.
              Sur ordinateur, une réception se remplit sans toucher la souris. */}
          <FormNav
            className="space-y-4"
            onSubmit={() => {
              onSave({ ...draft, reorder: draft.currentStock <= draft.minStock });
              onClose();
            }}
          >
            <h3 className="text-base font-semibold text-cave-100">Fiche article</h3>

            <Field label="Nom" htmlFor="stock-name">
              <TextInput
                id="stock-label"
                name="stock_sheet_item_label"
                value={draft.name}
                onChange={(name) => setDraft({ ...draft, name })}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Catégorie">
                <Combobox
                  value={draft.category}
                  onChange={(category) => setDraft({ ...draft, category })}
                  options={categoryOptions}
                  placeholder="Malt, Houblon…"
                  allowCreate
                  onCreate={(category) => setDraft({ ...draft, category })}
                  createLabel={(v) => `Nouvelle catégorie « ${v} »`}
                />
              </Field>

              <Field label="Unité">
                <Combobox
                  value={draft.unit}
                  onChange={(unit) => setDraft({ ...draft, unit })}
                  options={unitOptions}
                  placeholder="kg, g…"
                  allowCreate
                  onCreate={(unit) => setDraft({ ...draft, unit })}
                  createLabel={(v) => `Nouvelle unité « ${v} »`}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Stock minimum"
                htmlFor="stock-min"
                hint={`en ${draft.unit}`}
              >
                <NumberInput
                  value={draft.minStock}
                  onValue={(v) =>
                    setDraft({ ...draft, minStock: v })}
                  pad
                  className={`${inputClass} font-mono`}
                />
              </Field>

              <Field label="Fournisseur">
                <Combobox
                  value={draft.supplier || ''}
                  onChange={(supplier) => setDraft({ ...draft, supplier })}
                  options={vendorOptions}
                  placeholder="Brau-Rauchshop…"
                  allowCreate
                  onCreate={(supplier) => setDraft({ ...draft, supplier })}
                  createLabel={(v) => `Nouveau fournisseur « ${v} »`}
                />
              </Field>
            </div>

            {draft.category === 'Houblon' && (
              <Field label="Acide alpha" htmlFor="stock-alpha" hint="en %, tel qu'indiqué sur le sachet">
                <NumberInput
                  value={draft.alphaPct}
                  onValue={(v) =>
                    setDraft({ ...draft, alphaPct: v })}
                  emptyValue={undefined}
                  pad
                  className={`${inputClass} font-mono`}
                />
              </Field>
            )}

            {/*
              Caractéristiques techniques, recopiées UNE FOIS depuis la fiche du
              fournisseur. Elles sont ce qui rend la couleur et la densité
              calculables : sans elles, la fiche recette affiche « incalculable »
              plutôt qu'un chiffre inventé.
            */}
            {(draft.category === 'Malt' || /c[ée]r[ée]ale|sucre/i.test(draft.category)) && (
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Couleur"
                  htmlFor="stock-ebc"
                  hint="en EBC — donne la couleur de la bière"
                >
                  <NumberInput
                    value={draft.colorEbc}
                    onValue={(v) =>
                      setDraft({ ...draft, colorEbc: v })}
                    emptyValue={undefined}
                    pad
                    className={`${inputClass} font-mono`}
                  />
                </Field>

                <Field
                  label="Potentiel"
                  htmlFor="stock-ppg"
                  hint="en PPG — donne la densité prédite"
                >
                  <NumberInput
                    value={draft.potentialPpg}
                    onValue={(v) =>
                      setDraft({ ...draft, potentialPpg: v })}
                    emptyValue={undefined}
                    pad
                    className={`${inputClass} font-mono`}
                  />
                </Field>
              </div>
            )}

            {draft.category === 'Levure' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Laboratoire" htmlFor="stock-lab">
                    <TextInput
                      id="stock-lab"
                      name="stock_sheet_yeast_lab"
                      placeholder="Lallemand, Fermentis…"
                      value={draft.yeastLab ?? ''}
                      onChange={(yeastLab) => setDraft({ ...draft, yeastLab })}
                    />
                  </Field>
                  <Field label="Souche" htmlFor="stock-strain">
                    <TextInput
                      id="stock-strain"
                      name="stock_sheet_yeast_strain"
                      placeholder="US-05, WLP095…"
                      value={draft.yeastStrain ?? ''}
                      onChange={(yeastStrain) => setDraft({ ...draft, yeastStrain })}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Field label="Atténuation" htmlFor="stock-att" hint="%">
                    <NumberInput
                      value={draft.yeastAttenuationPct}
                      onValue={(v) =>
                        setDraft({
                          ...draft,
                          yeastAttenuationPct: v
                        })}
                      emptyValue={undefined}
                      pad
                      className={`${inputClass} font-mono`}
                    />
                  </Field>
                  <Field label="Temp. mini" htmlFor="stock-tmin" hint="°C">
                    <NumberInput
                      value={draft.yeastTempMinC}
                      onValue={(v) =>
                        setDraft({ ...draft, yeastTempMinC: v })}
                      emptyValue={undefined}
                      pad
                      className={`${inputClass} font-mono`}
                    />
                  </Field>
                  <Field label="Temp. maxi" htmlFor="stock-tmax" hint="°C">
                    <NumberInput
                      value={draft.yeastTempMaxC}
                      onValue={(v) =>
                        setDraft({ ...draft, yeastTempMaxC: v })}
                      emptyValue={undefined}
                      pad
                      className={`${inputClass} font-mono`}
                    />
                  </Field>
                </div>
              </>
            )}

            <p className="text-sm text-cave-600">
              Entrée passe au champ suivant · Ctrl+Entrée enregistre
            </p>
          </FormNav>

          <section className="flex gap-3 pt-2 border-t border-cave-800">
            <Button
              intent="secondary"
              full
              onClick={() => onToggleFavorite(draft)}
              icon={
                <Star
                  className={`w-5 h-5 ${draft.favorite ? 'fill-ebc-straw text-ebc-straw' : ''}`}
                />
              }
            >
              {draft.favorite ? 'Épinglé' : 'Épingler'}
            </Button>

            <Button
              intent="danger"
              onClick={() => setConfirmDelete(true)}
              icon={<Trash2 className="w-5 h-5" />}
            >
              Supprimer
            </Button>
          </section>
        </div>
      </Sheet>

      <ConfirmSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          onDelete(item);
          onClose();
        }}
        title="Supprimer cet article ?"
        what={`${item.name} — ${Units.format(item.currentStock, item.unit)} en stock`}
        consequence="L'article disparaît du catalogue. Les écritures d'achat qui le mentionnent sont conservées, mais elles ne pourront plus être annulées avec restauration du stock."
        confirmLabel="Supprimer l'article"
      />
    </>
  );
};
