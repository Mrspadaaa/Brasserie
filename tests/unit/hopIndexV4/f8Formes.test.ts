// Voie f8 (D118, D190) : une forme produit (Citra cryo) reprend sa variété (Citra). Mots, familles, fiches : ceux de la variété ; α propre ; huile totale propre (H1 : « ≈ 2 fois l'huile du T-90 », une source) ;
// composition de l'huile (terpènes, thiols) : celle de la variété, MARQUÉE « de la variété » parce que le fichier ne l'a pas relevée pour le produit. Avant D118, le moteur rendait 0 partout pour le cryo
// (Comparer : « sans donnée »). Ce test échoue sur HEAD (be15e480) : voir la section « HEAD » de RESULTAT.md.
import { describe, expect, it } from 'vitest';
import { hopRef } from '../../../src/domain/hopIndex/v4/data';
import { FAMILIES } from '../../../src/domain/hopIndex/v4/families';
import { citations, describeFamilies, familyWords } from '../../../src/domain/hopIndex/v4/hops';
import { pouvoirAjout, TEXTE_DE_LA_VARIETE } from '../../../src/domain/hopIndex/v4/pouvoir';
import { simulerCas } from '../../../src/domain/hopIndex/v4/profil-simule';

const CITRA = 'beermaverick-citra', CRYO = 'beermaverick-citra:cryo';
const recette = { name: '22A', styleCode: '22A', volumeL: 24, og: 1.081, boilMin: 60, yeastId: 'lalbrew-verdant-ipa', ebc: 10, additions: [] };
const cas = (hop: string) => simulerCas({ recette, levure: 'lalbrew-verdant-ipa', ajouts: [{ houblon: hop, moment: 'dryActive', dose_gL: 4, jours: 3 }], complet: false } as never);

describe('D190 : Citra cryo reprend les mots, les familles et les fiches de Citra', () => {
  it('mêmes fiches, mêmes familles citées, mêmes niveaux, mêmes mots', () => {
    const a = hopRef(CITRA)!, b = hopRef(CRYO)!;
    expect(b.varietyId).toBe(a.varietyId);
    expect(b.catalogue.descriptions).toBe(a.catalogue.descriptions);
    expect(JSON.stringify(describeFamilies(b.varietyId))).toBe(JSON.stringify(describeFamilies(a.varietyId)));
    expect(FAMILIES.filter((f) => citations(b.varietyId)[f].status === 'cité')).toEqual(FAMILIES.filter((f) => citations(a.varietyId)[f].status === 'cité'));
    expect(JSON.stringify(familyWords(b.varietyId, b.catalogue))).toBe(JSON.stringify(familyWords(a.varietyId, a.catalogue)));
  });
  it('le cryo garde son α propre (lot du stock), jamais celui de la variété', () => {
    expect(hopRef(CRYO)!.alpha!.value).toBe(24.8);
    expect(hopRef(CRYO)!.alpha!.from).toBe('lu sur l’article');
    expect(hopRef(CITRA)!.alpha!.from).toMatch(/plage variétale/);
  });
  it('simulé : le cryo apporte à chaque famille que Citra apporte (avant D118 : 0 partout)', () => {
    const v = cas(CITRA).apportsParHoublon[0].seul, c = cas(CRYO).apportsParHoublon[0].seul;
    const dites = FAMILIES.filter((f) => v[f] > 0);
    expect(dites.length).toBeGreaterThanOrEqual(7); // agrumes, tropical, noyau, baies, melon, floral, résineux
    for (const f of dites) expect(c[f], `${f} du cryo`).toBeGreaterThan(0);
    for (const f of FAMILIES.filter((g) => v[g] === 0)) expect(c[f], `${f} : pas d'apport que la variété n'a pas`).toBe(0);
  });
  it('l\'huile totale est celle du produit (2–6 mL/100 g, H1), la composition celle de la variété, et le dit', () => {
    const cryo = pouvoirAjout({ id: 'x', hopKey: CRYO, moment: 'dryActive', grams: 96 }, recette as never);
    const simple = pouvoirAjout({ id: 'x', hopKey: CITRA, moment: 'dryActive', grams: 96 }, recette as never);
    expect(cryo.huile.plage).toMatchObject({ min: 2, max: 6 });
    expect(simple.huile.plage!.max).toBeLessThanOrEqual(3);
    expect(cryo.deLaVariete).toEqual(expect.arrayContaining(['myrcene', 'linalol', 'humulene']));
    expect(simple.deLaVariete).toBeUndefined();
    expect(cryo.hypotheses.join(' ')).toContain(TEXTE_DE_LA_VARIETE);
    expect(cryo.composes.linalol.teneur.hypotheses.join(' ')).toContain('de la variété');
    expect(JSON.stringify(cryo.composes.linalol.teneur.plage)).toBe(JSON.stringify(simple.composes.linalol.teneur.plage)); // composition identique
    expect(cryo.composes.linalol.charge.plage!.max!).toBeGreaterThan(simple.composes.linalol.charge.plage!.max!); // plus d'huile par gramme
    const d = cryo.drapeaux.find((x) => x.id === 'cryo')!;
    expect(d.statut).toBe('de la variété');
    expect(simple.drapeaux.find((x) => x.id === 'cryo')).toBeUndefined();
  });
  it('la confiance du profil simulé dit « de la variété »', () => {
    const c = cas(CRYO);
    expect(c.confiance.pourquoi.join(' ')).toMatch(/composition de l’huile de la variété/);
    expect(cas(CITRA).confiance.pourquoi.join(' ')).not.toMatch(/de la variété/);
  });
});
