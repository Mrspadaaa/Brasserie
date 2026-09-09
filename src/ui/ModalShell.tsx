import React, { useEffect, useRef } from 'react';
import { useCoarsePointer, useKeyboardInset, useDensity } from './useViewport';

/**
 * Enveloppe commune des modales de saisie.
 *
 * ⚠️ Ce qu'elle règle, et qui était répété à l'identique dans dix fichiers :
 *
 * 1. LE CLAVIER. Les modales étaient centrées, en `max-h-[92vh]`. Or `vh`
 *    ignore le clavier virtuel : celui-ci se posait par-dessus la moitié basse
 *    de la boîte, donc par-dessus les derniers champs et les boutons. La
 *    hauteur se cale désormais sur ce qui est RÉELLEMENT visible.
 *
 * 2. LA PORTÉE DU POUCE. Une boîte centrée met ses actions au milieu de
 *    l'écran. Au doigt, la modale s'ancre donc en bas, comme les feuilles du
 *    reste de l'application ; à la souris, elle reste centrée, où c'est le bon
 *    endroit.
 *
 * 3. LE DÉFILEMENT DE L'ARRIÈRE-PLAN. Rien ne le bloquait : faire défiler un
 *    formulaire jusqu'au bout continuait sur la page derrière, et l'on perdait
 *    sa place en revenant.
 *
 * Elle ne prend en charge NI l'en-tête NI le formulaire : chaque écran garde
 * les siens. C'est volontaire — la remplacer ne doit pas obliger à réécrire le
 * contenu de dix modales d'un coup.
 */

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Largeur sur ordinateur. `md` pour un formulaire court, `lg` au-delà. */
  size?: 'md' | 'lg';
  /**
   * Empêche la fermeture au clic extérieur et à Échap — pour une saisie qu'on
   * ne veut pas perdre d'un geste maladroit.
   */
  dismissible?: boolean;
  labelledBy?: string;
}

export const ModalShell: React.FC<ModalShellProps> = ({
  open,
  onClose,
  children,
  size = 'lg',
  dismissible = true,
  labelledBy
}) => {
  const coarse = useCoarsePointer();
  const keyboardInset = useKeyboardInset();
  const panelRef = useRef<HTMLDivElement>(null);

  // Échap ferme, comme partout ailleurs dans l'application.
  useEffect(() => {
    if (!open || !dismissible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      // A conversation/lookup sheet can be above this recipe. Escape belongs
      // to the top dialog, otherwise closing chat also destroys the draft.
      const dialogs = [...document.querySelectorAll<HTMLElement>('[role="dialog"]')]
        .filter(el => el.dataset.state !== 'closed' && el.getAttribute('aria-hidden') !== 'true');
      if (dialogs.at(-1) !== panelRef.current) return;
      e.preventDefault(); onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, dismissible, onClose]);

  // Fige la page derrière : sans ça, le défilement traverse la modale.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  const maxWidth = size === 'md' ? 'sm:max-w-md' : 'sm:max-w-lg';

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center bg-cave-950/80 backdrop-blur-sm
                  animate-in fade-in
                  ${coarse ? 'items-end' : 'items-center p-3 sm:p-4'}`}
      onPointerDown={(e) => {
        // Uniquement le fond : un glissement parti de l'intérieur ne ferme pas.
        if (dismissible && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        style={{
          /*
           * Le clavier ne réduit ni `vh` ni `dvh` : on retranche nous-mêmes sa
           * hauteur mesurée, sans quoi le bas du formulaire reste dessous.
           */
          marginBottom: coarse ? keyboardInset || undefined : undefined,
          maxHeight: keyboardInset
            ? `calc(100dvh - ${keyboardInset}px - ${coarse ? 8 : 32}px)`
            : undefined
        }}
        className={`w-full ${maxWidth} flex flex-col overflow-hidden
                    bg-cave-900 border border-cave-800 shadow-2xl
                    ${
                      coarse
                        ? 'rounded-t-sheet border-b-0 max-h-[94dvh]'
                        : 'rounded-3xl max-h-[92dvh]'
                    }`}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * Rangée d'actions qui reste sous le pouce.
 *
 * ⚠️ Les boutons vivaient à la fin du formulaire, donc dans la zone qui défile :
 * clavier ouvert, valider demandait de faire défiler à l'aveugle jusqu'en bas.
 * `sticky` les colle en pied SANS les sortir du `<form>` — ce qui les
 * déconnecterait de `type="submit"`.
 */
export const StickyActions: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  const tight = useDensity() === 'tight';
  return (
    <div
      className={`sticky bottom-0 bg-cave-900 border-t border-cave-800
                  flex gap-2 ${tight ? 'mt-1 pt-1.5 pb-2 -mx-3 px-3' : 'mt-1.5 pt-2 pb-2.5 -mx-4 px-4 sm:-mx-5 sm:px-5'} ${className}`}
    >
      {children}
    </div>
  );
};
