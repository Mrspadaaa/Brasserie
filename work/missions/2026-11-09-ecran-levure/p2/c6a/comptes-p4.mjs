// Axes (s7) et combinaisons (c6) sur les fiches bière. Lecture seule.
import { readFileSync } from 'node:fs';
const racine = process.argv[2];
const cat = JSON.parse(readFileSync(racine + '/src/data/yeastCatalogueBootstrap.json', 'utf8'));
const sup = JSON.parse(readFileSync(racine + '/src/data/yeastSupplyBootstrap.json', 'utf8'));
const prod = Object.fromEntries(sup.products.map((p) => [p.id, p.referenceId]));
const offre = {};
for (const o of sup.offers) if (['CH', 'FR', 'DE'].includes(o.sellerCountry)) (offre[prod[o.productId]] ||= new Set()).add(o.sellerCountry);
const eu = new Set(['Fermentis', 'Lallemand Brewing', 'Hefebank Weihenstephan', 'Doemens', 'VLB Berlin', 'WHC Lab', 'Fermentum Mobile', 'Brewferm / Brouwland', 'Mangrove Jack’s']);
const fait = (y, k) => (y.catalogue?.facts ?? []).find((f) => f.key === k);
const txt = (y) => [y.name, y.catalogue?.manufacturer, ...(y.catalogue?.categories ?? []),
  ...(y.catalogue?.facts ?? []).filter((f) => ['aroma', 'species', 'application', 'styles', 'form'].includes(f.key)).map((f) => f.reported)].join(' ').toLowerCase();
