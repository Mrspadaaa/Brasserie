// LR2-6 (g1, 20.11 ; doc2 lu en réel, « Sédation ») : une ligne sans montant lisible alors que TOUTES les autres ont le leur et que leur somme égale déjà le total imprimé :
// « 1 à remplir » rouge et « Autres 768,55 + ? » rouge à côté d'une somme verte. Décision du pilote : la ligne reçoit 0,00, marqué « déduit (somme = total) » (`montantDeduit`) ; sinon rien ne change.
// Réponses RÉELLES du modèle (anonymisées, `tests/unit/depense/g1/brut/doc2-sedation.json`), rejouées par la lecture de production.
import { describe, expect, it } from 'vitest';
import { normalizeInvoiceScan } from '../../functions/src/invoiceScanCore';
import { entete, ligne } from './depense/lecture/aide';
import { lireFixture, normaliser } from './depense/g1/lire';

const lue = (name: string, amountTTC: number | null) => ligne({ name, kind: 'other', quantity: null, unit: '', price: null, amountTTC, evidence: name });
const lire = (items: any[], total: number | null) => normalizeInvoiceScan(entete({ vendor: 'Atelier', date: '06.08.2024', documentType: 'invoice', paymentEvidence: 'unknown', amountHT: null, tvaRate: null, tvaAmount: null, amountTTC: total, vat: [], items })) as any;

describe('LR2-6 : la ligne sans montant, quand la somme des autres fait déjà le total', () => {
  it('une seule ligne sans montant, somme des autres = total : 0,00 marqué déduit, somme ok, plus de « somme incomplète »', () => {
    const r = lire([lue('Sédation', null), lue('Examen', 700), lue('Soins', 68.55)], 768.55);
    expect(r.items[0]).toMatchObject({ amountTTC: 0, montantDeduit: true });
    expect(r.items[1].montantDeduit).toBeUndefined();
    expect(r.controls.sum.statut).toBe('ok');
    expect(r.points.filter((p: any) => p.code === 'somme-incomplete')).toEqual([]);
  });
  it('sinon rien ne change : somme ≠ total, deux lignes sans montant, total non imprimé, un 0,00 lu', () => {
    const ecart = lire([lue('Sédation', null), lue('Examen', 700), lue('Soins', 60)], 768.55);
    expect(ecart.items[0].amountTTC).toBeNull();
    expect(ecart.items[0].montantDeduit).toBeUndefined();
    expect(ecart.controls.sum.statut).toBe('incomplet');
    const deux = lire([lue('Sédation', null), lue('Examen', null), lue('Soins', 768.55)], 768.55);
    expect(deux.items.map((i: any) => i.amountTTC)).toEqual([null, null, 768.55]);
    const sansTotal = lire([lue('Sédation', null), lue('Soins', 768.55)], null);
    expect(sansTotal.items[0].amountTTC).toBeNull();
    const lu0 = lire([lue('Sédation', 0), lue('Soins', 768.55)], 768.55);
    expect(lu0.items[0].amountTTC).toBe(0);
    expect(lu0.items[0].montantDeduit).toBeUndefined();
  });
  it('doc2 (lecture réelle) : chaque lecture et la lecture finale portent la ligne sans montant à 0,00 déduit ; la somme est verte', async () => {
    for (const lecture of normaliser('doc2-sedation')) {
      const sans = lecture.items.filter((i: any) => i.montantDeduit);
      expect(sans).toHaveLength(1);
      expect(sans[0].amountTTC).toBe(0);
    }
    const r = await lireFixture('doc2-sedation');
    const deduites = r.items.filter((i: any) => i.montantDeduit);
    expect(deduites).toHaveLength(1);
    expect(deduites[0].amountTTC).toBe(0);
    expect(r.controls.sum.statut).toBe('ok');
    expect(r.points.filter((p: any) => p.code === 'somme-incomplete')).toEqual([]);
  });
});
