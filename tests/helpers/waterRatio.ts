import { fireEvent } from '@testing-library/react';

/** Modifie le contrôle natif en ratio ; le glissement non linéaire est testé dans Chrome. */
export function changeWaterRatio(slider: HTMLElement, ratio: number) {
  fireEvent.change(slider, { target: { value: String(ratio) } });
}

/** L'accessibilité expose le rapport, pas la coordonnée de la piste. */
export function readWaterRatio(slider: HTMLElement): number {
  return Number.parseFloat(slider.getAttribute('aria-valuenow') ?? '');
}
