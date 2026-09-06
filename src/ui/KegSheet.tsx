import React, { useEffect, useState } from 'react';
import { KegItem, KegState, Batch } from '../types';
import { Sheet, ConfirmSheet } from './Sheet';
import { FormNav, Field, TextInput, inputClass } from './FormNav';
import { SegmentedControl } from './SegmentedControl';
import { Combobox } from './Combobox';
import { DateField, swissToday } from './DateField';
import { Trash2 } from 'lucide-react';

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
  const [draft, setDraft] = useState<KegItem | null>(keg);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => setDraft(keg), [keg]);
  if (!keg || !draft) return null;

  const isNew = !keg.beerName && keg.state === 'propre' && !keg.fillDate;
  const needsBeer = draft.state === 'plein' || draft.state === 'livre';
  const canSave = !needsBeer || Boolean(draft.batchRef);

  const save = () => {
    onSave(draft);
    onClose();
  };

  return (
    <>
      <Sheet
        open={Boolean(keg)}
        onClose={onClose}
        title={isNew ? 'Nouveau fût' : `Fût ${keg.id}`}
        subtitle={isNew ? undefined : `${keg.capacityL} L · ${keg.beerName ?? 'vide'}`}
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
              disabled={!canSave}
              className="flex-1 min-h-touch rounded-control bg-ebc-straw text-cave-950
                         font-semibold disabled:opacity-40"
            >
              {canSave ? 'Enregistrer' : 'Choisis la bière'}
            </button>
          </div>
        }
      >
        <FormNav className="space-y-5" onSubmit={() => canSave && save()}>
          <Field label="Identifiant" htmlFor="kg-id" hint="Ce qui est gravé ou collé sur le fût.">
            <TextInput
              id="kg-id"
              name="keg_sheet_unique_id"
              className={`${inputClass} font-mono`}
              value={draft.id}
              onChange={(id) => setDraft({ ...draft, id: id.trim() })}
            />
          </Field>

          <Field label="Capacité">
            <SegmentedControl
              label="Capacité du fût"
              value={String(draft.capacityL)}
              onChange={(v) => setDraft({ ...draft, capacityL: parseInt(v, 10) })}
              options={CAPACITIES.map((c) => ({ value: String(c), label: `${c} L` }))}
            />
          </Field>

          <Field label="État">
            <SegmentedControl
              label="État du fût"
              layout="grid"
              value={draft.state}
              onChange={(state) =>
                setDraft({
                  ...draft,
                  state,
                  // Un fût qu'on lave ou qu'on range ne contient plus rien :
                  // garder l'ancienne bière ferait servir la mauvaise.
                  ...(state === 'lavage' || state === 'propre'
                    ? { batchRef: undefined, beerName: undefined, style: undefined, fillDate: undefined }
                    : {}),
                  ...(state === 'plein' && !draft.fillDate ? { fillDate: swissToday() } : {})
                })
              }
              options={STATES.map((s) => ({ value: s.value, label: s.label, hint: s.hint }))}
            />
          </Field>

          {needsBeer && (
            <>
              <Field label="Bière" hint="Le brassin qui remplit ce fût.">
                <Combobox
                  value={draft.batchRef ?? ''}
                  onChange={(id) => {
                    const b = batches.find((x) => x.id === id);
                    setDraft({
                      ...draft,
                      batchRef: id,
                      beerName: b?.name,
                      style: b?.style
                    });
                  }}
                  options={batches
                    .filter((b) => b.status !== 'annule')
                    .map((b) => ({
                      value: b.id,
                      label: `${b.id} — ${b.name}`,
                      detail: [b.style, b.brewDate].filter(Boolean).join(' · ')
                    }))}
                  placeholder="Chercher un brassin…"
                />
              </Field>

              <DateField
                label="Date de remplissage"
                value={draft.fillDate ?? ''}
                onChange={(fillDate) => setDraft({ ...draft, fillDate })}
              />
            </>
          )}

          {draft.state === 'livre' && (
            <Field label="Client" htmlFor="kg-client">
              <input
                id="kg-partner"
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

          <Field label="Notes">
            <input
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
