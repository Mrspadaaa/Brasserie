import React, { useState } from 'react';
import { HopKnowledge, HopModel, assertHopKnowledge } from '../../../functions/src/hopPredictionSchema';
import { HopSource } from '../../../functions/src/hopIndexSchema';
import bootstrap from '../../data/hopKnowledgeBootstrap.json';
import studyPack from '../../data/hopStudyBootstrap.json';
import researchNotes from '../../data/hopResearchBootstrap.json';
import studiedYeasts from '../../data/hopYeastBootstrap.json';
import trialPack from '../../data/hopTrialBootstrap.json';
import technicalNotes from '../../data/hopTechnicalBootstrap.json';
import extrapolationPack from '../../data/hopExtrapolationBootstrap.json';
import fermentationPack from '../../data/fermentationGuideBootstrap.json';
import fermentationSciencePack from '../../data/fermentationScienceBootstrap.json';
import noloPack from '../../data/noloBootstrap.json';
import stylePack from '../../data/brewingStylesBootstrap.json';
import { FermentationScienceLibrary } from '../FermentationSciencePanel';
import { guideFermentationScience } from './guideData';
import { ensureGuideReferences, guideYeasts } from './guideData';
import catalogueLicenses from '../../data/hop-catalogue-LICENSES.txt?url';
import { StorageService } from '../../services/storage';
import { useStorageValue } from '../../hooks/useLiveData';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../Sheet';
import { TextInput, inputClass } from '../FormNav';
import { HopField, HopSourceEditor } from './HopFactsEditor';
import { HOP_TIMINGS } from '../../../functions/src/hopPredictionSchema';
import { HOP_TIMING_LABELS } from './presentation';
import { NumberInput } from '../NumberInput';
import { usableHopKnowledge } from '../../domain/hopIndex/engine';
import { BrewTag } from '../BrewTag';
import { hopReferenceLabel } from '../../domain/hopIndex/labels';
import { YeastCataloguePanel } from '../YeastCataloguePanel';

