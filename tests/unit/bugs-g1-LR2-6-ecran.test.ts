// LR2-6 (g1, 20.11), côté écran : la ligne dont le montant est DÉDUIT du total (0,00, `montantDeduit` posé par le serveur) arrive dans le brouillon, en « repris » jaune (à contrôler), pas en rouge « à remplir ».
// Dès que le brasseur tape un autre montant, la marque ne compte plus.
import { describe, expect, it } from 'vitest';
import type { ScannedInvoiceResult } from '../../src/services/geminiScanner';
import { lignesDeLecture } from '../../src/ui/depense/finale';
import { confianceLigne } from '../../src/ui/depense/confiance';
import { contexteConfiance, ligneConfianceDe, niveauxRangee } from '../../src/ui/depense/rangees';

const item = (n: number, name: string, amountTTC: number | null, extra: Record<string, unknown> = {}) =>
  ({ id: `line-${n}`, name, kind: 'other', reference: '', variant: '', quantity: null, unit: '', price: null, amountTTC, stockCategory: '', evidence: '', ambiguity: '', vatCode: '', ...extra });
const lecture = (items: any[]): ScannedInvoiceResult => ({
  documentType: 'invoice', paymentEvidence: 'unknown', fieldWarnings: [], orderNumber: '', vendor: 'Atelier', date: '18.11.2026', currency: 'CHF', invoiceNumber: '', amountHT: null, tvaRate: null, tvaAmount: null,
  amountTTC: 768.55, category: 'divers', subcategory: '', description: 'Soins', items, issues: [], points: [],
  controls: { lines: { checked: 3, failed: 0, skipped: 0, skippedIds: [] }, sum: { statut: 'ok', base: 'TTC' }, vat: { statut: 'non-verifiable', base: 'TTC' }, totals: { statut: 'non-verifiable', base: 'TTC' } },
  review: { status: 'checked', findings: [], readers: 2 },
} as any);

const niveauMontant = (ligne: any, lignes: any[]) => {
  const c = contexteConfiance({ lines: lignes, vendor: 'Atelier', amount: 768.55 } as any, [], []);
  return confianceLigne(ligneConfianceDe(ligne), c).montant;
};

describe('LR2-6 écran : montant déduit', () => {
  it('la ligne du brouillon garde la marque, à 0,00', () => {
    const { lines } = lignesDeLecture(lecture([item(1, 'Sédation', 0, { montantDeduit: true }), item(2, 'Examen', 700), item(3, 'Soins', 68.55)]), [], 'sub-test');
    expect(lines[0]).toMatchObject({ amount: 0, montantDeduit: true });
    expect((lines[1] as any).montantDeduit).toBeUndefined();
  });
  it('niveau « repris » (jaune) avec sa raison ; « sûr » dès qu’un autre montant est tapé ; une ligne lue à 0,00 sans marque reste sûre', () => {
    const { lines } = lignesDeLecture(lecture([item(1, 'Sédation', 0, { montantDeduit: true }), item(2, 'Examen', 700), item(3, 'Soins', 68.55)]), [], 'sub-test');
    const m = niveauMontant(lines[0], lines);
    expect(m.niveau).toBe('repris');
    expect(m.raison).toMatch(/déduit/);
    expect(niveauxRangee(lines[0], { ...confianceLigne(ligneConfianceDe(lines[0]), contexteConfiance({ lines, vendor: 'Atelier', amount: 768.55 } as any, [], [])) } as any).montant).toBe('repris');
    expect(niveauMontant({ ...lines[0], amount: 12 }, lines).niveau).not.toBe('repris');
    expect(niveauMontant({ ...lines[0], montantDeduit: undefined }, lines).niveau).not.toBe('repris');
  });
});
