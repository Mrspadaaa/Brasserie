/**
 * Étape Identité (r4-a, choisie le 31.10) : le calcul pur derrière « chaque nombre est un curseur, et se tape ».
 *
 * Rien ici ne touche au DOM : les règles qui s'étendent, la saisie hors règle, l'état du fermenteur et de la cuve
 * se testent en entrée / sortie (tests/unit/identite). Le volume avant ébullition vient du plan d’eau de la recette (preBoilHotL, moteur) :
 * ce fichier ne le refait pas.
 */

/** Plancher de la règle d'ébullition (min) et sa marge : toujours une demi-heure au-delà de la valeur. */
export const EBULLITION_REGLE_MIN = 120;
export const EBULLITION_PAS = 5;
export const EBULLITION_ETAPE_REGLE = 30;
/** La règle du volume avance par 5 L et garde 3 L d'air au-delà de ce qu'elle montre. */
export const VOLUME_ETAPE_REGLE = 5;
export const VOLUME_MARGE_REGLE = 3;
/** Garde-fous de saisie : au-delà, c'est une faute de frappe, pas une règle à étendre jusqu'à l'absurde. */
export const VOLUME_SAISIE_MAX = 2000;
export const EBULLITION_SAISIE_MAX = 1440;
/** Le nombre de chiffres qu'une règle écrit au plus, quelle que soit sa longueur. */
export const GRADUATIONS_MAX = 200;

const fini = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Jusqu'où va la règle de l'ébullition : de 0 à la valeur + une demi-heure, par demi-heures, 120 au plus bas.
 * 120 → 150 ; 165 → 180 ; 240 → 270. Une valeur inconnue laisse la règle de repos.
 */
export function etendreEbullition(minutes: number | undefined): number {
  if (!fini(minutes) || minutes < 0) return EBULLITION_REGLE_MIN;
  return Math.max(EBULLITION_REGLE_MIN, Math.ceil((minutes + 15) / EBULLITION_ETAPE_REGLE) * EBULLITION_ETAPE_REGLE);
}

/**
 * Jusqu'où va la règle commune du volume et de la cuve : le plus grand de la cuve, du fermenteur + 5 L et du volume + 3 L,
 * arrondi au multiple de 5 L au-dessus (0–65 pour un fermenteur de 60 L, dernier chiffre « 60 › » : verdict n° 10, r4-a).
 * Le moût d'avant ébullition n'étire plus la règle : la barre de la cuve s'arrête au bout de la règle (`echelleBarre`) et
 * son « +N L de trop » dit le reste. Aucune de ces entrées n'est requise.
 */
export function etendreVolume(e: { cuveL?: number; capaciteL?: number; volumeL?: number }): number {
  const vals: number[] = [];
  if (fini(e.cuveL) && e.cuveL > 0) vals.push(e.cuveL);
  if (fini(e.capaciteL) && e.capaciteL > 0) vals.push(e.capaciteL + VOLUME_ETAPE_REGLE);
  if (fini(e.volumeL) && e.volumeL > 0) vals.push(e.volumeL + VOLUME_MARGE_REGLE);
  const plus = vals.length ? Math.max(...vals) : 20;
  return Math.ceil(plus / VOLUME_ETAPE_REGLE) * VOLUME_ETAPE_REGLE;
}

/** Les chiffres de la règle d'ébullition : un tous les 30′, puis un tous les 60′ dès que la règle passe 180 min (verdict n° 10). */
export function etiquetteEbullition(regle: number): number {
  return fini(regle) && regle > 180 ? 60 : EBULLITION_ETAPE_REGLE;
}

/**
 * L'échelle de la barre de la cuve, en litres : son total tant qu'il tient dans la règle, sinon la règle elle-même. La barre
 * ne dépasse pas le bout de la règle ; ses zones se lisent alors sur la même échelle que la règle, jamais comprimées.
 */
export function echelleBarre(totalL: number, regle: number): number {
  return fini(regle) && regle > 0 && totalL > regle ? regle : totalL;
}

export interface Graduation { valeur: number; /** 0 à 100 */ position: number; /** le dernier chiffre porte « › » */ derniere: boolean }

/** Les chiffres d'une règle de 0 à `max` : un tous les `etiquette`. Le dernier ouvre la règle (« 40 › »). */
export function graduations(max: number, etiquette: number): Graduation[] {
  if (!fini(max) || max <= 0 || !(etiquette > 0)) return [];
  // Une règle démesurée garde 200 chiffres au plus : l'étiquette grandit, mais la règle ne gèle jamais l'écran
  // (31.10 : 999 999 999 999 min dans la fiche de brassage = 1,7 × 10^10 éléments, tas épuisé).
  if (max / etiquette > GRADUATIONS_MAX) etiquette = Math.ceil(max / GRADUATIONS_MAX / etiquette) * etiquette;
  const dernier = Math.floor(max / etiquette) * etiquette;
  const out: Graduation[] = [];
  for (let x = 0; x <= max + 1e-9; x += etiquette) out.push({ valeur: x, position: (x / max) * 100, derniere: x === dernier });
  return out;
}

