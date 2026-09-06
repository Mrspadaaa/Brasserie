import { useEffect, useState } from 'react';

/**
 * Ce que le navigateur sait de la fenêtre réellement visible.
 *
 * ⚠️ Le problème que ça règle : sur téléphone, ouvrir le clavier ne change
 * NI `window.innerHeight`, NI l'unité `vh`, NI même `dvh` sur iOS. Une feuille
 * en `max-h-[94dvh]` garde donc sa hauteur pleine, le clavier se pose par
 * dessus, et le pied de feuille — c'est-à-dire le bouton « Enregistrer » — se
 * retrouve dessous, hors d'atteinte.
 *
 * La seule source qui bouge avec le clavier est `visualViewport`. Tout ce
 * fichier existe pour ça.
 */

/**
 * Vrai quand l'appareil se manipule au doigt.
 *
 * Sert à décider si l'on ouvre le clavier du système ou non : ce qui est un
 * confort à la souris (un champ toujours saisissable) devient une gêne au
 * doigt (300 px d'écran mangés pour taper « 25 »).
 */
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(pointer: coarse)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(pointer: coarse)');
    const onChange = () => setCoarse(mq.matches);
    // `addListener` reste nécessaire pour les Safari antérieurs à 14.
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  return coarse;
}

/**
 * Hauteur, en pixels, que le clavier virtuel mange en bas de l'écran.
 *
 * Vaut 0 quand aucun clavier n'est ouvert, et sur ordinateur.
 *
 * ⚠️ La mesure inclut `offsetTop` : quand iOS fait défiler la page pour
 * amener le champ au-dessus du clavier, la fenêtre visuelle se décale vers le
 * bas. Sans ce terme, on sous-estime le clavier d'exactement ce décalage et le
 * pied de feuille reste à moitié couvert.
 */
/**
 * Hauteur de clavier SIMULÉE, pour juger la mise en page sans téléphone.
 *
 * `?keyboard=320` sur n'importe quel écran fait croire à l'application qu'un
 * clavier de 320 px est ouvert. `import.meta.env.DEV` est remplacé par `false`
 * à la compilation : ce bloc disparaît du paquet de production, comme les
 * bancs d'essai `?preview=`.
 */
function simulatedInset(): number {
  if (!import.meta.env.DEV || typeof window === 'undefined') return 0;
  const asked = new URLSearchParams(window.location.search).get('keyboard');
  const n = asked ? parseInt(asked, 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function useKeyboardInset(): number {
  const [inset, setInset] = useState(simulatedInset);

  useEffect(() => {
    const forced = simulatedInset();
    if (forced) return;

    const vv = typeof window !== 'undefined' ? window.visualViewport : undefined;
    if (!vv) return;

    const measure = () => {
      const hidden = window.innerHeight - vv.height - vv.offsetTop;
      // Sous ce seuil, ce n'est pas un clavier mais la barre d'adresse qui se
      // rétracte : réagir à ça ferait sautiller la mise en page au défilement.
      setInset(hidden > 80 ? Math.round(hidden) : 0);
    };

    measure();
    vv.addEventListener('resize', measure);
    vv.addEventListener('scroll', measure);
    return () => {
      vv.removeEventListener('resize', measure);
      vv.removeEventListener('scroll', measure);
    };
  }, []);

  return inset;
}

/**
 * Le clavier est-il ouvert ? Raccourci de lecture, pour les composants qui
 * veulent seulement se compacter sans connaître la hauteur exacte.
 */
export function useKeyboardOpen(): boolean {
  return useKeyboardInset() > 0;
}

/**
 * Densité de mise en page : combien de place le chrome a le droit de prendre.
 *
 * ⚠️ Ce que ça règle : les écrans de saisie portaient un en-tête, un pied et des
 * chiffres de grande taille dimensionnés pour un écran vide. Clavier ouvert sur
 * un téléphone, il ne restait par moments **pas un seul champ** visible entre
 * les deux barres.
 *
 *   'comfortable' — ordinateur, ou grand écran : rien à économiser.
 *   'compact'     — téléphone, clavier fermé : chrome allégé, espacements
 *                   resserrés, sous-titres conservés.
 *   'tight'       — téléphone, CLAVIER OUVERT : il reste environ 300 px. Tout
 *                   ce qui n'est pas un champ ou une action se réduit au strict
 *                   minimum — sous-titres, marges, hauteurs de barres.
 *
 * Les tailles de police et les cibles tactiles, elles, ne bougent pas : le
 * plancher à 14 px et les 48 px de cible sont des décisions du système de
 * design, et un champ qu'on rate au doigt ne fait pas gagner de place.
 */
export type Density = 'comfortable' | 'compact' | 'tight';

export function useDensity(): Density {
  const coarse = useCoarsePointer();
  const keyboardOpen = useKeyboardInset() > 0;
  if (!coarse) return 'comfortable';
  return keyboardOpen ? 'tight' : 'compact';
}
