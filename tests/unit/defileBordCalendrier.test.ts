/**
 * Voie poignees, Q-4 (sa réponse du 24.11 : « Trop lente sur le calendrier » : le défilement quand on tient une barre ou la fenêtre au bord).
 * Le module partagé src/ui/geste ne change pas ; le Calendrier a son propre multiplicateur (×2,5) et son plafond de colonnes par seconde (8).
 * La montée progressive (la vitesse croît avec la profondeur du doigt dans la bande) reste.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { vitesseBord } from '../../src/ui/geste';

const src = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

describe('Q4-1 : le défilement au bord du Calendrier est ~×2,5 plus rapide', () => {
  it('plafond de 8 colonnes par seconde (3 avant)', async () => {
    const { COLONNES_MAX_PAR_S } = await import('../../src/ui/calendrier/frise/usePointeur');
    expect(COLONNES_MAX_PAR_S).toBe(8);
  });
  it('multiplicateur propre au Calendrier : ×2,5 sur la vitesse du module geste', async () => {
    const m = await import('../../src/ui/calendrier/frise/defileBord');
    expect(m.MULT_DEFILE_CALENDRIER).toBe(2.5);
    expect(m.vitesseCalendrier(0.15)).toBeCloseTo(0.375, 9);
    expect(m.vitesseCalendrier(1.35)).toBeCloseTo(3.375, 9);
  });
  it('montée progressive gardée : plus le doigt est profond dans la bande, plus la vitesse monte, et le bord de la bande reste doux', async () => {
    const { vitesseCalendrier } = await import('../../src/ui/calendrier/frise/defileBord');
    const v = [351, 360, 370, 380, 389].map(x => vitesseCalendrier(vitesseBord(x, 390, 1).vitesse));
    for (let i = 1; i < v.length; i++) expect(v[i]).toBeGreaterThan(v[i - 1]);
    expect(v[0]).toBeLessThan(0.5);
    expect(v[v.length - 1]).toBeGreaterThan(3);
  });
  it('le module partagé n’est pas touché : vitesseBord garde 0,15 à 1,35', () => {
    expect(vitesseBord(350.1, 390, 1).vitesse).toBeCloseTo(0.15, 2);
    expect(vitesseBord(389.9, 390, 1).vitesse).toBeGreaterThan(1.3);
    expect(vitesseBord(389.9, 390, 1).vitesse).toBeLessThan(1.4);
  });
  it('tenu au fond de la bande 2,5 s à 6 sem. (colonne de 65 px) : 20 colonnes, plafonnées à 8 par seconde', async () => {
    const { colonnesParImage } = await import('../../src/ui/calendrier/frise/usePointeur');
    const { vitesseCalendrier } = await import('../../src/ui/calendrier/frise/defileBord');
    const { vitesse } = vitesseBord(388, 390, 1);
    let acc = 0;
    for (let i = 0; i < 150; i++) acc += colonnesParImage(vitesseCalendrier(vitesse), 1 / 60, 390, 65);
    expect(acc).toBeGreaterThan(19);
    expect(acc).toBeLessThanOrEqual(20 + 1e-6);
  });
  it('les trois défilements du Calendrier passent par vitesseCalendrier : barres (usePointeur), cadre de l’en-tête (Fenetre), durée (DureeFenetre)', () => {
    expect(src('src/ui/calendrier/frise/usePointeur.ts')).toMatch(/colonnesParImage\(vitesseCalendrier\(vitesse\)/);
    expect(src('src/ui/calendrier/entete/Fenetre.tsx')).toMatch(/bord: \(sens, vitesseBrute, dt, s\)[\s\S]{0,260}vitesseCalendrier\(vitesseBrute\)/);
    expect(src('src/ui/calendrier/frise/DureeFenetre.tsx')).toMatch(/bord: \(sens, vitesseBrute, dt, s\)[\s\S]{0,260}vitesseCalendrier\(vitesseBrute\)/);
  });
});
