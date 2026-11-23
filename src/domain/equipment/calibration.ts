import type { EquipmentCalibration, EquipmentItem } from '../../types';

/** Préréglages par nom d'appareil (PORT.md) : valeurs de référence du brasseur, tolérances usuelles de l'instrument. */
const PRESETS: { test: RegExp; calibration: EquipmentCalibration }[] = [
  { test: /\bph[\s-]*m[eè]tre\b|\bph[\s-]*meter\b/i, calibration: { unit: 'pH', tolerance: 0.05, points: [{ label: 'pH 7,00', expected: 7 }, { label: 'pH 4,00', expected: 4 }] } },
  { test: /densim[eè]tre/i, calibration: { tolerance: 0.002, points: [{ label: 'Eau 1,000', expected: 1 }] } },
  { test: /r[ée]fractom[eè]tre/i, calibration: { unit: '°Bx', tolerance: 0.2, points: [{ label: 'Eau 0,0 °Bx', expected: 0 }] } },
];

/** L'étalonnage de l'appareil : le sien s'il en a un, sinon le préréglage de son nom, sinon null (pas d'étalonnage). */
export function calibrationPreset(item: Pick<EquipmentItem, 'name' | 'calibration'>): EquipmentCalibration | null {
  if (item.calibration?.points?.length) return item.calibration;
  const hit = PRESETS.find(p => p.test.test(item.name ?? ''));
  return hit ? { ...hit.calibration, points: hit.calibration.points.map(p => ({ ...p })) } : null;
}

/** Écart lu − attendu, arrondi au millionième ; null si la valeur n'est pas un nombre (l'inconnu n'est jamais 0). */
export function readingDelta(point: { expected: number }, read: number | null | undefined): number | null {
  if (typeof read !== 'number' || !Number.isFinite(read)) return null;
  return Math.round((read - point.expected) * 1e6) / 1e6;
}

/** La lecture est dans la tolérance (bornes comprises). Une valeur absente ou illisible n'est jamais bonne. */
export function readingOk(point: { label?: string; expected: number }, read: number | null | undefined, tolerance: number): boolean {
  const delta = readingDelta(point, read);
  return delta !== null && Math.abs(delta) <= tolerance + 1e-9;
}
