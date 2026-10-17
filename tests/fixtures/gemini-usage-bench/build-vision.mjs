/**
 * Images synthétiques de la partie vision du banc d'usage Gemini (#91, AI07-B) : tickets de caisse, facture,
 * bulletin de livraison, COA photographié, image illisible ou hors sujet, recette photographiée.
 * Toutes les données sont inventées. Chaque image a sa vérité terrain à côté (`vision/<id>.truth.json`), écrite
 * depuis les mêmes données que le rendu ; les totaux sont recalculés et comparés aux montants imprimés.
 *   node tests/fixtures/gemini-usage-bench/build-vision.mjs          (Chrome local headless : images, vérités, manifeste)
 *   node tests/fixtures/gemini-usage-bench/build-vision.mjs --check  (vérités et HTML à jour, sans Chrome)
 * Aucun réseau : HTML autonome, polices système, toute requête autre que about:/data: est bloquée.
 * Les octets des images dépendent de la version de Chrome ; le manifeste garde l'empreinte du HTML rendu.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'vision');
const MARK = 'FIXTURE DE TEST – document fictif';
const r2 = value => Math.round(value * 100) / 100;
const money = value => value.toFixed(2);
const esc = text => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** Ligne de ticket : [désignation, quantité|null, prix|null, natures admises, code TVA, montant imprimé si sans prix]. */
const line = (name, quantity, price, kind, vat = 'B', amount) => ({ name, quantity, price, kind, vat, amount: amount ?? r2(quantity * price) });

/** Ticket de caisse : contrôle les totaux imprimés par code TVA, rend le HTML et la vérité. */
function receipt(doc) {
  const byCode = {};
  for (const item of doc.items) byCode[item.vat] = r2((byCode[item.vat] ?? 0) + item.amount);
  const ttc = r2(Object.values(byCode).reduce((a, b) => a + b, 0));
  const ht = r2(doc.vat.reduce((a, row) => a + row.base, 0));
  const tva = r2(doc.vat.reduce((a, row) => a + row.tax, 0));
  for (const row of doc.vat) {
    if (r2(row.base + row.tax) !== byCode[row.code]) throw new Error(`${doc.id} : code ${row.code}, base + TVA ≠ lignes`);
    if (Math.abs(r2(row.base * row.rate) - row.tax) > 0.01) throw new Error(`${doc.id} : code ${row.code}, TVA mal arrondie`);
  }
  if (ttc !== doc.total || r2(ht + tva) !== ttc) throw new Error(`${doc.id} : total ${ttc} ≠ ${doc.total}`);
  const t = doc.labels;
  const rows = doc.items.map(item => `<div class="l">${esc(item.name)}</div>` + (item.quantity == null
    ? `<div class="r"><span></span><span>${money(item.amount)} ${item.vat}</span></div>`
    : `<div class="r"><span>${item.quantity} x ${money(item.price)}</span><span>${money(item.amount)} ${item.vat}</span></div>`)).join('');
  const vatRows = doc.vat.map(row => `<div class="r"><span>${row.code} ${(row.rate * 100).toFixed(1)}%</span><span>${money(row.base)}</span><span>${money(row.tax)}</span></div>`).join('');
  const html = `<div class="ticket">
    <div class="c b">${esc(doc.vendorPrinted)}</div>${doc.address.map(text => `<div class="c">${esc(text)}</div>`).join('')}
    <div class="sep"></div><div class="r"><span>${esc(doc.date)} ${esc(doc.time)}</span><span>${esc(t.ticket)} ${esc(doc.number)}</span></div><div class="sep"></div>
    ${rows}<div class="sep"></div>
    <div class="r b big"><span>${esc(t.total)} ${doc.currency}</span><span>${money(ttc)}</span></div>
    <div class="r"><span>${esc(t.vat)}</span><span>${esc(t.base)}</span><span>${esc(t.tax)}</span></div>${vatRows}
    <div class="r"><span>${esc(t.net)}</span><span>${money(ht)}</span><span>${money(tva)}</span></div>
    <div class="sep"></div>${doc.payment.map(text => `<div class="l">${esc(text)}</div>`).join('')}
    <div class="c small">${esc(doc.thanks)}</div><div class="c tiny">${MARK}</div></div>`;
  const truth = {
    vendor: doc.vendorKey, documentType: 'receipt', paymentEvidence: ['paid', 'unknown'], date: doc.date, currency: doc.currency,
    invoiceNumber: [doc.number, `${t.ticket} ${doc.number}`, ''], orderNumber: '', amountHT: ht,
    tvaRate: doc.vat.length === 1 ? doc.vat[0].rate : null, tvaAmount: tva, amountTTC: ttc,
    items: doc.items.map(item => ({ name: item.name, kind: item.kind, quantity: item.quantity, unit: '', price: item.price, amountTTC: item.amount }))
  };
  return { html, truth };
}

