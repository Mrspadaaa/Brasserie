import { describe, expect, it } from 'vitest';
import { assertNoloScience, type NoloProcess } from '../../functions/src/noloSchema';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';
import { fruty } from '../fixtures/fruty';
import { noloScience } from '../../src/domain/noloScience';
import { noloYeastCandidates } from '../../src/domain/noloYeastSelection';
import { yeastReferences } from '../../src/domain/yeastReferences';
import { applyFermentationProposal, fermentationProposals, fermentationReadiness } from '../../src/domain/fermentationPlanning';

const science = noloScience()!;
const recipeFor = (process: NoloProcess, style = '') => {
  const recipe = fruty(true);
  recipe.nolo!.process = process;
  recipe.style = style;
  recipe.styleRef = undefined;
  recipe.fermentationIntent = undefined;
  return recipe;
};
const ids = (process: NoloProcess) => noloYeastCandidates(recipeFor(process), science).map(c => c.strain.yeastId);

describe('choisir une souche selon le procédé NOLO', () => {
  it('propose six références maltose négatives pour les deux voies biologiques, sans bière mère classique', () => {
    for (const process of ['restricted', 'restored'] as const) {
      const candidates = noloYeastCandidates(recipeFor(process), science);
      expect(candidates).toHaveLength(6);
      expect(candidates.every(c => c.family === 'restricted' && c.strain.sugars.maltose === 'no')).toBe(true);
      expect(candidates.map(c => c.strain.yeastId)).toEqual(expect.arrayContaining(['white-labs-wlp603', 'white-labs-wlp686', 'lalbrew-lona']));
      expect(candidates.map(c => c.strain.yeastId)).not.toContain('fermentis-us05');
      expect(candidates.every(c => c.reason.includes(process === 'restored' ? 'ajouts aromatiques' : 'sucres simples'))).toBe(true);
    }
  });

  it('ne transforme pas un point fabricant ou une borne supérieure en plage d’atténuation, durée ou masse liquide', () => {
    const rows = noloYeastCandidates(recipeFor('restricted'), science);
    for (const id of ['white-labs-wlp603', 'white-labs-wlp686', 'white-labs-wlp618']) {
      const candidate = rows.find(c => c.strain.yeastId === id)!;
      expect(candidate.form).toBe('liquide');
      expect(candidate.strain.attenuationPct).toBeNull();
      expect(candidate.strain.pitchGL).toBeNull();
      expect(candidate.strain.durationDays).toBeNull();
    }
    expect(rows.find(c => c.strain.yeastId === 'white-labs-wlp603')?.strain.temperatureC).toEqual({ min: 19, max: 23 });
    expect(rows.find(c => c.strain.yeastId === 'white-labs-wlp686')?.strain.temperatureC).toEqual({ min: 20, max: 24 });
  });

  it('prépare les voies à faible extrait avec les souches classiques et une priorité Windsor documentée', () => {
    for (const process of ['lowExtract', 'coldExtraction', 'secondRunnings'] as const) {
      const candidates = noloYeastCandidates(recipeFor(process), science);
      expect(candidates.length).toBeGreaterThan(12);
      expect(candidates.every(c => c.family === 'conventional')).toBe(true);
      expect(candidates[0].strain.yeastId).toBe('lalbrew-windsor');
      expect(candidates[0].strain.attenuationPct).toEqual({ min: 65, max: 72 });
      expect(candidates[0].strain.pitchGL).toEqual({ min: .5, max: 1 });
      expect(candidates[0].strain.sugars.maltotriose).toBe('no');
      expect(candidates[0].strain.sugars.maltose).not.toBe('no');
      expect(candidates.map(c => c.strain.yeastId)).not.toContain('lalbrew-belle-saison');
      expect(candidates.map(c => c.strain.yeastId)).not.toContain('lalbrew-lona');
    }
    expect(noloYeastCandidates(recipeFor('secondRunnings'), science)[0].reason).toContain('moût réellement récupéré');
    expect(noloYeastCandidates(recipeFor('coldExtraction'), science)[0].reason).toContain('extraction à froid');
  });

  it('le contact à froid possède des candidates lager distinctes et ne modifie pas leur plage fabricant', () => {
    const rows = noloYeastCandidates(recipeFor('coldContact'), science);
    expect(rows).toHaveLength(7);
    expect(rows.map(c => c.strain.yeastId)).toContain('yeast-fermentis-saflager-w-34-70');
    expect(rows.map(c => c.strain.yeastId)).not.toContain('white-labs-wlp603');
    expect(rows.map(c => c.strain.yeastId)).not.toContain('yeast-whc-10418626003283');
    for (const row of rows) {
      expect(row.reason).toContain('proche de 0 °C');
      expect(row.reason).toContain('A15');
      expect(row.strain.temperatureC!.min).toBeGreaterThan(0);
    }
    expect(rows.find(c => c.strain.yeastId === 'yeast-fermentis-saflager-w-34-70')?.strain.temperatureC).toEqual({ min: 12, max: 18 });
    expect(ids('coldContact')).not.toEqual(ids('lowExtract'));
  });

  it('adapte les priorités aux arômes de la recette et aux profils de bière mère', () => {
    const lager = noloYeastCandidates(recipeFor('dealcoholized', 'German Pilsner'), science);
    expect(lager[0].strain.yeastId).toBe('yeast-fermentis-saflager-w-34-70');
    const wheatRecipe = recipeFor('dealcoholized', 'Hefeweizen');
    const wheat = noloYeastCandidates(wheatRecipe, science);
    expect(wheat[0].strain.yeastId).toBe('lallemand-munich-classic');
    expect(wheat.map(c => c.strain.yeastId)).toContain('lalbrew-belle-saison');
    expect(wheat.every(c => c.reason.includes('bière mère'))).toBe(true);
    expect(ids('arrested')).not.toEqual(ids('dealcoholized'));
    expect(noloYeastCandidates(recipeFor('arrested'), science).every(c => c.reason.includes('chute de densité'))).toBe(true);
  });

  it('reprend les données personnelles concordantes mais ne masque pas leurs conflits avec une valeur par défaut', () => {
    const saved = structuredClone(yeastReferences().find(y => y.id === 'fermentis-us05')!);
    saved.catalogue!.facts = saved.catalogue!.facts.map(f => f.key === 'attenuation' ? { ...f, range: { min: 68, max: 73 }, reported: '68–73 %' } : f);
    const row = noloYeastCandidates(recipeFor('lowExtract'), science, [saved]).find(c => c.strain.yeastId === saved.id)!;
    expect(row.strain.attenuationPct).toEqual({ min: 68, max: 73 });
    expect(row.strain.pitchGL).toEqual({ min: .5, max: .8 });
    const contradictory = structuredClone(saved);
    contradictory.catalogue!.facts.push({ ...contradictory.catalogue!.facts.find(f => f.key === 'attenuation')!, range: { min: 80, max: 84 } });
    const conflict = noloYeastCandidates(recipeFor('lowExtract'), science, [contradictory]).find(c => c.strain.yeastId === saved.id)!;
    expect(conflict.strain.attenuationPct).toBeNull();
    expect(conflict.strain.limitation).toContain('non concordantes');
  });

  it('une référence personnelle invalide ou retirée masque la suggestion courante', () => {
    const saved = structuredClone(yeastReferences().find(y => y.id === 'fermentis-us05')!);
    const invalid = { ...saved, source: { ...saved.source, title: '' } } as HopKnowledge;
    expect(noloYeastCandidates(recipeFor('lowExtract'), science, [invalid]).some(c => c.strain.yeastId === saved.id)).toBe(false);
    saved.catalogue!.status = 'discontinued';
    expect(noloYeastCandidates(recipeFor('lowExtract'), science, [saved]).some(c => c.strain.yeastId === saved.id)).toBe(false);
  });

  it('garde les valeurs de la science figée et renvoie des copies indépendantes', () => {
    const recipe = recipeFor('restricted');
    recipe.nolo!.scienceSnapshot = structuredClone(science);
    const historical = recipe.nolo!.scienceSnapshot.strains.find(s => s.yeastId === 'lalbrew-lona')!;
    historical.temperatureC = { min: 21, max: 23 };
    historical.name = 'LoNa · édition du lot';
    const recipeBefore = JSON.stringify(recipe), scienceBefore = JSON.stringify(science);
    const row = noloYeastCandidates(recipe, science).find(c => c.strain.yeastId === historical.yeastId)!;
    expect(row.strain).toEqual(historical);
    row.strain.temperatureC!.min = 19;
    row.strain.aroma.push('Modification locale du comparateur');
    expect(JSON.stringify(recipe)).toBe(recipeBefore);
    expect(JSON.stringify(science)).toBe(scienceBefore);
    expect(noloYeastCandidates(recipe, science).find(c => c.strain.yeastId === historical.yeastId)?.strain.temperatureC).toEqual({ min: 21, max: 23 });
  });

  it('les références conventionnelles figées gardent aussi leurs plages lors d’un changement du catalogue', () => {
    const recipe = recipeFor('lowExtract');
    const original = noloYeastCandidates(recipe, science).find(c => c.strain.yeastId === 'fermentis-us05')!.strain;
    recipe.nolo!.scienceSnapshot = { ...structuredClone(science), strains: [...structuredClone(science.strains), structuredClone(original)] };
    const saved = structuredClone(yeastReferences().find(y => y.id === original.yeastId)!);
    saved.catalogue!.facts = saved.catalogue!.facts.map(f => f.key === 'attenuation' ? { ...f, range: { min: 60, max: 70 } } : f);
    const actual = noloYeastCandidates(recipe, science, [saved]).find(c => c.strain.yeastId === original.yeastId)!;
    expect(actual.strain.attenuationPct).toEqual(original.attenuationPct);
    expect(actual.strain.source).toEqual(original.source);
  });

  it('toutes les candidates se figent dans un référentiel valide sans données de mesure inventées', () => {
    for (const process of science.processes.map(p => p.id)) {
      const recipe = recipeFor(process);
      const before = JSON.stringify(recipe);
      const candidates = noloYeastCandidates(recipe, science);
      expect(candidates.length).toBeGreaterThan(0);
      expect(new Set(candidates.map(c => c.strain.yeastId)).size).toBe(candidates.length);
      expect(() => assertNoloScience({ ...science, strains: candidates.map(c => c.strain) })).not.toThrow();
      expect(JSON.stringify(recipe)).toBe(before);
    }
  });

  it('l’atelier existant utilise la nouvelle sélection et conserve le programme de contact comme hypothèse', () => {
    const cold = recipeFor('coldContact');
    const proposals = fermentationProposals(cold);
    expect(proposals.map(p => p.id).sort()).toEqual(ids('coldContact').sort());
    for (const p of proposals) {
      expect(p.recipe.fermentation?.find(s => s.kind === 'primaire')).toMatchObject({ tempC: 1, days: 2 });
      expect(p.recipe.yeast.fermTempMinC).toBeGreaterThan(0);
      expect(p.processFit).toBe('explore');
      expect(p.assumptions.join(' ')).toContain('hypothèse');
      expect(p.recipe.nolo?.measurements).toEqual(cold.nolo!.measurements);
      expect(fermentationReadiness(p.recipe).some(d => d.id === 'primary-temperature')).toBe(false);
    }
    const recipe = recipeFor('lowExtract');
    const proposal = fermentationProposals(recipe).find(p => p.id === 'lalbrew-windsor')!;
    const applied = applyFermentationProposal(recipe, proposal);
    expect(applied.nolo!.scienceSnapshot!.strains.find(s => s.yeastId === proposal.id)?.attenuationPct).toEqual({ min: 65, max: 72 });
    expect(applied.yeast.qty).toBe(18);
    expect(applied.yeast.unit).toBe('g');
  });

  it('l’atelier reprend la température documentaire d’une lager sans lui inventer une durée ou une masse liquide', () => {
    const recipe = recipeFor('dealcoholized', 'German Pilsner');
    const proposals = fermentationProposals(recipe);
    const lager = proposals.find(p => p.id === 'yeast-fermentis-saflager-w-34-70')!;
    expect(lager.recipe.fermentation?.find(s => s.kind === 'primaire')).toMatchObject({ tempC: 15, days: 10 });
    expect(lager.recipe.fermentation?.find(s => s.kind === 'primaire')?.note).toContain('durée existante conservée');
    expect(lager.diagnostics.some(d => d.id === 'primary-temperature')).toBe(false);
    const liquid = proposals.find(p => p.id === 'wyeast-2124')!;
    expect(liquid.recipe.yeast).toMatchObject({ form: 'liquide', qty: 0, unit: 'flacon' });
    expect(liquid.diagnostics.some(d => d.id === 'pitch')).toBe(true);
    expect(liquid.changes.find(c => c.label === 'Ensemencement')?.after).toContain('flacon');
  });
});
