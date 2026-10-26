// D169 (s2-sources-une-fois, 26.10) : « cette vue doit se fermer quand on ouvre ou change de vue ». Une seule carte dépliée à la
// fois dans l'étape Houblons (la bande ouverte case à case d'un ajout du rail, ou d'une ligne d'ajout rapide, avec ou sans la
// ligne des icônes du « ? »). L'état est ici, au-dessus de toutes les cartes, et non dans chaque carte :
//  - en déplier une autre ferme la première ;
//  - changer de vue la ferme : un autre écran de l'étape (la fiche), ou un outil ouvert par-dessus (la pile de l'app pose
//    `aria-hidden` ou `inert` sur l'étape qu'elle recouvre) ;
//  - la vue retrouvée la rend fermée.
// Échap referme la ligne des icônes (comme avant). Hors de l'étape (un test d'une carte seule), la carte garde son propre état.
import { createContext, useContext, useEffect, useMemo, useState, type RefObject } from 'react';

/** Une carte dépliée : son identifiant (le id de l'ajout, ou `rapide:<clé>` pour une ligne d'ajout rapide), la bande ouverte, et la ligne des icônes du « ? ». */
export interface EtatCarte { id: string; bande: boolean; legende: boolean }
export interface CartesOuvertes {
  etat: EtatCarte | null;
  poser: (e: EtatCarte | null) => void;
}

const Ctx = createContext<CartesOuvertes | null>(null);
export const FournisseurCartes = Ctx.Provider;

/** L'état de l'étape : à poser une fois, dans EtapeHoublonsContenu. `vue` change quand l'écran de l'étape change ; `racine` est son
 * élément (pour savoir si un outil la recouvre). */
export function useCartesOuvertes(vue: string, racine: RefObject<HTMLElement | null>): CartesOuvertes {
  const [etat, poser] = useState<EtatCarte | null>(null);
  // Une autre vue de l'étape (la fiche s'ouvre par-dessus) : tout se referme.
  useEffect(() => { poser(null); }, [vue]);
  // Un outil plein écran par-dessus (Substituer, Suggérer, Comparer…) : l'app rend l'étape inerte ; elle reste montée dessous.
  useEffect(() => {
    if (!etat) return;
    const couverte = () => !!racine.current?.closest('[aria-hidden="true"], [inert]');
    if (couverte()) { poser(null); return; }
    const o = new MutationObserver(() => { if (couverte()) poser(null); });
    o.observe(document.body, { attributes: true, attributeFilter: ['aria-hidden', 'inert'], subtree: true });
    return () => o.disconnect();
  }, [etat, racine]);
  // Échap referme la ligne des icônes du « ? » ; la bande reste si elle a été touchée.
  const legende = !!etat?.legende;
  useEffect(() => {
    if (!legende) return;
    const k = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      poser((c) => (c && c.bande ? { ...c, legende: false } : null));
    };
    document.addEventListener('keydown', k, true);
    return () => document.removeEventListener('keydown', k, true);
  }, [legende]);
  return useMemo(() => ({ etat, poser }), [etat]);
}

/** Les cartes de l'étape ; sans étape autour (un test d'une carte seule), un état local. */
export function useEtatCartes(): CartesOuvertes {
  const ctx = useContext(Ctx);
  const [local, poser] = useState<EtatCarte | null>(null);
  return ctx ?? { etat: local, poser };
}
