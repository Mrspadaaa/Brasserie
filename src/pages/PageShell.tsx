import React, { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useCoarsePointer, useDensity, useKeyboardInset } from '../ui/useViewport';

/**
 * Cadre commun des pages plein écran.
 *
 * ⚠️ Pourquoi une page et non une modale : le brassage vivait dans trois
 * modales de 1244, 862 et 497 lignes. Une modale ne peut pas se partager, ne
 * survit pas à un rechargement, et — le point qui compte le jour du brassage —
 * **ne se ferme pas au geste retour du téléphone**. On l'ouvre avec les mains
 * propres, on la referme avec les mains dans la cuve.
 *
 * Chaque ouverture pousse une entrée d'historique : le retour du navigateur et
 * le geste de bord d'écran referment donc la page, sans dépendance de routage
 * supplémentaire.
 */

interface PageShellProps {
  title: string;
  /** Ligne secondaire : style, volume, date. */
  subtitle?: string;
  onClose: () => void;
  /** Actions de l'en-tête, alignées à droite. */
  actions?: React.ReactNode;
  /**
   * Filet d'avancement, collé SOUS le titre, dans l'en-tête.
   *
   * ⚠️ Le fil d'étapes de l'assistant occupait une rangée à lui seul dans le
   * contenu — hauteur de la piste, plus une gouttière au-dessus et une en
   * dessous. Sur un téléphone clavier ouvert, ces ~24 px valent une ligne de
   * formulaire. Ici il ne coûte que son épaisseur.
   */
  progress?: React.ReactNode;
  /** Barre collée en bas — validation, étape suivante. */
  footer?: React.ReactNode;
  /**
   * En-tête personnalisé sur mobile : remplace complètement le gros titre / sous-titre
   * pour ne garder que l'en-tête ultra-compact (ex: steps + import).
   */
  mobileHeader?: React.ReactNode;
  /** Largeur de travail pour les pages avec une colonne de contrôle. */
  wide?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const PageShell: React.FC<PageShellProps> = ({
  title,
  subtitle,
  onClose,
  actions,
  progress,
  footer,
  mobileHeader,
  wide = false,
  className = '',
  children
}) => {
  /*
   * ⚠️ En-tête et pied mangeaient ensemble près de 140 px. Clavier ouvert sur un
   * téléphone, il ne restait plus la place d'un seul champ entre les deux. Ils
   * se réduisent donc quand l'écran devient rare — le titre reste, le reste
   * s'efface.
   */
  const density = useDensity();
  const tight = density === 'tight';
  const compact = density !== 'comfortable';
  const coarse = useCoarsePointer();
  const keyboardInset = useKeyboardInset();
  const frame = wide ? 'max-w-6xl' : 'max-w-3xl';

  const [isFieldFocused, setIsFieldFocused] = useState(false);

  useEffect(() => {
    if (!coarse) return;
    const refreshFocus = () => {
      const field = document.activeElement as HTMLElement | null;
      const isTextField =
        field?.matches(
          'textarea, input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]):not([type="range"])'
        ) || field?.isContentEditable;
      // Une saisie modale possède son propre pied ; conserver son bouton d'origine
      // permet au navigateur de lui rendre le focus à la fermeture.
      setIsFieldFocused(!!isTextField && !field?.closest('dialog[open], [role="dialog"]'));
    };
    const onFocusIn = () => refreshFocus();
    const onFocusOut = () => {
      setTimeout(() => {
        refreshFocus();
      }, 60);
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, [coarse]);

  const isTypingOnMobile = coarse && isFieldFocused;

  // Échap ferme, comme partout ailleurs dans l'application.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      if ((e.target as HTMLElement)?.closest?.('[role="dialog"]') || document.querySelector('[role="dialog"][data-state="open"]')) return;
      e.preventDefault(); onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      style={{
        bottom: keyboardInset || undefined
      }}
      className={`fixed inset-0 z-50 flex flex-col bg-cave-950 ${className}`}
    >
      <header
        className={`shrink-0 border-b border-cave-800 bg-cave-950/95 backdrop-blur-sm ${
          // Clavier ouvert, la zone sûre du haut est déjà dégagée :
          // la réserver une seconde fois coûte une rangée pour rien.
          tight ? '' : 'pt-safe'
        }`}
      >
        {mobileHeader ? (
          <>
            <div className="sm:hidden">{mobileHeader}</div>
            <div className="hidden sm:block">
              <div
                className={`${frame} mx-auto flex items-center gap-1.5 ${
                  tight ? 'px-1.5 py-0.5' : compact ? 'px-2.5 py-1' : 'px-3 py-1.5'
                }`}
              >
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fermer"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-control flex items-center justify-center text-cave-300 hover:text-cave-50 active:bg-cave-850 shrink-0 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                <div className="min-w-0 flex-1">
                  <h1 className="text-sm sm:text-base font-semibold text-cave-50 truncate leading-tight">
                    {title}
                  </h1>
                  {subtitle && !tight && (
                    <p className="text-2xs sm:text-sm text-cave-400 truncate leading-tight mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>

                {actions && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
              </div>

              {progress && (
                <div
                  className={`${frame} mx-auto ${tight ? 'px-1.5 pb-1' : 'px-2.5 sm:px-3 pb-1.5'}`}
                >
                  {progress}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div
              className={`${frame} mx-auto flex items-center gap-1.5 ${
                tight ? 'px-1.5 py-0.5' : compact ? 'px-2.5 py-1' : 'px-3 py-1.5'
              }`}
            >
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-control flex items-center justify-center text-cave-300 hover:text-cave-50 active:bg-cave-850 shrink-0 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-base font-semibold text-cave-50 truncate leading-tight">
                  {title}
                </h1>
                {/* Le sous-titre — style, volume, date — est concis et discret */}
                {subtitle && !tight && (
                  <p className="text-2xs sm:text-sm text-cave-400 truncate leading-tight mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>

              {actions && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
            </div>

            {progress && (
              <div
                className={`${frame} mx-auto ${tight ? 'px-1.5 pb-1' : 'px-2.5 sm:px-3 pb-1.5'}`}
              >
                {progress}
              </div>
            )}
          </>
        )}
      </header>

      {/* `scroll-pb-16` réserve la place du pied */}
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div
          className={`${frame} mx-auto pb-20 sm:pb-24 ${
            tight
              ? 'px-2.5 py-1.5 space-y-1.5'
              : compact
                ? 'px-3 py-2 space-y-2.5'
                : 'px-4 py-4 space-y-4'
          }`}
        >
          {children}
        </div>
      </main>

      {footer && !isTypingOnMobile && (
        <footer
          className={`shrink-0 border-t border-cave-800 bg-cave-950/95 backdrop-blur-sm ${
            // Clavier ouvert, le clavier couvre déjà la zone sûre du bas.
            tight ? '' : 'pb-safe'
          }`}
        >
          <div
            className={`${frame} mx-auto ${
              tight ? 'px-2.5 py-1' : compact ? 'px-3 py-1.5' : 'px-4 py-2.5'
            }`}
          >
            {footer}
          </div>
        </footer>
      )}
    </div>
  );
};

/** Bloc de contenu titré, unité de composition de toutes les pages. */
export const Section: React.FC<{
  title: string;
  /** Ce que la section apporte, quand ce n'est pas évident. */
  hint?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, hint, actions, children }) => {
  const density = useDensity();
  const tight = density === 'tight';
  const compact = density !== 'comfortable';

  return (
    <section
      className={`panel ${tight ? 'p-2 space-y-1.5' : compact ? 'p-3 space-y-2' : 'p-4 space-y-3'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-semibold text-cave-50 leading-tight">{title}</h2>
          {/* L'explication d'une section se lit une fois. */}
          {hint && !tight && (
            <p className="text-2xs sm:text-sm text-cave-400 leading-snug mt-0.5">{hint}</p>
          )}
        </div>
        {actions && <div className="shrink-0 flex items-center gap-1">{actions}</div>}
      </div>
      {children}
    </section>
  );
};
