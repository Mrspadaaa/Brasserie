// Documentary collection only. Never writes an active catalogue or a remote database.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { get, load, compact } from './fetch.mjs';
import { parseProduct, reportedRange } from './parse.mjs';

const folder = resolve('.codex-remote-attachments/yeast-enrichment/escarpment');
await mkdir(folder, { recursive: true });
await mkdir('docs/research/yeast-enrichment', { recursive: true });
const rows = JSON.parse(await readFile('src/data/yeastCatalogueBootstrap.json', 'utf8'))
  .filter(row => row.catalogue?.manufacturer === 'Escarpment Labs');
const output = { version: 1, collectedAt: new Date().toISOString(), items: [], gaps: [] };
const cleanReceipt = ({ finalUrl: _finalUrl, ...receipt }) => receipt;
const pitchUrl = 'https://knowledge.escarpmentlabs.com/article/70-standard-pitch-rate';
const pitch = await get(pitchUrl);
await writeFile(resolve(folder, 'pitch.html'), pitch.body);
await writeFile(resolve(folder, 'pitch.receipt.json'), JSON.stringify(pitch.receipt, null, 2));
const pitchDoc = load(pitch.body), pitchTable = pitchDoc('table').filter((_i, table) =>
  compact(pitchDoc(table).find('tr').first().text()).includes('trillion cells per hL'));
