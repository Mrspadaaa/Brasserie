import { describe, it, expect, vi } from 'vitest';
import {
  supplierUrl,
  stockStatus,
  parseSupplierPage,
  verifySupplierPages,
  verifySupplierPagesReport,
  supplierRobotsAllowed
} from '../../functions/src/brewerSuppliers';
const roast = 'https://www.brauundrauchshop.ch/r%C3%B6stgerste';
const page = (body: string) => new Response(body, { headers: { 'content-type': 'text/html' } });
const robots = (body = 'User-agent: *\nAllow: /') => new Response(body, { headers: { 'content-type': 'text/plain' } });
const simpleProduct = '<div class="product-essential"><h1>Cascade 100g</h1><div class="availability"><span class="value">En stock</span></div></div>';
describe('Vérification du stock fournisseur', () => {
  it('refuse les destinations privées, faux domaines, identifiants et redirections ouvertes', () => {
    for (const url of [
      'http://brauundrauchshop.ch',
      'https://brauundrauchshop.ch.evil.test',
      'https://127.0.0.1',
      'https://metadata.google.internal',
      'https://u:p@brewstore.ch',
      'https://brewstore.ch:8080',
      'https://brewstore.ch/index.php?dispatch=checkout.add',
      'https://sios.ch/cascade?add-to-cart=123',
      'https://sios.ch/cascade?remove_item=123',
      'https://www.brauundrauchshop.ch/addproducttocart/details/123/1',
      'https://vertexaisearch.cloud.google.com/other'
    ])
      expect(supplierUrl(url, true)).toBeNull();
    expect(supplierUrl(roast)?.hostname).toBe('www.brauundrauchshop.ch');
  });
  it('respecte les règles robots les plus spécifiques et les restrictions d’utilisation IA', () => {
    expect(supplierRobotsAllowed('User-agent: *\nDisallow: /', roast)).toBe(false);
    expect(supplierRobotsAllowed('User-agent: *\nDisallow: /private\nAllow: /private/product', 'https://brewstore.ch/private/product')).toBe(true);
    expect(supplierRobotsAllowed('User-agent: *\nDisallow: /*?secret=*', 'https://brewstore.ch/product?secret=token')).toBe(false);
    expect(supplierRobotsAllowed('User-agent: *\nDisallow: /product$', 'https://brewstore.ch/product/variant')).toBe(true);
    expect(supplierRobotsAllowed('User-agent: *\nAllow: /\nUser-agent: LaffineeSupplierVerifier\nDisallow: /', roast)).toBe(false);
    expect(supplierRobotsAllowed('User-agent: *\nContent-Signal: search=yes, ai-input=no, ai-train=no', roast)).toBe(false);
    expect(supplierRobotsAllowed('User-agent: *\nContent-Signal: search=yes, ai-input=yes, ai-train=no', roast)).toBe(true);
  });
  it('ne consulte pas un produit interdit par robots et ne contourne pas un refus HTTP', async () => {
    const fetcher = vi.fn(async () => robots('User-agent: *\nDisallow: /'));
    const result = await verifySupplierPagesReport([{ title: 'Cascade', url: roast }], new AbortController().signal, fetcher);
    expect(result.products).toEqual([]);
    expect(result.checks[0].status).toBe('robots_blocked');
    expect(fetcher).toHaveBeenCalledTimes(1);
    const denied = vi.fn(async () => new Response(null, { status: 403 }));
    expect((await verifySupplierPagesReport([{ title: 'Cascade', url: roast }], new AbortController().signal, denied)).checks[0].status).toBe('robots_blocked');
    expect(denied).toHaveBeenCalledTimes(1);
  });
  it('résout un ancien lien vers sa fiche canonique réellement relue', async () => {
    const current = 'https://www.brauundrauchshop.ch/cascade-100g';
    const fetcher = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith('/robots.txt')) return robots();
      return page(url === roast ? `<link rel="canonical" href="${current}">${simpleProduct}` : simpleProduct);
    });
    const result = await verifySupplierPagesReport([{ title: 'Cascade', url: roast }], new AbortController().signal, fetcher);
    expect(result.products[0]).toMatchObject({ url: current, canonicalUrl: current, name: 'Cascade 100g', packageLabel: '100g', stockEvidence: 'visible-text', verifiedBy: 'product-page' });
    expect(result.checks[0]).toMatchObject({ requestedUrl: roast, resolvedUrl: current, status: 'verified' });
    expect(fetcher.mock.calls.map(([url]) => String(url))).toContain(current);
  });
  it('ne publie pas une canonique cassée ou externe comme lien d’achat vérifié', async () => {
    const fetcher = vi.fn(async (input: string | URL | Request) => String(input).endsWith('/robots.txt') ? robots() : String(input) === roast ? page(`<link rel="canonical" href="/removed">${simpleProduct}`) : new Response(null, { status: 404 }));
    const result = await verifySupplierPagesReport([{ title: 'Cascade', url: roast }], new AbortController().signal, fetcher);
    expect(result.products).toEqual([]);
    expect(result.checks[0].status).toBe('unavailable');
    expect(parseSupplierPage(`<link rel="canonical" href="https://evil.test/buy">${simpleProduct}`, roast, 1)).toEqual([]);
  });
  it('garde le prix, le conditionnement et l’ancre exacte du même paquet', () => {
    const html = '<h1>Citra</h1><div class="product-variant-line"><h2 class="variant-name">Citra 5kg</h2><div class="variant-description">Preis/Pack</div><div class="availability"><span class="value" id="stock-123">2 am Lager</span></div><div class="product-price"><span itemprop="price">CHF 245.70</span></div><span itemprop="sku">HO5KG</span></div><div class="product-variant-line"><h2 class="variant-name">Citra</h2><div class="variant-description">Preis/Gramm</div><div class="availability"><span class="value" id="stock-124">0 am Lager</span></div><div class="product-price"><span itemprop="price">CHF 0.1044</span></div></div>';
    const products = parseSupplierPage(html, roast, 1);
    expect(products[0]).toMatchObject({ url: `${roast}#stock-123`, packageLabel: '5kg', priceText: 'CHF 245.70', sku: 'HO5KG', availability: 'in_stock' });
    expect(products[1]).toMatchObject({ url: `${roast}#stock-124`, packageLabel: 'Preis/Gramm', priceText: 'CHF 0.1044', availability: 'out_of_stock' });
  });
  it('lit le message d’indisponibilité de Sevibräu même si la zone livraison annonce seulement un délai', () => {
    const html = '<div class="product--details"><h1>Citra pellets</h1><div class="product--buybox"><div class="alert--content">Dieser Artikel steht derzeit nicht zur Verfügung!</div><div class="product--delivery"><link itemprop="availability" href="https://schema.org/LimitedAvailability">Lieferzeit ca. 5 Tage</div></div><li class="entry-attribute"><span class="entry--content">Gramm</span></li></div>';
    expect(parseSupplierPage(html, 'https://www.bierbrauzubehoer.ch/citra', 1)[0]).toMatchObject({ availability: 'out_of_stock', stockEvidence: 'visible-text', packageLabel: 'Gramm' });
  });
  it('accepte une vraie fiche JSON-LD et distingue sa preuve de stock de celle du texte visible', () => {
    const schema = { '@context': 'https://schema.org', '@type': 'Product', name: 'Cascade 100g', sku: 'CAS100', offers: { '@type': 'Offer', availability: 'https://schema.org/InStock', price: '8.90', priceCurrency: 'CHF' } };
    const html = `<h1>Cascade 100g</h1><script type="application/ld+json">${JSON.stringify(schema)}</script>`;
    expect(parseSupplierPage(html, 'https://eckenstein.shop/cascade', 1)[0]).toMatchObject({ name: 'Cascade 100g', availability: 'in_stock', stockEvidence: 'structured-data', priceText: 'CHF 8.90', packageLabel: '100g', sku: 'CAS100' });
  });
  it('ne déduit pas le stock d’une variante à partir d’offres agrégées ou d’un bouton panier', () => {
    const schema = { '@type': 'Product', name: 'Cascade', offers: [{ '@type': 'Offer', availability: 'https://schema.org/InStock' }, { '@type': 'Offer', availability: 'https://schema.org/OutOfStock' }] };
    const html = `<h1>Cascade</h1><script type="application/ld+json">${JSON.stringify(schema)}</script>`;
    expect(parseSupplierPage(html, 'https://eckenstein.shop/cascade', 1)[0]).toMatchObject({ availability: 'unknown', stockEvidence: 'none' });
    expect(parseSupplierPage('<main><div class="product"><h1>Cascade 100g</h1><span class="price">CHF 8.90</span><form class="cart"><button>Ajouter au panier</button></form></div></main>', 'https://eckenstein.shop/cascade', 1)[0]).toMatchObject({ name: 'Cascade 100g', availability: 'unknown' });
  });
  it('ignore les produits structurés des listes, suggestions et schémas malformés', () => {
    const list = { '@type': 'ItemList', itemListElement: [{ '@type': 'Product', name: 'Cascade', offers: { availability: 'https://schema.org/InStock' } }] };
    expect(parseSupplierPage(`<h1>Houblons</h1><script type="application/ld+json">${JSON.stringify(list)}</script>`, 'https://eckenstein.shop/houblons', 1)).toEqual([]);
    expect(parseSupplierPage('<h1>Houblons</h1><script type="application/ld+json">{bad}</script><aside>En stock</aside>', roast, 1)).toEqual([]);
  });
  it('contrôle la redirection réelle après robots et bloque une destination interne', async () => {
    const fetcher = vi.fn(async (input: string | URL | Request) => String(input).endsWith('/robots.txt') ? robots() : new Response(null, { status: 302, headers: { location: 'http://169.254.169.254' } }));
    const result = await verifySupplierPagesReport([{ title: 'Cascade', url: roast }], new AbortController().signal, fetcher);
    expect(result.products).toEqual([]);
    expect(result.checks[0].status).toBe('invalid_url');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('limite les octets lus et rapporte la page non lisible sans stock inventé', async () => {
    const fetcher = vi.fn(async (input: string | URL | Request) => String(input).endsWith('/robots.txt') ? robots() : new Response(simpleProduct, { headers: { 'content-type': 'text/html', 'content-length': '9999999' } }));
    const result = await verifySupplierPagesReport([{ title: 'Cascade en stock', url: roast }], new AbortController().signal, fetcher);
    expect(result.products).toEqual([]);
    expect(result.checks[0]).toMatchObject({ status: 'unavailable', detail: 'Page trop volumineuse.' });
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
