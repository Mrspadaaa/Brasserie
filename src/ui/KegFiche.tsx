import React, { useMemo, useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import type { Batch, Client, KegItem } from '../types';
import { Sheet } from './Sheet';
import { Button } from '../components/ui/Button';
import { Combobox } from './Combobox';
import { Field, FormNav } from './FormNav';
import { nombreFr } from '../domain/nombreAffiche';
import {
  couleurPastille, dateCourte, derniereDate, etapesRecentes, futsDuClient, jaugeFut, libelleEtape, libelleRetourTous, livrer, marquerPropre,
  remettreALaver, etapeALaver, retourVide, revenuPlein, reperePourStyle
} from '../domain/stock/futsFiche';
import './equipment-compact.css';
import './keg-fiche.css';

interface KegFicheProps {
  keg: KegItem;
  batches: Batch[];
  clients: Client[];
  /** `JJ.MM.AAAA` : jour de référence des âges et date des gestes. */
  today: string;
  onClose: () => void;
  onSave: (keg: KegItem) => void;
  /** « Remplir depuis un lot » : ouvre la feuille de remplissage avec ce fût coché. */
  onFill: (kegId: string) => void;
  onRemove: () => void;
  /** Le parc (non archivé) : N4, les autres fûts du même client rentrent avec celui-ci. */
  kegs?: KegItem[];
  /** N4 : écrit les fûts rentrés ensemble (un seul message). Sans lui, chaque fût passe par `onSave`. */
  onSaveMany?: (kegs: KegItem[]) => void;
}

/** Les clients de l'onglet Clients, favoris en tête (puis ordre alphabétique). */
export function optionsClients(clients: Client[]) {
  return clients.filter((c) => !c.archivedAt)
    .sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || a.name.localeCompare(b.name, 'fr'))
    .map((c) => ({ value: c.id, label: c.name, detail: c.type, favorite: Boolean(c.favorite) }));
}

const SOUS_TITRE = { lavage: 'à laver', propre: 'propre', plein: 'en cave' } as const;

/**
 * F2 « La carte d'identité » (15.11) : la fiche raconte le fût — sa bière, son âge sur une jauge, les dernières étapes —,
 * le geste suivant est en bas. Une seule fiche pour les quatre états ; un état sans dessin propre reprend le gabarit.
 */
