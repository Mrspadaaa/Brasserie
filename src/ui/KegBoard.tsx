import React, { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Beer, ChevronRight, CircleHelp, Droplets, Sparkles, Truck, Trash2 } from 'lucide-react';
import { KegItem, KegState, Batch } from '../types';
import { StorageService } from '../services/storage';
import { Sheet, ConfirmSheet } from './Sheet';
import { useLiveSelection } from '../hooks/useLiveData';
import { Button } from '../components/ui/Button';
import { isCurrent } from '../domain/catalogOrganization';
import { EntityList } from './EntityList';
import { SegmentedControl } from './SegmentedControl';
import { Combobox } from './Combobox';
import { Field, FormNav, TextInput } from './FormNav';
import { swissToday } from './DateField';
import './equipment-compact.css';

const KEG_STATE: Record<KegState, { label: string; filter: string; hint: string; Icon: typeof Beer }> = {
  lavage: { label: 'À laver', filter: 'À laver', hint: 'Revenu vide, à nettoyer avant remplissage.', Icon: Droplets },
  propre: { label: 'Propre', filter: 'Propres', hint: 'Nettoyé et désinfecté, prêt à remplir.', Icon: Sparkles },
  plein: { label: 'Plein', filter: 'Pleins', hint: 'Rempli, en garde ou prêt à partir.', Icon: Beer },
  livre: { label: 'Livré', filter: 'Livrés', hint: 'Chez le client, en attente de retour.', Icon: Truck }
};
const STATES = Object.keys(KEG_STATE) as KegState[];
const isKnownState = (value: unknown): value is KegState => typeof value === 'string' && Object.prototype.hasOwnProperty.call(KEG_STATE, value);
const UNKNOWN_STATE = { label: 'État inconnu', hint: 'Choisis l’état réel du fût. Son contenu enregistré est conservé.', Icon: CircleHelp };
const SEARCH_KEYS = ['id', 'beerName', 'batchRef', 'clientName', 'notes'];
const NEXT: Record<KegState, KegState> = { lavage: 'propre', propre: 'plein', plein: 'livre', livre: 'lavage' };
const NEXT_LABEL: Record<KegState, string> = {
  lavage: 'Marquer propre', propre: 'Remplir le fût', plein: 'Livrer le fût', livre: 'Retour à laver'
};

