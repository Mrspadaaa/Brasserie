import { describe, expect, it } from 'vitest';
import { etatConnexions, etatReglages, suffixeJournal } from '../../src/components/plus/etats';
import type { Bilan, Point } from '../../src/components/reglages/regles';

const bilan = (...points: Array<[Point['etat'], string]>): Bilan => ({
  points: points.map(([etat, libelle], i) => ({ id: `p${i}`, onglet: 'fiscal', etat, libelle })),
  segments: [], ko: 0, to: 0, ok: 0, parOnglet: { fiscal: 'ok', brewhouse: 'ok', security: 'ok', backup: 'na' }
});

describe('Plus : états à droite des lignes (m3)', () => {
  it('Connexions : Drive d\'abord, le niveau d\'IA quand tout va bien', () => {
    expect(etatConnexions('connecte', 'fast')).toEqual({ texte: 'Drive · IA Rapide', niveau: 'ok' });
    expect(etatConnexions('connecte', 'max').texte).toBe('Drive · IA Max');
    expect(etatConnexions('a-connecter', 'fast')).toEqual({ texte: 'Drive à connecter', niveau: 'alerte' });
    expect(etatConnexions('a-renouveler', 'fast')).toEqual({ texte: 'Drive à renouveler', niveau: 'alerte' });
  });

  it('Réglages : une erreur se nomme, plusieurs se comptent, les trous viennent après', () => {
    expect(etatReglages(bilan(['ko', 'IBAN'], ['to', 'Statut TVA']))).toEqual({ texte: 'IBAN à corriger', niveau: 'alerte' });
    expect(etatReglages(bilan(['ko', 'IBAN'], ['ko', 'TVA réduite']))).toEqual({ texte: '2 erreurs', niveau: 'alerte' });
    expect(etatReglages(bilan(['ok', 'IBAN'], ['to', 'Statut TVA']))).toEqual({ texte: 'Statut TVA à saisir', niveau: 'neutre' });
    expect(etatReglages(bilan(['to', 'A'], ['to', 'B'], ['to', 'C']))).toEqual({ texte: '3 à saisir', niveau: 'neutre' });
    expect(etatReglages(bilan(['ok', 'IBAN'], ['na', 'Dernière copie']))).toEqual({ texte: 'réglé', niveau: 'ok' });
    expect(etatReglages(undefined)).toBeNull();
  });

  it('Journal : « en novembre » (m3), l\'année seulement hors de l\'année courante', () => {
    const maintenant = new Date(2026, 10, 15);
    expect(suffixeJournal({ genre: 'mois', annee: 2026, mois: 11 }, maintenant)).toBe('en novembre');
    expect(suffixeJournal({ genre: 'mois', annee: 2025, mois: 10 }, maintenant)).toBe('en octobre 2025');
    expect(suffixeJournal({ genre: 'annee', annee: 2026 }, maintenant)).toBe('en 2026');
    expect(suffixeJournal({ genre: 'tout' }, maintenant)).toBe('depuis le début');
  });
});
