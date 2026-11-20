import { hors } from './ventesAuLitre';

/**
 * Le prix qu'une tuile de la caisse (Vendre) a le droit d'afficher et de poser sur la ligne.
 *
 * Un tarif enregistré peut être faux (jeu en ligne 20.11, T3B-13 : « 75 cl · 569,50 CHF » pour une bouteille, soit 759 CHF le litre : le montant
 * de 10 bouteilles, 5 695, ramené à une seule). On applique à la tuile la même plage plausible que la frise Tarifs (`PLAGE_LITRE_PLAUSIBLE`, CHF le litre) :
 * hors plage, la tuile ne montre pas ce prix et n'en pose aucun (« prix ? » + « à vérifier ») ; un clic ouvre la ligne libre, prix vide, que le brasseur remplit.
 * Le prix suspect n'est ni effacé ni corrigé : il reste dans le tarif, seule la caisse refuse de le proposer. Jamais 0 : l'inconnu reste `null`.
 */
export interface PrixTuile {
  /** Prix HT affiché et posé au clic ; `null` : « prix ? », à indiquer. */
  prix: number | null;
  /** Vrai quand le tarif existe mais sort de la plage plausible : la tuile le dit (« à vérifier »). */
  suspect: boolean;
}

export function prixDeTuile(prixTarif: number | null | undefined, volumeL: number): PrixTuile {
  if (prixTarif == null || !Number.isFinite(prixTarif) || !(prixTarif > 0)) return { prix: null, suspect: false };
  if (!(volumeL > 0) || hors(prixTarif / volumeL)) return { prix: null, suspect: true };
  return { prix: prixTarif, suspect: false };
}
