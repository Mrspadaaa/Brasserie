/* Voie b-houblons, atelier V5.5 (09.11) : BR-38 (message du dossier illisible), BR-43 (bornes d'un réglage). */
import { describe, expect, it } from 'vitest';
import { workspaceShapeProblem } from '../../../src/services/hopV55/workspaceRepository';
import { hopV55ReglageBornes } from '../../../src/ui/hopV55/ProgramEditor';

const valide = () => ({ format: 'hop-v55-workspace-v1', id: 'w1', ownerKey: 'dev', revision: 0, title: 'Stout export', scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: '2026-11-09T10:00:00.000Z' });

describe('BR-38 — « Structure du workspace houblon invalide » dit sa cause', () => {
  it('un dossier valide ne signale rien', () => expect(workspaceShapeProblem(valide())).toBeNull());
  it.each([
    [{ ...valide(), nouveauChamp: 1 }, /champ inattendu « nouveauChamp »/],
    [{ ...valide(), format: 'v0' }, /format « v0 »/],
    [{ ...valide(), title: '  ' }, /titre du dossier absent/],
    [{ ...valide(), revision: -1 }, /révision/],
    [{ ...valide(), updatedAt: 'hier' }, /date de mise à jour/],
    [{ ...valide(), copies: undefined }, /liste des copies absente/],
    ['texte', /n’est pas un document/],
  ])('%j : la phrase nomme le défaut', (valeur, motif) => expect(workspaceShapeProblem(valeur)).toMatch(motif));
});

describe('BR-43 — bornes réalistes d’un réglage (table bornesMetier)', () => {
  it('masse : 40 g/L du volume, 800 g pour 20 L ; sans volume, aucune borne inventée', () => {
    expect(hopV55ReglageBornes('boil', 20).masseMaxG).toBe(800);
    expect(hopV55ReglageBornes('boil', null).masseMaxG).toBeUndefined();
  });
  it('ébullition ≤ 240 min ; contact whirlpool ≤ 3 h ; à cru ≤ 720 h ; jour ≤ 60', () => {
    expect(hopV55ReglageBornes('boil', 20).ebullitionMaxMin).toBe(240);
    expect(hopV55ReglageBornes('whirlpool', 20).contactMaxH).toBe(3);
    expect(hopV55ReglageBornes('fermentation', 20).contactMaxH).toBe(720);
    expect(hopV55ReglageBornes('fermentation', 20).jourMax).toBe(60);
  });
  it('température : whirlpool 40–100 °C, à cru −2–40 °C, ébullition 0–100 °C : −1 °C et 99 999 h sont refusés', () => {
    expect(hopV55ReglageBornes('whirlpool', 20)).toMatchObject({ temperatureMinC: 40, temperatureMaxC: 100 });
    expect(hopV55ReglageBornes('postFermentation', 20)).toMatchObject({ temperatureMinC: -2, temperatureMaxC: 40 });
    const b = hopV55ReglageBornes('boil', 20);
    expect(-1).toBeLessThan(b.temperatureMinC);
    expect(99999).toBeGreaterThan(b.contactMaxH);
  });
});
