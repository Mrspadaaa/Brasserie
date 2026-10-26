import { FAMILY_NAMES, type FamilyId } from './families';
import type { Profile } from './recipe';
import type { Tasting } from './tasting';
import type { VoieResult } from './voies';
import { valueVerdict, type GapVerdict } from './style/verdict';
import type { FamilyStatus, StyleScale } from './style/scale';

/** Lecture commune à toutes les vues : une entrée par famille, dans l'ordre canonique du style. */
export type ReadingVerdict = 'au style' | 'peu' | 'trop' | 'hors style' | 'incertain' | 'non situé';
export interface ReadingEntry {
  family: FamilyId; name: string; status: FamilyStatus;
  source: 'dégustation' | 'modèle' | 'non situé';
  verdict: ReadingVerdict;
  /** Verdict du seul repère central du modèle (null sans repère ou si la dégustation prime). */
  byCentral: ReadingVerdict | null;
  /** D'où vient le verdict : la classe perçue, la plage du modèle, ou son seul repère central. */
  verdictFrom: 'dégustation' | 'plage' | 'repère central' | null;
  /** Niveau dit par le brasseur, quand la dégustation prime. */
  perceived?: string;
}
const DECISIVE = ['au style', 'peu', 'trop', 'hors style'];

/** La dégustation prime ; sinon la plage du modèle si elle tranche, puis son repère central ; sinon « non situé ». */
export function readBeer(profile: Profile, tasting: Tasting | null, scale: StyleScale): ReadingEntry[] {
  return scale.order.map((f) => {
    const base = { family: f, name: FAMILY_NAMES[f], status: scale.families[f].status };
    const t = tasting?.axes.find((a) => a.family === f);
    if (t?.perceivedRange) {
      const v = valueVerdict({ range: t.perceivedRange }, scale.families[f]).verdict;
      return { ...base, source: 'dégustation', verdict: (DECISIVE.includes(v) ? v : 'incertain') as ReadingVerdict, byCentral: null, verdictFrom: 'dégustation', perceived: t.perceived! };
    }
    const e = profile[f];
    if (e.status === 'inconnu' || !e.situated) return { ...base, source: 'non situé', verdict: 'non situé', byCentral: null, verdictFrom: null };
    const v = valueVerdict({ range: e.range, central: e.central }, scale.families[f]);
    const byCentral = v.byCentral && DECISIVE.includes(v.byCentral) ? (v.byCentral as ReadingVerdict) : null;
    const fromRange = DECISIVE.includes(v.verdict);
    const verdict = (fromRange ? v.verdict : byCentral ?? 'incertain') as ReadingVerdict;
    return { ...base, source: 'modèle', verdict, byCentral, verdictFrom: fromRange ? 'plage' : byCentral ? 'repère central' : null };
  });
}

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;
/** Comptes par verdict et phrase canonique d'une ligne (aucun nombre supposé : tout est compté). */
export function readingSummary(reading: ReadingEntry[]) {
  const counts: Partial<Record<ReadingVerdict, number>> = {};
  for (const r of reading) counts[r.verdict] = (counts[r.verdict] ?? 0) + 1;
  const off = reading.filter((r) => ['trop', 'peu', 'hors style'].includes(r.verdict))
    .map((r) => `${r.name} ${r.verdict}${r.perceived ? ` ${r.perceived}` : ''}${r.source === 'modèle' ? ' (modèle)' : ''}`);
  const parts = [...off,
    ...(counts['au style'] ? [`${counts['au style']} au style`] : []),
    ...(counts.incertain ? [plural(counts.incertain, 'incertaine', 'incertaines')] : []),
    ...(counts['non situé'] ? [plural(counts['non situé'], 'non située', 'non situées')] : [])];
  return { counts, sentence: parts.join(' · ') };
}

/** Phrase de l'état « direction posée » : par famille visée, voies qui la font bouger dans le bon sens.
 * « faibles » : effet établi sous le seuil d'écart sensible de la famille dans le style. */
export function voiesSummary(result: VoieResult) {
  const rows = result.direction.map((d) => {
    const fs = result.style.families[d.family];
    const moving = result.voies.filter((v) => v.effect[d.family].established && Math.sign(v.effect[d.family].central ?? 0) === Math.sign(d.delta));
    const sensible = moving.filter((v) => Math.abs(v.effect[d.family].central!) >= fs.threshold).length;
    const weak = moving.length - sensible;
    const label = `${d.crans > 0 ? 'Plus' : 'Moins'} ${d.name.toLowerCase()}`;
    const text = sensible ? `${label} : ${plural(sensible, 'voie', 'voies')}${weak ? `, ${plural(weak, 'faible', 'faibles')}` : ''}`
      : weak ? `${label} : ${plural(weak, 'voie', 'voies')}, ${weak > 1 ? 'faibles' : 'faible'}` : `${label} : aucune voie`;
    return { family: d.family, label, sensible, weak, threshold: Math.round(fs.threshold * 10) / 10, text };
  });
  return { byFamily: rows, sentence: rows.map((r) => r.text).join(' · ') };
}

/** Résumé des verdicts d'écart entre houblons (S2). */
export function gapSummary(names: string[], pairs: { families: Record<string, Pick<GapVerdict, 'verdict' | 'why'>> }[]) {
  const counts: Record<string, number> = {};
  for (const p of pairs) for (const g of Object.values(p.families)) counts[`${g.verdict} (${g.why})`] = (counts[`${g.verdict} (${g.why})`] ?? 0) + 1;
  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  const families = pairs.length ? Object.keys(pairs[0].families).length : 0;
  const allSame = Object.keys(counts).length === 1;
  const who = names.length > 1 ? `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]}` : names.join('');
  const sentence = allSame ? `${who} : ${Object.keys(counts)[0]} sur les ${families} familles, pour les ${pairs.length} paires`
    : `${who} : ${Object.entries(counts).map(([k, n]) => `${n} ${k}`).join(' · ')} (sur ${total} comparaisons)`;
  return { counts, sentence };
}
