import { batchDisplayDate } from '../domain/batchSchedule';
import { ibuDeLAjout } from '../domain/hopBitterness';
import { recetteLue } from '../domain/recipeIngredientsAbimes';
import { brassinsDeLaRecette } from '../domain/recipeBrassins';
import { instructionsAffichees } from '../domain/recipeInstructions';
import { amertumeRecette, fgRecette, formatDensite, formatLitres, nombreAccorde, ogRecette } from '../domain/recipeMetrics';
import { formatDecimal } from '../ui/numericInput';
import { HopBitternessPanel } from '../ui/HopBitternessPanel';
import { mashPhDiagnostic } from '../domain/water/readiness';
import React, { useMemo, useState } from 'react';
import { Recipe, Batch, HopIngredient, AppConfig } from '../types';
import { Units } from '../services/units';
import { nombreFr } from '../domain/stock/regles';
import { deNom } from '../domain/elision';
import { BrewingMath } from '../services/brewingMath';
import { recipeBeerColor, missingColorData } from '../domain/beerColor';
import { HOP_STAGE, groupByStage, describeMoment, normalizeHop } from '../domain/hopStage';
import { SALTS, SALT_IDS, ACIDS, ALKALINE_SALTS, savedWaterDisplay } from '../domain/water';
import { styleByCode, styleFromTargetIons } from '../domain/waterStyles';
import { WaterRadar } from '../ui/WaterRadar';
import { WaterTargetStatus } from '../ui/water/WaterTargetStatus';
import { describeSavedRecipeWater } from '../domain/recipeWaterReadings';
import { PHASE_LABEL } from '../domain/brewPrograms';
import { ActionDock, nextActionDockPriority, PageShell } from './PageShell';
import { RecipeWaterVolumes } from '../ui/RecipeDisclosure';
import { LazySurface } from '../ui/LazySurface';
import { NoloRecipeOverview } from '../ui/NoloRecipeOverview';
import { Sheet } from '../ui/Sheet';
import { ConfirmerSuppressionRecette } from '../ui/recette/ConfirmerSuppressionRecette';
import { Pencil, Copy, Download, Dna, FlaskConical, AlertTriangle } from 'lucide-react';
import { FicheSection } from '../ui/recette/FicheSection';
import { TableauHoublons } from '../ui/recette/TableauHoublons';
import { Rep } from '../ui/recette/Reperes';
import { BarreGrain, BarrePart, CourbeEmpatage, MiniCourbe, Piste, pointsEmpatage } from '../ui/recette/Dessins';
import { pointsFermentation, segmentsEmpatage } from '../ui/recette/donneesCourbes';
import { recipeToText } from '../domain/recipeText';
import { identiteLevure, noteLevureAJour, densiteDebutEbullition } from '../domain/levure/affichage';
import { RecipeTextExport } from '../ui/RecipeTextExport';
import { brewingStyles, resolveBrewingStyle } from '../domain/brewingStyles';

/**
 * La fiche recette — le document de référence.
 *
 * ⚠️ Ce que ça règle : une recette n'était consultable qu'à travers le
 * formulaire qui servait à la créer. Impossible de la LIRE — de vérifier d'un
 * coup d'œil sa couleur, la répartition de son grain, la contribution de chaque
 * houblon. C'est pourtant ce qu'on fait quatre-vingt-dix fois sur cent.
 *
 * Ce qui est affiché est CALCULÉ quand c'est calculable, et honnêtement vide
 * quand la donnée manque : un EBC exige la couleur de chaque malt, une OG
 * prédite exige leur potentiel d'extrait, un IBU exige l'alpha des houblons.
 * Aucun de ces chiffres n'est deviné — un nombre faux serait pire qu'une case
 * vide, parce qu'on brasserait dessus.
 */

import { BrewerChat } from '../ui/BrewerChat';
import { YeastRecipeHeading } from '../ui/YeastRecipeHeading';
import { prepareRecipeIngredientNames } from '../domain/hopIndex/recipeGuide';
import { readYeastRecipeDesign } from '../domain/yeastRecipeDesign';
import { projectYeastRecipe, yeastRecipeBoilOg, yeastRecipeComputedOg } from '../domain/yeastProjection';
import { yeastReferences } from '../domain/yeastReferences';
import { resolveFermentationYeast } from '../domain/fermentationScenario';
// Reading code is part of the prepared route, preserving disclosures after a
// connection loss. Its reports/calculations still mount only when requested.
import { FermentationRecipeSummary } from '../ui/FermentationWorkshop';
import { HopRecipePanel } from '../ui/hopIndex/HopRecipePanel';
import { NoloPanel } from '../ui/NoloPanel';
import { BrewingStyleDetails } from '../ui/BrewingStyleDetails';

/** Prepare shared read-only reference data while the recipe list is idle. */
export function prepareRecipeReferenceData() {
  let references: ReturnType<typeof yeastReferences> | undefined, next = 0;
  return (canContinue: () => boolean) => {
    if (!canContinue()) return false;
    references ??= yeastReferences(StorageService.getHopKnowledge());
    next = prepareRecipeIngredientNames(references, { from: next, canContinue });
    return next === references.length;
  };
}
import { noloScenarioInput } from '../domain/nolo';
import { matchingNoloSimulation } from '../../functions/src/noloSimulation';
import { useStorageValue } from '../hooks/useLiveData';
import { StorageService } from '../services/storage';
import { BrewBudgetButton } from '../ui/finance/BrewBudgetDialog';
import { usePlusPage } from '../ui/plusPage';

interface RecipePageProps {
  recipe: Recipe;
  /** Brassins issus de cette recette, pour confronter le visé au mesuré. */
  batches: Batch[];
  config: AppConfig;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBrew: () => void;
  onOpenBatch: (batch: Batch) => void;
}

import { BrewEquipmentSummary } from '../ui/BrewEquipmentSummary';
import { RecipeThermalPlan } from '../ui/RecipeThermalPlan';
import { measuredWortYield } from '../domain/brewSystemInsights';
import { partsEntieres, resumeAjouts, uniteAccordee } from '../domain/fermentables/parts';

/* T3B-11, T3B-12 : ce que la fiche lit du stock et des recettes enregistrées (des chaînes, pour qu'une relecture identique ne rende pas deux fois). */
const lireNomsDuStock = (): string => { try { return StorageService.getStocks().rawMaterials.map((i) => i.name).join('\n'); } catch { return ''; } };
/** Sans accent ni casse : « Primaire » et « primaire » sont le même mot (k2 n° 12). */
const sansAccent = (t: string): string => t.normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase();
/** La densité mesurée d'un brassin à la française (« 1.062 » → « 1,062 », k2 n° 13) ; illisible ou absente : le texte tel quel, jamais 0, « — » si rien. */
const densiteLue = (og: string | undefined | null): string => {
  if (og == null || String(og).trim() === '') return '—';
  const n = Number(String(og).trim().replace(',', '.'));
  return formatDensite(n) || String(og);
};
const lireLignees =(): string => { try { return JSON.stringify(StorageService.getRecipes().map((r) => ({ id: r.id, batchRef: r.batchRef, parentRecipeId: r.parentRecipeId }))); } catch { return '[]'; } };

