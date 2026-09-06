import React from 'react';
import { SaltId, AcidId } from '../types';
import { SALTS, SALT_IDS, ACIDS, ALKALINE_SALTS } from '../domain/water';

/**
 * Tout ce qu'on pèse, en un tableau : sels et acides, empâtage et rinçage.
 *
 * ⚠️ Il existait en TROIS exemplaires — l'atelier de l'eau, la fiche recette, et
 * bientôt le récapitulatif de l'assistant. Trois copies d'un tableau dont les
 * règles ne sont pas évidentes, c'est trois occasions de faire diverger celles-ci :
 *
 *   - un sel ALCALIN ne part jamais au rinçage, et la ligne le dit ;
 *   - les deux acides ne s'additionnent PAS dans la colonne « Total ». Ils se
 *     versent dans deux cuves, à deux moments de la journée. Une somme invitait
 *     à tout verser d'un coup.
 */

export interface AcidLine {
  amount: number;
  unit: string;
}

interface WaterAdditivesTableProps {
  /** Doses TOTALES par sel, en grammes. */
  doses: Partial<Record<SaltId, number>>;
  /** La même chose, répartie — issue de `splitDoses`. */
  split: { mash: Partial<Record<SaltId, number>>; sparge: Partial<Record<SaltId, number>> };
  acidId: AcidId;
  mashAcid: AcidLine;
  spargeAcid: AcidLine;
  /** Volume total d'eau : sans lui, aucune dose n'a été calculée. */
  totalWaterL: number;
  hasSparge: boolean;
  /** Tous les sels sont versés à l'empâtage (aucun sel au rinçage). */
  allSaltsInMash?: boolean;
  /** pH visé au rinçage, affiché en légende de la ligne. */
  spargeTargetPh: number;
  /** Densité serrée : la fiche de brassage en empile huit. */
  compact?: boolean;
}

export const WaterAdditivesTable: React.FC<WaterAdditivesTableProps> = ({
  doses,
  split,
  acidId,
  mashAcid,
  spargeAcid,
  totalWaterL,
  hasSparge,
  allSaltsInMash,
  spargeTargetPh,
  compact = false
}) => {
  const pad = compact ? 'py-1 px-2' : 'py-1.5 sm:py-2 px-2.5 sm:px-3';
  const padTight = compact ? 'py-1 px-1.5' : 'py-1.5 sm:py-2 px-1.5 sm:px-2';
  const dosed = SALT_IDS.filter((id) => (doses[id] ?? 0) > 0);
  const nothing = dosed.length === 0 && mashAcid.amount === 0 && spargeAcid.amount === 0;
  const isAllInMash = allSaltsInMash || (dosed.length > 0 && dosed.every((id) => !(split.sparge[id] ?? 0)));

  return (
    <div className="overflow-x-auto panel">
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr className="bg-cave-850 text-cave-400">
            <th scope="col" className={`text-left font-normal ${pad}`}>Additif</th>
            <th scope="col" className={`font-normal ${padTight} text-right`}>Empâtage</th>
            <th scope="col" className={`font-normal ${padTight} text-right`}>Rinçage</th>
            <th scope="col" className={`font-normal ${pad} text-right`}>Total</th>
          </tr>
        </thead>
        <tbody>
          {dosed.map((id) => (
            <tr key={id} className="border-t border-cave-850">
              <th scope="row" className={`text-left font-normal text-cave-100 ${pad}`}>
                {SALTS[id].name}
                {ALKALINE_SALTS.includes(id) && (
                  <span className="block text-xs text-cave-500">alcalin — empâtage seul</span>
                )}
              </th>
              <td className={`${padTight} reading whitespace-nowrap text-right`}>
                {(split.mash[id] ?? 0).toFixed(2)} g
              </td>
              <td className={`${padTight} reading whitespace-nowrap text-cave-400 text-right`}>
                {(split.sparge[id] ?? 0).toFixed(2)} g
              </td>
              <td className={`${pad} reading whitespace-nowrap text-ebc-straw text-right`}>
                {(doses[id] ?? 0).toFixed(2)} g
              </td>
            </tr>
          ))}

          {/*
            Sans volume d'eau, la ligne ne montrerait que des tirets au-dessus du
            message qui explique déjà qu'il n'y a rien à calculer.
          */}
          {totalWaterL > 0 && (
            <tr className="border-t border-cave-850">
              <th scope="row" className={`text-left font-normal text-cave-100 ${pad}`}>
                {ACIDS[acidId].name}
                <span className="block text-xs text-cave-500">vers l’AR de l’empâtage</span>
              </th>
              <td className={`${padTight} reading whitespace-nowrap text-water text-right`}>
                {mashAcid.amount > 0 ? `${mashAcid.amount} ${mashAcid.unit}` : '—'}
              </td>
              <td className={`${padTight} reading whitespace-nowrap text-cave-600 text-right`}>—</td>
              <td className={`${pad} reading whitespace-nowrap text-water text-right`}>
                {mashAcid.amount > 0 ? `${mashAcid.amount} ${mashAcid.unit}` : '—'}
              </td>
            </tr>
          )}

          {totalWaterL > 0 && hasSparge && (
            <tr className="border-t border-cave-850">
              <th scope="row" className={`text-left font-normal text-cave-100 ${pad}`}>
                {ACIDS[acidId].name}
                <span className="block text-xs text-cave-500">vers pH {spargeTargetPh} au rinçage</span>
              </th>
              <td className={`${padTight} reading whitespace-nowrap text-cave-600 text-right`}>—</td>
              <td className={`${padTight} reading whitespace-nowrap text-water text-right`}>
                {spargeAcid.amount > 0 ? `${spargeAcid.amount} ${spargeAcid.unit}` : '—'}
              </td>
              <td className={`${pad} reading whitespace-nowrap text-water text-right`}>
                {spargeAcid.amount > 0 ? `${spargeAcid.amount} ${spargeAcid.unit}` : '—'}
              </td>
            </tr>
          )}

          {/*
            ⚠️ Deux états très différents, et un seul message les couvrait. Sans
            volume d'eau, AUCUNE dose n'a été calculée — annoncer que « l'eau est
            déjà dans la fourchette » était un chiffre rassurant et faux.
          */}
          {nothing && (
            <tr className="border-t border-cave-850">
              <td colSpan={4} className="py-2.5 px-3 text-xs sm:text-sm text-cave-500">
                {totalWaterL <= 0
                  ? 'Rien de calculé : les volumes d’eau ne sont pas posés.'
                  : 'Rien à ajouter : l’eau est déjà dans la fourchette du style.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {isAllInMash && dosed.length > 0 && hasSparge && (
        <div className="px-2.5 py-1 text-2xs text-hop bg-hop/10 border-t border-cave-850 flex items-center justify-between">
          <span>Tous les sels à l’empâtage · Rinçage acidifié seul</span>
        </div>
      )}
    </div>
  );
};
