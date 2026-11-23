/**
 * Voie SM (08.11) : « SI je mets suivre au stock, ça devrait faire le mapping automatique... » (ticket, ligne « Idaho7 » 5 g, rangée dans « Autres »).
 * Une seule règle de nom, partagée par la lecture et le bouton : espaces et tirets ignorés face au catalogue des houblons (« Idaho7 » = « Idaho 7 »),
 * jamais de rapprochement flou (« Citra » ≠ « Citra Cryo »). Fixtures fictives, Gemini jamais appelé.
 */
import { describe, expect, it } from 'vitest';
import { donneesDeLigne, regleProduit, categorieArticleNeuf, contexteDe } from '../../../../src/services/stockLineMatching';
import { hasHopWord, readProductLabel } from '../../../../src/services/ingredientIdentity';
import { articleNeufDe, ligneDeBrouillon } from '../../../../src/domain/stock/articleNeuf';
import { familleDe } from '../../../../src/ui/depense/familles';
import { memeProduit } from '../../../../src/ui/depense/etat';
import { varieteDe } from '../../../../src/domain/hopIndex/v4/donneesApp';

const article = (ref: string, name: string, category: string, unit: string, more: Record<string, unknown> = {}): any =>
  ({ id: ref, ref, name, category, unit, currentStock: 10, minStock: 0, reorder: false, ...more });
const ligne = (description: string, more: Record<string, unknown> = {}): any => ({ description, unit: 'g', quantity: 5, kind: 'ingredient', ...more });

/** Un mini catalogue de variétés (forme de `CatalogueHop`, champs lus par la fiche seulement). */
const catalogue: any[] = [
  { id: 'idaho-7', name: 'Idaho 7', aliases: [], alpha: [12, 14] },
  { id: 'citra', name: 'Citra', aliases: [], alpha: [11, 14] },
  { id: 'el-dorado', name: 'El Dorado', aliases: [], alpha: [14, 16] },
];

describe('SM — la lecture : « Idaho7 » est un houblon (aujourd’hui : « Autres »)', () => {
  it('le contexte et la famille de « Idaho7 » sont Houblon, comme « Idaho 7 »', () => {
    expect(hasHopWord('Idaho7')).toBe(true);
    expect(donneesDeLigne(ligne('Idaho7')).contexte).toBe('Houblon');
    expect(familleDe({ nom: 'Idaho7', kind: 'ingredient', contexte: contexteDe(ligne('Idaho7')) })).toBe('houblon');
    expect(familleDe({ nom: 'Idaho 7', kind: 'ingredient', contexte: contexteDe(ligne('Idaho 7')) })).toBe('houblon');
  });
  it('les écritures collées ou à tiret des noms à plusieurs mots du catalogue', () => {
    for (const nom of ['ElDorado', 'El-Dorado', 'Idaho-7', 'idaho7', 'IDAHO7', 'NelsonSauvin', 'Nelson-Sauvin', 'Bru-1', 'Bru1', 'MtHood']) {
      expect(donneesDeLigne(ligne(nom)).contexte, nom).toBe('Houblon');
    }
  });
  it('le nom propre est celui du catalogue : « Idaho7 » devient « Idaho 7 », le libellé imprimé reste intact', () => {
    const lu = readProductLabel('Idaho7', { hop: true, side: 'line' });
    expect(lu.name).toBe('Idaho 7');
    expect(lu.rawLabel).toBe('Idaho7');
    expect(readProductLabel('ElDorado 11.7% US', { hop: true, side: 'line' }).name).toBe('El Dorado');
    expect(readProductLabel('Idaho 7', { hop: true, side: 'line' }).name).toBe('Idaho 7');
  });
  it('pas de rapprochement flou : Citra, Citra Cryo, Mosaic, un mot inconnu', () => {
    expect(donneesDeLigne(ligne('Citra')).contexte).toBe('Houblon');
    expect(donneesDeLigne(ligne('Citra Cryo')).contexte).toBe('Houblon');
    expect(readProductLabel('Citra Cryo', { hop: true }).tokens).toEqual(['citra', 'cryo']);
    expect(readProductLabel('Citra', { hop: true }).tokens).toEqual(['citra']);
    expect(donneesDeLigne(ligne('Machin7')).contexte).toBe('autre');
    expect(donneesDeLigne(ligne('Bidule Truc')).contexte).toBe('autre');
    expect(hasHopWord('Idahoe7')).toBe(false);
    // un nombre accolé qui n'est pas dans le catalogue ne crée pas de variété
    expect(readProductLabel('Idaho 77', { hop: true }).tokens).toEqual(['idaho', '77']);
  });
});

