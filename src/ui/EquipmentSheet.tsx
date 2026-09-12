import { Input, Textarea } from './Input';
import React, { useState } from 'react';
import { NumberInput } from './NumberInput';
import { EquipmentItem } from '../types';
import { Sheet, ConfirmSheet } from './Sheet';
import { FormNav, Field, TextInput, inputClass } from './FormNav';
import { SegmentedControl } from './SegmentedControl';
import { DateField } from './DateField';
import { Trash2 } from 'lucide-react';
import { useSyncedDraft } from '../hooks/useLiveData';
import { Button } from '../components/ui/Button';
import './equipment-compact.css';

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
  const [draft, setDraft] = useSyncedDraft(item, item?.ref);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saveAttempted, setSaveAttempted] = useState(false);

  if (!item || !draft) return null;

  const isNew = !item.name;
  const canSave = draft.name.trim().length >= 2;
  const nameError = !canSave && (saveAttempted || draft.name.length > 0 || !isNew) ? 'Indique un nom d’au moins 2 caractères.' : undefined;
  const categories = CATEGORIES.includes(draft.category) || !draft.category ? CATEGORIES : [draft.category, ...CATEGORIES];
  const states = STATES.some(state => state.value === draft.state) ? STATES : [...STATES, { value: draft.state, label: draft.state || 'Non renseigné' }];
  const save = () => {
    setSaveAttempted(true);
    if (!canSave) return;
    onSave({ ...draft, name: draft.name.trim() });
    onClose();
  };

  return (
    <>
      <Sheet
        open={Boolean(item)}
        onClose={onClose}
        title={isNew ? 'Nouveau matériel' : draft.name || item.name}
        subtitle={isNew ? undefined : `${item.category} · ${item.ref}`}
        className="equipment-sheet"
        footer={
          <div className="equipment-footer">
            <Button intent="secondary" onClick={onClose}>Annuler</Button>
            <Button intent="primary" onClick={save} disabled={!canSave}>Enregistrer</Button>
          </div>
        }
      >
        <FormNav className="equipment-form" onSubmit={save}>
          <Field label="Nom" htmlFor="eq-name" error={nameError}>
            <TextInput
              id="eq-name"
              name="equipment_item_label"
              aria-invalid={Boolean(nameError)}
              placeholder="Cuve 50 L, réfractomètre, pompe…"
              value={draft.name}
              onChange={(name) => setDraft({ ...draft, name })}
            />
          </Field>

          <Field label="Catégorie" htmlFor="eq-category">
            <select id="eq-category" className={inputClass} value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value })}>
              {!draft.category && <option value="">Choisir une catégorie</option>}
              {categories.map(category => <option key={category} value={category}>{category}</option>)}
            </select>
          </Field>

          <Field label="État">
            <SegmentedControl
              label="État du matériel"
              className="equipment-choice"
              value={draft.state}
              onChange={(state) => setDraft({ ...draft, state })}
              options={states}
            />
          </Field>

          <Field label="Entretien" htmlFor="eq-maintenance" hint="Action à faire ou fréquence à respecter.">
            <Input
              id="eq-maintenance"
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

          <details className="equipment-disclosure">
          <summary>Achat <span>· {draft.purchaseDate || 'Date non renseignée'}{draft.purchasePrice !== undefined ? ` · ${draft.purchasePrice.toLocaleString('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CHF` : ' · Prix non renseigné'}</span></summary>
          <div className="equipment-form-pair">
            <DateField
              label="Date d’achat"
              value={draft.purchaseDate ?? ''}
              onChange={(purchaseDate) => setDraft({ ...draft, purchaseDate })}
              shortcuts={[]}
            />
            <Field label="Prix payé (CHF)" htmlFor="eq-price">
              <NumberInput
                id="eq-price"
                value={draft.purchasePrice}
                onValue={(v) =>
                  setDraft({ ...draft, purchasePrice: v })}
                emptyValue={undefined}
                pad
                className={`${inputClass} font-mono`}
              />
            </Field>
          </div>
          </details>

          <details className="equipment-disclosure">
          <summary>Notes <span>· {draft.notes || 'Aucune'}</span></summary>
          <Field label="Notes sur le matériel" htmlFor="eq-notes">
            <Textarea
              id="eq-notes"
              name="equipment_general_notes"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
              rows={2}
              className={`${inputClass} py-1 leading-snug resize-y`}
              value={draft.notes ?? ''}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </Field>
          </details>
        </FormNav>

        {!isNew && (
          <details className="equipment-disclosure equipment-management"><summary>Gestion du matériel</summary>
            <Button intent="danger" size="sm" className="equipment-danger" onClick={() => setConfirmDelete(true)} icon={<Trash2 size={14}/>}>Supprimer</Button>
          </details>
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
