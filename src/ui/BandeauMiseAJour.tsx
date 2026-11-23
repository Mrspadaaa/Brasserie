import { useLayoutEffect, useState, useSyncExternalStore } from 'react';
import { bandeauVisible, rechargerMaintenant, surBandeau } from '../services/miseAJour';

/**
 * « Nouvelle version · Recharger » (D429) : n'apparaît que lorsqu'une version est prête et qu'une feuille ou une saisie
 * empêche de recharger. Discret, en haut : les actions des feuilles restent au pouce. La version s'applique d'elle-même
 * à la fermeture de la feuille ; le bouton est pour qui ne veut pas attendre.
 */
export function BandeauMiseAJour() {
  const visible = useSyncExternalStore(surBandeau, bandeauVisible, () => false);
  // L-55 : jamais sur l'en-tête (il cachait ‹ Nov. ›) : juste sous lui ; sans en-tête visible, en haut comme avant.
  const [haut, setHaut] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (!visible) return;
    const bas = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0;
    setHaut(bas > 0 ? bas + 4 : null);
  }, [visible]);
  if (!visible) return null;
  return (
    <div
      role="status"
      data-mise-a-jour
      style={haut !== null ? { top: haut } : undefined}
      className="fixed left-1/2 top-[calc(env(safe-area-inset-top,0px)+0.5rem)] z-[90] flex w-max max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center gap-2 rounded-panel border border-cave-700 bg-cave-900 py-0.5 pl-3 pr-0.5 text-xs text-cave-100 shadow-2xl"
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
