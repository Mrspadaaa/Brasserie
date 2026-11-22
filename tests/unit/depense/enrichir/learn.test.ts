import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
/**
 * Voie f4-enrichir, M2 et M3 (REVUE-code) : le branchement 2 joué À TRAVERS `learnIngredient`. Le test écrit une copie de `src/services/storage.ts`
 * avec le branchement de RESULTAT.md (assemblage split/join, imports relatifs rendus absolus) dans `sondes/genere` de la voie (ignoré par Git), puis l'importe : `storage.ts`
 * de l'app n'est pas touché (il est au pilote). Firestore simulé : aucune donnée réelle. Gemini jamais appelé.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const etat = vi.hoisted(() => ({ items: [] as any[], puts: [] as any[], journal: [] as any[] }));
vi.mock('../../../../src/services/firestoreRepo', async orig => {
  const m = await orig<any>();
  return { ...m, FirestoreRepo: { ...m.FirestoreRepo, all: (nom: string) => (nom === 'stockItems' ? etat.items : []), put: (...args: any[]) => { etat.puts.push(args); } } };
});

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..').split(path.sep).join('/');
/** Le branchement 2, mot pour mot comme RESULTAT.md le donne au pilote. */
// Témoin rouge (ETAT.md) : avec l'ancien branchement (`ficheRetenueDe` puis `item = matches[0] ?? retenue?.article`), M2 houblon, M2 malt et M3 échouent.
export const IMPORT_BRANCHE = "import { apprendreSurFicheRetenue } from './enrichissementRecette';";
export const ANCRE = '    const item = matches[0];';
export const BRANCHE = "    if (!matches.length && !facts.ref && apprendreSurFicheRetenue(name, facts, stock, (resume, details) => this.logAction('Modification', 'Stocks', name.trim(), resume, details))) return;\n    const item = matches[0];";

let Storage: any;
beforeAll(async () => {
  const source = fs.readFileSync(path.join(racine, 'src/services/storage.ts'), 'utf8');
  const parts = source.split(ANCRE);
  if (parts.length !== 2) throw new Error(`ancre du branchement 2 trouvée ${parts.length - 1} fois`);
  let copie = `${IMPORT_BRANCHE}\n${parts.join(BRANCHE)}`;
  copie = copie.split("from './").join(`from '${racine}/src/services/`).split("from '../").join(`from '${racine}/src/`)
    .split("import('./").join(`import('${racine}/src/services/`).split("import('../").join(`import('${racine}/src/`);
  // Vitest ne charge pas un module hors de la racine : la copie va dans le dossier de sonde de la voie (ignoré par Git), un nom par processus.
  const dossier = path.join(racine, 'work/missions/2026-10-31-ecran-depense/voies/f4-enrichir/sondes/genere');
  fs.mkdirSync(dossier, { recursive: true });
  const fichier = path.join(dossier, `storage-branche-${process.pid}-${os.hostname().length}.ts`);
  fs.writeFileSync(fichier, copie);
  Storage = (await import(/* @vite-ignore */ fichier.split(path.sep).join('/'))).StorageService;
  Storage.logAction = (...args: any[]) => { etat.journal.push(args); };
});

const lien = (cle: string) => ({ id: `cle:${cle}`, approchee: false, par: 'en-ligne', cle });
const articleF4 = (ref: string, name: string, category: string, cle: string, more: Record<string, unknown> = {}) =>
  ({ id: ref, ref, name, category, unit: category === 'Houblon' ? 'g' : 'kg', currentStock: 1, minStock: 0, reorder: false, kind: 'rawMaterials', fiche: lien(cle), ...more });
const putsStock = () => etat.puts.filter(p => p[0] === 'stockItems');
beforeEach(() => { etat.items = []; etat.puts = []; etat.journal = []; });