export const KegFiche: React.FC<KegFicheProps> = ({ keg, batches, clients, today, onClose, onSave, onFill, onRemove, kegs = [], onSaveMany }) => {
  const [clientId, setClientId] = useState('');
  const [toutVoir, setToutVoir] = useState(false);
  const options = useMemo(() => optionsClients(clients), [clients]);
  /** N4 : ses fûts chez le même client, tous cochés ; un fût absent se décoche. */
  const chezLui = useMemo(() => futsDuClient(keg, kegs), [keg, kegs]);
  const [rentres, setRentres] = useState<string[]>(() => chezLui.map((k) => k.id));
  const cochesRentres = chezLui.filter((k) => rentres.includes(k.id));
  const plusieurs = chezLui.length > 1;
  const client = clients.find((c) => c.id === clientId);
  const jauge = jaugeFut(keg, today);
  const etapes = etapesRecentes(keg, toutVoir ? undefined : 4);
  const plusDEtapes = (keg.historique?.length ?? 0) > 3;
  const avecBiere = keg.state === 'plein' || keg.state === 'livre';
  const batch = batches.find((b) => b.id === keg.batchRef);
  const style = keg.style ?? batch?.style;
  const dot = couleurPastille(style);
  const dotStyle = dot ? ({ '--keg-dot': dot } as React.CSSProperties) : undefined;

  const done = (next: KegItem) => { onSave(next); onClose(); };
  const livrerAuClient = () => { if (client) done(livrer(keg, { id: client.id, name: client.name }, today)); };
  const principal: Record<string, () => void> = {
    plein: livrerAuClient,
    livre: () => {
      if (!plusieurs) { done(retourVide(keg, today)); return; }
      if (!cochesRentres.length) return;
      const vides = cochesRentres.map((k) => retourVide(k, today));
      if (onSaveMany) onSaveMany(vides); else vides.forEach(onSave);
      onClose();
    },
    propre: () => { onFill(keg.id); },
    lavage: () => done(marquerPropre(keg, today))
  };
  const act = principal[keg.state];

  const subtitle = `${nombreFr(keg.capacityL, 1)} L · ${keg.state === 'livre' ? `chez ${keg.clientName || 'client non renseigné'}` : SOUS_TITRE[keg.state]}`;

  let titre: React.ReactNode;
  let aide: string;
  if (avecBiere) {
    titre = <><span className="keg-dot" style={dotStyle} aria-hidden="true"/>{keg.beerName || 'Bière non renseignée'}{keg.batchRef ? ` · ${keg.batchRef}` : ''}</>;
    if (keg.state === 'plein') {
      aide = `${keg.fillDate ? `Rempli le ${dateCourte(keg.fillDate)}` : 'Date de remplissage non renseignée'}${jauge?.jours !== undefined ? ` · ${jauge.jours} j en fût` : ''} · repère ${style ? `${style} ` : ''}${reperePourStyle(style)} j`;
    } else {
      aide = `${keg.deliveryDate ? `Livré le ${dateCourte(keg.deliveryDate)}` : 'Date de livraison non enregistrée'}${jauge?.jours !== undefined ? ` · ${jauge.jours} j dehors` : ''}`;
    }
  } else if (keg.state === 'propre') {
    const lave = derniereDate(keg, 'lave');
    titre = lave ? `Lavé le ${dateCourte(lave)}` : 'Propre';
    aide = 'Marqué propre, prêt à remplir.';
  } else {
    const e = etapeALaver(keg);
    const remis = e?.quoi === 'a-laver';
    titre = e ? `${remis ? 'Remis à laver' : 'Revenu'} le ${dateCourte(e.date)}` : 'À laver';
    aide = e ? (remis ? 'À nettoyer avant remplissage.' : 'Revenu vide, à nettoyer avant remplissage.') : 'Date de retour non enregistrée.';
  }

  const pied = keg.state === 'livre'
    ? <div className="equipment-footer keg-footer"><Button intent="secondary" onClick={() => done(revenuPlein(keg, today))}>Revenu plein</Button><Button intent="primary" disabled={plusieurs && !cochesRentres.length} onClick={act}>{plusieurs ? libelleRetourTous(cochesRentres.length, cochesRentres[0]?.id) : 'Retour vide'}</Button></div>
    : <div className="equipment-footer keg-footer">
        <Button intent="secondary" onClick={onClose}>Annuler</Button>
        <Button intent="primary" disabled={keg.state === 'plein' && !client} onClick={act}>
          {{ plein: 'Livrer', propre: 'Remplir depuis un lot', lavage: 'Marquer propre' }[keg.state as 'plein' | 'propre' | 'lavage']}
        </Button>
      </div>;

  return (
    <Sheet open onClose={onClose} title={`Fût ${keg.id}`} subtitle={subtitle} className="equipment-sheet lg:max-w-xl lg:mx-auto" footer={pied}>
      <FormNav className="equipment-form" onSubmit={() => { if (!(keg.state === 'plein' && !client)) act(); }}>
        <div className="keg-card">
          <p className="keg-card-beer">{titre}</p>
          {jauge && jauge.jours !== undefined && (
            <div className="keg-agebar" role="meter" aria-label={jauge.sorte === 'cave' ? 'Âge en fût sur le repère du style' : 'Jours chez le client sur le seuil'}
              aria-valuemin={0} aria-valuemax={jauge.repere} aria-valuenow={Math.min(jauge.jours, jauge.repere)} aria-valuetext={`${jauge.jours} jours sur ${jauge.repere}`}
              data-depasse={jauge.depasse} style={dotStyle}>
              <i style={{ width: `${jauge.pct}%` }}/>
            </div>
          )}
          <span className="equipment-help">{aide}</span>
        </div>

        {plusieurs && (
          <Field label={`Chez ${keg.clientName || 'ce client'} · ${chezLui.length} fûts`}>
            <div className="keg-chips" role="group" aria-label="Fûts revenus de chez ce client">
              {chezLui.map((k) => {
                const on = rentres.includes(k.id);
                const j = jaugeFut(k, today)?.jours;
                return (
                  <button key={k.id} type="button" role="checkbox" aria-checked={on} className="keg-chip"
                    onClick={() => setRentres((r) => (r.includes(k.id) ? r.filter((x) => x !== k.id) : [...r, k.id]))}>
                    <span className="keg-cbox" aria-hidden="true">{on && <Check size={9} strokeWidth={4}/>}</span>
                    {k.id}{j !== undefined ? ` · ${j} j` : ''}
                  </button>
                );
              })}
            </div>
          </Field>
        )}

        <div>
          <div className="keg-sec"><span>Historique</span>{plusDEtapes && <button type="button" aria-expanded={toutVoir} onClick={() => setToutVoir((v) => !v)}>{toutVoir ? 'Réduire' : 'Tout voir'}</button>}</div>
          {etapes.length
            ? <ol className="keg-tl" aria-label="Historique du fût, de la plus récente à la plus ancienne">
                {etapes.map((e, i) => <li key={`${e.date}-${e.quoi}-${i}`}><time>{dateCourte(e.date)}</time>{libelleEtape(e)}</li>)}
              </ol>
            : <p className="keg-tl-empty">Aucune étape enregistrée</p>}
        </div>

        {keg.state === 'plein' && (clients.length
          ? <Field label="Client" htmlFor="keg-client">
              <Combobox id="keg-client" ariaLabel="Client" value={clientId} onChange={setClientId} options={options} placeholder="Choisir un client…"/>
            </Field>
          : <p className="equipment-help">Aucun client enregistré : ajoute-le dans l’onglet Clients pour lui livrer ce fût.</p>)}

        {keg.notes && <p className="equipment-note"><span>Note · </span>{keg.notes}</p>}
      </FormNav>
      <details className="equipment-disclosure equipment-management" open>
        <summary>Gestion du fût</summary>
        {keg.state === 'propre' && <Button intent="secondary" size="sm" onClick={() => done(remettreALaver(keg, today))}>Remettre à laver</Button>}
        <Button intent="danger" size="sm" className="equipment-danger" onClick={onRemove} icon={<Trash2 size={14}/>}>Retirer du parc</Button>
      </details>
    </Sheet>
  );
};
