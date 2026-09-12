import type { HopRange, HopSource } from '../../functions/src/hopIndexSchema';
import type { HopKnowledge, HopYeast } from '../../functions/src/hopPredictionSchema';
import type { NoloProcess, NoloScience, NoloStrain } from '../../functions/src/noloSchema';
import { agreedFermentationFact } from '../../functions/src/fermentationContext';
import type { TrialRecipe } from './hopIndex/trials';
import { yeastReferences, type YeastReference } from './yeastReferences';
import { resolveFermentationYeast } from './fermentationScenario';
import processData from '../data/noloProcessYeasts.json';

export interface NoloYeastCandidate {
  strain: NoloStrain;
  /** Documentary process fit and the remaining limitation, not a predicted flavour intensity. */
  reason: string;
  family: 'restricted' | 'conventional';
  form?: HopYeast['form'];
}
type Profile = keyof typeof processData.profiles;
const additions = processData.additionalStrains as Array<{
  strain: NoloStrain; form: HopYeast['form']; family: NoloYeastCandidate['family']; profile: Profile;
}>;
const profiles = new Map<string, Profile>(Object.entries(processData.profiles).flatMap(([profile, ids]) =>
  ids.map(id => [id, profile as Profile] as const)));
const extraById = new Map(additions.map(row => [row.strain.yeastId, row]));
const sources = processData.sources as Record<keyof typeof processData.sources, HopSource>;
export const noloYeastProcessSources = sources;
const plain = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const unknownSugars: NoloStrain['sugars'] = {
  glucose: 'unknown', fructose: 'unknown', sucrose: 'unknown', maltose: 'unknown', maltotriose: 'unknown',
};
const copyRange = (r?: HopRange | null): HopRange | null => r ? { ...r } : null;

function pofFact(y: YeastReference): NoloStrain['pof'] {
  const reported = y.catalogue?.facts.filter(f => f.key === 'pof').map(f => plain(f.reported).trim()) ?? [];
  const value = (s: string) => /^(?:pof\s*)?(?:negative?|negatif|[-–−])\.?$/.test(s) ? 'negative'
    : /^(?:pof\s*)?(?:positive?|positif|\+)\.?$/.test(s) ? 'positive' : 'unknown';
  const values = reported.map(value);
  return values.length && values.every(v => v === values[0]) ? values[0] : 'unknown';
}

/** Convert only concordant, qualified catalogue ranges. A missing bound, a
 * conflicting source or a non-beer context never becomes a universal number. */
function conventionalStrain(y: YeastReference): NoloStrain {
  const attenuation = agreedFermentationFact(y, 'attenuation', '%');
  const temperature = agreedFermentationFact(y, 'temperature', '°C');
  const pitch = agreedFermentationFact(y, 'pitchRate', 'g/hL');
  const fallback = extraById.get(y.id)?.strain;
  const gaps = [!attenuation && 'atténuation', !temperature && 'température'].filter(Boolean);
  return {
    yeastId: y.id, name: y.name, aliases: [...y.aliases ?? []],
    sugars: { ...fallback?.sugars ?? unknownSugars }, hydrolysis: 'unknown', pof: pofFact(y),
    attenuationPct: copyRange(attenuation?.range), temperatureC: copyRange(temperature?.range),
    durationDays: null,
    // Liquid cell counts cannot be converted to dry mass. Even a personal
    // catalogue mass rate is used only when the product form is explicitly dry.
    pitchGL: y.form === 'sèche' && pitch ? { min: pitch.range.min / 100, max: pitch.range.max / 100 } : null,
    aroma: [...new Set(y.catalogue?.facts.filter(f => f.key === 'aroma').map(f => f.reported) ?? [])],
    limitation: 'Plages de fermentation classique : le moût peu fermentescible ou récupéré peut s’en écarter. '
      + 'Durée non déduite d’une plage de température. '
      + (gaps.length ? `Références absentes ou non concordantes : ${gaps.join(', ')}. ` : '')
      + (fallback?.limitation ?? ''),
    availability: y.catalogue?.status === 'unknown' ? 'Disponibilité non établie dans le catalogue.' : 'Vérifier disponibilité et format auprès du fabricant.',
    source: structuredClone(attenuation?.source ?? temperature?.source ?? y.source),
  };
}

