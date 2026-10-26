// D108 (voie f6) : Suggérer ne paie plus le premier calcul à froid. Les apports V5.5 du pool de 80 houblons (~250 ms, voies:apport) ne dépendent ni de la visée ni des grammes du Nugget :
// leur clé est houblon|moment|grammes|volume|levure|durée d'ébullition. Dès que l'étape Houblons (ou Ma bière) est à l'écran, on les chauffe une fois au repos du navigateur par un appel
// `proposerRapide` ; l'ouverture de Suggérer les trouve prêts (témoin : scripts/eval-hop/f4-froid.ts --chauffe=apports : 205 ms au premier appel, comme HEAD).
// Rien n'est affiché, rien n'est écrit : un calcul de plus, au repos. Une erreur est tue par le client (l'écran refera le calcul).
import { useEffect } from 'react';
import { calcul } from '../parcours/calcul';
import type { RecetteParcours } from '../parcours/types';
import { auReposDuNavigateur } from './differe';

/** Une visée quelconque : la clé des apports ne la lit pas (f4-froid : « la direction n'importe pas »). */
export const DIRECTION_DE_CHAUFFE = { floral: 1 } as const;

/** Ce qui fait changer les apports du pool : le volume, la levure et la durée d'ébullition. Le style n'y entre pas, les gestes sur les doses non plus. */
export const cleDeChauffe = (r: Pick<RecetteParcours, 'volumeL' | 'yeastId' | 'boilMin'>): string => `${r.volumeL}|${r.yeastId ?? ''}|${r.boilMin}`;

const chauffees = new Set<string>();
/** Oublie ce qui a été chauffé (tests). */
export const oublierChauffe = (): void => { chauffees.clear(); };

/** D111 (voie f7) : les apports de cette recette ont-ils été chauffés (la préchauffe a démarré) ? Alors l'appel complet ne paie plus le froid (231,8 ms mesuré, f6) : Suggérer l'affiche d'emblée, avec « Remplacer ». */
export const estChauffee = (recette: Pick<RecetteParcours, 'volumeL' | 'yeastId' | 'boilMin'>): boolean => chauffees.has(cleDeChauffe(recette));

/** Programme la préchauffe de cette recette au repos, une fois par volume, levure et durée d'ébullition. Rend l'annulation. */
export function prechauffer(recette: RecetteParcours): () => void {
  const cle = cleDeChauffe(recette);
  if (chauffees.has(cle) || recette.additions.length === 0) return () => {};
  return auReposDuNavigateur(() => {
    if (chauffees.has(cle)) return;
    chauffees.add(cle);
    void calcul().prechauffer('proposerRapide', recette, { ...DIRECTION_DE_CHAUFFE });
  });
}

/** Dans l'étape Houblons : chauffe au repos, à l'affichage puis quand le volume, la levure ou la durée changent (pas à chaque geste sur une dose). */
export function usePrechauffeSuggerer(recette: RecetteParcours): void {
  const cle = cleDeChauffe(recette);
  const vide = recette.additions.length === 0;
  useEffect(() => prechauffer(recette), [cle, vide]); // eslint-disable-line react-hooks/exhaustive-deps
}
