import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Search, FlaskConical, Wheat, AlertTriangle } from 'lucide-react';
import type { HopRange } from '../../../functions/src/hopIndexSchema';
import { HOP_TIMINGS, type HopAxis, type HopTriplet } from '../../../functions/src/hopPredictionSchema';
import { HOP_CHEMISTRY_GOALS, type HopSolverIntent } from '../../../functions/src/hopSolverSchema';
import { applyHopSolverCandidate, createHopSolverSearch, initialHopSolverIntent, type HopSolverCandidate, type HopSolverSearchOptions, type SolverCheck } from '../../domain/hopIndex/solver';
import type { HopSearchMode } from '../../domain/hopIndex/solverSelection';
import { hopStyleGuidance } from '../../domain/hopIndex/styleSelection';
import type { HopSearchUpdate } from '../../domain/hopIndex/solverSearch';
import { startHopSolverSearch } from './hopSolverTransport';
import type { TrialRecipe } from '../../domain/hopIndex/trials';
import { usableHopKnowledge } from '../../domain/hopIndex/engine';
import { useStorageValue } from '../../hooks/useLiveData';
import { StorageService } from '../../services/storage';
import { Units } from '../../services/units';
import { ensureGuideReferences, guideAxes, guidePredictionKnowledge, guideSolverPolicy, guideYeasts } from './guideData';
import { useHopCatalogue } from './useHopCatalogue';
import { HopAromaTargetPicker } from './HopAromaTargetPicker';
import { HopSolverVarietyPicker } from './HopSolverVarietyPicker';
import { HopExplorationChart } from './HopAromaChart';
import { HopTrialResult, HopTrialComparison } from './HopTrialEvidence';
import type { HopExtrapolation } from '../../../functions/src/hopExtrapolationSchema';
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
  const models=useMemo(()=>knowledge.filter((k):k is HopExtrapolation=>k.kind==='extrapolation'&&k.enabled),[knowledge]);
  // Unrelated Firestore notifications return fresh arrays; only changed content
  // invalidates a running search and its immutable prediction context.
  const dataRevision=useMemo(()=>JSON.stringify([varieties,lots,knowledge]),[varieties,lots,knowledge]);
  const data=useMemo(()=>({varieties,lots,knowledge}),[dataRevision]);
  const [intent,setIntent]=useState<HopSolverIntent>(()=>policy?initialHopSolverIntent(recipe,policy):{styleId:'free',avoid:[],chemistry:{},keepYeast:true,timings:['postFermentation']});
  const [replacing,setReplacing]=useState<number>();
  const [fixed,setFixed]=useState<{doseGL?:number;temperatureC?:number;contactHours?:number}>({});
  const [varietyIds,setVarietyIds]=useState<string[]>([]);
  const [results,setResults]=useState<HopSolverCandidate[]>(),[selected,setSelected]=useState<HopSolverCandidate>();
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [mode,setMode]=useState<HopSearchMode>('quick'),[searching,setSearching]=useState(false),[stopped,setStopped]=useState(false);
  const [searchUpdate,setSearchUpdate]=useState<HopSearchUpdate>();
  const searchJob=useRef<ReturnType<typeof startHopSolverSearch>|undefined>(undefined),searchInput=useRef<HopSolverSearchOptions|undefined>(undefined),selectionPinned=useRef(false);
  const [showRejected,setShowRejected]=useState(false),[chartAddition,setChartAddition]=useState(0);
  const [targetEdited,setTargetEdited]=useState(false);
  const evaluator=useRef<ReturnType<typeof createHopSolverSearch> | undefined>(undefined);
  const signature=JSON.stringify([intent,target,recipe,replacing,fixed,mode,targetEdited,varietyIds]);
  const searchContext=useRef<{signature:string;dataRevision:string}|undefined>(undefined);
  const latest=useRef({signature,dataRevision,recipe});latest.current={signature,dataRevision,recipe};
  const mounted=useRef(true),pending=useRef(false),busyCallback=useRef(onBusyChange);busyCallback.current=onBusyChange;
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;searchJob.current?.cancel();busyCallback.current?.(false)}},[]);
  useEffect(()=>{
    // A click can start a search before this render's passive effect runs.
    // Only invalidate a job/result created from an older context.
    const context=searchContext.current;
    if(!context||(context.signature===signature&&context.dataRevision===dataRevision))return;
    searchJob.current?.cancel();searchJob.current=undefined;searchContext.current=undefined;searchInput.current=undefined;evaluator.current=undefined;
    setSearching(false);setStopped(false);setSearchUpdate(undefined);setResults(undefined);setSelected(undefined);setError('');
  },[signature,dataRevision]);
  const style=policy?.styles.find(s=>s.id===intent.styleId);
  const effectiveTarget=targetEdited||Object.keys(target).length||!style?target:targetsOfStyle(style,axes);
  const updateIntent=(patch:Partial<HopSolverIntent>)=>{setIntent(p=>({...p,...patch}));setNotice('')};
  const run=async(fn:()=>Promise<void>)=>{
    if(pending.current)return;pending.current=true;setBusy(true);onBusyChange?.(true);setError('');setNotice('');
    try{await fn()}catch(e){if(mounted.current)setError(e instanceof Error?e.message:'Recherche indisponible.')}
    finally{pending.current=false;if(mounted.current){setBusy(false);busyCallback.current?.(false)}}
  };
  const stopSearch=()=>{searchJob.current?.cancel();searchJob.current=undefined;setSearching(false);setStopped(true);};
  const search=()=>{
    if(!policy||busy||loading)return;
    searchJob.current?.cancel();evaluator.current=undefined;selectionPinned.current=false;
    const input:HopSolverSearchOptions={data,policy,intent,target:effectiveTarget,recipe,replacing,mode,varietyIds,...fixed};searchInput.current=input;
    searchContext.current={signature,dataRevision};
    setResults(undefined);setSelected(undefined);setChartAddition(0);setSearchUpdate(undefined);setStopped(false);setSearching(true);setError('');setNotice('');
    const current=()=>mounted.current&&latest.current.signature===signature&&latest.current.dataRevision===dataRevision;
    searchJob.current=startHopSolverSearch(input,update=>{
      if(!current())return;
      setSearchUpdate(update);
      if(update.results.length){setResults(update.results);if(!selectionPinned.current)setSelected(update.results.find(c=>!hasConflict(c))??update.results[0]);}
      if(update.done){setSearching(false);searchJob.current=undefined;}
    },cause=>{if(current()){setError(cause.message);setSearching(false);searchJob.current=undefined;}});
  };
  const preview=(c:HopSolverCandidate)=>{selectionPinned.current=true;setSelected(c);setChartAddition(0);setNotice('')};
  const editCondition=(index:number,field:'doseGL'|'temperatureC'|'contactHours',value:number|null)=>{
    if(!selected||!searchInput.current)return;
    if(searching)stopSearch();selectionPinned.current=true;
    evaluator.current??=createHopSolverSearch(searchInput.current);
    const triplets=selected.triplets.map((t,i)=>i===index?{...t,[field]:value}:t);
    setSelected(evaluator.current.evaluateProgram({triplets,trial:selected.trial,conditions:selected.conditions.map((c,i)=>i===index?c.filter(c=>c.field!==field):c)}));setNotice('');
  };
  const apply=()=>{if(searching)stopSearch();return run(async()=>{
    if(!selected||!recipe||!onChange||hasConflict(selected))return;
    const before=JSON.stringify(recipe);
    const next=applyHopSolverCandidate(recipe,selected,data,intent,replacing);
    const selectedYeasts=new Set(selected.triplets.map(t=>t.yeastId));
    await ensureGuideReferences({varieties:varieties.filter(v=>selected.triplets.some(t=>t.varietyId===v.id)),knowledge:usableHopKnowledge(knowledge).valid.filter(k=>k.kind!=='yeast'||selectedYeasts.has(k.id))});
    if(!mounted.current)return;
    if(JSON.stringify(latest.current.recipe)!==before)throw Error('La recette a changé. Relance la recherche avant de l’appliquer.');
    onChange({...next,hopAromaTarget:effectiveTarget});setNotice('Programme appliqué. Contrôle les alpha des lots, la quantité de levure et les paliers de fermentation.');
  });};
  if(!policy)return <p className="text-sm text-ebc-straw">Le guide de formulation est désactivé ou invalide. Les simulations libres restent disponibles dans Simuler mes ajouts.</p>;
  const compatible=results?.filter(c=>!hasConflict(c))??[],rejected=results?.filter(hasConflict)??[];
  const documented=(showRejected?results??[]:compatible).filter(c=>c.trial).slice(0,4);
  const explorations=(showRejected?results??[]:compatible).filter(c=>!c.trial).slice(0,6);
  const candidateCard=(c:HopSolverCandidate)=><button type="button" key={c.id} disabled={busy} aria-pressed={selected?.id===c.id} className={`w-full text-left p-3 rounded-control border space-y-2 ${selected?.id===c.id?'border-ebc-straw bg-ebc-straw/5':'border-cave-700 bg-cave-850'}`} onClick={()=>preview(c)}>
    <span className="flex flex-wrap items-baseline gap-x-2"><span className="font-semibold text-cave-50">{c.triplets.map(t=>varieties.find(v=>v.id===t.varietyId)?.name??t.varietyId).join(' + ')}</span>
      {c.styleSuggested&&<span className="text-xs text-hop">Usage documenté</span>}</span>
    <span className="block text-sm text-cave-200">{yeasts.find(y=>y.id===c.triplets[0].yeastId)?.name}</span>
    <span className="block text-xs text-cave-400">{[...new Set(c.triplets.map(t=>HOP_TIMING_LABELS[t.timing!]))].join(' / ')} · {c.triplets.map(t=>hopDoseLabel(t.doseGL)).join(' + ')}</span>
    <span className={`block text-xs ${hasConflict(c)?'text-alert':'text-water'}`}>{hasConflict(c)?'Conflit avec tes contraintes':c.trial?'Essai publié · adaptation à vérifier':'Extrapolation · confiance faible'}</span>
    {!c.trial&&c.score.range&&<span className="block text-xs text-cave-400">{recipe?.hops.length ? 'Adéquation de cet ajout seul' : 'Adéquation'} {hopRangeLabel(c.score.range)} / 100</span>}
  </button>;
  const shownPrediction=selected?.predictions[chartAddition];
  return <section aria-label="Solver de houblonnage" className="space-y-5">
    <div className="space-y-2"><h3 className="font-sans text-lg font-semibold text-cave-50">Du goût au programme de houblonnage</h3></div>
    {recipe&&<div className="flex gap-3 rounded-control bg-cave-850 p-3 text-sm"><Wheat className="shrink-0 text-ebc-straw" size={20}/><div><p className="text-cave-50">Dans ta recette : {recipe.volumeL} L · {recipe.style||'style libre'}</p><p className="text-cave-200">{recipe.yeast?.name||'Levure à choisir'} · {recipe.hops.length?recipe.hops.map(h=>`${h.name} ${Units.format(h.weightG, 'g')}`).join(' + '):'Aucun houblon ajouté'}</p></div></div>}
    <fieldset disabled={busy} className="space-y-4 min-w-0">
      <div className="grid sm:grid-cols-2 gap-3"><HopField label="Point de départ par style"><select className={inputClass} value={intent.styleId} onChange={e=>{const s=policy.styles.find(s=>s.id===e.target.value)!;updateIntent({styleId:s.id,avoid:s.avoid,chemistry:s.chemistry,timings:s.timings});setVarietyIds([]);onTargetChange(targetsOfStyle(s,axes))}}>{!policy.styles.some(s=>s.id===intent.styleId)&&<option value={intent.styleId}>Réglages personnels conservés</option>}{policy.styles.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></HopField>
      {recipe&&<HopField label="Place dans la recette"><select className={inputClass} value={replacing??'append'} onChange={e=>setReplacing(e.target.value==='append'?undefined:Number(e.target.value))}><option value="append">Compléter en conservant mes ajouts</option>{recipe.hops.map((h,i)=><option value={i} key={i}>Remplacer l’ajout {i+1} · {h.name}</option>)}</select></HopField>}</div>
      <HopSolverVarietyPicker varieties={varieties} styleName={style?.id==='free'?'':style?.name??''} selected={varietyIds}
        onChange={ids=>{setVarietyIds(ids);setNotice('')}} disabled={busy||loading}/>
      <HopAromaTargetPicker axes={axes} target={effectiveTarget} avoid={intent.avoid} onAvoidChange={avoid=>updateIntent({avoid})} onChange={next=>{setTargetEdited(true);onTargetChange(next)}} disabled={busy}/>

      <div className="space-y-2 border-t border-cave-700 pt-3"><p className="font-semibold text-cave-50 flex items-center gap-2"><FlaskConical size={18} className="text-water"/>Orientations chimiques</p><div className="grid md:grid-cols-3 gap-3">{HOP_CHEMISTRY_GOALS.map(g=><HopField label={chemistryNames[g]} key={g}><select className={inputClass} value={intent.chemistry[g]??''} onChange={e=>{const chemistry={...intent.chemistry};if(e.target.value)chemistry[g]=e.target.value as 'seek'|'avoid';else delete chemistry[g];updateIntent({chemistry})}}><option value="">Libre</option><option value="seek">Favoriser cette voie</option><option value="avoid">Éviter cette voie</option></select></HopField>)}</div><p className="text-xs text-cave-400">Il s’agit de voies documentées et de potentiel. Une quantité finale de thiols ou de terpènes n’est pas déduite du profil de goût.</p></div>
      {recipe?.yeast.name&&<label className="flex gap-2 min-h-touch items-center text-sm text-cave-200"><input type="checkbox" aria-label={`Conserver ${recipe.yeast.name}`} checked={intent.keepYeast} onChange={e=>updateIntent({keepYeast:e.target.checked})}/>Conserver {recipe.yeast.name}</label>}
      <details><summary className="cursor-pointer min-h-touch text-sm text-cave-200">Moments d’ajout et contraintes de procédé</summary><div className="space-y-3"><div className="flex flex-wrap gap-2">{HOP_TIMINGS.map(t=><label key={t} className="flex items-center min-h-touch gap-2 text-sm text-cave-200"><input type="checkbox" aria-label={HOP_TIMING_LABELS[t]} checked={intent.timings.includes(t)} onChange={e=>updateIntent({timings:e.target.checked?[...intent.timings,t]:intent.timings.filter(p=>p!==t)})}/>{HOP_TIMING_LABELS[t]}</label>)}</div><div className="grid sm:grid-cols-3 gap-3">{([{key:'doseGL',label:'Dose imposée (g/L)'},{key:'temperatureC',label:'Contact imposé (°C)'},{key:'contactHours',label:'Durée imposée (h)'}]as const).map(f=><HopField key={f.key} label={f.label}><NumberInput className={inputClass} value={fixed[f.key]} emptyValue={undefined} placeholder="Automatique" onValue={n=>setFixed(p=>({...p,[f.key]:n}))}/></HopField>)}</div><p className="text-xs text-cave-400">Automatique : conditions de l’essai lorsqu’elles sont publiées, puis valeurs de départ proposées et sourcées. Les champs du programme choisi seront préremplis.</p></div></details>
    </fieldset>
    <div className="space-y-3 border-t border-cave-700 pt-4">
      <HopField label="Étendue de la recherche"><select className={inputClass} disabled={busy} value={mode} onChange={e=>setMode(e.target.value as HopSearchMode)}><option value="quick">Ciblée · rapide</option><option value="exhaustive">Exhaustive · tous les scénarios du domaine</option></select></HopField>
      <p className="text-sm text-cave-400">{mode==='quick'?'Rapide. Une piste hors sélection peut être meilleure.':'Exhaustif. Plusieurs minutes.'}</p>
      <p className="text-xs text-cave-400">Quitter cet écran arrête le calcul.</p>
      <div className="flex flex-wrap items-center gap-3"><Button intent="primary" disabled={busy||loading||searching||!intent.timings.length} onClick={search}><Search size={17}/>Trouver mes combinaisons</Button>{searching&&<Button onClick={stopSearch}>Arrêter la recherche</Button>}</div>
      {searching&&<div role="status" className="space-y-2 text-sm text-cave-200"><p>{searchUpdate?`${searchUpdate.examined.toLocaleString('fr')} / ${searchUpdate.coverage.total.toLocaleString('fr')} scénarios évalués · résultats provisoires`:'Préparation de la sélection…'}</p>{searchUpdate&&<progress aria-label="Avancement de la recherche" className="w-full h-2 accent-hop" value={searchUpdate.examined} max={searchUpdate.coverage.total}/>}</div>}
      {searchUpdate&&<p className="text-sm text-cave-400">{searchUpdate.coverage.limited?`${searchUpdate.coverage.varieties.selected} houblons et ${searchUpdate.coverage.yeasts.selected} levures présélectionnés parmi ${searchUpdate.coverage.fullTotal.toLocaleString('fr')} scénarios possibles.`:'Domaine complet retenu.'} {stopped&&!searchUpdate.done?'Recherche arrêtée ; les résultats partiels restent consultables.':searchUpdate.done?`${searchUpdate.examined.toLocaleString('fr')} scénarios évalués.`:''}</p>}
    </div>
    {results&&<div className="grid lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] gap-5 items-start">
      <div className="space-y-4"><p className="text-sm text-cave-400">Meilleures pistes parmi les scénarios évalués : {compatible.length} sans conflit établi · {rejected.length} écartées. {searching?'Le classement évolue pendant le calcul.':searchUpdate?.done&&!searchUpdate.coverage.limited?'Tous les scénarios du domaine ont été examinés.':'La recherche ne certifie pas le meilleur résultat du domaine complet.'} Les incertitudes restent visibles.</p>
        {documented.length>0&&<div className="space-y-2"><h4 className="font-semibold text-water">Partir d’un essai publié</h4>{documented.map(candidateCard)}</div>}
        <div role="group" aria-label="Pistes de houblonnage" className="space-y-2"><h4 className="font-semibold text-cave-50">Explorer d’autres combinaisons</h4><p className="text-xs text-cave-400">La meilleure condition évaluée pour chaque couple houblon / levure.</p>{explorations.map(candidateCard)}</div>
        {!compatible.length&&!searching&&<p className="text-sm text-ebc-straw">Aucune piste évaluée ne respecte les exclusions connues. Examine les conflits, élargis la recherche ou ajuste tes contraintes.</p>}
        {!!rejected.length&&<Button onClick={()=>setShowRejected(v=>!v)}>{showRejected?'Masquer les pistes en conflit':'Comprendre les pistes écartées'}</Button>}
      </div>
      {selected&&<article aria-label="Programme proposé par le solver" className="min-w-0 space-y-4 lg:border-l lg:border-cave-700 lg:pl-5">
        <div><h4 className="font-sans text-base font-semibold text-cave-50">Ton programme proposé</h4><p className="text-hop">{yeasts.find(y=>y.id===selected.triplets[0].yeastId)?.name}</p><p className="text-xs text-cave-400">Prévisualisation du programme.</p></div>
        <details><summary className="cursor-pointer min-h-touch text-sm text-cave-200">Style, usage et sources</summary><div className="space-y-2 text-xs text-cave-400">{[...new Set(selected.triplets.map(t=>t.varietyId))].map(id=>{
          const variety=varieties.find(v=>v.id===id);if(!variety)return null;
          const use=hopStyleGuidance(variety,style?.name??'');
          return <div key={id}><p className="font-semibold text-cave-50">{variety.name} · {use.styleLabel}</p><p>{use.reason}</p>{use.roles.length>0&&<p>{use.roles.join(' · ')}</p>}{use.sources.map((source,i)=><HopSourceLink key={i} source={source}/>)}</div>;
        })}</div></details>
        <div className="space-y-4">{selected.triplets.map((t,i)=><div key={i} className="border-l-2 border-water pl-3 space-y-2"><p className="font-semibold text-cave-50">{varieties.find(v=>v.id===t.varietyId)?.name} · {HOP_TIMING_LABELS[t.timing!]}</p><p className="text-sm text-cave-200">{recipe&&t.doseGL!==null?`${Units.format(t.doseGL*recipe.volumeL, 'g')} pour ${recipe.volumeL} L` : hopDoseLabel(t.doseGL)}</p><div className="grid grid-cols-3 gap-2">{([{key:'doseGL',label:'Dose (g/L)'},{key:'temperatureC',label:'Contact (°C)'},{key:'contactHours',label:contactFactor(t)===60?'Durée (min)':'Durée (h)'}]as const).map(f=><HopField label={`${f.label} · ajout ${i+1}`} key={f.key}><NumberInput className={inputClass} value={t[f.key]===null?undefined:t[f.key]*(f.key==='contactHours'?contactFactor(t):1)} emptyValue={undefined} disabled={busy} onValue={n=>editCondition(i,f.key,n===undefined?null:n/(f.key==='contactHours'?contactFactor(t):1))}/></HopField>)}</div>
          <details className="text-xs text-cave-400"><summary className="cursor-pointer min-h-touch">Origine des conditions préremplies</summary>{selected.conditions[i].length?selected.conditions[i].map((c,j)=><div className="space-y-1 mb-2" key={j}><p>{c.field==='doseGL'?hopDoseLabel(c.value):c.field==='temperatureC'?hopTemperatureLabel(c.value):hopDurationLabel(c.value)} : {c.origin==='trial'?`choix dans la plage publiée ${hopRangeLabel(c.range)}`:c.origin==='recipe'?'valeur planifiée dans la recette':'point de départ proposé, pas optimum mesuré'}.</p><HopSourceLink source={c.source}/></div>):<p>Conditions choisies pour cette simulation.</p>}</details></div>)}</div>
        {selected.trial&&<details><summary className="cursor-pointer min-h-touch text-sm text-water">Ce que l’essai a montré</summary><div className="space-y-4 py-3"><HopTrialResult trial={selected.trial}/>{recipe&&<HopTrialComparison recipe={recipe} trial={selected.trial}/>}</div></details>}
        <details><summary className="cursor-pointer min-h-touch text-sm text-cave-200">Compatibilité et conditions</summary><Checks checks={[...selected.checks,...selected.recipeChecks]}/></details>
        {shownPrediction&&<div className="space-y-3 pt-2">{selected.triplets.length>1&&<HopField label="Ajout représenté"><select className={inputClass} value={chartAddition} onChange={e=>setChartAddition(Number(e.target.value))}>{selected.triplets.map((t,i)=><option key={i} value={i}>Ajout {i+1} · {varieties.find(v=>v.id===t.varietyId)?.name}</option>)}</select></HopField>}<HopExplorationChart prediction={shownPrediction} axes={axes} target={effectiveTarget} highlighted={selected.evidenceFamilies} variety={varieties.find(v=>v.id===shownPrediction.triplet.varietyId)} models={models}/><p className="text-xs text-cave-400">Aperçu d’un ajout avec la levure. Simule l’ensemble après ajout à ta recette.</p></div>}
        {recipe&&onChange&&<div className="border-t border-cave-700 pt-4 space-y-2"><p className="text-sm text-cave-200">{replacing===undefined?'Les ajouts actuels sont conservés.':`L’ajout ${replacing+1} sera remplacé ; les autres seront conservés.`} La souche est celle de toute la recette.</p><Button intent="primary" full disabled={busy||hasConflict(selected)||selected.triplets.some(t=>t.doseGL===null)} onClick={()=>void apply()}>{replacing===undefined?'Ajouter ce programme à ma recette':'Appliquer ce remplacement'}</Button>{hasConflict(selected)&&<p className="text-sm text-alert flex gap-2"><AlertTriangle size={17} className="shrink-0"/>Résous les exclusions en conflit avant d’appliquer ce programme.</p>}</div>}
      </article>}
    </div>}
    {error&&<p role="alert" className="text-sm text-alert">{error}</p>}{notice&&<p role="status" className="text-sm text-hop">{notice}</p>}
    <details><summary className="cursor-pointer min-h-touch text-sm text-cave-400">Réviser les points de départ du solver</summary><p className="text-sm text-cave-400">Les styles, conditions proposées et références chimiques se modifient dans les connaissances, sans redéploiement.</p><Button disabled={busy} onClick={()=>void run(async()=>{await ensureGuideReferences({knowledge:[policy]});setNotice('Guide du solver enregistré dans les connaissances.')})}>Enregistrer le guide modifiable</Button></details>
  </section>;
}
