import { availableHopUses } from '../../domain/hopDecision/substitution';
import { answerHopDecision, type HopDecisionIntent, type HopDecisionResponse } from '../../domain/hopDecision/service';
import { previewHopProgramChanges } from '../../domain/hopDecision/programs';
import type { HopAdviceSituation } from '../../domain/hopDecision/adviceSchema';
import type {
  HopDecisionMaterial,
  HopDecisionProgram,
  HopProgramAddition,
  HopProgramChange,
  HopReplacementBasis,
  HopUse,
} from '../../domain/hopDecision/types';
import type { BrewingScenarioBranchRequest, BrewingScenarioRuntimeCurrent } from '../../domain/brewingScenario';
import type { HopV55ProgramOperationV1, HopV55ProgramScopeV1 } from './decisionProgramPreparation';
import type { HopV55QuestionSourceRange } from './decision';

interface QuantityMatch {
  start: number;
  end: number;
  raw: string;
  unit: 'g' | 'kg';
  grams: number;
}

interface OperationParseInput {
  question: string;
  normalized: string;
  sourceRanges: readonly HopV55QuestionSourceRange[];
  materialMentions?: readonly { start: number; end: number }[];
}

function originalSpan(question: string, sourceRanges: readonly HopV55QuestionSourceRange[], start: number, end: number) {
  const first = sourceRanges[start], last = sourceRanges[end - 1];
  if (!first || !last || end <= start) return undefined;
  return { start: first.start, end: last.end, text: question.slice(first.start, last.end) };
}

function trimmedSpan(span: { start: number; end: number; text: string }) {
  const text = span.text.trim();
  if (!text) return undefined;
  const leading = span.text.indexOf(text);
  return { start: span.start + leading, end: span.start + leading + text.length, text };
}

function quantityFromMatch(match: RegExpMatchArray): QuantityMatch | undefined {
  const quantityToken = /\b(\d+(?:[.,]\d+)?)\s*(kg|g)\b/u.exec(match[0]);
  if (!quantityToken) return undefined;
  const raw = quantityToken[1], unit = quantityToken[2] as 'g' | 'kg';
  const value = Number(raw.replace(',', '.'));
  const grams = value * (unit === 'kg' ? 1000 : 1);
  if (!Number.isFinite(grams) || grams <= 0) return undefined;
  const start = (match.index ?? 0) + (quantityToken.index ?? 0);
  return { start, end: start + quantityToken[0].length, raw, unit, grams };
}

function explicitUse(text: string, start: number, end: number): HopUse | undefined {
  const excerpt = text.slice(start, end);
  const candidates: Array<{ use: HopUse; pattern: RegExp }> = [
    { use: 'firstWort', pattern: /\b(?:first\s+wort|premier\s+mout|premiere\s+mo[uû]t)\b/u },
    { use: 'boil', pattern: /\b(?:a\s+l\s+)?ebullition\b|\bboil(?:ing)?\b/u },
    { use: 'whirlpool', pattern: /\b(?:whirlpool|hop\s+stand|tourbillon)\b/u },
    { use: 'fermentation', pattern: /\b(?:pendant|durant|en)\s+(?:la\s+)?fermentation(?:\s+active)?\b|\bduring\s+(?:active\s+)?fermentation\b/u },
    { use: 'postFermentation', pattern: /\b(?:apres|post)\s+(?:la\s+)?fermentation\b|\bafter\s+fermentation\b/u },
  ];
  const found = candidates.filter(candidate => candidate.pattern.test(excerpt));
  return found.length === 1 ? found[0].use : undefined;
}

function explicitScope(text: string, start: number, end: number): HopV55ProgramScopeV1 | undefined {
  const excerpt = text.slice(start, end);
  if (/\b(?:dry\s*hop(?:ping)?|a\s+cru|a\s+froid|cold\s+side|fermentation|cold\s+ferment)\b/u.test(excerpt)) return 'coldSide';
  if (/\b(?:dans\s+(?:(?:le|la|l|les|du|de)\s+)?(?:mout|wort)|cote\s+(?:mout|mo[uû]t)|first\s+wort|premier\s+mo[uû]t|ebullition|boil|whirlpool|hop\s+stand|tourbillon)\b/u.test(excerpt)) return 'hotSide';
  return undefined;
}

function isNegatedOperation(text: string, start: number): boolean {
  const before = text.slice(Math.max(0, start - 36), start);
  return /\b(?:ne\s+(?:veux|souhaite|peux|faut)?\s*pas|ne\s+jamais|pas|not|never|no|without|sans)\s*$/u.test(before);
}

function isOpenVagueAddition(input: OperationParseInput, start: number, end: number, suffix: string,
  hasQuantity: boolean, use?: HopUse, scope?: HopV55ProgramScopeV1): boolean {
  if (hasQuantity || use || scope || input.materialMentions?.some(row => row.start >= start && row.end <= end)) return false;
  const prefix = input.normalized.slice(Math.max(0, start - 128), start);
  const openPossibility = /\b(?:est\s+ce\s+que\s+je\s+(?:peux|pourrais)|je\s+(?:peux|pourrais|voudrais|souhaiterais)|can\s+i|could\s+i|may\s+i|might\s+i|would\s+i|compare|comparer)\b/u.test(prefix);
  if (!openPossibility) return false;
  const vagueComplement = /\b(?:autre\s+chose|quelque\s+chose(?:\s+d\s+autre)?|something\s+else|anything\s+else|another\s+thing|other\s+thing)\b/gu;
  const match = vagueComplement.exec(suffix);
  if (!match) return false;
  const trailing = suffix.slice(match.index + match[0].length);
  const filler = new Set(['a', 'au', 'aux', 'avec', 'de', 'd', 'des', 'du', 'en', 'for', 'le', 'la', 'les', 'like', 'of', 'the', 'to', 'un', 'une', 'with']);
  const meaningfulTail = (trailing.match(/[\p{L}\p{N}]+/gu) ?? []).filter(word => !filler.has(word));
  return meaningfulTail.length === 0;
}

