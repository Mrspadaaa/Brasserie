import React from 'react';
import { Drawer } from 'vaul';
import { X } from 'lucide-react';
import { useKeyboardInset, useDensity } from './useViewport';

/**
 * Feuille glissante — **toute** saisie et édition de l'application y passe.
 *
 * Pourquoi une feuille plutôt qu'une boîte de dialogue centrée : l'app se
 * manipule à une main dans la cuverie. Une modale centrée met ses boutons au
 * milieu de l'écran, hors d'atteinte du pouce ; une feuille venue du bas garde
 * les actions là où le pouce se trouve, et se referme d'un glissement sans
 * viser une petite croix.
 *
 * vaul gère le glisser-pour-fermer, les points d'ancrage et — le plus délicat —
 * la distinction entre défiler le contenu et glisser la feuille.
 */

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Une ligne de contexte sous le titre. */
  subtitle?: string;
  children: React.ReactNode;
  /** Actions en pied de feuille, toujours accessibles au pouce. */
  footer?: React.ReactNode;
  /**
   * Points d'ancrage. Par défaut la feuille s'ouvre aux deux tiers puis se
   * déploie : on voit le contenu sans perdre le contexte de l'écran dessous.
   */
  snapPoints?: (string | number)[];
  /** Empêche la fermeture accidentelle quand une saisie est en cours. */
  dismissible?: boolean;
  className?: string;
}

export const Sheet: React.FC<SheetProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  snapPoints,
  dismissible = true,
  className = ''
}) => {
  /*
   * ⚠️ Le clavier virtuel ne réduit NI `dvh`, NI `window.innerHeight` : une
   * feuille ancrée en bas restait à sa place et le clavier se posait par-dessus
   * — donc par-dessus le pied de feuille, c'est-à-dire par-dessus le bouton
   * « Enregistrer ». On relève la feuille de la hauteur réellement mesurée.
   *
   * On agit sur `bottom` et pas sur `transform` : `transform` appartient à vaul,
   * qui s'en sert pour le glissement. Les deux se seraient écrasés.
   *
   * `repositionInputs` reste désactivé pour la même raison : c'est nous qui
   * compensons, et la compensation d'iOS s'ajouterait à la nôtre.
   */
  const keyboardInset = useKeyboardInset();
  /*
   * Clavier ouvert, la feuille ne dispose plus que d'environ 300 px : la
   * poignée, le sous-titre et les rembourrages en consommaient la moitié.
   */
  const tight = useDensity() === 'tight';
  const returnFocus = React.useRef<HTMLElement | null>(null);

  return (
  <Drawer.Root
    open={open}
    onOpenChange={(o) => !o && onClose()}
    snapPoints={snapPoints}
    dismissible={dismissible}
    repositionInputs={false}
    autoFocus
  >
    <Drawer.Portal>
      <Drawer.Overlay className="fixed inset-0 z-50 bg-cave-950/70 backdrop-blur-sm" />

      <Drawer.Content
        onOpenAutoFocus={() => { returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          // Une autre fiche peut venir de s'ouvrir : ne pas lui voler le focus.
          const nextDialog = document.querySelector('[role="dialog"][data-state="open"]');
          if (returnFocus.current?.isConnected && (!nextDialog || nextDialog.contains(returnFocus.current))) {
            returnFocus.current.focus({ preventScroll: true });
          }
        }}
        onEscapeKeyDown={(event) => {
          // Consume Escape before removing this dialog. The recipe underneath
          // must not receive the same key after the drawer has unmounted.
          event.preventDefault();
          if (dismissible) onClose();
        }}
        style={{
          bottom: keyboardInset || undefined,
          maxHeight: keyboardInset ? `calc(94dvh - ${keyboardInset}px)` : undefined
        }}
        className={`fixed inset-x-0 bottom-0 z-50 flex flex-col
                   max-h-[94dvh] rounded-t-sheet
                   bg-cave-900 border-t border-cave-700 shadow-sheet
                   focus:outline-none ${className}`}
      >
        {/* Poignée : indique qu'on peut glisser, et sert de zone de préhension. */}
        <div
          className="shrink-0 flex justify-center cursor-grab active:cursor-grabbing pt-1 pb-0.5"
        >
          <div className="w-8 h-1 rounded-full bg-cave-700" aria-hidden="true" />
        </div>

        <header
          className="shrink-0 flex items-center gap-2 border-b border-cave-800 min-h-9 px-2 py-1"
        >
          <div className="min-w-0 flex-1">
            <Drawer.Title
              className="text-sm font-semibold text-cave-50 leading-tight break-words"
            >
              {title}
            </Drawer.Title>
            {/* Le sous-titre est du contexte */}
            <Drawer.Description className={subtitle && !tight ? 'text-xs text-cave-400 leading-tight break-words' : 'sr-only'}>
              {subtitle || title}
            </Drawer.Description>
          </div>

          <button
            onClick={onClose}
            aria-label="Fermer"
            className="min-w-touch-sm min-h-touch-sm rounded-control text-cave-400
                       hover:text-cave-50 hover:bg-cave-850 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/*
          `scroll-pb-20` réserve la place du pied.
        */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain scroll-pb-20 p-2 space-y-2"
        >
          {children}
        </div>

        {footer && (
          <div
            className="shrink-0 border-t border-cave-800 bg-cave-900 px-2 py-0.5"
            style={{ paddingBottom: keyboardInset ? '.125rem' : 'calc(.125rem + env(safe-area-inset-bottom, 0px))' }}
          >
            {footer}
          </div>
        )}
      </Drawer.Content>
    </Drawer.Portal>
  </Drawer.Root>
  );
};

/**
 * Feuille de confirmation pour une action destructrice.
 *
 * Dit toujours CE QUI va être supprimé, nommément — « Supprimer ? » sans sujet
 * oblige à se souvenir de ce qu'on vient de toucher.
 */
export const ConfirmSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  what: string;
  consequence?: string;
  confirmLabel?: string;
  className?: string;
}> = ({ open, onClose, onConfirm, title, what, consequence, confirmLabel = 'Supprimer', className }) => (
  <Sheet
    open={open}
    onClose={onClose}
    title={title}
    className={className}
    footer={
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 min-h-touch rounded-control bg-cave-850 border border-cave-700
                     text-cave-50 text-base transition-colors hover:border-cave-600"
        >
          Annuler
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="flex-1 min-h-touch rounded-control bg-alert text-cave-50
                     font-semibold text-base transition-colors hover:brightness-110"
        >
          {confirmLabel}
        </button>
      </div>
    }
  >
    <div className="space-y-3">
      <p className="text-base text-cave-50">{what}</p>
      {consequence && <p className="text-sm text-cave-400 leading-relaxed">{consequence}</p>}
    </div>
  </Sheet>
);
