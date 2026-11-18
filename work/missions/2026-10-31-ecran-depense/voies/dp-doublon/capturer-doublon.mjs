#!/usr/bin/env node
// Voie dp-doublon : une pièce déjà saisie se voit tout de suite, avec ce à quoi elle est liée. Vrai rendu de la feuille « Nouvelle dépense ».
// Fixtures seulement (`?dev-local`, cache mémoire de FirestoreRepo) : une dépense fictive dont l'empreinte est celle de `fixtures/facture-fictive-7001.pdf`,
// liée à deux articles de stock fictifs. Le fichier est joint par l'`input` de la feuille. Gemini n'est JAMAIS appelé : `scanDocument` est remplacé
// dans la page par une lecture SIMULÉE (comptée), et toute requête `aiTask` est comptée puis bloquée.
// Usage (le serveur tourne dans le dossier de travail, jamais dans Documents/Brasserie) :
//   node scripts/with_server.mjs --server "npm run dev -- --port 5631 --strictPort" --port 5631 --env VITE_FIREBASE_API_KEY=fake \
//     -- node work/missions/2026-10-31-ecran-depense/voies/dp-doublon/capturer-doublon.mjs [--sortie=<dossier>]
// Sortie : « DOUBLON OK » (code 0) seulement si la section certaine est visible, les noms des articles lus et aucune requête aiTask partie ; sinon « DOUBLON ECHEC n ».
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const RACINE = path.resolve(import.meta.dirname, '..', '..', '..', '..', '..');
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const argv = process.argv.slice(2);
const valeur = (n) => argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const port = (process.env.WITH_SERVER_PORTS ?? '').split(',')[0];
const ADRESSE = (valeur('url') ?? `http://localhost:${port}`).replace(/\/$/, '');
const SORTIE = path.resolve(valeur('sortie') ?? path.join(import.meta.dirname, 'captures'));
fs.mkdirSync(SORTIE, { recursive: true });
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const MODES = [
  { id: '390', l: 390, h: 844, tactile: true, echelle: 2 },
  { id: '1280', l: 1280, h: 800, tactile: false, echelle: 1 },
];

// ---- Les fichiers fictifs : la facture PDF (déjà saisie) et la page web de la même commande (autres octets).
const FIX = path.join(import.meta.dirname, 'fixtures');
fs.mkdirSync(FIX, { recursive: true });
const pdf = (texte) => `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\n% ${texte}\ntrailer<</Root 1 0 R>>\n%%EOF\n`;
const FACTURE = path.join(FIX, 'facture-fictive-7001.pdf'), PAGE = path.join(FIX, 'commande-fictive-7001-page.pdf');
fs.writeFileSync(FACTURE, pdf('Facture fictive F-1001 · commande CMD-7001 · données synthétiques'));
fs.writeFileSync(PAGE, pdf('Page de commande fictive CMD-7001 · sans numéro de facture · données synthétiques'));
const EMPREINTE = crypto.createHash('sha256').update(fs.readFileSync(FACTURE)).digest('hex');

const DEPENSE = {
  id: 'TX-fictive-1', date: '12.10.2026', amountTTC: 90, amountHT: 90, tvaRate: 0, description: 'Malt et houblons · F-1001', category: 'brassage', subcategory: 'Matières premières',
  finance: { version: 1, kind: 'expense', amountCents: 9000, vendor: 'Malterie Fictive SA', invoiceNumber: 'F-1001', sourceOrderNumber: 'CMD-7001', paymentStatus: 'unpaid', sourceDocumentHash: EMPREINTE,
    recordedAt: new Date(Date.now() - 2 * 86400000).toISOString(), proofDocumentId: 'proof-fictif',
    lines: [
      { id: 'l1', description: 'Maris Otter 25 kg', kind: 'ingredient', amountCents: 6000, quantity: 25, unit: 'kg', stockItemRef: 'MP-FICT-MO' },
      { id: 'l2', description: 'Citra T90 100 g', kind: 'ingredient', amountCents: 3000, quantity: 100, unit: 'g', stockItemRef: 'MP-FICT-CI' },
      // Les lignes font le total (60 + 30 = 90,00), comme l'enregistrement l'exige ; pas de frais de port (pilote, 01.11 : l'ancien port de 222,40 comblait un total de 312,40).
    ] },
};
const ARTICLES = [
  { ref: 'MP-FICT-MO', id: 'MP-FICT-MO', name: 'Maris Otter', unit: 'kg', category: 'Malt', currentStock: 25, minStock: 0, kind: 'rawMaterials' },
  { ref: 'MP-FICT-CI', id: 'MP-FICT-CI', name: 'Citra 12.5%', unit: 'g', category: 'Houblon', currentStock: 100, minStock: 0, kind: 'rawMaterials' },
];
const lecture = (plus) => ({ ok: true, model: 'simule', cached: false, result: { vendor: 'Malterie Fictive SA', date: '14.10.2026', currency: 'CHF', invoiceNumber: 'F-1001', orderNumber: 'CMD-7001', description: 'Malt et houblons',
  amountHT: null, tvaRate: null, tvaAmount: null, amountTTC: 90, category: 'brassage', subcategory: 'Matières premières', issues: [], documentType: 'invoice',
  items: [{ id: 'i1', name: 'Maris Otter', kind: 'stock', quantity: 25, unit: 'kg', amountTTC: 60, evidence: 'Maris Otter 25 kg' }, { id: 'i2', name: 'Citra T90', kind: 'stock', quantity: 100, unit: 'g', amountTTC: 30, evidence: 'Citra T90 100 g' }], ...plus } });
