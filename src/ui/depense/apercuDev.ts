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
import type { ScanOutcome, ScannedInvoiceResult } from '../../services/geminiScanner';
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

export function apercuDepense(etat: string): ApercuDepense {
  if (etat === 's6') return apercuS6();
  if (etat.startsWith('qr-')) return apercuQr(etat);
  const result = clone(lecture) as unknown as ScannedInvoiceResult;
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
  const fichier = { name: 'capture-facture.jpg', size: 735721, type: 'application/pdf' };
  const outcome: ScanOutcome = etat === '5'
    ? { ok: false, error: 'Lecture impossible · service IA. Le fichier est gardé, rien n’est perdu.', proofDataUrl: '', fileName: fichier.name, mimeType: fichier.type }
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
