import { describe, expect, it } from 'vitest';
import { NOMS, nomCanonique, nomsParAlias, normaliser, slugBeerAnalytics } from '../../../src/domain/fermentables/noms';

describe('nomCanonique : le nom courant d\'un malt (D220)', () => {
  it.each([
    ['Munich', 'Münchner Malz'],
    ['Pils', 'Pilsner Malz'],
    ['Pale', 'Pale Ale Malz'],
    ['Weizen', 'Weizenmalz hell'],
    ['Wheat', 'Weizenmalz hell'],
    ['Blé', 'Weizenmalz hell'],
    ['ble', 'Weizenmalz hell'],
    ['Cara', 'Carapils'],
    ['Avoine', 'Haferflocken'],
    ['  MUNICH ', 'Münchner Malz'],
  ])('« %s » → %s', (saisie, attendu) => {
    expect(nomCanonique(saisie)).toBe(attendu);
  });

  it('le nom canonique et le nom de Beer Analytics se rendent eux-mêmes, sans accent ni casse', () => {
    expect(nomCanonique('Münchner Malz')).toBe('Münchner Malz');
    expect(nomCanonique('munchner malz')).toBe('Münchner Malz');
    expect(nomCanonique('Caramünch II')).toBe('Caramünch II');
    expect(nomCanonique('Flaked Oats')).toBe('Haferflocken');
    expect(nomCanonique('Carapils / Carafoam')).toBe('Carapils');
  });

  it('un nom inconnu reste inconnu (null), jamais deviné', () => {
    expect(nomCanonique('Malt de la maison')).toBeNull();
    expect(nomCanonique('')).toBeNull();
    expect(nomCanonique('   ')).toBeNull();
    expect(nomCanonique('xyz')).toBeNull();
  });
});

describe('slugBeerAnalytics : du stock à Beer Analytics', () => {
  it.each([
    ['Pilsner Malz', 'pilsner-malt'],
    ['Münchner Malz', 'munich-malt'],
    ['Weizenmalz hell', 'wheat-malt'],
    ['Haferflocken', 'flaked-oats'],
    ['Carapils', 'carapils-carafoam'],
    ['Carahell', 'carahell'],
    ['Caramünch II', 'caramunich-ii'],
    ['Carafa Special III', 'carafa-special-iii'],
    ['Röstgerste', 'roasted-barley-malt'],
    ['Dextrose', 'corn-sugar'],
    ['Lactose', 'lactose-milk-sugar'],
    ['Extrait sec clair', 'malt-extract'],
    ['Mangue', 'mango'],
  ])('%s → %s', (nom, slug) => {
    expect(slugBeerAnalytics(nom)).toBe(slug);
  });

  it('un nom hors de la table n\'a pas d\'identifiant', () => {
    expect(slugBeerAnalytics('Malt de la maison')).toBeNull();
  });
});

describe('la table', () => {
  it('chaque nom canonique, chaque nom anglais et chaque alias désigne une seule entrée', () => {
    const vus = new Map<string, string>();
    for (const n of NOMS) {
      for (const cle of [n.canonique, n.ba, ...n.alias].map(normaliser)) {
        const deja = vus.get(cle);
        // Une même entrée peut se répéter ; deux entrées ne partagent jamais un nom.
        expect(deja === undefined || deja === n.slug, `« ${cle} » désigne ${deja} et ${n.slug}`).toBe(true);
        vus.set(cle, n.slug);
      }
    }
  });

  // Deux produits que le brasseur distingue ne se fondent jamais en un (relecture a1). Chaque paire : l'un des deux est inconnu, ou ils désignent deux entrées.
  const INTERDITES: [string, string][] = [
    ['Cassis', 'Groseille'], ['Dextrose', 'Glucose'], ['Dextrose', 'Sirop de glucose'], ['Hafermalz', 'Haferflocken'], ['Avoine', 'Hafermalz'],
    ['Weizenmalz hell', 'Weizenflocken'], ['Roggenmalz', 'Roggenflocken'], ['Dinkelmalz', 'Dinkelflocken'], ['Weizenmalz hell', 'Weizenmalz dunkel'],
    ['Münchner Malz hell', 'Münchner Malz dunkel'], ['Caramünch I', 'Caramünch II'], ['Carapils', 'Carahell'], ['Sucre', 'Sucre roux'], ['Sucre candi', 'Sirop candi'],
    ['Myrtille', 'Mûre'], ['Cassis', 'Myrtille'], ['Turbinado', 'Rapadura'], ['Honigmalz', 'Brumalt'], ['Carawheat', 'Carafa weizen'],
  ];
  it.each(INTERDITES)('« %s » et « %s » ne désignent jamais le même produit', (a, b) => {
    const ca = nomCanonique(a), cb = nomCanonique(b);
    expect(ca === null || cb === null || ca !== cb, `${a} → ${ca}, ${b} → ${cb}`).toBe(true);
  });

  it('les rapprochements douteux sont retirés : ils restent inconnus', () => {
    for (const douteux of ['Groseille', 'bleuet', 'Rapadura', 'Carafa weizen', 'brumalt', 'sucre complet']) expect(nomCanonique(douteux), douteux).toBeNull();
    expect(nomCanonique('Glucose')).toBe('Sirop de glucose');
  });

  it('les identifiants sont uniques', () => {
    const slugs = NOMS.map((n) => n.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('nomsParAlias : la frappe en cours', () => {
  it('« mu » trouve Münchner Malz par son nom courant', () => {
    expect(nomsParAlias('mu')).toContain('Münchner Malz');
    expect(nomsParAlias('Munich')).toContain('Münchner Malz');
  });
  it('une lettre ne suffit pas', () => {
    expect(nomsParAlias('m')).toEqual([]);
    expect(nomsParAlias('')).toEqual([]);
  });
  it('rien ne correspond : liste vide', () => {
    expect(nomsParAlias('zzz')).toEqual([]);
  });
});
