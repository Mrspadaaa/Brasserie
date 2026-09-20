import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { shiftMonth } from './financeFormat';

/**
 * Choix du mois, sur une seule rangée.
 *
 * ⚠️ Pourquoi des flèches autour du sélecteur natif : le geste réellement
 * répété n'est pas « choisir un mois quelconque », c'est « le mois d'avant ».
 * Avec le seul `input[type=month]` il fallait ouvrir le sélecteur de l'appareil
 * et viser une case. Les flèches font ce pas en un appui ; le champ natif reste
 * la valeur affichée, l'accès au clavier et le saut vers un mois lointain.
 */
export function MonthStepper({ label, month, disabled = false, onMonth }: {
  /** Nom accessible du champ ; il reste sa seule étiquette. */
  label: string;
  month: string;
  disabled?: boolean;
  onMonth: (month: string) => void;
}) {
  return <span className="finance-month">
    <button type="button" aria-label="Mois précédent" disabled={disabled} onClick={() => onMonth(shiftMonth(month, -1))}>
      <ChevronLeft size={15} aria-hidden="true"/>
    </button>
    <input type="month" aria-label={label} value={month} disabled={disabled}
      onChange={event => { if (event.target.value) onMonth(event.target.value); }}/>
    <button type="button" aria-label="Mois suivant" disabled={disabled} onClick={() => onMonth(shiftMonth(month, 1))}>
      <ChevronRight size={15} aria-hidden="true"/>
    </button>
  </span>;
}

/**
 * Rangée de période : la commande à gauche, ce qu'elle donne à droite.
 *
 * Le compte et le total de la période se lisent là où on change la période.
 * Ils vivaient auparavant dans deux blocs séparés, ou nulle part.
 */
export function FinancePeriodBar({ children, count, context, total, totalLabel, lead = false }: {
  children: React.ReactNode;
  count?: string;
  /** Ce que la période contient en plus de son intitulé, quand ce n'est pas évident. */
  context?: string;
  /** Solde net déjà signé, ou `undefined` lorsqu'il n'est pas calculable. */
  total?: string;
  totalLabel?: string;
  /** Le total est le chiffre principal de l'écran, pas un appoint de la barre. */
  lead?: boolean;
}) {
  return <div className={`finance-period${lead ? ' finance-period-lead' : ''}`}>
    {children}
    {(count || context || total) && <span className="finance-period-reading" role="status">
      {count && <span className="finance-period-count">{count}</span>}
      {context && <small>{context}</small>}
      {total && <output className="finance-money" aria-label={totalLabel}>{total}</output>}
    </span>}
  </div>;
}
