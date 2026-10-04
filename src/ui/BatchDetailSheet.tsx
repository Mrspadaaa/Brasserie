import { Input, Textarea } from './Input';
import React, { useState, useEffect } from 'react';
import { Trash2, ArrowRight, AlertTriangle, PackageCheck } from 'lucide-react';
import { Batch, StockItem } from '../types';
import { BATCH_STATUS, BATCH_STATUSES, nextStatus, statusOfBatch } from '../domain/batchStatus';
import { StorageService } from '../services/storage';
import { BrewingMath } from '../services/brewingMath';
import { Sheet, ConfirmSheet } from './Sheet';
import { InventoryCorrectionSheet } from './InventoryCorrectionSheet';
import { NumberInput } from './NumberInput';
import { Button } from '../components/ui/Button';
import { BrewerChat } from './BrewerChat';
import { useSyncedDraft } from '../hooks/useLiveData';
import { HopTastingsPanel } from './hopIndex/HopTastingsPanel';
import { FermentationCurveChart } from '../components/charts/FermentationCurveChart';
import type { BatchDetailSection } from '../domain/productionInsights';
import { BatchGravityEntry } from './production/BatchGravityEntry';
import { parseDecimal } from './numericInput';
import { NoloPanel } from './NoloPanel';
import { noloRecipeForBatch } from '../domain/nolo';
import { BrewBudgetButton } from './finance/BrewBudgetDialog';
import { DateField, toIsoDate } from './DateField';
import { Units } from '../services/units';
import { hasBrewStarted, actualBrewDate, plannedBrewDate, preserveBrewDates } from '../domain/batchSchedule';
import { BatchSchedule } from './production/BatchSchedule';
import { saveBatchSchedule } from '../services/batchSchedule';
import { BrewSystemFeedback } from './BrewSystemFeedback';
import { yeastPreparationState } from '../domain/yeastPitching';
import type { YeastPreparationPlan } from '../../functions/src/yeastSupplySchema';

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
}

