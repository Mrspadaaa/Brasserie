import React, { useEffect, useState } from 'react';
import { NumberInput } from './NumberInput';
import { PricingItem, AppConfig } from '../types';
import { Sheet, ConfirmSheet } from './Sheet';
import { FormNav, Field, TextInput, inputClass } from './FormNav';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useSyncedDraft } from '../hooks/useLiveData';

/**
 * Fiche tarif : créer, modifier, supprimer.
 *
 * ⚠️ Les tarifs s'affichaient en lecture seule, sans aucune méthode d'écriture
 * côté données : un prix devenu faux restait affiché indéfiniment.
 *
 * Le coût total, la marge en francs et la marge en pourcentage sont **calculés**
 * à partir des trois coûts saisis — ils étaient auparavant stockés, donc
 * susceptibles de contredire leurs propres composantes.
 */

interface TarifSheetProps {
  item: PricingItem | null;
  config: AppConfig;
  onClose: () => void;
  onSave: (item: PricingItem) => void;
  onDelete: (item: PricingItem) => void;
}

const chf = (n: number) =>
  n.toLocaleString('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const TarifSheet: React.FC<TarifSheetProps> = ({
  item,
  config,
  onClose,
  onSave,
  onDelete
}) => {
  const [draft, setDraft] = useSyncedDraft(item, item?.product);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!item || !draft) return null;

  const isNew = !item.product;

  // Recalculés à chaque frappe : un total stocké finit par mentir.
  const costTotal =
    Math.round((draft.costIngredients + draft.costFixed) * 100) / 100;
  const marginCHF = Math.round((draft.priceHT - costTotal) * 100) / 100;
  const marginPercent =
    draft.priceHT > 0 ? Math.round((marginCHF / draft.priceHT) * 1000) / 10 : 0;

  const tvaRate = config.fiscal.isTvaRegistered ? config.fiscal.tvaNormalRate : 0;
  const priceTTC = Math.round(draft.priceHT * (1 + tvaRate) * 100) / 100;

  const save = () => {
    onSave({
      ...draft,
      product: draft.product.trim(),
      costLabor: 0,
      costTotal,
      marginCHF,
      marginPercent
    });
    onClose();
  };

  const money = (
    label: string,
    key: 'costIngredients' | 'costLabor' | 'costFixed' | 'priceHT',
    hint?: string
  ) => (
    <Field label={label} htmlFor={`tf-${key}`} hint={hint}>
      <NumberInput
        value={draft[key]}
        onValue={(v) => setDraft({ ...draft, [key]: v })}
        pad
        className={`${inputClass} reading text-right`}
      />
    </Field>
  );

  return (
    <>
      <Sheet
        open={Boolean(item)}
        onClose={onClose}
        title={isNew ? 'Nouveau tarif' : draft.product}
        subtitle={isNew ? undefined : `${chf(draft.priceHT)} CHF HT`}
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-touch rounded-control border border-cave-700 text-cave-200"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={save}
              disabled={draft.product.trim().length < 2}
              className="flex-1 min-h-touch rounded-control bg-ebc-straw text-cave-950
                         font-semibold disabled:opacity-40"
            >
              Enregistrer
            </button>
          </div>
        }
      >
        <FormNav className="space-y-5" onSubmit={save}>
          <Field label="Produit" htmlFor="tf-product">
            <TextInput
              id="tf-item"
              name="tarif_product_label"
              placeholder="Bouteille 75 cl, fût 30 L…"
              value={draft.product}
              onChange={(product) => setDraft({ ...draft, product })}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {money('Ingrédients', 'costIngredients', 'Malt, houblon, levure')}
            {money('Charges fixes', 'costFixed', 'Loyer, énergie, amortissement')}
          </div>
          <p className="text-sm text-cave-400">Le temps personnel du brasseur est exclu du coût.</p>

          {money('Prix de vente HT', 'priceHT')}

          {/* Le résultat, calculé — jamais saisi. */}
          <div className="panel p-4 space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-cave-500">Coût de revient</span>
              <span className="reading text-base">{chf(costTotal)} CHF</span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-cave-500">Marge</span>
              <span
                className={`reading text-xl ${
                  marginCHF <= 0 ? 'text-alert' : marginPercent < 30 ? 'text-ebc-amber' : 'text-hop'
                }`}
              >
                {chf(marginCHF)} CHF · {marginPercent.toFixed(1)} %
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-3 pt-2 border-t border-cave-800">
              <span className="text-sm text-cave-500">
                Prix TTC{' '}
                {config.fiscal.isTvaRegistered
                  ? `(TVA ${(tvaRate * 100).toFixed(1)} %)`
                  : '(non assujettie)'}
              </span>
              <span className="reading text-base text-ebc-straw">{chf(priceTTC)} CHF</span>
            </div>

            {marginCHF <= 0 && draft.priceHT > 0 && (
              <p className="flex items-start gap-2 text-sm text-alert leading-snug">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Ce prix ne couvre pas le coût de revient.</span>
              </p>
            )}
          </div>
        </FormNav>

        {!isNew && (
          <div className="pt-4 mt-5 border-t border-cave-800">
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full min-h-touch rounded-control border border-alert/40
                         text-alert flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Supprimer
            </button>
          </div>
        )}
      </Sheet>

      <ConfirmSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Supprimer ce tarif ?"
        what={`${item.product} — ${chf(item.priceHT)} CHF HT`}
        consequence="Les ventes déjà enregistrées ne sont pas touchées."
        confirmLabel="Supprimer"
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete(item);
          onClose();
        }}
      />
    </>
  );
};
