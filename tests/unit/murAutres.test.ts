import { describe, expect, it } from 'vitest';
import type { StockItem } from '../../src/types';
import { colonneAutre, construireMurAutres, etatEtSeuil, pastilleAutre, potAutre, totalColonne, trierAutres, TIRET } from '../../src/domain/stock/murAutres';

const it_ = (name: string, category: string, currentStock: number, unit: string, minStock?: number): StockItem =>
  ({ ref: name, name, category, unit, currentStock, minStock } as unknown as StockItem);

describe('Autres stocks A : mur (A-PORT-LISTE)', () => {
  it('classe par le nom puis la catégorie ; un inconnu va en autres', () => {
    expect(colonneAutre(it_('Gypse', 'Additif', 1, 'g'), 'Additifs')).toBe('sels');
    expect(colonneAutre(it_('Acide lactique 80 %', 'Additif', 1, 'ml'), 'Additifs')).toBe('acides');
    expect(colonneAutre(it_('Whirlfloc (comprimés)', 'Additif', 1, 'pc'), 'Additifs')).toBe('clarif');
    expect(colonneAutre(it_('Chlore actif', 'Désinfectant', 1, 'L'), 'Nettoyage')).toBe('alcalins');
    expect(colonneAutre(it_('Star San', 'Désinfectant', 1, 'L'), 'Nettoyage')).toBe('acides');
    expect(colonneAutre(it_('Bouteille 33 cl', 'Emballage', 1, 'pc'), 'Emballage')).toBe('bouteilles');
    expect(colonneAutre(it_('Truc mystère', 'Additif', 1, 'g'), 'Additifs')).toBe('autres');
  });
  it('pot : tiret à 14/22, pile au seuil touche le tiret, épuisé à 0, sans seuil contre le plus gros', () => {
    expect(potAutre(it_('a', 'Additif', 250, 'g', 250), 500).hauteur).toBeCloseTo(TIRET, 3);
    expect(potAutre(it_('a', 'Additif', 100, 'g', 250), 500).etat).toBe('bas');
    expect(potAutre(it_('a', 'Additif', 0, 'g', 250), 500)).toMatchObject({ hauteur: 0, etat: 'epuise' });
    expect(potAutre(it_('a', 'Additif', 250, 'g'), 500)).toMatchObject({ hauteur: 0.45, seuil: null });
  });
  it('pied : somme si une unité (kg et g mêlés), sinon le nombre en stock ; jamais un nom', () => {
    expect(totalColonne([it_('a', 'x', 1.2, 'kg'), it_('b', 'x', 500, 'g')])).toBe('1,7 kg');
    expect(totalColonne([it_('a', 'x', 0, 'g'), it_('b', 'x', 0, 'g')])).toBe('0 g');
    expect(totalColonne([it_('a', 'x', 3, 'g'), it_('b', 'x', 2, 'pc'), it_('c', 'x', 0, 'ml')])).toBe('2');
  });
  it('tiret continu, par pot ou absent ; familles vides dites', () => {
    const m = construireMurAutres([it_('Gypse', 'Additif', 500, 'g', 250), it_('Chlorure de calcium', 'Additif', 400, 'g', 200), it_('Acide lactique', 'Additif', 0, 'ml', 250), it_('Acide citrique', 'Additif', 120, 'g'), it_('Coriandre', 'Additif', 40, 'g')]);
    const add = m.find((r) => r.id === 'Additifs')!;
    expect(add.colonnes.map((c) => [c.id, c.tiret])).toEqual([['sels', 'continu'], ['acides', 'pots'], ['epices', null]]);
    expect(add.vides).toEqual(['Clarification', 'Levure · enzymes']);
  });
  it('ligne : seuil sur chaque ligne, pastille utile dans l’ordre de D424', () => {
    expect(etatEtSeuil(it_('a', 'x', 0, 'ml', 250))).toEqual({ mot: 'épuisé', seuil: 'seuil 250 ml' });
    expect(etatEtSeuil(it_('a', 'x', 5, 'g'))).toEqual({ mot: null, seuil: 'sans seuil' });
    expect(pastilleAutre({ besoin: { manque: 40, unite: 'ml', brassin: 'NEIPA 28.11' }, brassins: 3, ddmProche: '12.26' })).toBe('manque 40 ml pour NEIPA 28.11');
    expect(pastilleAutre({ brassins: 3.6, ddmProche: '12.26' })).toBe('≈ 3 brassins');
    expect(pastilleAutre({ ddmProche: '12.26' })).toBe('DDM 12.26');
    expect(pastilleAutre({})).toBeNull();
  });
  it('tri de la liste (n° 41) : épuisé, bas, à compter, puis alphabétique', () => {
    const a = [it_('Zinc', 'x', 500, 'g', 100), it_('Acide', 'x', 500, 'g', 100), it_('Canette', 'x', 50, 'pc', 100), it_('Vanille', 'x', NaN, 'g'), it_('Bidon', 'x', 0, 'ml', 100)];
    expect(trierAutres(a).map((i) => i.name)).toEqual(['Bidon', 'Canette', 'Vanille', 'Acide', 'Zinc']);
  });
});
