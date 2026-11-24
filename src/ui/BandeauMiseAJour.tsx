import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { MARGE_AVIS_PX, basDeLAvis, bandeauVisible, hautDesBarresBasses, rechargerMaintenant, surBandeau } from '../services/miseAJour';

/**
 * « Nouvelle version · Recharger » (D429) : n'apparaît que lorsqu'une version est prête et qu'une feuille ou une saisie
 * empêche de recharger. La version s'applique d'elle-même à la fermeture de la feuille ; le bouton est pour qui ne veut pas attendre.
 *
 * Place (23.11 soir) : en bas, juste au-dessus de la barre la plus haute du bas de l'écran (navigation, pied d'une feuille), jamais sur
 * l'en-tête ni sur les champs du haut (il cachait « Autre » de la saisie à la main). La hauteur prise est publiée dans `--avis-maj` :
 * la feuille de saisie la réserve sous son contenu, qui défile jusqu'au-dessus de l'avis. Toujours actif au toucher (z-[90], au-dessus des feuilles).
 */
const BARRES = 'footer, nav, [data-barre-bas], [class*="sticky"][class*="bottom-0"], [class*="fixed"][class*="bottom-0"]';

export function BandeauMiseAJour() {
  const visible = useSyncExternalStore(surBandeau, bandeauVisible, () => false);
  const [bas, setBas] = useState(MARGE_AVIS_PX);
  const racine = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    if (!visible) { document.documentElement.style.removeProperty('--avis-maj'); return; }
    const mesurer = () => {
      const vv = window.visualViewport;
      const basVisible = vv ? vv.offsetTop + vv.height : window.innerHeight;
      const boites = [...document.querySelectorAll<HTMLElement>(BARRES)].filter(el => !el.closest('[data-mise-a-jour]')).map(el => el.getBoundingClientRect());
      const b = basDeLAvis(window.innerHeight, hautDesBarresBasses(boites, basVisible));
      setBas(prev => (Math.abs(prev - b) < 1 ? prev : b));
      const h = racine.current?.getBoundingClientRect().height ?? 0;
      document.documentElement.style.setProperty('--avis-maj', `${Math.ceil(h + MARGE_AVIS_PX)}px`);
    };
    mesurer();
    // Le pied d'une feuille monte avec le clavier, la navigation apparaît ou disparaît : on remesure sans bruit.
    const minuterie = setInterval(mesurer, 400);
    window.addEventListener('resize', mesurer);
    window.visualViewport?.addEventListener('resize', mesurer);
    window.visualViewport?.addEventListener('scroll', mesurer);
    return () => {
      clearInterval(minuterie);
      window.removeEventListener('resize', mesurer);
      window.visualViewport?.removeEventListener('resize', mesurer);
      window.visualViewport?.removeEventListener('scroll', mesurer);
      document.documentElement.style.removeProperty('--avis-maj');
    };
  }, [visible]);
  if (!visible) return null;
  return (
    <div
      ref={racine}
      role="status"
      data-mise-a-jour
      style={{ bottom: bas }}
      className="fixed left-1/2 z-[90] flex w-max max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center gap-2 rounded-panel border border-cave-700 bg-cave-900 py-0.5 pl-3 pr-0.5 text-xs text-cave-100 shadow-2xl"
    >
      <span>Nouvelle version</span>
      <span aria-hidden="true" className="text-cave-400">·</span>
      <button
        type="button"
        onClick={rechargerMaintenant}
        className="min-h-8 rounded-control border border-ebc-straw bg-ebc-straw px-2.5 font-medium text-cave-950 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ebc-straw"
      >
        Recharger
      </button>
    </div>
  );
}
