// Banc local de l'écran « Nouvelle dépense » (voie e-port) : la facture 372765 en lecture SIMULÉE, le stock SIMULÉ, l'enregistrement SIMULÉ.
// Chargé seulement en développement (`import.meta.env.DEV` dans QuickActionModal, import dynamique) : jamais dans `dist/`. Gemini n'est jamais appelé,
// aucun Drive, aucune écriture. La lecture est la sortie du VRAI rapprochement du serveur (tests/unit/depense/ecran/fixture.test.ts la régénère) ;
// seule l'unité de Sabro est simulée (sa facture imprime « g »). Ni nom ni adresse du brasseur.
import lecture from './apercu/lecture-372765.reconciliee.json';
import stock from './apercu/stock-simule.json';
import lectureS6 from './apercu/lecture-s6.reconciliee.json';
import stockS6 from './apercu/stock-s6.json';
import { articlesNeufsDe } from '../../services/purchaseEntry';
import { makePoint, signerPoint } from '../../../functions/src/invoiceControls';
import { ajouterCoupure, phraseCoupure } from './finale';
import { PIECE_DIFFICILE, type ScanOutcome, type ScannedInvoiceResult } from '../../services/geminiScanner';
import type { ApercuDepense } from './types';
import { parseSwissQr } from '../../services/qrFacture';
import type { ResultatQr } from '../../services/qrLecture';

const pause = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

/** Le stock simulé : Target α 11,8 (le voisin de « Target 11.3% »), Hallertauer Blanc DE ; Verdant absent (il reste « nouveau »). */
function stockSimule() {
  const articles = (stock.articles as any[]).filter(a => a.name !== 'Verdant IPA').map(a => (a.name === 'Target' ? { ...a, name: 'Target 11.8%' } : a));
  articles.push({ id: 'Hallertauer', ref: 'MP-Hallertauer', name: 'Hallertauer Blanc DE 9.5%', unit: 'g', category: 'Houblon', currentStock: 100, minStock: 0, reorder: false });
  return { rawMaterials: articles, cleaning: [], equipment: [], kegs: [] } as unknown as ApercuDepense['stocks'];
}

/** La sonde d1 : la facture 380001 du 30.04, même commande, même total (état 8, S8). */
const doublon380001 = () => ({
  id: 'TX-380001', date: '30.04.2026', amountTTC: 86.5, description: 'Brau- und Rauchshop · 380001', category: 'brassage',
  finance: { kind: 'expense', version: 1, amountCents: 8650, vendor: 'Brau- und Rauchshop GmbH', invoiceNumber: '380001', sourceOrderNumber: 'Onlinebestellung-686863', recordedAt: '2026-04-30T10:00:00.000Z',
    lines: (lecture.items as any[]).map(i => ({ id: i.id, description: i.name, kind: 'ingredient', amountCents: Math.round((i.amountTTC ?? 0) * 100), sourceReference: i.reference })) },
}) as unknown as ApercuDepense['transactions'][number];

/**
 * L'état « s6 » (voie s6-fiche, T7) : une lecture SIMULÉE de quatre lignes (Target 11.3%, Cascade CH, Münchner Malz 15 EBC, Sabro® 13.4%) et le stock SIMULÉ qui va avec.
 * Son `enregistrer` n'écrit rien : il appelle la VRAIE création de l'article (`articlesNeufsDe`, ce que `savePurchase` écrit) avec le catalogue plein des houblons, puis
 * expose sur `window.__s6Banc` les articles écrits et le stock existant avant et après (la preuve que l'article existant n'est pas modifié). Développement seulement.
 */
function apercuS6(): ApercuDepense {
  const result = clone(lectureS6) as unknown as ScannedInvoiceResult;
  const articles = clone(stockS6.articles) as any[];
  const avant = JSON.stringify(articles);
  const fichier = { name: 'capture-facture-s6.jpg', size: 412345, type: 'application/pdf' };
  return {
    outcome: { ok: true, result, proofDataUrl: '', fileName: fichier.name, mimeType: fichier.type, model: 'simule', cached: false },
    fichier, stocks: { rawMaterials: articles, cleaning: [], equipment: [], kegs: [] } as unknown as ApercuDepense['stocks'], transactions: [], etat: 's6', drive: 'ok', reseau: true,
    enregistrer: async draft => {
      const data = await import('../../domain/hopIndex/v4/data');
      const houblons = await data.chargerCataloguePlein();
      const ecrits = articlesNeufsDe(draft, articles, { houblons });
      (window as any).__s6Banc = { ecrits: clone(ecrits), lignes: clone(draft.lines), existantsAvant: JSON.parse(avant), existantsApres: clone(articles) };
      await pause(300);
      return { driveFileId: 'simule', fileName: '2026-09-09 Fournisseur fictif S6-1.jpg', bytes: 412345, sha256: '0'.repeat(64), verified: true, folder: 'L’Affinée / Justificatifs / 2026', webViewLink: 'https://drive.google.com/file/d/simule/view' };
    },
  };
}

