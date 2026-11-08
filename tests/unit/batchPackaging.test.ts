import { describe, expect, it } from 'vitest';
import { packagingLimitL, validatePackaging, needsPackagingVolume } from '../../src/domain/batchPackaging';

// AM n° 6 : le volume conditionné est l'assiette de la taxe sur la bière (LIB, art. 17). Il se saisit au passage « Conditionné » :
// 0 < conditionné ≤ volume en fermenteur ; la date de conditionnement n'est ni avant le brassage ni dans le futur.
const ok = { maxL: 22, today: '2026-11-08', brewDate: '01.10.2026' };

describe('AM n° 6 : volume conditionné borné', () => {
  it('la borne est le volume brassé mesuré, sinon le volume visé', () => {
    expect(packagingLimitL({ volumeBrewedL: 21.5, volumeL: 25 })).toBe(21.5);
    expect(packagingLimitL({ volumeL: 25 })).toBe(25);
    expect(packagingLimitL({})).toBeNull();
  });
  it('accepte 0 < v ≤ borne, date entre le brassage et aujourd’hui', () => {
    expect(validatePackaging({ ...ok, volumeL: 20, date: '08.11.2026' })).toEqual({ ok: true });
    expect(validatePackaging({ ...ok, volumeL: 22, date: '15.10.2026' })).toEqual({ ok: true });
  });
  it('refuse vide, 0, négatif, NaN, au-dessus du fermenteur, avec le motif', () => {
    for (const volumeL of [null, 0, -3, NaN]) expect(validatePackaging({ ...ok, volumeL, date: '08.11.2026' }).ok).toBe(false);
    const trop = validatePackaging({ ...ok, volumeL: 22.5, date: '08.11.2026' });
    expect(trop.ok).toBe(false);
    if (!trop.ok) expect(trop.error).toMatch(/22 L/);
  });
  it('refuse une date illisible, avant le brassage ou dans le futur', () => {
    expect(validatePackaging({ ...ok, volumeL: 20, date: '' }).ok).toBe(false);
    expect(validatePackaging({ ...ok, volumeL: 20, date: '30.09.2026' }).ok).toBe(false);
    expect(validatePackaging({ ...ok, volumeL: 20, date: '09.11.2026' }).ok).toBe(false);
  });
  it('sans borne connue (ni volume brassé ni volume visé) : refusé, l’inconnu n’est pas 0 ni sans limite', () => {
    expect(validatePackaging({ ...ok, maxL: null, volumeL: 20, date: '08.11.2026' }).ok).toBe(false);
  });
  it('le volume est demandé à Conditionné et Terminé tant qu’il manque ou est invalide', () => {
    expect(needsPackagingVolume({ status: 'conditionne' })).toBe(true);
    expect(needsPackagingVolume({ status: 'termine', volumePackagedL: 0 })).toBe(true);
    expect(needsPackagingVolume({ status: 'termine', volumePackagedL: 19 })).toBe(false);
    expect(needsPackagingVolume({ status: 'fermentation' })).toBe(false);
  });
});
