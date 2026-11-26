// Étape Paliers (maquette r2) : le modèle de la courbe d'empâtage, sans React. Fonctions pures, testées dans `tests/integration/paliersR2.test.tsx`.
// Une seule source : les paliers de l'assistant (`mashSteps`) et, pour le mash-out qu'aucun palier n'écrit, `details.mash` (même lecture que
// `recipeThermalPlan`, le plan que le récapitulatif et la fiche utilisent). Aucun calcul de moteur ici : IBU, OG et eau ne changent pas.
import type { MashProfile, TempStep } from '../../types';
import { SACCHARIFICATION_TEMP_C, SACCHARIFICATION_MIN_MIN } from '../../domain/fermentables/empatage';
import { BrewingMath } from '../../services/brewingMath';

/** Le mash-out qu'aucun palier n'écrit vit dans `details.mash` (`mashoutTempC`, `mashoutDurationMin`, `mashoutEnabled`). */
export type MashDetails = Partial<MashProfile>;
export interface EtatEmpatage { steps: TempStep[]; mash?: MashDetails }

/** Une colonne de la courbe : un palier réel, ou le mash-out posé par `details.mash` (`reel: false`). */
export interface Colonne {
  /** Rang dans la courbe (0 = première colonne). */
  rang: number;
  /** Rang dans `mashSteps` ; `-1` pour le mash-out de `details.mash`. */
  reel: number;
  nom: string;
  tempC?: number;
  durationMin?: number;
  /** Montée depuis la colonne précédente, en minutes ; `undefined` : à mesurer (aucun repère de chauffe). */
  rampMin?: number;
  mashout: boolean;
}

const MASHOUT = /mash.?out/i;
/** Le mash-out que rien n'écrit : 76 °C, le défaut de `build()` et de `recipeThermalPlan`. */
const MASHOUT_DEFAUT_C = 76;
const fini = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/** Les colonnes, depuis les lignes du plan thermique de l'app (`recipeThermalPlan(recipe).rows`) : mêmes valeurs que le récapitulatif. */
export function colonnesDe(rows: ReadonlyArray<{ name: string; tempC?: number; durationMin?: number; rampMin?: number }>, nbReels: number): Colonne[] {
  return rows.map((row, rang) => ({
    rang, reel: rang < nbReels ? rang : -1, nom: row.name, tempC: row.tempC, durationMin: row.durationMin,
    rampMin: rang > 0 ? row.rampMin : undefined, mashout: MASHOUT.test(row.name),
  }));
}

/** Rang de la colonne mash-out (la dernière si plusieurs), ou -1. */
export const rangMashout = (colonnes: readonly Colonne[]) => colonnes.reduce((r, c) => (c.mashout ? c.rang : r), -1);

/** Température ou durée réglée sur une colonne. Un champ vidé (NaN) reste inconnu sur un palier réel ; sur le mash-out de `details.mash`, il est ignoré
 *  (le défaut 76 °C ne se réécrit pas en silence). */
export function reglerColonne(etat: EtatEmpatage, colonne: Colonne, valeurs: { tempC?: number; durationMin?: number }): EtatEmpatage {
  if (colonne.reel >= 0) {
    // Un nom posé par l'app suit la température (« Palier 2 » glissé à 52 °C devient « Repos protéique ») ; un mash-out écrit comme palier garde le sien.
    // Toujours, même « Saccharification » glissée à 72 °C (critique 26.11 : un nom gardé à 72 et un « + » de tête qui pose une seconde « Saccharification » à 67).
    const renomme = (s: TempStep) => fini(valeurs.tempC) && nomAuto(s.name) && !MASHOUT.test(s.name ?? '') ? { name: nomSelonTemp(valeurs.tempC) } : {};
    return { ...etat, steps: etat.steps.map((s, i) => (i === colonne.reel ? { ...s, ...(valeurs.tempC !== undefined ? { tempC: valeurs.tempC, ...renomme(s) } : {}), ...(valeurs.durationMin !== undefined ? { durationMin: valeurs.durationMin } : {}) } : s)) };
  }
  const mash = { ...(etat.mash ?? {}) };
  if (fini(valeurs.tempC)) mash.mashoutTempC = valeurs.tempC;
  if (fini(valeurs.durationMin)) mash.mashoutDurationMin = valeurs.durationMin;
  return { ...etat, mash };
}

