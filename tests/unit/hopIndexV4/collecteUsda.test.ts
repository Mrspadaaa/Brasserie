// Voie c3d (#180) : le lecteur des fiches d'accession USDA ARS sur un HTML synthétique qui imite la structure (paragraphes « ÉTIQUETTE: valeur »).
import { describe, expect, it } from 'vitest';
import { lireFicheUsda, lireMoyennePlage, valeursTraits } from '../../../scripts/collecte-hop/usda.mjs';

const p = (e: string, v: string) => `<P><FONT SIZE=2><STRONG>${e}</STRONG> ${v}</FONT></P>`;
const html = `<HTML><HEAD><TITLE>Essai (99999)</TITLE></HEAD><BODY>
${p('USDA ACCESSION NO.:', '99999')}${p('CULTIVAR:', '<STRONG>Essai</STRONG>')}${p('PEDIGREE:', 'A x B; seed from USDA <A href="88888.html">88888</A>')}
${p('ALPHA ACIDS:', '6.3% (7-year range 5.1-8.9%)')}${p('BETA ACIDS:', '5.6% (3.6-7.5%)')}${p('COHUMULONE:', '36-40%')}
${p('STORAGE STABILITY:', 'poor (retained 40% of original alpha acids after 6 months room temperature storage)')}${p('OIL:', '1.24 ml/100 g')}
${p('YIELD:', 'Very good, 1800-2200 lbs/acre')}
${p('MAJOR TRAITS:', 'small amounts of farnesene (about 4%), H/C ratio - 2.67; 10% humulene.')}
${p('OTHER INFORMATION:', 'Un paragraphe libre à ne pas recopier dans le dépôt.')}</BODY></HTML>`;

describe('lireMoyennePlage', () => {
  it('lit la moyenne et la plage sur n ans', () => {
    expect(lireMoyennePlage('6.3% (7-year range 5.1-8.9%)')).toMatchObject({ valeur: 6.3, min: 5.1, max: 8.9, anneesPlage: 7, unite: '%' });
    expect(lireMoyennePlage('5.6% (3.6-7.5%)')).toBeNull();
  });
});
describe('valeursTraits', () => {
  it('relève farnésène, humulène et rapport H/C sans garder le texte', () => {
    const t = valeursTraits('small amounts of farnesene (about 4%), H/C ratio - 2.67; 10% humulene.');
    expect(t.farnesene).toMatchObject({ valeur: 4, approx: true, unite: '%' });
    expect(t.humulene).toMatchObject({ valeur: 10 });
    expect(t.rapportHC).toMatchObject({ valeur: 2.67 });
  });
});
describe('lireFicheUsda', () => {
  const r = lireFicheUsda(html, 'https://www.ars.usda.gov/ARSUserFiles/2450/hopcultivars/99999.html', { index: new Map() })!;
  it('lit le nom, l’accession et les valeurs chimiques avec leur unité', () => {
    expect(r.fiche.nom).toBe('Essai');
    expect(r.fiche.accession).toBe('99999');
    expect(r.fiche.champs.alpha).toMatchObject({ valeur: 6.3, min: 5.1, max: 8.9 });
    expect(r.fiche.champs.cohumulone).toMatchObject({ min: 36, max: 40, base: '% des α' });
    expect(r.fiche.champs.huileTotale).toMatchObject({ valeur: 1.24, unite: 'mL/100 g' });
    expect(r.fiche.champs.conservation).toMatchObject({ valeur: 40, moisStockage: 6 });
    expect(r.fiche.champs.rendement).toMatchObject({ min: 1800, max: 2200, unite: 'lbs/acre' });
    expect(r.fiche.champs.farnesene.valeur).toBe(4);
  });
  it('relève les fiches voisines et ne copie pas la prose', () => {
    expect(r.voisins).toEqual([88888]);
    expect(JSON.stringify(r.fiche)).not.toContain('paragraphe libre');
    expect(r.fiche.proseNonCopiee.autresInformations).toBeGreaterThan(5);
  });
  it('rend null pour une page qui n’est pas une fiche', () => {
    expect(lireFicheUsda('<html><body><p>Rien</p></body></html>', 'https://x.test/1.html')).toBeNull();
  });
});
