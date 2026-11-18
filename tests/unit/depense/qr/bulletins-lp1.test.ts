// @vitest-environment jsdom
/**
 * LP-1 (lecture en ligne du 08.11, doc3 « bulletins QR tournés ») : deux bulletins QR sur une photo étaient lus comme un seul document : total de page 300,00
 * contre 150,00 au QR. Le QR garde la priorité sur le total de la page (rien n'est remplacé sans le geste du brasseur) ; la lecture dit désormais
 * qu'il y a PLUSIEURS bulletins sur la pièce, pour que le brasseur sache pourquoi le total de la page diffère. zxing-wasm est simulé : aucune pièce réelle.
 */
import { describe, expect, it, vi } from 'vitest';
import { charge, S1_EXEMPLE } from './aide';

vi.mock('zxing-wasm/reader', () => ({ readBarcodes: vi.fn(), prepareZXingModule: vi.fn() }));
vi.mock('zxing-wasm/reader/zxing_reader.wasm?url', () => ({ default: '/assets/zxing_reader-test.wasm' }));
vi.mock('pdfjs-dist', () => ({ GlobalWorkerOptions: {}, getDocument: vi.fn() }));
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: '/assets/pdf.worker.min-test.mjs' }));

import { classer, lireQrDuFichier, type CodeLu } from '../../../../src/services/qrLecture';
import { resumeQr } from '../../../../src/ui/depense/qrVue';

const spc = (o = {}): CodeLu => ({ texte: charge({ s1: S1_EXEMPLE, ...o }), decode: true });
const autre = (): CodeLu => spc({ montant: '150.00' });

describe('LP-1 : plusieurs bulletins QR sur une même photo', () => {
  it('deux QR-factures décodés : le premier est gardé et le nombre de bulletins est dit', () => {
    const r = classer([spc(), autre()]);
    expect(r.qr).not.toBeNull();
    expect(r.bulletins).toBe(2);
  });
  it('un seul bulletin : aucune mention (la forme rendue ne change pas)', () => {
    expect(classer([spc()]).bulletins).toBeUndefined();
    expect(classer([{ texte: 'https://exemple.test', decode: true }, spc()]).bulletins).toBeUndefined();
  });
  it('la lecture d’une photo à deux bulletins rend `bulletins` et le résumé du QR le dit', async () => {
    const photo = new File([new Uint8Array([1, 2, 3])], 'bulletins.jpg', { type: 'image/jpeg' });
    const moteurs = { lireCodes: async () => [spc(), autre()], pagesPdf: async function* () { /* aucune page */ }, agrandir: async () => null };
    const r = await lireQrDuFichier(photo, moteurs);
    expect(r.statut).toBe('lu');
    if (r.statut === 'lu') expect(r.bulletins).toBe(2);
    expect(resumeQr(r)).toMatch(/2 bulletins QR sur la pièce/);
  });
  it('un seul bulletin : le résumé ne parle pas de plusieurs bulletins', async () => {
    const photo = new File([new Uint8Array([1, 2, 3])], 'un.jpg', { type: 'image/jpeg' });
    const r = await lireQrDuFichier(photo, { lireCodes: async () => [spc()], pagesPdf: async function* () { /* aucune page */ }, agrandir: async () => null });
    expect(resumeQr(r)).not.toMatch(/bulletins/);
  });
});
