/**
 * Une quantité d'ingrédient écrite comme un brasseur la lit et la pèse (BR-54, BR-55, BR-56, BE-35, BE-36, 08.11).
 * Module sans import : l'écran du jour de brassage, le journal et les alarmes serveur (`brewSessionCore`) l'appellent sans cycle.
 *
 * Résolutions d'une balance de brasserie : kg à 1 g près (3 décimales), g à 0,01 g près pour un sel ou un acide (2 décimales),
 * mL et L à 0,1 près. Au-delà, ce sont des chiffres qu'aucun instrument ne lit (« 16,494 L », « 0.12345 kg »).
 * Un nombre s'écrit toujours avec la virgule, comme l'écran de saisie.
 */

/** Décimales utiles d'une unité ; en grammes, d'autant moins que la quantité est grande (1,24 g, 12,3 g, 123 g). */
export function amountDecimals(unit: string, amount = 0): number {
  switch (unit) {
    case 'kg': return 3;
    case 'g': {
      const a = Math.abs(amount);
      return a < 10 ? 2 : a < 100 ? 1 : 0;
    }
    default: return 1;
  }
}

/** Le nombre arrondi à la résolution de l'unité, sans zéros inutiles, virgule décimale, sans séparateur de milliers. */
export function roundAmount(amount: number, unit: string): number {
  const d = amountDecimals(unit, amount);
  return Math.round((amount + Number.EPSILON) * 10 ** d) / 10 ** d;
}

/**
 * « 123,5 g », « 1,25 kg » : en dessous d'1 kg, un poids s'écrit en grammes (« 0.12345 kg » devient « 123 g »).
 * Une quantité inconnue ou négative n'est pas écrite comme 0 : « — ».
 */
export function formatAmount(amount: number, unit: string): string {
  if (!Number.isFinite(amount) || amount < 0) return `— ${unit}`.trim();
  let value = amount;
  let u = unit;
  if (unit === 'kg' && amount > 0 && amount < 1) {
    value = amount * 1000;
    u = 'g';
  }
  return `${String(roundAmount(value, u)).replace('.', ',')} ${u}`.trim();
}
