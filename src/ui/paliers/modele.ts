// Étape Paliers (maquette r2) : le modèle de la courbe d'empâtage, sans React. Fonctions pures, testées dans `tests/integration/paliersR2.test.tsx`.
// Une seule source : les paliers de l'assistant (`mashSteps`) et, pour le mash-out qu'aucun palier n'écrit, `details.mash` (même lecture que
// `recipeThermalPlan`, le plan que le récapitulatif et la fiche utilisent). Aucun calcul de moteur ici : IBU, OG et eau ne changent pas.
import type { MashProfile, TempStep } from '../../types';
import { nomPalierAjoute } from '../../domain/fermentables/empatage';

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
    return { ...etat, steps: etat.steps.map((s, i) => (i === colonne.reel ? { ...s, ...(valeurs.tempC !== undefined ? { tempC: valeurs.tempC } : {}), ...(valeurs.durationMin !== undefined ? { durationMin: valeurs.durationMin } : {}) } : s)) };
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
    if (!fini(mash.mashoutTempC)) mash.mashoutTempC = 76;
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

/** Un palier ajouté (les valeurs d'aujourd'hui : 67 °C, 30 min) AVANT la colonne `rang` ; jamais après le mash-out de fin de courbe. Rend aussi le rang de la nouvelle colonne. */
export function insererAvant(etat: EtatEmpatage, rang: number): { etat: EtatEmpatage; rang: number } {
  const position = Math.max(0, Math.min(rang, etat.steps.length));
  const nouveau: TempStep = { name: nomPalierAjoute(etat.steps), tempC: 67, durationMin: 30 };
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
/** Le repère « sec ↔ rond » : indicatif, la FG ne dépend pas de l'empâtage (RC-8). */
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
/** Température tirée d'une ordonnée : pas de 0,5 °C, bornée à l'échelle. */
export const tempDepuisY = (y: number, e: { min: number; max: number }) => Math.min(e.max, Math.max(e.min, arrondir(tempDeY(y, e), 0.5)));

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
