import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Recipe, RecipeSnapshot } from '../../types';
import type { HopVariety } from '../../../functions/src/hopIndexSchema';
import type { HopTiming } from '../../../functions/src/hopPredictionSchema';
import { useStorageValue } from '../../hooks/useLiveData';
import { StorageService } from '../../services/storage';
import { findRecipeHopMatches, findRecipeYeastMatches, rankDocumentaryHopLeads } from '../../domain/hopIndex/recipeGuide';
import { usableHopKnowledge } from '../../domain/hopIndex/engine';
import families from '../../data/hopRecipeGuideBootstrap.json';
import { guideAxes, guideYeasts, loadGuideVarieties, ensureGuideReferences, guideRiskPolicies } from './guideData';
import { HopAromaTargetPicker } from './HopAromaTargetPicker';
import { HopField } from './HopFactsEditor';
import { HOP_TIMING_LABELS } from './presentation';
import { hopReferenceLabel } from '../../domain/hopIndex/labels';
import { inputClass } from '../FormNav';
import { NumberInput } from '../NumberInput';
import { Button } from '../../components/ui/Button';

const readKnowledge = () => StorageService.getHopKnowledge();
const readVarieties = () => StorageService.getHopVarieties();
const readLots = () => StorageService.getHopLots();
type GuideRecipe = Recipe | RecipeSnapshot;
export function HopRecipeGuide({ recipe, onChange, onChooseYeast, onBusyChange }: {
  recipe: GuideRecipe; onChange: (recipe: GuideRecipe) => void; onChooseYeast?: () => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const knowledge = useStorageValue(readKnowledge), storedVarieties = useStorageValue(readVarieties), lots = useStorageValue(readLots);
  const [catalogue, setCatalogue] = useState<HopVariety[]>([]), [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [showLeads, setShowLeads] = useState(false), [leadLimit, setLeadLimit] = useState(6);
  const [plannedTiming, setPlannedTiming] = useState<HopTiming | ''>('');
  const latest = useRef({ recipe, onChange }); latest.current = { recipe, onChange };
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    let active = true;
    loadGuideVarieties().then(rows => { if (active) setCatalogue(rows); })
      .catch(() => { if (active) setError('Le catalogue est indisponible. Tes références enregistrées restent utilisables.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; mounted.current = false; };
  }, []);
  const axes = useMemo(() => guideAxes(knowledge), [knowledge]);
  const yeasts = useMemo(() => guideYeasts(knowledge), [knowledge]);
  const varieties = useMemo(() => [...new Map([...catalogue, ...storedVarieties].map(v => [v.id, v])).values()], [catalogue, storedVarieties]);
  const target = recipe.hopAromaTarget ?? {};
  const yeastMatches = findRecipeYeastMatches(recipe.yeast?.name ?? '', yeasts);
  const selectedYeast = yeasts.find(y => y.id === recipe.yeast?.hopIndexId);
  const models = usableHopKnowledge(knowledge).valid.filter(k => k.kind === 'model');
  const leads = useMemo(() => rankDocumentaryHopLeads(varieties, Object.keys(target), families as Parameters<typeof rankDocumentaryHopLeads>[2]), [varieties, target]);
  const apply = (patch: Partial<GuideRecipe>) => { if (mounted.current) latest.current.onChange({ ...latest.current.recipe, ...patch }); };
  const run = async (action: () => Promise<void>) => {
    if (pending.current) return;
    pending.current = true;
    onBusyChange?.(true);
    setBusy(true); setError(''); setNotice('');
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : 'Modification impossible.'); }
    finally { pending.current = false; setBusy(false); onBusyChange?.(false); }
  };
  const associate = (index: number, variety: HopVariety) => run(async () => {
    const originalName = recipe.hops[index].name;
    await ensureGuideReferences({ varieties: [variety] });
    if (latest.current.recipe.hops[index]?.name !== originalName) throw Error('Le houblon a changé pendant la recherche. Sélectionne à nouveau sa référence.');
    apply({ hops: latest.current.recipe.hops.map((hop, i) => i === index ? { ...hop, hopVarietyId: variety.id, hopLotId: undefined } : hop) });
    setNotice(`Référence de ${originalName} associée. Les valeurs de la recette sont conservées.`);
  });
  const addLead = (variety: HopVariety) => run(async () => {
    if (!plannedTiming || !recipe.yeast?.name?.trim()) throw Error('Choisis la levure et le moment d’ajout pour préparer cette piste.');
    const yeastName = recipe.yeast.name;
    await ensureGuideReferences({ varieties: [variety] });
    if (latest.current.recipe.yeast?.name !== yeastName) throw Error('La levure a changé. Vérifie à nouveau cette piste.');
    const dry = plannedTiming === 'fermentation' || plannedTiming === 'postFermentation';
    apply({ hops: [...latest.current.recipe.hops, { name: variety.name, weightG: 0, alpha: 0,
      stage: dry ? 'dryHop' : plannedTiming as 'boil' | 'whirlpool' | 'firstWort', hopVarietyId: variety.id,
      ...(dry ? { aromaTiming: plannedTiming } : {}) }] });
    setNotice(`${variety.name} ajouté : renseigne sa quantité et les conditions de contact.`);
  });
  const patchHop = (index: number, patch: Partial<Recipe['hops'][number]>) => apply({ hops: recipe.hops.map((hop, i) => i === index ? { ...hop, ...patch } : hop) });
  const associateYeast = (id: string) => run(async () => {
    const item = yeasts.find(y => y.id === id);
    if (!item) { apply({ yeast: { ...latest.current.recipe.yeast, hopIndexId: undefined } }); return; }
    const name = recipe.yeast.name;
    await ensureGuideReferences({ knowledge: [item] });
    if (latest.current.recipe.yeast.name !== name) throw Error('La levure a changé. Sélectionne à nouveau sa référence.');
    apply({ yeast: { ...latest.current.recipe.yeast, hopIndexId: item.id } });
  });
  return <section aria-label="Guide aromatique de la recette" className="space-y-5 border border-cave-700 rounded-panel p-3 sm:p-4 bg-cave-900">
    <fieldset disabled={busy} className="space-y-5 min-w-0">
    <HopAromaTargetPicker axes={axes} target={target} disabled={busy} onChange={(hopAromaTarget, axis) => void run(async () => {
      if (hopAromaTarget[axis.id]) await ensureGuideReferences({ knowledge: [axis] });
      apply({ hopAromaTarget });
    })} />
    <div className="border-t border-cave-700 pt-3 space-y-2">
      <p className="font-semibold text-cave-100">Avec quelle levure ?</p>
      <p className="text-sm text-cave-200">{recipe.yeast?.name || 'La levure de la recette reste à choisir.'}</p>
      {onChooseYeast && <Button type="button" disabled={busy} onClick={onChooseYeast}>{recipe.yeast?.name ? 'Modifier la levure' : 'Choisir la levure'}</Button>}
      {selectedYeast ? <p className="text-sm text-hop">Référence associée : {selectedYeast.name}</p>
        : yeastMatches.map(({ item }) => <Button type="button" key={item.id} disabled={busy} onClick={() => void associateYeast(item.id)}>Relier {item.name}</Button>)}
      <details className="text-sm text-cave-400"><summary className="cursor-pointer min-h-touch">Choisir ou corriger la référence de levure</summary>
        <p>Sélectionne uniquement la souche réellement utilisée. Ce choix conserve le nom et la quantité de ta recette.</p>
        <HopField label="Référence de la levure"><select className={inputClass} value={recipe.yeast?.hopIndexId ?? ''} onChange={e => void associateYeast(e.target.value)}>
          <option value="">Sans association</option>{recipe.yeast?.hopIndexId && !selectedYeast && <option value={recipe.yeast.hopIndexId}>Référence enregistrée indisponible</option>}
          {yeasts.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
        </select></HopField>
      </details>
      <p className="text-sm text-cave-400">Identifier la souche ne suffit pas à connaître son rendement de biotransformation.</p>
    </div>
    {recipe.hops.length > 0 && <details className="border-t border-cave-700 pt-3" open>
      <summary className="cursor-pointer min-h-touch font-semibold text-cave-100">Préciser tes ajouts</summary>
      <div className="divide-y divide-cave-800">{recipe.hops.map((hop, index) => {
        const associated = varieties.find(v => v.id === hop.hopVarietyId);
        const matches = findRecipeHopMatches(hop.name, varieties);
        const preferred = [...new Map([...(associated ? [associated] : []), ...matches.map(m => m.item)].map(v => [v.id, v])).values()];
        const availableLots = lots.filter(l => (l.varietyId === hop.hopVarietyId && !l.referenceOnly) || l.id === hop.hopLotId);
        return <div key={index} className="py-3 space-y-3">
          <p className="font-medium text-cave-100">Ajout {index + 1} · {hop.name}</p>
          <HopField label={`Référence documentaire de l’ajout ${index + 1}`}>
            <select className={inputClass} disabled={busy || loading} value={hop.hopVarietyId ?? ''} onChange={e => {
              const choice = varieties.find(v => v.id === e.target.value);
              if (choice) void associate(index, choice); else patchHop(index, { hopVarietyId: undefined, hopLotId: undefined });
            }}><option value="">{loading ? 'Recherche des références…' : 'Choisir une référence'}</option>
              {hop.hopVarietyId && !associated && <option value={hop.hopVarietyId}>Référence enregistrée indisponible</option>}
              {preferred.map(v => <option key={v.id} value={v.id}>{hopReferenceLabel(v)}</option>)}
              <optgroup label="Autres références — choix manuel">{varieties.filter(v => !v.archived && !preferred.some(p => p.id === v.id)).map(v => <option key={v.id} value={v.id}>{hopReferenceLabel(v)}</option>)}</optgroup>
            </select>
          </HopField>
          {!loading && !matches.length && !associated && <p className="text-sm text-cave-400">Aucune correspondance exacte. Choisis manuellement la référence ou crée sa fiche dans Stocks → Houblons.</p>}
          {associated && <p className="text-sm text-cave-400">{associated.descriptions[0]?.text || 'Cette fiche ne décrit pas de profil aromatique.'}</p>}
          {(availableLots.length > 0 || hop.hopLotId) && <HopField label={`Lot de l’ajout ${index + 1}`}>
            <select className={inputClass} value={hop.hopLotId ?? ''} onChange={e => patchHop(index, { hopLotId: e.target.value || undefined })}>
              <option value="">Sans COA de lot</option>{hop.hopLotId && !availableLots.some(l => l.id === hop.hopLotId) && <option value={hop.hopLotId}>Lot enregistré indisponible</option>}
              {availableLots.map(l => <option key={l.id} value={l.id}>{l.name}{l.referenceOnly ? ' · référence documentaire' : ''}</option>)}
            </select>
          </HopField>}
          {hop.stage === 'dryHop' && <HopField label={`Phase du houblonnage à cru ${index + 1}`}>
            <select className={inputClass} value={hop.aromaTiming ?? ''} onChange={e => patchHop(index, { aromaTiming: e.target.value as HopTiming || undefined })}>
              <option value="">Phase à préciser</option><option value="fermentation">Pendant la fermentation active</option><option value="postFermentation">Après la fermentation</option>
            </select>
          </HopField>}
          {hop.stage === 'dryHop' && !hop.aromaTiming && <p className="text-sm text-cave-400">{hop.dayOffset != null ? `J+${hop.dayOffset} indique un jour, pas l’état de la fermentation.` : 'Le jour et la phase de fermentation sont deux informations différentes.'}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <HopField label={`Température de contact de l’ajout ${index + 1} (°C)`}><NumberInput className={inputClass} min={-10} max={110} value={hop.aromaTemperatureC ?? hop.tempC} emptyValue={undefined} onValue={aromaTemperatureC => patchHop(index, { aromaTemperatureC })} /></HopField>
            <HopField label={`Durée de contact de l’ajout ${index + 1} (${hop.stage === 'dryHop' ? 'h' : 'min'})`}><NumberInput className={inputClass} min={0} value={hop.stage === 'dryHop' ? hop.aromaContactHours : hop.aromaContactHours != null ? hop.aromaContactHours * 60 : hop.timeMin} emptyValue={undefined} onValue={value => patchHop(index, { aromaContactHours: value == null ? undefined : hop.stage === 'dryHop' ? value : value / 60 })} /></HopField>
          </div>
        </div>;
      })}</div>
    </details>}
    <div className="border-t border-cave-700 pt-3 space-y-3">
      <Button type="button" disabled={!Object.keys(target).length || loading} onClick={() => { setShowLeads(v => !v); setLeadLimit(6); }}>{loading ? 'Préparation des pistes…' : showLeads ? 'Masquer les pistes' : 'Trouver des houblons pour ce profil'}</Button>
      {showLeads && <>
        <p className="text-sm text-cave-200">Ces fiches mentionnent les familles choisies. Elles sont classées par nombre de familles citées, sans estimer leur intensité dans ta bière ni l’effet de la levure et du timing. Lis les descriptions avant de choisir.</p>
        <HopField label="Moment envisagé pour une nouvelle piste"><select className={inputClass} value={plannedTiming} onChange={e => setPlannedTiming(e.target.value as HopTiming | '')}>
          <option value="">Choisir le moment d’ajout</option>{(['boil', 'whirlpool', 'fermentation', 'postFermentation'] as const).map(t => <option key={t} value={t}>{HOP_TIMING_LABELS[t]}</option>)}
        </select></HopField>
        {!leads.length && <p className="text-sm text-cave-400">Aucune fiche disponible ne mentionne ces familles. Tu peux conserver l’objectif et poursuivre la recette.</p>}
        <div className="divide-y divide-cave-700">{leads.slice(0, leadLimit).map(lead => <article key={lead.variety.id} className="py-3 space-y-2">
          <h4 className="font-semibold text-cave-50">{lead.variety.name}</h4>
          <p className="text-sm text-cave-200">Avec {recipe.yeast?.name || 'une levure à choisir'} · {plannedTiming ? HOP_TIMING_LABELS[plannedTiming] : 'moment à choisir'}</p>
          <p className="text-sm text-cave-400">{lead.evidence.map(e => e.term).filter((v, i, all) => all.indexOf(v) === i).join(', ')}</p>
          <details className="text-sm text-cave-400"><summary className="cursor-pointer min-h-touch">Lire la description et sa source</summary>
            {[...new Map(lead.evidence.map(e => [e.description, e])).values()].map((e, i) => <p key={i} className="mb-2">{e.description.text} — {e.source.author}, {e.source.year ?? 'année non précisée'}. {/^https?:\/\//.test(e.source.reference) && <a className="underline text-water" href={e.source.reference} target="_blank" rel="noreferrer">Source</a>}</p>)}
          </details>
          <Button type="button" disabled={busy || !plannedTiming || !recipe.yeast?.name?.trim()} onClick={() => void addLead(lead.variety)}>Ajouter {lead.variety.name} à la recette</Button>
        </article>)}</div>
        {leads.length > leadLimit && <Button type="button" onClick={() => setLeadLimit(v => v + 6)}>Afficher d’autres pistes</Button>}
      </>}
    </div>
    {!usableHopKnowledge(knowledge).valid.some(k => k.kind === 'risk' && k.enabled) && <div className="border-t border-cave-700 pt-3 space-y-2">
      <p className="text-sm text-cave-400">Aucune règle de vigilance n’est active. L’absence d’alerte ne signifie pas l’absence de risque.</p>
      <Button type="button" onClick={() => void run(async () => { await ensureGuideReferences({ knowledge: guideRiskPolicies(knowledge) }); setNotice('Références de vigilance ajoutées. Les réglages existants sont conservés.'); })}>Ajouter les vigilances documentées manquantes</Button>
    </div>}
    {(models.length > 0 || recipe.hopMatrixId) && <details className="text-sm text-cave-400"><summary className="cursor-pointer min-h-touch">Étalonnage expérimental disponible</summary>
      <p>Choisir un protocole ne prouve pas que ta recette le reproduit. Les doses, la souche et les autres conditions restent vérifiées séparément.</p>
      <HopField label="Protocole de référence"><select className={inputClass} value={recipe.hopMatrixId ?? ''} onChange={e => apply({ hopMatrixId: e.target.value || undefined })}>
        <option value="">Aucun protocole reproduit</option>{recipe.hopMatrixId && !models.some(k => k.scope.matrixId === recipe.hopMatrixId) && <option value={recipe.hopMatrixId}>Protocole enregistré · référence indisponible</option>}{models.map(k => <option key={k.id} value={k.scope.matrixId}>{k.name}</option>)}
      </select></HopField>
    </details>}
    </fieldset>
    {busy && <p role="status" className="text-sm text-cave-400">Enregistrement des références…</p>}
    {notice && <p role="status" className="text-sm text-hop">{notice}</p>}
    {error && <p role="alert" className="text-sm text-alert">{error}</p>}
  </section>;
}
