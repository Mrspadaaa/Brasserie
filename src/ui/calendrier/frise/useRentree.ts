import { useLayoutEffect, type RefObject } from 'react';
import { rentreeElement, vueEcran, type BoiteEcran } from './prisesBord';

/**
 * POI-1 (24.11, « maintenant tout est au bord, l'actionnable est du coup plus difficile sur mobile. Rentre la zone plus accessible »).
 * Les boutons et pastilles de `selecteur` (dans `racine`) qui tombent contre le bord de l'écran, où Android place le geste retour, reçoivent
 * `--rentre-g` / `--rentre-d` (px) : leur pseudo-élément de toucher s'étend d'autant vers l'intérieur (frise.css, entete.css), jamais sur une autre
 * commande de la ligne, jamais le dessin. Lu après chaque rendu (toutes les lectures, puis toutes les écritures : une seule mise en page) ;
 * sans mise en page (jsdom : boîtes vides) rien n'est posé.
 */
const COMMANDES = 'button, [role="button"], a[href]';

export function useRentree(racine: RefObject<HTMLElement | null>, selecteur: string): void {
  useLayoutEffect(() => {
    const el = racine.current;
    if (!el || typeof window === 'undefined') return;
    const cibles = Array.from(el.querySelectorAll<HTMLElement>(selecteur));
    if (!cibles.length) return;
    const vue = vueEcran();
    const commandes = Array.from(el.querySelectorAll<HTMLElement>(COMMANDES)).map(c => [c, c.getBoundingClientRect()] as const).filter(([, r]) => r.width > 0 && r.height > 0);
    const mesures = cibles.map(c => {
      const r = c.getBoundingClientRect();
      if (!(r.width > 0)) return null;
      const voisins: BoiteEcran[] = commandes.filter(([v]) => v !== c && !v.contains(c) && !c.contains(v)).map(([, b]) => b);
      return rentreeElement(r, vue, voisins);
    });
    cibles.forEach((c, i) => {
      const m = mesures[i];
      for (const [nom, v] of [['--rentre-g', m?.g ?? 0], ['--rentre-d', m?.d ?? 0]] as const) {
        const voulu = v > 0 ? `${v}px` : '';
        if (c.style.getPropertyValue(nom) !== voulu) { if (voulu) c.style.setProperty(nom, voulu); else c.style.removeProperty(nom); }
      }
    });
  });
}
