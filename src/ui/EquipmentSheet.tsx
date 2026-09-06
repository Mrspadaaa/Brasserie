import React, { useEffect, useState } from 'react';
import { NumberInput } from './NumberInput';
import { EquipmentItem } from '../types';
import { Sheet, ConfirmSheet } from './Sheet';
import { FormNav, Field, TextInput, inputClass } from './FormNav';
import { SegmentedControl } from './SegmentedControl';
import { DateField } from './DateField';
import { Trash2 } from 'lucide-react';

/**
 * Fiche matériel : créer, modifier, supprimer.
 *
 * ⚠️ Ce que ça règle : le matériel s'affichait en lecture seule. Aucune
 * méthode d'écriture n'existait côté données non plus — un appareil vendu ou
 * cassé restait dans la liste pour toujours, et un nouvel achat ne pouvait y
 * entrer qu'en réécrivant tout le tableau.
 */

const STATES: Array<{ value: string; label: string }> = [
  { value: 'Neuf', label: 'Neuf' },
  { value: 'Bon', label: 'Bon' },
  { value: 'À entretenir', label: 'À entretenir' },
  { value: 'À réparer', label: 'À réparer' }
];

const CATEGORIES = ['Brassage', 'Mesure', 'Embouteillage', 'Stockage', 'Atelier'];

interface EquipmentSheetProps {
  /** `null` ferme la feuille ; un objet sans `ref` vaut création. */
  item: EquipmentItem | null;
  onClose: () => void;
  onSave: (item: EquipmentItem) => void;
  onDelete: (item: EquipmentItem) => void;
}

export const EquipmentSheet: React.FC<EquipmentSheetProps> = ({
  item,
  onClose,
  onSave,
  onDelete
}) => {
  const [draft, setDraft] = useState<EquipmentItem | null>(item);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => setDraft(item), [item]);
  if (!item || !draft) return null;

  const isNew = !item.name;
  const save = () => {
    onSave({ ...draft, name: draft.name.trim() });
    onClose();
  };

  return (
    <>
      <Sheet
        open={Boolean(item)}
        onClose={onClose}
        title={isNew ? 'Nouveau matériel' : draft.name}
        subtitle={isNew ? undefined : `${item.category} · ${item.ref}`}
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-touch rounded-control border border-cave-700 text-cave-200"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={save}
              disabled={draft.name.trim().length < 2}
              className="flex-1 min-h-touch rounded-control bg-ebc-straw text-cave-950
                         font-semibold disabled:opacity-40"
            >
              Enregistrer
            </button>
          </div>
        }
      >
        <FormNav className="space-y-5" onSubmit={save}>
          <Field label="Nom" htmlFor="eq-name">
            <TextInput
              id="eq-item"
              name="equipment_item_label"
              placeholder="Cuve 50 L, réfractomètre, pompe…"
              value={draft.name}
              onChange={(name) => setDraft({ ...draft, name })}
            />
          </Field>

          <Field label="Catégorie">
            <SegmentedControl
              label="Catégorie du matériel"
              layout="grid"
              value={draft.category}
              onChange={(category) => setDraft({ ...draft, category })}
              options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
          </Field>

          <Field label="État" hint="« À réparer » le fait remonter en tête de liste.">
            <SegmentedControl
              label="État du matériel"
              layout="grid"
              value={draft.state}
              onChange={(state) => setDraft({ ...draft, state })}
              options={STATES}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <DateField
              label="Date d’achat"
              value={draft.purchaseDate ?? ''}
              onChange={(purchaseDate) => setDraft({ ...draft, purchaseDate })}
            />
            <Field label="Prix payé (CHF)" htmlFor="eq-price">
              <NumberInput
                value={draft.purchasePrice}
                onValue={(v) =>
                  setDraft({ ...draft, purchasePrice: v })}
                emptyValue={undefined}
                pad
                className={`${inputClass} font-mono`}
              />
            </Field>
          </div>

          <Field label="Entretien" hint="Ce qu’il faut faire, et à quelle fréquence.">
            <input
              name="equipment_maintenance_notes"
              type="text"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
              className={inputClass}
              placeholder="Joint à changer chaque année"
              value={draft.maintenance ?? ''}
              onChange={(e) => setDraft({ ...draft, maintenance: e.target.value })}
            />
          </Field>

          <Field label="Notes">
            <textarea
              name="equipment_general_notes"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
              rows={3}
              className={`${inputClass} py-2 leading-relaxed resize-y`}
              value={draft.notes ?? ''}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </Field>
        </FormNav>

        {!isNew && (
          <div className="pt-4 mt-5 border-t border-cave-800">
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full min-h-touch rounded-control border border-alert/40
                         text-alert flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Supprimer
            </button>
          </div>
        )}
      </Sheet>

      <ConfirmSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Supprimer ce matériel ?"
        what={`${item.name} — ${item.category}`}
        consequence="Il quitte l’inventaire. La suppression est journalisée."
        confirmLabel="Supprimer"
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete(item);
          onClose();
        }}
      />
    </>
  );
};
