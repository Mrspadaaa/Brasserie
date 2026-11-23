import { Input, Textarea } from './Input';
import React, { useState, useEffect } from 'react';
import { Trash2, ArrowRight, AlertTriangle, PackageCheck, X, Sparkles } from 'lucide-react';
import { Batch, StockItem } from '../types';
import { BATCH_STATUS, statusOfBatch } from '../domain/batchStatus';
import { canMoveTo, fermentationBlockedReason, needsConfirmation, statusOptions, suggestedNextStatus, transitionConsequence } from '../domain/batchTransitions';
import { ABV_MAX, abvFromGravities, gravityKeepable, gravityMessage, gravityProblem, type GravityProblem } from '../domain/gravityBounds';
import { StorageService } from '../services/storage';
import { Sheet, ConfirmSheet } from './Sheet';
import { SuppressionLiee } from './suppression/SuppressionLiee';
import { choseBrassin } from './suppression/choses';
import { InventoryCorrectionSheet } from './InventoryCorrectionSheet';
import { NumberInput } from './NumberInput';
import { Button } from '../components/ui/Button';
import { BrewerChat } from './BrewerChat';
import { useSyncedDraft } from '../hooks/useLiveData';
import { HopTastingsPanel } from './hopIndex/HopTastingsPanel';
import { FermentationCurveChart } from '../components/charts/FermentationCurveChart';
import type { BatchDetailSection } from '../domain/productionInsights';
import { BatchGravityEntry } from './production/BatchGravityEntry';
import { formatDecimal, parseDecimal } from './numericInput';
import { NoloPanel } from './NoloPanel';
import { noloRecipeForBatch } from '../domain/nolo';
import { ChaineArgent } from './prix/ChaineArgent';
import { ModalShell, StickyActions } from './ModalShell';
import { DateField, toIsoDate } from './DateField';
import { Units } from '../services/units';
import { hasBrewStarted, actualBrewDate, plannedBrewDate, preserveBrewDates, normalizeBrewDate, breweryDay } from '../domain/batchSchedule';
import { BatchSchedule } from './production/BatchSchedule';
import { saveBatchSchedule } from '../services/batchSchedule';
import { fermenterConflict, fermenterConflictMessage } from '../domain/batchFermenter';
import { BrewSystemFeedback } from './BrewSystemFeedback';
import { yeastPreparationState } from '../domain/yeastPitching';
import type { YeastPreparationPlan } from '../../functions/src/yeastSupplySchema';
import { formatLitres } from '../domain/recipeMetrics';
import { needsPackagingVolume, packagingLimitL } from '../domain/batchPackaging';
import { BatchPackagingForm } from './production/BatchPackagingForm';
import { nombreFr } from '../domain/nombreAffiche';
import { PlannedDate, PiedPlanifie, planDeStarter } from './production/fiche/PlannedDate';
import { QuiARecuLot, type GesteFutLot } from './lot/QuiARecuLot';
import { HeroEtat, CarteDensite, CurseurFg, TuilesFg, Contenants, LignesCuve, EtapesPills, VerdictPuces, LigneRepliee } from './production/fiche/PostFiche';
import { StageLadder, type Conditionnement } from './production/fiche/StageLadder';
import { accrocherDefaireLavage, enregistrerLavage } from './KegFillSheet';
import { Cible, Mono, Panneau, Pastille } from './production/fiche/ui';
import { MARCHES, releves, planDecale, faisabilite, jourPropose } from './production/fiche/ficheModel';
import { Ellipsis, ChevronRight, Package } from 'lucide-react';
import { useCarnet } from './production/carnet/useCarnet';
import { CarnetFil, CarnetPied } from './production/carnet/CarnetFil';
import { DossierFil, DossierPied, rappelDryHop } from './production/carnet/DossierFil';
import { FicheFermentation, PanneauMesure, PiedFermentation } from './production/fermentation/FicheFermentation';
import { milliPrevu } from '../domain/fermentation/prevision';
import { avecTacheFaite, mesureInitiale, modeleFiche, plageFgDeLaLevure, releveDepuisEtat, sansTacheFaite, type ContexteStock, type EtatMesure, type Houblon } from './production/fermentation/modele';
import { planDestockageHoublon } from './production/fermentation/destockage';
import { FirestoreRepo } from '../services/firestoreRepo';

/** « Budget » : un bouton de la grille de la fiche (même gabarit que Compagnon et Étape). Il ouvre la chaîne de l'argent du brassin (coût, impôt, prix ; le budget en est la première étape) : la fiche garde ses trois rubriques. */
const BudgetLien: React.FC<{ batch: Batch; className?: string; children?: React.ReactNode; onCible?: (cible: 'densite' | 'volume') => void }> = ({ batch, className, children, onCible }) => {
  const [open, setOpen] = useState(false);
  const [proposer, setProposer] = useState(0);
  const vers = (cible: 'densite' | 'volume') => { setOpen(false); onCible?.(cible); };
  return <>
    <Cible onClick={() => setOpen(true)} className={className}>{children ?? 'Budget'}</Cible>
    {open && (
      <ModalShell open onClose={() => setOpen(false)} size="md">
        <div className="flex shrink-0 items-center justify-between border-b border-cave-800 bg-cave-900/90 px-4 py-3">
          <h4 className="text-base font-bold text-cave-50">Argent · {batch.name}</h4>
          <button type="button" aria-label="Fermer" onClick={() => setOpen(false)} className="rounded-full bg-cave-850 p-2 text-cave-400 hover:text-cave-200"><X className="h-4 w-4" aria-hidden="true" /></button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain p-4">
          <ChaineArgent batch={batch} config={StorageService.getConfig()} proposer={proposer} onNoteDensity={() => vers('densite')} onNoteLitres={() => vers('volume')} />
        </div>
        <StickyActions><Button intent="primary" full onClick={() => setProposer(n => n + 1)} icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}>Proposer</Button></StickyActions>
      </ModalShell>
    )}
  </>;
};

/**
 * Fiche d'un brassin : changer d'étape, corriger les mesures, supprimer.
 *
 * ⚠️ Les deux problèmes qu'elle règle :
 *
 *  1. Passer un brassin en « annulé » l'enregistrait bien, mais l'écran
 *     retombait sur « Planifié » parce que la table de correspondance, écrite à
 *     la main, n'avait pas d'entrée `annule`. Elle vient maintenant de
 *     `BATCH_STATUS`, que TypeScript oblige à être exhaustive.
 *
 *  2. Un brassin ne pouvait tout simplement pas être supprimé : `deleteBatch`
 *     n'existait pas dans le service de données.
 */

interface BatchDetailSheetProps {
  batch: Batch | null;
  onClose: () => void;
  initialSection?: BatchDetailSection;
  /** e1a « Commencer le brassage » : ouvre la page du jour de brassage (App). */
  onOpenBrewDay?: (batch: Batch) => void;
  /** e2a « Rebrasser cette <style> » (pied d'un brassin terminé) : ouvre la création d'un brassin de la même recette (App). Sans lui, « Fermer ». */
  onRebrew?: (batch: Batch) => void;
  /** Où poser le focus à l'ouverture (sur Mesures) : la densité initiale, ou « Saisir le volume conditionné » (un renvoi « litres »). */
  focus?: 'densite' | 'volume';
}

/**
 * CT4-B-2 : le volume sous le mot « cuve » est celui qui y est (le brassé, comme la liste), jamais le volume visé donné pour tel ;
 * sans volume brassé, le visé se dit « visé ». Ni l'un ni l'autre : rien (l'inconnu n'est jamais 0).
 */
export function volumeEnCuveLibelle(b: { volumeL?: number | null; volumeBrewedL?: number | null }): string | null {
  const brasse = Number(b.volumeBrewedL);
  if (b.volumeBrewedL != null && Number.isFinite(brasse) && brasse > 0) return formatLitres(brasse);
  const vise = Number(b.volumeL);
  return b.volumeL != null && Number.isFinite(vise) && vise > 0 ? `visé ${formatLitres(vise)}` : null;
}

/** La plage de FG de la levure (projection de la recette : quelques ms) gardée par instantané de recette : la saisie du relevé redessine la feuille à chaque geste. */
const plagesFg = new WeakMap<object, ReturnType<typeof plageFgDeLaLevure>>();
function plageFgMemo(lot: Batch): ReturnType<typeof plageFgDeLaLevure> {
  const cle = lot.recipeSnapshot as object | undefined;
  if (!cle) return plageFgDeLaLevure(lot, StorageService.getHopKnowledge());
  if (!plagesFg.has(cle)) plagesFg.set(cle, plageFgDeLaLevure(lot, StorageService.getHopKnowledge()));
  return plagesFg.get(cle) ?? null;
}

