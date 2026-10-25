// @vitest-environment jsdom
// Voie rb2-ma-biere : le radar de Ma bière sur le radar commun (src/ui/hopIndex/commun/RadarBase.tsx). Ce qu'il doit tenir :
// la baseline (data-radar="base", 12 axes), « pas senti » ≠ « pas goûté », l'inconnu jamais 0 : AUCUN point sur une famille
// pas goûtée, son secteur hachuré à sa place ; l'échelle des notes commune (jamais normalisée par axe, D68) ; l'orangé
// au-dessus du style, au même seuil que la grille ; et la garde de structure du radar commun.
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { ROUE } from '../../../src/ui/hopIndex/familyTokens';
import { RadarBiere, auDessus, type Note } from '../../../src/ui/hopIndex/maBiere/RadarBiere';
import type { FamilyId } from '../../../src/domain/hopIndex/v4';

afterEach(cleanup);

const rien = () => Object.fromEntries(ROUE.map((f) => [f, null])) as Record<FamilyId, Note>;
const haut = Object.fromEntries(ROUE.map((f) => [f, 1.5])) as Record<FamilyId, number>;

function dessiner(notes: Record<FamilyId, Note>) {
  const r = render(<RadarBiere notes={notes} haut={haut} attendues={['floral', 'herbal']} etatSommet="etat-biere-radar-sommet" />);
  const svg = r.container.querySelector('svg[data-radar]')!;
  const points = [...svg.querySelectorAll('circle[data-point]')].map((c) => c.getAttribute('data-point'));
  const inconnus = [...svg.querySelectorAll('polygon[data-inconnu]')].map((p) => p.getAttribute('data-inconnu'));
  return { ...r, svg, points, inconnus };
}

describe('RadarBiere sur le radar commun', () => {
  it('porte la baseline : data-radar="base", 12 axes dans l’ordre de la roue, au style sur une échelle commune', () => {
    const { svg } = dessiner({ ...rien(), resin: 3 });
    expect(svg.getAttribute('data-radar')).toBe('base');
    expect(svg.getAttribute('data-objet')).toBe('biere');
    expect(svg.getAttribute('data-axes')).toBe(ROUE.join(','));
    expect(svg.getAttribute('data-mode')).toBe('style');
    expect(svg.getAttribute('data-echelle-axe')).toBe('commune');
    expect([...svg.querySelectorAll('[data-role="echelle"] text')].map((t) => t.textContent)).toEqual(['pas senti', 'faible', 'moyen', 'marqué']);
  });

  it('aucun point sur une famille pas goûtée : son secteur est hachuré à sa place, jamais un zéro', () => {
    const notes = { ...rien(), resin: 3, floral: 0, herbal: 2 } as Record<FamilyId, Note>;
    const { points, inconnus, svg } = dessiner(notes);
    const pasGoute = ROUE.filter((f) => notes[f] == null);
    expect(points.sort()).toEqual(['floral', 'herbal', 'resin']);
    for (const f of pasGoute) expect(points, f).not.toContain(f);
    expect(inconnus.sort()).toEqual([...pasGoute].sort());
    // Le picto d'une famille pas goûtée reste à sa place, pâli et marqué « ? ».
    for (const f of pasGoute) expect(svg.querySelector(`[data-axe-inconnu="${f}"]`)?.textContent, f).toContain('?');
    // « pas senti » (0) est un point, posé sur l'anneau du zéro, pas au centre.
    const [cx, cy] = svg.getAttribute('data-centre')!.split(',').map(Number);
    const zero = svg.querySelector('circle[data-point="floral"]')!;
    expect(zero.getAttribute('data-valeur')).toBe('0');
    expect(Math.hypot(Number(zero.getAttribute('cx')) - cx, Number(zero.getAttribute('cy')) - cy)).toBeGreaterThan(20);
  });

  it('rien de goûté : ni point, ni trait, douze secteurs hachurés', () => {
    const { points, inconnus, svg } = dessiner(rien());
    expect(points).toEqual([]);
    expect(inconnus).toHaveLength(12);
    expect(svg.querySelectorAll('g[data-serie] line, g[data-serie] polygon, g[data-serie] path')).toHaveLength(0);
  });

  it('l’orangé au-dessus du style, au seuil de la grille (0,05), et le toucher dit la famille en mots', () => {
    const { svg, container } = dessiner({ ...rien(), resin: 3, herbal: 1 });
    expect(auDessus(3, 1.5)).toBe(true);
    expect(svg.querySelector('circle[data-point="resin"]')!.getAttribute('fill')).toBe('#c2410c');
    expect(svg.querySelector('circle[data-point="herbal"]')!.getAttribute('fill')).toBe('#0072B2');
    const cible = svg.querySelector('[data-sommet="resin"]')!;
    expect(cible.getAttribute('data-etat')).toBe('etat-biere-radar-sommet');
    fireEvent.pointerDown(cible);
    expect(container.querySelector('[data-role="bulle-radar"]')?.textContent).toBe('Résineux : marqué, au-dessus du style');
    fireEvent.pointerDown(svg.querySelector('[data-sommet="melon"]')!);
    expect(container.querySelector('[data-role="bulle-radar"]')?.textContent).toMatch(/^Melon : pas goûté, inconnu/);
  });

  it('garde de structure : le radar commun vit dans l’app, sans la maquette ni l’alias @app ; la maquette le réexporte', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../../../src/ui/hopIndex/commun/RadarBase.tsx'), 'utf8');
    for (const i of [...src.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((m) => m[1])) expect(i).not.toMatch(/prototypes|^@app\//);
    const maquette = path.resolve(__dirname, '../../../prototypes/houblons-v4/parcours/src/commun');
    expect(fs.existsSync(path.join(maquette, 'RadarBase.tsx'))).toBe(false);
    expect(fs.readFileSync(path.join(maquette, 'RadarBase.ts'), 'utf8')).toMatch(/@app\/ui\/hopIndex\/commun\/RadarBase/);
  });
});
