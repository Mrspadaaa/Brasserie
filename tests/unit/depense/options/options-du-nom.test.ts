// D275 : les options imprimées dans le nom d'une ligne (état du malt, supplément, mélange) sortent du nom, traduites. Pièces INVENTÉES
// à la forme de la commande en ligne (doc14) : aucun nom d'achat réel. Le produit propre garde sa marque (®) ; l'état du malt n'est pas un produit.
import { describe, expect, it } from 'vitest';
import { lireOptions } from '../../../../src/ui/depense/optionsDuNom';
import { libelleDeLigne } from '../../../../src/ui/depense/etat';
import { LIGNES, items } from '../banc-k6/piece';

const MOUTURE_VAR = 'Mischung: Einzelprodukt, Schrotung: geschrotet [+CHF 0.10]';
const lu = (nom: string, variante: string | undefined, unite = 'Kg') => lireOptions(nom, variante, unite);

describe('TEMOIN : le libellé collé de la commande en ligne (D275)', () => {
  it('libelleDeLigne colle le nom et toutes les options : ce libellé nourrit l\'affichage, le rapprochement et le nom de l\'article neuf', () => {
    expect(libelleDeLigne('CARABELGE®, Kg', MOUTURE_VAR)).toBe(`CARABELGE®, Kg · ${MOUTURE_VAR}`);
  });
  it('lireOptions rend la base propre', () => {
    expect(lu('CARABELGE®, Kg', MOUTURE_VAR).base).toBe('CARABELGE®');
  });
});

describe('les trois malts de la commande (forme de doc14)', () => {
  it('les noms de la pièce inventée : bases, état concassé, suppléments par unité', () => {
    const pieces = items([{}, {}, {}, { variant: MOUTURE_VAR, unit: 'Kg' }, {}, { variant: MOUTURE_VAR, unit: 'Kg' }]);
    const carabelge = lu(pieces[3].name, pieces[3].variant, pieces[3].unit);
    const pilsner = lu(pieces[5].name, pieces[5].variant, pieces[5].unit);
    expect(LIGNES[3][0]).toBe('CARAFICTIF®, Kg');
    expect(carabelge).toEqual({ base: 'CARAFICTIF®', etat: { cle: 'concasse', texte: 'concassé' }, supplement: { montant: 0.1, devise: 'CHF' }, supplementPour: 'concasse', options: [], restes: [] });
    expect(pilsner.base).toBe('Premium Pilsner Malz');
    expect(pilsner.etat?.texte).toBe('concassé');
    expect(pilsner.supplement).toEqual({ montant: 0.1, devise: 'CHF' });
  });
  it('le petit malt vendu au gramme : « , Gramm » retiré, supplément 0,0001 par gramme', () => {
    const l = lu('SPECIAL W®, Gramm', 'Mischung: Einzelprodukt\nSchrotung: geschrotet [+CHF 0.0001]', 'Gramm');
    expect(l.base).toBe('SPECIAL W®');
    expect(l.etat?.cle).toBe('concasse');
    expect(l.supplement).toEqual({ montant: 0.0001, devise: 'CHF' });
    expect(l.options).toEqual([]);
    expect(l.restes).toEqual([]);
  });
  it('les mêmes options imprimées dans le nom, après un retour à la ligne (la lecture met tout dans le nom)', () => {
    const l = lu('SPECIAL W®, Gramm\nMischung: Einzelprodukt\nSchrotung: geschrotet [+CHF 0.0001]', 'Mischung: Einzelprodukt\nSchrotung: geschrotet [+CHF 0.0001]', 'Gramm');
    expect(l).toEqual({ base: 'SPECIAL W®', etat: { cle: 'concasse', texte: 'concassé' }, supplement: { montant: 0.0001, devise: 'CHF' }, supplementPour: 'concasse', options: [], restes: [] });
  });
  it('les options collées au nom sur une seule ligne (cas D261a), sans doublon avec la variante', () => {
    const l = lu(`CARABELGE, Mischung: Einzelprodukt Schrotung: geschrotet [+CHF 0.10]`, 'Mischung: Einzelprodukt Schrotung: geschrotet [+CHF 0.10]');
    expect(l.base).toBe('CARABELGE');
    expect(l.etat?.texte).toBe('concassé');
    expect(l.supplement).toEqual({ montant: 0.1, devise: 'CHF' });
    expect(l.restes).toEqual([]);
  });
  it('trois séparateurs de variante : retour à la ligne, « / » et virgule', () => {
    for (const v of ['Mischung: Einzelprodukt\nSchrotung: geschrotet [+CHF 0.10]', 'Mischung: Einzelprodukt / Schrotung: geschrotet [+CHF 0.10]', MOUTURE_VAR]) {
      const l = lu('CARABELGE®, Kg', v);
      expect([l.base, l.etat?.cle, l.supplement?.montant, l.restes.length]).toEqual(['CARABELGE®', 'concasse', 0.1, 0]);
    }
  });
});