/** Nombre de pas de la règle (traits fins) : 45 L par 1 L → 45 ; 150 min par 5′ → 30. */
export function traitsRegle(max: number, pas: number): number {
  return fini(max) && max > 0 && pas > 0 ? Math.round(max / pas) : 0;
}

/**
 * Lit ce qui se tape : virgule ou point, espaces et unité tolérés (« 24,5 L »). Renvoie null si rien d'un nombre.
 * Un texte avec plusieurs nombres (« 2 4 ») reste illisible : pas de devinette.
 */
export function lireNombre(texte: string): number | null {
  const t = String(texte ?? '').trim().replace(/\s*(l|litres?|min|minutes?|')$/i, '').trim().replace(',', '.');
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(t)) return null;
  const v = Number.parseFloat(t);
  return Number.isFinite(v) ? v : null;
}

export type Saisie =
  | { genre: 'vide' }
  | { genre: 'valeur'; valeur: number }
  | { genre: 'illisible' }
  | { genre: 'hors-limites' };

/**
 * Ce que vaut un texte tapé. Une valeur hors de la règle est ACCEPTÉE (la règle s'étend) ; seules la borne basse
 * (`min`) et le garde-fou (`max`) la refusent. `arrondi` ramène à un pas (5′ pour l'ébullition).
 */
export function lireSaisie(texte: string, o: { min: number; max: number; arrondi?: number }): Saisie {
  if (String(texte ?? '').trim() === '') return { genre: 'vide' };
  const v = lireNombre(texte);
  if (v === null) return { genre: 'illisible' };
  const val = o.arrondi ? Math.round(v / o.arrondi) * o.arrondi : r1(v);
  if (val < o.min || val > o.max) return { genre: 'hors-limites' };
  return { genre: 'valeur', valeur: val };
}

/**
 * BR-65 : un texte refusé à la sortie du champ ne se perd pas en silence. Dit la plage permise, et la valeur gardée.
 * Les bornes sont dites avec le mot « de … à … » (jamais « −1 → 30 L » sans un mot).
 */
export function messageRefusSaisie(genre: Exclude<Saisie['genre'], 'valeur'>, o: { min: number; max: number; unite?: string; gardee: number }): string {
  const u = o.unite ? ` ${o.unite}` : '';
  const garde = fini(o.gardee) ? ` Valeur gardée : ${fr(o.gardee)}${u}.` : '';
  const plage = `de ${fr(o.min)} à ${fr(o.max)}${u}`;
  if (genre === 'illisible') return `Un nombre est attendu, ${plage}.${garde}`;
  if (genre === 'vide') return `Une valeur est attendue, ${plage}.${garde}`;
  return `Valeur hors limites, ${plage}.${garde}`;
}

/** ↑ ↓ : ajoute ou retire un pas, sans sortir de [min, max]. Une valeur inconnue part de `min`. */
export function pasClavier(valeur: number, pas: number, sens: 1 | -1, o: { min: number; max: number }): number {
  const base = fini(valeur) ? valeur : o.min;
  return Math.min(o.max, Math.max(o.min, r1(base + sens * pas)));
}

export type GenreVolume = 'inconnu' | 'libre' | 'plein' | 'trop';
export interface EtatVolume { genre: GenreVolume; litres: number }

/** 6 L libres / 0 L libre, plein / +1 L de trop. Sans fermenteur connu ou sans volume : inconnu (jamais 0). */
export function etatVolume(volumeL: number, capaciteL: number | undefined): EtatVolume {
  if (!fini(volumeL) || !fini(capaciteL) || capaciteL <= 0) return { genre: 'inconnu', litres: Number.NaN };
  const reste = r1(capaciteL - volumeL);
  if (reste > 0) return { genre: 'libre', litres: reste };
  if (reste === 0) return { genre: 'plein', litres: 0 };
  return { genre: 'trop', litres: -reste };
}

/** Le remplissage conseillé : la capacité moins l'espace libre, arrondi vers le BAS (jamais au-dessus de la réserve choisie). */
export function conseilVolume(capaciteL: number | undefined, espaceLibrePct: number | undefined): number | undefined {
  if (!fini(capaciteL) || capaciteL <= 0 || !fini(espaceLibrePct) || espaceLibrePct < 0 || espaceLibrePct >= 100) return undefined;
  return Math.floor((capaciteL * (1 - espaceLibrePct / 100) + 1e-8) * 10) / 10;
}

export interface ZonesPiste {
  /** Les bornes sont en litres, la piste va de 0 à `regle`. null = zone absente. */
  rempli: [number, number] | null;
  libre: [number, number] | null;
  /** Au-delà du fermenteur : zone rouge pâle jusqu'au bout de la règle. */
  trop: [number, number] | null;
  /** Le dépassement lui-même, entre le fermenteur et le volume. */
  depasse: [number, number] | null;
}

/** Les quatre zones de la piste du volume. Sans capacité connue : seul le rempli. */
export function zonesPiste(volumeL: number, capaciteL: number | undefined, regle: number): ZonesPiste {
  const v = fini(volumeL) && volumeL > 0 ? volumeL : 0;
  if (!fini(capaciteL) || capaciteL <= 0) return { rempli: v ? [0, Math.min(v, regle)] : null, libre: null, trop: null, depasse: null };
  const c = capaciteL;
  return {
    rempli: v ? [0, Math.min(v, c)] : null,
    libre: v < c ? [Math.min(v, c), c] : null,
    trop: regle > c ? [c, regle] : null,
    depasse: v > c ? [c, v] : null
  };
}

export interface Evaporation { litres: number; source: 'profil' | 'taux' | 'repli' }

/**
 * Ce qui s'évapore pendant l'ébullition : le débit du profil d'équipement (L/h) s'il existe ; sinon le taux %/h du
 * profil de brasserie ; sinon le repli de 10 %/h, dit « estimé ». Toujours une estimation : l'affichage porte « ~ ».
 */
export function evaporation(o: { boilOffLPerHour?: number; boilOffRatePct?: number; volumeL: number; minutes: number }): Evaporation | null {
  if (!fini(o.minutes) || o.minutes < 0) return null;
  if (fini(o.boilOffLPerHour) && o.boilOffLPerHour >= 0) return { litres: r1(o.boilOffLPerHour * o.minutes / 60), source: 'profil' };
  if (!fini(o.volumeL) || o.volumeL <= 0) return null;
  if (fini(o.boilOffRatePct) && o.boilOffRatePct >= 0) return { litres: r1(o.volumeL * o.boilOffRatePct / 100 * o.minutes / 60), source: 'taux' };
  return { litres: r1(o.volumeL * 0.1 * o.minutes / 60), source: 'repli' };
}

export interface AvantEbullition { litres: number; evapL: number | null }

/**
 * Le moût dans la cuve avant l'ébullition : UNE seule source, le `preBoilHotL` de la recette (le plan d'eau du moteur), le même
 * nombre que « Avant ébullition · à chaud » du bloc « Volumes et matériel ». Aucune addition ni second calcul ici.
 * Sans plan d'eau (pas de malts), ce nombre vaut 0 ou manque : on ne le sait pas, la barre le dit (null), jamais un 0 ni un autre nombre.
 */
export function avantEbullitionDuPlan(preBoilHotL: number | null | undefined, evapL: number | null | undefined): AvantEbullition | null {
  if (!fini(preBoilHotL) || preBoilHotL <= 0) return null;
  return { litres: preBoilHotL, evapL: fini(evapL) ? evapL : null };
}

export interface BarreCuve {
  /** Largeur totale de la barre, en litres : la cuve, ou le moût s'il la dépasse. */
  total: number;
  /** Moût qui reste après l'évaporation (or). */
  moutL: number;
  /** Part qui s'évapore (bleu), à la suite. */
  evapL: number;
  /** Au-dessus de la cuve : la zone rouge, de `cuveL` à `cuveL + depasseL`. */
  depasseL: number;
  deborde: boolean;
}

/** La barre de la cuve : « +22 L de trop » quand le moût d'avant ébullition dépasse la cuve. null si on ne sait pas. */
export function barreCuve(avantL: number | null | undefined, evapL: number | null | undefined, cuveL: number | undefined): BarreCuve | null {
  if (!fini(avantL) || avantL <= 0 || !fini(cuveL) || cuveL <= 0) return null;
  const evap = fini(evapL) ? Math.min(Math.max(0, evapL), avantL) : 0;
  const depasse = r1(Math.max(0, avantL - cuveL));
  return { total: Math.max(cuveL, avantL), moutL: r1(avantL - evap), evapL: evap, depasseL: depasse, deborde: depasse > 0 };
}

/**
 * La part évaporée (bleue) de la barre de la cuve, coupée à la cuve : au-delà, seules les hachures rouges du dépassement se voient
 * (sinon bleu et rouge se mêlent en un bout violet). null = rien à peindre (évaporation inconnue, ou moût déjà plus grand que la cuve).
 */
export function partEvapDansCuve(b: BarreCuve, cuveL: number): [number, number] | null {
  const debut = b.moutL;
  const fin = Math.min(b.moutL + b.evapL, cuveL);
  return fin > debut ? [debut, fin] : null;
}

/** « 24 », « 24,5 » : une décimale au plus, virgule suisse. */
export const fr = (n: number) => (fini(n) ? String(Math.round(n * 10) / 10).replace('.', ',') : '—');

/** Pourcentage de la règle, borné à [0, 100]. */
export const pourcent = (x: number, regle: number) => (fini(x) && regle > 0 ? Math.max(0, Math.min(100, (x / regle) * 100)) : 0);