/** Nom d'un palier réel (le mash-out de `details.mash` garde son nom). */
export const renommerColonne = (etat: EtatEmpatage, colonne: Colonne, nom: string): EtatEmpatage =>
  colonne.reel < 0 ? etat : { ...etat, steps: etat.steps.map((s, i) => (i === colonne.reel ? { ...s, name: nom } : s)) };

/** Interrupteur du mash-out. Coupé : un mash-out écrit comme palier est retiré des paliers, sa température et sa durée passent dans `details.mash`
 *  (même geste que « Choisir le programme sans mash-out », sans sa condition) ; rétabli : `details.mash` le redonne à la fin de la courbe. */
export function basculerMashout(etat: EtatEmpatage, colonnes: readonly Colonne[], actif: boolean): EtatEmpatage {
  const mash: MashDetails = { ...(etat.mash ?? {}) };
  if (actif) {
    mash.mashoutEnabled = true;
    // Le 76 °C et les 10 min sont les défauts que `build()` et le plan thermique posent déjà quand rien n'est écrit.
    if (!fini(mash.mashoutTempC)) mash.mashoutTempC = MASHOUT_DEFAUT_C;
    return { ...etat, mash };
  }
  const reel = colonnes.find(c => c.mashout && c.reel >= 0);
  let steps = etat.steps;
  if (reel) {
    const s = etat.steps[reel.reel];
    if (fini(s.tempC)) mash.mashoutTempC = s.tempC;
    if (fini(s.durationMin)) mash.mashoutDurationMin = s.durationMin;
    steps = etat.steps.filter((_, i) => i !== reel.reel);
  }
  mash.mashoutEnabled = false;
  return { steps, mash };
}

/**
 * Les repos de l'empâtage, leur température et leur durée types (Palmer, How to Brew, ch. 14 « Mash rests » ; Kunze, Technology Brewing and Malting,
 * ch. 3) : β-glucanes vers 45 °C, protéines vers 52 °C, β-amylase vers 63 °C, saccharification vers 67 °C, α-amylase vers 72 °C. `max` borne le nom
 * qu'on donne à une température (au-delà de 74 °C : « Palier chaud », jamais « Mash-out », que l'interrupteur porte).
 */
export const REPOS = [
  { t: 45, d: 15, nom: 'Repos β-glucanes', max: 48 },
  { t: 52, d: 15, nom: 'Repos protéique', max: 58 },
  { t: 63, d: 30, nom: 'β-amylase', max: 65.5 },
  { t: 67, d: 45, nom: 'Saccharification', max: 70 },
  { t: 72, d: 20, nom: 'α-amylase', max: 74 },
] as const;
const NOM_CHAUD = 'Palier chaud';
const NOMS_AUTO = new Set<string>([...REPOS.map(r => r.nom), NOM_CHAUD]);

/** Le nom du repos qu'une température fait (un palier à 52 °C est un repos protéique). */
export const nomSelonTemp = (t: number): string => REPOS.find(r => t < r.max)?.nom ?? NOM_CHAUD;
/** Un nom posé par l'app (« Palier 2 », un nom de repos) suit sa température ; un nom écrit par le brasseur ne change jamais. */
export const nomAuto = (nom: string | undefined): boolean => !nom?.trim() || NOMS_AUTO.has(nom.trim()) || /^palier \d+$/i.test(nom.trim());

/**
 * PALIERS-EDITION-MAL (25.11) : les valeurs d'un palier posé entre deux températures (`avant`, `apres`, inconnues aux bouts). Le repos type qui tombe
 * entre les deux, le plus proche du milieu ; sans repos type entre eux, le milieu au degré s'il fait un vrai pas (6 °C au moins) ; sinon, la température d'avant (le brasseur la glisse).
 * En tête : le repos type juste en dessous du premier palier ; en fin : celui juste au-dessus du dernier. Jamais un doublon plat de 67 °C posé partout.
 */
