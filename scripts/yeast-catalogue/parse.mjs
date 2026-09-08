import { load, compact, plain, sha } from './fetch.mjs';
export const PARSER_VERSION = 'yeast-catalogue-2026-09-08.1';
const text = x => compact(x).replace(/\u200b|\u00ad/g, '');
const number = x => Number(x.replace(',', '.'));
const num = '(\\d+(?:[.,]\\d+)?)';
const dash = '\\s*(?:-|–|—|−|to|à)\\s*';
export function reportedRange(value, unit) {
  if (unit === '%') value = value.replace(/\s*ABV\s*$/i, '');
  const suffix = unit === '°C' ? '°?\\s*C' : unit === 'g/hL' ? 'g\\s*\\/\\s*h[lL]' : unit === '%' ? '%' : unit === 'h' ? '(?:h|hours?)' : '(?:d|days?|jours?)';
  // With two units on a line, only the explicitly requested unit is extracted.
  const lowUnit = unit === '°C' ? '\\s*(?:°\\s*C?|C)?' : `(?:\\s*${suffix})?`;
  const range = new RegExp(`${num}${lowUnit}${dash}${num}\\s*${suffix}`, 'i').exec(value)
    ?? (unit === '%' ? new RegExp(`^${num}\\s*%?${dash}${num}\\s*%?$`).exec(value) : null);
  if (range) {
    const min = number(range[1]), max = number(range[2]);
    if (min > max || min < 0 || max > (unit === '°C' ? 60 : unit === '%' ? 100 : 10000)) return null;
    return { range: { min, max }, unit, qualifier: min === max ? 'reportedPoint' : 'range' };
  }
  const point = new RegExp(`^\\s*(>|≥|<|≤|up to|at least)?\\s*${num}\\s*${suffix}\\s*$`, 'i').exec(value);
  if (point) {
    const n = number(point[2]); if (n > (unit === '°C' ? 60 : unit === '%' ? 100 : 10000)) return null;
    return { range: { min: n, max: n }, unit, qualifier: />|≥|at least/.test(point[1] ?? '') ? 'atLeast' : /<|≤|up to/.test(point[1] ?? '') ? 'upTo' : 'reportedPoint' };
  }
  return null;
}
const labels = [
  [/^(?:recommended |optimum |optimal |minimum |maximum |fermentation )?(?:temperature|temp\.?)(?: range)?$|^temperatura fermentacji$/i, 'temperature', '°C'],
  [/^(?:estimated |apparent )?attenuation$|^odfermentowanie$/i, 'attenuation', '%'],
  [/^(?:apparent )?(?:abv|alcohol)(?: tolerance)?$|^tolerancja alkoholu$/i, 'alcoholTolerance', '%'],
  [/^(?:recommended )?(?:pitch(?:ing)? rate|dosage)$/i, 'pitchRate', 'g/hL'],
  [/^flocculation$|^flocculation rate$|^flokulacja$/i, 'flocculation'],
  [/^(?:pof|phenolic|phenolic off.?flavou?r)$/i, 'pof'],
  [/^sta.?1(?: qc result)?$/i, 'sta1'],
  [/^diastatic$/i, 'diastatic'],
  [/^(?:beta|β).?lyase$/i, 'betaLyase'],
  [/^biotransformation$/i, 'biotransformation'],
  [/^species$|^yeast species$|^type$/i, 'species'],
  [/^strain type$/i, 'application'],
  [/^yeast strain$/i, 'species'],
  [/^(?:flavou?r(?:\/aroma)?|aroma)(?: profile)?$|^descriptors$/i, 'aroma'],
  [/^total esters$|^esters$/i, 'esters'],
  [/^total sup.alcohols$|^higher alcohols$/i, 'higherAlcohols'],
  [/^h.?s(?: production| \(sulphur notes\))?$|^hydrogen sulfide$/i, 'h2s'],
  [/^(?:suitable |suggested )?beer (?:types|styles)$|^styles$/i, 'styles'],
  [/^application$|^used in$/i, 'application'],
  [/^form$/i, 'form'],
  [/^availability$/i, 'availability'],
  [/^nutritional needs$|^nitrogen requirements?$/i, 'nutrientNeed'],
  [/^ph(?: range)?$/i, 'ph'],
  [/^residual sugar(?:s)?$/i, 'residualSugar'],
  [/^fermentation rate$|^rate of fermentation$|^fermentation speed$/i, 'fermentationRate'],
  [/^foam(?:ing| production)?$/i, 'foam'],
  [/^so2(?: production)?$/i, 'so2'],
  [/^volatile acidity$|^volatile acid production$/i, 'volatileAcidity'],
  [/^glycerol(?: production)?$/i, 'glycerol'],
  [/^mlf compatibility$/i, 'malolacticCompatibility'],
];
export function observation(label, reported, source, context) {
  label = text(plain(label)).replace(/[?:]+$/, '').trim(); reported = text(plain(reported));
  const mapping = labels.find(([r]) => r.test(label));
  if (!mapping || !reported || reported.length > 500 || /^(?:n\/?a|unknown|not available|-)$/i.test(reported)) return null;
  return { key: mapping[1], label, reported, source, ...(mapping[2] ? reportedRange(reported, mapping[2]) : {}), ...(context ? { context } : {}) };
}
export function classify(config, p) {
  const raw = p.inventory ?? {}, name = p.name ?? '', tags = (raw.tags ?? []).map(x => typeof x === 'string' ? x : x.name), categories = (raw.categories ?? []).map(x => x.name);
  const hay = [name, raw.product_type, ...tags, ...categories].join(' ');
  if (config.id === 'omega') return /Brewing Yeast/.test(raw.product_type ?? '');
  if (config.id === 'mangrove-jacks') return (/Craft Series Yeasts/.test(raw.product_type ?? '') || /yeast/i.test(name)) && !['beer-yeast-nutrient', 'cider-yeast-nutrient', 'wine-yeast-nutrient', 'mead-yeast-nutrient'].includes(raw.handle) && !/starter kit|homebrew.*kit/i.test(name);
  if (config.id === 'cellarscience') return /yeast/i.test(name) && !/FERMFED|FERMSTART|yeast nutrient|nutrient blend/i.test(name);
  if (config.id === 'whc') return /yeast|boulardii|bacteria|lactobacillus|^Big Apple|^Surge Seltzer/i.test(hay) && !/nutrient|nitro yeast|yeast extract|protein|fib(?:re|er)|peptone/i.test(name) && raw.product_type !== 'Enzymes';
  if (config.id === 'escarpment') return (/yeast/i.test(raw.product_type ?? '') || /pitch-\d|Collection_|qps-|^Yorkshire Ale|\[HB\]/i.test(hay)) && !/nutrient|yeast extract|Nutrient|Liquid Lallemand Bundle/i.test(name);
  if (config.id === 'bootleg') return categories.some(c => /cultures|bacteria|commercial yeast/i.test(c)) && !/bundle|combo|collecting|capture kit|gel pack/i.test(name);
  if (config.id === 'bsi') return categories.some(c => c !== 'Brewing Products');
  if (config.id === 'pinnacle') return !/zinc enriched/i.test(name);
  return true;
}
function pairsFromHtml(html) {
  const $ = load(html || ''), pairs = [];
  $('br').replaceWith('\n');
  $('li,p').each((_i, e) => { for (const line of $(e).text().split('\n')) { const s = text(line), m = /^([^:]{2,55}):\s*(.{1,500})$/.exec(s); if (m) pairs.push([m[1], m[2]]); } });
  $('tr').each((_i, e) => { const cells = $(e).children('td,th').map((_j, c) => text($(c).text())).get(); if (cells.length === 2) pairs.push(cells); });
  $('dt').each((_i,e)=>pairs.push([text($(e).text()),text($(e).next('dd').text())]));
  return pairs;
}
export function parseProduct(config, p, html = '') {
  const raw = p.inventory ?? {}, $ = load(html), facts = [], pairs = [];
  const source = { title: p.name || text($('h1').first().text()) || 'Fiche de culture', author: config.name, year: null, kind: 'manufacturer', reference: p.url };
  const add = (label, value, context) => { const f = observation(label, value, source, context); if (f) facts.push(f); };
  const ownHtml = raw.body_html ?? raw.description ?? '';
  let sensoryText = plain(ownHtml);
  const documentary = load(ownHtml);
  pairs.push(...pairsFromHtml(ownHtml), ...pairsFromHtml(raw.short_description ?? ''));
  for (const a of raw.attributes ?? []) pairs.push([a.name, (a.terms ?? []).map(t => t.name).join(', ')]);
  let name = p.name || text($('h1').first().text()), code = raw.sku || null;
  let categories = [...(raw.categories ?? []).map(c => c.name), ...((raw.tags ?? []).filter(t => typeof t === 'string' && !t.startsWith('__') && !/^qps-|pitch-|shipping|hide-|__/.test(t)))];
  if (config.id === 'imperial') {
    const d = JSON.parse($('#__NEXT_DATA__').text()).props.pageProps.data;
    sensoryText=plain(d.description ?? '');
    name = `${d.code} ${d.title}`; code = d.code; categories = [d.strain_category?.title].filter(Boolean);
    pairs.push(['Attenuation', d.attenuation && d.attenuation + '%'], ['ABV', d.alcohol_tolerance && d.alcohol_tolerance + '%'], ['Flocculation', d.flocculation], ['Diastatic', d.diastatic], ['POF', d.phenolic_off_flavor], ['Descriptors', d.descriptors?.join(', ')], ['Styles', d.suggested_beer_styles?.map(s => s.suggested_beer_styles_id.title).join(', ')]);
    if (d.low_temperature != null && d.high_temperature != null && /^\d+(\.\d+)?$/.test(String(d.low_temperature)) && /^\d+(\.\d+)?$/.test(String(d.high_temperature))) {
      const min = Math.round((Number(d.low_temperature) - 32) * 5 / 9 * 10) / 10, max = Math.round((Number(d.high_temperature) - 32) * 5 / 9 * 10) / 10;
      if (min >= 0 && min <= max && max <= 60) facts.push({ key: 'temperature', label: 'Fermentation temperature', reported: `${d.low_temperature}–${d.high_temperature} °F`, source, range: { min, max }, unit: '°C', qualifier: min === max ? 'reportedPoint' : 'range', context: 'Conversion exacte Fahrenheit → Celsius, arrondie au dixième.' });
    }
  } else if (config.id === 'white-labs') {
    $('.single-product-content__description .col-md-2').each((_i, e) => pairs.push([$(e).find('h2.table-title').text(), $(e).find('p').text()]));
    code = name?.match(/WLP\d+[A-Z]*/i)?.[0] ?? null;
    categories = $('.single-product-content__badge img.classYeast[alt]').map((_i,e) => $(e).attr('alt')).get();
    sensoryText = text($('body').text()).split('Description')[1]?.split('Pitch Rate Calculator')[0] ?? '';
    $('.single-product-content__description').find('li').each((_i,e) => { const s = text($(e).text()); if (s.length < 80 && s) add('Styles', s); });
  } else if (config.id === 'wyeast') {
    const tabs=$('.tabs-nav .tab-nav-item span').map((_i,e)=>text($(e).text())).get();
    $('.tabs-content .tab-content').each((i,tab)=>$(tab).find('ul.features > li').each((_j,e)=>add($(e).find('h6').text(),$(e).find('span').text(),tabs[i]||'Fiche fabricant')));
    const body = text($('body').text()); code = body.match(/Strain:\s*([\w-]+)/)?.[1] ?? null;
    sensoryText=body.split('Profile:')[1]?.split('Used in:')[0] ?? '';
    name = text($('h3.subheadline').first().text()) || name;
    const species = body.match(/Species:\s*([^:]{1,140}?)\s*Profile:/)?.[1]; if (species) pairs.push(['Species', species]);
    if (code && !name?.includes(code)) name = `${code} ${name}`;
  } else if (config.id === 'escarpment') {
    $('.KeyItem').each((_i,e) => pairs.push([$(e).find('span').first().clone().find('label').remove().end().text(), $(e).find('p').first().text()]));
  } else if (config.id === 'yeastflow') {
    $('.uncode-pricing-heading').each((_i,e) => {
      const label = text($(e).find('.uncode-pricing-entry-label').text()), value = text($(e).find('.uncode-pricing-entry-value').text());
      if (/Temp\.opt/.test(label)) pairs.push(['Optimal temperature', value + ' °C']);
      else if (label === 'ABV' || label === 'Attenuation') pairs.push([label, value + '%']);
      else if (label === 'Flocculant') pairs.push(['Flocculation', value]);
    });
  } else if (config.id === 'kveik-yeastery') {
    $('.data-item').each((_i,e) => pairs.push([$(e).find('.meta-label').text(), $(e).find('.meta-value').text()]));
    $('.hero-grid-item').each((_i,e) => pairs.push([$(e).find('h4').text(), $(e).find('.meta-value').text()]));
  } else if (config.id === 'pinnacle') {
    documentary('.product-details-block .details').each((_i,e)=>pairs.push([documentary(e).find('h6').text().replace(/\*/g,''),documentary(e).find('p').text()]));
    p.extraDocuments=documentary('a[href$=".pdf"]').map((_i,e)=>({url:documentary(e).attr('href'),title:'Fiche produit Pinnacle'})).get();
  } else if (config.id === 'fermentis') {
    const graphs = $('script[type="application/ld+json"]').map((_i,e) => { try { return JSON.parse($(e).text())['@graph'] ?? []; } catch { return []; } }).get().flat();
    categories = graphs.filter(x => x['@type'] === 'BreadcrumbList').flatMap(x => x.itemListElement ?? []).map(x => x.item?.name ?? x.name).filter(Boolean);
    $('.col-inner').each((_i,e) => { const heading = text($(e).children('p').find('strong').first().text()), value = text($(e).children('.banner').find('.text-inner').text()); if (heading && value) pairs.push([heading, value]); });
    $('h3,h4,h5').each((_i,e) => { if (/^Dosage\s*\/?\s*Temperature$/i.test(text($(e).text()))) { const value = text($(e).next('p').text()); add('Temperature', value); add('Dosage', value); } });
    const ingredient = $('p').map((_i,e) => text($(e).text())).get().find(s => /^Ingredients:/i.test(s));
    if (ingredient) { const pof = ingredient.match(/POF\s*([+-])/i); if (pof) pairs.push(['POF', pof[1] === '+' ? 'positive' : 'negative']); const species = ingredient.match(/(?:Saccharomyces|Lachancea|Metschnikowia|Torulaspora)\s+[a-z]+/g); if (species) pairs.push(['Species', [...new Set(species)].join(', ')]); }
  } else if (config.type === 'lallemand-shop') {
    const data = JSON.parse($('#initialReduxState').text()).page.product;
    pairs.push(...(data.specifications ?? []).map(f => [f.name, f.value]));
    p.extraDocuments = (data.attachments ?? []).map(d => ({ url: d.url, title: d.title ?? d.name ?? 'Fiche technique' }));
    const title = name?.replace(/\s*\([^)]*(?:\d+g|Box)[^)]*\)|\s*11g Sachet.*$/ig, '').trim(); if (title) name = title;
  } else if (config.type === 'lallemand') {
    pairs.push(...pairsFromHtml((p.detail?.information ?? []).map(i => i.text ?? '').join('\n')));
    const focus = plain(p.detail?.information?.find(i => i.slug === 'features-focus')?.text ?? '');
    const temp = focus.match(/Temp\.\s*range\s*(\d+\s*°?C\s*[–-]\s*\d+\s*°?C)/i); if (temp) pairs.push(['Temperature', temp[1]]);
    categories.push(...(p.markets ?? []).map(m => 'Marché : ' + m));
    p.extraDocuments = (p.detail?.documents ?? []).map(d => ({ url: d.file, title: d.text ?? 'Fiche technique' }));
  }
  // General product specification tables; never include nav, reviews or related products.
  if (!['white-labs', 'wyeast', 'imperial', 'fermentis', 'escarpment'].includes(config.id) && !config.type?.startsWith('lallemand')) {
    const main = (['aeb','weihenstephan'].includes(config.id) ? $('body') : $('main, article, .product-description, .summary').first()).clone(); main.find('script,style,nav,footer,.related,.reviews').remove();
    pairs.push(...pairsFromHtml(main.html() ?? ''));
  }
  for (const [label, value] of pairs) if (value != null) add(label, value);
  if(!facts.some(f=>f.key==='aroma')){
    const sentence=sensoryText.split(/(?<=[.!?])\s+/).find(s=>/banana|clove|thiol|phenol|ester|tropical|citrus|floral|spic[ey]|sulfur|diacetyl/i.test(s)&&s.split(/\s+/).length<=25&&s.length<=260);
    if(sentence)add('Flavour Profile',sentence,'Description qualitative du fabricant ; intensité non mesurée dans ce catalogue.');
  }
  for (const f of facts.filter(f=>f.key==='temperature'&&f.range)) {
    const fahrenheit=new RegExp(`${num}\\s*°?${dash}${num}\\s*°?\\s*F`,'i').exec(f.reported);
    if(fahrenheit&&Math.max(Math.abs((number(fahrenheit[1])-32)*5/9-f.range.min),Math.abs((number(fahrenheit[2])-32)*5/9-f.range.max))>1){
      delete f.range;delete f.unit;delete f.qualifier;f.context='Unités Celsius/Fahrenheit contradictoires dans la source ; plage numérique non utilisée.';
    }
  }
  const minima=facts.filter(f=>f.key==='temperature'&&/^Minimum /i.test(f.label)&&f.range&&f.unit==='°C');
  for(const low of minima){const high=facts.find(f=>f.key==='temperature'&&/^Maximum /i.test(f.label)&&f.range&&f.unit==='°C'&&f.source.reference===low.source.reference&&f.context===low.context);
    if(high&&low.range.min<=high.range.max){facts.splice(facts.indexOf(low),1);facts.splice(facts.indexOf(high),1);facts.push({...low,label:'Temperature range',reported:`Minimum ${low.reported} ; maximum ${high.reported}`,range:{min:low.range.min,max:high.range.max},qualifier:'range'});}
  }
  if (config.id === 'escarpment') facts.filter(f => f.key === 'biotransformation').forEach(f => { f.context = 'Indice fabricant de conversion géraniol → β-citronellol ; ne mesure pas la libération des thiols.'; });
  const documents = [...(p.extraDocuments ?? []), ...(raw.documents ?? []).filter(d => /technical|data|fiche/i.test(d.label ?? '')).map(d => ({ title: d.label, url: d.link })), ...$('a[href]').filter((_i,e) => /\.pdf(?:\?|$)/i.test($(e).attr('href')) || $(e).closest('.language-flags').length > 0).map((_i,e) => ({ title: text($(e).text()) || 'Document technique', url: $(e).attr('href') })).get()].flatMap(d => { try { const url = new URL(d.url, p.url).href; return /^https?:/.test(url) ? [{ title: d.title.slice(0,200), url }] : []; } catch { return []; } });
  if (!code && raw.variants) code = raw.variants.map(v => v.sku).find(Boolean) ?? null;
  const formText = [raw.product_type, ...categories.filter(c=>/^(?:dryyeast|dehydrated brewing yeast|dry brewing yeast|liquid strains)$/i.test(c)), ...facts.filter(f=>f.key==='form').map(f=>f.reported)].join(' ');
  const dryTitle = /\b(?:dry (?:beer |brewing |wine |ale |distillers? )?yeast|dried yeast|dehydrated yeast)\b/i.test(name);
  const form = dryTitle || /dryyeast|\bdried\b|\bsèche\b|dehydrated|dry brewing yeast|dry multi-strain/i.test(formText) ? 'sèche' : /\bliquid\b|\bliquide\b/i.test(formText+' '+name) ? 'liquide' : undefined;
  const uniqueFacts = [...new Map(facts.map(f => [JSON.stringify([f.key, f.reported, f.context]), f])).values()];
  return { name: name || p.url.split('/').filter(Boolean).at(-1), code, form, categories: [...new Set(categories.filter(Boolean))], facts: uniqueFacts, source, documents: [...new Map(documents.map(d => [d.url, d])).values()] };
}
export function catalogueHash(catalogue) {
  const { contentSha256: _hash, retrievals: _retrievals, pageUpdatedAt: _updated, publishedAt: _published, ...facts } = catalogue;
  return sha(JSON.stringify(facts,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.keys(item).sort().map(k=>[k,item[k]])):item));
}