function operationId(kind: HopV55ProgramOperationV1['kind'], span: { start: number; end: number }): string {
  return `question-op-${kind}-${span.start}-${span.end}`;
}

function clauseEnd(text: string, start: number): number {
  let punctuationEnd = text.length;
  for (let index = start; index < text.length; index++) {
    const character = text[index];
    if (['.', '!', '?', ';'].includes(character)) { punctuationEnd = index; break; }
    if (character === ',') {
      const decimalComma = /\d/u.test(text[index - 1] ?? '') && /\d/u.test(text[index + 1] ?? '');
      if (!decimalComma) { punctuationEnd = index; break; }
    }
  }
  const suffix = text.slice(start, punctuationEnd);
  const nextOperation = /\b(?:et\s+)?(?:retirer|enlever|supprimer|ajouter|ajoute|add|faire|pratiquer)\b/u.exec(suffix);
  return Math.min(punctuationEnd, nextOperation && nextOperation.index > 0 ? start + nextOperation.index : text.length);
}

function buildPartialRemoval(input: OperationParseInput, match: RegExpMatchArray,
  quantity: QuantityMatch, usedRanges: Set<string>): HopV55ProgramOperationV1 | undefined {
  const start = match.index ?? 0;
  const end = start + match[0].length;
  const span = originalSpan(input.question, input.sourceRanges, start, end);
  if (!span) return undefined;
  const key = `${quantity.start}:${quantity.end}`;
  if (usedRanges.has(key)) return undefined;
  usedRanges.add(key);
  const sourceScope = explicitScope(input.normalized, start, end);
  return {
    id: operationId('remove', span),
    label: span.text,
    kind: 'remove',
    quantity: { kind: 'partial', grams: quantity.grams },
    ...(sourceScope ? { sourceScope } : {}),
    sourceSpan: span,
  };
}

/** Reads only explicitly worded operation fragments. It never prepares a branch. */
export function readHopV55ProgramOperationDrafts(input: OperationParseInput): HopV55ProgramOperationV1[] {
  const operations: HopV55ProgramOperationV1[] = [];
  const usedRemovalRanges = new Set<string>();
  const unavailable = /\b(?:indisponible|(?:(?:actuellement|currently)\s+)?pas\s+(?:(?:actuellement|currently)\s+)?disponible|out\s+of\s+stock|not\s+available|rupture\s+de\s+stock)\b/gu;
  const replacementQuestion = /\b(?:avec\s+quoi\s+(?:le\s+)?remplacer|par\s+quoi\s+(?:le\s+)?remplacer|what\s+to\s+replace)\b/gu;
  for (const status of input.normalized.matchAll(unavailable)) {
    const statusStart = status.index ?? 0;
    const sameSentence = input.normalized.slice(statusStart).split(/[.!?;]/u)[0] ?? '';
    const request = [...sameSentence.matchAll(new RegExp(replacementQuestion.source, 'gu'))].at(0);
    if (!request) continue;
    const end = statusStart + (request.index ?? 0) + request[0].length;
    const rawSpan = originalSpan(input.question, input.sourceRanges, statusStart, end);
    const span = rawSpan && trimmedSpan(rawSpan);
    if (!span) continue;
    operations.push({ id: operationId('replaceUnavailable', span), label: span.text, kind: 'replaceUnavailable', sourceSpan: span });
  }

  const replaceVerb = /\b(?:remplacer|remplace|replace)\b/gu;
  for (const verb of input.normalized.matchAll(replaceVerb)) {
    const start = verb.index ?? 0;
    if (isNegatedOperation(input.normalized, start)) continue;
    const end = clauseEnd(input.normalized, start + verb[0].length);
    const suffix = input.normalized.slice(start + verb[0].length, end);
    const connector = /\b(?:par|by|with)\b/u.exec(suffix);
    if (!connector || !suffix.slice(0, connector.index).trim() || !suffix.slice(connector.index + connector[0].length).trim()) continue;
    const rawSpan = originalSpan(input.question, input.sourceRanges, start, end);
    const span = rawSpan && trimmedSpan(rawSpan);
    if (!span) continue;
    if (operations.some(operation => operation.kind === 'replace' && operation.sourceSpan?.start === span.start)) continue;
    // The source and target names stay verbatim in the fragment. Resolving either
    // to an ID, line, quantity or material choice belongs to the typed editor.
    operations.push({ id: operationId('replace', span), label: span.text, kind: 'replace', sourceSpan: span });
  }

  const less = /\b(\d+(?:[.,]\d+)?)\s*(kg|g)\s+(?:(?:de|en)\s+)?moins\b(?:\s+(?:dans|cote)\s+(?:(?:le|la|l|les|du|de)\s+)?(?:mout|wort))?/gu;
  for (const match of input.normalized.matchAll(less)) {
    const quantity = quantityFromMatch(match);
    if (!quantity || isNegatedOperation(input.normalized, match.index ?? 0)) continue;
    const operation = buildPartialRemoval(input, match, quantity, usedRemovalRanges);
    if (operation) operations.push(operation);
  }

  const removeVerb = /\b(?:retirer|retire|enlever|enleve|supprimer|supprime|remove)\b/gu;
  for (const verb of input.normalized.matchAll(removeVerb)) {
    const start = verb.index ?? 0;
    if (isNegatedOperation(input.normalized, start)) continue;
    const end = clauseEnd(input.normalized, start + verb[0].length);
    const suffix = input.normalized.slice(start + verb[0].length, end);
    const amountMatch = /\b(\d+(?:[.,]\d+)?)\s*(kg|g)\b/u.exec(suffix);
    if (!amountMatch) continue;
    const quantity = quantityFromMatch(Object.assign(amountMatch, { index: start + verb[0].length + (amountMatch.index ?? 0) }));
    if (!quantity) continue;
    const explicitUseValue = explicitUse(input.normalized, start, end);
    const span = originalSpan(input.question, input.sourceRanges, start, end);
    if (!span || usedRemovalRanges.has(`${quantity.start}:${quantity.end}`)) continue;
    usedRemovalRanges.add(`${quantity.start}:${quantity.end}`);
    const sourceSpan = originalSpan(input.question, input.sourceRanges, start, end) ?? span;
    const sourceScope = explicitScope(input.normalized, start, end);
    operations.push({
      id: operationId('remove', sourceSpan),
      label: sourceSpan.text,
      kind: 'remove',
      quantity: { kind: 'partial', grams: quantity.grams },
      ...(explicitUseValue ? { sourceUse: explicitUseValue } : {}),
      ...(sourceScope ? { sourceScope } : {}),
      sourceSpan,
    });
  }

  const addRanges = new Set<string>();
  const addVerb = /\b(?:ajouter|ajoute|add)\b/gu;
  for (const verb of input.normalized.matchAll(addVerb)) {
    const start = verb.index ?? 0;
    if (isNegatedOperation(input.normalized, start)) continue;
    const end = clauseEnd(input.normalized, start + verb[0].length);
    const suffix = input.normalized.slice(start + verb[0].length, end);
    const amountMatch = /\b(\d+(?:[.,]\d+)?)\s*(kg|g)\b/u.exec(suffix);
    if (amountMatch && /\b(?:de|en)\s+moins\b/u.test(suffix.slice(amountMatch.index + amountMatch[0].length))) continue;
    const quantity = amountMatch
      ? quantityFromMatch(Object.assign(amountMatch, { index: start + verb[0].length + (amountMatch.index ?? 0) }))
      : undefined;
    const use = explicitUse(input.normalized, start, end);
    const targetScope = explicitScope(input.normalized, start, end);
    if (isOpenVagueAddition(input, start, end, suffix, !!quantity, use, targetScope)) continue;
    const excerptEnd = end;
    const span = originalSpan(input.question, input.sourceRanges, start, excerptEnd);
    if (!span) continue;
    const key = `${span.start}:${span.end}`;
    if (addRanges.has(key)) continue;
    addRanges.add(key);
    operations.push({
      id: operationId('add', span), label: span.text,
      kind: 'add', additionId: `question-add-${span.start}-${span.end}`,
      grams: quantity?.grams ?? null, ...(use ? { use } : {}), ...(targetScope ? { targetScope } : {}), sourceSpan: span,
    });
  }

  const dryHopAction = /\b(?:faire|fais|pratiquer|pratique|realiser|realise)\s+(?:du\s+|un\s+|de\s+l\s+)?dry\s*hop(?:ping)?\b/gu;
  for (const match of input.normalized.matchAll(dryHopAction)) {
    const start = match.index ?? 0;
    if (isNegatedOperation(input.normalized, start)) continue;
    const end = start + match[0].length;
    const actionEnd = clauseEnd(input.normalized, end);
    const use = explicitUse(input.normalized, start, actionEnd);
    const targetScope = explicitScope(input.normalized, start, actionEnd) ?? 'coldSide';
    const span = originalSpan(input.question, input.sourceRanges, start, end);
    if (!span) continue;
    if (operations.some(operation => operation.kind === 'add' && operation.sourceSpan?.start === span.start)) continue;
    operations.push({ id: operationId('add', span), label: span.text, kind: 'add',
      additionId: `question-add-${span.start}-${span.end}`, grams: null, ...(use ? { use } : {}), targetScope, sourceSpan: span });
  }
  return operations.sort((left, right) => (left.sourceSpan?.start ?? 0) - (right.sourceSpan?.start ?? 0)
    || left.id.localeCompare(right.id));
}