export function valeursAjout(avant?: number, apres?: number): { name: string; tempC: number; durationMin: number } {
  let t: number;
  if (fini(avant) && fini(apres)) {
    if (apres - avant > 1) {
      const milieu = (avant + apres) / 2;
      const r = REPOS.filter(x => x.t > avant && x.t < apres).sort((a, b) => Math.abs(a.t - milieu) - Math.abs(b.t - milieu))[0];
      // Sans repos type entre eux : le milieu s'il fait un vrai pas (6 °C au moins) ; sinon la température d'avant (critique 26.11 : 72, 74, 75, 76 « ça existe pas »).
      t = r ? r.t : apres - avant >= 6 ? Math.round(milieu) : avant;
    } else t = avant;
  } else if (fini(apres)) t = [...REPOS].reverse().find(x => x.t < apres - 1)?.t ?? Math.max(35, apres - 5);
  else if (fini(avant)) t = REPOS.find(x => x.t > avant + 1)?.t ?? Math.min(78, avant + 3);
  else t = 67;
  return { name: nomSelonTemp(t), tempC: t, durationMin: REPOS.find(x => x.t === t)?.d ?? 15 };
}

/** Un palier ajouté AVANT la colonne `rang` (jamais après le mash-out de fin de courbe), aux valeurs de ses voisins (`valeursAjout`). Rend aussi le rang
 *  de la nouvelle colonne. Le voisin d'après, en fin de courbe, est le mash-out de `details.mash` quand il est en place. Courbe vide : 67 °C, 60 min. */
export function insererAvant(etat: EtatEmpatage, rang: number): { etat: EtatEmpatage; rang: number } {
  const position = Math.max(0, Math.min(rang, etat.steps.length));
  const avant = etat.steps[position - 1]?.tempC;
  let apres = etat.steps[position]?.tempC;
  // Le mash-out que rien n'écrit vaut 76 °C (le défaut de `build()` et du plan thermique, celui que la courbe dessine) : sans lui, le « + » de fin
  // ne voyait aucun voisin après 72 °C et posait 75 °C juste avant le mash-out.
  if (position === etat.steps.length && etat.mash?.mashoutEnabled !== false) apres = fini(etat.mash?.mashoutTempC) ? etat.mash!.mashoutTempC : MASHOUT_DEFAUT_C;
  const v = etat.steps.length === 0 ? { name: 'Saccharification', tempC: 67, durationMin: 60 } : valeursAjout(fini(avant) ? avant : undefined, fini(apres) ? apres : undefined);
  const nouveau: TempStep = { name: v.name, tempC: v.tempC, durationMin: v.durationMin };
  const steps = [...etat.steps.slice(0, position), nouveau, ...etat.steps.slice(position)];
  return { etat: { ...etat, steps }, rang: position };
}

/** Rang où pose le « + » de fin de courbe : avant le mash-out s'il ferme la courbe, sinon à la fin. */
export function rangFinDeCourbe(colonnes: readonly Colonne[]): number {
  const m = rangMashout(colonnes);
  return m >= 0 && m === colonnes.length - 1 ? m : colonnes.length;
}

// --- Géométrie de la maquette (viewBox 370 × 284) -----------------------------------------------------------------------------------------------

export const G = { largeur: 370, hauteur: 284, x0: 30, w: 300, y0: 10, h: 240, minCol: 34, minMontee: 24, nominalMontee: 40, nominalColonne: 34 } as const;
/** Un avis court sur l'effet de la saccharification, sans changer FG ni alcool (BR-5, lecture étroite : le calcul de la levure reste tel quel). */
export interface AvisSaccharification { texte: string; tempC: number; ecartAttenuationPts: number; ecartFgPts?: number }

const REPERE_EMPATAGE_C = 66.5;

/**
 * BR-5 (08.11) : la température de saccharification ne changeait rien d'écrit à l'écran. `BrewingMath.attenuationForMashTemp` (±1,5 point d'atténuation
 * par °C autour de 66,5 °C, plafonné à ±8) donne l'écart ; il se dit ici en points de densité finale (OG 1,075, 63 °C : environ 4 points), sans toucher au chiffre
 * de FG de la recette. Le palier retenu est la saccharification la plus longue entre 62 et 72 °C (ni repos protéique, ni mash-out). Sans OG connue : le sens
 * et l'écart d'atténuation, jamais un chiffre de FG inventé. `null` près du repère (moins d'un point de FG, ou moins de 1 °C sans OG).
 */
