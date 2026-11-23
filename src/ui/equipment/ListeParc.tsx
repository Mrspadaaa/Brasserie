import React from 'react';
import { ChevronRight, Package, ShoppingCart, Wrench, ExternalLink } from 'lucide-react';
import type { EquipmentItem } from '../../types';
import type { StatusRow } from '../../domain/equipment';
import { dateCourte } from '../../domain/equipment';
import { EquipmentPicto } from './ListPictos';
import { nomInsecable, totalParc } from './ListFil';

/**
 * Matériel, le parc (d8a, choisie le 22.11) : « Parc 2 510 CHF + 1 ? », puis une ligne par appareil (tuile de pictogramme, nom, sous-ligne,
 * prix en mono ou « ? » en pointillé, ›), puis « À venir ». La sous-ligne ne dit que ce que l'appareil sait : panne ou entretien dû
 * (ton d'attention), « prix à saisir » quand le prix manque, sinon la catégorie. « N projets » de la maquette n'a pas de source
 * (aucun lien appareil → projet) : il n'est pas écrit, l'inconnu n'est pas « aucun projet ».
 */
export interface AVenirLigne { id: string; titre: string; sousLigne: string; prixCents: number | null }

const prixDe = (item: EquipmentItem): number | null => typeof item.purchasePrice === 'number' && Number.isFinite(item.purchasePrice) && item.purchasePrice > 0 ? item.purchasePrice : null;
const chf = (cents: number): string => `${totalParc(cents)} CHF`;

const sousLigneDe = (r: StatusRow): { texte: string; ton: 'alerte' | 'attention' | 'neutre' } => {
  const { status, item } = r;
  if (status.kind === 'panne') return { texte: status.line, ton: 'alerte' };
  if (status.kind === 'du' || status.kind === 'jamais') return { texte: status.line, ton: 'attention' };
  if (prixDe(item) === null) return { texte: 'prix à saisir', ton: 'neutre' };
  if (status.kind === 'avenir' && status.dueDate) return { texte: `${status.verb} · ${dateCourte(status.dueDate)}`, ton: 'neutre' };
  return { texte: item.category, ton: 'neutre' };
};

export const EnTeteParc: React.FC<{ totalCents: number; sansPrix: number; rechercheOuverte: boolean; onChercher: () => void; onBuy: () => void }> = ({ totalCents, sansPrix, rechercheOuverte, onChercher, onBuy }) => (
  <div className="mp-h">
    <b>Parc</b>
    {totalCents > 0 && <span className="mt-m mp-tot">{chf(totalCents)}</span>}
    {sansPrix > 0 && <span className="mt-m mp-plus" data-sans-prix={sansPrix} title="Prix non saisis : ils ne sont pas comptés à zéro">{totalCents > 0 ? '+ ' : ''}{sansPrix} ?</span>}
    <span className="mt-sp" />
    <button type="button" className="mp-o" aria-label="Chercher un équipement" aria-pressed={rechercheOuverte} onClick={onChercher}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
    </button>
    <button type="button" className="mp-o" aria-label="Enregistrer un achat" onClick={onBuy}><ShoppingCart size={18} aria-hidden="true" /></button>
  </div>
);

export const LignesParc: React.FC<{ rows: StatusRow[]; selectedRef?: string | null; onOpen: (item: EquipmentItem) => void }> = ({ rows, selectedRef, onOpen }) => (
  <div className="mp-liste">
    {rows.map(r => {
      const sl = sousLigneDe(r); const prix = prixDe(r.item);
      return (
        <button key={r.item.ref ?? r.item.id} type="button" className={`mp-l${selectedRef === r.item.ref ? ' mt-choisi' : ''}`} data-parc-ligne="1" aria-label={`Ouvrir ${r.item.name}`} onClick={() => onOpen(r.item)}>
          <span className="mp-pi"><EquipmentPicto name={r.item.name} /></span>
          <span className="mp-nm"><b>{nomInsecable(r.item.name)}</b><small className={`mp-sl mp-${sl.ton}`}>{sl.texte}</small></span>
          {prix !== null ? <span className="mt-m mp-pr">{chf(Math.round(prix * 100))}</span> : <span className="mt-m mp-pr mp-inc" data-prix="inconnu" aria-label="prix inconnu">?</span>}
          <ChevronRight size={18} className="mp-chev" aria-hidden="true" />
        </button>
      );
    })}
  </div>
);

export const AVenirParc: React.FC<{ lignes: AVenirLigne[]; onOpen: () => void }> = ({ lignes, onOpen }) => (
  lignes.length === 0 ? null : (
    <section className="mp-av" aria-label="À venir">
      <div className="mp-h mp-h2"><b>À venir</b><span className="mt-m">{lignes.length}</span></div>
      <div className="mp-liste">
        {lignes.map(l => (
          <button key={l.id} type="button" className="mp-l" data-avenir={l.id} aria-label={`À venir : ${l.titre}`} onClick={onOpen}>
            <span className="mp-pi mp-pi-av"><EquipmentPicto name={l.titre} /></span>
            <span className="mp-nm"><b>{nomInsecable(l.titre)}</b><small className="mp-sl mp-neutre">{l.sousLigne}</small></span>
            {l.prixCents !== null ? <span className="mt-m mp-pr">{chf(l.prixCents)}</span> : <span className="mt-m mp-pr mp-inc" data-prix="inconnu" aria-label="prix inconnu">?</span>}
            <ChevronRight size={18} className="mp-chev" aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  )
);

export const PiedParc: React.FC<{ wide: boolean; onAddOwned: () => void; onProjects?: () => void }> = ({ wide, onAddOwned, onProjects }) => (
  <div className="mt-pied">
    <button type="button" className="mt-tuile" onClick={onAddOwned}><Package size={18} aria-hidden="true" />{wide ? 'Matériel déjà possédé' : 'Déjà possédé'}</button>
    {onProjects && <button type="button" className="mt-tuile" onClick={onProjects}><Wrench size={18} aria-hidden="true" />{wide ? "Projets d'équipement" : 'Projets'}<ExternalLink size={14} aria-hidden="true" /></button>}
  </div>
);

/** Parc vide : un titre et deux gestes, rien d'inventé. */
export const ParcVide: React.FC<{ onBuy: () => void; onAddOwned: () => void; onProjects?: () => void }> = ({ onBuy, onAddOwned, onProjects }) => (
  <div className="mp-vide">
    <h2>Aucun matériel</h2>
    <button type="button" className="mt-pri" onClick={onBuy}><ShoppingCart size={20} aria-hidden="true" />Enregistrer un achat</button>
    <button type="button" className="mt-sec" onClick={onAddOwned}><Package size={20} aria-hidden="true" />Matériel déjà possédé</button>
    {onProjects && <button type="button" className="mt-vlien" onClick={onProjects}><Wrench size={16} aria-hidden="true" />Projets d'équipement<ExternalLink size={16} aria-hidden="true" /></button>}
  </div>
);
