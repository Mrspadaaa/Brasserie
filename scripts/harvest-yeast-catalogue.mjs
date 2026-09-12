// Public manufacturer inventories only. Cache raw pages locally; publish short facts separately.
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { get, links, load, plain } from './yeast-catalogue/fetch.mjs';
const out = resolve('.codex-remote-attachments/yeast-catalogue/inventories');
await mkdir(out, { recursive: true });
const selected = process.argv.find(a => a.startsWith('--sources='))?.slice(10).split(',');
const sources = [
  { id: 'omega', name: 'Omega Yeast', site: 'https://omegayeast.com', type: 'shopify' },
  { id: 'escarpment', name: 'Escarpment Labs', site: 'https://escarpmentlabs.com', type: 'shopify' },
  { id: 'whc', name: 'WHC Lab', site: 'https://www.whclab.com', type: 'shopify' },
  { id: 'mangrove-jacks', name: 'Mangrove Jack’s', site: 'https://mangrovejacks.com', type: 'shopify' },
  { id: 'cellarscience', name: 'CellarScience', site: 'https://cellarscience.com', type: 'shopify' },
  { id: 'bootleg', name: 'Bootleg Biology', site: 'https://bootlegbiology.com', type: 'woocommerce' },
  { id: 'bsi', name: 'Brewing Science Institute', site: 'https://brewingscience.com', type: 'woocommerce' },
  { id: 'imperial', name: 'Imperial Yeast', index: ['https://www.imperialyeast.com/yeast-strains'], type: 'imperial' },
  { id: 'wyeast', name: 'Wyeast', index: ['https://wyeastlab.com/yeast-cultures/'], pattern: /\/product\//, delay: 10100 },
  { id: 'white-labs', name: 'White Labs', index: ['https://www.whitelabs.com/sitemap-1.xml'], type: 'xml', pattern: /yeast-single\?.*type=YEAST/ },
  { id: 'fermentis', name: 'Fermentis', index: ['https://fermentis.com/product-sitemap.xml'], type: 'xml', pattern: /\/en\/product\// },
  { id: 'aeb', name: 'AEB', index: ['https://www.aeb-group.com/en/beer/biotechnology/yeasts', 'https://www.aeb-group.com/en/oenology/biotechnology/yeasts', 'https://www.aeb-group.com/en/spirits/biotechnology/active-dry-yeasts'], pattern: /\/en\/[^/]+-\d+$/ },
  { id: 'yeastflow', name: 'Yeastflow', index: ['https://yeastflow.com/our-strains/'], pattern: /\/our-strains\/yf-/ },
  { id: 'fermentum-mobile', name: 'Fermentum Mobile', index: ['https://fermentum-mobile.pl/oferta/lista-szczepow/', 'https://fermentum-mobile.pl/oferta/edycja-specjalna/'], pattern: /\/(?:portfolio-item|oferta-fermentum-mobile)\//i },
  { id: 'weihenstephan', name: 'Hefebank Weihenstephan', index: ['https://www.hefebank-weihenstephan.de/en/products/'], pattern: /\/en\/products\/(yeast|bacteria)\/.+\/.+/ },
  { id: 'kveik-yeastery', name: 'Kveik Yeastery', index: ['https://www.kveikyeastery.com/yeasts'], pattern: /\/yeast-strains\// },
  { id: 'yeast-bay', name: 'The Yeast Bay', index: ['https://www.theyeastbay.com/our-cultures', 'https://www.theyeastbay.com/mixed-culture', 'https://www.theyeastbay.com/wild-capture-yeast'], pattern: /\/brewers-yeast\/|\/mixed-culture\/|\/wild-capture-yeast\// },
  { id: 'pinnacle', name: 'AB Biotek / Pinnacle', index: ['https://www.pinnaclebrewingingredients.com/en/portfolio'], type: 'pinnacle' },
  { id: 'brewferm', name: 'Brewferm / Brouwland', index: ['https://brouwland.com/en/brand/196-brewferm?q=Category-Yeast+and+bacteria'], pattern: /\/en\/yeast-and-bacteria\/\d+.*brewferm.*\.html$/ },
];
async function harvest(config) {
  const report = { ...config, pattern: config.pattern?.source, startedAt: new Date().toISOString(), inventoryReceipts: [], products: [], excluded: [], errors: [] };
  const save = () => writeFile(resolve(out, config.id + '.json'), JSON.stringify(report, null, 2));
  const pending = [];
  try {
    if (['shopify', 'woocommerce'].includes(config.type)) {
      for (let page = 1; page <= 30; page++) {
        const url = config.type === 'shopify' ? `${config.site}/products.json?limit=250&page=${page}` : `${config.site}/wp-json/wc/store/v1/products?per_page=100&page=${page}`;
        const r = await get(url); report.inventoryReceipts.push(r.receipt);
        const raw = JSON.parse(r.body), rows = raw.products ?? raw;
        if (!Array.isArray(rows)) throw Error('Inventory is not an array');
        if (!rows.length) break;
        for (const p of rows) {
          const url = p.permalink ?? `${config.site}/products/${p.handle}`;
          pending.push({ url, inventory: p, inventoryUrl: r.receipt.url, name: plain(p.title ?? p.name) });
        }
        if (rows.length < (config.type === 'shopify' ? 250 : 100)) break;
        if (page === 30) throw Error('Pagination bound reached; coverage incomplete');
      }
    } else for (const url of config.index) {
      const r = await get(url, config); report.inventoryReceipts.push(r.receipt);
      let urls;
      if (config.type === 'pinnacle') {
        const $=load(r.body);
        $('.product').each((_i,e)=>{const name=plain($(e).children('h3').first().text()), id=$(e).find('[data-productid]').attr('data-productid');if(name&&id)pending.push({url:url+'#product-'+id,name,inventoryUrl:url,inventory:{id,body_html:$.html(e)},receipt:r.receipt});});
        continue;
      }
      if (config.type === 'imperial') {
        const data = JSON.parse(load(r.body)('#__NEXT_DATA__').text()).props.pageProps.data;
        for (const p of data) pending.push({ url: `https://www.imperialyeast.com/yeast-strains/${p.slug}`, name: `${p.code} ${p.title}`, inventory: p, inventoryUrl: url });
        continue;
      }
      if (config.id === 'aeb') {
        const $ = load(r.body);
        urls = [...new Set($('a.prod_listing_info_section_inner.gtmProdCta[href]').map((_i,e) => new URL($(e).attr('href'), url).href.match(/^https:\/\/www\.aeb-group\.com\/en\/[^/?]+-\d+/)?.[0]).get().filter(Boolean))];
      } else if (config.type === 'xml') urls = load(r.body, { xmlMode: true })('loc').map((_i, e) => load(r.body, { xmlMode: true })(e).text()).get().filter(u => config.pattern.test(u));
      else urls = links(r.body, url, u => config.pattern.test(u));
      for (let productUrl of urls) {
        if(config.id==='fermentum-mobile'){const u=new URL(productUrl);u.pathname=decodeURIComponent(u.pathname).replace(/[\s\u200e\u200f]/g,'').replace(/\/{2,}/g,'/');productUrl=u.href;}
        pending.push({ url: productUrl, inventoryUrl: url });
      }
    }
    // Include every product candidate. Classification is a separate, auditable step.
    const unique = [...new Map(pending.map(p => [p.url, p])).values()];
    report.discovered = unique.length;
    report.products = unique;
    await save(); console.log(`${config.id}: ${unique.length} candidates`);
    let blocked = false, completed = 0;
    for (const p of unique) {
      if(p.receipt)continue;
      if (process.argv.includes('--inventory-only')) continue;
      if (blocked) { p.error = 'Detail deferred after access restriction; inventory retained'; continue; }
      try { const r = await get(p.url, config); p.receipt = r.receipt; p.name ||= plain(load(r.body)('h1').first().text()) || p.url.split('/').filter(Boolean).at(-1); }
      catch (e) { p.error = String(e.message); report.errors.push({ url: p.url, error: p.error, retryAfter: e.retryAfter ?? null }); if ([403, 429].includes(e.status)) blocked = true; }
      completed++;
      if (completed % 25 === 0) { await save(); console.log(`${config.id}: ${completed}/${unique.length}`); }
    }
  } catch (e) { report.errors.push({ error: String(e.message) }); }
  report.finishedAt = new Date().toISOString(); await save();
  console.log(`${config.id}: done ${report.products.length}, ${report.errors.length} errors`);
}
const queue = sources.filter(s => !selected || selected.includes(s.id));
await Promise.all(Array.from({ length: 3 }, async () => { while (queue.length) await harvest(queue.shift()); }));
