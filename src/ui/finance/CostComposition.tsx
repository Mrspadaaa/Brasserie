import React from 'react';
import { formatCHF } from '../../domain/finance/ledger';

export interface CostPart { key: string; label: string; amountCents: number }

/**
 * Nuances du bleu de la rubrique Finances, de la part la plus grosse à la plus
 * petite. Ce ne sont pas des couleurs de catégorie : une catégorie ne change pas
 * de teinte selon le mois. C'est un dégradé d'ordre, et le sens exact se lit
 * dans la légende, qui porte le montant et la part.
 */
const SHADES = ['#86B9E6', '#6EA2D0', '#598BB8', '#4775A0', '#3A6188', '#2F4E70', '#274058', '#213546'];

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
  const shades = new Map(positive.map((part, index) => [part.key, SHADES[Math.min(index, SHADES.length - 1)]]));
  const share = (part: CostPart) => base > 0 && part.amountCents > 0 ? part.amountCents / base * 100 : null;

  return <>
    {base > 0 && <div className="finance-composition" role="img"
      aria-label={`Composition des dépenses : ${positive.map(part => `${part.label} ${shareLabel(share(part)!)}`).join(', ')}.`}>
      {positive.map(part => <span key={part.key} style={{ width: `${share(part)}%`, background: shades.get(part.key) }}/>)}
    </div>}
    <div className="finance-legend">
      {parts.map(part => {
        const percent = share(part);
        return <button type="button" key={part.key} onClick={() => onSelect(part.key)}
          aria-label={`${part.label} ${formatCHF(part.amountCents)}${percent == null ? '' : ` · ${shareLabel(percent)} des dépenses`}. Voir ces opérations.`}>
          <span className="finance-legend-dot" style={{ background: shades.get(part.key) ?? '#574A42' }} aria-hidden="true"/>
          <span className="finance-legend-label">{part.label}</span>
          <span className="finance-money">{formatCHF(part.amountCents)}</span>
          <span className="finance-legend-share" aria-hidden="true">{percent == null ? '—' : shareLabel(percent)}</span>
        </button>;
      })}
    </div>
  </>;
}
