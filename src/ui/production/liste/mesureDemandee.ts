/**
 * PI-4 (T9) : « Mesurer » sur la carte d'un lot en cuve ouvre sa fiche ET le geste de mesure, en un toucher. La carte pose la demande ;
 * le pied de la fiche (`PiedFermentation`) la prend en s'affichant et ouvre le geste. Une demande vit 4 s au plus : une fiche ouverte plus
 * tard autrement ne s'ouvre jamais sur un geste qu'on n'a pas demandé.
 */
let demandeLe = 0;
let lot: string | null = null;
export const demanderMesure = (batchId: string) => { demandeLe = Date.now(); lot = batchId; };
/** Prend la demande (une seule fois) ; `true` si elle est fraîche. */
export function prendreMesureDemandee(): boolean {
  const fraiche = lot !== null && Date.now() - demandeLe < 4000;
  demandeLe = 0; lot = null;
  return fraiche;
}
