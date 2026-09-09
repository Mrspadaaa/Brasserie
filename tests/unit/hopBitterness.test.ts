import { describe, it, expect } from 'vitest';
import { hotBitterness, bitternessScience } from '../../src/domain/hopBitterness';
import { dryHopBitterness, dryHopDoseGL } from '../../functions/src/hopBitternessCore';
import { assertHopKnowledge } from '../../functions/src/hopPredictionSchema';
import type { HopIngredient } from '../../src/types';
const hop: HopIngredient = {name:'Cascade',stage:'boil',weightG:28,alpha:6,timeMin:60};

describe('IBU courants, sans masquer les données absentes', () => {
  it('reproduit Tinseth sans arrondi intermédiaire et utilise le volume final', () => {
    // Independently evaluated reference: 28g ×6% ×0.230664… /24L.
    expect(hotBitterness([hop],24,1.050,60).total).toBeCloseTo(16.1465,3);
    expect(hotBitterness([hop],48,1.050,60).total).toBeCloseTo(8.0732,3);
  });
  it('ne prend pas une contribution inconnue pour zéro et garde la part connue', () => {
    const result=hotBitterness([hop,{...hop,alpha:0}],24,1.05,60);
    expect(result.total).toBeNull();expect(result.known).toBeGreaterThan(16);
    expect(result.missing).toContain('Cascade : alpha du lot');
  });
  it.each([{timeMin:undefined},{timeMin:95},{alpha:101},{stage:'whirlpool',tempC:undefined},{weightG:NaN}])('refuse le repli plausible : %j', patch=>{
    expect(hotBitterness([{...hop,...patch} as HopIngredient],24,1.05,60).total).toBeNull();
  });
  it('distingue durée zéro, absence de durée et absence d’OG',()=>{
    expect(hotBitterness([{...hop,timeMin:0}],24,1.05,60).total).toBe(0);
    expect(hotBitterness([hop],24,null,60).total).toBeNull();
    expect(hotBitterness([{...hop,stage:'dryHop',alpha:0}],24,null,60).total).toBe(0);
  });
  it('additionne avant arrondi',()=>{
    expect(hotBitterness(Array.from({length:20},()=>({...hop,weightG:1.4})),24,1.05,60).total).toBeCloseTo(hotBitterness([hop],24,1.05,60).total!,10);
  });
});

describe('Scénarios expérimentaux à cru — Maye, Smith, Leker 2016',()=>{
  const science=bitternessScience()!;
  it('valide la provenance et respecte une révision en base, y compris désactivée',()=>{
    expect(()=>assertHopKnowledge(science)).not.toThrow();
    expect(bitternessScience([{...science,enabled:false}])).toBeUndefined();
    const revised={...science,version:'test',relativeBitterness:{...science.relativeBitterness,value:.5}};
    expect(bitternessScience([revised])?.relativeBitterness.value).toBe(.5);
    expect(()=>assertHopKnowledge({...science,relativeBitterness:{value:.66,source:{}}})).toThrow();
  });
  it('reproduit la relation sensorielle publiée, pas une analyse IBU',()=>{
    // Independent transcription of Table 6: these rounded analytical rows are
    // deliberately not the slightly different Table 5 rows in the model data.
    const published=[{iso:51.3,hum:4.2,calculated:54.1},{iso:42.5,hum:10,calculated:49.1},{iso:29.4,hum:14,calculated:38.6},{iso:25.9,hum:23,calculated:41.1}];
    for(const row of published) expect(Math.round((row.iso+row.hum*science.relativeBitterness.value)*10)/10).toBe(row.calculated);
  });
  it('peut augmenter une bière peu amère, et réduire une bière déjà amère',()=>{
    const input={grams:dryHopDoseGL(1)*24,volumeL:24,humulinonesPct:{min:.26,max:.26}};
    const low=dryHopBitterness({...input,hotIbu:{min:0,max:0}},science);
    const high=dryHopBitterness({...input,hotIbu:{min:51.3,max:51.3}},science);
    expect(low.status).toBe('conditional');expect(low.finalEquivalent!.min).toBeGreaterThan(0);
    expect(high.scenarios.find(s=>s.experimentId==='cascade-high-120h')?.deltaEquivalent.max).toBeLessThan(-15);
  });
  it('respecte la masse physique et ne compte pas deux fois la même incertitude',()=>{
    const r=dryHopBitterness({grams:144,volumeL:24,hotIbu:{min:10,max:30}},science);
    expect(r.humulinonesMgL!.max).toBeLessThanOrEqual(6*.35*10);
    for(const s of r.scenarios)expect(s.deltaEquivalent.max-s.deltaEquivalent.min).toBeLessThan(20);
    expect(dryHopBitterness({grams:0,volumeL:24,hotIbu:{min:10,max:30}},science).deltaEquivalent).toEqual({min:0,max:0});
  });
  it('ne plafonne pas silencieusement une dose hors étude',()=>{
    const result=dryHopBitterness({grams:500,volumeL:24,hotIbu:{min:10,max:10}},science);
    expect(result.finalEquivalent).toBeNull();expect(result.reasons[0]).toContain('Dose cumulée');
  });
  it('le zéro mesuré d’humulinones reste zéro ; une plage inversée est rejetée',()=>{
    const input={grams:100,volumeL:24,hotIbu:{min:0,max:0}};
    expect(dryHopBitterness({...input,humulinonesPct:{min:0,max:0}},science).finalEquivalent).toEqual({min:0,max:0});
    expect(dryHopBitterness({...input,humulinonesPct:{min:.5,max:.2}},science).finalEquivalent).toBeNull();
  });
});