describe('l\'état, jamais deviné', () => {
  it.each([
    ['Schrotung: geschrotet', 'concasse'], ['Schrotung geschrotet', 'concasse'], ['geschrotet', 'concasse'], ['fein geschrotet', 'concasse'], ['Schrotung: gemahlen', 'concasse'],
    ['Crushing: crushed', 'concasse'], ['crushed', 'concasse'], ['Milled', 'concasse'], ['Grind: milled', 'concasse'],
    ['Mouture : concassé', 'concasse'], ['concassé', 'concasse'], ['Moulu', 'concasse'], ['mouture: moulue', 'concasse'],
    ['Macinatura: macinato', 'concasse'], ['macinato', 'concasse'],
    ['ungeschrotet', 'grain'], ['Schrotung: ungeschrotet', 'grain'], ['nicht geschrotet', 'grain'], ['Schrotung: nicht gemahlen', 'grain'],
    ['uncrushed', 'grain'], ['Crushing: whole', 'grain'], ['whole', 'grain'], ['not crushed', 'grain'],
    ['non concassé', 'grain'], ['grain entier', 'grain'], ['Mouture : grain entier', 'grain'],
    ['non macinato', 'grain'], ['intero', 'grain'], ['Macinatura: intero', 'grain'],
  ])('« %s » → %s', (variante, cle) => {
    const l = lu('Malt fictif, Kg', variante);
    expect(l.etat?.cle).toBe(cle);
    expect(l.etat?.texte).toBe(cle === 'concasse' ? 'concassé' : 'grain entier');
    expect(l.base).toBe('Malt fictif');
    expect(l.restes).toEqual([]);
  });
  it('« ungeschrotet » ne donne jamais « concassé » et ne porte aucun supplément', () => {
    const l = lu('CARABELGE®, Kg', 'Mischung: Einzelprodukt\nSchrotung: ungeschrotet');
    expect(l.etat).toEqual({ cle: 'grain', texte: 'grain entier' });
    expect(l.supplement).toBeUndefined();
  });
  it('« fein geschrotet » garde sa finesse comme option', () => {
    expect(lu('Malt fictif', 'fein geschrotet', 'Kg').options).toEqual([{ cle: 'finesse', texte: 'fin' }]);
  });
  it('rien d\'imprimé, rien de deviné : pas d\'état', () => {
    for (const v of [undefined, '', 'Mischung: Einzelprodukt', 'XL']) expect(lu('CARABELGE®, Kg', v).etat).toBeUndefined();
  });
  it('« Zuschlag Schrotung » (la ligne de supplément) n\'est pas un état : le mot seul ne dit rien', () => {
    const l = lu('Zuschlag Schrotung', undefined, 'Kg');
    expect(l).toEqual({ base: 'Zuschlag Schrotung', options: [], restes: [] });
  });
  it('deux mots contraires : aucun état choisi, les deux restent', () => {
    const l = lu('CARABELGE®, geschrotet', 'Schrotung: ungeschrotet');
    expect(l.etat).toBeUndefined();
    expect(l.restes).toEqual(['geschrotet', 'Schrotung: ungeschrotet']);
  });
});

