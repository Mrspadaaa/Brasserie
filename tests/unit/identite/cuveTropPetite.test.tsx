// @vitest-environment jsdom
/**
 * ID-TROP-AMBIGU (19.11) : « Plus on evapore, plus on a de litre en trop ??? » — « +3,7 L de trop » se lisait comme du moût en trop.
 * Cas de sa capture : 29 L visés, ébullition 130 min (~6,5 L évaporés), ~38,7 L à chaud avant ébullition, cuve utile 35 L.
 * Son choix : « Juste, alors juste, de l'eau à la fin après l'ebul ou durant » ; « Juste alors ajouter un renvoi » (Eau / grain, Rinçage).
 */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrewingMath } from '../../../src/services/brewingMath';
import { practicalBrewingPreferences, practicalEquipment } from '../../../src/domain/brewEquipment';
import { densiteAvantEbullition } from '../../../src/domain/brewDay';
import { waterBalance } from '../../../src/domain/water/volumeBalance';
import { CarteVolume } from '../../../src/ui/identite/CarteVolume';
import { remedesCuve } from '../../../src/ui/identite/regles';
import type { BrewhouseProfile, RecipeSnapshot } from '../../../src/types';

afterEach(cleanup);

// Le matériel de la brasserie (cuve utile 35 L, 3 L/h d'évaporation, 4 % de rétraction), 1,5 L de fond de cuve, 70 g de houblon en cuve.
const profil: BrewhouseProfile = {
  id: 'p', name: 'Royal Catering', volumeL: 26, efficiencyPct: 75, boilOffRatePct: 10, deadSpaceL: 1.5, mashRatioLPerKg: 4.2,
  equipment: { ...practicalEquipment }, preferences: { ...practicalBrewingPreferences }
};
const GRAIN = 6.5;
const plan = (o?: { topUpToKettle?: boolean }) => BrewingMath.waterVolumes(GRAIN, 29, profil, 'batch', 130, 70, o);

describe('le calcul du cas de la capture', () => {
  it('29 L, 130 min : ~6,5 L évaporés et ~38,7 L à chaud avant ébullition, au-dessus de la cuve de 35 L', () => {
    const p = plan();
    expect(practicalEquipment.boilOffLPerHour * 130 / 60).toBeCloseTo(6.5, 5);
    expect(p.preBoilHotL).toBe(38.7);
    expect(p.preBoilHotL! > practicalEquipment.kettleWorkingL).toBe(true);
    // Plus on évapore, plus il faut de moût au départ : 60 min de moins, 3 L de moins avant ébullition.
    expect(BrewingMath.waterVolumes(GRAIN, 29, profil, 'batch', 70, 70).preBoilHotL).toBe(35.7);
  });

  it('eau ajoutée choisie : 3,7 L, le moût d’avant ébullition tient dans la cuve, le volume final reste 29 L', () => {
    const sans = plan();
    const avec = plan({ topUpToKettle: true });
    expect(avec.topUpL).toBe(3.7);
    expect(avec.preBoilHotL!).toBeLessThanOrEqual(practicalEquipment.kettleWorkingL);
    // 3,7 L d'eau en moins à l'empâtage et au rinçage : la même eau, ajoutée plus tard.
    expect(Math.round((sans.mashWaterL + sans.spargeWaterL - avec.mashWaterL - avec.spargeWaterL) * 10) / 10).toBe(3.7);
    // Bilan : (avant − évaporation) refroidi + eau ajoutée − fond de cuve − houblon = 29 L en fermenteur.
    const froid = 1 - practicalEquipment.coolingShrinkagePct / 100;
    const brut = (GRAIN * 0 + (avec.mashWaterL + avec.spargeWaterL - GRAIN * practicalEquipment.grainAbsorptionLPerKg) / froid - 6.5) * froid
      + avec.topUpL! - 1.5 - avec.hopLossL;
    expect(brut).toBeCloseTo(29, 0);
    expect(avec.issues.join(' ')).not.toMatch(/avant ébullition dépasse/);
  });

  it('l’étape Eau ne dit pas « Il manque 3,6 L d’eau » : le moût visé avant ébullition compte l’eau ajoutée', () => {
    const avec = plan({ topUpToKettle: true });
    const bilan = waterBalance({ mashWaterL: avec.mashWaterL, spargeWaterL: avec.spargeWaterL, preBoilVolumeL: avec.preBoilVolumeL, grainAbsorptionL: avec.grainAbsorptionL });
    expect(bilan?.shortL ?? 0).toBe(0);
  });

  it('sans choix, rien ne change : pas d’eau ajoutée, le dépassement est dit', () => {
    expect(plan().topUpL ?? 0).toBe(0);
    expect(plan().issues.join(' ')).toMatch(/avant ébullition dépasse la limite utile de la cuve/);
  });

  it('la densité avant ébullition compte l’eau ajoutée (points conservés jusqu’au volume final)', () => {
    const avec = plan({ topUpToKettle: true });
    const snap = {
      ogTarget: 1.06, boilMin: 130, preBoilHotL: avec.preBoilHotL, brewhouse: profil,
      installation: { kettleTopUp: true, topUpL: avec.topUpL }
    } as unknown as RecipeSnapshot;
    const froid = 0.96;
    const apresChaud = avec.preBoilHotL! - 6.5 + avec.topUpL! / froid;
    const attendue = Math.round((1 + 0.06 * apresChaud / avec.preBoilHotL!) * 1000) / 1000;
    expect(densiteAvantEbullition(snap)).toBe(attendue);
    // Le moût bouilli est plus concentré que sans eau ajoutée : sa densité avant ébullition est plus haute.
    const sansSnap = { ...snap, preBoilHotL: 38.7, installation: {} } as unknown as RecipeSnapshot;
    expect(densiteAvantEbullition(snap)!).toBeGreaterThan(densiteAvantEbullition(sansSnap)!);
  });
});