function currentYeastId(recipe: TrialRecipe, references: YeastReference[]): string | undefined {
  return recipe.yeast.hopIndexId ?? resolveFermentationYeast(recipe, references)?.id;
}
function profileMatchesRecipe(recipe: TrialRecipe, profile?: Profile): boolean {
  const query = plain(`${recipe.style ?? ''} ${recipe.fermentationIntent?.aroma ?? ''}`);
  if (profile === 'lager') return /lager|pils|helles|bock|marzen|dunkel|vienna/.test(query);
  if (profile === 'wheat') return /wheat|weiz|blanche|\bwit|ble|banane|girofle/.test(query)
    || ['banana', 'clove', 'balanced'].includes(recipe.nolo?.orientation ?? '');
  if (profile === 'belgian' || profile === 'diastatic') return /saison|belg|abbaye|tripel|dubbel/.test(query);
  if (profile === 'fruity') return /ipa|houblon|hazy|fruit|abricot|tropic/.test(query);
  if (profile === 'lowAttenuation') return /mild|bitter|porter|stout|brown|english|anglai|rond|corps/.test(query);
  return /neutr|clean|propre|pale ale|blonde/.test(query);
}
const restrictedProcess = (p: NoloProcess) => p === 'restricted' || p === 'restored';
const extractProcess = (p: NoloProcess) => p === 'lowExtract' || p === 'coldExtraction' || p === 'secondRunnings';

function processReason(process: NoloProcess, strain: NoloStrain, profile?: Profile): string {
  if (restrictedProcess(process)) return process === 'restored'
    ? 'Souche maltose négative pour la base à fermentation limitée ; compter ensuite l’alcool et les sucres des ajouts aromatiques.'
    : 'Maltose non fermenté : adaptée à la fermentation limitée. L’alcool dépend des sucres simples du moût.';
  if (process === 'coldContact') return 'Candidate lager pour un essai de contact proche de 0 °C. '
    + 'L’atténuation préremplie est une hypothèse de pilote. Les repères fabricant de fermentation complète ne valident pas le contact à froid. '
    + 'Les résultats de la souche A15 de l’étude ne sont pas ceux de cette souche.';
  if (process === 'arrested') return 'Souche de fermentation classique ; piloter l’arrêt par la chute de densité et l’analyse d’alcool. '
    + 'La durée ou la floculation ne prouvent pas l’arrêt ; prévoir séparation ou stabilisation.';
  if (process === 'dealcoholized') return 'Fermente la bière mère avant retrait d’alcool. '
    + 'Choisir le profil de la recette ; la rétention des arômes dépendra du procédé de désalcoolisation.';
  const wort = process === 'coldExtraction' ? 'moût obtenu par extraction à froid'
    : process === 'secondRunnings' ? 'moût réellement récupéré au second rinçage' : 'moût à faible extrait';
  return (strain.yeastId === 'lalbrew-windsor' ? 'Maltotriose négative, citée par Lallemand pour limiter la fermentescibilité. '
    : profile === 'lowAttenuation' ? 'Atténuation classique modérée, à comparer pour conserver du corps. ' : 'Fermentation classique après réduction de l’extrait. ')
    + `Calibrer l’atténuation sur le ${wort} ; la souche seule ne garantit pas la cible alcoolique.`;
}

/** Process-aware proposals. The six maltose-negative references are not offered
 * as default mother-beer yeasts. Cold contact has its own experimental lager
 * pool; other conventional candidates are ranked by wort/recipe intent.
 *
 * A frozen strain keeps its exact documentary values. New choices may still be
 * compared against it; applying a new choice must freeze that candidate too.
 * Invalid/discontinued saved references mask defaults unless already frozen.
 * Nothing here mutates the recipe, catalogue or science edition. */
