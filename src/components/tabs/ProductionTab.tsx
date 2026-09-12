import React, { useState, useEffect, useMemo } from 'react';
import { isCurrent } from '../../domain/catalogOrganization';
import { Batch, Recipe, BrewhouseProfile, TimeFilterPeriod } from '../../types';
import { StorageService } from '../../services/storage';
import { BatchDetailSheet } from '../../ui/BatchDetailSheet';
import { useLiveSelection } from '../../hooks/useLiveData';
import { scaleBrewRecipeScenario } from '../../domain/finance/brewBudgetScaling';
import { CreativeLabTab, type CreativeLabSectionRequest } from '../CreativeLabTab';
import { describeMoment } from '../../domain/hopStage';
import { Units } from '../../services/units';
import { ProductionCatalog } from '../../ui/production/ProductionCatalog';
import type { BatchDetailSection } from '../../domain/productionInsights';
import { QuantityStepper } from '../../ui/QuantityStepper';
import { parseDecimal } from '../../ui/numericInput';
import '../../ui/production/compact.css';
import { ViewNavigation } from '../../ui/ViewNavigation';

interface ProductionTabProps {
  batches: Batch[];
  recipes: Recipe[];
  brewhouses: BrewhouseProfile[];
  activeBrewhouseId: string;
  globalTimeFilter: TimeFilterPeriod;
  targetSubTab?: 'batches' | 'recipes' | 'lab' | 'scaler';
  onOpenCreateBatch: () => void;
  onOpenQuickAction: () => void;
  /** Remonte le sous-onglet courant : le bouton d'action en dépend. */
  onSubTabChange?: (sub: string) => void;
  /** Demande de création émise par le bouton d'action. */
  createRequest?: { kind: string; at: number } | null;
  onCreateRequestHandled?: () => void;
  /** Ouvre un brassin précis, même hors de la période du catalogue. */
  openBatchRequest?: { id: string; at: number } | null;
  onOpenBatchRequestHandled?: () => void;
  openLabSectionRequest?: CreativeLabSectionRequest | null;
  onOpenLabSectionRequestHandled?: () => void;
  /** Ouvre la fiche recette en plein écran. */
  onOpenRecipe: (recipe: Recipe) => void;
  onEditRecipe?: (recipe: Recipe) => void;
  /** Ouvre le déroulé minuté du jour de brassage. */
  onOpenBrewDay: (batch: Batch) => void;
  /** Ouvre l'assistant de recette, prérempli depuis une idée du labo. */
  onDraftRecipe: (seed: { title: string; description?: string }) => void;
  onSuccessMessage?: (msg: string) => void;
}

