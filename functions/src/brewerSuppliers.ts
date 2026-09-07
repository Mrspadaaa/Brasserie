import { load } from 'cheerio/slim';
import type { BrewerProduct } from './companionTypes.js';

// Only public shop pages and Google's grounding redirects can be fetched by this tool.
// No model-controlled intranet URLs, credentials, ports, or arbitrary redirect destinations.
const shops: Record<string, string> = {
  'brauundrauchshop.ch': 'Brau- und Rauchshop',
  'brewstore.ch': 'Brewstore Suisse',
  'bierbrauzubehoer.ch': 'Sevibräu',
  'sios.ch': 'SIOS',
  'eckenstein.shop': 'Eckenstein'
};
const host = (url: URL) => url.hostname.replace(/^www\./, '');
export function supplierUrl(raw: string, redirects = false): URL | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    if (Object.hasOwn(shops, host(url))) return url;
    if (
      redirects &&
      url.hostname === 'vertexaisearch.cloud.google.com' &&
      url.pathname.startsWith('/grounding-api-redirect/')
    )
      return url;
  } catch {
    /* Malformed or relative source. */
  }
  return null;
}
const compact = (text: string) => text.replace(/\s+/g, ' ').trim();
export function stockStatus(text: string, schema = ''): BrewerProduct['availability'] {
  // Explicit negatives win over "stock" or a stale positive schema marker.
  if (
    /outofstock|soldout|discontinued|preorder|backorder/i.test(schema) ||
    /(?:\b0\s+am lager|nicht (?:auf lager|lieferbar|verfügbar)|ausverkauft|rupture|épuisé|non disponible|hors stock|out of stock|not in stock|sur commande|précommande)/i.test(
      text
    )
  )
    return 'out_of_stock';
  if (
    /\/InStock$/i.test(schema) ||
    /(?:\b[1-9]\d*\s+am lager|sofort (?:versandfertig|lieferbar|verfügbar)|available immediately|\bauf lager\b|\ben stock\b|\bin stock\b)/i.test(
      text
    )
  )
    return 'in_stock';
  return 'unknown';
}

/** Parse only the main product/variant's availability, never recommendations or a search snippet. */
export function parseSupplierPage(
  html: string,
  rawUrl: string,
  checkedAt: number
): BrewerProduct[] {
  const url = supplierUrl(rawUrl);
  if (!url) return [];
  const $ = load(html),
    supplier = shops[host(url)];
  const products: BrewerProduct[] = [];
  const add = (name: string, text: string, schema = '') => {
    if (!name) return;
    const availabilityText = compact(text).slice(0, 180);
    products.push({
      name: compact(name).slice(0, 180),
      supplier,
      url: url.href,
      availability: stockStatus(availabilityText, schema),
      availabilityText: availabilityText || 'Disponibilité non confirmée sur la page.',
      checkedAt
    });
  };
  $('script, style, nav, footer').remove();
  if (host(url) === 'brauundrauchshop.ch') {
    $('.product-variant-line').each((_, el) => {
      const variant = $(el);
      add(
        variant.find('.variant-name').first().text(),
        variant.find('.availability .value').first().text()
      );
    });
    if (!products.length && $('.product-essential').length)
      add($('h1').first().text(), $('.product-essential .availability .value').first().text());
  } else if (host(url) === 'bierbrauzubehoer.ch' && $('.product--details').length) {
    const main = $('.product--details').first();
    const availability = main.find('.product--delivery').first();
    add(
      $('h1').first().text(),
      availability.text(),
      availability.find('[itemprop="availability"]').attr('href')
    );
  } else if (host(url) === 'sios.ch') {
    const main = $('[itemscope][itemtype="https://schema.org/Product"]').first();
    const availability = main.find('[itemprop="availability"]').first();
    if (main.find('h1').length && availability.length)
      add(
        main.find('h1').first().text(),
        availability.parent().find('.status').text(),
        availability.attr('href')
      );
  } else if (host(url) === 'brewstore.ch' && $('.ty-product-block').length) {
    const main = $('.ty-product-block').first();
    // CS-Cart emits hidden positive and negative elements together. Read the visible status only.
    const visible = main
      .find('.ty-qty-in-stock, .ty-qty-out-of-stock')
      .filter((_, el) => {
        const node = $(el);
        return !node.closest('.hidden, [hidden], [style*="display: none"], [style*="display:none"]')
          .length;
      })
      .first();
    add(main.find('h1').first().text() || $('h1').first().text(), visible.text());
  }
  return products
    .sort(
      (a, b) => Number(/25\s*(?:kg|kilo)/i.test(a.name)) - Number(/25\s*(?:kg|kilo)/i.test(b.name))
    )
    .slice(0, 3);
}

export async function verifySupplierPages(
  sources: Array<{ title: string; url: string }>,
  signal: AbortSignal,
  fetchPage: typeof fetch = fetch
): Promise<BrewerProduct[]> {
  const candidates = [...new Set(sources.map((s) => s.url))]
    .filter((url) => supplierUrl(url, true))
    .slice(0, 8);
  const results = await Promise.allSettled(
    candidates.map(async (raw) => {
      const localSignal = AbortSignal.any([signal, AbortSignal.timeout(10000)]);
      let url = supplierUrl(raw, true)!;
      for (let hop = 0; hop < 5; hop++) {
        const response = await fetchPage(url, {
          signal: localSignal,
          redirect: 'manual',
          headers: { Accept: 'text/html', 'Cache-Control': 'no-cache' }
        });
        if (response.status >= 300 && response.status < 400) {
          await response.body?.cancel();
          const next = supplierUrl(new URL(response.headers.get('location') || '', url).href, true);
          if (!next || next.href === url.href) return [];
          url = next;
          continue;
        }
        if (
          !response.ok ||
          !supplierUrl(url.href) ||
          !response.headers.get('content-type')?.includes('text/html')
        ) {
          await response.body?.cancel();
          return [];
        }
        const reader = response.body?.getReader();
        if (!reader) return [];
        const chunks: Uint8Array[] = [];
        let size = 0;
        try {
          while (true) {
            const part = await reader.read();
            if (part.done) break;
            size += part.value.byteLength;
            if (size > 1800000) {
              await reader.cancel();
              return [];
            }
            chunks.push(part.value);
          }
        } finally {
          reader.releaseLock();
        }
        return parseSupplierPage(Buffer.concat(chunks).toString('utf8'), url.href, Date.now());
      }
      return [];
    })
  );
  const found = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
  return [...new Map(found.map((p) => [p.url + ':' + p.name, p])).values()].slice(0, 24);
}
