import React, { useMemo, useState } from 'react';
import type { FermentationGuide, FermentationGoal } from '../../functions/src/fermentationGuideSchema';
import type { FermentationScience } from '../../functions/src/fermentationScienceSchema';
import { fermentationFinalGravity, fermentationLagerRest, fermentationLevers, fermentationProgramWarnings, predictStudyPhenols, type PhenolScenario } from '../../functions/src/fermentationScienceCore';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import { readFermentationGuide } from '../domain/fermentationGuide';
import { guideFermentations, guideFermentationScience, guideYeasts } from './hopIndex/guideData';
import { evaluateFermentationScenario, fermentationDefaultGoal } from '../domain/fermentationScenario';
import { fermentationRangeLabel } from './fermentationPresentation';
import { useStorageValue } from '../hooks/useLiveData';
import { StorageService } from '../services/storage';
import { HopSourceLink } from './hopIndex/HopTechnicalPanel';
import { HopField } from './hopIndex/HopFactsEditor';
import { NumberInput } from './NumberInput';
import { inputClass } from './FormNav';
import { Button } from '../components/ui/Button';
import { FermentationResearchSheet } from './FermentationResearchSheet';
const confidence={low:'faible',medium:'moyenne',high:'élevée'};
const phase={preparation:'Avant brassage',growth:'Début de fermentation',active:'Fermentation active',finish:'Fin de fermentation',conditioning:'Maturation'};
const fmt=(n:number,digits=1)=>n.toLocaleString('fr-CH',{minimumFractionDigits:digits,maximumFractionDigits:digits});

