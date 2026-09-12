import React from 'react';
import { SaltId, AcidId, WaterIons } from '../types';
import { SALTS, SALT_IDS, ACIDS, ALKALINE_SALTS, ION_SYMBOL_SHORT, saltIons } from '../domain/water';
import { formatSaltDose } from './waterReadings';
import { formatDecimal } from './numericInput';

export interface AcidLine {
  amount: number;
  unit: string;
}

interface WaterAdditivesTableProps {
  doses: Partial<Record<SaltId, number>>;
  split: { mash: Partial<Record<SaltId, number>>; sparge: Partial<Record<SaltId, number>> };
  acidId: AcidId;
  mashAcid: AcidLine;
  spargeAcid: AcidLine;
  totalWaterL: number;
  hasSparge: boolean;
  allSaltsInMash?: boolean;
  spargeTargetPh: number;
  compact?: boolean;
}

/** Feuille de pesée partagée : seules les doses à préparer apparaissent. */
export const WaterAdditivesTable: React.FC<WaterAdditivesTableProps> = ({
  doses, split, acidId, mashAcid, spargeAcid, totalWaterL, hasSparge,
  allSaltsInMash, spargeTargetPh, compact = false
}) => {
  const pad = compact ? 'py-1.5 px-2' : 'py-2 px-2 sm:px-3';
  const validDose = (amount: number | undefined): number => Number.isFinite(amount) && amount! > 0 ? amount! : 0;
  const dosed = SALT_IDS.filter(id => validDose(doses[id]) > 0);
  const hasVolume = Number.isFinite(totalWaterL) && totalWaterL > 0;
  const mashAmount = validDose(mashAcid.amount);
  const spargeAmount = hasSparge ? validDose(spargeAcid.amount) : 0;
  const nothing = dosed.length === 0 && mashAmount === 0 && spargeAmount === 0;
  const isAllInMash = allSaltsInMash || (dosed.length > 0 && dosed.every(id => !validDose(split.sparge[id])));
  const splitDose = (amount: number | undefined) => validDose(amount) > 0 ? formatSaltDose(amount!) : '0,00 g';

  return (
    <div className="panel overflow-hidden">
      <table className="w-full text-2xs sm:text-sm">
        <caption className="sr-only">Doses à préparer pour l’empâtage et le rinçage</caption>
        <thead>
          <tr className="bg-cave-850 text-cave-400">
            <th scope="col" className={`text-left font-normal ${pad}`}>Additif</th>
            <th scope="col" className={`font-normal text-right ${pad}`}>Empâtage</th>
            <th scope="col" className={`font-normal text-right ${pad}`}>Rinçage</th>
            <th scope="col" className={`font-normal text-right ${pad}`}>Total</th>
          </tr>
        </thead>
        <tbody>
          {dosed.map(id => {
            const grams = validDose(doses[id]);
            const minerals = hasVolume ? (Object.entries(saltIons(id)) as Array<[keyof WaterIons, number]>)
              .filter(([, amount]) => amount > 0)
              .map(([ion, amount]) => `${ION_SYMBOL_SHORT[ion]}${ion === 'hco3' ? ' éq.' : ''} +${(amount * grams / totalWaterL).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}`) : [];
            if (hasVolume && SALTS[id].untracked) {
              const salt = SALTS[id];
              minerals.push(`K +${(salt.untracked!.ppmPerGramPerLitre * (salt.solubility ?? 1) * (salt.purity ?? 1) * grams / totalWaterL).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}`);
            }
            return (
              <React.Fragment key={id}>
                <tr className="border-t border-cave-800">
                  <th scope="row" className={`text-left font-normal text-cave-50 ${pad}`}>
                    {SALTS[id].name}
                    {ALKALINE_SALTS.includes(id) && <span className="block text-2xs text-cave-400">Empâtage seul</span>}
                  </th>
                  <td className={`${pad} tabular-nums whitespace-nowrap text-right text-cave-50`}>{splitDose(split.mash[id])}</td>
                  <td className={`${pad} tabular-nums whitespace-nowrap text-right text-cave-400`}>{splitDose(split.sparge[id])}</td>
                  <td className={`${pad} tabular-nums font-semibold whitespace-nowrap text-right text-ebc-straw`}>{formatSaltDose(grams)}</td>
                </tr>
                {!compact && minerals.length > 0 && (
                  <tr><td colSpan={4} className="px-2 sm:px-3 pb-2 text-2xs text-cave-400">
                    {minerals.join(' · ')} ppm sur l’eau totale, avant acide
                  </td></tr>
                )}
              </React.Fragment>
            );
          })}
          {hasVolume && mashAmount > 0 && (
            <tr className="border-t border-cave-800">
              <th scope="row" className={`text-left font-normal text-cave-50 ${pad}`}>
                {ACIDS[acidId].name}<span className="block text-2xs text-cave-400">Empâtage</span>
              </th>
              <td className={`${pad} tabular-nums whitespace-nowrap text-water text-right`}>{formatDecimal(mashAmount)} {mashAcid.unit}</td>
              <td className={`${pad} text-cave-400 text-right`}>—</td>
              <td className={`${pad} tabular-nums whitespace-nowrap text-water text-right`}>{formatDecimal(mashAmount)} {mashAcid.unit}</td>
            </tr>
          )}
          {hasVolume && spargeAmount > 0 && (
            <tr className="border-t border-cave-800">
              <th scope="row" className={`text-left font-normal text-cave-50 ${pad}`}>
                {ACIDS[acidId].name}<span className="block text-2xs text-cave-400">Rinçage · cible pH {formatDecimal(spargeTargetPh) || '—'}</span>
              </th>
              <td className={`${pad} text-cave-400 text-right`}>—</td>
              <td className={`${pad} tabular-nums whitespace-nowrap text-water text-right`}>{formatDecimal(spargeAmount)} {spargeAcid.unit}</td>
              <td className={`${pad} tabular-nums whitespace-nowrap text-water text-right`}>{formatDecimal(spargeAmount)} {spargeAcid.unit}</td>
            </tr>
          )}
          {nothing && (
            <tr className="border-t border-cave-800"><td colSpan={4} className="py-3 px-3 text-sm text-cave-400">
              {!hasVolume ? 'Rien de calculé : les volumes d’eau ne sont pas posés.' : 'Aucun ajout dosé. Le profil corrigé indique les écarts à la cible.'}
            </td></tr>
          )}
        </tbody>
      </table>
      {isAllInMash && dosed.length > 0 && hasSparge && (
        <p className="px-3 py-2 text-2xs text-cave-200 bg-hop/10 border-t border-cave-800">
          Tous les sels à l’empâtage{spargeAmount > 0 ? ' · Acide de rinçage à part' : ' · Aucun sel au rinçage'}
        </p>
      )}
    </div>
  );
};
