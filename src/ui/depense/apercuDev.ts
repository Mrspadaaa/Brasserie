// Banc local de l'écran « Nouvelle dépense » (voie e-port) : la facture 372765 en lecture SIMULÉE, le stock SIMULÉ, l'enregistrement SIMULÉ.
// Chargé seulement en développement (`import.meta.env.DEV` dans QuickActionModal, import dynamique) : jamais dans `dist/`. Gemini n'est jamais appelé,
// aucun Drive, aucune écriture. La lecture est la sortie du VRAI rapprochement du serveur (tests/unit/depense/ecran/fixture.test.ts la régénère) ;
// seule l'unité de Sabro est simulée (sa facture imprime « g »). Ni nom ni adresse du brasseur.
import lecture from './apercu/lecture-372765.reconciliee.json';
import stock from './apercu/stock-simule.json';
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

export function apercuDepense(etat: string): ApercuDepense {
  const result = clone(lecture) as unknown as ScannedInvoiceResult;
  if (etat === '2') {
    // « lue, sans point » : la facture sans ses points (SIMULÉ).
    result.points = []; result.fieldWarnings = []; result.issues = []; result.review = { status: 'checked', findings: [], readers: 2 };
    result.items = result.items.map(i => (i.name.startsWith('Sabro') ? { ...i, unit: 'g' } : i));
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
