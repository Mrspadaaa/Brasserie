import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { appeler, creerEnv, envoyerSimule, parseReglage, ArretT2, VOIE } from '../../scripts/banc-t2c-commun';
import { sommeJournal } from '../../scripts/banc-compagnon';
import { DEFAUTS_PLANTES, ELEMENTS, bonneRaison, corpsElement, lireRelecture, refuse, agregerRelecture, type SortieRelecture } from '../../scripts/banc-t2c-relecture';
import { CAS_MAX, corpsTache, noterAnomalies, noterCas, PLANTEES } from '../../scripts/banc-t2c-max';

// Gemini toujours simulé : aucun réseau, aucune clé.
let work = '';
beforeEach(() => { work = mkdtempSync(path.join(tmpdir(), 't2c-')); });
afterEach(() => { if (work && existsSync(work)) rmSync(work, { recursive: true, force: true }); });
const env = (surcharge: Partial<ReturnType<typeof creerEnv>> = {}) => ({ ...creerEnv({ simuler: false, payant: true, plafondPasse: 1, journal: path.join(work, 'j.md') }, envoyerSimule()), ...surcharge });

describe('t2c — socle', () => {
  it('lit un réglage, refuse un niveau inconnu, accepte minimal sur Flash-Lite seulement', () => {
    expect(parseReglage('gemini-4-hydrogen@low').id).toBe('4-hydrogen@low');
    expect(parseReglage('gemini-3.5-flash-lite@minimal').thinking).toBe('MINIMAL');
    expect(() => parseReglage('gemini-4-hydrogen@minimal')).toThrow();
    expect(() => parseReglage('gemini-9@low')).toThrow();
  });
  it('journalise chaque appel avec le préfixe de la voie et s’arrête au plafond du tour', async () => {
    const e = env({ plafondTourMicro: 1_000_000 });
    const corps = { contents: [], generationConfig: { maxOutputTokens: 2000, thinkingConfig: { thinkingLevel: 'low' } } };
    const r = await appeler(e, { doc: 'essai', variante: 'review', reglage: parseReglage('gemini-4-hydrogen@low'), body: corps });
    expect(r.ok).toBe(true);
    expect(readFileSync(e.journal, 'utf8')).toContain(`${VOIE}:review`);
    expect(sommeJournal(e.journal, VOIE)).toBeGreaterThan(0);
    const serre = env({ journal: e.journal, plafondTourMicro: 10 });
    await expect(appeler(serre, { doc: 'essai', variante: 'review', reglage: parseReglage('gemini-4-hydrogen@low'), body: corps })).rejects.toBeInstanceOf(ArretT2);
  });
});

describe('t2c — relecture : défauts plantés', () => {
  it('chaque défaut remplace un champ du conseil dans le vrai corps de relecture, le contrôle le laisse intact', () => {
    expect(ELEMENTS).toHaveLength(DEFAUTS_PLANTES.length * 2);
    for (const element of ELEMENTS.filter(x => x.type === 'plante').slice(0, 3)) {
      const charge = JSON.parse(corpsElement(element).contents[0].parts[0].text);
      expect(charge.proposed[element.defaut!.champ]).toBe(element.defaut!.texte);
    }
    const controle = ELEMENTS.find(x => x.type === 'controle')!;
    expect(JSON.parse(corpsElement(controle).contents[0].parts[0].text).proposed).toBeTruthy();
  });
  it('lit une relecture : hors schéma = refus, bonne raison = motif trouvé', () => {
    const vide = lireRelecture({ candidates: [{ content: { parts: [{ text: 'pas du json' }] } }] });
    expect(vide.utilisable).toBe(false); expect(refuse(vide)).toBe(true);
    const bon = lireRelecture({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ approved: false, proposalApproved: false, issues: ['Dose d’acide à l’aveugle : pas de mesure.'] }) }] } }] });
    expect(bonneRaison(bon, DEFAUTS_PLANTES.find(d => d.cas === 'low-ph')!)).toBe(true);
    const approuve = lireRelecture({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ approved: true, proposalApproved: true, issues: [] }) }] } }] });
    expect(refuse(approuve)).toBe(false);
  });
  it('agrège : exactitude = bonnes raisons + contrôles approuvés', () => {
    const s = (element: string, type: string, verdict: SortieRelecture['verdict']): SortieRelecture => ({ reglage: 'r', element, cas: 'low-ph', type, moitie: 'choix', verdict, ms: 1000, coutMicro: 10_000, etat: 'STOP' });
    const l = agregerRelecture([s('a', 'plante', { utilisable: true, approved: false, proposalApproved: false, issues: ['acide dose'] }), s('b', 'controle', { utilisable: true, approved: true, proposalApproved: true, issues: [] })]).find(x => x.moitie === 'tout')!;
    expect(l.exactitude).toBe(1); expect(l.fauxRefus).toBe(0); expect(l.bonneRaison).toBe(1);
  });
});

describe('t2c — Max : fixtures et contrôles', () => {
  it('les anomalies : rappel, précision, types', () => {
    const exact = { anomalies: PLANTEES['A-anomalies-1'].map(p => ({ transactionIds: p.ids, type: p.type, severity: 'attention', explanation: 'x' })), checkedCount: 18 };
    expect(noterAnomalies('A-anomalies-1', exact).qualite).toBeCloseTo(1);
    const fauxPositif = noterAnomalies('A-anomalies-1', { anomalies: [...exact.anomalies, { transactionIds: ['T03'], type: 'montant', severity: 'info', explanation: 'loyer' }], checkedCount: 18 });
    expect(fauxPositif.fauxPositifs).toBe(1); expect(fauxPositif.rappel).toBe(1); expect(fauxPositif.qualite).toBeLessThan(1);
    expect(noterAnomalies('A-anomalies-1', { anomalies: [], checkedCount: 18 }).qualite).toBe(0);
  });
  it('la synthèse : un total juste passe, un total faux échoue, la TVA inventée échoue', () => {
    const m1 = CAS_MAX.find(c => c.id === 'M1-non-assujetti')!;
    const bon = { period: '2026-10', totalCharges: 2159.5, totalRecettes: 1910.5, solde: -249, byCategory: [{ category: 'Matières premières', total: 263 }, { category: 'Loyer', total: 1200 }], highlights: [], attentionPoints: ['Levure : montant manquant'] };
    expect(noterCas(m1, bon, true).qualite).toBe(1);
    expect(noterCas(m1, { ...bon, totalCharges: 2000, tvaCollected: 12.5 }, true).qualite).toBeLessThan(0.8);
    expect(noterCas(m1, undefined, false).utilisable).toBe(false);
  });
  it('le diagnostic des relevés rares n’invente pas d’atténuation ; le corps Max est celui de la production (T 0,2, 12 000), le Rapide à T 0', () => {
    const d4 = CAS_MAX.find(c => c.id === 'D4-donnees-rares')!;
    expect(noterCas(d4, { verdict: 'Aucune bulle à 36 h : mesurer la densité, vérifier le couvercle, patience.', severity: 'normal', causes: [], apparentAttenuationPct: 40 }, true).passes).not.toContain('aucune atténuation inventée (un seul relevé)');
    const max: any = corpsTache(d4, 'high'), rapide: any = corpsTache(d4, 'low');
    expect(max.generationConfig.temperature).toBe(0.2); expect(max.generationConfig.maxOutputTokens).toBeGreaterThanOrEqual(12_000);
    expect(rapide.generationConfig.temperature).toBe(0); expect(rapide.generationConfig.maxOutputTokens).toBe(4500);
  });
});
