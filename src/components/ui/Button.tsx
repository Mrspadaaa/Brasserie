import React from 'react';

/**
 * Actions.
 *
 * Trois intentions seulement, pour que la hiérarchie reste lisible :
 *   - `primary`   : l'action que l'écran attend (une seule par écran) ;
 *   - `secondary` : les autres actions possibles ;
 *   - `danger`    : ce qui retire ou annule.
 *
 * Dimensions communes : 24 px pour une petite action, 28 px en usage courant,
 * 32 px pour l'action principale. Les libellés disent ce qui va se passer
 * (« Enregistrer l'achat »), pas une catégorie abstraite (« Valider »), et le
 * même mot est repris dans la confirmation qui suit.
 */

type Intent = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  intent?: Intent;
  icon?: React.ReactNode;
  full?: boolean;
  size?: 'sm' | 'md' | 'lg';
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
  size = intent === 'primary' ? 'lg' : 'md',
  className = '',
  children,
  ...rest
}) => (
  <button
    {...rest}
    className={[
      'inline-flex items-center justify-center gap-1 rounded-control leading-tight',
      'transition-colors disabled:opacity-40 disabled:pointer-events-none',
      size === 'sm' ? 'min-h-touch-sm px-1.5 text-xs' : size === 'lg' ? 'min-h-touch-lg px-2 text-sm' : 'min-h-touch px-2 text-2xs',
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
