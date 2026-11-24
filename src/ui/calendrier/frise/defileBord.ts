/**
 * Q4-1 (24.11, sa réponse : « Trop lente sur le calendrier » : le défilement quand on tient une barre ou la fenêtre au bord de l'écran).
 * Le module partagé `src/ui/geste` (vitesseBord : 0,15 à 1,35 largeur par seconde, croissante avec la profondeur du doigt dans la bande) sert aussi
 * Finances et ne change pas. Le Calendrier le multiplie par 2,5, la montée progressive est gardée ; les barres de la frise plafonnent à 8 colonnes
 * par seconde (usePointeur, COLONNES_MAX_PAR_S).
 */
export const MULT_DEFILE_CALENDRIER = 2.5;
export const vitesseCalendrier = (vitesse: number): number => vitesse * MULT_DEFILE_CALENDRIER;
