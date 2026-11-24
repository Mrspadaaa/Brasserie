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
/** Le plus que l'échelle de départ `span0` (unités) peut avancer ou grandir pendant `dt` secondes au bord. */
export const plafondFenetre = (span0: number, dt: number): number => COLONNES_MAX_PAR_S * Math.max(1, span0 / COLONNES_PAR_ECRAN) * dt;
