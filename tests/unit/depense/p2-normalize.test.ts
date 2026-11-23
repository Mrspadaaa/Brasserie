// p2 1b : le client lit `retirees` du serveur comme n'importe quelle ligne ; une clé absente reste absente, une valeur invalide est jetée (jamais 0).
import { describe, expect, it } from 'vitest';
import { GeminiScannerService } from '../../../src/services/geminiScanner';
import { provisoireDeRetirees } from '../../../src/ui/depense/finale';

const brut = (extra: Record<string, unknown> = {}) => ({ vendor: 'Sun Store Fictive SA', date: '05.11.2026', currency: 'CHF', amountTTC: 149.25, tvaAmount: 0, items: [{ name: 'Vaccin grippe 1 dose', kind: 'other', quantity: 1, unit: 'pièce', price: 26.68, amountTTC: 26.68 }], ...extra });
describe('p2 1b — `retirees` côté client', () => {
  it('lit les lignes (prix, montant, id « retiree-N »), le rang, le total et la TVA d’avant', () => {
    const r = GeminiScannerService.normalizeResult(brut({ retirees: { lignes: [{ rang: 0, ligne: { name: 'Paracétamol 500 mg', kind: 'other', quantity: 1, unit: 'pièce', price: 5.4, amountTTC: 5.4 } }], amountTTC: 163.85, tvaAmount: 0.37 } }));
    expect(r.retirees).toMatchObject({ amountTTC: 163.85, tvaAmount: 0.37, lignes: [{ rang: 0, ligne: { id: 'retiree-1', name: 'Paracétamol 500 mg', amountTTC: 5.4 } }] });
  });
  it('sans `retirees` : aucune clé ; rang invalide ou valeur non numérique : jetés', () => {
    expect(GeminiScannerService.normalizeResult(brut()).retirees).toBeUndefined();
    expect(GeminiScannerService.normalizeResult(brut({ retirees: { lignes: [{ rang: 'x', ligne: { name: 'A' } }], amountTTC: 'beaucoup' } })).retirees).toBeUndefined();
  });
  it('le provisoire reconstruit remet la ligne à son rang, le total d’avant, et chaque ligne finale dit son rang', () => {
    const r = GeminiScannerService.normalizeResult(brut({ items: [brut().items[0], { ...brut().items[0], name: 'Vaccin covid 1 dose', price: 75.15, amountTTC: 75.15 }], retirees: { lignes: [{ rang: 1, ligne: { name: 'Paracétamol 500 mg', kind: 'other', quantity: 1, unit: 'pièce', price: 5.4, amountTTC: 5.4 } }], amountTTC: 163.85 } }));
    const x = provisoireDeRetirees(r)!;
    expect(x.provisoire.items.map(i => i.name)).toEqual(['Vaccin grippe 1 dose', 'Paracétamol 500 mg', 'Vaccin covid 1 dose']);
    expect(x.provisoire.items.map(i => i.id)).toEqual(['line-1', 'line-2', 'line-3']);
    expect(x.provisoire.amountTTC).toBe(163.85);
    expect(x.final.items.map(i => i.rangProvisoire)).toEqual([0, 2]);
    expect(x.final.provisoireJeton).toBeTruthy();
    expect(provisoireDeRetirees(GeminiScannerService.normalizeResult(brut()))).toBeNull();
  });
});
