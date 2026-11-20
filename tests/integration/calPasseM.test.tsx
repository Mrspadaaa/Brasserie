// @vitest-environment jsdom
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BancCalendrier } from '../../src/design/CalendrierPreview';
import { modifierIdee } from '../../src/domain/calendrierGestes';

/* CAL-PASSE (voie M, 20.11) : calendriers de section (les rangées, pas seulement les choses) ; une idée hors carnet se modifie sur place.
   La preuve au doigt est dans scripts/parcours/calendrier.mjs et cal5/m ; ces tests tiennent les règles. */
afterEach(() => cleanup());
const JOUR = '2026-11-16';
const rangees = () => [...document.querySelectorAll('section[data-rangee]')].map(r => r.getAttribute('data-rangee'));

describe('un calendrier de section ne montre que ses rangées (E44, calendriers-section)', () => {
  it('Finances : les rangées d’argent seulement (avant : les sept rangées, vides comprises)', () => {
    render(<BancCalendrier aujourdhui={JOUR} sansChrome callbacks={{ section: 'finances' }} />);
    const vues = rangees();
    expect(vues.length).toBeGreaterThan(0);
    for (const r of vues) expect(['ventes', 'achats', 'travaux', 'papiers']).toContain(r);
    expect(vues).not.toContain('brassins');
    expect(vues).not.toContain('fetes');
  });
  it('Brassins : brassins et ventes ; sans section : toutes les rangées', () => {
    render(<BancCalendrier aujourdhui={JOUR} sansChrome callbacks={{ section: 'brassins' }} />);
    for (const r of rangees()) expect(['brassins', 'ventes']).toContain(r);
    cleanup();
    render(<BancCalendrier aujourdhui={JOUR} sansChrome />);
    expect(rangees().length).toBe(7);
  });
});

describe('une idée hors carnet : sa feuille sur place (modifierIdee)', () => {
  it('le titre et la semaine s’écrivent dans l’idée ; le jour posé dans la semaine gardée reste ; Annuler est offert', () => {
    const r = modifierIdee('CR-IDEE', '  IPA brume 2  ', '2026-11-16', '2026-11-18');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.ecritures).toEqual([{ op: 'patch', collection: 'creativeItems', id: 'CR-IDEE', patch: { title: 'IPA brume 2', date: '2026-11-18' } }]);
      expect(r.message.action).toBe('Annuler');
    }
  });
  it('une autre semaine (même au passé) : le lundi de cette semaine ; un titre vide est refusé', () => {
    const r = modifierIdee('CR-IDEE', 'IPA', '2026-10-26', '2026-11-18');
    expect(r.ok && r.ecritures[0]).toMatchObject({ patch: { date: '2026-10-26' } });
    expect(modifierIdee('CR-IDEE', '   ', '2026-11-16', null).ok).toBe(false);
  });
});
