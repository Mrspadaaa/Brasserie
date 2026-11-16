import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { revealRecipeErrors } from '../RecipeDisclosure';
import './recette.css';

/**
 * Une section de la fiche de recette (maquette r1) : rangée de 40 px, titre, résumé dessiné, chevron.
 * Repliée par défaut ; le contenu reste dans le DOM (détails natifs) sauf `deferContent`, qui ne monte
 * un rapport lourd qu'à la première ouverture. Un champ invalide ouvre sa section (revealRecipeErrors).
 * `entete` remplace titre + résumé par une ligne de premier plan (la Levure de la maquette).
 * `resumeOuvert` remplace le résumé quand la section est ouverte (« ≈ 70′ de maintien » de l'état après le geste).
 */
export function FicheSection({ title, resume, resumeOuvert, entete, icone, children, apresOuverture, deferContent = false, defaultOpen = false, dataElement }: {
  title: string;
  /** Un rapport lourd rangé dans le corps : monté à la première ouverture seulement (le reste du corps est dans le DOM dès le repos). */
  apresOuverture?: React.ReactNode;
  icone?: React.ReactNode;
  resume?: React.ReactNode;
  resumeOuvert?: React.ReactNode;
  entete?: React.ReactNode;
  children?: React.ReactNode;
  deferContent?: boolean;
  defaultOpen?: boolean;
  dataElement?: string;
}) {
  const id = useId();
  const ref = useRef<HTMLDetailsElement>(null);
  const [visite, setVisite] = useState(defaultOpen);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const voir = () => { if (node.querySelector('[aria-invalid="true"],[role="alert"]')) revealRecipeErrors(node); };
    voir();
    const observateur = new MutationObserver(voir);
    observateur.observe(node, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-invalid', 'role'] });
    return () => observateur.disconnect();
  }, []);
  return (
    <details ref={ref} open={defaultOpen || undefined} data-recipe-section={title} data-element={dataElement} className="rc-sec group/rc"
      onToggle={(e) => { if ((deferContent || apresOuverture) && e.currentTarget.open) setVisite(true); }}
      onInvalidCapture={(e) => { e.currentTarget.open = true; }}>
      {entete ? (
        <summary aria-controls={id} className="rc-ly">
          {icone}
          <span className="rc-ly-t">{entete}</span>
          <ChevronDown className="rc-chev" aria-hidden="true" />
        </summary>
      ) : (
        <summary aria-controls={id} className="rc-sh">
          <h2>{title}</h2>
          <span className={`rc-s${resumeOuvert ? ' rc-a-ro' : ''}`}>
            <span className="rc-rf">{resume}</span>
            {resumeOuvert && <span className="rc-ro">{resumeOuvert}</span>}
          </span>
          <ChevronDown className="rc-chev" aria-hidden="true" />
        </summary>
      )}
      <div id={id} className="rc-body">{(!deferContent || visite) && children}{visite && apresOuverture}</div>
    </details>
  );
}