describe('SM — le bouton : 1. le stock a déjà le produit', () => {
  const idaho = article('MP-Idaho', 'Idaho 7', 'Houblon', 'g');
  const citra = article('MP-Citra', 'Citra', 'Houblon', 'g');
  const cryo = article('MP-CitraCryo', 'Citra Cryo', 'Houblon', 'g');
  it('« Idaho7 » est le même produit que « Idaho 7 » (même unité) : lien existing', () => {
    expect(regleProduit(ligne('Idaho7'), [citra, idaho]).cas).toBe('meme');
    expect((regleProduit(ligne('Idaho7'), [citra, idaho]) as any).article.ref).toBe('MP-Idaho');
    expect(memeProduit('Idaho7', 'g', [citra, idaho])?.ref).toBe('MP-Idaho');
  });
  it('dans une unité convertible (Kg face à g) : reliée aussi', () => {
    expect(memeProduit('Idaho7', 'Kg', [idaho], 1)?.ref).toBe('MP-Idaho');
  });
  it('l’article du stock écrit collé, la ligne espacée : le même produit', () => {
    expect(memeProduit('Idaho 7', 'g', [article('MP-Idaho', 'Idaho7', 'Houblon', 'g')])?.ref).toBe('MP-Idaho');
  });
  it('Citra et Citra Cryo restent deux produits', () => {
    expect(memeProduit('Citra', 'g', [cryo])).toBeUndefined();
    expect(memeProduit('Citra Cryo', 'g', [citra])).toBeUndefined();
    expect(memeProduit('Citra', 'g', [citra, cryo])?.ref).toBe('MP-Citra');
    expect(memeProduit('CitraCryo', 'g', [citra, cryo])?.ref).toBe('MP-CitraCryo');
  });
});

describe('SM — le bouton : 2. variété connue du catalogue, rien au stock', () => {
  it('« Idaho7 » 5 g : nouvel article Houblon « Idaho 7 », fiche du catalogue, jamais d’α posé (M2)', () => {
    const l = ligneDeBrouillon({ description: 'Idaho7', unit: 'g', quantity: 5, kind: 'ingredient' }, undefined);
    const neuf = articleNeufDe(l, [], { houblons: catalogue });
    expect(neuf.derive).toBe(true);
    expect(neuf.name).toBe('Idaho 7');
    expect(neuf.alphaPct).toBeUndefined();
    expect(neuf.fiche).toEqual({ id: 'idaho-7', approchee: false });
    expect(categorieArticleNeuf({ description: 'Idaho7', kind: 'ingredient' })).toBe('Houblon');
  });
  it('« ElDorado » : « El Dorado » ; un alias du catalogue reste lu', () => {
    const neuf = articleNeufDe(ligneDeBrouillon({ description: 'ElDorado', unit: 'g', quantity: 5, kind: 'ingredient' }, undefined), [], { houblons: catalogue });
    expect(neuf.name).toBe('El Dorado');
    expect(varieteDe('Idaho7', catalogue)).toHaveProperty('raison'); // le catalogue seul ne lit pas le collé : c'est la règle de nom qui le fait
  });
  it('malt et levure connus : déjà leur famille (contexte), nouvel article de cette famille', () => {
    expect(categorieArticleNeuf({ description: 'Pilsner', kind: 'ingredient' })).toBe('Malt');
    expect(categorieArticleNeuf({ description: 'Nottingham', kind: 'ingredient' })).toBe('Levure');
  });
});

describe('SM — le bouton : 3. nom inconnu, nouvel article simple', () => {
  it('« Machin7 » : ni houblon, ni fiche, ni α', () => {
    const neuf = articleNeufDe(ligneDeBrouillon({ description: 'Machin7', unit: 'g', quantity: 5, kind: 'ingredient' }, undefined), [], { houblons: catalogue });
    expect(neuf.derive).toBe(false);
    expect(neuf.fiche).toBeUndefined();
    expect(neuf.name).toBe('Machin7');
    expect(neuf.regle.cas).toBe('inconnu');
  });
});
