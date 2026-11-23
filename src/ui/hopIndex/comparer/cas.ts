// Les constantes du cas que Comparer lit (cmc2k), venues de `prototypes/houblons-v4/parcours/src/donnees/cas.ts` (T15, #174).
// Ce ne sont pas des données du brasseur : les clés de houblons que
// l'écran nomme, et les noms courts des levures que le moteur simule en dry hop. La recette, elle, vient de l'hôte.
export { CONDITIONS } from '../parcours/conditions';

// La visée par défaut (floral +1, la demande S1 de la maquette) n'est plus ici : la demande d'un écran se lit de sa visée, de sa
// dégustation, sinon du style de la recette (./demande.ts, a2-demande-reelle).

/** Clés des houblons nommés par l'écran (moteur v4 : id Beer Maverick). */
export const H = {
  nugget: 'beermaverick-nugget',
  cascade: 'beermaverick-cascade',
  idaho7: 'beermaverick-idaho-7',
  galaxy: 'beermaverick-galaxy',
  nelson: 'beermaverick-nelson-sauvin',
  magnat: 'beermaverick-magnat',
} as const;

/** Levures que le moteur simule en dry hop (profil-simule.ts, biotransfoLevure) et leur nom court. */
export const LEVURES: { id: string; nom: string }[] = [
  { id: 'fermentis-us05', nom: 'US-05' },
  { id: 'lalbrew-pomona', nom: 'Pomona' },
  { id: 'lalbrew-verdant-ipa', nom: 'Verdant' },
  { id: 'lalbrew-diamond', nom: 'Diamond' },
];
export const nomLevure = (id: string | null) => LEVURES.find((l) => l.id === id)?.nom ?? id ?? '?';
