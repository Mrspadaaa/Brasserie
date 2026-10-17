/**
 * Images synthétiques difficiles du banc des usages complexes (AI07-C, confirmation demandée par #91) : six justificatifs
 * de plus, chacun avec un piège réel de lecture. Toutes les données sont inventées ; chaque image a sa vérité à côté
 * (`vision-2/<id>.truth.json`), écrite depuis les mêmes données que le rendu ; les totaux sont recalculés et comparés aux
 * montants imprimés. Même format de vérité que build-vision.mjs (clé `facture`, tri dans `triage`).
 *   node tests/fixtures/gemini-usage-bench/build-vision-2.mjs          (Chrome local headless : images, vérités, manifeste)
 *   node tests/fixtures/gemini-usage-bench/build-vision-2.mjs --check  (vérités et HTML à jour, sans Chrome)
 * Aucun réseau : HTML autonome, polices système, toute requête autre que about:/data: est bloquée.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'vision-2');
const MARK = 'FIXTURE DE TEST – document fictif';
const r2 = value => Math.round(value * 100) / 100;
const esc = text => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const dot = value => value.toFixed(2);
const comma = value => value.toFixed(2).replace('.', ',');

/** Ligne : désignation, quantité|null, prix|null, natures admises, code TVA, unité imprimée, montant imprimé si sans prix. */
const line = (name, quantity, price, kind, vat = 'B', unit = '', amount) => ({ name, quantity, price, kind, vat, unit, amount: amount ?? r2(quantity * price) });
const CONSUMABLE = ['stock', 'other', 'unknown'];
const INGREDIENT = ['stock'];
const EQUIP = ['equipment', 'stock', 'other', 'unknown'];

/** Contrôle des totaux : par code TVA, base + TVA = lignes ; TVA = base × taux à un centime près ; total = somme. */
function checkTotals(doc) {
  const byCode = {};
  for (const item of doc.items) byCode[item.vat] = r2((byCode[item.vat] ?? 0) + item.amount);
  const ttc = r2(Object.values(byCode).reduce((a, b) => a + b, 0));
  for (const row of doc.vat ?? []) {
    if (r2(row.base + row.tax) !== byCode[row.code]) throw new Error(`${doc.id} : code ${row.code}, base + TVA ≠ lignes`);
    if (Math.abs(r2(row.base * row.rate) - row.tax) > 0.0101) throw new Error(`${doc.id} : code ${row.code}, TVA mal arrondie`);
  }
  if (ttc !== doc.total) throw new Error(`${doc.id} : total ${ttc} ≠ ${doc.total}`);
  const ht = doc.vat?.length ? r2(doc.vat.reduce((a, row) => a + row.base, 0)) : null;
  const tva = doc.vat?.length ? r2(doc.vat.reduce((a, row) => a + row.tax, 0)) : null;
  if (ht !== null && r2(ht + tva) !== ttc) throw new Error(`${doc.id} : HT + TVA ≠ total`);
  return { ttc, ht, tva };
}

/** Ticket de caisse ; `cut` : le bas (totaux, TVA, paiement) est arraché et n'apparaît pas sur l'image. */
function receipt(doc) {
  const { ttc, ht, tva } = checkTotals(doc);
  const money = doc.money ?? dot, t = doc.labels;
  const rows = doc.items.map(item => `<div class="l">${esc(item.name)}</div>` + (item.quantity == null
    ? `<div class="r"><span></span><span>${money(item.amount)} ${item.vat}</span></div>`
    : `<div class="r"><span>${item.unit ? `${String(item.quantity).replace('.', doc.money === comma ? ',' : '.')} ${item.unit} x ${money(item.price)}` : `${item.quantity} x ${money(item.price)}`}</span><span>${money(item.amount)} ${item.vat}</span></div>`)).join('');
  const vatRows = (doc.vat ?? []).map(row => `<div class="r"><span>${row.code} ${(row.rate * 100).toFixed(1)}%</span><span>${money(row.base)}</span><span>${money(row.tax)}</span></div>`).join('');
  const bottom = doc.cut ? '<div class="torn"></div>' : `<div class="sep"></div>
    <div class="r b big"><span>${esc(t.total)} ${doc.currency}</span><span>${money(ttc)}</span></div>
    <div class="r"><span>${esc(t.vat)}</span><span>${esc(t.base)}</span><span>${esc(t.tax)}</span></div>${vatRows}
    <div class="r"><span>${esc(t.net)}</span><span>${money(ht)}</span><span>${money(tva)}</span></div>
    <div class="sep"></div>${doc.payment.map(text => `<div class="l">${esc(text)}</div>`).join('')}
    <div class="c small">${esc(doc.thanks)}</div><div class="c tiny">${MARK}</div>`;
  const html = `<div class="ticket ${doc.cls ?? ''}">
    <div class="c b">${esc(doc.vendorPrinted)}</div>${doc.address.map(text => `<div class="c">${esc(text)}</div>`).join('')}
    ${doc.cut ? `<div class="c tiny">${MARK}</div>` : ''}
    <div class="sep"></div><div class="r"><span>${esc(doc.date)} ${esc(doc.time)}</span><span>${esc(t.ticket)} ${esc(doc.number)}</span></div><div class="sep"></div>
    ${rows}${bottom}</div>`;
  const truth = {
    vendor: doc.vendorKey, documentType: 'receipt', paymentEvidence: doc.cut ? ['unknown'] : ['paid', 'unknown'], date: doc.date, currency: doc.currency,
    invoiceNumber: [doc.number, `${t.ticket} ${doc.number}`, ''], orderNumber: '',
    amountHT: doc.cut ? null : ht, tvaRate: doc.cut || doc.vat.length !== 1 ? null : doc.vat[0].rate, tvaAmount: doc.cut ? null : tva, amountTTC: doc.cut ? null : ttc,
    items: doc.items.map(item => ({ name: item.name, kind: item.kind, quantity: item.quantity, unit: item.unit, price: item.price, amountTTC: item.amount }))
  };
  return { html, truth };
}

