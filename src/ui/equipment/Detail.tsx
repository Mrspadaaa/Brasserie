import React from 'react';
import type { EquipmentItem } from '../../types';
import type { FinanceTransaction } from '../../domain/finance/types';

/**
 * Fiche d'un appareil (za3, port 15.11). Interface fixée dans PORT.md ; le corps est écrit par la voie d2b.
 *   layout 'sheet' : dans la feuille (390), tout en une colonne, pied collé en bas ;
 *   layout 'pane'  : panneau à 1280 : le fil de l'appareil à gauche, la fiche à droite.
 *   onChange(item, toast?) : l'appareil modifié ; `toast` = la phrase du bandeau (« Étalonné · à jour jusqu'au 14.12 »), à montrer avec Annuler.
 */
export interface EquipmentDetailProps {
  item: EquipmentItem;
  batches: { brewDate?: string }[];
  transactions: FinanceTransaction[];
  /** AAAA-MM-JJ */
  today: string;
  layout: 'sheet' | 'pane';
  onChange: (item: EquipmentItem, toast?: string) => void;
  onClose: () => void;
  onPayMaintenance: (item: EquipmentItem) => void;
  onDelete: (item: EquipmentItem) => void;
}

export const EquipmentDetail: React.FC<EquipmentDetailProps> = ({ item }) => (
  <div className="eqd" data-layout="sheet">
    <h2>{item.name}</h2>
  </div>
);