export const BatchDetailSheet: React.FC<BatchDetailSheetProps> = ({
  batch,
  onClose,
  initialSection = 'measurements'
}) => {
  const [draft, setDraft] = useSyncedDraft(batch, batch?.id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [section, setSection] = useState<BatchDetailSection>(initialSection);
  const [noloNotice,setNoloNotice]=useState('');
  const [confirmStock, setConfirmStock] = useState<'already' | 'consume' | 'remaining' | null>(null);
  const [stockMessage, setStockMessage] = useState('');
  useEffect(() => {
    setSection(initialSection);
    setConfirmDelete(false);
    setConfirmStock(null);
    setStockMessage('');
  }, [batch?.id, initialSection]);

  if (!batch || !draft) return null;

  const style = statusOfBatch(draft);
  const awaitingPitch = draft.brewDay?.phase === 'awaiting-pitch' && draft.brewDay.pitchedAt == null;
  const suivant = awaitingPitch ? null : nextStatus(draft.status);

  const og = parseDecimal(draft.og || '');
  const fg = parseDecimal(draft.fg || '');
  const abv =
    !noloRecipeForBatch(draft) && og !== null && fg !== null && og > 1 && fg > 0 && og >= fg
      ? BrewingMath.calculateABV(og, fg)
      : null;

  const field =
    'w-full min-h-touch-lg px-2 rounded-control bg-cave-950 border border-cave-700 ' +
    'text-cave-50 text-base focus:outline-none focus:border-ebc-straw transition-colors';

  const save = (patch: Partial<Batch>) => {
    const updated = { ...draft, ...patch };
    setDraft(updated);
    StorageService.updateBatch(updated);
  };
  const pending = draft.stockConsumption?.pendingItems ?? [];
  const stockContext = pending.length ? StorageService.getStocks() : null;
  const stockNames = new Map([...(stockContext?.rawMaterials ?? []), ...(stockContext?.cleaning ?? [])].map(item => [item.ref, item.name]));
  const historicalStock = draft.stockAccountingVersion !== 1;
  const stockNotDue = draft.status === 'planifie' || draft.status === 'annule';
  const needsBrewStock = draft.stockAccountingVersion === 1 && !draft.stockConsumption?.appliedAt && draft.status !== 'planifie' && draft.status !== 'annule';
  const stockIssues = draft.stockReviewIssues ?? [];
  const synchronizeStock = (updated: Batch, stage: 'brewday' | 'remaining' | 'historical-already' | 'historical-unconsumed', confirmHistorical = false) => {
    const result = StorageService.completeBrewStock(updated, stage, confirmHistorical);
    const saved = StorageService.getBatches().find(b => b.id === updated.id);
    setDraft({ ...updated, ...(result.success ? { stockAccountingVersion: 1 } : {}), ...(saved?.stockConsumption ? { stockConsumption: saved.stockConsumption, stockAccountingVersion: saved.stockAccountingVersion } : {}), stockReviewIssues: result.issues });
    setStockMessage(result.success ? stage === 'historical-already' ? 'Confirmation conservée : les quantités de stock sont restées inchangées.' : stage === 'historical-unconsumed' ? 'Suivi confirmé : aucun stock retiré. Les ingrédients seront déstockés lors de la réalisation du brassin.' : stage === 'remaining' ? 'Ajouts de fermentation déstockés. Aucun ingrédient ne sera déduit une seconde fois.' : 'Ingrédients du brassage déstockés. Les ajouts de fermentation restent réservés.' : 'La production est enregistrée. Le stock attend les vérifications ci-dessous.');
  };
  const changeStatus = (status: Batch['status']) => {
    if (status === draft.status) return;
    if (awaitingPitch && status !== 'planifie' && status !== 'annule') { setStockMessage('Reprends le jour de brassage pour consigner l’ajout réel de levure avant de passer en fermentation.'); return; }
    const updated = { ...draft, ...preserveBrewDates(draft), status };
    if (status === 'annule' || status === 'planifie') { save(updated); return; }
    if (status === 'conditionne' || status === 'termine') {
      synchronizeStock(updated, draft.stockConsumption?.appliedAt ? 'remaining' : 'brewday');
    } else if (!draft.stockConsumption?.appliedAt && (draft.status === 'planifie' || draft.stockAccountingVersion === 1)) {
      synchronizeStock(updated, 'brewday');
    } else save(updated);
  };

  return (
    <>
      <Sheet
        open={!!batch}
        onClose={onClose}
        title={draft.name}
        subtitle={`${draft.id} · ${draft.style} · ${draft.volumeL} L visés`}
        className="md:max-w-2xl md:mx-auto"
        footer={
          <Button intent="primary" full onClick={onClose}>
            Fermer
          </Button>
        }
      >
        <div className="space-y-2">
          <BatchSchedule batch={draft} onSave={async updated => {
            const saved = await saveBatchSchedule(draft, updated.plannedBrewDate ?? '', value => StorageService.updateBatch(value));
            setDraft(saved);
          }} />
          <YeastPreparationPanel batch={draft} onSave={save} />
          {noloRecipeForBatch(draft)&&<details><summary className="min-h-touch cursor-pointer text-water">Pilote NOLO · mesures et conditionnement</summary><NoloPanel measurementOnly recipe={noloRecipeForBatch(draft)!} onChange={r=>setDraft({...draft,nolo:r.nolo})}/><Button onClick={async()=>{try{save({nolo:draft.nolo??draft.recipeSnapshot?.nolo});await StorageService.confirmPendingWrites();setNoloNotice('Mesures NOLO enregistrées sur ce brassin.');}catch(e){setNoloNotice('Enregistrement non confirmé : '+(e instanceof Error?e.message:'réessayer'));}}}>Enregistrer le suivi NOLO du brassin</Button>{noloNotice&&<p role="status" className="text-sm text-water">{noloNotice}</p>}</details>}
          <nav
            className="grid grid-cols-3 border-b border-cave-700"
            aria-label="Rubriques du brassin"
          >
            {(
              [
                ['measurements', 'Mesures'],
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
          {(historicalStock || needsBrewStock || stockIssues.length > 0 || pending.length > 0) && (
            <section aria-label="Suivi du stock du brassin" className="rounded-xl border border-ebc-amber/30 bg-cave-950 p-2 space-y-2">
              <div className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 shrink-0 text-ebc-amber mt-0.5" /><div><h3 className="text-sm font-semibold text-cave-50">{historicalStock ? 'Stock de ce brassin à confirmer' : stockIssues.length || needsBrewStock ? 'Stock à vérifier' : 'Ajouts réservés pour la fermentation'}</h3><p className="text-2xs text-cave-400 leading-snug mt-1">{historicalStock ? 'Ce brassin vient de l’ancien suivi. Indiquez ce qui a déjà été retiré pour éviter une double déduction.' : needsBrewStock ? 'Les relevés sont conservés. Vérifiez les ingrédients puis confirmez leur sortie de stock.' : 'Les réservations protègent ces ingrédients pour ce brassin jusqu’à leur ajout réel.'}</p></div></div>
              {stockIssues.length > 0 && <ul className="list-disc pl-5 text-sm text-ebc-amber space-y-1">{stockIssues.map(issue => <li key={issue}>{issue}</li>)}</ul>}
              {pending.length > 0 && <ul className="text-sm text-cave-200 space-y-1">{pending.map((item, i) => <li key={`${item.stockItemRef}-${i}`}>{stockNames.get(item.stockItemRef) ?? item.stockItemRef} · {Units.format(item.quantity, item.unit)}</li>)}</ul>}
              {historicalStock ? <div className="grid gap-2 sm:grid-cols-2"><Button intent="secondary" full onClick={() => setConfirmStock('already')}>Tout est déjà déstocké</Button>{stockNotDue ? <Button intent="primary" full onClick={() => synchronizeStock(draft, 'historical-unconsumed', true)}>Le stock n’a pas été déduit</Button> : <Button intent="primary" full onClick={() => setConfirmStock('consume')}>Déstocker le brassage maintenant</Button>}</div> : <>
                {(needsBrewStock || stockIssues.length > 0) && <Button intent="primary" full onClick={() => synchronizeStock(draft, draft.stockConsumption?.appliedAt ? 'remaining' : 'brewday')}>Revérifier et déstocker</Button>}
                {pending.length > 0 && <Button intent="secondary" full onClick={() => setConfirmStock('remaining')}>Confirmer les ajouts de fermentation</Button>}
              </>}
              {stockIssues.length > 0 && <p className="text-xs text-cave-400 leading-relaxed">Associez les articles dans le budget du brassin, ou corrigez les quantités comptées dans Stocks, puis revenez vérifier ici.</p>}
            </section>
          )}
          {stockMessage && <p role="status" className="text-sm text-hop flex items-start gap-2"><PackageCheck className="w-4 h-4 shrink-0 mt-0.5" />{stockMessage}</p>}
          {section === 'overview' && (
            <>
              <BrewBudgetButton batch={draft} />
              <section className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-control border text-sm ${style.chip}`}>
                    {style.label}
                  </span>
                  <span className="text-sm text-cave-400">{style.hint}</span>
                </div>

                {suivant && (
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

              <label className="block space-y-1 text-xs text-cave-400">Étape du brassin
                <select className={field} value={draft.status} onChange={event => changeStatus(event.target.value as Batch['status'])}>
                  {BATCH_STATUSES.map(status => <option key={status} value={status}>{status === draft.status ? style.label : BATCH_STATUS[status].label}</option>)}
                </select>
              </label>
            </>
          )}
          {section === 'measurements' && (
            <>
              <section className="space-y-2">
                <h3 className="text-base font-semibold text-cave-50">Mesures</h3>

                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1.5">
                    <span className="text-sm text-cave-400">
                      Densité initiale
                      {draft.recipeSnapshot?.ogTarget != null && (
                        <span className="block text-water">
                          Cible {draft.recipeSnapshot.ogTarget.toFixed(3)}
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
                      value={draft.og || ''}
                      onChange={(e) => setDraft({ ...draft, og: e.target.value })}
                      onBlur={() =>
                        save({ og: draft.og, ...(abv !== null ? { abv: `${abv}%` } : {}) })
                      }
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-sm text-cave-400">
                      Densité finale
                      {draft.recipeSnapshot?.fgTarget != null && (
                        <span className="block text-water">
                          Cible {draft.recipeSnapshot.fgTarget.toFixed(3)}
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
                      value={draft.fg || ''}
                      onChange={(e) => setDraft({ ...draft, fg: e.target.value })}
                      onBlur={() =>
                        save({ fg: draft.fg, abv: abv !== null ? `${abv}%` : draft.abv })
                      }
                    />
                  </label>
                </div>

                {abv !== null && (
                  <p className="text-sm text-cave-400">
                    Alcool calculé : <span className="font-mono text-hop">{abv} % vol</span>
                  </p>
                )}

                {hasBrewStarted(draft) && <DateField label="Jour réellement brassé" value={actualBrewDate(draft) ?? ''} onChange={brewDate => save({ brewDate, plannedBrewDate: plannedBrewDate(draft) ?? '' })} shortcuts={[]} />}
              </section>

              {(draft.status === 'fermentation' || draft.status === 'garde') && (
                <BatchGravityEntry
                  key={draft.id}
                  batch={draft}
                  onAdd={(reading) => save({ gravityLog: [...(draft.gravityLog ?? []), reading] })}
                />
              )}
              <div className="grid grid-cols-2 gap-2 text-sm text-cave-400 border-y border-cave-800 py-1.5">
                <p>
                  Volume brassé
                  <span className="block text-base text-cave-50 tabular-nums">
                    {draft.volumeBrewedL != null ? `${draft.volumeBrewedL} L` : 'Non renseigné'}
                  </span>
                </p>
                <p>
                  Conditionné
                  <span className="block text-base text-cave-50 tabular-nums">
                    {draft.volumePackagedL != null ? `${draft.volumePackagedL} L` : 'Non renseigné'}
                  </span>
                </p>
              </div>
              <FermentationCurveChart batch={draft} />
              {draft.brewDay?.pitchedAt != null && <p className="text-xs text-cave-200">Levure ajoutée le {new Date(draft.brewDay.pitchedAt).toLocaleString('fr-CH')}{draft.brewDay.pitchTemperatureC != null ? ` à ${draft.brewDay.pitchTemperatureC} °C` : ' · température non relevée'}.</p>}
              {awaitingPitch && <p role="status" className="text-sm text-water">En attente d’ensemencement. Reprends le jour de brassage depuis le carnet des brassins.</p>}
              {draft.recipeSnapshot && draft.brewDay && <BrewSystemFeedback recipe={draft.recipeSnapshot} state={draft.brewDay}/>}
            </>
          )}
          {section === 'tasting' && (
            <>
              <section className="space-y-2">
                <h3 className="text-base font-semibold text-cave-50">Carnet</h3>

                {(
                  [
                    ['notesTasting', 'Dégustation et prochain essai'],
                    ['notesBrewDay', 'Observations du jour de brassage'],
                    ['notesCreation', 'Inspiration et profil visé']
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block space-y-1.5">
                    <span className="text-sm text-cave-400">{label}</span>
                    <Textarea
                      name={`batch_sheet_${key}`}
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
                ))}
              </section>
              <HopTastingsPanel batch={draft} />
            </>
          )}
          {section === 'overview' && (
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

      <ConfirmSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          StorageService.deleteBatch(batch.id);
          onClose();
        }}
        title="Supprimer ce brassin ?"
        what={`${batch.id} — ${batch.name}`}
        consequence={
          batch.status === 'planifie'
            ? 'Rien n’a encore été déstocké : la suppression est sans conséquence sur le stock.'
            : 'Les ingrédients déjà consommés restent déstockés. Les éventuels retours d’ingrédients se consignent par une correction d’inventaire.'
        }
        confirmLabel="Supprimer le brassin"
      />
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

function YeastPreparationPanel({ batch, onSave }: { batch: Batch; onSave: (patch: Partial<Batch>) => void }) {
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

  const begin = () => {
    if (!planned || !yeast || !active || execution || preparationState !== 'due' || expired || planned.status !== 'planned') return;
    const inoculumUsed = Number.isFinite(inoculumAmount) && inoculumAmount! > 0 && inoculumUnit.trim()
      ? { amount: inoculumAmount!, unit: inoculumUnit.trim(), ...(correctionRef ? { stockItemRef: correctionRef } : {}) }
      : undefined;
    onSave({ yeastPreparation: { plan: structuredClone(planned), status: 'started', startedAt: Date.now(), steps: [], ...(inoculumUsed ? { inoculumUsed } : {}) } });
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
    <section aria-label="Préparation de levure" className="rounded-xl border border-cave-800 bg-cave-950 p-2 space-y-2">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h3 className="text-sm font-semibold text-cave-50">Starter · {productLabel}</h3>
        <span className="text-xs text-cave-200">{startLabel}</span>
      </div>
      {staleExecution && <p role="alert" className="text-sm text-alert-strong">L’exécution conserve le plan {execution?.plan.id} · révision {execution?.plan.revision}. La date ou le plan courant a changé ; vérifie la notice avant de poursuivre.</p>}
      {!execution && preparationState === 'stale' && <p role="alert" className="text-sm text-alert-strong">Le plan ne correspond plus à la date prévue ou aux données de levure figées. Revalide-le avant de commencer.</p>}
      {!execution && preparationState === 'too-late' && <p role="alert" className="text-sm text-alert-strong">{expired
        ? 'L’ensemencement cible est passé : ne démarre pas ce plan. Replanifie sa date avant de commencer.'
        : `Il reste ${hoursText(hoursUntilPitch)} h avant l’ensemencement cible, sous le minimum publié de ${hoursText(plan.protocol.leadHours.min)} h. Ne démarre pas ce plan à ce stade; replanifie avant de commencer. Cette borne n’est pas une garantie de viabilité.`}</p>}
      {expired && started && <p role="alert" className="text-sm text-alert-strong">L’échéance de transfert est passée. La préparation reste consignée ; vérifie les conditions de la notice, sans supposer qu’elle fournit assez de cellules.</p>}
      <div className="space-y-1 text-xs text-cave-400">
        <p><span className="text-cave-200">Produit</span> · {productLabel}{snapshotProduct?.id === plan.productId ? ` · ${plan.productId}` : ''}</p>
        <p><span className="text-cave-200">Prévu</span> · Culture {plan.volumeL.toLocaleString('fr-CH')} L · SG cible {plan.protocol.targetSg.toFixed(3)} · inoculum {plan.inoculum}</p>
        <p><span className="text-cave-200">{startBasisLabel}</span> · {preparationDate(plan.startAt)} → <span className="text-cave-200">Ensemencement cible</span> · {preparationDate(plan.targetPitchAt)}</p>
      </div>
      {execution?.status !== 'transferred' && execution?.status !== 'cancelled' && <p className="text-xs text-cave-400">Repères indicatifs. Garde une marge pour l’activation de l’inoculum et le refroidissement selon la notice.</p>}

      {withinShortWindow && <p role="status" className="text-sm text-cave-200">Il reste {hoursText(hoursUntilPitch)} h, soit {hoursText(plan.protocol.leadHours.max - hoursUntilPitch)} h de moins que la borne haute publiée ({hoursText(plan.protocol.leadHours.max)} h). Le minimum publié ({hoursText(plan.protocol.leadHours.min)} h) est atteint, mais cette fenêtre ne garantit pas l’achèvement ni la viabilité. {shortWindowMessage}</p>}
      {active && !execution && preparationState === 'due' && !expired && plan.status === 'planned' && <Button intent="primary" full disabled={!canBegin} onClick={begin}>Commencer la préparation du starter</Button>}
      {execution && (execution.status === 'started' || execution.status === 'ready') && <p role="status" className="text-sm text-cave-200">{execution.steps.length}/{execution.plan.steps.length} étapes consignées · {execution.status === 'ready' ? 'préparation prête' : 'à poursuivre'}.</p>}
      {execution?.status === 'transferred' && <p role="status" className="text-sm text-cave-200">Culture transférée · Volume réellement transféré : {execution.cultureVolumeL != null ? `${execution.cultureVolumeL.toLocaleString('fr-CH')} L` : 'non renseigné'}.</p>}
      {execution && (execution.status === 'started' || execution.status === 'ready') && <ol className="space-y-1 border-t border-cave-800 pt-2 text-sm text-cave-200" aria-label="Étapes de la préparation">
        {plan.steps.map(step => <li key={step.id}>
          <label className="flex items-start gap-2">
            <input type="checkbox" checked={completed.has(step.id)} onChange={event => markStep(step.id, event.target.checked)} aria-label={`Étape du starter : ${step.label}`} />
            <span className="flex-1">{step.label}{stepCue(step) && <small className="block text-xs text-cave-400">{stepCue(step)}</small>}</span>
            {completed.has(step.id) && <small className="text-cave-400">Consignée · {preparationDate(execution.steps.find(done => done.id === step.id)!.at)}</small>}
          </label>
        </li>)}
      </ol>}
      {execution && !started && execution.steps.length > 0 && <ol className="space-y-1 border-t border-cave-800 pt-2 text-sm text-cave-200" aria-label="Étapes de la préparation consignées">
        {plan.steps.filter(step => completed.has(step.id)).map(step => <li key={step.id}>
          <span>{step.label}<small className="block text-xs text-cave-400">Consignée · {preparationDate(execution.steps.find(done => done.id === step.id)!.at)}</small></span>
        </li>)}
      </ol>}
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
          <p className="text-xs text-cave-400">{plan.protocol.medium === 'malt-extract' ? 'Milieu documenté · extrait de malt' : plan.protocol.medium} · {plan.volumeL.toLocaleString('fr-CH')} L · SG cible {plan.protocol.targetSg.toFixed(3)} · inoculum prévu : {plan.inoculum}</p>
          <p className="text-xs text-cave-400">Matériel prévu · {plan.equipment}</p>
          <ol className="list-decimal space-y-1 pl-5" aria-label="Étapes de la notice">
            {plan.steps.map(step => <li key={step.id}>{step.label}{stepCue(step) && <small className="block text-xs text-cave-400">{stepCue(step)}</small>}</li>)}
          </ol>
          <p className="text-xs text-cave-400">Cellules obtenues : inconnues sans mesure ou modèle de croissance applicable. Ce plan ne garantit pas la couverture d’un déficit.</p>
          {/^https:\/\//i.test(plan.protocol.source.url) ? <a className="text-xs text-water underline break-all" href={plan.protocol.source.url} target="_blank" rel="noreferrer">Source · {plan.protocol.source.title} · source relevée le {plan.protocol.source.checkedAt}</a> : <p className="text-xs text-cave-400">Source · {plan.protocol.source.title}</p>}
          {plan.note && <p className="text-xs text-cave-400">Note · {plan.note}</p>}
        </div>
      </details>
    </section>
    <InventoryCorrectionSheet open={!!correctionItem} item={correctionItem} onClose={() => setCorrectionItem(null)} onConfirm={(counted, reason, note) => correctionItem && confirmInventoryCorrection(correctionItem, counted, reason, note)} />
  </>;
}