const FR = { ticket: 'Ticket', total: 'TOTAL', vat: 'TVA', base: 'Base', tax: 'TVA', net: 'Total HT / TVA' };
const IT = { ticket: 'DOC. N.', total: 'TOTALE COMPLESSIVO', vat: 'IVA', base: 'Imponibile', tax: 'Imposta', net: 'Totale imponibile / IVA' };

const THERMIQUE = {
  id: 'ticket-thermique-pali', vendorKey: 'Epicerie du Lac', vendorPrinted: 'EPICERIE DU LAC SA', address: ['Quai des Brumes 3', '2993 Fictiville', 'CHE-000.555.666 TVA'],
  date: '08.10.2026', time: '18:22', number: '10442', currency: 'CHF', labels: FR, cls: 'faded',
  items: [line('Sucre de canne 1 kg', 1, 3.2, CONSUMABLE, 'A'), line('Miel de fleurs 500 g', 1, 9.8, CONSUMABLE, 'A'), line('Citrons bio', 0.452, 16.64, CONSUMABLE, 'A', 'kg'),
    line('Eponges (3)', 1, 4.51, CONSUMABLE, 'B'), line('Sac cabas', 1, 6.3, ['packaging', 'other', 'unknown', 'equipment'], 'B')],
  vat: [{ code: 'A', rate: 0.026, base: 20.0, tax: 0.52 }, { code: 'B', rate: 0.081, base: 10.0, tax: 0.81 }], total: 31.33,
  payment: ['Carte debit CHF 31.33', 'Paye'], thanks: 'Merci et a bientot'
};
const FROISSE = {
  id: 'ticket-froisse-ombre', vendorKey: 'Cave et Brasserie du Rhone', vendorPrinted: 'CAVE & BRASSERIE DU RHONE', address: ['Route du Fleuve 41', '2992 Fictiville', 'CHE-000.777.888 TVA'],
  date: '12.10.2026', time: '11:05', number: '7731', currency: 'CHF', labels: FR, cls: 'crumple',
  items: [line('Malt Pilsner 25 kg', 1, 52.0, INGREDIENT, 'A'), line('Houblon Saaz 500 g', 1, 24.5, INGREDIENT, 'A'), line('Levure W-34/70 11.5 g', 4, 5.9, INGREDIENT, 'A'),
    line('Fut inox 20 L', 1, 89.0, ['equipment', 'packaging'], 'B'), line('Joints de fut (5)', 1, 7.5, ['equipment', 'maintenance', 'stock', 'other', 'unknown'], 'B')],
  vat: [{ code: 'A', rate: 0.026, base: 97.56, tax: 2.54 }, { code: 'B', rate: 0.081, base: 89.27, tax: 7.23 }], total: 196.6,
  payment: ['Carte Visa CHF 196.60', 'Transaction acceptee'], thanks: 'Bon brassage'
};
const COUPE = {
  id: 'ticket-coupe', vendorKey: 'Quincaillerie Centrale', vendorPrinted: 'QUINCAILLERIE CENTRALE', address: ['Grand-Rue 18', '2991 Fictiville', 'Prix en CHF, TVA comprise'],
  date: '09.10.2026', time: '15:47', number: '33018', currency: 'CHF', labels: FR, cut: true,
  items: [line('Tuyau PVC 12 mm', 3, 2.4, EQUIP, 'B'), line('Collier inox 16-27', 4, 1.8, EQUIP, 'B'), line('Vanne 1/2 pouce', 1, 14.9, EQUIP, 'B'),
    line('Ruban teflon', 1, 2.5, EQUIP, 'B'), line('Bac plastique 40 L', 1, 12.9, EQUIP, 'B')],
  vat: [], total: 44.7, payment: [], thanks: ''
};
const ITALIEN = {
  id: 'ticket-italien-eur', vendorKey: 'Enoteca del Borgo', vendorPrinted: 'ENOTECA DEL BORGO S.R.L.', address: ['Via dei Mulini 8', 'I-22999 Fittizia (CO)', 'P.IVA 00000000000'],
  date: '06.10.2026', time: '19:12', number: '0042-0117', currency: 'EUR', labels: IT, money: comma,
  items: [line('Birra artigianale IPA 33cl', 6, 3.5, ['other', 'stock', 'unknown']), line('Bicchieri degustazione', 2, 4.9, ['equipment', 'other', 'unknown']),
    line('Sacchetto', 1, 0.2, ['packaging', 'other', 'unknown'])],
  vat: [{ code: 'B', rate: 0.22, base: 25.41, tax: 5.59 }], total: 31.0,
  payment: ['Contanti EUR 40,00', 'Resto EUR 9,00'], thanks: 'Grazie e arrivederci'
};

