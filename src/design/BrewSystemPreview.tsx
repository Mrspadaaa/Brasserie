import { useState } from 'react';
import type { Batch, BrewhouseProfile, Recipe } from '../types';
import { BrewhouseSettings } from '../ui/BrewhouseSettings';
import { BrewSystemCalibration } from '../ui/BrewSystemCalibration';
import { BrewSystemSource } from '../ui/BrewSystemSource';
import { captureSnapshot } from '../domain/recipeSnapshot';
import { buildTimeline } from '../services/brewTimer';

/** Isolated rehearsal: fabricated measurements stay in this preview's memory. */
export function BrewSystemPreview({profile,recipe}:{profile:BrewhouseProfile;recipe:Recipe}) {
  const [saved,setSaved] = useState(profile), [draft,setDraft] = useState(profile);
  const [source,setSource] = useState<string>(), [message,setMessage] = useState('');
  const [batches] = useState<Batch[]>(()=>[1,2,3].map((n)=>{
    const snapshot=captureSnapshot({...recipe,brewhouse:profile});
    const at=Date.UTC(2026,8,10+n,10);
    return {id:`TEST-${n}`,name:`Essai mesuré ${n}`,style:recipe.style,volumeL:recipe.volumeL,brewDate:`2026-09-${10+n}`,status:'fermentation',recipeSnapshot:snapshot,
      brewDay:{steps:buildTimeline(snapshot),currentIndex:0,pitchedAt:at+60000,additions:Object.fromEntries(recipe.fermentables.map((f,i)=>[`grain-${i}`,{amount:f.weightKg,doneAt:at-3600000}])),readings:[
        {id:`v${n}`,pairId:`p${n}`,stepId:'ensemencement',measurementStage:'fermenter',kind:'volume',unit:'L',value:recipe.volumeL,volumeBasis:'cold',at},
        {id:`g${n}`,pairId:`p${n}`,stepId:'ensemencement',measurementStage:'fermenter',kind:'densite',unit:'SG',value:1.05+n*.001,roomTemp:true,at}
      ]}};
  }));
  return <main className="max-w-3xl mx-auto px-2 space-y-2 pb-20">
    <p className="text-xs text-ebc-straw">Mesures fictives pour les essais. Aucun enregistrement dans la brasserie.</p>
    <BrewhouseSettings profile={draft} onChange={setDraft}/>
    <BrewSystemCalibration profile={draft} batches={batches} onChange={setDraft} onOpenBatch={setSource}/>
    {source && <BrewSystemSource batch={batches.find(b=>b.id===source)!} onClose={()=>setSource(undefined)}/>}
    <div className="flex gap-2"><button className="brew-system-button" onClick={()=>{setSaved(draft);setMessage('Réglages conservés dans le banc d’essai.');}}>Enregistrer les réglages de test</button><button className="brew-system-button" onClick={()=>{setDraft(saved);setMessage('Réglages enregistrés retrouvés.');}}>Recharger les réglages</button></div>
    {message && <p role="status" className="text-xs text-hop">{message}</p>}
  </main>;
}
