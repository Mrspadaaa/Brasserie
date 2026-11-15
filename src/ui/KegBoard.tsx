import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Beer, ChevronRight, CircleHelp, Droplets, Sparkles, Truck, Trash2 } from 'lucide-react';
import { KegItem, KegState, Batch, Client } from '../types';
import { StorageService } from '../services/storage';
import { Sheet, ConfirmSheet } from './Sheet';
import { useLiveSelection } from '../hooks/useLiveData';
import { Button } from '../components/ui/Button';
import { EntityList } from './EntityList';
import { Field, FormNav } from './FormNav';
import { swissToday } from './DateField';
import { KegFiche } from './KegFiche';
import { KegFillSheet } from './KegFillSheet';
import { KegAddSheet } from './KegAddSheet';
import './equipment-compact.css';
import './keg-fiche.css';
import './keg-liste.css';
import { nombreFr } from '../domain/nombreAffiche';
import {
  ORDRE_JAUGE, ORDRE_SECTIONS, aReprendre, basculerFiltre, comptesParEtat, couleurPastille, etatFut, futsARetablir, ligneDate, libelleSegment,
  marquerTousPropres, phraseFiltre, phraseMarques, phrasesResume, rangerParSections, resumeParc, titreConfirmation, type EtatFut
} from '../domain/stock/futsFiche';

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
/** Pluriel des sections et des filtres ; « À laver » ne change pas. */
const LIBELLE_PLURIEL = (e: EtatFut) => (e === 'unknown' ? UNKNOWN_STATE.label : KEG_STATE[e].filter);
/** Le bandeau « marqués propres » laisse ce temps pour annuler. */
const BANDEAU_MS = 15_000;