export const RecipePage: React.FC<RecipePageProps> = ({
  recipe: recipeEnregistree,
  batches,
  config,
  onClose,
  onEdit,
  onDuplicate,
  onDelete,
  onBrew,
  onOpenBatch
}) => {
  // T3B-12 : la recette telle qu'on la lit (lactose et Whirlfloc hors des houblons, accents rendus par le nom du stock) ; la donnée enregistrée n'est jamais modifiée.
  const nomsDuStock = useStorageValue(lireNomsDuStock);
  const recipe = useMemo(() => recetteLue(recipeEnregistree, nomsDuStock ? nomsDuStock.split('\n') : []), [recipeEnregistree, nomsDuStock]);
  const lignees = useStorageValue(lireLignees);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Matin 16.11 (b1r : « celle de l'écran actuel sont plus mis en avant ») : le menu du « + » de la page porte ses actions, contre le + d'abord :
  // préparer un brassin, modifier, dupliquer, exporter ; « Supprimer la recette » en dernier, le plus loin du + (la plus rare, la seule qui détruit),
  // en rouge. Chaque geste est celui du bouton de la page ; la suppression ouvre la même feuille de confirmation, le bouton du bas reste.
  usePlusPage({
    titre: recipe.name,
    actions: [
      { id: 'brasser', label: 'Préparer un brassin', genre: 'brasser', lancer: onBrew },
      { id: 'modifier', label: 'Modifier la recette', genre: 'modifier', lancer: onEdit },
      { id: 'dupliquer', label: 'Dupliquer la recette', genre: 'dupliquer', lancer: onDuplicate },
      { id: 'exporter', label: 'Exporter la recette', hint: 'copier le texte', genre: 'exporter', lancer: () => setExportOpen(true) },
      { id: 'supprimer', label: 'Supprimer la recette', hint: 'après confirmation', genre: 'supprimer', lancer: () => setConfirmDelete(true) }
    ]
  });
  const [simulatingNolo, setSimulatingNolo] = useState(false);
  const knowledge = useStorageValue(StorageService.getHopKnowledge);
  const noloWort = useMemo(() => {
    if (!recipe.nolo?.enabled) return undefined;
    try { return noloScenarioInput(recipe, knowledge).og; } catch { return undefined; }
  }, [recipe, knowledge]);
  const coldPilot = useMemo(() => {
    if (!recipe.nolo?.enabled || recipe.nolo.process !== 'coldExtraction') return null;
    try { return matchingNoloSimulation(noloScenarioInput(recipe, knowledge)); } catch { return null; }
  }, [recipe, knowledge]);
  const waterDisplay = useMemo(() => savedWaterDisplay(recipe.waterPlan), [recipe.waterPlan]);
  const waterReadings = useMemo(() => describeSavedRecipeWater(recipe), [recipe]);
  const waterModelIssue = waterReadings?.waterModelIssue;
  const retainedAcid = waterReadings?.retainedAcid;
  const acidProduct = recipe.waterPlan?.acid?.id;
  const acidUnit = acidProduct ? ACIDS[acidProduct].unit : undefined;
  const retainedMashAcid = typeof retainedAcid?.mash === 'number' && Number.isFinite(retainedAcid.mash) && retainedAcid.mash >= 0
    ? retainedAcid.mash : undefined;
  const retainedSpargeAcid = typeof retainedAcid?.sparge === 'number' && Number.isFinite(retainedAcid.sparge) && retainedAcid.sparge >= 0
    ? retainedAcid.sparge : undefined;

  const brewhouse = recipe.brewhouse ??
    config.brewhouses.find((b) => b.id === config.activeBrewhouseId) ?? config.brewhouses[0];

  const hops = useMemo(() => (recipe.hops ?? []).map(normalizeHop), [recipe.hops]);
  const grouped = useMemo(() => groupByStage(hops), [hops]);
  const measuredExtraction = !!recipe.nolo?.enabled && ['coldExtraction','secondRunnings'].includes(recipe.nolo.process);

  const fermentables = recipe.fermentables ?? [];
  /** La facture de GRAIN : le sucre n'y entre pas, ni pour la masse ni pour les %. */
  const grains = useMemo(() => fermentables.filter((f) => f.kind === 'grain'), [fermentables]);
  const others = useMemo(() => fermentables.filter((f) => f.kind !== 'grain'), [fermentables]);
  const totalGrist = useMemo(() => grains.reduce((s, f) => s + f.weightKg, 0), [grains]);

  // La couleur vient de tout ce qui colore le moût, sirop candi compris (CF-1) : la même fonction que l'assistant et la liste.
  const color = useMemo(
    () => measuredExtraction ? null : recipeBeerColor(fermentables, recipe.volumeL),
    [fermentables, recipe.volumeL, measuredExtraction]
  );
  // TL-17 : parts entières qui font 100 % (plus forts restes), pas chaque part arrondie seule.
  const partsGrain = useMemo(() => partsEntieres(grains.map((g) => g.weightKg)), [grains]);
  const colorMissing = useMemo(() => missingColorData(grains), [grains]);
  // T4-5 : des couleurs lues sur la fiche publiée du malteur (la recette enregistrée n'en porte pas) : la pastille EBC le dit.
  const couleurDeFiche = useMemo(() => fermentables.some((f, i) => Number.isFinite(f.colorEbc) && !Number.isFinite(recipeEnregistree.fermentables?.[i]?.colorEbc)), [fermentables, recipeEnregistree.fermentables]);

  const points = useMemo(
    () =>
      BrewingMath.extractPoints(fermentables, recipe.volumeL, recipe.efficiencyPct ?? brewhouse?.efficiencyPct ?? 75),
    [fermentables, recipe.volumeL, brewhouse, recipe.efficiencyPct]
  );
  const ogPredicted = useMemo(
    () => recipe.nolo?.enabled ? BrewingMath.calculateOg(fermentables, recipe.volumeL, recipe.efficiencyPct ?? brewhouse?.efficiencyPct ?? 75)
      : yeastRecipeComputedOg({ fermentables, volumeL: recipe.volumeL, efficiencyPct: recipe.efficiencyPct ?? brewhouse?.efficiencyPct ?? 75 }),
    [fermentables, recipe.volumeL, brewhouse, recipe.efficiencyPct, recipe.nolo?.enabled]
  );

  // Règle unique de la liste, de la fiche et de l'assistant : domain/recipeMetrics.ts (test en ligne du 07.11).
  const og = recipe.nolo?.enabled ? noloWort?.range.max ?? 0 : ogRecette(recipe, recipe.efficiencyPct ?? brewhouse?.efficiencyPct ?? 75) || ogPredicted || 0;

  const boilOg = useMemo(() => recipe.nolo?.enabled ? og || null : yeastRecipeBoilOg({ ...recipe, efficiencyPct: recipe.efficiencyPct ?? brewhouse?.efficiencyPct ?? 75 }, { og: og || null }).og, [recipe, og, brewhouse?.efficiencyPct]);
  // RL-4 : « densité en début d'ébullition » n'est pas l'OG : le moût a perdu de l'eau à l'ébullition (conservation des points, une seule source).
  // L'inconnu (pas de volume avant ébullition, pas d'évaporation) ne se montre pas : jamais l'OG à sa place.
  const debutEbullition = useMemo(() => recipe.nolo?.enabled || !boilOg ? undefined : densiteDebutEbullition({ ...recipe, ogTarget: boilOg } as never),
    [recipe, boilOg]);
  const bitterness = useMemo(() => amertumeRecette(recipe, recipe.efficiencyPct ?? brewhouse?.efficiencyPct ?? 75, { og: og || null, nolo: !!recipe.nolo?.enabled }),
    [recipe, og, brewhouse?.efficiencyPct]);
  const ibuOf = (hop: HopIngredient) => ibuDeLAjout(hops, hop, recipe.volumeL, boilOg, recipe.boilMin ?? 60);
  // TE-33 : sans ajout à chaud dosé, pas de « 0 IBU » : l'IBU annoncé s'il y en a un (comme la liste, ibuListe), sinon l'inconnu.
  const ajoutAChaud = hops.some((h) => h.stage !== 'dryHop' && h.weightG > 0);
  const ibuTotal = !ajoutAChaud ? (recipe.ibuTarget && recipe.ibuTarget > 0 && !recipe.nolo?.enabled ? recipe.ibuTarget : null)
    : bitterness.total == null ? null : Math.round(bitterness.total);

  const hopsMissingAlpha = hops.filter((h) => h.stage !== 'dryHop' && !h.alpha).map((h) => h.name);

  const projection = useMemo(() => recipe.nolo?.enabled ? null : projectYeastRecipe({ ...recipe,
    efficiencyPct: recipe.efficiencyPct ?? brewhouse?.efficiencyPct ?? 75 }, { og,
    reference: resolveFermentationYeast(recipe, yeastReferences(knowledge)) }), [recipe, brewhouse?.efficiencyPct, knowledge, og]);
  const fgPredicted = projection?.fg.range?.min === projection?.fg.range?.max ? projection?.fg.range?.min ?? null : null;
  const fg = recipe.nolo?.enabled ? null : fgRecette(recipe, fgPredicted);

  const projectedAbv = projection?.abv.range?.min === projection?.abv.range?.max ? projection?.abv.range?.min ?? null : null;
  const abv = recipe.nolo?.enabled ? null : recipe.abvTarget ?? projectedAbv;
  // TE-12 / PD-8 : sans cible ni point unique, la plage sourcée de la levure s'écrit (« 1,008–1,012 », « plage ») au lieu d'un « — » renvoyé à la Levure.
  const plageFg = !fg && projection?.fg.range && projection.fg.range.min !== projection.fg.range.max ? projection.fg.range : null;
  const plageAbv = !abv && projection?.abv.range && projection.abv.range.min !== projection.abv.range.max ? projection.abv.range : null;
  const pourquoiVide = (e?: { reasons: string[] }) => e?.reasons?.[0] ?? 'projection indisponible · voir Levure';

  /** Les mesures de tête sans chiffre, groupées par raison : une ligne sous la carte, jamais du texte dans une case (n° 11). */
  const raisonsDeTete = (() => {
    const nolo = !!recipe.nolo?.enabled;
    const brut: [string, string][] = [];
    if (!(og > 1)) brut.push(['OG', nolo ? 'moût à caractériser' : 'potentiel des malts à renseigner']);
    if (!nolo && !fg && !plageFg) brut.push(['FG', 'projection indisponible · voir Levure']);
    if (ibuTotal === null) brut.push(['IBU', 'ajouts de houblon à vérifier']);
    if (!color && colorMissing.length === 0) brut.push(['EBC', measuredExtraction ? 'extraction à caractériser' : 'couleur des malts à renseigner']);
    if (!nolo && !abv && !plageAbv) brut.push(['ABV', 'projection indisponible · voir Levure']);
    if (!nolo && abv && !projection?.abv.range && recipe.abvTarget != null) brut.push(['ABV', 'cible conservée, projection indisponible · voir Levure']);
    const parRaison = new Map<string, string[]>();
    for (const [nom, raison] of brut) parRaison.set(raison, [...(parRaison.get(raison) ?? []), nom]);
    return [...parRaison].map(([raison, noms]) => `${noms.join(', ')} : ${raison}`);
  })();

  // T3B-11 : la règle de la feuille des recettes (lien `batchRef` compris, lignée des versions comprise).
  const relatedBatches = useMemo(() => brassinsDeLaRecette(recipe, batches, JSON.parse(lignees) as Array<Pick<Recipe, 'id' | 'batchRef' | 'parentRecipeId'>>), [recipe, batches, lignees]);

  const dryHopTotal = hops
    .filter((h) => h.stage === 'dryHop')
    .reduce((s, h) => s + h.weightG, 0);


  const [exportOpen, setExportOpen] = useState(false);
  const [dockPriority] = useState(nextActionDockPriority);
  /** Le détail des ajouts et le potentiel aromatique : deux états de la section Houblons (liens de la ligne du total, ou toucher d'un nom), jamais deux cartes au repos. */
  const [panneau, setPanneau] = useState<'detail' | 'potentiel' | null>(null);
  const [potentielVu, setPotentielVu] = useState(false);
  const basculer = (p: 'detail' | 'potentiel') => { setPanneau((cur) => cur === p ? null : p); if (p === 'potentiel') setPotentielVu(true); };
  const styleResolu = useMemo(() => resolveBrewingStyle(recipe.style, recipe.styleRef, brewingStyles(knowledge)), [recipe.style, recipe.styleRef, knowledge]);
  /** Plage documentée du style (null : pas de piste, jamais une plage inventée). */
  const plage = (k: 'ibu' | 'fg' | 'abv'): [number, number] | null => { const r = styleResolu?.stats[k]; return r ? [r.min, r.max] : null; };
  const empatage = useMemo(() => segmentsEmpatage(recipe), [recipe]);
  const ferment = useMemo(() => pointsFermentation(recipe.fermentation), [recipe.fermentation]);
  const eauTotale = recipe.waterPlan ? recipe.waterPlan.mashWaterL + recipe.waterPlan.spargeWaterL : null;
  const osmoseeL = recipe.waterPlan ? (recipe.waterPlan.mashWaterL * recipe.waterPlan.diRatioPct + recipe.waterPlan.spargeWaterL * (recipe.waterPlan.spargeDiRatioPct ?? recipe.waterPlan.diRatioPct)) / 100 : 0;
  /** Écart de chaque brassin mesuré à l'OG de sa recette figée, en points : un brassin sans OG mesurée n'entre pas dans la moyenne. */
  const ecartsOg = relatedBatches.flatMap((b) => {
    const mesure = b.og ? parseFloat(b.og) : null, cible = b.recipeSnapshot?.ogTarget;
    return mesure && cible != null ? [Math.abs(Math.round((mesure - cible) * 1000))] : [];
  });
  const buildText = () => recipeToText({
    recipe, name: recipe.name, style: recipe.style ?? '', volumeL: recipe.volumeL, boilMin: recipe.boilMin ?? 60,
    og: og > 1 ? og : null, fg, abv, ibu: ibuTotal, ebc: color?.ebc ?? null,
    efficiencyPct: recipe.efficiencyPct ?? brewhouse?.efficiencyPct ?? null,
    fermentables, totalGristKg: totalGrist, hops, hopIbu: (h) => ibuOf(h),
    yeast: recipe.yeast, mashSteps: recipe.mash?.steps ?? [], fermentation: recipe.fermentation ?? []
  });
  const deroule = instructionsAffichees(recipe.instructions);
  const conduiteDansFermentation =!recipe.nolo?.enabled && !readYeastRecipeDesign(recipe);
  const grainTitre = recipe.nolo?.enabled && recipe.nolo.process === 'secondRunnings' ? 'Drêches d’origine' : 'Grain';

  return (
    <PageShell
      className="recipe-reference"
      // Maquette r1 : l'en-tête tient sur une ligne, « New England IPA 19 L » (le style est dans la pastille sous le bandeau).
      // Le volume est celui de la recette (jamais le défaut du matériel), grisé comme sur r1 (r1-repos-haut.png) ;
      // `titleLabel` garde « nom volume » en texte pour le titre et la zone de contenu. Inconnu : « — L », jamais 0.
      title={<>{recipe.name} <span className="font-normal text-cave-400">{formatLitres(recipe.volumeL)}</span></>}
      titleLabel={`${recipe.name} ${formatLitres(recipe.volumeL)}`}
      onClose={onClose}
      footer={!simulatingNolo &&
        // k2 n° 15 : à 700 px et plus, la barre tient la même colonne de 540 px que la fiche (rc-colonne), pas toute la largeur de la page.
        <div className="flex items-center gap-2 min-[700px]:max-w-[540px] min-[700px]:mx-auto">
        <button
          type="button"
          onClick={onBrew}
          className="flex-1 min-h-touch rounded-control bg-ebc-straw text-cave-950
                     font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
        >
          <FlaskConical className="w-5 h-5" />
          Préparer un brassin
        </button>
        {/* Maquette r1 : le « + » rond à droite de « Préparer un brassin », dans le pied, rien de couvert. Le lanceur se pose sur cette case
            (même mécanisme que la case d'en-tête clavier ouvert) ; sa priorité reste sous celle de la case d'en-tête, qui garde la main au clavier. */}
        <ActionDock kind="page-compact" priority={dockPriority} className="shrink-0 h-11 w-11" />
        </div>
      }
    >
      {/* Maquette r1 : à 700 px et plus, la fiche tient en une colonne de 540 px (les doses restent près des noms) ; au téléphone, toute la largeur. */}
      <div className="rc-colonne" data-element="r1-colonne">
      <BrewerChat hideLauncher scope={{kind:'recipe',id:recipe.id}} label={recipe.name} phase="Recette" />
      {/* --- Actions nommées (maquette r1) : Modifier, Exporter ------------- */}
      <div className="rc-entete" data-element="r1-actions">
        <button type="button" className="rc-act" onClick={onEdit} aria-label="Modifier la recette"><Pencil className="w-3.5 h-3.5" aria-hidden="true" />Modifier</button>
        <button type="button" className="rc-act" onClick={() => setExportOpen(true)} aria-label="Exporter la recette"><Download className="w-3.5 h-3.5" aria-hidden="true" />Exporter</button>
      </div>

      {/* --- Bandeau Grain · OG · IBU · EBC, puis style, FG, ABV --------------- */}
      <div role="group" aria-label="Repères de la recette" className="space-y-1.5">
        {recipe.nolo?.enabled && <NoloRecipeOverview recipe={recipe} saved={knowledge}/>}
        <div className="rc-bandeau" data-element="r1-bandeau" data-commun="bandeau">
          <Rep label="Grain" value={totalGrist > 0 ? Units.format(totalGrist, 'kg') : null} hint="aucun malt renseigné" />
          <Rep
            label={recipe.nolo?.enabled ? og > 1 ? noloWort?.origin === 'measurement' ? 'OG mesurée' : 'OG calculée' : 'OG à mesurer' : 'OG'}
            value={og > 1 ? formatDensite(og) : null}
            hint={recipe.nolo?.enabled ? 'moût à caractériser' : 'renseigne le potentiel des malts'}
          />
          {/*
            L'IBU affiché est CALCULÉ, pas recopié : il bouge quand on change un houblon. Quand la recette d'origine en annonce
            un autre, on montre les deux (les modèles d'amertume diffèrent) ; masquer l'écart laisserait croire à une erreur.
            C'est l'IBU à chaud : le dry hop n'y entre pas (info-bulle).
          */}
          <Rep
            label="IBU"
            title={dryHopTotal > 0 ? 'IBU à chaud : le dry hop n’y compte pas' : undefined}
            value={ibuTotal !== null ? String(ibuTotal) : null}
            hint="vérifie les ajouts de houblons"
            note={ibuTotal !== null && recipe.ibuTarget && Math.abs(recipe.ibuTarget - ibuTotal) > Math.max(5, ibuTotal * 0.1) ? `${recipe.ibuTarget} annoncé` : undefined}
          >
            {ibuTotal !== null && <Piste valeur={ibuTotal} plage={plage('ibu')} etiquette="IBU" />}
          </Rep>
          <Rep label="EBC" value={color ? formatDecimal(color.ebc) : null} hint={measuredExtraction ? 'extraction à caractériser' : 'renseigne la couleur des malts'} swatch={color?.swatch}
            note={color && couleurDeFiche ? 'fiche du malteur' : undefined} />
        </div>
        <div className="rc-rang" data-element="r1-style">
          {/* Le nom du catalogue des styles (BJCP) quand le style se résout (« NEIPA » → « Hazy IPA 21C »), le nom saisi sinon. */}
          {recipe.style && <span className="rc-pastille rc-sty" data-role="style"><i aria-hidden="true" />{styleResolu?.name ?? recipe.style}{styleResolu && <small>{styleResolu.code}</small>}</span>}
          {!recipe.nolo?.enabled && <span className="rc-pastille" data-booster="plage-fg">
            <span className="rc-l">FG</span>
            {fg ? <b className="rc-v reading">{formatDensite(fg)}</b>
              : plageFg ? <><b className="rc-v reading" title="plage d'atténuation documentée de la levure">{formatDensite(plageFg.min)}–{formatDensite(plageFg.max)}</b><span className="rc-note">plage</span></>
              : <b className="rc-v reading" title={pourquoiVide(projection?.fg)}>—</b>}
            {fg && <Piste valeur={fg} plage={plage('fg')} etiquette="FG" />}
          </span>}
          {!recipe.nolo?.enabled && <span className="rc-pastille" data-booster="plage-abv">
            <span className="rc-l">ABV</span>
            {abv ? <b className="rc-v reading">{`${formatDecimal(abv, 1)} %`}</b>
              : plageAbv ? <><b className="rc-v reading" title="plage d'atténuation documentée de la levure">{`${formatDecimal(plageAbv.min, 1)}–${formatDecimal(plageAbv.max, 1)} %`}</b><span className="rc-note">plage</span></>
              : <b className="rc-v reading" title={pourquoiVide(projection?.abv)}>—</b>}
            {abv && <Piste valeur={abv} plage={plage('abv')} etiquette="ABV" />}
            {abv && !projection?.abv.range && recipe.abvTarget != null && <span className="rc-note">cible</span>}
          </span>}
        </div>
        {(colorMissing.length > 0 || hopsMissingAlpha.length > 0) && (
          <div className="space-y-1">
            {colorMissing.length > 0 && (
              <p className="flex items-start gap-2 text-sm text-cave-400">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-ebc-amber" />
                <span>Couleur EBC manquante sur {colorMissing.join(', ')} — elle figure sur la fiche technique du malteur.</span>
              </p>
            )}
            {hopsMissingAlpha.length > 0 && (
              <p className="flex items-start gap-2 text-sm text-cave-400">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-ebc-amber" />
                <span>Taux d’alpha manquant sur {[...new Set(hopsMissingAlpha)].join(', ')} — sans lui, leur amertume n’est pas comptée.</span>
              </p>
            )}
          </div>
        )}
        {raisonsDeTete.length > 0 && <p className="rc-note" data-role="raisons-tete">{raisonsDeTete.join(' · ')}</p>}
      </div>

      {/* --- Houblons : variété × moment, ouverte ---------------------------- */}
      <FicheSection title="Houblons" defaultOpen dataElement="r1-houblons">
        <TableauHoublons
          hops={hops}
          onNom={() => setPanneau('detail')}
          actions={<>
            <button type="button" className="rc-lien" aria-expanded={panneau === 'detail'} aria-controls="rc-detail-ajouts" onClick={() => basculer('detail')}>Détail des ajouts et IBU</button>
            <button type="button" className="rc-lien" aria-expanded={panneau === 'potentiel'} aria-controls="rc-potentiel" onClick={() => basculer('potentiel')}>Potentiel aromatique</button>
          </>}
        />
        {/* Le tableau ne porte pas l'IBU par ajout, ni la température du whirlpool, ni le jour du dry hop : ils vivent ici, dans le DOM dès le repos. */}
        <div id="rc-detail-ajouts" className="rc-ann" data-element="r1-detail-ajouts" hidden={panneau !== 'detail'}>
        <HopBitternessPanel hops={hops} volumeL={recipe.volumeL} og={og || null} boilMin={recipe.boilMin ?? 60} hot={bitterness}/>
        {grouped.length === 0 ? null : (
          <div className="space-y-2">
            {grouped.map(({ stage, hops: list }) => {
              const style = HOP_STAGE[stage];
              const subtotal = list.reduce((s, h) => s + h.weightG, 0);
              return (
                <div key={stage} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={`text-sm px-2 py-0.5 rounded-full border ${style.tone}`}
                    >
                      {style.label}
                    </span>
                    <span className="reading text-sm text-cave-400">
                      {Units.format(subtotal, 'g')}
                    </span>
                  </div>
                  <p className="text-sm text-cave-400 leading-snug">{style.hint}</p>

                  <ul className="divide-y divide-cave-850">
                    {list.map((h, i) => {
                      const ibu = style.bitters ? ibuOf(h) : 0;
                      return (
                        <li key={`${h.name}-${i}`} className="py-1.5 flex items-baseline gap-2">
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm text-cave-50 break-words">{h.name}</span>
                            <span className="block text-sm text-cave-400">
                              {describeMoment(h)}
                              {h.alpha ? ` · ${nombreFr(h.alpha, 2)} % α` : ' · alpha inconnu'}
                            </span>
                          </span>
                          <span className="text-right shrink-0">
                            <span className="block reading text-sm text-cave-50">
                              {Units.format(h.weightG, 'g')}
                            </span>
                            {style.bitters && (
                              <span className="block reading text-sm text-cave-400">
                                {ibu != null ? `${formatDecimal(ibu, 1)} IBU` : '— IBU'}
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
        </div>
        {/* Le potentiel aromatique ne se monte qu'à la première ouverture (rapport lourd). */}
        <div id="rc-potentiel" className="rc-ann" data-element="r1-potentiel" hidden={panneau !== 'potentiel'}>
        {potentielVu && <LazySurface resetKey={`aroma:${recipe.id}`} fallback={<div role="status">Préparation du potentiel aromatique…</div>}>
          <details><summary className="min-h-touch cursor-pointer text-water">Style et sources</summary><BrewingStyleDetails recipe={recipe}/></details>
          <HopRecipePanel recipe={recipe} onEdit={onEdit} />
        </LazySurface>}
        </div>
      </FicheSection>

      {/* --- Levure au premier plan : la ligne de la maquette ----------------- */}
      <FicheSection
        title="Levure"
        dataElement="r1-levure"
        deferContent={!!readYeastRecipeDesign(recipe)}
        icone={<Dna className="w-[18px] h-[18px] shrink-0 text-cave-200" aria-hidden="true" />}
        entete={recipe.nolo?.enabled ? recipe.yeast.name : <YeastRecipeHeading recipe={recipe} />}
      >
        {!recipe.nolo?.enabled && readYeastRecipeDesign(recipe) ? <LazySurface resetKey={`yeast:${recipe.id}`} fallback={<div role="status">Préparation de la conduite de levure…</div>}><FermentationRecipeSummary recipe={recipe} onEdit={onEdit} /></LazySurface> : !recipe.yeast?.name ? (
          <p className="text-sm text-cave-400">Aucune levure renseignée.</p>
        ) : (
          <div className="space-y-2">
            <p className="text-base text-cave-50">
              {identiteLevure(recipe.yeast)}
            </p>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <dt className="text-sm text-cave-400">Quantité</dt>
                <dd className="reading text-sm">
                  {recipe.yeast.qty > 0 ? `${recipe.yeast.qty.toLocaleString('fr-FR', { maximumFractionDigits: 20 })} ${uniteAccordee(recipe.yeast.unit, recipe.yeast.qty)}`.trim() : 'À renseigner'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-cave-400">Forme</dt>
                <dd className="text-base text-cave-50">{recipe.yeast.form}</dd>
              </div>
              {/* RL-3 : « Ensemencement – » alors que la température est réglée aux Paliers : on dit ce qui est réglé (l'ensemencement, sinon le primaire), jamais un tiret. */}
              {(() => {
                const primaire = recipe.fermentation?.find(s => s.kind === 'primaire')?.tempC;
                const [libelle, valeur] = recipe.yeast.pitchTempC != null ? ['Ensemencement', recipe.yeast.pitchTempC] : ['Primaire', primaire];
                return typeof valeur === 'number' && Number.isFinite(valeur) ? (
                  <div>
                    <dt className="text-sm text-cave-400">{libelle}</dt>
                    <dd className="reading text-sm">{`${nombreFr(valeur, 1)} °C`}</dd>
                  </div>
                ) : null;
              })()}
            </dl>
            {(() => {
              const note = noteLevureAJour(recipe.yeast.notes, {
                quantiteSaisie: recipe.yeast.qty != null && recipe.yeast.qty > 0,
                conduiteSaisie: (recipe.fermentation ?? []).some(s => s.kind === 'primaire' && typeof s.tempC === 'number')
              });
              return note ? <p className="text-sm text-cave-400 leading-snug">{note}</p> : null;
            })()}
          </div>
        )}
      </FicheSection>

      {/* Cas hors maquette, rangé dans un état de la maquette : le suivi NOLO est une section de plus, seulement en NOLO. */}
      {recipe.nolo?.enabled&&<FicheSection title="Suivi NOLO" resume="Simuler, analyses et conservation" deferContent><LazySurface resetKey={`nolo:${recipe.id}`} fallback={<div role="status">Préparation du suivi NOLO…</div>}><NoloPanel recipe={recipe} showOverview={false} onVariantChange={setSimulatingNolo}/></LazySurface></FicheSection>}

      {/* --- Grain : la barre des parts en résumé ----------------------------- */}
      <FicheSection
        title={grainTitre}
        dataElement="r1-grain"
        resume={recipe.nolo?.enabled && recipe.nolo.process === 'secondRunnings' ? 'Malt du brassin d’origine · aucun nouveau débit'
          : measuredExtraction ? `${Units.format(totalGrist, 'kg')} à extraire · rendement à mesurer`
          : <BarreGrain parts={partsGrain} noms={grains.map((g) => g.name)} ebc={grains.map((g) => g.colorEbc)} />}
      >
        <p className="rc-note">
          {color && <>Couleur attendue : <span className="text-cave-200">{color.label}</span> — {nombreFr(color.ebc, 1)} EBC · </>}
          {`${Units.format(totalGrist, 'kg')} au total · ${(recipe.efficiencyPct ?? brewhouse?.efficiencyPct) != null ? `${nombreFr((recipe.efficiencyPct ?? brewhouse?.efficiencyPct) as number, 1)} % d’efficacité` : 'efficacité inconnue'}`}.
        </p>
        {grains.length === 0 ? (
          <p className="text-sm text-cave-400">Aucun malt renseigné.</p>
        ) : (
          <ul className="divide-y divide-cave-850">
            {grains.map((m, i) => {
              const pct = partsGrain[i] ?? 0;
              return (
                <li key={`${m.name}-${i}`} className="py-1.5 flex items-baseline gap-2">
                  <span className="reading text-sm text-cave-400 w-12 shrink-0 text-right">
                    {nombreFr(pct, 0)} %
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-cave-50 break-words">{m.name}</span>
                    {m.colorEbc != null && (
                      <span className="block text-sm text-cave-400">{nombreFr(m.colorEbc, 1)} EBC</span>
                    )}
                  </span>
                  <span className="reading text-sm text-cave-50 shrink-0">
                    {Units.format(m.weightKg, 'kg')}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {/* Sucres, lactose, fruits : séparés du grain (ils n'entrent ni dans la facture de grain ni dans la couleur, et ne fermentent pas tous). */}
        {others.length > 0 && (
          <div data-role="sucres-ajouts" className="space-y-1">
            <h3 className="rc-sub-t text-cave-200">Sucres et ajouts · <span className="rc-note">{resumeAjouts(others)}</span></h3>
          {(points?.unfermentable ?? 0) > 2 && (
            <p className="pb-1 text-sm text-cave-400">{nombreFr(points!.unfermentable, 0)} points de densité que la levure ne peut pas manger : ils restent dans la bière.</p>
          )}
          <ul className="divide-y divide-cave-850">
            {others.map((f, i) => (
              <li key={`${f.name}-${i}`} className="py-1.5 flex items-baseline gap-2">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-cave-50 break-words">{f.name}</span>
                  <span className="block text-sm text-cave-400">
                    {f.use === 'fermentation'
                      ? `en fermentation, J+${f.dayOffset ?? 0}`
                      : f.use === 'ebullition'
                        ? 'à l’ébullition'
                        : 'à l’empâtage'}
                    {' · '}
                    {f.fermentabilityPct === 0
                      ? 'non fermentescible'
                      : `${nombreFr(f.fermentabilityPct ?? 100, 1)} % fermentescible`}
                  </span>
                </span>
                <span className="reading text-sm shrink-0">
                  {Units.format(f.weightKg, 'kg')}
                </span>
              </li>
            ))}
          </ul>
          </div>
        )}
      </FicheSection>

      {/* --- Empâtage : mini courbe en résumé, courbe graduée ouverte ----------- */}
      {recipe.mash?.steps?.length > 0 && (coldPilot ? (
        <FicheSection title="Extraction à froid prévue" dataElement="r1-empatage" resume={<span className="rc-m">{`${coldPilot.settings.extractionTempC.toLocaleString('fr-FR')} °C · ${coldPilot.settings.extractionHours.toLocaleString('fr-FR')} h`}</span>}>
          <p className="text-sm text-cave-50">Maintenir {coldPilot.settings.extractionTempC.toLocaleString('fr-FR')} °C pendant {coldPilot.settings.extractionHours.toLocaleString('fr-FR')} h, puis filtrer.</p>
          <p className="text-xs text-cave-200">Consignes du pilote ; relever la température, le volume, la densité et le pH réellement obtenus.</p>
        </FicheSection>
      ) : (
        <FicheSection
          title={measuredExtraction ? 'Paliers chauds de référence' : 'Empâtage'}
          dataElement="r1-empatage"
          resume={!measuredExtraction && empatage.principal != null
            ? <><MiniCourbe points={pointsEmpatage(empatage.segments)} couleur="rgb(var(--ebc-copper-texte))" /><span className="rc-m">{nombreFr(empatage.principal, 0)} °C</span></>
            : nombreAccorde(recipe.mash.steps.length, 'palier')}
          resumeOuvert={!measuredExtraction && empatage.holdMin != null ? <span className="rc-m">≈ {nombreFr(empatage.holdMin, 0)}′ de maintien</span> : undefined}
        >
          {measuredExtraction && <p className="text-xs text-cave-200">Ce programme enregistré ne définit pas le protocole de {recipe.nolo?.process === 'coldExtraction' ? 'l’extraction à froid' : 'la seconde extraction'}.</p>}
          {!measuredExtraction && <CourbeEmpatage segments={empatage.segments} />}
          {!measuredExtraction && recipe.waterPlan && (
            <div className="rc-puces" data-element="r1-puces-empatage">
              <span className="rc-pastille">empâtage <b className="rc-v">{nombreFr(recipe.waterPlan.mashWaterL, 1)} L</b>{recipe.mash.ratioLPerKg ? <> · <b className="rc-v">{nombreFr(recipe.mash.ratioLPerKg, 1)} L/kg</b></> : null}</span>
              {recipe.waterPlan.spargeWaterL > 0 && <span className="rc-pastille">{recipe.mash.spargeType === 'batch' ? 'rinçage par bacs' : recipe.mash.spargeType === 'fly' ? 'rinçage continu' : 'rinçage'} <b className="rc-v">{nombreFr(recipe.waterPlan.spargeWaterL, 1)} L</b>{recipe.mash.spargeTempC != null ? <> · <b className="rc-v">{nombreFr(recipe.mash.spargeTempC, 0)} °C</b></> : null}</span>}
            </div>
          )}
          {/* Maquette r1 : l'Empâtage ouvert = la courbe et les deux pastilles d'eau. Les paliers en liste, l'eau de rinçage et le repère de chauffe vivent dans le repli « Montées… ». */}
          {(() => { const liste = (<>
                <h3 className="sr-only">
                  Empâtage
                  {recipe.mash.ratioLPerKg ? ` · ${recipe.mash.ratioLPerKg.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L/kg` : ''}
                  {recipe.mash.spargeType === 'fly'
                    ? ' · rinçage continu'
                    : recipe.mash.spargeType === 'batch'
                      ? ' · rinçage par bacs'
                      : ''}
                </h3>
                <ul className="divide-y divide-cave-850">
                  {[...recipe.mash.steps, ...(recipe.mash.mashoutEnabled !== false && recipe.mash.mashoutTempC != null && !recipe.mash.steps.some(s=>/mash.?out/i.test(s.name) && s.tempC === recipe.mash.mashoutTempC) ? [{name:'Mash-out',tempC:recipe.mash.mashoutTempC,durationMin:recipe.mash.mashoutDurationMin ?? 10}] : [])].map((s, i) => (
                    <li key={i} className="py-1.5 flex items-baseline gap-2">
                      <span className="flex-1 text-base text-cave-50">{s.name}</span>
                      <span className="reading text-sm text-water">{nombreFr(s.tempC, 1)} °C</span>
                      <span className="reading text-sm text-cave-400 w-16 text-right">
                        {s.durationMin} min
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-water mt-2">Eau de rinçage : {nombreFr(recipe.mash.spargeTempC ?? 76, 1)} °C · les durées indiquent le maintien à la consigne.</p>
                {recipe.mash.heatingRateCPerMin != null && <p className="text-sm text-cave-400 mt-1">Repère de chauffe : {nombreFr(recipe.mash.heatingRateCPerMin, 2)} °C/min. La montée est suivie séparément dans le journal.</p>}
          </>);
          return <>
            {measuredExtraction && liste}
            {/* Le détail des montées vit dans la section, replié : RecipeThermalPlan est repris tel quel. */}
            {!measuredExtraction && <FicheSection title="Montées, repères de chauffe, refroidissement">{liste}<RecipeThermalPlan recipe={recipe}/></FicheSection>}
          </>; })()}
        </FicheSection>
      ))}

      {/* --- Ébullition ---------------------------------------------------- */}
      <FicheSection title="Ébullition" dataElement="r1-ebullition" resume={<span className="rc-m">{recipe.boilMin ?? 60}′</span>}>
        {/* k2 n° 12 : la durée est déjà dans l'en-tête (« Ébullition 60′ ») ; seule la densité de début d'ébullition s'ajoute, quand elle est connue. */}
        {debutEbullition ? <p className="rc-note">Densité en début d’ébullition {formatDensite(debutEbullition)}.</p> : null}
        {recipe.adjuncts && recipe.adjuncts.length > 0 && (
          <div className="space-y-1">
            <h3 className="rc-sub-t text-cave-200">Additifs</h3>
          <ul className="divide-y divide-cave-850">
            {recipe.adjuncts.map((a, i) => (
              <li key={`${a.name}-${i}`} className="py-1.5 flex items-baseline gap-2">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-cave-50 break-words">{a.name}</span>
                  <span className="block text-sm text-cave-400">{a.step}</span>
                </span>
                <span className="reading text-sm shrink-0">
                  {Units.format(a.amount, a.unit)}
                </span>
              </li>
            ))}
          </ul>
          </div>
        )}
      </FicheSection>

      {/* --- Eau : barre osmosée / réseau et total en résumé ; le plan complet reste dans la section --- */}
      {(!recipe.nolo?.enabled||recipe.nolo.process!=='secondRunnings') && recipe.waterPlan && (
        <FicheSection
          title={coldPilot ? 'Eau prévue pour le pilote' : measuredExtraction ? 'Eau de référence' : 'Eau'}
          dataElement="r1-eau"
          resume={<>
            <BarrePart part={recipe.waterPlan.diRatioPct} a="rgb(var(--water) / .4)" b="rgb(var(--water))" libelle={`osmosée ${nombreFr(recipe.waterPlan.diRatioPct, 0)} %, réseau ${nombreFr(100 - recipe.waterPlan.diRatioPct, 0)} %`} />
            <span className="rc-m">{nombreFr(eauTotale ?? 0, 1)} L</span>
            {recipe.waterPlan.spargeWaterL <= 0 && <span>1 eau</span>}
          </>}
        >
          {/*
           * ⚠️ `targetProfileId` porte un CODE BJCP (« 21C »), et il était cherché dans `TARGET_PROFILES`, dont les identifiants sont
           * des noms d'eaux historiques : « personnalisé » sur toutes les recettes. C'est `styleByCode` qui connaît ces codes.
           */}
          <p className="rc-note">{nombreFr(recipe.waterPlan.diRatioPct, 2)} % d’osmosée · {recipe.waterPlan.targetIons ? recipe.waterPlan.targetName ?? 'cible de la recette' : styleByCode(recipe.waterPlan.targetProfileId).name}</p>
          {!measuredExtraction && <RecipeWaterVolumes totalL={recipe.waterPlan.mashWaterL+recipe.waterPlan.spargeWaterL} roL={osmoseeL}/>}
          <div className="space-y-3">
            {coldPilot ? <p className="text-xs text-cave-200">Volumes estimés pour l’extraction froide et la préparation du pilote. Confirmer l’eau ajoutée, le volume récupéré et le pH ; aucune dose d’acide chaude n’est reprise.</p> : measuredExtraction && <p className="text-sm text-cave-200">Plan d’empâtage chaud conservé comme référence. Les volumes, acides et paliers d’extraction à froid restent à établir et à mesurer.</p>}
            {!measuredExtraction&&waterReadings&&<p data-mash-diagnostic={mashPhDiagnostic(waterReadings.phEstimate,recipe.waterPlan.targetPh??5.4).status} className="text-sm text-ebc-straw">{mashPhDiagnostic(waterReadings.phEstimate,recipe.waterPlan.targetPh??5.4).message}</p>}
            {recipe.waterPlan.sourceSnapshot?.note&&<p className="text-xs text-cave-400">{recipe.waterPlan.sourceSnapshot.note}</p>}
            <BrewEquipmentSummary recipe={recipe} profile={brewhouse}/>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-cave-400">{coldPilot ? 'Extraction' : 'Empâtage'}</div>
                <div className="reading text-sm">{nombreFr(recipe.waterPlan.mashWaterL, 1)} L</div>
                {((recipe.waterPlan.diRatioPct ?? 0) > 0) && (
                  <div className="text-2xs text-cave-400 font-mono mt-0.5">
                    {nombreFr(Math.round((recipe.waterPlan.mashWaterL * (100 - (recipe.waterPlan.diRatioPct ?? 0))) / 10) / 10, 1)} L réseau · {nombreFr(Math.round((recipe.waterPlan.mashWaterL * (recipe.waterPlan.diRatioPct ?? 0)) / 10) / 10, 1)} L osmosée ({nombreFr(recipe.waterPlan.diRatioPct, 2)} %)
                  </div>
                )}
              </div>
              <div>
                <div className="text-cave-400">{coldPilot ? 'Eau complémentaire' : 'Rinçage'}</div>
                <div className="reading text-sm">{nombreFr(recipe.waterPlan.spargeWaterL, 1)} L</div>
                {recipe.waterPlan.spargeWaterL > 0 && (
                  (() => {
                    const spargeDi = recipe.waterPlan.spargeDiRatioPct ?? recipe.waterPlan.diRatioPct ?? 0;
                    if (spargeDi <= 0) return null;
                    const osmoseeL = Math.round((recipe.waterPlan.spargeWaterL * spargeDi) / 10) / 10;
                    const reseauL = Math.round((recipe.waterPlan.spargeWaterL - osmoseeL) * 10) / 10;
                    return (
                      <div className="text-2xs text-cave-400 font-mono mt-0.5">
                        {nombreFr(reseauL, 1)} L réseau · {nombreFr(osmoseeL, 1)} L osmosée ({nombreFr(spargeDi, 2)} %)
                      </div>
                    );
                  })()
                )}
              </div>
            </div>

            {/*
              ⚠️ LA TOILE, redessinée depuis le plan FIGÉ — jamais recalculée.
              La fiche ne va pas rechercher la source dans la configuration :
              son analyse a pu être corrigée depuis, et la recette doit
              continuer de montrer l'eau sur laquelle elle a été pensée. Même
              principe que `Batch.recipeSnapshot`.

              Un plan enregistré avant cette version ne porte pas les deux
              eaux : on n'affiche alors rien plutôt qu'une toile fausse.
            */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-cave-400 text-left">
                    <th scope="col" className="font-normal py-1 pr-3">Sel</th>
                    <th scope="col" className="font-normal py-1 px-2 text-right">Empâtage</th>
                    <th scope="col" className="font-normal py-1 pl-2 text-right">Rinçage</th>
                  </tr>
                </thead>
                <tbody>
                  {SALT_IDS.filter(
                    (id) => (recipe.waterPlan!.mash[id] ?? 0) > 0 || (recipe.waterPlan!.sparge[id] ?? 0) > 0
                  ).map((id) => (
                    <tr key={id} className="border-t border-cave-850">
                      <th scope="row" className="font-normal py-1.5 pr-3 text-cave-200 text-left">
                        {SALTS[id].name}
                        {ALKALINE_SALTS.includes(id) && (
                          <span className="block text-xs text-cave-400">
                            alcalin — empâtage seul
                          </span>
                        )}
                      </th>
                      <td className="py-1.5 px-2 reading text-right">
                        {nombreFr(recipe.waterPlan!.mash[id] ?? 0, 2)} g
                      </td>
                      <td className="py-1.5 pl-2 reading text-cave-400 text-right">
                        {nombreFr(recipe.waterPlan!.sparge[id] ?? 0, 2)} g
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {recipe.waterPlan.allSaltsInMash !== false && recipe.waterPlan.spargeWaterL > 0 && (
              <div className="px-2.5 py-1 text-2xs text-hop bg-hop/10 rounded border border-hop/20 flex items-center justify-between">
                <span>Tous les sels versés à l’empâtage{retainedSpargeAcid != null && retainedSpargeAcid > 0 ? ' · Rinçage acidifié seul' : ''}</span>
              </div>
            )}

            {(recipe.waterPlan.acid || waterModelIssue) && (
              <div className="space-y-1 text-base text-cave-50">
                {waterModelIssue ? <>
                  {recipe.waterPlan.mashWaterL > 0 && (retainedMashAcid == null
                    ? <p>Acidification de l’empâtage à déterminer après mesure ou titrage du pH.</p>
                    : <p>Dose d’acide d’empâtage retenue : <span className="reading text-water">
                        {nombreFr(retainedMashAcid, 2)}{acidUnit ? ` ${acidUnit}` : ''}
                      </span>{acidProduct ? ` ${deNom(ACIDS[acidProduct].name)}` : ' (produit ou unité non enregistré)'}. pH à mesurer ou titrer.</p>)}
                  {recipe.waterPlan.spargeWaterL > 0 && (retainedSpargeAcid == null
                    ? <p>Acidification de l’eau de rinçage à déterminer après mesure ou titrage du pH.</p>
                    : <p>Dose d’acide de rinçage retenue : <span className="reading text-water">
                        {nombreFr(retainedSpargeAcid, 2)}{acidUnit ? ` ${acidUnit}` : ''}
                      </span>{acidProduct ? ` ${deNom(ACIDS[acidProduct].name)}` : ' (produit ou unité non enregistré)'}. pH à mesurer ou titrer.</p>)}
                </> : <>
                  {recipe.waterPlan.acid && recipe.waterPlan.acid.mash > 0 && (
                    <p>
                      <span className="reading text-water">
                        {nombreFr(recipe.waterPlan.acid.mash, 2)} {ACIDS[recipe.waterPlan.acid.id].unit}
                      </span>{' '}
                      {deNom(ACIDS[recipe.waterPlan.acid.id].name)} dans l’eau d’empâtage, pour
                      l’alcalinité résiduelle.
                    </p>
                  )}
                  {recipe.waterPlan.acid && recipe.waterPlan.acid.sparge > 0 && (
                    <p>
                      <span className="reading text-water">
                        {nombreFr(recipe.waterPlan.acid.sparge, 2)} {ACIDS[recipe.waterPlan.acid.id].unit}
                      </span>{' '}
                      dans l’eau de rinçage, pour ne pas extraire les tanins des drêches.
                    </p>
                  )}
                </>}
              </div>
            )}

            {waterDisplay && (
              <WaterRadar
                start={waterDisplay.start}
                achieved={waterDisplay.achieved}
                style={
                  recipe.waterPlan.targetIons
                    ? styleFromTargetIons(
                        recipe.waterPlan.targetIons,
                        recipe.waterPlan.targetName ?? 'Cible de la recette'
                      )
                    : styleByCode(recipe.waterPlan.targetProfileId)
                }
              />
            )}

            <details><summary className="min-h-touch cursor-pointer text-sm text-water">pH et chimie détaillée</summary>
            {!measuredExtraction && waterReadings && (
              <WaterTargetStatus
                {...waterReadings}
                customTarget={!!recipe.waterPlan.targetIons}
                mashWaterL={recipe.waterPlan.mashWaterL}
                spargeWaterL={recipe.waterPlan.spargeWaterL}
              />
            )}

</details>
            {(recipe.waterPlan.measuredPh || recipe.waterPlan.measuredSpargePh) && (
              <p className="text-sm text-cave-400">
                pH mesuré à la cuve :{' '}
                {recipe.waterPlan.measuredPh ? `maische ${recipe.waterPlan.measuredPh}` : ''}
                {recipe.waterPlan.measuredPh && recipe.waterPlan.measuredSpargePh ? ' · ' : ''}
                {recipe.waterPlan.measuredSpargePh
                  ? `rinçage ${recipe.waterPlan.measuredSpargePh}`
                  : ''}
                .
              </p>
            )}

            {recipe.waterPlan.disabled && recipe.waterPlan.disabled.length > 0 && (
              <details><summary className="min-h-touch cursor-pointer text-sm text-cave-400">Sels non utilisés</summary><p className="text-sm text-cave-400">
                Écartés : {recipe.waterPlan.disabled.map((d) => SALTS[d].name).join(', ')}.
              </p></details>
            )}
          </div>
        </FicheSection>
      )}

      {/* --- Eau (ancien format, lu tel quel) ----------------------------- */}
      {(!recipe.nolo?.enabled||recipe.nolo.process!=='secondRunnings') && !recipe.waterPlan && recipe.water?.salts && (
        <FicheSection title="Eau" dataElement="r1-eau" resume={`${recipe.water.sourceName} · ${nombreFr(recipe.water.diRatioPct, 1)} % d’osmosée`}>
          <dl className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <dt className="text-sm text-cave-400">Gypse</dt>
              <dd className="reading text-sm">{nombreFr(recipe.water.salts.gypseG, 2)} g</dd>
            </div>
            <div>
              <dt className="text-sm text-cave-400">CaCl₂</dt>
              <dd className="reading text-sm">{nombreFr(recipe.water.salts.cacl2G, 2)} g</dd>
            </div>
            <div>
              <dt className="text-sm text-cave-400">MgSO₄</dt>
              <dd className="reading text-sm">{nombreFr(recipe.water.salts.mgso4G, 2)} g</dd>
            </div>
            <div>
              <dt className="text-sm text-cave-400">Acide lactique</dt>
              <dd className="reading text-sm">{nombreFr(recipe.water.salts.acidLacticMl, 2)} mL</dd>
            </div>
            <div>
              <dt className="text-sm text-cave-400">pH visé</dt>
              <dd className="reading text-sm text-water">{recipe.water.targetPh}</dd>
            </div>
          </dl>
        </FicheSection>
      )}

      {/* --- Fermentation : mini courbe et durée en résumé ----------------------- */}
      {((recipe.fermentation?.length ?? 0) > 0 || conduiteDansFermentation) && (
        <FicheSection
          title="Fermentation"
          dataElement="r1-fermentation"
          resume={(recipe.fermentation?.length ?? 0) === 0 ? undefined : ferment.jours != null
            ? <><MiniCourbe points={ferment.points} couleur="rgb(var(--water))" /><span className="rc-m">{nombreFr(ferment.jours, 0)} j</span></>
            : nombreAccorde(recipe.fermentation!.length, 'phase')}
          // La conduite de levure (et « Simuler une variante ») n'a pas de rangée à elle : elle se range ici, dans la Fermentation dépliée
          // (avec un plan de levure enregistré, elle reste dans la ligne Levure dont le résumé la décrit).
          apresOuverture={conduiteDansFermentation && <div className="space-y-1" data-element="r1-conduite-levure">
            <h3 className="rc-sub-t text-cave-200">Conduite de levure</h3>
            <LazySurface resetKey={`yeast:${recipe.id}`} fallback={<div role="status">Préparation de la conduite de levure…</div>}><FermentationRecipeSummary recipe={recipe} onEdit={onEdit} /></LazySurface>
          </div>}
        >
                <ul className="divide-y divide-cave-850">
                  {(recipe.fermentation ?? []).map((s, i) => {
                    // Le type de phase se lit d'un coup : repos diacétyle et
                    // garde ne sont pas de la fermentation primaire. k2 n° 12 : la pastille qui redit le nom de la ligne (« Primaire », « Garde ») n'est pas écrite.
                    const phase = PHASE_LABEL[s.kind ?? 'primaire'];
                    const memeMot = sansAccent(phase.label) === sansAccent(s.name ?? '');
                    return (
                      <li key={i} className="py-1.5 flex items-baseline gap-2">
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm text-cave-50 break-words">{s.name}</span>
                          {(!memeMot || s.note) && <span className="flex items-center gap-2 mt-0.5">
                            {!memeMot && <span
                              className={`text-sm px-2 py-0.5 rounded-full border ${phase.tone}`}
                            >
                              {phase.label}
                            </span>}
                            {s.note && (
                              <span className="text-sm text-cave-400 truncate">{s.note}</span>
                            )}
                          </span>}
                        </span>
                        <span className="reading text-sm text-water shrink-0">{nombreFr(s.tempC, 1)} °C</span>
                        <span className="reading text-sm text-cave-400 w-16 text-right shrink-0">
                          {Number.isFinite(s.days) ? `${s.days} j` : '—'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
        </FicheSection>
      )}

      {/* --- Déroulé (cas hors maquette : seulement s'il existe) ------------------ */}
      {deroule && (
        <FicheSection title="Déroulé" resume="Tel qu’il figure sur la recette d’origine.">
          <p className="text-base text-cave-200 leading-relaxed whitespace-pre-line">{deroule}</p>
        </FicheSection>
      )}

      {/* --- Brassins : la section reste même sans brassin ; le budget s'y range -------- */}
      <FicheSection
        title="Brassins"
        dataElement="r1-brassins"
        resume={relatedBatches.length === 0 ? 'aucun brassin' : <span className="rc-m">{relatedBatches.length}{ecartsOg.length ? ` · OG ± ${nombreFr(ecartsOg.reduce((s, e) => s + e, 0) / ecartsOg.length, 0)} pts` : ''}</span>}
      >
        <BrewBudgetButton recipe={recipe} />
        {relatedBatches.length > 0 && (
          <ul className="divide-y divide-cave-850">
            {relatedBatches.map((b) => {
              const measured = b.og ? parseFloat(b.og) : null;
              const observed = b.recipeSnapshot && b.brewDay ? measuredWortYield(b.recipeSnapshot,b.brewDay,'ensemencement') : null;
              const expectedOg = b.recipeSnapshot?.ogTarget;
              const gap = measured && expectedOg != null ? {deltaPoints:Math.round((measured-expectedOg)*1000)} : null;
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => onOpenBatch(b)}
                    className="w-full min-h-touch py-1.5 flex items-baseline gap-2 text-left"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-cave-50 break-words">
                        {b.id} — {b.name}
                      </span>
                      <span className="block text-sm text-cave-400">
                        {batchDisplayDate(b) ?? 'Date à définir'}
                        {observed?.value != null ? ` · ${nombreFr(observed.value, 1)} % ${observed.scope === 'grain' ? 'de rendement mesuré' : 'd’extrait global'}` : ' · rendement : mesures à compléter'}
                      </span>
                    </span>
                    <span className="text-right shrink-0">
                      <span className="block reading text-sm">{densiteLue(b.og)}</span>
                      {gap && (
                        <span
                          className={`block reading text-sm ${
                            Math.abs(gap.deltaPoints) <= 2 ? 'text-hop' : 'text-ebc-amber'
                          }`}
                        >
                          {gap.deltaPoints >= 0 ? '+' : ''}
                          {gap.deltaPoints} pts
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </FicheSection>

      {/* --- Dupliquer à gauche, Supprimer éloigné à droite, bord rouge ------------------ */}
      <div className="rc-sup" data-element="r1-supprimer">
        <button type="button" className="rc-act" onClick={onDuplicate} aria-label="Dupliquer la recette"><Copy className="w-3.5 h-3.5" aria-hidden="true" />Dupliquer</button>
        <button type="button" className="rc-del" onClick={() => setConfirmDelete(true)} aria-label="Supprimer la recette">Supprimer la recette</button>
      </div>
      </div>

      <Sheet open={exportOpen} onClose={() => setExportOpen(false)} title="Exporter la recette" className="lg:max-w-3xl lg:mx-auto">
        <RecipeTextExport buildText={buildText} />
      </Sheet>
      <ConfirmerSuppressionRecette
        recipe={recipe}
        batches={batches}
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete();
        }}
      />
    </PageShell>
  );
};
