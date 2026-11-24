/**
 * POI-1 (24.11, sa plainte : « maintenant tout est au bord, l'actionnable est du coup plus difficile sur mobile. Rentre la zone plus accessible »).
 * La frise va bord à bord (son choix CAL-BORDS-ET-LIGNES) : le bout d'une barre, la poignée du cadre et les petits boutons tombent contre le bord de
 * l'écran, là où Android place le geste retour (~20 à 30 dp depuis chaque bord) ; un doigt qui part de là recule la page au lieu de tirer.
 * Méthode standard : cible tactile d'au moins 44 px (Apple 44 pt, Android 48 dp, WCAG 2.5.5 ; 24 px au minimum en 2.5.8) dont la partie UTILE se tient
 * hors de la bande du geste retour. La zone s'étend vers l'INTÉRIEUR (pseudo-élément ou zone de geste, jamais le dessin) ; la zone d'avant reste prise.
 */
export const BORD_ECRAN_PX = 24;
export const CIBLE_MIN_PX = 44;
/** Une barre d'au moins 120 px peut céder jusqu'à 40 % de sa largeur au bord rentré ; en dessous, le tiers (R2-1 : le milieu d'une barre courte la déplace). */
export const BARRE_LONGUE_PX = 120;

export type Zone = readonly [number, number];
/** Les bords de l'écran, dans le repère de la zone (px). */
export interface VueEcran { gauche: number; droite: number }

/** Les bords de l'écran : la fenêtre du navigateur ; sans fenêtre (rendu serveur, essai), aucun bord. */
export function vueEcran(): VueEcran {
  return typeof window !== 'undefined' && window.innerWidth > 0 ? { gauche: 0, droite: window.innerWidth } : { gauche: -Infinity, droite: Infinity };
}

/** Les bords de l'écran dans le repère d'une surface dont le bord gauche est à `decalage` px de l'écran. */
export const vueDansRepere = (decalage: number): VueEcran => { const v = vueEcran(); return { gauche: v.gauche - decalage, droite: v.droite - decalage }; };

/** Jusqu'où le bout d'une barre de largeur `w` peut mordre dedans quand sa zone est rentrée. */
export const capRentree = (w: number): number => (w >= BARRE_LONGUE_PX ? 0.4 * w : Math.max(0, w) / 3);

/**
 * Étend `zone` vers l'intérieur de l'écran pour que sa partie hors des bandes de 24 px mesure au moins 44 px. Jamais plus petite qu'avant ; `borne`
 * limite l'extension (un bout de barre ne mange pas son corps). Une zone loin du bord revient telle quelle.
 */
export function rentrer(zone: Zone, vue: VueEcran, borne?: Zone): Zone {
  let [a, b] = zone;
  const sg = vue.gauche + BORD_ECRAN_PX, sd = vue.droite - BORD_ECRAN_PX;
  if (b > sd) a = Math.min(a, Math.max(sd - CIBLE_MIN_PX, borne?.[0] ?? -Infinity));
  if (a < sg) b = Math.max(b, Math.min(sg + CIBLE_MIN_PX, borne?.[1] ?? Infinity));
  return [a, b];
}

/** La zone d'avant (R3) du bord droit d'une barre : `zone` px dehors, au plus le tiers de la barre dedans. */
export const priseFinAvant = (gauche: number, droite: number, zone: number): Zone => [droite - Math.min(zone, (droite - gauche) / 3), droite + zone];
/** La zone d'avant du bord gauche : `zone` px dehors, au plus le quart de la barre dedans. */
export const priseDebutAvant = (gauche: number, droite: number, zone: number): Zone => [gauche - zone, gauche + Math.min(zone, (droite - gauche) / 4)];

/** La prise du bord droit d'une barre [gauche, droite] : celle d'avant, rentrée contre le bord droit de l'écran. */
export function priseFin(gauche: number, droite: number, zone: number, vue: VueEcran): Zone {
  return rentrer(priseFinAvant(gauche, droite, zone), vue, [droite - capRentree(droite - gauche), Infinity]);
}
/** La prise du bord gauche : celle d'avant, rentrée contre le bord gauche de l'écran. */
export function priseDebut(gauche: number, droite: number, zone: number, vue: VueEcran): Zone {
  return rentrer(priseDebutAvant(gauche, droite, zone), vue, [-Infinity, gauche + capRentree(droite - gauche)]);
}

/**
 * Le doigt posé en `x` dans la part rentrée : de combien de px il est loin de la zone d'avant (la fin tirée suit le jour sous le doigt ; ce décalage,
 * ajouté à sa position, la fait partir du bout comme avant et non d'un saut). 0 dans la zone d'avant.
 */
export function correctionPrise(x: number, avant: Zone): number {
  if (x < avant[0]) return avant[0] - x;
  if (x > avant[1]) return avant[1] - x;
  return 0;
}

/**
 * Un bouton ou une pastille (boîte `left`–`right`, px) : de combien son pseudo-élément de toucher s'étend en plus, à gauche (`g`) et à droite (`d`),
 * pour que sa partie utile (hors des 24 px du bord) atteigne 44 px. 0 et 0 loin des bords ; jamais plus de 44.
 */
export function rentreeElement(boite: BoiteEcran, vue: VueEcran, voisins: readonly BoiteEcran[] = []): { g: number; d: number } {
  const sg = vue.gauche + BORD_ECRAN_PX, sd = vue.droite - BORD_ECRAN_PX;
  let g = boite.right > sd ? Math.max(0, boite.left - (sd - CIBLE_MIN_PX)) : 0;
  let d = boite.left < sg ? Math.max(0, sg + CIBLE_MIN_PX - boite.right) : 0;
  /* jamais sur une autre commande de la même ligne : l'extension s'arrête 2 px avant la boîte du voisin (celle d'avant : 2 px dehors) */
  const memeLigne = (v: BoiteEcran) => boite.top === undefined || boite.bottom === undefined || v.top === undefined || v.bottom === undefined || (v.bottom > boite.top && v.top < boite.bottom);
  for (const v of voisins) {
    if (!memeLigne(v)) continue;
    if (v.right <= boite.left + 0.5) g = Math.min(g, Math.max(0, boite.left - v.right - 2));
    else if (v.left >= boite.right - 0.5) d = Math.min(d, Math.max(0, v.left - boite.right - 2));
  }
  return { g: Math.min(g, CIBLE_MIN_PX), d: Math.min(d, CIBLE_MIN_PX) };
}
export interface BoiteEcran { left: number; right: number; top?: number; bottom?: number }