const localSource = (): HopSource => ({ title: '', author: 'L’Affinée', year: new Date().getFullYear(), reference: '', kind: 'observation' });
const blankRange = () => ({ min: undefined as number, max: undefined as number });
function RangeFields({ label, value, onChange }: { label: string; value: { min: number; max: number }; onChange: (v: { min: number; max: number }) => void }) {
  return <fieldset className="grid grid-cols-2 gap-3"><legend className="text-sm text-cave-400 mb-1">{label}</legend>
    <HopField label={`${label} — minimum`}><NumberInput className={inputClass} value={value?.min} emptyValue={undefined} onValue={min => onChange({ ...value, min })} /></HopField>
    <HopField label={`${label} — maximum`}><NumberInput className={inputClass} value={value?.max} emptyValue={undefined} onValue={max => onChange({ ...value, max })} /></HopField>
  </fieldset>;
}
export function HopKnowledgePanel() {
  const knowledge = useStorageValue(StorageService.getHopKnowledge), varieties = useStorageValue(StorageService.getHopVarieties);
  const [draft, setDraft] = useState<HopKnowledge | null>(null), [json, setJson] = useState<string | null>(null), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [loadingCatalogue, setLoadingCatalogue] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [recordQuery,setRecordQuery] = useState('');
  const usable = usableHopKnowledge(knowledge);
  const axes = usable.valid.filter(k => k.kind === 'axis'), yeasts = usable.valid.filter(k => k.kind === 'yeast');
  const save = () => {
    try {
      const value = json !== null ? JSON.parse(json) : draft;
      assertHopKnowledge(value); StorageService.saveHopKnowledge(value); setDraft(null); setJson(null); setError('');
    } catch (e) { setError((e as Error).message); }
  };
  const install = () => {
    try {
      bootstrap.forEach(item => assertHopKnowledge(item));
      bootstrap.filter(item => !knowledge.some(k => k.id === item.id)).forEach(item => StorageService.saveHopKnowledge(item as HopKnowledge)); setError('');
    } catch (e) { setError((e as Error).message); }
  };
  const installPack = async (pack: Record<string, { id: string }[]>) => {
    setInstalling(true);
    try {
      const present = Object.fromEntries(Object.entries({ hopVarieties: StorageService.getHopVarieties(), hopLots: StorageService.getHopLots(), hopKnowledge: StorageService.getHopKnowledge(), hopPredictions: StorageService.getHopPredictions(), hopTastings: StorageService.getHopTastings() }).map(([name, rows]) => [name, new Set(rows.map(row => row.id))]));
      const collections = Object.fromEntries(Object.entries(pack).map(([name, rows]) => [name,
        rows.filter(row => !present[name]?.has(row.id)).map(data => ({ id: data.id, data }))]));
      const count = await StorageService.importHopIndex(JSON.stringify({ schemaVersion: 3, source: 'device', exportedAt: new Date().toISOString(), collections }));
      setError(''); setNotice(`${count} fiche(s) ajoutée(s). Les fiches existantes sont conservées.`);
    } catch (e) { setError((e as Error).message); }
    finally { setInstalling(false); }
  };
  const installCatalogue = async () => {
    setLoadingCatalogue(true);
    try { await installPack((await import('../../data/hopManufacturerBootstrap.json')).default); }
    catch (e) { setError((e as Error).message); }
    finally { setLoadingCatalogue(false); }
  };
  const installCommunity = async (which: 'database' | 'legacy' | 'maverick') => {
    setLoadingCatalogue(true);
    try {
      const pack = which === 'database' ? await import('../../data/hopDatabaseBootstrap.json') : which === 'legacy' ? await import('../../data/hopLegacyBootstrap.json') : await import('../../data/hopBeerMaverickBootstrap.json');
      await installPack(pack.default);
    } catch (e) { setError((e as Error).message); }
    finally { setLoadingCatalogue(false); }
  };
  const newModel = (): HopModel => ({ id: crypto.randomUUID(), kind: 'model', name: '', version: '1', enabled: false, source: localSource(), confidence: 'low',
    scope: { varietyId: '', yeastId: '', timing: 'fermentation', form: 'pelletT90', doseGL: blankRange(), temperatureC: blankRange(), contactHours: blankRange(), matrixId: '', notes: '' }, outputs: [] });
  const edit = (value: HopKnowledge, raw = false) => { setDraft(structuredClone(value)); setJson(raw ? JSON.stringify(value, null, 2) : null); setError(''); };
  return <section className="space-y-4" aria-label="Connaissances du houblon">
    <h2 className="text-xl text-cave-50 font-semibold">Sources et modèles</h2>
    <details className="border border-cave-700 rounded-control p-3"><summary className="cursor-pointer min-h-touch text-ebc-straw">Catalogue complet des levures · fiches et sources</summary><div className="pt-3"><YeastCataloguePanel/></div></details>
    <p className="text-cave-200">Les axes, plages, seuils et pondérations sont enregistrés dans l’index. Une révision prend effet au prochain calcul ; les prédictions figées restent consultables.</p>
    <div className="flex flex-wrap gap-2">
      <Button disabled={installing || loadingCatalogue} onClick={install}>Installer les conventions initiales manquantes</Button>
      <Button onClick={() => edit({ id: crypto.randomUUID(), kind: 'yeast', name: '', betaLyase: 'unknown', source: localSource() })}>Ajouter une levure</Button>
      <Button onClick={() => edit(newModel())}>Documenter un modèle</Button>
    </div>
    <p className="text-sm text-cave-400">L’installation propose 12 familles aromatiques et des règles de vigilance, sans inventer de rendement ni de profil sensoriel. Les classes et l’importance égale des axes sont des conventions locales documentées.</p>
    <a className="inline-block text-sm text-cave-400 underline" href={catalogueLicenses} download="licences-referentiels-houblon.txt">Attributions et licences des référentiels GitHub</a>
    <details className="border border-cave-700 rounded-control p-3 space-y-3"><summary className="cursor-pointer text-cave-100">Étude disponible · Cascade × Wyeast 1728</summary>
      <p className="text-sm text-cave-200">29 lots publiés par Lafontaine et al. (2018), cônes après fermentation en bière clarifiée. Régression reconstruite, incertitude empirique et confiance faible. Elle décrit l’axe Agrumes du panel de cette étude ; son transfert à un nouveau lot reste exploratoire.</p>
      <p className="text-sm text-cave-400">Le protocole et ses limites seront visibles dans la recherche. Le lexique et les vigilances initiales sont inclus ; les fiches déjà présentes sont conservées.</p>
      <Button disabled={installing || loadingCatalogue} onClick={() => installPack({ ...studyPack, hopKnowledge: [...bootstrap, ...studyPack.hopKnowledge] })}>Ajouter l’étude Cascade documentée</Button>
    </details>
    <details className="border border-cave-700 rounded-control p-3 space-y-3"><summary className="cursor-pointer text-cave-100">Catalogue fabricant · Hopsteiner</summary>
      <p className="text-sm text-cave-200">Fiches publiques avec leur date de mise à jour : plages analytiques et descripteurs du houblon brut. La forme commerciale reste non précisée. Ces données documentaires ne donnent aucun score aromatique en bière.</p>
      <Button disabled={loadingCatalogue || installing} onClick={installCatalogue}>{loadingCatalogue ? 'Chargement…' : 'Ajouter les fiches Hopsteiner manquantes'}</Button>
    </details>
    <details className="border border-cave-700 rounded-control p-3 space-y-3"><summary className="cursor-pointer text-cave-100">Autres référentiels · comparer les sources</summary><p className="text-sm text-cave-200">Les références communautaires restent séparées. Une même variété peut avoir plusieurs fiches ; les unités ou années absentes ne sont pas devinées.</p><div className="flex flex-wrap gap-2"><Button disabled={installing || loadingCatalogue} onClick={() => installCommunity('database')}>Ajouter HopDatabase</Button><Button disabled={installing || loadingCatalogue} onClick={() => installCommunity('legacy')}>Ajouter hops-json</Button><Button disabled={installing || loadingCatalogue} onClick={() => installCommunity('maverick')}>Ajouter Beer Maverick</Button></div></details>
    <details className="border border-cave-700 rounded-control p-3 space-y-3"><summary className="cursor-pointer text-cave-100">Analyses de lots publiées · comparer les récoltes</summary><p className="text-sm text-cave-200">Neuf COA publics et un échantillon de recherche : valeurs mesurées, HSI, unités et origines documentées. Ces échantillons restent des références de comparaison ; ils ne deviennent pas des lots disponibles à la brasserie.</p><Button disabled={installing || loadingCatalogue} onClick={async () => { setLoadingCatalogue(true); try { await installPack((await import('../../data/hopPublicLotBootstrap.json')).default); } catch (e) { setError((e as Error).message); } finally { setLoadingCatalogue(false); } }}>Ajouter les analyses de lots publiées</Button></details>
    <details className="border border-cave-700 rounded-control p-3 space-y-3"><summary className="cursor-pointer text-cave-100">Bibliothèque scientifique · comprendre les limites</summary><p className="text-sm text-cave-200">Thiols, esters, lactones, levures, perception et stockage. Articles, ouvrages, documents fabricants et retours de brasseurs gardent leur provenance et leurs limites. Le compagnon peut les consulter ; aucune note ne crée de coefficient.</p><Button disabled={installing || loadingCatalogue} onClick={() => installPack({ hopKnowledge: researchNotes })}>Ajouter les notes sourcées</Button><p className="text-sm text-cave-400">Cinq souches LalBrew étudiées en fermentation et la fiche fabricant SafAle US-05 peuvent aussi être référencées. Ces six références n’établissent pas de rendement générique par souche.</p><Button disabled={installing || loadingCatalogue} onClick={() => installPack({ hopKnowledge: studiedYeasts })}>Ajouter les levures documentées</Button></details>
    <details className="border border-ebc-straw/30 rounded-control p-3 space-y-3"><summary className="cursor-pointer min-h-touch text-ebc-straw">Levures et conduites de fermentation</summary>
      <p className="text-sm text-cave-200">Banane, fruits, profil net, phénols et thiols. Fenêtres fabricant, paliers proposés et modèle local DM303 ; chaque connaissance garde ses sources et ses limites.</p>
      <Button disabled={installing} onClick={async () => {
        setInstalling(true); setError('');
        try {
          const pack = [...fermentationPack, ...fermentationSciencePack];
          const ids = new Set(pack.filter(k => k.kind === 'fermentation').map(k => (k as any).yeastId));
          const yeasts = guideYeasts([]).filter(y => ids.has(y.id)).map(({ aliases: _, ...y }) => y);
          await ensureGuideReferences({ knowledge: [...pack as HopKnowledge[], ...yeasts] });
          setNotice('Guides de fermentation enregistrés. Les révisions déjà présentes sont conservées.');
        } catch (e) { setError((e as Error).message); } finally { setInstalling(false); }
      }}>Enregistrer les guides de fermentation modifiables</Button>
      <FermentationScienceLibrary science={guideFermentationScience(knowledge)[0]} />
    </details>
    <details className="border border-cave-700 rounded-control p-3"><summary className="min-h-touch cursor-pointer text-water">Styles étendus et NOLO</summary><p className="text-sm text-cave-400">Référentiels datés et procédés modifiables. Les corrections personnelles sont conservées.</p><Button disabled={installing} onClick={()=>installPack({hopKnowledge:[...stylePack,...noloPack]})}>Enregistrer les références styles et NOLO</Button></details>
    {installing && <p role="status" className="text-cave-200">Import en cours…</p>}
    {notice && <p role="status" className="text-cave-200">{notice}</p>}
    {usable.errors.length > 0 && <p className="text-ebc-straw">{usable.errors.length} connaissance(s) incomplète(s) : ignorées par le calcul, corrigeables dans l’édition avancée.</p>}
    <details className="border border-hop/30 rounded-control p-3 space-y-3"><summary className="cursor-pointer min-h-touch text-hop">Modèle expérimental · combinaisons libres</summary><p className="text-sm text-cave-400">Descripteurs, dose, timing et profil fermentaire alimentent un indice exploratoire avec des plages d’hypothèses. Tous les paramètres sont des jugements datés, distincts des résultats publiés. Aucune couverture statistique n’est encore validée.</p><Button disabled={installing} onClick={() => installPack({ hopKnowledge: [...bootstrap, ...studiedYeasts, ...extrapolationPack] })}>Enregistrer le modèle expérimental modifiable</Button><p className="text-xs text-cave-400">Édite ensuite sa fiche JSON et change sa version. Désactiver la fiche désactive immédiatement l’extrapolation. Les prédictions déjà conservées gardent leurs paramètres.</p></details>
    {error && !draft && <p role="alert" className="text-alert">{error}</p>}
    <details className="border border-cave-700 rounded-control p-3 space-y-3"><summary className="cursor-pointer min-h-touch text-cave-100">Programmes de l’atelier et informations techniques</summary><p className="text-sm text-cave-400">Les programmes sont consultables immédiatement dans l’atelier. Les enregistrer permet de les réviser ici, avec leurs conditions, résultats et sources. Un essai ne devient pas un modèle de prédiction.</p><Button disabled={installing} onClick={() => installPack({ hopVarieties: trialPack.hopVarieties, hopKnowledge: [...trialPack.hopKnowledge, ...technicalNotes] })}>Enregistrer les programmes et notes techniques</Button></details>
    <label className="block text-sm text-cave-200">Rechercher une fiche à modifier<input className={`${inputClass} mt-1`} value={recordQuery} onChange={e=>setRecordQuery(e.target.value)} placeholder="Nom ou identifiant de la connaissance"/></label>
    <p className="text-xs text-cave-400">Les fiches du catalogue se consultent ci-dessus. Recherche leur nom pour modifier leurs données ; 50 fiches affichées au maximum.</p>
    <div className="divide-y divide-cave-700">{knowledge.filter(k=>recordQuery ? `${k.name} ${k.id}`.toLowerCase().includes(recordQuery.toLowerCase()) : k.kind!=='yeast'||!k.catalogue).slice(0,50).map(k => <div key={k.id} className="py-3 flex items-start justify-between gap-3"><div className="min-w-0 space-y-2"><p className="text-cave-100 font-semibold">{k.name || 'Fiche incomplète'}</p><p className="text-sm text-cave-400">{({ axis: 'Axe', yeast: 'Levure', model: 'Modèle', risk: 'Vigilance', confidence: 'Fiabilité', note: 'Note documentaire', trial: 'Essai de brassage', extrapolation: 'Modèle expérimental', solver: 'Guide de formulation', fermentation: 'Guide de fermentation', fermentationScience: 'Science de fermentation', styleGuide:'Styles de bière', noloScience:'Procédés NOLO' })[k.kind]} · {k.source?.author || 'Source manquante'}, {k.source?.year ?? 'année inconnue'}{k.kind === 'model' ? ` · ${k.enabled ? 'actif' : 'désactivé'} · version ${k.version}` : ''}</p>{k.kind === 'note' && <details><summary className="cursor-pointer min-h-touch flex items-center text-sm text-water">Lire les résultats et leurs limites</summary><div className="space-y-2"><div className="flex flex-wrap gap-2">{k.topics.map(t => <BrewTag tone="info" key={t}>{t}</BrewTag>)}</div><p className="text-cave-200 text-sm">{k.summary}</p><p className="text-cave-400 text-sm">{k.limitation}</p><a className="text-sm underline text-water break-words" href={/^https?:\/\//i.test(k.source.reference) ? k.source.reference : undefined} target="_blank" rel="noreferrer">Consulter la publication</a></div></details>}</div>
      <Button onClick={() => edit(k, !usable.valid.includes(k) || !['yeast', 'model'].includes(k.kind) || (k.kind === 'yeast' && !!k.catalogue))}>Modifier</Button></div>)}</div>
    <Sheet open={!!draft} onClose={() => { setDraft(null); setJson(null); setError(''); }} title={draft?.kind === 'yeast' ? 'Levure documentée' : draft?.kind === 'model' ? 'Modèle aromatique documenté' : 'Réviser une connaissance'} footer={<Button full intent="primary" onClick={save}>Enregistrer la connaissance</Button>}>
      {draft && <div className="space-y-4 pb-4">
        {error && <p role="alert" className="text-alert">{error}</p>}
        {json !== null ? <HopField label="Document de connaissance" hint="Édition avancée des paramètres et de leur provenance. Les modèles et axes modifiés exigent une nouvelle version."><textarea className={`${inputClass} font-mono text-sm min-h-96 py-3`} value={json} onChange={e => setJson(e.target.value)} /></HopField> : <>
          <HopField label="Nom"><TextInput value={draft.name} onChange={name => setDraft({ ...draft, name })} /></HopField>
          <HopSourceEditor value={draft.source} onChange={source => setDraft({ ...draft, source })} />
          {draft.kind === 'yeast' && <HopField label="Forme documentée de la levure"><select className={inputClass} value={draft.form ?? ''} onChange={e => setDraft({ ...draft, form: (e.target.value || undefined) as 'sèche' | 'liquide' | 'levain' })}><option value="">Non documentée</option><option value="sèche">Sèche</option><option value="liquide">Liquide</option><option value="levain">Levain</option></select></HopField>}
          {draft.kind === 'yeast' && <HopField label="Capacité β-lyase documentée"><select className={inputClass} value={draft.betaLyase} onChange={e => setDraft({ ...draft, betaLyase: e.target.value as any })}><option value="unknown">Inconnue</option><option value="positive">Positive dans la source citée</option><option value="negative">Négative dans la source citée</option></select></HopField>}
          {draft.kind === 'model' && <>
            <p className="text-sm text-cave-400">Décrire une enveloppe sensorielle effectivement observée pour ce triplet. Les modèles d’étalonnage avec coefficients et résidu se saisissent dans l’édition avancée ; aucun coefficient automatique n’est proposé.</p>
            <HopField label="Version"><TextInput value={draft.version} onChange={version => setDraft({ ...draft, version })} /></HopField>
            <HopField label="Variété étudiée"><select className={inputClass} value={draft.scope.varietyId} onChange={e => setDraft({ ...draft, scope: { ...draft.scope, varietyId: e.target.value } })}><option value="">Choisir</option>{varieties.map(v => <option key={v.id} value={v.id}>{hopReferenceLabel(v)}</option>)}</select></HopField>
            <HopField label="Levure étudiée"><select className={inputClass} value={draft.scope.yeastId} onChange={e => setDraft({ ...draft, scope: { ...draft.scope, yeastId: e.target.value } })}><option value="">Choisir</option>{yeasts.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></HopField>
            <HopField label="Timing étudié"><select className={inputClass} value={draft.scope.timing} onChange={e => setDraft({ ...draft, scope: { ...draft.scope, timing: e.target.value as any } })}>{HOP_TIMINGS.map(t => <option key={t} value={t}>{HOP_TIMING_LABELS[t]}</option>)}</select></HopField>
            <HopField label="Forme étudiée"><select className={inputClass} value={draft.scope.form} onChange={e => setDraft({ ...draft, scope: { ...draft.scope, form: e.target.value as any } })}>{['pelletT90', 'pelletT45', 'cryo', 'cone', 'extract'].map(v => <option key={v} value={v}>{v}</option>)}</select></HopField>
            <HopField label="Référence du contexte"><TextInput value={draft.scope.matrixId} onChange={matrixId => setDraft({ ...draft, scope: { ...draft.scope, matrixId } })} /></HopField>
            <HopField label="Matrice et limites de l’étude"><textarea className={`${inputClass} py-2`} value={draft.scope.notes} onChange={e => setDraft({ ...draft, scope: { ...draft.scope, notes: e.target.value } })} /></HopField>
            <RangeFields label="Dose étudiée (g/L)" value={draft.scope.doseGL} onChange={doseGL => setDraft({ ...draft, scope: { ...draft.scope, doseGL } })} />
            <RangeFields label="Température étudiée (°C)" value={draft.scope.temperatureC} onChange={temperatureC => setDraft({ ...draft, scope: { ...draft.scope, temperatureC } })} />
            <RangeFields label="Contact étudié (h)" value={draft.scope.contactHours} onChange={contactHours => setDraft({ ...draft, scope: { ...draft.scope, contactHours } })} />
            {draft.outputs.map((o, i) => <fieldset key={i} className="border border-cave-700 p-3 space-y-3"><legend className="text-cave-100">{axes.find(a => `axis:${a.id}` === o.target)?.name || o.target}</legend>
              {o.envelope && <><RangeFields label="Intensité observée" value={o.envelope.range} onChange={range => setDraft({ ...draft, outputs: draft.outputs.map((v, j) => j === i ? { ...v, envelope: { ...v.envelope, range } } : v) })} /><HopSourceEditor value={o.envelope.source} onChange={source => setDraft({ ...draft, outputs: draft.outputs.map((v, j) => j === i ? { ...v, envelope: { ...v.envelope, source } } : v) })} /></>}
              {o.calibration && <p className="text-sm text-cave-400">Étalonnage présent. Ses coefficients se modifient dans l’édition avancée.</p>}
              <Button intent="ghost" onClick={() => setDraft({ ...draft, outputs: draft.outputs.filter((_, j) => j !== i) })}>Retirer cet axe</Button>
            </fieldset>)}
            <HopField label="Ajouter un axe observé"><select className={inputClass} value="" onChange={e => { const axis = axes.find(a => a.id === e.target.value); if (axis) setDraft({ ...draft, outputs: [...draft.outputs, { target: `axis:${axis.id}`, axisVersion: axis.version, envelope: { range: blankRange(), source: { ...draft.source } } }] }); }}><option value="">Choisir</option>{axes.filter(a => !draft.outputs.some(o => o.target === `axis:${a.id}`)).map(a => <option key={a.id} value={a.id}>{a.name} ({a.scale.min}–{a.scale.max})</option>)}</select></HopField>
            <label className="flex items-center gap-2 min-h-touch text-cave-100"><input type="checkbox" checked={draft.enabled} onChange={e => setDraft({ ...draft, enabled: e.target.checked })} />Activer ce modèle pour son domaine documenté</label>
          </>}
          <Button onClick={() => setJson(JSON.stringify(draft, null, 2))}>Édition avancée des paramètres sourcés</Button>
        </>}
      </div>}
    </Sheet>
  </section>;
}