export function avisSaccharification(steps: ReadonlyArray<{ tempC?: number; durationMin?: number }>, og: number | null | undefined, attenuationPct?: number): AvisSaccharification | null {
  const candidats = steps.filter(s => fini(s.tempC) && s.tempC >= SACCHARIFICATION_TEMP_C.min && s.tempC <= SACCHARIFICATION_TEMP_C.max
    && fini(s.durationMin) && s.durationMin >= SACCHARIFICATION_MIN_MIN);
  if (!candidats.length) return null;
  const palier = candidats.reduce((a, b) => (b.durationMin! > a.durationMin! ? b : a));
  const tempC = palier.tempC!;
  // L'écart d'atténuation ne dépend pas de la base, sauf aux bornes ; 75 % (un levain de bière ordinaire) sert quand la levure n'a pas d'atténuation écrite.
  const base = fini(attenuationPct) && attenuationPct > 0 ? attenuationPct : 75;
  const ecart = BrewingMath.attenuationForMashTemp(base, tempC) - base;
  const temp = `${Number(tempC.toFixed(1)).toLocaleString('fr-FR')} °C`;
  const plus = ecart > 0;
  if (fini(og) && og > 1) {
    const pts = Math.round((og - 1) * 1000 * Math.abs(ecart) / 100);
    if (pts < 1) return null;
    return { texte: `${temp} : FG plus ${plus ? 'basse' : 'haute'} d’environ ${pts} point${pts > 1 ? 's' : ''} (repère : 66,5 °C).`, tempC, ecartAttenuationPts: ecart, ecartFgPts: plus ? -pts : pts };
  }
  if (Math.abs(tempC - REPERE_EMPATAGE_C) < 1 || Math.round(Math.abs(ecart)) < 1) return null;
  return { texte: `${temp} : FG plus ${plus ? 'basse' : 'haute'} que vers 66,5 °C (atténuation environ ${Math.round(Math.abs(ecart))} points plus ${plus ? 'haute' : 'basse'}).`, tempC, ecartAttenuationPts: ecart };
}

/** Le repère « sec ↔ rond » : indicatif, il ne change pas le chiffre de FG de la recette (RC-8) ; l'écart que l'empâtage y met se dit dans `avisSaccharification` (BR-5). */
export const BANDE_CORPS = { min: 62, max: 72 } as const;

/** Largeurs de dessin : chaque durée connue vaut sa part de 300 px, sans passer sous le minimum tactile ; un inconnu garde une largeur nominale. */
export function repartir(items: ReadonlyArray<{ minutes?: number; min: number; nominal: number }>, total: number = G.w): number[] {
  const clampe = new Set<number>();
  let largeurs: number[] = [];
  for (let tour = 0; tour <= items.length; tour++) {
    const libres = items.map((it, i) => ({ it, i })).filter(({ it, i }) => fini(it.minutes) && !clampe.has(i));
    const somme = libres.reduce((s, { it }) => s + it.minutes!, 0);
    const fixe = items.reduce((s, it, i) => s + (!fini(it.minutes) ? it.nominal : clampe.has(i) ? it.min : 0), 0);
    const k = somme > 0 ? Math.max(0, total - fixe) / somme : 0;
    largeurs = items.map((it, i) => (!fini(it.minutes) ? it.nominal : clampe.has(i) ? it.min : it.minutes! * k));
    const trop = libres.filter(({ it, i }) => largeurs[i] < it.min).map(({ i }) => i);
    if (!trop.length) break;
    trop.forEach(i => clampe.add(i));
  }
  const somme = largeurs.reduce((s, w) => s + w, 0);
  return somme > total && somme > 0 ? largeurs.map(w => w * total / somme) : largeurs;
}

export interface Disposition {
  /** x de début, largeur de chaque colonne. */
  colonnes: Array<{ x: number; w: number }>;
  /** Zone de montée AVANT la colonne `rang` (rang ≥ 1) : x et largeur. */
  montees: Array<{ x: number; w: number; rang: number }>;
  /** Vrai quand une largeur est tenue par son minimum ou nominale : les graduations régulières mentiraient. */
  approx: boolean;
  /** Pixels par minute, quand tout est à l'échelle. */
  pxParMin?: number;
}

