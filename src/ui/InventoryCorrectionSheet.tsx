import React, { useState } from 'react';
import { StockItem } from '../types';
import { Units } from '../services/units';
import { INVENTORY_REASONS, InventoryReason } from '../services/storage';
import { Sheet } from './Sheet';
import { FormNav, Field, TextInput, inputClass } from './FormNav';
import { SegmentedControl } from './SegmentedControl';
import { QuantityStepper } from './QuantityStepper';
import { useSyncedDraft } from '../hooks/useLiveData';
import { Button } from '../components/ui/Button';
import './stocks.css';

/**
 * Correction d'inventaire — le seul chemin pour modifier un stock à la main.
 *
 * ⚠️ Ce que ça remplace : des boutons `+/−` posés sur chaque ligne de liste.
 * Gaëtan l'a dit lui-même : « c'est trop facile de les modifier, normal c'est
 * que en faisant une bière que le malt ou houblons descend. »
 *
 * Deux différences de fond avec l'ancien geste :
 *
 * 1. **On saisit le stock COMPTÉ, pas un écart.** Devant un sac, on lit une
 *    quantité ; on ne calcule pas de tête combien il en manque. C'est
 *    l'application qui fait la soustraction.
 * 2. **Le motif est obligatoire.** Un écart sans raison n'apprend rien. Un
 *    écart récurrent sur un article, lui, dit que ça se casse, que ça se perd,
 *    ou que les réceptions sont mal saisies.
 */

interface InventoryCorrectionSheetProps {
  open: boolean;
  item: StockItem | null;
  onClose: () => void;
  onConfirm: (countedQty: number, reason: InventoryReason, note?: string) => void;
}

export const InventoryCorrectionSheet: React.FC<InventoryCorrectionSheetProps> = ({
  open,
  item,
  onClose,
  onConfirm
}) => {
  const [counted, setCounted] = useSyncedDraft(item?.currentStock ?? 0, open ? item?.ref : null);
  const [reason, setReason] = useState<InventoryReason>('comptage');
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);

  // Se recale sur l'article dès qu'on en ouvre un autre.
  React.useEffect(() => {
    if (open && item) {
      setReason('comptage');
      setNote('');
      setTouched(false);
    }
  }, [open, item?.ref]);

  if (!item) return null;

  const delta = Units.round(counted - item.currentStock, item.unit);
  const submit = () => {
    if (!touched || delta === 0 || !Number.isFinite(counted) || counted < 0) return;
    onConfirm(counted, reason, note.trim() || undefined);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Corriger l’inventaire"
      className="sm:max-w-2xl sm:mx-auto"
      footer={
        <div className="flex gap-2">
          <Button full onClick={onClose}>
            Annuler
          </Button>
          <Button full intent="primary"
            onClick={submit}
            disabled={!touched || delta === 0 || !Number.isFinite(counted) || counted < 0}
          >
            {delta === 0 ? 'Aucun écart' : 'Enregistrer l’écart'}
          </Button>
        </div>
      }
    >
      <FormNav className="stock-form space-y-3" onSubmit={submit}>
        <div className="rounded-control border border-cave-800 p-2 flex items-baseline justify-between gap-2">
          <span className="min-w-0">
            <span className="block text-sm text-cave-50 break-words">{item.name}</span>
            <span className="block text-xs text-cave-400">
              Stock théorique · {item.category}
            </span>
          </span>
          <span className="reading text-base shrink-0">
            {Units.format(item.currentStock, item.unit)}
          </span>
        </div>

        <QuantityStepper
          label={`Stock réellement compté (${item.unit})`}
          value={counted}
          initialValue={item.currentStock}
          onChange={(v) => {
            setCounted(v);
            setTouched(true);
          }}
          unit={item.unit}
          category={item.category}
          projection={
            delta === 0 ? (
              <span className="text-cave-400">Aucun écart.</span>
            ) : (
              <>
                <span className="text-cave-400">Écart </span>
                <span className={`reading ${delta < 0 ? 'text-alert' : 'text-hop'}`}>
                  {delta > 0 ? '+' : ''}
                  {Units.format(delta, item.unit)}
                </span>
              </>
            )
          }
        />

        <Field label="Motif">
          <SegmentedControl
            label="Motif de la correction"
            layout="grid"
            value={reason}
            onChange={setReason}
            options={(Object.keys(INVENTORY_REASONS) as InventoryReason[]).map((k) => ({
              value: k,
              label: INVENTORY_REASONS[k]
            }))}
          />
        </Field>

        <Field label="Précision (facultatif)" htmlFor="inventory-note">
          <TextInput
            id="inventory-note"
            name="inventory_correction_note"
            value={note}
            onChange={setNote}
            placeholder="Ce qui explique l’écart"
          />
        </Field>
      </FormNav>
    </Sheet>
  );
};
