// Banc t2a : notation exercée sur des réponses vraies et fautives, règlement du coût, tableau, passe simulée. Aucun appel Gemini.
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  alphaFacultatif, programmeEmpatage, renoter, ancrageDe, chargerCas, corpsCas, envoyerSimule, lireArgs, ligneDe, noter, parseCellule, passe, planifier, reponseSimulee, tableauUsage, verdictDe, type Cas, type Env, type Mesure
} from '../../scripts/banc-t2a-usages';

const cas = chargerCas();
const parId = (id: string) => cas.find(c => c.id === id)!;
const reponseVraie = (c: Cas) => JSON.parse(reponseSimulee(c, parseCellule('hy@low'), false).candidates[0].content.parts[0].text);

describe('cellules', () => {
  it('lit prod, lite, hy, ar, ca et refuse un niveau inconnu', () => {
    expect(parseCellule('prod@low')).toEqual({ id: '3.8@low', model: 'gemini-3.8-flash', level: 'low' });
    expect(parseCellule('lite@minimal').model).toBe('gemini-3.5-flash-lite');
    expect(parseCellule('ar@medium').id).toBe('ar@medium');
    expect(() => parseCellule('hy@minimal')).toThrow();
    expect(() => parseCellule('ca@xhigh')).toThrow();
  });
  it('corps de production : modèle 4 en MAJUSCULES et sortie à 12 000, prod inchangée', () => {
    const c = parId('imp-fr-metrique');
    const quatre = corpsCas(c, parseCellule('hy@low')).generationConfig;
    expect(quatre.thinkingConfig.thinkingLevel).toBe('LOW');
    expect(quatre.maxOutputTokens).toBe(12000);
    const prod = corpsCas(c, parseCellule('prod@low')).generationConfig;
    expect(prod.thinkingConfig.thinkingLevel).toBe('low');
    expect(prod.maxOutputTokens).toBe(8000);
    expect(corpsCas(c, parseCellule('prod@low')).tools).toEqual([{ googleSearch: {} }]);
    expect(corpsCas(parId('rel-stout-saine'), parseCellule('prod@low')).tools).toBeUndefined();
  });
});

