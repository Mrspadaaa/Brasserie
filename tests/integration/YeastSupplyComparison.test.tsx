import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { YeastRecipeChoice } from '../../src/ui/YeastRecipeChoice';
import { readYeastSupply, type YeastPitchingWort, type YeastProductDocument, type YeastSupplySource } from '../../functions/src/yeastSupplySchema';
import supplyBootstrap from '../../src/data/yeastSupplyBootstrap.json';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import type { Recipe } from '../../src/types';

const localData = vi.hoisted(() => ({
  hopKnowledge: [] as unknown[],
  yeastProducts: [] as unknown[],
  stocks: { rawMaterials: [] as unknown[] }
}));

vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: (read: () => unknown) => read() }));
vi.mock('../../src/services/storage', async () => {
  const actual = await vi.importActual<typeof import('../../src/services/storage')>('../../src/services/storage');
  return { ...actual, StorageService: {
    ...actual.StorageService,
    getHopKnowledge: () => localData.hopKnowledge,
    getYeastProducts: () => localData.yeastProducts,
    getStocks: () => localData.stocks,
    subscribe: () => () => {}
  } };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localData.hopKnowledge = [];
  localData.yeastProducts = [];
  localData.stocks = { rawMaterials: [] };
});

function recipeWithWort(wort?: YeastPitchingWort): Recipe {
  const recipe = yeastFlowRecipe();
  recipe.style = 'American Pale Ale';
  recipe.ogTarget = 1.05;
  recipe.yeast = {
    name: 'SafAle US-05', lab: 'Fermentis', strain: 'US-05', hopIndexId: 'fermentis-us05',
    form: 'sèche', qty: 1, unit: 'sachet',
    ...(wort ? { pitching: { version: 1 as const, wort } } : {})
  };
  return recipe;
}

function canonicalVerdantDocument(): YeastProductDocument {
  const supply = readYeastSupply(supplyBootstrap);
  if (!supply) throw new Error('Bootstrap approvisionnement invalide.');
  const product = supply.products.find(candidate => candidate.referenceId === 'lalbrew-verdant-ipa');
  const offer = product && supply.offers.find(candidate => candidate.productId === product.id);
  if (!product || !offer) throw new Error('Variante et offre Verdant attendues dans le bootstrap.');
  const sharedUrl = 'https://evidence.example/shared-verdant-observations';
  const checkedAt = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();
  const source = (previous: YeastSupplySource, origin: NonNullable<YeastSupplySource['origin']>, daysAgo: number, title: string) =>
    ({ ...previous, url: sharedUrl, title, checkedAt: checkedAt(daysAgo), origin });
  const productCopy = structuredClone(product);
  productCopy.source = source(productCopy.source, 'manufacturer', 0, 'Identité Verdant dans la fiche fabricant');
  if (productCopy.format) productCopy.format.source = source(productCopy.format.source, 'manual', 2, 'Format Verdant copié depuis la fiche vendeur');
  const canonicalOffer = structuredClone(offer);
  canonicalOffer.id = 'qa-canonical-verdant';
  canonicalOffer.seller = 'Offre canonique QA';
  canonicalOffer.sku = 'QA-VARIANT';
  canonicalOffer.sellerCountry = 'CH';
  canonicalOffer.sellerSource = source(offer.sellerSource ?? offer.stock.source, 'manual', 4, 'Adresse du vendeur relevée pour le test');
  canonicalOffer.stock = { ...offer.stock, text: 'Stock issu de la copie canonique QA.', source: source(offer.stock.source, 'merchant', 0, 'Stock Verdant relevé par le vendeur') };
  canonicalOffer.shipping = { destination: 'CH', status: 'yes', conditions: 'Livraison CH documentée pour le test.',
    source: source(offer.shipping?.source ?? offer.stock.source, 'ai', 1, 'Conditions CH relevées par recherche IA') };
  if (offer.price) canonicalOffer.price = { ...offer.price, source: source(offer.price.source, 'manual', 3, 'Prix Verdant copié manuellement') };
  return { id: product.id, version: 1, revision: 1, product: productCopy, offers: [canonicalOffer] };
}

