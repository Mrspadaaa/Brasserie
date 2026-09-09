import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import type { NoloConfig, NoloMeasurement, NoloOperation, NoloProcess, NoloStage } from '../../functions/src/noloSchema';
import { NOLO_SUGARS } from '../../functions/src/noloSchema';
import { noloInputBasis, type NoloBound } from '../../functions/src/noloCore';
import type { HopRange } from '../../functions/src/hopIndexSchema';
import { applyNoloStrain, evaluateNoloRecipe, newNoloConfig, noloInput, noloScience, rankNoloStrains, noloPlanningSource } from '../domain/nolo';
import { changeNoloProcess, noloScenarioBasis } from '../../functions/src/noloScenario';
import { FermentationResearchSheet } from './FermentationResearchSheet';
import { StorageService } from '../services/storage';
import { useStorageValue } from '../hooks/useLiveData';
import { inputClass } from './FormNav';
import { Button } from '../components/ui/Button';
import { HopSourceLink } from './hopIndex/HopTechnicalPanel';
import { guideFermentations } from './hopIndex/guideData';

const decimal = (n: number) => n.toLocaleString('fr-FR',{maximumFractionDigits:3});
/** Outward rounding: a narrow interval across 0.5 must never display as 0.5–0.5. */
export function noloRangeLabel(r: NoloBound): string {
  const lower=Math.floor(r.min*1000)/1000;
  if(r.max===null)return lower>0 ? '≥ '+decimal(lower)+' % · borne haute inconnue' : 'Indéterminé';
  return decimal(lower)+'–'+decimal(Math.ceil(r.max*1000)/1000)+' % vol.';
}
function Num({label,value,onChange,unit,max}: {label:string;value:number|null|undefined;onChange:(n:number|null)=>void;unit?:string;max?:number}) {
  const id=useId();
  return <label htmlFor={id} className="block min-w-0 text-xs text-cave-300">{label}{unit?' · '+unit:''}
    <input id={id} type="number" min={0} max={max} step="any" className={inputClass+' mt-1'} value={value??''} placeholder="Inconnu"
      onChange={e=>{const n=e.target.value===''?null:Number(e.target.value);if(n===null||Number.isFinite(n)&&n>=0&&(max==null||n<=max))onChange(n);}}/></label>;
}
export function RangeInput({label,value,onChange,unit,max}:{label:string;value:HopRange|null|undefined;onChange:(r:HopRange|null)=>void;unit:string;max?:number}) {
  const [draftMin,setMin]=useState<number|null>(value?.min??null),[draftMax,setMax]=useState<number|null>(value?.max??null);
  const emitted=useRef<string|undefined>(undefined);
  useEffect(()=>{const next=JSON.stringify(value??null);if(next!==emitted.current){setMin(value?.min??null);setMax(value?.max??null);}emitted.current=next;},[value?.min,value?.max]);
  // Each input remains independently editable while a reversed/incomplete pair is unknown.
  const update=(a:number|null,b:number|null)=>{setMin(a);setMax(b);const next=a!=null&&b!=null&&a<=b?{min:a,max:b}:null;emitted.current=JSON.stringify(next);onChange(next);};
  return <div className="min-w-0"><p className="text-xs text-cave-300 mb-1">{label} · {unit}</p><div className="grid grid-cols-2 gap-2">
    <Num label={label+' minimum'} value={draftMin} max={max} onChange={n=>update(n,draftMax)}/>
    <Num label={label+' maximum'} value={draftMax} max={max} onChange={n=>update(draftMin,n)}/>
  </div>{draftMin!=null&&draftMax!=null&&draftMin>draftMax&&<p role="status" className="text-xs text-ebc-straw">Minimum supérieur au maximum : plage indéterminée.</p>}</div>;
}
function BoundGraph({bound,target,label='Projection au conditionnement'}:{bound:NoloBound;target:number;label?:string}) {
  const upper=Math.max(target,bound.max??target,bound.min,1);
  return <figure aria-label={label} className="space-y-2" data-nolo-min={bound.min} data-nolo-max={bound.max??'unknown'}>
    <p className="text-xs text-cave-300">{label}</p>
    <figcaption className="font-mono text-xl text-cave-50">{noloRangeLabel(bound)}</figcaption>
    <div className="relative h-3 bg-cave-800 rounded-full" aria-hidden="true">
      {bound.max!==null&&<span className="absolute h-3 bg-hop/70 rounded-full" data-nolo-band style={{left:100*bound.min/upper+'%',width:Math.max(.25,100*(bound.max-bound.min)/upper)+'%'}}/>}
      <span className="absolute -top-1 h-5 border-l-2 border-ebc-straw" style={{left:100*target/upper+'%'}}/>
    </div>
    <p className="text-xs text-cave-400">Cible ≤ {decimal(target)} % · {bound.kind==='measurement'?'Analyse fournie':bound.kind==='experimental'?'Projection conditionnelle, sans marge statistique publiée':'Bornes physiques, pas intervalle statistique'} · confiance {bound.confidence==='medium'?'moyenne':bound.confidence==='high'?'élevée':'faible'}</p>
  </figure>;
}
const sugarLabel={glucose:'Glucose',fructose:'Fructose',sucrose:'Saccharose',maltose:'Maltose',maltotriose:'Maltotriose'};
const emptyRunnings={sourceBatchId:'',previousExtraction:'',waterAddedL:null,alkalinityPpm:null,temperatureC:null,minutes:null,recoveredL:null,sg:null,ph:null};
const stageLabels:Record<NoloStage,string>={sourceWater:'Eau source',mash:'Empâtage',sparge:'Rinçage',lastRunnings:'Dernières eaux de coulage',wort:'Moût avant fermentation',primary:'Après fermentation, avant conditionnement',packaged:'Bière conditionnée'};

