import React, { lazy, Suspense, useState, useEffect, useMemo } from 'react';
import { isCurrent } from '../../domain/catalogOrganization';
import { Batch, Recipe, BrewhouseProfile, TimeFilterPeriod } from '../../types';
import { StorageService } from '../../services/storage';
import { BatchDetailSheet } from '../../ui/BatchDetailSheet';
import { useLiveSelection } from '../../hooks/useLiveData';
import type { CreativeLabSectionRequest } from '../CreativeLabTab';
import { ProductionCatalog } from '../../ui/production/ProductionCatalog';
import type { BatchDetailSection } from '../../domain/productionInsights';
import '../../ui/production/compact.css';
import { SegmentsCoque, PhraseReponse } from '../../ui/production/volumes/Coque';
import { AdapterVolumes } from '../../ui/production/volumes/AdapterVolumes';
import { phraseBrassins, phraseRecettes } from '../../ui/production/volumes/phrase';
import { batchesVisiblesSousPeriode } from '../../ui/production/volumes/periode';
import { loadRecipePage } from '../../pages/recipePageLoader';
import { OUTILS_HOUBLONS_EVENT } from '../../domain/fabActions';

const CreativeLabTab = lazy(() =>
  import('../CreativeLabTab').then(({ CreativeLabTab: CreativeLab }) => ({
    default: CreativeLab,
  })),
);

interface ProductionTabProps {
  /** The catalogue remains mounted behind a full-screen page. */
  visible?: boolean;
  batches: Batch[];
  recipes: Recipe[];
  brewhouses: BrewhouseProfile[];
  activeBrewhouseId: string;
  globalTimeFilter: TimeFilterPeriod;
  targetSubTab?: 'batches' | 'recipes' | 'lab' | 'scaler';
  onOpenCreateBatch: () => void;
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
  onOpenHopV55?: () => void;
  /** e2a : « Rebrasser cette <style> » ouvre le brassin de la recette d'origine. */
  onRebrewRecipe?: (recipeId: string) => void;
}

