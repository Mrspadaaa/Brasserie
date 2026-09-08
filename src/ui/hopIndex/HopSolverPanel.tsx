import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Search, FlaskConical, Wheat, AlertTriangle } from 'lucide-react';
import type { HopRange } from '../../../functions/src/hopIndexSchema';
import { HOP_TIMINGS, type HopAxis, type HopTriplet } from '../../../functions/src/hopPredictionSchema';
import { HOP_CHEMISTRY_GOALS, type HopSolverIntent } from '../../../functions/src/hopSolverSchema';
import { applyHopSolverCandidate, compareHopSolverCandidates, createHopSolverSearch, initialHopSolverIntent, type HopSolverCandidate, type SolverCheck } from '../../domain/hopIndex/solver';
import type { TrialRecipe } from '../../domain/hopIndex/trials';
import { usableHopKnowledge } from '../../domain/hopIndex/engine';
import { useStorageValue } from '../../hooks/useLiveData';
import { StorageService } from '../../services/storage';
import { Units } from '../../services/units';
import { ensureGuideReferences, guideAxes, guidePredictionKnowledge, guideSolverPolicy, guideYeasts } from './guideData';
import { useHopCatalogue } from './useHopCatalogue';
import { HopAromaTargetPicker } from './HopAromaTargetPicker';
import { HopExplorationChart } from './HopExtrapolationPanel';
import { HopSourceLink } from './HopTechnicalPanel';
import { HOP_TIMING_LABELS, hopDoseLabel, hopDurationLabel, hopRangeLabel, hopTemperatureLabel } from './presentation';
import { HopField } from './HopFactsEditor';
import { Button } from '../../components/ui/Button';
import { NumberInput } from '../NumberInput';
import { inputClass } from '../FormNav';

const contactFactor=(t:HopTriplet)=>t.timing==='firstWort'||t.timing==='boil'||t.timing==='whirlpool'?60:1;
const chemistryNames = {thiols:'Thiols · passion, pamplemousse',terpenes:'Terpènes · linalol, géraniol',phenols:'Phénols de levure · girofle, épices'};
const hasConflict=(c:HopSolverCandidate)=>[...c.checks,...c.recipeChecks].some(k=>k.status==='conflict');
const uniqueChecks=(checks:SolverCheck[])=>[...new Map(checks.map(c=>[c.message,c])).values()];
function Checks({checks}:{checks:SolverCheck[]}) {
  return <div className="space-y-2">{uniqueChecks(checks).map((c,i)=><div key={i} className={`border-l-2 pl-3 text-sm ${c.status==='conflict'?'border-alert text-cave-50':c.status==='supported'?'border-hop text-cave-200':'border-ebc-straw text-cave-200'}`}><p>{c.message}</p>{c.source && <details className="text-xs text-cave-400"><summary className="cursor-pointer py-1">Source</summary><HopSourceLink source={c.source}/></details>}</div>)}</div>;
}
function targetsOfStyle(style:ReturnType<typeof guideSolverPolicy>['styles'][number],axes:HopAxis[]):Record<string,HopRange> {
  return Object.fromEntries(Object.entries(style.targets).flatMap(([id,level])=>{const a=axes.find(a=>a.id===id);return a?[[id,level==='low'?{min:a.scale.min,max:a.lowMax}:level==='medium'?{min:a.lowMax,max:a.mediumMax}:{min:a.mediumMax,max:a.scale.max}]]:[]}));
}

