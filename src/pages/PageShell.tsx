import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useCoarsePointer, useDensity, useKeyboardInset } from '../ui/useViewport';
import './page-shell.css';

const PAGE_OVERLAYS = [
  'dialog[open]', '[role="dialog"]', '[role="alertdialog"]',
  '[role="menu"]', '[role="listbox"]', '[data-page-overlay]',
  '[data-vaul-overlay]', '[data-radix-popper-content-wrapper]',
  '[role="alert"]', '[role="status"]', '[aria-live]:not([aria-live="off"])'
].join(',');
// A drawer's focus scope can still run during its closing transition. Defer to
// the mounted, visible dialog until its trap cleans up, even with data-state=closed.
const PAGE_DIALOGS = 'dialog[open], [role="dialog"], [role="alertdialog"]';
const pageScopes: HTMLElement[] = [];
const pageInert = new Map<HTMLElement, string | null>();
let isolationObserver: MutationObserver | undefined;

/** Layout visibility, independent of inert that this scope temporarily owns. */
function pageElementShown(element: HTMLElement) {
  for (let node: HTMLElement | null = element; node; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (node.hidden || node.getAttribute('aria-hidden') === 'true' || style.display === 'none' || style.visibility === 'hidden') return false;
    if (node instanceof HTMLDetailsElement && !node.open && !node.querySelector('summary')?.contains(element)) return false;
  }
  return true;
}

const foregroundPage = () => pageScopes.at(-1);
function pageOverlayShown(element: HTMLElement) {
  if (!pageElementShown(element)) return false;
  for (let node: HTMLElement | null = element; node; node = node.parentElement) {
    // Ignore only inert introduced here; a pre-existing inert surface stays disabled.
    if (node.hasAttribute('inert') && !(pageInert.has(node) && pageInert.get(node) === null)) return false;
  }
  return true;
}
const pageOverlays = () => [...document.querySelectorAll<HTMLElement>(PAGE_OVERLAYS)].filter(pageOverlayShown);
const hasPageDialog = () => [...document.querySelectorAll<HTMLElement>(PAGE_DIALOGS)].some(pageOverlayShown);

/** Keep the active page, portals and announcements; isolate only their sibling branches. */
function refreshPageIsolation() {
  const page = foregroundPage();
  const blocked = new Set<HTMLElement>();
  if (page) {
    const allowed = [page, ...pageOverlays()];
    const visit = (element: HTMLElement) => {
      if (allowed.includes(element)) return;
      if (allowed.some(surface => element.contains(surface))) {
        [...element.children].forEach(child => { if (child instanceof HTMLElement) visit(child); });
      } else if (!element.matches('script, style, link, meta')) blocked.add(element);
    };
    [...document.body.children].forEach(child => { if (child instanceof HTMLElement) visit(child); });
  }
  for (const [element, previous] of pageInert) {
    if (blocked.has(element)) continue;
    if (previous === null) element.removeAttribute('inert');
    else element.setAttribute('inert', previous);
    pageInert.delete(element);
  }
  for (const element of blocked) {
    if (pageInert.has(element)) continue;
    pageInert.set(element, element.getAttribute('inert'));
    element.setAttribute('inert', '');
  }
}

