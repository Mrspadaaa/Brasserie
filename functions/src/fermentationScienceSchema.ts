import { hopSourceError, validHopRange, type HopConfidence, type HopRange, type HopSource } from './hopIndexSchema.js';
import { FERMENTATION_GOALS, type FermentationGoal } from './fermentationGuideSchema.js';

export const FERMENTATION_CONTROLS = ['strain','temperature','pitch','oxygen','pressure','mash','maturation','hops','nutrition'] as const;
export type FermentationControl = typeof FERMENTATION_CONTROLS[number];
export type FermentationPhase = 'preparation' | 'growth' | 'active' | 'finish' | 'conditioning';
export interface FermentationLever {
  id:string; goals:FermentationGoal[]; yeastIds:string[]; control:FermentationControl; phase:FermentationPhase;
  effect:'promote'|'reduce'|'mixed'|'monitor'; title:string; explanation:string; action:string; limitation:string;
  confidence:HopConfidence; source:HopSource;
}
export interface FermentationCompound {
  id:string; name:string; family:string; aromas:string[]; formation:string; caution:string; source:HopSource;
}
export interface FermentationPhenolStudy {
  id:string; name:string; yeastId:string; source:HopSource; scope:string; limitations:string[];
  /** Three published levels; mash-in is a coupled temperature AND time protocol. */
  levels:{wheatPct:[number,number,number];mashInC:[number,number,number];boilMin:[number,number,number];fermentC:[number,number,number]};
  mashHoldMin:[number,number,number]; wortPlato:number; pitchMillionCellsMl:number;
  observations:{coded:[number,number,number,number];vgMgL:number;vpMgL:number}[];
  prediction:{coverage:number;criticalT:number;df:number;source:HopSource};
  validation:{wheatPct:number;mashInC:number;boilMin:number;fermentC:number;n:number;vgMgL:number;vpMgL:number};
}
/** Fixed brewing concepts, not a user-programmable rule language. All empirical numbers are data. */
export interface FermentationScience {
  id:string; kind:'fermentationScience'; name:string; version:string; enabled:boolean; source:HopSource;
  goals:{id:FermentationGoal;aliases:string[];description:string}[];
  compounds:FermentationCompound[]; levers:FermentationLever[];
  benchmarks:{yeastId:string;temperatureC:number;days:HopRange;conditions:string;source:HopSource}[];
  studies:{id:string;title:string;finding:string;limitation:string;source:HopSource}[];
  lagerRest:{yeastIds:string[];progressPct:HopRange;riseC:HopRange;source:HopSource};
  phenolStudy?:FermentationPhenolStudy;
}
export function assertFermentationScience(v:any):asserts v is FermentationScience {
  const check=(ok:unknown,m:string)=>{if(!ok)throw Error(`Science de fermentation : ${m}.`)};
  const obj=(x:any)=>!!x&&typeof x==='object'&&!Array.isArray(x), text=(x:any)=>typeof x==='string'&&!!x.trim();
  const keys=(x:any,k:string[])=>check(obj(x)&&Object.keys(x).every(f=>k.includes(f)),'champ inconnu');
  const strings=(x:any)=>Array.isArray(x)&&x.every(text);
  const source=(x:any,dated=false)=>check(!hopSourceError(x,dated),'source requise');
  const positive=(x:any)=>Number.isFinite(x)&&x>0;
  keys(v,['id','kind','name','version','enabled','source','goals','compounds','levers','benchmarks','studies','lagerRest','phenolStudy']);
  check(v.kind==='fermentationScience'&&text(v.id)&&text(v.name)&&text(v.version)&&typeof v.enabled==='boolean','identité invalide');source(v.source);
  check(Array.isArray(v.goals)&&v.goals.length>0,'objectifs absents');
  for(const g of v.goals){keys(g,['id','aliases','description']);check(FERMENTATION_GOALS.includes(g.id)&&strings(g.aliases)&&text(g.description),'objectif invalide');}
  check(Array.isArray(v.compounds)&&v.compounds.length<=40,'composés invalides');
  for(const c of v.compounds){keys(c,['id','name','family','aromas','formation','caution','source']);check([c.id,c.name,c.family,c.formation,c.caution].every(text)&&strings(c.aromas),'composé incomplet');source(c.source);}
  check(Array.isArray(v.levers)&&v.levers.length<=100,'leviers invalides');
  for(const l of v.levers){
    keys(l,['id','goals','yeastIds','control','phase','effect','title','explanation','action','limitation','confidence','source']);
    check([l.id,l.title,l.explanation,l.action,l.limitation].every(text)&&strings(l.yeastIds)&&Array.isArray(l.goals)&&l.goals.every((g:any)=>FERMENTATION_GOALS.includes(g)),'levier incomplet');
    check(FERMENTATION_CONTROLS.includes(l.control)&&['preparation','growth','active','finish','conditioning'].includes(l.phase)&&['promote','reduce','mixed','monitor'].includes(l.effect)&&['low','medium','high'].includes(l.confidence),'contexte de levier invalide');source(l.source);
  }
  check(Array.isArray(v.benchmarks),'repères absents');
  for(const b of v.benchmarks){keys(b,['yeastId','temperatureC','days','conditions','source']);check(text(b.yeastId)&&Number.isFinite(b.temperatureC)&&b.temperatureC>=0&&b.temperatureC<=60&&validHopRange(b.days)&&b.days.min>0&&text(b.conditions),'repère invalide');source(b.source);}
  check(Array.isArray(v.studies),'études absentes');
  for(const s of v.studies){keys(s,['id','title','finding','limitation','source']);check([s.id,s.title,s.finding,s.limitation].every(text),'étude incomplète');source(s.source);}
  keys(v.lagerRest,['yeastIds','progressPct','riseC','source']);
  check(strings(v.lagerRest.yeastIds)&&validHopRange(v.lagerRest.progressPct)&&v.lagerRest.progressPct.min>0&&v.lagerRest.progressPct.max<100&&validHopRange(v.lagerRest.riseC)&&v.lagerRest.riseC.min>0,'repos lager invalide');source(v.lagerRest.source);
  if(v.phenolStudy){
    const p=v.phenolStudy;
    keys(p,['id','name','yeastId','source','scope','limitations','levels','mashHoldMin','wortPlato','pitchMillionCellsMl','observations','prediction','validation']);
    check([p.id,p.name,p.yeastId,p.scope].every(text)&&strings(p.limitations),'étude phénols incomplète');source(p.source,true);
    keys(p.levels,['wheatPct','mashInC','boilMin','fermentC']);
    for(const k of ['wheatPct','mashInC','boilMin','fermentC'])check(Array.isArray(p.levels[k])&&p.levels[k].length===3&&p.levels[k].every(positive)&&p.levels[k][0]<p.levels[k][1]&&p.levels[k][1]<p.levels[k][2],'niveaux expérimentaux invalides');
    check(Array.isArray(p.mashHoldMin)&&p.mashHoldMin.length===3&&p.mashHoldMin.every(positive)&&positive(p.wortPlato)&&positive(p.pitchMillionCellsMl),'protocole incomplet');
    check(Array.isArray(p.observations)&&p.observations.length>15&&p.observations.length<=1000,'effectif expérimental invalide');
    for(const o of p.observations){keys(o,['coded','vgMgL','vpMgL']);check(Array.isArray(o.coded)&&o.coded.length===4&&o.coded.every((n:any)=>[-1,0,1].includes(n))&&positive(o.vgMgL)&&positive(o.vpMgL),'observation invalide');}
    keys(p.prediction,['coverage','criticalT','df','source']);check(p.prediction.coverage>0&&p.prediction.coverage<1&&positive(p.prediction.criticalT)&&p.prediction.df===p.observations.length-15,'intervalle statistique invalide');source(p.prediction.source);
    keys(p.validation,['wheatPct','mashInC','boilMin','fermentC','n','vgMgL','vpMgL']);check(Object.values(p.validation).every(positive),'validation invalide');
  }
  for(const field of ['goals','compounds','levers','studies'])check(new Set(v[field].map((r:any)=>r.id)).size===v[field].length,'identifiants dupliqués');
}
