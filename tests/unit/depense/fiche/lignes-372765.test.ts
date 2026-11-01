/**
 * Voie s6-fiche, étape 0 (T13) : ce que la règle unique dit des 23 lignes de la facture 372765 face au stock SIMULÉ du banc (celui d'e-port : Target 11,8,
 * Hallertauer Blanc DE 9.5%, Verdant absent). Lecture SIMULÉE (sortie du vrai rapprochement du serveur). Les lignes qui gagnent un voisin sont écrites une à une.
 */
import { describe, expect, it } from 'vitest';
import lecture from '../../../../src/ui/depense/apercu/lecture-372765.reconciliee.json';
import stockJson from '../../../../src/ui/depense/apercu/stock-simule.json';
import { matchStockLine, regleProduit, STOCK_PROPOSAL_KINDS } from '../../../../src/services/stockLineMatching';

const stock = [...(stockJson.articles as any[]).filter(a => a.name !== 'Verdant IPA').map(a => (a.name === 'Target' ? { ...a, name: 'Target 11.8%' } : a)),
  { id: 'Hallertauer', ref: 'MP-Hallertauer', name: 'Hallertauer Blanc DE 9.5%', unit: 'g', category: 'Houblon', currentStock: 100, minStock: 0, reorder: false }] as any[];
const items = (lecture.items as any[]).map(i => ({ description: [i.name, i.variant].filter(Boolean).join(' · '), unit: i.unit, quantity: i.quantity, stockCategory: i.stockCategory, reference: i.reference, kind: i.kind === 'stock' ? 'ingredient' : i.kind === 'service' ? 'service' : 'other', vendor: (lecture as any).vendor }));

describe('les 23 lignes de la facture 372765 face au stock simulé', () => {
  const lignes = items.map((l, i) => ({ n: i + 1, l, s1: (STOCK_PROPOSAL_KINDS as readonly string[]).includes(l.kind) ? matchStockLine(l, stock) : undefined, regle: (STOCK_PROPOSAL_KINDS as readonly string[]).includes(l.kind) ? regleProduit(l, stock) : undefined }));
  it('affiche le tableau (pour RESULTAT)', () => {
    // eslint-disable-next-line no-console
    console.log(lignes.filter(x => x.regle).map(x => `${String(x.n).padStart(2)} ${x.l.description.padEnd(34)} s1=${x.s1?.item.name ?? '—'} · règle=${x.regle!.cas}${'voisin' in x.regle! ? ` voisin=${(x.regle as any).voisin.name}` : ''}${'nom' in x.regle! ? ` nom=« ${(x.regle as any).nom} »` : ''}`).join('\n'));
  });
  it('s1 ne change pas : mêmes lignes reliées qu’avant S6', () => {
    expect(lignes.filter(x => x.s1).map(x => x.n)).toEqual(lignes.filter(x => x.regle?.cas === 'meme').map(x => x.n));
  });
  it('les lignes qui gagnent un voisin sont celles-ci, et aucune autre', () => {
    const avecVoisin = lignes.filter(x => x.regle && ['neuf', 'incertain', 'ambigu'].includes(x.regle.cas)).map(x => `${x.n}:${x.regle!.cas}`);
    expect(avecVoisin).toEqual(['8:neuf', '22:neuf']);
  });
});
