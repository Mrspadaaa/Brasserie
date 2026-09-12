import { Textarea } from '../Input';
import React, { useState } from 'react';
import { HopAxis, HopTasting, HopYeast } from '../../../functions/src/hopPredictionSchema';
import { compareHopTasting, usableHopKnowledge } from '../../domain/hopIndex/engine';
import { StorageService } from '../../services/storage';
import { useStorageValue } from '../../hooks/useLiveData';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../Sheet';
import { inputClass, TextInput } from '../FormNav';
import { HopField, HopSourceEditor } from './HopFactsEditor';
import { emptyHopTriplet, HopTripletFields } from './HopTripletFields';
import { HOP_CONFIDENCE_LABELS, hopRangeLabel } from './presentation';
import { Batch } from '../../types';
import { HopRangePlot } from './HopRangePlot';
import { BrewTag } from '../BrewTag';

export function HopTastingsPanel({ batch }: { batch?: Batch }) {
  const tastings = useStorageValue(StorageService.getHopTastings), predictions = useStorageValue(StorageService.getHopPredictions), knowledge = useStorageValue(StorageService.getHopKnowledge);
  const varieties = useStorageValue(StorageService.getHopVarieties), lots = useStorageValue(StorageService.getHopLots);
  const valid = usableHopKnowledge(knowledge).valid;
  const axes = valid.filter((k): k is HopAxis => k.kind === 'axis'), yeasts = valid.filter((k): k is HopYeast => k.kind === 'yeast');
  const [draft, setDraft] = useState<HopTasting | null>(null), [error, setError] = useState('');
  const start = () => {
    const now = new Date(), date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setDraft({ id: crypto.randomUUID(), name: batch?.name ?? '', date, origin: batch ? 'batch' : 'commercial', ...(batch ? { batchId: batch.id } : {}), notes: '', predictionId: null, triplet: null, tripletSource: null,
      axes: structuredClone(axes.map(axis => ({ axis, perceived: null, confidence: 'low' as const }))) }); setError('');
  };
  const save = () => {
    try { if (draft) StorageService.saveHopTasting(draft); setDraft(null); setError(''); }
    catch (e) { setError((e as Error).message); }
  };
  const entries = tastings.filter(t => !batch || t.batchId === batch.id).sort((a, b) => b.date.localeCompare(a.date));
  return <section className="space-y-4" aria-label="Dégustations aromatiques">
    <h2 className="text-lg font-semibold text-cave-50">Prédit et dégusté</h2>
    <p className="text-cave-200">Conserve une observation même si la recette, la levure ou le timing d’une bière commerciale sont inconnus. L’écart compare la dégustation à une prédiction déjà figée.</p>
    <Button onClick={start}>Noter une dégustation{batch ? ' du brassin' : ' commerciale'}</Button>
    {entries.map(t => {
      const snapshot = predictions.find(p => p.id === t.predictionId), frozenAxes = snapshot?.evidence.knowledge.filter((k): k is HopAxis => k.kind === 'axis') ?? [];
      const comparison = compareHopTasting(t, snapshot?.recipePrediction?.overall ?? snapshot?.prediction, frozenAxes);
      return <article key={t.id} className="border-t border-cave-700 pt-4 space-y-2"><div className="flex justify-between gap-3"><div><h3 className="font-semibold text-cave-50">{t.name}</h3><p className="text-sm text-cave-400">{t.date} · {t.origin === 'commercial' ? `Bière commerciale${t.brewery ? ` · ${t.brewery}` : ''}` : 'Brassin maison'}</p></div><Button onClick={() => { setDraft(structuredClone(t)); setError(''); }}>Corriger</Button></div>
        <p className="text-sm text-cave-400">{snapshot ? `Prédiction conservée le ${new Date(snapshot.createdAt).toLocaleDateString('fr-CH')}` : t.predictionId ? 'Prédiction référencée indisponible ; observation conservée.' : 'Aucune prédiction associée.'}{snapshot && snapshot.createdAt.slice(0, 10) > t.date ? ' · Comparaison rétrospective, pas une validation prospective.' : ''}</p>
        {comparison.filter(c => c.perceived || c.predicted).map(c => <div key={c.axis.id} className="space-y-2 py-3 border-b border-cave-800 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold text-cave-50">{c.axis.name}</span><BrewTag tone={c.gap ? c.gap.min > 0 || c.gap.max < 0 ? 'pause' : 'info' : 'neutral'}>{!c.gap ? 'Écart inconnu' : c.gap.min > 0 ? 'Perçu plus fort' : c.gap.max < 0 ? 'Perçu plus faible' : 'Plages compatibles'}</BrewTag></div><HopRangePlot axis={c.axis} predicted={c.predicted} perceived={c.perceived} /><p className="text-cave-200">Perçu {hopRangeLabel(c.perceived)} · prévu {hopRangeLabel(c.predicted)}</p><p className="text-cave-400">Écart perçu − prévu : {hopRangeLabel(c.gap)} · confiance {HOP_CONFIDENCE_LABELS[c.confidence]}</p></div>)}
        {!t.triplet && <p className="text-sm text-cave-400">Composition non documentée ; ne permet pas d’attribuer l’écart à un houblon ou à une souche.</p>}
        {t.notes && <p className="text-cave-200 whitespace-pre-wrap">{t.notes}</p>}
      </article>;
    })}
    {!entries.length && <p className="text-cave-400">Aucune dégustation enregistrée.</p>}
    <Sheet open={!!draft} onClose={() => setDraft(null)} title="Dégustation aromatique" footer={<Button full intent="primary" onClick={save}>Enregistrer la dégustation</Button>}>
      {draft && <div className="space-y-4 pb-4">
        {error && <p role="alert" className="text-alert">{error}</p>}
        <HopField label="Bière dégustée"><TextInput value={draft.name} onChange={name => setDraft({ ...draft, name })} /></HopField>
        <HopField label="Date de dégustation"><input type="date" className={inputClass} value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} /></HopField>
        {draft.origin === 'commercial' && <><HopField label="Brasserie"><TextInput value={draft.brewery ?? ''} onChange={brewery => setDraft({ ...draft, brewery })} /></HopField><HopField label="Lot commercial ou DDM"><TextInput value={draft.beerLot ?? ''} onChange={beerLot => setDraft({ ...draft, beerLot })} /></HopField></>}
        <HopField label="Prédiction de référence"><select className={inputClass} value={draft.predictionId ?? ''} onChange={e => {
          const snapshot = predictions.find(p => p.id === e.target.value), selectedAxes = snapshot?.evidence.knowledge.filter((k): k is HopAxis => k.kind === 'axis') ?? axes;
          setDraft({ ...draft, predictionId: snapshot?.id ?? null, axes: structuredClone(selectedAxes.map(axis => ({ axis, perceived: draft.axes.find(a => a.axis.id === axis.id && a.axis.version === axis.version)?.perceived ?? null, confidence: 'low' as const }))) });
        }}><option value="">Sans prédiction</option>{predictions.filter(p => !batch || p.batchId === batch.id || p.recipeId === batch.recipeRef || batch.recipeSnapshot?.hopPredictionIds?.includes(p.id)).map(p => <option key={p.id} value={p.id}>{p.name} — {new Date(p.createdAt).toLocaleDateString('fr-CH')}</option>)}</select></HopField>
        <p className="text-sm text-cave-400">Une classe exprime une plage de perception personnelle. « Non évalué » ne signifie pas absent.</p>
        <div className="grid gap-3 sm:grid-cols-2">{draft.axes.map((a, i) => <HopField key={`${a.axis.id}-${a.axis.version}`} label={`${a.axis.name} perçu`}><select className={inputClass} value={!a.perceived ? '' : a.perceived.min === a.axis.scale.min ? 'low' : a.perceived.min === a.axis.lowMax ? 'medium' : 'high'} onChange={e => {
          const perceived = !e.target.value ? null : e.target.value === 'low' ? { min: a.axis.scale.min, max: a.axis.lowMax } : e.target.value === 'medium' ? { min: a.axis.lowMax, max: a.axis.mediumMax } : { min: a.axis.mediumMax, max: a.axis.scale.max };
          setDraft({ ...draft, axes: draft.axes.map((v, j) => j === i ? { ...v, perceived } : v) });
        }}><option value="">Non évalué</option><option value="low">Faible</option><option value="medium">Moyen</option><option value="high">Fort</option></select></HopField>)}</div>
        {!draft.axes.length && <p className="text-ebc-straw">Axe sensoriel absent : le texte peut être conservé, puis enrichi après installation du lexique.</p>}
        {axes.some(a => !draft.axes.some(v => v.axis.id === a.id)) && <Button onClick={() => setDraft({ ...draft, axes: [...draft.axes, ...structuredClone(axes.filter(a => !draft.axes.some(v => v.axis.id === a.id)).map(axis => ({ axis, perceived: null, confidence: 'low' as const })))] })}>Ajouter les axes actuels absents</Button>}
        <HopField label="Conditions et notes de dégustation"><Textarea className={`${inputClass} py-2 min-h-24`} value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></HopField>
        <label className="flex items-center gap-2 min-h-touch text-cave-200"><input type="checkbox" checked={!!draft.triplet} onChange={e => setDraft({ ...draft, triplet: e.target.checked ? emptyHopTriplet() : null, tripletSource: e.target.checked ? { title: '', author: '', reference: '', year: null, kind: 'manufacturer' } : null })} />Renseigner une composition documentée</label>
        {draft.triplet && <><HopTripletFields value={draft.triplet} onChange={triplet => setDraft({ ...draft, triplet })} varieties={varieties} lots={lots} yeasts={yeasts} /><HopSourceEditor value={draft.tripletSource} onChange={tripletSource => setDraft({ ...draft, tripletSource })} /></>}
      </div>}
    </Sheet>
  </section>;
}
