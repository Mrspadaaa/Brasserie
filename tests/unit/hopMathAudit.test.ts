import { describe,expect,it } from 'vitest';
import { extrapolateHopProfile,hopDoseResponse,hopDescriptorEvidence,mixHopDoseShapes } from '../../functions/src/hopExtrapolationCore';
import { compareHopPredictions,createHopPredictor,predictHopTriplet,replayHopTripletV3 } from '../../functions/src/hopPredictionCore';
import { assertHopPredictionSnapshot } from '../../functions/src/hopPredictionValidation';
import { assertHopKnowledge,type HopAxis,type HopPrediction,type HopTriplet,type HopYeast } from '../../functions/src/hopPredictionSchema';
import type { HopExtrapolation } from '../../functions/src/hopExtrapolationSchema';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import coefficients from '../../src/data/hopExtrapolationBootstrap.json';
import legacyCoefficients from '../../src/data/hopExtrapolationLegacyBootstrap.json';
import definitions from '../../src/data/hopKnowledgeBootstrap.json';
import study from '../../src/data/hopDoseStudyBootstrap.json';
import oldStudy from '../../src/data/hopStudyBootstrap.json';
import { captureHopPrediction } from '../../src/domain/hopIndex/snapshots';

const model=coefficients[0] as HopExtrapolation;
const axes=definitions.filter(k=>k.kind==='axis') as HopAxis[];
const source={...model.source,kind:'manufacturer' as const,year:2026};
const variety:HopVariety={id:'hop',name:'Hop',aliases:[],analysis:[],form:'pelletT90',descriptions:[{text:'citrus',context:'rawHop',source}]};
const yeast:HopYeast={id:'lalbrew-verdant-ipa',name:'Verdant',kind:'yeast',betaLyase:'unknown',source};
const triplet:HopTriplet={varietyId:variety.id,yeastId:yeast.id,timing:'postFermentation',doseGL:4,temperatureC:18,contactHours:24,matrixId:null};
const profile=(v=variety,t=triplet,m=model)=>extrapolateHopProfile(t,v,yeast,axes,m,v.form!=='unknown');
const contains=(outer:{min:number;max:number},inner:{min:number;max:number})=>{expect(outer.min).toBeLessThanOrEqual(inner.min+1e-9);expect(outer.max).toBeGreaterThanOrEqual(inner.max-1e-9)};

