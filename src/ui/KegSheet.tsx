import { Input } from './Input';
import React, { useState } from 'react';
import { KegItem, KegState, Batch } from '../types';
import { Sheet, ConfirmSheet } from './Sheet';
import { FormNav, Field, TextInput, inputClass } from './FormNav';
import { SegmentedControl } from './SegmentedControl';
import { Combobox } from './Combobox';
import { DateField, swissToday } from './DateField';
import { Trash2 } from 'lucide-react';
import { useSyncedDraft } from '../hooks/useLiveData';
import { Button } from '../components/ui/Button';
import './equipment-compact.css';

/**
 * Fiche fût : créer, modifier, supprimer.
 *
 * ⚠️ Les fûts se transformaient d'état mais ne se CRÉAIENT pas : acheter un fût
 * supplémentaire était impossible depuis l'application. Aucune méthode
 * d'écriture individuelle n'existait non plus côté données.
 *
 * Le remplissage exige de désigner le brassin : un fût « plein » sans bière
 * dedans est un fût qu'on ouvrira sans savoir ce qu'on sert.
 */

const STATES: Array<{ value: KegState; label: string; hint: string }> = [
  { value: 'lavage', label: 'À laver', hint: 'Revenu vide' },
  { value: 'propre', label: 'Propre', hint: 'Prêt à remplir' },
  { value: 'plein', label: 'Plein', hint: 'Rempli, en cave' },
  { value: 'livre', label: 'Livré', hint: 'Chez le client' }
];

const CAPACITIES = [20, 30, 50];

interface KegSheetProps {
  keg: KegItem | null;
  batches: Batch[];
  onClose: () => void;
  onSave: (keg: KegItem) => void;
  onDelete: (keg: KegItem) => void;
}

