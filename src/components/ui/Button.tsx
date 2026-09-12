import React from 'react';

/**
 * Actions.
 *
 * Trois intentions seulement, pour que la hiérarchie reste lisible :
 *   - `primary`   : l'action que l'écran attend (une seule par écran) ;
 *   - `secondary` : les autres actions possibles ;
 *   - `danger`    : ce qui retire ou annule.
 *
 * Toutes font au moins 48 px de haut. Les libellés disent ce qui va se passer
 * (« Enregistrer l'achat »), pas une catégorie abstraite (« Valider »), et le
 * même mot est repris dans la confirmation qui suit.
 */

type Intent = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  intent?: Intent;
  icon?: React.ReactNode;
  full?: boolean;
  size?: 'md' | 'lg';
}

const INTENTS: Record<Intent, string> = {
  // Le seul aplat clair de l'interface : impossible de le rater dans la pénombre.
  primary: 'bg-ebc-straw text-cave-950 font-semibold hover:bg-ebc-gold active:bg-ebc-amber',
  secondary:
    'bg-cave-850 text-cave-50 border border-cave-700 hover:border-cave-600 active:bg-cave-800',
  danger: 'bg-transparent text-alert border border-alert/40 hover:bg-alert/10 active:bg-alert/20',
  ghost: 'bg-transparent text-cave-400 hover:text-cave-50 active:bg-cave-850'
};

export const Button: React.FC<ButtonProps> = ({
  intent = 'secondary',
  icon,
  full = false,
  size = 'md',
  className = '',
  children,
  ...rest
}) => (
  <button
    {...rest}
    className={[
      'inline-flex items-center justify-center gap-2 rounded-control',
      'transition-colors disabled:opacity-40 disabled:pointer-events-none',
      /*
       * Révisé le 12.09.2026 : « beaucoup trop grands, larges et imposants ».
       * Le rembourrage horizontal passe de 24/16 px à 16/12, et le libellé de
       * 16 px à 14 — le plancher typographique, pas en dessous. Un bouton fait
       * la taille de son mot, pas celle de la place disponible.
       */
      size === 'lg' ? 'min-h-touch-lg px-3 text-sm' : 'min-h-touch px-2.5 text-sm',
      INTENTS[intent],
      full ? 'w-full' : '',
      className
    ].join(' ')}
  >
    {icon}
    {children}
  </button>
);

/** Bouton icône seul — garde la cible tactile complète malgré sa petite icône. */
export const IconButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; intent?: Intent }
> = ({ label, intent = 'ghost', className = '', children, ...rest }) => (
  <button
    {...rest}
    aria-label={label}
    title={label}
    className={[
      'touch-target rounded-control transition-colors',
      INTENTS[intent],
      className
    ].join(' ')}
  >
    {children}
  </button>
);
