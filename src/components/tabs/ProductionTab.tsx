import React, { lazy, Suspense, useState, useEffect, useMemo } from 'react';
import { isCurrent } from '../../domain/catalogOrganization';
import { Batch, Recipe, BrewhouseProfile } from '../../types';
import type { Periode, PeriodeEntree } from '../periode/periode';
import { StorageService } from '../../services/storage';
import { useLiveSelection } from '../../hooks/useLiveData';
import type { CreativeLabSectionRequest } from '../CreativeLabTab';
import { ProductionCatalog } from '../../ui/production/ProductionCatalog';
import { CarnetRecettes } from '../../ui/production/recettes/CarnetRecettes';
import { CarteApres } from '../../ui/production/creer/CarteApres';
import { useStorageValue } from '../../hooks/useLiveData';
import type { BatchDetailSection } from '../../domain/productionInsights';
import '../../ui/production/compact.css';
import { SegmentsCoque } from '../../ui/production/volumes/Coque';
import { AdapterVolumes } from '../../ui/production/volumes/AdapterVolumes';
import { batchesVisiblesSousPeriode } from '../../ui/production/volumes/periode';
import { loadRecipePage } from '../../pages/recipePageLoader';
import { LienSection } from '../../ui/calendrier/LienSection';

// l2 (10.11) : la fiche d'un brassin (graphiques, chat, procédé…) ne se télécharge plus avec l'accueil : elle part à la première ouverture,
// et se précharge à l'inactivité (voir precharge dans App). Même motif que Previsions, PrixEcran et ImpotAnnee.
const BatchDetailSheet = lazy(() => import('../../ui/BatchDetailSheet').then(m => ({ default: m.BatchDetailSheet })));
/* h1 (20.11, CPL-1) : l'Atelier passe par une seule porte ; son Carnet est CarnetsVue (choix ra+p5f), jamais l'ancien carnet. */
const AtelierPorte = lazy(() => import('../../ui/carnets/AtelierPorte').then(({ AtelierPorte }) => ({ default: AtelierPorte })));

interface ProductionTabProps {
  /** The catalogue remains mounted behind a full-screen page. */
  visible?: boolean;
  batches: Batch[];
  recipes: Recipe[];
  brewhouses: BrewhouseProfile[];
  activeBrewhouseId: string;
  globalTimeFilter: PeriodeEntree;
  /** Écrit la période de l'application (celle de l'en-tête) : la liste des brassins la règle d'ici, il n'y en a qu'une. */
  onChangeGlobalTimeFilter?: (p: Periode) => void;
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
  /** c2a, état « après » : le brassin que « Planifier » vient de créer ; la liste le montre en tête avec ses effets. */
  batchCree?: { id: string; at: number } | null;
  onBatchCreeHandled?: () => void;
  openLabSectionRequest?: CreativeLabSectionRequest | null;
  onOpenLabSectionRequestHandled?: () => void;
  /** Ouvre la fiche recette en plein écran. */
  onOpenRecipe: (recipe: Recipe) => void;
  onEditRecipe?: (recipe: Recipe) => void;
  /** Supprime une recette depuis la fiche du carnet (après confirmation). */
  onDeleteRecipe?: (recipe: Recipe) => void;
  /** Ouvre le déroulé minuté du jour de brassage. */
  onOpenBrewDay: (batch: Batch) => void;
  /** Ouvre l'assistant de recette, prérempli depuis une idée du labo. */
  onDraftRecipe: (seed: { title: string; description?: string }) => void;
  onSuccessMessage?: (msg: string) => void;
  /** e2a : « Rebrasser cette <style> » ouvre le brassin de la recette d'origine. */
  onRebrewRecipe?: (recipeId: string) => void;
  /** h1 : « À venir » / « Réalisés » d'un carnet de l'Atelier mènent à Stocks › Matériel. */
  onVoirMateriel?: (seg: 'avenir' | 'realises') => void;
}

const lireArticles = () => { try { return StorageService.getStocks().rawMaterials ?? []; } catch { return []; } };

