import { describe, expect, it } from 'vitest';
import { demandeRealiseSansAchat, realiseSansAchat } from '../../src/domain/finance/realiseSansAchat';

describe('WFA-12 : « réalisé » sans achat lié', () => {
  it('demande seulement quand aucun achat n’est lié et qu’un montant est prévu', () => {
    expect(realiseSansAchat({ amountCents: 45000 }, 0)).toBe(true);
    expect(realiseSansAchat({ amountCents: 45000 }, 1)).toBe(false);
    expect(realiseSansAchat({ amountCents: 0 }, 0)).toBe(false); // rien de prévu : rien ne sort de la caisse
  });
  it('dit ce que le geste fait : les francs prévus sortent sans avoir été payés', () => {
    const d = demandeRealiseSansAchat({ title: 'Pompe de transfert', amountCents: 45000 });
    expect(d.question).toBe('« Pompe de transfert » : aucun achat lié');
    expect(d.detail).toMatch(/450[,.]00/);
    expect(d.detail).toContain('sans avoir été payés');
    expect(d.oui).toBe('Réalisé, sans achat');
  });
});
