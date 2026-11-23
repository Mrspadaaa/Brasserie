// Ce que les composants communs lisent d'un houblon et d'une famille : seulement les champs qu'ils affichent.
// `FamilleLue` et `HoublonLu` (adaptateur du moteur) y entrent par typage structurel ; les composants communs
// n'importent donc ni l'adaptateur ni le moteur (ils restent légers dans le chunk qui les emploie).
import type { FamilyId } from '../../domain/hopIndex/v4/families';
import type { FamilyStatus } from '../../domain/hopIndex/v4/style/scale';

export interface FamilleAffichee {
  famille: FamilyId;
  statut: FamilyStatus;
  /** Bande du style sur 0–100, null hors style documenté. */
  bande: [number, number] | null;
  /** null = inconnu (rien de simulé, pas une preuve d'absence). */
  valeur: { bas: number; centre: number; haut: number } | null;
  horsStyle: 'au-dessus' | 'en dessous' | null;
  raison: string | null;
}

export interface HoublonAffiche {
  cle: string;
  nom: string;
  /** α du lot, sinon milieu de la plage variétale ; plage des fiches ; « ≠ » si le lot en sort. */
  alpha: { valeur: number; plage: [number, number] | null; horsFiches: boolean } | null;
  role: { mot: 'amérisant' | 'aromatique' | 'mixte' | null };
  /** Stock libre en g ; null : pas au stock. */
  stock: number | null;
}
