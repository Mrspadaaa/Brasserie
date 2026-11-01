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

export function apercuDepense(etat: string): ApercuDepense {
  if (etat === 's6') return apercuS6();
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
