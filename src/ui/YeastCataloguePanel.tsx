import { Input } from './Input';
import React, { useMemo, useState } from 'react';
import type { HopYeast } from '../../functions/src/hopPredictionSchema';
import type { YeastCatalogueFact } from '../../functions/src/yeastCatalogueSchema';
import type { YeastSpec } from '../types';
import { catalogueFacts, catalogueMatches, catalogueYeasts, YEAST_FACT_LABELS } from '../domain/yeastCatalogue';
import { useStorageValue } from '../hooks/useLiveData';
import { StorageService } from '../services/storage';
import { Button } from '../components/ui/Button';
import { inputClass } from './FormNav';
import { Units } from '../services/units';
import { HopSourceLink } from './hopIndex/HopTechnicalPanel';

const display = (f: YeastCatalogueFact) => f.range && f.qualifier === 'range' ? `${Units.format(f.range.min,'').trim()}–${Units.format(f.range.max,f.unit ?? '').trim()}` : f.reported;
function FactBand({ fact }: { fact: YeastCatalogueFact }) {
  if (!fact.range || fact.qualifier !== 'range') return null;
  const max = fact.unit === '%' ? 100 : Math.max(40, Math.ceil(fact.range.max / 10) * 10);
  return <figure className="space-y-1"><figcaption className="text-sm text-cave-200">{YEAST_FACT_LABELS[fact.key]} · {display(fact)}</figcaption>
    <svg viewBox="0 0 300 38" className="w-full h-10" role="img" aria-label={`${YEAST_FACT_LABELS[fact.key]} : ${display(fact)}, plage fabricant`}>
      <line x1="2" y1="10" x2="298" y2="10" stroke="currentColor" className="text-cave-700" strokeWidth="6" />
      <line x1={2+296*fact.range.min/max} y1="10" x2={2+296*fact.range.max/max} y2="10" stroke="currentColor" className="text-ebc-straw" strokeWidth="8" strokeLinecap="round" />
      {[0,max/2,max].map((v,i)=><text key={i} x={2+296*v/max} y="34" textAnchor={i===0?'start':i===2?'end':'middle'} fill="currentColor" className="text-cave-400" fontSize="12">{v}{fact.unit}</text>)}
    </svg></figure>;
}
export function YeastCatalogueDetails({ yeast }: { yeast: HopYeast }) {
  const c=yeast.catalogue;if(!c)return null;
  const facts=catalogueFacts(yeast), dates=c.retrievals.map(r=>r.retrievedAt).sort();
  const bands=facts.filter(f=>['temperature','attenuation'].includes(f.key)&&f.qualifier==='range').slice(0,4);
  return <div className="space-y-4">
    <p className="text-sm text-cave-400">Données déclarées par la source. Les plages dépendent du moût et du procédé ; elles ne sont pas des intervalles de confiance statistiques. Les contradictions restent signalées dans les caractéristiques concernées.</p>
    {bands.length>0&&<div className="grid sm:grid-cols-2 gap-4">{bands.map((f,i)=><FactBand key={i} fact={f}/>)}</div>}
    <dl className="divide-y divide-cave-700">{facts.map((f,i)=><div key={i} className="py-2 space-y-1"><dt className="text-sm font-semibold text-cave-200">{YEAST_FACT_LABELS[f.key]} <span className="font-normal text-cave-400">· {f.label}</span></dt><dd className="text-sm text-cave-50 break-words">{display(f)}</dd>{f.context&&<dd className="text-sm text-cave-400">{f.context}</dd>}<dd><HopSourceLink source={f.source}/></dd></div>)}</dl>
    {!facts.length&&<p className="text-sm text-cave-200">Référence identifiée dans le catalogue. Caractéristiques encore inconnues.</p>}
    <div className="text-sm text-cave-400 space-y-1">{!facts.some(f=>f.key==='pof')&&<p>Phénols / POF : inconnu.</p>}{!facts.some(f=>f.key==='betaLyase')&&<p>Rendement de libération des thiols : inconnu. Une capacité de biotransformation des terpènes ne renseigne pas ce rendement.</p>}<p>Durée et paliers : à définir selon le moût, les mesures de densité et le profil recherché.</p></div>
    <details className="border-t border-cave-700 pt-2"><summary className="cursor-pointer min-h-touch text-sm text-water">Sources et mises à jour</summary>
      <div className="space-y-2 text-sm text-cave-400"><p>Collecte la plus récente : {dates.at(-1)?.slice(0,10)}. Année de chaque publication indiquée dans sa source.</p><p>Présence au catalogue : {c.status==='discontinued'?'arrêt déclaré':c.status==='listed'?'répertoriée, disponibilité à vérifier':'inconnue'}.</p>
        {c.gaps.map((g,i)=><p key={i}>{g}</p>)}
        <HopSourceLink source={yeast.source}/>
        {c.documents.map((d,i)=><p key={i}><a className="underline text-water break-words" href={d.url} target="_blank" rel="noreferrer">{d.title}</a></p>)}
        <p>Révision de collecte : {c.parserVersion} · empreinte {c.contentSha256.slice(0,12)}.</p>
      </div></details>
  </div>;
}
export function YeastCataloguePanel({ onSelect, disabled=false, selectedId, initialForm='sèche' }: { onSelect?: (yeast:HopYeast,form:YeastSpec['form'])=>void; disabled?:boolean; selectedId?:string; initialForm?:YeastSpec['form'] }) {
  const saved=useStorageValue(StorageService.getHopKnowledge), yeasts=useMemo(()=>catalogueYeasts(saved),[saved]);
  const [query,setQuery]=useState(''),[manufacturer,setManufacturer]=useState(''),[page,setPage]=useState(0),[expanded,setExpanded]=useState(''),[form,setForm]=useState(initialForm);
  const manufacturers=useMemo(()=>[...new Set(yeasts.map(y=>y.catalogue!.manufacturer))].sort(),[yeasts]);
  const filtered=useMemo(()=>yeasts.filter(y=>(!manufacturer||y.catalogue!.manufacturer===manufacturer)&&catalogueMatches(y,query)).sort((a,b)=>a.name.localeCompare(b.name,'fr')),[yeasts,query,manufacturer]);
  const safePage=Math.min(page,Math.max(0,Math.ceil(filtered.length/12)-1)), shown=filtered.slice(safePage*12,safePage*12+12);
  return <section aria-label="Catalogue des levures" className="space-y-4">
    <div><h3 className="font-sans text-base font-semibold text-cave-50">Toutes les cultures du catalogue</h3><p className="text-sm text-cave-400 mt-1">{yeasts.length.toLocaleString('fr')} références · {manufacturers.length} fabricants et banques. Levures, mélanges et bactéries ; les références sans analyse restent visibles.</p></div>
    <div className="grid sm:grid-cols-2 gap-3"><label className="text-sm text-cave-200">Nom, code ou arôme documenté<Input className={`${inputClass} mt-1`} value={query} onChange={e=>{setQuery(e.target.value);setPage(0)}} placeholder="US-05, banane, WLP300…"/></label><label className="text-sm text-cave-200">Fabricant<select className={`${inputClass} mt-1`} value={manufacturer} onChange={e=>{setManufacturer(e.target.value);setPage(0)}}><option value="">Tous les fabricants</option>{manufacturers.map(m=><option key={m}>{m}</option>)}</select></label></div>
    <p role="status" className="text-sm text-cave-400">{filtered.length.toLocaleString('fr')} référence(s) trouvée(s). Les mots aromatiques décrivent la source ; ils ne prédisent pas l’intensité dans ta bière.</p>
    <div className="space-y-2">{shown.map(y=>{const facts=catalogueFacts(y), open=expanded===y.id;return <article key={y.id} className={`rounded-control border p-3 space-y-3 ${selectedId===y.id?'border-ebc-straw':'border-cave-700'}`}>
      <button type="button" aria-expanded={open} className="text-left w-full min-h-touch" onClick={()=>{setExpanded(open?'':y.id);setForm(y.form??initialForm)}}><span className="block font-semibold text-cave-50 break-words">{y.name}</span><span className="block text-sm text-cave-400 mt-1">{y.form??'Forme non documentée'} · {facts.length} caractéristique(s)</span><span className="block text-sm text-ebc-straw mt-1">{facts.filter(f=>f.key==='temperature'||f.key==='attenuation').slice(0,2).map(display).join(' · ')||'Caractéristiques à compléter'}</span></button>
      {open&&<><YeastCatalogueDetails yeast={y}/>{onSelect&&<div className="border-t border-cave-700 pt-3 space-y-3"><label className="block text-sm text-cave-200">Forme utilisée dans la recette<select className={`${inputClass} mt-1`} value={form} disabled={disabled} onChange={e=>setForm(e.target.value as YeastSpec['form'])}><option value="sèche">Sèche</option><option value="liquide">Liquide</option><option value="levain">Levain / culture</option></select></label><p className="text-sm text-cave-400">Le choix remplace la levure. Quantité et conduite de fermentation restent à renseigner ou vérifier.</p><Button disabled={disabled} onClick={()=>onSelect(y,form)}>Choisir cette culture</Button></div>}</>}
    </article>})}</div>
    {filtered.length>12&&<div className="flex justify-between items-center gap-3"><Button disabled={safePage===0} onClick={()=>setPage(safePage-1)}>Précédentes</Button><span className="text-sm text-cave-400">{safePage+1} / {Math.ceil(filtered.length/12)}</span><Button disabled={(safePage+1)*12>=filtered.length} onClick={()=>setPage(safePage+1)}>Suivantes</Button></div>}
    {!yeasts.length&&<p className="text-sm text-cave-400">Le catalogue apparaîtra après synchronisation de la base.</p>}
  </section>;
}
