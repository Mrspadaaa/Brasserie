import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from '../../src/components/LoginPage';
import { FirebaseAuthService } from '../../src/services/firebaseAuth';

type Rgb = readonly [number, number, number];

const hexToRgb = (hex: string): Rgb => [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16)) as Rgb;

const relativeLuminance = (rgb: Rgb): number =>
  rgb
    .map((channel) => channel / 255)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
    .reduce((sum, channel, index) => sum + [0.2126, 0.7152, 0.0722][index] * channel, 0);

const contrastRatio = (foreground: Rgb, background: Rgb): number => {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
};

const composite = (foreground: Rgb, background: Rgb, alpha: number): Rgb =>
  foreground.map((channel, index) => channel * alpha + background[index] * (1 - alpha)) as Rgb;

describe('LoginPage accessibility', () => {
  beforeEach(() => cleanup());
  afterEach(() => vi.restoreAllMocks());

  it('uses a readable error token on the actually composited alert surface', async () => {
    const prepareGoogleLogin = vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin')
      .mockRejectedValue(new Error('preparation failed'));

    render(<LoginPage />);

    const alert = await waitFor(() => screen.getByRole('alert'));
    expect(alert).toHaveTextContent('La connexion Google ne peut pas être préparée');
    expect(alert).toHaveClass('text-alert-strong');
    expect(alert).toHaveAttribute('role', 'alert');
    expect(prepareGoogleLogin).toHaveBeenCalledTimes(1);

    // Independent WCAG calculation: bg-alert/10 is composited over cave-950,
    // the page surface on which this compact alert is rendered.
    const pageSurface = hexToRgb('12100E');
    const alertSurface = composite(hexToRgb('D6453D'), pageSurface, 0.1);
    expect(contrastRatio(hexToRgb('D6453D'), alertSurface)).toBeCloseTo(3.98, 2);
    expect(contrastRatio(hexToRgb('F29289'), alertSurface)).toBeGreaterThanOrEqual(4.5);
  });
});