function pageFocusTargets(page: HTMLElement) {
  const surfaces = [page, ...pageOverlays()];
  return [...document.querySelectorAll<HTMLElement>(
    'button, a[href], input, select, textarea, summary, [tabindex], [contenteditable="true"], [contenteditable="plaintext-only"]'
  )].filter(element => surfaces.some(surface => surface.contains(element)) &&
    element.tabIndex >= 0 && !element.matches(':disabled, input[type="hidden"]') &&
    !element.closest('[inert]') && pageElementShown(element));
}

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
  scrollKey?: string;
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
  scrollKey,
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
  const pageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLElement>(null);
  const [opener] = useState(() => document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useLayoutEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    let lastFocus: HTMLElement | null = null;
    const focusPage = () => {
      const target = lastFocus?.isConnected && page.contains(lastFocus) && pageElementShown(lastFocus) &&
        !lastFocus.matches(':disabled') ? lastFocus : scrollRef.current;
      target?.focus({ preventScroll: true });
    };
    pageScopes.push(page);
    refreshPageIsolation();
    if (!isolationObserver) {
      isolationObserver = new MutationObserver(refreshPageIsolation);
      isolationObserver.observe(document.body, {
        childList: true, subtree: true, attributes: true,
        attributeFilter: ['open', 'hidden', 'data-state', 'role', 'aria-live']
      });
    }
    if (!page.contains(document.activeElement) && !hasPageDialog()) focusPage();
    const onFocus = (event: FocusEvent) => {
      if (foregroundPage() !== page) return;
      const target = event.target as HTMLElement;
      if (page.contains(target)) { lastFocus = target; return; }
      // Portaled dialogs own their focus; live alerts may carry a retry action.
      if (hasPageDialog() || pageOverlays().some(overlay => overlay.contains(target))) return;
      focusPage();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || foregroundPage() !== page || hasPageDialog()) return;
      const target = event.target as HTMLElement;
      if (event.key === 'Escape') {
        if (!page.contains(target) && pageOverlays().some(overlay => overlay.contains(target))) return;
        event.preventDefault(); closeRef.current(); return;
      }
      if (event.key !== 'Tab') return;
      const targets = pageFocusTargets(page);
      const first = targets[0], last = targets.at(-1);
      if (!first || !last) { event.preventDefault(); scrollRef.current?.focus(); return; }
      const active = document.activeElement;
      if (!targets.includes(active as HTMLElement) || (event.shiftKey ? active === first : active === last)) {
        event.preventDefault(); (event.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener('focusin', onFocus);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('keydown', onKey);
      pageScopes.splice(pageScopes.indexOf(page), 1);
      if (!pageScopes.length) { isolationObserver?.disconnect(); isolationObserver = undefined; }
      refreshPageIsolation();
      const remaining = foregroundPage();
      if (opener?.isConnected && !opener.closest('[inert]') && pageElementShown(opener) &&
        (!remaining || remaining.contains(opener)) && !hasPageDialog()) opener.focus({ preventScroll: true });
    };
  }, [opener]);

  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    // A field can disappear when Enter changes steps. Keep rail/button focus when it survives.
    if (foregroundPage() === pageRef.current && !pageRef.current?.contains(document.activeElement) && !hasPageDialog()) {
      scrollRef.current?.focus({ preventScroll: true });
    }
  }, [scrollKey]);

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

  return (
    <div
      ref={pageRef}
      data-page-shell
      style={{
        bottom: keyboardInset || undefined
      }}
      className={`page-shell fixed inset-0 z-50 flex flex-col bg-cave-950 ${className}`}
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
                data-page-titlebar
                className={`${frame} mx-auto flex items-center gap-1.5 ${
                  tight ? 'px-1.5 py-0.5' : compact ? 'px-2 py-0.5' : 'px-2 py-0.5'
                }`}
              >
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fermer"
                  className="w-7 h-7 rounded-control flex items-center justify-center text-cave-200 hover:text-cave-50 active:bg-cave-850 shrink-0 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="min-w-0 flex-1">
                  <h1 className="text-sm font-semibold text-cave-50 break-words leading-tight">
                    {title}
                  </h1>
                  {subtitle && !tight && (
                    <p className="text-xs text-cave-400 break-words leading-tight mt-0.5">
                      {subtitle}
                    </p>
                  )}
                </div>

                {actions && <div className="page-title-actions shrink-0">{actions}</div>}
              </div>

              {progress && (
                <div
                  data-page-progress
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
              data-page-titlebar
              className={`${frame} mx-auto flex items-center gap-1.5 ${
                tight ? 'px-1.5 py-0.5' : compact ? 'px-2 py-0.5' : 'px-2 py-0.5'
              }`}
            >
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="w-7 h-7 rounded-control flex items-center justify-center text-cave-200 hover:text-cave-50 active:bg-cave-850 shrink-0 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="min-w-0 flex-1">
                <h1 className="text-sm font-semibold text-cave-50 break-words leading-tight">
                  {title}
                </h1>
                {/* Le sous-titre — style, volume, date — est concis et discret */}
                {subtitle && !tight && (
                  <p className="text-xs text-cave-400 break-words leading-tight mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>

              {actions && <div className="page-title-actions shrink-0">{actions}</div>}
            </div>

            {progress && (
              <div
                data-page-progress
                className={`${frame} mx-auto ${tight ? 'px-1.5 pb-1' : 'px-2.5 sm:px-3 pb-1.5'}`}
              >
                {progress}
              </div>
            )}
          </>
        )}
      </header>

      {/* `scroll-pb-16` réserve la place du pied */}
      <main ref={scrollRef} tabIndex={-1} aria-label={subtitle || title}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain focus-visible:outline focus-visible:outline-2 focus-visible:outline-ebc-straw focus-visible:-outline-offset-2">
        <div
          className={`${frame} mx-auto pb-3 ${
            tight
              ? 'px-2.5 py-1.5 space-y-1.5'
              : compact
                ? 'px-2 py-2 space-y-2'
                : 'px-2 py-2 space-y-2'
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
              tight ? 'px-2.5 py-0.5' : compact ? 'px-2 py-0.5' : 'px-2 py-0.5'
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
      className={`panel ${tight ? 'p-2 space-y-1.5' : compact ? 'p-2 space-y-2' : 'p-2 space-y-2'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-semibold text-cave-50 leading-tight">{title}</h2>
          {/* L'explication d'une section se lit une fois. */}
          {hint && !tight && (
            <p className="text-sm text-cave-400 leading-snug mt-0.5">{hint}</p>
          )}
        </div>
        {actions && <div className="shrink-0 flex items-center gap-1">{actions}</div>}
      </div>
      {children}
    </section>
  );
};
