// d3b-affichage (#180) : compose() et huile() de Comparer prennent l'enveloppe des trois sources : les fiches de composés
// (composes-houblon.json), le catalogue (Beer Maverick, Hopsteiner) et complements.json (18 sources, voie d3a). Avant le chargement :
// le catalogue seul, sans erreur. Données : les fichiers du dépôt ; aucune donnée réelle, aucun appel Gemini.
import { describe, expect, it } from 'vitest';
import { chargerComplements, valeursDe } from '../../../src/domain/hopIndex/v4/complements';
import { compose, huile, titreRef } from '../../../src/ui/hopIndex/comparer/valeurs';
import { COMPOSES, mesureDe } from '../../../src/ui/hopIndex/comparer/Huiles';

const NELSON = 'beermaverick-nelson-sauvin', CITRA = 'beermaverick-citra', MOSAIC = 'beermaverick-mosaic', GALAXY = 'beermaverick-galaxy';

describe('avant le chargement : le catalogue seul, sans erreur', () => {
  it('le géraniol de Mosaic et le sélinène de Galaxy sont inconnus (jamais 0), le reste vient du catalogue', () => {
    expect(compose(MOSAIC, 'geraniol')).toBeNull();
    expect(compose(GALAXY, 'selinene')).toBeNull();
    expect(compose(NELSON, 'myrcene')).not.toBeNull();
    expect(huile(NELSON)).not.toBeNull();
    expect(mesureDe(GALAXY, 'selinene').p).toBeNull();
  });
});

describe('après le chargement : la fusion des trois sources dans compose() et huile()', () => {
  it('le géraniol de Mosaic vient de complements.json, avec ses références courtes', async () => {
    await chargerComplements();
    const g = compose(MOSAIC, 'geraniol');
    expect(g).not.toBeNull();
    // BarthHaas 0,4–1 % et Crosby Hops 0,4–0,8 % : l'enveloppe va du plus bas au plus haut.
    expect([g!.lo, g!.hi]).toEqual([0.4, 1]);
    expect(g!.refs).toEqual(expect.arrayContaining(['BH', 'CRO']));
    expect(g!.refs).not.toContain('BM');
  });

  it('le linalol : l\'enveloppe contient celle du catalogue (HS) et prend les autres sources en plus', () => {
    const l = compose(NELSON, 'linalol')!;
    expect(l.refs).toContain('HS');
    expect(l.refs).toContain('CRO');
    expect(l.lo).toBeLessThanOrEqual(0.4);
    expect(l.hi!).toBeGreaterThanOrEqual(0.7);
  });

  it('les valeurs suspectes ou hors enveloppe n\'entrent pas dans l\'enveloppe', () => {
    // Nelson Sauvin : l'huile « 10,1 » de Charles Faram est suspecte (artefact de tableur), HopDatabase n'écrit pas d'unité.
    const brutes = valeursDe(NELSON, 'huile');
    expect(brutes.some((v) => v.suspect && v.max === 10.1)).toBe(true);
    const h = huile(NELSON)!;
    expect(h.hi!).toBeLessThan(5);
    expect(h.refs).not.toContain('CF');
    expect(h.refs).not.toContain('HD');
    const f = compose(NELSON, 'farnesene')!;
    expect(f.refs).not.toContain('HD');
  });

  it('le sélinène de Galaxy a sa ligne et sort du reste « autres »', () => {
    const sel = mesureDe(GALAXY, 'selinene');
    expect(sel.p).not.toBeNull();
    expect(sel.p![0]).toBeGreaterThan(1);
    expect(COMPOSES.map((x) => x.id)).toEqual(['myrcene', 'humulene', 'caryophyllene', 'farnesene', 'linalol', 'geraniol', 'selinene', 'autres']);
    // Le reste ne nomme que le β-pinène : aucune huile qui a sa ligne n'y figure.
    const autres = COMPOSES.find((x) => x.id === 'autres')!;
    for (const n of ['myrcène', 'humulène', 'caryophyllène', 'farnésène', 'linalol', 'géraniol', 'sélinène']) expect(autres.aromes.toLowerCase()).not.toContain(n);
    // Sans sa soustraction, le reste serait plus haut du haut du sélinène.
    const sansLigne = mesureDe(GALAXY, 'autres').p!;
    expect(sansLigne[1]).toBeLessThanOrEqual(100 - sel.p![0]);
  });

  it('un houblon sans valeur reste inconnu (pas de 0) et le 4MMP n\'est pas fusionné', () => {
    // Nelson Sauvin a un géraniol depuis les fiches NZ Hops (voie c3e, 26.10) : le cas « sans valeur » prend Adeena.
    expect(compose('beermaverick-adeena', 'geraniol')).toBeNull();
    // Le 4MMP reste celui des fiches de composés : les thiols des compléments (µg/kg, tous thiols) n'y entrent pas.
    expect(compose(CITRA, '4MMP')!.refs).toEqual(['H11']);
  });

  it('les références des nouvelles sources ont leur titre au survol, comme titreRef()', () => {
    expect(titreRef('BH')).toBe('BarthHaas');
    expect(titreRef('JH')).toBe('John I. Haas');
    expect(titreRef('CF')).toBe('Charles Faram');
    expect(titreRef('HL')).toBe('Hopslist');
    expect(titreRef('YVH')).toBe('Yakima Valley Hops');
    expect(titreRef('BM')).toBe('Beer Maverick');
    expect(titreRef('H22')).toBe('Lafontaine 2018');
  });

  it('chaque borne d\'une enveloppe vient d\'une valeur valide d\'une source citée', () => {
    for (const id of [NELSON, CITRA, MOSAIC, GALAXY]) for (const c of ['myrcene', 'linalol', 'geraniol', 'farnesene']) {
      const v = compose(id, c);
      if (v) expect(v.refs.length).toBeGreaterThan(0);
    }
  });
});