describe('M2 : une valeur de recette ne devient jamais une donnée lue d’un lot', () => {
  it('houblon f4 + learnIngredient(α) → alphaPct du lot intact (aucune retenue pour un houblon)', () => {
    etat.items = [articleF4('MP-h-0', 'Cascade 2025 sac', 'Houblon', 'houblon||cascade')];
    Storage.learnIngredient('Cascade', { category: 'Houblon', alphaPct: 5.5 });
    expect(putsStock().filter(p => p[1] === 'MP-h-0')).toEqual([]);
  });
  it('malt f4 à EBC vide + learnIngredient(EBC) → l’EBC porte sa trace `remplis` (jamais une valeur lue)', () => {
    etat.items = [articleF4('MP-m-0', 'Carahell Weyermann 1 kg', 'Malt', 'malt|weyermann|carahell')];
    Storage.learnIngredient('Weyermann Carahell', { category: 'Malt', colorEbc: 20, alphaPct: 3 } as any);
    const ecrits = putsStock();
    expect(ecrits.map(p => p[1])).toEqual(['MP-m-0']);
    const patch = ecrits[0][2];
    expect(patch.colorEbc).toBe(20);
    expect(patch.alphaPct).toBeUndefined();
    expect(patch.fiche.remplis.colorEbc).toMatchObject({ par: 'retenue', niveau: 'repris', valeur: 20 });
    expect(patch.fiche).toMatchObject({ id: 'cle:malt|weyermann|carahell', par: 'en-ligne' });
  });
  it('D-b : levure f4, faits techniques et de fermentation normalisés comme le chemin d’origine (doublons fusionnés, forme invalide écartée)', async () => {
    const { cleFiche } = await import('../../../../src/domain/stock/ficheCle');
    const { mergeYeastTechnicalFacts } = await import('../../../../src/domain/ingredientFacts');
    const nom = 'Fermentis Ferment du Banc';
    etat.items = [articleF4('MP-y-0', 'Fermentis Ferment du Banc 11,5 g', 'Levure', cleFiche('levure', nom))];
    const fait = { key: 'attenuation', reported: '78-82 %', range: { min: 78, max: 82 }, unit: '%', qualifier: 'range', origin: 'manufacturer', source: 'Fiche du banc' };
    // Fermentation sans `version` : `readIngredientFermentationFacts` la refuse ; le chemin d'origine ne l'écrit pas.
    Storage.learnIngredient(nom, { category: 'Levure', yeastTechnicalFacts: [fait, { ...fait }], yeastFermentationFacts: { strainName: 'Banc' } } as any);
    const ecrits = putsStock().filter(p => p[1] === 'MP-y-0');
    expect(ecrits).toHaveLength(1);
    const patch = ecrits[0][2];
    const attendu = mergeYeastTechnicalFacts(undefined, [fait, { ...fait }] as any);
    expect(attendu).toHaveLength(1);
    expect(patch.yeastTechnicalFacts).toEqual(attendu);
    expect(patch.yeastFermentationFacts).toBeUndefined();
    expect(patch.fiche.remplis.yeastTechnicalFacts).toMatchObject({ par: 'retenue', niveau: 'repris' });
  });
  it('un journal qui lève après l’écriture ne fait pas écrire un FICHE-… en double (trouvé au rejeu E4 branché : `localStorage` absent)', () => {
    const avant = Storage.logAction;
    Storage.logAction = () => { throw new ReferenceError('localStorage is not defined'); };
    try {
      etat.items = [articleF4('MP-m-0', 'Carahell Weyermann 1 kg', 'Malt', 'malt|weyermann|carahell')];
      Storage.learnIngredient('Weyermann Carahell', { category: 'Malt', colorEbc: 20 } as any);
      expect(putsStock().map(p => p[1])).toEqual(['MP-m-0']);
    } finally { Storage.logAction = avant; }
  });
});

describe('M3 : sur `proche`, les faits acceptés ne disparaissent pas en silence', () => {
  it('« Carahell » contre l’article f4 « Weyermann Carahell » : rien sur l’article, une ligne de journal, les faits gardés à contrôler', async () => {
    const f4 = await import('../../../../src/services/enrichissement');
    const { createMemoryFichesStore } = await import('../../../../src/services/enrichissementStore');
    const store = createMemoryFichesStore();
    f4.setEnrichissementStore(store); f4.setUtilisateurFiche(async () => 'uid-banc');
    try {
      etat.items = [articleF4('MP-m-0', 'Carahell Weyermann 1 kg', 'Malt', 'malt|weyermann|carahell')];
      Storage.learnIngredient('Carahell', { category: 'Malt', colorEbc: 20 } as any);
      expect(putsStock()).toEqual([]);
      expect(etat.journal.some(e => /Faits acceptés gardés à contrôler/.test(String(e[3])))).toBe(true);
      await vi.waitFor(() => expect(store.rows.travaux.size).toBe(1));
      const t = [...store.rows.travaux.values()][0];
      expect(t).toMatchObject({ etat: 'aControler', raison: 'proche', famille: 'malt', faits: { colorEbc: 20 } });
      expect(await f4.resumeEnrichissement()).toMatchObject({ aControler: 1 });
      // D-a (REVUE-code-2) : un travail RECETTE-… n'a pas de dépense ; « Relancer » le refuse (sinon il attendrait à chaque réveil, sans fin).
      expect(t.ref.startsWith('RECETTE-')).toBe(true);
      expect(await f4.relancerFiche(t.ref)).toBe(false);
      expect(store.rows.travaux.get(t.ref)).toMatchObject({ etat: 'aControler', raison: 'proche' });
    } finally { f4.setEnrichissementStore(undefined); f4.setUtilisateurFiche(null); }
  });
  it('aucun article f4 : comportement d’avant (un FICHE-…), aucune ligne de f4', () => {
    Storage.learnIngredient('Carahell', { category: 'Malt', colorEbc: 20 } as any);
    expect(putsStock().map(p => p[1])).toEqual([expect.stringMatching(/^FICHE-/)]);
    expect(etat.journal.some(e => /gardés à contrôler/.test(String(e[3])))).toBe(false);
  });
});
