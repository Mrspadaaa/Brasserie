// Les constantes du cas que Comparer lit (cmc2k), venues de `prototypes/houblons-v4/parcours/src/donnees/cas.ts` (T15, #174).
// Ce ne sont pas des données du brasseur : la visée par défaut (sa demande du 18.10 : plus floral), les clés de houblons que
// l'écran nomme, et les noms courts des levures que le moteur simule en dry hop. La recette, elle, vient de l'hôte.
import type { FamilyId } from '../../../domain/hopIndex/v4';
export { CONDITIONS } from '../parcours/conditions';

/** Ce que le brasseur veut : une visée relative, en crans du style (la demande dégustée, parcours/visee.ts). */
export const VISEE: { famille: FamilyId; sens: 1 | -1 } = { famille: 'floral', sens: 1 };

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