const FR = { ticket: 'Ticket', total: 'TOTAL', vat: 'TVA', base: 'Base', tax: 'TVA', net: 'Total HT / TVA' };
const DE = { ticket: 'Bon-Nr.', total: 'SUMME', vat: 'MwSt', base: 'Netto', tax: 'MwSt', net: 'Netto / MwSt gesamt' };
const EQUIP = ['equipment', 'stock', 'other', 'unknown'];
const CONSUMABLE = ['stock', 'other', 'unknown'];
const INGREDIENT = ['stock'];

const TICKET_NET = {
  id: 'ticket-net', vendorKey: 'Comptoir du Brasseur', vendorPrinted: 'Comptoir du Brasseur SA', address: ['Rue des Cuves 4', '2999 Fictiville', 'CHE-000.111.222 TVA'],
  date: '14.09.2026', time: '10:42', number: '4471', currency: 'CHF', labels: FR,
  items: [line('Tuyau silicone 10 mm', 2, 5.9, EQUIP), line('Pince Hoffmann', 1, 3.5, EQUIP), line('Thermometre digital', 1, 18.9, EQUIP), line('Brosse a bouteilles', 1, 5.8, EQUIP)],
  vat: [{ code: 'B', rate: 0.081, base: 37.0, tax: 3.0 }], total: 40.0, payment: ['Carte Maestro CHF 40.00', 'Paye - merci'], thanks: 'Merci de votre visite'
};
const TICKET_SOMBRE = {
  id: 'ticket-sombre-pli', vendorKey: 'Droguerie des Remparts', vendorPrinted: 'Droguerie des Remparts', address: ['Place du Marche 9', '2998 Fictiville'],
  date: '21.09.2026', time: '17:05', number: '88213', currency: 'CHF', labels: FR,
  items: [line('Acide peracetique 1 L', 1, 12.4, CONSUMABLE), line('Soude caustique 1 kg', 1, 8.9, CONSUMABLE), line('Gants nitrile (100)', 1, 11.5, CONSUMABLE), line('Javel 2 L', 2, 3.2, CONSUMABLE)],
  vat: [{ code: 'B', rate: 0.081, base: 36.26, tax: 2.94 }], total: 39.2, payment: ['Especes CHF 50.00', 'Rendu CHF 10.80'], thanks: 'A bientot'
};
const TICKET_LONG = {
  id: 'ticket-long-tva', vendorKey: 'Brassi-Shop', vendorPrinted: 'Brassi-Shop Fictif Sarl', address: ['Zone du Houblon 12', '2997 Fictiville', 'CHE-000.333.444 TVA'],
  date: '27.09.2026', time: '11:18', number: '30559', currency: 'CHF', labels: FR,
  items: [
    line('Malt Pale Ale 5 kg', 1, 16.5, INGREDIENT, 'A'), line('Malt Munich 1 kg', 2, 4.2, INGREDIENT, 'A'), line('Malt Crystal 150 500 g', 1, 3.6, INGREDIENT, 'A'),
    line('Malt Carapils 500 g', 1, 3.4, INGREDIENT, 'A'), line("Flocons d'avoine 500 g", 1, 2.9, INGREDIENT, 'A'), line('Houblon Cascade 100 g', 2, 7.2, INGREDIENT, 'A'),
    line('Houblon Citra 100 g', 1, 9.8, INGREDIENT, 'A'), line('Houblon Magnum 100 g', 1, 5.6, INGREDIENT, 'A'), line('Levure US-05 11.5 g', 2, 4.9, INGREDIENT, 'A'),
    line('Sucre candi 500 g', 1, 3.2, INGREDIENT, 'A'), line('Irish Moss 50 g', 1, 2.8, INGREDIENT, 'A'), line('Capsules 26 mm (200)', 1, 7.9, ['packaging', 'stock'], 'B'),
    line('Bouteilles 33 cl (24)', 1, 18.0, ['packaging', 'stock'], 'B'), line('Densimetre 1.000-1.100', 1, 14.5, EQUIP, 'B'), line('Eprouvette 250 ml', 1, 9.9, EQUIP, 'B'),
    line('Star San 237 ml', 1, 16.9, CONSUMABLE, 'B'), line('Tuyau silicone 8 mm 2 m', 1, 9.8, EQUIP, 'B'), line('Sac de brassage 40 cm', 1, 12.5, EQUIP, 'B'),
    line('Rabais carte fidelite', null, null, ['discount'], 'B', -5.0), line('Sachet papier', 1, 0.3, ['packaging', 'other', 'stock', 'unknown'], 'B')
  ],
  vat: [{ code: 'A', rate: 0.026, base: 78.36, tax: 2.04 }, { code: 'B', rate: 0.081, base: 78.45, tax: 6.35 }], total: 165.2,
  payment: ['TWINT CHF 165.20', 'Paye'], thanks: 'Bon brassage !'
};
const TICKET_ETRANGER = {
  id: 'ticket-etranger', vendorKey: 'Brauhandel Hochrhein', vendorPrinted: 'Brauhandel Hochrhein GmbH', address: ['Hopfenstrasse 3', 'D-79999 Grenzdorf', 'USt-IdNr. DE000111222'],
  date: '03.10.2026', time: '09:51', number: '20817', currency: 'EUR', labels: DE,
  items: [line('Weizenmalz 5 kg', 1, 13.9, INGREDIENT, 'A'), line('Hallertauer Tradition 100 g', 2, 5.45, INGREDIENT, 'A'), line('Hefe WB-06', 1, 4.29, INGREDIENT, 'A'),
    line('Gaerroehrchen', 2, 1.95, EQUIP, 'B'), line('Kronkorken 26 mm 200 St.', 1, 6.99, ['packaging', 'stock'], 'B'), line('Flaschenbuerste', 1, 15.99, EQUIP, 'B')],
  vat: [{ code: 'A', rate: 0.07, base: 27.19, tax: 1.9 }, { code: 'B', rate: 0.19, base: 22.59, tax: 4.29 }], total: 55.97,
  payment: ['Kartenzahlung CHF 52.33', 'Kurs 1 EUR = 0.9350 CHF', 'Betrag bezahlt'], thanks: 'Vielen Dank fuer Ihren Einkauf'
};
const TICKET_A = {
  id: 'deux-a', vendorKey: 'Quincaillerie du Moulin', vendorPrinted: 'Quincaillerie du Moulin', address: ['Chemin du Bief 2', '2996 Fictiville'],
  date: '30.09.2026', time: '14:12', number: '5120', currency: 'CHF', labels: FR,
  items: [line('Joint torique (10)', 1, 4.5, EQUIP), line('Collier de serrage', 2, 2.2, EQUIP), line('Robinet laiton', 1, 18.5, EQUIP)],
  vat: [{ code: 'B', rate: 0.081, base: 25.35, tax: 2.05 }], total: 27.4, payment: ['Carte Visa CHF 27.40'], thanks: 'Merci'
};
const TICKET_B = {
  id: 'deux-b', vendorKey: 'Boulangerie des Tilleuls', vendorPrinted: 'Boulangerie des Tilleuls', address: ['Rue Haute 7', '2996 Fictiville'],
  date: '30.09.2026', time: '08:03', number: '771', currency: 'CHF', labels: FR,
  items: [line('Pain complet', 1, 4.8, ['other', 'unknown']), line('Croissant', 2, 1.9, ['other', 'unknown'])],
  vat: [{ code: 'A', rate: 0.026, base: 8.38, tax: 0.22 }], total: 8.6, payment: ['Especes CHF 10.00', 'Rendu CHF 1.40'], thanks: 'Bonne journee'
};
// Les deux codes de TICKET_B portent sur A : le rendu les imprime tels quels.
TICKET_B.items.forEach(item => { item.vat = 'A'; });
const TICKET_FLOU = {
  id: 'illisible', vendorKey: 'Droguerie du Pont', vendorPrinted: 'Droguerie du Pont', address: ['Quai 1', '2995 Fictiville'],
  date: '05.10.2026', time: '16:40', number: '6602', currency: 'CHF', labels: FR,
  items: [line('Acide citrique 1 kg', 1, 9.8, CONSUMABLE), line('Percarbonate 1 kg', 1, 7.9, CONSUMABLE), line('Eponges (5)', 1, 8.2, CONSUMABLE)],
  vat: [{ code: 'B', rate: 0.081, base: 23.96, tax: 1.94 }], total: 25.9, payment: ['Carte CHF 25.90'], thanks: 'Merci'
};

