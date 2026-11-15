import { describe, expect, it } from 'vitest';
import type { Transaction } from '../../src/types';
import { decoderLigneVente, encoderLigneVente } from '../../src/ui/vente/ligneVente';
import { bieresDesVentes, groupesParFormat, nomFormat, ventesAuLitre, SANS_CLIENT } from '../../src/domain/tarifs/ventesAuLitre';
import { disposerFrise, marqueProche } from '../../src/domain/tarifs/friseDisposition';
import { echelleLog } from '../../src/domain/tarifs/echellePrix';

const vente = (id: string, date: string, vendor: string | undefined, lignes: [string, string, number, number, number][], kind = 'income', voidedAt?: string) => ({
  id, date, description: '', amountHT: 0, tvaRate: 0, tvaAmount: 0, amountTTC: 0, category: 'Ventes', subcategory: '',
  finance: { version: 1, kind, amountCents: 0, vendor, voidedAt, lines: lignes.map(([lot, f, l, q, c], i) => ({ id: `${id}-${i}`, description: '', kind: 'other', quantity: q, amountCents: c, sourceReference: encoderLigneVente(lot, f, l) })) }
}) as unknown as Transaction;
const lots: Record<string, string> = { B1: 'Blonde', B2: 'IPA' };
const lire = (transactions: Transaction[]) => ventesAuLitre({ transactions, clients: [{ name: 'Famille Rochat', type: 'Privé' }, { name: 'Café du Commerce', type: 'Pro' }],
  decoder: decoderLigneVente, biereDuLot: (id) => (id ? lots[id] ?? null : null), estDemo: (id) => id.startsWith('DEMO') });

describe('ventesAuLitre', () => {
  it('prend le prix le plus récent par client, bière et format ; ramène au litre', () => {
    const v = lire([
      vente('T1', '01.09.2026', 'Famille Rochat', [['B1', 'fut', 20, 1, 16000]]),
      vente('DEMO-2', '12.10.2026', 'famille rochat', [['B1', 'fut', 20, 1, 17000]]),
      vente('T3', '05.10.2026', 'Café du Commerce', [['B1', '33cl', 0.33, 24, 8400], ['B2', 'fut', 20, 2, 32000]]),
    ]);
    expect(v).toHaveLength(3);
    const rochat = v.find((x) => x.qui === 'Famille Rochat')!;
    expect([rochat.prix, rochat.litre, rochat.genre, rochat.demo, rochat.biere]).toEqual([170, 8.5, 'prive', true, 'Blonde']);
    const bouteille = v.find((x) => x.formatId === '33cl')!;
    expect(bouteille.prix).toBe(3.5);
    expect(bouteille.genre).toBe('pro');
    expect(v.find((x) => x.biere === 'IPA')!.prix).toBe(160);
  });
  it('ignore annulées, dépenses, montants nuls (offert) ; sans client ni fiche : genre inconnu, jamais deviné', () => {
    const v = lire([
      vente('A', '01.10.2026', 'X', [['B1', 'fut', 20, 1, 15000]], 'income', '2026-10-02'),
      vente('B', '01.10.2026', 'Y', [['B1', 'fut', 20, 1, 15000]], 'expense'),
      vente('C', '01.10.2026', 'Z', [['B1', 'fut', 20, 1, 0]]),
      vente('D', '01.10.2026', undefined, [['-', '33cl', 0.33, 6, 2100]]),
      vente('E', '01.10.2026', 'Bar inconnu', [['B1', '33cl', 0.33, 6, 2100]]),
    ]);
    expect(v.map((x) => [x.qui, x.genre, x.biere])).toEqual([[SANS_CLIENT, 'inconnu', null], ['Bar inconnu', 'inconnu', 'Blonde']]);
  });
  it('deux ventes sans client restent deux prix ; un client nommé n’en garde qu’un (le plus récent)', () => {
    const v = lire([
      vente('S1', '01.10.2026', undefined, [['B1', 'verre', 0.3, 1, 600]]),
      vente('S2', '02.10.2026', undefined, [['B1', 'verre', 0.3, 1, 650]]),
      vente('N1', '01.10.2026', 'Bar X', [['B1', 'verre', 0.3, 1, 500]]),
      vente('N2', '02.10.2026', 'Bar X', [['B1', 'verre', 0.3, 1, 550]]),
    ]);
    expect(v.map((x) => [x.qui, x.prix]).sort()).toEqual([['Bar X', 5.5], [SANS_CLIENT, 6], [SANS_CLIENT, 6.5]]);
  });
  it('nomme les formats et classe les bières', () => {
    expect([nomFormat('fut', 20), nomFormat('33cl', 0.33), nomFormat('carton', 3.96), nomFormat('verre', 0.3), nomFormat('xx', 1.5)])
      .toEqual(['Fût 20 L', 'Bouteille 33 cl', 'Carton 12 × 33 cl', 'Verre 3 dl', 'xx · 1,5 L']);
    const v = lire([vente('T', '01.10.2026', 'Café du Commerce', [['B1', 'fut', 20, 1, 14000], ['B1', '33cl', 0.33, 1, 350], ['B2', 'fut', 20, 1, 16000]])]);
    expect(bieresDesVentes(v)).toEqual(['Blonde', 'IPA']);
    expect(groupesParFormat(v, 'Blonde').map((g) => g.nom)).toEqual(['Fût 20 L', 'Bouteille 33 cl']);
    expect(groupesParFormat(v, null)[0].ventes).toHaveLength(2);
  });
});

describe('disposerFrise', () => {
  const v = lire([
    vente('T1', '01.10.2026', 'Café du Commerce', [['B1', 'fut', 20, 1, 14000]]),
    vente('T2', '01.10.2026', 'Famille Rochat', [['B1', 'fut', 20, 1, 14000]]),
    vente('T3', '01.10.2026', 'Désalpe', [['B1', 'fut', 20, 1, 11500]]),
    vente('T4', '01.10.2026', 'Auberge', [['B1', 'fut', 20, 1, 14200]]),
  ]);
  const g = groupesParFormat(v, 'Blonde');
  const e = echelleLog(4.5, 23, 46, 324);
  const d = disposerFrise(g, e.x, 340, 46);
  it('fait un amas ×2 des prix égaux, placé d’abord, et ne chevauche pas', () => {
    expect(d.marques[0].ventes).toHaveLength(2);
    const boites = d.marques.map((m) => [m.cx - m.largeur / 2, m.py - 12, m.cx + m.largeur / 2, m.py + 12]);
    for (let i = 0; i < boites.length; i++) for (let j = i + 1; j < boites.length; j++) {
      const [a, b] = [boites[i], boites[j]];
      const recouvre = Math.min(a[2], b[2]) - Math.max(a[0], b[0]) > 1 && Math.min(a[3], b[3]) - Math.max(a[1], b[1]) > 1;
      expect(recouvre).toBe(false);
    }
  });
  it('nomme l’écart de plus de 12 % (Désalpe), pas les autres', () => {
    expect(d.noms.map((n) => n.texte)).toEqual(['Désalpe']);
  });
  it('un toucher dans le couloir ouvre la marque la plus proche', () => {
    const m = d.marques.find((q) => q.ventes[0].qui === 'Désalpe')!;
    expect(marqueProche(d.marques, 0, m.cx - 6, m.py + 4)).toBe(m);
    expect(marqueProche(d.marques, 1, m.cx, m.py)).toBeNull();
  });
});
