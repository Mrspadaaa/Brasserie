import React, { useState } from 'react';
import { Beer, Droplets, Sparkles, Truck, Trash2 } from 'lucide-react';
import { KegItem, KegState, Batch } from '../types';
import { StorageService } from '../services/storage';
import { Sheet, ConfirmSheet } from './Sheet';
import { Button } from '../components/ui/Button';

/**
 * Parc de fûts.
 *
 * Le cycle d'un fût est physique et circulaire : on le lave, il est propre, on
 * le remplit, on le livre, il revient sale. L'ancienne version faisait tourner
 * ce cycle sur un simple clic — sans confirmation, sans possibilité de revenir
 * en arrière, et sans jamais demander QUELLE bière on met dedans.
 *
 * Ici chaque transition est explicite, et remplir un fût demande de choisir le
 * brassin : sans ça, un fût plein ne dit pas ce qu'il contient.
 */

const KEG_STATE: Record<KegState, { label: string; hint: string; chip: string; Icon: typeof Beer }> = {
  lavage: {
    label: 'À laver',
    hint: 'Revenu de livraison, pas encore nettoyé',
    chip: 'bg-alert/15 text-alert border-alert/40',
    Icon: Droplets
  },
  propre: {
    label: 'Propre',
    hint: 'Nettoyé et désinfecté, prêt à remplir',
    chip: 'bg-water/15 text-water border-water/40',
    Icon: Sparkles
  },
  plein: {
    label: 'Plein',
    hint: 'Rempli, en garde ou prêt à partir',
    chip: 'bg-ebc-straw/15 text-ebc-straw border-ebc-straw/40',
    Icon: Beer
  },
  livre: {
    label: 'Livré',
    hint: 'Chez le client',
    chip: 'bg-hop/15 text-hop border-hop/40',
    Icon: Truck
  }
};

/** Transitions autorisées, dans le sens du cycle physique. */
const NEXT: Record<KegState, KegState> = {
  lavage: 'propre',
  propre: 'plein',
  plein: 'livre',
  livre: 'lavage'
};

export const KegBoard: React.FC<{ kegs: KegItem[]; batches: Batch[]; className?: string }> = ({
  kegs,
  batches,
  className = ''
}) => {
  const [selected, setSelected] = useState<KegItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fillable = batches.filter(
    (b) => b.status === 'conditionne' || b.status === 'garde' || b.status === 'fermentation'
  );

  const counts = (Object.keys(KEG_STATE) as KegState[]).map((s) => ({
    state: s,
    n: kegs.filter((k) => k.state === s).length
  }));

  const setState = (keg: KegItem, state: KegState, batch?: Batch) => {
    StorageService.updateKeg({
      ...keg,
      state,
      // Remplir attache la bière ; vider la détache, sinon un fût propre
      // continuerait d'afficher le contenu du brassin précédent.
      batchRef: state === 'plein' ? batch?.id : undefined,
      beerName: state === 'plein' ? batch?.name : undefined,
      style: state === 'plein' ? batch?.style : undefined,
      fillDate: state === 'plein' ? new Date().toLocaleDateString('fr-CH') : undefined,
      clientName: state === 'livre' ? keg.clientName : undefined
    });
  };

  return (
    <div className={`overflow-y-auto space-y-4 pb-4 ${className}`}>
      <div className="grid grid-cols-4 gap-2">
        {counts.map(({ state, n }) => {
          const s = KEG_STATE[state];
          return (
            <div key={state} className={`panel px-2 py-3 text-center border ${s.chip}`}>
              <s.Icon className="w-5 h-5 mx-auto mb-1" />
              <div className="reading text-lg">{n}</div>
              <div className="text-footnote leading-tight">{s.label}</div>
            </div>
          );
        })}
      </div>

      {kegs.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <p className="text-base text-cave-200">Aucun fût enregistré</p>
          <p className="text-sm text-cave-400">Les fûts se créent depuis les réglages du parc.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {kegs.map((keg) => {
            const s = KEG_STATE[keg.state] ?? KEG_STATE.lavage;
            return (
              <button
                key={keg.id}
                onClick={() => setSelected(keg)}
                className="panel p-4 text-left space-y-2 hover:border-cave-700 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-base text-cave-50">{keg.id}</span>
                  <span className="text-sm text-cave-400">{keg.capacityL} L</span>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-control border text-sm ${s.chip}`}
                >
                  <s.Icon className="w-4 h-4 shrink-0" />
                  {s.label}
                </span>

                {keg.beerName && (
                  <p className="text-sm text-cave-200 truncate">{keg.beerName}</p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <>
          <Sheet
            open={!!selected}
            onClose={() => setSelected(null)}
            title={`Fût ${selected.id}`}
            subtitle={`${selected.capacityL} L · ${KEG_STATE[selected.state].label}`}
            footer={
              <Button intent="secondary" full onClick={() => setSelected(null)}>
                Fermer
              </Button>
            }
          >
            <div className="space-y-6">
              <p className="text-sm text-cave-400">{KEG_STATE[selected.state].hint}</p>

              {selected.beerName && (
                <div className="panel p-4 space-y-1">
                  <p className="text-base text-cave-50">{selected.beerName}</p>
                  {selected.style && <p className="text-sm text-cave-400">{selected.style}</p>}
                  {selected.fillDate && (
                    <p className="text-sm text-cave-400">Rempli le {selected.fillDate}</p>
                  )}
                </div>
              )}

              <section className="space-y-3">
                <h3 className="text-base font-semibold text-cave-100">Étape suivante</h3>

                {selected.state === 'propre' ? (
                  fillable.length === 0 ? (
                    <p className="text-sm text-cave-400">
                      Aucun brassin disponible à enfûter. Un brassin doit être au moins en
                      fermentation.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-cave-400">Remplir avec :</p>
                      {fillable.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => {
                            setState(selected, 'plein', b);
                            setSelected(null);
                          }}
                          className="w-full min-h-touch px-4 rounded-control bg-cave-850
                                     border border-cave-700 text-left text-base text-cave-100
                                     hover:border-ebc-straw transition-colors"
                        >
                          {b.name}
                          <span className="text-cave-400"> · {b.id}</span>
                        </button>
                      ))}
                    </div>
                  )
                ) : (
                  <Button
                    intent="primary"
                    full
                    onClick={() => {
                      setState(selected, NEXT[selected.state]);
                      setSelected(null);
                    }}
                  >
                    Passer à « {KEG_STATE[NEXT[selected.state]].label} »
                  </Button>
                )}
              </section>

              <Button
                intent="danger"
                full
                onClick={() => setConfirmDelete(true)}
                icon={<Trash2 className="w-5 h-5" />}
              >
                Retirer ce fût du parc
              </Button>
            </div>
          </Sheet>

          <ConfirmSheet
            open={confirmDelete}
            onClose={() => setConfirmDelete(false)}
            onConfirm={() => {
              StorageService.deleteKeg(selected.id);
              setSelected(null);
            }}
            title="Retirer ce fût ?"
            what={`Fût ${selected.id} — ${selected.capacityL} L`}
            consequence={
              selected.state === 'plein'
                ? `⚠️ Ce fût est plein (${selected.beerName}). Le retirer ne restitue pas son contenu au stock.`
                : 'Le fût disparaît du parc.'
            }
            confirmLabel="Retirer le fût"
          />
        </>
      )}
    </div>
  );
};
