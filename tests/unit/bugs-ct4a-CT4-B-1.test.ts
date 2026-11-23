import { describe, expect, it, vi } from 'vitest';
import { dosePrevueLevure, tuilesDuBilan, textePriseLevure } from '../../src/pages/BrewDayPage';
import { relevesDuJour } from '../../src/domain/brewDayBilan';
import { besoinDeLaLevure } from '../../src/ui/etapeLevure/dose';
import { readYeastSupply } from '../../functions/src/yeastSupplySchema';
import bootstrap from '../../src/data/yeastSupplyBootstrap.json';
import { doseConseillee } from '../../src/ui/YeastRecipeHeading';
import { brewState, recipe } from '../fixtures/brewCompanion';

vi.mock('../../src/services/brewAlarms', () => ({ enableBrewAlerts: vi.fn(), syncBrewAlerts: vi.fn() }));

/** CT4-B-1 (critique tour 4, bloquant) : sans dose écrite, le jour J ne dit pas « 1 sachet » : il dit le besoin de la fiche. */
const sansDose = () => recipe({
  volumeL: 30, ogTarget: 1.066,
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05', form: 'sèche', pitchTempC: 19 } as never
});

describe('CT4-B-1 : la dose de levure du jour J', () => {
  it('sans dose écrite, la dose prévue est inconnue, jamais « 1 sachet »', () => {
    expect(dosePrevueLevure(sansDose(), { produitId: 'x', grammes: 11.5 } as never)).toBeUndefined();
  });
  it('la tuile Ensemencement dit le besoin de la fiche (même calcul) et « à écrire »', () => {
    const r = sansDose();
    const fiche = doseConseillee(r as never);
    expect(fiche).toMatch(/\d–\d sachets|\d sachets?/);
    const s = brewState(r);
    const t = tuilesDuBilan(relevesDuJour(s, r, Date.now()), r, s).find((x) => x.id === 'ensemencement');
    expect(t!.cible).not.toMatch(/(^| )1 sachet/);
    expect(t!.cible).toContain(`${fiche} · à écrire`);
  });
  it('la dose écrite reste dite telle quelle', () => {
    const r = { ...sansDose(), yeast: { ...sansDose().yeast, qty: 3, unit: 'sachet' } };
    const s = brewState(r);
    const t = tuilesDuBilan(relevesDuJour(s, r, Date.now()), r, s).find((x) => x.id === 'ensemencement');
    expect(t!.cible).toMatch(/3 sachets$/);
  });
  it('sans fiche liée : le besoin chiffré de l’étape Levure (même fonction), jamais « dose à écrire » seul', () => {
    const r = { ...sansDose(), yeast: { name: 'Levure maison', form: 'sèche' } as never };
    const besoin = besoinDeLaLevure(r as never, readYeastSupply(bootstrap)!);
    expect(besoin?.sachets).toBeGreaterThan(1);
    const dit = besoin!.sachets!.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    expect(textePriseLevure(r)).toBe(`besoin ${dit} sachets · à écrire`);
    const s = brewState(r);
    const t = tuilesDuBilan(relevesDuJour(s, r, Date.now()), r, s).find((x) => x.id === 'ensemencement');
    expect(t!.cible).toContain('à écrire');
    expect(t!.cible).not.toMatch(/dose à écrire/);
  });
  it('sans volume ni densité : « dose à écrire », pas de chiffre inventé', () => {
    const r = { ...sansDose(), volumeL: 0, ogTarget: undefined, yeast: { name: 'Levure maison', form: 'sèche' } as never };
    expect(textePriseLevure(r as never)).toBe('dose à écrire');
  });
});