/** Facture A4 photographiée : prix et montants TTC, remise, déplacement, TVA comprise, payable à 30 jours (non payée). */
function invoiceA4() {
  const items = [
    { name: "Main d'oeuvre reparation pompe", quantity: 2.5, unit: 'h', price: 95.0, kind: ['maintenance', 'service'] },
    { name: 'Garniture mecanique 25 mm', quantity: 1, unit: 'pce', price: 64.0, kind: ['maintenance', 'equipment'] },
    { name: 'Raccord Tri-Clamp 1.5 pouce', quantity: 2, unit: 'pce', price: 18.5, kind: ['equipment', 'maintenance'] },
    { name: 'Frais de deplacement', quantity: 1, unit: 'forfait', price: 45.0, kind: ['service', 'shipping', 'maintenance'] }
  ].map(item => ({ ...item, amount: r2(item.quantity * item.price) }));
  const gross = r2(items.reduce((a, item) => a + item.amount, 0));
  const discount = -r2(gross * 0.05);
  items.push({ name: 'Remise fidelite 5 %', quantity: null, unit: '', price: null, kind: ['discount'], amount: discount });
  const ttc = r2(gross + discount);
  const tva = r2(ttc * 0.081 / 1.081), ht = r2(ttc - tva);
  if (ttc !== 364.32 || tva !== 27.3 || Math.abs(r2(ht * 0.081) - tva) > 0.0101) throw new Error(`facture-a4-photo : totaux ${ttc} / ${tva}`);
  const rows = items.map(item => `<tr><td>${esc(item.name)}</td><td>${item.quantity ?? ''}</td><td>${esc(item.unit)}</td><td>${item.price == null ? '' : dot(item.price)}</td><td>${dot(item.amount)}</td></tr>`).join('');
  const html = `<div class="page shot"><div class="h">Atelier Inox Fictif Sarl</div><div>Chemin des Soudeurs 6, 2990 Fictiville · CHE-000.999.000 TVA</div><div class="tiny">${MARK}</div>
    <div class="cols"><div>Brasserie L'Affinee<br>Rue de la Cuve 1<br>2999 Fictiville</div><div><b>FACTURE N° F-2026-1042</b><br>Date : 02.10.2026<br>Votre commande : CMD-8812</div></div>
    <table><tr><th>Designation</th><th>Qte</th><th>Unite</th><th>Prix TTC CHF</th><th>Montant TTC CHF</th></tr>${rows}</table>
    <div class="kv"><span>Total TTC CHF</span><span>${dot(ttc)}</span></div><div class="kv"><span>dont TVA 8.1 %</span><span>${dot(tva)}</span></div><div class="kv"><span>Total HT CHF</span><span>${dot(ht)}</span></div>
    <div class="h2">Montant a payer : CHF ${dot(ttc)}</div><div>Payable a 30 jours net. IBAN CH00 0000 0000 0000 0000 0</div></div>`;
  const truth = {
    vendor: 'Atelier Inox Fictif', documentType: 'invoice', paymentEvidence: ['unpaid', 'unknown'], date: '02.10.2026', currency: 'CHF',
    invoiceNumber: ['F-2026-1042'], orderNumber: 'CMD-8812', amountHT: ht, tvaRate: 0.081, tvaAmount: tva, amountTTC: ttc,
    items: items.map(item => ({ name: item.name, kind: item.kind, quantity: item.quantity, unit: item.unit, price: item.price, amountTTC: item.amount }))
  };
  return { html, truth };
}

