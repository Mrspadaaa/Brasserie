/**
 * Q4-1 (24.11, sa réponse : « Trop lente sur le calendrier » : le défilement quand on tient une barre ou la fenêtre au bord de l'écran).
 * Le module partagé `src/ui/geste` (vitesseBord : 0,15 à 1,35 largeur par seconde, croissante avec la profondeur du doigt dans la bande) sert aussi
 * Finances et ne change pas. Le Calendrier le multiplie par 2,5, la montée progressive est gardée ; les barres de la frise plafonnent à 8 colonnes
 * par seconde (usePointeur, COLONNES_MAX_PAR_S).
 */
export const MULT_DEFILE_CALENDRIER = 2.5;
export const vitesseCalendrier = (vitesse: number): number => vitesse * MULT_DEFILE_CALENDRIER;

/**
 * K57-1 (24.11, test en ligne : la poignée de fin du cadre tenue à 4 px du bord s'emballait, 8 → 144 semaines en 2 s, 305 au lâcher ; les barres, elles,
 * plafonnaient) : TOUT défilement au bord du Calendrier (barres, cadre de l'en-tête, durée de la fiche) avance au plus de 8 colonnes par seconde.
 * Le cadre et la durée grandissaient d'un POURCENTAGE de leur échelle à chaque image (croissance exponentielle : ×7 par seconde à 4 px) ; ils avancent
 * maintenant d'au plus 8 colonnes par seconde, linéairement. Une colonne y vaut le sixième de l'échelle prise au début du geste (la frise montre
 * six colonnes : c'est la colonne des barres), jamais moins d'une unité (une semaine, ou un jour).
 */
export const COLONNES_MAX_PAR_S = 8;
export const COLONNES_PAR_ECRAN = 6;

/**
 * CAL-74 (Q-4 : « Trop lente sur le calendrier » ; POI-1 : « l'actionnable est du coup plus difficile sur mobile. Rentre la zone plus accessible »).
 * Deux causes de lenteur ressenties, une mesurée : (1) à 216–279 ms par image (K73-3), le pas de temps d'une image était borné à 50 ms et la barre
 * avançait au quart de sa vitesse ; (2) la bande du module geste (40 px, vitesse pleine au tout bord) tombe en partie dans les 24 px du geste retour
 * d'Android : au pouce, le doigt ne descend pas assez profond. Le Calendrier a donc sa bande : 72 px, vitesse pleine à 24 px du bord (BORD_ECRAN_PX),
 * et la vitesse monte avec le temps tenu : ×1 au début, ×1,6 après 1,2 s (jamais plus : plafond de colonnes par seconde multiplié de même).
 */
export const BANDE_CALENDRIER_PX = 72;
export const PROFONDEUR_PLEINE_PX = 24;
export const ACCELERATION_MAX = 1.6;
export const ACCELERATION_S = 1.2;
const V_MIN = 0.15;
const V_MAX = 1.35;
/** Le sens et la vitesse (largeurs de frise par seconde) d'un doigt à `x` px du bord gauche d'une frise de `largeur` px, allant dans le sens `arme`. */
export function vitesseBordCalendrier(x: number, largeur: number, arme: number): { sens: -1 | 0 | 1; vitesse: number } {
  const prof = (d: number) => Math.min(1, Math.max(0, (BANDE_CALENDRIER_PX - d) / (BANDE_CALENDRIER_PX - PROFONDEUR_PLEINE_PX)));
  let sens: -1 | 0 | 1 = 0, p = 0;
  if (x < BANDE_CALENDRIER_PX && arme < 0) { sens = -1; p = prof(x); }
  else if (x > largeur - BANDE_CALENDRIER_PX && arme > 0) { sens = 1; p = prof(largeur - x); }
  if (!sens) return { sens: 0, vitesse: 0 };
  return { sens, vitesse: V_MIN + (V_MAX - V_MIN) * Math.pow(p, 1.5) };
}
/** Le facteur de vitesse après `tenu` secondes au bord : de 1 à ACCELERATION_MAX, linéaire. */
export const accelerationTenue = (tenu: number): number => 1 + (ACCELERATION_MAX - 1) * Math.min(1, Math.max(0, tenu) / ACCELERATION_S);
/** Le plus que l'échelle de départ `span0` (unités) peut avancer ou grandir pendant `dt` secondes au bord. */
export const plafondFenetre = (span0: number, dt: number, tenu = 0): number => COLONNES_MAX_PAR_S * accelerationTenue(tenu) * Math.max(1, span0 / COLONNES_PAR_ECRAN) * dt;
/** Le pas de temps d'une image du défilement : borné pour qu'une image perdue ne saute pas de semaines, assez large pour qu'une image lente garde la vitesse. */
export const DT_MAX_S = 0.1;
