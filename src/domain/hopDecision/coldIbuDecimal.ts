/** Exact arithmetic on the decimal values actually supplied as JSON numbers. */
export interface ColdDecimalFraction { numerator: bigint; denominator: bigint }

function fraction(numerator: bigint, denominator: bigint): ColdDecimalFraction {
  if (denominator === 0n) throw Error('Dénominateur nul.');
  if (denominator < 0n) { numerator = -numerator; denominator = -denominator; }
  let a = numerator < 0n ? -numerator : numerator, b = denominator;
  while (b) { const rest = a % b; a = b; b = rest; }
  const divisor = a || 1n;
  return { numerator: numerator / divisor, denominator: denominator / divisor };
}

export function coldDecimal(value: number): ColdDecimalFraction {
  if (!Number.isFinite(value)) throw Error('Nombre décimal non fini.');
  const [mantissa, power = '0'] = value.toString().toLowerCase().split('e');
  const decimals = (mantissa.split('.')[1] ?? '').length;
  const coefficient = BigInt(mantissa.replace('.', ''));
  const scale = decimals - Number(power);
  return scale < 0 ? fraction(coefficient * 10n ** BigInt(-scale), 1n) : fraction(coefficient, 10n ** BigInt(scale));
}

export function addColdDecimals(left: ColdDecimalFraction, right: ColdDecimalFraction): ColdDecimalFraction {
  return fraction(left.numerator * right.denominator + right.numerator * left.denominator, left.denominator * right.denominator);
}
export function subtractColdDecimals(left: ColdDecimalFraction, right: ColdDecimalFraction): ColdDecimalFraction {
  return fraction(left.numerator * right.denominator - right.numerator * left.denominator, left.denominator * right.denominator);
}
export function multiplyColdDecimals(left: ColdDecimalFraction, right: ColdDecimalFraction): ColdDecimalFraction {
  return fraction(left.numerator * right.numerator, left.denominator * right.denominator);
}
export function divideColdDecimals(left: ColdDecimalFraction, right: ColdDecimalFraction): ColdDecimalFraction {
  return fraction(left.numerator * right.denominator, left.denominator * right.numerator);
}
export function sumColdDecimalNumbers(values: readonly number[]): ColdDecimalFraction {
  return values.reduce((sum, value) => addColdDecimals(sum, coldDecimal(value)), coldDecimal(0));
}
export function compareColdDecimals(left: ColdDecimalFraction, right: ColdDecimalFraction): -1 | 0 | 1 {
  const difference = left.numerator * right.denominator - right.numerator * left.denominator;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

function nearestEvenInteger(numerator: bigint, denominator: bigint): bigint {
  const integer = numerator / denominator, twiceRemainder = (numerator % denominator) * 2n;
  return twiceRemainder > denominator || twiceRemainder === denominator && integer % 2n !== 0n ? integer + 1n : integer;
}

/** Round once to an IEEE-754 number, after exact domain/endpoint comparisons. */
export function coldDecimalToNumber(value: ColdDecimalFraction): number {
  if (value.numerator === 0n) return 0;
  const sign = value.numerator < 0n ? -1 : 1;
  const numerator = value.numerator < 0n ? -value.numerator : value.numerator;
  const denominator = value.denominator;
  let exponent = numerator.toString(2).length - denominator.toString(2).length;
  if (exponent >= 0 ? numerator < denominator << BigInt(exponent) : numerator << BigInt(-exponent) < denominator) exponent--;
  if (exponent > 1023) return sign * Infinity;
  if (exponent < -1075) return sign * 0;
  if (exponent < -1022) return sign * Number(nearestEvenInteger(numerator << 1074n, denominator)) * Number.MIN_VALUE;
  const shift = 52 - exponent;
  const significand = shift >= 0 ? nearestEvenInteger(numerator << BigInt(shift), denominator)
    : nearestEvenInteger(numerator, denominator << BigInt(-shift));
  return sign * Number(significand) * 2 ** (exponent - 52);
}

export function coldDecimalSnapshot(value: ColdDecimalFraction): { numerator: string; denominator: string } {
  return { numerator: value.numerator.toString(), denominator: value.denominator.toString() };
}