// Les pièces FICTIVES du banc du QR (voie qr-app) : « Malterie Fictive SA », F-1001, 110,40 CHF, 12.10.2026 ; un vrai QR-facture SPC 0200 (exemples publics SIX), généré par
// `work/missions/2026-11-01-bascule-lecture/voies/qr-app/fixtures/generer.mjs`. Lues par le VRAI décodeur du navigateur ; seule la lecture Gemini est simulée.
const PIECES_QR = {
  image: { url: new URL('./apercu/qr/facture-qr.png', import.meta.url).href, name: 'facture-qr.png', type: 'image/png' },
  pdf: { url: new URL('./apercu/qr/facture-qr.pdf', import.meta.url).href, name: 'facture-qr.pdf', type: 'application/pdf' },
  ouvert: { url: new URL('./apercu/qr/facture-qr-ouvert.png', import.meta.url).href, name: 'facture-qr-ouvert.png', type: 'image/png' },
  abime: { url: new URL('./apercu/qr/facture-qr-abime.png', import.meta.url).href, name: 'facture-qr-abime.png', type: 'image/png' },
  sans: { url: new URL('./apercu/qr/facture-sans-qr.png', import.meta.url).href, name: 'facture-sans-qr.png', type: 'image/png' },
  inconnu: { url: new URL('./apercu/qr/facture-qr.png', import.meta.url).href, name: 'facture.bin', type: 'application/octet-stream' },
};

/** Les sept lignes fictives de la maquette z2 (somme 110,40). La mouture suit son malt. */
function lectureQr(montantLu: number, dateLue = '12.10.2026'): ScannedInvoiceResult {
  const result = clone(lecture) as unknown as ScannedInvoiceResult;
  const ligne = (id: number, name: string, kind: string, quantity: number, unit: string, price: number, amountTTC: number, reference = '') =>
    ({ id: `line-${id}`, name, kind, quantity, unit, price, amountTTC, reference, variant: '', stockCategory: '', evidence: `${name} (page 1)`, ambiguity: '', vatCode: 'N', alphaPct: null, alphaPctLu: null });
  result.items = [
    ligne(1, 'Maris Otter, Kg', 'stock', 25, 'Kg', 2.1, 52.5), ligne(2, 'Zuschlag Schrotung', 'service', 25, 'Kg', 0.15, 3.75, 'ISHOP-SCHROT'),
    ligne(3, 'Pilsner Malz, Kg', 'stock', 10, 'Kg', 1.8, 18), ligne(4, 'Carafa II, Kg', 'stock', 2, 'Kg', 3.2, 6.4),
    ligne(5, 'Citra 12.5%', 'stock', 100, 'g', 0.098, 9.8), ligne(6, 'Safale US-05 11,5g', 'stock', 2, 'Stk', 4.6, 9.2), ligne(7, 'Port', 'shipping', 1, 'pce', 10.75, 10.75),
  ] as unknown as ScannedInvoiceResult['items'];
  Object.assign(result, {
    proForma: false, vendor: 'Malterie Fictive SA', date: dateLue, invoiceNumber: 'F-1001', orderNumber: '', amountHT: null, tvaRate: null, tvaAmount: null, vat: [],
    amountTTC: montantLu, printedLineCount: 7, linesLost: 0, points: [], fieldWarnings: [], issues: [], remarques: [], description: 'Malts, houblon, levure',
    controls: { lines: { checked: 7, failed: 0, skipped: 0, skippedIds: [] }, sum: { statut: montantLu === 110.4 ? 'ok' : 'ecart', base: 'TTC' }, vat: { statut: 'non-verifiable', base: 'TTC' }, totals: { statut: 'non-verifiable' } },
    review: { status: 'checked', findings: [], readers: 2 },
  });
  return result;
}

/** SIMULÉ (aucun décodage) : un QR-facture lu, mais non conforme (IBAN à clé fausse) : l'état « invalide » que z2 n'a pas dessiné. */
function qrInvalideSimule(): ResultatQr {
  const lignes = ['SPC', '0200', '1', 'CH0000000000000000000', 'S', 'Malterie Fictive SA', 'Route de la Malterie', '1', '1000', 'Lausanne', 'CH', '', '', '', '', '', '', '', '110.40', 'CHF', '', '', '', '', '', '', '', 'QRR', '210000000003139471430009017', '', 'EPD', ''];
  return { statut: 'lu', ms: 480, qr: parseSwissQr(lignes.join('\n'))! };
}

/** `qr-<état>` : confirme, contredit (lu 110,04), partiel (bulletin sans montant), illisible (QR abîmé), ecart (date lue 13.10 contre 12.10 du QR), invalide (QR non conforme, SIMULÉ), sans, lecture (Gemini jamais fini), pdf (le même, en PDF), non-verifie. */
function apercuQr(etat: string): ApercuDepense {
  const nom = etat.slice(3);
  const piece = nom === 'partiel' ? PIECES_QR.ouvert : nom === 'illisible' ? PIECES_QR.abime : nom === 'sans' ? PIECES_QR.sans : nom === 'pdf' ? PIECES_QR.pdf : nom === 'non-verifie' ? PIECES_QR.inconnu : PIECES_QR.image;
  const result = lectureQr(nom === 'contredit' ? 110.04 : 110.4, nom === 'ecart' ? '13.10.2026' : '12.10.2026');
  const fichier = { name: piece.name, size: 90000, type: 'application/pdf' };
  const outcome: ScanOutcome = { ok: true, result, proofDataUrl: '', fileName: fichier.name, mimeType: fichier.type, model: 'simule', cached: false };
  return {
    outcome, fichier, stocks: stockSimule(), transactions: [], etat, drive: 'ok', reseau: true, qrFichier: piece, ...(nom === 'invalide' ? { qrSimule: qrInvalideSimule() } : {}),
    enregistrer: async () => { await pause(600); return { driveFileId: 'simule', fileName: '2026-10-12 Malterie Fictive SA F-1001.pdf', bytes: 90000, sha256: '0'.repeat(64), verified: true, folder: 'L’Affinée / Justificatifs / 2026', webViewLink: 'https://drive.google.com/file/d/simule/view' }; },
  };
}