const page = (title, rows) => `<div class="page"><div class="h">${esc(title)}</div><div class="tiny">${MARK}</div>${rows.map(([label, value]) => `<div class="kv"><span>${esc(label)}</span><span>${esc(value)}</span></div>`).join('')}</div>`;

const COA = page('Certificate of Analysis - Hop pellets T90', [['COA number', 'BENCH-COA-0031'], ['Variety', 'Cascade'], ['Lot number', 'BENCH-LOT-2025-031'], ['Harvest year', '2025'],
  ['Form', 'pellets T90'], ['Date of analysis', '2026-01-20'], ['Results (as is)', ''], ['Alpha acids (EBC 7.4, conductometric)', '6.8 % w/w'], ['Beta acids (EBC 7.7, HPLC)', '5.9 % w/w'],
  ['Total oil (EBC 7.10, distillation)', '1.1 mL/100 g'], ['Hop Storage Index (ASBC Hops-12)', '0.28'], ['Moisture', '8.9 % w/w']]);
const BULLETIN = `<div class="page"><div class="h">Malterie Fictive du Jura SA</div><div>Route des Orges 30, 2994 Fictiville</div><div class="tiny">${MARK}</div>
  <div class="h2">BULLETIN DE LIVRAISON BL-2026-0918</div>
  <div class="kv"><span>Date de livraison</span><span>18.09.2026</span></div><div class="kv"><span>N° de commande</span><span>CMD-55102</span></div><div class="kv"><span>N° client</span><span>C-2231</span></div>
  <table><tr><th>Article</th><th>Quantite</th><th>Unite</th></tr><tr><td>Malt Pilsner 25 kg</td><td>4</td><td>sacs</td></tr><tr><td>Malt Vienne 25 kg</td><td>1</td><td>sac</td></tr><tr><td>Houblon Perle pellets 1 kg</td><td>2</td><td>pces</td></tr></table>
  <div>Marchandise livree en bon etat. Facture suivra separement.</div><div>Signature du client : ____________</div></div>`;
