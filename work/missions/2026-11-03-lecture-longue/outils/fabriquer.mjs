// Deux factures fictives (D379, « génère un fichier avec 300 item, et un avec 600 ») : HTML imprimé en PDF par Chrome, et leur vérité en JSON.
// Usage : node fabriquer.mjs <dossier> <n:lignesParPage>...   ex. 300:75 600:75
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const R = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/';
const puppeteer = createRequire(R + 'package.json')('puppeteer-core');
const [dossier, ...specs] = process.argv.slice(2);
fs.mkdirSync(dossier, { recursive: true });

const MALTS = ['Pilsner', 'Pale Ale', 'Munich I', 'Munich II', 'Vienne', 'Froment clair', 'Froment foncé', 'Cara clair', 'Cara rubis', 'Cara ambré', 'Chocolat', 'Noir', 'Seigle', 'Avoine', 'Acidulé', 'Fumé hêtre', 'Biscuit', 'Mélanoïdine'];
const HOUBLONS = ['Citra', 'Mosaic', 'Saaz', 'Hallertau Mittelfrüh', 'Cascade', 'Simcoe', 'Nelson Sauvin', 'Motueka', 'Galaxy', 'East Kent Goldings', 'Magnum', 'Perle', 'Tettnanger', 'Amarillo', 'Idaho 7'];
const LEVURES = ['Ale américaine B-05', 'Ale anglaise B-04', 'Lager B-34', 'Belge B-58', 'Froment B-06', 'Saison B-25', 'Kveik B-71'];
const DIVERS = [['Bouteille 33 cl brune, carton de 24', 'pce', 1890], ['Capsule 26 mm or, sachet de 1000', 'pce', 2450], ['Carton 6 × 33 cl', 'pce', 95], ['Étiquette autocollante, rouleau', 'pce', 3600],
  ['Soude caustique 25 kg', 'pce', 6400], ['Acide peracétique 10 L', 'pce', 8900], ['Tuyau alimentaire 19 mm, mètre', 'm', 780], ['Raccord tri-clamp 1,5"', 'pce', 1450], ['Joint EPDM 1,5"', 'pce', 320]];
const chf = c => (c / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, "'");

function lignes(n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const lot = `L${String(1000 + i * 7 % 9000).padStart(4, '0')}-${(i % 31) + 1}`;
    const g = i % 6;
    let nom, unite, q, pu;
    if (g <= 1) { nom = `Malt ${MALTS[i % MALTS.length]} ${[5, 10, 25][i % 3]} kg, lot ${lot}`; unite = 'kg'; q = [5, 10, 25][i % 3] * (1 + i % 4); pu = 145 + (i * 13) % 160; }
    else if (g === 2) { nom = `Houblon ${HOUBLONS[i % HOUBLONS.length]} pellets T90, récolte 2026, lot ${lot}`; unite = 'g'; q = [100, 250, 500, 1000][i % 4]; pu = 4 + (i * 7) % 9; }
    else if (g === 3) { nom = `Levure sèche ${LEVURES[i % LEVURES.length]} 11,5 g, lot ${lot}`; unite = 'sachet'; q = 1 + i % 10; pu = 450 + (i * 11) % 300; }
    else { const d = DIVERS[i % DIVERS.length]; nom = `${d[0]}, réf. ${lot}`; unite = d[1]; q = 1 + i % 12; pu = d[2] + (i * 17) % 200; }
    // Les grammes de houblon se facturent en centimes par gramme ; le montant est arrondi au centime, comme sur une vraie facture.
    out.push({ rang: i + 1, ref: `MB-${String(20000 + i).padStart(6, '0')}`, nom, unite, q, puCents: pu, montantCents: Math.round(q * pu) });
  }
  return out;
}

