import React, { useState } from 'react';
import { useSyncedDraft } from '../hooks/useLiveData';
import { NumberInput } from './NumberInput';
import { CreativeItem } from '../types';
import { Sheet, ConfirmSheet } from './Sheet';
import { FormNav, Field, TextInput, inputClass } from './FormNav';
import { SegmentedControl } from './SegmentedControl';
import { DateField } from './DateField';
import { Trash2 } from 'lucide-react';

/**
 * Édition d'une entrée de l'atelier R&D.
 *
 * ⚠️ Ce que ça règle, mot pour mot : « dans les idées ou autre toujours pas la
 * possibilité de supprimer ou popup de modification ». C'était exact — l'onglet
 * n'avait **aucun** chemin d'édition, et la corbeille supprimait sans rien
 * demander. Une idée mal titrée était donc à refaire depuis zéro, et une
 * suppression accidentelle était définitive.
 */

const TYPES: Array<{ value: CreativeItem['type']; label: string }> = [
  { value: 'recipe-idea', label: 'Idée de bière' },
  { value: 'equipment', label: 'Matériel' },
  { value: 'event', label: 'Événement' },
  { value: 'pricing-test', label: 'Tarif' },
  { value: 'prospect', label: 'Prospect' }
];

const STATUSES: Array<{ value: CreativeItem['status']; label: string }> = [
  { value: 'idea', label: 'Idée' },
  { value: 'research', label: 'Recherche' },
  { value: 'quote', label: 'Devis' },
  { value: 'todo', label: 'À faire' },
  { value: 'validated', label: 'Validé' },
  { value: 'done', label: 'Fait' }
];

interface CreativeItemSheetProps {
  item: CreativeItem | null;
  onClose: () => void;
  onSave: (item: CreativeItem) => void;
  onDelete: (item: CreativeItem) => void;
}

export const CreativeItemSheet: React.FC<CreativeItemSheetProps> = ({
  item,
  onClose,
  onSave,
  onDelete
}) => {
  const [draft, setDraft] = useSyncedDraft(item, item?.id);
  const [confirmDelete, setConfirmDelete] = useState(false);


  if (!item || !draft) return null;

  const save = () => {
    onSave({ ...draft, title: draft.title.trim() });
    onClose();
  };

  return (
    <>
      <Sheet
        open={Boolean(item)}
        onClose={onClose}
        title={item.title}
        subtitle={TYPES.find((t) => t.value === item.type)?.label}
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
              disabled={draft.title.trim().length < 2}
              className="flex-1 min-h-touch rounded-control bg-ebc-straw text-cave-950
                         font-semibold disabled:opacity-40"
            >
              Enregistrer
            </button>
          </div>
        }
      >
        <FormNav className="space-y-5" onSubmit={save}>
          <Field label="Titre" htmlFor="cr-title">
            <TextInput
              id="cr-title"
              name="creative_sheet_title"
              value={draft.title}
              onChange={(title) => setDraft({ ...draft, title })}
            />
          </Field>

          <Field label="Type">
            <SegmentedControl
              label="Type d’entrée"
              layout="grid"
              value={draft.type}
              onChange={(type) => setDraft({ ...draft, type })}
              options={TYPES}
            />
          </Field>

          <Field label="Avancement">
            <SegmentedControl
              label="Statut"
              layout="grid"
              value={draft.status}
              onChange={(status) => setDraft({ ...draft, status })}
              options={STATUSES}
            />
          </Field>

          <Field label="Description">
            <textarea
              name="creative_sheet_description"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
              rows={3}
              className={`${inputClass} py-2 leading-relaxed resize-y`}
              value={draft.description ?? ''}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Coût estimé (CHF)" htmlFor="cr-cost">
              <NumberInput
                value={draft.estimatedCost}
                onValue={(v) =>
                  setDraft({ ...draft, estimatedCost: v })}
                emptyValue={undefined}
                pad
                className={`${inputClass} font-mono`}
              />
            </Field>
            <Field label="Prix visé (CHF)" htmlFor="cr-price">
              <NumberInput
                value={draft.targetPrice}
                onValue={(v) =>
                  setDraft({ ...draft, targetPrice: v })}
                emptyValue={undefined}
                pad
                className={`${inputClass} font-mono`}
              />
            </Field>
          </div>

          {draft.type === 'event' && (
            <DateField
              label="Date"
              value={draft.date ?? ''}
              onChange={(date) => setDraft({ ...draft, date })}
            />
          )}

          {draft.type === 'prospect' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Contact" htmlFor="cr-contact">
                <TextInput
                  id="cr-partner"
                  name="creative_sheet_partner_label"
                  value={draft.contactName ?? ''}
                  onChange={(contactName) => setDraft({ ...draft, contactName })}
                />
              </Field>
              <Field label="Téléphone" htmlFor="cr-tel">
                <input
                  id="cr-tel"
                  name="creative_sheet_contact_tel"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-form-type="other"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  type="text"
                  inputMode="tel"
                  className={inputClass}
                  value={draft.contactPhone ?? ''}
                  onChange={(e) => setDraft({ ...draft, contactPhone: e.target.value })}
                />
              </Field>
            </div>
          )}

          <Field label="Notes">
            <textarea
              name="creative_sheet_general_notes"
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

          <p className="text-sm text-cave-400">
            Entrée passe au champ suivant · Ctrl+Entrée enregistre
          </p>
        </FormNav>

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
      </Sheet>

      <ConfirmSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Supprimer cette entrée ?"
        what={item.title}
        consequence="Elle disparaît de l’atelier. La suppression est journalisée."
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