export const BatchDetailSheet: React.FC<BatchDetailSheetProps> = ({
  batch,
  onClose,
  initialSection = 'measurements',
  onOpenBrewDay,
  onRebrew,
  focus
}) => {
  const [draft, setDraft] = useSyncedDraft(batch, batch?.id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [brewDayDraft, setBrewDayDraft] = useState<string | null>(null);
  const [brewDayError, setBrewDayError] = useState('');
  const [section, setSection] = useState<BatchDetailSection>(initialSection);
  const [noloNotice,setNoloNotice]=useState('');
  /** `cibleFocus` : « Noter la densité » ou « Noter les litres » (feuille Impôt bière, coût, Prix, depuis Argent) a ouvert Mesures ; le focus se pose sur la densité initiale ou sur « Saisir le volume conditionné ». La prop `focus` fait de même à l'ouverture. */
  const [cibleFocus, setCibleFocus] = useState<'densite' | 'volume' | null>(focus ?? null);
  useEffect(() => { if (focus) setCibleFocus(focus); }, [focus, batch?.id]);
  useEffect(() => {
    if (!cibleFocus || section !== 'measurements') return;
    const timer = window.setTimeout(() => {
      const champ = document.querySelector<HTMLElement>(cibleFocus === 'volume' ? '[data-batch-packaging-open]' : 'input[name="batch_sheet_og"]');
      champ?.focus();
      champ?.scrollIntoView?.({ block: 'center' });
      setCibleFocus(null);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [cibleFocus, section]);
  /** Depuis la chaîne de l'argent (Budget) : « Noter la densité » / « Noter les litres » ramènent aux Mesures, focus posé. */
  const allerMesures = (cible: 'densite' | 'volume') => { setSection('measurements'); setCibleFocus(cible); };
  const [confirmStock, setConfirmStock] = useState<'already' | 'consume' | 'remaining' | null>(null);
  const [stockMessage, setStockMessage] = useState('');
  /** AM n° 6 : encadré du volume conditionné ; `target` = l'étape en attente, `null` = simple saisie ou correction. */
  const [packaging, setPackaging] = useState<{ target: Batch['status'] | null } | null>(null);
  const [pendingStatus, setPendingStatus] = useState<Batch['status'] | null>(null);
  /** p1 : geste Reporter de e1a (index du jour au curseur), échelle e4c ouverte, FG au curseur (millièmes) et son annulation, « ⋯ ». */
  const [datePlan, setDatePlan] = useState<string | null>(null);
  const [dateError, setDateError] = useState('');
  const [ladder, setLadder] = useState(false);
  const [fgMilli, setFgMilli] = useState<number | null>(null);
  const [fgError, setFgError] = useState('');
  const [fgUndo, setFgUndo] = useState<{ fg: string; abv: string } | null>(null);
  const [plusOpen, setPlusOpen] = useState(false);
  /** gfc : le geste « Mesurer » de la fiche en fermentation (curseur m2) ; `null` = fermé. */
  const [mesure, setMesure] = useState<EtatMesure | null>(null);
  /** E2 : « Autre » touché, le geste quitte la question « Comme prévu » pour le curseur. */
  const [autre, setAutre] = useState(false);
  useEffect(() => { setMesure(null); }, [batch?.id]);
  const [kegList, setKegList] = useState<import('../types').KegItem[]>([]);
  const [gesteFut, setGesteFut] = useState<{ quoi: GesteFutLot; n: number } | null>(null);
  const releveRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => { if (!fgUndo) return; const t = window.setTimeout(() => setFgUndo(null), 8000); return () => window.clearTimeout(t); }, [fgUndo]);
  // p5 : à l'ouverture, le focus auto de la feuille tombe sur le × et l'entoure d'un anneau. On le pose sur la feuille elle-même ; le clavier reprend ensuite normalement.
  useEffect(() => {
    if (!batch?.id) return;
    const t = window.setTimeout(() => {
      const actif = document.activeElement as HTMLElement | null;
      const dialog = actif?.closest<HTMLElement>('[role="dialog"]');
      if (actif && dialog && actif.getAttribute('aria-label') === 'Fermer') { if (dialog.tabIndex < 0) dialog.tabIndex = -1; dialog.focus({ preventScroll: true }); }
    }, 80);
    return () => window.clearTimeout(t);
  }, [batch?.id]);
  const [gravityAlert, setGravityAlert] = useState<{ field: 'og' | 'fg'; problem: GravityProblem | 'unreadable'; value: number | null; keepable: boolean } | null>(null);
  useEffect(() => {
    setPackaging(null);
    setSection(initialSection);
    setConfirmDelete(false);
    setConfirmStock(null);
    setStockMessage('');
    setPendingStatus(null);
    setGravityAlert(null);
    setDatePlan(null); setDateError(''); setLadder(false); setFgMilli(null); setFgError(''); setFgUndo(null); setPlusOpen(false);
    // e2a : un brassin terminé s'ouvre sur son Carnet, un brassin annulé sur son Dossier (initialSection par défaut seulement).
    if (initialSection === 'measurements' && batch?.status === 'termine') setSection('tasting');
    if (initialSection === 'measurements' && batch?.status === 'annule') setSection('overview');
  }, [batch?.id, initialSection]);

  // e3gb : le carnet d'un brassin en fermentation (hook avant tout retour ; inerte dans les autres états).
  const carnet = useCarnet(draft ?? null, patch => setDraft(d => (d ? { ...d, ...patch } : d)));
  // gfc n° 3 et 4 : « Ajouté auj. » sort UN houblon du stock ; le toast garde Annuler dix secondes.
  const [toastStock, setToastStock] = useState<{ nom: string; g: number; annuler: () => void } | null>(null);
  useEffect(() => { setToastStock(null); }, [batch?.id]);
  useEffect(() => { if (!toastStock) return; const t = window.setTimeout(() => setToastStock(null), 10000); return () => window.clearTimeout(t); }, [toastStock]);
  if (!batch || !draft) return null;

  const style = statusOfBatch(draft);
  const awaitingPitch = draft.brewDay?.phase === 'awaiting-pitch' && draft.brewDay.pitchedAt == null;
  const suivant = suggestedNextStatus(draft);
  const options = statusOptions(draft);
  const blockedReason = fermentationBlockedReason(draft);

  const og = parseDecimal(draft.og || '');
  const fg = parseDecimal(draft.fg || '');
  // Un alcool n'est montré, écrit et transmis que si l'OG et la FG sont plausibles et dans l'ordre.
  const nolo = !!noloRecipeForBatch(draft);
  const abv = nolo ? null : abvFromGravities(og, fg);
  const abvUnavailable = !nolo && og !== null && fg !== null && abv === null;
  // Deux densités gardables dans l'ordre, mais un alcool qui dépasse le plafond : la raison n'est pas « densités hors bornes » (valeurs confirmées).
  const abvAuDela = abvUnavailable && gravityKeepable('og', og!, null, fg) && gravityKeepable('fg', fg!, og, null);

  const field =
    'w-full min-h-touch-lg px-2 rounded-control bg-cave-950 border border-cave-700 ' +
    'text-cave-50 text-base focus:outline-none focus:border-ebc-straw transition-colors';

  const save = (patch: Partial<Batch>) => {
    const updated = { ...draft, ...patch };
    setDraft(updated);
    // Une densité refusée reste dans son champ le temps de l'alerte, mais un autre enregistrement ne l'emporte pas avec lui (RJ-2).
    const refused = gravityAlert && !(gravityAlert.field in patch) ? gravityAlert.field : null;
    StorageService.updateBatch(refused ? { ...updated, [refused]: batch[refused] ?? '' } : updated);
  };
  const pending = draft.stockConsumption?.pendingItems ?? [];
  const stockContext = pending.length ? StorageService.getStocks() : null;
  const stockNames = new Map([...(stockContext?.rawMaterials ?? []), ...(stockContext?.cleaning ?? [])].map(item => [item.ref, item.name]));
  const historicalStock = draft.stockAccountingVersion !== 1;
  const stockNotDue = draft.status === 'planifie' || draft.status === 'annule';
  const needsBrewStock = draft.stockAccountingVersion === 1 && !draft.stockConsumption?.appliedAt && draft.status !== 'planifie' && draft.status !== 'annule';
  const stockIssues = draft.stockReviewIssues ?? [];
  // TE-41 : le bandeau complet reste dans Mesures ; une erreur à corriger reste montrée là où le brasseur vient d'agir.
  const stockBannerHere = section === 'measurements' || stockIssues.length > 0;
  const synchronizeStock = (updated: Batch, stage: 'brewday' | 'remaining' | 'historical-already' | 'historical-unconsumed', confirmHistorical = false) => {
    const result = StorageService.completeBrewStock(updated, stage, confirmHistorical);
    // L9 : conditionner use ce que la table du geste contient (bouteilles, capsules…), au litre conditionné.
    if (result.success && updated.status === 'conditionne')
      StorageService.enregistrerGeste({ type: 'conditionnement', objet: updated.id, cycle: 'conditionnement', libelle: `${updated.name || updated.id} conditionné`, quantites: { litres: updated.volumePackagedL } });
    const saved = StorageService.getBatches().find(b => b.id === updated.id);
    // Déstockage refusé : l'étape ne change pas, ni à l'écran ni dans le stockage.
    const keptStatus = result.success ? updated.status : (saved?.status ?? draft.status);
    setDraft({ ...updated, status: keptStatus, ...(result.success ? { stockAccountingVersion: 1 } : {}), ...(saved?.stockConsumption ? { stockConsumption: saved.stockConsumption, stockAccountingVersion: saved.stockAccountingVersion } : {}), stockReviewIssues: result.issues });
    setStockMessage(!result.success && keptStatus !== updated.status ? `Le statut reste « ${BATCH_STATUS[keptStatus]?.label ?? keptStatus} » : le déstockage est refusé. Le stock attend les vérifications ci-dessous.` : result.success ? stage === 'historical-already' ? 'Confirmation conservée : les quantités de stock sont restées inchangées.' : stage === 'historical-unconsumed' ? 'Suivi confirmé : aucun stock retiré. Les ingrédients seront déstockés lors de la réalisation du brassin.' : stage === 'remaining' ? 'Ajouts de fermentation déstockés. Aucun ingrédient ne sera déduit une seconde fois.' : 'Ingrédients du brassage déstockés. Les ajouts de fermentation restent réservés.' : 'La production est enregistrée. Le stock attend les vérifications ci-dessous.');
  };
  const applyStatus = (status: Batch['status'], base: Batch = draft) => {
    const updated = { ...base, ...preserveBrewDates(base), status };
    // Abandon, retour en arrière : le statut seul change, le stock n'est jamais touché ici.
    if (status === 'annule' || status === 'planifie' || options.find(o => o.status === status)?.kind === 'back') { save(updated); return; }
    // AM n° 6 : un passage en avant vers « Conditionné » ou « Terminé » demande d'abord le volume conditionné (assiette de la taxe sur la bière) ; un retour en arrière ne le demande pas (RF-8).
    if (needsPackagingVolume({ status, volumePackagedL: base.volumePackagedL })) { setPackaging({ target: status }); return; }
    if (status === 'conditionne' || status === 'termine') {
      synchronizeStock(updated, draft.stockConsumption?.appliedAt ? 'remaining' : 'brewday');
    } else if (!draft.stockConsumption?.appliedAt && (draft.status === 'planifie' || draft.stockAccountingVersion === 1)) {
      synchronizeStock(updated, 'brewday');
    } else save(updated);
  };
  const changeStatus = (status: Batch['status']) => {
    if (status === draft.status) return;
    if (!canMoveTo(draft, status)) {
      setStockMessage(status === 'fermentation' && blockedReason ? blockedReason : `« ${BATCH_STATUS[status]?.label ?? status} » n’est pas une étape permise depuis « ${style.label} ».`);
      return;
    }
    if (needsConfirmation(draft, status)) { setPendingStatus(status); return; }
    applyStatus(status);
  };
  // Après un déstockage refusé, un brassin ensemencé mais encore « planifié » repart vers la fermentation.
  const retryDraft: Batch = draft.status === 'planifie' && draft.brewDay?.pitchedAt != null
    ? { ...draft, ...preserveBrewDates(draft), status: 'fermentation' } : draft;
  const saveGravity = (field: 'og' | 'fg', force = false) => {
    const text = draft[field] || '';
    if (text.trim() === '') { setGravityAlert(null); save({ [field]: '' }); return; }
    const value = parseDecimal(text);
    if (value === null) { setGravityAlert({ field, problem: 'unreadable', value: null, keepable: false }); return; }
    // L'autre densité, telle qu'enregistrée : une saisie encore refusée n'est pas une mesure.
    const otherField = field === 'og' ? 'fg' : 'og';
    const other = gravityAlert?.field === otherField ? parseDecimal(batch[otherField] || '') : otherField === 'og' ? og : fg;
    const problem = gravityProblem(field, value, field === 'fg' ? other : null, field === 'og' ? other : null);
    // Une densité impossible (négative, hors [0,990 ; 1,200], FG au-dessus de l'OG) ne s'enregistre jamais, même forcée (RJ-2).
    const keepable = gravityKeepable(field, value, field === 'fg' ? other : null, field === 'og' ? other : null);
    if (problem && (!force || !keepable)) { setGravityAlert({ field, problem, value, keepable }); return; }
    setGravityAlert(null);
    const pair = { og: field === 'og' ? value : other, fg: field === 'fg' ? value : other };
    // Les deux densités connues : l'alcool suit le couple. Hors bornes ou FG > OG, l'ancien alcool est effacé.
    const abvPatch: Partial<Batch> = nolo || pair.og === null || pair.fg === null ? {}
      : { abv: abvFromGravities(pair.og, pair.fg) !== null ? `${abvFromGravities(pair.og, pair.fg)}%` : '' }; // virgule-ok : valeur stockée (champ abv du brassin), pas un affichage
    save({ [field]: text, ...abvPatch });
  };
  // k1 n° 1 : une densité refusée reste dans son champ, jamais dans les résumés ni la courbe : eux gardent la dernière valeur enregistrée.
  const enregistre: Batch = gravityAlert ? { ...draft, [gravityAlert.field]: batch[gravityAlert.field] } : draft;
  // k1 n° 3 : une densité enregistrée au point (« 1.012 ») se lit à la virgule, comme le message qui l'exige ; la saisie en cours n'est pas réécrite d'un autre signe que le point.
  const auPoint = (texte: string | undefined) => (texte ?? '').replace(/^(\d)\.(\d*)$/, (_tout, entier: string, decimales: string) => `${entier},${decimales}`);
  const gravityText = (alert: NonNullable<typeof gravityAlert>) => alert.problem === 'unreadable'
    ? 'Valeur illisible : tape un nombre, par exemple 1,048.'
    : gravityMessage(alert.problem, alert.value!, alert.field === 'fg' ? og : null, alert.keepable, alert.field === 'og' ? fg : null);

  // p1 : e1a (planifié), e2a (garde, conditionné, terminé, annulé) ; « en fermentation » garde sa fiche (choix ouvert s4a × s6c).
  const planned = draft.status === 'planifie';
  const post = draft.status === 'garde' || draft.status === 'conditionne' || draft.status === 'termine' || draft.status === 'annule';
  // gfc : un brassin en fermentation s'ouvre sur sa fiche (graphe, houblons, tâches, Mesurer) ; les mesures de dossier se replient dessous.
  // Ce que le stock sait pour dire, houblon par houblon, ce qui est sorti et ce qui attend (gfc n° 3).
  const stockCtx: ContexteStock | undefined = (() => {
    if (!(draft.status === 'fermentation' && section === 'measurements')) return undefined;
    try {
      const st = StorageService.getStocks();
      const plan = FirestoreRepo.all<any>('financialPlans').filter(p => p.brewEstimate?.batchId === draft.id).sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))[0];
      return { stocks: [...st.rawMaterials, ...st.cleaning], bindings: plan?.brewEstimate?.bindings, mouvements: FirestoreRepo.all<{ id?: string; timestamp?: string }>('movements') };
    } catch { return undefined; }
  })();
  const ficheM = draft.status === 'fermentation' && section === 'measurements' ? modeleFiche(draft, Date.now(), stockCtx) : null;
  // CT4-B-11 : sans FG visée dans la recette, le repère de la saisie est la plage de la levure (même calcul que la fiche recette).
  // Pas de hook ici : la feuille a un retour anticipé plus haut (`batch` absent), un hook après lui lève « Rendered fewer hooks » à la fermeture.
  const fgPlage = ficheM && !ficheM.fg ? plageFgMemo(draft) : null;
  // E2 (D396, N5) : la prévision de la courbe du lot ; « Comme prévu » tant que le curseur y reste.
  const prevuM = ficheM ? milliPrevu(ficheM) : null;
  const commePrevu = mesure && prevuM !== null && !autre && !mesure.taper && mesure.milli === prevuM ? prevuM : null;
  // gfc n° 10 : les mesures de dossier se rangent sous le Dossier d'un brassin en fermentation, plus sous la fiche.
  const mesuresDansDossier = draft.status === 'fermentation' && section === 'overview';
  const Enveloppe: React.ElementType = post || ficheM || mesuresDansDossier ? 'details' : React.Fragment;
  const nowMs = Date.now();
  // e3gb : Carnet et Dossier ne changent que pour un brassin en fermentation ; les autres états gardent leurs choix (e1a, e2a, e4c).
  const fermentation = draft.status === 'fermentation';
  const rappel = fermentation && section === 'overview' ? rappelDryHop(draft, nowMs) : null;
  const enregistrerReleve = () => {
    if (!mesure) return;
    const r = releveDepuisEtat(mesure, toIsoDate(breweryDay(nowMs)));
    if ('erreur' in r) { setMesure({ ...mesure, erreur: r.erreur }); return; }
    save({ gravityLog: [...(draft.gravityLog ?? []), r.reading] });
    setMesure(null);
  };
  const destockerHoublon = (h: Houblon) => {
    if (!stockCtx) return;
    const live = StorageService.getBatches().find(b => b.id === draft.id);
    if (!live) return;
    const plan = planDestockageHoublon(live, { name: h.nom, weightG: h.doseG, stockItemRef: h.ref ?? undefined }, stockCtx.stocks, stockCtx.bindings);
    if (!plan.ok || !plan.batch) { setStockMessage(plan.issues.join(' ')); return; }
    const apres = plan.batch;
    for (const mv of plan.mouvements) {
      const st = plan.stockUpdates.find(x => x.ref === mv.itemRef);
      FirestoreRepo.adjustNumber('stockItems', mv.itemRef, 'currentStock', mv.delta, st ? { reorder: st.reorder } : {});
      FirestoreRepo.put('movements', mv.id, mv);
    }
    StorageService.updateBatch(apres, { previous: live.stockConsumption });
    setDraft(d => (d ? { ...d, stockConsumption: apres.stockConsumption } : d));
    setStockMessage('');
    setToastStock({
      nom: h.nom, g: h.doseG,
      annuler: () => {
        for (const mv of plan.mouvements) {
          const avant = stockCtx.stocks.find(x => x.ref === mv.itemRef);
          FirestoreRepo.adjustNumber('stockItems', mv.itemRef, 'currentStock', -mv.delta, avant ? { reorder: avant.reorder } : {});
          FirestoreRepo.remove('movements', mv.id);
        }
        StorageService.updateBatch(live, { previous: apres.stockConsumption });
        setDraft(d => (d ? { ...d, stockConsumption: live.stockConsumption } : d));
        setToastStock(null);
      }
    });
  };
  // gfc n° 2 : cocher une tâche pose une entrée datée du Carnet dans les notes du jour de brassage ; décocher la retire.
  const basculerTache = (i: number) => {
    const t = ficheM?.taches[i];
    if (!t) return;
    save({ notesBrewDay: t.faite ? sansTacheFaite(draft.notesBrewDay, t) : avecTacheFaite(draft.notesBrewDay, t) });
  };
  const dernierSg = releves(draft).slice(-1)[0]?.sg;
  const fgDepart = Math.round((dernierSg ?? draft.recipeSnapshot?.fgTarget ?? 1.01) * 1000);
  const openLadder = () => { setKegList(StorageService.getStocks().kegs); setLadder(true); };
  const ouvrirReleve = () => {
    const zone = releveRef.current;
    zone?.closest('details')?.setAttribute('open', '');
    zone?.scrollIntoView?.({ block: 'center' });
    zone?.querySelector('button')?.click();
  };
  const saveDate = async (date: string) => {
    setDateError('');
    try { setDraft(await saveBatchSchedule(draft, date, value => StorageService.updateBatch(value))); setDatePlan(null); }
    catch (e) { setDateError(e instanceof Error ? e.message : 'La date n’a pas pu être enregistrée. Réessaie.'); }
  };
  const confirmFg = (milli: number) => {
    const value = milli / 1000;
    const problem = gravityProblem('fg', value, null, og);
    if (problem) { setFgError(gravityMessage(problem, value, og, gravityKeepable('fg', value, null, og), null)); return; }
    setFgError('');
    setFgUndo({ fg: draft.fg ?? '', abv: draft.abv ?? '' });
    const found = nolo || og === null ? null : abvFromGravities(og, value);
    save({ fg: formatDecimal(value, 3), ...(nolo || og === null ? {} : { abv: found !== null ? `${found}%` : '' }) }); // virgule-ok : valeur stockée (champ abv du brassin), pas un affichage
    setFgMilli(null);
  };
  const conditionner = (valeurs: Conditionnement, kegIds: string[]) => {
    const base = { ...draft, packaging: valeurs.packaging, volumePackagedL: valeurs.volumePackagedL, bottlingDate: valeurs.bottlingDate };
    kegIds.forEach(id => { const keg = kegList.find(k => k.id === id); if (keg) StorageService.updateKeg({ ...keg, state: 'plein', batchRef: draft.id, beerName: draft.name, style: draft.style, fillDate: toIsoDate(valeurs.bottlingDate) }); });
    setLadder(false);
    applyStatus('conditionne', base);
  };
  /** Un champ de note du Carnet (Textarea enregistré au blur) ; `sansLabel` quand la ligne repliée porte déjà le libellé. */
  const champNote = (key: 'notesTasting' | 'notesBrewDay' | 'notesCreation', label: string, sansLabel = false) => (
    <label key={key} className="block space-y-1.5">
      {!sansLabel && <span className="text-sm text-cave-400">{label}</span>}
      <Textarea
        name={`batch_sheet_${key}`}
        aria-label={sansLabel ? label : undefined}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        data-form-type="other"
        data-lpignore="true"
        data-1p-ignore="true"
        data-bwignore="true"
        rows={3}
        className={`${field} py-2 resize-y leading-relaxed`}
        value={draft[key] || ''}
        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        onBlur={() => save({ [key]: draft[key] })}
      />
    </label>
  );
  const stockShown = !planned || plusOpen || stockIssues.length > 0 || historicalStock;

  return (
    <>
      <Sheet
        open={!!batch}
        onClose={onClose}
        title={fermentation ? `${draft.name} en fermentation` : draft.name}
        subtitle={fermentation
          ? [draft.id, 'cuve', section === 'measurements' ? volumeEnCuveLibelle(draft) : draft.brewDay?.pitchedAt != null ? `levuré le ${breweryDay(draft.brewDay.pitchedAt).slice(0, 5)}` : null].filter(Boolean).join(' · ')
          : `${draft.id} · ${draft.style} · ${formatLitres(draft.volumeL)}${planned ? '' : ''}${planned || post ? '' : ' visés'}`}
        className={ficheM ? 'md:max-w-2xl md:mx-auto lg:!max-w-6xl' : 'md:max-w-2xl md:mx-auto h-[88dvh]'}
        footer={fermentation && section === 'tasting' ? <CarnetPied c={carnet} /> : rappel ? <DossierPied batch={draft} now={nowMs} ajoute={() => setConfirmStock('remaining')} /> : ficheM ? (
          <div className="space-y-2">
            {mesure && <div className="max-h-[55dvh] overflow-y-auto"><PanneauMesure m={ficheM} etat={mesure} onChange={setMesure} fgPlage={fgPlage} prevu={prevuM} question={commePrevu !== null} onAutre={() => setAutre(true)} /></div>}
            <PiedFermentation ouvert={mesure !== null} commePrevu={commePrevu}
              ouvrir={() => { const i = mesureInitiale(ficheM, draft.recipeSnapshot?.fgTarget); setAutre(false); setMesure(prevuM === null ? i : { ...i, milli: prevuM }); }}
              annuler={() => setMesure(null)} enregistrer={enregistrerReleve} />
          </div>
        ) : planned ? (
          <PiedPlanifie geste={datePlan} now={nowMs} plus={() => setPlusOpen(open => !open)}
            commencer={onOpenBrewDay ? () => onOpenBrewDay(draft) : undefined}
            annuler={() => { setDatePlan(null); setDateError(''); }} enregistrer={() => datePlan !== null && saveDate(datePlan)} />
        ) : post ? (
          <div className="flex items-center gap-2">
            <Cible aria-label="Plus" onClick={() => setPlusOpen(open => !open)} className="w-10 shrink-0 px-0"><Ellipsis size={18} aria-hidden="true" /></Cible>
            {draft.status === 'garde' && <Cible className="flex-1" onClick={ouvrirReleve}>+ Relevé de densité</Cible>}
            {draft.status === 'conditionne' && <Cible ton="prim" className="flex-1" onClick={() => changeStatus('termine')}>Tout écoulé · Terminer</Cible>}
            {draft.status === 'termine' && onRebrew
              ? <Cible ton="prim" className="flex-1" onClick={() => onRebrew(draft)}>Rebrasser cette {draft.style || 'bière'}</Cible>
              : (draft.status === 'termine' || draft.status === 'annule') && <Cible className="flex-1" onClick={onClose}>Fermer</Cible>}
          </div>
        ) : (
          <Button intent="primary" full onClick={onClose}>
            Fermer
          </Button>
        )}
      >
        <div className="space-y-2">
          {planned
            ? <PlannedDate batch={draft} now={nowMs} geste={datePlan} onGeste={setDatePlan} onSave={date => void saveDate(date)} erreur={dateError} />
            : post
              ? <HeroEtat batch={enregistre} now={nowMs} />
              : ficheM
              ? <FicheFermentation m={ficheM} verbe={draft.brewDay?.pitchedAt != null ? 'levuré' : 'brassé'} toast={toastStock} onTache={basculerTache}
                  reserve={pending.map(l => `${stockNames.get(l.stockItemRef) ?? l.stockItemRef} · ${Units.format(l.quantity, l.unit)}`)}
                  onAjoute={destockerHoublon}
                  onAcces={k => setSection(k === 'carnet' ? 'tasting' : 'overview')} />
              : <BatchSchedule batch={draft} onSave={async updated => {
                  const saved = await saveBatchSchedule(draft, updated.plannedBrewDate ?? '', value => StorageService.updateBatch(value));
                  setDraft(saved);
                }} />}
          {!planned && !post && !ficheM && <YeastPreparationPanel batch={draft} onSave={save} />}
          {plusOpen && (planned || post) && <Panneau label="Plus d’actions" className="flex flex-wrap items-center gap-2 p-2"><span className="text-xs text-cave-400">Plus</span>{(draft.status === 'conditionne' || draft.status === 'termine') && <>
            <Cible onClick={() => { setSection('measurements'); setPlusOpen(false); setGesteFut(g => ({ quoi: 'rentrer', n: (g?.n ?? 0) + 1 })); }}>Rentrer un fût</Cible>
            <Cible ton="prim" onClick={() => { setSection('measurements'); setPlusOpen(false); setGesteFut(g => ({ quoi: 'livrer', n: (g?.n ?? 0) + 1 })); }}>Livrer un fût</Cible></>}{draft.status === 'termine' && <Cible onClick={() => changeStatus('conditionne')}>Revenir à « Conditionné »</Cible>}<Cible ton="danger" onClick={() => setConfirmDelete(true)}>Supprimer ce brassin</Cible></Panneau>}
          {noloRecipeForBatch(draft)&&(plusOpen || (!planned && !post))&&<details><summary className="min-h-touch cursor-pointer text-water">Pilote NOLO · mesures et conditionnement</summary><NoloPanel measurementOnly recipe={noloRecipeForBatch(draft)!} onChange={r=>setDraft({...draft,nolo:r.nolo})}/><Button onClick={async()=>{try{save({nolo:draft.nolo??draft.recipeSnapshot?.nolo});await StorageService.confirmPendingWrites();setNoloNotice('Mesures NOLO enregistrées sur ce brassin.');}catch(e){setNoloNotice('Enregistrement non confirmé : '+(e instanceof Error?e.message:'réessayer'));}}}>Enregistrer le suivi NOLO du brassin</Button>{noloNotice&&<p role="status" className="text-sm text-water">{noloNotice}</p>}</details>}
          <nav
            className={`grid grid-cols-3 border-b border-cave-700 ${ficheM ? 'hidden' : ''}`}
            aria-label="Rubriques du brassin"
          >
            {(
              [
                ['measurements', planned ? 'Préparer' : 'Mesures'],
                ['tasting', 'Carnet'],
                ['overview', 'Dossier']
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={section === key}
                onClick={() => setSection(key)}
                className={`min-h-touch text-sm border-b-2 ${section === key ? 'border-ebc-straw text-ebc-straw font-semibold' : 'border-transparent text-cave-400'}`}
              >
                {label}
              </button>
            ))}
          </nav>
          {/* TE-41 : le bandeau complet vit dans Mesures ; les autres rubriques n'ont qu'une ligne qui y renvoie, au lieu de le répéter. */}
          {stockShown && (historicalStock || needsBrewStock || stockIssues.length > 0 || pending.length > 0) && !stockBannerHere && !(fermentation && !historicalStock && !needsBrewStock && stockIssues.length === 0) && (
            <button type="button" onClick={() => setSection('measurements')} className="min-h-touch flex items-center gap-2 text-left text-sm text-ebc-amber">
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{historicalStock ? 'Stock à confirmer' : stockIssues.length || needsBrewStock ? 'Stock à vérifier' : 'Ajouts réservés à confirmer'} · voir Mesures</span>
            </button>
          )}
          {stockShown && (historicalStock || needsBrewStock || stockIssues.length > 0 || (pending.length > 0 && !ficheM)) && stockBannerHere && (
            <section aria-label="Suivi du stock du brassin" className="rounded-xl border border-ebc-amber/30 bg-cave-950 p-2 space-y-2">
              <div className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 shrink-0 text-ebc-amber mt-0.5" /><div><h3 className="text-sm font-semibold text-cave-50">{historicalStock ? 'Stock de ce brassin à confirmer' : stockIssues.length || needsBrewStock ? 'Stock à vérifier' : 'Ajouts réservés pour la fermentation'}</h3><p className="text-2xs text-cave-400 leading-snug mt-1">{historicalStock ? 'Ce brassin vient de l’ancien suivi. Indiquez ce qui a déjà été retiré pour éviter une double déduction.' : needsBrewStock ? 'Les relevés sont conservés. Vérifiez les ingrédients puis confirmez leur sortie de stock.' : 'Les réservations protègent ces ingrédients pour ce brassin jusqu’à leur ajout réel.'}</p></div></div>
              {stockIssues.length > 0 && <ul className="list-disc pl-5 text-sm text-ebc-amber space-y-1">{stockIssues.map(issue => <li key={issue}>{issue}</li>)}</ul>}
              {pending.length > 0 && <ul className="text-sm text-cave-200 space-y-1">{pending.map((item, i) => <li key={`${item.stockItemRef}-${i}`}>{stockNames.get(item.stockItemRef) ?? item.stockItemRef} · {Units.format(item.quantity, item.unit)}</li>)}</ul>}
              {historicalStock ? <div className="grid gap-2 sm:grid-cols-2"><Button intent="secondary" full onClick={() => setConfirmStock('already')}>Tout est déjà déstocké</Button>{stockNotDue ? <Button intent="primary" full onClick={() => synchronizeStock(draft, 'historical-unconsumed', true)}>Le stock n’a pas été déduit</Button> : <Button intent="primary" full onClick={() => setConfirmStock('consume')}>Déstocker le brassage maintenant</Button>}</div> : <>
                {(needsBrewStock || stockIssues.length > 0) && <Button intent="primary" full onClick={() => synchronizeStock(retryDraft, draft.stockConsumption?.appliedAt ? 'remaining' : 'brewday')}>Revérifier et déstocker</Button>}
                {pending.length > 0 && <Button intent="secondary" full onClick={() => setConfirmStock('remaining')}>Confirmer les ajouts de fermentation</Button>}
              </>}
              {stockIssues.length > 0 && <p className="text-xs text-cave-400 leading-relaxed">Associez les articles dans le budget du brassin, ou corrigez les quantités comptées dans Stocks, puis revenez vérifier ici.</p>}
            </section>
          )}
          {packaging && <BatchPackagingForm batch={draft}
            confirmLabel={packaging.target ? `Passer en « ${BATCH_STATUS[packaging.target].label} »` : 'Enregistrer le volume'}
            onCancel={() => setPackaging(null)}
            onConfirm={values => { const target = packaging.target; setPackaging(null); if (target) applyStatus(target, { ...draft, ...values }); else save(values); }}/>}
          {fgUndo && <div role="status" data-toast-fg className="fixed inset-x-3 bottom-20 z-50 mx-auto flex max-w-md items-center justify-between gap-2 rounded-control bg-ebc-straw px-3 py-1.5 text-sm font-semibold text-cave-950 shadow-lg">FG {draft.fg} enregistrée<button type="button" className="relative min-h-8 rounded-control border border-cave-950/40 px-3 font-semibold text-cave-950 after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-['']" onClick={() => { save({ fg: fgUndo.fg, abv: fgUndo.abv }); setFgUndo(null); }}>Annuler</button></div>}
          {stockMessage && <p role="status" className="text-sm text-hop flex items-start gap-2"><PackageCheck className="w-4 h-4 shrink-0 mt-0.5" />{stockMessage}</p>}
          {draft.status === 'fermentation' && (() => {
            const conflict = fermenterConflict(draft, StorageService.getBatches());
            return conflict ? <p role="alert" className="text-sm text-attention">{fermenterConflictMessage(conflict)}</p> : null;
          })()}
          {section === 'overview' && fermentation && (
            <DossierFil batch={draft} now={nowMs} suivant={suivant} options={options} blocage={blockedReason}
              onStatut={changeStatus} onSupprimer={() => setConfirmDelete(true)}
              budget={cls => <BudgetLien batch={draft} onCible={allerMesures} className={cls}>Budget</BudgetLien>}
              compagnon={<BrewerChat scope={{ kind: 'batch', id: batch.id }} label={draft.name} phase={draft.status} />} />
          )}
          {section === 'overview' && !fermentation && (
            <>
              {draft.status !== 'annule' && <BudgetLien batch={draft} onCible={allerMesures}>Estimer le budget de ce brassin</BudgetLien>}
              <section className="space-y-2">
                {draft.status !== 'annule' && <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-control border text-sm ${style.chip}`}>
                    {style.label}
                  </span>
                  <span className="text-sm text-cave-400">{style.hint}</span>
                </div>}

                {suivant && !planned && !post && (
                  <Button
                    intent="primary"
                    full
                    onClick={() => changeStatus(suivant)}
                    icon={<ArrowRight className="w-5 h-5" />}
                  >
                    Passer en « {BATCH_STATUS[suivant].label} »
                  </Button>
                )}
              </section>

              {draft.status === 'annule' && (() => { const retour = options.find(o => o.kind === 'back'); return <>
                <Panneau className="space-y-2 p-2.5"><div className="text-sm font-semibold text-cave-50">Étape</div><EtapesPills courante={-1} annulee />{retour && <Cible ton="prim" plein onClick={() => changeStatus(retour.status)}>Revenir à « {BATCH_STATUS[retour.status].label} »</Cible>}</Panneau>
                <Panneau label="Dossier du brassin annulé" className="divide-y divide-cave-800 px-2.5" >
                  <BudgetLien batch={draft} onCible={allerMesures} className="!min-h-12 w-full justify-between rounded-none border-0 bg-transparent px-0 !font-normal text-cave-50">Budget du brassin <ChevronRight size={16} className="text-cave-400" aria-hidden="true" /></BudgetLien>
                  <Cible onClick={() => setSection('measurements')} className="!min-h-12 w-full justify-between rounded-none border-0 bg-transparent px-0 !font-normal text-cave-50">Historique conservé <ChevronRight size={16} className="text-cave-400" aria-hidden="true" /></Cible>
                  <Cible ton="danger" onClick={() => setConfirmDelete(true)} className="!min-h-12 w-full justify-between rounded-none border-0 bg-transparent px-0 !font-normal text-alert">Supprimer ce brassin <X size={16} aria-hidden="true" /></Cible>
                </Panneau>
              </>; })()}
              {!planned && !post && <label className="block space-y-1 text-xs text-cave-400">Étape du brassin
                <select className={field} value={draft.status} onChange={event => changeStatus(event.target.value as Batch['status'])}>
                  <option value={draft.status}>{style.label}</option>
                  {options.map(({ status, kind }) => <option key={status} value={status}>{kind === 'back' ? `Revenir à « ${BATCH_STATUS[status].label} »` : kind === 'cancel' ? 'Annulé (abandon)' : BATCH_STATUS[status].label}</option>)}
                </select>
              </label>}
              {blockedReason && <p className="text-2xs text-cave-400 leading-snug">{blockedReason}</p>}
            </>
          )}
          {section === 'measurements' && planned && (
            <>
              <YeastPreparationPanel batch={draft} onSave={save} carte apercu={datePlan !== null ? datePlan : jourPropose(planDeStarter(draft), plannedBrewDate(draft) ?? null, nowMs)} />
              <div className="grid grid-cols-3 gap-1.5" data-cibles>
                <Panneau className="px-2.5 py-1.5"><small className="block text-xs text-cave-400">OG visée</small><span className="font-mono text-xl font-semibold text-cave-50">{draft.recipeSnapshot?.ogTarget != null ? formatDecimal(draft.recipeSnapshot.ogTarget, 3) : '—'}</span><i className="block text-xs not-italic text-cave-400">mesurée {og !== null ? formatDecimal(og, 3) : '—'}</i></Panneau>
                <Panneau className="px-2.5 py-1.5"><small className="block text-xs text-cave-400">FG cible</small><span className="font-mono text-xl font-semibold text-cave-50">{draft.recipeSnapshot?.fgTarget != null ? formatDecimal(draft.recipeSnapshot.fgTarget, 3) : '—'}</span><i className="block text-xs not-italic text-cave-400">mesurée {fg !== null ? formatDecimal(fg, 3) : '—'}</i></Panneau>
                <Panneau className="px-2.5 py-1.5"><small className="block text-xs text-cave-400">Stock</small><span className="mt-0.5 flex items-center gap-1 text-sm font-semibold text-hop"><Package size={16} aria-hidden="true" />{pending.length > 0 ? 'réservé' : needsBrewStock || stockIssues.length > 0 ? 'à vérifier' : 'à brasser'}</span></Panneau>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <BudgetLien batch={draft} onCible={allerMesures} />
                <Cible onClick={() => setSection('overview')}>Compagnon</Cible>
                <Cible onClick={openLadder}>Étape <ChevronRight size={14} aria-hidden="true" /></Cible>
              </div>
            </>
          )}
          {section === 'measurements' && post && (
            <>
              {/* Lot/v1 : pour un retrait ou une plainte, on cherche vite qui l'a reçu : l'arbre ouvre la fiche d'un lot conditionné ou terminé, avant le reste. */}
              {(draft.status === 'conditionne' || draft.status === 'termine') && <QuiARecuLot batch={draft} geste={gesteFut} />}
              {draft.status === 'garde' && (parseDecimal(draft.fg || '') === null
                ? <CurseurFg batch={draft} valeur={fgMilli ?? fgDepart} onValeur={setFgMilli} onConfirmer={() => confirmFg(fgMilli ?? fgDepart)} erreur={fgError} />
                : <TuilesFg batch={draft} onConditionner={openLadder} />)}
              {draft.status === 'conditionne' && <Contenants batch={draft} futs={(draft.packaging?.kegIds ?? []).map(id => StorageService.getStocks().kegs.find(k => k.id === id)).filter((k): k is import('../types').KegItem => !!k)} onCorriger={() => setPackaging({ target: null })} />}
              <CarteDensite batch={enregistre} />
              {draft.status === 'garde' && <LignesCuve batch={draft} onReleve={ouvrirReleve} onVolume={() => setPackaging({ target: null })} />}
              {draft.status === 'conditionne' && <Panneau className="p-2.5"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-cave-50">Étape</span><Cible onClick={openLadder} aria-label="Ouvrir l’échelle des étapes">Étape <ChevronRight size={14} aria-hidden="true" /></Cible></div><EtapesPills courante={MARCHES.indexOf('conditionne')} /></Panneau>}
              {/* Maquette lot/v1 (16.11) : le lot se ramifie vers chaque client ; les gestes du menu « Plus » (Rentrer, Livrer) s'y jouent. */}
              {draft.status === 'garde' && <QuiARecuLot batch={draft} geste={gesteFut} />}
            </>
          )}
          {((section === 'measurements' && !planned && !ficheM) || mesuresDansDossier) && (
            <Enveloppe {...(post || ficheM || mesuresDansDossier ? { className: 'rounded-xl border border-cave-800 bg-cave-900 px-2.5 py-1' } : {})}>
              {(post || ficheM || mesuresDansDossier) && <summary className="min-h-touch cursor-pointer text-sm text-cave-200">Corriger les mesures (OG, FG, volumes)</summary>}
              <section className="space-y-2">
                <h3 className="text-base font-semibold text-cave-50">Mesures</h3>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1.5">
                    <span className="text-sm text-cave-400">
                      Densité initiale
                      {draft.recipeSnapshot?.ogTarget != null && (
                        <span className="block text-water">
                          Cible {formatDecimal(draft.recipeSnapshot.ogTarget, 3)}
                        </span>
                      )}
                    </span>
                    <Input
                      name="batch_sheet_og"
                      type="text"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      data-form-type="other"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-bwignore="true"
                      className={`${field} font-mono`}
                      inputMode="decimal"
                      placeholder="À mesurer"
                      value={auPoint(draft.og)}
                      onChange={(e) => setDraft({ ...draft, og: e.target.value })}
                      aria-invalid={gravityAlert?.field === 'og' || undefined}
                      onBlur={() => saveGravity('og')}
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-sm text-cave-400">
                      Densité finale
                      {draft.recipeSnapshot?.fgTarget != null && (
                        <span className="block text-water">
                          Cible {formatDecimal(draft.recipeSnapshot.fgTarget, 3)}
                        </span>
                      )}
                    </span>
                    <Input
                      name="batch_sheet_fg"
                      type="text"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      data-form-type="other"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-bwignore="true"
                      className={`${field} font-mono`}
                      inputMode="decimal"
                      placeholder="Non confirmée"
                      value={auPoint(draft.fg)}
                      onChange={(e) => setDraft({ ...draft, fg: e.target.value })}
                      aria-invalid={gravityAlert?.field === 'fg' || undefined}
                      onBlur={() => saveGravity('fg')}
                    />
                  </label>
                </div>

                {gravityAlert && (
                  <div role="alert" className="rounded-control border border-alert/40 bg-cave-950 p-2 space-y-1.5">
                    <p className="text-sm text-alert-strong">{gravityText(gravityAlert)}</p>
                    <div className="flex gap-2">
                      {gravityAlert.keepable && (
                        <Button intent="secondary" onClick={() => saveGravity(gravityAlert.field, true)}>Garder cette valeur</Button>
                      )}
                      <Button intent="secondary" onClick={() => { setDraft({ ...draft, [gravityAlert.field]: batch[gravityAlert.field] ?? '' }); setGravityAlert(null); }}>Annuler la saisie</Button>
                    </div>
                  </div>
                )}

                {abv !== null && (
                  <p className="text-sm text-cave-400">
                    Alcool calculé : <span className="font-mono text-hop">{formatDecimal(abv, 1)} % vol</span>
                  </p>
                )}
                {abvUnavailable && !gravityAlert && (
                  <p className="text-sm text-cave-400">{abvAuDela
                    ? `Alcool non calculé : au-delà de ${nombreFr(ABV_MAX, 1)} % vol., vérifie l’OG et la FG.`
                    : 'Alcool non calculé : densités impossibles, ou finale au-dessus de l’initiale.'}</p>
                )}

                {hasBrewStarted(draft) && <DateField label="Jour réellement brassé" value={brewDayDraft ?? actualBrewDate(draft) ?? ''} error={brewDayError || undefined} shortcuts={[]} onChange={brewDate => {
                  // BR-122, BE-48 : un jour « réellement brassé » ne peut pas être demain. La saisie reste affichée avec son message, rien n'est écrit.
                  const day = normalizeBrewDate(brewDate);
                  if (day && toIsoDate(day) > toIsoDate(breweryDay(Date.now()))) {
                    setBrewDayDraft(brewDate);
                    setBrewDayError('Ce jour est dans le futur : un brassage déjà fait ne peut pas être daté après aujourd’hui.');
                    return;
                  }
                  setBrewDayDraft(null);
                  setBrewDayError('');
                  save({ brewDate, plannedBrewDate: plannedBrewDate(draft) ?? '' });
                }} />}
              </section>

              {(draft.status === 'fermentation' || draft.status === 'garde') && (
                <div ref={releveRef}><BatchGravityEntry
                  key={draft.id}
                  batch={draft}
                  onAdd={(reading) => save({ gravityLog: [...(draft.gravityLog ?? []), reading] })}
                /></div>
              )}
              <div className="grid grid-cols-2 gap-2 text-sm text-cave-400 border-y border-cave-800 py-1.5">
                <p>
                  Volume brassé
                  <span className="block text-base text-cave-50 tabular-nums">
                    {draft.volumeBrewedL != null ? `${nombreFr(draft.volumeBrewedL, 1)} L` : 'Non renseigné'}
                  </span>
                </p>
                <p>
                  Conditionné
                  <span className="block text-base text-cave-50 tabular-nums">
                    {draft.volumePackagedL != null ? `${nombreFr(draft.volumePackagedL, 1)} L` : 'Non renseigné'}
                  </span>
                  {!packaging && draft.status !== 'planifie' && draft.status !== 'annule' && <button type="button" data-batch-packaging-open
                    className="mt-0.5 text-xs text-ebc-straw underline underline-offset-2 min-h-touch" onClick={() => setPackaging({ target: null })}>
                    {draft.volumePackagedL != null ? 'Corriger le volume conditionné' : 'Saisir le volume conditionné'}</button>}
                </p>
              </div>
              {needsPackagingVolume(draft) && <p role="status" className="text-xs text-attention">Volume conditionné manquant : ce lot échappe au calcul de la taxe sur la bière et au bilan de pertes.</p>}
              {/* BR-115, BE-86 : un brassin ne donne pas plus de bière qu'il n'en contenait. Une valeur douteuse est signalée, jamais effacée. */}
              {/* k1 n° 4 : un brassin conditionné le dit déjà dans sa carte « Contenants » ; ici seulement quand cette carte n'est pas à l'écran (une alerte, pas deux). */}
              {draft.status !== 'conditionne' && draft.volumePackagedL != null && packagingLimitL(draft) !== null && draft.volumePackagedL > packagingLimitL(draft)! + 1e-9 &&
                <p role="status" className="text-xs text-attention">{nombreFr(draft.volumePackagedL, 1)} L conditionnés pour {nombreFr(packagingLimitL(draft)!, 1)} L brassés : vérifie le volume conditionné ou les fûts.</p>}
              {/* Une densité en attente de confirmation n'est pas encore une mesure : la courbe garde la valeur enregistrée. */}
              <FermentationCurveChart batch={enregistre} />
              {draft.brewDay?.pitchedAt != null && <p className="text-xs text-cave-200">Levure ajoutée le {new Date(draft.brewDay.pitchedAt).toLocaleString('fr-CH')}{draft.brewDay.pitchTemperatureC != null ? ` à ${nombreFr(draft.brewDay.pitchTemperatureC, 1)} °C` : ' · température non relevée'}.</p>}
              {awaitingPitch && <p role="status" className="text-sm text-water">En attente d’ensemencement. Reprends le jour de brassage depuis le carnet des brassins.</p>}
              {draft.recipeSnapshot && draft.brewDay && <BrewSystemFeedback recipe={draft.recipeSnapshot} state={draft.brewDay}/>}
            </Enveloppe>
          )}
          {section === 'tasting' && fermentation && <CarnetFil batch={draft} c={carnet} now={nowMs} />}
          {section === 'tasting' && !fermentation && (
            <>
              <section className="space-y-2">
                <h3 className="text-base font-semibold text-cave-50">Carnet</h3>

                {post ? <>
                  {/* e2a : la note de dégustation reste un champ ouvert, ses trois verdicts dessous ; les deux autres notes se replient en lignes. */}
                  <Panneau label="Dégustation" className="space-y-2 p-2.5">
                    {champNote('notesTasting', 'Dégustation et prochain essai')}
                    <VerdictPuces notes={draft.notesTasting} onChange={notes => save({ notesTasting: notes })} />
                  </Panneau>
                  {([['notesBrewDay', 'Observations du jour de brassage'], ['notesCreation', 'Inspiration et profil visé']] as const)
                    .map(([key, label]) => <LigneRepliee key={key} label={label} valeur={draft[key] || ''}>{champNote(key, label, true)}</LigneRepliee>)}
                </> : (
                  [
                    ['notesTasting', 'Dégustation et prochain essai'],
                    ['notesBrewDay', 'Observations du jour de brassage'],
                    ['notesCreation', 'Inspiration et profil visé']
                  ] as const
                ).map(([key, label]) => champNote(key, label))}
              </section>
              {post && <CarteDensite batch={draft} />}
              <HopTastingsPanel batch={draft} />
            </>
          )}
          {section === 'overview' && !fermentation && draft.status !== 'annule' && (
            <>
              <BrewerChat
                scope={{ kind: 'batch', id: batch.id }}
                label={draft.name}
                phase={draft.status}
              />
              <section className="pt-2 border-t border-cave-800">
                <Button
                  intent="danger"
                  full
                  onClick={() => setConfirmDelete(true)}
                  icon={<Trash2 className="w-5 h-5" />}
                >
                  Supprimer ce brassin
                </Button>
              </section>
            </>
          )}
        </div>
      </Sheet>

      {ladder && <StageLadder batch={draft} now={nowMs} kegs={kegList} onClose={() => setLadder(false)}
        onMarquerPropres={laves => {
          const avant = laves.map(l => kegList.find(k => k.id === l.id)).filter((k): k is import('../types').KegItem => !!k);
          laves.forEach(k => StorageService.updateKeg(k));
          accrocherDefaireLavage(enregistrerLavage(laves), avant, laves, () => StorageService.getStocks().kegs, k => StorageService.updateKeg(k));
          setKegList(StorageService.getStocks().kegs);
        }}
        onAvancer={s => { setLadder(false); changeStatus(s); }} onConditionner={conditionner}
        onRetour={s => { setLadder(false); applyStatus(s); }} onAbandonner={() => { setLadder(false); applyStatus('annule'); }} />}
      {/* Maquette suppression/v2 : ses fûts, ses bouteilles et ses écritures un par un ; sans lien (brassin planifié), suppression directe avec « Annuler ». */}
      <SuppressionLiee
        chose={confirmDelete ? (() => {
          const base = choseBrassin(batch);
          // Supprimé ou archivé, le brassin n'a plus de dossier à ouvrir : la fiche se ferme.
          return { ...base, supprimer: () => { base.supprimer(); onClose(); }, archiver: () => { base.archiver(); onClose(); } };
        })() : null}
        onClose={() => setConfirmDelete(false)}
      />
      <ConfirmSheet open={pendingStatus !== null} onClose={() => setPendingStatus(null)}
        title={pendingStatus === 'annule' ? 'Abandonner ce brassin ?' : `Revenir à « ${pendingStatus ? BATCH_STATUS[pendingStatus].label : ''} » ?`}
        what={`${draft.id} — ${draft.name} · actuellement « ${style.label} »`}
        consequence={pendingStatus ? transitionConsequence(draft, pendingStatus) : undefined}
        confirmLabel={pendingStatus === 'annule' ? 'Abandonner le brassin' : `Revenir à « ${pendingStatus ? BATCH_STATUS[pendingStatus].label : ''} »`}
        onConfirm={() => { const status = pendingStatus; setPendingStatus(null); if (status) applyStatus(status); }} />
      <ConfirmSheet open={confirmStock !== null} onClose={() => setConfirmStock(null)}
        title={confirmStock === 'already' ? 'Tout a déjà été déstocké ?' : confirmStock === 'remaining' ? 'Les ajouts de fermentation sont faits ?' : 'Retirer les ingrédients du brassage ?'}
        what={`${draft.id} — ${draft.name}`}
        consequence={confirmStock === 'already' ? 'Confirmez uniquement si tous les ingrédients, y compris le houblonnage à cru et les sucres de fermentation, ont déjà été retirés du stock. Les quantités actuelles resteront inchangées ; cette confirmation sera conservée.' : confirmStock === 'remaining' ? 'Les quantités réservées seront retirées du stock une seule fois. Confirmez après avoir réalisé ces ajouts.' : 'Les quantités du jour de brassage seront retirées maintenant. Les ajouts ultérieurs restent réservés. Confirmez seulement si ces ingrédients n’ont jamais été déstockés.'}
        confirmLabel={confirmStock === 'already' ? 'Confirmer le stock déjà retiré' : 'Confirmer et déstocker'}
        onConfirm={() => {
          const action = confirmStock; setConfirmStock(null);
          if (action === 'already') synchronizeStock(draft, 'historical-already', true);
          else synchronizeStock(draft, action === 'remaining' ? 'remaining' : 'brewday', action === 'consume');
        }} />
    </>
  );
};

const preparationDate = (value: string | number) => {
  const at = typeof value === 'number' ? value : Date.parse(value);
  return Number.isFinite(at)
    ? new Intl.DateTimeFormat('fr-CH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Zurich' }).format(at)
    : 'Date inconnue';
};

function YeastPreparationPanel({ batch, onSave, apercu }: { batch: Batch; onSave: (patch: Partial<Batch>) => void; carte?: boolean; apercu?: string | null }) {
  const yeast = batch.recipeSnapshot?.yeast;
  const planned = yeast?.pitching?.preparation;
  const execution = batch.yeastPreparation;
  const plan: YeastPreparationPlan | undefined = execution?.plan ?? planned;
  const brewDayStarted = hasBrewStarted(batch);
  const scheduledDate = plannedBrewDate(batch);
  const preparationState = yeast ? yeastPreparationState(yeast, scheduledDate ? toIsoDate(scheduledDate) : undefined) : 'missing';
  const currentPlanMatches = !!planned && !!execution && planned.id === execution.plan.id && planned.revision === execution.plan.revision;
  const staleExecution = !!execution && (!currentPlanMatches || preparationState === 'stale' || preparationState === 'cancelled');
  const now = Date.now();
  const targetAt = plan ? Date.parse(plan.targetPitchAt) : NaN;
  const hoursUntilPitch = (targetAt - now) / 3600000;
  const expired = Number.isFinite(targetAt) && targetAt <= now;
  const started = execution?.status === 'started' || execution?.status === 'ready';
  const active = batch.status === 'planifie' && !brewDayStarted;
  const [correctionItem, setCorrectionItem] = useState<StockItem | null>(null);
  const [correctionKind, setCorrectionKind] = useState<'inoculum' | 'medium'>('inoculum');
  const [correctionRef, setCorrectionRef] = useState(execution?.inoculumUsed?.stockItemRef ?? execution?.plan.stockItemRef ?? planned?.stockItemRef ?? yeast?.stockItemRef ?? '');
  const [inoculumAmount, setInoculumAmount] = useState<number | undefined>(execution?.inoculumUsed?.amount);
  const [inoculumUnit, setInoculumUnit] = useState(execution?.inoculumUsed?.unit ?? yeast?.unit ?? '');
  const [inoculumNotice, setInoculumNotice] = useState('');

  if (!plan || (!active && !execution)) return null;

  const snapshotProduct = yeast?.pitching?.product;
  const productLabel = snapshotProduct?.id === plan.productId ? snapshotProduct.label : plan.productId;
  const rawMaterials = StorageService.getStocks().rawMaterials;
  const linkedUnit = rawMaterials.find(item => item.ref === correctionRef)?.unit;
  const inoculumUnitOptions = Array.from(new Set(['g', 'kg', 'mL', 'L', 'sachet', 'flacon', 'paquet', ...(yeast?.unit ? [yeast.unit] : []), ...(linkedUnit ? [linkedUnit] : [])]));
  // Aperçu (e1a) : le jour du curseur décale le plan pour dire si le starter tient ce jour-là ; rien n'est écrit, aucune case n'est cochable.
  const enApercu = !!apercu && !execution;
  const vu = enApercu ? planDecale(plan, apercu!) : plan;
  const completed = new Set(execution?.steps.map(step => step.id) ?? []);
  const stepCueCounts = new Map<string, number>();
  plan.steps.forEach(step => {
    if (step.dueAt) stepCueCounts.set(step.dueAt, (stepCueCounts.get(step.dueAt) ?? 0) + 1);
  });
  const stepCue = (step: YeastPreparationPlan['steps'][number]) => {
    if (!step.dueAt) return undefined;
    const common = (stepCueCounts.get(step.dueAt) ?? 0) > 1;
    const label = step.dueAt === plan.targetPitchAt ? 'Repère de transfert'
      : common && step.dueAt === plan.startAt ? 'Repère commun de départ'
        : common ? 'Repère partagé' : 'Repère prévu';
    return `${label} · ${preparationDate(step.dueAt)}`;
  };
  const startBasisLabel = plan.startBasis === 'culture-window' ? 'Repère calculé de départ'
    : plan.startBasis === 'manual' ? 'Début choisi' : 'Repère de départ';
  const hoursText = (value: number) => value.toLocaleString('fr-CH', { maximumFractionDigits: 1 });
  const withinShortWindow = !execution && preparationState === 'due' &&
    hoursUntilPitch >= plan.protocol.leadHours.min && hoursUntilPitch < plan.protocol.leadHours.max;
  const shortWindowMessage = plan.protocol.leadHoursMeaning === 'culture'
    ? 'Cette fenêtre décrit la culture; l’activation, le refroidissement et les contrôles demandent une marge supplémentaire non chiffrée.'
    : 'La notice ne date pas séparément toutes les opérations annexes, notamment l’activation et le refroidissement.';
  const regularized = (kind: 'inoculum' | 'medium') => execution?.stockRegularization?.filter(entry => entry.kind === kind) ?? [];

  const begin = (firstStepId?: string) => {
    if (!planned || !yeast || !active || execution || preparationState !== 'due' || expired || planned.status !== 'planned') return;
    const inoculumUsed = Number.isFinite(inoculumAmount) && inoculumAmount! > 0 && inoculumUnit.trim()
      ? { amount: inoculumAmount!, unit: inoculumUnit.trim(), ...(correctionRef ? { stockItemRef: correctionRef } : {}) }
      : undefined;
    onSave({ yeastPreparation: { plan: structuredClone(planned), status: 'started', startedAt: Date.now(), steps: firstStepId ? [{ id: firstStepId, at: Date.now() }] : [], ...(inoculumUsed ? { inoculumUsed } : {}) } });
  };
  const markStep = (id: string, checked: boolean) => {
    if (!execution || execution.status !== 'started' && execution.status !== 'ready') return;
    const steps = execution.steps.filter(step => step.id !== id);
    if (checked) steps.push({ id, at: Date.now() });
    const allDone = execution.plan.steps.every(step => steps.some(done => done.id === step.id));
    onSave({ yeastPreparation: { ...execution, status: allDone ? 'ready' : 'started', steps } });
  };
  const saveInoculum = () => {
    if (!execution || execution.status === 'transferred' || !Number.isFinite(inoculumAmount) || inoculumAmount! <= 0 || !inoculumUnit.trim()) return;
    onSave({ yeastPreparation: { ...execution, inoculumUsed: { amount: inoculumAmount!, unit: inoculumUnit.trim(), ...(correctionRef ? { stockItemRef: correctionRef } : {}) } } });
    setInoculumNotice('Prélèvement d’inoculum consigné. Le stock reste à régulariser ci-dessous, sauf correction d’inventaire déjà enregistrée.');
  };
  const startLabel = execution?.status === 'transferred' ? 'Culture transférée au brassin'
    : execution?.status === 'ready' ? 'Préparation prête'
      : execution?.status === 'started' ? 'Préparation commencée'
        : execution?.status === 'cancelled' || plan.status === 'cancelled' ? 'Préparation annulée'
          : expired ? 'Échéance passée · à revalider' : preparationState === 'too-late' ? 'Trop tard pour démarrer · replanifier'
            : preparationState === 'due' ? 'À commencer maintenant' : preparationState === 'stale' ? 'Plan à revalider' : 'Préparation planifiée';
  const canBegin = !!planned && active && !execution && preparationState === 'due' && !expired && planned.status === 'planned' &&
    !(inoculumAmount !== undefined && inoculumAmount <= 0) && !(inoculumAmount !== undefined && !inoculumUnit.trim());
  const enCours = execution?.status === 'started' || execution?.status === 'ready';
  const premiereOuverte = plan.steps.findIndex(step => !completed.has(step.id));
  const quand = (step: YeastPreparationPlan['steps'][number], i: number) => {
    if (!step.dueAt) return 'brassage';
    const due = Date.parse(step.dueAt);
    if (i > 0) return `+${Math.round((due - Date.parse(vu.startAt)) / 3600000)} h`;
    const jours = Math.round((Date.parse(new Date(due).toISOString().slice(0, 10)) - Date.parse(new Date(now).toISOString().slice(0, 10))) / 86400000);
    return jours === 0 ? (new Date(due).getHours() >= 17 ? 'ce soir' : 'aujourd’hui') : jours === 1 ? 'demain' : new Intl.DateTimeFormat('fr-CH', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Zurich' }).format(due);
  };
  const apercuLance = enApercu && !!vu.steps[0]?.dueAt && breweryDay(Date.parse(vu.steps[0].dueAt)) === breweryDay(now);
  const pastille: { ton: 'hop' | 'water' | 'attention' | 'alert' | 'neutre'; texte: string } =
    enApercu ? (faisabilite(plan, apercu!, now) === 'non' ? { ton: 'alert', texte: 'trop tard pour ce jour' } : apercuLance ? { ton: 'attention', texte: 'à lancer ce soir' } : { ton: 'hop', texte: 'à temps' })
    : execution?.status === 'transferred' ? { ton: 'hop', texte: 'transférée' }
      : execution?.status === 'ready' ? { ton: 'hop', texte: 'prête' }
        : enCours ? { ton: 'water', texte: `${execution!.steps.length}/${execution!.plan.steps.length} faites` }
          : execution?.status === 'cancelled' || plan.status === 'cancelled' ? { ton: 'neutre', texte: 'annulée' }
            : staleExecution || preparationState === 'stale' ? { ton: 'alert', texte: 'plan à revalider' }
              : expired || preparationState === 'too-late' ? { ton: 'alert', texte: 'trop tard pour ce jour' }
                : withinShortWindow ? { ton: 'attention', texte: 'à lancer ce soir' }
                  : preparationState === 'due' ? { ton: 'hop', texte: 'à temps' } : { ton: 'neutre', texte: 'planifié' };
  const correctionStatus = (kind: 'inoculum' | 'medium') => regularized(kind).length > 0;

  const confirmInventoryCorrection = (item: StockItem, counted: number, reason: import('../services/storage').InventoryReason, note?: string) => {
    const result = StorageService.adjustInventory('rawMaterials', item.ref, counted, reason, note);
    if (!result || !execution) return;
    const at = Date.now();
    const stockRegularization = [
      ...(execution.stockRegularization ?? []).filter(entry => !(entry.kind === correctionKind && entry.stockItemRef === item.ref)),
      { kind: correctionKind, stockItemRef: item.ref, at }
    ];
    const inoculumUsed = correctionKind === 'inoculum' && execution.inoculumUsed
      ? { ...execution.inoculumUsed, stockItemRef: item.ref, inventoryAdjustedAt: at }
      : execution.inoculumUsed;
    onSave({ yeastPreparation: { ...execution, stockRegularization, ...(inoculumUsed ? { inoculumUsed } : {}) } });
    setInoculumNotice(`${item.name} : inventaire corrigé et régularisation du ${correctionKind === 'inoculum' ? 'prélèvement' : 'milieu'} consignée.`);
  };

  return <>
    <section aria-label="Préparation de levure" className="overflow-hidden rounded-2xl border border-cave-700 bg-cave-900">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <h3 className="min-w-0 text-base font-semibold text-cave-50">Starter <span className="text-sm font-normal text-cave-400">{productLabel} · <Mono>{plan.volumeL.toLocaleString('fr-CH')} L</Mono></span></h3>
        <Pastille ton={pastille.ton} className="shrink-0">{pastille.texte}</Pastille>
      </div>
      <ol className="border-t border-cave-700" aria-label="Étapes du starter">
        {vu.steps.map((step, i) => {
          const fait = completed.has(step.id);
          const peut = !enApercu && (enCours || (i === 0 && canBegin));
          return <li key={step.id} className={`flex min-h-11 items-center gap-3 border-b border-cave-800 px-3 last:border-b-0 ${!fait && i === premiereOuverte && active ? 'bg-attention/10' : ''}`}>
            <span className={`w-[4.5rem] shrink-0 text-sm ${!fait && i === premiereOuverte && active ? 'font-semibold text-attention' : 'text-cave-400'}`}>{quand(step, i)}</span>
            <span className="min-w-0 flex-1 text-sm text-cave-50">{step.label}</span>
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center">
              <input type="checkbox" className="h-6 w-6 accent-hop" checked={fait} disabled={!peut} aria-label={`Étape du starter : ${step.label}`}
                onChange={event => enCours ? markStep(step.id, event.target.checked) : begin(step.id)} />
            </span>
          </li>;
        })}
      </ol>
      <div className="space-y-2 p-2">
      <details className="rounded-control border border-cave-800 px-2"><summary className="min-h-touch cursor-pointer py-2 text-sm text-water">Produit, inoculum, régularisation</summary><div className="space-y-2 pb-2">
      <p className="text-xs text-cave-400">{startLabel}</p>
      {staleExecution && <p role="alert" className="text-sm text-alert-strong">L’exécution conserve le plan {execution?.plan.id} · révision {execution?.plan.revision}. La date ou le plan courant a changé ; vérifie la notice avant de poursuivre.</p>}
      {!execution && preparationState === 'stale' && <p role="alert" className="text-sm text-alert-strong">Le plan ne correspond plus à la date prévue ou aux données de levure figées. Revalide-le avant de commencer.</p>}
      {!execution && preparationState === 'too-late' && <p role="alert" className="text-sm text-alert-strong">{expired
        ? 'L’ensemencement cible est passé : ne démarre pas ce plan. Replanifie sa date avant de commencer.'
        : `Il reste ${hoursText(hoursUntilPitch)} h avant l’ensemencement cible, sous le minimum publié de ${hoursText(plan.protocol.leadHours.min)} h. Ne démarre pas ce plan à ce stade; replanifie avant de commencer. Cette borne n’est pas une garantie de viabilité.`}</p>}
      {expired && started && <p role="alert" className="text-sm text-alert-strong">L’échéance de transfert est passée. La préparation reste consignée ; vérifie les conditions de la notice, sans supposer qu’elle fournit assez de cellules.</p>}
      <div className="space-y-1 text-xs text-cave-400">
        <p><span className="text-cave-200">Produit</span> · {productLabel}{snapshotProduct?.id === plan.productId ? ` · ${plan.productId}` : ''}</p>
        <p><span className="text-cave-200">Prévu</span> · Culture {plan.volumeL.toLocaleString('fr-CH')} L · densité cible {formatDecimal(plan.protocol.targetSg, 3)} · inoculum {plan.inoculum}</p>
<p><span className="text-cave-200">{startBasisLabel}</span> · {preparationDate(plan.startAt)} → <span className="text-cave-200">Ensemencement cible</span> · {preparationDate(plan.targetPitchAt)}</p>
      </div>
      {execution?.status !== 'transferred' && execution?.status !== 'cancelled' && <p className="text-xs text-cave-400">Repères indicatifs. Garde une marge pour l’activation de l’inoculum et le refroidissement selon la notice.</p>}

      {withinShortWindow && <p role="status" className="text-sm text-cave-200">Il reste {hoursText(hoursUntilPitch)} h, soit {hoursText(plan.protocol.leadHours.max - hoursUntilPitch)} h de moins que la borne haute publiée ({hoursText(plan.protocol.leadHours.max)} h). Le minimum publié ({hoursText(plan.protocol.leadHours.min)} h) est atteint, mais cette fenêtre ne garantit pas l’achèvement ni la viabilité. {shortWindowMessage}</p>}
      {active && !execution && preparationState === 'due' && !expired && plan.status === 'planned' && <Button intent="primary" full disabled={!canBegin} onClick={() => begin()}>Commencer la préparation du starter</Button>}
      {execution && (execution.status === 'started' || execution.status === 'ready') && <p role="status" className="text-sm text-cave-200">{execution.steps.length}/{execution.plan.steps.length} étapes consignées · {execution.status === 'ready' ? 'préparation prête' : 'à poursuivre'}.</p>}
      {execution?.status === 'transferred' && <p role="status" className="text-sm text-cave-200">Culture transférée · Volume réellement transféré : {execution.cultureVolumeL != null ? `${execution.cultureVolumeL.toLocaleString('fr-CH')} L` : 'non renseigné'}.</p>}
      {active && !execution && preparationState === 'due' && !expired && plan.status === 'planned' && <section className="border-t border-cave-800 pt-2 space-y-2" aria-label="Prélèvement de l’inoculum">
        <p className="text-xs text-cave-400">Consigne l’inoculum réellement prélevé si tu le connais. Le texte prévu du plan n’est pas une quantité consommée.</p>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-end">
          <label className="block space-y-1 text-xs text-cave-400">Inoculum prélevé
            <NumberInput aria-label="Quantité d’inoculum prélevée" value={inoculumAmount} onValue={setInoculumAmount} min={0} max={100000} emptyValue={undefined} placeholder="À consigner" />
          </label>
          <label className="block space-y-1 text-xs text-cave-400">Unité
            <select aria-label="Unité de l’inoculum prélevé" value={inoculumUnit} onChange={event => setInoculumUnit(event.target.value)} className="min-h-touch rounded-control border border-cave-700 bg-cave-900 px-2 text-sm text-cave-50">
              <option value="">À choisir</option>{inoculumUnitOptions.map(unit => <option key={unit} value={unit}>{unit}</option>)}
            </select>
          </label>
        </div>
        {inoculumAmount === 0 && <p role="alert" className="text-xs text-alert-strong">Un inoculum nul n’est pas un prélèvement. Corrige la valeur ou laisse-la vide pour régulariser par comptage.</p>}
        <label className="block space-y-1 text-xs text-cave-400">Article exact si lié au stock
          <select aria-label="Article de stock de l’inoculum" value={correctionRef} onChange={event => setCorrectionRef(event.target.value)} className="w-full min-h-touch rounded-control border border-cave-700 bg-cave-900 px-2 text-sm text-cave-50">
            <option value="">À associer ou à régulariser</option>{rawMaterials.map(item => <option key={item.ref} value={item.ref}>{item.name} · {item.ref} · {item.unit}</option>)}
          </select>
        </label>
      </section>}
      {execution && execution.status !== 'transferred' && execution.status !== 'cancelled' && <section className="border-t border-cave-800 pt-2 space-y-2" aria-label="Inoculum réellement prélevé">
        {execution.inoculumUsed ? <p className="text-sm text-cave-200">Inoculum consigné · {execution.inoculumUsed.amount.toLocaleString('fr-CH')} {execution.inoculumUsed.unit}{execution.inoculumUsed.stockItemRef ? ` · ${execution.inoculumUsed.stockItemRef}` : ' · article à associer'}</p> : <p className="text-xs text-cave-400">Inoculum réel non consigné. Tu peux le noter avant de poursuivre ou régulariser son stock par comptage.</p>}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 items-end">
          <label className="block space-y-1 text-xs text-cave-400">Inoculum réellement prélevé
            <NumberInput aria-label="Quantité d’inoculum réellement prélevée" value={inoculumAmount} onValue={setInoculumAmount} min={0} max={100000} emptyValue={undefined} placeholder="Non consigné" />
          </label>
          <label className="block space-y-1 text-xs text-cave-400">Unité
            <select aria-label="Unité de l’inoculum réellement prélevé" value={inoculumUnit} onChange={event => setInoculumUnit(event.target.value)} className="min-h-touch rounded-control border border-cave-700 bg-cave-900 px-2 text-sm text-cave-50">
              <option value="">À choisir</option>{inoculumUnitOptions.map(unit => <option key={unit} value={unit}>{unit}</option>)}
            </select>
          </label>
        </div>
        {inoculumAmount === 0 && <p role="alert" className="text-xs text-alert-strong">Un inoculum nul n’est pas un prélèvement. Corrige la valeur ou efface-la.</p>}
        <label className="block space-y-1 text-xs text-cave-400">Article exact
          <select aria-label="Article exact de l’inoculum" value={correctionRef} onChange={event => setCorrectionRef(event.target.value)} className="w-full min-h-touch rounded-control border border-cave-700 bg-cave-900 px-2 text-sm text-cave-50">
            <option value="">À associer ou à régulariser</option>{rawMaterials.map(item => <option key={item.ref} value={item.ref}>{item.name} · {item.ref} · {item.unit}</option>)}
          </select>
        </label>
        <Button intent="secondary" full disabled={!Number.isFinite(inoculumAmount) || inoculumAmount! <= 0 || !inoculumUnit.trim()} onClick={saveInoculum}>Enregistrer l’inoculum prélevé</Button>
      </section>}
      {execution && (execution.status !== 'cancelled' || execution.steps.length > 0 || !!execution.inoculumUsed) && <section className="border-t border-cave-800 pt-2 space-y-2" aria-label="Régularisation du stock du starter">
        <p data-notice className="text-xs text-ebc-amber">Aucun débit n’est appliqué depuis ce suivi. Un inoculum avec quantité et article exacts pourra être déduit au journal du brassin ; le volume de culture transféré ne sera jamais traité comme un prélèvement d’inoculum. Le milieu reste à compter ici.</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-xs text-cave-400">
          <dt>Inoculum</dt><dd>{correctionStatus('inoculum') ? `Inventaire corrigé · ${regularized('inoculum').map(entry => entry.stockItemRef).join(', ')}` : execution.inoculumUsed?.amount > 0 && execution.inoculumUsed.unit && execution.inoculumUsed.stockItemRef ? `Prélèvement consigné · ${execution.inoculumUsed.stockItemRef} · déduction différée` : 'À régulariser par comptage'}</dd>
          <dt>Milieu</dt><dd>{correctionStatus('medium') ? `Inventaire corrigé · ${regularized('medium').map(entry => entry.stockItemRef).join(', ')}` : 'À régulariser'}</dd>
        </dl>
        <div className="grid grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)_auto] gap-2 items-end">
          <label className="block space-y-1 text-xs text-cave-400">Composant du starter
            <select aria-label="Composant du starter à régulariser" value={correctionKind} onChange={event => setCorrectionKind(event.target.value as 'inoculum' | 'medium')} className="min-h-touch rounded-control border border-cave-700 bg-cave-900 px-2 text-sm text-cave-50">
              <option value="inoculum">Inoculum</option><option value="medium">Milieu</option>
            </select>
          </label>
          <label className="block min-w-0 space-y-1 text-xs text-cave-400">Article de stock exact
            <select aria-label="Stock à régulariser" value={correctionRef} onChange={event => setCorrectionRef(event.target.value)} className="w-full min-h-touch rounded-control border border-cave-700 bg-cave-900 px-2 text-sm text-cave-50">
              <option value="">Choisir dans le stock</option>{rawMaterials.map(item => <option key={item.ref} value={item.ref}>{item.name} · {item.ref} · {item.unit}</option>)}
            </select>
          </label>
          <Button intent="secondary" disabled={!execution || !rawMaterials.some(item => item.ref === correctionRef)} onClick={() => setCorrectionItem(rawMaterials.find(item => item.ref === correctionRef) ?? null)}>Corriger l’inventaire</Button>
        </div>
        {rawMaterials.length === 0 && <p className="text-xs text-cave-400">Aucun article de matière première n’est disponible pour correction. Ajoute l’article au stock puis reviens régulariser le comptage.</p>}
        {inoculumNotice && <p role="status" className="text-sm text-hop">{inoculumNotice}</p>}
      </section>}
      <details className="rounded-control border border-cave-800 px-2">
        <summary className="min-h-touch cursor-pointer py-2 text-sm text-water">Notice et étapes complètes · {plan.protocol.source.title}</summary>
        <div className="space-y-2 pb-2 text-sm text-cave-200">
          <p className="font-medium">{plan.protocol.label}</p>
          <p>{plan.protocol.method}</p>
          <p className="text-xs text-cave-400">{plan.protocol.conditions}</p>
          <p className="text-xs text-cave-400">{plan.protocol.medium === 'malt-extract' ? 'Milieu documenté · extrait de malt' : plan.protocol.medium} · {plan.volumeL.toLocaleString('fr-CH')} L · densité cible {formatDecimal(plan.protocol.targetSg, 3)} · inoculum prévu : {plan.inoculum}</p>
          <p className="text-xs text-cave-400">Matériel prévu · {plan.equipment}</p>
          <ol className="list-decimal space-y-1 pl-5" aria-label="Étapes de la notice">
            {plan.steps.map(step => <li key={step.id}>{step.label}{stepCue(step) && <small className="block text-xs text-cave-400">{stepCue(step)}</small>}</li>)}
          </ol>
          <p className="text-xs text-cave-400">Cellules obtenues : inconnues sans mesure ou modèle de croissance applicable. Ce plan ne garantit pas la couverture d’un déficit.</p>
          {/^https:\/\//i.test(plan.protocol.source.url) ? <a className="text-xs text-water underline break-all" href={plan.protocol.source.url} target="_blank" rel="noreferrer">Source · {plan.protocol.source.title} · source relevée le {plan.protocol.source.checkedAt}</a> : <p className="text-xs text-cave-400">Source · {plan.protocol.source.title}</p>}
          {plan.note && <p className="text-xs text-cave-400">Note · {plan.note}</p>}
        </div>
      </details>
      </div></details>
      </div>
    </section>
    <InventoryCorrectionSheet open={!!correctionItem} item={correctionItem} onClose={() => setCorrectionItem(null)} onConfirm={(counted, reason, note) => correctionItem && confirmInventoryCorrection(correctionItem, counted, reason, note)} />
  </>;
}
