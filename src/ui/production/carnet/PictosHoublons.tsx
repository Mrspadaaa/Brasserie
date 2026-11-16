import React from 'react';
import type { Batch } from '../../../types';
import type { FamilyId } from '../../../domain/hopIndex/v4/families';
import { Picto } from '../../hopIndex/Pictos';
import { houblonDe } from '../fermentation/modele';
import { formatDecimal } from '../../numericInput';

/**
 * e3gb n° 1 : les pictos de familles d'arômes sur la ligne du dry hop, ceux de la fiche de fermentation (composant `Picto`).
 * La marque du houblon (`signature`) et, s'il y en a, la famille citée à égalité avec elle (Citra : agrumes et tropicaux).
 * Houblon non associé à une variété : aucun picto, jamais un picto inventé.
 */
export function famillesDuHoublon(batch: Batch, nom: string): FamilyId[] {
  const h = (batch.recipeSnapshot?.hops ?? []).find(x => x.name === nom);
  if (!h) return [];
  const m = houblonDe(h, 0);
  if (!m.signature) return [];
  const marque = m.familles.find(f => f.id === m.signature);
  const voisines = m.familles.filter(f => f.id !== m.signature && marque && f.part >= 0.85 && Math.abs(f.part - marque.part) < 0.001).map(f => f.id);
  return [m.signature, ...voisines].slice(0, 2);
}

/** « Citra 100 g + Mosaic 80 g », chaque nom précédé de ses pictos. Le texte reste lisible tel quel. */
export const LignesDryHop: React.FC<{ batch: Batch; lignes: { nom: string; g: number }[] }> = ({ batch, lignes }) => (
  <>
    {lignes.map((l, i) => (
      <React.Fragment key={`${l.nom}${i}`}>
        {i > 0 && ' + '}
        <span className="whitespace-nowrap">
          {famillesDuHoublon(batch, l.nom).map(f => <span key={f} className="mr-0.5 inline-block align-[-3px]"><Picto famille={f} taille={16} /></span>)}
          {`${l.nom} ${formatDecimal(l.g, 0)} g`}
        </span>
      </React.Fragment>
    ))}
  </>
);