export function FermentationLeversPanel({science,goal,guide,yeastId}:{science?:FermentationScience;goal:FermentationGoal;guide?:FermentationGuide;yeastId?:string}){
 const levers=fermentationLevers(science,goal,guide?.yeastId??yeastId);
 if(!science)return <p className="text-sm text-cave-400">Aide scientifique indisponible ou désactivée. Les paliers restent saisissables.</p>;
 const row=(l:typeof levers[number])=><article key={l.id} className="py-3 space-y-2">
  <p className="text-sm text-water">{phase[l.phase]} · confiance {confidence[l.confidence]}{l.yeastIds.length?' · propre à cette souche':' · mécanisme général, à vérifier pour la souche'}</p>
  <h5 className="font-semibold text-cave-50">{l.title}</h5><p className="text-cave-200 text-sm">{l.action}</p>
  <details className="text-sm text-cave-400"><summary className="cursor-pointer min-h-touch flex items-center">Pourquoi et avec quelles limites</summary><p>{l.explanation}</p><p className="mt-2">{l.limitation}</p><HopSourceLink source={l.source}/></details>
 </article>;
 return <section aria-label="Leviers de fermentation pour cet objectif" className="space-y-2">
  <h4 className="font-semibold text-cave-50">Ce qui change le résultat</h4>
  {guide&&<p className="text-sm text-cave-200">Pour {guide.name.split(' · ')[0]} : {guide.aroma.phenols}</p>}
  <div className="divide-y divide-cave-700">{levers.slice(0,3).map(row)}</div>
  {levers.length>3&&<details><summary className="cursor-pointer min-h-touch py-2 text-water">Autres leviers et contrôles ({levers.length-3})</summary><div className="divide-y divide-cave-700">{levers.slice(3).map(row)}</div></details>}
 </section>;
}
export function FermentationPlanningCalculations({science,guide,ogInitial}:{science?:FermentationScience;guide?:FermentationGuide;ogInitial?:number}){
 const [override,setOverride]=useState<{value:number|undefined}>(),[sg,setSg]=useState<number|undefined>();
 const og=override?override.value:ogInitial&&ogInitial>1?ogInitial:undefined;
 const fg=fermentationFinalGravity(guide,og),rest=fermentationLagerRest(science,guide,og,sg);
 const lager=!!guide&&science?.lagerRest.yeastIds.includes(guide.yeastId);
 return <details className="border-t border-cave-700 pt-2"><summary className="cursor-pointer min-h-touch flex items-center text-water">{lager?'Calculer les repères de densité et de repos':'Estimer la plage de densité finale'}</summary>
  <div className="space-y-3 pt-2">
   <p className="text-sm text-cave-400">Calcul de scénario. Ces champs ne modifient ni la recette ni les relevés du brassin.</p>
   <HopField label="DI utilisée pour ce calcul (SG)" hint="DI prévue ou mesurée au densimètre, corrigée en température."><NumberInput className={inputClass} value={og} emptyValue={undefined} onValue={value=>setOverride({value})}/></HopField>
   {override&&<Button onClick={()=>{setOverride(undefined);setSg(undefined);}}>Reprendre la DI de la recette</Button>}
   <p className="text-sm text-cave-200">{fg.range?<>DF documentaire : <strong>{fermentationRangeLabel(fg.range,'SG',3)}</strong> · confiance faible.</>:fg.reasons[0]}</p>
   {fg.range&&<p className="text-sm text-cave-400">{fg.reasons[0]}</p>}
   {lager&&<>
    <p className="text-sm text-cave-200">{rest.trigger.range?<>Préparer le repos vers <strong>{fermentationRangeLabel(rest.trigger.range,'SG',3)}</strong> · confiance faible. Hausse documentée de {fermentationRangeLabel(science!.lagerRest.riseC,'°C',0)}, dans la fenêtre fabricant.</>:rest.trigger.reasons[0]}</p>
    <HopField label="Densité actuelle pour situer la progression (SG)" hint="Facultative ; densimètre corrigé ou valeur déjà corrigée du réfractomètre."><NumberInput className={inputClass} value={sg} emptyValue={undefined} onValue={setSg}/></HopField>
    {sg!==undefined&&<p role="status" className="text-sm text-cave-200">{rest.progress.range?<>Progression vers la DF estimée : {fermentationRangeLabel(rest.progress.range,'%',1)} · confiance faible.</>:rest.progress.reasons[0]}</p>}
    <p className="text-sm text-cave-400">Le repère {science!.lagerRest.progressPct.min}–{science!.lagerRest.progressPct.max} % concerne le chemin DI → DF attendue. Vérifier le ralentissement réel, puis la stabilité et les VDK. Aucune action automatique.</p>
    <HopSourceLink source={science!.lagerRest.source}/>
   </>}
   <div className="flex flex-wrap gap-3">{fg.sources.map((s,i)=><HopSourceLink key={i} source={s}/>)}</div>
  </div>
 </details>;
}
function PhenolStudyLab({science}:{science:FermentationScience}){
 const study=science.phenolStudy;
 const [scenario,setScenario]=useState<PhenolScenario>(()=>({
  yeastId:study?.yeastId??null,protocolMatched:false,wortPlato:study?.wortPlato??null,pitchMillionCellsMl:study?.pitchMillionCellsMl??null,
  wheatPct:study?.levels.wheatPct[1]??null,mashInC:study?.levels.mashInC[1]??null,boilMin:study?.levels.boilMin[1]??null,fermentC:study?.levels.fermentC[1]??null
 }));
 const prediction=useMemo(()=>predictStudyPhenols(study,scenario),[study,scenario]);
 if(!study)return null;
 const bars=[{label:'4VG',estimate:prediction.vg},{label:'4VP',estimate:prediction.vp}];
 const min=Math.min(0,...bars.map(b=>b.estimate.range?.min??0)),max=Math.max(1,...bars.map(b=>b.estimate.range?.max??0))*1.1;
 return <section aria-label="Laboratoire expérimental DM303" className="space-y-4 py-3">
  <h4 className="font-semibold text-cave-50">Reproduire une étude, explorer ses limites</h4>
  <p className="text-sm text-cave-200">{study.scope}</p>
  <p className="text-sm text-ebc-straw">Ce laboratoire simule le procédé publié. Il ne prédit pas les phénols de ta recette ni ceux d’une autre levure.</p>
  <label className="flex items-start gap-3 text-sm text-cave-200 min-h-touch"><input type="checkbox" className="mt-1" checked={scenario.protocolMatched} onChange={e=>setScenario({...scenario,protocolMatched:e.target.checked})}/>Simuler le protocole complet de l’étude avec DM303</label>
  <div className="grid sm:grid-cols-2 gap-3">
   {(['wheatPct','boilMin','fermentC'] as const).map(k=><HopField key={k} label={{wheatPct:'Blé (%)',boilMin:'Ébullition (min)',fermentC:'Fermentation (°C)'}[k]} hint={'Domaine publié : '+study.levels[k][0]+'–'+study.levels[k][2]}><NumberInput className={inputClass} value={scenario[k]??undefined} emptyValue={undefined} onValue={n=>setScenario({...scenario,[k]:n??null})}/></HopField>)}
   <HopField label="Protocole de mash-in"><select className={inputClass} value={scenario.mashInC??''} onChange={e=>setScenario({...scenario,mashInC:Number(e.target.value)})}>{study.levels.mashInC.map((t,i)=><option key={t} value={t}>{t} °C pendant {study.mashHoldMin[i]} min</option>)}</select></HopField>
  </div>
  <div aria-live="polite" className="space-y-3">
   {bars.map(b=><div key={b.label} className="space-y-2" data-compound={b.label}><p className="text-sm text-cave-50">{b.label} : {b.estimate.range?<strong>{fermentationRangeLabel(b.estimate.range,'mg/L',2)}</strong>:'non quantifiable'} · confiance {confidence[b.estimate.confidence]}</p>
    {b.estimate.range&&<div aria-hidden="true" className="relative h-4 bg-cave-800" data-scale-min={min} data-scale-max={max}><span className="absolute h-full bg-water" style={{left:100*(b.estimate.range.min-min)/(max-min)+'%',width:100*(b.estimate.range.max-b.estimate.range.min)/(max-min)+'%'}}/></div>}
   </div>)}
   <p className="text-sm text-cave-400">{prediction.vg.reasons[0]}</p>
  </div>
  <Button onClick={()=>setScenario({...scenario,protocolMatched:true,wheatPct:study.validation.wheatPct,mashInC:study.validation.mashInC,boilMin:study.validation.boilMin,fermentC:study.validation.fermentC})}>Reproduire le point de validation publié</Button>
  <p className="text-sm text-cave-400">Moyennes de validation publiées ({study.validation.n} répétitions) : {fmt(study.validation.vgMgL,3)} mg/L de 4VG et {fmt(study.validation.vpMgL,3)} mg/L de 4VP. Dispersion non disponible ; ce ne sont pas les mesures d’un brassin utilisateur.</p>
  <details><summary className="cursor-pointer min-h-touch text-water">Hypothèses et domaine du calcul</summary><ul className="list-disc pl-5 text-sm text-cave-400 space-y-2">{study.limitations.map(l=><li key={l}>{l}</li>)}</ul><p className="text-sm text-cave-400 mt-3">Ajustement quadratique complet sur {study.observations.length} observations. Coefficients recalculés depuis les données enregistrées ; interactions conservées. Les deux intervalles sont individuels, pas une garantie simultanée.</p></details>
  <div className="flex flex-wrap gap-3"><HopSourceLink source={study.source}/><HopSourceLink source={study.prediction.source}/></div>
 </section>;
}
export function FermentationScienceLibrary({science}:{science?:FermentationScience}){
 const [labOpen,setLabOpen]=useState(false);
 const [researchOpen,setResearchOpen]=useState(false);
 if(!science)return null;
 return <div className="space-y-2">
  <button type="button" className="inline-flex min-h-touch items-center text-sm text-water underline text-left" onClick={()=>setResearchOpen(true)}>Lire la synthèse de recherche sur la fermentation</button>
  {researchOpen&&<FermentationResearchSheet onClose={()=>setResearchOpen(false)}/>}
  <details className="border-t border-cave-700 pt-2"><summary className="cursor-pointer min-h-touch flex items-center text-water">Chimie des arômes et sous-produits</summary>
   <div className="divide-y divide-cave-700">{science.compounds.map(c=><details key={c.id} className="py-2"><summary className="cursor-pointer min-h-touch text-cave-50">{c.name} <span className="text-sm text-cave-400">· {c.aromas.join(', ')}</span></summary><div className="space-y-2 text-sm text-cave-200"><p>{c.family}. {c.formation}</p><p className="text-cave-400">{c.caution}</p><HopSourceLink source={c.source}/></div></details>)}</div>
  </details>
  <details className="border-t border-cave-700 pt-2"><summary className="cursor-pointer min-h-touch flex items-center text-water">État de l’art et modèles disponibles</summary><div className="divide-y divide-cave-700">{science.studies.map(s=><article className="py-3 space-y-2 text-sm" key={s.id}><h5 className="font-semibold text-cave-50">{s.title}</h5><p className="text-cave-200">{s.finding}</p><p className="text-cave-400">{s.limitation}</p><HopSourceLink source={s.source}/></article>)}</div></details>
  {science.phenolStudy&&<details className="border-t border-cave-700 pt-2" onToggle={e=>setLabOpen(e.currentTarget.open)}><summary className="cursor-pointer min-h-touch flex items-center text-water">Calcul expérimental des phénols · étude DM303</summary>{labOpen&&<PhenolStudyLab key={science.version} science={science}/>}</details>}
  <p className="text-xs text-cave-400">Connaissances version {science.version}. Sources et modèles modifiables dans l’Index. Les recommandations actuelles ne réécrivent pas les conduites conservées.</p>
 </div>;
}
/** Advice beside manual steps, and on read-only recipes, never applies settings. */
export function FermentationRecipeAdvice({recipe}:{recipe:TrialRecipe}){
 const [open,setOpen]=useState(false);
 const saved=useStorageValue(StorageService.getHopKnowledge),science=useMemo(()=>guideFermentationScience(saved)[0],[saved]);
 const guides=useMemo(()=>guideFermentations(saved),[saved]);
 const yeasts=useMemo(()=>guideYeasts(saved),[saved]);
 const scenario=useMemo(()=>evaluateFermentationScenario(recipe,yeasts,guides),[recipe,yeasts,guides]);
 const guide=scenario.guide;
 const snapshot=readFermentationGuide(recipe);
 const goal=(snapshot?.yeast.id===scenario.yeast?.id?snapshot?.goal:undefined)??fermentationDefaultGoal(guide);
 const warnings=scenario.warnings;
 if(recipe.nolo?.enabled)return <p className="mt-3 text-xs text-cave-400">Les conduites et vigilances NOLO sont réunies dans « Objectif NOLO ». Les relations d’arômes de bière alcoolisée restent hors domaine.</p>;
 return <details className="mt-4 border border-cave-700 rounded-control p-3" onToggle={e=>setOpen(e.currentTarget.open)}><summary className="cursor-pointer min-h-touch text-water">Aide pour cette levure et ces paliers</summary>
  {open&&<div className="space-y-4 pt-3">
   <p className="text-sm text-cave-400">Lecture de la conduite actuelle ; aucun changement automatique.</p>
   {warnings.map(w=><p className="text-sm text-ebc-straw" role="status" key={w}>{w}</p>)}
   <FermentationLeversPanel science={science} goal={goal} guide={guide}/>
   <FermentationPlanningCalculations key={guide?.id??'unknown'} science={science} guide={guide} ogInitial={recipe.ogTarget}/>
   <FermentationScienceLibrary science={science}/>
  </div>}
 </details>;
}