if (pitchTable.length !== 1) throw Error('Liquid pitch table structure changed');
const pitches = new Map();
pitchTable.find('tr').slice(1).each((_i, tr) => {
  const cells = pitchDoc(tr).children('td,th').map((_j, cell) => compact(pitchDoc(cell).text())).get();
  if (/^\d+(?:\.\d+)?\/hL$/.test(cells[2] ?? '')) pitches.set(cells[0], cells[2].split('/')[0]);
});
const contexts = {
  attenuation: 'Plage moyenne publiée par Escarpment ; le moût et les conditions de fermentation peuvent conduire à une atténuation hors de cette plage.',
  temperature: 'Plage de fermentation suggérée par le fabricant ; ce n’est pas une limite de viabilité.',
  diastatic: 'Caractère diastatique déclaré pour cette culture ; ne remplace pas un contrôle du lot.',
  fermentationRate: 'Classement fabricant fondé sur l’atténuation après 48 h dans un moût standard ; ce n’est pas une durée de fermentation garantie.',
  flocculation: 'Classement fabricant par méthode ASBC ; le calcium et le pH du moût influencent la floculation réelle.',
  alcoholTolerance: 'Classe qualitative du fabricant, dépendante de la santé de la levure et de sa nutrition ; aucune valeur numérique n’est déduite du seul classement.',
  pof: 'Caractère phénolique déclaré sur la fiche de cette culture ; aucune intensité aromatique n’est déduite.',
  biotransformation: 'Classement fabricant de conversion géraniol → β-citronellol dans un moût standard ; ne mesure pas la libération des thiols.',
  aroma: 'Descripteurs qualitatifs du fabricant, issus d’analyses et de dégustations ; aucune intensité ni proportion prédite.',
  styles: 'Exemples de styles proposés par le fabricant ; aucune équivalence entre marques n’est déduite.'
};
for (const row of rows) {
  const url = row.source.reference, slug = new URL(url).pathname.split('/').at(-1);
  if (/WLP079|WildBrew Philly Sour|Yeast Lightning/.test(row.name)) {
    output.gaps.push({ id: row.id, url, reason: /Yeast Lightning/.test(row.name) ? 'Nutriment : ne pas ajouter de paramètres de souche.' : 'Produit d’un autre fabricant distribué par Escarpment : source primaire de ce fabricant à privilégier.' });
    continue;
  }
  try {
    const response = await get(url, { refresh: !process.argv.includes('--cached') });
    await writeFile(resolve(folder, `${slug}.html`), response.body);
    await writeFile(resolve(folder, `${slug}.receipt.json`), JSON.stringify(response.receipt, null, 2));
    const doc = load(response.body), title = compact(doc('h1').first().text());
    const expected = row.name.replace(/^Escarpment Labs · /, '');
    // A redirected page or a related-product card must never supply another strain's facts.
    const observedId = response.body.match(/"rtyp":"product","rid":(\d+)/)?.[1];
    if (title !== expected || observedId !== row.catalogue.productId) {
      output.gaps.push({ id: row.id, url, reason: `Identité à revoir : titre ${title}, produit ${observedId ?? 'absent'}.` });
      continue;
    }
    const parsed = parseProduct({ id: 'escarpment', name: 'Escarpment Labs' }, { name: title, url }, response.body);
    const facts = parsed.facts.map(fact => {
      const enriched = { ...fact, source: { ...fact.source, locator: `Key Characteristics / description produit · ${fact.label}` }, context: fact.context ?? contexts[fact.key] };
      // Some manufacturer pages use the ordinal character º instead of the degree sign.
      if (fact.key === 'temperature' && !fact.range && !/contradictoire/i.test(fact.context ?? '')) {
        Object.assign(enriched, reportedRange(fact.reported.replaceAll('º', '°'), '°C') ?? {});
      }
      if (['temperature', 'attenuation'].includes(fact.key) && enriched.range && !fact.context) enriched.context = 'Beer';
      if (enriched.context === undefined) delete enriched.context;
      return enriched;
    });
    const retrievals = [cleanReceipt(response.receipt)], documents = [{ title: `${title} · fiche fabricant`, url }];
    if (facts.some(fact => ['temperature', 'attenuation'].includes(fact.key) && fact.context === 'Beer')) {
      facts.push({ key: 'application', label: 'Interpréter les plages fabricant',
        reported: 'La température est une plage suggérée. L’atténuation publiée est une moyenne dépendante du moût ; le résultat réel peut sortir de cette plage.',
        source: { ...parsed.source, locator: 'Key Characteristics · définitions Temperature et Attenuation' } });
    }
    // The exact row in the manufacturer's liquid-culture table is the authority;
    // never convert cells into grams or copy professional rates to homebrew packs.
    const cells = pitches.get(title);
    if (cells) {
      facts.push({ key: 'pitchRate', label: 'Ensemencement · culture liquide professionnelle', reported: `${cells} × 10¹² cellules/hL`,
        source: { title: 'Standard Pitch Rates', author: 'Escarpment Labs', year: null, kind: 'manufacturer', reference: pitchUrl, locator: `Pro yeast pitch rates · ${title}` },
        context: 'Dose de fourniture Pro publiée pour cette souche liquide ; demander un ajustement selon le volume et la densité du moût. Aucune conversion en grammes.' });
      retrievals.push(cleanReceipt(pitch.receipt));
      documents.push({ title: 'Escarpment · doses de fourniture des cultures', url: pitchUrl });
    }
    if (!facts.length) output.gaps.push({ id: row.id, url, reason: 'Aucune caractéristique structurée exploitable dans la fiche reçue.' });
    else output.items.push({ id: row.id, facts, retrievals, documents,
      notes: 'Caractéristiques extraites de la fiche du produit dont le titre et l’identifiant Shopify concordent avec le catalogue ; formes et usages distincts conservés.',
      ...(cells ? { form: 'liquide' } : {}) });
    if ((output.items.length + output.gaps.length) % 20 === 0) console.log(`Escarpment ${output.items.length} fiches, ${output.gaps.length} limites / ${rows.length}`);
  } catch (error) {
    output.gaps.push({ id: row.id, url, reason: String(error.message).slice(0, 200) });
    // Stop on explicit throttling/access denial; do not rotate identities or bypass it.
    if (error.status === 429 || error.status === 403) { output.gaps.push({ reason: 'Collecte arrêtée sur refus ou limitation du serveur ; autres fiches non reconsultées.' }); break; }
  }
  await writeFile('docs/research/yeast-enrichment/escarpment.json', JSON.stringify(output, null, 2) + '\n');
}
await writeFile('docs/research/yeast-enrichment/escarpment.json', JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ references: output.items.length, facts: output.items.reduce((n, item) => n + item.facts.length, 0), gaps: output.gaps.length }));