/** Quittance manuscrite : non assujetti à la TVA (aucun taux ni montant de TVA), « 85.- », payée comptant. */
function handwritten() {
  const items = [
    { name: 'Reparation pompe circulation', quantity: 1, unit: '', price: 85.0, amount: 85.0, kind: ['maintenance', 'service'] },
    { name: 'Joint torique', quantity: 2, unit: '', price: 3.5, amount: 7.0, kind: ['maintenance', 'equipment', 'stock', 'other', 'unknown'] }
  ];
  const ttc = r2(items.reduce((a, item) => a + item.amount, 0));
  if (ttc !== 92) throw new Error('quittance-manuscrite : total');
  const html = `<div class="card hand"><div class="h">Quittance n° 57</div><div class="tiny">${MARK}</div>
    <div>Jean Moret · petite mecanique · Fictiville</div><div>Non assujetti a la TVA</div><br>
    <div>Pour : Brasserie L'Affinee</div><br>
    <div>1 x Reparation pompe circulation ....... 85.-</div><div>2 x Joint torique a 3.50 ....... 7.-</div><br>
    <div class="h2">Total CHF 92.-</div><div>Paye comptant, le 11.10.2026</div><div class="sig">J. Moret</div></div>`;
  const truth = {
    vendor: 'Jean Moret', documentType: 'receipt', paymentEvidence: ['paid', 'unknown'], date: '11.10.2026', currency: 'CHF',
    invoiceNumber: ['57', 'n° 57', 'Quittance n° 57', 'Quittance 57', ''], orderNumber: '', amountHT: null, tvaRate: null, tvaAmount: null, amountTTC: ttc,
    items: items.map(item => ({ name: item.name, kind: item.kind, quantity: item.quantity, unit: item.unit, price: item.price, amountTTC: item.amount }))
  };
  return { html, truth };
}

const CSS = `body{margin:0;background:#7d6f5c}#scene{display:inline-block;padding:60px;background:repeating-linear-gradient(90deg,#9b8a72 0 14px,#8f7f69 14px 31px)}
.ticket{position:relative;width:360px;background:#fbfaf6;padding:22px 20px;font:15px/1.35 'Courier New',monospace;color:#1d1d1d;box-shadow:0 6px 18px rgba(0,0,0,.35)}
.c{text-align:center}.b{font-weight:bold}.big{font-size:18px}.small{font-size:13px;margin-top:8px}.tiny{font-size:10px;color:#666;margin-top:6px}
.r{display:flex;justify-content:space-between;gap:8px}.l{white-space:pre}.sep{border-top:1px dashed #555;margin:7px 0}
.faded{color:#9a9a96;background:#f4f2ea}.faded::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,255,255,0) 35%,rgba(250,249,244,.72) 100%);pointer-events:none}
.crumple::after{content:'';position:absolute;inset:0;pointer-events:none;background:
 linear-gradient(17deg,rgba(0,0,0,0) 30%,rgba(0,0,0,.20) 31%,rgba(255,255,255,.35) 32.5%,rgba(0,0,0,0) 34%),
 linear-gradient(-23deg,rgba(0,0,0,0) 55%,rgba(0,0,0,.22) 56%,rgba(255,255,255,.30) 57.5%,rgba(0,0,0,0) 59%),
 linear-gradient(81deg,rgba(0,0,0,0) 62%,rgba(0,0,0,.16) 63%,rgba(255,255,255,.25) 64%,rgba(0,0,0,0) 65.5%),
 radial-gradient(ellipse at 95% 105%,rgba(0,0,0,.62) 0,rgba(0,0,0,.35) 30%,rgba(0,0,0,0) 55%)}
.torn{height:22px;margin:6px -20px -22px;background:linear-gradient(135deg,#fbfaf6 25%,transparent 25%) -11px 0/22px 22px,linear-gradient(225deg,#fbfaf6 25%,transparent 25%) -11px 0/22px 22px}
.page{position:relative;width:660px;background:#fff;padding:40px;font:15px/1.55 Arial,sans-serif;color:#111;box-shadow:0 6px 18px rgba(0,0,0,.35)}
.shot::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(160deg,rgba(0,0,0,0) 40%,rgba(0,0,0,.30) 100%)}
.h{font-size:22px;font-weight:bold;margin-bottom:6px}.h2{font-size:17px;font-weight:bold;margin-top:14px}.kv{display:flex;justify-content:space-between;border-bottom:1px solid #ddd}
.cols{display:flex;justify-content:space-between;margin:16px 0}
table{border-collapse:collapse;margin:12px 0;width:100%}td,th{border:1px solid #444;padding:4px 8px;text-align:left}
.card{width:540px;background:#fffdf3;padding:30px;font:18px/1.6 'Segoe Print','Comic Sans MS',cursive;color:#1f2f5a;box-shadow:0 6px 18px rgba(0,0,0,.35)}
.hand{background:repeating-linear-gradient(180deg,#fffdf3 0 28px,#c9d6ec 28px 29px)}.sig{margin-top:18px;font-size:26px;transform:rotate(-6deg);display:inline-block}`;

