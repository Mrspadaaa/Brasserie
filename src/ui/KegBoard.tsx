import React, { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Beer, ChevronRight, CircleHelp, Droplets, Sparkles, Truck, Trash2 } from 'lucide-react';
import { KegItem, KegState, Batch, Client } from '../types';
import { StorageService } from '../services/storage';
import { Sheet, ConfirmSheet } from './Sheet';
import { useLiveSelection } from '../hooks/useLiveData';
import { Button } from '../components/ui/Button';
import { EntityList } from './EntityList';
import { SegmentedControl } from './SegmentedControl';
import { Field, FormNav } from './FormNav';
import { swissToday } from './DateField';
import { KegFiche } from './KegFiche';
import { KegFillSheet } from './KegFillSheet';
import { KegAddSheet } from './KegAddSheet';
import './equipment-compact.css';
import { nombreFr } from '../domain/nombreAffiche';

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

interface KegBoardProps {
  kegs: KegItem[];
  batches: Batch[];
  /** Les clients de l'onglet Clients : la fiche d'un fût plein en choisit un pour livrer. */
  clients?: Client[];
  className?: string;
  /** Jour de référence (`JJ.MM.AAAA`) des âges et des gestes ; le banc de développement le fige. */
  today?: string;
  /** Le bouton rond « + » de l'onglet demande « Ajouter des fûts ». */
  addOpen?: boolean;
  onAddClose?: () => void;
  /** Écritures : par défaut le stockage ; le banc de développement passe les siennes, en mémoire. */
  onSaveKeg?: (keg: KegItem) => void;
  onAddKegs?: (kegs: KegItem[]) => void;
  onRemoveKeg?: (id: string) => void;
  onMessage?: (message: string) => void;
}

/**
 * Le parc de fûts. Toucher un fût ouvre sa fiche d'identité (F2) ; la barre de la liste ouvre « Remplir depuis un lot » (R1) ;
 * le bouton rond « + » ouvre « Ajouter des fûts ». Le contenu reste attaché pendant la livraison ; seul le retour vide le détache.
 */
