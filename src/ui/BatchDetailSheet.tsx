import { Input, Textarea } from './Input';
import React, { useState, useEffect } from 'react';
import { Trash2, ArrowRight, AlertTriangle, PackageCheck } from 'lucide-react';
import { Batch } from '../types';
import { BATCH_STATUS, BATCH_STATUSES, nextStatus, statusOf } from '../domain/batchStatus';
import { StorageService } from '../services/storage';
import { BrewingMath } from '../services/brewingMath';
import { Sheet, ConfirmSheet } from './Sheet';
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
import { Units } from '../services/units';

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

  const style = statusOf(draft.status);
  const suivant = nextStatus(draft.status);

  const og = parseDecimal(draft.og || '');
  const fg = parseDecimal(draft.fg || '');
  const abv =
    !noloRecipeForBatch(draft) && og !== null && fg !== null && og > 1 && fg > 0 && og >= fg
      ? BrewingMath.calculateABV(og, fg)
      : null;

  const field =
    'w-full min-h-touch px-3 rounded-control bg-cave-950 border border-cave-700 ' +
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
    const updated = { ...draft, status };
    if (status === 'annule' || status === 'planifie') { save({ status }); return; }
    if (status === 'conditionne' || status === 'termine') {
      synchronizeStock(updated, draft.stockConsumption?.appliedAt ? 'remaining' : 'brewday');
    } else if (!draft.stockConsumption?.appliedAt && (draft.status === 'planifie' || draft.stockAccountingVersion === 1)) {
      synchronizeStock(updated, 'brewday');
    } else save({ status });
  };

  return (
    <>
      <Sheet
        open={!!batch}
        onClose={onClose}
        title={draft.name}
        subtitle={`${draft.id} · ${draft.style} · ${draft.volumeL} L`}
        className="md:max-w-2xl md:mx-auto"
        footer={
          <Button intent="primary" full onClick={onClose}>
            Fermer
          </Button>
        }
      >
        <div className="space-y-5">
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
            <section aria-label="Suivi du stock du brassin" className="rounded-xl border border-ebc-amber/30 bg-cave-950 p-4 space-y-3">
              <div className="flex items-start gap-2"><AlertTriangle className="w-5 h-5 shrink-0 text-ebc-amber mt-0.5" /><div><h3 className="font-semibold text-cave-50">{historicalStock ? 'Stock de ce brassin à confirmer' : stockIssues.length || needsBrewStock ? 'Stock à vérifier' : 'Ajouts réservés pour la fermentation'}</h3><p className="text-sm text-cave-400 leading-relaxed mt-1">{historicalStock ? 'Ce brassin vient de l’ancien suivi. Indiquez ce qui a déjà été retiré pour éviter une double déduction.' : needsBrewStock ? 'Les relevés sont conservés. Vérifiez les ingrédients puis confirmez leur sortie de stock.' : 'Les réservations protègent ces ingrédients pour ce brassin jusqu’à leur ajout réel.'}</p></div></div>
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
              <section className="space-y-3">
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

              <section className="space-y-3">
                <h3 className="text-base font-semibold text-cave-50">Étape</h3>
                <div className="grid grid-cols-2 gap-2">
                  {BATCH_STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => changeStatus(s)}
                      aria-pressed={draft.status === s}
                      className={`min-h-touch px-3 rounded-control border text-sm transition-colors ${
                        draft.status === s
                          ? BATCH_STATUS[s].chip
                          : 'bg-cave-950 border-cave-700 text-cave-400 hover:text-cave-50'
                      }`}
                    >
                      {BATCH_STATUS[s].label}
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
          {section === 'measurements' && (
            <>
              <section className="space-y-4">
                <h3 className="text-base font-semibold text-cave-50">Mesures</h3>

                <div className="grid grid-cols-2 gap-3">
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

                <label className="block space-y-1.5">
                  <span className="text-sm text-cave-400">Date de brassage</span>
                  <Input
                    name="batch_sheet_brewdate"
                    type="text"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    data-form-type="other"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    className={field}
                    value={draft.brewDate}
                    onChange={(e) => setDraft({ ...draft, brewDate: e.target.value })}
                    onBlur={() => save({ brewDate: draft.brewDate })}
                  />
                </label>
              </section>

              {(draft.status === 'fermentation' || draft.status === 'garde') && (
                <BatchGravityEntry
                  key={draft.id}
                  batch={draft}
                  onAdd={(reading) => save({ gravityLog: [...(draft.gravityLog ?? []), reading] })}
                />
              )}
              <div className="grid grid-cols-2 gap-3 text-sm text-cave-400 border-y border-cave-800 py-3">
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
            </>
          )}
          {section === 'tasting' && (
            <>
              <section className="space-y-4">
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
