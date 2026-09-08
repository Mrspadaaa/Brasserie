import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HopAxis, HopModel, HopPrediction, HopTriplet, HopYeast, HOP_TIMINGS } from '../../../functions/src/hopPredictionSchema';
import { HopRange } from '../../../functions/src/hopIndexSchema';
import { rankHopTriplets, usableHopKnowledge } from '../../domain/hopIndex/engine';
import { captureHopPrediction } from '../../domain/hopIndex/snapshots';
import { StorageService } from '../../services/storage';
import { useStorageValue } from '../../hooks/useLiveData';
import { HopField } from './HopFactsEditor';
import { inputClass } from '../FormNav';
import { HopTripletFields, emptyHopTriplet } from './HopTripletFields';
import { HopPredictionView } from './HopPredictionView';
import { Button } from '../../components/ui/Button';
import { HOP_TIMING_LABELS } from './presentation';
import { BrewTag } from '../BrewTag';
import { hopReferenceSource } from '../../domain/hopIndex/labels';
import { HopWorkshop } from './HopWorkshop';
export function HopSearchPanel() {
  return <div className="space-y-5"><HopWorkshop /><details><summary className="cursor-pointer min-h-touch text-sm text-cave-400">Calcul expérimental avancé · modèles validés uniquement</summary><HopModelSearchPanel /></details></div>;
}
function HopModelSearchPanel() {
  const varieties = useStorageValue(StorageService.getHopVarieties), lots = useStorageValue(StorageService.getHopLots), knowledge = useStorageValue(StorageService.getHopKnowledge);
  const valid = useMemo(() => usableHopKnowledge(knowledge).valid, [knowledge]);
  const axes = valid.filter((k): k is HopAxis => k.kind === 'axis'), yeasts = valid.filter((k): k is HopYeast => k.kind === 'yeast');
  const models = valid.filter((k): k is HopModel => k.kind === 'model' && k.enabled);
  const [conditions, setConditions] = useState<HopTriplet>(emptyHopTriplet), [target, setTarget] = useState<Record<string, HopRange>>({});
  const [showAllAxes, setShowAllAxes] = useState(false);
  const [saved, setSaved] = useState<{ key: string; message: string; error?: boolean } | null>(null);
  const [query, setQuery] = useState<{ conditions: HopTriplet; target: Record<string, HopRange> } | null>(null);
  const [limit, setLimit] = useState(10);
  const resultHeading = useRef<HTMLDivElement>(null);
  const documentedAxes = new Set(models.flatMap(m => m.outputs.map(o => o.target)));
  const visibleAxes = axes.filter((a, i) => showAllAxes || i < 4 || !!target[a.id] || documentedAxes.has(`axis:${a.id}`));
  useEffect(() => {
    const heading = resultHeading.current, scroller = heading?.closest<HTMLElement>('[data-hop-scroll]');
    if (query && heading && scroller) scroller.scrollTo({ top: scroller.scrollTop + heading.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 12, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [query]);
  const data = useMemo(() => ({ varieties, lots, knowledge }), [varieties, lots, knowledge]);
  const results = useMemo(() => {
    if (!query) return [];
    const c = query.conditions;
    const candidates = varieties.filter(v => !v.archived && (!c.varietyId || v.id === c.varietyId)).flatMap(v => yeasts.filter(y => !c.yeastId || y.id === c.yeastId).flatMap(y => (c.timing ? [c.timing] : [...HOP_TIMINGS]).map(timing => ({ ...c, varietyId: v.id, yeastId: y.id, timing }))));
    return rankHopTriplets(candidates, query.target, data);
  }, [query, data]);
  const savePrediction = (r: HopPrediction) => {
    try {
      StorageService.saveHopPrediction(captureHopPrediction(r.triplet, query!.target, data, { id: crypto.randomUUID(), name: `${varieties.find(v => v.id === r.triplet.varietyId)?.name ?? 'Triplet'} × ${yeasts.find(y => y.id === r.triplet.yeastId)?.name ?? '?'} · ${HOP_TIMING_LABELS[r.triplet.timing]} · ${lots.find(l => l.id === r.triplet.lotId)?.name ?? 'référence variété'}`, createdAt: new Date().toISOString() }));
      setSaved({ key: JSON.stringify(r.triplet), message: 'Prédiction figée pour une future dégustation.' });
    } catch (e) { setSaved({ key: JSON.stringify(r.triplet), message: (e as Error).message, error: true }); }
  };
  return <section className="space-y-4" aria-label="Recherche de triplets aromatiques">
    <h2 className="text-xl font-semibold text-cave-50">Chercher un profil aromatique</h2>
    <p className="text-cave-200">Choisis tes intensités, puis les conditions de brassage. Un filtre laissé vide explore toutes les références de l’index.</p>
    <div className="flex flex-wrap gap-2"><BrewTag tone="info">{Object.keys(target).length} axe(s) choisi(s)</BrewTag><BrewTag>{models.length} modèle(s) documenté(s)</BrewTag></div>
    <div className="grid gap-3 sm:grid-cols-2">{visibleAxes.map(a => <HopField key={a.id} label={a.name}><select className={inputClass} value={!target[a.id] ? '' : target[a.id].min === a.scale.min ? 'low' : target[a.id].min === a.lowMax ? 'medium' : 'high'} onChange={e => {
      const next = { ...target }; if (!e.target.value) delete next[a.id]; else next[a.id] = e.target.value === 'low' ? { min: a.scale.min, max: a.lowMax } : e.target.value === 'medium' ? { min: a.lowMax, max: a.mediumMax } : { min: a.mediumMax, max: a.scale.max }; setTarget(next);
    }}><option value="">Sans préférence</option><option value="low">Faible</option><option value="medium">Moyenne</option><option value="high">Forte</option></select></HopField>)}</div>
    {(visibleAxes.length < axes.length || showAllAxes) && <Button intent="ghost" onClick={() => setShowAllAxes(v => !v)}>{showAllAxes ? 'Réduire les familles affichées' : `Toutes les familles (${axes.length})`}</Button>}
    {!axes.length && <p className="text-ebc-straw">Installer ou documenter les axes dans « Sources et modèles » pour définir une cible.</p>}
    {models.length > 0 && <HopField label="Partir d’un protocole documenté" hint="Préremplit des conditions explicites du domaine étudié. Vérifie leur correspondance avec ta bière ; tu peux ensuite les modifier."><select className={inputClass} value="" onChange={e => {
      const model = models.find(m => m.id === e.target.value); if (!model) return;
      const s = model.scope; setConditions({ varietyId: s.varietyId, lotId: null, yeastId: s.yeastId, timing: s.timing, doseGL: s.doseGL.min, temperatureC: s.temperatureC?.min ?? null, contactHours: s.contactHours?.min ?? null, matrixId: s.matrixId });
    }}><option value="">Choisir un protocole</option>{models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></HopField>}
    {conditions.matrixId && models.filter(m => m.scope.matrixId === conditions.matrixId).map(m => <p key={m.id} className="text-sm text-cave-400">{m.scope.notes}</p>)}
    <HopTripletFields value={conditions} onChange={setConditions} varieties={varieties} lots={lots} yeasts={yeasts} />
    <Button intent="primary" disabled={!Object.keys(target).length} onClick={() => { setQuery({ conditions: { ...conditions }, target: structuredClone(target) }); setLimit(10); setSaved(null); }}>Comparer les triplets</Button>
    {query && <div ref={resultHeading} className="scroll-mt-20 space-y-2"><div className="flex flex-wrap gap-2"><BrewTag tone="info">{results.length} combinaison(s)</BrewTag><BrewTag>dont {results.filter(r => r.score.range).length} quantifiable(s)</BrewTag></div><p className="text-sm text-cave-400">Les plages qui se recouvrent ne départagent pas sûrement les pistes. Le classement privilégie la borne prudente du score.</p>{!results.length && <p className="text-cave-200">Une référence de houblon et une levure doivent être présentes dans l’index pour former un triplet.</p>}</div>}
    {results.slice(0, limit).map((r, i) => <article key={`${r.triplet.varietyId}-${r.triplet.yeastId}-${r.triplet.timing}-${r.triplet.lotId}`} className="scroll-mt-20 border-t border-cave-700 pt-4 space-y-3">
      <p className="text-sm text-cave-400">Piste {i + 1}</p><HopPredictionView prediction={r} target={query.target} axes={axes.filter(a => !!query.target[a.id])} names={{ variety: varieties.find(v => v.id === r.triplet.varietyId)?.name, yeast: yeasts.find(y => y.id === r.triplet.yeastId)?.name }} />
      <p className="text-sm text-cave-400">Référence : {varieties.find(v => v.id === r.triplet.varietyId) ? hopReferenceSource(varieties.find(v => v.id === r.triplet.varietyId)!) : 'inconnue'}</p>
      <Button onClick={() => savePrediction(r)}>Garder cette prédiction</Button>
      {saved?.key === JSON.stringify(r.triplet) && <p role={saved.error ? 'alert' : 'status'} className={saved.error ? 'text-alert' : 'text-hop'}>{saved.message}</p>}
    </article>)}
    {results.length > limit && <Button onClick={() => setLimit(limit + 10)}>Afficher les pistes suivantes</Button>}
  </section>;
}