/** Pose les colonnes et les montées sur 300 px, de gauche à droite. */
export function disposer(colonnes: readonly Colonne[]): Disposition {
  const items: Array<{ minutes?: number; min: number; nominal: number }> = [];
  colonnes.forEach((c, i) => {
    if (i > 0) items.push({ minutes: c.rampMin, min: G.minMontee, nominal: G.nominalMontee });
    items.push({ minutes: c.durationMin, min: G.minCol, nominal: G.nominalColonne });
  });
  const largeurs = repartir(items);
  let x = G.x0, n = 0;
  const out: Disposition = { colonnes: [], montees: [], approx: false };
  colonnes.forEach((c, i) => {
    if (i > 0) { const w = largeurs[n++]; out.montees.push({ x, w, rang: i }); x += w; }
    const w = largeurs[n++]; out.colonnes.push({ x, w }); x += w;
  });
  const echelle = items.map((it, i) => fini(it.minutes) && it.minutes > 0 ? largeurs[i] / it.minutes : undefined);
  const k = echelle.find(Boolean);
  out.approx = items.some((it, i) => !fini(it.minutes) || (it.minutes! > 0 && k !== undefined && Math.abs(largeurs[i] / it.minutes! - k) > 0.06 * k));
  out.pxParMin = out.approx ? undefined : k;
  return out;
}

/** Échelle des températures : 50-80 °C par défaut (maquette), élargie par dizaines si un palier sort (un repos à 45 ou 52 °C ne se coupe pas). */
export function echelleTemp(temps: ReadonlyArray<number | undefined>): { min: number; max: number } {
  const t = temps.filter(fini);
  return { min: Math.min(50, ...t.map(v => Math.floor(v / 10) * 10)), max: Math.max(80, ...t.map(v => Math.ceil(v / 10) * 10)) };
}
export const yDeTemp = (t: number, e: { min: number; max: number }) => G.y0 + (e.max - t) / (e.max - e.min) * G.h;
export const tempDeY = (y: number, e: { min: number; max: number }) => e.max - (y - G.y0) / G.h * (e.max - e.min);
const arrondir = (v: number, pas: number) => Math.round(v / pas) * pas;
/** Température tirée d'une ordonnée : pas de 1 °C (un palier se règle au degré ; le demi-degré, au clavier), bornée à l'échelle. Au demi-degré, le doigt
 *  posait « 73,5 » à chaque glissé et le bandeau passait sur deux lignes (PALIERS-EDITION-MAL). */
export const tempDepuisY = (y: number, e: { min: number; max: number }) => Math.min(e.max, Math.max(e.min, arrondir(tempDeY(y, e), 1)));

/** Durée telle que la fin de la colonne tombe sous `x` (la poignée suit le doigt), par bissection sur la disposition réelle : pas de 5 min, de 5 à 240 min. */
export function dureeDepuisX(colonnes: readonly Colonne[], rang: number, x: number): number {
  const fin = (m: number) => {
    const d = disposer(colonnes.map(c => (c.rang === rang ? { ...c, durationMin: m } : c)));
    return d.colonnes[rang].x + d.colonnes[rang].w;
  };
  let bas = 0, haut = 240;
  for (let i = 0; i < 40; i++) { const mi = (bas + haut) / 2; if (fin(mi) < x) bas = mi; else haut = mi; }
  return Math.min(240, Math.max(5, arrondir((bas + haut) / 2, 5)));
}

/** Trait de la courbe : un segment horizontal par colonne à température connue, relié à la suivante par sa montée ; un inconnu coupe le trait. */
export function traceCourbe(colonnes: readonly Colonne[], d: Disposition, e: { min: number; max: number }): { plein: string; inconnus: Array<{ rang: number; x1: number; x2: number }> } {
  let plein = '';
  let enCours = false;
  const inconnus: Array<{ rang: number; x1: number; x2: number }> = [];
  const n = (v: number) => Number(v.toFixed(2));
  colonnes.forEach((c, i) => {
    const { x, w } = d.colonnes[i];
    if (!fini(c.tempC)) { inconnus.push({ rang: i, x1: x, x2: x + w }); enCours = false; return; }
    const y = n(yDeTemp(c.tempC, e));
    if (enCours) plein += `L${n(x)} ${y}H${n(x + w)}`;
    else plein += `M${n(x)} ${y}H${n(x + w)}`;
    enCours = true;
  });
  return { plein, inconnus };
}