/** Une image : HTML de la scène, dégradation, format, vérité (usage facture) et vérité du tri. */
export function shots() {
  const thermique = receipt(THERMIQUE), froisse = receipt(FROISSE), coupe = receipt(COUPE), italien = receipt(ITALIEN), a4 = invoiceA4(), quittance = handwritten();
  const route = (kind, extra = {}) => ({ kind: [kind], documentCount: 1, readable: true, currencies: ['CHF'], route: 'scan', ...extra });
  return [
    { id: 'ticket-thermique-pali', level: 'très compliqué : papier thermique pâli à droite, deux taux, article au poids (kg)', scene: thermique.html,
      style: 'transform:rotate(-3deg);filter:contrast(.62) brightness(1.08) blur(.45px)', type: 'jpeg', quality: 55, facture: thermique.truth, triage: route('receipt') },
    { id: 'ticket-froisse-ombre', level: 'très compliqué : froissé, plis, ombre de main, perspective, deux taux', scene: froisse.html,
      style: 'transform:perspective(800px) rotateY(16deg) rotateX(6deg) rotate(6deg);filter:brightness(.82) contrast(.9)', type: 'jpeg', quality: 60, facture: froisse.truth, triage: route('receipt') },
    { id: 'ticket-coupe', level: 'très compliqué : bas du ticket arraché, totaux et paiement absents (rien à calculer)', scene: coupe.html,
      style: 'transform:rotate(2.5deg)', type: 'jpeg', quality: 75, facture: coupe.truth, triage: route('receipt') },
    { id: 'ticket-italien-eur', level: 'très compliqué : ticket italien en EUR, virgule décimale, IVA 22 %', scene: italien.html,
      style: 'transform:rotate(-5deg);filter:sepia(.25)', type: 'jpeg', quality: 75, facture: italien.truth, triage: route('receipt', { currencies: ['EUR'] }) },
    { id: 'facture-a4-photo', level: 'très compliqué : facture A4 photographiée de biais, montants TTC, remise, déplacement, payable à 30 jours', scene: a4.html,
      style: 'transform:perspective(1000px) rotateX(13deg) rotate(-4deg)', type: 'jpeg', quality: 70, facture: a4.truth, triage: route('invoice') },
    { id: 'quittance-manuscrite', level: 'très compliqué : quittance manuscrite, non assujetti à la TVA, « 92.- »', scene: quittance.html,
      style: 'transform:rotate(3deg)', type: 'png', facture: quittance.truth, triage: route('receipt', { kind: ['receipt', 'invoice', 'other_expense'] }) }
  ];
}

const htmlOf = shot => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div id="scene"><div style="${shot.style}">${shot.scene}</div></div></body></html>`;
const fileOf = shot => `${shot.id}.${shot.type === 'jpeg' ? 'jpg' : 'png'}`;
const truthOf = shot => {
  const { scene: _s, style: _t, type: _y, quality: _q, ...rest } = shot;
  return `${JSON.stringify({ ...rest, file: `tests/fixtures/gemini-usage-bench/vision-2/${fileOf(shot)}`, mimeType: shot.type === 'jpeg' ? 'image/jpeg' : 'image/png', note: MARK }, null, 2)}\n`;
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
    if (stale.length) { console.error(`Fixtures vision-2 périmées : ${stale.map(shot => shot.id).join(', ')}`); process.exit(1); }
    console.log(`Fixtures vision-2 à jour (${all.length}).`);
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

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error); process.exit(1); });
