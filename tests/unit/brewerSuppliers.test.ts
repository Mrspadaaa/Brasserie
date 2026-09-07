import { describe, it, expect, vi } from 'vitest';
import {
  supplierUrl,
  stockStatus,
  parseSupplierPage,
  verifySupplierPages
} from '../../functions/src/brewerSuppliers';
const roast = 'https://www.brauundrauchshop.ch/r%C3%B6stgerste';
describe('Vérification du stock fournisseur', () => {
  it('refuse les destinations privées, faux domaines, identifiants et redirections ouvertes', () => {
    for (const url of [
      'http://brauundrauchshop.ch',
      'https://brauundrauchshop.ch.evil.test',
      'https://127.0.0.1',
      'https://metadata.google.internal',
      'https://u:p@brewstore.ch',
      'https://brewstore.ch:8080',
      'https://vertexaisearch.cloud.google.com/other'
    ])
      expect(supplierUrl(url, true)).toBeNull();
    expect(supplierUrl(roast)?.hostname).toBe('www.brauundrauchshop.ch');
  });
  it('une mention de stock ne suffit pas et la rupture l’emporte sur un ancien schéma positif', () => {
    expect(stockStatus('0 am Lager')).toBe('out_of_stock');
    expect(stockStatus('Rupture de stock', 'https://schema.org/InStock')).toBe('out_of_stock');
    expect(stockStatus('Nicht lieferbar')).toBe('out_of_stock');
    expect(stockStatus('Lieferzeit 3-4 Werktage')).toBe('unknown');
    expect(stockStatus('Ajouter au panier')).toBe('unknown');
    expect(stockStatus('Sur commande')).toBe('out_of_stock');
    expect(stockStatus('164 am Lager')).toBe('in_stock');
  });
  it('garde les disponibilités par conditionnement et ignore les recommandations', () => {
    const html =
      '<h1>Orge</h1><div class="product-variant-line"><h2 class="variant-name">Orge, Kg</h2><div class="availability"><span class="value">0 am Lager</span></div></div><div class="product-variant-line"><h2 class="variant-name">Orge 25 Kg</h2><div class="availability"><span class="value">4 am Lager</span></div></div><aside>Autre malt : 1000 am Lager</aside>';
    const products = parseSupplierPage(html, roast, 1234);
    expect(products.map((p) => [p.name, p.availability])).toEqual([
      ['Orge, Kg', 'out_of_stock'],
      ['Orge 25 Kg', 'in_stock']
    ]);
    expect(products[0].checkedAt).toBe(1234);
    expect(parseSupplierPage('<h1>Résultats</h1>stock 99', roast, 1234)).toEqual([]);
  });
  it('lit uniquement le produit principal chez Sevibräu et les éléments visibles chez Brewstore', () => {
    const sevi =
      '<div class="product--details"><h1>1kg Röstgerste</h1><div class="product--delivery"><link itemprop="availability" href="https://schema.org/OutOfStock">Nicht lieferbar</div><aside>Sofort versandfertig</aside></div>';
    expect(
      parseSupplierPage(sevi, 'https://www.bierbrauzubehoer.ch/product', 1)[0].availability
    ).toBe('out_of_stock');
    const brew =
      '<div class="ty-product-block"><h1>Pale 100g</h1><div class="hidden"><span class="ty-qty-in-stock">En stock</span></div><span class="ty-qty-out-of-stock">Rupture de stock</span></div>';
    expect(parseSupplierPage(brew, 'https://brewstore.ch/product', 1)[0].availability).toBe(
      'out_of_stock'
    );
    const sios =
      '<div itemscope itemtype="https://schema.org/Product"><h1>Roasted Barley 1kg</h1><div><span class="status">Available immediately</span><link itemprop="availability" href="https://schema.org/InStock"></div></div>';
    expect(parseSupplierPage(sios, 'https://www.sios.ch/Roasted-Barley', 1)[0].availability).toBe(
      'in_stock'
    );
  });
  it('ne suit jamais une redirection fournisseur vers le réseau interne', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
        new Response(null, { status: 302, headers: { location: 'http://169.254.169.254' } })
      );
    expect(
      await verifySupplierPages(
        [{ title: 'Orge', url: roast }],
        new AbortController().signal,
        fetcher
      )
    ).toEqual([]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('ne transforme pas une page inaccessible en preuve de disponibilité', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('En stock', { status: 403 }));
    expect(
      await verifySupplierPages(
        [{ title: 'Orge en stock', url: roast }],
        new AbortController().signal,
        fetcher
      )
    ).toEqual([]);
  });
});