/** Durée totale : maintiens + montées ; `montees` faux quand une montée reste à mesurer (le total est alors un plancher, dit sans « ≈ »). */
/**
 * PALIERS-EDITION-MAL (25.11 ; avant : k1 point 17) : la poignée ↔ de durée (40 × 24) se pose SUR le bord droit de la colonne choisie, dans la courbe,
 * au-dessus de l'axe : c'est ce bord qu'elle déplace. Sur l'axe, elle tombait au milieu des étiquettes « ≈21′ » et des « + » et se retirait loin du bord
 * pour leur faire place. Le bas du rect laisse 14 px d'air au « + » des frontières (cercle de rayon 12 centré sur l'axe).
 */
export const POIGNEE_DUREE = { w: 40, h: 24 } as const;
export function poigneeDuree(xColonne: number, wColonne: number): { cx: number; y: number } {
  // 14 px d'air au-dessus du « + » de la frontière suivante (critique 26.11 : dans une colonne de 10′, les deux cibles se touchaient sous le pouce).
  return { cx: Math.min(G.x0 + G.w, Math.max(G.x0 + POIGNEE_DUREE.w / 2, xColonne + wColonne)), y: G.y0 + G.h - 12 - 14 - POIGNEE_DUREE.h };
}

export function dureeTotale(colonnes: readonly Colonne[]): { minutes?: number; montees: boolean } {
  if (!colonnes.length || colonnes.some(c => !fini(c.durationMin))) return { montees: false };
  const maintiens = colonnes.reduce((s, c) => s + c.durationMin!, 0);
  const montees = colonnes.slice(1).every(c => fini(c.rampMin));
  return { minutes: Math.ceil(maintiens + colonnes.slice(1).reduce((s, c) => s + (c.rampMin ?? 0), 0)), montees };
}

// --- Fermentation en lecture ---------------------------------------------------------------------------------------------------------------------

export interface PhaseLue { tempC?: number; days?: number }
export interface CourbeFermentation { chemin: string; jours?: number; segments: Array<{ x1: number; x2: number; y: number; froid: boolean }>; etiquettes: Array<{ x: number; y: number; texte: string; froid: boolean }> }

/** La courbe de lecture de la Levure (160 × 36) : un palier = un trait à sa température, largeur ∝ jours ; froid (≤ 8 °C) en bleu. Un inconnu n'est jamais 0 : trait pointillé absent. */
export function courbeFermentation(phases: readonly PhaseLue[]): CourbeFermentation {
  const connues = phases.filter(p => fini(p.tempC) && fini(p.days) && p.days > 0);
  const total = connues.reduce((s, p) => s + p.days!, 0);
  const temps = connues.map(p => p.tempC!);
  const hi = Math.max(...temps), lo = Math.min(...temps);
  const y = (t: number) => (hi === lo ? 19 : 8 + (hi - t) / (hi - lo) * 22);
  const segments: CourbeFermentation['segments'] = [];
  let x = 2, chemin = '';
  const n = (v: number) => Number(v.toFixed(1));
  connues.forEach((p, i) => {
    const w = 156 * p.days! / total, yy = n(y(p.tempC!));
    chemin += i === 0 ? `M${n(x)} ${yy}H${n(x + w)}` : `V${yy}H${n(x + w)}`;
    segments.push({ x1: n(x), x2: n(x + w), y: yy, froid: p.tempC! <= 8 });
    x += w;
  });
  const etiquettes: CourbeFermentation['etiquettes'] = [];
  segments.forEach((s, i) => {
    const t = connues[i].tempC!;
    if (i > 0 && connues[i - 1].tempC === t) return;
    if (s.x2 - s.x1 < 14 && i < segments.length - 1) return;
    etiquettes.push({ x: s.x1 + 2, y: s.y + (s.y < 20 ? 14 : -6), texte: `${Number(t.toFixed(1)).toLocaleString('fr-FR')}°`, froid: s.froid });
  });
  const jours = phases.length && phases.every(p => fini(p.days)) ? phases.reduce((s, p) => s + p.days!, 0) : undefined;
  return { chemin, jours, segments, etiquettes };
}
