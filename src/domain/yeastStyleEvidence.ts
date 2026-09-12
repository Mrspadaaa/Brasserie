import type { HopSource } from '../../functions/src/hopIndexSchema';
import type { YeastCatalogueFact } from '../../functions/src/yeastCatalogueSchema';
import type { YeastReference } from './yeastReferences';
import { YEAST_RECIPE_PROFILES, type YeastRecipeGoal, type YeastStyleId } from '../data/yeastRecipeProfiles';

export type YeastStyleEvidenceOrigin = 'catalogue-styles' | 'catalogue-application' | 'catalogue-described-use' | 'curated-profile';
export interface YeastStyleMatch {
  styleId: YeastStyleId; source: HopSource; reported: string; origin: YeastStyleEvidenceOrigin; context?: string;
}
export interface YeastGoalMatch {
  goal: YeastRecipeGoal; source: HopSource; reported: string; context?: string;
  polarity: 'positive' | 'negative' | 'weak'; origin: 'catalogue' | 'curated-profile';
}
export interface YeastStyleEvidence {
  styles: YeastStyleId[]; styleMatches: YeastStyleMatch[]; exclusions: YeastStyleMatch[];
  goalReasons: Partial<Record<YeastRecipeGoal, { text: string; source: HopSource }>>;
  goalMatches: YeastGoalMatch[];
  descriptor?: string; descriptorSource?: HopSource;
  culture: 'yeast' | 'mixed' | 'bacteria' | 'other-fermentation' | 'unknown'; warnings: string[];
}

