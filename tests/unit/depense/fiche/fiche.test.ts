import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { DONNEES_FIXTURE } from '../../../../src/domain/hopIndex/v4/data';
import { ficheLaPlusProche, nomDeFiche } from '../../../../src/domain/stock/fiche';
import { articleNeufDe } from '../../../../src/domain/stock/articleNeuf';

const cat = { houblons: DONNEES_FIXTURE.catalogue };
const item = (ref: string, name: string, category: string, unit: string, more: Record<string, unknown> = {}) => ({ id: ref, ref, name, category, unit, currentStock: 10, minStock: 0, reorder: false, ...more }) as any;

describe('la fiche la plus proche : houblons (catalogue de l’index, jamais Gemini)', () => {
  it('Target sans origine, α dans la plage de la fiche : exacte', () => {
    expect(ficheLaPlusProche('Target', 'Houblon', undefined, 11.3, undefined, cat)).toMatchObject({ id: 'beermaverick-target', approchee: false });
  });
  it('Cascade CH : la fiche Cascade (États-Unis), approchée ; nom affiché « Cascade US »', () => {
    const f = ficheLaPlusProche('Cascade', 'Houblon', 'CH', undefined, undefined, cat);
    expect(f).toMatchObject({ id: 'beermaverick-cascade', approchee: true, nom: 'Cascade US' });
    expect(nomDeFiche('beermaverick-cascade', cat)).toBe('Cascade US');
  });
  it('Cascade US : la fiche exacte (même pays)', () => {
    expect(ficheLaPlusProche('Cascade', 'Houblon', 'US', undefined, undefined, cat)).toMatchObject({ id: 'beermaverick-cascade', approchee: false });
  });
  it('une fiche dédiée existe : « Saaz US » → Saaz (US), non approchée ; « Saaz CZ » → Saaz (CZ)', () => {
    expect(ficheLaPlusProche('Saaz', 'Houblon', 'US', undefined, undefined, cat)).toMatchObject({ id: 'beermaverick-saaz-us', approchee: false });
    expect(ficheLaPlusProche('Saaz', 'Houblon', 'CZ', undefined, undefined, cat)).toMatchObject({ id: 'beermaverick-saaz-cz', approchee: false });
  });
  it('Hallertauer Blanc CH : la fiche Hallertau Blanc (Allemagne), approchée ; UK et GB sont le même pays', () => {
    expect(ficheLaPlusProche('Hallertauer Blanc', 'Houblon', 'CH', 9.5, undefined, cat)).toMatchObject({ id: 'beermaverick-hallertau-blanc', approchee: true });
    expect(ficheLaPlusProche('Target', 'Houblon', 'UK', undefined, undefined, cat)?.approchee).toBe(false);
    expect(ficheLaPlusProche('Target', 'Houblon', 'GB', undefined, undefined, cat)?.approchee).toBe(false);
  });
  it('un α hors de la plage de la fiche rend la fiche approchée', () => {
    expect(ficheLaPlusProche('Target', 'Houblon', undefined, 30, undefined, cat)?.approchee).toBe(true);
  });
  it('un code d’origine sans pays connu (CH, AT, BE) rend la fiche approchée, jamais exacte', () => {
    expect(ficheLaPlusProche('Target', 'Houblon', 'AT', undefined, undefined, cat)?.approchee).toBe(true);
  });
  it('produit inconnu, ou catalogue absent : aucune fiche, jamais devinée', () => {
    expect(ficheLaPlusProche('Zzzxqw', 'Houblon', undefined, undefined, undefined, cat)).toBeUndefined();
    expect(ficheLaPlusProche('Cascade', 'Houblon', 'US', undefined, undefined, {})).toBeUndefined();
    expect(ficheLaPlusProche('Cascade', 'Houblon', 'US', undefined, undefined, { houblons: [] })).toBeUndefined();
  });
  it('levure : pas de fiche (T11)', () => {
    expect(ficheLaPlusProche('Safale US-05', 'Levure', undefined, undefined, undefined, cat)).toBeUndefined();
  });
});

