import React from 'react';
import { Phone, Pencil, UserCheck } from 'lucide-react';
import type { CreativeItem } from '../../types';
import { Sheet } from '../Sheet';
import { instantNote, jourMois } from './atelierModel';
import { BTN } from './FicheIdee';

/**
 * La fiche d'un contact (prospect) : ce que la note dit, appeler, modifier, et « Convertir en client ».
 * La conversion (fiche client, verrou BE-22 contre le double toucher) était la seule fonction de l'ancien Atelier que la maquette ne montrait pas :
 * elle vit ici, en pied de la feuille du prospect (q4, option a).
 */
export const FicheContact: React.FC<{
  item: CreativeItem | null; onClose: () => void;
  onModifier: (i: CreativeItem) => void; onConvertir: (i: CreativeItem) => void;
}> = ({ item, onClose, onModifier, onConvertir }) => {
  if (!item) return null;
  const instant = instantNote(item);
  const deja = item.status === 'validated';
  const lignes: Array<[string, React.ReactNode]> = [
    ['Contact', item.contactName?.trim() || <span className="text-cave-400">non saisi</span>],
    ['Téléphone', item.contactPhone?.trim()
      ? <a href={`tel:${item.contactPhone.replace(/\s+/g, '')}`} className="inline-flex items-center gap-1 underline"><Phone className="h-3.5 w-3.5" aria-hidden="true" />{item.contactPhone}</a>
      : <span className="text-cave-400">pas de numéro noté</span>]
  ];
  return (
    <Sheet open onClose={onClose} title={item.title} subtitle={`Contact${instant != null ? ` · noté le ${jourMois(instant)}` : ''}`}
      footer={
        <div className="flex gap-2">
          <button type="button" onClick={() => onModifier(item)} className={`${BTN} border border-cave-700 bg-cave-850 text-cave-50`}><Pencil className="h-4 w-4" aria-hidden="true" />Modifier</button>
          <button type="button" disabled={deja} onClick={() => onConvertir(item)} className={`${BTN} flex-1 bg-ebc-straw text-cave-950 disabled:opacity-50`}>
            <UserCheck className="h-4 w-4" aria-hidden="true" />{deja ? 'Déjà client' : 'Convertir en client'}
          </button>
        </div>
      }>
      <div className="flex flex-col gap-3">
        {item.description?.trim() && <p className="text-base leading-snug text-cave-50">{item.description.trim()}</p>}
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-xl bg-cave-850 px-3 py-3 text-base">
          {lignes.map(([t, v]) => <React.Fragment key={t}><dt className="text-cave-400">{t}</dt><dd className="text-cave-50">{v}</dd></React.Fragment>)}
        </dl>
        {item.notes?.trim() && <p className="mx-0.5 text-sm text-cave-200">{item.notes.trim()}</p>}
      </div>
    </Sheet>
  );
};
