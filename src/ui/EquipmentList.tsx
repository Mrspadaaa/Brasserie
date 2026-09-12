import React from 'react';
import { EquipmentItem } from '../types';
import { EntityList } from './EntityList';
import { isoDate } from '../domain/finance/ledger';

/**
 * Matériel de la brasserie.
 *
 * Volontairement sobre : contrairement au stock, le matériel ne se consomme pas
 * et n'a donc ni jauge ni compteur. Ce qui compte, c'est son état d'entretien.
 */

const STATE_CHIP: Record<string, string> = {
  Neuf: 'bg-hop/15 text-hop border-hop/40',
  Bon: 'bg-water/15 text-water border-water/40',
  'À entretenir': 'bg-ebc-straw/15 text-ebc-straw border-ebc-straw/40',
  'À réparer': 'bg-alert/15 text-alert border-alert/40'
};

export const EquipmentList: React.FC<{
  equipment: EquipmentItem[];
  /** Ouvre la fiche : modifier l'état, l'entretien, ou supprimer. */
  onOpen?: (item: EquipmentItem) => void;
  className?: string;
}> = ({ equipment, onOpen, className = '' }) => (
  <EntityList
    className={className}
    items={equipment}
    keyOf={(e) => e.ref}
    groupOf={(e) => e.category}
    searchKeys={['name', 'ref', 'category', 'state']}
    searchPlaceholder="Chercher un équipement…"
    emptyState={
      <div className="py-12 text-center space-y-2">
        <p className="text-base text-cave-200">Aucun équipement enregistré</p>
      </div>
    }
    renderItem={(item) => (
      <article
        role={onOpen ? 'button' : undefined}
        tabIndex={onOpen ? 0 : undefined}
        onClick={onOpen ? () => onOpen(item) : undefined}
        onKeyDown={
          onOpen
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpen(item);
                }
              }
            : undefined
        }
        className={`panel px-4 py-3.5 space-y-2 ${
          onOpen ? 'cursor-pointer hover:border-cave-700 transition-colors' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-cave-50 truncate">{item.name}</h3>
            {/^EQ-[0-9a-f]{8}-[0-9a-f]{4}-/i.test(item.ref) ? isoDate(item.purchaseDate) && <p className="text-sm text-cave-400">Acquis le {new Date(`${isoDate(item.purchaseDate)}T12:00:00`).toLocaleDateString('fr-CH')}</p> : <p className="text-sm text-cave-400 font-mono truncate">{item.ref}</p>}
          </div>

          <span
            className={`shrink-0 px-2 py-1 rounded-control border text-sm ${
              STATE_CHIP[item.state] ?? 'bg-cave-850 text-cave-400 border-cave-700'
            }`}
          >
            {item.state}
          </span>
        </div>

        {item.maintenance && <p className="text-sm text-cave-400 line-clamp-2 sm:line-clamp-none">{item.maintenance}</p>}
        {item.notes && <p className="text-sm text-cave-400 italic line-clamp-2 sm:line-clamp-none">{item.notes}</p>}
      </article>
    )}
  />
);
