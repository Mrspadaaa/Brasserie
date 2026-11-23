/**
 * Construit les PDF fictifs du banc d'usage Gemini (#91), de façon déterministe.
 *   node tests/fixtures/gemini-usage-bench/build-fixtures.mjs          (écrit les PDF)
 *   node tests/fixtures/gemini-usage-bench/build-fixtures.mjs --check  (vérifie qu'ils sont à jour)
 *
 * Toutes les données sont inventées (variété, lots, fournisseurs, montants) :
 * aucune donnée réelle de la brasserie. Un PDF texte en Helvetica WinAnsi,
 * comme tests/fixtures/hop-coa-g38.pdf, suffit à Gemini et reste lisible ici.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const MARK = 'FIXTURE DE TEST - document fictif, aucune donnee reelle';

const escape = text => text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

/** pages : listes de lignes [texte, taille?, gras?] ; une ligne vide avance d'un pas. */
function pdf(pages) {
  const objects = [];
  const add = body => { objects.push(body); return objects.length; };
  const catalog = add(null), pagesRef = add(null);
  const regular = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const bold = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const kids = [];
  pages.forEach((lines, index) => {
    let y = 790;
    const ops = [];
    for (const [text, size = 11, strong = false] of [...lines, ['', 9], [`Page ${index + 1}/${pages.length}`, 9]]) {
      if (text) ops.push(`BT /${strong ? 'F2' : 'F1'} ${size} Tf 56 ${y} Td (${escape(text)}) Tj ET`);
      y -= Math.round(size * 1.9);
    }
    const stream = Buffer.from(ops.join('\n'), 'latin1');
    const content = add({ stream });
    kids.push(add(`<< /Type /Page /Parent ${pagesRef} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${regular} 0 R /F2 ${bold} 0 R >> >> /Contents ${content} 0 R >>`));
  });
  objects[catalog - 1] = `<< /Type /Catalog /Pages ${pagesRef} 0 R >>`;
  objects[pagesRef - 1] = `<< /Type /Pages /Kids [${kids.map(kid => `${kid} 0 R`).join(' ')}] /Count ${kids.length} >>`;
  const chunks = [Buffer.from('%PDF-1.4\n', 'latin1')];
  const offsets = [];
  let length = chunks[0].length;
  objects.forEach((body, index) => {
    offsets.push(length);
    const head = Buffer.from(`${index + 1} 0 obj\n`, 'latin1');
    const parts = typeof body === 'string'
      ? [head, Buffer.from(`${body}\nendobj\n`, 'latin1')]
      : [head, Buffer.from(`<< /Length ${body.stream.length} >>\nstream\n`, 'latin1'), body.stream, Buffer.from('\nendstream\nendobj\n', 'latin1')];
    for (const part of parts) { chunks.push(part); length += part.length; }
  });
  const xref = [`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`, ...offsets.map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`)].join('');
  chunks.push(Buffer.from(`${xref}trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${length}\n%%EOF\n`, 'latin1'));
  return Buffer.concat(chunks);
}

export const FIXTURES = {
  // COA simple : mêmes champs que hop-coa-g38.pdf, autre lot.
  'coa-simple.pdf': pdf([[
    ['Certificate of Analysis - Hop pellets T90', 15, true],
    [MARK, 9],
    ['COA number: BENCH-COA-0031'],
    ['Variety: Cascade'],
    ['Lot number: BENCH-LOT-2025-031'],
    ['Harvest year: 2025'],
    ['Form: pellets T90'],
    ['Date of analysis: 2026-01-20'],
    ['Results (as is)', 12, true],
    ['Alpha acids (EBC 7.4, conductometric): 6.8 % w/w'],
    ['Beta acids (EBC 7.7, HPLC): 5.9 % w/w'],
    ['Total oil (EBC 7.10, distillation): 1.1 mL/100 g'],
    ['Hop Storage Index (ASBC Hops-12): 0.28'],
    ['Moisture: 8.9 % w/w']
  ]]),
  // COA piège : variété inventée (aucune mémoire possible), récolte et analyse distinctes,
  // base matière sèche, non-détection, plage variétale et dose sensorielle à ne PAS transcrire.
  'coa-piege.pdf': pdf([[
    ['Certificate of Analysis - Lupulin pellets (cryo)', 15, true],
    [MARK, 9],
    ['COA number: BENCH-COA-0112'],
    ['Variety: Affinee Gold (fictitious)'],
    ['Lot number: BENCH-LOT-2024-112'],
    ['Harvest year: 2024'],
    ['Date of analysis: 2025-11-03'],
    ['Growing region: Hallertau, Germany'],
    ['Grower: Hopfengut Fiktiv GmbH'],
    ['Storage: kept at -2 °C under nitrogen since pelletising'],
    ['Results (dry matter basis)', 12, true],
    ['Alpha acids (EBC 7.7, HPLC): 12.4 % w/w'],
    ['Beta acids (EBC 7.7, HPLC): 4.1 % w/w'],
    ['Total oil (EBC 7.10): 2.6 mL/100 g'],
    ['Oil composition (GC, % of total oil)', 12, true],
    ['Myrcene: 48 %'],
    ['Linalool: not detected (< 0.1 %, limit of detection)'],
    ['Hop Storage Index: not determined']
  ], [
    ['Annex - general information (not results of this lot)', 12, true],
    ['Typical range for this variety: alpha acids 11-14 %, beta acids 3-5 %.'],
    ['Sensory kit: dosed at 50 µg/L in a reference lager for panel training.'],
    ['Odour threshold of linalool in beer reported by the literature: about 1 µg/L.']
  ]]),
  // Facture à deux taux de TVA, remise négative, frais de port : tvaRate doit rester null.
  'facture-tva-mixte.pdf': pdf([[
    ['Malterie Fictive SA', 15, true],
    [MARK, 9],
    ['Rue de l\'Essai 4, 1700 Fribourg'],
    ['FACTURE N° BENCH-F-2026-0412     Date : 02.10.2026     Devise : CHF', 11, true],
    ['Votre commande : CMD-30871'],
    ['Désignation | Qté | Unité | Prix unitaire | Montant TTC | TVA', 10, true],
    ['Malt Pilsner 25 kg | 2 | sac | 48.50 | 97.00 | 2.6 %'],
    ['Malt Munich 10 kg | 1 | sac | 26.40 | 26.40 | 2.6 %'],
    ['Détergent alcalin CIP 10 L | 1 | bidon | 64.90 | 64.90 | 8.1 %'],
    ['Frais de port | | | | 15.00 | 8.1 %'],
    ['Remise fidélité | | | | -5.00 | 8.1 %'],
    ['Total HT : 189.56 CHF'],
    ['TVA 2.6 % : 3.13 CHF     TVA 8.1 % : 5.61 CHF     Total TVA : 8.74 CHF'],
    ['Montant à payer : 198.30 CHF', 12, true],
    ['Payable net à 30 jours.']
  ]]),
  // Recette en unités impériales : l'import doit convertir sans inventer (5 gal US = 18.93 L, 1 lb = 0.4536 kg, 1 oz = 28.35 g, 152 °F = 66.7 °C).
  'recette-brown-ale.pdf': pdf([[
    ['Brown Ale du Banc - recipe card', 15, true],
    [MARK, 9],
    ['Batch size: 5 US gallons (into fermenter)     Boil: 60 min     Efficiency: 72 %'],
    ['Original gravity: 1.050     Final gravity: 1.012     Bitterness: 26 IBU'],
    ['Grain bill', 12, true],
    ['8 lb Maris Otter pale malt'],
    ['1 lb Crystal 60L'],
    ['0.5 lb Chocolate malt'],
    ['Hops', 12, true],
    ['1 oz East Kent Goldings (5.0 % AA) - boil 60 min'],
    ['0.5 oz Fuggle (4.5 % AA) - boil 15 min'],
    ['Yeast', 12, true],
    ['Fermentis SafAle S-04, one 11.5 g sachet, ferment at 66 °F'],
    ['Mash', 12, true],
    ['Single infusion at 152 °F for 60 min, mash out at 168 °F for 10 min'],
    ['Notes', 12, true],
    ['Bottle with 2.2 volumes of CO2.']
  ]]),
  // Bordereau sans aucun prix ni total : montants null, numéro de commande distinct de la facture.
  'bordereau.pdf': pdf([[
    ['Emballages Fictifs Sàrl', 15, true],
    [MARK, 9],
    ['BORDEREAU DE LIVRAISON BL-BENCH-7781     Date : 05.10.2026', 11, true],
    ['N° de commande : CMD-55821     N° client : 004417'],
    ['Article | Référence | Quantité | Unité', 10, true],
    ['Capsules couronne 26 mm, or | CAP-26-OR | 1000 | pièces'],
    ['Bouteilles 33 cl brunes, carton de 24 | BT-33-BR | 24 | cartons'],
    ['Marchandise livrée, facture suivra.']
  ]])
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const check = process.argv.includes('--check');
  let stale = 0;
  for (const [name, bytes] of Object.entries(FIXTURES)) {
    const path = join(here, name);
    if (check) {
      let current;
      try { current = readFileSync(path); } catch { current = Buffer.alloc(0); }
      if (!current.equals(bytes)) { stale += 1; console.error(`✗ ${name} n'est pas à jour`); }
    } else writeFileSync(path, bytes);
  }
  if (check && stale) process.exit(1);
  console.log(check ? `✓ ${Object.keys(FIXTURES).length} PDF fictifs à jour` : `✓ ${Object.keys(FIXTURES).length} PDF fictifs écrits`);
}
