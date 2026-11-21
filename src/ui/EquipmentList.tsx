import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ShoppingCart, X } from 'lucide-react';
import type { EquipmentItem } from '../types';
import { aTraiter, dateCourte, filDuTemps, markRepaired, nextDueAfter, parcValue, recordDone } from '../domain/equipment';
import { createSearch, runSearch } from '../services/search';
import { FilHaut, FilPied, FilSans, FilVide, type GesteKind, type Recent } from './equipment/ListFil';
import { NewEquipment } from './equipment/NewEquipment';
import { lecturesDerniere } from './equipment/DetailModel';
import './equipment/list.css';
import './equipment-compact.css';

/**
 * Matériel de la brasserie (za3, choix du 15.11) : un fil du temps. À traiter en haut, « aujourd'hui », puis l'avenir à sa vraie
 * distance ; le sans-échéance et le pied dessous. Chaque ligne dit un verbe et une date, jamais un compteur de jours.
 * Les gestes (Réparée, Fait) écrivent l'appareil neuf par `onWrite(next, previous, toast)` : l'appelant l'enregistre et montre le
 * toast avec Annuler (il réécrit `previous`). « Étalonner » ouvre la fiche.
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
  onOpen: (item: EquipmentItem) => void;
  onWrite: (next: EquipmentItem, previous: EquipmentItem, toast: string) => void;
  /**
   * Un geste fait dans la fiche (Étalonné, Fait) : l'appareil d'avant et d'après. La liste montre alors, comme après un geste de la ligne,
   * la note « à jour jusqu'au » à l'ancienne place et la ligne surlignée à sa nouvelle date (N1). `id` change à chaque geste.
   */
  traite?: { avant: EquipmentItem; apres: EquipmentItem; id: number } | null;
  onAdd: (item: EquipmentItem) => void;
  onBuy: () => void;
  onProjects?: () => void;
  className?: string;
}