describe('remedesCuve : les remèdes chiffrés', () => {
  it('38,7 L pour 35 L, 6,5 L en 130 min, 29 L : 3,7 L d’eau, ou 55 min, ou 25 L', () => {
    expect(remedesCuve({ avantL: 38.7, cuveL: 35, evapL: 6.5, minutes: 130, retraitPct: 4, volumeL: 29 }))
      .toEqual({ tropL: 3.7, eauL: 3.7, ebullitionMin: 55, volumeL: 25 });
  });
  it('rien qui déborde : null ; évaporation inconnue : pas de durée proposée', () => {
    expect(remedesCuve({ avantL: 34, cuveL: 35, evapL: 6.5, minutes: 130, retraitPct: 4, volumeL: 29 })).toBeNull();
    expect(remedesCuve({ avantL: 38.7, cuveL: 35, evapL: null, minutes: 130, retraitPct: 4, volumeL: 29 })?.ebullitionMin).toBeNull();
  });
});

const rendu = (o: { avant: number; eauAjouteeL?: number }) => {
  const onEauAjoutee = vi.fn(); const onVersEau = vi.fn(); const onMinutes = vi.fn(); const onVolume = vi.fn();
  render(
    <CarteVolume
      volumeL={29} onVolume={onVolume} capaciteL={30} profilL={30} conseilL={24} cuveL={35}
      avantEbullition={{ litres: o.avant, evapL: 6.5 }} onOuvrirFermenteur={() => undefined}
      remedes={remedesCuve({ avantL: 38.7, cuveL: 35, evapL: 6.5, minutes: 130, retraitPct: 4, volumeL: 29 })}
      minutes={130} eauAjouteeL={o.eauAjouteeL} onEauAjoutee={onEauAjoutee} onVersEau={onVersEau} onMinutes={onMinutes}
    />
  );
  return { onEauAjoutee, onVersEau, onMinutes, onVolume };
};

describe('CarteVolume : la cuve qui déborde se dit, le remède se choisit', () => {
  it('le message nomme la cuve : « Cuve trop petite : 38,7 L pour 35 L », jamais « de trop »', () => {
    rendu({ avant: 38.7 });
    const deb = document.querySelector('[data-role="debordement"]')!;
    expect(deb.textContent).toBe('Cuve trop petite : 38,7 L pour 35 L');
    expect(document.querySelector('[data-carte="volume"]')!.textContent).not.toMatch(/\+3,7 L de trop/);
    // La cause : l'ébullition longue.
    expect(document.querySelector('[data-role="cause-cuve"]')!.textContent).toMatch(/130 min.*~6,5 L/);
  });

  it('le remède mis en avant : « Ajouter 3,7 L d’eau pendant ou après l’ébullition », qui se choisit', () => {
    const f = rendu({ avant: 38.7 });
    fireEvent.click(screen.getByRole('button', { name: /Ajouter 3,7 L d’eau pendant ou après l’ébullition/ }));
    expect(f.onEauAjoutee).toHaveBeenCalledWith(true);
    fireEvent.click(screen.getByRole('button', { name: /55 min/ }));
    expect(f.onMinutes).toHaveBeenCalledWith(55);
    fireEvent.click(screen.getByRole('button', { name: /25 L/ }));
    expect(f.onVolume).toHaveBeenCalledWith(25);
  });

  it('un renvoi vers Eau / grain et Rinçage de l’étape Eau', () => {
    const f = rendu({ avant: 38.7 });
    fireEvent.click(screen.getByRole('button', { name: /Eau \/ grain et rinçage/ }));
    expect(f.onVersEau).toHaveBeenCalled();
  });

  it('choisie : plus d’alerte, l’eau ajoutée est dite et se retire', () => {
    const f = rendu({ avant: 34.8, eauAjouteeL: 3.7 });
    expect(document.querySelector('[data-role="debordement"]')).toBeNull();
    expect(document.querySelector('[data-role="eau-ajoutee"]')!.textContent).toMatch(/\+3,7 L d’eau pendant ou après l’ébullition/);
    fireEvent.click(screen.getByRole('button', { name: /Retirer l’eau ajoutée/ }));
    expect(f.onEauAjoutee).toHaveBeenCalledWith(false);
  });
});
