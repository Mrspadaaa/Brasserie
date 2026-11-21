/**
 * Renommer sur place (PI-5, D396 : « créé d'abord, nommé après ») : le mécanisme du crayon des carnets (`CarnetsVue`, `RenommerCarnet`),
 * porté en composant partagé. Motif standard (click-to-edit) :
 *   au repos, le titre est un bouton qui garde l'habit du titre (police, taille, couleur héritées : le visuel choisi ne change pas) ;
 *   le toucher le remplace par un champ focalisé, texte sélectionné, qui passe à la ligne comme le titre (hauteur suivant le texte,
 *   rien de coupé) ; Entrée enregistre et ferme le clavier, Échap annule,
 *   la sortie du champ enregistre ; un nom vide ou inchangé rend l'ancien nom ; le focus revient au titre.
 * Le titre reste dans son élément (`as`, `h1` par défaut) ; l'appelant enregistre (`onRenommer`) et dit la suite avec Annuler (R1).
 */
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Textarea } from '../Input';

export interface RenommerSurPlaceProps {
  valeur: string;
  onRenommer: (nom: string) => void;
  /** L'élément du titre (h1 par défaut) ; sa classe et son style restent ceux de l'écran. */
  as?: 'h1' | 'h2' | 'h3' | 'div' | 'span';
  className?: string;
  /** Ce qu'on renomme, pour le lecteur d'écran : « Renommer <quoi> ». */
  quoi?: string;
}

/** Le nom à enregistrer, ou `null` si rien ne change (vide, espaces, identique). */
export function nomRenomme(saisi: string, avant: string): string | null {
  const n = saisi.replace(/\s+/g, ' ').trim();
  return n && n !== avant.trim() ? n : null;
}

const HERITE: React.CSSProperties = {
  font: 'inherit', color: 'inherit', letterSpacing: 'inherit', lineHeight: 'inherit', textAlign: 'inherit',
  background: 'transparent', border: 0, padding: 0, margin: 0, borderRadius: 0,
};

export function RenommerSurPlace({ valeur, onRenommer, as: Balise = 'h1', className, quoi = 'le titre' }: RenommerSurPlaceProps) {
  const [edition, setEdition] = useState<string | null>(null);
  const champ = useRef<HTMLTextAreaElement | null>(null);
  const titre = useRef<HTMLButtonElement | null>(null);
  const fini = useRef(false);
  const rendreFocus = useRef(false);
  // La largeur du titre au repos : le champ la reprend, le texte passe à la ligne au même endroit et rien ne bouge dessous (VUE-SAUTE).
  const largeur = useRef(0);

  useEffect(() => {
    if (edition !== null && champ.current) { const c = champ.current; c.focus(); c.select(); }
    if (edition === null && rendreFocus.current) { rendreFocus.current = false; titre.current?.focus({ preventScroll: true, focusVisible: false } as FocusOptions); }
  }, [edition === null]);

  // Le champ prend la hauteur de son texte : le titre long reste entier, à sa place.
  useLayoutEffect(() => { const c = champ.current; if (c) { c.style.height = 'auto'; c.style.height = `${c.scrollHeight}px`; } }, [edition]);

  const ouvrir = () => { fini.current = false; largeur.current = titre.current?.getBoundingClientRect().width ?? 0; setEdition(valeur); };
  const fermer = (garder: boolean) => {
    if (fini.current || edition === null) return;
    fini.current = true;
    const n = garder ? nomRenomme(edition, valeur) : null;
    rendreFocus.current = true;
    setEdition(null);
    if (n) onRenommer(n);
  };

  return (
    <Balise className={className}>
      {edition === null ? (
        <button ref={titre} type="button" style={{ ...HERITE, display: 'inline', cursor: 'text', overflowWrap: 'inherit', wordBreak: 'inherit', whiteSpace: 'normal' }}
          aria-label={`${valeur} · renommer ${quoi}`} onClick={ouvrir}>{valeur}</button>
      ) : (
        <Textarea ref={champ} rows={1} value={edition} aria-label={`Renommer ${quoi}`} enterKeyHint="done"
          style={{ ...HERITE, width: largeur.current ? `${Math.ceil(largeur.current) + 4}px` : '100%', minWidth: '12ch', maxWidth: '100%', display: 'block', resize: 'none', overflow: 'hidden', outline: 'none', boxShadow: 'inset 0 -2px 0 currentColor' }}
          onChange={e => setEdition(e.target.value.replace(/[\r\n]+/g, ' '))}
          onKeyDown={e => {
            if (e.nativeEvent.isComposing || e.keyCode === 229) return;
            if (e.key === 'Enter') { e.preventDefault(); fermer(true); }
            else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fermer(false); }
          }}
          onBlur={() => fermer(true)} />
      )}
    </Balise>
  );
}
