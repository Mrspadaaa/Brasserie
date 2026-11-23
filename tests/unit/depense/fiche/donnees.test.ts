import { describe, expect, it } from 'vitest';
import { ecartsEntre, lireEbc, lireOrigine, nomPropre, porteBis, sansBis, SEUIL_EBC } from '../../../../src/domain/stock/donnees';

/** Les expressions régulières de l'EBC et de l'origine sont exercées, pas seulement relues (L26 : le Bash de ce poste perd les barres inverses sans erreur). */
describe('lireEbc : « 15 EBC », « EBC 15 » ; un intervalle ou deux valeurs sont inconnus', () => {
  it.each([
    ['Münchner Malz 15 EBC', 15], ['Münchner Malz 15EBC', 15], ['Münchner Malz EBC 15', 15], ['Caramünch II, 120 EBC, 25 Kg', 120], ['Pilsner 3,5 EBC', 3.5], ['Pilsner (EBC: 4)', 4], ['pilsner 3.5 ebc', 3.5],
  ])('%s → %s', (libelle, ebc) => expect(lireEbc(libelle)?.value).toBe(ebc));
  it.each(['Münchner Malz', 'Münchner Malz 8-12 EBC', 'Münchner Malz 8 à 12 EBC', 'Münchner Malz EBC 8 à 12', 'Münchner Malz EBC 8-12', 'Malz 15 EBC / 20 EBC', 'Ebcxyz 15', 'Malz 0 EBC', ''])('« %s » → inconnu', libelle => expect(lireEbc(libelle)).toBeUndefined());
  it('rend la place à retirer du nom', () => {
    const e = lireEbc('Münchner Malz 15 EBC, 25 Kg')!;
    expect('Münchner Malz 15 EBC, 25 Kg'.slice(e.debut, e.fin)).toBe('15 EBC');
  });
});

describe('lireOrigine : un code d’ORIGINS, en capitales, dernier mot, pour un houblon ou un malt', () => {
  it.each([
    ['Hallertauer Blanc 9.5% CH', 'CH'], ['Cascade CH', 'CH'], ['Cascade US', 'US'], ['Hallertauer Blanc DE 9.5%', 'DE'], ['Cascade 8% CH', 'CH'], ['Cascade (US)', 'US'], ['Citra 2025 US', 'US'], ['Cascade CH, 100 g', 'CH'], ['Pilsner Malz DE, 25 Kg', 'DE'], ['Saaz CZ 3.5 %', 'CZ'],
  ])('%s → %s', (libelle, code) => expect(lireOrigine(libelle, libelle.includes('Malz') ? 'Malt' : 'Houblon')?.value).toBe(code));
  it.each(['Cascade', 'Cascade CHE', 'Cascade ES', 'Cascade ch', 'Cascade de', 'CH', 'Safale US-05', 'US-05', 'Cascade US Special', 'Cascade 8%', 'Sac 25 kg'])('« %s » → inconnue', libelle => expect(lireOrigine(libelle, 'Houblon')).toBeUndefined());
  it('jamais pour une levure ni un autre produit', () => {
    expect(lireOrigine('Safale US', 'Levure')).toBeUndefined();
    expect(lireOrigine('Étiquettes CH', 'autre')).toBeUndefined();
  });
  it('rend la place à retirer du nom', () => {
    const o = lireOrigine('Hallertauer Blanc 9.5% CH', 'Houblon')!;
    expect('Hallertauer Blanc 9.5% CH'.slice(o.debut, o.fin)).toBe('CH');
    const p = lireOrigine('Cascade (US)', 'Houblon')!;
    expect('Cascade (US)'.slice(p.debut, p.fin)).toBe('US');
  });
});

describe('nomPropre : sans α, EBC, origine, conditionnement ni « bis » ; la récolte reste', () => {
  it.each([
    ['Target 11.3%', 'Houblon', 'Target'], ['Cascade CH', 'Houblon', 'Cascade'], ['Hallertauer Blanc 9.5% CH', 'Houblon', 'Hallertauer Blanc'], ['Hallertauer Blanc DE 9.5%', 'Houblon', 'Hallertauer Blanc'],
    ['Target bis 2', 'Houblon', 'Target'], ['Cascade CH bis', 'Houblon', 'Cascade'], ['Münchner Malz 15 EBC', 'Malt', 'Münchner Malz'], ['Maris Otter, Kg', 'Malt', 'Maris Otter'], ['Citra 2025 12.5%', 'Houblon', 'Citra 2025'],
    ['Sabro® 13.4%', 'Houblon', 'Sabro'], ['Nelson Sauvin ™ 9.6%', 'Houblon', 'Nelson Sauvin'],
  ] as const)('%s → %s', (libelle, contexte, nom) => expect(nomPropre(libelle, contexte)).toBe(nom));
  it('le conditionnement sûr d’une ligne (« , 25 Kg » qui divise la quantité) sort du nom', () => {
    expect(nomPropre('Pilsner Malz, 25 Kg', 'Malt', { unit: 'kg', quantity: 50 })).toBe('Pilsner Malz');
  });
});

describe('sansBis, ecartsEntre', () => {
  it('« bis » et « bis N » finals', () => {
    expect(sansBis('Target bis')).toBe('Target'); expect(sansBis('Target bis 12')).toBe('Target'); expect(sansBis('Bis')).toBe('Bis'); expect(sansBis('Target')).toBe('Target');
    expect(porteBis('Target bis 2')).toBe(true); expect(porteBis('Target')).toBe(false);
  });
  it('seules les données connues des deux côtés comptent, aux seuils nommés', () => {
    expect(SEUIL_EBC).toBe(1);
    expect(ecartsEntre({ alpha: 11.3 }, { alpha: 11.8 })).toEqual(['alpha']);
    expect(ecartsEntre({ alpha: 11.8 }, { alpha: 11.8 })).toEqual([]);
    expect(ecartsEntre({ alpha: 11.8 }, { alpha: 11.84 })).toEqual([]);
    expect(ecartsEntre({ alpha: 11.8 }, {})).toEqual([]);
    expect(ecartsEntre({ ebc: 15 }, { ebc: 16 })).toEqual(['ebc']);
    expect(ecartsEntre({ ebc: 15 }, { ebc: 15.9 })).toEqual([]);
    expect(ecartsEntre({ origine: 'CH', recolte: 2025, poids: 'g:11.5' }, { origine: 'US', recolte: 2024, poids: 'g:11' })).toEqual(['origine', 'recolte', 'poids']);
    expect(ecartsEntre({ origine: 'CH' }, {})).toEqual([]);
  });
});
