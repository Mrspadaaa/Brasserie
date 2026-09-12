import { assertFermentationScience, type FermentationScience, type FermentationPhenolStudy } from './fermentationScienceSchema.js';
import type { FermentationGuide, FermentationGoal } from './fermentationGuideSchema.js';
import type { HopRange, HopSource } from './hopIndexSchema.js';
export interface FermentationEstimate { range:HopRange|null; confidence:'low'|'medium'; sources:HopSource[]; reasons:string[] }
const finite=(n:unknown):n is number=>typeof n==='number'&&Number.isFinite(n);
const unknown=(reason:string,sources:HopSource[]=[]):FermentationEstimate=>({range:null,confidence:'low',sources,reasons:[reason]});
const fold=(v:string)=>v.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
/** Invalid and disabled records never resurrect their bundled equivalent here. */
export function activeFermentationScience(knowledge:unknown[]):FermentationScience[] {
 return knowledge.filter((v):v is FermentationScience=>{try{assertFermentationScience(v);return v.enabled;}catch{return false;}});
}
export function suggestFermentationGoals(science:FermentationScience|undefined,query:string){
 const terms=fold(query).split(' ').filter(Boolean);
 return (science?.goals??[]).filter(g=>terms.length&&g.aliases.some(a=>terms.every(t=>fold(a).includes(t))));
}
export function fermentationLevers(science:FermentationScience|undefined,goal:FermentationGoal,yeastId?:string){
 return science?.enabled?science.levers.filter(l=>l.goals.includes(goal)&&(!l.yeastIds.length||!!yeastId&&l.yeastIds.includes(yeastId))).sort((a,b)=>Number(!!b.yeastIds.length)-Number(!!a.yeastIds.length)):[];
}
/** SG-point arithmetic, not a wort fermentability model. No automatic midpoint. */
export function fermentationFinalGravity(guide:FermentationGuide|undefined,og:unknown):FermentationEstimate{
 return fermentationGravityFromAttenuation(guide?.attenuationPct,og);
}
/** Also accepts concordant catalogue facts without inventing a fermentation plan. */
export function fermentationGravityFromAttenuation(fact:FermentationGuide['attenuationPct'],og:unknown):FermentationEstimate{
 if(!fact)return unknown('Plage d’atténuation de la souche absente.');
 if(!finite(og)||og<=1)return unknown('DI en SG requise, supérieure à 1.',[fact.source]);
 const a=fact.range;
 if(!finite(a.min)||!finite(a.max)||a.min<0||a.max>100||a.min>a.max)return unknown('Plage d’atténuation invalide.',[fact.source]);
 return {range:{min:1+(og-1)*(1-a.max/100),max:1+(og-1)*(1-a.min/100)},confidence:'low',sources:[fact.source],
 reasons:['Projection de la plage d’atténuation fabricant sur les points de DI. Fermentescibilité du moût non mesurée ; ni DF garantie ni intervalle statistique. Les sucres non fermentescibles et ajouts ultérieurs exigent une réévaluation.']};
}
export function fermentationLagerRest(science:FermentationScience|undefined,guide:FermentationGuide|undefined,og:unknown,sg?:unknown){
 const unavailable=(reason:string)=>({trigger:unknown(reason),progress:unknown(reason)});
 if(!science?.enabled||!guide||!science.lagerRest.yeastIds.includes(guide.yeastId))return unavailable('Repère de repos lager non documenté pour cette souche.');
 const fg=fermentationFinalGravity(guide,og);
 if(!fg.range||!finite(og))return unavailable(fg.reasons[0]);
 const p=science.lagerRest.progressPct, sources=[...fg.sources,science.lagerRest.source];
 const trigger:FermentationEstimate={range:{min:og-(og-fg.range.min)*p.max/100,max:og-(og-fg.range.max)*p.min/100},confidence:'low',sources,
 reasons:['Repère pour préparer le repos, calculé sur le chemin DI → DF attendue. Ce n’est pas une autorisation de refroidir ou de conditionner.']};
 if(!finite(sg)||sg<=0||sg>og||fg.range.max>=og)return {trigger,progress:unknown('Densité actuelle SG cohérente requise pour calculer la progression.',sources)};
 const progress:FermentationEstimate={range:{min:100*(og-sg)/(og-fg.range.min),max:100*(og-sg)/(og-fg.range.max)},confidence:'low',sources,
 reasons:['Progression vers une DF estimée ; peut dépasser 100 % si le moût atténue davantage. Aucun plafonnement qui cacherait cet écart.']};
 return {trigger,progress};
}
export function fermentationProgramWarnings(guide:FermentationGuide|undefined,steps:{name?:string;kind?:string;tempC?:number}[]){
 if(!guide)return ['Souche sans conduite documentée : vérifier sa fiche et les températures saisies.'];
 return steps.filter(s=>s.kind==='primaire'||s.kind==='reposDiacetyle').flatMap(s=>!finite(s.tempC)?[(s.name??'Palier')+' : température inconnue.']:s.tempC<guide.temperatureC.range.min||s.tempC>guide.temperatureC.range.max?[(s.name??'Palier')+' : température hors de la fenêtre fabricant de cette souche.']:[]);
}
const dot=(a:number[],b:number[])=>a.reduce((sum,v,i)=>sum+v*b[i],0);
/** Complete second-order response surface: no independent "bonuses" are added. */
export function phenolFeatures(z:number[]){
 const terms=[1,...z,...z.map(x=>x*x)];
 for(let i=0;i<z.length;i++)for(let j=i+1;j<z.length;j++)terms.push(z[i]*z[j]);
 return terms;
}
/** Pivoted Gauss–Jordan on the small coded design. Tolerance is numerical, not biological. */
function inverse(matrix:number[][]){
 const n=matrix.length, m=matrix.map((r,i)=>[...r,...Array.from({length:n},(_,j)=>i===j?1:0)]);
 for(let c=0;c<n;c++){
  let pivot=c; for(let r=c+1;r<n;r++)if(Math.abs(m[r][c])>Math.abs(m[pivot][c]))pivot=r;
  if(!finite(m[pivot][c])||Math.abs(m[pivot][c])<1e-12)throw Error('Plan expérimental non identifiable.');
  [m[c],m[pivot]]=[m[pivot],m[c]];
  const d=m[c][c]; m[c]=m[c].map(x=>x/d);
  for(let r=0;r<n;r++)if(r!==c){const f=m[r][c];m[r]=m[r].map((x,j)=>x-f*m[c][j]);}
 }
 return m.map(r=>r.slice(n));
}
export function fitPhenolStudy(study:FermentationPhenolStudy){
 const x=study.observations.map(o=>phenolFeatures(o.coded)), n=x.length,p=x[0]?.length;
 if(!p||n<=p||study.prediction.df!==n-p)throw Error('Effectif ou degrés de liberté incohérents.');
 const inv=inverse(Array.from({length:p},(_,i)=>Array.from({length:p},(_,j)=>x.reduce((s,r)=>s+r[i]*r[j],0))));
 const fit=(key:'vgMgL'|'vpMgL')=>{
  const y=study.observations.map(o=>o[key]);
  const xty=Array.from({length:p},(_,i)=>x.reduce((s,r,j)=>s+r[i]*y[j],0));
  const coefficients=inv.map(row=>dot(row,xty)), residuals=x.map((r,i)=>y[i]-dot(r,coefficients));
  const sse=dot(residuals,residuals), mean=y.reduce((a,b)=>a+b,0)/n, sst=y.reduce((a,b)=>a+(b-mean)**2,0);
  if(!finite(sse)||sse<=0||sst<=0)throw Error('Variance résiduelle non exploitable.');
  return {coefficients,mse:sse/(n-p),r2:1-sse/sst};
 };
 return {inv,vg:fit('vgMgL'),vp:fit('vpMgL'),n,parameters:p,df:n-p};
}
export interface PhenolScenario{
 yeastId:string|null; protocolMatched:boolean; wortPlato:number|null; pitchMillionCellsMl:number|null;
 wheatPct:number|null; mashInC:number|null; boilMin:number|null; fermentC:number|null;
}
export function predictStudyPhenols(study:FermentationPhenolStudy|undefined,input:PhenolScenario){
 const absent=(why:string)=>({vg:unknown(why,study?[study.source]:[]),vp:unknown(why,study?[study.source]:[])});
 if(!study)return absent('Étude quantitative indisponible.');
 if(input.yeastId!==study.yeastId)return absent('Cette étude décrit uniquement '+study.yeastId+' ; transfert à une autre souche non validé.');
 if(!input.protocolMatched||input.wortPlato!==study.wortPlato||input.pitchMillionCellsMl!==study.pitchMillionCellsMl)return absent('Le moût, le pitch et le protocole complet de l’étude doivent être explicitement identiques.');
 const keys=['wheatPct','mashInC','boilMin','fermentC'] as const;
 if(keys.some(k=>!finite(input[k])))return absent('Un facteur expérimental est manquant.');
 if(!study.levels.mashInC.includes(input.mashInC!))return absent('Choisir un des trois protocoles couplés de mash-in ; pas d’interpolation de sa température seule.');
 const z=keys.map(k=>{const [lo,mid,hi]=study.levels[k],v=input[k]!;return (v-mid)/(v<mid?mid-lo:hi-mid);});
 // The hull of the four-factor Box–Behnken design is |zi| ≤ 1, sum |zi| ≤ 2.
 if(z.some(v=>!finite(v)||Math.abs(v)>1)||z.reduce((s,v)=>s+Math.abs(v),0)>2+1e-12)return absent('Hors de l’enveloppe des essais publiés : pas d’extrapolation aux coins non étudiés.');
 try{
  const f=fitPhenolStudy(study), x=phenolFeatures(z), leverage=dot(x,f.inv.map(r=>dot(r,x)));
  const estimate=(model:typeof f.vg):FermentationEstimate=>{
   const mean=dot(x,model.coefficients), margin=study.prediction.criticalT*Math.sqrt(model.mse*(1+leverage));
   if(!finite(mean)||!finite(margin)||margin<=0)throw Error('Intervalle invalide.');
   return {range:{min:mean-margin,max:mean+margin},confidence:'low',sources:[study.source,study.prediction.source],
    reasons:['Intervalle nominal '+(study.prediction.coverage*100)+' % pour une nouvelle observation du même procédé, sous les hypothèses du modèle. Confiance de transfert faible ; ce n’est pas une intensité aromatique ni une prédiction de la recette.']};
  };
  return {vg:estimate(f.vg),vp:estimate(f.vp),diagnostics:{n:f.n,parameters:f.parameters,df:f.df,leverage,r2VG:f.vg.r2,r2VP:f.vp.r2,mseVG:f.vg.mse,mseVP:f.vp.mse}};
 }catch(e){return absent('Calcul local indisponible : '+(e as Error).message);}
}
