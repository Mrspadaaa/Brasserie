import { describe, expect, it } from 'vitest';
import { assertHopKnowledge, type HopYeast } from '../../functions/src/hopPredictionSchema';
import catalogue from '../../src/data/yeastCatalogueBootstrap.json';
import { applyCatalogueYeast, catalogueMatches } from '../../src/domain/yeastCatalogue';
import { fullRecipe } from '../fixtures/fullRecipe';
import { reportedRange, catalogueHash } from '../../scripts/yeast-catalogue/parse.mjs';
import { planCatalogueImport, encode } from '../../scripts/yeast-catalogue/import-plan.mjs';
const rows=catalogue as HopYeast[];
const yeast=()=>structuredClone(rows.find(r=>r.id==='white-labs-wlp300')!);

describe('Référentiel de levures sourcé',()=>{
  it('valide chaque référence sans tolérer une plage sans source',()=>{
    expect(rows.length).toBeGreaterThan(1500);
    rows.forEach(r=>assertHopKnowledge(r));
    const bad=yeast();delete (bad.catalogue!.facts[0] as any).source;
    expect(()=>assertHopKnowledge(bad)).toThrow();
  });
  it('lit les degrés des deux bornes sans confondre Fahrenheit et Celsius',()=>{
    expect(reportedRange('68° - 72° F 20° - 22° C','°C')?.range).toEqual({min:20,max:22});
    expect(reportedRange('32–18 °C','°C')).toBeNull();
    expect(yeast().catalogue!.facts.find(f=>f.key==='temperature')?.range).toEqual({min:20,max:22});
    const w68=rows.find(r=>r.id==='fermentis-w68')!;
    expect(w68.catalogue!.facts.find(f=>f.key==='temperature')?.range).toEqual({min:18,max:26});
    expect(w68.catalogue!.facts.find(f=>f.key==='pitchRate')?.range).toEqual({min:50,max:80});
  });
  it('garde une contradiction fabricant textuelle sans utiliser sa plage',()=>{
    const windsor=rows.find(r=>r.id==='lalbrew-windsor')!;
    const conflict=windsor.catalogue!.facts.find(f=>f.key==='temperature'&&f.source.author==='White Labs');
    expect(conflict?.context).toContain('contradictoires');expect(conflict?.range).toBeUndefined();
    expect(windsor.catalogue!.facts.some(f=>f.key==='temperature'&&f.range?.min===15&&f.range.max===25)).toBe(true);
  });
  it('distingue le caractère sec, les nutriments et les cultures réelles',()=>{
    expect(rows.some(r=>/Frozen Gel Pack|FERMSTART|Surge Seltzer Nutrient/.test(r.name))).toBe(false);
    expect(rows.some(r=>r.catalogue!.manufacturer==='WHC Lab'&&/plantarum/.test(r.name))).toBe(true);
    expect(rows.find(r=>r.name==='Imperial Yeast · A24 Dry Hop')?.form).toBeUndefined();
    expect(rows.some(r=>r.catalogue!.manufacturer==='Escarpment Labs'&&/Marina.*\[HB\]/.test(r.name))).toBe(true);
    expect(rows.flatMap(r=>r.catalogue!.facts).some(f=>f.key==='species'&&f.reported==='Ale')).toBe(false);
  });
  it('trouve les codes et ne modifie la recette que lors du choix explicite',()=>{
    const y=yeast();expect(catalogueMatches(y,'wlp300')).toBe(true);
    const recipe=structuredClone(fullRecipe), before=structuredClone(recipe);
    const next=applyCatalogueYeast(recipe,y,'liquide');
    expect(recipe).toEqual(before);expect(next.hops).toEqual(recipe.hops);expect(next.fermentation).toEqual(recipe.fermentation);
    expect(next.yeast.hopIndexId).toBe(y.id);expect(next.yeast.qty).toBe(0);
    expect(next.yeast.attenuationPct).toBeUndefined();expect(next.yeast.pitchTempC).toBeUndefined();
    const prepared={...next,yeast:{...next.yeast,qty:50,unit:'mL' as const}};
    expect(applyCatalogueYeast(prepared,y,'liquide').yeast.qty).toBe(50);
    expect(applyCatalogueYeast(prepared,y,'sèche').yeast).toMatchObject({qty:0,unit:'g'});
  });
  it('rend l’import idempotent malgré l’ordre des clés Firestore',()=>{
    const row=yeast();row.catalogue!.contentSha256=catalogueHash(row.catalogue);
    const reordered=JSON.parse(JSON.stringify(row,(_k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v));
    const document={name:'projects/test/databases/(default)/documents/hopKnowledge/'+row.id,fields:encode(reordered).mapValue.fields,updateTime:'2026-09-08T00:00:00Z'};
    expect(planCatalogueImport([row],[document]).writes).toHaveLength(0);
    expect(planCatalogueImport([row],[document]).conflicts).toHaveLength(0);
  });
  it('préserve les corrections manuelles et emploie la révision relue comme précondition',()=>{
    const row=yeast(), old=yeast();old.name='Mon nom local';old.betaLyase='positive';old.catalogue!.facts[0].reported='Correction locale';
    const document={name:'projects/test/databases/(default)/documents/hopKnowledge/'+old.id,fields:encode(old).mapValue.fields,updateTime:'2026-09-08T00:00:00Z'};
    expect(planCatalogueImport([row],[document]).conflicts).toHaveLength(1);
    delete old.catalogue;document.fields=encode(old).mapValue.fields;
    const write=planCatalogueImport([row],[document]).writes[0];
    expect(write.data.name).toBe(old.name);expect(write.data.betaLyase).toBe('positive');expect(write.updateTime).toBe(document.updateTime);
  });
});