export const KegBoard: React.FC<KegBoardProps> = ({
  kegs, batches, clients = [], className = '', today, addOpen = false, onAddClose, onSaveKeg, onAddKegs, onRemoveKeg, onMessage
}) => {
  const jour = today ?? swissToday();
  const save = onSaveKeg ?? ((keg: KegItem) => StorageService.updateKeg(keg));
  const addMany = onAddKegs ?? ((list: KegItem[]) => list.forEach((keg) => StorageService.addKeg(keg)));
  const remove = onRemoveKeg ?? ((id: string) => StorageService.deleteKeg(id));
  const listId = useId();
  const [selected, setSelected] = useLiveSelection(kegs, 'id');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [fill, setFill] = useState<{ kegId?: string } | null>(null);
  const [filter, setFilter] = useState<KegState | 'all' | 'unknown'>('all');
  const filterRef = useRef<HTMLDivElement>(null);
  const [repairedState, setRepairedState] = useState<KegState | ''>('');
  const [repairAttempted, setRepairAttempted] = useState(false);
  const repairInput = useRef<HTMLSelectElement>(null);
  const filtered = useMemo(() => filter === 'all' ? kegs : kegs.filter(k => filter === 'unknown' ? !isKnownState(k.state) : k.state === filter), [kegs, filter]);
  const counts = kegs.reduce((result, keg) => {
    result[isKnownState(keg.state) ? keg.state : 'unknown'] += 1;
    return result;
  }, { lavage: 0, propre: 0, plein: 0, livre: 0, unknown: 0 });
  const selectedUnknown = Boolean(selected && !isKnownState(selected.state));

  useLayoutEffect(() => {
    // Aussi après « Voir tous les fûts », qui change le filtre sans cibler sa puce.
    filterRef.current?.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [filter]);

  const close = () => { setSelected(null); setConfirmDelete(false); setRepairedState(''); setRepairAttempted(false); };
  /** Seul l'état inconnu (donnée importée) se corrige ici ; les quatre états connus passent par la fiche d'identité. */
  const repair = () => {
    if (!selected || isKnownState(selected.state)) return;
    if (!repairedState) { setRepairAttempted(true); repairInput.current?.focus(); return; }
    // Corriger une donnée importée ne constitue ni un retour vide ni un remplissage.
    save({ ...selected, state: repairedState });
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
        toolbarAction={<Button intent="secondary" onClick={() => setFill({})}>Remplir depuis un lot</Button>}
        resetKey={filter}
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
              : <p className="text-cave-400">Ajoute des fûts avec le bouton « + ».</p>}
          </div>
        }
        renderItem={keg => {
          const unknown = !isKnownState(keg.state);
          const state = unknown ? UNKNOWN_STATE : KEG_STATE[keg.state];
          const descriptionId = `${listId}-${encodeURIComponent(keg.id)}`;
          return (
            <button type="button" className="equipment-row keg-row" aria-label={`Ouvrir le fût ${keg.id}`} aria-describedby={`${descriptionId}-content ${descriptionId}-state`} onClick={() => {
              setRepairedState(''); setRepairAttempted(false); setSelected(keg);
            }}>
              <span id={`${descriptionId}-content`} className="equipment-row-main">
                <span className="keg-identity"><strong>{keg.id}</strong><span className="equipment-reading">{nombreFr(keg.capacityL, 1)} L</span></span>
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

      {selected && !selectedUnknown && !fill && (
        <KegFiche
          key={selected.id} keg={selected} batches={batches} clients={clients} today={jour}
          onClose={close} onSave={save}
          onFill={(kegId) => { setSelected(null); setFill({ kegId }); }}
          onRemove={() => setConfirmDelete(true)}/>
      )}

      {selected && selectedUnknown && (
        <Sheet
          open onClose={close} title={`Fût ${selected.id}`}
          subtitle={`${nombreFr(selected.capacityL, 1)} L · ${UNKNOWN_STATE.label}`}
          className="equipment-sheet"
          footer={<div className="equipment-footer"><Button intent="secondary" onClick={close}>Annuler</Button><Button intent="primary" disabled={!repairedState} onClick={repair}>Enregistrer l’état</Button></div>}
        >
          <FormNav className="equipment-form" onSubmit={repair}>
            <p className="equipment-help">{UNKNOWN_STATE.hint}</p>
            <Field label="État réel du fût" htmlFor="keg-repair-state">
              <select ref={repairInput} id="keg-repair-state" name="keg_repair_state" value={repairedState} required
                aria-invalid={repairAttempted && !repairedState} aria-describedby={repairAttempted && !repairedState ? 'keg-repair-state-error' : undefined}
                className="w-full min-h-touch-lg rounded-control border border-cave-700 bg-cave-950 px-2 text-base text-cave-50"
                onChange={event => { setRepairedState(isKnownState(event.target.value) ? event.target.value : ''); setRepairAttempted(false); }}>
                <option value="" disabled>Choisir l’état…</option>
                {STATES.map(state => <option key={state} value={state}>{KEG_STATE[state].label}</option>)}
              </select>
              {repairAttempted && !repairedState && <p id="keg-repair-state-error" role="alert" className="text-xs text-alert-strong">Choisis l’état du fût avant d’enregistrer.</p>}
            </Field>
            <dl className="equipment-facts">
              <div><dt>Bière</dt><dd>{selected.beerName || 'Non renseignée'}{selected.style && <span className="text-cave-400"> · {selected.style}</span>}</dd></div>
              <div><dt>Brassin</dt><dd>{selected.batchRef || 'Non renseigné'}</dd></div>
              <div><dt>Rempli le</dt><dd>{selected.fillDate || 'Non renseigné'}</dd></div>
              <div><dt>Client</dt><dd>{selected.clientName || 'Non renseigné'}</dd></div>
            </dl>
            {selected.notes && <p className="equipment-note"><span>Note · </span>{selected.notes}</p>}
          </FormNav>
          <details className="equipment-disclosure equipment-management">
            <summary>Gestion du fût</summary>
            <Button intent="danger" size="sm" className="equipment-danger" onClick={() => setConfirmDelete(true)} icon={<Trash2 size={14}/>}>Retirer du parc</Button>
          </details>
        </Sheet>
      )}

      {selected && (
        <ConfirmSheet
          open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Retirer ce fût ?"
          what={`Fût ${selected.id} — ${nombreFr(selected.capacityL, 1)} L`}
          consequence={`${selected.state === 'plein' || selected.state === 'livre' || selectedUnknown && (selected.beerName || selected.batchRef)
            ? `Ce fût contient ${selected.beerName || 'une bière non renseignée'}. Le retirer ne restitue pas son contenu au stock.`
            : 'Le fût disparaît du parc.'} Son historique reste au journal.`}
          confirmLabel="Retirer le fût" onConfirm={() => { remove(selected.id); close(); }}/>
      )}

      {fill && (
        <KegFillSheet
          kegs={kegs} batches={batches} today={jour} initialKegId={fill.kegId} onClose={() => setFill(null)}
          onFill={(filled, batch) => {
            filled.forEach((keg) => save(keg));
            onMessage?.(`${filled.length > 1 ? `${filled.length} fûts remplis` : `Fût ${filled[0].id} rempli`} · ${batch.name} ${batch.id}.`);
          }}/>
      )}

      {addOpen && (
        <KegAddSheet
          existants={kegs.map((k) => k.id)} today={jour} onClose={() => onAddClose?.()}
          onAdd={(list) => { addMany(list); onMessage?.(list.length > 1 ? `${list.length} fûts ajoutés : ${list[0].id} à ${list[list.length - 1].id}.` : `Fût ${list[0].id} ajouté.`); }}/>
      )}
    </>
  );
};
