// Fixtures fictives du QR-facture (voie qr-app) : « Malterie Fictive SA », F-1001, 110,40 CHF, 12.10.2026. Aucune valeur de ses pièces.
// IBAN et référence : les exemples PUBLICS des Swiss Implementation Guidelines QR-bill (SIX), comme tests/unit/depense/qr/aide.ts.
// Le QR-facture est dessiné par `swissqrbill/svg` (vrai SPC 0200, avec l'information S1 en fin de charge) ; Chrome (puppeteer-core) le rend en image et en PDF.
// Usage : node generer.mjs <dossier de sortie>
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = path.dirname(fileURLToPath(import.meta.url));
const racine = path.resolve(ici, '..', '..', '..', '..', '..');
const require = createRequire(path.join(racine, 'package.json'));
const puppeteer = require('puppeteer-core');
const { SwissQRBill } = require('swissqrbill/svg');
const sortie = path.resolve(process.argv[2] || path.join(ici, 'sortie'));
fs.mkdirSync(sortie, { recursive: true });
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const base = {
  currency: 'CHF',
  creditor: { account: 'CH4431999123000889012', name: 'Malterie Fictive SA', address: 'Route de la Malterie', buildingNumber: '1', zip: '1000', city: 'Lausanne', country: 'CH' },
  reference: '210000000003139471430009017',
};
const factures = {
  // Le QR dit 110,40 ; la lecture simulée dira tantôt 110,40 (confirme), tantôt 110,04 (contredit).
  complet: { ...base, amount: 110.4, additionalInformation: '//S1/10/F-1001/11/261012/32/8.1/40/0:30' },
  // Un bulletin sans montant (don ouvert) : ni S1, ni montant ; le QR porte devise, créancier, IBAN, référence.
  ouvert: { ...base },
};
const svg = (data) => new SwissQRBill(data, { language: 'FR' }).toString();

const lignes = [['Maris Otter (sac 25 kg)', '52,50'], ['Mouture', '3,75'], ['Pilsner Malz (sac 10 kg)', '18,00'], ['Carafa II (2 kg)', '6,40'], ['Citra 12,5 % (100 g)', '9,80'], ['Safale US-05 (2 sachets)', '9,20'], ['Port', '10,75']];
const page1 = `<section class="p"><h1>Malterie Fictive SA</h1><p class="s">Route de la Malterie 1 · 1000 Lausanne</p>
  <h2>Facture F-1001</h2><p>Date : 12.10.2026 · Paiement à 30 jours</p>
  <table>${lignes.map(([n, m]) => `<tr><td>${n}</td><td class="m">${m}</td></tr>`).join('')}<tr class="t"><td>Total TTC CHF</td><td class="m">110,40</td></tr></table></section>`;
const page2 = (qr, abime) => `<section class="p b"><p class="s">Facture F-1001 · section de paiement</p>${qr ? `<div class="bill">${svg(qr)}${abime ? '<div class="tampon">PAYÉ ?</div>' : ''}</div>` : ''}</section>`;
const html = (corps) => `<!doctype html><meta charset="utf-8"><style>
@page{size:A4;margin:0}*{box-sizing:border-box}html,body{margin:0;background:#fff;color:#111;font-family:Arial,Helvetica,sans-serif}
.p{width:210mm;height:297mm;padding:18mm 16mm;position:relative;page-break-after:always;overflow:hidden}.p:last-child{page-break-after:auto}
h1{font-size:20pt;margin:0}h2{font-size:14pt;margin-top:14mm}.s{font-size:9pt;color:#555}
table{width:100%;border-collapse:collapse;margin-top:8mm;font-size:10pt}td{padding:2mm 0;border-bottom:.2mm solid #bbb}.m{text-align:right;font-variant-numeric:tabular-nums}.t td{font-weight:700;border-top:.4mm solid #111}
.b{padding:0}.b .s{padding:16mm 16mm 0}.bill{position:absolute;left:0;bottom:0;width:210mm;height:105mm}.bill svg{width:210mm;height:105mm;display:block}
.tampon{position:absolute;left:75mm;top:27mm;width:30mm;height:30mm;background:#1a1a1a;border-radius:2mm;transform:rotate(-8deg);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13pt;opacity:.97}
</style>${corps}`;

const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
try {
  const p = await nav.newPage();
  const photo = async (corps, nom, largeur = 794) => {
    await p.setViewport({ width: largeur, height: Math.round(largeur * 1.4142), deviceScaleFactor: 1.5 });
    await p.setContent(html(corps), { waitUntil: 'load' });
    await p.screenshot({ path: path.join(sortie, nom), type: 'png' });
  };
  await photo(page2(factures.complet, false), 'facture-qr.png');
  await photo(page2(factures.ouvert, false), 'facture-qr-ouvert.png');
  // Le QR est vu mais abîmé : un tampon sombre couvre une grande part de la grille et un repère.
  await photo(page2(factures.complet, true), 'facture-qr-abime.png');
  await photo(page1, 'facture-sans-qr.png');
  await p.setContent(html(page1 + page2(factures.complet, false)), { waitUntil: 'load' });
  await p.pdf({ path: path.join(sortie, 'facture-qr.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
  // Deux autres PDF : sans QR, et un PDF dont le QR est sur l'avant-dernière page (une page de conditions suit).
  await p.setContent(html(page1), { waitUntil: 'load' });
  await p.pdf({ path: path.join(sortie, 'facture-sans-qr.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
  fs.writeFileSync(path.join(sortie, 'charge-complet.txt'), 'SVG de swissqrbill, donnees : ' + JSON.stringify(factures.complet) + '\n');
} finally { await nav.close(); }
for (const f of fs.readdirSync(sortie)) console.log(f, fs.statSync(path.join(sortie, f)).size);