describe('Contre-exemples de la revue mathématique',()=>{
  it('le cache de recherche conserve exactement les calculs et une nouvelle révision reprend les nouvelles données',()=>{
    const data={varieties:[variety],lots:[],knowledge:[...axes,yeast,model]};
    const cached=createHopPredictor(data);
    for(const doseGL of [0,2,4,16,20])expect(cached({...triplet,doseGL},{})).toEqual(predictHopTriplet({...triplet,doseGL},{},data));
    const changed={...data,varieties:[{...variety,descriptions:[]}]};
    expect(createHopPredictor(changed)(triplet,{})).toEqual(predictHopTriplet(triplet,{},changed));
    expect(createHopPredictor(changed)(triplet,{}).profile.citrus.range).not.toEqual(cached(triplet,{}).profile.citrus.range);
  });
  it('ne gagne pas de précision en supprimant la source la moins fiable, la plus fiable ou une date',()=>{
    const v={...variety,descriptions:[...variety.descriptions,{text:'citrus fruit',context:'rawHop' as const,source:{...source,kind:'community' as const,year:null}}]};
    const before=profile(v).citrus.range!;
    for(const descriptions of [v.descriptions.slice(0,1),v.descriptions.slice(1),[],v.descriptions.map(d=>({...d,source:{...d.source,year:null}}))])contains(profile({...v,descriptions}).citrus.range!,before);
    const unrelated={...v,descriptions:[{...v.descriptions[0],text:'floral'},v.descriptions[1]]};
    contains(profile(unrelated).citrus.range!,before);
    expect(profile({...v,descriptions:[...v.descriptions,...v.descriptions]}).citrus.range).toEqual(before);
  });
  it('zéro houblon donne le même fond levure même avec une autre provenance, forme ou température de contact',()=>{
    const zero={...triplet,doseGL:0};
    const a=profile(variety,zero);
    const b=profile({...variety,descriptions:[],form:'unknown'},{...zero,temperatureC:null,contactHours:null});
    for(const axis of axes)expect(b[axis.id].range).toEqual(a[axis.id].range);
    expect(a.stoneFruit.range!.min).toBeGreaterThan(0);
  });
  it('évite le sous-flux intermédiaire du contre-exemple k=s=2^-538',()=>{
    const k=2**-538,d=2**-1074;
    expect(k*k).toBe(0);
    expect(hopDoseResponse(d,k,k)).toBeCloseTo(.8,12);
    expect(hopDoseResponse(0,k,k)).toBe(0);
    expect(hopDoseResponse(Number.MAX_VALUE,Number.MIN_VALUE,Number.MIN_VALUE)).toBe(1);
  });
  it('ne transforme pas une description de bière fermentée ou une négation en descripteur variétal positif',()=>{
    expect(hopDescriptorEvidence({...variety,descriptions:[{...variety.descriptions[0],context:'beer'}]},['citrus'])).toEqual([]);
    expect(hopDescriptorEvidence({...variety,descriptions:[{...variety.descriptions[0],text:'no citrus'}]},['citrus'])).toEqual([]);
  });
  it('donne un ordre transitif même lorsque les modèles exacts et extrapolés sont mélangés',()=>{
    const base=predictHopTriplet(triplet,{}, {varieties:[variety],lots:[],knowledge:[...axes,yeast,model]});
    const make=(max:number,experimental:boolean):HopPrediction=>({...base,triplet:{...triplet,doseGL:max},score:{range:{min:40,max},confidence:'low',sources:[],reasons:[]},extrapolatedAxes:experimental?['citrus']:undefined});
    const a=make(60,false),b=make(80,false),c=make(70,true);
    for(const order of [[a,b,c],[c,b,a],[b,a,c]])expect(order.sort(compareHopPredictions).map(p=>p.score.range!.max)).toEqual([60,70,80]);
  });
  it('rejoue les instantanés v3 avec leur ancien algorithme sans les réécrire',()=>{
    const data={varieties:[variety],lots:[],knowledge:[...axes,yeast,legacyCoefficients[0] as HopExtrapolation]};
    const s=captureHopPrediction(triplet,{citrus:{min:66,max:100}},data,{id:'frozen',name:'Ancienne version',createdAt:'2026-09-08T12:00:00Z'});
    s.engineVersion='hop-experimental-v3';s.prediction=replayHopTripletV3(triplet,s.target,data);
    const before=structuredClone(s);expect(()=>assertHopPredictionSnapshot(s)).not.toThrow();expect(s).toEqual(before);
    const tampered=structuredClone(s);tampered.prediction=predictHopTriplet(triplet,s.target,data);
    expect(()=>assertHopPredictionSnapshot(tampered)).toThrow(/différent/);
  });
});
describe('Transfert prudent des formes mesurées',()=>{
  it('conserve le même poids dans les deux termes et toute la réponse initiale',()=>{
    expect(mixHopDoseShapes({min:.2,max:.4},{min:.7,max:.8},{min:.5,max:.5})).toEqual({min:.44999999999999996,max:.6000000000000001});
    for (const a of [{min:0,max:0},{min:.2,max:.4},{min:.9,max:1}]) contains(mixHopDoseShapes(a,{min:.3,max:.7},{min:0,max:1}),a);
  });
  it('omet le centre au-delà des données et garde l’inclusion quand la dose est oubliée',()=>{
    const above=profile(variety,{...triplet,doseGL:17});
    expect(above.citrus.central).toBeUndefined();
    const unknown=profile(variety,{...triplet,doseGL:null});
    for(const doseGL of [0,1,4,8,16,17,100]) for(const id of ['citrus','herbal']) contains(unknown[id].range!,profile(variety,{...triplet,doseGL})[id].range!);
  });
});
describe('Courbes de dose réellement publiées',()=>{
  const data={varieties:oldStudy.hopVarieties as HopVariety[],lots:[],knowledge:[...axes,...oldStudy.hopKnowledge.filter(k=>k.kind==='yeast'),...study] as any};
  const t:HopTriplet={...triplet,varietyId:'cascade-cones-lafontaine',yeastId:'wyeast-1728',matrixId:'cascade-static-dose-2015',temperatureC:14,contactHours:24};
  it('valide la source et retrouve les moyennes 8→16 g/L sans imposer une hausse des agrumes',()=>{
    expect(()=>assertHopKnowledge(study[0])).not.toThrow();
    const a=predictHopTriplet({...t,doseGL:8},{},data),b=predictHopTriplet({...t,doseGL:16},{},data);
    const middle=(p:HopPrediction,id:string)=>(p.profile[id].range!.min+p.profile[id].range!.max)/2;
    expect(middle(a,'citrus')).toBeCloseTo(7.1*100/15,10);expect(middle(b,'citrus')).toBeCloseTo(7*100/15,10);
    expect(middle(b,'herbal')).toBeGreaterThan(middle(a,'herbal'));expect(a.profile.citrus.confidence).toBe('low');
  });
  it('ne transfère pas la courbe à une autre levure, matrice, température, durée ou dose hors observations',()=>{
    for(const patch of [{yeastId:yeast.id},{matrixId:null},{temperatureC:18},{contactHours:48},{doseGL:17}])expect(predictHopTriplet({...t,...patch},{},data).profile.citrus.range).toBeNull();
  });
});
