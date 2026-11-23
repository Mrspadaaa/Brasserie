// c7 (26.10, #187) : l'enveloppe des marques d'un houblon (« peu de données », astérisque d'origine non répertoriée) et le réaffichage à l'arrivée du
// catalogue plein. Le dessin et ses règles sont dans MarquesVue.tsx, chargé à la demande : le morceau des outils (budget B5) ne grossit pas.
import { lazy, Suspense, useEffect, useState } from 'react';
import { siCataloguePleinArrive } from '../../../domain/hopIndex/v4/data';
import { chargerCataloguePleinAuRepos } from '../precharge';

const MarquesVue = lazy(() => import('./MarquesVue'));
/** Les marques d'un houblon, en fragment pour une rangée `flex-wrap` ; ne rend rien quand il n'y a rien à marquer. */
export const MarquesCatalogue = ({ cle }: { cle: string }) => <Suspense fallback={null}><MarquesVue cle={cle} /></Suspense>;

/** Réaffiche (une fois) à l'arrivée du catalogue plein, et le charge au repos si l'étape s'affiche avant. Le nombre rendu est la clé d'un `useMemo` qui lit le moteur. */
export function useCataloguePlein(): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    const annuler = chargerCataloguePleinAuRepos();
    const desabonner = siCataloguePleinArrive(() => setN((x) => x + 1));
    return () => { annuler(); desabonner(); };
  }, []);
  return n;
}
