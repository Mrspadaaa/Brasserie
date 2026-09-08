// Offline, reproducible preparation of a sourced data pack. Never run by the aroma engine.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const study = JSON.parse(await readFile(new URL('src/data/hopStudies/lafontaine2018.cascade2015.json', root), 'utf8'));
const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;
const bounds = xs => ({ min: Math.min(...xs), max: Math.max(...xs) });
const fit = rows => {
  const x = mean(rows.map(r => r[1])), y = mean(rows.map(r => r[2]));
  const slope = rows.reduce((s, r) => s + (r[1] - x) * (r[2] - y), 0) / rows.reduce((s, r) => s + (r[1] - x) ** 2, 0);
  return { slope, intercept: y - slope * x };
};
const rows = study.rows, complete = fit(rows), omitted = rows.map((_, i) => fit(rows.filter((__, j) => i !== j)));
const residuals = rows.map((r, i) => r[2] - omitted[i].intercept - omitted[i].slope * r[1]);
const rSquared = 1 - rows.reduce((s, r) => s + (r[2] - complete.intercept - complete.slope * r[1]) ** 2, 0) / rows.reduce((s, r) => s + (r[2] - mean(rows.map(v => v[2]))) ** 2, 0);
const primary = study.source;
const local = { title: 'Étalonnage exploratoire Cascade 2015 — reconstruction L’Affinée', author: 'L’Affinée', year: study.localMethod.year, kind: 'judgment',
  reference: 'docs/index-houblon-etalonnage.md', locator: `${primary.reference} ; tableaux S6 et S12 ; ${study.localMethod.description}` };
const parameter = range => ({ range, source: local });
const axis = { id: 'citrus-lafontaine', kind: 'axis', name: 'Agrumes · panel Lafontaine', version: study.localMethod.version,
  description: 'Échelle Citrus 0–15 du panel publié, distincte de l’échelle personnelle 0–100. Moyennes de panel et ancres de cette étude ; les classes sont une convention locale, pas un seuil sensoriel publié.',
  scale: study.sensoryScale, lowMax: study.localMethod.classBoundaries[0], mediumMax: study.localMethod.classBoundaries[1],
  weight: parameter({ min: study.localMethod.axisWeight, max: study.localMethod.axisWeight }), source: local };
const support = bounds(rows.map(r => r[1]));
const pack = {
  hopVarieties: [{ id: study.protocol.varietyId, name: 'Cascade · cônes', aliases: ['Cascade'], origin: 'États-Unis', form: study.protocol.form,
    descriptions: [{ text: 'Référence analytique limitée aux cônes Cascade de récolte 2015 de cette étude. Cette plage n’est pas une spécification universelle de la variété.', context: 'unspecified', source: primary }],
    analysis: [{ analyte: 'geraniol', unit: 'mg100g', basis: 'asIs', kind: 'range', range: support, source: primary, confidence: 'low',
      method: 'Hydrodistillation et GC-FID/GC-MS, tableau S12.', note: 'Extrema entre les 29 lots de 2015 ; variabilité entre lots, pas incertitude d’une analyse.' }] }],
  hopLots: [],
  hopKnowledge: [axis, { id: study.protocol.yeastId, kind: 'yeast', name: 'Wyeast 1728', betaLyase: 'unknown', source: primary },
    { id: 'cascade1728-clarified-lafontaine', kind: 'model', name: 'Cascade × Wyeast 1728 · bière clarifiée', version: study.localMethod.version,
      enabled: true, confidence: study.localMethod.confidence, source: local, scope: study.protocol,
      outputs: [{ target: `axis:${axis.id}`, axisVersion: axis.version, envelope: { range: bounds(rows.map(r => r[2])), source: primary },
        calibration: { method: study.localMethod.description,
          intercept: parameter(bounds([complete.intercept, ...omitted.map(v => v.intercept)])), residual: parameter(bounds(residuals)),
          terms: [{ analyte: 'geraniol', unit: 'mg100g', basis: 'asIs', support, coefficient: parameter(bounds([complete.slope, ...omitted.map(v => v.slope)])) }] } }] }],
  hopPredictions: [], hopTastings: []
};
const serialized = JSON.stringify(pack, null, 2) + '\n';
const destination = new URL('src/data/hopStudyBootstrap.json', root);
if (process.argv.includes('--check')) {
  if (await readFile(destination, 'utf8') !== serialized) throw Error('Le pack ne correspond plus aux données et à la méthode documentées.');
} else await writeFile(destination, serialized);
console.log(JSON.stringify({ file: fileURLToPath(destination), observations: rows.length, fit: complete, rSquared, leaveOneOutResidual: bounds(residuals) }));