describe('chaque langue, avec et sans deux-points', () => {
  it.each([
    ['allemand', 'Mischung: Einzelprodukt, Schrotung: geschrotet [+CHF 0.10]'],
    ['allemand sans « : »', 'Mischung Einzelprodukt, Schrotung geschrotet [+CHF 0.10]'],
    ['anglais', 'Mix: Single product, Crushing: crushed [+CHF 0.10]'],
    ['anglais sans « : »', 'Mix Single product, Crushing crushed [+CHF 0.10]'],
    ['français', 'Mélange : produit seul, Mouture : concassé [+CHF 0.10]'],
    ['français sans « : »', 'Melange produit seul, Mouture concassé [+CHF 0.10]'],
    ['italien', 'Miscela: prodotto singolo, Macinatura: macinato [+CHF 0.10]'],
    ['italien sans « : »', 'Miscela prodotto singolo; Macinatura macinato [+CHF 0.10]'],
    ['crochets et « · »', 'Mischung: Einzelprodukt · Schrotung: geschrotet [ + CHF 0.10 ]'],
    ['montant avant la devise', 'Mischung: Einzelprodukt, Schrotung: geschrotet [+0,10 CHF]'],
    ['parenthèses', 'Mischung: Einzelprodukt, Schrotung: geschrotet (+CHF 0.10)'],
  ])('%s', (_langue, variante) => {
    const l = lu('CARABELGE®, Kg', variante);
    expect(l).toEqual({ base: 'CARABELGE®', etat: { cle: 'concasse', texte: 'concassé' }, supplement: { montant: 0.1, devise: 'CHF' }, supplementPour: 'concasse', options: [], restes: [] });
  });
});

describe('les autres options, traduites ; ce qui n\'est pas compris reste', () => {
  it('un mélange nommé devient « mélange : … »', () => {
    expect(lu('Malt fictif, Kg', 'Mischung: Weizen und Gerste').options).toEqual([{ cle: 'melange', texte: 'mélange : Weizen und Gerste' }]);
    expect(lu('Malt fictif, Kg', 'Mix: 50/50 blend').options).toEqual([{ cle: 'melange', texte: 'mélange : 50/50 blend' }]);
  });
  it('« Mischung: Einzelprodukt » (un produit seul) ne donne aucune option', () => {
    const l = lu('Malt fictif, Kg', 'Mischung: Einzelprodukt');
    expect(l.options).toEqual([]);
    expect(l.restes).toEqual([]);
  });
  it('couleur, taille, poids : mots connus traduits', () => {
    expect(lu('Cuve fictive', 'Farbe: rot, Größe: XL', '').options).toEqual([{ cle: 'couleur', texte: 'couleur : rot' }, { cle: 'taille', texte: 'taille : XL' }]);
    expect(lu('Cuve fictive', 'Weight: 500 g', '').options).toEqual([{ cle: 'poids', texte: 'poids : 500 g' }]);
  });
  it.each(['XL', '11g', '500 g', 'ROUGE 25cm', 'from 15/10/2026 to 14/10/2027', 'PostPac Priority'])('la variante « %s » n\'est pas une liste d\'options : elle reste', (v) => {
    const l = lu('Article fictif', v, 'Stk');
    expect(l.restes).toEqual([v]);
    expect(l.base).toBe('Article fictif');
    expect(l.etat).toBeUndefined();
    expect(l.options).toEqual([]);
  });
  it('une variante inconnue à côté d\'options comprises : l\'inconnu seul reste', () => {
    const l = lu('CARABELGE®, Kg', 'Schrotung: geschrotet, Aktion Frühling', 'Kg');
    expect(l.etat?.cle).toBe('concasse');
    expect(l.restes).toEqual(['Aktion Frühling']);
  });
  it('une clé connue dont la valeur n\'est pas un état reste telle quelle', () => {
    const l = lu('Malt fictif, Kg', 'Schrotung: auf Wunsch');
    expect(l.etat).toBeUndefined();
    expect(l.restes).toEqual(['Schrotung: auf Wunsch']);
  });
  it('une variante déjà dans le nom n\'est pas répétée dans les restes', () => {
    expect(lu('Wyeast 3787 Activator', 'Activator', 'Stk').restes).toEqual([]);
  });
  it('un second supplément différent n\'est pas perdu', () => {
    const l = lu('Malt fictif, Kg', 'Schrotung: geschrotet [+CHF 0.10], Verpackung [+CHF 2.00]');
    expect(l.supplement).toEqual({ montant: 0.1, devise: 'CHF' });
    expect(l.restes).toEqual(['Verpackung [+CHF 2.00]']);
  });
});

