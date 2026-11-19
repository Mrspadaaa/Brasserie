import { useState } from 'react';
import { auMois, duMois } from './financeFormat';

/** Le premier mois qu'on peut demander : le même plancher que la Synthèse. */
export const PREMIER_MOIS = '2000-01';

const MOIS_LONG = new Intl.DateTimeFormat('fr-CH', { month: 'long', timeZone: 'UTC' });
/** « 2026-08 » → « août 2026 », en français quelle que soit la langue du téléphone. */
export const moisEnClair = (mois: string): string => {
  if (!/^\d{4}-\d{2}$/.test(mois)) return mois;
  return `${MOIS_LONG.format(new Date(Date.UTC(Number(mois.slice(0, 4)), Number(mois.slice(5, 7)) - 1, 1)))} ${mois.slice(0, 4)}`;
};

/**
 * La rangée « du [mois] au [mois] » (CP-9, 10.11), commune à la Synthèse et aux Opérations : deux champs mois natifs, bornés au mois
 * courant, du ≤ au. Le champ qu'on vient de toucher tire l'autre avec lui : jamais de plage inversée. `onPlage` n'est appelé que sur un
 * vrai changement. Elle se monte à l'ouverture : `du` et `au` ne sont que ses valeurs de départ.
 */
export function PlageMois({ courant, du: duInitial, au: auInitial, onPlage }: { courant: string; du: string; au: string; onPlage: (du: string, au: string) => void }) {
  const [du, setDu] = useState(duInitial), [au, setAu] = useState(auInitial);
  const borne = (valeur: string) => valeur < PREMIER_MOIS ? PREMIER_MOIS : valeur > courant ? courant : valeur;
  const changer = (champ: 'du' | 'au', brut: string) => {
    if (!/^\d{4}-\d{2}$/.test(brut)) return;
    const v = borne(brut);
    const [nouveauDu, nouveauAu] = champ === 'du' ? [v, v > au ? v : au] : [v < du ? v : du, v];
    setDu(nouveauDu); setAu(nouveauAu);
    onPlage(nouveauDu, nouveauAu);
  };
  // 19.11 : le champ natif s'écrit dans la langue du téléphone (« August 2026 ») et se coupe à 390 (« November 202 ») : il reste, transparent,
  // posé sur le mois écrit en français ; le toucher ouvre toujours le sélecteur du téléphone.
  return <div className="syn-plage" role="group" aria-label="Plage de mois">
    {/* Neuf n° 5 (19.11) : « d’août », « à août », jamais « du août ». */}
    <label>{duMois(moisEnClair(du))}<span className="syn-plage-champ"><span className="syn-plage-mois" aria-hidden="true">{moisEnClair(du)}</span>
      <input type="month" aria-label="Du mois" value={du} min={PREMIER_MOIS} max={au} onChange={e => changer('du', e.target.value)}/></span></label>
    <label>{auMois(moisEnClair(au))}<span className="syn-plage-champ"><span className="syn-plage-mois" aria-hidden="true">{moisEnClair(au)}</span>
      <input type="month" aria-label="Au mois" value={au} min={du} max={courant} onChange={e => changer('au', e.target.value)}/></span></label>
  </div>;
}
