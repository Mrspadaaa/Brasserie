import React from 'react';
import { X } from 'lucide-react';
import { SaltId, WaterIons } from '../types';
import { ALKALINE_SALTS, ION_LABEL, ION_SYMBOL, SALTS, saltIons } from '../domain/water';

interface SaltMineralDetailsProps {
  saltId: SaltId;
  grams: number;
  totalWaterL: number;
  disabled?: boolean;
  onClose?: () => void;
}

const format = (value: number) => value > 0 && value < 0.1 ? '<0,1' : value.toLocaleString('fr-CH', { maximumFractionDigits: 1 });

/** Détail des apports du produit pesé, avec les mêmes facteurs que le solveur. */
export const SaltMineralDetails: React.FC<SaltMineralDetailsProps> = ({
  saltId, grams, totalWaterL, disabled = false, onClose
}) => {
  const salt = SALTS[saltId];
  const contributions = saltIons(saltId);
  const hasVolume = Number.isFinite(totalWaterL) && totalWaterL > 0;
  const dose = Number.isFinite(grams) ? Math.max(0, grams) : 0;
  const rows: Array<{ key: string; name: string; symbol: string; amount: number | null }> =
    (Object.entries(contributions) as Array<[keyof WaterIons, number]>)
      .filter(([, perGram]) => perGram > 0)
      .map(([ion, perGram]) => ({
        key: ion,
        name: ION_LABEL[ion],
        symbol: ion === 'hco3' ? `${ION_SYMBOL[ion]} éq.` : ION_SYMBOL[ion],
        amount: hasVolume ? perGram * dose / totalWaterL : null
      }));
  if (salt.untracked) rows.push({
    key: 'potassium',
    name: 'Potassium',
    symbol: 'K⁺',
    amount: hasVolume
      ? salt.untracked.ppmPerGramPerLitre * (salt.solubility ?? 1) * (salt.purity ?? 1) * dose / totalWaterL
      : null
  });

  return (
    <section aria-label={`Détail des minéraux de ${salt.name}`} className="rounded-control border border-water/50 bg-water/5 px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-cave-50">{salt.name}</h4>
          <p className="text-2xs text-cave-400">{salt.formula}{ALKALINE_SALTS.includes(saltId) && ' · Empâtage uniquement'}</p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Fermer le détail des minéraux" className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-cave-400 hover:text-cave-50">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="mt-1 text-2xs text-cave-200">
        {hasVolume ? `Apports de ${dose.toLocaleString('fr-CH', { maximumFractionDigits: 3 })} g dans ${format(totalWaterL)} L d’eau totale` : 'Renseigner le volume d’eau pour calculer les apports.'}
      </p>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
        {rows.map(row => (
          <div key={row.key} className="flex items-baseline justify-between gap-2 border-b border-cave-800 pb-1">
            <dt className="text-2xs text-cave-200" title={row.name}>{row.symbol}</dt>
            <dd className="whitespace-nowrap text-sm text-cave-50"><span className="font-semibold tabular-nums">{row.amount === null ? '—' : `+${format(row.amount)}`}</span> <span className="text-2xs text-cave-400">ppm</span></dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-2xs leading-snug text-cave-200">{salt.effect}</p>
      {saltId === 'chaux' && <p className="mt-1 text-2xs text-cave-400">La chaux apporte de l’alcalinité, exprimée en équivalent HCO₃, pas du bicarbonate.</p>}
      {salt.untracked && <p className="mt-1 text-2xs text-cave-400">Le potassium est inclus ici ; le graphique ne suit que les six autres ions.</p>}
      {salt.caution && !salt.cautionThreshold && <p className="mt-1 text-2xs leading-snug text-cave-400">{salt.caution}</p>}
      {disabled && <p className="mt-1 text-2xs text-cave-400">Sel écarté du calcul automatique.</p>}
      {hasVolume && dose === 0 && <p className="mt-1 text-2xs text-cave-400">Dose à zéro : aucun minéral ajouté par ce sel.</p>}
      {rows.some(row => row.key === 'hco3') && <p className="mt-1 text-2xs text-cave-400">Apports avant neutralisation par l’acide.</p>}
    </section>
  );
};