export function NoloPanel({recipe,onChange,allowEnable=false,measurementOnly=false}:{recipe:TrialRecipe;onChange?:(r:TrialRecipe)=>void;allowEnable?:boolean;measurementOnly?:boolean}) {
  const saved=useStorageValue(StorageService.getHopKnowledge);
  const science=useMemo(()=>noloScience(saved),[saved]);
  const c=recipe.nolo, editable=!!onChange;
  const outcome=useMemo(()=>{try{return {result:evaluateNoloRecipe(recipe,saved),error:''};}catch(e){return {result:null,error:e instanceof Error?e.message:'Configuration NOLO invalide.'};}},[recipe,saved]);
  const result=outcome.result;
  const documentedPof=useMemo(()=>{
    const values=[result?.strain?.pof,...guideFermentations(saved).filter(g=>g.yeastId===recipe.yeast.hopIndexId).map(g=>g.aroma.pof)].filter(v=>v&&v!=='unknown');
    return new Set(values).size===1?values[0]:'unknown';
  },[result?.strain?.pof,saved,recipe.yeast.hopIndexId]);
  const [selectedStrain,setStrain]=useState(''),[operationKind,setOperationKind]=useState<NoloOperation['kind']>('sugar');
  const [measure,setMeasure]=useState<Partial<NoloMeasurement>>({stage:'packaged',date:new Date().toISOString().slice(0,10),method:''});
  const [variant,setVariant]=useState<TrialRecipe>();
  const [researchOpen,setResearchOpen]=useState(false);
  const ranked=useMemo(()=>{try{return science&&c?rankNoloStrains(recipe,science):[];}catch{return [];}},[science,recipe,c]);
  const update=(patch:Partial<NoloConfig>)=>{const next={...(c??newNoloConfig()),...patch};onChange?.({...recipe,nolo:changeNoloProcess(next,next.process)});};
  const plan=(patch:Partial<NonNullable<NoloConfig['planning']>>)=>update({planning:{version:1,source:noloPlanningSource,...c?.planning,...patch}});
  const op=(index:number,next:NoloOperation)=>update({operations:c!.operations.map((o,i)=>i===index?next:o)});
  const selected=science?.strains.find(s=>s.yeastId===selectedStrain)??science?.strains.find(s=>s.yeastId===result?.strain?.yeastId)??science?.strains[0];
  const addOperation=()=>{
    if(!c)return;
    const base={id:crypto.randomUUID(),name:''};
    const next:NoloOperation=operationKind==='sugar'?{...base,kind:'sugar',name:'Resucrage / fruit',sugarsG:{},complete:false,volumeL:0}
      :operationKind==='aroma'?{...base,kind:'aroma',name:'Restitution aromatique',volumeML:null,carrierAbvPct:null,sugarG:null,composition:'',moment:''}
      :operationKind==='blend'?{...base,kind:'blend',name:'Assemblage',volumeL:null,abvPct:null,remainingSugarG:null}
      :operationKind==='dilution'?{...base,kind:'dilution',name:'Eau ajoutée',volumeL:null}
      :{...base,kind:'removal',name:'Désalcoolisation',ethanolRemovedPct:null,finalVolumeL:null,source:''};
    update({operations:[...c.operations,next]});
  };
  if(!c?.enabled&&!allowEnable)return null;
  if(variant)return <section className="space-y-3"><Button onClick={()=>setVariant(undefined)}>Fermer la variante NOLO</Button><p className="text-xs text-cave-400">Variante locale · aucune écriture</p><NoloPanel recipe={variant} onChange={setVariant}/></section>;
  return <section aria-label="Objectif NOLO" className="min-w-0 rounded-panel border border-hop/30 bg-cave-900 p-3 sm:p-4 space-y-3">
    {researchOpen&&<FermentationResearchSheet onClose={()=>setResearchOpen(false)}/>}
    <div className="flex flex-wrap items-center justify-between gap-2">
      {allowEnable&&editable?<label className="flex min-h-touch items-center gap-2 font-semibold text-cave-50"><input name="nolo-enabled" aria-label="Objectif NOLO · ≤ 0,5 %" type="checkbox" className="accent-hop" checked={!!c?.enabled} onChange={e=>onChange?.({...recipe,nolo:{...(c??newNoloConfig()),enabled:e.target.checked}})}/>Objectif NOLO · ≤ 0,5 %</label>:<h3 className="font-serif text-xl text-cave-50">Objectif NOLO</h3>}
      {c&&!editable&&<Button onClick={()=>setVariant(structuredClone(recipe))}>Simuler une variante NOLO</Button>}
    </div>
    {c?.enabled&&<>
      {editable?<label className="block text-sm text-cave-300">Procédé<select className={inputClass+' mt-1'} value={c.process} onChange={e=>onChange?.({...recipe,nolo:changeNoloProcess(c,e.target.value as NoloProcess)})}>{science?.processes.map(p=><option key={p.id} value={p.id}>{({restricted:'Fermentation limitée',restored:'Limité + restitution',lowExtract:'Faible extrait',coldExtraction:'Extraction à froid',coldContact:'Contact à froid',arrested:'Fermentation interrompue',dealcoholized:'Désalcoolisation',secondRunnings:'Seconde extraction'})[p.id]}</option>)}</select></label>:<p className="text-sm text-cave-300">{science?.processes.find(p=>p.id===c.process)?.name??c.process}</p>}
      {!result?<p role="alert" className="text-sm text-ebc-straw">{outcome.error||'Référence NOLO absente ou désactivée. Complète les références pour calculer ce scénario.'}</p>:<>
        <BoundGraph bound={result.projection.max!==null?result.projection:result.motherBeer.max!==null?result.motherBeer:result.packagedAbv.max!==null?result.packagedAbv:result.projection} target={c.targetAbvPct} label={result.projection.max!==null?'Projection au conditionnement':result.motherBeer.max!==null?'Bière mère · avant traitement':result.packagedAbv.max!==null?'Plafond physique · pas une prédiction':'Projection à compléter'}/>
        <p className="text-xs text-cave-300">{result.measuredPackaged?'Analyse finale rattachée à ce scénario':'Alcool final à vérifier par analyse'}</p>
        {result.projectionStatus==='within'&&<p className="text-sm text-hop">Cible atteignable sous les hypothèses affichées</p>}
        {result.projectionStatus==='exceeds'&&<p className="text-sm text-ebc-straw">Projection au-dessus de la cible</p>}
        {editable&&!measurementOnly&&c.process==='arrested'&&<RangeInput label="Densité d’arrêt envisagée" unit="SG" max={3} value={c.planning?.stopSg} onChange={stopSg=>plan({stopSg,stopAttenuationPct:undefined})}/>}
        {editable&&!measurementOnly&&c.process==='dealcoholized'&&c.operations.filter(o=>o.kind==='removal').map(o=>o.kind==='removal'&&<details key={o.id} open={!o.ethanolRemovedPct||!o.finalVolumeL}><summary className="min-h-touch cursor-pointer text-sm text-water">Hypothèses de désalcoolisation</summary><div className="space-y-3">
          <RangeInput label="Retrait supposé de l’alcool présent" unit="%" max={100} value={o.ethanolRemovedPct} onChange={r=>op(c.operations.indexOf(o),{...o,ethanolRemovedPct:r,source:o.source||'Hypothèse de préparation personnelle, 2026'})}/>
          <Num label="Volume prévu après traitement" unit="L" value={o.finalVolumeL} onChange={n=>op(c.operations.indexOf(o),{...o,finalVolumeL:n})}/>
          {result.requiredRemovalPct&&<p className="text-xs text-cave-300">Retrait nécessaire avant ajouts : {decimal(result.requiredRemovalPct.min)}–{decimal(result.requiredRemovalPct.max)} %. Les apports ultérieurs doivent encore entrer dans le bilan.</p>}
        </div></details>)}
        {!!result.inactiveOperations.length&&<p className="text-xs text-cave-400">{result.inactiveOperations.length} opération(s) écartée(s), récupérables en revenant au procédé précédent.</p>}
        <details><summary className="min-h-touch cursor-pointer text-sm text-water">Étapes, hypothèses et vérification</summary><div className="space-y-2 text-xs text-cave-300">
          {result.stages.map(stage=><p key={stage.id}>{stage.label} : {noloRangeLabel(stage.abv)}</p>)}
          {result.assumptions.map(a=><p key={a}>{a}</p>)}
          <p>Borne incluant l’alcool encore formable : {noloRangeLabel(result.packagedAbv)}</p>
          {result.sources.map((source,i)=><HopSourceLink key={i} source={source}/>)}
        </div></details>
        <p data-nolo-status={result.status} className={result.status==='indeterminate'?'sr-only':'text-sm text-cave-200'}>{result.status==='within'?'Cible estimée respectée':result.status==='exceeds'?'Dépassement':'Résultat alcoolique indéterminé'}</p>
        <p role="status" className="text-sm text-water">{result.nextAction}</p>
        <figure aria-label="Profil aromatique NOLO" className="grid grid-cols-2 gap-3 border-t border-cave-800 pt-3">
          <figcaption className="sr-only">Objectif et caractères documentés, intensités non prédites</figcaption>
          <div><p className="text-xs text-cave-400">Banane · objectif</p><p className="text-sm text-ebc-straw">{c.orientation==='free'?'Non ciblée':c.orientation==='banana'?'Dominante':c.orientation==='balanced'?'Équilibrée':'Secondaire'}</p><div className="mt-2 border-b border-dashed border-cave-600"/><p className="text-xs text-cave-400 mt-1">Intensité non quantifiée</p></div>
          <div><p className="text-xs text-cave-400">Girofle · caractère</p><p className={"text-sm "+(documentedPof==='positive'?'text-hop':'text-cave-300')}>{documentedPof==='positive'?'Potentiel POF+ documenté':documentedPof==='negative'?'Souche POF−':'POF inconnu'}</p><div className="mt-2 border-b border-dashed border-cave-600"/><p className="text-xs text-cave-400 mt-1">Intensité non quantifiée</p></div>
        </figure>
      </>}
      <details><summary className="cursor-pointer py-3 text-sm text-water">Affiner le pilote · mesures, procédés et sources</summary><div className="space-y-2">
      {editable&&!measurementOnly&&science&&<details><summary className="cursor-pointer min-h-touch flex items-center text-water">Préparer le pilote et choisir la souche</summary><div className="pt-2 space-y-3">
        <label className="block text-sm text-cave-300">Orientation hefeweisse<select className={inputClass} value={c.orientation} onChange={e=>update({orientation:e.target.value as NoloConfig['orientation']})}><option value="free">Profil personnel · sans cible hefeweisse</option><option value="banana">Banane dominante</option><option value="balanced">Équilibrée</option><option value="clove">Girofle dominant</option></select></label>
        <label className="block text-sm text-cave-300">Candidate NOLO<select className={inputClass} value={selected?.yeastId??''} onChange={e=>setStrain(e.target.value)}>{science.strains.map(s=><option key={s.yeastId} value={s.yeastId}>{s.name}{s.pof==='positive'?' · phénolique':s.pof==='negative'?' · propre':''}</option>)}</select></label>
        {selected&&<><p className="text-sm text-cave-300">{selected.aroma.join(' · ')}</p><p className="text-xs text-cave-400">{selected.temperatureC?decimal(selected.temperatureC.min)+'–'+decimal(selected.temperatureC.max)+' °C':'Température à documenter'} · {selected.durationDays?decimal(selected.durationDays.min)+'–'+decimal(selected.durationDays.max)+' jours indicatifs':'Durée à documenter'}</p>
          <p className="text-xs text-cave-400">{selected.pitchGL?'Repère d’ensemencement : '+decimal(selected.pitchGL.min)+'–'+decimal(selected.pitchGL.max)+' g/L'+(recipe.volumeL>0?' · '+decimal(selected.pitchGL.min*recipe.volumeL)+'–'+decimal(selected.pitchGL.max*recipe.volumeL)+' g pour ce volume':'')+' · plage fabricant, à peser.':'Dose d’ensemencement à documenter.'}</p>
          <Button onClick={()=>onChange?.(applyNoloStrain(recipe,selected,science))}>Choisir {selected.name} et sa conduite</Button>
          <details><summary className="cursor-pointer min-h-touch text-sm text-cave-300">Assimilation et limites de la souche</summary><div className="overflow-x-auto"><table className="w-full text-xs"><tbody>{NOLO_SUGARS.map(s=><tr key={s}><th className="text-left p-1">{sugarLabel[s]}</th><td>{selected.sugars[s]==='yes'?'Assimilé':selected.sugars[s]==='no'?'Non assimilé':'Inconnu'}</td></tr>)}</tbody></table></div><p className="text-xs text-cave-400 my-2">{selected.limitation} {selected.availability}</p><HopSourceLink source={selected.source}/></details></>}
        <p className="text-xs text-cave-400">La souche reste libre dans la recette. Chauffer davantage ne donne pas automatiquement plus de banane.</p>
        <details><summary className="min-h-touch cursor-pointer text-sm text-cave-300">Comparer les candidates sur mon moût</summary><div className="space-y-2">{ranked.map(row=><button type="button" key={row.strain.yeastId} className="block w-full min-h-touch text-left border-b border-cave-700 py-2" onClick={()=>setStrain(row.strain.yeastId)}><span className="block text-sm text-cave-100">{row.strain.name}</span><span className="block text-xs text-cave-400">{row.result.projectionStatus==='within'?'Projection compatible · alcool à vérifier':row.result.projectionStatus==='exceeds'?'Projection au-dessus de la cible':'Projection à compléter'} · {row.aromaFit==='documented'?'caractère phénolique documenté':'objectif aromatique à explorer'}{row.needsThermalControl?' · maîtrise thermique à prévoir':''}</span></button>)}</div><p className="text-xs text-cave-400 mt-2">Classement local par cible alcoolique puis caractère documenté. Aucune exclusion par style, ni note de banane inventée.</p></details>
        <fieldset className="space-y-1"><legend className="text-sm text-cave-200">Matériel disponible</legend>{['pH-mètre','Maîtrise thermique','Carbonatation forcée','Conditionnement maîtrisé','Analyse faible teneur','Stabilisation validée','Désalcoolisation spécialisée'].map(e=><label key={e} className="min-h-touch flex items-center gap-2 text-sm text-cave-300"><input type="checkbox" checked={c.equipment.includes(e)} onChange={v=>update({equipment:v.target.checked?[...c.equipment,e]:c.equipment.filter(x=>x!==e)})}/>{e}</label>)}</fieldset>
      </div></details>}
      <details><summary className="cursor-pointer min-h-touch flex items-center text-water">Moût, ajouts et mesures</summary><div className="space-y-4 pt-2">
        {editable?<><RangeInput label="Extrait du moût" unit="°P" value={c.wort.ogPlato} max={100} onChange={ogPlato=>update({wort:{...c.wort,ogPlato}})}/>
          <details><summary className="cursor-pointer min-h-touch text-sm text-cave-300">Analyse des sucres du moût</summary><div className="space-y-3">{NOLO_SUGARS.map(s=><RangeInput key={s} label={sugarLabel[s]} unit="g/L" value={c.wort.sugarsGL[s]} onChange={r=>update({wort:{...c.wort,sugarsGL:{...c.wort.sugarsGL,[s]:r}}})}/>)}</div><label className="flex gap-2 text-xs text-cave-300 py-3"><input type="checkbox" checked={c.wort.sugarsComplete} onChange={e=>update({wort:{...c.wort,sugarsComplete:e.target.checked}})}/>Profil complet : les sucres omis sont confirmés absents ; les champs effacés restent inconnus.</label></details>
          <div className="space-y-3">{c.operations.map((o,i)=>o.id==='batch-priming'?<p key={o.id} className="text-xs text-cave-300">Resucrage du brassin : {o.kind==='sugar'&&o.unclassifiedSugarG?decimal(o.unclassifiedSugarG.max)+' g':'quantité inconnue'}. À modifier dans le conditionnement du brassin.</p>:<details key={o.id}><summary className="cursor-pointer min-h-touch text-sm text-cave-200">{i+1}. {o.name||o.kind}</summary><div className="space-y-3 border-l border-cave-700 pl-3">
            <label className="block text-xs text-cave-300">Nom de l’opération<input className={inputClass} value={o.name} onChange={e=>op(i,{...o,name:e.target.value})}/></label>
            {'volumeL'in o&&<Num label="Volume ajouté" unit="L" value={o.volumeL} onChange={n=>op(i,{...o,volumeL:n})}/>}
            {o.kind==='sugar'&&recipe.fermentables.some(f=>f.use==='fermentation')&&<label className="block text-xs">Ajout de recette déjà compté<select className={inputClass} value={o.recipeAddition?.index??''} onChange={e=>op(i,{...o,recipeAddition:e.target.value===''?undefined:{index:Number(e.target.value),basis:JSON.stringify(recipe.fermentables[Number(e.target.value)])}})}><option value="">Ajout indépendant</option>{recipe.fermentables.map((f,index)=>f.use==='fermentation'&&<option key={index} value={index}>{f.name} · {f.weightKg} kg</option>)}</select><span className="text-cave-400">Les grammes de sucres ci-dessous représentent cet ingrédient entier ; ne pas saisir une seconde opération pour le même apport.</span></label>}
            {o.kind==='sugar'&&<>{NOLO_SUGARS.map(s=><RangeInput key={s} label={sugarLabel[s]+' ajouté'} unit="g au total" value={o.sugarsG[s]} onChange={r=>op(i,{...o,sugarsG:{...o.sugarsG,[s]:r}})}/>)}<label className="flex gap-2 text-xs text-cave-300"><input type="checkbox" checked={o.complete} onChange={e=>op(i,{...o,complete:e.target.checked})}/>Composition complète de l’ajout</label></>}
            {o.kind==='aroma'&&<><Num label="Volume de produit" unit="mL" value={o.volumeML} onChange={n=>op(i,{...o,volumeML:n})}/><RangeInput label="Alcool du support" unit="% vol." max={100} value={o.carrierAbvPct} onChange={r=>op(i,{...o,carrierAbvPct:r})}/><RangeInput label="Sucres du produit ajouté" unit="g au total" value={o.sugarG} onChange={r=>op(i,{...o,sugarG:r})}/><label className="block text-xs">Composition connue<input className={inputClass} value={o.composition} onChange={e=>op(i,{...o,composition:e.target.value})}/></label><label className="block text-xs">Moment de restitution<input className={inputClass} value={o.moment} onChange={e=>op(i,{...o,moment:e.target.value})}/></label></>}
            {o.kind==='blend'&&<><RangeInput label="Alcool de la bière ajoutée" unit="% vol." max={100} value={o.abvPct} onChange={r=>op(i,{...o,abvPct:r})}/><RangeInput label="Sucres encore fermentescibles" unit="g au total" value={o.remainingSugarG} onChange={r=>op(i,{...o,remainingSugarG:r})}/></>}
            {o.kind==='removal'&&<><RangeInput label="Fraction d’alcool retirée" unit="%" max={100} value={o.ethanolRemovedPct} onChange={r=>op(i,{...o,ethanolRemovedPct:r})}/><Num label="Volume après traitement" unit="L" value={o.finalVolumeL} onChange={n=>op(i,{...o,finalVolumeL:n})}/><label className="block text-xs">Source du rendement de retrait<input className={inputClass} value={o.source} onChange={e=>op(i,{...o,source:e.target.value})}/></label></>}
            <Button onClick={()=>update({operations:c.operations.filter((_,j)=>j!==i)})}>Retirer l’opération</Button>
          </div></details>)}</div>
          <div className="flex flex-col sm:flex-row gap-2"><select aria-label="Type d’opération NOLO" className={inputClass} value={operationKind} onChange={e=>setOperationKind(e.target.value as NoloOperation['kind'])}><option value="sugar">Resucrage / fruit</option><option value="aroma">Restitution aromatique</option><option value="blend">Assemblage</option><option value="dilution">Dilution</option><option value="removal">Désalcoolisation</option></select><Button onClick={addOperation}>Ajouter l’opération</Button></div>
        </>:<div className="space-y-2 text-xs text-cave-300"><p>{c.operations.length} opération(s) · {c.wort.sugarsComplete?'profil de sucres déclaré complet':'sucres partiels'}</p>
          {c.operations.map(o=><details key={o.id}><summary className="min-h-touch cursor-pointer">{o.name}</summary><dl>{Object.entries(o).filter(([k])=>!['id','kind','name'].includes(k)).map(([k,v])=><div key={k} className="flex gap-2 flex-wrap"><dt>{({volumeL:'Volume ajouté · L',volumeML:'Produit · mL',carrierAbvPct:'Support · % vol.',sugarsG:'Sucres ajoutés · g',sugarG:'Sucres · g',abvPct:'Alcool · % vol.',remainingSugarG:'Sucres encore fermentescibles · g',finalVolumeL:'Volume final · L',ethanolRemovedPct:'Retrait · %',source:'Source',composition:'Composition',moment:'Moment',complete:'Composition complète',unclassifiedSugarG:'Sucre de resucrage · g'})[k]??k}</dt><dd className="break-all">{v===null?'Inconnu':typeof v==='object'?('min'in v?decimal(v.min)+'–'+decimal(v.max):Object.entries(v).map(([s,r])=>sugarLabel[s]?sugarLabel[s]+': '+(r&&typeof r==='object'&&'min'in r&&'max'in r?decimal(Number(r.min))+'–'+decimal(Number(r.max)):'Inconnu'):s+': '+JSON.stringify(r)).join(' · ')):typeof v==='boolean'?(v?'Oui':'Non'):String(v)}</dd></div>)}</dl></details>)}
        </div>}
        <details><summary className="cursor-pointer min-h-touch text-sm text-cave-300">Analyses rattachées à leur étape</summary><div className="space-y-3">
          {c.measurements.map(m=><div key={m.id} className="text-xs text-cave-300 border-b border-cave-800 py-2"><p>{stageLabels[m.stage]} · {m.date} · {m.method}</p><p>{m.abvPct?decimal(m.abvPct.min)+'–'+decimal(m.abvPct.max)+' % vol.':'Alcool non mesuré'}{m.ph!=null?' · pH '+decimal(m.ph):''}</p>{editable&&<Button onClick={()=>update({measurements:c.measurements.filter(x=>x.id!==m.id)})}>Retirer cette mesure</Button>}</div>)}
          {editable&&<><label className="block text-xs">Étape mesurée<select className={inputClass} value={measure.stage} onChange={e=>setMeasure({...measure,stage:e.target.value as NoloStage})}>{Object.entries(stageLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
            <label className="block text-xs">Date de l’analyse<input type="date" className={inputClass} value={measure.date} onChange={e=>setMeasure({...measure,date:e.target.value})}/></label>
            <label className="block text-xs">Méthode / référence du laboratoire<input className={inputClass} value={measure.method??''} onChange={e=>setMeasure({...measure,method:e.target.value})}/></label>
            <RangeInput label="Alcool analysé" unit="% vol., marge incluse" max={100} value={measure.abvPct} onChange={r=>setMeasure({...measure,abvPct:r})}/>
            <details><summary className="min-h-touch cursor-pointer text-xs text-water">Sucres mesurés à cette étape</summary><div className="space-y-3">
              {NOLO_SUGARS.map(s=><RangeInput key={s} label={sugarLabel[s]+' résiduel'} unit="g/L" value={measure.sugarsGL?.[s]} onChange={r=>setMeasure({...measure,sugarsGL:{...measure.sugarsGL,[s]:r}})}/>)}
              <label className="flex gap-2 text-xs"><input type="checkbox" checked={measure.sugarsComplete??false} onChange={e=>setMeasure({...measure,sugarsGL:measure.sugarsGL??{},sugarsComplete:e.target.checked})}/>Analyse complète de ces cinq sucres ; les absents sont confirmés nuls</label>
            </div></details>
            <div className="grid grid-cols-2 gap-2"><Num label="pH mesuré" max={14} value={measure.ph} onChange={n=>setMeasure({...measure,ph:n})}/><Num label="Volume à cette étape" unit="L" value={measure.volumeL} onChange={n=>setMeasure({...measure,volumeL:n})}/><Num label="Densité SG mesurée" value={measure.sg} onChange={n=>setMeasure({...measure,sg:n})}/><Num label="CO₂ mesuré" unit="vol." value={measure.co2Vol} onChange={n=>setMeasure({...measure,co2Vol:n})}/></div>
            <label className="block text-xs">Dernière opération incluse dans l’analyse<select className={inputClass} value={measure.afterOperationId??''} onChange={e=>setMeasure({...measure,afterOperationId:e.target.value||undefined})}><option value="">Aucune opération additionnelle</option>{c.operations.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
            <Button disabled={!measure.method?.trim()||!measure.date} onClick={()=>update({measurements:[...c.measurements,{...measure,id:crypto.randomUUID(),stage:measure.stage!,date:measure.date!,method:measure.method!,basis:noloScenarioBasis(noloInput(recipe),measure.afterOperationId)}]})}>Conserver cette analyse dans la recette</Button>
            <p className="text-xs text-cave-400">L’analyse d’alcool n’est pas déduite de la différence OG–FG. Pour acidifier la bière, utiliser une mesure et une titration du moût ou de la bière.</p>
          </>}
        </div></details>
      </div></details>
      {!editable&&!!c.trials?.length&&<details><summary className="min-h-touch cursor-pointer text-water">Essais sur fractions · {c.trials.length}</summary><div className="space-y-3 text-xs text-cave-300">{c.trials.map(t=><div key={t.id}><p>{t.name} · {t.volumeL??'—'} L · {t.product||'Produit non renseigné'} · {t.dosageML??'—'} mL</p><p>{t.composition} · {t.moment}</p><p>Témoin : {t.comparator||'Non renseigné'}</p><p>{t.tasting||'Pas encore dégusté.'}</p></div>)}</div></details>}
      {editable&&<details><summary className="cursor-pointer min-h-touch text-water">Essais de restitution sur fractions</summary><div className="space-y-3"><p className="text-xs text-cave-400">Fractions du même brassin, sans modifier la recette entière. Garder un témoin et une hefeweisse alcoolisée comme comparaison. Aucun dosage prérempli.</p>
        {(c.trials??[]).map((t,i)=><details key={t.id}><summary className="min-h-touch cursor-pointer text-sm text-cave-300">{t.name}</summary><div className="space-y-2">
          {(['name','product','composition','moment','comparator','tasting'] as const).map(k=><label key={k} className="block text-xs">{({name:'Nom de la fraction',product:'Produit',composition:'Composition connue',moment:'Moment de l’ajout',comparator:'Témoin comparé',tasting:'Dégustation et écart au témoin'})[k]}<input className={inputClass} value={t[k]} onChange={e=>update({trials:c.trials!.map((v,j)=>j===i?{...v,[k]:e.target.value}:v)})}/></label>)}
          <Num label="Volume de la fraction" unit="L" value={t.volumeL} onChange={n=>update({trials:c.trials!.map((v,j)=>j===i?{...v,volumeL:n}:v)})}/>
          <Num label="Dose de produit dans la fraction" unit="mL" value={t.dosageML} onChange={n=>update({trials:c.trials!.map((v,j)=>j===i?{...v,dosageML:n}:v)})}/>
          <RangeInput label="Support de la fraction" unit="% vol." max={100} value={t.carrierAbvPct} onChange={r=>update({trials:c.trials!.map((v,j)=>j===i?{...v,carrierAbvPct:r}:v)})}/>
          <Button onClick={()=>update({trials:c.trials!.filter((_,j)=>j!==i)})}>Retirer la fraction</Button>
        </div></details>)}
        <Button onClick={()=>update({trials:[...(c.trials??[]),{id:crypto.randomUUID(),name:'Fraction '+((c.trials?.length??0)+1),volumeL:null,product:'',composition:'',dosageML:null,carrierAbvPct:null,moment:'',tasting:'',comparator:''}]})}>Ajouter une fraction d’essai</Button>
      </div></details>}
      {editable&&c.process==='secondRunnings'&&<details><summary className="cursor-pointer min-h-touch text-water">Tracer la seconde extraction</summary><div className="space-y-3">
        <p className="text-xs text-cave-400">Dans cette voie, les lignes de grain décrivent les drêches du brassin d’origine : aucun second débit de malt. Pour un moût neuf supplémentaire, préparer une recette distincte puis renseigner l’assemblage.</p>
        <label className="block text-xs">Brassin d’origine<input className={inputClass} value={c.secondRunnings?.sourceBatchId??''} onChange={e=>update({secondRunnings:{...emptyRunnings,...c.secondRunnings,sourceBatchId:e.target.value}})}/></label>
        {([['waterAddedL','Eau ajoutée','L'],['alkalinityPpm','Alcalinité de l’eau','ppm CaCO₃'],['temperatureC','Température','°C'],['minutes','Contact','min'],['recoveredL','Volume récupéré','L'],['sg','Densité récupérée','SG'],['ph','pH récupéré','']] as const).map(([k,l,u])=><Num key={k} label={l} unit={u} value={c.secondRunnings?.[k]} onChange={n=>update({secondRunnings:{...emptyRunnings,...c.secondRunnings,[k]:n}})}/>)}
        <label className="block text-xs">Extraction précédente<textarea className={inputClass} value={c.secondRunnings?.previousExtraction??''} onChange={e=>update({secondRunnings:{...emptyRunnings,...c.secondRunnings,previousExtraction:e.target.value}})}/></label>
      </div></details>}
      <details><summary className="cursor-pointer min-h-touch text-water">Vigilances et conservation{result?.alerts.length?' · '+result.alerts.length:''}</summary><div className="space-y-2 text-sm text-cave-300">
        {result?.alerts.map(a=><p key={a.code}>{a.message}</p>)}
        <p>Le froid, un pH bas ou une dose de pasteurisation ne valident pas seuls la conservation.</p>
        {editable&&(['method','validationReference','storage'] as const).map(k=><label key={k} className="block text-xs">{k==='method'?'Procédé de stabilisation':k==='validationReference'?'Référence de validation et analyses':'Conditionnement et stockage'}<input className={inputClass} value={c.stabilization[k]} onChange={e=>update({stabilization:{...c.stabilization,[k]:e.target.value}})}/></label>)}
        <p className="text-xs">{c.stabilization.validationReference?'Référence de validation déclarée, non vérifiée par l’application : '+c.stabilization.validationReference:'Conservation non validée.'}</p>
      </div></details>
      <details><summary className="cursor-pointer min-h-touch text-water">Comparer les procédés et consulter les sources</summary><div className="space-y-3 text-sm">
        <Button onClick={()=>setResearchOpen(true)}>Lire le dossier comparatif NOLO et fermentation</Button>
        {result&&<><p>Alcool déjà comptabilisé (analyses et apports) : {noloRangeLabel(result.presentAbv)}</p><p>Encore formable : {noloRangeLabel(result.remainingAbv)}</p><p className="text-xs text-cave-400">{result.aroma.reason} · {result.engineVersion} · références {result.scienceRef.version}</p></>}
        {result?.manufacturerEstimate&&<div className="border-l-2 border-ebc-straw pl-3"><p>LA-01 · repère fabricant : {decimal(result.manufacturerEstimate.range.min)}–{decimal(result.manufacturerEstimate.range.max)} % vol.</p><p className="text-xs text-cave-400">{result.manufacturerEstimate.applicable?'OG, paliers et températures compatibles ; autres conditions à confirmer. ':'Hors protocole identique. '}{result.manufacturerEstimate.limitation}</p><HopSourceLink source={result.manufacturerEstimate.source}/></div>}
        {science?.processes.map(p=><details key={p.id}><summary className="min-h-touch cursor-pointer text-cave-100">{p.name}</summary><dl className="space-y-2 text-xs text-cave-300">{[['Arômes',p.aroma],['Travail',p.work],['Eau / énergie',p.waterEnergy],['Équipement',p.equipment],['Analyses',p.analyses],['Preuve',p.evidence],['Limites',p.limitation]].map(([k,v])=><div key={k}><dt className="font-semibold">{k}</dt><dd>{v}</dd></div>)}</dl><HopSourceLink source={p.source}/></details>)}
        {editable&&c.scienceSnapshot&&<Button onClick={()=>update({scienceSnapshot:undefined})}>Utiliser les références actuelles dans ce scénario</Button>}
      </div></details>
      </div></details>
    </>}
  </section>;
}
