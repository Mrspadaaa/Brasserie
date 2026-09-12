import React, { useEffect, useRef } from 'react';
import { useCoarsePointer, useKeyboardInset, useDensity } from './useViewport';

let scrollLocks = 0;
let bodyOverflow = '';
const returnTargets = new WeakMap<HTMLElement, HTMLElement | null>();
const topDialog = () => [...document.querySelectorAll<HTMLElement>('[role="dialog"]')]
  .filter(el => el.dataset.state !== 'closed' && !el.closest('[aria-hidden="true"], [inert]')).at(-1);
const focusableElements = (panel: HTMLElement) => [...panel.querySelectorAll<HTMLElement>(
  'button, a[href], input, select, textarea, summary, [tabindex], [contenteditable="plaintext-only"], [contenteditable="true"]'
)].filter(el => {
  if (el.tabIndex < 0 || el.matches(':disabled, input[type="hidden"]') || el.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
  if (getComputedStyle(el).display === 'none' || getComputedStyle(el).visibility === 'hidden') return false;
  for (let parent = el.parentElement; parent && parent !== panel; parent = parent.parentElement) {
    if (getComputedStyle(parent).display === 'none') return false;
    if (parent instanceof HTMLDetailsElement && !parent.open && !parent.querySelector('summary')?.contains(el)) return false;
  }
  return true;
});

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
  const closeRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);
  closeRef.current = onClose;
  dismissibleRef.current = dismissible;

  // Le titre reçoit le focus sans ouvrir le clavier mobile. Seul le dialogue
  // au premier plan possède Tab et Échap, y compris avec une feuille imbriquée.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!returnTargets.has(panel)) returnTargets.set(panel, active);
    if (topDialog() === panel && !panel.contains(document.activeElement)) panel.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || topDialog() !== panel) return;
      if (e.key === 'Escape' && dismissibleRef.current) {
        e.preventDefault(); closeRef.current();
      }
      if (e.key !== 'Tab') return;
      const targets = focusableElements(panel);
      const first = targets[0], last = targets.at(-1);
      if (!first || !last) { e.preventDefault(); panel.focus(); return; }
      const current = document.activeElement;
      if (!panel.contains(current) || current === panel || (e.shiftKey ? current === first : current === last)) {
        e.preventDefault(); (e.shiftKey ? last : first).focus();
      }
    };
    const onFocus = (e: FocusEvent) => {
      if (topDialog() === panel && !panel.contains(e.target as Node)) panel.focus({ preventScroll: true });
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('focusin', onFocus);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('focusin', onFocus);
      // Ne pas voler le focus à un dialogue qui reste devant celui-ci.
      const remaining = topDialog();
      const opener = returnTargets.get(panel);
      returnTargets.delete(panel);
      if (opener?.isConnected) {
        if (!remaining || remaining === panel || remaining.contains(opener)) opener.focus({ preventScroll: true });
        // Un parcours peut remplacer sa modale par un autre formulaire. Son
        // déclencheur vient de disparaître : transmettre le retour d’origine.
        else if (!panel.isConnected) {
          const nextTarget = returnTargets.get(remaining);
          if (!nextTarget?.isConnected || nextTarget === document.body) returnTargets.set(remaining, opener);
        }
      }
    };
  }, [open]);

  // Fige la page derrière : sans ça, le défilement traverse la modale.
  useEffect(() => {
    if (!open) return;
    if (scrollLocks++ === 0) bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      if (--scrollLocks === 0) document.body.style.overflow = bodyOverflow;
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
        tabIndex={-1}
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
