// Le cas du parcours : la stout export 16D du brasseur, « trop résineuse, je la veux plus florale ».
// Exactement celle de la carte (fils22-carte/generer.mjs, via comparer-stout.json) : recette S1 et dégustation
// du moteur v4 (src/pack/buildPack.ts), IMPORTÉES et non recopiées. Nugget 46 g à 60′, 20 L, DI 1,066,
// 70 EBC, US-05 ; dégustation du 18.10 : résineux « marqué ».
import { STOCK, hopRef, type FamilyId, type Tasting } from '../../../../../src/domain/hopIndex/v4';
import { S1_TASTING, s1Recipe } from '../../../src/pack/buildPack';
import type { RecetteParcours } from '../etat/types';

export const CAS_ID = 'stout-16d-s1';
/** Recette telle que dégustée le 18.10 : la base de la dégustation. Une copie neuve à chaque appel. */
export function recetteDegustee(): RecetteParcours {
  const r = s1Recipe();
  return { ...r, additions: r.additions.map((a) => ({ ...a })) };
}
export const DEGUSTATION: Tasting = S1_TASTING;
/** Ce que le brasseur veut : une visée relative, en crans du style (comme S1_DIRECTION). */
export const VISEE: { famille: FamilyId; sens: 1 | -1 } = { famille: 'floral', sens: 1 };

// Clés des houblons nommés par le parcours (moteur v4 : id Beer Maverick).
export const H = {
  nugget: 'beermaverick-nugget',
  cascade: 'beermaverick-cascade',
  idaho7: 'beermaverick-idaho-7',
  galaxy: 'beermaverick-galaxy',
  nelson: 'beermaverick-nelson-sauvin',
  magnat: 'beermaverick-magnat',
} as const;

/** Conditions fixées des outils de la carte (NOTE.md de fils22-carte) : 4 g/L, US-05, après 3 j (Suggérer,
 * Comparer), actif 3 j (Dryhopper, Levure). Jour de début : celui de profil-simule-cas.ts (actif J+2, après J+7). */
export const CONDITIONS = {
  doseGL: 4,
  jours: 3,
  jourDebut: { dryActive: 2, dryPost: 7 } as const,
  levure: 'fermentis-us05',
};
/** Levures que le moteur simule en dry hop (profil-simule.ts, biotransfoLevure) et leur nom court. */
export const LEVURES: { id: string; nom: string }[] = [
  { id: 'fermentis-us05', nom: 'US-05' },
  { id: 'lalbrew-pomona', nom: 'Pomona' },
  { id: 'lalbrew-verdant-ipa', nom: 'Verdant' },
  { id: 'lalbrew-diamond', nom: 'Diamond' },
];
export const nomLevure = (id: string | null) => LEVURES.find((l) => l.id === id)?.nom ?? id ?? '?';

/** Stock libre (g) d'un houblon, ou null s'il n'est pas au stock (catalogue seul). Source : STOCK du moteur. */
export function stockLibre(cle: string): number | null {
  const s = STOCK.find((x) => x.key === cle);
  return s ? s.grams : null;
}
export const nomHoublon = (cle: string) => hopRef(cle)?.name ?? cle;
