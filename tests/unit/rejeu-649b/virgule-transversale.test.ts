/**
 * TE-23 (L05) : tout nombre décimal affiché s'écrit à la virgule (suisse romande), sur tous les écrans.
 * Un rejeu en ligne avait trouvé des litres au point (« 25.8 L »).
 *
 * Le contrôle `scripts/agents/controle-virgule.mjs` lit tout src/ : il échoue sur un `{valeur} L`, `${valeur} kg`,
 * `{valeur} °C`, `{valeur} %`… dont la valeur ne passe par aucun formateur à virgule. Il a trouvé 380 écritures
 * sur le code d'avant (HEAD 73db7eaa) ; ce test rejoue le contrôle et prouve qu'il sait échouer.
 */
import { describe, expect, it } from 'vitest';
import path from 'node:path';
// @ts-ignore — script .mjs sans déclaration de types
import { analyserFichier, controler, indexerFormateurs, listerSources } from '../../../scripts/agents/controle-virgule.mjs';
import { nombreFr } from '../../../src/domain/nombreAffiche';
import { nombreFr as nombreFrFiche } from '../../../src/domain/stock/regles';

describe('TE-23 : le formateur commun écrit la virgule', () => {
  it('25.8 L s’écrit 25,8 ; 12.5 g, 71.5 % et 1.052 de même', () => {
    expect(`${nombreFr(25.8, 1)} L`).toBe('25,8 L');
    expect(`${nombreFr(12.5, 1)} g`).toBe('12,5 g');
    expect(`${nombreFr(71.5, 1)} %`).toBe('71,5 %');
    expect(nombreFr(1.052, 3)).toBe('1,052');
  });
  it('arrondit pour l’affichage, sans zéro inutile, sans « -0 »', () => {
    expect(nombreFr(25.84, 1)).toBe('25,8');
    expect(nombreFr(12, 1)).toBe('12');
    expect(nombreFr(-0.04, 1)).toBe('0');
  });
  it('un inconnu n’est jamais 0', () => {
    expect(nombreFr(null)).toBe('');
    expect(nombreFr(undefined)).toBe('');
    expect(nombreFr(Number.NaN)).toBe('');
  });
  it('la fiche recette (RL-1) et les autres écrans partagent le même formateur', () => {
    expect(nombreFrFiche).toBe(nombreFr);
  });
});

describe('TE-23 : le contrôle échoue sur l’écriture d’avant', () => {
  const fichiers: string[] = listerSources();
  const index = indexerFormateurs(fichiers);
  const sains = index.pour(fichiers[0]);
  const analyser = (code: string) => analyserFichier('src/essai.tsx', code, sains) as Array<{ expr: string }>;

  it('refuse les écritures relevées en ligne (litres au point)', () => {
    expect(analyser('<span>{recipe.volumeL ?? "—"} L</span>')).toHaveLength(1);
    expect(analyser('<span>Cible {recipe.volumeL} L</span>')).toHaveLength(1);
    expect(analyser('const t = `Adapter la recette à ${volumeAdapte} L`;')).toHaveLength(1);
    expect(analyser('<b>{draft.volumeBrewedL} L</b>')).toHaveLength(1);
    expect(analyser('<b>{(x / 3).toFixed(1)} kg</b>')).toHaveLength(1);
    expect(analyser('<b>{String(t)} °C</b>')).toHaveLength(1);
    expect(analyser('`${valeur} %`')).toHaveLength(1);
  });
  it('accepte le formateur à virgule, l’entier prouvé et la dérogation écrite', () => {
    expect(analyser('<span>Cible {nombreFr(recipe.volumeL, 1)} L</span>')).toHaveLength(0);
    expect(analyser('<span>{recipes.length} L</span>')).toHaveLength(0);
    expect(analyser('<span>{Math.round(x)} g</span>')).toHaveLength(0);
    expect(analyser('<path d={`M${a} ${b} L${c} ${d}`} />')).toHaveLength(0);
    expect(analyser('style={{ width: `${pc}%` }}')).toHaveLength(0);
    expect(analyser('`${x} L` // virgule-ok : chemin SVG')).toHaveLength(0);
  });
});

describe('TE-23 : tout src/ passe le contrôle', () => {
  it('aucun {nombre} unité sans formateur à virgule', () => {
    const violations = controler() as Array<{ fichier: string; ligne: number; expr: string; unite: string }>;
    const liste = violations.map(v => `${v.fichier}:${v.ligne} {${v.expr}} ${v.unite}`);
    expect(liste).toEqual([]);
  });
  it('les exports texte et les documents restent hors champ, listés', async () => {
    // @ts-ignore
    const { EXPORTS_TEXTE } = await import('../../../scripts/agents/controle-virgule.mjs');
    expect(EXPORTS_TEXTE).toContain('src/domain/recipeText.ts');
    expect(EXPORTS_TEXTE).toContain('src/domain/recipeExportConcis.ts');
    expect(EXPORTS_TEXTE.every((f: string) => !path.isAbsolute(f))).toBe(true);
  });
});