/**
 * `familles` (voie p3c-bandes, D262c, D262d) : une lecture SIMULÉE dont les lignes couvrent TOUTES les familles (malts avec mouture, houblon, levures, sucre, additifs, matériel,
 * emballage, nettoyage, consommables, services, un inclassable) et un port. Désignations en allemand, anglais et français (D271), aucune valeur d'une vraie pièce. Aucune écriture, aucun Gemini.
 */
function apercuFamilles(): ApercuDepense {
  const result = clone(lecture) as unknown as ScannedInvoiceResult;
  const ligne = (id: number, name: string, kind: string, quantity: number, unit: string, price: number, amountTTC: number, stockCategory = '', reference = '') =>
    ({ id: `line-${id}`, name, kind, quantity, unit, price, amountTTC, reference, variant: '', stockCategory, evidence: `${name} (page 1)`, ambiguity: '', vatCode: 'N', alphaPct: null, alphaPctLu: null });
  const items = [
    ligne(1, 'Maris Otter, Kg', 'stock', 25, 'Kg', 2.1, 52.5), ligne(2, 'Zuschlag Schrotung', 'service', 25, 'Kg', 0.15, 3.75, '', 'ISHOP-SCHROT'), ligne(3, 'Château Abbey, Kg', 'stock', 5, 'Kg', 3.2, 16),
    ligne(4, 'Citra 12.5%', 'stock', 100, 'g', 0.098, 9.8), ligne(5, 'Hopfenpellets Saaz 8%', 'stock', 100, 'g', 0.07, 7),
    ligne(6, 'Omega OYL-200', 'stock', 2, 'Stk', 9.5, 19), ligne(7, 'Safale US-05 11,5g', 'stock', 2, 'Stk', 4.6, 9.2),
    ligne(8, 'Candi Syrup D-180', 'stock', 1, 'Kg', 7.5, 7.5), ligne(9, 'Whirlfloc 10 Tabs', 'stock', 1, 'Stk', 3.9, 3.9), ligne(10, 'CaCl2 500 g', 'stock', 1, 'Stk', 6.2, 6.2),
    ligne(11, 'Fermzilla 27 L', 'equipment', 1, 'Stk', 119, 119), ligne(12, 'Hop Spider Bag', 'stock', 1, 'Stk', 14.5, 14.5),
    ligne(13, 'Kronkorken 26 mm (100)', 'packaging', 2, 'Stk', 2.5, 5), ligne(14, 'Chemipro OXI 1 kg', 'cleaning', 1, 'Kg', 18.9, 18.9),
    ligne(15, 'Handschuhe Nitril M', 'stock', 1, 'Stk', 8.4, 8.4, 'EPI'), ligne(16, 'Analyse Wasserprobe', 'service', 1, 'Stk', 45, 45), ligne(17, 'Divers fictif XJ-17', 'other', 1, 'Stk', 3, 3),
    ligne(18, 'Versand / Port', 'shipping', 1, 'pce', 10.75, 10.75),
  ];
  const total = Math.round(items.reduce((a, i) => a + i.amountTTC, 0) * 100) / 100;
  result.items = items as unknown as ScannedInvoiceResult['items'];
  Object.assign(result, {
    proForma: false, vendor: 'Boutique Fictive GmbH', date: '12.10.2026', invoiceNumber: 'F-2002', orderNumber: '', amountHT: null, tvaRate: null, tvaAmount: null, vat: [],
    amountTTC: total, printedLineCount: items.length, linesLost: 0, points: [], fieldWarnings: [], issues: [], remarques: [], description: 'Toutes les familles',
    controls: { lines: { checked: items.length, failed: 0, skipped: 0, skippedIds: [] }, sum: { statut: 'ok', base: 'TTC' }, vat: { statut: 'non-verifiable', base: 'TTC' }, totals: { statut: 'non-verifiable' } },
    review: { status: 'checked', findings: [], readers: 2 },
  });
  const fichier = { name: 'capture-familles.jpg', size: 90000, type: 'application/pdf' };
  return {
    outcome: { ok: true, result, proofDataUrl: '', fileName: fichier.name, mimeType: fichier.type, model: 'simule', cached: false }, fichier, stocks: stockSimule(), transactions: [], etat: 'familles', drive: 'ok', reseau: true,
    enregistrer: async () => { await pause(600); return { driveFileId: 'simule', fileName: '2026-10-12 Boutique Fictive F-2002.pdf', bytes: 90000, sha256: '0'.repeat(64), verified: true, folder: 'L’Affinée / Justificatifs / 2026', webViewLink: 'https://drive.google.com/file/d/simule/view' }; },
  };
}

/**
 * `renovation` (voie r1-renovation, D306) : une pièce de bricolage SIMULÉE (« Brico Fictif SA »), « Pour quoi ? » lu `renovation` (Local). Désignations inventées en français,
 * allemand, anglais et italien, lues `stock`, `other`, `equipment` ou `cleaning` comme la lecture le fait : peinture et sols, outillage, quincaillerie, électricité, plomberie,
 * protection (un EPI lu en catégorie de stock), deux termes ambigus (un seau, une brosse), un détartrant (Nettoyage), une ligne sans mot reconnu (Divers travaux), un port.
 * Aucune valeur ni désignation d'une vraie pièce. Aucune écriture, aucun Gemini ; une ligne de Rénovation ne crée ni article ni mouvement.
 */
