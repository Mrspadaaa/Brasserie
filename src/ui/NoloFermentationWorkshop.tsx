import React, { useMemo, useState } from 'react';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import { fermentationProposals, fermentationReadiness, applyFermentationProposal, fermentationPlanningKey, type FermentationProposal } from '../domain/fermentationPlanning';
import { evaluateNoloRecipe } from '../domain/nolo';
import { useStorageValue } from '../hooks/useLiveData';
import { StorageService } from '../services/storage';
import { Button } from '../components/ui/Button';
import { inputClass } from './FormNav';
import { BoundGraph } from './NoloAlcoholChart';
import { NoloPanel } from './NoloPanel';
import { YeastCataloguePanel } from './YeastCataloguePanel';
import { applyCatalogueYeast } from '../domain/yeastCatalogue';
import { HopSourceLink } from './hopIndex/HopTechnicalPanel';

export function NoloFermentationWorkshop({ recipe, onChange }: { recipe: TrialRecipe; onChange: (r: TrialRecipe) => void }) {
  const saved = useStorageValue(StorageService.getHopKnowledge);
  const key = fermentationPlanningKey(recipe);
  const [mode, setMode] = useState<'current' | 'choose'>('current');
  const [preview, setPreview] = useState<FermentationProposal>();
  const [notice, setNotice] = useState('');
  const [catalogue, setCatalogue] = useState(false);
  const rows = useMemo(() => fermentationProposals(recipe, saved), [key, saved]);
  const diagnostics = useMemo(() => fermentationReadiness(recipe, saved), [key, saved]);
  const result = useMemo(() => evaluateNoloRecipe(recipe, saved), [key, saved]);
  const intent = recipe.fermentationIntent ?? { version: 1 as const, aroma: '', fruit: '', acidity: '' };
  const stale = preview && preview.basis !== key;
  const candidates = rows.slice(0, 3);
  return <section aria-label="Atelier des arômes de levure" className="panel p-3 sm:p-4 space-y-3">
    <h3 className="font-semibold text-lg">Levure & fermentation <span className="text-hop text-sm">NOLO</span></h3>
    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Parcours de fermentation">
      <Button aria-pressed={mode === 'current'} onClick={() => { setMode('current'); setPreview(undefined); }}>Évaluer ma recette</Button>
      <Button aria-pressed={mode === 'choose'} onClick={() => setMode('choose')}>Trouver une conduite</Button>
    </div>
    {mode === 'current' && <>
      <p className="text-sm text-cave-200">{recipe.yeast.name || 'Souche à choisir'}</p>
      {diagnostics[0] && <p role="status" className="text-sm text-ebc-straw">{diagnostics[0].message}</p>}
      {result?.projection.max != null && <BoundGraph bound={result.projection} target={recipe.nolo!.targetAbvPct} label="Projection avec mes réglages" />}
      {diagnostics.length > 1 && <details><summary className="min-h-touch cursor-pointer text-sm text-water">Autres points à préparer · {diagnostics.length - 1}</summary><ul className="space-y-2 text-sm text-cave-200">{diagnostics.slice(1).map(d => <li key={d.id}>{d.message}{d.source && <HopSourceLink source={d.source}/>}</li>)}</ul></details>}
    </>}
    {mode === 'choose' && <label className="block text-sm text-cave-200">Profil recherché, libre
      <input className={inputClass + ' mt-1'} value={intent.aroma} placeholder="Fruité, acidulé, banane, rond…" maxLength={1000} onChange={e => onChange({ ...recipe, fermentationIntent: { ...intent, aroma: e.target.value } })}/>
    </label>}
    <div className="space-y-2" aria-label="Propositions NOLO">
      <p className="text-xs text-cave-400">{['restricted', 'restored'].includes(recipe.nolo!.process) ? 'Souches de fermentation limitée · conduites à comparer' : 'Souches NOLO à explorer · le procédé choisi reste à vérifier'}</p>
      {candidates.map(p => <button type="button" key={p.id} className="w-full min-h-touch rounded-control border border-cave-700 hover:border-ebc-straw p-3 text-left" onClick={() => { setMode('choose'); setPreview(p); setNotice(''); }}>
        <span className="flex flex-wrap justify-between gap-1 text-sm text-cave-50"><strong>{p.strain.name}</strong><span className="text-hop">Voir la proposition</span></span>
        <span className="block text-xs text-cave-400 mt-1">{p.strain.pof === 'positive' ? 'Phénols documentés' : p.strain.pof === 'negative' ? 'POF négative' : 'POF non documentée'} · {p.strain.temperatureC ? `${p.strain.temperatureC.min}–${p.strain.temperatureC.max} °C` : 'Température à préciser'} · {p.result?.projectionStatus === 'within' ? 'Cible projetée atteignable' : p.result?.projectionStatus === 'exceeds' ? 'Projection au-dessus de la cible' : 'Alcool à caractériser'}</span>
        {p.goalMatches[0] && <span className="block text-xs text-hop mt-1">{p.goalMatches[0]} · caractère publié</span>}
      </button>)}
    </div>
    {preview && <section aria-label="Proposition complète de fermentation" className="space-y-3 border-l-2 border-ebc-straw pl-3">
      <h4 className="font-semibold">{preview.strain.name} · proposition complète</h4>
      {stale ? <p role="status" className="text-sm text-ebc-straw">La recette a changé. Ouvre à nouveau une proposition pour la recalculer.</p> : <>
        {preview.result?.projection.max != null && <BoundGraph bound={preview.result.projection} target={recipe.nolo!.targetAbvPct} label="Projection de la proposition"/>}
        <dl className="text-sm space-y-2">{preview.changes.map((c, i) => <div key={i}><dt className="text-cave-400">{c.label}</dt><dd className="break-words"><span className="text-cave-400">{c.before}</span> → {c.after}</dd></div>)}</dl>
        {preview.diagnostics.filter(d => d.severity === 'action').map(d => <p key={d.id} className="text-xs text-ebc-straw">{d.message}</p>)}
        <Button intent="primary" onClick={() => { onChange(applyFermentationProposal(recipe, preview)); setPreview(undefined); setMode('current'); setNotice('Proposition appliquée au brouillon. Les réglages restent modifiables avant enregistrement.'); }}>Appliquer cette proposition</Button>
      </>}
      <details><summary className="min-h-touch text-sm text-water cursor-pointer">Hypothèses, chimie et sources</summary><div className="space-y-2 text-xs text-cave-200">{preview.assumptions.map(s => <p key={s}>{s}</p>)}<p>{preview.strain.aroma.join(' · ')}. {preview.strain.limitation}</p>{intent.aroma && !preview.goalMatches.length && <p>L’objectif « {intent.aroma} » n’est pas établi pour cette souche. Prévoir un essai comparatif ou une restitution ; aucune intensité supposée.</p>}{preview.sources.map((s, i) => <HopSourceLink key={i} source={s}/>)}</div></details>
    </section>}
    {notice && <p role="status" className="text-sm text-hop">{notice}</p>}
    <details onToggle={e => setCatalogue(e.currentTarget.open)}><summary className="min-h-touch cursor-pointer text-sm text-water">Toutes les levures · aucune exclusion par style</summary>{catalogue && <div className="space-y-3">{rows.slice(3).map(p => <Button key={p.id} onClick={() => { setPreview(p); setMode('choose'); }}>Préparer {p.strain.name}</Button>)}<YeastCataloguePanel selectedId={recipe.yeast.hopIndexId} initialForm={recipe.yeast.form} onSelect={(y, form) => onChange(applyCatalogueYeast(recipe, y, form))}/></div>}</details>
    <details><summary className="min-h-touch cursor-pointer text-sm text-water">Fruits et acidité recherchés</summary><div className="space-y-3 py-2">{(['fruit', 'acidity'] as const).map(k => <label key={k} className="block text-sm">{k === 'fruit' ? 'Fruit et apport envisagé' : 'Acidité et méthode envisagée'}<input className={inputClass} value={intent[k]} maxLength={1000} placeholder={k === 'fruit' ? 'Framboise, purée, quantité à tester…' : 'Culture acidifiante, assemblage, titration…'} onChange={e => onChange({ ...recipe, fermentationIntent: { ...intent, [k]: e.target.value } })}/></label>)}<p className="text-xs text-cave-400">Intentions conservées ; saisir les apports réels dans les ingrédients et le bilan NOLO pour les compter.</p></div></details>
    <details><summary className="min-h-touch cursor-pointer text-sm text-water">Procédé, mesures et bilan détaillé</summary><NoloPanel recipe={recipe} onChange={onChange} hideStrainPicker/></details>
  </section>;
}
