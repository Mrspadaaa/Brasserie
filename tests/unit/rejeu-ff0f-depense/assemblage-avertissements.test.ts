/**
 * Rejeu en ligne ff0f822e, RL-6 et RL-7 (pièce fictive ticket-long-tva.png, 63 lignes de texte pour 19 articles : coupée en 3 parties) : les avertissements d'UNE partie parlent de cette
 * partie. Une fois les parties recollées, « Total TTC non présent sur cette première partie » (alors que le total est lu sur la 3e) et « ligne tronquée, montant sur la suite »
 * (alors que la suite l'a complétée) sont faux ; ils restaient à l'écran, « À confirmer ». Règle de l'assemblage, la même que celle des points de lecture :
 *   - en-tête : seuls les avertissements de la première partie (les autres laissent l'en-tête vide, par consigne) ;
 *   - totaux : seulement si le total fusionné manque encore, et ceux de la partie qui porte les totaux (la dernière qui en lit un, sinon la dernière) ;
 *   - lignes : ceux d'une partie qui disent « tronquée / suite sur l'autre partie » tombent quand l'assemblage a recollé la suite à cette coupe (il la signale déjà) ; les autres restent.
 * Fixtures fictives, aucun appel IA.
 */
import { describe, expect, it } from 'vitest';
import { assemblerMorceaux, jonctionsRecues } from '../../../functions/src/invoiceAssemblage';
import { morceauNote } from '../../../functions/src/invoiceMorceaux';

const art = (name: string, amountTTC: number | null, extra: any = {}) => ({ name, kind: 'stock', quantity: 1, unit: 'Stk', price: amountTTC, amountTTC, ...extra });
const partie = (k: number, n: number, items: any[], extra: any = {}) => ({
  vendor: k === 1 ? 'Brassi-Shop Fictif Sarl' : '', date: k === 1 ? '27.09.2026' : '', currency: k === 1 ? 'CHF' : '', documentType: 'receipt', amountTTC: null,
  items, morceau: { k, n }, review: { status: 'checked', readers: 2 }, points: [], fieldWarnings: [], ...extra,
});
const TOTAL_ABSENT = 'Total TTC non présent sur cette première partie du document coupé.';
const RABAIS = 'Rabais carte fidelite : Ligne tronquée en bas de page, montant sur la suite du document';
const champs = (r: any) => r.fieldWarnings.map((w: any) => `${w.field}: ${w.message}`);

/** Le ticket : 3 parties ; la 1re annonce que le total manque, la 2e que sa dernière ligne (le rabais) est tronquée, la 3e porte la suite du rabais et le total. */
const troisParties = () => [
  partie(1, 3, [art('Malt Pale Ale 5 kg', 16.5), art('Malt Munich 1 kg', 8.4)], { fieldWarnings: [{ field: 'amountTTC', message: TOTAL_ABSENT }] }),
  partie(2, 3, [art('Sac de brassage 40 cm', 12.5), art('Rabais carte fidelite', null, { quantity: null, price: null, unit: '' })], { fieldWarnings: [{ field: 'items', message: RABAIS }] }),
  partie(3, 3, [art('', -5, { suite: true, quantity: null, price: null, unit: '' }), art('Sachet papier', 0.3)], { amountTTC: 165.2, paymentEvidence: 'paid' }),
];
const bandes = jonctionsRecues({ jonctions: [{ k: 1, sautDePage: true }, { k: 2, sautDePage: true }] });

describe('RL-6, RL-7 : l\'assemblage ne garde que les avertissements encore vrais', () => {
  it('RL-6 : le total lu sur la 3e partie supprime « Total TTC non présent sur cette première partie »', () => {
    const r = assemblerMorceaux(troisParties(), bandes);
    expect(r.amountTTC).toBe(165.2);
    expect(champs(r).join(' | ')).not.toMatch(/Total TTC non présent/);
    expect(r.fieldWarnings.filter((w: any) => w.field === 'amountTTC')).toEqual([]);
  });
  it('RL-7 : le rabais dont la suite a été recollée n\'est plus « tronqué » (l\'assemblage le signale déjà, une fois)', () => {
    const r = assemblerMorceaux(troisParties(), bandes);
    expect(r.items.map((i: any) => [i.name, i.amountTTC])).toContainEqual(['Rabais carte fidelite', -5]);
    expect(champs(r).join(' | ')).not.toMatch(/tronquée/);
    expect(r.points.filter((p: any) => /article coupé entre les parties 2 et 3, recollé/.test(p.message))).toHaveLength(1);
  });
  it('un total vraiment absent de toutes les parties reste signalé, une seule fois (celui de la dernière partie)', () => {
    const parties = [
      partie(1, 2, [art('A', 1)], { fieldWarnings: [{ field: 'amountTTC', message: 'Total absent de la première partie.' }] }),
      partie(2, 2, [art('B', 2)], { fieldWarnings: [{ field: 'amountTTC', message: 'Total TTC absent du document.' }] }),
    ];
    const r = assemblerMorceaux(parties, jonctionsRecues({ jonctions: [{ k: 1, sautDePage: true }] }));
    expect(r.amountTTC).toBeNull();
    expect(champs(r).filter(t => t.startsWith('amountTTC'))).toEqual(['amountTTC: Total TTC absent du document.']);
  });
  it('en-tête : l\'avertissement d\'une partie suivante (elle laisse l\'en-tête vide) tombe, celui de la première reste', () => {
    const parties = [
      partie(1, 2, [art('A', 1)], { vendor: '', fieldWarnings: [{ field: 'vendor', message: 'Fournisseur illisible.' }] }),
      partie(2, 2, [art('B', 2)], { amountTTC: 3, fieldWarnings: [{ field: 'date', message: 'Date absente de cette partie.' }, { field: 'vendor', message: 'Fournisseur absent de cette partie.' }] }),
    ];
    const r = assemblerMorceaux(parties, jonctionsRecues({ jonctions: [{ k: 1, sautDePage: true }] }));
    expect(champs(r)).toEqual(['vendor: Fournisseur illisible.']);
  });
  it('un avertissement de ligne qui ne parle pas d\'une coupe reste (rien de vrai n\'est jeté)', () => {
    const parties = troisParties();
    parties[1].fieldWarnings = [{ field: 'items', message: 'Sac de brassage 40 cm : prix peu lisible.' }, { field: 'items', message: RABAIS }];
    const r = assemblerMorceaux(parties, bandes);
    expect(champs(r)).toEqual(['items: Sac de brassage 40 cm : prix peu lisible.']);
  });
  it('sans suite recollée, « ligne tronquée » reste : l\'assemblage n\'a rien réparé', () => {
    const parties = troisParties();
    parties[2].items = [art('Sachet papier', 0.3)]; // la 3e partie ne reprend pas le rabais : rien n'est recollé
    const r = assemblerMorceaux(parties, bandes);
    expect(champs(r).join(' | ')).toMatch(/tronquée/);
  });
});

describe('la consigne d\'un morceau ne pousse pas à ces avertissements', () => {
  it('elle dit qu\'une ligne dont le montant est sur la partie voisine se rend telle quelle, sans avertissement, et qu\'un champ lu sur une autre partie n\'en mérite pas', () => {
    const consigne = morceauNote(2, 3);
    expect(consigne).toMatch(/sans avertissement/);
    expect(consigne).toMatch(/fieldWarnings/);
    expect(consigne).toMatch(/total|date|fournisseur/i);
  });
});