const html = (n, items, parPage) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
@page { size: A4; margin: 9mm 10mm 10mm; }
body { font: ${parPage >= 70 ? 6.6 : 8.5}pt/1.18 Arial, Helvetica, sans-serif; color: #111; margin: 0; }
h1 { font-size: 14pt; margin: 0 0 1mm; } .tete { display: flex; justify-content: space-between; margin-bottom: 2.5mm; }
table { width: 100%; border-collapse: collapse; } th, td { padding: 0.25mm 1mm; border-bottom: 0.2mm solid #ccc; text-align: left; white-space: nowrap; }
th { border-bottom: 0.4mm solid #111; background: #eee; } td.n, th.n { text-align: right; } td.nom { white-space: normal; }
thead { display: table-header-group; } tr { page-break-inside: avoid; }
.tot { margin-top: 3mm; width: 60mm; margin-left: auto; } .tot td { border: 0; padding: 0.4mm 1mm; } .tot tr.g td { font-weight: bold; border-top: 0.4mm solid #111; font-size: 9pt; }
.pied { margin-top: 4mm; font-size: 7pt; color: #444; }
</style></head><body>
<div class="tete"><div><h1>Malterie du Banc SA</h1>Rue Fictive 12, 1000 Lausanne · CHE-000.000.000 TVA<br>Facture fictive de test, générée pour L'Affinée</div>
<div><b>Facture BANC-${n}</b><br>Date : 03.11.2026<br>Échéance : 03.12.2026<br>Client : Brasserie de test<br>Devise : CHF</div></div>
<table><thead><tr><th>Pos.</th><th>Réf.</th><th>Désignation</th><th class="n">Qté</th><th>Unité</th><th class="n">Prix unit.</th><th class="n">Montant TTC</th></tr></thead><tbody>
${items.map(l => `<tr><td>${l.rang}</td><td>${l.ref}</td><td class="nom">${l.nom}</td><td class="n">${l.q}</td><td>${l.unite}</td><td class="n">${l.unite === 'g' ? (l.puCents / 100).toFixed(2) : chf(l.puCents)}</td><td class="n">${chf(l.montantCents)}</td></tr>`).join('\n')}
</tbody></table>
<table class="tot"><tr><td>Total des positions</td><td class="n">${chf(items.reduce((s, l) => s + l.montantCents, 0))}</td></tr>
<tr><td>dont TVA 8,1 %</td><td class="n">${chf(Math.round(items.reduce((s, l) => s + l.montantCents, 0) * 0.081 / 1.081))}</td></tr>
<tr class="g"><td>Total TTC CHF</td><td class="n">${chf(items.reduce((s, l) => s + l.montantCents, 0))}</td></tr></table>
<div class="pied">${n} positions. Payable à 30 jours. Document fictif, aucune valeur commerciale.</div>
</body></html>`;

const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const spec of specs) {
  const [n, parPage] = spec.split(':').map(Number);
  const items = lignes(n), page = await nav.newPage();
  // parPage 1 : une seule page, A4 de large et aussi haute que le contenu (l'export d'une commande en ligne).
  const unePage = parPage === 1;
  await page.setContent(html(n, items, parPage).replace(unePage ? /@page \{[^}]*\}/ : /$^/, '@page { margin: 0; } body { padding: 9mm 10mm; }'), { waitUntil: 'load' });
  if (unePage) await page.setViewport({ width: 794, height: 1123 });
  const hauteur = unePage ? await page.evaluate(() => Math.ceil(document.documentElement.scrollHeight) + 4) : 0;
  const pdf = Buffer.from(await page.pdf(unePage ? { width: '210mm', height: `${hauteur}px`, printBackground: true, pageRanges: '1' }
    : { format: 'A4', printBackground: true, preferCSSPageSize: true }));
  const fichier = path.join(dossier, `facture-fictive-${n}-lignes.pdf`);
  fs.writeFileSync(fichier, pdf);
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length;
  const totalCents = items.reduce((s, l) => s + l.montantCents, 0);
  fs.writeFileSync(path.join(dossier, `verite-${n}.json`), JSON.stringify({ n, pages, totalCents, tvaCents: Math.round(totalCents * 0.081 / 1.081), items }, null, 1));
  console.log(`${n} lignes : ${pages} pages, ${pdf.length} octets, total ${chf(totalCents)} CHF`);
  await page.close();
}
await nav.close();
