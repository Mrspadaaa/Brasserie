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
  // Sans recette ni cuverie configurée, on ne calcule rien plutôt que de planter.
  const scaleResult =
    subTab === 'scaler' && selectedRecipeToScale?.volumeL > 0 && Number.isFinite(selectedRecipeToScale.volumeL) && sourceBh
      ? scaleBrewRecipeScenario(selectedRecipeToScale, targetVolumeL, sourceBh, targetBh)
      : null;

  return (
    <div className="space-y-2 sm:space-y-4 pb-24 pt-2">
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

      {/* 5. SUBTAB: SCALER (30L / 300L) */}
      {subTab === 'scaler' && !scaleResult && (
        <div className="p-6 rounded-3xl bg-cave-900 border border-cave-800 text-center space-y-3 shadow-sm">
          <div className="text-3xl">⚖️</div>
          <h3 className="font-bold text-sm text-cave-50">Aucune recette à mettre à l'échelle</h3>
          <p className="text-sm text-cave-400 max-w-xs mx-auto leading-relaxed">
            Crée d'abord une recette : le calculateur adaptera ensuite ses malts, ses houblons et
            ses volumes d'eau au litrage de ton choix.
          </p>
          <button
            onClick={onOpenCreateBatch}
            className="px-4 py-2.5 bg-gradient-to-r from-ebc-straw to-ebc-amber hover:from-ebc-gold text-cave-950 font-black text-sm rounded-xl shadow transition min-h-[44px]"
          >
            + Créer une recette
          </button>
        </div>
      )}

      {subTab === 'scaler' && scaleResult && selectedRecipeToScale && (
        <div className="p-4 rounded-3xl bg-cave-900 border border-cave-800 space-y-4 shadow-sm">
          <div>
            <span className="text-footnote text-ebc-straw uppercase font-bold tracking-wider">
              Mise à l'échelle automatique
            </span>
            <h3 className="font-bold text-base text-cave-50">Calculateur Proportionnel de Brassage</h3>
            <p className="text-sm text-cave-400 mt-0.5">
              Ajuste instantanément le volume d'eau d'empattage, de rinçage, les malts et les houblons.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-cave-200 text-sm font-semibold block mb-1">Recette source :</label>
              <select
                name="production_scale_recipe_select"
                autoComplete="off"
                data-form-type="other"
                value={selectedRecipeToScale.id}
                onChange={(e) => {
                  const found = currentRecipes.find((r) => r.id === e.target.value);
                  if (found) setSelectedRecipeToScale(found);
                }}
                className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2 text-sm text-cave-50 font-bold"
              >
                {currentRecipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.volumeL}L)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-cave-200 text-sm font-semibold block mb-1">Volume cible :</label>
              <div className="flex space-x-1">
                {[30, 50, 100, 300].map((v) => (
                  <button
                    key={v}
                    onClick={() => setTargetVolumeL(v)}
                    className={`flex-1 py-2 text-sm font-bold rounded-xl border transition ${
                      targetVolumeL === v
                        ? 'bg-ebc-straw text-cave-950 border-ebc-gold shadow'
                        : 'bg-cave-850 text-cave-400 border-cave-700 hover:text-cave-200'
                    }`}
                  >
                    {v}L
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Scaled Water Results */}
          <div className="grid grid-cols-2 gap-2 bg-cave-950/70 p-3 rounded-2xl text-center text-sm">
            <div className="bg-cave-900/60 p-2.5 rounded-xl border border-cave-800">
              <span className="text-footnote text-cave-400 uppercase">Eau Empattage (Mash)</span>
              <div className="text-lg font-black text-ebc-straw font-mono mt-0.5">
                {scaleResult.mashWaterL} <span className="text-sm text-cave-400">L</span>
              </div>
            </div>
            <div className="bg-cave-900/60 p-2.5 rounded-xl border border-cave-800">
              <span className="text-footnote text-cave-400 uppercase">Eau Rinçage (Sparge)</span>
              <div className="text-lg font-black text-water font-mono mt-0.5">
                {scaleResult.spargeWaterL} <span className="text-sm text-cave-400">L</span>
              </div>
            </div>
          </div>

          {/* Scaled Ingredients */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-cave-200">
              Ingrédients dosés pour {targetVolumeL} Litres :
            </h4>
            <div className="space-y-1.5 text-sm">
              {scaleResult.scaledRecipe.fermentables.map((m, idx) => (
                <div key={idx} className="p-2 bg-cave-950/50 rounded-xl border border-cave-800/80 flex justify-between">
                  <span className="text-cave-200">{m.name}</span>
                  <span className="font-mono font-bold text-ebc-straw">
                    {Units.format(m.weightKg, 'kg')}
                  </span>
                </div>
              ))}
              {scaleResult.scaledRecipe.hops.map((h, idx) => (
                <div key={idx} className="p-2 bg-cave-950/50 rounded-xl border border-cave-800/80 flex justify-between">
                  <span className="text-cave-200">
                    {h.name} · {describeMoment(h)}
                  </span>
                  <span className="font-mono font-bold text-hop">
                    {Units.format(h.weightG, 'g')}
                  </span>
                </div>
              ))}
              {scaleResult.scaledRecipe.adjuncts?.map((item, idx) => (
                <div key={`adjunct-${idx}`} className="p-2 bg-cave-950/50 rounded-xl border border-cave-800/80 flex justify-between">
                  <span className="text-cave-200">{item.name} · {item.step}</span>
                  <span className="font-mono font-bold text-cave-50">{Units.format(item.amount, item.unit)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <BatchDetailSheet batch={detailBatch} initialSection={detailSection} onClose={() => setDetailBatch(null)} />
    </div>
  );
};