const LABEL = `<div class="label"><div class="brand">L'Affinee</div><div class="beer">Saison du Moulin</div><div class="kv2"><span>6,2 % vol</span><span>33 cl</span></div>
  <div>Brassee a Fictiville · Lot 2026-17</div><div>A consommer de preference avant 09.2027</div><div>Ingredients : eau, malt d'orge, houblon, levure</div><div class="tiny">${MARK}</div></div>`;
const RECETTE = `<div class="card"><div class="h">Blonde du Moulin</div><div class="tiny">${MARK}</div>
  <div>Volume final : 20 L · DI 1.048 · DF 1.010</div><div class="h2">Grains</div><div>Malt Pilsner : 4,0 kg</div><div>Malt Munich : 0,5 kg</div>
  <div class="h2">Houblons</div><div>Saaz 3,5 % alpha : 30 g a 60 min (ebullition)</div><div>Saaz 3,5 % alpha : 20 g a 10 min (ebullition)</div>
  <div class="h2">Levure</div><div>SafAle US-05</div><div class="h2">Empatage</div><div>66 °C pendant 60 min</div><div>76 °C pendant 10 min</div></div>`;

const CSS = `body{margin:0;background:#8a7a66}#scene{display:inline-block;padding:60px;background:repeating-linear-gradient(90deg,#9b8a72 0 14px,#8f7f69 14px 31px)}
.ticket{width:360px;background:#fbfaf6;padding:22px 20px;font:15px/1.35 'Courier New',monospace;color:#1d1d1d;box-shadow:0 6px 18px rgba(0,0,0,.35)}
.c{text-align:center}.b{font-weight:bold}.big{font-size:18px}.small{font-size:13px;margin-top:8px}.tiny{font-size:10px;color:#666;margin-top:6px}
.r{display:flex;justify-content:space-between;gap:8px}.l{white-space:pre}.sep{border-top:1px dashed #555;margin:7px 0}
.page{width:620px;background:#fff;padding:40px;font:16px/1.6 Arial,sans-serif;color:#111;box-shadow:0 6px 18px rgba(0,0,0,.35)}
.h{font-size:22px;font-weight:bold;margin-bottom:6px}.h2{font-size:17px;font-weight:bold;margin-top:14px}.kv{display:flex;justify-content:space-between;border-bottom:1px solid #ddd}
table{border-collapse:collapse;margin:12px 0;width:100%}td,th{border:1px solid #444;padding:4px 8px;text-align:left}
.label{width:420px;height:300px;background:linear-gradient(135deg,#f2d27a,#d98b3a);border-radius:14px;padding:26px;font:16px/1.5 Georgia,serif;color:#2b1a08;box-shadow:0 6px 18px rgba(0,0,0,.35)}
.brand{font-size:34px;font-weight:bold}.beer{font-size:24px;font-style:italic;margin-bottom:10px}.kv2{display:flex;gap:40px;font-size:20px;font-weight:bold}
.card{width:520px;background:#fffdf3;padding:30px;font:17px/1.55 'Segoe Print','Comic Sans MS',cursive;color:#22314d;box-shadow:0 6px 18px rgba(0,0,0,.35)}
.pair{display:flex;gap:46px;align-items:flex-start}
.fold{position:relative}.fold::after{content:'';position:absolute;left:0;right:0;top:46%;height:26px;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.28) 45%,rgba(255,255,255,.35) 55%,rgba(0,0,0,0))}
.vignette{position:relative}.vignette::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 40% 35%,rgba(0,0,0,0) 30%,rgba(0,0,0,.55) 100%);pointer-events:none;z-index:2}`;