describe('notation : vérité reconnue, fautes relevées', () => {
  const faute = (id: string, abime: (j: any) => void) => { const c = parId(id); const j = reponseVraie(c); abime(j); return noter(c, j); };
  it('import : une réponse conforme à la vérité a 1', () => {
    for (const id of ['imp-fr-metrique', 'imp-de-plato', 'imp-en-imperial', 'imp-saison-sucre']) {
      const n = noter(parId(id), reponseVraie(parId(id)));
      expect(n.note, `${id} : ${n.detail}`).toBeCloseTo(1, 5);
      expect(n.utilisable).toBe(true);
    }
  });
  it('import : volume en gallons non converti = inutilisable ; candi rangé en grain et alpha inventé coûtent', () => {
    expect(faute('imp-en-imperial', j => { j.volumeL = 5; }).utilisable).toBe(false);
    const candi = faute('imp-saison-sucre', j => { j.fermentables[2].kind = 'grain'; });
    expect(candi.note!).toBeLessThan(1);
    const alpha = faute('imp-fr-metrique', j => { j.hops[2].alpha = 4.2; });
    expect(alpha.inventes).toBe(1);
    expect(alpha.note!).toBeLessThan(1);
    const enTrop = faute('imp-fr-metrique', j => { j.hops.push({ name: 'Citra', weightG: 10, stage: 'dryHop', dayOffset: 3 }); });
    expect(enTrop.inventes).toBe(1);
    expect(faute('imp-fr-metrique', j => { j.fermentables.splice(0, 1); }).utilisable).toBe(false);
    expect(noter(parId('imp-fr-metrique'), undefined).utilisable).toBe(false);
  });
  it('import : un alpha complété avec une source citée en tête de fiche n’est pas inventé', () => {
    const c = parId('imp-fr-metrique'); const j = reponseVraie(c); j.hops[2].alpha = 4.2; j.source = 'Fiche BarthHaas Hallertau Mittelfrüh';
    expect(noter(c, j).inventes).toBe(0);
  });
  it('relecture : défauts relevés ; bloquant injustifié et recette saine bavarde sanctionnés', () => {
    expect(noter(parId('rel-defauts-helles'), reponseVraie(parId('rel-defauts-helles'))).note!).toBeCloseTo(1, 5);
    const bloquant = faute('rel-ipa-levure-eau', j => { j.findings.push({ severity: 'bloquant', topic: 'couleur', observation: 'trop pâle', suggestion: '' }); });
    expect(bloquant.inventes).toBe(1); expect(bloquant.critique).toBe(true);
    const sain = faute('rel-stout-saine', j => { j.findings = [1, 2, 3].map(n => ({ severity: 'gout', topic: `t${n}`, observation: 'o', suggestion: 's' })); });
    expect(sain.note!).toBeLessThan(1);
    expect(noter(parId('rel-stout-saine'), { verdict: 'ok' }).utilisable).toBe(false);
  });
  it('coa : mesures exactes, plage variétale et HSI refusés', () => {
    expect(noter(parId('coa-piege'), reponseVraie(parId('coa-piege'))).note!).toBeCloseTo(1, 5);
    const plage = faute('coa-piege', j => { j.analysis.push({ analyte: 'alpha', unit: 'percentMass', kind: 'range', range: { min: 11, max: 14 } }); });
    expect(plage.inventes).toBe(1); expect(plage.critique).toBe(true);
    const hsi = faute('coa-piege', j => { j.analysis.push({ analyte: 'hsi', unit: 'percentMass', kind: 'unknown' }); });
    expect(hsi.inventes).toBe(1);
    expect(faute('coa-simple', j => { j.analysis[0].value = 6.9; }).note!).toBeLessThan(1);
    expect(faute('coa-simple', j => { j.lotNumber = 'AUTRE'; }).note!).toBeLessThan(1);
  });
  it('variété : la fictive ne se trouve pas ; Citra dans la plage avec une source', () => {
    expect(noter(parId('var-fictive'), reponseVraie(parId('var-fictive'))).note).toBeCloseTo(1, 5);
    expect(faute('var-fictive', j => { j.found = true; j.analysis = [{ analyte: 'alpha' }]; }).inventes).toBe(1);
    expect(noter(parId('var-citra'), reponseVraie(parId('var-citra'))).note).toBeCloseTo(1, 5);
    expect(faute('var-citra', j => { j.analysis[0].value = 25; }).note!).toBeLessThan(1);
    expect(faute('var-citra', j => { j.source = ''; j.analysis[0].source = { reference: '' }; }).note!).toBeLessThan(1);
  });
});

describe('ancrage et règlement', () => {
  it('lu N / non prouvé / sans objet', () => {
    expect(ancrageDe('import', { candidates: [{ groundingMetadata: { webSearchQueries: ['a', 'b', 'a'] } }] })).toBe('lu 2');
    expect(ancrageDe('variete', { candidates: [{ content: {} }] })).toBe('non prouvé');
    expect(ancrageDe('relecture', { candidates: [{ content: {} }] })).toBe('sans objet');
  });
});

