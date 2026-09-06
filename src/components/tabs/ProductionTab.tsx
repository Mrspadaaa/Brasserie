import React, { useState, useEffect } from 'react';
import { 
  Beer, 
  Calendar, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  Plus, 
  Edit3, 
  Activity, 
  AlertTriangle,
  Sliders,
  Scale,
  Wrench,
  Droplets,
  Check,
  FileText
} from 'lucide-react';
import { Batch, Recipe, BrewhouseProfile, TimeFilterPeriod } from '../../types';
import { StorageService } from '../../services/storage';
import { statusOf } from '../../domain/batchStatus';
import { BatchDetailSheet } from '../../ui/BatchDetailSheet';
import { BrewingMath } from '../../services/brewingMath';
import { DateUtils } from '../../services/dateUtils';
import { FermentationCurveChart } from '../charts/FermentationCurveChart';
import { CreativeLabTab } from '../CreativeLabTab';
import { computeBeerColor } from '../../domain/beerColor';
import { describeMoment } from '../../domain/hopStage';
import { Units } from '../../services/units';

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
  /** Ouvre la fiche recette en plein écran. */
  onOpenRecipe: (recipe: Recipe) => void;
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
  onOpenRecipe,
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
  const [selectedRecipeToScale, setSelectedRecipeToScale] = useState<Recipe | null>(
    recipes[0] ?? null
  );

  // Dès qu'une première recette arrive (synchronisation Firestore), on la
  // sélectionne pour que le calculateur cesse d'être vide.
  useEffect(() => {
    if (!selectedRecipeToScale && recipes.length > 0) {
      setSelectedRecipeToScale(recipes[0]);
    }
  }, [recipes, selectedRecipeToScale]);
  const [targetVolumeL, setTargetVolumeL] = useState<number>(30); // Default 30L
  const [detailBatch, setDetailBatch] = useState<Batch | null>(null);

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
    }
  }, [createRequest?.at]);

  useEffect(() => {
    StorageService.setUiState('production_subtab', subTab);
  }, [subTab]);

  const periodBatches = batches.filter((b) => DateUtils.isDateInPeriod(b.brewDate, globalTimeFilter));
  const displayedBatches = periodBatches.length > 0 ? periodBatches : batches;
  const activeBatch = displayedBatches.find((b) => b.status === 'fermentation' || b.status === 'garde') || batches.find((b) => b.status === 'fermentation' || b.status === 'garde');
  const sourceBh = brewhouses.find((b) => b.id === activeBrewhouseId) || brewhouses[0];
  const targetBh = targetVolumeL >= 250 ? (brewhouses.find((b) => b.volumeL >= 250) || sourceBh) : sourceBh;
  // Sans recette ni cuverie configurée, on ne calcule rien plutôt que de planter.
  const scaleResult =
    selectedRecipeToScale && sourceBh
      ? BrewingMath.scaleRecipe(selectedRecipeToScale, targetVolumeL, sourceBh, targetBh)
      : null;

  return (
    <div className="space-y-4 pb-28 pt-2">
      {/* 1. Sub-navigation Pills */}
      <div className="flex bg-cave-900 p-1 rounded-2xl border border-cave-800 shadow-md overflow-x-auto scrollbar-none space-x-1">
        <button
          onClick={() => setSubTab('batches')}
          className={`px-3.5 py-2 text-sm font-bold rounded-xl whitespace-nowrap transition ${
            subTab === 'batches' ? 'bg-ebc-straw text-cave-950 shadow' : 'text-cave-400 hover:text-cave-200'
          }`}
        >
          🍺 Brassins ({batches.length})
        </button>
        <button
          onClick={() => setSubTab('recipes')}
          className={`px-3.5 py-2 text-sm font-bold rounded-xl whitespace-nowrap transition ${
            subTab === 'recipes' ? 'bg-ebc-straw text-cave-950 shadow' : 'text-cave-400 hover:text-cave-200'
          }`}
        >
          📜 Recettes ({recipes.length})
        </button>
        <button
          onClick={() => setSubTab('lab')}
          className={`px-3.5 py-2 text-sm font-bold rounded-xl whitespace-nowrap transition ${
            subTab === 'lab' ? 'bg-ebc-straw text-cave-950 shadow' : 'text-cave-400 hover:text-cave-200'
          }`}
        >
          🧪 Atelier R&D
        </button>
        <button
          onClick={() => setSubTab('scaler')}
          className={`px-3.5 py-2 text-sm font-bold rounded-xl whitespace-nowrap transition ${
            subTab === 'scaler' ? 'bg-ebc-straw text-cave-950 shadow' : 'text-cave-400 hover:text-cave-200'
          }`}
        >
          ⚖️ Scaler 30L / 300L
        </button>
      </div>

      {/* 2. SUBTAB: BATCHES */}
      {subTab === 'batches' && (
        <div className="space-y-4">
          {/* Active Fermentation Curve (Recharts) */}
          {activeBatch && (
            <FermentationCurveChart batch={activeBatch} />
          )}

          {/* Batches Header */}
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="font-bold text-sm text-cave-50">Journal des Brassins</h3>
              <p className="text-sm text-cave-400">Suivi intelligent, chimie de l'eau et densités</p>
            </div>
            <button
              onClick={onOpenCreateBatch}
              className="px-3 py-1.5 bg-gradient-to-r from-ebc-straw to-ebc-amber hover:from-ebc-gold text-cave-950 font-black text-sm rounded-xl shadow transition"
            >
              + Nouveau Brassin
            </button>
          </div>

          {/* Batches List */}
          <div className="space-y-3">
            {displayedBatches.map((batch) => {
              // Source unique et exhaustive : ajouter un statut au type sans le
              // décrire dans BATCH_STATUS casse la compilation. C'est ce qui
              // empêche le retour du bug « annulé affiché Planifié ».
              const s = statusOf(batch.status);
              const hasWater = batch.waterSalts && batch.waterSalts.isApplied;

              return (
                <div
                  key={batch.id}
                  className="p-4 rounded-3xl bg-cave-900 border border-cave-800 space-y-3 hover:border-cave-700 transition shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm font-bold text-cave-500">{batch.id}</span>
                        <h4 className="font-bold text-sm text-cave-50">{batch.name}</h4>
                        <span className={`text-sm font-medium px-2 py-0.5 rounded-control border ${s.chip}`}>
                          {s.label}
                        </span>
                      </div>
                      <div className="text-sm text-cave-400 mt-0.5">
                        Style : <strong className="text-cave-200">{batch.style}</strong> · {batch.volumeL}L
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {/* ASSISTANT BRASSIN BOUTON */}
                      <button
                        onClick={() => onOpenBrewDay(batch)}
                        className="px-3 py-1.5 bg-gradient-to-r from-ebc-straw/20 to-ebc-amber/20 hover:from-ebc-straw/30 text-ebc-gold border border-ebc-straw/40 rounded-xl transition flex items-center space-x-1 text-sm font-black shadow-sm"
                        title="Ouvrir l'assistant eau, sels, empattage et réfractomètre"
                      >
                        <span className="text-sm">🧙‍♂️</span>
                        <span>Assistant</span>
                      </button>

                      <button
                        onClick={() => setDetailBatch(batch)}
                        className="p-1.5 bg-cave-850 hover:bg-cave-800 text-cave-400 hover:text-cave-200 rounded-xl transition"
                        title="Modifier la fiche"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Water Profile & Stock Deduction Status */}
                  <div className="flex flex-wrap items-center gap-2 text-sm font-mono">
                    <span className="text-cave-400 font-sans">Statut :</span>
                    {batch.status === 'planifie' ? (
                      <span className="px-2 py-0.5 rounded-lg bg-cave-850 text-cave-400 border border-cave-700 text-footnote font-bold font-sans">
                        Stock non déduit (planifié)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-hop/10 text-hop border border-hop/20 text-footnote font-bold font-sans">
                        Ingrédients déduits du stock
                      </span>
                    )}

                    {batch.volumePackagedL ? (
                      <span className="px-2 py-0.5 rounded-lg bg-ebc-copper/10 text-ebc-copper border border-ebc-copper/20 text-footnote font-bold font-sans">
                        {batch.volumePackagedL} L conditionnés
                      </span>
                    ) : null}

                    <span className={`px-2 py-0.5 rounded-lg border font-bold flex items-center font-sans ${
                      hasWater 
                        ? 'bg-hop/10 text-hop border-hop/30' 
                        : 'bg-cave-850 text-cave-400 border-cave-700'
                    }`}>
                      <Droplets className="w-3 h-3 mr-1 text-water" />
                      {batch.waterDilutionPct !== undefined ? `${100 - batch.waterDilutionPct}/${batch.waterDilutionPct} DI` : '50/50 DI'}
                      {hasWater ? ' · Sels ajoutés' : ' · Sels à doser'}
                    </span>
                    {batch.mashPhActual && (
                      <span className="text-hop font-bold">pH: {batch.mashPhActual}</span>
                    )}
                  </div>

                  {/* Batch Metric Badges */}
                  <div className="grid grid-cols-4 gap-1.5 bg-cave-950/70 p-2.5 rounded-2xl text-center text-sm">
                    <div>
                      <span className="text-footnote text-cave-500">Brassé le</span>
                      <div className="font-semibold text-cave-200 text-sm">{batch.brewDate}</div>
                    </div>
                    <div>
                      <span className="text-footnote text-cave-500">Densité OG</span>
                      <div className="font-mono font-bold text-ebc-gold">{batch.og}</div>
                    </div>
                    <div>
                      <span className="text-footnote text-cave-500">Densité FG</span>
                      <div className="font-mono font-bold text-cave-200">{batch.fg}</div>
                    </div>
                    <div>
                      <span className="text-footnote text-cave-500">Alcool ABV</span>
                      <div className="font-mono font-bold text-hop">{batch.abv}</div>
                    </div>
                  </div>

                  {/* Brewer's Notes in 3 Phases */}
                  {(batch.notesCreation || batch.notesBrewDay || batch.notesTasting) && (
                    <div className="p-3 bg-cave-950/60 rounded-2xl border border-cave-800 text-sm space-y-1">
                      <div className="flex items-center space-x-1.5 text-footnote font-bold text-ebc-straw uppercase tracking-wider mb-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Carnet de Notes du Brasseur :</span>
                      </div>
                      {batch.notesCreation && (
                        <p className="text-sm text-cave-200 leading-relaxed">
                          <strong className="text-ebc-gold">💡 Avant / Création :</strong> {batch.notesCreation}
                        </p>
                      )}
                      {batch.notesBrewDay && (
                        <p className="text-sm text-cave-200 leading-relaxed">
                          <strong className="text-alert">🔥 Pendant / Brassage :</strong> {batch.notesBrewDay}
                        </p>
                      )}
                      {batch.notesTasting && (
                        <p className="text-sm text-cave-200 leading-relaxed">
                          <strong className="text-hop">🍺 Après / Dégustation :</strong> {batch.notesTasting}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Gravity Logs History */}
                  {batch.gravityLog && batch.gravityLog.length > 0 && (
                    <div className="p-2.5 bg-cave-950/50 rounded-xl border border-cave-800 text-sm space-y-1">
                      <span className="text-footnote font-bold text-cave-400 uppercase">Derniers relevés :</span>
                      {batch.gravityLog.map((log, i) => (
                        <div key={i} className="flex justify-between text-sm text-cave-200 font-mono">
                          <span>{log.date} : <strong>{log.sg}</strong> ({log.tempC}°C)</span>
                          <span className="text-cave-500 italic">{log.notes || ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. SUBTAB: RECIPES */}
      {subTab === 'recipes' && (
        <div className="space-y-3">
          {/*
            ⚠️ Trois lignes pour une rangée de titre — titre, phrase
            d'explication, puis un bouton qui repassait à la ligne — au-dessus
            d'un en-tête d'application et d'une rangée de pastilles. Sur un
            375 × 812, la première recette commençait au tiers de l'écran. La
            phrase ne se lit qu'une fois : elle reste sur grand écran, où elle
            ne coûte rien.
          */}
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-cave-50 truncate">Mes Recettes & Ingrédients</h3>
              <p className="hidden sm:block text-sm text-cave-400">
                Saisie libre ou import magique par copier-coller web
              </p>
            </div>
            <button
              onClick={onOpenCreateBatch}
              className="shrink-0 min-h-touch px-3 flex items-center gap-1.5 bg-gradient-to-r from-ebc-straw to-ebc-amber hover:from-ebc-gold text-cave-950 font-black text-sm rounded-xl shadow transition"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline">Importer / Créer</span>
              <span className="xs:hidden">Recette</span>
            </button>
          </div>
          {/* Une recette se LIT sur sa fiche, pas dans une carte de liste :
              on montre ici de quoi la reconnaître — la couleur calculée, le
              grain, le nombre d'ajouts de houblon — et on ouvre pour le reste. */}
          {recipes.map((r) => {
            /*
             * ⚠️ `r.malts` est déprécié et ABSENT de toute recette créée
             * depuis la refonte : `normalizeRecipe` remplit `fermentables`
             * depuis `malts`, jamais l'inverse. `r.malts.reduce` JETAIT donc
             * ici, et TOUTE la liste des recettes disparaissait derrière un
             * écran blanc. Même correction qu'à trois autres endroits du dépôt.
             *
             * Le grain SEUL, comme sur la fiche : ni la couleur ni la facture
             * de grain ne comptent le sucre.
             */
            const grains = (r.fermentables ?? []).filter((f) => f.kind === 'grain');
            const color = computeBeerColor(grains, r.volumeL);
            const grist = grains.reduce((s, f) => s + f.weightKg, 0);
            const hopG = (r.hops ?? []).reduce((s, h) => s + h.weightG, 0);
            return (
              <div
                key={r.id}
                className="panel p-3 flex items-center gap-3"
              >
                <button
                  onClick={() => onOpenRecipe(r)}
                  className="min-w-0 flex-1 flex items-center gap-3 text-left min-h-touch"
                >
                  <span
                    className={`w-8 h-8 rounded-full border border-cave-700 shrink-0 ${
                      color ? color.swatch : 'bg-cave-850'
                    }`}
                    aria-hidden
                    title={color ? `${color.label} — ${color.ebc} EBC` : 'couleur incalculable'}
                  />
                  <span className="min-w-0">
                    <span className="block text-base font-semibold text-cave-50 truncate">
                      {r.name}
                    </span>
                    <span className="block text-sm text-cave-400 truncate">
                      {[r.style, `${r.volumeL} L`, Units.format(grist, 'kg'), `${(r.hops ?? []).length} ajouts · ${Units.format(hopG, 'g')}`]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                </button>

                <button
                  onClick={() => {
                    setSelectedRecipeToScale(r);
                    setSubTab('scaler');
                  }}
                  aria-label={`Adapter le volume de ${r.name}`}
                  className="touch-target rounded-control text-cave-400 hover:text-ebc-straw shrink-0"
                >
                  <Scale className="w-5 h-5" />
                </button>
              </div>
            );
          })}
          {recipes.length === 0 && (
            <p className="text-sm text-cave-500 px-1">
              Aucune recette. Crée-la pas à pas, ou colle-en une trouvée sur le web.
            </p>
          )}
        </div>
      )}

      {/* 4. SUBTAB: CREATIVE LAB (ATELIER R&D DE LA BRASSERIE) */}
      {subTab === 'lab' && (
        <CreativeLabTab
          onSuccessMessage={onSuccessMessage}
          onDraftRecipe={onDraftRecipe}
          createRequest={createRequest}
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
                  const found = recipes.find((r) => r.id === e.target.value);
                  if (found) setSelectedRecipeToScale(found);
                }}
                className="w-full bg-cave-850 border border-cave-700 rounded-xl p-2 text-sm text-cave-50 font-bold"
              >
                {recipes.map((r) => (
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
            </div>
          </div>
        </div>
      )}

      <BatchDetailSheet batch={detailBatch} onClose={() => setDetailBatch(null)} />
    </div>
  );
};