/** Une image : HTML de la scène, dégradation CSS, format, vérité (usage facture) et vérité du tri. */
function shots() {
  const net = receipt(TICKET_NET), sombre = receipt(TICKET_SOMBRE), long = receipt(TICKET_LONG), etranger = receipt(TICKET_ETRANGER);
  const a = receipt(TICKET_A), b = receipt(TICKET_B), flou = receipt(TICKET_FLOU);
  const none = { vendor: '', documentType: 'other', paymentEvidence: ['unknown'], date: '', currency: '', invoiceNumber: [''], orderNumber: '',
    amountHT: null, tvaRate: null, tvaAmount: null, amountTTC: null, items: [] };
  const route = (kind, extra = {}) => ({ kind: [kind], documentCount: 1, readable: true, currencies: ['CHF'], route: 'scan', ...extra });
  return [
    { id: 'ticket-net', level: 'simple', scene: net.html, style: '', type: 'png', facture: net.truth, triage: route('receipt') },
    { id: 'ticket-sombre-pli', level: 'très compliqué : de travers, plié, faible lumière', scene: `<div class="fold vignette">${sombre.html}</div>`,
      style: 'transform:perspective(900px) rotateX(9deg) rotate(-7deg);filter:brightness(.58) contrast(.78) sepia(.25) blur(.5px)', type: 'jpeg', quality: 62,
      facture: sombre.truth, triage: route('receipt') },
    { id: 'ticket-long-tva', level: 'très compliqué : ticket long (20 lignes), deux taux de TVA, remise', scene: long.html, style: 'transform:rotate(1.2deg)', type: 'png',
      facture: long.truth, triage: route('receipt') },
    { id: 'ticket-etranger', level: 'très compliqué : ticket allemand en EUR, deux taux, paiement converti en CHF', scene: etranger.html, style: 'transform:rotate(2deg);filter:sepia(.2)',
      type: 'jpeg', quality: 80, facture: etranger.truth, triage: route('receipt', { currencies: ['EUR', 'CHF'] }) },
    { id: 'deux-documents', level: 'très compliqué : deux tickets sur une seule image', scene: `<div class="pair"><div style="transform:rotate(-3deg)">${a.html}</div><div style="transform:rotate(4deg)">${b.html}</div></div>`,
      style: '', type: 'jpeg', quality: 80, facture: { ...a.truth, alternatives: [a.truth, b.truth] }, triage: route('receipt', { documentCount: 2, route: 'refuse' }) },
    { id: 'bulletin-photo', level: 'simple : bulletin de livraison sans prix, légèrement de travers', scene: BULLETIN, style: 'transform:rotate(2deg)', type: 'png',
      facture: { ...none, vendor: 'Malterie Fictive du Jura', documentType: 'delivery_note', date: '18.09.2026', invoiceNumber: ['', 'BL-2026-0918'], orderNumber: 'CMD-55102',
        items: [{ name: 'Malt Pilsner 25 kg', kind: INGREDIENT, quantity: 4, unit: 'sac', price: null, amountTTC: null },
          { name: 'Malt Vienne 25 kg', kind: INGREDIENT, quantity: 1, unit: 'sac', price: null, amountTTC: null },
          { name: 'Houblon Perle pellets 1 kg', kind: INGREDIENT, quantity: 2, unit: 'piece', price: null, amountTTC: null }] },
      triage: route('delivery_note', { currencies: [] }) },
    { id: 'coa-photo', level: 'tri : certificat d’analyse envoyé au lecteur de justificatifs', scene: COA, style: 'transform:rotate(-1.5deg)', type: 'png',
      facture: none, triage: route('coa', { currencies: [], route: 'coa' }) },
    { id: 'illisible', level: 'tri : ticket flou et sombre, illisible', scene: flou.html, style: 'transform:rotate(-10deg);filter:blur(6px) brightness(.35) contrast(.6)', type: 'jpeg', quality: 45,
      facture: { ...flou.truth, unreadable: true }, triage: { kind: ['unreadable'], documentCount: 1, readable: false, currencies: [], route: 'refuse' } },
    { id: 'hors-sujet', level: 'tri : étiquette de bière, aucun justificatif', scene: LABEL, style: 'transform:rotate(-2deg)', type: 'png',
      facture: none, triage: { kind: ['off_topic'], documentCount: 1, readable: true, currencies: [], route: 'refuse' } },
    { id: 'recette-photo', level: 'simple : recette métrique photographiée (import)', scene: RECETTE, style: 'transform:rotate(1deg)', type: 'png',
      import: { name: 'Blonde du Moulin', volumeL: 20, ogTarget: 1.048, fgTarget: 1.01,
        fermentables: [{ name: 'Pilsner', weightKg: 4 }, { name: 'Munich', weightKg: 0.5 }],
        hops: [{ name: 'Saaz', alpha: 3.5, weightG: 30, stage: 'boil', timeMin: 60 }, { name: 'Saaz', alpha: 3.5, weightG: 20, stage: 'boil', timeMin: 10 }],
        yeast: 'US-05', mashSteps: [{ tempC: 66, durationMin: 60 }, { tempC: 76, durationMin: 10 }] } }
  ];
}

