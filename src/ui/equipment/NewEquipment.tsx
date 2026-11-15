import React, { useEffect, useState } from 'react';
import { Check, ExternalLink, Package, ShoppingCart } from 'lucide-react';
import type { EquipmentItem, EquipmentRhythm } from '../../types';
import { dateCourte, lireDate, nextDueAfter } from '../../domain/equipment';
import { nextUniqueRef } from '../../services/refs';
import { Sheet } from '../Sheet';

/** Nouveau matériel (za3, « ajout ») : trois voies, puis nom, catégorie, état, entretien et dernier fait. Jamais `type="number"`. */
const CATEGORIES = ['Brassage', 'Mesure', 'Embouteillage', 'Stockage', 'Atelier'];
const ETATS = ['Neuf', 'Bon', 'À entretenir', 'À réparer'];
const ENTRETIENS: { label: string; rhythm: EquipmentRhythm | null }[] = [
  { label: 'aucun', rhythm: null },
  { label: 'mois', rhythm: { every: 1, unit: 'mois' } },
  { label: '3 mois', rhythm: { every: 3, unit: 'mois' } },
  { label: 'an', rhythm: { every: 12, unit: 'mois' } },
];
const swiss = (iso: string) => { const [y, m, d] = iso.split('-'); return `${d}.${m}.${y}`; };

export const NewEquipment: React.FC<{
  open: boolean; today: string; refs: string[]; wide?: boolean;
  onClose: () => void; onAdd: (item: EquipmentItem) => void; onBuy: () => void; onProjects?: () => void;
}> = ({ open, today, refs, onClose, onAdd, onBuy, onProjects }) => {
  const [nom, setNom] = useState('');
  const [categorie, setCategorie] = useState('Brassage');
  const [etat, setEtat] = useState('Bon');
  const [entretien, setEntretien] = useState(0);
  const [dernier, setDernier] = useState(swiss(today));
  useEffect(() => { if (open) { setNom(''); setCategorie('Brassage'); setEtat('Bon'); setEntretien(0); setDernier(swiss(today)); } }, [open, today]);

  const rhythm = ENTRETIENS[entretien].rhythm;
  const dernierIso = lireDate(dernier);
  const prochain = rhythm && dernierIso ? nextDueAfter({ rhythm } as EquipmentItem, dernierIso) : null;
  const valide = nom.trim().length >= 2 && (!rhythm || !!dernierIso);
  const ajouter = () => {
    if (!valide) return;
    const ref = nextUniqueRef('EQ', refs);
    const item: EquipmentItem = { id: ref, ref, name: nom.trim(), category: categorie, state: etat };
    if (rhythm) { item.rhythm = { ...rhythm }; if (dernierIso) item.lastDone = dernierIso; }
    onAdd(item);
  };
  const puce = (label: string, on: boolean, set: () => void, groupe: string) => (
    <button key={label} type="button" role="radio" aria-checked={on} aria-label={`${groupe} : ${label}`} className={`mt-pill${on ? ' mt-on' : ''}`} onClick={set}>{label}</button>
  );

  return (
    <Sheet open={open} onClose={onClose} title="Nouveau matériel"
      footer={<div className="mt-fbtn mt-vars"><button type="button" className="mt-sec" onClick={onClose}>Annuler</button><button type="button" className="mt-pri" disabled={!valide} onClick={ajouter}><Check size={18} aria-hidden="true" />Ajouter</button></div>}>
      <div className="mt-feuille">
        <div className="mt-choix">
          <button type="button" className="mt-ch" onClick={onBuy}><ShoppingCart size={20} aria-hidden="true" />Enregistrer un achat</button>
          <button type="button" className="mt-ch mt-on" aria-pressed="true"><Package size={20} aria-hidden="true" />Déjà possédé</button>
          {onProjects && <button type="button" className="mt-ch" onClick={onProjects}><ExternalLink size={20} aria-hidden="true" />Projets d'équipement</button>}
        </div>
        <label className="mt-lab" htmlFor="mt-nom">Nom</label>
        <input id="mt-nom" className="mt-in" type="text" autoComplete="off" value={nom} onChange={e => setNom(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') ajouter(); }} />
        <div className="mt-lab">Catégorie</div>
        <div className="mt-pills" role="radiogroup" aria-label="Catégorie">{CATEGORIES.map(c => puce(c, categorie === c, () => setCategorie(c), 'Catégorie'))}</div>
        <div className="mt-lab">État</div>
        <div className="mt-pills" role="radiogroup" aria-label="État">{ETATS.map(c => puce(c, etat === c, () => setEtat(c), 'État'))}</div>
        <div className="mt-deux">
          <div><div className="mt-lab">Entretien</div><div className="mt-pills" role="radiogroup" aria-label="Entretien">{ENTRETIENS.map((e, i) => puce(e.label, entretien === i, () => setEntretien(i), 'Entretien'))}</div></div>
          <div><label className="mt-lab" htmlFor="mt-dernier">Dernier fait</label><input id="mt-dernier" className="mt-in mt-m" type="text" inputMode="numeric" autoComplete="off" value={dernier} onChange={e => setDernier(e.target.value)} aria-invalid={!!rhythm && !dernierIso} /></div>
        </div>
        {prochain && <div className="mt-apercu"><span>prochain le <b className="mt-m">{dateCourte(prochain)}</b></span></div>}
      </div>
    </Sheet>
  );
};
