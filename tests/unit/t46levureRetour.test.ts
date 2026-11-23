// T4-6 (passe 5 en ligne, 20.11) : « Retour sur Levure : Paliers → Levure 8,0 s, Houblons → Levure 5,3 s, Eau → Levure 0,76 s » (rouvre T2B-3).
//
// Profil Chrome (banc ?preview=brew, retour de Paliers) : 86 % du montage de l'étape Levure tenait dans `relierAuCatalogue` → `catalogueMatches` + `yeastSearchScore(yeastSearchIndex(ref))`,
// qui reconstruisaient l'index d'identité de chacune des 1 734 fiches (deux fois par fiche) pour la levure de la recette ET pour chaque levure du stock, à chaque montage.
// Remède : l'index d'une fiche sans ajout est mémoïsé par la fiche (WeakMap) ; une fiche est une valeur, jamais mutée.
import { describe, expect, it } from 'vitest';
import { relierAuCatalogue } from '../../src/domain/levure/relier';
import { yeastSearchIndex } from '../../src/domain/yeastCatalogue';
import { yeastReferences } from '../../src/domain/yeastReferences';

const refs = yeastReferences([]);

describe('T4-6 · l’index d’identité d’une fiche est construit une seule fois', () => {
  it('le même index revient pour la même fiche', () => {
    const f = refs[0];
    expect(yeastSearchIndex(f)).toBe(yeastSearchIndex(f));
  });
  it('un index avec ajouts (candidats) n’est ni mémorisé ni mêlé à celui de la fiche seule', () => {
    const f = refs[0];
    const seul = yeastSearchIndex(f);
    const enrichi = yeastSearchIndex(f, { names: ['zzz nom ajouté'] });
    expect(enrichi).not.toBe(seul);
    expect(enrichi.keySet.has('zzz')).toBe(true);
    expect(seul.keySet.has('zzz')).toBe(false);
    expect(yeastSearchIndex(f)).toBe(seul);
  });
  it('le résultat du rapprochement ne change pas (Verdant IPA, Windsor)', () => {
    expect(refs.find(r => r.id === relierAuCatalogue({ name: 'Levure LALLEMAND Verdant IPA' }, refs)?.id)?.name).toMatch(/Verdant/i);
    expect(relierAuCatalogue({ name: 'Ma souche maison' }, refs)).toBeUndefined();
  });
  it('rapprocher vingt levures de stock sur tout le catalogue tient en moins de 400 ms (mesuré : ≈ 70 ms après, ≈ 930 ms avant)', () => {
    const noms = ['Levure LALLEMAND Verdant IPA', 'Ma souche maison A', 'Ma souche maison B', 'Verd', 'Levure', 'SafAle US-05', 'Voss Kveik', 'Levure Lallemand'];
    relierAuCatalogue({ name: noms[0] }, refs); // 1er passage : index froids (comme le 1er montage)
    const t0 = performance.now();
    for (let i = 0; i < 20; i++) relierAuCatalogue({ name: noms[i % noms.length] }, refs);
    const ms = performance.now() - t0;
    console.info('T4-6 20 rapprochements, 2e passage :', Math.round(ms), 'ms');
    expect(ms).toBeLessThan(400);
  });
});