export function noloYeastCandidates(recipe: TrialRecipe, science: NoloScience, saved: HopKnowledge[] = []): NoloYeastCandidate[] {
  const process = recipe.nolo?.process ?? 'restricted';
  const references = yeastReferences(saved);
  const referenceById = new Map(references.map(y => [y.id, y]));
  const personalIds = new Set(saved.filter(y => y.kind === 'yeast').map(y => y.id));
  const frozen = recipe.nolo?.scienceSnapshot;
  const edition = frozen ?? science;
  const frozenById = new Map(frozen?.strains.map(s => [s.yeastId, s]) ?? []);
  const blocked = (id: string) => !frozenById.has(id) && (personalIds.has(id) && !referenceById.has(id)
    || referenceById.get(id)?.catalogue?.status === 'discontinued');
  const rows = new Map<string, { strain: NoloStrain; form?: HopYeast['form']; family: NoloYeastCandidate['family']; profile?: Profile }>();
  for (const extra of additions) {
    if (blocked(extra.strain.yeastId)) continue;
    const personal = personalIds.has(extra.strain.yeastId) ? referenceById.get(extra.strain.yeastId) : undefined;
    // A saved conventional catalogue remains authoritative, including missing
    // or conflicting facts. Restricted sugar biology stays with its science.
    rows.set(extra.strain.yeastId, { ...extra, ...(personal && extra.family === 'conventional'
      ? { strain: conventionalStrain(personal), form: personal.form } : {}) });
  }
  for (const [id, profile] of profiles) {
    const y = referenceById.get(id);
    if (blocked(id) || !y || rows.has(id)) continue;
    rows.set(id, { strain: conventionalStrain(y), form: y.form, family: 'conventional', profile });
  }
  for (const strain of edition.strains) {
    if (blocked(strain.yeastId)) continue;
    const known = rows.get(strain.yeastId);
    const family = strain.sugars.maltose === 'no' ? 'restricted' : 'conventional';
    rows.set(strain.yeastId, { strain, family, profile: known?.profile ?? profiles.get(strain.yeastId),
      form: referenceById.get(strain.yeastId)?.form ?? known?.form
        ?? (strain.yeastId.startsWith('white-labs-wlp') ? 'liquide' : undefined) });
  }
  const selectedId = currentYeastId(recipe, references);
  const query = plain(recipe.fermentationIntent?.aroma ?? '').split(/[^a-z]+/).filter(w => w.length >= 4);
  const score = (row: typeof rows extends Map<string, infer T> ? T : never) => {
    let score = row.strain.yeastId === selectedId ? 10 : 0;
    // Prefer a documented starting programme when no flavour preference or
    // existing compatible yeast decides the choice. This is not confidence.
    score += (row.strain.attenuationPct ? 2 : 0) + (row.strain.durationDays ? 2 : 0) + (row.strain.pitchGL ? 1 : 0);
    if (profileMatchesRecipe(recipe, row.profile)) score += 40;
    const aroma = plain(row.strain.aroma.join(' '));
    score += query.filter(word => aroma.includes(word)).length * 8;
    if (['clove', 'balanced'].includes(recipe.nolo?.orientation ?? '') && row.strain.pof === 'positive') score += 20;
    if (extractProcess(process)) {
      if (row.strain.yeastId === 'lalbrew-windsor') score += 32;
      else if (row.profile === 'lowAttenuation') score += 15;
    }
    if (process === 'arrested') {
      const flocculation = referenceById.get(row.strain.yeastId)?.catalogue?.facts.filter(f => f.key === 'flocculation').map(f => plain(f.reported)).join(' ') ?? '';
      if (/high|haute|elevee/.test(flocculation)) score += 10;
      if (/low|faible/.test(flocculation)) score -= 5;
    }
    return score;
  };
  return [...rows.values()].filter(row => {
    if (restrictedProcess(process)) return row.family === 'restricted' && row.strain.sugars.maltose === 'no';
    if (row.family !== 'conventional') return false;
    if (process === 'coldContact') return row.profile === 'lager';
    if (process === 'arrested') return ['lowAttenuation', 'neutral', 'fruity', 'lager'].includes(row.profile ?? '')
      || row.strain.yeastId === selectedId && row.profile !== 'diastatic';
    // Diastatic strains can be considered for an intentionally fully fermented
    // mother beer. They are not proposed to retain dextrins in low-extract beer.
    return process === 'dealcoholized' || row.profile !== 'diastatic';
  }).sort((a, b) => score(b) - score(a))
    .map(row => ({ strain: structuredClone(row.strain), family: row.family, ...(row.form ? { form: row.form } : {}),
      reason: processReason(process, row.strain, row.profile) }));
}