// La lecture du même fichier dit ce que dit la dépense de la fixture : 12.10.2026, à payer (critique, 01.11 : il compare les chiffres). La page web : 14.10, autre total.
const LECTURES = { 'facture-fictive-7001.pdf': lecture({ date: '12.10.2026', paymentEvidence: 'unpaid' }),'commande-fictive-7001-page.pdf': lecture({ invoiceNumber: '', amountTTC: 90.25, documentType: 'order_confirmation', items: [{ id: 'i1', name: 'Maris Otter', kind: 'stock', quantity: 25, unit: 'kg', amountTTC: 60, evidence: 'Maris Otter 25 kg' }, { id: 'i2', name: 'Citra T90', kind: 'stock', quantity: 100, unit: 'g', amountTTC: 30.25, evidence: 'Citra T90 100 g' }] }) };

const local = (u) => ['http://localhost', 'http://127.0.0.1', 'ws://localhost', 'ws://127.0.0.1', 'data:', 'blob:', 'about:', 'file:'].some((d) => u.startsWith(d));
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const fautes = [], infos = [];
const noter = (ok, texte) => { console.error((ok ? 'ok ' : 'ECHEC ') + texte.slice(0, 170)); infos.push(`${ok ? 'OK   ' : 'ECHEC'} ${texte}`); if (!ok) fautes.push(texte); };
// Un appel à la fonction aiTask (fetch/xhr, ou toute adresse hors de la machine) ; les modules sources dont le nom contient « aiTask » ne sont pas des appels.
let aiTask = 0; const appels = [];