export const ProductionTab: React.FC<ProductionTabProps> = ({
  visible = true,
  batches,
  recipes,
  brewhouses,
  activeBrewhouseId,
  globalTimeFilter,
  onChangeGlobalTimeFilter,
  targetSubTab,
  onOpenCreateBatch,
  onSubTabChange,
  createRequest,
  onCreateRequestHandled,
  openBatchRequest,
  onOpenBatchRequestHandled,
  batchCree,
  onBatchCreeHandled,
  openLabSectionRequest,
  onOpenLabSectionRequestHandled,
  onOpenRecipe,
  onEditRecipe,
  onDeleteRecipe,
  onRebrewRecipe,
  onOpenBrewDay,
  onDraftRecipe,
  onSuccessMessage,
  onVoirMateriel
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
  const feuilleOuverte = React.useRef(false);
  if (detailBatch) feuilleOuverte.current = true;
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

  // c2a « après » : la liste des brassins, le lot neuf en tête avec ses effets ; « Défaire » supprime le brassin créé (geste existant).
  const [apres, setApres] = useState<string | null>(null);
  const articles = useStorageValue(lireArticles);
  useEffect(() => {
    if (!batchCree) return;
    setSubTab('batches');
    setApres(batchCree.id);
    onBatchCreeHandled?.();
  }, [batchCree?.at]);
  const lotApres = apres ? batches.find((b) => b.id === apres) : undefined;
  const recetteApres = lotApres ? recipes.find((r) => r.id === lotApres.recipeRef) : undefined;

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

  return (
    <div className="production-screen space-y-2 pb-12 pt-1">
      {/* e11a : la barre segmentée avec ses compteurs ; « Atelier Houblons V5.5 » n'est plus sur l'écran (menu du + : Outils houblons). */}
      <SegmentsCoque<typeof subTab> label="Vue de production" value={subTab} onChange={setSubTab} options={[
        {value:'batches',label:`Brassins (${nbBrassins})`,court:'Brassins',compteur:nbBrassins},
        {value:'recipes',label:`Recettes (${currentRecipes.length})`,court:'Recettes',compteur:currentRecipes.length},
        {value:'lab',label:'Atelier',court:'Atelier'}, {value:'scaler',label:'Adapter les volumes',court:'Volumes'}
      ]}/>

      {subTab === 'batches' && <LienSection section="brassins" />}

      {(subTab === 'batches' || subTab === 'recipes') && <>
        {subTab === 'batches' ? (bilanOuvert ? <h2 className="sr-only">Le bilan des brassins</h2> : null) /* e6a : la liste porte sa propre phrase */ : <h2 className="sr-only">Le carnet de recettes</h2>}
        {subTab === 'batches' && lotApres && !bilanOuvert && (
          <CarteApres batch={lotApres} recipe={recetteApres} batches={batches} stock={articles}
            onOuvrir={() => { setDetailSection('measurements'); setDetailBatch(lotApres); }}
            onDefaire={() => { StorageService.deleteBatch(lotApres.id); setApres(null); onSuccessMessage?.(`${lotApres.id} défait : le brassin est supprimé.`); }} />
        )}
        {subTab === 'batches' ? (
          <ProductionCatalog key={subTab} kind="batches" recipes={recipes} batches={batches} globalTimeFilter={globalTimeFilter} onChoisirPeriode={onChangeGlobalTimeFilter}
            onOpenRecipe={onOpenRecipe} onEditRecipe={onEditRecipe ?? onOpenRecipe} onOpenBatch={(batch, section = 'measurements') => { setDetailSection(section); setDetailBatch(batch); }} onOpenBrewDay={onOpenBrewDay} onVueChange={(vue) => setBilanOuvert(vue === 'analysis')} />
        ) : (
          /* r2a (choix du 15.11) : le carnet dit ce qui est prêt à brasser et ce qui manque ; « Brasser » ouvre la feuille de préparation actuelle. */
          <CarnetRecettes recipes={recipes} batches={batches} onOpenRecipe={onOpenRecipe} onEditRecipe={onEditRecipe ?? onOpenRecipe}
            onOpenBatch={(batch) => { setDetailSection('measurements'); setDetailBatch(batch); }} onBrew={(id) => (onRebrewRecipe ? onRebrewRecipe(id) : onOpenCreateBatch())} onNewRecipe={onOpenCreateBatch} onDeleteRecipe={onDeleteRecipe} />
        )}
      </>}

      {/* 4. SUBTAB: CREATIVE LAB (ATELIER R&D DE LA BRASSERIE) */}
      {subTab === 'lab' && (
        <Suspense fallback={<div role="status" className="py-3 text-sm text-cave-400">Chargement de l’atelier R&amp;D…</div>}>
          <AtelierPorte
            onSuccessMessage={onSuccessMessage}
            onDraftRecipe={onDraftRecipe}
            onOpenRecipe={(id) => { const r = recipes.find((x) => x.id === id); if (r) onOpenRecipe(r); }}
            createRequest={createRequest}
            onCreateRequestHandled={onCreateRequestHandled}
            demande={openLabSectionRequest}
            onDemandeTraitee={onOpenLabSectionRequestHandled}
            onVoirMateriel={onVoirMateriel}
          />
        </Suspense>
      )}

      {subTab === 'scaler' && <AdapterVolumes recettes={recipes} brewhouses={brewhouses} activeBrewhouseId={activeBrewhouseId} onNouvelleRecette={onOpenCreateBatch} />}

      {/* l2 : monté à la première ouverture, puis gardé monté (la feuille se ferme d'elle-même quand batch est nul). */}
      {(detailBatch || feuilleOuverte.current) && (
        <Suspense fallback={null}>
          <BatchDetailSheet batch={detailBatch} initialSection={detailSection} onOpenBrewDay={(b) => { setDetailBatch(null); onOpenBrewDay(b); }} onClose={() => setDetailBatch(null)}
            onRebrew={onRebrewRecipe && rebrewRecipeId ? () => { setDetailBatch(null); onRebrewRecipe(rebrewRecipeId); } : undefined} />
        </Suspense>
      )}
    </div>
  );
};
