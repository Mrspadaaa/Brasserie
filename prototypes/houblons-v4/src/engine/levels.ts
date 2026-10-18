// Les quatre objets de l'écran (work/refonte-frontend/v4/ecran-1/MODELE.md), en niveaux prêts à dessiner.
// Intensité dans la bière (objets 1, 2, 4) : 0 absent, 1 faible, 2 moyen, 3 marqué (classes V5.5).
// Fiches d'un houblon (objet 3) : 0 non décrit, 1 cité, 2 marqué. Ce n'est pas une intensité.
import bandsFile from '../../data/style-bands.json';
import { AXES } from './data';
import { FAMILY_NAMES, type FamilyId } from './families';
import { describeFamilies } from './hops';
import type { Profile } from './recipe';
import type { Tasting } from './tasting';
import type { FamilyEffect } from './voies';
import type { FamilyStatus, StyleScale } from '../style/scale';

export type Level = 0 | 1 | 2 | 3;
/** Borne haute du niveau « none » de la table mots → bandes (absent). */
const ABSENT_MAX = bandsFile.words.levels.find((l) => l.id === 'none')!.band[1];
const axis = (f: FamilyId) => AXES.find((a) => a.id === f)!;
/** Classe V5.5 d'une valeur 0–100 : faible ≤ lowMax < moyen ≤ mediumMax < marqué. Jamais 0 : l'absence se prouve à part. */
export const classOf = (v: number, f: FamilyId): 1 | 2 | 3 => (v <= axis(f).lowMax ? 1 : v <= axis(f).mediumMax ? 2 : 3);
const PERCEIVED: Record<string, Level> = { faible: 1, moyen: 2, marqué: 3 };

export const LEVEL_RULE = [
  'Intensité dans la bière, 0 à 3 : 0 absent, 1 faible, 2 moyen, 3 marqué (classes des axes V5.5 : 0–33, 33–66, 66–100).',
  'Profil de ma bière : la dégustation prime (faible 1, moyen 2, marqué 3) ; sinon le repère central V5.5 de la recette, converti par les classes ; 0 seulement si toute la plage du modèle reste sous le seuil « absent » (5) ; sinon null, « non situé ».',
  'Cible du style : bande [bas, haut] convertie ; bas ≤ 5 donne 0 (absent permis), sinon la classe juste au-dessus du bas ; haut ≤ 5 donne 0, sinon la classe qui contient le haut.',
  'Profil après une voie : le profil de ma bière décalé par l’effet établi de la voie (points). Famille du modèle : niveau du repère décalé, jamais 0 sans preuve d’absence. Famille dégustée : la classe perçue décalée ; le niveau change seulement si toute la classe décalée tombe dans une autre classe. Sans effet établi : niveau inchangé, effet « non établi ».',
  'Fiches d’un houblon, 0 à 2 : 0 non décrit, 1 cité (une fiche), 2 marqué (au moins deux fiches ou premier descripteur), avec « N fiches sur M ». Ce n’est pas une intensité dans la bière.',
];

export interface BeerLevel {
  family: FamilyId; name: string; status: FamilyStatus;
  level: Level | null;
  source: 'dégustation' | 'modèle' | 'non situé';
  /** Ce qui a été converti : classe perçue, ou repère central V5.5 (points 0–100). */
  basis: { perceived?: string; central?: number; range?: { min: number; max: number } } | null;
}
export function beerLevels(profile: Profile, tasting: Tasting | null, scale: StyleScale): BeerLevel[] {
  return scale.order.map((f) => {
    const base = { family: f, name: FAMILY_NAMES[f], status: scale.families[f].status };
    const t = tasting?.axes.find((a) => a.family === f);
    if (t?.perceived && t.perceivedRange) return { ...base, level: PERCEIVED[t.perceived], source: 'dégustation', basis: { perceived: t.perceived, range: t.perceivedRange } };
    const e = profile[f];
    if (e.status === 'estimé' && e.range && e.range.max <= ABSENT_MAX) return { ...base, level: 0, source: 'modèle', basis: { range: e.range } };
    if (e.status === 'inconnu' || !e.situated || e.central === undefined) return { ...base, level: null, source: 'non situé', basis: null };
    return { ...base, level: classOf(e.central, f), source: 'modèle', basis: { central: e.central } };
  });
}

export interface TargetLevel { family: FamilyId; name: string; status: FamilyStatus; min: Level; max: Level; band: [number, number] | null; hypothesis: string }
/** Cible du style en niveaux ; style non documenté : 0–3 sans bande (échelle absolue). */
export function targetLevels(scale: StyleScale): TargetLevel[] {
  return scale.order.map((f) => {
    const fs = scale.families[f];
    const hypothesis = `${bandsFile.status} (table ${bandsFile.words.version})`;
    if (!fs.band) return { family: f, name: FAMILY_NAMES[f], status: fs.status, min: 0, max: 3, band: null, hypothesis };
    const [lo, hi] = fs.band;
    const min: Level = lo <= ABSENT_MAX ? 0 : lo < axis(f).lowMax ? 1 : lo < axis(f).mediumMax ? 2 : 3;
    const max: Level = hi <= ABSENT_MAX ? 0 : classOf(hi, f);
    return { family: f, name: FAMILY_NAMES[f], status: fs.status, min, max, band: fs.band, hypothesis };
  });
}

export interface AfterLevel { family: FamilyId; level: Level | null; source: BeerLevel['source']; effet: number | 'non établi'; note?: string }
/** Profil de ma bière après une voie, sur la même échelle (voir LEVEL_RULE). */
export function afterLevels(before: BeerLevel[], effect: Record<FamilyId, FamilyEffect>): AfterLevel[] {
  return before.map((b) => {
    const e = effect[b.family];
    if (!e.established || e.central === null) return { family: b.family, level: b.level, source: b.source, effet: 'non établi' };
    const d = e.central;
    if (b.source === 'dégustation' && b.basis?.range) {
      const lo = Math.max(0, b.basis.range.min + d), hi = Math.min(100, b.basis.range.max + d);
      const same = classOf(lo, b.family) === classOf(hi, b.family);
      return { family: b.family, level: same ? classOf(lo, b.family) : b.level, source: b.source, effet: d,
        ...(same ? {} : { note: 'Variation trop faible pour faire changer la classe perçue.' }) };
    }
    if (b.source === 'modèle' && b.basis?.central !== undefined) return { family: b.family, level: Math.max(1, classOf(b.basis.central + d, b.family)) as Level, source: b.source, effet: d };
    return { family: b.family, level: b.level, source: b.source, effet: d, note: 'Bière non située sur cette famille : effet établi, niveau inconnu.' };
  });
}

export interface FicheLevel { family: FamilyId; name: string; status: FamilyStatus; level: 0 | 1 | 2; label: string; sources: number; of: number }
/** Fiches d'un houblon sur les 12 familles, dans l'ordre du style. */
export function ficheLevels(varietyId: string, scale: StyleScale): FicheLevel[] {
  const d = describeFamilies(varietyId);
  return scale.order.map((f) => ({ family: f, name: FAMILY_NAMES[f], status: scale.families[f].status,
    level: d[f].level === 'marqué' ? 2 : d[f].level === 'cité' ? 1 : 0, label: d[f].level, sources: d[f].sources, of: d[f].of }));
}
