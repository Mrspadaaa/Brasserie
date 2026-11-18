// LT-3 (lecture en ligne du 08.11, tickets Bauhaus doc15 et doc16, vérité H13-reels/cas-6.json) : le « 1 » imprimé après le prix n'était pas repris comme quantité : 13 à 15 lignes sur 17
// réclamaient « unité à remplir » et « Qté × prix » restait à 0/17. Sur un ticket de caisse, « 1 » = 1 pièce.
// Deux protections : la consigne de lecture le dit, et la normalisation reprend le « 1 » de la ligne imprimée (champ `evidence`, l'extrait exact) quand le modèle a laissé la quantité vide
// et que ce « 1 » suit le prix lu. Jamais une quantité qui n'est pas imprimée. LIMITE : aucune réponse brute enregistrée de doc15/doc16 n'existe dans le dépôt (H13-reels ne garde que la vérité) ;
// les lignes ci-dessous sont imitées de la vérité de cas-6.json (désignations et prix réels du ticket), avec la forme d'extrait des vraies réponses (« texte imprimé p. 1 »). À rejouer sur la pièce.
import { describe, expect, it } from 'vitest';
import { TASKS } from '../../../../functions/src/prompts';
import { normalizeInvoiceScan } from '../../../../functions/src/invoiceScanCore';
import { entete, ligne } from '../lecture/aide';

const ticket = (items: any[], documentType = 'receipt') => normalizeInvoiceScan(entete({ vendor: 'BAUHAUS Fachcentren AG', date: '06.08.2024', documentType, paymentEvidence: 'paid', amountHT: null, tvaRate: null, tvaAmount: null, amountTTC: 93.35, vat: [], items })) as any;
const lue = (name: string, price: number, evidence: string, more: Record<string, unknown> = {}) => ligne({ name, kind: 'other', quantity: null, unit: '', price, amountTTC: null, evidence, ...more });

describe('LT-3 — sur un ticket de caisse, le « 1 » après le prix est la quantité', () => {
  it('la consigne de lecture le dit', () => {
    const consigne = (TASKS as any).scanInvoice.system as string;
    expect(consigne).toMatch(/ticket de caisse de magasin, un entier isolé imprimé après le prix/);
    expect(consigne).toMatch(/« 1 » = 1 pièce/);
  });
  it('quantité vide mais « 86.95 1 » imprimé après le prix lu : quantité 1, montant de ligne = prix', () => {
    const r = ticket([lue('vitrific.p.sol 5,8kg', 86.95, 'vitrific.p.sol 5,8kg 86.95 1 p. 1'), lue('bauhaus sac grand', 1.2, 'bauhaus sac grand 1.20 1 p. 1')]);
    expect(r.items.map((i: any) => i.quantity)).toEqual([1, 1]);
    expect(r.items.map((i: any) => i.amountTTC)).toEqual([86.95, 1.2]);
  });
  it('le « 3 » imprimé après le prix est 3, jamais multiplié', () => {
    const r = ticket([lue('bac a peinture 32x36', 5.2, 'bac a peinture 32x36 5.20 3 p. 1')]);
    expect(r.items[0].quantity).toBe(3);
    expect(r.items[0].amountTTC).toBeNull();
  });
  it('rien n’est inventé : pas de nombre après le prix, ou un nombre qui ne suit pas le prix lu, ou un autre type de document', () => {
    expect(ticket([lue('bauhaus sac grand', 1.2, 'bauhaus sac grand 1.20 p. 1')]).items[0].quantity).toBeNull();
    expect(ticket([lue('bauhaus sac grand', 1.2, 'bauhaus sac grand 9.90 1 p. 1')]).items[0].quantity).toBeNull();
    expect(ticket([lue('bauhaus sac grand', 1.2, 'bauhaus sac grand 1.20 1 p. 1')], 'invoice').items[0].quantity).toBeNull();
  });
  it('une quantité déjà lue n’est jamais réécrite', () => {
    expect(ticket([lue('bauhaus sac grand', 1.2, 'bauhaus sac grand 1.20 1 p. 1', { quantity: 2 })]).items[0].quantity).toBe(2);
  });
});