const profiles = new Map(YEAST_RECIPE_PROFILES.map(p => [p.yeastId, p]));
const displayText = (s: string) => s.replace(/<!--[\s\S]*?-->/g, '').replace(/<\/?[a-z][^>]*>/gi, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, ' ').trim();
const normalize = (s: string) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[’‘]/g, "'").replace(/[–—-]/g, ' ').toLowerCase();
type Mention = { styleId: YeastStyleId; start: number; end: number };
// Specific phrases consume their span before broader terms such as IPA or wheat.
// These are usage families, not genetic identity or a claim of sensory neutrality.
const stylePatterns: [YeastStyleId, RegExp][] = [
  ['sour', /\b(?:berliner\s+weiss(?:e|bier)?|gose|lambics?|g[u]?euze|gueuze|oud\s+bruin|flanders\s+(?:red|brown)(?:\s+ale)?|(?:american\s+|european\s+)?(?:sour|wild)\s+(?:ales?|beers?)|sours?)\b/g],
  ['american-wheat', /\b(?:american\s+(?:style\s+)?(?:wheat(?:\s+beers?)?|hefeweizen)|ble\s+americain|bieres?\s+de\s+ble\s+americain(?:e|es|s)?)\b/g],
  ['witbier', /\b(?:witbiers?|wit\s+beers?|belgian\s+(?:style\s+)?(?:wheat\s+beers?|wit)|blanches?\s+belges?|wit)\b/g],
  ['weissbier', /\b(?:german\s+(?:style\s+)?wheat(?:\s+beers?)?|bieres?\s+de\s+ble\s+allemand(?:e|es|s)?|weissbiers?|weizenbocks?|dunkelweizen|dunkles\s+weissbier|kristallweizen|hefeweizen|hefeweiss(?:e|bier)?|weizens?)\b/g],
  ['hazy-ipa', /\b(?:neipas?|new\s+england\s+(?:style\s+)?(?:ipas?|india\s+pale\s+ales?|pale\s+ales?)|hazy\s+(?:ipas?|india\s+pale\s+ales?|pale\s+ales?)|juicy\s+ipas?)\b/g],
  ['saison', /\bsaisons?\b/g],
  ['kolsch-alt', /\b(?:kolsch|altbiers?|alt\s+beers?)\b/g],
  ['stout-porter', /\b(?:stouts?|porters?)\b/g],
  ['belgian-ale', /\b(?:(?:strong\s+|dry\s+|malty\s+|pale\s+)?belgian\s+(?:style\s+)?(?:(?:golden|dark|pale|blond|blonde|strong|single)\s+)*(?:ales?|beers?|ipas?|styles?|golden\s+strong)|(?:pale\s+)?belgians|(?:belgian\s+)?(?:dubbels?|tripels?|triples?|quadrupels?|quadruples?)|abbey\s+ales?|biere(?:s)?\s+belge(?:s)?(?:\s+d'abbaye)?)\b/g],
  ['english-ale', /\b(?:(?:english|british|scottish)\s+(?:style\s+)?(?:strong\s+|brown\s+|pale\s+|old\s+)?(?:ales?|ipas?|bitters?)|(?:ordinary|best|strong|special)\s+bitters?|bitters?|esb|mild\s+ales?)\b/g],
  ['lager', /\b(?:lagers?|pils(?:e?ner)?s?|helles|marzen|maerzen|oktoberfest|festbier|schwarzbier|doppelbock|eisbock|bocks?|dunkel|vienna\s+lager|califor?nia\s+commons?|steam\s+beers?)\b/g],
  ['clean-ale', /\b(?:(?:american|west\s+coast)\s+(?:style\s+)?(?:ipas?|pale\s+ales?|ales?)|pale\s+american\s+ales?|(?:clean\s+(?:and\s+crisp\s+|focused\s+)?)ales?|cream\s+ales?|blond[e]?\s+ales?|pale\s+ales?|(?:brut|session|double|red)\s+ipas?|ipas?|india\s+pale\s+ales?)\b/g]
];

function mentions(raw: string): Mention[] {
  const s = normalize(raw), result: Mention[] = [];
  for (const [styleId, pattern] of stylePatterns) {
    pattern.lastIndex = 0;
    for (const match of s.matchAll(pattern)) {
      const start = match.index!, end = start + match[0].length;
      if (!result.some(m => start < m.end && end > m.start)) result.push({ styleId, start, end });
    }
  }
  return result.sort((a, b) => a.start - b.start);
}

const clauses = (raw: string) => normalize(raw).split(/[.;\n]|\b(?:but|however|whereas|mais|cependant)\b/).filter(Boolean);
function negativeUse(text: string): boolean {
  const s = text.replace(/\bnot\s+only\b/g, '').replace(/\bnon\s+(?:phenolic|diastatic)\b/g, '');
  return /\b(?:avoid|unsuitable|inappropriate|excluding|exclude[ds]?|except(?:\s+for)?|deconseille(?:e|s|es)?)\b/.test(s) ||
    /\b(?:not|never)\s+(?:(?:well|generally|normally|particularly)\s+)?(?:suitable|suited|recommended|intended|designed|appropriate|used|use|for|tested|evaluated)\b/.test(s) ||
    /\b(?:not|no|never)\s+(?:an?\s+|for\s+)?$/.test(s.trim()) ||
    /\b(?:pas|non)\s+(?:adapte|recommande|conseille|destine|pour|teste|evalue)/.test(s) || /\b(?:ne\s+convient\s+pas|pas\s+(?:aux?|pour\s+les?))\b/.test(s);
}
function negativeMention(clause: string, mention: Mention, found: Mention[]): boolean {
  const after = clause.slice(mention.end, found.find(n => n.start >= mention.end)?.start);
  return negativeUse(clause.slice(0, mention.start)) || /^\s*(?:are|is|n'est|ne\s+sont)?\s*(?:not\s+(?:recommended|suitable|supported)|deconseille)/.test(after);
}
function contextExcludes(context: string | undefined, styleId: YeastStyleId): boolean {
  if (!context) return false;
  const contexts = clauses(context), hasStyles = contexts.some(c => mentions(c).length);
  return contexts.some(c => {
    const found = mentions(c);
    return hasStyles ? found.some(m => m.styleId === styleId && negativeMention(c, m, found)) : negativeUse(c);
  });
}
const describedUse = (s: string) => /\b(?:used\s+(?:for|to|in)|use\s+(?:for|in)|(?:well\s+)?suited|suitable|ideal|designed|intended|recommended|built\s+for|great\s+for|great\s+option\s+for|excellent\s+for|works?\s+(?:well\s+|great\s+)?(?:in|for)|(?:producing|production\s+of|making|brewing)\s+|destinee?s?|convient|adaptee?s?|pour\s+(?:les?|une?s?|des?)\s+biere)/.test(s) ||
  /\b(?:german\s+wheat|american\s+wheat|hefeweizen|witbier|saison|lager|kolsch)\s+(?:ale\s+)?(?:yeast|strain|option)\b/.test(s);
function usageMatches(f: YeastCatalogueFact): { matches: YeastStyleMatch[]; exclusions: YeastStyleMatch[] } {
  const origin: YeastStyleEvidenceOrigin = f.key === 'styles' ? 'catalogue-styles' : f.key === 'application' ? 'catalogue-application' : 'catalogue-described-use';
  const result = { matches: [] as YeastStyleMatch[], exclusions: [] as YeastStyleMatch[] };
  const rawClauses = clauses(f.reported);
  for (const original of rawClauses) {
    // A comparison to another named product does not document the current product's use.
    const comparative = /\b(?:compared\s+to|similar\s+to|unlike|than|contrairement\s+a|equivalent)\b/.exec(original);
    const clause = f.key !== 'styles' && comparative ? original.slice(0, comparative.index) : original;
    if (f.key !== 'styles' && f.key !== 'application' && !describedUse(clause)) continue;
    const found = mentions(clause);
    for (const m of found) {
      const negative = negativeMention(clause, m, found) || contextExcludes(f.context, m.styleId);
      const item = { styleId: m.styleId, source: { ...f.source }, reported: f.reported, origin, ...(f.context ? { context: f.context } : {}) };
      (negative ? result.exclusions : result.matches).push(item);
    }
    // An unqualified wheat beer is not a positive German/Belgian/American choice.
    // A stated exclusion does, however, apply to all three wheat families.
    if (/\bwheat\s+beers?\b|\bbiere(?:s)?\s+de\s+ble\b/.test(clause) && negativeUse(clause.split(/wheat\s+beer|biere(?:s)?\s+de\s+ble/)[0])) {
      for (const styleId of ['weissbier', 'witbier', 'american-wheat'] as const) result.exclusions.push({ styleId, source: { ...f.source }, reported: f.reported, origin, ...(f.context ? { context: f.context } : {}) });
    }
  }
  return result;
}

function positiveComposition(text: string, pattern: RegExp): boolean {
  return [...text.matchAll(new RegExp(pattern.source, 'g'))].some(m => {
    const prefix = text.slice(Math.max(0, m.index! - 65), m.index!);
    return !/\b(?:not|no|without|sans|pas|aucun)\s+(?:\w+\s+){0,4}$/.test(prefix) && !/^\s+free\b/.test(text.slice(m.index! + m[0].length));
  });
}
function cultureType(reference: YeastReference): YeastStyleEvidence['culture'] {
  const facts = reference.catalogue?.facts ?? [];
  const species = normalize(facts.filter(f => f.key === 'species' || f.key === 'application' && /strain\s+type|culture|type/i.test(f.label)).map(f => f.reported).join(' '));
  const categories = normalize(reference.catalogue?.categories.join(' ') ?? '');
  const composition = normalize(facts.filter(f => ['species', 'application', 'aroma'].includes(f.key)).map(f => f.reported).join(' '));
  const mixed = positiveComposition(composition, /\b(?:blend|mixture|mix|melange)\s+of\s+(?:.{0,45}\s)?(?:yeasts?|strains?|saccharomyces|brettanomyces|bacteria)\b|\bmixed\s+(?:culture|yeast|fermentation)\b|\bmelange\s+de\s+(?:levures?|souches?|cultures?)\b/) || positiveComposition(categories, /\b(?:blends?|mixed\s+cultures?)\b/);
  const bacteria = positiveComposition(species, /\b(?:lactobacill\w*|lactiplantibacill\w*|lacticaseibacill\w*|pediococcus|oenococcus|bacteri\w*|lab)\b/) || positiveComposition(categories, /\bbacteria\b/);
  const yeast = positiveComposition(species, /\b(?:saccharomyces|saccharomycodes|brettanomyces|lachancea|torulaspora|hanseniaspora|pichia|metschnikowia|yeasts?|levures?)\b|\bs\.\s*(?:cerevisiae|pastorianus)\b/);
  const uses = normalize(facts.filter(f => f.key === 'styles' || f.key === 'application').map(f => f.reported).join(' ')).replace(/\bbarley\s+wine\b/g, 'barleywine');
  const nonBeer = /\b(?:wines?|vinification|white\s+wines?|red\s+wines?|vins?\s+(?:blanc|rouge)|distilling|distillation|cider|cidre|mead|hydromel|seltzer)\b/;
  const beerUse = positiveComposition(uses, /\b(?:beers?|bieres?|ales?|lagers?|ipa|weizen|witbier|saison|kolsch)\b/) || facts.some(f => ['styles', 'application'].includes(f.key) && usageMatches(f).matches.length > 0);
  if (!beerUse && (nonBeer.test(uses) || /\b(?:wine|distilling|oenolog\w*|winemaking)\b/.test(categories))) return 'other-fermentation';
  if (bacteria) return yeast ? 'mixed' : 'bacteria';
  if (mixed) return 'mixed';
  return yeast ? 'yeast' : 'unknown';
}

const goalPatterns: [YeastRecipeGoal, RegExp][] = [
  ['balanced', /\b(?:balanced|balance|equilibre|equilibree?)\b/],
  ['banana', /\bbanan(?:a|as|e|es)\b/],
  ['clove', /\b(?:cloves?|girofle|spicy|spices?|peppery?|poivre|epice[es]?|phenolics?|phenoliques?)\b/],
  ['fruit', /\b(?:fruity|fruit(?:s|e|ee|es)?|tropical(?!\s+(?:environment|climate|region))|apricot|peach|pear|plum|cherry|pineapple|citrus|abricot|peche|poire|prune|cerise|ananas|agrumes|esters?)\b/],
  ['clean', /\b(?:clean|neutral|neutre|net|nette|discret|discrete)\b|\b(?:low|minimal|little|faible|peu\s+d')\s+esters?\b/],
  ['dry', /\bdry\b(?!\s+(?:yeast|pitch|strain|hopp))|\b(?:finale|finition)\s+seche\b|\bsecheresse\b/],
  ['hops', /\b(?:hoppy|hop\s+(?:forward|accentuating)|(?:accentuates?|enhances?)\s+(?:the\s+)?hop|expression\s+(?:des?\s+)?houblons?|souligne\w*\s+.{0,35}houblon)/]
];
function goalObservations(f: YeastCatalogueFact): YeastGoalMatch[] {
  if (!['aroma', 'esters'].includes(f.key)) return [];
  const s = normalize(f.reported), result: YeastGoalMatch[] = [];
  if (/\b(?:acetaldehyde|off\s+flavou?r|unwanted|undesirable|defauts?)\b/.test(s)) return [];
  for (const [goal, pattern] of goalPatterns) {
    const match = pattern.exec(s); if (!match) continue;
    const local = s.slice(Math.max(s.lastIndexOf(',', match.index), s.lastIndexOf(';', match.index), s.lastIndexOf(' but ', match.index)) + 1, match.index);
    const negativePrefix = s.slice(Math.max(s.lastIndexOf(';', match.index), s.lastIndexOf(' but ', match.index), s.lastIndexOf(' mais ', match.index)) + 1, match.index).replace(/,/g, ' ');
    const negative = /\b(?:no|not|without|non|sans|aucun|absence\s+de)\s+(?:\w+\s+){0,5}$/.test(negativePrefix) || /^\s*(?:free|absent)\b/.test(s.slice(match.index + match[0].length));
    const weak = ['banana', 'clove', 'fruit'].includes(goal) && /\b(?:low|little|minimal|slight|slightly|subtle|delicate|faint|less|lower|reduced|faible|peu|leger|legers|legere|discret)\s+(?:\w+\s+){0,3}$/.test(local);
    result.push({ goal, source: { ...f.source }, reported: f.reported, ...(f.context ? { context: f.context } : {}), polarity: negative ? 'negative' : weak ? 'weak' : 'positive', origin: 'catalogue' });
  }
  return result;
}
const unique = <T>(rows: T[]) => [...new Map(rows.map(row => [JSON.stringify(row), row])).values()];

/** Documentary usage adapter. It never reads the commercial name, aliases or laboratory equivalents to infer a style. */
export function yeastStyleEvidence(reference: YeastReference): YeastStyleEvidence {
  const facts = reference.catalogue?.facts ?? [], profile = profiles.get(reference.id), culture = cultureType(reference);
  const warnings: string[] = [], matches: YeastStyleMatch[] = [], exclusions: YeastStyleMatch[] = [];
  for (const f of facts) {
    if (!['styles', 'application', 'aroma'].includes(f.key)) continue;
    const observed = usageMatches(f); matches.push(...observed.matches); exclusions.push(...observed.exclusions);
  }
  const hasUsage = facts.some(f => f.key === 'styles') || matches.length > 0;
  if (!hasUsage && profile) for (const styleId of profile.styles) matches.push({ styleId, source: { ...profile.source }, reported: profile.descriptor, origin: 'curated-profile' });
  const excluded = new Set(exclusions.map(e => e.styleId));
  if (matches.some(m => excluded.has(m.styleId))) warnings.push('Des usages affirmés et exclus coexistent : les familles en conflit restent retirées de la sélection automatique. Consulter les sources et leurs conditions.');
  const eligible = matches.filter(m => !excluded.has(m.styleId));
  if (!eligible.length && reference.catalogue?.categories.some(c => mentions(c).length)) warnings.push('Des catégories de catalogue existent, mais leur provenance par catégorie n’est pas enregistrée. Elles ne remplacent pas un fait de style ou d’usage sourcé.');
  if (culture === 'bacteria' || culture === 'other-fermentation') {
    warnings.push(culture === 'bacteria' ? 'Culture bactérienne documentée : elle ne remplace pas la levure de fermentation principale.' : 'Usage vin, cidre, hydromel, distillation ou seltzer documenté sans usage de bière précis.');
    exclusions.push(...eligible); eligible.length = 0;
  } else if (culture === 'mixed') warnings.push('Mélange ou culture mixte documenté : vérifier sa composition, son rôle et le procédé ; aucun remplacement par une souche pure n’est supposé.');
  const goalMatches = facts.flatMap(goalObservations), goalReasons: YeastStyleEvidence['goalReasons'] = {};
  for (const [goal] of goalPatterns) {
    if (culture === 'bacteria' || culture === 'other-fermentation') continue;
    const observations = goalMatches.filter(m => m.goal === goal), affirmed = observations.find(m => m.polarity === 'positive');
    if (affirmed && !observations.some(m => m.polarity === 'negative')) {
      goalReasons[goal] = { text: `Description à comparer : ${displayText(affirmed.reported)}${affirmed.context ? ` Contexte : ${displayText(affirmed.context)}` : ''} Aucun gain d’intensité n’est calculé.`, source: { ...affirmed.source } };
    } else if (!observations.length && profile?.affinities[goal] && !facts.some(f => f.key === 'aroma' || f.key === 'esters')) {
      goalReasons[goal] = { text: profile.affinities[goal]!, source: { ...profile.source } };
      goalMatches.push({ goal, source: { ...profile.source }, reported: profile.affinities[goal]!, polarity: 'positive', origin: 'curated-profile' });
    }
    if (affirmed && observations.some(m => m.polarity === 'negative')) warnings.push(`Descriptions contradictoires pour « ${goal} » : aucun motif préférentiel n’est retenu.`);
  }
  const cloveDescription = goalMatches.some(m => m.goal === 'clove' && m.polarity === 'positive' && /\b(?:cloves?|girofle|phenolics?|phenoliques?)\b/.test(normalize(m.reported)));
  const pofNegative = facts.some(f => f.key === 'pof' && /^(?:no|non|negative|negatif|pof\s+negative|pof\s+negatif)$/.test(normalize(f.reported).trim()));
  if (cloveDescription && pofNegative) warnings.push('Un descriptif girofle/phénolique coexiste avec un statut POF négatif. Ces données sont conservées séparément : ce motif ne justifie pas un repos férulique ou une hausse de phénols prédite.');
  // A useful description may itself name the beer style (e.g. "Bright, Crisp, Kölsch").
  const aroma = facts.find(f => f.key === 'aroma' && !mentions(f.reported).length) ?? facts.find(f => f.key === 'aroma');
  const descriptor = aroma ? `${displayText(aroma.reported)}${aroma.context ? ` (${displayText(aroma.context)})` : ''}` : !facts.some(f => f.key === 'aroma') ? profile?.descriptor : undefined;
  return { styles: [...new Set(eligible.map(m => m.styleId))], styleMatches: unique(matches), exclusions: unique(exclusions), goalReasons,
    goalMatches: unique(goalMatches), culture, warnings,
    ...(descriptor ? { descriptor, descriptorSource: { ...(aroma?.source ?? profile!.source) } } : {}) };
}
