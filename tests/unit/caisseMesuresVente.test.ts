import { describe, expect, it, vi } from 'vitest';
import { crc32, deflateSync } from 'node:zlib';
/**
 * Voie bg, mesure d'abord : où part le temps d'un enregistrement de vente ? Chaque étape locale est chronométrée sur la fixture (vrais PDF jsPDF,
 * vraie file locale en mémoire) ; l'envoi Drive est SIMULÉ (jamais appelé pour de vrai), donc non mesuré : son coût se lit dans le code.
 * Les durées sont écrites en console (lues dans voies/bg/mesures.txt) ; seul un garde-fou large est affirmé, pas une valeur de machine.
 */
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, auth: { currentUser: null }, storage: {} }));
import { preparerVente } from '../../src/ui/vente/enregistrerVente';
import { createMemoryProofStore, enqueueProof, setProofFileStore } from '../../src/services/proofQueue';
import type { AppConfig, Client } from '../../src/types';

const config = { fiscal: { isTvaRegistered: true, tvaNormalRate: 0.081 }, company: { name: 'Brasserie Test', owner: '', uid: 'CHE-123.456.789', iban: 'CH93 0076 2011 6238 5295 7',
  adresse: { rue: 'Rue du Test', numero: '1', npa: '1700', localite: 'Fribourg', pays: 'CH' } }, brewhouses: [] } as unknown as AppConfig;
const client: Client = { id: 'C2', name: 'Martin Rey', type: 'Privé', contact: '', phone: '', email: '', adresse: { rue: 'Chemin des Fixtures', numero: '4', npa: '1700', localite: 'Fribourg', pays: 'CH' } };
const lignes = [0, 1, 2, 3].map(i => ({ cle: `B1:${i}`, batchId: 'B1', formatId: '33cl', designation: `Pale Ale · 33 cl ${i}`, litresUnite: 0.33, quantite: 6 + i, prixHT: 5 }));
/** Un vrai PNG de la taille du bulletin rasterisé à 300 dpi (210 × 105 mm = 2480 × 1240 px), motif de blocs comme un QR : le coût de jsPDF qui l'intègre est réel. */
function pngBulletin(): string {
  const w = 2480, h = 1240, brut = Buffer.alloc((w + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) brut[y * (w + 1) + 1 + x] = (((x >> 4) * 2654435761 + (y >> 4) * 40503) >>> 7) & 1 ? 0 : 255;
  const bloc = (type: string, data: Buffer) => { const t = Buffer.from(type), l = Buffer.alloc(4), c = Buffer.alloc(4); l.writeUInt32BE(data.length); c.writeUInt32BE(crc32(Buffer.concat([t, data]))); return Buffer.concat([l, t, data, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 0;
  return `data:image/png;base64,${Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), bloc('IHDR', ihdr), bloc('IDAT', deflateSync(brut)), bloc('IEND', Buffer.alloc(0))]).toString('base64')}`;
}
const png = pngBulletin();
const base = { lignes, dateIso: new Date().toISOString().slice(0, 10), echeance: 30 as const, config, rasteriser: async () => png };

const med = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
async function chrono<T>(n: number, f: () => Promise<T>): Promise<{ ms: number; last: T }> {
  await f(); // chauffe (chargement des modules, JIT)
  const t: number[] = []; let last!: T;
  for (let i = 0; i < n; i++) { const a = performance.now(); last = await f(); t.push(performance.now() - a); }
  return { ms: med(t), last };
}

describe('Mesure : où part le temps d\'un enregistrement de vente', () => {
  it('PDF (quittance, facture QR), préparation du justificatif et mise en file : durées locales, médiane de 7', async () => {
    const q = await chrono(7, () => preparerVente({ ...base, mode: 'paye', client: null, moyen: 'twint', numero: 'FAC-X-1' }));
    const f = await chrono(7, () => preparerVente({ ...base, mode: 'qr', client, numero: 'FAC-2026-0001' }));
    setProofFileStore(createMemoryProofStore());
    let n = 0;
    const file = await chrono(7, async () => {
      const p = f.last.entry.proof;
      return enqueueProof({ submissionId: `mesure-${n++}`, dataUrl: p.parts.join(''), mimeType: p.mimeType, driveName: p.fileName, year: 2026, uid: 'u', transactionId: 'FAC-2026-0001' });
    });
    setProofFileStore(undefined);
    const ko = (s: string) => `${Math.round(s.length / 1024)} Ko`;
    console.log(`MESURES quittance (preparerVente paye, jsPDF) : ${q.ms.toFixed(1)} ms, PDF ${ko(q.last.entry.proof.parts.join(''))}`);
    console.log(`MESURES facture QR (preparerVente qr, jsPDF + swissqrbill, bulletin PNG 2480 × 1240 px fourni, le rendu canvas du navigateur n'est pas mesuré) : ${f.ms.toFixed(1)} ms, PDF ${ko(f.last.entry.proof.parts.join(''))}`);
    console.log(`MESURES mise en file (empreinte SHA-256 + écriture, magasin mémoire) : ${file.ms.toFixed(1)} ms`);
    expect(q.ms).toBeLessThan(2000); expect(f.ms).toBeLessThan(2000); expect(file.ms).toBeLessThan(500);
  });
});
