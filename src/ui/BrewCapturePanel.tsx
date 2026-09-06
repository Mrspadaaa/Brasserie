import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useKeyboardInset } from './useViewport';

/** Les mêmes champs restent montés : refermer la saisie ne perd pas le brouillon. */
export function BrewCapturePanel({
  title,
  context,
  open,
  onClose,
  children,
  className = ''
}: {
  title: string;
  context: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
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
    <dialog
      ref={dialog}
      className={`brew-capture ${mobile ? 'is-mobile' : 'is-inline'} ${className}`}
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
      }}
    >
      {mobile && (
        <header className="brew-capture-header">
          <div>
            <h2>{title}</h2>
            <p>{context}</p>
          </div>
          <button type="button" aria-label="Fermer la saisie" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
      )}
      <div className="brew-capture-content">{children}</div>
      {mobile && (
        <footer>
          <button type="button" className="brew-capture-return" onClick={onClose}>
            Retour à l’étape
          </button>
        </footer>
      )}
    </dialog>
  );
}
