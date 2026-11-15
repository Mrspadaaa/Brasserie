import React from 'react';
import { EquipmentItem } from '../types';
import type { FinanceTransaction } from '../domain/finance/types';
import { Sheet } from './Sheet';
import { EquipmentDetail } from './equipment/Detail';
import { EquipmentEditSheet } from './equipment/DetailEdit';
import { aujourdhuiIso } from './equipment/DetailModel';
import './equipment-compact.css';

/**
 * Fiche matériel (za3, port 15.11) : un appareil existant s'ouvre sur sa fiche (`EquipmentDetail` dans la feuille : étalonnage, historique,
 * rythme, état, dépenses reliées, Gestion) ; un appareil sans nom est une création, qui garde le formulaire (TE-46, TE-47, BR-94 :
 * voir `equipment/DetailEdit.tsx`).
 *
 * ⚠️ Ce que ça règle (historique) : le matériel s'affichait en lecture seule, et un appareil vendu ou cassé restait dans la liste pour toujours.
 */

interface EquipmentSheetProps {
  /** `null` ferme la feuille ; un objet sans nom vaut création. */
  item: EquipmentItem | null;
  onClose: () => void;
  /** Création, ou correction faite par ⋯ › Modifier (sans bandeau). */
  onSave: (item: EquipmentItem) => void;
  onDelete: (item: EquipmentItem) => void;
  /** Un geste de la fiche (Étalonné, Fait, Réparée, Vendu, rythme, état) : l'appareil modifié et la phrase du bandeau. Absent : `onSave`. */
  onChange?: (item: EquipmentItem, toast?: string) => void;
  /** Les brassins (leur `brewDate`) et les transactions : pour « utilisé dans N brassins » et les dépenses reliées. */
  batches?: { brewDate?: string }[];
  transactions?: FinanceTransaction[];
  /** « Payer un entretien » : ouvre la Dépense avec une ligne d'entretien reliée à l'appareil. Absent : le bouton ne fait rien. */
  onPayMaintenance?: (item: EquipmentItem) => void;
  /** AAAA-MM-JJ ; par défaut le jour de l'appareil. */
  today?: string;
}

const AUCUN: never[] = [];

export const EquipmentSheet: React.FC<EquipmentSheetProps> = ({
  item, onClose, onSave, onDelete, onChange, batches = AUCUN, transactions = AUCUN, onPayMaintenance, today,
}) => {
  if (!item) return null;
  if (!item.name) return <EquipmentEditSheet item={item} onClose={onClose} onSave={onSave} />;
  return (
    <Sheet open onClose={onClose} title="Stocks · Matériel" bare plein className="equipment-sheet equipment-detail-sheet">
      <EquipmentDetail
        item={item}
        batches={batches}
        transactions={transactions}
        today={today ?? aujourdhuiIso()}
        layout="sheet"
        onChange={(modifie, toast) => (onChange ?? ((m: EquipmentItem) => onSave(m)))(modifie, toast)}
        onClose={onClose}
        onPayMaintenance={(a) => onPayMaintenance?.(a)}
        onDelete={onDelete}
      />
    </Sheet>
  );
};