function apercuRenovation(): ApercuDepense {
  const result = clone(lecture) as unknown as ScannedInvoiceResult;
  const ligne = (id: number, name: string, kind: string, quantity: number, unit: string, price: number, stockCategory = '') =>
    ({ id: `line-${id}`, name, kind, quantity, unit, price, amountTTC: Math.round(quantity * price * 100) / 100, reference: '', variant: '', stockCategory, evidence: `${name} (page 1)`, ambiguity: '', vatCode: 'N', alphaPct: null, alphaPctLu: null });
  const items = [
    ligne(1, 'Peinture murale blanche mate 10 L', 'stock', 1, 'Stk', 64.9), ligne(2, 'Vitrificateur parquet satiné 2.5 L', 'other', 1, 'Stk', 38.5),
    ligne(3, 'Pinceau plat 50 mm', 'equipment', 3, 'Stk', 4.9), ligne(4, 'Fliesenkleber 5 kg', 'other', 2, 'Stk', 11.9), ligne(5, 'Ruban de masquage 50 m', 'stock', 4, 'Stk', 3.2),
    ligne(6, 'Ponceuse excentrique 125 mm', 'equipment', 1, 'Stk', 89), ligne(7, 'Sandpaper assortment 40-120', 'other', 1, 'Stk', 12.4),
    ligne(8, 'Dübel 8 mm, 50 Stück', 'stock', 2, 'Stk', 6.5), ligne(9, 'Vis à bois 4 x 40 (200)', 'other', 1, 'Stk', 9.9),
    ligne(10, 'Interrupteur va-et-vient blanc', 'equipment', 3, 'Stk', 7.8), ligne(11, 'Presa di corrente da incasso', 'other', 3, 'Stk', 5.4),
    ligne(12, 'Mitigeur lavabo chromé', 'equipment', 1, 'Stk', 54), ligne(13, 'Gants nitrile M', 'stock', 1, 'Stk', 8.4, 'EPI'),
    ligne(14, 'Eimer 12 Liter', 'other', 2, 'Stk', 3.9), ligne(15, 'Brosse métallique', 'other', 1, 'Stk', 5.5),
    ligne(16, 'Détartrant anticalcaire 1 L', 'cleaning', 2, 'Stk', 6.9), ligne(17, 'Étagère murale bois 80 cm', 'equipment', 2, 'Stk', 14.5),
    ligne(18, 'Versand / Port', 'shipping', 1, 'pce', 9.9),
  ];
  const total = Math.round(items.reduce((a, i) => a + i.amountTTC, 0) * 100) / 100;
  result.items = items as unknown as ScannedInvoiceResult['items'];
  Object.assign(result, {
    proForma: false, vendor: 'Brico Fictif SA', date: '14.10.2026', invoiceNumber: 'B-3003', orderNumber: '', amountHT: null, tvaRate: null, tvaAmount: null, vat: [], category: 'renovation',
    amountTTC: total, printedLineCount: items.length, linesLost: 0, points: [], fieldWarnings: [], issues: [], remarques: [], description: 'Travaux du local (SIMULÉ)',
    controls: { lines: { checked: items.length, failed: 0, skipped: 0, skippedIds: [] }, sum: { statut: 'ok', base: 'TTC' }, vat: { statut: 'non-verifiable', base: 'TTC' }, totals: { statut: 'non-verifiable' } },
    review: { status: 'checked', findings: [], readers: 2 },
  });
  const fichier = { name: 'capture-renovation.jpg', size: 90000, type: 'application/pdf' };
  return {
    outcome: { ok: true, result, proofDataUrl: '', fileName: fichier.name, mimeType: fichier.type, model: 'simule', cached: false }, fichier, stocks: stockSimule(), transactions: [], etat: 'renovation', drive: 'ok', reseau: true,
    enregistrer: async () => { await pause(600); return { driveFileId: 'simule', fileName: '2026-10-14 Brico Fictif B-3003.pdf', bytes: 90000, sha256: '0'.repeat(64), verified: true, folder: 'L’Affinée / Justificatifs / 2026', webViewLink: 'https://drive.google.com/file/d/simule/view' }; },
  };
}

/**
 * `commande` (voie f3-rangees, D275, D277) : une commande en ligne SIMULÉE de la forme de sa pièce du 01.11 (aucune valeur ni désignation de sa pièce) : malts
 * « …, Kg » ou « …, Gramm » avec l'option « Mischung / Schrotung : geschrotet [+CHF …] », colonne d'unité vide ailleurs (levure, houblon, sucre, matériel,
 * emballage), port à part, date non imprimée. Aucun article ne relie ces lignes : les ingrédients sont « nouvel article » d'office. Aucune écriture, aucun Gemini.
 */
