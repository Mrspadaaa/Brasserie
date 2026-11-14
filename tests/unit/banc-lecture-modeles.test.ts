import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  LITE_MODEL, STRONG_MODEL, callSpec, parseArgs, reservationMicro, runBench, simulateResponse, spentInJournal, type BenchCase, type ReadMeta
} from '../../scripts/banc-lecture-facture';
import {
  FORT_MAX_OUT, TARIFS_GEMINI4, assertModeleBanc, coutDecembre, coutObserveBanc, devisBanc, estGemini4, fortCourant, parseFort, poserFort
} from '../../scripts/banc-lecture-modeles';

// Gemini toujours simulé : aucun réseau, aucune clé (transport et lecture de clé injectés).
const file = { mimeType: 'image/jpeg', data: Buffer.from([255, 216, 255, 217]).toString('base64') };
const cas: BenchCase = {
  id: 'docT', file: 'x.jpg', mimeType: 'image/jpeg',
  expected: { vendor: 'Fournisseur test', documentType: 'invoice', date: '2026-01-02', currency: 'CHF', amountTTC: 10, items: [] }
};
let work = '';
beforeEach(() => { work = mkdtempSync(path.join(tmpdir(), 'g1-modeles-')); });
afterEach(() => { poserFort(null); if (work && existsSync(work)) rmSync(work, { recursive: true, force: true }); });