interface Marquage { avant: KegItem[]; apres: KegItem[] }

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
  /** Choix multiple : aucun état choisi = tout le parc. */
  const [filtre, setFiltre] = useState<EtatFut[]>([]);
  const [confirmeLavage, setConfirmeLavage] = useState(false);
  const [marquage, setMarquage] = useState<Marquage | null>(null);
  const confirmeRef = useRef<HTMLDivElement>(null);
  const [repairedState, setRepairedState] = useState<KegState | ''>('');
  const [repairAttempted, setRepairAttempted] = useState(false);
  const repairInput = useRef<HTMLSelectElement>(null);
  const counts = useMemo(() => comptesParEtat(kegs), [kegs]);
  const resume = useMemo(() => phrasesResume(resumeParc(kegs)), [kegs]);
  const range = useMemo(
    () => rangerParSections(filtre.length ? kegs.filter(k => filtre.includes(etatFut(k))) : kegs, jour),
    [kegs, filtre, jour]
  );
  const selectedUnknown = Boolean(selected && !isKnownState(selected.state));
  const filtreTexte = phraseFiltre(filtre, LIBELLE_PLURIEL);

  // La confirmation et le bandeau suivent le parc : plus rien à laver, plus de geste groupé.
  useEffect(() => { if (confirmeLavage && counts.lavage === 0) setConfirmeLavage(false); }, [confirmeLavage, counts.lavage]);
  useEffect(() => { if (confirmeLavage) confirmeRef.current?.focus(); }, [confirmeLavage]);
  useEffect(() => {
    if (!marquage) return;
    const delai = setTimeout(() => setMarquage(null), BANDEAU_MS);
    return () => clearTimeout(delai);
  }, [marquage]);

  /** « Tout marquer propre » : chaque fût à laver passe propre avec son étape « lavé » du jour ; le filtre est levé, comme sur la maquette. */
  const marquerPropres = () => {
    const geste = marquerTousPropres(kegs, jour);
    geste.apres.forEach(k => save(k));
    setConfirmeLavage(false);
    setFiltre([]);
    setMarquage(geste);
  };
  const annulerMarquage = () => {
    if (!marquage) return;
    futsARetablir(marquage.avant, marquage.apres, kegs).forEach(k => save(k));
    setMarquage(null);
  };

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
        items={range}
        keyOf={keg => keg.id}
        searchKeys={SEARCH_KEYS}
        searchPlaceholder="Chercher un fût, une bière, un client…"
        toolbarAction={<Button intent="secondary" onClick={() => setFill({})}>Remplir depuis un lot</Button>}
        resetKey={filtre.join()}
        groupOf={(keg: KegItem) => etatFut(keg)}
        groupOrder={[...ORDRE_SECTIONS]}
        renderGroupHeader={(etat, compte) => (
          <h3 className="keg-sec keg-sec-titre">
            <span>{LIBELLE_PLURIEL(etat as EtatFut)} · {compte}</span>
            {etat === 'lavage' && compte === counts.lavage && compte > 0 && (
              <button type="button" onClick={() => setConfirmeLavage(true)}>Tout marquer propre</button>
            )}
          </h3>
        )}
        header={kegs.length > 0 && (
          <div className="keg-tete">
            <div className="keg-jauge-ligne">
              <button type="button" className="keg-voirtout" aria-pressed={filtre.length === 0} onClick={() => setFiltre([])}>Voir tout</button>
              <div className="keg-jauge" role="group" aria-label="Filtrer les fûts par état (un ou plusieurs)">
                {ORDRE_JAUGE.filter(e => counts[e] > 0).map(e => (
                  <button key={e} type="button" data-etat={e} style={{ flexGrow: counts[e] }} aria-label={`${libelleSegment(e, counts[e])} ${counts[e]}`} aria-pressed={filtre.includes(e)} onClick={() => setFiltre(basculerFiltre(filtre, e))}>
                    <span>{libelleSegment(e, counts[e])}</span><b>{counts[e]}</b>
                  </button>
                ))}
              </div>
            </div>
            <p className="keg-legende">
              {filtre.length === 0
                ? <><span>{resume.gauche}</span><span>{resume.droite}</span></>
                : <span>Filtre : {filtreTexte}</span>}
            </p>
            {confirmeLavage && counts.lavage > 0 && (
              <div ref={confirmeRef} tabIndex={-1} role="group" aria-labelledby={`${listId}-conf`} className="keg-confirme">
                <b id={`${listId}-conf`}>{titreConfirmation(counts.lavage)}</b>
                <span className="equipment-help">{marquerTousPropres(kegs, jour).avant.map(k => k.id).join(', ')} · lavés aujourd’hui</span>
                <div className="keg-confirme-pied">
                  <Button intent="secondary" size="sm" onClick={() => setConfirmeLavage(false)}>Annuler</Button>
                  <Button intent="primary" size="sm" onClick={marquerPropres}>Marquer propres</Button>
                </div>
              </div>
            )}
            {marquage && (
              <div role="status" className="keg-bandeau">
                <span>{phraseMarques(marquage.apres.length)}</span>
                <button type="button" onClick={annulerMarquage}>Annuler</button>
              </div>
            )}
          </div>
        )}
        emptyState={
          <div className="equipment-empty">
            <p>{filtre.length && kegs.length ? `Aucun fût « ${phraseFiltre(filtre, LIBELLE_PLURIEL)} »` : 'Aucun fût enregistré'}</p>
            {kegs.length ? <Button intent="secondary" size="sm" onClick={() => setFiltre([])}>Voir tout</Button>
              : <p className="text-cave-400">Ajoute des fûts avec le bouton « + ».</p>}
          </div>
        }
        renderItem={keg => {
          const unknown = !isKnownState(keg.state);
          const state = unknown ? UNKNOWN_STATE : KEG_STATE[keg.state];
          const descriptionId = `${listId}-${encodeURIComponent(keg.id)}`;
          const style = keg.style ?? batches.find(b => b.id === keg.batchRef)?.style;
          const teinte = couleurPastille(style);
          const reprendre = aReprendre(keg, jour);
          const date = ligneDate(keg, jour);
          const avecBiere = keg.state === 'plein' || keg.state === 'livre' || unknown && (keg.beerName || keg.batchRef);
          // Plein : bière · lot. Livré : bière · client. État inconnu : ce que l'import a laissé, lot et client compris.
          const suite = keg.state === 'livre' ? (keg.clientName || 'Client non renseigné') : keg.batchRef;
          return (
            <button type="button" className="equipment-row keg-row" aria-label={`Ouvrir le fût ${keg.id}`} aria-describedby={`${descriptionId}-content ${descriptionId}-state`} onClick={() => {
              setRepairedState(''); setRepairAttempted(false); setSelected(keg);
            }}>
              <span id={`${descriptionId}-content`} className="equipment-row-main">
                <span className="keg-identity"><strong>{keg.id}</strong><span className="equipment-reading">{nombreFr(keg.capacityL, 1)} L</span></span>
                {avecBiere && (
                  <span className="equipment-row-context keg-row-biere">
                    {teinte && <span className="keg-dot" style={{ '--keg-dot': teinte } as React.CSSProperties} aria-hidden="true"/>}
                    <span>{keg.beerName || 'Bière non renseignée'}{suite && <span className="text-cave-400"> · {suite}</span>}</span>
                  </span>
                )}
                {unknown && keg.clientName && <span className="equipment-row-meta">{keg.clientName}</span>}
                {date && <span className="equipment-row-meta keg-row-date">{date.texte}{date.age && <> · <b className="keg-age" data-ancien={date.ancien}>{date.age}</b></>}</span>}
                {keg.notes && <span className="equipment-row-meta">{keg.notes}</span>}
              </span>
              <span id={`${descriptionId}-state`} className="equipment-state" data-keg-state={reprendre ? 'reprendre' : unknown ? 'unknown' : keg.state}>
                {reprendre ? <><span className="sr-only">{state.label}, </span><Truck size={13} aria-hidden="true"/>À reprendre</> : <><state.Icon size={13} aria-hidden="true"/>{state.label}</>}
              </span>
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