export function HopSolverPanel({recipe,onChange,onBusyChange,target,onTargetChange}:{
  recipe?:TrialRecipe;onChange?:(r:TrialRecipe)=>void;onBusyChange?:(b:boolean)=>void;target:Record<string,HopRange>;onTargetChange:(target:Record<string,HopRange>)=>void;
}) {
  const saved=useStorageValue(StorageService.getHopKnowledge),lots=useStorageValue(StorageService.getHopLots);
  const {varieties,loading}=useHopCatalogue();
  const knowledge=useMemo(()=>guidePredictionKnowledge(saved),[saved]),policy=useMemo(()=>guideSolverPolicy(saved),[saved]);
  const axes=useMemo(()=>guideAxes(saved),[saved]),yeasts=useMemo(()=>guideYeasts(saved),[saved]);
  const data=useMemo(()=>({varieties,lots,knowledge}),[varieties,lots,knowledge]);
  const [intent,setIntent]=useState<HopSolverIntent>(()=>policy?initialHopSolverIntent(recipe,policy):{styleId:'free',avoid:[],chemistry:{},keepYeast:true,timings:['postFermentation']});
  const [replacing,setReplacing]=useState<number>();
  const [fixed,setFixed]=useState<{doseGL?:number;temperatureC?:number;contactHours?:number}>({});
  const [results,setResults]=useState<HopSolverCandidate[]>(),[selected,setSelected]=useState<HopSolverCandidate>();
  const [busy,setBusy]=useState(false),[progress,setProgress]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [showRejected,setShowRejected]=useState(false),[chartAddition,setChartAddition]=useState(0);
  const [targetEdited,setTargetEdited]=useState(false);
  const evaluator=useRef<ReturnType<typeof createHopSolverSearch> | undefined>(undefined);
  const signature=JSON.stringify([intent,target,recipe,replacing,fixed]);
  const latest=useRef({signature,data,recipe});latest.current={signature,data,recipe};
  const mounted=useRef(true),pending=useRef(false),busyCallback=useRef(onBusyChange);busyCallback.current=onBusyChange;
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;busyCallback.current?.(false)}},[]);
  useEffect(()=>{setResults(undefined);setSelected(undefined);setError('');},[signature,data]);
  const style=policy?.styles.find(s=>s.id===intent.styleId);
  const effectiveTarget=targetEdited||Object.keys(target).length||!style?target:targetsOfStyle(style,axes);
  const updateIntent=(patch:Partial<HopSolverIntent>)=>{setIntent(p=>({...p,...patch}));setNotice('')};
  const run=async(fn:()=>Promise<void>)=>{
    if(pending.current)return;pending.current=true;setBusy(true);onBusyChange?.(true);setError('');setNotice('');
    try{await fn()}catch(e){if(mounted.current)setError(e instanceof Error?e.message:'Recherche indisponible.')}
    finally{pending.current=false;if(mounted.current){setBusy(false);busyCallback.current?.(false)}}
  };
  const search=()=>run(async()=>{
    if(!policy)return;
    const engine=createHopSolverSearch({data,policy,intent,target:effectiveTarget,recipe,replacing,...fixed});evaluator.current=engine;
    if(engine.emptyReason)throw Error(engine.emptyReason);
    if(!engine.total)throw Error('Choisis au moins un moment d’ajout.');
    const rows:HopSolverCandidate[]=[];
    for(let i=0;i<engine.total;i+=32){
      if(!mounted.current)return;
      if(latest.current.signature!==signature||latest.current.data!==data)return;
      rows.push(...engine.evaluateBatch(i,32));setProgress(`${Math.min(i+32,engine.total).toLocaleString('fr')} / ${engine.total.toLocaleString('fr')} scénarios examinés`);
      await new Promise<void>(resolve=>setTimeout(resolve,0));
    }
    if(!mounted.current||latest.current.signature!==signature||latest.current.data!==data)return;
    const sorted=rows.sort(compareHopSolverCandidates);
    // Keep distinct combinations, not five doses of the same ingredient.
    const seen=new Set<string>(),shortlist:HopSolverCandidate[]=[];
    for(const c of sorted){const key=c.trial?.id??JSON.stringify(c.triplets.map(t=>[varieties.find(v=>v.id===t.varietyId)?.name,t.yeastId,t.timing]));if(!seen.has(key)){seen.add(key);shortlist.push(c)}}
    setResults(shortlist);setSelected(shortlist.find(c=>!hasConflict(c))??shortlist[0]);setChartAddition(0);
  });
  const preview=(c:HopSolverCandidate)=>{setSelected(c);setChartAddition(0);setNotice('')};
  const editCondition=(index:number,field:'doseGL'|'temperatureC'|'contactHours',value:number|null)=>{
    if(!selected||!evaluator.current)return;
    const triplets=selected.triplets.map((t,i)=>i===index?{...t,[field]:value}:t);
    setSelected(evaluator.current.evaluateProgram({triplets,trial:selected.trial,conditions:selected.conditions.map((c,i)=>i===index?c.filter(c=>c.field!==field):c)}));setNotice('');
  };
  const apply=()=>run(async()=>{
    if(!selected||!recipe||!onChange||hasConflict(selected))return;
    const before=JSON.stringify(recipe);
    const next=applyHopSolverCandidate(recipe,selected,data,intent,replacing);
    await ensureGuideReferences({varieties:varieties.filter(v=>selected.triplets.some(t=>t.varietyId===v.id)),knowledge:usableHopKnowledge(knowledge).valid});
    if(!mounted.current)return;
    if(JSON.stringify(latest.current.recipe)!==before)throw Error('La recette a changé. Relance la recherche avant de l’appliquer.');
    onChange({...next,hopAromaTarget:effectiveTarget});setNotice('Programme appliqué. Contrôle les alpha des lots, la quantité de levure et les paliers de fermentation.');
  });
  if(!policy)return <p className="text-sm text-ebc-straw">Le guide de formulation est désactivé ou invalide. Les simulations libres restent disponibles dans Mon adaptation.</p>;
  const compatible=results?.filter(c=>!hasConflict(c))??[],rejected=results?.filter(hasConflict)??[];
  const documented=(showRejected?results??[]:compatible).filter(c=>c.trial).slice(0,4);
  const explorations=(showRejected?results??[]:compatible).filter(c=>!c.trial).slice(0,6);
  const candidateCard=(c:HopSolverCandidate)=><button type="button" key={c.id} disabled={busy} aria-pressed={selected?.id===c.id} className={`w-full text-left p-3 rounded-control border space-y-2 ${selected?.id===c.id?'border-ebc-straw bg-ebc-straw/5':'border-cave-700 bg-cave-850'}`} onClick={()=>preview(c)}>
    <span className="block font-semibold text-cave-50">{c.triplets.map(t=>varieties.find(v=>v.id===t.varietyId)?.name??t.varietyId).join(' + ')}</span>
    <span className="block text-sm text-cave-200">{yeasts.find(y=>y.id===c.triplets[0].yeastId)?.name}</span>
    <span className="block text-xs text-cave-400">{[...new Set(c.triplets.map(t=>HOP_TIMING_LABELS[t.timing!]))].join(' / ')} · {c.triplets.map(t=>hopDoseLabel(t.doseGL)).join(' + ')}</span>
    <span className={`block text-xs ${hasConflict(c)?'text-alert':'text-water'}`}>{hasConflict(c)?'Conflit avec tes contraintes':c.trial?'Essai publié · adaptation à vérifier':'Extrapolation · confiance faible'}</span>
    {!c.trial&&c.score.range&&<span className="block text-xs text-cave-400">Adéquation {hopRangeLabel(c.score.range)} / 100</span>}
  </button>;
  const shownPrediction=selected?.predictions[chartAddition];
  return <section aria-label="Solver de houblonnage" className="space-y-5">
    <div className="space-y-2"><h3 className="font-serif text-2xl text-cave-50">Du goût au programme de houblonnage</h3><p className="text-sm text-cave-200">Indique ce que tu cherches et ce que tu veux éviter. Compare les essais connus, puis les variantes possibles pour ta recette.</p></div>
    {recipe&&<div className="flex gap-3 rounded-control bg-cave-850 p-3 text-sm"><Wheat className="shrink-0 text-ebc-straw" size={20}/><div><p className="text-cave-50">Dans ta recette : {recipe.volumeL} L · {recipe.style||'style libre'}</p><p className="text-cave-200">{recipe.yeast?.name||'Levure à choisir'} · {recipe.hops.length?recipe.hops.map(h=>`${h.name} ${Units.format(h.weightG, 'g')}`).join(' + '):'Aucun houblon ajouté'}</p></div></div>}
    <fieldset disabled={busy} className="space-y-4 min-w-0">
      <div className="grid sm:grid-cols-2 gap-3"><HopField label="Point de départ par style"><select className={inputClass} value={intent.styleId} onChange={e=>{const s=policy.styles.find(s=>s.id===e.target.value)!;updateIntent({styleId:s.id,avoid:s.avoid,chemistry:s.chemistry,timings:s.timings});onTargetChange(targetsOfStyle(s,axes))}}>{policy.styles.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></HopField>
      {recipe&&<HopField label="Place dans la recette"><select className={inputClass} value={replacing??'append'} onChange={e=>setReplacing(e.target.value==='append'?undefined:Number(e.target.value))}><option value="append">Compléter en conservant mes ajouts</option>{recipe.hops.map((h,i)=><option value={i} key={i}>Remplacer l’ajout {i+1} · {h.name}</option>)}</select></HopField>}</div>
      <HopAromaTargetPicker axes={axes} target={effectiveTarget} onChange={next=>{setTargetEdited(true);onTargetChange(next)}} disabled={busy}/>
      <div className="space-y-2"><p className="font-semibold text-cave-50">À éviter</p><p className="text-xs text-cave-400">Ces familles doivent rester discrètes. Une présence connue écarte la piste ; une présence inconnue reste signalée.</p><div className="flex flex-wrap gap-2">{axes.map(a=><button type="button" key={a.id} aria-pressed={intent.avoid.includes(a.id)} className={`min-h-touch border rounded-control px-3 py-2 text-sm ${intent.avoid.includes(a.id)?'border-alert text-cave-50 bg-alert/10':'border-cave-700 text-cave-200'}`} onClick={()=>updateIntent({avoid:intent.avoid.includes(a.id)?intent.avoid.filter(id=>id!==a.id):[...intent.avoid,a.id]})}>Éviter {a.name.toLocaleLowerCase('fr')}</button>)}</div></div>
      <div className="space-y-2 border-t border-cave-700 pt-3"><p className="font-semibold text-cave-50 flex items-center gap-2"><FlaskConical size={18} className="text-water"/>Orientations chimiques</p><div className="grid md:grid-cols-3 gap-3">{HOP_CHEMISTRY_GOALS.map(g=><HopField label={chemistryNames[g]} key={g}><select className={inputClass} value={intent.chemistry[g]??''} onChange={e=>{const chemistry={...intent.chemistry};if(e.target.value)chemistry[g]=e.target.value as 'seek'|'avoid';else delete chemistry[g];updateIntent({chemistry})}}><option value="">Libre</option><option value="seek">Favoriser cette voie</option><option value="avoid">Éviter cette voie</option></select></HopField>)}</div><p className="text-xs text-cave-400">Il s’agit de voies documentées et de potentiel. Une quantité finale de thiols ou de terpènes n’est pas déduite du profil de goût.</p></div>
      {recipe?.yeast.name&&<label className="flex gap-2 min-h-touch items-center text-sm text-cave-200"><input type="checkbox" aria-label={`Conserver ${recipe.yeast.name}`} checked={intent.keepYeast} onChange={e=>updateIntent({keepYeast:e.target.checked})}/>Conserver {recipe.yeast.name}</label>}
      <details><summary className="cursor-pointer min-h-touch text-sm text-cave-200">Moments d’ajout et contraintes de procédé</summary><div className="space-y-3"><div className="flex flex-wrap gap-2">{HOP_TIMINGS.map(t=><label key={t} className="flex items-center min-h-touch gap-2 text-sm text-cave-200"><input type="checkbox" aria-label={HOP_TIMING_LABELS[t]} checked={intent.timings.includes(t)} onChange={e=>updateIntent({timings:e.target.checked?[...intent.timings,t]:intent.timings.filter(p=>p!==t)})}/>{HOP_TIMING_LABELS[t]}</label>)}</div><div className="grid sm:grid-cols-3 gap-3">{([{key:'doseGL',label:'Dose imposée (g/L)'},{key:'temperatureC',label:'Contact imposé (°C)'},{key:'contactHours',label:'Durée imposée (h)'}]as const).map(f=><HopField key={f.key} label={f.label}><NumberInput className={inputClass} value={fixed[f.key]} emptyValue={undefined} placeholder="Automatique" onValue={n=>setFixed(p=>({...p,[f.key]:n}))}/></HopField>)}</div><p className="text-xs text-cave-400">Automatique : conditions de l’essai lorsqu’elles sont publiées, puis valeurs de départ proposées et sourcées. Les champs du programme choisi seront préremplis.</p></div></details>
    </fieldset>
    <div className="flex flex-wrap items-center gap-3"><Button intent="primary" disabled={busy||loading||!intent.timings.length} onClick={()=>void search()}><Search size={17}/>Trouver mes combinaisons</Button>{busy&&<p role="status" className="text-sm text-cave-200">{progress||'Préparation…'}</p>}</div>
    {results&&<div className="grid lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] gap-5 items-start">
      <div className="space-y-4"><p className="text-sm text-cave-400">{compatible.length} pistes sans conflit établi · {rejected.length} écartées. Les incertitudes restent visibles. Domaine de recherche fini, sans optimum universel annoncé.</p>
        {documented.length>0&&<div className="space-y-2"><h4 className="font-semibold text-water">Partir d’un essai publié</h4>{documented.map(candidateCard)}</div>}
        <div className="space-y-2"><h4 className="font-semibold text-cave-50">Explorer d’autres combinaisons</h4>{explorations.map(candidateCard)}</div>
        {!compatible.length&&<p className="text-sm text-ebc-straw">Aucune piste ne respecte les exclusions connues. Examine les conflits, ajuste une exclusion ou remplace l’ajout concerné.</p>}
        {!!rejected.length&&<Button onClick={()=>setShowRejected(v=>!v)}>{showRejected?'Masquer les pistes en conflit':'Comprendre les pistes écartées'}</Button>}
      </div>
      {selected&&<article aria-label="Programme proposé par le solver" className="min-w-0 space-y-4 lg:border-l lg:border-cave-700 lg:pl-5">
        <div><h4 className="font-serif text-xl text-cave-50">Ton programme proposé</h4><p className="text-hop">{yeasts.find(y=>y.id===selected.triplets[0].yeastId)?.name}</p><p className="text-xs text-cave-400">Confiance faible. Prévisualisation : ta recette n’a pas encore changé.</p></div>
        <div className="space-y-4">{selected.triplets.map((t,i)=><div key={i} className="border-l-2 border-water pl-3 space-y-2"><p className="font-semibold text-cave-50">{varieties.find(v=>v.id===t.varietyId)?.name} · {HOP_TIMING_LABELS[t.timing!]}</p><p className="text-sm text-cave-200">{recipe&&t.doseGL!==null?`${Units.format(t.doseGL*recipe.volumeL, 'g')} pour ${recipe.volumeL} L` : hopDoseLabel(t.doseGL)}</p><div className="grid grid-cols-3 gap-2">{([{key:'doseGL',label:'Dose (g/L)'},{key:'temperatureC',label:'Contact (°C)'},{key:'contactHours',label:contactFactor(t)===60?'Durée (min)':'Durée (h)'}]as const).map(f=><HopField label={`${f.label} · ajout ${i+1}`} key={f.key}><NumberInput className={inputClass} value={t[f.key]===null?undefined:t[f.key]*(f.key==='contactHours'?contactFactor(t):1)} emptyValue={undefined} disabled={busy} onValue={n=>editCondition(i,f.key,n===undefined?null:n/(f.key==='contactHours'?contactFactor(t):1))}/></HopField>)}</div>
          <details className="text-xs text-cave-400"><summary className="cursor-pointer min-h-touch">Origine des conditions préremplies</summary>{selected.conditions[i].length?selected.conditions[i].map((c,j)=><div className="space-y-1 mb-2" key={j}><p>{c.field==='doseGL'?hopDoseLabel(c.value):c.field==='temperatureC'?hopTemperatureLabel(c.value):hopDurationLabel(c.value)} : {c.origin==='trial'?`choix dans la plage publiée ${hopRangeLabel(c.range)}`:c.origin==='recipe'?'valeur planifiée dans la recette':'point de départ proposé, pas optimum mesuré'}.</p><HopSourceLink source={c.source}/></div>):<p>Conditions choisies pour cette simulation.</p>}</details></div>)}</div>
        {selected.trial&&<div className="border-l-2 border-hop pl-3 space-y-2 text-sm"><p className="font-semibold text-cave-50">Ce que l’essai a montré</p><p className="text-cave-200">{selected.trial.result}</p>{selected.trial.sensory.map((s,i)=><p key={i} className="text-hop">{s.name} : {hopRangeLabel(s.range)} sur {s.scale.max}, dans cet essai.</p>)}<p className="text-xs text-cave-400">{selected.trial.matrix} Le résultat publié porte sur le programme complet ; les variantes et les autres ajouts de ta recette ne sont pas assimilés à cet essai.</p><HopSourceLink source={selected.trial.source}/></div>}
        <Checks checks={[...selected.checks,...selected.recipeChecks]}/>
        {shownPrediction&&<details open={!selected.trial}><summary className="cursor-pointer min-h-touch text-sm text-cave-200">Graphe de la simulation</summary><div className="space-y-3 pt-2">{selected.triplets.length>1&&<HopField label="Ajout représenté"><select className={inputClass} value={chartAddition} onChange={e=>setChartAddition(Number(e.target.value))}>{selected.triplets.map((t,i)=><option key={i} value={i}>Ajout {i+1} · {varieties.find(v=>v.id===t.varietyId)?.name}</option>)}</select></HopField>}<HopExplorationChart prediction={shownPrediction} axes={axes} target={effectiveTarget} highlighted={selected.evidenceFamilies}/><p className="text-xs text-cave-400">Chaque graphe inclut la levure et un ajout. Les graphes ne s’additionnent pas.</p></div></details>}
        {recipe&&onChange&&<div className="border-t border-cave-700 pt-4 space-y-2"><p className="text-sm text-cave-200">{replacing===undefined?'Les ajouts actuels sont conservés.':`L’ajout ${replacing+1} sera remplacé ; les autres seront conservés.`} La souche est celle de toute la recette.</p><Button intent="primary" full disabled={busy||hasConflict(selected)||selected.triplets.some(t=>t.doseGL===null)} onClick={()=>void apply()}>{replacing===undefined?'Ajouter ce programme à ma recette':'Appliquer ce remplacement'}</Button>{hasConflict(selected)&&<p className="text-sm text-alert flex gap-2"><AlertTriangle size={17} className="shrink-0"/>Résous les exclusions en conflit avant d’appliquer ce programme.</p>}</div>}
      </article>}
    </div>}
    {error&&<p role="alert" className="text-sm text-alert">{error}</p>}{notice&&<p role="status" className="text-sm text-hop">{notice}</p>}
    <details><summary className="cursor-pointer min-h-touch text-sm text-cave-400">Réviser les points de départ du solver</summary><p className="text-sm text-cave-400">Les styles, conditions proposées et références chimiques se modifient dans les connaissances, sans redéploiement.</p><Button disabled={busy} onClick={()=>void run(async()=>{await ensureGuideReferences({knowledge:[policy]});setNotice('Guide du solver enregistré dans les connaissances.')})}>Enregistrer le guide modifiable</Button></details>
  </section>;
}
