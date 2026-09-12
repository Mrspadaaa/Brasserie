import React, { useId, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

export function RecipeDisclosure({title,summary,children,actions}:{title:string;summary?:React.ReactNode;children:React.ReactNode;actions?:React.ReactNode}) {
  const id=useId();
  const ref=useRef<HTMLDetailsElement>(null);
  useEffect(()=>{
    const node=ref.current;if(!node)return;
    const reveal=()=>{if(node.querySelector('[aria-invalid="true"],[role="alert"]'))revealRecipeErrors(node);};
    reveal();const observer=new MutationObserver(reveal);observer.observe(node,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-invalid','role']});
    return ()=>observer.disconnect();
  },[]);
  return <details ref={ref} data-recipe-section={title} className="group/recipe panel p-3 sm:p-4 min-w-0"
    onInvalidCapture={event=>{event.currentTarget.open=true;}}>
    <summary aria-controls={id} className="list-none cursor-pointer min-h-11 flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-water rounded-control">
      <span className="min-w-0 flex-1"><span className="block text-sm sm:text-base font-semibold text-cave-50">{title}</span>{summary&&<span className="block text-xs text-cave-400 truncate mt-1">{summary}</span>}</span>
      <ChevronDown className="w-4 h-4 shrink-0 text-cave-400 group-open/recipe:rotate-180" aria-hidden="true"/>
    </summary>
    <div id={id} className="mt-3 min-w-0 space-y-3">{actions&&<div className="flex flex-wrap gap-2">{actions}</div>}{children}</div>
  </details>;
}
/** Important volumes remain visible even with every preparation section closed. */
export function RecipeWaterVolumes({totalL,roL}:{totalL:number;roL:number}) {
  const fmt=(n:number)=>n.toLocaleString('fr-FR',{maximumFractionDigits:1});
  return <dl aria-label="Eaux à préparer" className="grid grid-cols-3 gap-2 rounded-panel border border-water/35 bg-water/5 p-3 min-w-0">
    {[['Osmosée',roL],['Réseau',Math.max(0,totalL-roL)],['Eau totale',totalL]].map(([label,value])=><div key={String(label)} className="min-w-0"><dt className="text-xs text-cave-300">{label}</dt><dd className={'font-mono tabular-nums text-base sm:text-xl '+(label==='Osmosée'?'text-water font-semibold':'text-cave-100')} data-water-volume={label}>{fmt(Number(value))} L</dd></div>)}
  </dl>;
}
/** Validation errors must not remain inside a closed preparation section. */
export function revealRecipeErrors(root:ParentNode=document) {
  root.querySelectorAll('[aria-invalid="true"], [role="alert"], :invalid').forEach(node=>{
    let section=node.closest('details');
    while(section){section.open=true;section=section.parentElement?.closest('details')??null;}
  });
}