/*
 * Direct gesture previews. A worded command on the linked program becomes at
 * most a validated branch template; nothing is applied, saved or guessed. The
 * caller passes the exact decision intent it already read from the question.
 */

export type HopV55DirectGestureKindV1 = 'add' | 'dose' | 'move' | 'remove' | 'replace';
export interface HopV55DirectGestureV1 { kind: HopV55DirectGestureKindV1; verbStart: number; verbEnd: number; }
export interface HopV55MaterialMentionV1 { start: number; end: number; term: string; materialIds: string[]; label: string; }
export interface HopV55DirectGestureResultV1 { branches: BrewingScenarioBranchRequest[]; response?: HopDecisionResponse; unresolved: string[]; }
interface QuantityMention { start: number; end: number; term: string; grams: number | null; rawValue: string; unit: string; }
interface UseMention { start: number; end: number; term: string; use: HopUse; }
type Gesture = HopV55DirectGestureV1;
type MaterialMention = HopV55MaterialMentionV1;
type GestureResult = HopV55DirectGestureResultV1;

const normalize = (value: string): string => value.normalize('NFKD')
  .replace(/\p{M}/gu, '')
  .toLocaleLowerCase('fr')
  .replace(/[’']/gu, ' ')
  .replace(/[‐‑–—-]/gu, ' ')
  .replace(/\s+/gu, ' ')
  .trim();

function phraseMatches(text: string, value: string): Array<{ start: number; end: number; term: string }> {
  const normalizedTerm = normalize(value);
  if (!normalizedTerm) return [];
  const pattern = normalizedTerm.replace(/[.*+?^\${}()|[\]\\]/gu, '\\$&').replace(/\s+/gu, '\\s+');
  const expression = new RegExp('(^|[^\\p{L}\\p{N}])(' + pattern + ')(?=$|[^\\p{L}\\p{N}])', 'gu');
  return [...text.matchAll(expression)].map(match => {
    const start = (match.index ?? 0) + (match[1] ?? '').length;
    return { start, end: start + (match[2] ?? '').length, term: match[2] ?? '' };
  });
}

function readQuantities(text: string): QuantityMention[] {
  const quantities: QuantityMention[] = [];
  const expression = /(-?\d+(?:[.,]\d+)?)\s*(kg|g)\b/gu;
  for (const match of text.matchAll(expression)) {
    const start = match.index ?? 0;
    if (/\d\s*$/u.test(text.slice(0, start))) continue;
    const rawValue = match[1], unit = match[2];
    const numeric = Number(rawValue.replace(',', '.'));
    const grams = Number.isFinite(numeric) && numeric >= 0 ? numeric * (unit === 'kg' ? 1000 : 1) : null;
    quantities.push({ start, end: start + match[0].length, term: match[0], rawValue, unit, grams });
  }
  return quantities;
}

function readUseMentions(text: string): UseMention[] {
  const terms: Array<{ use: HopUse; terms: string[] }> = [
    { use: 'firstWort', terms: ['first wort', 'premier moût', 'première moût'] },
    { use: 'boil', terms: ['ébullition', 'bouillir', 'boil'] },
    { use: 'whirlpool', terms: ['whirlpool', 'hop stand', 'tourbillon'] },
    { use: 'fermentation', terms: ['pendant fermentation', 'en fermentation', 'ajout fermentation', 'fermentation'] },
    { use: 'postFermentation', terms: ['dry hop', 'dry hopping', 'dryhop', 'houblonnage à froid', 'post fermentation', 'à froid', 'cold side'] },
  ];
  const rows = terms.flatMap(group => group.terms.flatMap(term => phraseMatches(text, term).map(match => ({ ...match, use: group.use }))))
    .sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const collapsed: UseMention[] = [];
  for (const row of rows) if (!collapsed.some(existing => row.start < existing.end && existing.start < row.end)) collapsed.push(row);
  return collapsed;
}

function useLabel(use: HopUse): string {
  const labels: Record<HopUse, string> = {
    firstWort: 'premier moût', boil: 'ébullition', whirlpool: 'whirlpool',
    fermentation: 'fermentation', postFermentation: 'post-fermentation',
  };
  return labels[use];
}

function useAfterGesture(text: string, gesture: Gesture, uses: UseMention[]): {
  target?: HopUse; source?: HopUse; ambiguous: boolean;
} {
  const afterVerb = uses.filter(row => row.start >= gesture.verbEnd);
  const targets = afterVerb.filter(row => /\b(?:vers(?:\s+(?:le|la|l|les))?|en|dans|au|a(?:\s+(?:le|la|l|les))?|to|into)\s*$/u.test(text.slice(gesture.verbEnd, row.start)));
  const targetIds = [...new Set((targets.length ? targets : afterVerb).map(row => row.use))];
  if (targetIds.length !== 1) return { ambiguous: targetIds.length > 1 };
  const target = targetIds[0];
  const targetRow = (targets.length ? targets : afterVerb).find(row => row.use === target);
  const source = uses.filter(row => row.use !== target && (row.start < gesture.verbStart
    || (row.start >= gesture.verbEnd && !!targetRow && row.start < targetRow.start))).at(-1)?.use;
  return { target, ...(source ? { source } : {}), ambiguous: false };
}

function explicitDoseBasis(text: string): HopReplacementBasis | 'tinsethIbu' | undefined {
  if (/\b(?:meme|same)\s+masse\b|\bmasse\s+egale\b/u.test(text)) return 'sameMass';
  if (/\b(?:meme|same)\s+(?:charge\s+)?alpha\b|\bcharge\s+alpha\s+egale\b/u.test(text)) return 'alphaLoad';
  if (/\b(?:meme|same)\s+(?:volume\s+)?(?:d\s+)?huile(?:\s+totale)?\b/u.test(text)) return 'totalOil';
  if (/\b(?:convention|ratio)\s+fabricant\b|\bmanufacturer\b/u.test(text)) return 'manufacturer';
  if (/\b(?:meme|same)\s+ibu\b|\btinseth\b/u.test(text)) return 'tinsethIbu';
  return undefined;
}

export function hopV55UnavailableCue(text: string): boolean {
  return /\b(?:indisponible|pas disponible|en rupture|rupture de stock|plus en stock|out of stock|manque|stock epuise)\b/u.test(text);
}
const unavailableCue = hopV55UnavailableCue;

export function hopV55UnavailableSourceId(text: string, mentions: readonly MaterialMention[]): string | undefined {
  const locallyUnavailable = mentions.filter(mention => unavailableCue(
    text.slice(Math.max(0, mention.start - 48), mention.end + 56),
  ));
  const exactIds = [...new Set(locallyUnavailable.flatMap(row => row.materialIds))];
  if (exactIds.length === 1 && locallyUnavailable.every(row => row.materialIds.length === 1)) return exactIds[0];
  if (!locallyUnavailable.length && unavailableCue(text)) {
    const allIds = [...new Set(mentions.flatMap(row => row.materialIds))];
    if (allIds.length === 1 && mentions.every(row => row.materialIds.length === 1)) return allIds[0];
  }
  return undefined;
}

function resolveOneMention(mentions: readonly MaterialMention[], from?: number, to?: number): { id?: string; ambiguous: boolean } {
  const rows = mentions.filter(row => (from === undefined || row.start >= from) && (to === undefined || row.start < to));
  const ids = [...new Set(rows.flatMap(row => row.materialIds))];
  if (ids.length !== 1 || rows.some(row => row.materialIds.length !== 1)) return { ambiguous: ids.length > 1 || rows.some(row => row.materialIds.length > 1) };
  return { id: ids[0], ambiguous: false };
}

function resolveCurrentAddition(input: {
  program: HopDecisionProgram; materialId?: string; amountGrams?: number;
  uses?: readonly HopUse[]; amountSelectsByCurrentDose?: boolean;
}): { addition?: HopProgramAddition; ambiguous: boolean } {
  let candidates = input.program.additions;
  if (input.materialId) candidates = candidates.filter(row => row.materialId === input.materialId);
  if (input.uses?.length) candidates = candidates.filter(row => input.uses!.includes(row.use));
  if (input.amountGrams !== undefined && input.amountSelectsByCurrentDose) candidates = candidates.filter(row => row.grams === input.amountGrams);
  if (candidates.length !== 1) return { ambiguous: candidates.length > 1 };
  return { addition: candidates[0], ambiguous: false };
}

function parsedParameters(text: string, use: HopUse): Pick<HopProgramAddition, 'boilMinutes' | 'contactHours' | 'temperatureC' | 'dayOffset'> {
  const parameters: Pick<HopProgramAddition, 'boilMinutes' | 'contactHours' | 'temperatureC' | 'dayOffset'> = {};
  const temperature = text.match(/(-?\d+(?:[.,]\d+)?)\s*(?:°\s*c|°c|celsius)\b/u);
  if (temperature) parameters.temperatureC = Number(temperature[1].replace(',', '.'));
  const day = text.match(/\bj\s*\+\s*(\d+)\b/u);
  if (day) parameters.dayOffset = Number(day[1]);
  const time = text.match(/(\d+(?:[.,]\d+)?)\s*(h|heures?|hours?|min(?:utes?)?|jours?|days?)\b/u);
  if (time) {
    const value = Number(time[1].replace(',', '.')), unit = time[2];
    if (use === 'boil' && /\b(?:minute|minutes|min|boil|ebullition)\b/u.test(text)) {
      parameters.boilMinutes = unit.startsWith('h') ? value * 60
        : unit.startsWith('jour') || unit.startsWith('day') ? value * 1440 : value;
    } else parameters.contactHours = unit.startsWith('min') ? value / 60
      : unit.startsWith('jour') || unit.startsWith('day') ? value * 24 : value;
  }
  return parameters;
}

function stageAllows(program: HopDecisionProgram, use: HopUse): boolean {
  return availableHopUses(program.stage).includes(use);
}

function makeBranch(
  id: string, label: string, changes: HopProgramChange[],
  current: BrewingScenarioRuntimeCurrent, materials: HopDecisionMaterial[],
): { branch?: BrewingScenarioBranchRequest; reason?: string } {
  const program = current.program;
  if (!program) return { reason: 'Aucun programme lié : une branche opérationnelle exige un programme explicite.' };
  try {
    previewHopProgramChanges(program, changes, materials);
  } catch (error) {
    return { reason: error instanceof Error ? error.message : 'Le changement ne passe pas la validation du programme.' };
  }
  return { branch: { id, label, programChanges: structuredClone(changes), assumptions: [] } };
}

function requestedDoseValue(
  text: string,
  gesture: Gesture,
  quantity: QuantityMention,
  currentGrams: number | null,
): { grams?: number; reason?: string } {
  const beforeAmount = text.slice(gesture.verbStart, quantity.start);
  const direction = /\b(?:augmenter|augmente|increase)\b/u.test(beforeAmount) ? 'increase'
    : /\b(?:reduire|reduis|baisser|baisse|diminuer|diminue|decrease|reduce|lower)\b/u.test(beforeAmount) ? 'decrease'
      : undefined;
  if (/\b(?:a|vers|to)\s*$/u.test(beforeAmount)
    || /\b(?:doser|dose|regler|passer|passe|set)\b/u.test(beforeAmount)) return { grams: quantity.grams ?? undefined };
  if (/\b(?:de|by)\s*$/u.test(beforeAmount)) {
    if (!direction) return { reason: 'Le texte donne une variation sans préciser si elle augmente ou réduit la dose.' };
    if (currentGrams === null) return { reason: 'La masse actuelle est inconnue; une variation de dose ne peut pas devenir une cible.' };
    const grams = direction === 'increase' ? currentGrams + (quantity.grams ?? 0) : currentGrams - (quantity.grams ?? 0);
    if (!Number.isFinite(grams) || grams <= 0) return { reason: 'La variation ne laisse pas une dose positive; préciser un retrait ou une dose cible.' };
    return { grams };
  }
  return { reason: 'Préciser si la quantité est une dose cible (à ...) ou une variation (de ...); aucune branche ne choisit cette interprétation.' };
}

export function tryHopV55DirectGesture(input: {
  intent: HopDecisionIntent; normalized: string;
  gesture: Gesture | null;
  current?: BrewingScenarioRuntimeCurrent; materials: HopDecisionMaterial[]; mentions: MaterialMention[];
}): GestureResult {
  const empty: GestureResult = { branches: [], unresolved: [] };
  if (!input.gesture) return empty;
  if (input.gesture.verbStart < 0) return { ...empty, unresolved: ['Plusieurs gestes actifs sont formulés ensemble ; les séparer avant de préparer une branche.'] };
  const program = input.current?.program;
  if (!program) return { ...empty, unresolved: ['Le geste est explicite, mais aucun programme lié ne permet d’identifier ou modifier une ligne. Le programme reste absent.'] };
  const quantities = readQuantities(input.normalized);
  if (/\d[\s ]\d{3}\s*(?:kg|g)\b/u.test(input.normalized)) return {
    ...empty, unresolved: ['Le séparateur de milliers de la quantité est ambigu ; saisir une dose avec unité sans regroupement.'],
  };
  if (quantities.some(row => row.grams === null)) return { ...empty, unresolved: ['La quantité est négative ou invalide ; aucune opération n’est préparée.'] };
  const uses = readUseMentions(input.normalized), allMaterials = input.materials;

  if (input.gesture.kind === 'add') {
    if (quantities.length !== 1 || quantities[0].grams === null || quantities[0].grams <= 0) return {
      ...empty, unresolved: ['Pour ajouter une ligne, préciser une dose positive et son unité.'],
    };
    const material = resolveOneMention(input.mentions);
    if (!material.id) return { ...empty, unresolved: [material.ambiguous
      ? 'Plusieurs identités du catalogue correspondent à la matière citée ; choisir une fiche exacte.'
      : 'La matière citée ne correspond à aucune identité exacte du catalogue préparé.'] };
    const use = useAfterGesture(input.normalized, input.gesture, uses);
    if (!use.target || use.ambiguous) return { ...empty, unresolved: ['Préciser un emploi exact pour le nouvel ajout.'] };
    if (!stageAllows(program, use.target)) return {
      ...empty, unresolved: ['L’emploi demandé est déjà passé pour le stade ' + program.stage + ' ; aucune branche ne réécrit le passé.'],
    };
    const materialName = allMaterials.find(row => row.id === material.id)?.name ?? material.id;
    const additionBase: HopProgramAddition = {
      id: 'question-add-' + material.id.replace(/[^\p{L}\p{N}-]+/gu, '-'),
      materialId: material.id, grams: quantities[0].grams, use: use.target, status: 'planned',
      ...parsedParameters(input.normalized, use.target),
    };
    let addition = additionBase, suffix = 2;
    while (program.additions.some(row => row.id === addition.id)) {
      addition = { ...additionBase, id: additionBase.id + '-' + suffix };
      suffix++;
    }
    const checked = makeBranch('direct-add', 'Ajouter ' + quantities[0].grams + ' g de ' + materialName + ' — ' + useLabel(use.target),
      [{ kind: 'append', addition }], input.current!, allMaterials);
    return checked.branch ? { branches: [checked.branch], unresolved: [] }
      : { branches: [], unresolved: [checked.reason ?? 'Ajout non préparé.'] };
  }

  if (input.gesture.kind === 'replace') {
    if (input.mentions.length < 2) return { ...empty, unresolved: ['Le remplacement doit désigner la source et une cible par leurs identités exactes.'] };
    const first = input.mentions[0], second = input.mentions.find(row => row.start >= first.end);
    if (!second || first.materialIds.length !== 1 || second.materialIds.length !== 1) return {
      ...empty, unresolved: ['La source ou la cible de remplacement est ambiguë ; aucune branche destructive n’est créée.'],
    };
    const sourceId = first.materialIds[0], targetId = second.materialIds[0];
    if (sourceId === targetId) return { ...empty, unresolved: ['La source et la cible désignent la même identité.'] };
    const connector = input.normalized.slice(first.end, second.start).match(/\b(?:par|avec|by|with)\b/u);
    const connectorPosition = connector?.index === undefined ? second.start : first.end + connector.index;
    const sourceQuantities = quantities.filter(row => row.start < connectorPosition);
    const targetQuantities = quantities.filter(row => row.start >= connectorPosition);
    if (quantities.length > 2 || targetQuantities.length > 1) return {
      ...empty, unresolved: ['Plusieurs doses sont citées autour du remplacement ; associer une dose source ou cible avant de préparer une branche.'],
    };
    const sourceQuantity = sourceQuantities.at(-1);
    const source = resolveCurrentAddition({
      program, materialId: sourceId,
      ...(sourceQuantity?.grams !== null && sourceQuantity
        ? { amountGrams: sourceQuantity.grams, amountSelectsByCurrentDose: true } : {}),
    });
    if (!source.addition) return { ...empty, unresolved: [source.ambiguous
      ? 'Plusieurs lignes du programme utilisent la source ; préciser un emploi ou une dose de référence.'
      : 'Aucune ligne du programme ne correspond à la source exacte.'] };
    if (source.addition.status !== 'planned') return { ...empty, unresolved: ['La ligne source est déjà effectuée ; elle reste intacte et ne peut être remplacée dans cette branche.'] };
    if (!stageAllows(program, source.addition.use)) return { ...empty, unresolved: ['L’emploi source est passé au stade ' + program.stage + ' ; aucune branche ne réécrit le passé.'] };
    const replacementUse = useAfterGesture(input.normalized, input.gesture, uses);
    if (replacementUse.ambiguous) return { ...empty, unresolved: ['Plusieurs emplois sont cités ; préciser l’emploi du remplacement.'] };
    if (replacementUse.target && replacementUse.target !== source.addition.use) return {
      ...empty, unresolved: ['Le remplacement change aussi l’emploi ; préciser séparément ce geste pour éviter de recopier des paramètres de contact incompatibles.'],
    };

    const targetQuantity = targetQuantities[0];
    if (targetQuantity?.grams !== null && targetQuantity?.grams !== undefined && targetQuantity.grams > 0) {
      const target = allMaterials.find(row => row.id === targetId);
      if (!target) return { ...empty, unresolved: ['La cible exacte n’est plus présente dans le contexte préparé.'] };
      const replacement: HopProgramAddition = { ...source.addition, materialId: targetId, grams: targetQuantity.grams, alphaForModel: undefined };
      const checked = makeBranch('direct-replace', 'Remplacer par ' + target.name + ' à ' + targetQuantity.grams + ' g',
        [{ kind: 'replace', additionId: source.addition.id, additions: [replacement] }], input.current!, allMaterials);
      return checked.branch ? { branches: [checked.branch], unresolved: [] }
        : { branches: [], unresolved: [checked.reason ?? 'Remplacement non préparé.'] };
    }

    const basis = explicitDoseBasis(input.normalized);
    if (!basis || basis === 'tinsethIbu') return {
      ...empty, unresolved: ['Le remplacement est identifié, mais ni dose cible ni convention de dose compatible ne sont explicites. Choisir une dose ou une convention avant le calcul.'],
    };
    const response = answerHopDecision({
      intent: structuredClone(input.intent),
      action: { kind: 'substitute', program, additionId: source.addition.id, candidateIds: [targetId], basis },
      materials: structuredClone(allMaterials),
    });
    const option = response.result.options[0];
    const branches = option?.changes && option.applicability !== 'blocked'
      ? [makeBranch('direct-substitute', 'Remplacer par ' + (allMaterials.find(row => row.id === targetId)?.name ?? targetId)
        + ' — convention ' + basis, option.changes, input.current!, allMaterials).branch].filter((row): row is BrewingScenarioBranchRequest => !!row)
      : [];
    const unresolved = response.missingInformation.slice();
    if (option?.applicability === 'blocked') unresolved.push(...option.reasons);
    if (!branches.length && !unresolved.length) unresolved.push('La façade n’a pas fourni de changement complet ; vérifier la dose et l’applicabilité.');
    return { branches, response, unresolved: [...new Set(unresolved)] };
  }

  if (input.gesture.kind === 'move') {
    const destination = useAfterGesture(input.normalized, input.gesture, uses);
    if (!destination.target || destination.ambiguous) return { ...empty, unresolved: ['Préciser un seul emploi cible pour le déplacement.'] };
    const material = resolveOneMention(input.mentions);
    if (material.ambiguous) return { ...empty, unresolved: ['Plusieurs identités de matière sont citées ; préciser la ligne à déplacer.'] };
    if (quantities.length > 1) return { ...empty, unresolved: ['Plusieurs doses sont citées ; la ligne et la quantité à déplacer ne sont pas univoques.'] };
    const amount = quantities.length === 1 ? quantities[0].grams ?? undefined : undefined;
    let source = resolveCurrentAddition({
      program, ...(material.id ? { materialId: material.id } : {}),
      ...(destination.source ? { uses: [destination.source] } : {}),
    });
    if (source.ambiguous && amount !== undefined) source = resolveCurrentAddition({
      program, ...(material.id ? { materialId: material.id } : {}),
      ...(destination.source ? { uses: [destination.source] } : {}),
      amountGrams: amount, amountSelectsByCurrentDose: true,
    });
    if (!source.addition) return { ...empty, unresolved: [source.ambiguous
      ? 'Plusieurs lignes correspondent à la matière, à la dose ou à l’emploi cités ; préciser la ligne.'
      : 'Aucune ligne unique du programme ne correspond au déplacement demandé.'] };
    if (source.addition.status !== 'planned') return { ...empty, unresolved: ['La ligne source est déjà effectuée ; elle ne peut pas être déplacée.'] };
    if (source.addition.grams === null) return { ...empty, unresolved: ['La dose de la ligne source est inconnue ; aucun changement de programme n’est construit.'] };
    if (!stageAllows(program, source.addition.use) || !stageAllows(program, destination.target)) return {
      ...empty, unresolved: ['L’emploi source ou cible est passé au stade ' + program.stage + ' ; aucune branche ne réécrit le passé.'],
    };
    if (source.addition.use === destination.target) return { ...empty, unresolved: ['Les emplois source et cible sont identiques ; préciser un autre stade.'] };
    const grams = amount ?? source.addition.grams;
    if (grams <= 0 || grams > source.addition.grams) return { ...empty, unresolved: ['La dose déplacée doit être positive et disponible sur cette ligne.'] };
    try {
      const response = answerHopDecision({
        intent: structuredClone(input.intent),
        action: {
          kind: 'changeUse', program, additionId: source.addition.id, grams, use: destination.target,
          ...(Object.keys(parsedParameters(input.normalized, destination.target)).length
            ? { parameters: parsedParameters(input.normalized, destination.target) } : {}),
        },
        materials: structuredClone(allMaterials),
      });
      const proposal = response.result.proposal;
      const branch: BrewingScenarioBranchRequest | undefined = proposal.applicability === 'unavailable' ? undefined : {
        id: 'direct-move', label: 'Déplacer ' + grams + ' g vers ' + useLabel(destination.target),
        programChanges: structuredClone(proposal.changes), assumptions: [],
      };
      return { branches: branch ? [branch] : [], response,
        unresolved: branch ? [] : [...proposal.conditions, 'La proposition est bloquée par la disponibilité du programme.'] };
    } catch (error) {
      return { ...empty, unresolved: [error instanceof Error ? error.message : 'Le déplacement ne peut pas être prévisualisé.'] };
    }
  }

  if (input.gesture.kind === 'remove') {
    if (quantities.length !== 1 || quantities[0].grams === null || quantities[0].grams <= 0) return {
      ...empty, unresolved: ['Préciser la masse et l’unité à retirer.'],
    };
    const material = resolveOneMention(input.mentions);
    if (material.ambiguous) return { ...empty, unresolved: ['Plusieurs identités de matière sont citées ; aucune ligne ne peut être retirée sans choix explicite.'] };
    const useIds = [...new Set(uses.map(row => row.use))];
    let source = resolveCurrentAddition({
      program, ...(material.id ? { materialId: material.id } : {}),
      ...(useIds.length === 1 ? { uses: useIds } : {}),
    });
    if (source.ambiguous) source = resolveCurrentAddition({
      program, ...(material.id ? { materialId: material.id } : {}),
      ...(useIds.length === 1 ? { uses: useIds } : {}),
      amountGrams: quantities[0].grams, amountSelectsByCurrentDose: true,
    });
    if (!source.addition) return { ...empty, unresolved: [source.ambiguous
      ? 'Plusieurs lignes correspondent à la matière, la dose ou l’emploi cités.'
      : 'Aucune ligne unique ne correspond à la masse exacte à retirer.'] };
    if (source.addition.status !== 'planned' || !stageAllows(program, source.addition.use)) return {
      ...empty, unresolved: ['La ligne est effectuée ou son emploi est passé ; elle reste intacte.'],
    };
    if (source.addition.grams === null || quantities[0].grams > source.addition.grams) return {
      ...empty, unresolved: ['La masse à retirer dépasse la masse connue de la ligne ou la dose de référence est inconnue.'],
    };
    const remaining = source.addition.grams - quantities[0].grams;
    const change: HopProgramChange = remaining === 0
      ? { kind: 'remove', additionId: source.addition.id }
      : { kind: 'replace', additionId: source.addition.id, additions: [{ ...source.addition, grams: remaining }] };
    const checked = makeBranch('direct-remove', 'Retirer ' + quantities[0].grams + ' g de la ligne',
      [change], input.current!, allMaterials);
    return checked.branch ? { branches: [checked.branch], unresolved: [] }
      : { branches: [], unresolved: [checked.reason ?? 'Retrait non préparé.'] };
  }

  if (input.gesture.kind === 'dose') {
    if (quantities.length !== 1 || quantities[0].grams === null || quantities[0].grams <= 0) return {
      ...empty, unresolved: ['Préciser une dose cible positive et son unité pour modifier la ligne.'],
    };
    const material = resolveOneMention(input.mentions);
    if (material.ambiguous) return { ...empty, unresolved: ['Plusieurs identités de matière sont citées ; choisir une ligne exacte.'] };
    const useIds = [...new Set(uses.map(row => row.use))];
    const source = resolveCurrentAddition({
      program, ...(material.id ? { materialId: material.id } : {}),
      ...(useIds.length === 1 ? { uses: useIds } : {}),
    });
    if (!source.addition) return { ...empty, unresolved: [source.ambiguous
      ? 'Plusieurs lignes correspondent à la matière ; préciser aussi son emploi.'
      : 'Aucune ligne unique du programme ne correspond à la matière et à l’emploi cités.'] };
    if (source.addition.status !== 'planned' || !stageAllows(program, source.addition.use)) return {
      ...empty, unresolved: ['La ligne est effectuée ou son emploi est passé ; elle reste intacte.'],
    };
    const target = requestedDoseValue(input.normalized, input.gesture, quantities[0], source.addition.grams);
    if (target.grams === undefined) return { ...empty, unresolved: [target.reason ?? 'La dose reste ambiguë.'] };
    if (target.grams === source.addition.grams) return { ...empty, unresolved: ['La dose cible est identique à la dose actuelle ; aucune branche de changement n’est utile.'] };
    const replacement = { ...source.addition, grams: target.grams };
    const checked = makeBranch('direct-dose', 'Régler la dose à ' + target.grams + ' g',
      [{ kind: 'replace', additionId: source.addition.id, additions: [replacement] }], input.current!, allMaterials);
    return checked.branch ? { branches: [checked.branch], unresolved: [] }
      : { branches: [], unresolved: [checked.reason ?? 'Changement de dose non préparé.'] };
  }
  return { ...empty, unresolved: ['Geste non reconnu sans interprétation dédiée ; la question originale reste disponible.'] };
}

export function tryHopV55UnavailableReplacementPlanner(input: {
  question: string; intent: HopDecisionIntent;
  program: HopDecisionProgram; materials: HopDecisionMaterial[]; sourceId: string;
  exclusions: HopAdviceSituation['exclusions']; mentions: MaterialMention[];
}): GestureResult | undefined {
  const normalized = normalize(input.question), basis = explicitDoseBasis(normalized);
  if (!unavailableCue(normalized)) return undefined;
  if (!basis) return {
    branches: [], unresolved: ['La matière indisponible est identifiée, mais la convention ou la dose de remplacement reste à choisir.'],
  };
  const futureRows = input.program.additions.filter(row => row.status === 'planned' && row.materialId === input.sourceId);
  if (!futureRows.length) return {
    branches: [], unresolved: ['Aucun ajout futur de cette identité ne peut être planifié ; les opérations passées restent intactes.'],
  };
  if (input.program.stage === 'packaged') return {
    branches: [], unresolved: ['Le programme est conditionné ; une éventuelle substitution concerne un brassin futur explicite.'],
  };
  const basisByUse: Partial<Record<HopUse, 'alphaLoad' | 'totalOil' | 'sameMass' | 'manufacturer' | 'tinsethIbu'>> = {};
  futureRows.forEach(row => { basisByUse[row.use] = basis; });
  const excludedMaterialIds = [...new Set(input.exclusions.map(row => row.materialId))];
  const candidateMaterialIds = [...new Set(input.mentions
    .filter(row => !row.materialIds.includes(input.sourceId) && !input.exclusions.some(exclusion => row.materialIds.includes(exclusion.materialId)))
    .flatMap(row => row.materialIds))];
  const response = answerHopDecision({
    intent: structuredClone(input.intent),
    action: {
      kind: 'planReplacement', program: input.program,
      unavailable: { materialId: input.sourceId, reason: 'Indisponibilité explicitement signalée dans la question.', origin: 'user' },
      basisByUse,
      ...(candidateMaterialIds.length ? { candidateMaterialIds } : {}),
      ...(excludedMaterialIds.length ? { exclusions: excludedMaterialIds.map(value => ({
        kind: 'materialId' as const, value, reason: 'Exclusion explicite de la question.', origin: 'user' as const,
      })) } : {}),
      limits: { maxCandidateMaterials: 250, maxAssignments: 5000, maxPrograms: 1000 },
    },
    materials: structuredClone(input.materials),
  });
  const branches = response.result.plan.paths.filter(path => path.complete && !!path.preview)
    .map((path, index) => ({
      id: 'replacement-path-' + (index + 1),
      label: path.kind === 'mixedMaterials' ? 'Remplacement composé proposé par le planificateur' : 'Remplacement proposé par le planificateur',
      programChanges: structuredClone(path.preview!.changes), assumptions: [],
    } satisfies BrewingScenarioBranchRequest));
  const unresolved = [
    ...response.missingInformation, ...response.result.plan.unresolved.map(row => row.reason),
    ...(response.result.plan.search.truncated ? ['La recherche de candidats est tronquée dans le périmètre fourni.'] : []),
  ];
  return { response, branches, unresolved: [...new Set(unresolved)] };
}