/** Le contenu reste attaché pendant la livraison ; seul le retour vide le détache. */
export const KegBoard: React.FC<{ kegs: KegItem[]; batches: Batch[]; className?: string }> = ({
  kegs, batches, className = ''
}) => {
  const listId = useId();
  const [selected, setSelected] = useLiveSelection(kegs, 'id');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [filter, setFilter] = useState<KegState | 'all' | 'unknown'>('all');
  const filterRef = useRef<HTMLDivElement>(null);
  const [fillBatch, setFillBatch] = useState('');
  const [deliveryClient, setDeliveryClient] = useState('');
  const [repairedState, setRepairedState] = useState<KegState | ''>('');
  const [repairAttempted, setRepairAttempted] = useState(false);
  const repairInput = useRef<HTMLSelectElement>(null);
  const fillable = batches.filter(b => isCurrent(b) && ['conditionne', 'garde', 'fermentation'].includes(b.status));
  const batchToFill = fillable.find(b => b.id === fillBatch);
  const filtered = useMemo(() => filter === 'all' ? kegs : kegs.filter(k => filter === 'unknown' ? !isKnownState(k.state) : k.state === filter), [kegs, filter]);
  const counts = kegs.reduce((result, keg) => {
    result[isKnownState(keg.state) ? keg.state : 'unknown'] += 1;
    return result;
  }, { lavage: 0, propre: 0, plein: 0, livre: 0, unknown: 0 });
  const selectedUnknown = Boolean(selected && !isKnownState(selected.state));
  const selectedState = selected && isKnownState(selected.state) ? KEG_STATE[selected.state] : UNKNOWN_STATE;

  useLayoutEffect(() => {
    // Aussi après « Voir tous les fûts », qui change le filtre sans cibler sa puce.
    filterRef.current?.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [filter]);

  const close = () => { setSelected(null); setConfirmDelete(false); setRepairedState(''); setRepairAttempted(false); };
  const advance = () => {
    if (!selected || (selected.state === 'propre' && !batchToFill)) return;
    if (!isKnownState(selected.state)) {
      if (!repairedState) { setRepairAttempted(true); repairInput.current?.focus(); return; }
      // Corriger une donnée importée ne constitue ni un retour vide ni un remplissage.
      StorageService.updateKeg({ ...selected, state: repairedState });
      close();
      return;
    }
    const state = NEXT[selected.state];
    const empty = state === 'lavage' || state === 'propre';
    StorageService.updateKeg({
      ...selected,
      state,
      ...(empty ? { batchRef: undefined, beerName: undefined, style: undefined, fillDate: undefined, clientName: undefined } : {}),
      ...(state === 'plein' && batchToFill ? {
        batchRef: batchToFill.id, beerName: batchToFill.name, style: batchToFill.style,
        fillDate: swissToday(), clientName: undefined
      } : {}),
      ...(state === 'livre' ? { clientName: deliveryClient.trim() || undefined } : {})
    });
    close();
  };

  return (
    <>
      <EntityList
        className={`equipment-list ${className}`}
        items={filtered}
        keyOf={keg => keg.id}
        searchKeys={SEARCH_KEYS}
        searchPlaceholder="Chercher un fût, une bière, un client…"
        header={
          <div ref={filterRef} className="min-w-0">
          <SegmentedControl
            label="Filtrer les fûts par état"
            className="equipment-filters keg-filters"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: `Tous · ${kegs.length}` },
              ...STATES.map(state => ({ value: state, label: `${KEG_STATE[state].filter} · ${counts[state]}` })),
              ...(counts.unknown || filter === 'unknown' ? [{ value: 'unknown' as const, label: `État inconnu · ${counts.unknown}` }] : [])
            ]}
          />
          </div>
        }
        emptyState={
          <div className="equipment-empty">
            <p>{filter !== 'all' && kegs.length ? `Aucun fût « ${filter === 'unknown' ? UNKNOWN_STATE.label : KEG_STATE[filter].label} »` : 'Aucun fût enregistré'}</p>
            {kegs.length ? <Button intent="secondary" size="sm" onClick={() => setFilter('all')}>Voir tous les fûts</Button>
              : <p className="text-cave-400">Ajoute un fût avec la commande « Ajouter ».</p>}
          </div>
        }
        renderItem={keg => {
          const unknown = !isKnownState(keg.state);
          const state = unknown ? UNKNOWN_STATE : KEG_STATE[keg.state];
          const descriptionId = `${listId}-${encodeURIComponent(keg.id)}`;
          return (
            <button type="button" className="equipment-row keg-row" aria-label={`Ouvrir le fût ${keg.id}`} aria-describedby={`${descriptionId}-content ${descriptionId}-state`} onClick={() => {
              setFillBatch(''); setDeliveryClient(keg.clientName ?? ''); setRepairedState(''); setRepairAttempted(false); setSelected(keg);
            }}>
              <span id={`${descriptionId}-content`} className="equipment-row-main">
                <span className="keg-identity"><strong>{keg.id}</strong><span className="equipment-reading">{keg.capacityL} L</span></span>
                {(keg.state === 'plein' || keg.state === 'livre' || unknown && (keg.beerName || keg.batchRef)) && <span className="equipment-row-context">{keg.beerName || 'Bière non renseignée'}{keg.batchRef && <span className="text-cave-400"> · {keg.batchRef}</span>}</span>}
                {(keg.state === 'livre' || unknown && keg.clientName) && <span className="equipment-row-meta">{keg.clientName || 'Client non renseigné'}</span>}
                {keg.notes && <span className="equipment-row-meta">{keg.notes}</span>}
              </span>
              <span id={`${descriptionId}-state`} className="equipment-state" data-keg-state={unknown ? 'unknown' : keg.state}><state.Icon size={13} aria-hidden="true"/>{state.label}</span>
              <ChevronRight className="equipment-row-chevron" size={14} aria-hidden="true"/>
            </button>
          );
        }}
      />

      {selected && (
        <>
          <Sheet
            open onClose={close} title={`Fût ${selected.id}`}
            subtitle={`${selected.capacityL} L · ${selectedState.label}`}
            className="equipment-sheet"
            footer={<div className="equipment-footer"><Button intent="secondary" onClick={close}>Annuler</Button><Button intent="primary" disabled={selectedUnknown ? !repairedState : selected.state === 'propre' && !batchToFill} onClick={advance}>{selectedUnknown ? 'Enregistrer l’état' : NEXT_LABEL[selected.state]}</Button></div>}
          >
            <FormNav className="equipment-form" onSubmit={advance}>
              <p className="equipment-help">{selectedState.hint}</p>
              {selectedUnknown && <Field label="État réel du fût" htmlFor="keg-repair-state">
                <select ref={repairInput} id="keg-repair-state" name="keg_repair_state" value={repairedState} required
                  aria-invalid={repairAttempted && !repairedState} aria-describedby={repairAttempted && !repairedState ? 'keg-repair-state-error' : undefined}
                  className="w-full min-h-touch-lg rounded-control border border-cave-700 bg-cave-950 px-2 text-base text-cave-50"
                  onChange={event => { setRepairedState(isKnownState(event.target.value) ? event.target.value : ''); setRepairAttempted(false); }}>
                  <option value="" disabled>Choisir l’état…</option>
                  {STATES.map(state => <option key={state} value={state}>{KEG_STATE[state].label}</option>)}
                </select>
                {repairAttempted && !repairedState && <p id="keg-repair-state-error" role="alert" className="text-xs text-alert-strong">Choisis l’état du fût avant d’enregistrer.</p>}
              </Field>}
              {(selected.state === 'plein' || selected.state === 'livre' || selectedUnknown) && (
                <dl className="equipment-facts">
                  <div><dt>Bière</dt><dd>{selected.beerName || 'Non renseignée'}{selected.style && <span className="text-cave-400"> · {selected.style}</span>}</dd></div>
                  <div><dt>Brassin</dt><dd>{selected.batchRef || 'Non renseigné'}</dd></div>
                  <div><dt>Rempli le</dt><dd>{selected.fillDate || 'Non renseigné'}</dd></div>
                  {(selected.state === 'livre' || selectedUnknown) && <div><dt>Client</dt><dd>{selected.clientName || 'Non renseigné'}</dd></div>}
                </dl>
              )}
              {selected.state === 'propre' && (fillable.length ? (
                <Field label="Brassin à enfûter" htmlFor="keg-fill-batch" hint="Choisis la bière, puis confirme le remplissage.">
                  <Combobox id="keg-fill-batch" ariaLabel="Brassin à enfûter" value={fillBatch} onChange={setFillBatch}
                    options={fillable.map(batch => ({ value: batch.id, label: `${batch.name} · ${batch.id}`, detail: batch.style }))}
                    placeholder="Choisir un brassin…"/>
                </Field>
              ) : <p className="equipment-help">Aucun brassin disponible à enfûter. Un brassin doit être au moins en fermentation.</p>)}
              {selected.state === 'plein' && <Field label="Client de livraison (facultatif)" htmlFor="keg-delivery-client"><TextInput id="keg-delivery-client" name="keg_delivery_customer" value={deliveryClient} onChange={setDeliveryClient}/></Field>}
              {selected.state === 'livre' && <p className="equipment-help">Confirme le retour du fût vide pour le remettre à laver.</p>}
              {selected.notes && <p className="equipment-note"><span>Note · </span>{selected.notes}</p>}
            </FormNav>
            <details className="equipment-disclosure equipment-management">
              <summary>Gestion du fût</summary>
              <Button intent="danger" size="sm" className="equipment-danger" onClick={() => setConfirmDelete(true)} icon={<Trash2 size={14}/>}>Retirer du parc</Button>
            </details>
          </Sheet>
          <ConfirmSheet
            open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Retirer ce fût ?"
            what={`Fût ${selected.id} — ${selected.capacityL} L`}
            consequence={selected.state === 'plein' || selected.state === 'livre' || selectedUnknown && (selected.beerName || selected.batchRef)
              ? `Ce fût contient ${selected.beerName || 'une bière non renseignée'}. Le retirer ne restitue pas son contenu au stock.`
              : 'Le fût disparaît du parc.'}
            confirmLabel="Retirer le fût" onConfirm={() => { StorageService.deleteKeg(selected.id); close(); }}/>
        </>
      )}
    </>
  );
};
