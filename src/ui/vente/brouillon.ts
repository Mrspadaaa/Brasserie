import type { Echeance, ModeVente, VentePreparee } from './enregistrerVente';
import type { LignePanier } from './panier';

/**
 * La vente en attente de confirmation. Elle vit ici, hors du composant : fermer la caisse puis la rouvrir après un rejet (confirmation perdue)
 * rend la MÊME entrée, jamais une seconde écriture ni un second numéro (REVUE-B 4). `saveIncomeEntry` écrit en local avant la confirmation.
 */
export interface Brouillon {
  vente: VentePreparee; lignes: LignePanier[]; clientId: string | null; mode: ModeVente; dateIso: string; echeance: Echeance; moyen?: 'twint' | 'cash';
}

let courant: Brouillon | undefined;
export const lireBrouillon = (): Brouillon | undefined => courant;
export const garderBrouillon = (b: Brouillon): void => { courant = b; };
export const effacerBrouillon = (): void => { courant = undefined; };
