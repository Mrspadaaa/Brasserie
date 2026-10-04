import { Units } from '../services/units';

/** Decimal witness uses strings for BigInt fields so it remains JSON-safe. */
export interface ExactDecimalWitness {
  coefficient: string;
  scale: number;
  decimal: string;
}

export type BrewingMassIssueCode =
  | 'invalidValue' | 'negativeValue' | 'invalidUnit' | 'incompatibleUnit'
  | 'invalidConversion' | 'overflow' | 'underflow' | 'precisionLoss' | 'invalidQuantityList';

export interface BrewingMassIssue {
  code: BrewingMassIssueCode;
  message: string;
  index?: number;
}

type JsonAtom = string | number | boolean | null;

export interface BrewingMassSource {
  /** Valid source values and units stay in their original form. */
  value: JsonAtom;
  unit: JsonAtom;
}

export interface NativeMassQuantity {
  value: unknown;
  unit: unknown;
}

export type NativeMassInGrams =
  | {
      status: 'known';
      source: BrewingMassSource;
      conversionFactor: ExactDecimalWitness;
      grams: number;
      exactGrams: ExactDecimalWitness;
    }
  | {
      status: 'unknown';
      source: BrewingMassSource;
      issue: BrewingMassIssue;
      conversionFactor?: ExactDecimalWitness;
      exactGrams?: ExactDecimalWitness;
    };

export interface BrewingMassQuantityTrace {
  index: number;
  status: NativeMassInGrams['status'];
  source: BrewingMassSource;
  grams?: number;
  exactGrams?: ExactDecimalWitness;
  conversionFactor?: ExactDecimalWitness;
  issue?: BrewingMassIssue;
}

export type BrewingMassSubtraction = {
  status: 'remaining' | 'equal' | 'deficit';
  totalGrams: number;
  realizedGrams: number;
  remainingGrams: number | null;
  deficitGrams: number | null;
  exact: {
    totalGrams: ExactDecimalWitness;
    realizedGrams: ExactDecimalWitness;
    differenceGrams: ExactDecimalWitness;
  };
  quantities: BrewingMassQuantityTrace[];
  issues: [];
} | {
  status: 'unknown';
  totalGrams: number | null;
  realizedGrams: number | null;
  remainingGrams: null;
  deficitGrams: null;
  exact: {
    totalGrams: ExactDecimalWitness | null;
    realizedGrams: ExactDecimalWitness | null;
    differenceGrams: ExactDecimalWitness | null;
  };
  quantities: BrewingMassQuantityTrace[];
  issues: BrewingMassIssue[];
};

interface Decimal {
  coefficient: bigint;
  scale: number;
}

type DecimalNumberResult =
  | { status: 'known'; value: number }
  | { status: 'unknown'; issue: BrewingMassIssue };

const ZERO: Decimal = { coefficient: 0n, scale: 0 };

