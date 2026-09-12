import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HopLot, HopVariety, HopDescription, HOP_FORMS, assertHopDocument } from '../../../functions/src/hopIndexSchema';
import { resolveHopFacts, searchHopVarieties } from '../../domain/hopIndex/facts';
import { HOP_ANALYTE_LABELS, HOP_FORM_LABELS, formatHopMeasurement, hopReferenceSource, hopReferenceLabel } from '../../domain/hopIndex/labels';
import { StorageService } from '../../services/storage';
import { AiClient } from '../../services/aiClient';
import { useStorageValue } from '../../hooks/useLiveData';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../Sheet';
import { TextInput, inputClass } from '../FormNav';
import { NumberInput } from '../NumberInput';
import { HopField as Field, HopFactsEditor, HopSourceEditor, blankHopSource } from './HopFactsEditor';
import { BrewTag } from '../BrewTag';
import { ChevronRight } from 'lucide-react';
import { useHopCatalogue } from './useHopCatalogue';
import { ensureGuideReferences } from './guideData';
import { HopTechnicalPanel } from './HopTechnicalPanel';
import { MobileDetails } from '../ViewNavigation';
import { useMobileLayout } from '../useViewport';

type Editor = { kind: 'variety'; value: HopVariety } | { kind: 'lot'; value: HopLot };
const newVariety = (name = ''): HopVariety => ({ id: crypto.randomUUID(), name, aliases: [], form: 'unknown', descriptions: [], analysis: [] });

function HopAliasesEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState(value.join(', '));
  return <Field label="Alias (séparés par des virgules)"><TextInput value={draft} onChange={text => {
    setDraft(text); onChange(text.split(',').map(s => s.trim()).filter(Boolean));
  }} /></Field>;
}

export function HopFactsView({ lot, variety }: { lot?: HopLot; variety?: HopVariety }) {
  const facts = resolveHopFacts(lot, variety);
  return <div className="divide-y divide-cave-800">
    {facts.filter(f => f.measurement || f.documentary || ['alpha', 'totalOil', '3mhCys', '3mhGsh', '4mmpFree'].includes(f.analyte)).map(f => <details key={f.analyte} className="py-3">
      <summary className="cursor-pointer grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
        <span className="text-cave-100">{HOP_ANALYTE_LABELS[f.analyte]}</span>
        <span className="font-mono text-right text-cave-50">{formatHopMeasurement(f.measurement)}</span>
        <span className="col-span-2 flex flex-wrap gap-2"><BrewTag tone={f.origin === 'lot' ? 'done' : f.origin === 'variety' ? 'info' : 'neutral'}>{f.origin === 'lot' ? 'COA du lot' : f.origin === 'variety' ? 'Référence variété' : 'Inconnu'}</BrewTag><BrewTag tone={f.confidence === 'high' ? 'done' : 'neutral'}>Confiance {({ low: 'faible', medium: 'moyenne', high: 'élevée' })[f.confidence]}</BrewTag></span>
      </summary>
      <div className="pt-2 text-sm text-cave-200 space-y-1">
        {f.reasons.map(reason => <p key={reason}>{reason}</p>)}
        {(f.measurement ?? f.documentary)?.note && <p>{(f.measurement ?? f.documentary)?.note}</p>}
        {f.documentary && <p className="break-words">{f.documentary.source.author}, {f.documentary.source.year ?? 'année inconnue'} · {/^(https?:\/\/)/i.test(f.documentary.source.reference) ? <a className="underline" href={f.documentary.source.reference} target="_blank" rel="noreferrer">Consulter la source à vérifier</a> : f.documentary.source.reference}</p>}
        {f.measurement && <><p>{f.measurement.source.author} — {f.measurement.source.title} ({f.measurement.source.year ?? 'année inconnue'})</p>
          <p className="break-words">{/^https?:\/\//i.test(f.measurement.source.reference)
            ? <a className="underline" href={f.measurement.source.reference} target="_blank" rel="noreferrer">Consulter la source</a>
            : f.measurement.source.reference} {f.measurement.source.locator}</p>
          {f.measurement.kind === 'point' && f.range && <p>Plage analytique publiée : {f.range.min}–{f.range.max}.</p>}
        </>}
      </div>
    </details>)}
  </div>;
}

