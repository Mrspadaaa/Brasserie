import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { BrewTag } from './BrewTag';

/**
 * Repli d'une aide du jour de brassage.
 *
 * À la cuve, l'écran appartient à la consigne, à l'horloge et aux doses. Les
 * guides qui expliquent un procédé viennent après, fermés, avec un résumé qui
 * dit de quoi ils parlent. Un avertissement, lui, ne se replie pas : dès que le
 * contenu porte un `data-notice`, la section s'ouvre d'elle-même et son résumé
 * le signale. Une fermeture volontaire est ensuite respectée.
 */
export function BrewAide({
  title,
  summary,
  children,
  icon,
  className = '',
  quiet = false
}: {
  title: string;
  summary?: React.ReactNode;
  children: React.ReactNode;
  /** Le picto de la ligne repliée (« Aides et repères » de z1). */
  icon?: React.ReactNode;
  className?: string;
  /** Le repli reste fermé : l'avertissement se signale (« À vérifier ») sans l'ouvrir (« Aides et repères » de z1). */
  quiet?: boolean;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const wasNotified = useRef(false);
  const [notice, setNotice] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const read = () => {
      const found = node.querySelector('[data-notice]') != null;
      setNotice(found);
      // N'ouvrir qu'au passage à l'avertissement : le brasseur garde le droit
      // de refermer la section après l'avoir lue.
      if (found && !wasNotified.current && !quiet) { node.open = true; setOpen(true); }
      wasNotified.current = found;
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(node, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-notice']
    });
    return () => observer.disconnect();
  }, []);
  return (
    <details ref={ref} className={`brew-aide ${className}`} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
      <summary>
        {icon}
        <span className="brew-aide-title">{title}</span>
        {summary != null && <span className="brew-aide-summary">{summary}</span>}
        {/* Une seule alerte à l'écran (VB-4) : ouvert, le repli montre sa cause (le texte rouge) ; l'étiquette ne sert que replié. */}
        {notice && !open && <BrewTag tone="due">À vérifier</BrewTag>}
        <ChevronDown size={16} aria-hidden="true" />
      </summary>
      <div className="brew-aide-body">{children}</div>
    </details>
  );
}
