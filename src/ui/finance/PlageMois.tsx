import { useState } from 'react';

/** Le premier mois qu'on peut demander : le même plancher que la Synthèse. */
export const PREMIER_MOIS = '2000-01';

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
  return <div className="syn-plage" role="group" aria-label="Plage de mois">
    <label>du <input type="month" aria-label="Du mois" value={du} min={PREMIER_MOIS} max={au} onChange={e => changer('du', e.target.value)}/></label>
    <label>au <input type="month" aria-label="Au mois" value={au} min={du} max={courant} onChange={e => changer('au', e.target.value)}/></label>
  </div>;
}