export const ProductionTab: React.FC<ProductionTabProps> = ({
  visible = true,
  batches,
  recipes,
  brewhouses,
  activeBrewhouseId,
  globalTimeFilter,
  targetSubTab,
  onOpenCreateBatch,
  onSubTabChange,
  createRequest,
  onCreateRequestHandled,
  openBatchRequest,
  onOpenBatchRequestHandled,
  openLabSectionRequest,
  onOpenLabSectionRequestHandled,
  onOpenRecipe,
  onEditRecipe,
  onRebrewRecipe,
  onOpenBrewDay,
  onDraftRecipe,
  onSuccessMessage,
  onOpenHopV55
}) => {
  // Persistent sub-navigation
  const [subTab, setSubTab] = useState<'batches' | 'recipes' | 'lab' | 'scaler'>(() =>
    targetSubTab || StorageService.getUiState('production_subtab', 'batches')
  );

  useEffect(() => {
    if (!visible || subTab !== 'recipes' || !recipes.length) return;
    let active = true, idle: number | undefined;
    const useIdle = !!window.requestIdleCallback && !!window.cancelIdleCallback;
    // Only the reading surface/data are prepared. No editor, model simulation,
    // stock write or AI request is run while the list is displayed.
    void loadRecipePage().then(module => {
      if (!active) return;
      const advance = module.prepareRecipeReferenceData();
      const prepare = (deadline?: IdleDeadline) => {
        if (!active) return;
        const start = performance.now();
        try {
          // Yield between names and leave idle time for an arriving gesture.
          const done = advance(() => performance.now() - start < 6 && (!deadline || deadline.timeRemaining() > 1));
          if (!done && active) schedule();
        } catch { /* The actual route keeps its error surface. */ }
      };
      const schedule = () => {
        idle = useIdle ? window.requestIdleCallback(prepare) : window.setTimeout(prepare, 0);
      };
      schedule();
    }).catch(() => { /* Opening retains the normal loading/error surface. */ });
    return () => {
      active = false;
      if (idle !== undefined) {
        if (useIdle) window.cancelIdleCallback(idle);
        else window.clearTimeout(idle);
      }
    };
  }, [visible, subTab, recipes.length]);

  // e11a : « Outils houblons » vit dans le menu du + (FloatingActions), qui l'annonce par cet événement ; l'écran l'ouvre.
  useEffect(() => {
    if (!visible || !onOpenHopV55) return;
    const ouvrir = () => onOpenHopV55();
    window.addEventListener(OUTILS_HOUBLONS_EVENT, ouvrir);
    return () => window.removeEventListener(OUTILS_HOUBLONS_EVENT, ouvrir);
  }, [visible, onOpenHopV55]);
  // e7a : le bilan des brassins remplace la phrase-réponse et la barre de la liste ; « ‹ Le bilan » vient juste sous les onglets.
  const [bilanOuvert, setBilanOuvert] = useState(false);

  const currentRecipes = useMemo(() => recipes.filter(isCurrent), [recipes]);
  const [detailBatch, setDetailBatch] = useLiveSelection(batches, 'id');
  const [detailSection, setDetailSection] = useState<BatchDetailSection>('measurements');
  // e2a : la recette d'origine du brassin ouvert (référence, sinon le nom figé) ; sans elle, pas de « Rebrasser » (jamais une autre recette).
  const rebrewRecipeId = useMemo(() => {
    if (!detailBatch) return undefined;
    const nom = (detailBatch.recipeSnapshot?.name ?? detailBatch.name ?? '').trim().toLowerCase();
    return (recipes.find(r => r.id === detailBatch.recipeRef) ?? recipes.find(r => nom && r.name.trim().toLowerCase() === nom))?.id;
  }, [detailBatch, recipes]);
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

  // La période de l'application ne juge que les brassins terminés : un brassin en cours reste visible sous toute période.
  const brassinsListe = useMemo(() => batchesVisiblesSousPeriode(batches, globalTimeFilter), [batches, globalTimeFilter]);
  const nbBrassins = useMemo(() => brassinsListe.filter(isCurrent).length, [brassinsListe]);
  // e11a : la phrase-réponse, de vraies données ; absente quand rien ne la fonde.
  const phrase = useMemo(() => subTab === 'batches' ? phraseBrassins(batches.filter(isCurrent)) : subTab === 'recipes' ? phraseRecettes(batches.filter(isCurrent)) : [], [subTab, batches]);

  return (
    <div className="production-screen space-y-2 pb-12 pt-1">
      {/* e11a : la barre segmentée avec ses compteurs ; « Atelier Houblons V5.5 » n'est plus sur l'écran (menu du + : Outils houblons). */}
      <SegmentsCoque<typeof subTab> label="Vue de production" value={subTab} onChange={setSubTab} options={[
        {value:'batches',label:`Brassins (${nbBrassins})`,court:'Brassins',compteur:nbBrassins},
        {value:'recipes',label:`Recettes (${currentRecipes.length})`,court:'Recettes',compteur:currentRecipes.length},
        {value:'lab',label:'Atelier R&D',court:'Atelier'}, {value:'scaler',label:'Adapter les volumes',court:'Volumes'}
      ]}/>

      {(subTab === 'batches' || subTab === 'recipes') && <>
        {subTab === 'batches' && bilanOuvert ? <h2 className="sr-only">Le bilan des brassins</h2> : phrase.length ? <PhraseReponse fragments={phrase} /> : <h2 className="sr-only">{subTab === 'recipes' ? 'Le carnet de recettes' : 'Les brassins'}</h2>}
        <ProductionCatalog key={subTab} kind={subTab} recipes={recipes} batches={subTab === 'batches' ? brassinsListe : batches} globalTimeFilter={subTab === 'batches' ? 'all' : globalTimeFilter}
          onOpenRecipe={onOpenRecipe} onEditRecipe={onEditRecipe ?? onOpenRecipe} onOpenBatch={(batch, section = 'measurements') => { setDetailSection(section); setDetailBatch(batch); }} onOpenBrewDay={onOpenBrewDay} onVueChange={(vue) => setBilanOuvert(vue === 'analysis')} />
      </>}

      {/* 4. SUBTAB: CREATIVE LAB (ATELIER R&D DE LA BRASSERIE) */}
      {subTab === 'lab' && (
        <Suspense fallback={<div role="status" className="py-3 text-sm text-cave-400">Chargement de l’atelier R&amp;D…</div>}>
          <CreativeLabTab
            onSuccessMessage={onSuccessMessage}
            onDraftRecipe={onDraftRecipe}
            createRequest={createRequest}
            onCreateRequestHandled={onCreateRequestHandled}
            openSectionRequest={openLabSectionRequest}
            onOpenSectionRequestHandled={onOpenLabSectionRequestHandled}
          />
        </Suspense>
      )}

      {subTab === 'scaler' && <AdapterVolumes recettes={recipes} brewhouses={brewhouses} activeBrewhouseId={activeBrewhouseId} onNouvelleRecette={onOpenCreateBatch} />}

      <BatchDetailSheet batch={detailBatch} initialSection={detailSection} onOpenBrewDay={onOpenBrewDay} onClose={() => setDetailBatch(null)}
        onRebrew={onRebrewRecipe && rebrewRecipeId ? () => { setDetailBatch(null); onRebrewRecipe(rebrewRecipeId); } : undefined} />
    </div>
  );
};
