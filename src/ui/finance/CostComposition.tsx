import React from 'react';
import { formatCHF } from '../../domain/finance/ledger';
import { CategoryTag } from './CategoryTag';

export interface CostPart { key: string; label: string; amountCents: number }

/** Part en pourcentage, arrondie sans jamais écrire « 0 % » pour une dépense réelle. */
const shareLabel = (share: number): string => share < 1 ? '< 1 %' : `${Math.round(share)} %`;

/**
 * Composition d'un total de dépenses.
 *
 * ⚠️ Pourquoi une barre empilée et non quatre barres : quatre barres mises à
 * l'échelle du plus gros poste répondent à « lequel est le plus gros ? », une
 * question qu'un tri par montant réglait déjà. La question du brasseur est
 * « quelle part de mon mois part dans ce poste ? ». Une seule barre segmentée
 * du total y répond, et la légende donne la part chiffrée à côté du montant.
 *
 * Les segments portent les COULEURS DE CATÉGORIE, les mêmes que les pastilles
 * du journal (ΔE minimum mesuré entre segments : 36.8). La barre se lit donc
 * seule, et un poste repéré ici se retrouve à l'œil dans la liste des
 * opérations. Un dégradé anonyme aurait obligé à faire l'aller-retour par la
 * légende à chaque fois.
 *
 * Un poste négatif — un avoir qui dépasse les achats du mois — n'entre pas dans
 * la barre et n'affiche pas de part : une part d'un total n'a pas de sens sous
 * zéro. Son montant reste lisible, avec son signe.
 */
export function CostComposition({ parts, onSelect }: {
  parts: CostPart[];
  onSelect: (key: string) => void;
}) {
  const positive = parts.filter(part => part.amountCents > 0);
  const base = positive.reduce((total, part) => total + part.amountCents, 0);
  const share = (part: CostPart) => base > 0 && part.amountCents > 0 ? part.amountCents / base * 100 : null;

  return <>
    {base > 0 && <div className="finance-composition" role="img"
      aria-label={`Composition des dépenses : ${positive.map(part => `${part.label} ${shareLabel(share(part)!)}`).join(', ')}.`}>
      {positive.map(part => <span key={part.key} className={`finance-seg finance-seg-${part.key}`} style={{ width: `${share(part)}%` }}/>)}
    </div>}
    <div className="finance-legend">
      {parts.map(part => {
        const percent = share(part);
        return <button type="button" key={part.key} onClick={() => onSelect(part.key)}
          aria-label={`${part.label} ${formatCHF(part.amountCents)}${percent == null ? '' : ` · ${shareLabel(percent)} des dépenses`}. Voir ces opérations.`}>
          <CategoryTag category={part.key}/>
          <span className="finance-money">{formatCHF(part.amountCents)}</span>
          <span className="finance-legend-share" aria-hidden="true">{percent == null ? '—' : shareLabel(percent)}</span>
        </button>;
      })}
    </div>
  </>;
}
