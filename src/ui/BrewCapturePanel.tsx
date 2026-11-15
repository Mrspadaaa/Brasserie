import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useKeyboardInset } from './useViewport';

/**
 * La feuille de saisie (Mesurer, Note) de la vue de brassin, comme z1 la dessine : une rangée de titre « Mesurer · Empâtage » et sa croix,
 * sans pied. Au téléphone elle se pose au bas de l'écran sur un voile ; à l'ordinateur elle flotte à droite, au-dessus du pied,
 * sans voile, et n'existe à l'écran que ouverte. Les mêmes champs restent montés : refermer la saisie ne perd pas le brouillon.
 */
export function BrewCapturePanel({
  title,
  context,
  open,
  onClose,
  children,
  icon,
  className = ''
}: {
  title: string;
  context: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 900px)').matches);
  const dialog = useRef<HTMLDialogElement>(null);
  const modal = useRef(false);
  const keyboardInset = useKeyboardInset();
  useEffect(() => {
    const query = window.matchMedia('(max-width: 900px)');
    const change = () => setMobile(query.matches);
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);
  useLayoutEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (mobile) {
      // Un panneau ouvert en ligne sur grand écran devient une saisie modale.
      if (node.open && !modal.current) node.close();
      if (open && !node.open) {
        node.showModal();
        modal.current = true;
        node
          .querySelector<HTMLElement>('textarea, input[inputmode="decimal"]')
          ?.focus({ preventScroll: true });
      }
      if (!open && node.open) {
        node.close();
        modal.current = false;
      }
    } else {
      if (modal.current) {
        node.close();
        modal.current = false;
      }
      node.setAttribute('open', '');
    }
  }, [mobile, open]);
  return (
    <>
    {/* K4 n° 23 : à l'ordinateur, la saisie flottante a son voile (comme le téléphone) ; un toucher sur le voile la ferme. */}
    {!mobile && open && <div className="brew-capture-voile" aria-hidden="true" onClick={onClose} />}
    <dialog
      ref={dialog}
      className={`brew-capture ${mobile ? 'is-mobile' : 'is-inline'} ${className}`}
      data-open={open ? '' : undefined}
      role={mobile ? 'dialog' : 'presentation'}
      aria-label={mobile ? title : undefined}
      style={
        mobile && keyboardInset
          ? { bottom: keyboardInset, maxHeight: `calc(100dvh - ${keyboardInset + 12}px)` }
          : undefined
      }
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (mobile && event.key === 'Escape') event.stopPropagation();
        if (!mobile && open && event.key === 'Escape') onClose();
      }}
    >
      <header className="brew-capture-header">
        <h2>
          {icon}
          {title} <span>· {context}</span>
        </h2>
        <button type="button" aria-label="Fermer la saisie" onClick={onClose}>
          <X size={16} />
        </button>
      </header>
      <div className="brew-capture-content">{children}</div>
    </dialog>
    </>
  );
}