const htmlOf = shot => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div id="scene"><div style="${shot.style}">${shot.scene}</div></div></body></html>`;
const fileOf = shot => `${shot.id}.${shot.type === 'jpeg' ? 'jpg' : 'png'}`;
const truthOf = shot => {
  const { scene: _s, style: _t, type: _y, quality: _q, ...rest } = shot;
  return `${JSON.stringify({ ...rest, file: `tests/fixtures/gemini-usage-bench/vision/${fileOf(shot)}`, mimeType: shot.type === 'jpeg' ? 'image/jpeg' : 'image/png', note: MARK }, null, 2)}\n`;
};
const sha = text => createHash('sha256').update(text).digest('hex');

async function main() {
  const check = process.argv.includes('--check');
  const all = shots();
  if (check) {
    const stale = all.filter(shot => {
      try {
        const manifest = JSON.parse(readFileSync(join(out, 'manifest.json'), 'utf8'));
        return readFileSync(join(out, `${shot.id}.truth.json`), 'utf8') !== truthOf(shot) || manifest[shot.id]?.html !== sha(htmlOf(shot));
      } catch { return true; }
    });
    if (stale.length) { console.error(`Fixtures vision périmées : ${stale.map(shot => shot.id).join(', ')}`); process.exit(1); }
    console.log(`Fixtures vision à jour (${all.length}).`);
    return;
  }
  const { default: puppeteer } = await import('puppeteer-core');
  mkdirSync(out, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--mute-audio', '--no-first-run', '--disable-extensions'] });
  const pid = browser.process()?.pid;
  console.log(`Chrome headless lancé, PID ${pid}`);
  const manifest = {};
  try {
    const tab = await browser.newPage();
    await tab.setRequestInterception(true);
    tab.on('request', request => (/^(about|data):/.test(request.url()) ? request.continue() : request.abort()));
    await tab.setViewport({ width: 1100, height: 1400, deviceScaleFactor: 1 });
    for (const shot of all) {
      const html = htmlOf(shot);
      await tab.setContent(html, { waitUntil: 'load' });
      const buffer = await (await tab.$('#scene')).screenshot({ type: shot.type, ...(shot.type === 'jpeg' ? { quality: shot.quality } : {}) });
      writeFileSync(join(out, fileOf(shot)), buffer);
      writeFileSync(join(out, `${shot.id}.truth.json`), truthOf(shot));
      manifest[shot.id] = { file: fileOf(shot), html: sha(html), image: sha(buffer), bytes: buffer.length };
      console.log(`${fileOf(shot)} : ${buffer.length} octets`);
    }
  } finally {
    await browser.close();
  }
  writeFileSync(join(out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Chrome fermé (PID ${pid}).`);
}

main().catch(error => { console.error(error); process.exit(1); });