async function ouvrir(nav, mode) {
  const p = await nav.newPage();
  await p.setViewport({ width: mode.l, height: mode.h, isMobile: mode.tactile, hasTouch: mode.tactile, deviceScaleFactor: mode.echelle });
  p.erreurs = [];
  p.on('pageerror', (e) => p.erreurs.push('PAGE ' + e.message.slice(0, 160)));
  await p.setRequestInterception(true);
  p.on('request', (r) => { const u = r.url(); if (/aiTask/i.test(u) && (!local(u) || ['fetch', 'xhr'].includes(r.resourceType()))) { aiTask++; appels.push(u.slice(0, 90)); r.abort('blockedbyclient'); return; } if (local(u)) r.continue(); else r.abort('blockedbyclient'); });
  p.setDefaultNavigationTimeout(150000);
  for (let essai = 1; essai <= 4; essai++) {
    try {
      await p.goto(`${ADRESSE}/?dev-local`, { waitUntil: 'domcontentloaded' });
      await p.waitForFunction(() => document.querySelectorAll('button').length > 3, { timeout: 150000 });
      await dormir(1200);
      await p.evaluate(async () => { await import('/src/services/firestoreRepo.ts'); await import('/src/services/geminiScanner.ts'); });
      break;
    } catch (e) { await dormir(3000); if (essai === 4) throw new Error(`l’app ne s’ouvre pas : ${String(e.message).slice(0, 100)}`); }
  }
  // Les fixtures dans le cache mémoire (dev-local : `put` n'écrit nulle part ailleurs) ; la lecture remplacée par la simulée.
  await p.evaluate(async (depense, articles, lectures) => {
    const repo = await import('/src/services/firestoreRepo.ts');
    for (const a of articles) repo.FirestoreRepo.put('stockItems', a.ref, a);
    repo.FirestoreRepo.put('transactions', depense.id, depense);
    const g = await import('/src/services/geminiScanner.ts');
    window.__lectures = [];
    g.GeminiScannerService.scanDocument = async (file) => { window.__lectures.push(file.name); await new Promise((r) => setTimeout(r, 300)); return JSON.parse(JSON.stringify(lectures[file.name])); };
  }, DEPENSE, ARTICLES, LECTURES);
  return p;
}
async function feuille(p) {
  await p.click('[aria-label="Actions rapides"]');
  await p.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /Entrer une facture/.test(b.textContent)), { timeout: 20000 });
  await p.evaluate(() => [...document.querySelectorAll('button')].find((b) => /Entrer une facture/.test(b.textContent)).click());
  await p.waitForSelector('input[aria-label="Importer un justificatif"]', { timeout: 45000 });
  await dormir(500);
}
async function joindre(p, fichier) {
  const input = await p.$('input[aria-label="Importer un justificatif"]');
  await input.uploadFile(fichier);
}
const lectures = (p) => p.evaluate(() => window.__lectures.slice());
const visible = (p, sel) => p.evaluate((s) => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(); return r.height > 0 && r.top < innerHeight && r.bottom > 0; }, sel);
const debord = (p) => p.evaluate(() => { const d = document.querySelector('[role="dialog"]'); return Math.max(document.documentElement.scrollWidth - innerWidth, (d?.scrollWidth ?? 0) - (d?.clientWidth ?? 0)); });
const cliquer = (p, nom) => p.evaluate((n) => { const b = [...document.querySelectorAll('button')].find((x) => (x.getAttribute('aria-label') ?? x.textContent ?? '').trim() === n); if (!b) throw new Error('bouton introuvable : ' + n); b.scrollIntoView({ block: 'center' }); b.click(); }, nom).then(() => dormir(400));

