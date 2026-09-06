import { describe, it, expect } from 'vitest';
import { solveSalts, ionsFromSalts, addIons, waterFromPlan, SALT_IDS, residualAlkalinity, targetRaForColor } from '../../src/domain/water';
import { styleByCode, midpoint } from '../../src/domain/waterStyles';
import { solveMinerals, mineralError, TASTE_IONS, FLAVOUR_SALTS } from '../../src/domain/water/mineralSolver';
import { saltIons } from '../../src/domain/water/substances';
import { constrainedLeastSquares } from '../../src/domain/water/lsq';
import type { WaterIons } from '../../src/types';
const angles: WaterIons = { ca:49,mg:1.1,na:1.9,so4:7.1,cl:1.3,hco3:157.4 };
const zero: WaterIons = {ca:0,mg:0,na:0,so4:0,cl:0,hco3:0};
const target = {ca:100,mg:25,na:15,so4:100,cl:111,hco3:0};
const ranges = Object.fromEntries(Object.entries(target).map(([ion,v])=>[ion,{min:0,max:Math.max(100,v*1.5)}])) as any;

describe('Global salt plans',()=>{
  it('reproduces the known Angles three-salt plan, with no gypsum and <3 ppm on every taste ion',()=>{
    const r=solveSalts({start:angles,target,ranges,totalWaterL:30,mashWaterL:30,mineralTargetMode:'target'});
    expect(Object.keys(r.doses).sort()).toEqual(['cacl2','epsom','nacl']);
    for(const ion of TASTE_IONS) expect(Math.abs(r.achievedWort[ion]-target[ion]),ion).toBeLessThan(3);
    expect(r.achievedWort).toEqual(addIons(angles,ionsFromSalts(r.doses,30)));
  });
  it('reference URL manual doses are distinct from the three-salt target',()=>{
    const actual=addIons(angles,ionsFromSalts({gypse:6.66,nacl:3.79},40));
    expect(actual.ca).toBeCloseTo(87.8,0);
    expect(actual.mg).toBe(1.1);
    expect(actual.na).toBeCloseTo(39.2,0);
    expect(actual.so4/actual.cl).toBeCloseTo(1.7,1);
  });
  it('does not violate a calcium ceiling that couples two salts',()=>{
    const max={ca:60,mg:0,na:0,so4:300,cl:300,hco3:0};
    const doses=solveMinerals(zero,{...zero,ca:100,so4:180,cl:180},max,30,new Set(['epsom','mgcl2','nacl','kcl']));
    const actual=ionsFromSalts(doses,30);
    expect(actual.ca).toBeLessThanOrEqual(60);
    expect(actual.ca).toBeGreaterThan(58);
    expect(doses.gypse).toBeGreaterThan(0);
    expect(doses.cacl2).toBeGreaterThan(0);
  });
  it('recomputes final mash and rinse for different sources and both placements',()=>{
    for(const allSaltsInMash of [true,false]) {
      const r=solveSalts({start:angles,startSparge:zero,target,ranges,totalWaterL:40,mashWaterL:30,allSaltsInMash,mineralTargetMode:'target'});
      const w=waterFromPlan(angles,r.doses,30,10,zero,allSaltsInMash);
      expect(r.achievedMash).toEqual(w.mash);
      expect(r.achievedSparge).toEqual(w.sparge);
      for(const ion of TASTE_IONS) expect(r.achievedWort[ion]).toBeCloseTo((w.mash[ion]*30+w.sparge[ion]*10)/40,0);
    }
  });
  it('adds alkalinity to an RO imperial stout within the grist ceiling, only in mash',()=>{
    const style=styleByCode('20C');
    const r=solveSalts({start:zero,target:midpoint(style),ranges:style.ions,totalWaterL:30,mashWaterL:20,targetRa:targetRaForColor(90),raCeiling:12});
    expect((r.doses.nahco3??0)+(r.doses.chaux??0)).toBeGreaterThan(0);
    expect(residualAlkalinity(r.achievedMash)).toBeLessThanOrEqual(13);
    expect(r.achievedSparge.hco3).toBe(0);
  });
  it('reports infeasible source excess and never reintroduces disabled salts',()=>{
    const r=solveSalts({start:{...angles,ca:300},target,ranges,totalWaterL:30,mashWaterL:20,disabled:SALT_IDS});
    expect(r.doses).toEqual({});
    expect(r.issues?.some(i=>i.code==='high')).toBe(true);
  });
  it('finds 100 manufactured feasible targets from different sources and permitted salts',()=>{
    for(let seed=1;seed<=100;seed++) {
      const start={...angles,ca:seed%50,mg:seed%4,na:seed%8,so4:seed%19,cl:seed%13};
      // Construct the answer independently, from known weighable additions.
      const known=Object.fromEntries(FLAVOUR_SALTS.filter((_,j)=>(seed+j)%3===0).map((id,j)=>[id,.5+((seed*7+j*11)%20)/10]));
      const target=addIons(start,ionsFromSalts(known,30));
      const ranges=Object.fromEntries(Object.entries(target).map(([ion,v])=>[ion,{min:0,max:v+10}])) as any;
      const disabled=FLAVOUR_SALTS.filter(id=>!(id in known));
      const r=solveSalts({start,target,ranges,totalWaterL:30,mashWaterL:30,disabled,mineralTargetMode:'target'});
      for(const ion of TASTE_IONS) expect(Math.abs(r.achievedWort[ion]-target[ion]),`${seed}/${ion}`).toBeLessThan(3);
      for(const id of disabled) expect(r.doses[id]).toBeUndefined();
    }
  });
});
