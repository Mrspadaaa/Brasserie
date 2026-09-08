import React, { useState, useEffect } from 'react';
import { Trash2, ArrowRight } from 'lucide-react';
import { Batch } from '../types';
import { BATCH_STATUS, BATCH_STATUSES, nextStatus, statusOf } from '../domain/batchStatus';
import { StorageService } from '../services/storage';
import { BrewingMath } from '../services/brewingMath';
import { Sheet, ConfirmSheet } from './Sheet';
import { Button } from '../components/ui/Button';
import { BrewerChat } from './BrewerChat';
import { useSyncedDraft } from '../hooks/useLiveData';
import { HopTastingsPanel } from './hopIndex/HopTastingsPanel';

/**
 * Fiche d'un brassin : changer d'étape, corriger les mesures, supprimer.
 *
 * ⚠️ Les deux problèmes qu'elle règle :
 *
 *  1. Passer un brassin en « annulé » l'enregistrait bien, mais l'écran
 *     retombait sur « Planifié » parce que la table de correspondance, écrite à
 *     la main, n'avait pas d'entrée `annule`. Elle vient maintenant de
 *     `BATCH_STATUS`, que TypeScript oblige à être exhaustive.
 *
 *  2. Un brassin ne pouvait tout simplement pas être supprimé : `deleteBatch`
 *     n'existait pas dans le service de données.
 */

interface BatchDetailSheetProps {
  batch: Batch | null;
  onClose: () => void;
}

export const BatchDetailSheet: React.FC<BatchDetailSheetProps> = ({ batch, onClose }) => {
  const [draft, setDraft] = useSyncedDraft(batch, batch?.id);
  const [confirmDelete, setConfirmDelete] = useState(false);


  if (!batch || !draft) return null;

  const style = statusOf(draft.status);
  const suivant = nextStatus(draft.status);

  const og = parseFloat(draft.og || '');
  const fg = parseFloat(draft.fg || '');
  const abv = og && fg && og > fg ? BrewingMath.calculateABV(og, fg) : null;

  const field =
    'w-full min-h-touch px-3 rounded-control bg-cave-950 border border-cave-700 ' +
    'text-cave-100 text-base focus:outline-none focus:border-ebc-straw transition-colors';

  const save = (patch: Partial<Batch>) => {
    const updated = { ...draft, ...patch };
    setDraft(updated);
    StorageService.updateBatch(updated);
  };

  return (
    <>
      <Sheet
        open={!!batch}
        onClose={onClose}
        title={draft.name}
        subtitle={`${draft.id} · ${draft.style} · ${draft.volumeL} L`}
        footer={
          <Button intent="primary" full onClick={onClose}>
            Fermer
          </Button>
        }
      >
        <div className="space-y-7">
          <BrewerChat scope={{kind:'batch',id:batch.id}} label={draft.name} phase={draft.status} />
          <HopTastingsPanel batch={draft} />
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-control border text-sm ${style.chip}`}>
                {style.label}
              </span>
              <span className="text-sm text-cave-400">{style.hint}</span>
            </div>

            {suivant && (
              <Button
                intent="primary"
                full
                onClick={() => save({ status: suivant })}
                icon={<ArrowRight className="w-5 h-5" />}
              >
                Passer en « {BATCH_STATUS[suivant].label} »
              </Button>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-semibold text-cave-100">Étape</h3>
            <div className="grid grid-cols-2 gap-2">
              {BATCH_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => save({ status: s })}
                  aria-pressed={draft.status === s}
                  className={`min-h-touch px-3 rounded-control border text-sm transition-colors ${
                    draft.status === s
                      ? BATCH_STATUS[s].chip
                      : 'bg-cave-950 border-cave-700 text-cave-400 hover:text-cave-100'
                  }`}
                >
                  {BATCH_STATUS[s].label}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-base font-semibold text-cave-100">Mesures</h3>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1.5">
                <span className="text-sm text-cave-400">Densité initiale</span>
                <input
                  name="batch_sheet_og"
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-form-type="other"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  className={`${field} font-mono`}
                  inputMode="decimal"
                  placeholder="1.062"
                  value={draft.og || ''}
                  onChange={(e) => setDraft({ ...draft, og: e.target.value })}
                  onBlur={() => save({ og: draft.og })}
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm text-cave-400">Densité finale</span>
                <input
                  name="batch_sheet_fg"
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-form-type="other"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  className={`${field} font-mono`}
                  inputMode="decimal"
                  placeholder="1.014"
                  value={draft.fg || ''}
                  onChange={(e) => setDraft({ ...draft, fg: e.target.value })}
                  onBlur={() => save({ fg: draft.fg, abv: abv ? `${abv}%` : draft.abv })}
                />
              </label>
            </div>

            {abv !== null && (
              <p className="text-sm text-cave-400">
                Alcool calculé : <span className="font-mono text-hop">{abv} % vol</span>
              </p>
            )}

            <label className="block space-y-1.5">
              <span className="text-sm text-cave-400">Date de brassage</span>
              <input
                name="batch_sheet_brewdate"
                type="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                className={field}
                value={draft.brewDate}
                onChange={(e) => setDraft({ ...draft, brewDate: e.target.value })}
                onBlur={() => save({ brewDate: draft.brewDate })}
              />
            </label>
          </section>

          <section className="space-y-4">
            <h3 className="text-base font-semibold text-cave-100">Carnet</h3>

            {(
              [
                ['notesCreation', 'Avant — inspiration, profil visé'],
                ['notesBrewDay', 'Pendant — jour de brassage'],
                ['notesTasting', 'Après — fermentation, dégustation']
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block space-y-1.5">
                <span className="text-sm text-cave-400">{label}</span>
                <textarea
                  name={`batch_sheet_${key}`}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-form-type="other"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  rows={3}
                  className={`${field} py-2 resize-y leading-relaxed`}
                  value={draft[key] || ''}
                  onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                  onBlur={() => save({ [key]: draft[key] })}
                />
              </label>
            ))}
          </section>

          <section className="pt-2 border-t border-cave-800">
            <Button
              intent="danger"
              full
              onClick={() => setConfirmDelete(true)}
              icon={<Trash2 className="w-5 h-5" />}
            >
              Supprimer ce brassin
            </Button>
          </section>
        </div>
      </Sheet>

      <ConfirmSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          StorageService.deleteBatch(batch.id);
          onClose();
        }}
        title="Supprimer ce brassin ?"
        what={`${batch.id} — ${batch.name}`}
        consequence={
          batch.status === 'planifie'
            ? 'Rien n’a encore été déstocké : la suppression est sans conséquence sur le stock.'
            : "Les ingrédients déjà consommés ne seront PAS rendus au stock. Pour les récupérer, passe plutôt le brassin en « Annulé », qui garde la trace de ce qui s’est passé."
        }
        confirmLabel="Supprimer le brassin"
      />
    </>
  );
};
