import { describe, expect, it } from 'vitest';
import { notesEnVirgule } from '../../src/pages/BrewDayPage';

// RL-13 : le texte de notes enregistré avec le brassin est figé avec des points décimaux ; l'écran fr-CH les lit avec la virgule.
describe('Notes de recette du jour de brassage', () => {
  it('RL-13 : les décimaux passent à la virgule, les dates et les versions restent', () => {
    const brut = 'OG 1.031 · FG 1.005 · ABV 3.4 % · 11.3 % AA · 90.7 IBU · ensemencement 27.5 °C · Empâtage 22.8 L (dont 14.8 L osmosée) · rinçage 17.2 L · enregistré le 05.09.2026 · v2.1.3';
    expect(notesEnVirgule(brut)).toBe('OG 1,031 · FG 1,005 · ABV 3,4 % · 11,3 % AA · 90,7 IBU · ensemencement 27,5 °C · Empâtage 22,8 L (dont 14,8 L osmosée) · rinçage 17,2 L · enregistré le 05.09.2026 · v2.1.3');
  });
  it('un texte absent reste vide, jamais « undefined »', () => {
    expect(notesEnVirgule(undefined)).toBe('');
    expect(notesEnVirgule('')).toBe('');
  });
});
