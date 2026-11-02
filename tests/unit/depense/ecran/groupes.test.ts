// Voie p3c-port : les calculs purs des bandes (groupes.ts). Données : la facture 372765 (diagnostic d1) telle que la maquette p3c-3 la montre.
import { describe, expect, it } from 'vitest';
import { bandes, groupeDe, lignesDePort, numerosPapier, portCents, texteQte, type LigneBande } from '../../../../src/ui/depense/groupes';

const L = (id: string, groupe: LigneBande['groupe'], amount: number | undefined, quantity: number | undefined, unit: string, extra: Partial<LigneBande> = {}): LigneBande =>
  ({ id, groupe, amount, quantity, unit, uniteLisible: unit.trim() !== '', mouture: false, ...extra });
// 372765 : 7 malts (18 Kg) + 5 moutures, 7 houblons (270 g + 30 ?), 4 levures (7 Stk) = 86,50.
const facture = (): LigneBande[] => [
  L('1', 'malt', 13.8, 6, 'Kg'), L('2', 'malt', 0.6, 6, 'Kg', { mouture: true }), L('3', 'malt', 2.4, 1, 'Kg'), L('4', 'malt', 1.8, 1, 'Kg'), L('5', 'malt', 0.1, 1, 'Kg', { mouture: true }),
  L('6', 'malt', 1.75, 1, 'Kg'), L('7', 'malt', 0.1, 1, 'Kg', { mouture: true }),
  L('8', 'houblon', 1.6, 40, 'g'), L('9', 'houblon', 0.8, 20, 'g'),
  L('10', 'levure', 9, 2, 'Stk', { sachets: 2 }), L('11', 'levure', 4.4, 1, 'Stk', { sachets: 1 }), L('12', 'levure', 6.8, 2, 'Stk', { sachets: 2 }),
  L('13', 'malt', 7.5, 5, 'Kg'), L('14', 'malt', 0.5, 5, 'Kg', { mouture: true }), L('15', 'malt', 3.1, 2, 'Kg'), L('16', 'malt', 0.2, 2, 'Kg', { mouture: true }), L('17', 'malt', 5, 2, 'Kg'),
  L('18', 'houblon', 4.8, 60, 'g'), L('19', 'houblon', 8, 100, 'g'), L('20', 'houblon', 2.1, 30, ''), L('21', 'levure', 9.4, 2, 'Stk', { sachets: 2 }),
  L('22', 'houblon', 1.35, 30, 'g'), L('23', 'houblon', 1.4, 20, 'g'),
];
const somme = (b: ReturnType<typeof bandes>) => b.reduce((s, x) => s + x.cents, 0);

describe('bandes : sous-totaux de 372765', () => {
  const b = bandes(facture());
  it('Malts : 7 lignes, 5 moutures rattachables, 36,85, 18 Kg', () => {
    const m = b.find(x => x.cle === 'malt')!;
    expect(m.ids).toHaveLength(7); expect(m.moutureIds).toHaveLength(5); expect(m.cents).toBe(3685); expect(texteQte(m.qte)).toBe('18 Kg');
  });
  it('Houblons : 7 lignes, 20,05, « 270 g + 30 ? » (l’unité illisible reste à part, jamais ajoutée)', () => {
    const h = b.find(x => x.cle === 'houblon')!;
    expect(h.ids).toHaveLength(7); expect(h.cents).toBe(2005); expect(texteQte(h.qte)).toBe('270 g + 30 ?');
  });
  it('Levures : 4 lignes, 29,60, 7 Stk, « = 7 sachets » seulement parce que chaque conversion est sûre', () => {
    const l = b.find(x => x.cle === 'levure')!;
    expect(l.ids).toHaveLength(4); expect(l.cents).toBe(2960); expect(texteQte(l.qte)).toBe('7 Stk'); expect(l.eqb).toBe('= 7 sachets');
  });
  it('« Autres » absente (une bande sans ligne n’existe pas) ; Σ = 86,50 en centimes entiers', () => {
    expect(b.map(x => x.cle)).toEqual(['malt', 'houblon', 'levure']); expect(somme(b)).toBe(8650);
  });
  it('pas de « = n sachets » quand une conversion manque', () => {
    const l = bandes([L('a', 'levure', 4, 1, 'Stk', { sachets: 1 }), L('b', 'levure', 4, 1, 'Stk')]).find(x => x.cle === 'levure')!;
    expect(l.eqb).toBeUndefined();
  });
});