function apercuCommande(): ApercuDepense {
  const result = clone(lecture) as unknown as ScannedInvoiceResult;
  const option = (sup: string) => `Mischung: Einzelprodukt, Schrotung: geschrotet [+CHF ${sup}]`;
  const ligne = (id: number, name: string, kind: string, quantity: number | null, unit: string, price: number | null, amountTTC: number, stockCategory = '', variant = '', reference = '') =>
    ({ id: `line-${id}`, name, kind, quantity, unit, price, amountTTC, reference, variant, stockCategory, evidence: '', ambiguity: '', vatCode: '', alphaPct: null, alphaPctLu: null });
  const items = [
    ligne(1, 'Omega OYL-061, Voss Kveik', 'stock', 2, '', 8.9, 17.8, 'yeast', '', 'HE0901'), ligne(2, 'Gärfass 30 Liter mit Deckel', 'equipment', 1, '', 32, 32, '', '', 'GA0101'),
    ligne(3, 'Hopfensack fein', 'equipment', 4, '', 0.8, 3.2, '', '', 'SA0201'), ligne(4, 'Carafa Spezial I®, Kg', 'stock', 2, 'Kg', 2.4, 4.8, 'malt', option('0.10'), 'MA0301'),
    ligne(5, 'Candi Sugar Amber 500g', 'stock', 1, '', 5.9, 5.9, 'sugar', '', 'CA0401'), ligne(6, 'Wiener Malz, Kg', 'stock', 5, 'Kg', 1.7, 8.5, 'malt', option('0.10'), 'MA0302'),
    ligne(7, 'Ekuanot 14.5%', 'stock', 85, '', 0.05, 4.25, 'hop', '', 'HO0501'), ligne(8, 'Melanoidin Malz®, Gramm', 'stock', 100, 'Gramm', 0.0111, 1.11, 'malt', option('0.0001'), 'MA0303'),
    ligne(9, 'Kronkorken 100 Kapseln schwarz', 'packaging', 1, '', 2.9, 2.9, '', '', 'KR0601'),
    // VERDICT-f3 défaut 3 : un article relié (Pilsner Malz du stock simulé), un « bis » (Target 11.3% face à Target 11.8%), une unité qui ne se déduit pas (ni prix ni famille).
    ligne(11, 'Pilsner Malz, Kg', 'stock', 4, 'Kg', 1.5, 6, 'malt', '', 'MA0304'), ligne(12, 'Target 11.3%', 'stock', 40, 'g', 0.04, 1.6, 'hop', '', 'HO0502'),
    ligne(13, 'Brauzusatz Probe', 'stock', 3, '', null, 4.5, '', '', 'ZU0701'),
    ligne(10, 'Shipping', 'shipping', null, '', null, 12),
  ];
  const total = Math.round(items.reduce((a, i) => a + i.amountTTC, 0) * 100) / 100;
  result.items = items as unknown as ScannedInvoiceResult['items'];
  Object.assign(result, {
    proForma: false, vendor: 'BOUTIQUE FICTIVE', date: null, invoiceNumber: '', orderNumber: '', amountHT: null, tvaRate: null, tvaAmount: null, vat: [],
    amountTTC: total, printedLineCount: items.length - 1, linesLost: 0, fieldWarnings: [], issues: [], remarques: [], description: 'Commande en ligne',
    controls: { lines: { checked: items.length - 1, failed: 0, skipped: 1, skippedIds: ['line-10'] }, sum: { statut: 'ok', base: 'TTC' }, vat: { statut: 'non-verifiable', base: 'TTC' }, totals: { statut: 'non-verifiable' } },
    review: { status: 'checked', findings: [], readers: 2 },
  });
  const point = makePoint('date-absente', 'ecart', 'date', null, { regle: 'le code relève ce que la lecture ne permet pas de tenir pour sûr', message: 'Date absente ou invalide : à saisir.', unite: 'texte', enjeu: 'info' });
  result.points = [{ ...point, source: 'contrôle', pese: true, signature: signerPoint(point) }];
  const fichier = { name: 'capture-commande.jpg', size: 120000, type: 'application/pdf' };
  return {
    outcome: { ok: true, result, proofDataUrl: '', fileName: fichier.name, mimeType: fichier.type, model: 'simule', cached: false }, fichier, stocks: stockSimule(), transactions: [], etat: 'commande', drive: 'ok', reseau: true,
    enregistrer: async () => { await pause(600); return { driveFileId: 'simule', fileName: 'commande fictive.pdf', bytes: 120000, sha256: '0'.repeat(64), verified: true, folder: 'L’Affinée / Justificatifs / 2026', webViewLink: 'https://drive.google.com/file/d/simule/view' }; },
  };
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------
// Lenteur D (voie e-ecran) : la pièce FICTIVE « Brauhaus Ouest » de ses maquettes (`choix-lenteur/d-06`, `d-lue`, `choix-lignes-38`, `choix-valider`, `choix-cas-38`), en lecture SIMULÉE :
// un provisoire (les deux premières lectures), puis le final (la 3.8). Aucune valeur d'une vraie pièce, Gemini jamais appelé, aucune écriture.
// ---------------------------------------------------------------------------------------------------------------------------------------------------------------
export type VarianteLenteur = 'lue' | 'ajoutee' | 'perdue' | 'perdues-2' | 'total' | 'echec' | 'sans-38' | 'touchee' | 'provisoire' | 'entete';
const JETON_LENTEUR = 'jeton-lenteur';
type LigneLenteur = { nom: string; kind: string; q: number | null; u: string; prix: number | null; montant: number; cat: string };
const L = (nom: string, q: number | null, u: string, prix: number | null, montant: number, cat: string, kind = 'stock'): LigneLenteur => ({ nom, kind, q, u, prix, montant, cat });

/** Le stock SIMULÉ de la pièce : six articles liés (« 6 reliés » de la maquette) ; Sucre candi reste sans article. */
function stockLenteur(): ApercuDepense['stocks'] {
  const art = (nom: string, unit: string, category: string) => ({ id: nom, ref: `MP-${nom}`, name: nom, unit, category, currentStock: 1, minStock: 0, reorder: false });
  return { rawMaterials: [art('Malt Pilsner', 'kg', 'Malt'), art('Malt de Munich', 'kg', 'Malt'), art('Carapils', 'kg', 'Malt'), art('Sabro 13.4%', 'g', 'Houblon'), art('Citra 12.5%', 'g', 'Houblon'), art('Levure Ale sèche', 'sachet', 'Levure')], cleaning: [], equipment: [], kegs: [] } as unknown as ApercuDepense['stocks'];
}

/** Les lectures de la pièce : `provisoire` (les deux premiers lecteurs), `final` (la 3.8, avec `rangProvisoire` et le jeton du morceau). Les ids sont ceux de `normalizeResult` : `line-N` dans l'ordre de chaque lecture. */
export function lecturesLenteur(variante: VarianteLenteur): { provisoire?: ScannedInvoiceResult; final: ScannedInvoiceResult; jeton: string } {
  const perdue = variante === 'perdue' || variante === 'perdues-2', deux = variante === 'perdues-2';
  const prov: LigneLenteur[] = [
    L('Malt Pilsner', 10, 'Kg', 1.45, 14.5, 'malt'), L('Malt de Munich', 4, 'Kg', 1.8, 7.2, 'malt'), L('Carapils', 1, '', 2.4, 2.4, 'malt'),
    ...(perdue ? [L('Avoine maltée', 0.5, 'Kg', 3.4, 1.7, 'malt')] : []),
    L('Sabro 13.4%', 30, '', 0.07, 2.1, 'hop'), L('Citra 12.5%', 50, '', 0.09, 4.5, 'hop'),
    ...(deux ? [L('Amarillo 9.2%', 25, 'g', 0.088, 2.2, 'hop')] : []),
    L('Levure Ale sèche', 2, '', 4.9, 9.8, 'yeast'), L('Sucre candi', 1, '', 5.9, 5.9, 'sugar'),
  ];
  const base = (lignes: LigneLenteur[], imprime: number, readers: number, over: Record<string, unknown> = {}): ScannedInvoiceResult => {
    const result = clone(lecture) as unknown as ScannedInvoiceResult;
    const items = lignes.map((l, i) => ({ id: `line-${i + 1}`, name: l.nom, kind: l.kind, quantity: l.q, unit: l.u, price: l.prix, amountTTC: l.montant, reference: '', variant: '', stockCategory: l.cat, evidence: '', ambiguity: '', vatCode: 'N', alphaPct: null, alphaPctLu: null }));
    const somme = Math.round(lignes.reduce((a, l) => a + l.montant, 0) * 100) / 100;
    Object.assign(result, {
      proForma: false, vendor: 'Brauhaus Ouest', date: '21.10.2026', invoiceNumber: 'F-4410', orderNumber: '', amountHT: null, tvaRate: null, tvaAmount: null, vat: [], category: 'brassage', amountTTC: imprime,
      items, printedLineCount: items.length, linesLost: 0, points: [], fieldWarnings: [], issues: [], remarques: [], description: 'Malts, houblons, levure (SIMULÉ)',
      controls: { lines: { checked: items.length, failed: 0, skipped: 0, skippedIds: [] }, sum: { statut: Math.abs(somme - imprime) < 0.005 ? 'ok' : 'ecart', base: 'TTC' }, vat: { statut: 'non-verifiable', base: 'TTC' }, totals: { statut: 'non-verifiable' } },
      review: { status: 'checked', findings: [], readers }, ...over,
    });
    return result;
  };
  // `entete` (e-finitions, D312 forme A) : une 3.8 qui ne corrige que la TVA (SIMULÉ : 3,38 lue par les deux premiers lecteurs, 3,48 par la 3.8 ; 8,1 % de 46,40 TTC = 3,48) ; aucune ligne ne change.
  const provisoire = base(prov, 46.4, 2, variante === 'entete' ? { tvaAmount: 3.38 } : {});
  if (variante === 'sans-38') return { final: base(prov, 46.4, 2), jeton: JETON_LENTEUR };
  // Le final : chaque ligne dit son rang provisoire ; la 3.8 ne lit plus Avoine maltée ni Amarillo, et corrige les cellules de d-lue (Pilsner 5 Kg × 2,90, Sabro et Citra en g).
  const corrige = (l: LigneLenteur): LigneLenteur => {
    if (variante === 'echec' || variante === 'provisoire' || variante === 'entete') return l;
    if (l.nom === 'Malt Pilsner') return { ...l, q: 5, prix: 2.9 };
    if (l.nom === 'Sabro 13.4%' || l.nom === 'Citra 12.5%') return { ...l, u: 'g' };
    if (variante === 'total' && l.nom === 'Malt de Munich') return { ...l, prix: 2.2, montant: 8.8 };
    return l;
  };
  const finales = prov.filter(l => !(perdue && (l.nom === 'Avoine maltée' || l.nom === 'Amarillo 9.2%'))).map(l => ({ l: corrige(l), rang: prov.indexOf(l) as number | null }));
  if (variante === 'ajoutee') finales.splice(finales.findIndex(x => x.l.nom === 'Citra 12.5%') + 1, 0, { l: L('Mosaic 11.8%', 20, 'g', 0.08, 1.6, 'hop'), rang: null });
  const final = base(finales.map(x => x.l), variante === 'total' ? 48 : 46.4, variante === 'echec' ? 2 : 3, { provisoireJeton: JETON_LENTEUR, ...(variante === 'entete' ? { tvaAmount: 3.48 } : {}) });
  final.items = final.items.map((it, i) => ({ ...it, rangProvisoire: finales[i].rang }));
  if (variante === 'echec') {
    // La 3.8 en échec : le final porte les valeurs du provisoire et le point « lecture coupée » (invoiceScanVote.ts, `finalOfTwo`).
    ajouterCoupure(final as any, 'delai-saute', phraseCoupure('delai-saute'));
  }
  return { provisoire, final, jeton: JETON_LENTEUR };
}

/** `lenteur-<variante>` : le provisoire à l'ouverture, puis le final 450 ms plus tard (7 s pour `touchee`, qui laisse le temps de taper ; jamais pour `provisoire`, l'attente de d-06). */
function apercuLenteur(etat: string): ApercuDepense {
  const nom = etat.slice('lenteur-'.length) as VarianteLenteur;
  const { provisoire, final } = lecturesLenteur(nom);
  const fichier = { name: 'capture-facture-lenteur.jpg', size: 412345, type: 'application/pdf' };
  const sortie = (result: ScannedInvoiceResult, extra: Partial<ScanOutcome> = {}): ScanOutcome => ({ ok: true, result, proofDataUrl: '', fileName: fichier.name, mimeType: fichier.type, model: 'simule', cached: false, ...extra });
  const outcomeFinal = sortie(final);
  return {
    outcome: provisoire ? sortie(provisoire) : outcomeFinal, fichier, stocks: stockLenteur(), transactions: [], etat, drive: 'ok', reseau: true,
    ...(provisoire ? { provisoire: sortie(provisoire, { jeton: JETON_LENTEUR }), final: outcomeFinal, delaiMs: nom === 'provisoire' ? null : nom === 'touchee' ? 7000 : 450 } : {}),
    enregistrer: async () => { await pause(600); return { driveFileId: 'simule', fileName: '2026-10-21 Brauhaus Ouest F-4410.pdf', bytes: 412345, sha256: '0'.repeat(64), verified: true, folder: 'L’Affinée / Justificatifs / 2026', webViewLink: 'https://drive.google.com/file/d/simule/view' }; },
  };
}

/** `vaccins` (BR-124, 10.11) : deux lignes Matériel d'une même facture, dont l'une (« H21 A vaccination ») voit son prix corrigé à la 3e lecture (25 → 30). SIMULÉ, noms et montants inventés
 *  sur la forme de sa facture, aucune donnée réelle. Sert à montrer que les deux lignes se déplient pareil et que « Ajouter au stock » est offert sur chacune. */
function apercuVaccins(etat: string): ApercuDepense {
  const { provisoire, final } = lecturesLenteur('perdue');
  const modele = provisoire!.items[0];
  const ligne = (i: number, nom: string, prix: number, rang?: number) => ({ ...modele, id: `line-${i}`, name: nom, kind: 'other', quantity: 1, unit: '', price: prix, amountTTC: prix, stockCategory: undefined, variant: '', reference: '', evidence: `${nom} ${prix.toFixed(2)}`, ...(rang === undefined ? {} : { rangProvisoire: rang }) }) as unknown as ScannedInvoiceResult['items'][number];
  const commun = { documentType: 'receipt', paymentMethod: 'twint', vendor: 'Pharmacie Exemple', category: 'divers', date: '10.11.2026', invoiceNumber: '', tvaAmount: null, amountPaid: undefined, points: [], issues: [], fieldWarnings: [], description: 'Vaccins (SIMULÉ)' };
  const controls = { lines: { checked: 0, failed: 0, skipped: 2, skippedIds: ['line-1', 'line-2'] }, sum: { statut: 'ok', base: 'TTC' }, vat: { statut: 'non-verifiable', base: 'TTC' }, totals: { statut: 'non-verifiable' } };
  Object.assign(provisoire!, commun, { items: [ligne(1, 'Vaxigrip Tetra', 26.68), ligne(2, 'H21 A vaccination', 25)], printedLineCount: 2, amountTTC: 51.68, controls });
  Object.assign(final, commun, { items: [ligne(1, 'Vaxigrip Tetra', 26.68, 0), ligne(2, 'H21 A vaccination', 30, 1)], printedLineCount: 2, amountTTC: 56.68, controls });
  const fichier = { name: 'capture-vaccins.jpg', size: 312345, type: 'application/pdf' };
  const sortie = (result: ScannedInvoiceResult, extra: Partial<ScanOutcome> = {}): ScanOutcome => ({ ok: true, result, proofDataUrl: '', fileName: fichier.name, mimeType: fichier.type, model: 'simule', cached: false, ...extra });
  return {
    outcome: sortie(provisoire!), fichier, stocks: { rawMaterials: [], cleaning: [], equipment: [], kegs: [] }, transactions: [], etat, drive: 'ok', reseau: true,
    provisoire: sortie(provisoire!, { jeton: JETON_LENTEUR }), final: sortie(final), delaiMs: 450,
    enregistrer: async () => { await pause(600); return { driveFileId: 'simule', fileName: 'vaccins.pdf', bytes: 312345, sha256: '0'.repeat(64), verified: true, folder: 'L’Affinée / Justificatifs / 2026', webViewLink: 'https://drive.google.com/file/d/simule/view' }; },
  };
}

export function apercuDepense(etat: string): ApercuDepense {
  if (etat.startsWith('lenteur-')) return apercuLenteur(etat);
  if (etat === 'vaccins') return apercuVaccins(etat);
  if (etat === 'commande') return apercuCommande();
  if (etat === 'familles') return apercuFamilles();
  if (etat === 'renovation') return apercuRenovation();
  if (etat === 's6') return apercuS6();
  if (etat.startsWith('qr-')) return apercuQr(etat);
  const result = clone(lecture) as unknown as ScannedInvoiceResult;
  if (etat === 'medicament') {
    // SIMULÉ (dp, 10.11) : son ticket de pharmacie BENU Matran, une ligne MEFENACIDE 13,40, dépense « divers » (tests/integration/depenseMedicament.test.tsx).
    Object.assign(result as unknown as Record<string, unknown>, { vendor: 'BENU Matran', date: '10.11.2026', invoiceNumber: '', description: 'Pharmacie', category: 'divers', subcategory: '', amountHT: null, tvaRate: null, tvaAmount: null, amountTTC: 13.4, issues: [], points: [], fieldWarnings: [],
      paymentEvidence: 'paid', paymentMethod: 'twint', amountPaid: 13.4, printedLineCount: 1, review: { status: 'checked', findings: [], readers: 3 },
      items: [{ id: 'line-1', name: 'MEFENACIDE cpr pell 500 mg sécables 30 pce', kind: 'other', quantity: null, unit: '', price: null, amountTTC: 13.4, reference: '', variant: '', stockCategory: '', evidence: 'MEFENACIDE cpr pell 500 mg sécables 30 pce 13.40' }] });
  }
  if (etat === '2' || etat === 'date') {
    // « lue, sans point » : la facture sans ses points (SIMULÉ).
    result.points = []; result.fieldWarnings = []; result.issues = []; result.review = { status: 'checked', findings: [], readers: 2 };
    result.items = result.items.map(i => (i.name.startsWith('Sabro') ? { ...i, unit: 'g' } : i));
  }
  if (etat === 'date') {
    // D233 : « lue, sans point » dont la date est absente ; un seul point, `date-absente`, de la forme du serveur (invoiceVisionReview.ts, pointsDesIssues) : écart, champ date, enjeu info, pèse.
    // Sept lignes sans mouture ni voisin d'article (la facture du brasseur du 01.11 en avait sept) : le total et les contrôles suivent les lignes gardées, aucun autre point ne pèse.
    result.items = result.items.filter(i => !/Zuschlag|Target|Hallertauer|Sabro|Galaxy|Nelson|Motueka|Goldings|Cascade/.test(i.name)).slice(0, 7);
    const somme = Math.round(result.items.reduce((a, i) => a + (i.amountTTC ?? 0), 0) * 100) / 100;
    Object.assign(result, { amountTTC: somme, amountHT: null, tvaAmount: null, vat: [], printedLineCount: result.items.length, proForma: false, controls: { ...result.controls!, lines: { checked: result.items.length, failed: 0, skipped: 0, skippedIds: [] } } });
    (result as { date: string | null }).date = null;
    const point = makePoint('date-absente', 'ecart', 'date', null, { regle: 'le code relève ce que la lecture ne permet pas de tenir pour sûr', message: 'Date absente ou invalide : à saisir.', unite: 'texte', enjeu: 'info' });
    result.points = [{ ...point, source: 'contrôle', pese: true, signature: signerPoint(point) }];
  }
  if (etat === 'deux-taux') {
    // 08.11 (doc2, vétérinaire à deux taux) : aucun total de TVA imprimé (`tvaAmount` null) mais le bloc par taux, chaque montant lu : la tuile doit dire la somme, 0,50 + 5,00 = 5,50 (SIMULÉ, montants inventés).
    // Sans les points de la lecture « 3 » (leurs lectures divergentes de TVA, 2,80 · 4,15, masqueraient la tuile) : la facture « lue, sans point ».
    result.points = []; result.fieldWarnings = []; result.issues = []; result.review = { status: 'checked', findings: [], readers: 2 };
    Object.assign(result, { tvaAmount: null, tvaRate: null, vat: [{ code: 'TVA', rate: 0.026, base: 19.2, amount: 0.5 }, { code: 'TVA', rate: 0.081, base: 61.73, amount: 5 }] });
    result.controls = { ...result.controls!, vat: { statut: 'ok', base: 'HT' } };
  }
  if (etat === 'port' || etat === 'port-sans-montant' || etat === 'tout-port') {
    // p3c-port (P21, D249) : états du port, SIMULÉS, dérivés ici (le JSON épinglé de `fixture.test.ts` ne change pas). Une ligne « Port » `shipping` :
    // 8,50 (état `port`, total 95,00), sans montant (`port-sans-montant`, la rangée reste visible : l'inconnu n'est jamais 0), ou seule (`tout-port`, 12,50 : une rangée).
    const base = (montant: number | null) => ({ id: 'line-24', name: 'Versand / Port', kind: 'shipping' as const, quantity: 1, unit: '', price: montant, amountTTC: montant, stockCategory: '', reference: 'VERSAND', evidence: '', ambiguity: '' }) as unknown as ScannedInvoiceResult['items'][number];
    const ajuste = (items: ScannedInvoiceResult['items'], total: number) => {
      Object.assign(result, { items, amountTTC: total, printedLineCount: items.length, controls: { ...result.controls!, lines: { ...result.controls!.lines, checked: items.length } } });
    };
    if (etat === 'port') { ajuste([...result.items, base(8.5)], 95); }
    else if (etat === 'port-sans-montant') { ajuste([...result.items, base(null)], 86.5); }
    else { ajuste([base(12.5)], 12.5); result.points = []; result.fieldWarnings = []; result.issues = []; result.tvaAmount = null; result.vat = []; }
  }
  const fichier = { name: 'capture-facture.jpg', size: 735721, type: 'application/pdf' };
  // `difficile` (D381) : une longue pièce lue en morceaux dont une partie manque ; le message propose une photo plus nette ou la saisie à la main.
  const outcome: ScanOutcome = etat === '5' || etat === 'difficile'
    ? { ok: false, error: etat === '5' ? 'Lecture impossible · service IA. Le fichier est gardé, rien n’est perdu.' : `Lecture en morceaux incomplète : la partie 2 sur 3 n'a pas été lue. Réessaie. ${PIECE_DIFFICILE}`, proofDataUrl: '', fileName: fichier.name, mimeType: fichier.type }
    : { ok: true, result, proofDataUrl: '', fileName: fichier.name, mimeType: fichier.type, model: 'simule', cached: false };
  return {
    outcome, fichier, stocks: stockSimule(), transactions: etat === '8' ? [doublon380001()] : [], etat,
    drive: etat === '6' ? 'non' : 'ok', reseau: etat !== '9',
    // SIMULÉ : l'envoi dure quelques secondes ; le reçu est fabriqué (aucun Drive).
    enregistrer: async () => {
      await pause(1800);
      return { driveFileId: 'simule', fileName: '2026-04-27 Brau- und Rauchshop 372765.jpg', bytes: 735721, sha256: '0'.repeat(64), verified: true, folder: 'L’Affinée / Justificatifs / 2026', webViewLink: 'https://drive.google.com/file/d/simule/view' };
    },
  };
}
