import { load } from 'cheerio/slim';
import type { BrewerProduct } from './companionTypes.js';

// Public supplier pages only. Grounding URLs are accepted solely as redirect candidates.
const shops: Record<string, string> = {
  'brauundrauchshop.ch': 'Brau- und Rauchshop',
  'brewstore.ch': 'Brewstore Suisse',
  'bierbrauzubehoer.ch': 'Sevibräu',
  'sios.ch': 'SIOS',
  'eckenstein.shop': 'Eckenstein'
};
const USER_AGENT = 'LaffineeSupplierVerifier/1.0';
const host = (url: URL) => url.hostname.replace(/^www\./, '');
const compact = (text: string) => text.replace(/\s+/g, ' ').trim();
const string = (value: unknown) => typeof value === 'string' ? value : '';

export function supplierUrl(raw: string, redirects = false): URL | null {
  try {
    if (raw.length > 2000) return null;
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    if (Object.hasOwn(shops, host(url))) {
      if (/(?:^|\/)(?:cart|checkout|basket|addproducttocart|compareproducts|customer|admin|account|login|logout|wishlist|order)(?:\/|$)/i.test(url.pathname)) return null;
      for (const [key, value] of url.searchParams) {
        if (/^(?:add[-_]to[-_]cart|remove[-_]item|remove[-_]from[-_]cart|undo[-_]item|update[-_]cart|empty[-_]cart|add[-_]to[-_]wishlist|delete|logout)$/i.test(key)) return null;
        if (/^(?:action|dispatch|cmd|do|wc-ajax)$/i.test(key) && /add|delete|remove|update|checkout|login|logout|submit|cart|wishlist/i.test(value)) return null;
      }
      return url;
    }
    if (redirects && url.hostname === 'vertexaisearch.cloud.google.com' &&
      url.pathname.startsWith('/grounding-api-redirect/')) return url;
  } catch { /* Malformed source. */ }
  return null;
}
function pageUrl(raw: string, base: URL): URL | null {
  try {
    const next = supplierUrl(new URL(raw, base).href);
    return next && host(next) === host(base) && next.pathname !== '/' ? next : null;
  } catch { return null; }
}
function withoutHash(url: URL): string {
  const copy = new URL(url); copy.hash = ''; return copy.href;
}
const normalizedName = (value: string) => compact(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function stockStatus(text: string, schema = ''): BrewerProduct['availability'] {
  // A current visible negative always beats a stale positive schema marker.
  if (/outofstock|soldout|discontinued|preorder|backorder/i.test(schema) ||
    /(?:\b0\s+am lager|nicht (?:auf lager|lieferbar|verfügbar|zur verfügung)|ausverkauft|rupture|épuisé|non disponible|hors stock|out of stock|not in stock|sur commande|précommande|pas en stock)/i.test(text)) return 'out_of_stock';
  if (/(?:^|\/)InStock$/i.test(schema) ||
    /(?:\b[1-9]\d*\s+am lager|sofort (?:versandfertig|lieferbar|verfügbar)|available immediately|\bauf lager\b|\ben stock\b|\bin stock\b)/i.test(text)) return 'in_stock';
  return 'unknown';
}

/** Extract only a main Product, never products nested in a category ItemList. */
function schemaProducts($: ReturnType<typeof load>): any[] {
  const result: any[] = [];
  const collect = (value: any, depth = 0) => {
    if (!value || depth > 4) return;
    if (Array.isArray(value)) { value.slice(0, 100).forEach((v) => collect(v, depth + 1)); return; }
    if (typeof value !== 'object') return;
    const types = [value['@type']].flat();
    if (types.some((t) => t === 'Product' || t === 'ProductGroup')) result.push(value);
    if (value['@graph']) collect(value['@graph'], depth + 1);
    if (types.includes('WebPage') && value.mainEntity) collect(value.mainEntity, depth + 1);
  };
  $('script[type="application/ld+json"]').slice(0, 20).each((_, el) => {
    try { collect(JSON.parse($(el).text())); } catch { /* Invalid merchant schema is not evidence. */ }
  });
  return result;
}

/** A URL returned here occurs in the page itself. Network verification follows in the report. */
export function supplierCanonicalUrl(html: string, rawUrl: string): string | null {
  const url = supplierUrl(rawUrl);
  if (!url) return null;
  const $ = load(html);
  const canonical = $('link[rel="canonical"]').first().attr('href');
  return canonical ? pageUrl(canonical, url)?.href ?? null : withoutHash(url);
}

/** Read product/variant price and stock together; never borrow from recommendations. */
export function parseSupplierPage(html: string, rawUrl: string, checkedAt: number): BrewerProduct[] {
  const requested = supplierUrl(rawUrl);
  if (!requested) return [];
  const $ = load(html);
  const canonicalRaw = $('link[rel="canonical"]').first().attr('href');
  const canonical = canonicalRaw ? pageUrl(canonicalRaw, requested) : requested;
  if (!canonical || canonical.pathname === '/') return [];
  const schemas = schemaProducts($);
  $('script, style, nav, footer, aside, .tab-menu--cross-selling, .related-products-grid, .cross-sells, .up-sells').remove();
  const products: BrewerProduct[] = [];
  const visible = (node: ReturnType<typeof $>) => !node.closest('.hidden, .is--hidden, [hidden], [aria-hidden="true"], [style*="display: none"], [style*="display:none"]').length;
  const visibleText = (node: ReturnType<typeof $>) => compact(node.filter((_, el) => visible($(el))).map((_, el) => $(el).text()).get().join(' '));
  const add = (name: string, text: string, schema = '', extras: Partial<BrewerProduct> = {}) => {
    if (!compact(name)) return;
    const availability = stockStatus(text, schema);
    const textStatus = stockStatus(text);
    const packageLabel = extras.packageLabel || name.match(/\b\d+(?:[.,]\d+)?\s*(?:kg|g|gramm|kilo|ml|litres?|liter|l)\b/i)?.[0];
    products.push({
      name: compact(name).slice(0, 180), supplier: shops[host(canonical)], url: canonical.href,
      availability, availabilityText: compact(text).slice(0, 180) || (schema ? `Disponibilité publiée par le vendeur : ${schema.split('/').pop()}.` : 'Disponibilité non confirmée sur la page.'),
      checkedAt, verifiedBy: 'product-page', canonicalUrl: withoutHash(canonical),
      stockEvidence: textStatus !== 'unknown' ? 'visible-text' : availability !== 'unknown' ? 'structured-data' : 'none',
      ...(packageLabel ? { packageLabel: compact(packageLabel).slice(0, 100) } : {}), ...extras
    });
  };
  const details = (node: ReturnType<typeof $>) => {
    const price = visibleText(node.find('.product-price [itemprop="price"], .price--content, .ty-price, .price').first());
    const sku = compact(node.find('[itemprop="sku"]').first().text() || node.find('[itemprop="sku"]').first().attr('content') || '');
    return { ...(price ? { priceText: price.slice(0, 100) } : {}), ...(sku ? { sku: sku.slice(0, 100) } : {}) };
  };
  if (host(canonical) === 'brauundrauchshop.ch') {
    $('.product-variant-line').each((_, el) => {
      const variant = $(el);
      if (!visible(variant)) return;
      const status = variant.find('.availability .value').first();
      const href = variant.find('.variant-name a[href], a.variant-name[href]').first().attr('href');
      // Some shops expose all packs on one page: a real element ID opens the correct pack.
      const id = status.attr('id') || variant.attr('id');
      const linked = href ? pageUrl(href, canonical) : null;
      const variantUrl = linked && withoutHash(linked) === withoutHash(canonical) ? linked.href : id ? `${withoutHash(canonical)}#${encodeURIComponent(id)}` : undefined;
      const name = variant.find('.variant-name').first().text();
      const packageLabel = name.match(/\b\d+(?:[.,]\d+)?\s*(?:kg|g|gramm|kilo)\b/i)?.[0] || compact(variant.find('.variant-description').first().text());
      add(name, visibleText(status), '', { ...details(variant), ...(packageLabel ? { packageLabel: packageLabel.slice(0, 100) } : {}), ...(variantUrl ? { url: variantUrl } : {}) });
    });
    if (!products.length && $('.product-essential').length) {
      const main = $('.product-essential').first();
      add($('h1').first().text(), visibleText(main.find('.availability .value').first()), '', details(main));
    }
  } else if (host(canonical) === 'bierbrauzubehoer.ch' && $('.product--details').length) {
    const main = $('.product--details').first();
    const availability = main.find('.product--delivery').first();
    const unit = compact(main.find('.entry-attribute .entry--content, .price--unit').first().text());
    add(main.find('h1').first().text(), visibleText(main.find('.product--buybox .alert--content')) + ' ' + visibleText(availability), availability.find('[itemprop="availability"]').attr('href'), { ...details(main), ...(unit ? { packageLabel: unit.slice(0, 100) } : {}) });
  } else if (host(canonical) === 'sios.ch') {
    const main = $('[itemscope][itemtype$="schema.org/Product"]').filter((_, el) => $(el).find('h1').length > 0).first();
    if (main.length) {
      const availability = main.find('[itemprop="availability"]').first();
      add(main.find('h1').first().text(), visibleText(availability.parent().find('.status')), availability.attr('href') || availability.attr('content'), details(main));
    }
  } else if (host(canonical) === 'brewstore.ch' && $('.ty-product-block').length) {
    const main = $('.ty-product-block').first();
    add(main.find('h1').first().text() || $('h1').first().text(), visibleText(main.find('.ty-qty-in-stock, .ty-qty-out-of-stock')), '', details(main));
  }

  // Generic merchant JSON-LD is useful only when its identity matches this page's main heading.
  if (!products.length) {
    const heading = compact($('h1').first().text());
    const mainSchemas = schemas.filter((p) => normalizedName(string(p.name)) === normalizedName(heading) && heading);
    const main = mainSchemas.length === 1 ? mainSchemas[0] : null;
    if (main) {
      const declaredUrl = string(main.url);
      if (declaredUrl && !pageUrl(declaredUrl, canonical)) return [];
      const offers = [main.offers].flat().filter((v) => v && typeof v === 'object');
      const offer = offers.length === 1 && offers[0]['@type'] !== 'AggregateOffer' ? offers[0] : null;
      const price = offer && ['string', 'number'].includes(typeof offer.price) && /^[A-Z]{3}$/.test(string(offer.priceCurrency)) ? `${offer.priceCurrency} ${offer.price}`.slice(0, 100) : '';
      // A multi-offer page does not establish which variant is available.
      const productBody = $('main .product, main.product, .product-detail, .product-details, .single-product .summary').filter((_, el) => $(el).find('h1').length > 0).first();
      add(heading, visibleText(productBody.find('.stock, .availability, .alert--content')), offer ? string(offer.availability) : '', { ...(price ? { priceText: price } : {}), ...(string(main.sku) ? { sku: string(main.sku).slice(0, 100) } : {}) });
    }
  }
  // A product can have no JSON-LD: require its own heading, price and purchase form together.
  if (!products.length) {
    const main = $('main .product, main.product, .product-detail, .product-details, .single-product .summary').filter((_, el) => $(el).find('h1').length > 0).first();
    if (main.length && main.find('.price, [itemprop="price"]').length && main.find('form.cart, form[action*="cart"], button[name="add-to-cart"], .add-to-cart').length) {
      add(main.find('h1').first().text(), visibleText(main.find('.stock, .availability').first()), '', details(main));
    }
  }
  return products.sort((a, b) => Number(/25\s*(?:kg|kilo)/i.test(a.name)) - Number(/25\s*(?:kg|kilo)/i.test(b.name))).slice(0, 8);
}

/** Conservative robots matching, including wildcard/query rules and specific user-agent groups. */
export function supplierRobotsAllowed(text: string, rawUrl: string): boolean {
  const url = supplierUrl(rawUrl);
  if (!url) return false;
  type Group = { agents: string[]; rules: Array<{ allow: boolean; path: string }>; aiBlocked: boolean };
  const groups: Group[] = [];
  let group: Group | undefined;
  let hasDirectives = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    const at = line.indexOf(':');
    if (at < 0) continue;
    const key = line.slice(0, at).trim().toLowerCase(), value = line.slice(at + 1).trim();
    if (key === 'user-agent') {
      if (!group || hasDirectives) { group = { agents: [], rules: [], aiBlocked: false }; groups.push(group); hasDirectives = false; }
      group.agents.push(value.toLowerCase());
    } else if (group && (key === 'allow' || key === 'disallow')) {
      hasDirectives = true;
      if (value) group.rules.push({ allow: key === 'allow', path: value });
    } else if (group && key === 'content-signal') {
      hasDirectives = true;
      if (/\bai-input\s*=\s*no\b/i.test(value)) group.aiBlocked = true;
    }
  }
  const score = (g: Group) => Math.max(-1, ...g.agents.map((a) => a === '*' ? 0 : USER_AGENT.toLowerCase().includes(a) ? a.length : -1));
  const best = Math.max(-1, ...groups.map(score));
  const selected = groups.filter((g) => score(g) === best && best >= 0);
  if (selected.some((g) => g.aiBlocked)) return false;
  const path = url.pathname + url.search;
  const matches = selected.flatMap((g) => g.rules).filter((rule) => {
    const pattern = rule.path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$');
    try { return new RegExp('^' + pattern).test(path); } catch { return !rule.allow; }
  }).sort((a, b) => b.path.replace(/\*/g, '').length - a.path.replace(/\*/g, '').length || Number(b.allow) - Number(a.allow));
  return matches[0]?.allow ?? true;
}