export const KegSheet: React.FC<KegSheetProps> = ({
  keg,
  batches,
  onClose,
  onSave,
  onDelete
}) => {
  const [draft, setDraft] = useSyncedDraft(keg, keg?.id);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!keg || !draft) return null;

  const isNew = !keg.beerName && keg.state === 'propre' && !keg.fillDate;
  const needsBeer = draft.state === 'plein' || draft.state === 'livre';
  const canSave = Boolean(draft.id.trim()) && (!needsBeer || Boolean(draft.batchRef));
  const capacities = CAPACITIES.includes(draft.capacityL) ? CAPACITIES : [...CAPACITIES, draft.capacityL];
  const beerOptions = batches.filter(batch => batch.status !== 'annule').map(batch => ({
    value: batch.id, label: `${batch.id} — ${batch.name}`,
    detail: [batch.style, batch.brewDate].filter(Boolean).join(' · ')
  }));
  // Un brassin retiré du catalogue reste le contenu enregistré de ce fût.
  if (draft.batchRef && !beerOptions.some(option => option.value === draft.batchRef)) {
    beerOptions.unshift({ value: draft.batchRef, label: `${draft.batchRef} — ${draft.beerName || 'Bière enregistrée'}`, detail: draft.style || 'Brassin enregistré' });
  }

  const save = () => {
    if (!canSave) return;
    onSave({ ...draft, id: draft.id.trim() });
    onClose();
  };

  return (
    <>
      <Sheet
        open={Boolean(keg)}
        onClose={onClose}
        title={isNew ? 'Nouveau fût' : `Fût ${keg.id}`}
        subtitle={isNew ? undefined : `${keg.capacityL} L · ${keg.beerName ?? 'vide'}`}
        className="equipment-sheet"
        footer={
          <div className="equipment-footer">
            <Button intent="secondary" onClick={onClose}>Annuler</Button>
            <Button intent="primary" onClick={save} disabled={!canSave}>Enregistrer</Button>
          </div>
        }
      >
        <FormNav className="equipment-form" onSubmit={save}>
          <div className="equipment-form-pair">
          <Field label="Identifiant" htmlFor="kg-id" error={!draft.id.trim() ? 'Indique le numéro inscrit sur le fût.' : undefined}>
            <TextInput
              id="kg-id"
              name="keg_sheet_unique_id"
              aria-invalid={!draft.id.trim()}
              className={inputClass}
              value={draft.id}
              onChange={(id) => setDraft({ ...draft, id: id.trim() })}
            />
          </Field>

          <Field label="Capacité">
            <SegmentedControl
              label="Capacité du fût"
              className="equipment-choice"
              value={String(draft.capacityL)}
              onChange={(v) => setDraft({ ...draft, capacityL: parseInt(v, 10) })}
              options={capacities.map((c) => ({ value: String(c), label: `${c} L` }))}
            />
          </Field>
          </div>

          <Field label="État" hint={STATES.find(state => state.value === draft.state)?.hint}>
            <SegmentedControl
              label="État du fût"
              className="equipment-choice"
              value={draft.state}
              onChange={(state) =>
                setDraft({
                  ...draft,
                  state,
                  // Un fût qu'on lave ou qu'on range ne contient plus rien :
                  // garder l'ancienne bière ferait servir la mauvaise.
                  ...(state === 'lavage' || state === 'propre'
                    ? { batchRef: undefined, beerName: undefined, style: undefined, fillDate: undefined, clientName: undefined }
                    : {}),
                  ...(state === 'plein' ? { clientName: undefined } : {}),
                  ...(state === 'plein' && !draft.fillDate ? { fillDate: swissToday() } : {})
                })
              }
              options={STATES.map((s) => ({ value: s.value, label: s.label }))}
            />
          </Field>

          {needsBeer && (
            <>
              <Field label="Bière" htmlFor="kg-beer" error={!draft.batchRef ? 'Choisis le brassin qui remplit ce fût.' : undefined}>
                <Combobox
                  id="kg-beer"
                  ariaLabel="Bière du fût"
                  value={draft.batchRef ?? ''}
                  onChange={(id) => {
                    const b = batches.find((x) => x.id === id);
                    if (!b && id === draft.batchRef) return;
                    setDraft({
                      ...draft,
                      batchRef: id,
                      beerName: b?.name,
                      style: b?.style
                    });
                  }}
                  options={beerOptions}
                  placeholder="Chercher un brassin…"
                />
              </Field>

              <div className="equipment-date"><DateField
                label="Date de remplissage"
                value={draft.fillDate ?? ''}
                onChange={(fillDate) => setDraft({ ...draft, fillDate })}
                shortcuts={[{ label: "Aujourd’hui", offsetDays: 0 }, { label: 'Hier', offsetDays: -1 }]}
              /></div>
            </>
          )}

          {draft.state === 'livre' && (
            <Field label="Client" htmlFor="kg-client">
              <Input
                id="kg-client"
                name="keg_sheet_customer_label"
                type="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                className={inputClass}
                value={draft.clientName ?? ''}
                onChange={(e) => setDraft({ ...draft, clientName: e.target.value })}
              />
            </Field>
          )}

          <details className="equipment-disclosure">
          <summary>Notes <span>· {draft.notes || 'Aucune'}</span></summary>
          <Field label="Note sur le fût" htmlFor="kg-notes">
            <Input
              id="kg-notes"
              name="keg_sheet_general_notes"
              type="text"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
              className={inputClass}
              placeholder="Joint à changer, bosse sur le col…"
              value={draft.notes ?? ''}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </Field>
          </details>
        </FormNav>

        {!isNew && (
          <details className="equipment-disclosure equipment-management"><summary>Gestion du fût</summary>
            <Button intent="danger" size="sm" className="equipment-danger" onClick={() => setConfirmDelete(true)} icon={<Trash2 size={14}/>}>Supprimer</Button>
          </details>
        )}
      </Sheet>

      <ConfirmSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Supprimer ce fût ?"
        what={`Fût ${keg.id} — ${keg.capacityL} L${keg.beerName ? ` · ${keg.beerName}` : ''}`}
        consequence={
          keg.state === 'plein' || keg.state === 'livre'
            ? 'Ce fût est marqué comme rempli. Sa bière ne sera plus comptée dans le parc.'
            : 'Il quitte le parc de fûts. La suppression est journalisée.'
        }
        confirmLabel="Supprimer"
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete(keg);
          onClose();
        }}
      />
    </>
  );
};