describe('la base : le nom propre, le suffixe d\'unité seulement s\'il double la colonne', () => {
  it('un nom sans variante : base = nom moins le suffixe d\'unité', () => {
    expect(lu('Premium Pilsner Malz, Kg', undefined, 'Kg')).toEqual({ base: 'Premium Pilsner Malz', options: [], restes: [] });
    expect(lu('Premium Pilsner Malz, Kg', '', 'kg').base).toBe('Premium Pilsner Malz');
    expect(lu('Weizenmalz, 1 Kg', undefined, 'Kg').base).toBe('Weizenmalz');
    expect(lu('Hefe fictive, Gramm', undefined, 'g').base).toBe('Hefe fictive');
    expect(lu('Laktose 1 Kg', undefined, 'Kg').base).toBe('Laktose');
  });
  it('colonne d\'unité vide (unité illisible, comme sur la pièce doc14) : le suffixe sort du nom mais reste rendu, l\'unité n\'est pas devinée', () => {
    const pieces = items([{}, {}, {}, { variant: MOUTURE_VAR }, {}, { variant: MOUTURE_VAR }]);
    expect(pieces[3].unit).toBe('');
    const l = lu(pieces[3].name, pieces[3].variant, pieces[3].unit);
    expect(l.base).toBe('CARAFICTIF®');
    expect(l.uniteDuNom).toBe('Kg');
    expect(l.etat?.cle).toBe('concasse');
    expect(lu('Laktose 1 Kg', undefined, '')).toEqual({ base: 'Laktose', uniteDuNom: '1 Kg', options: [], restes: [] });
    expect(lu('SPECIAL W®, Gramm\nMischung: Einzelprodukt\nSchrotung: geschrotet [+CHF 0.0001]', undefined, '').uniteDuNom).toBe('Gramm');
    expect(lu('Premium Pilsner Malz, Kg', undefined, 'Kg').uniteDuNom).toBeUndefined();
  });
  it('un suffixe qui ne dit pas la même chose que l\'unité lue reste dans le nom', () => {
    expect(lu('Sucre fictif, Kg', undefined, 'Stk').base).toBe('Sucre fictif, Kg');
    expect(lu('Sucre fictif, Kg', undefined, 'g').base).toBe('Sucre fictif, Kg');
    expect(lu('Sucre fictif, 5 Kg', undefined, 'Kg').base).toBe('Sucre fictif, 5 Kg');
    expect(lu('Sucre fictif, 5 Kg', undefined, '').base).toBe('Sucre fictif, 5 Kg');
    expect(lu('Levure fictive 1111, Souche Test', undefined, 'Stk').base).toBe('Levure fictive 1111, Souche Test');
  });
  it('la marque et le reste du nom sont tels qu\'imprimés', () => {
    expect(lu('SPECIAL W®, Gramm', undefined, 'Gramm').base).toBe('SPECIAL W®');
    expect(lu('Château Pilsen™ Spécial B, Kg', undefined, 'Kg').base).toBe('Château Pilsen™ Spécial B');
  });
  it('un nom de houblon : l\'α reste (c\'est l\'affaire de sansAlphaDoublon)', () => {
    expect(lu('Styrian Goldings 4.5%', undefined, 'g')).toEqual({ base: 'Styrian Goldings 4.5%', options: [], restes: [] });
    expect(lu('Saaz fictif 3,5 %', '', 'g').base).toBe('Saaz fictif 3,5 %');
    expect(lu('Hallertau 7.2%, 100 g', undefined, 'g').base).toBe('Hallertau 7.2%, 100 g');
  });
  it('le nom « moulu » après une virgule : l\'état sort du nom', () => {
    const l = lu('Malt Château Pilsen, moulu', undefined, 'Kg');
    expect(l.base).toBe('Malt Château Pilsen');
    expect(l.etat?.cle).toBe('concasse');
  });
  it('un nom sur plusieurs lignes dont rien n\'est une option (description de service) reste exactement tel qu\'imprimé', () => {
    const nom = 'Abonnement fictif : annuel\nMembre Premium\n15.10.2026-14.10.2027';
    expect(lu(nom, 'from 15/10/2026 to 14/10/2027', 'Stk')).toEqual({ base: nom, options: [], restes: ['from 15/10/2026 to 14/10/2027'] });
  });
  it('nom ou unité absents : rien ne casse', () => {
    expect(lu('', undefined, '')).toEqual({ base: '', options: [], restes: [] });
    expect(lu('Hop Spider Bag', undefined, undefined as any).base).toBe('Hop Spider Bag');
  });
});