const displayedSourceDate = (value: string) => `${value.slice(8, 10)}.${value.slice(5, 7)}.${value.slice(0, 4)}${value.slice(10) ? ` ${value.slice(11).replace(/^T/, '')}` : ''}`;

async function openComparison(query = 'Verdant') {
  const user = userEvent.setup();
  await user.type(screen.getByRole('searchbox', { name: 'Chercher une autre levure' }), query);
  await user.click(await screen.findByRole('checkbox', { name: new RegExp(`Comparer .*${query}`, 'i') }));
  await user.click(screen.getByRole('button', { name: /Comparer côte à côte/ }));
  return screen.findByRole('table', { name: 'Produits, formats, doses et offres' });
}

function renderRecipe(recipe: Recipe) {
  return <YeastRecipeChoice recipe={recipe} quantityEditor={<span>Quantité prévue du brouillon</span>} onChange={vi.fn()} />;
}

describe('Raccord de la comparaison des offres au choix de levure', () => {
  it('fusionne les documents canoniques validés et affiche leurs offres avec le moût mesuré du brouillon', async () => {
    const canonical = canonicalVerdantDocument();
    const invalid = { ...structuredClone(canonical), revision: -1,
      offers: [{ ...canonical.offers[0], id: 'qa-invalid-offer', seller: 'Offre invalide' }] };
    localData.yeastProducts = [canonical, invalid];
    render(renderRecipe(recipeWithWort({ volumeL: 20, sg: 1.05, basis: 'measured', volumeBasis: 'measured', sgBasis: 'measured' })));

    const table = await openComparison();
    const supplyScroll = table.closest<HTMLElement>('[role="region"]');
    expect(supplyScroll).toHaveAttribute('tabindex', '0');
    const scrollHint = document.getElementById(supplyScroll!.getAttribute('aria-describedby')!);
    expect(scrollHint).toHaveTextContent('Fais défiler le tableau horizontalement');
    expect(table.querySelectorAll('colgroup col')).toHaveLength(4);
    const wort = document.querySelector<HTMLElement>('[data-supply-wort]');
    expect(wort).toHaveTextContent('20 L · mesuré');
    expect(wort).toHaveTextContent('SG 1,050 · mesuré');

    const verdant = table.querySelector<HTMLElement>('[data-supply-product="lalbrew-verdant-11g"]');
    expect(verdant).not.toBeNull();
    expect(within(verdant!).getByText('Offre canonique QA')).toBeInTheDocument();
    expect(verdant!.querySelector('[data-supply-offer="qa-canonical-verdant"]')).not.toBeNull();
    expect(verdant!.querySelector('[data-supply-offer="qa-invalid-offer"]')).toBeNull();
    expect(verdant!.querySelector('[data-supply-row="dose"]')).toHaveTextContent('g');
    expect(verdant!.querySelector('[data-supply-row="preparation"]')).toHaveTextContent('Préparation non documentée ici');

    const user = userEvent.setup();
    const productSources = verdant!.querySelector<HTMLDetailsElement>('.yc-compare-col > details')!;
    await user.click(productSources.querySelector('summary')!);
    const identity = productSources.querySelector('[data-source-observation="product-identity"]')!;
    const format = productSources.querySelector('[data-source-observation="product-format"]')!;
    const productCheckedAt = canonical.product.source.checkedAt;
    const formatCheckedAt = canonical.product.format!.source.checkedAt;
    expect(identity).toHaveTextContent('Fabricant');
    expect(identity).toHaveTextContent(displayedSourceDate(productCheckedAt));
    expect(format).toHaveTextContent('Saisie manuelle');
    expect(format).toHaveTextContent(displayedSourceDate(formatCheckedAt));
    const productDocuments = productSources.querySelector('[data-source-documents="product"]')!;
    await user.click(productDocuments.querySelector('summary')!);
    expect(productDocuments.querySelectorAll('a.yeast-source')).toHaveLength(1);
    expect(productDocuments).not.toHaveTextContent('Source primaire');

    const offer = verdant!.querySelector<HTMLDetailsElement>('[data-supply-offer="qa-canonical-verdant"]')!;
    await user.click(offer.querySelector('summary')!);
    expect(offer).toHaveAttribute('data-buyable', 'true');
    expect(offer).toHaveTextContent('Prix à revérifier');
    const offerSources = offer.querySelector('[data-source-documents="offer"]')!;
    await user.click(offerSources.querySelector('summary')!);
    expect(offerSources.querySelectorAll('a.yeast-source')).toHaveLength(1);
    const offerObservations = [
      ['seller-country', 'Saisie manuelle', canonical.offers[0].sellerSource!.checkedAt],
      ['stock', 'Vendeur', canonical.offers[0].stock.source.checkedAt],
      ['shipping', 'Recherche IA', canonical.offers[0].shipping!.source.checkedAt],
      ['price', 'Saisie manuelle', canonical.offers[0].price!.source.checkedAt]
    ] as const;
    for (const [id, origin, checkedAt] of offerObservations) {
      const observation = offer.querySelector(`[data-source-observation="${id}"]`)!;
      expect(observation).toHaveTextContent(origin);
      expect(observation).toHaveTextContent(displayedSourceDate(checkedAt));
    }
    expect(offer).not.toHaveTextContent('Source primaire');
  });

  it('identifie chaque variante par son produit et son format depuis Offres quand le même vendeur les vend', async () => {
    render(renderRecipe(recipeWithWort({ volumeL: 20, sg: 1.05, basis: 'measured', volumeBasis: 'measured', sgBasis: 'measured' })));
    const table = await openComparison('Verdant');
    const cases = [
      { productId: 'fermentis-us05-11_5g', offerId: 'brau-rauch-us05-he0102-20260927',
        seller: 'Brau- und Rauchshop', identity: 'Fermentis · SafAle US-05 — sachet 11,5 g · Sachet individuel 11,5 g' },
      { productId: 'lalbrew-verdant-11g', offerId: 'brau-rauch-verdant-he2036-20260927',
        seller: 'Brau- und Rauchshop', identity: 'Lallemand Brewing · LalBrew Verdant IPA — sachet 11 g · Sachet individuel 11 g' }
    ];

    for (const item of cases) {
      const row = table.querySelector(`[data-supply-product="${item.productId}"]`);
      const offerCell = row?.querySelector('[data-supply-row="offers"]');
      const offer = offerCell?.querySelector(`[data-supply-offer="${item.offerId}"]`);
      expect(offerCell).not.toBeNull();
      expect(offer).not.toBeNull();
      expect(offer!.querySelector('summary')).toHaveTextContent(item.seller);
      expect(offer!.querySelector('summary [data-offer-product-context]')).toHaveTextContent(item.identity);
    }
  });

  it('affiche distinctement les opérateurs stricts et inclusifs sans calculer des packs bornés', async () => {
    const base = canonicalVerdantDocument();
    const definitions = [
      { id: 'qa-dose-strict-lower', qualifier: 'strict-lower-bound' as const, value: 50, expected: '> 50 g/hL · borne strictement inférieure' },
      { id: 'qa-dose-lower', qualifier: 'lower-bound' as const, value: 50, expected: '≥ 50 g/hL · borne inférieure' },
      { id: 'qa-dose-strict-upper', qualifier: 'strict-upper-bound' as const, value: 60, expected: '< 60 g/hL · borne strictement supérieure' },
      { id: 'qa-dose-upper', qualifier: 'upper-bound' as const, value: 60, expected: '≤ 60 g/hL · borne supérieure' }
    ];
    const documents = definitions.map(definition => {
      const product = structuredClone(base.product);
      product.id = definition.id;
      product.label = `Dose ${definition.qualifier} QA`;
      if (!product.dose) throw new Error('Repère fabricant Verdant attendu pour le test.');
      product.dose = { ...product.dose, range: { min: definition.value, max: definition.value }, qualifier: definition.qualifier };
      return { id: product.id, version: 1 as const, revision: 1, product, offers: [] };
    });
    localData.yeastProducts = [base, ...documents];
    render(renderRecipe(recipeWithWort({ volumeL: 20, sg: 1.05, basis: 'measured', volumeBasis: 'measured', sgBasis: 'measured' })));

    const table = await openComparison('Verdant');
    const user = userEvent.setup();
    for (const definition of definitions) {
      const row = table.querySelector(`[data-supply-product="${definition.id}"]`);
      const dose = row?.querySelector('[data-supply-row="dose"]');
      expect(dose).toHaveTextContent('Inconnu');
      expect(dose).not.toHaveTextContent('sachets');
      const details = dose?.querySelector('details');
      expect(details).not.toBeNull();
      await user.click(details!.querySelector('summary')!);
      expect(details!.querySelector('[data-source-observation="manufacturer-rate"]')).toHaveTextContent(definition.expected);
    }
  });

  it('garde formats et offres comparables quand le moût à ensemencer est absent, sans reprendre l’OG recette', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-09-27T12:00:00.000Z'));
    render(renderRecipe(recipeWithWort()));
    const table = await openComparison('1084');
    const wort = document.querySelector<HTMLElement>('[data-supply-wort]');
    expect(wort).toHaveTextContent('volume inconnu');
    expect(wort).toHaveTextContent('SG inconnue');
    expect(wort).toHaveTextContent('Volume manquant');
    expect(wort).not.toHaveTextContent('1,050');

    const us05 = table.querySelector<HTMLElement>('[data-supply-product="fermentis-us05-11_5g"]');
    expect(us05).not.toBeNull();
    expect(us05).toHaveTextContent('Sachet individuel 11,5 g');
    expect(us05!.querySelector('[data-supply-row="dose"]')).toHaveTextContent('Inconnu');
    expect(us05!.querySelector('[data-supply-row="dose"]')).toHaveTextContent('Volume du moût à ensemencer manquant');
    expect(us05!.querySelector('[data-supply-row="offers"]')).toHaveTextContent('Brau- und Rauchshop');
    const liquidXL = table.querySelector<HTMLElement>('[data-supply-product="wyeast-1084-xl-unspecified"]');
    expect(liquidXL).not.toBeNull();
    expect(liquidXL).toHaveTextContent('Format non communiqué · packs inconnus');
    expect(liquidXL!.querySelector('[data-supply-row="offers"]')).toHaveTextContent('Stock annoncé');
  });

  it('ajoute à la comparaison les copies recette absentes du supply sans modifier le canonique ni la recette', async () => {
    const supply = readYeastSupply(supplyBootstrap);
    if (!supply) throw new Error('Bootstrap approvisionnement invalide.');
    const canonicalProduct = supply.products.find(product => product.referenceId === 'fermentis-us05');
    const canonicalOffer = canonicalProduct && supply.offers.find(offer => offer.productId === canonicalProduct.id);
    if (!canonicalProduct || !canonicalOffer) throw new Error('Produit US-05 exact attendu dans le bootstrap.');
    const recipe = recipeWithWort({ volumeL: 20, sg: 1.05, basis: 'measured', volumeBasis: 'measured', sgBasis: 'measured' });
    const copySource = (previous: YeastSupplySource, path: string, title: string): YeastSupplySource => ({
      ...previous, url: `https://recipe.example/${path}`, title, checkedAt: new Date().toISOString(), origin: 'manual'
    });
    const productCopy = structuredClone(canonicalProduct);
    productCopy.id = 'recipe-copy-us05';
    productCopy.source = copySource(productCopy.source, 'us05-identity', 'Copie locale du produit');
    if (productCopy.format) productCopy.format.source = copySource(productCopy.format.source, 'us05-format', 'Copie locale du format');
    const offerCopy = structuredClone(canonicalOffer);
    offerCopy.id = 'recipe-copy-us05-offer';
    offerCopy.productId = productCopy.id;
    offerCopy.seller = 'Offre copiée depuis la recette';
    if (offerCopy.sellerSource) offerCopy.sellerSource = copySource(offerCopy.sellerSource, 'us05-seller', 'Copie locale du pays vendeur');
    offerCopy.stock.source = copySource(offerCopy.stock.source, 'us05-stock', 'Copie locale du stock');
    if (offerCopy.shipping) offerCopy.shipping.source = copySource(offerCopy.shipping.source, 'us05-shipping', 'Copie locale de livraison');
    if (offerCopy.price) offerCopy.price.source = copySource(offerCopy.price.source, 'us05-price', 'Copie locale du prix');
    recipe.yeast.pitching = { ...(recipe.yeast.pitching ?? { version: 1 as const }), product: productCopy, offer: offerCopy };
    const recipeBefore = structuredClone(recipe);
    const bootstrapBefore = structuredClone(supplyBootstrap);
    localData.yeastProducts = [];
    render(renderRecipe(recipe));

    const table = await openComparison('1084');
    const row = table.querySelector<HTMLElement>('[data-supply-product="recipe-copy-us05"]');
    expect(row).not.toBeNull();
    expect(row!.querySelector('[data-recipe-copy="product"]')).toHaveTextContent('Copie de recette · absente du catalogue chargé');
    const offer = row!.querySelector<HTMLDetailsElement>('[data-supply-offer="recipe-copy-us05-offer"]');
    expect(offer).not.toBeNull();
    expect(offer!.querySelector('[data-recipe-copy="offer"]')).toHaveTextContent('Copie de recette · absente du catalogue chargé');
    await userEvent.setup().click(offer!.querySelector('summary')!);
    expect(offer).toHaveTextContent('Saisie manuelle');

    expect(recipe).toEqual(recipeBefore);
    expect(supplyBootstrap).toEqual(bootstrapBefore);
    expect(localData.yeastProducts).toEqual([]);
  });

  it('garde le produit canonique en cas de collision d’identifiant tout en ajoutant une offre locale absente', async () => {
    const supply = readYeastSupply(supplyBootstrap);
    if (!supply) throw new Error('Bootstrap approvisionnement invalide.');
    const product = supply.products.find(candidate => candidate.referenceId === 'fermentis-us05');
    const offer = product && supply.offers.find(candidate => candidate.productId === product.id);
    if (!product || !offer) throw new Error('Produit US-05 exact attendu dans le bootstrap.');
    const recipe = recipeWithWort({ volumeL: 20, sg: 1.05, basis: 'measured', volumeBasis: 'measured', sgBasis: 'measured' });
    const collisionCopy = { ...structuredClone(product), label: 'Copie locale divergente' };
    const offerCopy = { ...structuredClone(offer), id: 'recipe-offer-with-colliding-product', seller: 'Offre locale du produit canonique' };
    recipe.yeast.pitching = { ...(recipe.yeast.pitching ?? { version: 1 as const }), product: collisionCopy, offer: offerCopy };
    localData.yeastProducts = [];
    render(renderRecipe(recipe));

    const table = await openComparison('1084');
    const canonicalRow = table.querySelector<HTMLElement>(`[data-supply-product="${product.id}"]`);
    expect(canonicalRow).not.toBeNull();
    expect(canonicalRow).toHaveTextContent(product.label);
    expect(canonicalRow).not.toHaveTextContent('Copie locale divergente');
    expect(canonicalRow!.querySelector('[data-recipe-copy="product"]')).toBeNull();
    expect(canonicalRow!.querySelector('[data-supply-offer="recipe-offer-with-colliding-product"] [data-recipe-copy="offer"]'))
      .toHaveTextContent('Copie de recette · absente du catalogue chargé');
  });
});
