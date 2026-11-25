// Lot 5 du Carnet en ligne (23.11) : la liste des carnets. L-30 (la phrase qui dit plus que le titre n'ouvre pas le carnet en silence),
// L-33 (une carte Idée dit son coût et sa date).
import { describe, expect, it } from 'vitest';
import { nommeLeCarnet } from '../../src/domain/carnets/rattacher';
import { prixDe, quandDe } from '../../src/ui/carnets/ListeCarnets';
import type { CarnetV } from '../../src/ui/carnets/EtatIA';

describe('L-30 : nommeLeCarnet ne vaut que pour une phrase qui ne dit rien de plus que le titre', () => {
  it('ouvre le carnet nommé (tour 3, f5b n° 3)', () => {
    expect(nommeLeCarnet('Ventilation de la salle', 'ZZ TEST — Ventilation de la salle de brassage')).toBe(true);
    expect(nommeLeCarnet('chambre froide', 'Chambre froide')).toBe(true);
    expect(nommeLeCarnet('la chambre froide', 'Chambre froide')).toBe(true);
    expect(nommeLeCarnet('chambres froides', 'Chambre froide')).toBe(true);
  });
  it('CA12-M3-3 : un nombre ou une mesure de plus ne se perd pas', () => {
    expect(nommeLeCarnet('ZZ TEST — M3 — chambre froide 2,6 m3', 'Chambre froide')).toBe(false);
    expect(nommeLeCarnet('chambre froide 2,6 m3', 'Chambre froide')).toBe(false);
  });
  it('CA12-M4-24 : un mot de plus, même un mot vide de la recherche, ne se perd pas', () => {
    expect(nommeLeCarnet('ZZ TEST — M4 — idée chambre froide', 'Chambre froide')).toBe(false);
    expect(nommeLeCarnet('chambre froide plus grande', 'Chambre froide')).toBe(false);
    expect(nommeLeCarnet('nouvelle chambre froide', 'Chambre froide')).toBe(false);
  });
});

const idee = (x: { estimatedCost?: number; criteres?: string[]; date?: string; precision?: 'semaine' | 'mois' }): CarnetV => ({
  id: 'C1', title: 'Hotte recyclage', status: 'idea', ...(x.date ? { date: x.date } : {}), ...(x.precision ? { precision: x.precision } : {}),
  ...(x.estimatedCost !== undefined ? { estimatedCost: x.estimatedCost } : {}),
  carnet: { phrase: 'Hotte recyclage', articles: [], facons: [], notes: [], photos: [], criteres: (x.criteres ?? []).map((texte, i) => ({ id: `K${i}`, texte, origine: 'vous' })) }
} as unknown as CarnetV);

describe('L-33 : une carte Idée sans article dit son coût et sa date', () => {
  it('le prix estimé du carnet (« Prix estimé », estimatedCost)', () => {
    expect(prixDe(idee({ estimatedCost: 500 }))).toMatchObject({ des: false, devise: 'CHF', sorte: 'estime' });
    expect(prixDe(idee({ estimatedCost: 500 }))!.texte).toMatch(/500/);
  });
  it('sinon le budget écrit (« Budget du Planning : 3 500 CHF »)', () => {
    const p = prixDe(idee({ criteres: ['Budget du Planning : 3 500 CHF'] }));
    expect(p).toMatchObject({ devise: 'CHF', sorte: 'budget' });
    expect(p!.texte.replace(/\D/g, '')).toMatch(/^3500/);
  });
  it('rien d’inventé sans prix ni budget', () => {
    expect(prixDe(idee({ criteres: ['Silencieux'] }))).toBeNull();
  });
  it('la date du carnet en horizon (« vers févr. », « S48 »)', () => {
    /* R105 (c77) : une date hors de l'année en cours dit son année, quelle que soit sa forme (« vers févr. 2027 » vu de novembre 2026) */
    expect(quandDe(idee({ date: '2027-02-01' }), '2026-11-23')).toBe('vers févr. 2027');
    expect(quandDe(idee({ date: '2026-12-14' }), '2026-11-23')).toBe('vers déc.');
    expect(quandDe(idee({ date: '2026-11-30', precision: 'semaine' }), '2026-11-23')).toBe('S49');
    expect(quandDe(idee({}), '2026-11-23')).toBeNull();
  });
});