export const ProductionTab: React.FC<ProductionTabProps> = ({
  batches,
  recipes,
  brewhouses,
  activeBrewhouseId,
  globalTimeFilter,
  targetSubTab,
  onOpenCreateBatch,
  onOpenQuickAction,
  onSubTabChange,
  createRequest,
  onCreateRequestHandled,
  openBatchRequest,
  onOpenBatchRequestHandled,
  openLabSectionRequest,
  onOpenLabSectionRequestHandled,
  onOpenRecipe,
  onEditRecipe,
  onOpenBrewDay,
  onDraftRecipe,
  onSuccessMessage
}) => {
  // Persistent sub-navigation
  const [subTab, setSubTab] = useState<'batches' | 'recipes' | 'lab' | 'scaler'>(() =>
    targetSubTab || StorageService.getUiState('production_subtab', 'batches')
  );

  // Peut être indéfini : au tout premier lancement la base est vide, et il n'y
  // a alors aucune recette à mettre à l'échelle.
  const currentRecipes = useMemo(() => recipes.filter(isCurrent), [recipes]);
  const [selectedRecipeToScale, setSelectedRecipeToScale] = useLiveSelection(currentRecipes, 'id');

  // Dès qu'une première recette arrive (synchronisation Firestore), on la
  // sélectionne pour que le calculateur cesse d'être vide.
  useEffect(() => {
    if (!selectedRecipeToScale && currentRecipes.length > 0) {
      setSelectedRecipeToScale(currentRecipes[0]);
    }
  }, [currentRecipes, selectedRecipeToScale]);
  const [targetVolumeL, setTargetVolumeL] = useState<number>(30); // Default 30L
  const [invalidTargetVolume, setInvalidTargetVolume] = useState<string>();
  const [detailBatch, setDetailBatch] = useLiveSelection(batches, 'id');
  const [detailSection, setDetailSection] = useState<BatchDetailSection>('measurements');
  const handledOpenBatchRequest = React.useRef<{ id: string; at: number } | null>(null);

  useEffect(() => {
    if (targetSubTab) {
      setSubTab(targetSubTab);
    }
  }, [targetSubTab]);

  // Le bouton d'action doit savoir où l'on est : il crée ce que l'écran montre.
  useEffect(() => {
    onSubTabChange?.(subTab);
  }, [subTab, onSubTabChange]);

  /** Demande de création venue du bouton d'action. */
  useEffect(() => {
    if (!createRequest) return;
    if (createRequest.kind === 'newBatch' || createRequest.kind === 'newRecipe') {
      onOpenCreateBatch();
      onCreateRequestHandled?.();
    }
  }, [createRequest?.at]);

  useEffect(() => {
    if (!openBatchRequest) return;
    const handled = handledOpenBatchRequest.current;
    if (handled?.id === openBatchRequest.id && handled.at === openBatchRequest.at) return;
    // Le filtre reste celui du catalogue. La fiche suit toujours le brassin vivant.
    const batch = batches.find((item) => item.id === openBatchRequest.id);
    if (!batch) return;
    handledOpenBatchRequest.current = openBatchRequest;
    setSubTab('batches');
    setDetailSection('measurements');
    setDetailBatch(batch);
    onOpenBatchRequestHandled?.();
  }, [openBatchRequest, batches, setDetailBatch, onOpenBatchRequestHandled]);

  useEffect(() => {
    StorageService.setUiState('production_subtab', subTab);
  }, [subTab]);

  const sourceBh = selectedRecipeToScale?.brewhouse ?? brewhouses.find((b) => b.id === activeBrewhouseId) ?? brewhouses[0];
  const targetBh = targetVolumeL >= 250 ? (brewhouses.find((b) => b.volumeL >= 250) || sourceBh) : sourceBh;
  const targetVolumeError = invalidTargetVolume
    ? `Volume « ${invalidTargetVolume} » non reconnu. Indique un volume cible de 0,5 L ou plus.`
    : !Number.isFinite(targetVolumeL) || targetVolumeL < 0.5 ? 'Indique un volume cible de 0,5 L ou plus.' : undefined;
  // Sans recette ni cuverie configurée, on ne calcule rien plutôt que de planter.
  const scaleResult =
    subTab === 'scaler' && selectedRecipeToScale?.volumeL > 0 && Number.isFinite(selectedRecipeToScale.volumeL) && sourceBh && !targetVolumeError
      ? scaleBrewRecipeScenario(selectedRecipeToScale, targetVolumeL, sourceBh, targetBh)
      : null;

  return (
    <div className="production-screen space-y-2 pb-12 pt-1">
      <ViewNavigation<typeof subTab> label="Vue de production" value={subTab} onChange={setSubTab} options={[
        {value:'batches',label:`Brassins (${batches.filter(isCurrent).length})`,shortLabel:'Brassins'},
        {value:'recipes',label:`Recettes (${currentRecipes.length})`,shortLabel:'Recettes'},
        {value:'lab',label:'Atelier R&D',shortLabel:'Atelier'}, {value:'scaler',label:'Adapter les volumes',shortLabel:'Volumes'}
      ]}>
      <div role="group" aria-label="Atelier de brassage" className="grid grid-cols-4 gap-1 bg-cave-900 p-1 rounded-2xl border border-cave-800">
        <button
          type="button"
          aria-pressed={subTab === 'batches'}
          aria-label={`Brassins (${batches.filter(isCurrent).length})`}
          onClick={() => setSubTab('batches')}
          className={`min-h-touch min-w-0 px-1 py-2 text-sm font-semibold rounded-xl transition ${
            subTab === 'batches' ? 'bg-ebc-straw text-cave-950 shadow' : 'text-cave-400 hover:text-cave-200'
          }`}
        >
          Brassins<span className="hidden sm:inline"> ({batches.filter(isCurrent).length})</span>
        </button>
        <button
          type="button"
          aria-pressed={subTab === 'recipes'}
          aria-label={`Recettes (${currentRecipes.length})`}
          onClick={() => setSubTab('recipes')}
          className={`min-h-touch min-w-0 px-1 py-2 text-sm font-semibold rounded-xl transition ${
            subTab === 'recipes' ? 'bg-ebc-straw text-cave-950 shadow' : 'text-cave-400 hover:text-cave-200'
          }`}
        >
          Recettes<span className="hidden sm:inline"> ({currentRecipes.length})</span>
        </button>
        <button
          type="button"
          aria-pressed={subTab === 'lab'}
          onClick={() => setSubTab('lab')}
          className={`min-h-touch min-w-0 px-1 py-2 text-sm font-semibold rounded-xl transition ${
            subTab === 'lab' ? 'bg-ebc-straw text-cave-950 shadow' : 'text-cave-400 hover:text-cave-200'
          }`}
        >
          Atelier R&D
        </button>
        <button
          type="button"
          aria-pressed={subTab === 'scaler'}
          onClick={() => setSubTab('scaler')}
          className={`min-h-touch min-w-0 px-1 py-2 text-sm font-semibold rounded-xl transition ${
            subTab === 'scaler' ? 'bg-ebc-straw text-cave-950 shadow' : 'text-cave-400 hover:text-cave-200'
          }`}
        >
          Volumes
        </button>
      </div>

      </ViewNavigation>

      {(subTab === 'batches' || subTab === 'recipes') && <>
        <h2 className="sr-only">{subTab === 'recipes' ? 'Le carnet de recettes' : 'Les brassins'}</h2>
        <ProductionCatalog key={subTab} kind={subTab} recipes={recipes} batches={batches} globalTimeFilter={globalTimeFilter}
          onCreate={onOpenCreateBatch}
          onOpenRecipe={onOpenRecipe} onEditRecipe={onEditRecipe ?? onOpenRecipe} onOpenBatch={(batch, section = 'measurements') => { setDetailSection(section); setDetailBatch(batch); }} onOpenBrewDay={onOpenBrewDay} />
      </>}

      {/* 4. SUBTAB: CREATIVE LAB (ATELIER R&D DE LA BRASSERIE) */}
      {subTab === 'lab' && (
        <CreativeLabTab
          onSuccessMessage={onSuccessMessage}
          onDraftRecipe={onDraftRecipe}
          createRequest={createRequest}
          onCreateRequestHandled={onCreateRequestHandled}
          openSectionRequest={openLabSectionRequest}
          onOpenSectionRequestHandled={onOpenLabSectionRequestHandled}
        />
      )}

      {subTab === 'scaler' && !selectedRecipeToScale && (
        <div className="panel p-2 space-y-2">
          <h3 className="font-semibold text-sm text-cave-50">Aucune recette à adapter</h3>
          <p className="text-sm text-cave-400">Crée une recette pour adapter ses ingrédients et son eau au volume voulu.</p>
          <button type="button" onClick={onOpenCreateBatch} className="min-h-touch-lg px-2 rounded-control bg-ebc-straw text-cave-950 text-sm">Créer une recette</button>
        </div>
      )}
      {subTab === 'scaler' && selectedRecipeToScale && (
        <section className="panel p-2 space-y-2" aria-label="Adapter une recette au volume">
          <label className="block space-y-1 text-xs text-cave-400">Recette source
            <select name="production_scale_recipe_select" value={selectedRecipeToScale.id}
              onChange={event=>{const found=currentRecipes.find(recipe=>recipe.id===event.target.value); if(found)setSelectedRecipeToScale(found);}}
              className="w-full min-h-touch-lg rounded-control border border-cave-700 bg-cave-950 px-2 text-base text-cave-50">
              {currentRecipes.map(recipe=><option key={recipe.id} value={recipe.id}>{recipe.name} · {recipe.volumeL} L</option>)}
            </select>
          </label>
          <div className="volume-controls" onChangeCapture={event => {
            if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) return;
            const entered = event.target.value;
            // Le compteur garde son dernier nombre pendant une frappe illisible.
            // Ce nombre ne doit pas produire un scénario, même après le blur.
            setInvalidTargetVolume(entered.trim() && parseDecimal(entered) === null ? entered : undefined);
          }}>
            <QuantityStepper compact label="Volume cible" unit="L" value={targetVolumeL} emptyValue={Number.NaN}
              onChange={value => { setTargetVolumeL(value); setInvalidTargetVolume(undefined); }}
              aria-invalid={Boolean(targetVolumeError)} aria-describedby={targetVolumeError ? 'production-target-volume-error' : undefined}
              min={0.5} customStep={0.5} customLadder={[0.5,5,10]} initialValue={selectedRecipeToScale.volumeL}/>
            {scaleResult && <output className="text-xs text-cave-400" aria-live="polite">× {(targetVolumeL/selectedRecipeToScale.volumeL).toLocaleString('fr-CH',{maximumFractionDigits:2})} de la recette</output>}
          </div>
          {!scaleResult && <p id={targetVolumeError ? 'production-target-volume-error' : undefined} role="alert" className="text-sm text-alert-strong">{targetVolumeError ?? (!sourceBh ? 'Configure une cuverie dans les réglages pour adapter cette recette.' : 'Le volume de la recette source doit être renseigné et positif.')}</p>}
          {scaleResult && <>
          <dl aria-label="Eaux adaptées" className="grid grid-cols-2 gap-2 border-y border-cave-800 py-1.5">
            <div><dt className="text-xs text-cave-400">Empâtage</dt><dd className="text-sm font-mono text-cave-50">{Units.format(scaleResult.mashWaterL,'L')}</dd></div>
            <div><dt className="text-xs text-cave-400">Rinçage</dt><dd className="text-sm font-mono text-cave-50">{Units.format(scaleResult.spargeWaterL,'L')}</dd></div>
          </dl>
          <table className="volume-ingredients">
            <caption className="text-left text-sm font-semibold text-cave-50 pb-1">Ingrédients pour {Units.format(targetVolumeL,'L')}</caption>
            <thead><tr><th scope="col">Ingrédient</th><th scope="col">Quantité</th></tr></thead>
            <tbody>
              {scaleResult.scaledRecipe.fermentables.map((m,index)=><tr key={'m'+index}><th scope="row">{m.name}</th><td>{Units.format(m.weightKg,'kg')}</td></tr>)}
              {scaleResult.scaledRecipe.hops.map((hop,index)=><tr key={'h'+index}><th scope="row">{hop.name}<span className="block text-xs text-cave-400">{describeMoment(hop)}</span></th><td>{Units.format(hop.weightG,'g')}</td></tr>)}
              {scaleResult.scaledRecipe.adjuncts?.map((item,index)=><tr key={'a'+index}><th scope="row">{item.name}<span className="block text-xs text-cave-400">{item.step}</span></th><td>{Units.format(item.amount,item.unit)}</td></tr>)}
            </tbody>
          </table>
          </>}
        </section>
      )}

      <BatchDetailSheet batch={detailBatch} initialSection={detailSection} onClose={() => setDetailBatch(null)} />
    </div>
  );
};