describe('passe simulée', () => {
  it('joue le choix, écrit le journal hors comptes, arrête au plafond de passe', async () => {
    const dossier = mkdtempSync(path.join(tmpdir(), 't2a-'));
    const cellules = ['prod@low', 'hy@low', 'ar@low'].map(parseCellule);
    const env: Env = { journal: path.join(dossier, 'journal.md'), plafondTourMicro: 14.5e6, plafondVoieMicro: 5e6, plafondPasseMicro: 10e6, depensePasseMicro: 0, arret: {}, simule: true, workers: 2,
      envoyer: envoyerSimule(modele => cellules.find(c => c.model === modele)!, cas) };
    const taches = planifier(cas, { usages: ['import', 'relecture', 'variete'], cas: [], cellules, moitie: 'choix' });
    expect(taches).toHaveLength(7 * 3);
    const mesures: Mesure[] = await passe(env, taches, path.join(dossier, 'sorties'));
    expect(mesures).toHaveLength(21);
    expect(mesures.every(m => m.ok)).toBe(true);
    const journal = readFileSync(env.journal, 'utf8');
    expect(journal.match(/t2a:/g)).toHaveLength(21);
    const tableau = tableauUsage('import', mesures, 'choix', ['3.8@low']);
    expect(tableau.split('\n')[0]).toBe('| réglage | qualité | inutilisables | p50 s | p90 s | CHF/appel | ancrage non prouvé | verdict |');
    expect(tableau.split('\n')[2]).toContain('3.8@low (production)');
    const petit: Env = { ...env, journal: path.join(dossier, 'j2.md'), plafondPasseMicro: 1, arret: {} };
    await passe(petit, taches, path.join(dossier, 'sorties2'));
    expect(petit.arret.raison).toMatch(/plafond de la passe/);
  });
  it('verdict : élimination par qualité, inutilisable ou lenteur ; tarif doublé dit pour Argon', () => {
    const l = (cellule: string, q: number, p50: number, inu = 0, chf = 0.03, dec = 0.03) => ({ cellule, n: 3, qualite: q, inutilisables: inu, inventes: 0, p50, p90: p50, chf, chfDecembre: dec, nonProuve: 0, ancres: 0, appels: 3 });
    const prod = l('3.8@low', 0.9, 10);
    expect(verdictDe(l('hy@low', 0.8, 12), prod, 'choix', true)).toMatch(/éliminé.*qualité/);
    expect(verdictDe(l('hy@low', 0.9, 25), prod, 'choix', true)).toMatch(/p50/);
    expect(verdictDe(l('hy@low', 0.9, 10, 1), prod, 'choix', true)).toMatch(/inutilisable/);
    expect(verdictDe(l('ar@low', 0.95, 12, 0, 0.03, 0.06), prod, 'jugement', true)).toMatch(/1\.12/);
    expect(ligneDe('x', []).qualite).toBeNull();
  });
  it('options : plafond de voie borné à 5 CHF', () => {
    expect(lireArgs(['--budget-chf', '9', '--cellules', 'hy@low']).plafondVoie).toBe(5);
  });
});

describe('amendements de notation (14.11, après la passe 1)', () => {
  const c = () => parId('imp-fr-metrique');
  it('le programme d’empâtage est lu sous mashSteps, mash.steps ou steps, avec la même note', () => {
    const base = reponseVraie(c());
    const paliers = programmeEmpatage(base);
    expect(paliers.length).toBeGreaterThan(0);
    const { mashSteps, ...reste } = base;
    const sous = { steps: reponseVraie(c()).mashSteps, mash: undefined };
    expect(programmeEmpatage({ ...reste, ...sous }).length).toBe(paliers.length);
    expect(programmeEmpatage({ ...reste, mash: { steps: mashSteps } }).length).toBe(paliers.length);
    const note = noter(c(), base).note!;
    expect(noter(c(), { ...reste, steps: mashSteps }).note).toBeCloseTo(note, 10);
    expect(noter(c(), { ...reste, mash: { steps: mashSteps } }).note).toBeCloseTo(note, 10);
  });
  it('sans palier du tout, la note baisse : la lecture élargie n’invente rien', () => {
    const base = reponseVraie(c());
    const { mashSteps, ...reste } = base;
    expect(noter(c(), { ...reste, steps: [] }).note!).toBeLessThan(noter(c(), base).note!);
  });
  it('alphaFacultatif : un houblon cité une seconde fois (même nom, même alpha) peut rester sans alpha', () => {
    const e = c().expected;
    expect(alphaFacultatif(e, 1)).toBe(true);
    expect(alphaFacultatif(e, 0)).toBe(false);
    const rendu = reponseVraie(c());
    const sans = { ...rendu, hops: rendu.hops.map((h: any, k: number) => (k === 1 ? { ...h, alpha: undefined } : h)) };
    expect(noter(c(), sans).note!).toBeCloseTo(noter(c(), rendu).note!, 10);
  });
  it('renoter : relit la réponse enregistrée et applique la règle du jour, sans appel', () => {
    const base = reponseVraie(c());
    const { mashSteps, ...reste } = base;
    const m: Mesure = { cas: c().id, usage: 'import', half: 'choix', cellule: 'hy@low', ok: true, ms: 1, microChf: 1, microDecembre: 1, entree: 1, sortie: 1, etat: 'STOP', ancrage: 'non prouvé',
      note: 0.5, utilisable: true, inventes: 0, detail: 'ancien', reponse: JSON.stringify({ ...reste, steps: mashSteps }) };
    const neuf = renoter(m, cas);
    expect(neuf.note).toBeCloseTo(noter(c(), base).note!, 10);
    expect(neuf.detail).not.toBe('ancien');
    expect(renoter({ ...m, reponse: '{coupé' }, cas).note).toBe(0.5);
  });
});
