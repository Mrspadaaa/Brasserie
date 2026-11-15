import { describe, expect, it } from 'vitest';
import { plusMenuFor } from '../../src/domain/plusEcran';
import {
  classer, destinationsAllerA, gestesIci, lireRecents, noterRecent, rang, segmentsNombres, surligner, typeDeId, typePrioritaire
} from '../../src/components/recherche/modele';
import { apercuArticle, dernierAchat, formaterAlpha, recettesQuiEmploient } from '../../src/components/recherche/apercu';
import type { Recipe, StockItem, Transaction } from '../../src/types';

const memoire = (init?: string) => {
  let valeur = init;
  return { getItem: () => valeur ?? null, setItem: (_k: string, v: string) => { valeur = v; } };
};

describe('recherche — « Ici » lit la table du +', () => {
  it('Stocks › Articles : l’action de l’écran en plein, sans doublon avec « Créer »', () => {
    const menu = plusMenuFor('stocks', 'stock', { aCommander: 3 });
    const ici = gestesIci(menu);
    expect(ici[0]).toMatchObject({ cle: 'ecran', primaire: true, label: menu.action?.label });
    expect(ici.map(l => l.cle)).not.toContain('vente');
    expect(ici.map(l => l.cle)).not.toContain('brassin');
    expect(ici.map(l => l.cle)).not.toContain('recette');
    expect(ici.find(l => l.cle === 'courses')?.hint).toBe('3 à commander');
  });

  it('un écran qui ne crée rien (Volumes) n’invente pas d’action', () => {
    const ici = gestesIci(plusMenuFor('production', 'scaler'));
    expect(ici.some(l => l.primaire)).toBe(false);
  });
});

describe('recherche — Aller à', () => {
  it('jamais l’écran courant, jamais Courses quand « Voir les courses » est dans Ici', () => {
    const menu = plusMenuFor('stocks', 'stock', { aCommander: 3 });
    const dest = destinationsAllerA(menu, gestesIci(menu));
    expect(dest).not.toContain('stock');
    expect(dest).not.toContain('courses');
    expect(dest).toEqual(expect.arrayContaining(['futs', 'materiel', 'houblons', 'assistant', 'journal', 'reglages']));
    expect(new Set(dest).size).toBe(dest.length);
  });

  it('Courses reste proposé quand l’écran n’a pas ce geste dans Ici', () => {
    const menu = plusMenuFor('stocks', 'futs');
    expect(destinationsAllerA(menu, gestesIci(menu))).toContain('courses');
  });
});

describe('recherche — récents', () => {
  it('trois au plus, sans doublon, le plus récent d’abord', () => {
    const m = memoire();
    ['a', 'b', 'c', 'a', 'd'].forEach(id => noterRecent(id, m));
    expect(lireRecents(m)).toEqual(['d', 'a', 'c']);
  });
  it('un stockage illisible donne []', () => {
    expect(lireRecents(memoire('pas du json'))).toEqual([]);
    expect(lireRecents(memoire('{"a":1}'))).toEqual([]);
    expect(lireRecents({ getItem: () => { throw new Error('refusé'); } })).toEqual([]);
  });
});

describe('recherche — surlignage, nombres, classement', () => {
  it('surligne les lettres tapées', () => {
    expect(surligner('Acide citrique', 'cit')).toEqual([{ t: 'Acide ', hit: false }, { t: 'cit', hit: true }, { t: 'rique', hit: false }]);
  });
  it('insensible aux accents : « caramunch » trouve « Caramünch »', () => {
    expect(surligner('Caramünch', 'caramunch')).toEqual([{ t: 'Caramünch', hit: true }]);
  });
  it('sans requête, rien n’est surligné', () => {
    expect(surligner('Citra', '  ')).toEqual([{ t: 'Citra', hit: false }]);
  });
  it('chiffres en mono seulement, l’unité et les mots non', () => {
    expect(segmentsNombres('α 12,8 % · 1,2 kg')).toEqual([
      { t: 'α ', nombre: false }, { t: '12,8', nombre: true }, { t: ' % · ', nombre: false }, { t: '1,2', nombre: true }, { t: ' kg', nombre: false }
    ]);
  });
  it('le libellé qui commence par la requête passe devant celui qui la contient', () => {
    expect(rang('Citra', 'cit')).toBeGreaterThan(rang('Acide citrique', 'cit'));
    const classe = classer([{ id: 'stk-1', label: 'Acide citrique' }, { id: 'stk-2', label: 'Citra' }], 'cit');
    expect(classe.map(x => x.id)).toEqual(['stk-2', 'stk-1']);
  });
  it('à rang égal, le type de l’écran d’ouverture passe devant', () => {
    const items = [{ id: 'tx-1', label: 'Citra achat' }, { id: 'stk-1', label: 'Citra' }];
    expect(classer(items, 'citra', typePrioritaire(plusMenuFor('stocks', 'stock'))).map(x => x.id)[0]).toBe('stk-1');
  });
  it('le type se lit sur l’identifiant', () => {
    expect(typeDeId('stk-x')).toBe('article');
    expect(typeDeId('tx-x')).toBe('ecriture');
    expect(typeDeId('autre')).toBeUndefined();
  });
});

describe('recherche — aperçu d’un article : seulement ce que l’app sait', () => {
  const item = { ref: 'H-1', name: 'Citra', category: 'Houblon', unit: 'kg', currentStock: 1.2, reorder: false, alphaPct: 12.8 } as StockItem;
  const recette = { id: 'r1', name: 'IPA', style: 'IPA', hops: [{ stockItemRef: 'H-1', name: 'Citra', alpha: 12, weightG: 100, stage: 'boil' }], fermentables: [] } as unknown as Recipe;
  const achat = (date: string, ref = 'H-1') => ({ id: `t-${date}`, date, finance: { version: 1, vendor: 'Yakima', lines: [{ stockItemRef: ref, quantity: 1, unit: 'kg' }] } }) as unknown as Transaction;

  it('l’α et le seuil inconnus n’apparaissent pas (jamais 0)', () => {
    const sans = apercuArticle({ ...item, alphaPct: undefined }, [], []);
    expect(sans.chiffres.map(c => c.label)).toEqual(['En stock']);
    expect(formaterAlpha(0)).toBeUndefined();
    expect(formaterAlpha(undefined)).toBeUndefined();
    expect(apercuArticle({ ...item, minStock: 0 }, [], []).chiffres.map(c => c.label)).toContain('Seuil');
  });
  it('les emplois viennent des recettes qui nomment l’article, le dernier achat de la plus récente écriture reliée', () => {
    expect(recettesQuiEmploient(item, [recette]).map(r => r.id)).toEqual(['r1']);
    expect(dernierAchat(item, [achat('2026-03-01'), achat('2026-05-02'), achat('2026-06-01', 'H-9')])?.date).toBe('2026-05-02');
    const a = apercuArticle(item, [recette], [achat('2026-05-02')]);
    expect(a.emplois.map(e => e.texte)).toEqual(['IPA', 'Dernier achat · Yakima']);
  });
  it('aucune recette, aucun achat : aucun emploi inventé', () => {
    expect(apercuArticle(item, [], []).emplois).toEqual([]);
  });
});
