import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { EquipmentItem } from '../types';
import { equipmentStatus, parcValue } from '../domain/equipment';
import { createSearch, runSearch } from '../services/search';
import { NewEquipment } from './equipment/NewEquipment';
import { AVenirParc, EnTeteParc, LignesParc, ParcVide, PiedParc, type AVenirLigne } from './equipment/ListeParc';
import './equipment/list.css';
import './equipment/parc.css';
import './equipment-compact.css';

/**
 * Matériel, le parc (d8a, choisie le 22.11, D420) : « Parc » et son total, une ligne par appareil, puis « À venir ». La frise du temps (za3) est
 * retirée de la liste : Réparée, Fait et Étalonner se jouent dans la fiche de l'appareil (N1), et un appareil à traiter reste signalé par
 * sa sous-ligne, en ton d'attention.
 */
export interface EquipmentListProps {
  equipment: EquipmentItem[];
  batches: { brewDate?: string }[];
  /** AAAA-MM-JJ ; le jour de l'écran par défaut. */
  today?: string;
  /** ≥ 1024 px : libellés longs de la maquette 1280. */
  wide?: boolean;
  /** Appareil dont la fiche est ouverte à côté (1280). */
  selectedRef?: string | null;
  /** Projets d'équipement à venir (plans de Finances), montrés sous le parc. */
  avenir?: AVenirLigne[];
  onOpen: (item: EquipmentItem) => void;
  onAvenir?: () => void;
  onAdd: (item: EquipmentItem) => void;
  onBuy: () => void;
  onProjects?: () => void;
  className?: string;
}

const SEARCH_KEYS = ['name', 'category', 'task', 'maintenance', 'notes'];
export const aujourdhuiIso = (): string => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export const EquipmentList: React.FC<EquipmentListProps> = ({ equipment, batches, today: todayProp, wide = false, selectedRef, avenir = [], onOpen, onAvenir, onAdd, onBuy, onProjects, className = '' }) => {
  const today = todayProp ?? aujourdhuiIso();
  const [recherche, setRecherche] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const ctx = useMemo(() => ({ today, batches }), [today, batches]);
  const vivants = useMemo(() => equipment.filter(e => !e.retired), [equipment]);
  const visibles = useMemo(() => recherche?.trim() ? runSearch(createSearch(vivants, SEARCH_KEYS), recherche) : vivants, [vivants, recherche]);
  // Les appareils à traiter (panne, entretien dû, jamais étalonné) en tête, puis l'ordre du parc.
  const rows = useMemo(() => {
    const rang = (k: string) => k === 'panne' ? 0 : k === 'du' ? 1 : k === 'jamais' ? 2 : 3;
    return visibles.map((item, i) => ({ item, status: equipmentStatus(item, ctx), i })).sort((a, b) => rang(a.status.kind) - rang(b.status.kind) || a.i - b.i);
  }, [visibles, ctx]);
  const parc = useMemo(() => parcValue(vivants), [vivants]);
  const sansPrix = vivants.length - parc.known;

  return (
    <div className={`mt${wide ? ' mt-large' : ''} ${className}`}>
      {vivants.length === 0 ? <ParcVide onBuy={onBuy} onAddOwned={() => setAdding(true)} onProjects={onProjects} /> : (
        <>
          <EnTeteParc totalCents={parc.totalCents} sansPrix={sansPrix} rechercheOuverte={recherche !== null} onChercher={() => setRecherche(recherche === null ? '' : null)} onBuy={onBuy} />
          {recherche !== null && (
            <div className="mt-cherche">
              <input type="search" autoFocus autoComplete="off" aria-label="Chercher un équipement…" placeholder="Chercher un équipement…" value={recherche} onChange={e => setRecherche(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setRecherche(null); }} />
              <button type="button" className="mt-rd" aria-label="Effacer la recherche" onClick={() => setRecherche(null)}><X size={18} aria-hidden="true" /></button>
            </div>
          )}
          {recherche?.trim() && visibles.length === 0 && <p className="mt-rien">Rien ne correspond à « {recherche.trim()} »</p>}
          <LignesParc rows={rows} selectedRef={selectedRef} onOpen={onOpen} />
          <AVenirParc lignes={avenir} onOpen={() => onAvenir?.()} />
          <PiedParc wide={wide} onAddOwned={() => setAdding(true)} onProjects={onProjects} />
        </>
      )}
      <NewEquipment open={adding} today={today} refs={equipment.map(e => e.ref)} noms={equipment.map(e => e.name)} wide={wide} onClose={() => setAdding(false)} onAdd={item => { setAdding(false); onAdd(item); }}
        onBuy={() => { setAdding(false); onBuy(); }} onProjects={onProjects ? () => { setAdding(false); onProjects(); } : undefined} />
    </div>
  );
};
