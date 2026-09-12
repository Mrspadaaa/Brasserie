import React, { useId, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { EquipmentItem } from '../types';
import { EntityList } from './EntityList';
import { isoDate } from '../domain/finance/ledger';
import { SegmentedControl } from './SegmentedControl';
import { Button } from '../components/ui/Button';
import './equipment-compact.css';

/**
 * Matériel de la brasserie.
 *
 * Volontairement sobre : contrairement au stock, le matériel ne se consomme pas
 * et n'a donc ni jauge ni compteur. Ce qui compte, c'est son état d'entretien.
 */

const SEARCH_KEYS = ['name', 'ref', 'category', 'state', 'maintenance', 'notes'];
const needsWork = (item: EquipmentItem) => item.state === 'À réparer' || item.state === 'À entretenir';
const statePriority = (item: EquipmentItem) => item.state === 'À réparer' ? 0 : item.state === 'À entretenir' ? 1 : 2;

export const EquipmentList: React.FC<{
  equipment: EquipmentItem[];
  /** Ouvre la fiche : modifier l'état, l'entretien, ou supprimer. */
  onOpen?: (item: EquipmentItem) => void;
  className?: string;
}> = ({ equipment, onOpen, className = '' }) => {
  const listId = useId();
  const [filter, setFilter] = useState<'all' | 'work'>('all');
  const workCount = equipment.filter(needsWork).length;
  const filtered = useMemo(() => {
    const items = filter === 'work' ? equipment.filter(needsWork) : [...equipment];
    return items.sort((a, b) => statePriority(a) - statePriority(b) || a.name.localeCompare(b.name, 'fr'));
  }, [equipment, filter]);
  return (
  <EntityList
    className={`equipment-list ${className}`}
    items={filtered}
    keyOf={(e) => e.ref}
    searchKeys={SEARCH_KEYS}
    searchPlaceholder="Chercher un équipement…"
    header={<SegmentedControl label="Filtrer le matériel" className="equipment-filters" value={filter} onChange={setFilter} options={[
      { value: 'all', label: `Tout · ${equipment.length}` },
      { value: 'work', label: `À traiter · ${workCount}` }
    ]}/>}
    emptyState={
      <div className="equipment-empty">
        <p>{equipment.length ? 'Aucun matériel à entretenir ou réparer' : 'Aucun équipement enregistré'}</p>
        {equipment.length > 0 && <Button intent="secondary" size="sm" onClick={() => setFilter('all')}>Voir tout le matériel</Button>}
      </div>
    }
    renderItem={item => {
      const descriptionId = `${listId}-${encodeURIComponent(item.ref)}`;
      const purchaseDate = isoDate(item.purchaseDate);
      const automaticRef = /^EQ-[0-9a-f]{8}-[0-9a-f]{4}-/i.test(item.ref);
      const content = <>
        <span id={`${descriptionId}-content`} className="equipment-row-main">
          <strong className="equipment-row-title">{item.name}</strong>
          <span className="equipment-meta-line">
            <span className="equipment-row-meta">{item.category}{!automaticRef && ` · ${item.ref}`}{automaticRef && purchaseDate && ` · Acquis le ${new Date(`${purchaseDate}T12:00:00`).toLocaleDateString('fr-CH')}`}{item.notes && onOpen && ' · Note'}</span>
            <span className="equipment-state" data-equipment-state={item.state}>{item.state || 'État non renseigné'}</span>
          </span>
          {item.maintenance && <span className="equipment-row-context">{item.maintenance}</span>}
          {item.notes && !onOpen && <span className="equipment-row-meta">{item.notes}</span>}
        </span>
        {onOpen && <ChevronRight className="equipment-row-chevron" size={14} aria-hidden="true"/>}
      </>;
      return onOpen
        ? <button type="button" className="equipment-row equipment-item-row" aria-label={`Ouvrir ${item.name}`} aria-describedby={`${descriptionId}-content`} onClick={() => onOpen(item)}>{content}</button>
        : <article className="equipment-row equipment-item-row">{content}</article>;
    }}
  />
  );
};
