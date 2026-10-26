import { AXES } from './data';
import { FAMILIES, type FamilyId } from './families';
import type { Profile } from './recipe';
import { valueVerdict, type ValueVerdict } from './style/verdict';
import type { StyleScale } from './style/scale';

/** Niveau perçu par le brasseur, sur les classes des axes V5.5 (faible ≤ lowMax < moyen ≤ mediumMax < marqué). */
export type PerceivedLevel = 'faible' | 'moyen' | 'marqué';
export interface TastingAxis {
  family: FamilyId;
  /** null : le brasseur n'a rien dit de cette famille. Aucune valeur n'est inventée. */
  perceived: PerceivedLevel | null;
  /** Plage qu'enregistrerait HopTasting.axes[].perceived dans l'app (classe de l'axe), ou null. */
  perceivedRange: { min: number; max: number } | null;
  source: string | null;
}
export interface Tasting {
  origin: string; date: string; quote: string | null; axes: TastingAxis[];
  /** Brassin dégusté, si la donnée existe (sinon la mention cite la phrase du brasseur). */
  batch?: { id: string; date: string } | null;
}
/** Mention d'origine d'un niveau dégusté : « brassin du … » si le brassin est connu, sinon la phrase datée. */
export function tastingMention(t: Tasting): string {
  const d = (iso: string) => { const [, m, day] = iso.split('-'); return `${day}.${m}`; };
  return t.batch ? `brassin du ${d(t.batch.date)}` : `dégustation du brasseur, ${d(t.date)}${t.quote ? ` : « ${t.quote} »` : ''}`;
}

/** Classe de l'axe V5.5 pour un niveau perçu (convention de l'app : lowMax, mediumMax). */
export function levelRange(family: FamilyId, level: PerceivedLevel): { min: number; max: number } {
  const a = AXES.find((x) => x.id === family)!;
  return level === 'faible' ? { min: a.scale.min, max: a.lowMax } : level === 'moyen' ? { min: a.lowMax, max: a.mediumMax } : { min: a.mediumMax, max: a.scale.max };
}

/** Saisie de dégustation : seulement ce que le brasseur a dit lui-même. */
export function tastingFrom(said: Partial<Record<FamilyId, PerceivedLevel>>, meta: { origin: string; date: string; quote: string | null; source: string }): Tasting {
  return { origin: meta.origin, date: meta.date, quote: meta.quote,
    axes: FAMILIES.map((f) => (said[f] ? { family: f, perceived: said[f]!, perceivedRange: levelRange(f, said[f]!), source: meta.source } : { family: f, perceived: null, perceivedRange: null, source: null })) };
}

export interface SituatedFamily {
  family: FamilyId;
  /** D'où vient la position : la dégustation d'abord, le repère central du modèle en appui, sinon « non situé ». */
  basis: 'dégustation' | 'modèle' | 'non situé';
  range: { min: number; max: number } | null;
  central?: number;
  verdict: ValueVerdict;
}
/** Situe la bière famille par famille : perception du brasseur d'abord, modèle en appui. */
export function situateBeer(profile: Profile, tasting: Tasting | null, scale: StyleScale): Record<FamilyId, SituatedFamily> {
  return Object.fromEntries(FAMILIES.map((f) => {
    const t = tasting?.axes.find((a) => a.family === f);
    if (t?.perceivedRange) return [f, { family: f, basis: 'dégustation', range: t.perceivedRange, verdict: valueVerdict({ range: t.perceivedRange }, scale.families[f]).verdict }];
    const e = profile[f];
    if (e.status === 'inconnu' || !e.situated) return [f, { family: f, basis: 'non situé', range: null, verdict: e.status === 'inconnu' ? 'inconnu' : 'incertain' }];
    const v = valueVerdict({ range: e.range, central: e.central }, scale.families[f]);
    return [f, { family: f, basis: 'modèle', range: e.range, ...(e.central !== undefined ? { central: e.central } : {}), verdict: v.byCentral ?? v.verdict }];
  })) as Record<FamilyId, SituatedFamily>;
}

export const TASTING_USAGE = [
  'La dégustation situe la bière : une famille notée prend la classe perçue (faible, moyen, marqué = classes des axes V5.5) ; le modèle ne la remplace pas.',
  'Sans note du brasseur, le repère central du modèle sert d’appui s’il existe ; sinon la famille reste « non située ».',
  'Le verdict au style d’une famille notée se lit sur la classe perçue (résine marquée face à une bande neutre 0–30 : trop).',
  'Les voies ne changent pas : le moteur ne prédit que le sens d’une voie et son ampleur relative en crans ; la position de départ vient de la dégustation.',
  'Après la voie posée, une nouvelle dégustation remplace l’ancienne ; l’écart perçu − prévu se lit comme dans l’app (compareHopTasting).',
];
