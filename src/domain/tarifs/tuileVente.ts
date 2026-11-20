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

/**
 * Ce que dit une tuile « à vérifier », en mots de brasseur et sans infobulle (critique k2, 20.11, points 24 et 26) : on ne touche pas une infobulle au doigt,
 * et deux causes différentes ne portent pas le même libellé. `mot` va à côté du format, `court` dessous (la cause en trois mots), `raison` s'affiche en toutes lettres quand on touche la tuile.
 * - tarif hors plage : « tarif à corriger », avec le prix au litre et l'endroit où le corriger ;
 * - fût sans fût lié au brassin : « capacité supposée » (20 L est un repli, pas une donnée).
 */
export interface NoteTuile { mot: string; court: string; raison: string }
const chf = new Intl.NumberFormat('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const litres = (l: number) => new Intl.NumberFormat('fr-CH', { maximumFractionDigits: 2 }).format(l);

export function noteDeTuile(p: { suspect: boolean; prixTarif: number | null | undefined; volumeL: number; capaciteSupposee: boolean }): NoteTuile | null {
  if (p.suspect && p.prixTarif != null && p.volumeL > 0) {
    return { mot: 'tarif à corriger', court: `${chf.format(p.prixTarif / p.volumeL)} CHF le litre`, raison: `Le tarif de ${chf.format(p.prixTarif)} CHF fait ${chf.format(p.prixTarif / p.volumeL)} CHF le litre : à corriger dans Atelier › Tarifs. Indique le prix de cette vente ci-dessous.` };
  }
  if (p.capaciteSupposee) {
    return { mot: 'capacité supposée', court: 'aucun fût lié', raison: `Aucun fût lié à ce brassin : ${litres(p.volumeL)} L est une capacité de repli, pas la vraie. Lie le fût au brassin pour la connaître.` };
  }
  return null;
}