const rng = (f) => {
  if (!f) return null;
  if (f.range && f.range.min != null) return [f.range.min, f.range.max ?? f.range.min];
  const m = String(f.reported).match(/(\d+(?:[.,]\d+)?)\s*%?\s*(?:[-–à]|to)\s*(\d+(?:[.,]\d+)?)/);
  if (m) return [parseFloat(m[1].replace(',', '.')), parseFloat(m[2].replace(',', '.'))];
  const s = String(f.reported).match(/(\d+(?:[.,]\d+)?)/);
  if (s) { const v = parseFloat(s[1].replace(',', '.')); return [v, v]; }
  return null;
};
const niv = (f) => {
  if (!f) return null;
  const r = String(f.reported).toLowerCase();
  if (/no info|varies|very low - high|low - high/.test(r)) return null;
  if (/very high|très/.test(r)) return 4;
  if (/high|élev|haut|fast|rapide|strong/.test(r)) return 3;
  if (/medium|moder|moyen|normal/.test(r)) return 2;
  if (/very low/.test(r)) return 0;
  if (/low|faible|slow|lent|niska/.test(r)) return 1;
  return null;
};
const nonBiere = (y) => {
  const m = y.catalogue?.manufacturer; const n = y.name;
  if (['Lallemand Wine', 'AB Biotek / Maurivin', 'AEB', 'Lallemand Distilling', 'AB Biotek / Pinnacle'].includes(m)) return true;
  if (/Œno|Spirit|Cider|Mead|Coffee|Kvas|Sorghum|Teq|wine|saké|sake\b|malolactic|sparkling|cidre|hydromel|fortified|^4[0-9]{3}\b/i.test(n.replace(/^Wyeast · /, ''))) return true;
  return false;
};
const boisson = (y) => {
  const m = y.catalogue?.manufacturer; const n = y.name;
  if (!nonBiere(y)) return 'biere';
  if (/Distill|Pinnacle/.test(m) || /Spirit|whisk|rum/i.test(n)) return 'distillerie';
  if (/Cider|Mead|cidre|hydromel/i.test(n)) return 'cidre';
  if (/Coffee|Kvas|Sorghum|Teq/i.test(n)) return 'autre';
  return 'vin';
};
const bz = {}; for (const y of cat) bz[boisson(y)] = (bz[boisson(y)] || 0) + 1; console.log('BOISSON', bz);
const biere = cat.filter((y) => !nonBiere(y));
{
  const fine = (y) => { const t = txt(y);
    if (/brett/.test(t)) return 'brett'; if (/lacto|pedio|bacter/.test(t)) return 'bacteries'; if (/kveik|kviek|voss|hornindal/.test(t)) return 'kveik';
    if (/blend|mélange/.test(t)) return 'melange'; if (/pastorianus|lager|pils/.test(t)) return 'lager'; if (/saison|farmhouse/.test(t)) return 'saison';
    if (/weizen|hefe|wheat|\bwit\b|blanche/.test(t)) return 'ble'; if (/belg|abbey|abbaye|trappist|tripel/.test(t)) return 'belge';
    if (/english|british|london|irish|scottish|bitter|\besb\b/.test(t)) return 'anglaise'; return 'ale'; };
  const z = {}; for (const y of biere) z[fine(y)] = (z[fine(y)] || 0) + 1; console.log('FAMILLE', z);
  const fl = {}; for (const y of biere) { const v = niv(fait(y, 'flocculation')); fl[v ?? 'nd'] = (fl[v ?? 'nd'] || 0) + 1; } console.log('FLOC', fl);
  const fo = {}; for (const y of biere) { const v = /sèche/.test(y.form || '') ? 'seche' : /liquide/.test(y.form || '') ? 'liquide' : 'nd'; fo[v] = (fo[v] || 0) + 1; } console.log('FORME', fo);
  const tb = { '<8': 0, '8-10': 0, '10-12': 0, '>=12': 0, nd: 0 };
  for (const y of biere) { const r = rng(fait(y, 'alcoholTolerance')); const v = r && r[1] <= 25 && r[1] >= 3 ? r[1] : null; if (v == null) tb.nd++; else if (v < 8) tb['<8']++; else if (v < 10) tb['8-10']++; else if (v < 12) tb['10-12']++; else tb['>=12']++; } console.log('TOL', tb);
  let t19 = 0, tnd = 0; for (const y of biere) { const r = rng(fait(y, 'temperature')); if (!r || r[1] > 45) tnd++; else if (r[0] <= 19 && r[1] >= 19) t19++; } console.log('T19', t19, 'nd', tnd);
  let a = 0, and = 0; for (const y of biere) { const r = rng(fait(y, 'attenuation')); if (!r || r[1] > 100) and++; else if (r[1] >= 75 && r[0] <= 82) a++; } console.log('ATT 75-82', a, 'nd', and);
  const mots = (re) => biere.filter((y) => re.test(txt(y))).length;
  console.log('MOTS banane', mots(/banan/), 'girofle', mots(/clove|girofle/), 'neutre', mots(/neutral|clean|neutre/), 'fruité', mots(/fruit/), 'tropical', mots(/tropic/));
  const sp = {}; for (const y of biere) { const v = niv(fait(y, 'fermentationRate')); sp[v ?? 'nd'] = (sp[v ?? 'nd'] || 0) + 1; } console.log('VITESSE', sp);
  console.log('SANS ALCOOL', biere.filter((y) => /maltose[- ]?neg|non[- ]alcoh|alcohol[- ]free|low[- ]alcohol|\bna\b|lona|zero hero|ne consomme ni maltose/i.test(txt(y))).length);
  console.log('RONDEUR glycérol', biere.filter((y) => fait(y, 'glycerol')).length, 'sucres', biere.filter((y) => fait(y, 'residualSugar')).length);
  console.log('SOUFRE', biere.filter((y) => fait(y, 'h2s') || fait(y, 'so2')).length, 'NUTR', biere.filter((y) => fait(y, 'nutrientNeed')).length);
  const fabs = {}; for (const y of biere) fabs[y.catalogue?.manufacturer] = (fabs[y.catalogue?.manufacturer] || 0) + 1; console.log('LABOS', fabs);
}
const dispo = (y) => (offre[y.id] ? 'ici' : eu.has(y.catalogue?.manufacturer) ? 'europe' : 'rare');
const sta = (y) => {
  const s = [fait(y, 'sta1'), fait(y, 'diastatic')].filter(Boolean).map((f) => String(f.reported).toLowerCase()).join(' ');
  if (!s) return /diastaticus/.test(txt(y)) ? 'pos' : null;
  if (/non-diastatic|negative|^no\b/.test(s)) return 'neg';
  return 'pos';
};
const pof = (y) => {
  const f = fait(y, 'pof'); if (!f) return null;
  const r = String(f.reported).toLowerCase().trim(); if (/^[–−-]$/.test(r)) return 0; if (r === "+") return 1;
  if (/non|^no\b|negative|neg/.test(r)) return 0; if (/yes|posit|phenolic/.test(r)) return 1; return null;
};
const axes = {
  esters: (y) => niv(fait(y, 'esters')),
  phenols: pof,
  biotransfo: (y) => niv(fait(y, 'biotransformation')),
  attenuation: (y) => { const r = rng(fait(y, 'attenuation')); return r && r[1] <= 100 && r[0] >= 40 ? (r[0] + r[1]) / 2 : null; },
  glycerol: (y) => niv(fait(y, 'glycerol')),
  sucresRes: (y) => (fait(y, 'residualSugar') ? 1 : null),
  floculation: (y) => niv(fait(y, 'flocculation')),
  tolerance: (y) => { const r = rng(fait(y, 'alcoholTolerance')); return r && r[1] <= 25 && r[1] >= 3 ? r[1] : null; },
  soufre: (y) => niv(fait(y, 'h2s')) ?? niv(fait(y, 'so2')),
  vitesse: (y) => niv(fait(y, 'fermentationRate')),
  nutriments: (y) => niv(fait(y, 'nutrientNeed')),
  temperature: (y) => { const r = rng(fait(y, 'temperature')); return r && r[1] < 45 ? (r[0] + r[1]) / 2 : null; },
};
const us05 = cat.find((y) => y.id === 'fermentis-us05');
console.log('bière', biere.length);
console.log('STYLE documenté (fiches bière)', biere.filter((y) => fait(y, 'styles')).length, 'sans style', biere.filter((y) => !fait(y, 'styles')).length);
// Passe 4 bis (critique) : axes Arômes nourris par le niveau OU un descripteur de la fiche (estimé : recherche de mots).
{
  const desc = (y) => [y.name, ...(y.catalogue?.facts ?? []).filter((f) => ['aroma', 'styles', 'esters', 'pof', 'biotransformation', 'betaLyase'].includes(f.key)).map((f) => f.reported)].join(' ').toLowerCase();
  const tab = { 'verdant': [3, 2], 'nottingham': [3, 2], 'pomona': [2, 3], 'belle saison': [1, 3], 'abbaye': [1, 2] }; // [thiols, terpènes] tableau Lallemand 2025-05
  const tabl = (y, i) => { const k = Object.keys(tab).find((n) => y.name.toLowerCase().includes(n) && /lallemand|lalbrew/i.test(y.name + y.catalogue?.manufacturer)); return k ? tab[k][i] : null; };
  const NEG = /(low|minimal|little|subtle|slight|less|without|no|very low|faible|peu)[ -]+(fruit|ester)/;
  const aro = {
    esters: { plus: (y) => (niv(fait(y, 'esters')) ?? 0) >= 2 || (/banan|isoamyl|fruit|estery|esters? (élev|high)|high esters|tropical|bubblegum|pear\b|apricot|peach|stone fruit/.test(desc(y)) && !NEG.test(desc(y)) && (niv(fait(y, 'esters')) ?? 2) >= 2),
      moins: (y) => niv(fait(y, 'esters')) === 0 || (/very clean|ultra[- ]clean|neutral|cleanest|crisp, clean|clean, crisp/.test(desc(y)) && !/banan|isoamyl|fruit|estery|tropical/.test(desc(y))) },
    phenols: { plus: (y) => pof(y) === 1 || (/clove|girofle|phenolic|spic|épic|pepper|poivr|smok/.test(desc(y)) && !/non-phenolic|non phenolic|no phenol|pof-|pof negative|phenol-free|produce any spic|no spic/.test(desc(y)) && pof(y) !== 0),
      moins: (y) => pof(y) === 0 || /non-phenolic|non phenolic|no phenol|pof-|pof negative|phenol-free/.test(desc(y)) },
    thiols: { plus: (y) => (niv(fait(y, 'biotransformation')) ?? 0) >= 3 || (tabl(y, 0) ?? 0) >= 3 || /β-lyase|beta-lyase|thiol|irc7|high biotransformation|enhanced biotransformation/.test(desc(y)),
      moins: (y) => niv(fait(y, 'biotransformation')) === 1 || tabl(y, 0) === 1 },
    terpenes: { plus: (y) => (tabl(y, 1) ?? 0) >= 3 || /terpen|geraniol|linalool|citronellol/.test(desc(y)), moins: (y) => tabl(y, 1) === 1 },
  };
  const sp = (a) => ['ici', 'europe', 'rare'].map((d) => a.filter((y) => dispo(y) === d).length).join('·');
  for (const [k, { plus, moins }] of Object.entries(aro)) {
    const p = biere.filter(plus), m = biere.filter((y) => moins(y) && !plus(y));
    console.log('AROME', k.padEnd(9), '+', p.length, sp(p), '| −', m.length, sp(m), '| + Europe :', p.filter((y) => dispo(y) === 'europe').slice(0, 8).map((y) => y.name.replace(/^[^·]*· /, '').slice(0, 22)).join(', '));
  }
  for (const q of ['3068', 'WLP300', 'M20 Bavarian', 'W-68', 'Abbaye']) { const y = biere.find((x) => x.name.includes(q)); console.log('  vérif + esters', q, y ? aro.esters.plus(y) : '?', '· + phénols', y ? aro.phenols.plus(y) : '?'); }
}
for (const [k, f] of Object.entries(axes)) {
  const ref = f(us05);
  const doc = biere.filter((y) => f(y) != null);
  const plus = ref == null ? doc.filter((y) => f(y) >= 3 || (k === 'phenols' && f(y) === 1)) : doc.filter((y) => f(y) > ref + (k === 'attenuation' ? 2 : 0));
  const moins = ref == null ? doc.filter((y) => f(y) <= 1 && k !== 'phenols' || (k === 'phenols' && f(y) === 0)) : doc.filter((y) => f(y) < ref - (k === 'attenuation' ? 2 : 0));
  const sp = (a) => ['ici', 'europe', 'rare'].map((d) => a.filter((y) => dispo(y) === d).length).join('·');
  console.log(k.padEnd(12), 'US-05=', ref, 'doc', doc.length, 'nd', biere.length - doc.length, '| plus', plus.length, sp(plus), '| moins', moins.length, sp(moins));
  const show = (a) => a.sort((p, q) => ['ici', 'europe', 'rare'].indexOf(dispo(p)) - ['ici', 'europe', 'rare'].indexOf(dispo(q))).slice(0, 7).map((y) => `${y.name.replace(/^[^·]*· /, '').slice(0, 28)}[${dispo(y)}:${f(y)}]`).join(', ');
  console.log('   +', show(plus)); console.log('   -', show(moins));
}
// combinaisons c6
const fam = (y) => { const t = txt(y); if (/brett/.test(t)) return 'brett'; if (/lacto|pedio|bacter/.test(t)) return 'bact'; if (/kveik|kviek/.test(t)) return 'kveik'; if (/pastorianus|lager/.test(t)) return 'lager'; return 'ale'; };
const combo = (nom, pred) => {
  const a = biere.filter(pred);
  console.log('\nCOMBO', nom, a.length, ['ici', 'europe', 'rare'].map((d) => d + ' ' + a.filter((y) => dispo(y) === d).length).join(' · '));
  for (const d of ['ici', 'europe']) console.log('  ', d, a.filter((y) => dispo(y) === d).slice(0, 12).map((y) => y.name.replace(/^[^·]*· /, '').slice(0, 30)).join(' | '));
};
combo('ale · sans STA1 · biotransfo doc', (y) => fam(y) === 'ale' && sta(y) === 'neg' && fait(y, 'biotransformation'));
combo('ale · sans STA1 · ≥10 %', (y) => fam(y) === 'ale' && sta(y) === 'neg' && (axes.tolerance(y) ?? 0) >= 10);
combo('ale · sèche · sans STA1', (y) => fam(y) === 'ale' && /sèche/.test(y.form || '') && sta(y) === 'neg');
combo('ale · 18–20 couvre · ≥10 %', (y) => { const r = rng(fait(y, 'temperature')); return fam(y) === 'ale' && r && r[0] <= 18 && r[1] >= 20 && (axes.tolerance(y) ?? 0) >= 10; });
combo('ale · floc haute · ≥10 %', (y) => fam(y) === 'ale' && (axes.floculation(y) ?? 0) >= 3 && (axes.tolerance(y) ?? 0) >= 10);
console.log('\nsta1 neg', biere.filter((y) => sta(y) === 'neg').length, 'pos', biere.filter((y) => sta(y) === 'pos').length, 'nd', biere.filter((y) => sta(y) == null).length);
const fabs = {}; for (const y of biere) fabs[y.catalogue?.manufacturer] = (fabs[y.catalogue?.manufacturer] || 0) + 1; console.log(Object.keys(fabs).length, 'labos bière');
console.log('ici', biere.filter((y) => dispo(y) === 'ici').map((y) => y.id), 'europe', biere.filter((y) => dispo(y) === 'europe').length, 'rare', biere.filter((y) => dispo(y) === 'rare').length);
const t1820 = (y) => { const r = rng(fait(y, 'temperature')); return r && r[0] <= 18 && r[1] >= 20; };
combo('ale · 18–20 · sans STA1 déclarée', (y) => fam(y) === 'ale' && t1820(y) && sta(y) === 'neg');
combo('ale · 18–20 · STA1 non documentée', (y) => fam(y) === 'ale' && t1820(y) && sta(y) == null);
combo('ale · 18–20 · STA1 positive', (y) => fam(y) === 'ale' && t1820(y) && sta(y) === 'pos');
combo('ale · 18–20', (y) => fam(y) === 'ale' && t1820(y));
combo('ale', (y) => fam(y) === 'ale');
const fc = {}; for (const y of biere) fc[fam(y)] = (fc[fam(y)] || 0) + 1; console.log(fc);