export function HopIndexPanel({ createRequest, onNotice }: { createRequest?: { kind: string; at: number } | null; onNotice?: (message: string) => void }) {
  const mobile = useMobileLayout();
  const { varieties, error: catalogueError, loading } = useHopCatalogue();
  const lots = useStorageValue(StorageService.getHopLots);
  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [limit, setLimit] = useState(20);
  const [selected, setSelected] = useState<string>();
  const [lotId, setLotId] = useState<string>();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [aiNote, setAiNote] = useState('');
  const [coaProposal, setCoaProposal] = useState<Partial<HopLot> | null>(null);
  const requestEpoch = useRef(0);
  const variety = varieties.find(v => v.id === selected);
  const lot = lots.find(l => l.id === lotId);
  const sources = useMemo(() => [...new Set(varieties.map(hopReferenceSource))].sort((a, b) => a.localeCompare(b, 'fr')), [varieties]);
  const matches = useMemo(() => searchHopVarieties(varieties, query, includeArchived).filter(v => !sourceFilter || hopReferenceSource(v) === sourceFilter), [varieties, query, includeArchived, sourceFilter]);
  const lotCounts = useMemo(() => { const counts = new Map<string, number>(); for (const l of lots) if (!l.archived) counts.set(l.varietyId, (counts.get(l.varietyId) ?? 0) + 1); return counts; }, [lots]);
  useEffect(() => { setLimit(20); }, [query, includeArchived, sourceFilter]);
  const closeEditor = () => { requestEpoch.current++; setEditor(null); setBusy(false); setCoaProposal(null); setError(''); setAiNote(''); };
  useEffect(() => () => { requestEpoch.current++; }, []);
  useEffect(() => {
    if (createRequest?.kind === 'newHopVariety') { setEditor({ kind: 'variety', value: newVariety() }); setError(''); }
  }, [createRequest?.at]);
  const openLot = () => {
    if (!variety) return;
    setEditor({ kind: 'lot', value: { id: crypto.randomUUID(), name: '', varietyId: variety.id, form: 'unknown', analysis: [] } });
    setError(''); setAiNote(''); setCoaProposal(null);
  };
  const save = async () => {
    if (!editor) return;
    setBusy(true);
    try {
      const item = { ...editor.value, name: editor.value.name.trim() };
      assertHopDocument(editor.kind === 'variety' ? 'hopVarieties' : 'hopLots', item);
      if (editor.kind === 'variety') StorageService.saveHopVariety(item as HopVariety);
      else {
        const parent = varieties.find(v => v.id === (item as HopLot).varietyId);
        if (parent) await ensureGuideReferences({ varieties: [parent] });
        StorageService.saveHopLot(item as HopLot);
      }
      setSelected(editor.kind === 'variety' ? item.id : (item as HopLot).varietyId);
      setLotId(editor.kind === 'lot' ? item.id : undefined);
      closeEditor(); onNotice?.('Fiche enregistrée localement ; synchronisation en cours.');
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  const lookup = async () => {
    if (!query.trim() || busy || editor) return;
    const epoch = ++requestEpoch.current;
    setBusy(true); setError(''); setAiNote('');
    const response = await AiClient.run<{ found: boolean; source?: string; note?: string } & Omit<HopVariety, 'id'>>({ task: 'lookupHopVariety', context: { name: query.trim() } });
    if (epoch !== requestEpoch.current) return;
    setBusy(false);
    if (!response.ok || !response.data?.found) { setError(response.error || response.data?.note || 'Aucune fiche publiée retrouvée. Tu peux saisir la variété.'); return; }
    try {
      const { found: _found, source, note, ...data } = response.data;
      const item = { ...data, id: crypto.randomUUID() };
      assertHopDocument('hopVarieties', item);
      setEditor({ kind: 'variety', value: item });
      setAiNote([note || 'Proposition documentaire. Vérifie les valeurs et leurs sources avant d’enregistrer.',
        typeof source === 'string' && source.trim() ? `Source de la recherche : ${source}` : ''].filter(Boolean).join('\n'));
    } catch (e) { setError(`Proposition non utilisable : ${(e as Error).message} La saisie manuelle reste disponible.`); }
  };
  const readCoa = async (file?: File) => {
    if (!file || editor?.kind !== 'lot' || busy) return;
    const epoch = ++requestEpoch.current;
    setBusy(true); setError('');
    const response = await AiClient.run<{ found: boolean; note?: string } & Partial<HopLot>>({ task: 'readHopCoa', file,
      context: { fileName: file.name, variety: varieties.find(v => v.id === editor.value.varietyId)?.name } });
    if (epoch !== requestEpoch.current) return;
    setBusy(false);
    if (!response.ok || !response.data?.found) { setError(response.error || response.data?.note || 'COA illisible. Les mesures peuvent être saisies à la main.'); return; }
    try {
      const { analysis, form, lotNumber, harvestYear, growingRegion, grower, storageNotes } = response.data;
      const proposal = { analysis, ...(form ? { form } : {}), ...(lotNumber ? { lotNumber } : {}), ...(harvestYear != null ? { harvestYear } : {}), ...(growingRegion ? { growingRegion } : {}), ...(grower ? { grower } : {}), ...(storageNotes ? { storageNotes } : {}) };
      assertHopDocument('hopLots', { ...editor.value, ...proposal, name: editor.value.name || 'COA à relire' });
      setCoaProposal(proposal);
      setAiNote(response.data.note || 'Transcription à relire. Les mesures déjà saisies seront conservées.');
    } catch (e) { setError(`COA à vérifier : ${(e as Error).message}`); }
  };
  const applyCoa = () => {
    if (!coaProposal || editor?.kind !== 'lot') return;
    const current = editor.value;
    setEditor({ kind: 'lot', value: { ...current,
      lotNumber: current.lotNumber || coaProposal.lotNumber, harvestYear: current.harvestYear ?? coaProposal.harvestYear,
      growingRegion: current.growingRegion || coaProposal.growingRegion, grower: current.grower || coaProposal.grower, storageNotes: current.storageNotes || coaProposal.storageNotes,
      form: current.form === 'unknown' ? coaProposal.form ?? 'unknown' : current.form,
      analysis: [...current.analysis, ...(coaProposal.analysis ?? []).filter(m => !current.analysis.some(own => own.analyte === m.analyte))]
    } }); setCoaProposal(null);
  };
  const exportIndex = () => {
    const url = URL.createObjectURL(new Blob([StorageService.exportHopIndex()], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'index-houblon.json'; a.click(); URL.revokeObjectURL(url);
  };
  const importIndex = async (file?: File) => {
    if (!file) return;
    try { const changed = await StorageService.importHopIndex(await file.text()); setError(''); onNotice?.(`${changed} fiche(s) importée(s).`); }
    catch (e) { setError((e as Error).message); }
  };

  return <section aria-label="Index houblon" className="px-1 space-y-2 sm:space-y-5">
    {!mobile&&<div className="space-y-2"><h2 className="text-xl font-semibold text-cave-50">Index houblon</h2>
      <p className="text-cave-200 max-w-2xl">Compare les sources, puis précise ton lot et son analyse.</p>
      <div className="flex flex-wrap gap-2"><BrewTag tone="info">{varieties.filter(v => !v.archived).length} références</BrewTag><BrewTag>{lots.filter(l => !l.archived).length} lots</BrewTag><BrewTag>{lots.filter(l => !l.archived && l.analysis.some(m => m.kind !== 'unknown')).length} lots analysés</BrewTag></div>
    </div>}
    <Field label={mobile?'Variété ou arôme':'Rechercher une variété ou un arôme documenté'}><TextInput value={query} onChange={setQuery} placeholder="Nom, alias, agrumes…" /></Field>
    <MobileDetails title="Options du catalogue" summary={[sourceFilter||'Toutes les sources',includeArchived?'Archives incluses':''].filter(Boolean).join(' · ')}>
    {mobile&&<p className="text-sm text-cave-400">{varieties.filter(v=>!v.archived).length} références · {lots.filter(l=>!l.archived).length} lots, dont {lots.filter(l=>!l.archived&&l.analysis.some(m=>m.kind!=='unknown')).length} analysés. Compare les sources, puis précise ton lot et son analyse.</p>}
    {sources.length > 1 && <Field label="Source du référentiel"><select className={inputClass} value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}><option value="">Toutes les sources</option>{sources.map(s => <option key={s} value={s}>{s}</option>)}</select></Field>}
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => { requestEpoch.current++; setBusy(false); setEditor({ kind: 'variety', value: newVariety(query.trim()) }); setError(''); }} intent="primary">Nouvelle variété</Button>
      {query.trim() && <Button onClick={lookup} disabled={busy || !!editor}>{busy && !editor ? 'Recherche en cours…' : 'Rechercher une fiche publiée'}</Button>}
    </div>
    <details className="text-sm text-cave-400"><summary className="cursor-pointer min-h-touch flex items-center">Import, export et archives</summary><div className="flex flex-wrap gap-2 py-2">
      <Button onClick={exportIndex}>Exporter l’index</Button>
      <label className="inline-flex items-center min-h-touch px-4 border border-cave-700 rounded-control cursor-pointer text-cave-100">Importer un index
        <input aria-label="Importer un index" type="file" accept=".json,application/json" className="sr-only" onChange={e => { importIndex(e.target.files?.[0]); e.target.value = ''; }} />
      </label>
      <label className="flex gap-2 items-center text-sm text-cave-400 min-h-touch"><input type="checkbox" checked={includeArchived} onChange={e => setIncludeArchived(e.target.checked)} />Inclure les variétés archivées</label>
    </div></details>
    </MobileDetails>
    {error && !editor && <p role="alert" className="text-alert">{error}</p>}
    <p className="text-sm text-cave-400" role="status">{matches.length} fiche(s){query ? ' correspondante(s)' : ' disponibles'}.{!mobile&&' Une variété peut avoir plusieurs sources. Le contexte de chaque description est indiqué dans sa fiche.'}</p>
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
        {matches.slice(0, limit).map(v => <button key={v.id} className={`w-full p-3 sm:p-4 text-left rounded-panel border ${selected === v.id ? 'bg-cave-850 border-ebc-straw/40' : 'border-cave-800 bg-cave-900 hover:bg-cave-850'} space-y-1 sm:space-y-2`}
          onClick={() => { setSelected(v.id); setLotId(undefined); }} aria-pressed={selected === v.id}>
          <span className="flex justify-between items-center gap-2 text-lg font-semibold text-cave-50"><span>{v.name}</span><ChevronRight size={18} className="text-cave-400 shrink-0" aria-hidden="true" /></span>
          <span className="block text-sm text-water break-words">{hopReferenceSource(v)}{v.origin ? ` · ${v.origin}` : ''}</span>
          {(!mobile||v.form!=='unknown'||!!lotCounts.get(v.id))&&<span className="flex flex-wrap gap-2">{(!mobile||v.form!=='unknown')&&<BrewTag>{HOP_FORM_LABELS[v.form]}</BrewTag>}{!!lotCounts.get(v.id) && <BrewTag tone="info">{lotCounts.get(v.id)} lot(s)</BrewTag>}</span>}
          {!mobile && v.descriptions.find(d => d.context === 'rawHop') && <span className="block text-sm text-cave-200 line-clamp-2">{v.descriptions.find(d => d.context === 'rawHop')?.text}</span>}
        </button>)}
        {!matches.length && <p className="py-5 text-cave-400">{loading ? 'Chargement du catalogue…' : catalogueError || 'Aucune variété correspondante. Ajoute une fiche ou recherche une source publiée.'}</p>}
    </div>
    {matches.length > limit && <Button onClick={() => setLimit(n => n + 20)}>Afficher les fiches suivantes</Button>}
    <Sheet open={!!variety && !editor} onClose={() => { setSelected(undefined); setLotId(undefined); }} title={variety?.name ?? 'Variété'} subtitle="Référence documentaire et analyses des lots">
      {variety && <article className="space-y-4 pb-6">
        <div className="flex justify-between items-center gap-2 flex-wrap"><div className="flex flex-wrap gap-2"><BrewTag tone="info">{HOP_FORM_LABELS[variety.form]}</BrewTag><BrewTag>{hopReferenceSource(variety)}</BrewTag></div>
          <Button onClick={() => { setEditor({ kind: 'variety', value: structuredClone(variety) }); setError(''); }}>Modifier la variété</Button></div>
        {variety.descriptions.map((d, i) => <p key={i} className="text-cave-200">{d.text}<span className="block text-sm text-cave-400">{d.source.author}, {d.source.year ?? 'année inconnue'} — {({ rawHop: 'houblon brut', infusion: 'infusion', beer: 'bière d’essai', unspecified: 'contexte non précisé' })[d.context]}</span></p>)}
        <div className="flex flex-wrap gap-2 items-end"><Field label="Lot à consulter" className="flex-1 min-w-40"><select className={inputClass} value={lotId ?? ''} onChange={e => setLotId(e.target.value || undefined)}>
          <option value="">Référence variété</option>{lots.filter(l => l.varietyId === variety.id).map(l => <option key={l.id} value={l.id}>{l.name}{l.archived ? ' (archivé)' : ''}</option>)}
        </select></Field><Button onClick={openLot}>Ajouter un lot</Button>
          {lot && <Button onClick={() => { setEditor({ kind: 'lot', value: structuredClone(lot) }); setError(''); }}>Modifier le lot</Button>}
        </div>
        {lot && <p className="text-sm text-cave-400">{lot.lotNumber || 'Numéro non renseigné'} · récolte {lot.harvestYear ?? 'inconnue'} · {HOP_FORM_LABELS[lot.form]}</p>}
        {lot?.referenceOnly && <p className="text-sm text-water"><BrewTag tone="info">Échantillon publié</BrewTag> Référence de comparaison ; aucune disponibilité en stock n’est supposée.</p>}
        {lot && <div className="space-y-1 text-sm text-cave-200"><p>{lot.growingRegion || 'Région inconnue'} · {lot.grower || 'Producteur inconnu'}</p>{lot.storageNotes && <p>Stockage : {lot.storageNotes}</p>}</div>}
        {lot?.notes && <p className="text-sm text-cave-400">{lot.notes}</p>}
        <HopFactsView lot={lot} variety={variety} />
        <HopTechnicalPanel lot={lot} variety={variety} />
      </article>}
    </Sheet>
    <Sheet open={!!editor} dismissible={!busy} onClose={() => { if (!busy) closeEditor(); }} title={editor?.kind === 'lot' ? 'Lot de houblon et COA' : 'Fiche variété de houblon'}
      subtitle="Conserve les champs absents. Les plages doivent venir de la source."
      footer={<Button full intent="primary" disabled={busy} onClick={save}>Enregistrer la fiche</Button>}>
      {editor && <fieldset disabled={busy} className="space-y-5 pb-4 min-w-0">
        {error && <p role="alert" className="text-alert">{error}</p>}
        {aiNote && <p role="status" className="text-ebc-straw">{aiNote}</p>}
        <Field label={editor.kind === 'lot' ? 'Nom du lot' : 'Nom de la variété'}><TextInput value={editor.value.name} onChange={name => setEditor({ ...editor, value: { ...editor.value, name } } as Editor)} /></Field>
        <Field label="Forme du produit"><select className={inputClass} value={editor.value.form} onChange={e => setEditor({ ...editor, value: { ...editor.value, form: e.target.value } } as Editor)}>
          {HOP_FORMS.map(f => <option key={f} value={f}>{HOP_FORM_LABELS[f]}</option>)}
        </select></Field>
        {editor.kind === 'variety' ? <>
          <HopAliasesEditor key={editor.value.id} value={editor.value.aliases} onChange={aliases => setEditor({ kind: 'variety', value: { ...editor.value, aliases } })} />
          <Field label="Origine publiée de la variété"><TextInput value={editor.value.origin ?? ''} onChange={origin => setEditor({ kind: 'variety', value: { ...editor.value, origin } })} /></Field>
          {editor.value.descriptions.map((d, i) => <div key={i} className="space-y-3 border-b border-cave-700 pb-4">
            <Field label="Description publiée"><TextInput value={d.text} onChange={text => setEditor({ kind: 'variety', value: { ...editor.value, descriptions: editor.value.descriptions.map((v, j) => i === j ? { ...v, text } : v) } })} /></Field>
            <Field label="Contexte de description"><select className={inputClass} value={d.context} onChange={e => setEditor({ kind: 'variety', value: { ...editor.value, descriptions: editor.value.descriptions.map((v, j) => i === j ? { ...v, context: e.target.value as HopDescription['context'] } : v) } })}>
              <option value="unspecified">Non précisé</option><option value="rawHop">Houblon brut</option><option value="infusion">Infusion</option><option value="beer">Bière d’essai</option>
            </select></Field>
            <HopSourceEditor value={d.source} onChange={source => setEditor({ kind: 'variety', value: { ...editor.value, descriptions: editor.value.descriptions.map((v, j) => i === j ? { ...v, source } : v) } })} />
            <Button intent="ghost" onClick={() => setEditor({ kind: 'variety', value: { ...editor.value, descriptions: editor.value.descriptions.filter((_, j) => i !== j) } })}>Retirer la description</Button>
          </div>)}
          <Button onClick={() => setEditor({ kind: 'variety', value: { ...editor.value, descriptions: [...editor.value.descriptions, { text: '', context: 'unspecified', source: blankHopSource() }] } })}>Ajouter une description sourcée</Button>
        </> : <>
          <Field label="Variété"><select className={inputClass} value={editor.value.varietyId} onChange={e => setEditor({ kind: 'lot', value: { ...editor.value, varietyId: e.target.value } })}>
            {varieties.map(v => <option key={v.id} value={v.id}>{hopReferenceLabel(v)}</option>)}
          </select></Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Numéro de lot fournisseur"><TextInput value={editor.value.lotNumber ?? ''} onChange={lotNumber => setEditor({ kind: 'lot', value: { ...editor.value, lotNumber } })} /></Field>
            <Field label="Année de récolte"><NumberInput className={inputClass} value={editor.value.harvestYear} emptyValue={undefined} integer onValue={harvestYear => setEditor({ kind: 'lot', value: { ...editor.value, harvestYear } })} /></Field>
            <Field label="Région de culture du lot"><TextInput value={editor.value.growingRegion ?? ''} onChange={growingRegion => setEditor({ kind: 'lot', value: { ...editor.value, growingRegion } })} /></Field>
            <Field label="Producteur du lot"><TextInput value={editor.value.grower ?? ''} onChange={grower => setEditor({ kind: 'lot', value: { ...editor.value, grower } })} /></Field>
          </div>
          <Field label="Stockage et conditionnement" hint="Informations connues sur ce lot. Aucune correction d’arôme automatique selon l’âge ou la région."><TextInput value={editor.value.storageNotes ?? ''} onChange={storageNotes => setEditor({ kind: 'lot', value: { ...editor.value, storageNotes } })} /></Field>
          {editor.value.referenceOnly && <p className="text-sm text-water">Cette fiche conserve un échantillon publié. Pour un lot acheté, crée une nouvelle fiche avec son propre COA.</p>}
          <label className="block border border-cave-700 rounded-control p-3 text-cave-100">{busy ? 'Lecture du COA…' : 'Lire un COA avec le compagnon'}
            <input type="file" aria-label="COA à lire" accept="image/*,application/pdf" disabled={busy} className="block mt-2 max-w-full" onChange={e => { readCoa(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
          {coaProposal && <div className="border border-cave-700 p-3 space-y-2"><p>Mesures proposées : {coaProposal.analysis?.map(m => HOP_ANALYTE_LABELS[m.analyte]).join(', ') || 'aucune'}.</p><Button onClick={applyCoa}>Compléter les champs absents avec la transcription</Button></div>}
        </>}
        <HopFactsEditor value={editor.value.analysis} sourceKind={editor.kind === 'lot' ? 'coa' : 'manufacturer'} onChange={analysis => setEditor({ ...editor, value: { ...editor.value, analysis } } as Editor)} />
        <label className="flex gap-3 items-center min-h-touch text-cave-200"><input type="checkbox" checked={editor.value.archived ?? false} onChange={e => setEditor({ ...editor, value: { ...editor.value, archived: e.target.checked } } as Editor)} />Archiver cette fiche (conserver son historique)</label>
      </fieldset>}
    </Sheet>
  </section>;
}