const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 240000 });
try {
  for (const mode of MODES) {
    const e = (s) => `${mode.id} · ${s}`;
    // ---- 1. Repos : le même fichier
    let p = await ouvrir(nav, mode);
    await feuille(p);
    await joindre(p, FACTURE);
    await p.waitForSelector('#piece-deja-saisie', { timeout: 20000 }).catch(() => undefined);
    await dormir(600);
    noter(await visible(p, '#piece-deja-saisie'), e('la section certaine « Déjà enregistré » est visible à l’écran'));
    const carte = await p.evaluate(() => { const c = document.querySelector('#piece-deja-saisie'); return { texte: c?.textContent ?? '', noms: [...(c?.querySelectorAll('[data-dp-article]') ?? [])].map((x) => x.textContent) }; });
    noter(/Déjà enregistré/.test(carte.texte) && !/peut-être/.test(carte.texte), e('« Déjà enregistré », pas « peut-être »'));
    noter(carte.noms.some((n) => /Maris Otter/.test(n)) && carte.noms.some((n) => /Citra 12\.5%/.test(n)), e(`les noms des articles lus : ${carte.noms.join(' | ')}`));
    noter(/F-1001/.test(carte.texte) && /12\.10\.2026/.test(carte.texte) && /90,00/.test(carte.texte) && /À payer/.test(carte.texte), e('n° de facture, date, total et règlement dits'));
    noter(!/empreinte|hash/i.test(await p.evaluate(() => document.querySelector('[role="dialog"]')?.textContent ?? '')), e('ni « empreinte » ni « hash » à l’écran'));
    noter((await lectures(p)).length === 0 && aiTask === 0, e(`aucune lecture (simulée : ${(await lectures(p)).length}) et aucune requête aiTask (${aiTask})`));
    noter(await p.evaluate(() => !document.querySelector('#purchase-total')), e('le formulaire vide n’est pas montré'));
    noter((await debord(p)) <= 1, e('aucun débordement horizontal'));
    await p.screenshot({ path: path.join(SORTIE, `${mode.id}-1-repos.png`) });
    // ---- 2. Détail ouvert : les lignes de la dépense
    // Au téléphone, « Ses N lignes » se déplie dans la carte ; sur ordinateur, les lignes sont déjà dans la colonne de droite (critique, 01.11).
    const large = mode.l >= 1024;
    if (!large) await p.evaluate(() => { const s = document.querySelector('#piece-deja-saisie [data-dp-lignes] summary'); s.scrollIntoView({ block: 'center' }); s.click(); });
    await dormir(400);
    const lignes = await p.evaluate((l) => [...document.querySelectorAll(l ? '[data-dp-lignes-large] li' : '#piece-deja-saisie [data-dp-lignes] li')].filter((li) => li.getBoundingClientRect().height > 0).map((li) => li.textContent.replace(/\s+/g, ' ')), large);
    // Le libellé de chaque ligne est celui de la fiche (`line.description`), pas le nom de l'article ; pas de ligne « Frais de port » (« Total seulement », 01.11).
    noter(lignes.length === 2 && /^Maris Otter 25 kg/.test(lignes[0]) && /^Citra T90 100 g/.test(lignes[1]) && !lignes.some((l) => /port/i.test(l)), e(`lignes visibles, libellé de la fiche : ${lignes.length} (${lignes.join(' | ').slice(0, 90)})`));
    if (large) {
      // Aucune zone vide de plus de 300 px dans la feuille : la colonne de droite porte les lignes.
      const vide = await p.evaluate(() => { const d = document.querySelector('[role="dialog"]').getBoundingClientRect(), c = document.querySelector('#piece-deja-saisie').getBoundingClientRect(), a = document.querySelector('[data-dp-lignes-large]')?.getBoundingClientRect(); return Math.round(d.right - Math.max(c.right, a && a.width > 0 ? a.right : 0)); });
      noter(vide <= 300, e(`vide à droite de la carte et des lignes : ${vide} px (≤ 300)`));
    }
    await p.evaluate(() => document.querySelector('#piece-deja-saisie').scrollIntoView({ block: 'start' }));
    await dormir(200);
    await p.screenshot({ path: path.join(SORTIE, `${mode.id}-2-detail-ouvert.png`) });
    // ---- 3. Lire quand même : la lecture (simulée) part une fois ; la section actuelle dit le lien
    await cliquer(p, 'Lire quand même');
    await p.waitForSelector('#purchase-duplicate', { timeout: 20000 }).catch(() => undefined);
    await dormir(700);
    noter((await lectures(p)).length === 1, e(`« Lire quand même » : une lecture simulée (${(await lectures(p)).length})`));
    const peutEtre = await p.evaluate(() => { const s = document.querySelector('#purchase-duplicate'); return { texte: s?.textContent ?? '', lien: s?.querySelector('[data-dp-lien]')?.textContent ?? '' }; });
    noter(/Même fichier déjà joint/.test(peutEtre.texte) && /Lié au stock : Maris Otter, Citra 12\.5%/.test(peutEtre.lien), e(`la section actuelle dit le lien : « ${peutEtre.lien} »`));
    noter(/^Achat déjà enregistré · même fichier/.test(peutEtre.texte) && !/peut-être/.test(peutEtre.texte), e('au même fichier, le titre est certain : « Achat déjà enregistré · même fichier »'));
    const lu = await p.evaluate(() => [...document.querySelectorAll('#purchase-duplicate tbody tr')].map((tr) => [...tr.children].map((c) => c.textContent.trim())));
    noter(lu.some((r) => r[0] === 'Date' && r[1] === '12.10.2026' && r[2] === '12.10.2026'), e(`« Document lu » porte la date de la fixture : ${JSON.stringify(lu.find((r) => r[0] === 'Date'))}`));
    await p.evaluate(() => document.querySelector('#purchase-duplicate')?.scrollIntoView({ block: 'start' }));
    await dormir(200);
    await p.screenshot({ path: path.join(SORTIE, `${mode.id}-3-lire-quand-meme.png`) });
    await p.close();
    // ---- 3 bis (pilote, 01.11). « Ouvrir la dépense » : la feuille se ferme et la fiche de la dépense existante s'ouvre dans Finances.
    p = await ouvrir(nav, mode);
    await feuille(p);
    await joindre(p, FACTURE);
    await p.waitForSelector('#piece-deja-saisie', { timeout: 20000 }).catch(() => undefined);
    await dormir(500);
    await cliquer(p, 'Ouvrir la dépense');
    const fiche = await p.waitForFunction(() => [...document.querySelectorAll('[role="dialog"]')].some((d) => /Malt et houblons · F-1001/.test(d.textContent ?? '')), { timeout: 15000 }).then(() => true).catch(() => false);
    await dormir(400);
    noter(fiche && await p.evaluate(() => !document.querySelector('#piece-deja-saisie') && !document.querySelector('input[aria-label="Importer un justificatif"]')),
      e('« Ouvrir la dépense » : la feuille fermée, la fiche de la dépense existante ouverte'));
    noter((await lectures(p)).length === 0 && aiTask === 0, e('« Ouvrir la dépense » : aucune lecture ni requête aiTask'));
    await p.screenshot({ path: path.join(SORTIE, `${mode.id}-5-ouvrir-la-depense.png`) });
    noter(p.erreurs.length === 0, e(`aucune erreur de page à l’ouverture (${p.erreurs.join(' / ').slice(0, 120)})`));
    await p.close();
    // ---- 4. La même commande à deux totaux : la page web
    p = await ouvrir(nav, mode);
    await feuille(p);
    await joindre(p, PAGE);
    await p.waitForSelector('[aria-label="Même commande sous un autre numéro"]', { timeout: 20000 }).catch(() => undefined);
    await dormir(700);
    const commande = await p.evaluate(() => { const s = document.querySelector('[aria-label="Même commande sous un autre numéro"]'); return { texte: s?.textContent ?? '', ecart: s?.querySelector('[data-dp-ecart]')?.textContent ?? '', lien: s?.querySelector('[data-dp-lien]')?.textContent ?? '' }; });
    noter(/^Même commande 7001, autre total/.test(commande.texte) && /90,25/.test(commande.texte) && /90,00/.test(commande.texte), e('même commande : « Même commande 7001, autre total », les deux totaux'));
    // La ligne Date : « +2 j » à côté de la date, rien de coupé (aucun « … » ni débordement de cellule).
    const date = await p.evaluate(() => { const tr = [...document.querySelectorAll('[aria-label="Même commande sous un autre numéro"] tbody tr')].find((x) => x.children[0]?.textContent === 'Date'); return { texte: tr?.textContent ?? '', jours: tr?.querySelector('[data-dp-jours]')?.textContent ?? '', coupe: [...(tr?.children ?? [])].some((c) => c.scrollWidth > c.clientWidth + 1) }; });
    noter(date.jours.trim() === '+2 j' && !/…|j d’écart/.test(date.texte) && !date.coupe, e(`ligne Date entière : « ${date.texte.replace(/\s+/g, ' ')} » (coupée : ${date.coupe})`));
    noter(/^\+0,25$/.test(commande.ecart.trim()) && /90,25\s*CHF\s*\+0,25/.test(commande.texte), e(`l’écart souligné à côté du total : « ${commande.ecart} »`));
    noter(/Lié au stock : Maris Otter, Citra 12\.5%/.test(commande.lien), e(`le lien de la dépense existante : « ${commande.lien} »`));
    noter(await p.evaluate(() => !document.querySelector('#piece-deja-saisie')), e('autre fichier : pas de section certaine'));
    await p.evaluate(() => document.querySelector('[aria-label="Même commande sous un autre numéro"]')?.scrollIntoView({ block: 'start' }));
    await dormir(200);
    await p.screenshot({ path: path.join(SORTIE, `${mode.id}-4-meme-commande.png`) });
    noter(p.erreurs.length === 0, e(`aucune erreur de page (${p.erreurs.join(' / ').slice(0, 120)})`));
    await p.close();
  }
  noter(aiTask === 0, `aucune requête aiTask sur tout le banc (${aiTask}${appels.length ? " : " + appels.join(", ") : ""})`);
} catch (err) { noter(false, 'arrêt : ' + String(err.message ?? err).slice(0, 200)); }
finally { await nav.close(); }
fs.writeFileSync(path.join(SORTIE, 'rapport.txt'), infos.join('\n') + '\n');
if (fautes.length) { console.log(`DOUBLON ECHEC ${fautes.length}`); fautes.forEach((f) => console.log(' - ' + f)); process.exit(1); }
console.log(`DOUBLON OK (${infos.length} contrôles, empreinte fixture ${EMPREINTE.slice(0, 12)}…)`);
