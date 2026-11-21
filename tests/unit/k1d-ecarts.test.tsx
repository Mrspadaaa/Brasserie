// @vitest-environment jsdom
/* k1d (21.11, mission carnet-tour3) : écarts de l'app à sa maquette ra+p5f (h05-3, i06-4, g05-1), relevés sur les planches k1c.
   - un projet du Planning ouvert : son titre vient du Planning, pas de sa phrase (« votre phrase en titre » ment) ; le critère
     « Budget du Planning : … » n'est pas « de votre phrase » ;
   - la pastille d'une façon dit le critère en minuscule (h05-3 « capte la buée » / « ne capte pas la buée ») : jamais « ne Tient pas » ;
   - Brassins › Atelier › Carnet : le champ du bas tient au-dessus de la barre d'onglets (C8, R27 ; k2 à 390).
   Aucune donnée réelle, aucune IA. */
import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn(() => { throw new Error('Gemini ne doit jamais être appelé ici'); }) } }));

import { CarnetsVue } from '../../src/ui/carnets/CarnetsVue';
import { nier } from '../../src/ui/carnets/CarnetOuvert';
import { magasinMemoire } from '../../src/services/carnetsStore';
import { aidesCarnet } from '../../src/config/carnetIA';
import { planMigration } from '../../scripts/planning-vers-carnet/correspondance';
import taches from '../../scripts/planning-vers-carnet/fixture-planning.json';

afterEach(() => cleanup());
const LE = '2026-11-20T12:00:00.000Z';

describe('k1d · projet du Planning ouvert (h05-3, i06-4)', () => {
  it('ni « votre phrase en titre », ni « Budget du Planning … · de votre phrase »', async () => {
    const plan = planMigration(taches as never, new Set(), LE);
    const sol = plan.aEcrire.find(c => c.budget && /^Sol, murs/.test(c.titre))!;
    expect(sol, 'projet Sol, murs… avec budget dans la fixture').toBeTruthy();
    const magasin = magasinMemoire(plan.aEcrire.flatMap(c => c.docs));
    const id = sol.docs.find(d => d.id.startsWith('CARNET-PLANNING-'))!.id;
    render(<CarnetsVue magasin={magasin} finances={{ plans: [], transactions: [], payments: [] }} mode="production"
      aides={aidesCarnet('production', {})} maintenant={() => new Date(LE)} ecrirePlan={() => {}} ouvrir={{ id, at: 1 }} />);
    await act(async () => { await new Promise(r => setTimeout(r, 30)); });
    const t = document.body.textContent ?? '';
    expect(t).toContain('Budget du Planning');
    expect(t).not.toContain('votre phrase en titre');
    expect(t).not.toMatch(/Budget du Planning[^·]*·\s*de votre phrase/);
  });
});

describe('k1d · pastille de façon en minuscule (h05-3)', () => {
  it('« Tient 2 °C » se nie « ne tient pas 2 °C » ; un sigle garde sa majuscule', () => {
    expect(nier('Tient 2 °C')).toBe('ne tient pas 2 °C');
    expect(nier('Aspire la buée')).toBe("n'aspire pas la buée");
    expect(nier('tient 80 °C')).toBe('ne tient pas 80 °C');
    expect(nier('CO2 sous 7 g')).toBe('ne CO2 pas sous 7 g');
  });
});

describe('k1d · Atelier › Carnet : le champ du bas au-dessus de la barre (C8, R27 ; k2 à 390)', () => {
  it('la porte de l’Atelier borne la hauteur du Carnet comme Stocks › Matériel (le fil défile, le champ reste au-dessus de la barre)', () => {
    const css = readFileSync(join(__dirname, '../../src/ui/carnets/atelier-porte.css'), 'utf8');
    expect(css).toMatch(/\.atp-carnets\s*\{[^}]*flex:\s*1/);
    expect(css).toMatch(/\.atp\[data-onglet=carnet\]\s*\{[^}]*height:/);
    const src = readFileSync(join(__dirname, '../../src/ui/carnets/AtelierPorte.tsx'), 'utf8');
    expect(src).toMatch(/data-onglet=\{mobile \? onglet : undefined\}/);
  });
});
