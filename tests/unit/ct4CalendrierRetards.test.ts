/**
 * CT4-A-13 (critique tour 4) : « Maintenant : 1 en retard » disait « échéance le 20 déc. · 60 CHF » pour le 20 déc. 2025 : lu comme une échéance à
 * venir. Une date de retard dit son année quand ce n'est pas l'année en cours ; dans l'année, rien de plus (jamais « 3 nov. 2026 » partout).
 */
import { describe, expect, it } from 'vitest';
import { retardsDe, jourAvecAnnee, type EntreeRetards } from '../../src/domain/calendrier';
import { texteRetard } from '../../src/ui/calendrier/entete/Retards';

const base = (aujourdhui: string, echeance: string): EntreeRetards => ({
  aujourdhui, batches: [], items: [],
  restes: [{ id: 'ZZ-SOLDE', libelle: 'Solde atelier · ancienne année', cents: 6000, echeance, enRetard: true }]
});

describe('CT4-A-13 : l’année d’un retard d’une autre année', () => {
  it('une échéance de l’année passée dit « 20 déc. 2025 »', () => {
    const [r] = retardsDe(base('2026-11-20', '2025-12-20'));
    expect(r.detail).toBe('échéance le 20 déc. 2025 · 60 CHF');
    expect(texteRetard(r)).toBe('échéance le 20 déc. 2025 · 60 CHF');
  });
  it('une échéance de l’année en cours reste « 3 nov. », sans année', () => {
    const [r] = retardsDe(base('2026-11-20', '2026-11-03'));
    expect(r.detail).toBe('échéance le 3 nov. · 60 CHF');
  });
  it('jourAvecAnnee : l’année seulement quand elle diffère de celle d’aujourd’hui', () => {
    expect(jourAvecAnnee('2025-12-20', '2026-11-20')).toBe('20 déc. 2025');
    expect(jourAvecAnnee('2026-12-20', '2026-11-20')).toBe('20 déc.');
  });
});