describe('invariant de somme : Σ bandes + dont port = Σ lignes du brouillon (centimes entiers)', () => {
  it('avec un port de 8,50 : 8650 + 850 = 9500', () => {
    const lignes = [...facture().map(l => ({ id: l.id, kind: 'ingredient', amount: l.amount })), { id: 'p', kind: 'shipping', amount: 8.5 }];
    const port = lignesDePort(lignes);
    expect([...port]).toEqual(['p']); expect(portCents(lignes, port)).toBe(850);
    expect(somme(bandes(facture())) + (portCents(lignes, port) as number)).toBe(9500);
  });
  it('une mouture sans parent va dans « Autres » ; la somme est la même', () => {
    const f = facture(); f[1] = { ...f[1], groupe: 'autres', mouture: false };
    const b = bandes(f);
    expect(b.find(x => x.cle === 'autres')!.cents).toBe(60); expect(somme(b)).toBe(8650);
  });
  it('un montant absent ne devient pas 0 : le sous-total est marqué incomplet', () => {
    const b = bandes([L('a', 'houblon', 1, 10, 'g'), L('b', 'houblon', undefined, 10, 'g')]).find(x => x.cle === 'houblon')!;
    expect(b.cents).toBe(100); expect(b.incomplet).toBe(true);
  });
});

describe('lignesDePort : le critère en un seul endroit', () => {
  const autres = [{ id: 'a', kind: 'ingredient', amount: 5 }, { id: 'b', kind: 'ingredient', amount: 6 }];
  it('port valide : écarté', () => expect([...lignesDePort([...autres, { id: 'p', kind: 'shipping', amount: 8.5 }])]).toEqual(['p']));
  it('port sans montant : reste une rangée', () => expect(lignesDePort([...autres, { id: 'p', kind: 'shipping' }]).size).toBe(0));
  it('port négatif : reste une rangée', () => expect(lignesDePort([...autres, { id: 'p', kind: 'shipping', amount: -1 }]).size).toBe(0));
  it('port à trois décimales : reste une rangée', () => expect(lignesDePort([...autres, { id: 'p', kind: 'shipping', amount: 2.005 }]).size).toBe(0));
  it('port à 0,00 : un port connu, « dont port 0,00 »', () => {
    const l = [...autres, { id: 'p', kind: 'shipping', amount: 0 }], port = lignesDePort(l);
    expect([...port]).toEqual(['p']); expect(portCents(l, port)).toBe(0);
  });
  it('document réduit à son port : une rangée, pas de « dont port »', () => {
    const l = [{ id: 'p', kind: 'shipping', amount: 12.5 }];
    expect(lignesDePort(l).size).toBe(0); expect(portCents(l, lignesDePort(l))).toBeNull();
  });
  it('aucun port : rien', () => expect(portCents(autres, lignesDePort(autres))).toBeNull());
});

describe('unités : jamais additionnées entre elles', () => {
  it('« Kg » 6 + « kg » 12 : une entrée, 18, forme la plus fréquente', () => {
    const q = bandes([L('a', 'malt', 1, 6, 'Kg'), L('b', 'malt', 1, 12, 'kg'), L('c', 'malt', 1, 1, 'Kg')]).find(x => x.cle === 'malt')!.qte;
    expect(q).toEqual([{ unite: 'Kg', n: 19, inconnue: false }]);
  });
  it('« Kg » + « g » (D275, voie f3) : une même famille d’unités s’additionne dans la forme la plus courante (HEAD : « 6 Kg + 500 g »)', () => {
    const q = bandes([L('a', 'malt', 1, 6, 'Kg'), L('b', 'malt', 1, 500, 'g')]).find(x => x.cle === 'malt')!.qte;
    expect(texteQte(q)).toBe('6,5 Kg');
  });
  it('une quantité absente se dit « ? », jamais 0', () => {
    expect(texteQte(bandes([L('a', 'malt', 1, undefined, 'Kg')]).find(x => x.cle === 'malt')!.qte)).toBe('?');
  });
});

describe('numérotation Papier et groupe', () => {
  it('un port au rang 5 de 7 laisse un trou : 1, 2, 3, 4, 6, 7', () => {
    const l = Array.from({ length: 7 }, (_, i) => ({ id: `l${i}`, kind: i === 4 ? 'shipping' : 'ingredient', amount: 1 }));
    expect([...numerosPapier(l, lignesDePort(l)).values()]).toEqual([1, 2, 3, 4, 6, 7]);
  });
  it('le contexte lu donne le groupe', () => {
    expect(['Malt', 'Houblon', 'Levure', 'autre', undefined].map(groupeDe)).toEqual(['malt', 'houblon', 'levure', 'autres', 'autres']);
  });
});