function sourceAtom(value: unknown): JsonAtom {
  if (value === null) return null;
  if (typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : String(value);
  if (value === undefined) return null;
  return '[non-scalar]';
}

function sourceOf(value: unknown, unit: unknown): BrewingMassSource {
  return { value: sourceAtom(value), unit: sourceAtom(unit) };
}

function pow10(exponent: number): bigint {
  return 10n ** BigInt(exponent);
}

function normalize(decimal: Decimal): Decimal {
  if (decimal.coefficient === 0n) return ZERO;
  let { coefficient, scale } = decimal;
  while (scale > 0 && coefficient % 10n === 0n) {
    coefficient /= 10n;
    scale--;
  }
  return { coefficient, scale };
}

/** Parse the exact decimal spelling emitted by Number#toString, including exponents. */
function decimalFromNumber(value: number): Decimal | null {
  if (!Number.isFinite(value)) return null;
  if (Object.is(value, -0) || value === 0) return ZERO;
  const spelling = value.toString().toLowerCase();
  const match = /^(-?)(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/.exec(spelling);
  if (!match) return null;
  const sign = match[1] === '-' ? -1n : 1n;
  const fraction = match[3] ?? '';
  const exponent = Number(match[4] ?? '0');
  if (!Number.isSafeInteger(exponent)) return null;
  const digits = `${match[2]}${fraction}`.replace(/^0+(?=\d)/, '');
  let coefficient = sign * BigInt(digits || '0');
  let scale = fraction.length - exponent;
  if (scale < 0) {
    coefficient *= pow10(-scale);
    scale = 0;
  }
  return normalize({ coefficient, scale });
}

function add(left: Decimal, right: Decimal): Decimal {
  const scale = Math.max(left.scale, right.scale);
  const leftCoefficient = left.coefficient * pow10(scale - left.scale);
  const rightCoefficient = right.coefficient * pow10(scale - right.scale);
  return normalize({ coefficient: leftCoefficient + rightCoefficient, scale });
}

function subtract(left: Decimal, right: Decimal): Decimal {
  return add(left, { coefficient: -right.coefficient, scale: right.scale });
}

function multiply(left: Decimal, right: Decimal): Decimal {
  return normalize({ coefficient: left.coefficient * right.coefficient, scale: left.scale + right.scale });
}

function compare(left: Decimal, right: Decimal): -1 | 0 | 1 {
  const scale = Math.max(left.scale, right.scale);
  const a = left.coefficient * pow10(scale - left.scale);
  const b = right.coefficient * pow10(scale - right.scale);
  return a < b ? -1 : a > b ? 1 : 0;
}

function decimalText(decimal: Decimal): string {
  const normalized = normalize(decimal);
  const negative = normalized.coefficient < 0n;
  const digits = (negative ? -normalized.coefficient : normalized.coefficient).toString();
  if (normalized.scale === 0) return `${negative ? '-' : ''}${digits}`;
  const padded = digits.length <= normalized.scale
    ? `${'0'.repeat(normalized.scale - digits.length + 1)}${digits}`
    : digits;
  const split = padded.length - normalized.scale;
  return `${negative ? '-' : ''}${padded.slice(0, split)}.${padded.slice(split)}`;
}

function witness(decimal: Decimal): ExactDecimalWitness {
  const normalized = normalize(decimal);
  return { coefficient: normalized.coefficient.toString(), scale: normalized.scale, decimal: decimalText(normalized) };
}

function decimalFromWitness(value: ExactDecimalWitness): Decimal {
  return normalize({ coefficient: BigInt(value.coefficient), scale: value.scale });
}

function toRepresentableNumber(decimal: Decimal): DecimalNumberResult {
  const normalized = normalize(decimal);
  const text = decimalText(normalized);
  const value = Number(text);
  if (!Number.isFinite(value)) return { status: 'unknown', issue: { code: 'overflow', message: 'La masse décimale dépasse la plage Number.' } };
  if (normalized.coefficient !== 0n && value === 0) {
    return { status: 'unknown', issue: { code: 'underflow', message: 'Une masse positive devient zéro en Number.' } };
  }
  const roundTrip = decimalFromNumber(value);
  if (!roundTrip || compare(roundTrip, normalized) !== 0) {
    return { status: 'unknown', issue: { code: 'precisionLoss', message: 'La masse décimale n’a pas de représentation Number réversible.' } };
  }
  return { status: 'known', value };
}

function massIssue(code: BrewingMassIssueCode): BrewingMassIssue {
  const messages: Record<BrewingMassIssueCode, string> = {
    invalidValue: 'La quantité source n’est pas un nombre fini.',
    negativeValue: 'Une masse source négative ne peut pas être ramenée à zéro.',
    invalidUnit: 'L’unité source est absente ou invalide.',
    incompatibleUnit: 'L’unité source ne se convertit pas en grammes.',
    invalidConversion: 'Le facteur fourni par Units n’est pas une masse positive finie.',
    overflow: 'La masse convertie dépasse la plage Number.',
    underflow: 'Une masse positive devient zéro en Number.',
    precisionLoss: 'La masse décimale n’a pas de représentation Number réversible.',
    invalidQuantityList: 'La liste des masses réalisées est invalide.',
  };
  return { code, message: messages[code] };
}

/** Read a source quantity through the project unit table and retain an exact decimal witness. */
export function readNativeMassInGrams(value: unknown, unit: unknown): NativeMassInGrams {
  const source = sourceOf(value, unit);
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { status: 'unknown', source, issue: massIssue('invalidValue') };
  }
  if (value < 0) return { status: 'unknown', source, issue: massIssue('negativeValue') };
  if (typeof unit !== 'string' || !unit.trim()) {
    return { status: 'unknown', source, issue: massIssue('invalidUnit') };
  }
  const factor = Units.convert(1, unit, 'g');
  if (factor === null) return { status: 'unknown', source, issue: massIssue('incompatibleUnit') };
  if (!Number.isFinite(factor) || factor <= 0) {
    return { status: 'unknown', source, issue: massIssue('invalidConversion') };
  }
  const exactValue = decimalFromNumber(value);
  const exactFactor = decimalFromNumber(factor);
  if (!exactValue || !exactFactor) return { status: 'unknown', source, issue: massIssue('invalidConversion') };
  const exactGrams = multiply(exactValue, exactFactor);
  const converted = toRepresentableNumber(exactGrams);
  if (converted.status === 'unknown') {
    return { status: 'unknown', source, conversionFactor: witness(exactFactor), exactGrams: witness(exactGrams), issue: converted.issue };
  }
  return { status: 'known', source, conversionFactor: witness(exactFactor), grams: converted.value, exactGrams: witness(exactGrams) };
}

/** Subtract native realised masses from a planned total in grams without epsilon or rounding. */
export function subtractNativeMassesFromGrams(totalGrams: number, quantities: readonly NativeMassQuantity[]): BrewingMassSubtraction {
  const total = readNativeMassInGrams(totalGrams, 'g');
  const listValid = Array.isArray(quantities);
  const rows = listValid ? quantities.map((quantity, index) => {
    const reading = quantity && typeof quantity === 'object'
      ? readNativeMassInGrams(quantity.value, quantity.unit)
      : readNativeMassInGrams(quantity, undefined);
    return { index, ...reading };
  }) : [];
  const totalIssues: BrewingMassIssue[] = total.status === 'unknown' ? [total.issue] : [];
  if (!listValid) totalIssues.push(massIssue('invalidQuantityList'));
  for (const row of rows) if (row.status === 'unknown') totalIssues.push({ ...row.issue, index: row.index });

  const quantitiesTrace: BrewingMassQuantityTrace[] = rows.map(row => ({
    index: row.index,
    status: row.status,
    source: row.source,
    ...(row.status === 'known' ? { grams: row.grams, exactGrams: row.exactGrams, conversionFactor: row.conversionFactor }
      : { issue: { ...row.issue, index: row.index }, ...(row.conversionFactor ? { conversionFactor: row.conversionFactor } : {}),
        ...(row.exactGrams ? { exactGrams: row.exactGrams } : {}) }),
  }));

  if (totalIssues.length || total.status === 'unknown') {
    return {
      status: 'unknown', totalGrams: total.status === 'known' ? total.grams : null, realizedGrams: null,
      remainingGrams: null, deficitGrams: null,
      exact: { totalGrams: total.status === 'known' ? total.exactGrams : null, realizedGrams: null, differenceGrams: null },
      quantities: quantitiesTrace, issues: totalIssues,
    };
  }

  let realizedExact = ZERO;
  for (const row of rows) {
    if (row.status === 'known') {
      const next = add(realizedExact, decimalFromWitness(row.exactGrams));
      realizedExact = next;
    }
  }
  const realizedNumber = toRepresentableNumber(realizedExact);
  if (realizedNumber.status === 'unknown') {
    return {
      status: 'unknown', totalGrams: total.grams, realizedGrams: null, remainingGrams: null, deficitGrams: null,
      exact: { totalGrams: total.exactGrams, realizedGrams: witness(realizedExact), differenceGrams: null },
      quantities: quantitiesTrace, issues: [realizedNumber.issue],
    };
  }

  const difference = subtract(decimalFromWitness(total.exactGrams), realizedExact);
  const order = compare(difference, ZERO);
  const magnitude = order < 0 ? { coefficient: -difference.coefficient, scale: difference.scale } : difference;
  const resultNumber = toRepresentableNumber(magnitude);
  if (resultNumber.status === 'unknown') {
    return {
      status: 'unknown', totalGrams: total.grams, realizedGrams: realizedNumber.value, remainingGrams: null, deficitGrams: null,
      exact: { totalGrams: total.exactGrams, realizedGrams: witness(realizedExact), differenceGrams: witness(difference) },
      quantities: quantitiesTrace, issues: [resultNumber.issue],
    };
  }

  return {
    status: order > 0 ? 'remaining' : order < 0 ? 'deficit' : 'equal',
    totalGrams: total.grams,
    realizedGrams: realizedNumber.value,
    remainingGrams: order >= 0 ? resultNumber.value : null,
    deficitGrams: order < 0 ? resultNumber.value : order === 0 ? 0 : null,
    exact: { totalGrams: total.exactGrams, realizedGrams: witness(realizedExact), differenceGrams: witness(difference) },
    quantities: quantitiesTrace,
    issues: [],
  };
}