describe('g1 — le rôle de la 3.8 : modèle et réflexion au choix (banc seulement)', () => {
  it('lit « modèle@niveau » et refuse un niveau que le modèle n’accepte pas', () => {
    expect(parseFort('gemini-4-hydrogen@xhigh')).toEqual({ model: 'gemini-4-hydrogen', thinking: 'XHIGH' });
    expect(parseFort('gemini-4-argon@Medium')).toEqual({ model: 'gemini-4-argon', thinking: 'MEDIUM' });
    expect(parseFort('gemini-3.8-flash@high').thinking).toBe('HIGH');
    expect(() => parseFort('gemini-4-argon@xhigh')).toThrow('niveaux acceptés');
    expect(() => parseFort('gemini-4-carbon@minimal')).toThrow('minimal');
    expect(() => parseFort('gemini-3.8-flash@minimal')).toThrow('minimal');
    expect(() => parseFort('gemini-9-inconnu@low')).toThrow('--fort attend');
    expect(() => parseFort('gemini-4-argon')).toThrow('niveaux acceptés');
  });
  it('sans option, aucun réglage ne bouge ; avec elle, seuls les appels de la 3.8 changent', () => {
    expect(fortCourant()).toBeNull();
    const avant = callSpec('Csv8', 3);
    expect(avant.model).toBe(STRONG_MODEL);
    poserFort(parseFort('gemini-4-carbon@high'));
    expect(callSpec('Csv8', 3)).toMatchObject({ model: 'gemini-4-carbon', thinking: 'HIGH', maxOut: FORT_MAX_OUT });
    expect(callSpec('Csv8', 3).timeoutMs).toBeGreaterThanOrEqual(90_000);
    expect(callSpec('Csv8', 1)).toMatchObject({ model: LITE_MODEL, thinking: 'LOW' });
    poserFort(null);
    expect(callSpec('Csv8', 3)).toEqual(avant);
  });
  it('chiffre un modèle 4 à son tarif (jamais zéro, jamais celui d’un autre) et le refuse hors liste', () => {
    expect(estGemini4('gemini-4-argon')).toBe(true);
    expect(estGemini4(STRONG_MODEL)).toBe(false);
    expect(() => assertModeleBanc('gemini-9-inconnu')).toThrow('refusé');
    expect(() => assertModeleBanc('gemini-4-hydrogen')).not.toThrow();
    const usage = { usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 800, thoughtsTokenCount: 200, totalTokenCount: 2000 } };
    // 1000 jetons d'entrée et 1000 de sortie (réflexion comprise) ; ×1,25 CHF/USD ; micro-CHF
    const coutDe = (model: string) => coutObserveBanc(devisBanc(model, { generationConfig: { maxOutputTokens: 100 } }), usage)!.chargedMicroChf;
    const attendu = (model: string) => Math.ceil((1000 * TARIFS_GEMINI4[model].entree + 1000 * TARIFS_GEMINI4[model].sortie) * 5 / 4_000_000);
    expect(coutDe('gemini-4-hydrogen')).toBe(attendu('gemini-4-hydrogen'));
    expect(coutDe('gemini-4-argon')).toBe(attendu('gemini-4-argon'));
    expect(coutDe('gemini-4-carbon')).toBeGreaterThan(coutDe('gemini-4-hydrogen'));
    expect(coutDecembre('gemini-4-argon', 1000, 1000)).toBe(2 * coutDe('gemini-4-argon'));
    expect(coutDecembre('gemini-4-hydrogen', 1000, 1000)).toBe(coutDe('gemini-4-hydrogen'));
    // une réponse sans ses jetons : coût inconnu (null), jamais 0
    expect(coutObserveBanc(devisBanc('gemini-4-argon', { generationConfig: { maxOutputTokens: 100 } }), {})).toBeNull();
    expect(reservationMicro('gemini-4-carbon', FORT_MAX_OUT)).toBeGreaterThan(reservationMicro(STRONG_MODEL));
  });
  it('lit les options du banc (--fort, --journal, --plafond-cumul, --preter-lite) et tient le plafond de cumul', () => {
    const o = parseArgs(['--payant', '--budget-chf', '2', '--plafond-cumul', '10', '--fort', 'gemini-4-argon@low', '--journal', 'j.md', '--preter-lite']);
    expect(o).toMatchObject({ fort: 'gemini-4-argon@low', journal: 'j.md', plafondCumul: 10, preterLite: true, budgetChf: 2 });
    expect(() => parseArgs(['--payant', '--budget-chf', '4', '--plafond-cumul', '3'])).toThrow('--budget-chf');
    expect(() => parseArgs(['--payant', '--budget-chf', '4', '--plafond-cumul', '30'])).toThrow('--plafond-cumul');
    expect(() => parseArgs(['--simuler', '--fort', 'gemini-4-argon@xhigh'])).toThrow('niveaux acceptés');
    expect(parseArgs(['--simuler']).fort).toBeUndefined();
  });
  it('un banc payant simulé envoie le modèle et la réflexion choisis, journalise « modèle@niveau » dans le journal de la mission', async () => {
    const vus: Array<{ model: string; level: unknown; max: unknown }> = [];
    const transport = async (model: string, body: any, m: ReadMeta) => {
      vus.push({ model, level: body.generationConfig?.thinkingConfig?.thinkingLevel, max: body.generationConfig?.maxOutputTokens });
      const reponse = simulateResponse(cas, m, [], []);
      return { json: { ...reponse.json, usageMetadata: { promptTokenCount: 3000, candidatesTokenCount: 700, thoughtsTokenCount: 300, totalTokenCount: 4000 } }, ms: 1234 };
    };
    const journalPath = path.join(work, 'journal-gemini.md');
    const run = await runBench({ mode: 'payant', repeat: 1, out: path.join(work, 'sortie'), budgetChf: 2, plafondCumul: 10, faults: false, variantes: ['A'], fort: 'gemini-4-argon@high', journal: journalPath },
      { cases: [cas], plan: [], readKey: () => 'cle-de-test', optIn: () => {}, readFile: () => file, transport, log: () => {} });
    expect(run.stopped).toBeUndefined();
    expect(vus.length).toBeGreaterThanOrEqual(2);
    for (const vu of vus) expect(vu).toEqual({ model: 'gemini-4-argon', level: 'HIGH', max: FORT_MAX_OUT });
    const journal = readFileSync(journalPath, 'utf8');
    expect(journal).toContain('gemini-4-argon@high');
    expect(spentInJournal(journalPath)).toBeGreaterThan(0);
    // la passe remet le réglage à zéro : la suite du banc retrouve la production
    expect(fortCourant()).toBeNull();
    expect(JSON.parse(readFileSync(path.join(work, 'sortie', 'results.json'), 'utf8')).meta.fort).toBe('gemini-4-argon@high');
  });
});
