import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import catalogue from '../../src/data/yeastCatalogueBootstrap.json';
import { catalogueHash, parseProduct } from '../../scripts/yeast-catalogue/parse.mjs';
import { encode, planCatalogueImport } from '../../scripts/yeast-catalogue/import-plan.mjs';

const expectedTooltipContext = 'Info-bulle générale Escarpment associée au champ « Biotransformation » : conversion du géraniol en β-citronellol. Elle reste distincte du libellé fabricant exact (reported) et n’en retire aucun qualificatif thiol/terpène ; cette info-bulle ne rapporte ni mesure de libération des thiols ni rendement.';
const preHashRepairPackWithoutScopedContextsAndContentHashesSha256 = '546eed306c223a08b2ebb4b0cd0c99542c27d89f32f46c3e29021d00dbbcec1e';
const oldEscarpmentContext = 'Indice fabricant de conversion géraniol → β-citronellol ; ne mesure pas la libération des thiols.';
// Original contentSha256 for On Deck Lager, preserved in correction-portee/version02/before-content-sha.json.
const onDeckOldContentSha256 = 'fcb22acbdf0fc4ab1a06cc7a77355b1e86bc7d7fd69e9b4760642b93106b5d87';
const catalogueRows = catalogue as any[];

const escarpment = { id: 'escarpment', name: 'Escarpment Labs' };
const escarpmentProduct = (name: string, reported: string, includeAttenuation = false) => {
  const attenuation = includeAttenuation
    ? '<div class="KeyItem"><span>Attenuation</span><p>78–82%</p></div>'
    : '';
  const html = `${attenuation}<div class="KeyItem"><span>Biotransformation</span><p>${reported}</p></div>`;
  return parseProduct(escarpment, {
    name,
    url: `https://example.test/products/${encodeURIComponent(name)}`,
    inventory: { product_type: 'Yeast', body_html: '' },
  }, html);
};

const biotransformation = (product: ReturnType<typeof escarpmentProduct>) =>
  product.facts.find(fact => fact.key === 'biotransformation')!;

