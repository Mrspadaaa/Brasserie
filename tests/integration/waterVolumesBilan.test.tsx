import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { WaterVolumes } from '../../src/ui/water/WaterVolumes';
import { waterBalance } from '../../src/domain/water/volumeBalance';

afterEach(cleanup);

// 8 kg de grain, 30 L de bière : le calcul visait 34,4 L de moût avant ébullition et 8 L retenus par le grain (capture 92 du 08.11).
const vol = { mashWaterL: 28.7, spargeWaterL: 13.7, preBoilVolumeL: 34.4, grainAbsorptionL: 7.7, boilOffL: 4, hopLossL: 0, mashRatioLPerKg: 3.6, planningStatus: 'ready', issues: [] } as any;
function monte(mashWaterL: number, spargeWaterL: number) {
  const noop = () => {};
  return render(<WaterVolumes beerVolumeL={30} brew={{ totalGristKg: 8, boilMin: 60 } as any} onMashRatioChange={noop} onNoSpargeChange={noop} set={noop}
    mashRatioLPerKg={mashWaterL / 8} vol={vol} hasSparge
    state={{ diRatioPct: 0, styleCode: '21C', doses: {}, disabled: [], acidId: 'lactique', mashWaterL, spargeWaterL } as any} />);
}

describe('MV-31 : le moût collecté suit l’eau préparée', () => {
  it('rinçage 0 L : l’écran dit ce qui manque et n’affiche plus la cible comme un résultat', () => {
    monte(28.7, 0);
    expect(screen.getByRole('alert')).toHaveTextContent(/Il manque 13,4 L d’eau/);
    expect(screen.getByText('Moût collecté avec cette eau · à froid')).toBeInTheDocument();
    expect(screen.queryByText('Moût avant ébullition · à froid')).not.toBeInTheDocument();
    // 28,7 L − 7,7 L retenus = 21 L, pas 34,4
    expect(screen.getByText('21 L')).toBeInTheDocument();
    // « Rinçage à chaud : 0 L dans le récipient principal » n'a pas de sens
    expect(screen.queryByText(/Rinçage à chaud/)).not.toBeInTheDocument();
  });
  it('le calcul de l’app (28,7 + 13,7 L) tient le bilan : pas d’alerte, la cible reste affichée', () => {
    monte(28.7, 13.7);
    expect(screen.queryByTestId('x')).toBeNull();
    expect(document.querySelector('[data-role="eau-insuffisante"]')).toBeNull();
    expect(screen.getByText('Moût avant ébullition · à froid')).toBeInTheDocument();
  });
});

describe('bilan d’eau', () => {
  it('collecte = eau − absorption ; tolérance d’un demi-litre', () => {
    expect(waterBalance({ mashWaterL: 28.7, spargeWaterL: 0, preBoilVolumeL: 34.4, grainAbsorptionL: 7.7 })).toEqual({ collectedL: 21, targetL: 34.4, shortL: 13.4, excessL: 0 });
    expect(waterBalance({ mashWaterL: 28.7, spargeWaterL: 13.7, preBoilVolumeL: 34.4, grainAbsorptionL: 7.7 })?.shortL).toBe(0);
    expect(waterBalance({ mashWaterL: 40, spargeWaterL: 20, preBoilVolumeL: 34.4, grainAbsorptionL: 7.7 })?.excessL).toBe(17.9);
  });
  it('inconnu ou négatif : pas de bilan (jamais un 0 inventé)', () => {
    expect(waterBalance({ mashWaterL: Number.NaN, spargeWaterL: 0, preBoilVolumeL: 34, grainAbsorptionL: 8 })).toBeNull();
    expect(waterBalance({ mashWaterL: -1, spargeWaterL: 0, preBoilVolumeL: 34, grainAbsorptionL: 8 })).toBeNull();
    expect(waterBalance({ mashWaterL: 20, spargeWaterL: 0, preBoilVolumeL: 0, grainAbsorptionL: 8 })).toBeNull();
  });
});
