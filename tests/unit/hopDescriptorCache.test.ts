import {describe,it,expect} from 'vitest';
import {createHopExtrapolationCache,hopDescriptorEvidence} from '../../functions/src/hopExtrapolationCore';
import {hopDescriptorEvidence as legacyEvidence} from '../../functions/src/hopExtrapolationV3';
import type {HopVariety} from '../../functions/src/hopIndexSchema';
import pack from '../../src/data/hopManufacturerBootstrap.json';
import model from '../../src/data/hopExtrapolationBootstrap.json';

describe('Index documentaire préparé',()=>{
  it('conserve exactement les preuves du catalogue, y compris les sources et leur ordre',()=>{
    const cache=createHopExtrapolationCache();
    for(const v of pack.hopVarieties as HopVariety[])for(const axis of model[0].axes){
      const expected=legacyEvidence({...v,descriptions:v.descriptions.filter(d=>d.context!=='beer')},axis.terms);
      expect(hopDescriptorEvidence(v,axis.terms,cache)).toEqual(expected);
      expect(hopDescriptorEvidence(v,axis.terms)).toEqual(expected);
    }
  });
  it('respecte négations, mots entiers, accents, contexte bière et provenance invalide',()=>{
    const seed=pack.hopVarieties[0] as HopVariety,source=seed.descriptions[0].source;
    const texts=['AGRUMES et FLORAL','sans agrumes','no citrus','not citrus','non floral','pas de fruit rouge','citrusy','fruit-rouge et végétal','épicé'];
    const v:HopVariety={...seed,descriptions:texts.map(text=>({text,context:'rawHop',source}))};
    v.descriptions.push({text:'citrus',context:'beer',source},{text:'citrus',context:'rawHop',source:{...source,reference:''}});
    const cache=createHopExtrapolationCache();
    for(const terms of [['agrumes'],['citrus'],['floral'],['fruit rouge'],['vegetal','epice'],['?!','']]){
      expect(hopDescriptorEvidence(v,terms,cache)).toEqual(legacyEvidence({...v,descriptions:v.descriptions.filter(d=>d.context!=='beer')},terms));
    }
    expect(hopDescriptorEvidence(v,['citrus'],cache)).toEqual([]);
    expect(hopDescriptorEvidence(v,['vegetal','epice'],cache).map(d=>d.text)).toEqual(['fruit-rouge et végétal','épicé']);
  });
  it('ne garde aucune ancienne preuve lorsqu’une donnée ou un lexique est révisé',()=>{
    const v=structuredClone(pack.hopVarieties[0]) as HopVariety,terms=['citrus'];
    v.descriptions=[{text:'citrus',context:'rawHop',source:v.descriptions[0].source}];
    expect(hopDescriptorEvidence(v,terms,createHopExtrapolationCache())).toHaveLength(1);
    v.descriptions[0].text='sans citrus';
    expect(hopDescriptorEvidence(v,terms,createHopExtrapolationCache())).toHaveLength(0);
    const sameId={...v,descriptions:[{...v.descriptions[0],text:'floral'}]};
    expect(hopDescriptorEvidence(sameId,['floral'],createHopExtrapolationCache())).toHaveLength(1);
  });
});