const SEARCH_KEYS = ['name', 'category', 'task', 'maintenance', 'notes'];
export const aujourdhuiIso = (): string => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export const EquipmentList: React.FC<EquipmentListProps> = ({ equipment, batches, today: todayProp, wide = false, selectedRef, onOpen, onWrite, traite, onAdd, onBuy, onProjects, className = '' }) => {
  const today = todayProp ?? aujourdhuiIso();
  const [mode, setMode] = useState<'tout' | 'work'>('tout');
  const [recherche, setRecherche] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [recent, setRecent] = useState<Recent | null>(null);
  useEffect(() => { if (!recent) return; const t = setTimeout(() => setRecent(null), 8000); return () => clearTimeout(t); }, [recent]);

  const ctx = useMemo(() => ({ today, batches }), [today, batches]);
  // N1 : le geste fait dans la fiche. L'index de l'ancienne place se lit sur le fil d'avant le geste (l'appareil d'avant remis en place).
  const dernierTraite = useRef<number | null>(null);
  useEffect(() => {
    if (!traite || traite.id === dernierTraite.current) return;
    dernierTraite.current = traite.id;
    const { avant, apres } = traite;
    const evenement = (apres.history ?? []).length > (avant.history ?? []).length ? apres.history?.[(apres.history ?? []).length - 1] : undefined;
    if (apres.retired || apres.brokenSince || !evenement || (evenement.kind !== 'etalonnage' && evenement.kind !== 'entretien')) return;
    const fil0 = filDuTemps(equipment.filter(e => !e.retired).map(e => e.ref === avant.ref ? avant : e), ctx);
    const index = fil0.haut.findIndex(h => h.item.ref === avant.ref);
    const du = nextDueAfter(apres, today);
    const brassins = !du && apres.rhythm?.unit === 'brassin' ? apres.rhythm.every : null;
    setRecent({ ref: apres.ref, nom: apres.name, jusquau: du, brassins, index: index < 0 ? fil0.haut.length : index, lectures: lecturesDerniere(apres) });
  }, [traite, equipment, ctx, today]);
  const vivants = useMemo(() => equipment.filter(e => !e.retired), [equipment]);
  const nbTraiter = useMemo(() => aTraiter(vivants, ctx).length, [vivants, ctx]);
  const visibles = useMemo(() => recherche?.trim() ? runSearch(createSearch(vivants, SEARCH_KEYS), recherche) : vivants, [vivants, recherche]);
  const fil = useMemo(() => filDuTemps(visibles, ctx), [visibles, ctx]);
  const parc = useMemo(() => parcValue(vivants), [vivants]);
  const aJour = vivants.length - fil.haut.length - (recent && fil.avenir.some(a => a.item.ref === recent.ref) ? 1 : 0);

  const geste = (row: { item: EquipmentItem; status: { kind: string } }, g: GesteKind) => {
    if (g === 'etalonne') { onOpen(row.item); return; }
    const index = fil.haut.findIndex(h => h.item.ref === row.item.ref);
    if (g === 'repare') { onWrite(markRepaired(row.item, { date: today }), row.item, 'Réparée'); return; }
    const next = recordDone(row.item, { date: today });
    const du = nextDueAfter(next, today);
    const brassins = !du && next.rhythm?.unit === 'brassin' ? next.rhythm.every : null;
    setRecent({ ref: row.item.ref, nom: row.item.name, jusquau: du, brassins, index: Math.max(0, index), lectures: null });
    onWrite(next, row.item, du ? `Fait · à jour jusqu'au ${dateCourte(du)}` : brassins ? `Fait · à jour pour ${brassins} brassins` : 'Fait');
  };

  const filtre = (valeur: 'tout' | 'work', libelle: string, n: number, extra = '') => (
    <button type="button" role="radio" aria-checked={mode === valeur} className={`mt-f${mode === valeur ? ' mt-on' : ''}${extra}`} onClick={() => setMode(valeur)}>{libelle} <b>{n}</b></button>
  );

  return (
    <div className={`mt${wide ? ' mt-large' : ''} ${className}`}>
      <div className="mt-outils">
        <div role="radiogroup" aria-label="Filtrer le matériel" className="mt-filtres">
          {filtre('tout', 'Tout', vivants.length)}
          {filtre('work', 'À traiter', nbTraiter, nbTraiter === 0 ? ' mt-eteint' : ' mt-chaud')}
        </div>
        <span className="mt-sp" />
        {vivants.length > 0 && <button type="button" className="mt-rd" aria-label="Chercher un équipement" aria-pressed={recherche !== null} onClick={() => setRecherche(recherche === null ? '' : null)}><Search size={18} aria-hidden="true" /></button>}
        <button type="button" className="mt-achat" onClick={onBuy}><ShoppingCart size={20} aria-hidden="true" />{wide ? 'Enregistrer un achat' : 'Achat'}</button>
      </div>
      {recherche !== null && (
        <div className="mt-cherche">
          <input type="search" autoFocus autoComplete="off" aria-label="Chercher un équipement…" placeholder="Chercher un équipement…" value={recherche} onChange={e => setRecherche(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setRecherche(null); }} />
          <button type="button" className="mt-rd" aria-label="Effacer la recherche" onClick={() => setRecherche(null)}><X size={18} aria-hidden="true" /></button>
        </div>
      )}
      <section className="mt-fil">
        {vivants.length === 0 ? <FilVide today={today} onBuy={onBuy} onAddOwned={() => setAdding(true)} onProjects={onProjects} /> : (
          <>
            {recherche?.trim() && visibles.length === 0 && <p className="mt-rien">Rien ne correspond à « {recherche.trim()} »</p>}
            <FilHaut fil={fil} mode={mode} aJour={aJour} recent={recent} selectedRef={selectedRef} onOpen={onOpen} onGeste={geste} onToutVoir={() => setMode('tout')} />
            {mode === 'tout' && <FilSans rows={fil.sansEcheance} onOpen={onOpen} />}
            {mode === 'tout' && <FilPied wide={wide} parc={parc} onAddOwned={() => setAdding(true)} onProjects={onProjects} />}
          </>
        )}
      </section>
      <NewEquipment open={adding} today={today} refs={equipment.map(e => e.ref)} noms={equipment.map(e => e.name)} wide={wide} onClose={() => setAdding(false)} onAdd={item => { setAdding(false); onAdd(item); }}
        onBuy={() => { setAdding(false); onBuy(); }} onProjects={onProjects ? () => { setAdding(false); onProjects(); } : undefined} />
    </div>
  );
};
