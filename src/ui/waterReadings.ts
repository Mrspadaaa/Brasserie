import { IonRange } from '../domain/waterStyles';

/** Localise les nombres des diagnostics assemblés par le calculateur, sans les recalculer. */
export function formatWaterMessage(message: string | undefined): string {
  return message?.replace(/(\d)\.(?=\d)/g, '$1,') ?? '';
}

/** Les décimales d'une valeur hors cible ne doivent pas la faire paraître conforme. */
export function formatIonReading(value: number, range?: IonRange, minimumDecimals = 0): string {
  if (!Number.isFinite(value)) return '—';
  let digits = minimumDecimals;
  if (range && (value < range.min || value > range.max)) {
    while (digits < 3) {
      const rounded = Number(value.toFixed(digits));
      if (rounded < range.min || rounded > range.max) break;
      digits += 1;
    }
  }
  return value.toFixed(digits).replace('.', ',');
}

/** Une dose positive inférieure à la précision d'affichage n'est jamais écrite 0,00 g. */
export function formatSaltDose(grams: number): string {
  if (!Number.isFinite(grams) || grams <= 0) return '—';
  return grams < 0.01 ? '<0,01 g' : `${grams.toFixed(2).replace('.', ',')} g`;
}