describe('la fiche la plus proche : fermentescibles (table de a1)', () => {
  it('le nom canonique : exacte ; un alias court : approchée ; un nom inconnu : rien', () => {
    expect(ficheLaPlusProche('Münchner Malz', 'Malt', undefined, undefined, 15, cat)).toMatchObject({ id: 'munich-malt', approchee: false });
    expect(ficheLaPlusProche('Maris Otter', 'Malt', undefined, undefined, undefined, {})).toMatchObject({ id: 'maris-otter-malt', approchee: false });
    expect(ficheLaPlusProche('otter', 'Malt', undefined, undefined, undefined, {})).toMatchObject({ id: 'maris-otter-malt', approchee: true });
    expect(ficheLaPlusProche('Munich', 'Malt', undefined, undefined, undefined, {})?.approchee).toBe(true);
    expect(ficheLaPlusProche('Zzzxqw Malz', 'Malt', undefined, undefined, undefined, {})).toBeUndefined();
  });
});

describe('articleNeufDe : l’article dérivé de la ligne et du stock courants', () => {
  const ligne = (description: string, unit = 'g', quantity = 40, more: Record<string, unknown> = {}) => ({ description, unit, quantity, ...more }) as any;
  it('Target 11.3% face à Target (11,8) : Target bis, α 11,3, fiche exacte (α dans la plage)', () => {
    const a = articleNeufDe(ligne('Target 11.3%'), [item('T', 'Target', 'Houblon', 'g', { alphaPct: 11.8 })], cat);
    expect(a).toMatchObject({ name: 'Target bis', alphaPct: 11.3, fiche: { id: 'beermaverick-target', approchee: false }, nomFiche: 'Target UK', derive: true });
  });
  it('le nom tapé prime, la fiche et l’α restent ceux du libellé courant', () => {
    const a = articleNeufDe(ligne('Cascade CH 8%'), [item('U', 'Cascade US', 'Houblon', 'g')], cat, '  Mon Cascade ');
    expect(a).toMatchObject({ name: 'Mon Cascade', alphaPct: 8, origin: 'CH', fiche: { id: 'beermaverick-cascade', approchee: true } });
  });
  it('une ligne reliée (meme) n’a aucune fiche à écrire', () => {
    const a = articleNeufDe(ligne('Galaxy 17.2%'), [item('G', 'Galaxy', 'Houblon', 'g')], cat);
    expect(a.regle.cas).toBe('meme');
    expect(a.fiche).toBeUndefined();
  });
  it('un produit hors houblon et malt garde son libellé et n’a ni α ni EBC', () => {
    const a = articleNeufDe(ligne('Étiquettes autocollantes', 'pce', 100, { kind: 'packaging' }), [], cat);
    expect(a).toMatchObject({ name: 'Étiquettes autocollantes', derive: false });
    expect(a.alphaPct).toBeUndefined(); expect(a.colorEbc).toBeUndefined(); expect(a.fiche).toBeUndefined();
  });
});

describe('R15 : Gemini jamais appelé, jamais le réseau', () => {
  const dossier = path.resolve(__dirname, '../../../../src/domain/stock');
  it('aucun module de domain/stock n’importe le scanner, functions/ ou le réseau', () => {
    for (const f of fs.readdirSync(dossier)) {
      const code = fs.readFileSync(path.join(dossier, f), 'utf8');
      expect(code, f).not.toMatch(/geminiScanner|GeminiScannerService|functions\/|fetch\(|XMLHttpRequest|firebase/i);
    }
  });
  it('la recherche d’une fiche n’appelle aucune requête', () => {
    const espion = vi.spyOn(globalThis, 'fetch' as any).mockImplementation((() => { throw new Error('réseau interdit'); }) as any);
    articleNeufDe({ description: 'Cascade CH', unit: 'g', quantity: 30 } as any, [], cat);
    expect(espion).not.toHaveBeenCalled();
    espion.mockRestore();
  });
});