describe('Portée des claims fabricants de biotransformation', () => {
  it.each([
    ['générique', 'Low'],
    ['spécifique thiol', 'High Biotransformation (Thiol)'],
    ['spécifique terpène', 'High (Terpene Flavouring)'],
    ['terpènes et thiols', 'Medium Biotransformation (Terpenes & Thiols)'],
  ])('conserve le libellé %s exact et borne le tooltip général', (_scope, reported) => {
    const fact = biotransformation(escarpmentProduct('Nom de fixture sans règle dédiée', reported));

    expect(fact.reported).toBe(reported);
    expect(fact.context).toBe(expectedTooltipContext);
    expect(fact.source).toMatchObject({
      title: 'Nom de fixture sans règle dédiée',
      author: 'Escarpment Labs',
      kind: 'manufacturer',
      reference: 'https://example.test/products/Nom%20de%20fixture%20sans%20r%C3%A8gle%20d%C3%A9di%C3%A9e',
    });
    expect(fact.range).toBeUndefined();
    expect(fact.unit).toBeUndefined();
    expect(fact.qualifier).toBeUndefined();
  });

  it('ne choisit pas le sens du contexte d’après le nom commercial', () => {
    const reported = 'High (Thiol Biotransformation)';
    const first = biotransformation(escarpmentProduct('Thiol Libre', reported));
    const renamed = biotransformation(escarpmentProduct('Produit inédit', reported));

    expect(first.context).toBe(renamed.context);
    expect(first.reported).toBe(renamed.reported);
    expect(first.source.title).not.toBe(renamed.source.title);
  });

  it('ne modifie ni une mesure numérique voisine ni les métadonnées de provenance', () => {
    const product = escarpmentProduct('Lot de test', 'High Biotransformation (Thiol)', true);
    const attenuation = product.facts.find(fact => fact.key === 'attenuation');

    expect(attenuation).toMatchObject({
      reported: '78–82%',
      range: { min: 78, max: 82 },
      unit: '%',
      qualifier: 'range',
      source: { author: 'Escarpment Labs', reference: 'https://example.test/products/Lot%20de%20test' },
    });
    expect(attenuation?.context).toBeUndefined();
    expect(biotransformation(product).source).toMatchObject({
      title: 'Lot de test',
      author: 'Escarpment Labs',
      reference: 'https://example.test/products/Lot%20de%20test',
    });
  });

  it('n’ajoute pas l’annotation Escarpment aux autres fabricants', () => {
    const product = parseProduct({ id: 'omega', name: 'Omega Yeast' }, {
      name: 'Produit Omega fixture',
      url: 'https://example.test/omega',
      inventory: { product_type: 'Brewing Yeast', description: '<p>Biotransformation: Medium</p>' },
    });
    const fact = product.facts.find(item => item.key === 'biotransformation');

    expect(fact?.reported).toBe('Medium');
    expect(fact?.context).toBeUndefined();
    expect(fact?.source).toMatchObject({ author: 'Omega Yeast', reference: 'https://example.test/omega' });
  });

  it('corrige le contexte des 166 claims et les empreintes de leurs 123 catalogues', () => {
    const rows = structuredClone(catalogueRows);
    const targetFacts = rows.flatMap(row => row.catalogue?.manufacturer === 'Escarpment Labs'
      ? (row.catalogue.facts ?? []).filter(fact => fact.key === 'biotransformation')
      : []);
    const targetProducts = rows.filter(row => row.catalogue?.manufacturer === 'Escarpment Labs'
      && (row.catalogue.facts ?? []).some((fact: any) => fact.key === 'biotransformation'));

    expect(targetFacts).toHaveLength(166);
    expect(targetProducts).toHaveLength(123);
    expect(targetFacts.every(fact => fact.context === expectedTooltipContext)).toBe(true);
    expect(targetFacts.every(fact => fact.source)).toBe(true);
    expect(targetFacts.filter(fact => 'confidence' in fact).length).toBe(0);
    expect(targetFacts.filter(fact => fact.range || fact.unit || fact.qualifier).length).toBe(0);
    expect(targetProducts.every((row: any) => row.catalogue.contentSha256 === catalogueHash(row.catalogue))).toBe(true);

    for (const row of rows) {
      if (row.catalogue?.manufacturer !== 'Escarpment Labs') continue;
      for (const fact of row.catalogue.facts ?? []) {
        if (fact.key === 'biotransformation') delete fact.context;
      }
      if ((row.catalogue.facts ?? []).some((fact: any) => fact.key === 'biotransformation')) {
        delete row.catalogue.contentSha256;
      }
    }
    const projectionHash = createHash('sha256').update(JSON.stringify(rows)).digest('hex');
    expect(projectionHash).toBe(preHashRepairPackWithoutScopedContextsAndContentHashesSha256);
  });

  it('reconnaît le pack corrigé comme officiel, actualise un ancien pack officiel, et bloque un vrai edit', () => {
    const official = catalogueRows.find(row => row.id === 'yeast-escarpment-15272687173798')!;
    expect(catalogueHash(official.catalogue)).toBe(official.catalogue.contentSha256);
    const makeDocument = (row: any) => ({
      name: `projects/test/databases/(default)/documents/hopKnowledge/${row.id}`,
      fields: encode(row).mapValue.fields,
      updateTime: '2026-09-30T00:00:00Z',
    });

    const samePack = planCatalogueImport([official], [makeDocument(official)]);
    expect(samePack.conflicts).toEqual([]);
    expect(samePack.writes).toEqual([]);
    expect(samePack.unchanged).toEqual([official.id]);

    const staleChecksumWithCorrectedContext = structuredClone(official);
    staleChecksumWithCorrectedContext.catalogue.contentSha256 = onDeckOldContentSha256;
    expect(catalogueHash(staleChecksumWithCorrectedContext.catalogue)).not.toBe(onDeckOldContentSha256);
    expect(planCatalogueImport([official], [makeDocument(staleChecksumWithCorrectedContext)]).conflicts).toMatchObject([
      { id: official.id, reason: 'Catalogue edited locally; automatic replacement skipped' },
    ]);

    const oldOfficial = structuredClone(official);
    for (const fact of oldOfficial.catalogue.facts) {
      if (fact.key === 'biotransformation') fact.context = oldEscarpmentContext;
    }
    oldOfficial.catalogue.contentSha256 = onDeckOldContentSha256;
    expect(catalogueHash(oldOfficial.catalogue)).toBe(onDeckOldContentSha256);
    const upgrade = planCatalogueImport([official], [makeDocument(oldOfficial)]);
    expect(upgrade.conflicts).toEqual([]);
    expect(upgrade.writes).toHaveLength(1);
    expect(upgrade.writes[0].data.catalogue).toEqual(official.catalogue);

    const userEdit = structuredClone(official);
    const reported = userEdit.catalogue.facts.find((fact: any) => fact.key === 'biotransformation')!;
    reported.reported = 'Correction documentaire locale';
    const protectedEdit = planCatalogueImport([official], [makeDocument(userEdit)]);
    expect(protectedEdit.writes).toEqual([]);
    expect(protectedEdit.conflicts).toMatchObject([
      { id: official.id, reason: 'Catalogue edited locally; automatic replacement skipped' },
    ]);
  });
});
