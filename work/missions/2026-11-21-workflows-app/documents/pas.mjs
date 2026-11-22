// Chaîne DOCUMENTS (21.11) : une suite de gestes au doigt, 390×844 tactile, sur la fixture ZZ TEST (fixtureChaines de port-carnet),
// build de test d'une copie propre de HEAD (os.tmpdir()/wfd-build), lecture de pièce SIMULÉE (banc ../acheter/banc.mjs : jamais Gemini).
// `node pas.mjs <nom> <lecture> <gestes…>` ; lecture : facture | ticket | passee | aucune.
// Gestes : « Texte » (exact), « ~texte » (contient), « ^texte » (début), « fichier:Texte » (touche et donne une image au sélecteur),
// « cap:nom », « voir:regex » (lignes du texte de la page), « boutons », « wait:ms », « defiler:px », « taper:css=texte », « horsligne ».
import path from 'node:path'; import fs from 'node:fs'; import os from 'node:os';
import { lancer, sleep } from '../acheter/banc.mjs';
import { fixtureChaines } from '../../../../../port-carnet/scripts/parcours/fixtures/chaines.mjs';
const auj = new Date().toISOString().slice(0, 10);
const jour = (n) => new Date(Date.parse(`${auj}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const LECTURES = {
  facture: { documentType: 'invoice', paymentEvidence: 'unpaid', paymentMethod: 'bank_transfer', vendor: 'ZZ TEST Brouwland', date: auj, currency: 'CHF', invoiceNumber: 'ZZ-BW-1142',
    amountHT: 389.98, tvaRate: 0.081, tvaAmount: 31.59, amountTTC: 421.57, category: 'brassage', description: 'Matières premières',
    items: [{ name: 'ZZ TEST Malt pilsner 25 kg', kind: 'stock', quantity: 1, unit: 'sac 25 kg', price: 49.5, amountTTC: 53.51, stockCategory: 'Malt' },
      { name: 'ZZ TEST Citra 2025', kind: 'stock', quantity: 500, unit: 'g', price: 0.62, amountTTC: 335.11, stockCategory: 'Houblon', alphaPct: 12.8 },
      { name: 'ZZ TEST US-05 11,5 g', kind: 'stock', quantity: 6, unit: 'sachet', price: 5.2, amountTTC: 32.95, stockCategory: 'Levure' }], issues: [] },
  ticket: { documentType: 'receipt', paymentEvidence: 'paid', paymentMethod: 'card', vendor: 'ZZ TEST Landi', date: jour(-3), currency: 'CHF', amountPaid: 24.9,
    amountHT: 23.03, tvaRate: 0.081, tvaAmount: 1.87, amountTTC: 24.9, category: 'nettoyage', description: 'Soude',
    items: [{ name: 'ZZ TEST Soude caustique 2 kg', kind: 'stock', quantity: 2, unit: 'kg', price: 12.45, amountTTC: 24.9, stockCategory: 'CIP alcalin' }], issues: [] },
  ofdf: { documentType: 'invoice', paymentEvidence: 'paid', paymentMethod: 'bank_transfer', vendor: 'ZZ TEST OFDF', date: auj, currency: 'CHF', invoiceNumber: 'ZZ-OFDF-Q4',
    amountHT: 37.37, tvaRate: 0, tvaAmount: 0, amountTTC: 37.37, category: 'chargesFixes', description: 'Impôt sur la bière', items: [], issues: [] },
  passee: { documentType: 'invoice', paymentEvidence: 'paid', paymentMethod: 'bank_transfer', vendor: 'ZZ TEST Brewferm', date: jour(-24), currency: 'CHF', invoiceNumber: 'ZZ-BF-77',
    amountHT: 416.28, tvaRate: 0.081, tvaAmount: 33.72, amountTTC: 450, category: 'materiel', description: 'Pompe de transfert',
    items: [{ name: 'ZZ TEST Pompe de transfert', kind: 'equipment', quantity: 1, unit: 'pce', price: 450, amountTTC: 450 }], issues: [] }
};
const [nom = 'essai', lec = 'aucune', ...gestes] = process.argv.slice(2);
const S = path.join(os.tmpdir(), 'wfd-sortie', nom); fs.mkdirSync(S, { recursive: true });
const photo = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), 'piece.png');
const fx = fixtureChaines(auj).entrees.map((e) => e.name === 'stockItems' && e.id === 'ZZ-PILS' ? { ...e, data: { ...e.data, currentStock: 5 } } : e);
const b = await lancer({ build: path.join(os.tmpdir(), 'wfd-build'), fixture: fx, lecture: LECTURES[lec] ?? null, sortie: S });
const log = (...a) => console.log(...a);
try {
  log('ouverture ms', await b.ouvrir());
  for (const g of gestes) {
    if (g.startsWith('cap:')) { log('cap', path.basename(await b.cap(g.slice(4)))); continue; }
    if (g.startsWith('voir:')) { const r = new RegExp(g.slice(5), 'i'); log(`[voir ${g.slice(5)}]`, (await b.texte()).split('\n').filter((l) => r.test(l)).slice(0, 14).join(' | ')); continue; }
    if (g === 'boutons') { log('[boutons]', (await b.boutons()).filter((l) => !/«(Bord|Finances|Calendrier|Brassins|Stocks|Clients)»/.test(l)).slice(0, 40).join(' ; ')); continue; }
    if (g === 'texte') { log('[texte]', (await b.texte()).slice(0, 1800)); continue; }
    if (g === 'horsligne') { await b.p.evaluate(() => { window.__horsLigne = true; }); continue; }
    if (g.startsWith('wait:')) { await sleep(Number(g.slice(5))); continue; }
    if (g.startsWith('defiler:')) { await b.p.evaluate((y) => { const s = [...document.querySelectorAll('*')].filter((x) => x.scrollHeight > x.clientHeight + 40 && /auto|scroll/.test(getComputedStyle(x).overflowY)).pop(); (s || document.scrollingElement).scrollBy(0, y); }, Number(g.slice(8))); await sleep(400); continue; }
    if (g.startsWith('taper:')) { const [sel, t] = g.slice(6).split('='); await b.taper(sel, t); continue; }
    if (g.startsWith('fichier:')) {
      const [fc] = await Promise.all([b.p.waitForFileChooser({ timeout: 8000 }).catch(() => null), b.toucher(g.slice(8), { contient: true })]);
      if (!fc) throw new Error('aucun sélecteur de fichier'); await fc.accept([photo]); await sleep(3500); await b.calme(3000); continue;
    }
    await b.toucher(g.replace(/^[~^]/, ''), { contient: g.startsWith('~'), prefixe: g.startsWith('^') });
  }
} catch (e) { log('ERR', e.message.slice(0, 200)); log('cap', path.basename(await b.cap('erreur'))); log('[boutons]', (await b.boutons()).slice(0, 40).join(' ; ')); }
log('gestes', b.gestes(), 'ai', b.journal.ai.join(','), 'erreurs', b.journal.erreurs.filter((x) => !/ERR_FAILED|net::/.test(x)).slice(0, 4).join(' || '));
await b.fin();