export interface SupplierPageCheck {
  requestedUrl: string;
  resolvedUrl?: string;
  status: 'verified' | 'invalid_url' | 'robots_blocked' | 'unavailable' | 'not_product' | 'failed';
  detail?: string;
}
export interface SupplierVerificationReport { products: BrewerProduct[]; checks: SupplierPageCheck[] }

async function boundedBody(response: Response, limit: number): Promise<string | null> {
  if (Number(response.headers.get('content-length')) > limit) { await response.body?.cancel(); return null; }
  const reader = response.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > limit) { await reader.cancel(); return null; }
      chunks.push(part.value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks).toString('utf8');
}

/** No credentials, scripts, cart actions, captcha bypass or retries against a blocking seller. */
export async function verifySupplierPagesReport(sources: Array<{ title: string; url: string }>, signal: AbortSignal, fetchPage: typeof fetch = fetch): Promise<SupplierVerificationReport> {
  const candidates = [...new Set(sources.map((s) => s.url))].slice(0, 12);
  const robots = new Map<string, Promise<string | null>>();
  const localSignal = AbortSignal.any([signal, AbortSignal.timeout(15000)]);
  const headers = { Accept: 'text/html, text/plain;q=0.8', 'Cache-Control': 'no-cache', 'User-Agent': USER_AGENT };
  const robotsFor = (url: URL) => {
    if (!robots.has(url.origin)) robots.set(url.origin, (async () => {
      let target = new URL('/robots.txt', url);
      for (let hop = 0; hop < 3; hop++) {
        const r = await fetchPage(target, { signal: localSignal, redirect: 'manual', headers });
        if (r.status >= 300 && r.status < 400) {
          await r.body?.cancel();
          const location = r.headers.get('location');
          const next = location ? supplierUrl(new URL(location, target).href) : null;
          if (!next || host(next) !== host(url)) return null;
          target = next; continue;
        }
        if (r.status === 404 || r.status === 410) { await r.body?.cancel(); return ''; }
        if (!r.ok) { await r.body?.cancel(); return null; }
        const body = await boundedBody(r, 128000);
        return body !== null && !/^\s*(?:<!doctype|<html)/i.test(body) ? body : null;
      }
      return null;
    })().catch(() => null));
    return robots.get(url.origin)!;
  };
  const checkPage = async (raw: string): Promise<{ products: BrewerProduct[]; check: SupplierPageCheck }> => {
    const check: SupplierPageCheck = { requestedUrl: raw.slice(0, 2000), status: 'invalid_url' };
    const initial = supplierUrl(raw, true);
    if (!initial) return { products: [], check };
    let url: URL = initial;
    let canonicalFollowed = false;
    const visited = new Set<string>();
    for (let hop = 0; hop < 6; hop++) {
      if (visited.has(withoutHash(url))) break;
      visited.add(withoutHash(url));
      if (supplierUrl(url.href)) {
        const rules = await robotsFor(url);
        if (rules === null || !supplierRobotsAllowed(rules, url.href)) return { products: [], check: { ...check, resolvedUrl: url.href, status: 'robots_blocked', detail: rules === null ? 'Règles d’accès indisponibles.' : 'Lecture automatisée non autorisée.' } };
      }
      const response = await fetchPage(url, { signal: localSignal, redirect: 'manual', headers });
      if (response.status >= 300 && response.status < 400) {
        await response.body?.cancel();
        const location = response.headers.get('location');
        const next = location ? supplierUrl(new URL(location, url).href, true) : null;
        if (!next) return { products: [], check: { ...check, status: 'invalid_url', detail: 'Redirection hors des fournisseurs autorisés.' } };
        url = next; continue;
      }
      check.resolvedUrl = url.href;
      if (!response.ok || !supplierUrl(url.href) || !response.headers.get('content-type')?.includes('text/html')) {
        await response.body?.cancel();
        return { products: [], check: { ...check, status: 'unavailable', detail: `Page non lisible (HTTP ${response.status}).` } };
      }
      const html = await boundedBody(response, 1800000);
      if (html === null) return { products: [], check: { ...check, status: 'unavailable', detail: 'Page trop volumineuse.' } };
      const canonical = supplierCanonicalUrl(html, url.href);
      if (!canonical) return { products: [], check: { ...check, status: 'not_product', detail: 'Adresse canonique non fiable.' } };
      const products = parseSupplierPage(html, url.href, Date.now());
      if (!products.length) return { products: [], check: { ...check, status: 'not_product', detail: 'Aucune fiche produit principale identifiable.' } };
      if (!canonicalFollowed && withoutHash(new URL(canonical)) !== withoutHash(url)) {
        canonicalFollowed = true;
        url = new URL(canonical); continue;
      }
      // A second canonical change is ambiguous; do not publish an unvisited URL.
      if (withoutHash(new URL(canonical)) !== withoutHash(url)) return { products: [], check: { ...check, status: 'not_product', detail: 'Adresse canonique instable.' } };
      const safeProducts = products.filter((p) => withoutHash(new URL(p.url)) === withoutHash(url));
      return { products: safeProducts, check: { ...check, resolvedUrl: withoutHash(url), status: safeProducts.length ? 'verified' : 'not_product' } };
    }
    return { products: [], check: { ...check, status: 'unavailable', detail: 'Trop de redirections.' } };
  };
  const results = await Promise.allSettled(candidates.map(checkPage));
  const products = results.flatMap((r) => r.status === 'fulfilled' ? r.value.products : []);
  return {
    products: [...new Map(products.map((p) => [p.url + ':' + p.name, p])).values()].slice(0, 32),
    checks: results.map((r, i) => r.status === 'fulfilled' ? r.value.check : { requestedUrl: candidates[i].slice(0, 2000), status: 'failed', detail: signal.aborted ? 'Vérification annulée.' : 'Vérification interrompue ou serveur inaccessible.' })
  };
}
export async function verifySupplierPages(sources: Array<{ title: string; url: string }>, signal: AbortSignal, fetchPage: typeof fetch = fetch): Promise<BrewerProduct[]> {
  return (await verifySupplierPagesReport(sources, signal, fetchPage)).products;
}
