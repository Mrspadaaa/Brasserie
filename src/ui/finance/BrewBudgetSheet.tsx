import React, { useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowDownRight, CalendarPlus, Check, ChevronRight, Package, Save } from 'lucide-react';
import type { AppConfig, Batch, Recipe, StockItem } from '../../types';
import { Sheet } from '../Sheet';
import { NumberInput } from '../NumberInput';
import { DateField, swissToday, toSwissDate } from '../DateField';
import { Units } from '../../services/units';
import { scaleBrewBudgetRecipe } from '../../domain/finance/brewBudgetScaling';
import { Field, inputClass } from '../FormNav';
import { BREW_COST_LABELS, brewBudgetDateKey, estimateBrewBudget, type BrewBudgetLine, type BrewBudgetSettings, type BrewBudgetSnapshot, type BrewCostKey, type BrewPrice, type BrewCashTreatment } from '../../domain/finance/brewBudget';
import './brew-budget.css';
import type { FinanceTransaction } from '../../domain/finance/types';

const chf = (v: number) => new Intl.NumberFormat('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
export interface BrewBudgetSheetProps {
  open: boolean;
  onClose: () => void;
  recipe?: Recipe;
  batch?: Batch;
  stockItems: StockItem[];
  batches: Batch[];
  config: AppConfig;
  savedEstimate?: BrewBudgetSnapshot;
  settings?: BrewBudgetSettings;
  transactions?: FinanceTransaction[];
  savedEstimates?: BrewBudgetSnapshot[];
  settingsWarnings?: string[];
  depreciationForBudgetYear?: (year: number) => { amountCHF?: number; warnings: string[] };
  renderPlanReconciliation?: (snapshot: BrewBudgetSnapshot) => React.ReactNode;
  canPlan?: (snapshot: BrewBudgetSnapshot) => boolean;
  onSave: (snapshot: BrewBudgetSnapshot, addToPlan: boolean) => void | Promise<void>;
}

/** Unmount the draft on close; live stock updates recalculate without overwriting the user's prices. */
export function BrewBudgetSheet(props: BrewBudgetSheetProps) {
  if (!props.open) return null;
  const recipe = props.batch?.recipeSnapshot ? { ...props.batch.recipeSnapshot, id: props.batch.recipeSnapshot.sourceRecipeId ?? props.batch.recipeRef ?? props.batch.id } as Recipe : props.recipe;
  if (!recipe) return <Sheet open onClose={props.onClose} title="Budget du brassin"><p className="p-4 text-cave-200">Associe une recette à ce brassin pour calculer ses besoins.</p></Sheet>;
  return <BrewBudgetDraft key={`${props.batch?.id ?? recipe.id}:${props.savedEstimate?.id ?? 'new'}`} {...props} recipe={recipe} />;
}

function BrewBudgetDraft({ recipe, batch, stockItems, batches, config, savedEstimate, savedEstimates, settings: defaultSettings, settingsWarnings, depreciationForBudgetYear, renderPlanReconciliation, canPlan, transactions, onClose, onSave }: BrewBudgetSheetProps & { recipe: Recipe }) {
  const [volume, setVolume] = useState(savedEstimate?.volumeL ?? recipe.volumeL);
  const [netVolume, setNetVolume] = useState(savedEstimate?.netVolumeL ?? batch?.volumePackagedL ?? recipe.volumeL);
  const lastValidVolume = useRef(volume);
  const costBasisVolume = savedEstimate?.volumeL ?? recipe.volumeL;
  const costBasisNetVolume = savedEstimate?.netVolumeL ?? batch?.volumePackagedL ?? recipe.volumeL;
  const changeVolume = (next: number | undefined) => {
    if (next > 0 && Number.isFinite(next)) {
      if (lastValidVolume.current > 0 && Number.isFinite(netVolume)) {
        setNetVolume(Math.round(netVolume * next / lastValidVolume.current * 1e6) / 1e6);
      }
      lastValidVolume.current = next;
    }
    setVolume(next);
  };
  const [date, setDate] = useState(savedEstimate?.brewDate ?? batch?.brewDate ?? recipe.brewDate ?? swissToday(7));
  const [settings, setSettings] = useState<BrewBudgetSettings>(() => structuredClone(savedEstimate?.settings ?? defaultSettings ?? {}));
  const [prices, setPrices] = useState<Record<string, BrewPrice>>(() => structuredClone(savedEstimate?.prices ?? {}));
  const [bindings, setBindings] = useState<Record<string, string>>(() => ({ ...savedEstimate?.bindings }));
  const [cashTreatments, setCashTreatments] = useState<Record<string, BrewCashTreatment>>(() => ({ ...savedEstimate?.cashTreatments }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const saving = useRef(false);
  const [lineFilter, setLineFilter] = useState<'all' | 'buy' | 'missing'>('all');
  const [focusedLineKey, setFocusedLineKey] = useState<string | null>(null);
  const [useRegisterDepreciation, setUseRegisterDepreciation] = useState(Boolean(depreciationForBudgetYear) && savedEstimate?.settings.annualDepreciationCHF == null);
  const futureBatch = !batch || batch.status === 'planifie' && !batch.stockConsumption?.appliedAt;
  const budgetYear = Number(brewBudgetDateKey(date)?.slice(0, 4));
  const registerDepreciation = useMemo(() => budgetYear ? depreciationForBudgetYear?.(budgetYear) : undefined, [depreciationForBudgetYear, budgetYear]);
  const effectiveSettings = useMemo(() => useRegisterDepreciation ? { ...settings, annualDepreciationCHF: registerDepreciation?.amountCHF } : settings, [settings, useRegisterDepreciation, registerDepreciation]);
  const scaled = useMemo(() => {
    if (volume === recipe.volumeL || !(volume > 0) || !Number.isFinite(volume) || !(recipe.volumeL > 0) || !Number.isFinite(recipe.volumeL)) return recipe;
    const source = recipe.brewhouse ?? config.brewhouses?.find(b => b.id === config.activeBrewhouseId) ?? config.brewhouses?.[0];
    return source ? scaleBrewBudgetRecipe(recipe, volume, source) : recipe;
  }, [recipe, volume, config.brewhouses, config.activeBrewhouseId]);
  const volumeIssue = !(recipe.volumeL > 0) || !Number.isFinite(recipe.volumeL) ? 'Corrige le volume de la recette avant de redimensionner ce brassin.' : !(volume > 0) || !Number.isFinite(volume) ? 'Renseigne un volume à brasser supérieur à zéro.' : Math.abs(scaled.volumeL - volume) > 1e-6 ? 'Configure une cuverie pour adapter les ingrédients à ce volume, ou reprends le volume de la recette.' : '';
  const invalidNetVolume = !(netVolume > 0) || !Number.isFinite(netVolume);
  const costsNeedVolumeReview = !volumeIssue && !invalidNetVolume && (Math.abs(volume - costBasisVolume) > 1e-6 || Math.abs(netVolume - costBasisNetVolume) > 1e-6) && Object.values(settings.costs ?? {}).some(cost => cost.enabled !== false && cost.amountTTC != null);
  const estimate = useMemo(() => {
    const result = estimateBrewBudget({ recipe: scaled, stockItems, batches, brewDate: date, batchId: batch?.id,
      netVolumeL: netVolume, bindings, prices, cashTreatments, settings: effectiveSettings, transactions, savedEstimates, isTvaRegistered: config.fiscal.isTvaRegistered });
    const issue = volumeIssue || (invalidNetVolume ? 'Volume net attendu à renseigner' : '');
    return issue ? { ...result, complete: false, costPerL: null, issues: [...new Set([...result.issues, issue])] } : result;
  }, [scaled, stockItems, batches, date, batch?.id, netVolume, bindings, prices, cashTreatments, effectiveSettings, transactions, savedEstimates, config.fiscal.isTvaRegistered, volumeIssue, invalidNetVolume]);
  const knownLines = estimate.lines.filter(l => l.consumedCost !== null).length;
  const requiredPrices = estimate.lines.filter(l => l.issues.length > 0);
  const purchaseLines = estimate.lines.filter(line => line.purchaseQuantity > 0 && line.cashTreatment !== 'included-in-recurring');
  // Completing the last missing price must not remove the input mid-keystroke.
  const visibleLines = estimate.lines.filter(line => lineFilter === 'all' || line.key === focusedLineKey || (lineFilter === 'missing' ? line.issues.length > 0 : line.purchaseQuantity > 0 && line.cashTreatment !== 'included-in-recurring'));
  const changePrice = (line: BrewBudgetLine, patch: Partial<BrewPrice>) => setPrices(current => {
    const previous = current[line.key] ?? line.price;
    const changesValue = ['amount', 'quantity', 'unit', 'basis', 'tvaRate', 'packQuantity'].some(key => key in patch);
    return { ...current, [line.key]: {
      quantity: 1, unit: line.unit, amount: undefined, basis: 'TTC', tvaRate: 0, source: 'manual', date: swissToday(), ...previous,
      ...(changesValue ? { source: 'manual' as const, date: swissToday(), ...(previous?.source !== 'manual' ? { note: previous?.note ? `Adapté de : ${previous.note}` : '' } : {}) } : {}),
      ...patch
    } };
  });
  const save = async (plan: boolean) => {
    if (saving.current || volumeIssue || invalidNetVolume || !brewBudgetDateKey(date) || plan && (!futureBatch || !estimate.complete || canPlan && !canPlan(estimate))) return;
    saving.current = true;
    setBusy(true); setError('');
    try { await onSave(estimate, plan); onClose(); }
    catch (e) { setError(e instanceof Error ? e.message : 'L’enregistrement a échoué. Ton estimation reste ici.'); }
    finally { saving.current = false; setBusy(false); }
  };
  return <Sheet open onClose={() => { if (!saving.current) onClose(); }} title={futureBatch ? 'Budget du prochain brassin' : 'Estimation pour reproduire ce brassin'} subtitle={recipe.name} dismissible={!busy}
    footer={<div className="brew-budget-actions">
      <button type="button" className="brew-budget-secondary" disabled={busy || Boolean(volumeIssue) || invalidNetVolume || !brewBudgetDateKey(date)} onClick={() => void save(false)}><Save size={17} />Enregistrer</button>
      {futureBatch && <button type="button" className="brew-budget-primary" disabled={busy || !estimate.complete || (canPlan && !canPlan(estimate))} onClick={() => void save(true)}><CalendarPlus size={17} />{busy ? 'Enregistrement…' : 'Prévoir cette dépense'}</button>}
    </div>}>
    <div className="brew-budget">
      {!futureBatch && <p className="brew-budget-hint">Ce brassin a déjà été produit. Cette simulation utilise le stock et les prix actuels pour le reproduire ; elle ne modifie pas son coût historique. Planifie un nouveau brassin depuis sa recette pour prévoir de nouveaux achats.</p>}
      <div className="brew-budget-summary" aria-live="polite">
        <p>Achats et frais supplémentaires {(!estimate.complete || volumeIssue) && <span className="brew-budget-partial">À compléter</span>}</p>
        <strong>{volumeIssue ? '—' : chf(estimate.cashRequiredTTC)} <span>CHF TTC</span></strong>
        <div className="brew-budget-breakdown"><span>Ingrédients à acheter <b>{volumeIssue ? '—' : chf(estimate.purchasesTTC)}</b></span><span>Autres frais à payer <b>{volumeIssue ? '—' : chf(estimate.operatingCashTTC)}</b></span></div>
        <div className="brew-budget-unit-cost"><div><span>Coût de revient {estimate.complete ? 'estimé' : 'partiel'}</span><small>{invalidNetVolume ? 'Volume net à renseigner' : `Pour ${Units.format(netVolume, 'L')} de bière conditionnée`}</small></div><strong>{estimate.costPerL === null || invalidNetVolume ? '—' : chf(estimate.costPerL)} <small>CHF/L</small></strong></div>
        <details className="brew-budget-explanation"><summary>Comprendre ces montants</summary><p className="brew-budget-summary-note">Les achats à payer tiennent compte du stock disponible et des frais déjà prévus dans tes factures récurrentes.</p><p className="brew-budget-summary-note">Le coût de revient comprend les ingrédients consommés, les frais du brassin et les parts de charges fixes et d’amortissement activées ci-dessous.</p></details>
      </div>
      {savedEstimate && <div className="brew-budget-comparison"><ArrowDownRight size={18} /><span>Estimation enregistrée : <b>{chf(savedEstimate.cashRequiredTTC)} CHF</b>{!volumeIssue&&<small>Écart actuel : {estimate.cashRequiredTTC >= savedEstimate.cashRequiredTTC ? '+' : ''}{chf(estimate.cashRequiredTTC - savedEstimate.cashRequiredTTC)} CHF</small>}</span></div>}
      {futureBatch && renderPlanReconciliation?.(estimate)}
      <section className="brew-budget-section">
        <h3>{futureBatch ? 'Ton prochain brassin' : 'Le brassin à reproduire'}</h3>
        <div className="brew-budget-two">
          <Field label="Volume à brasser" hint="L"><NumberInput aria-label="Volume à brasser" className={inputClass} value={volume} emptyValue={undefined} disabled={Boolean(batch)} onValue={changeVolume} /></Field>
          <Field label="Volume net attendu" hint="L de bière conditionnée"><NumberInput aria-label="Volume net attendu" className={inputClass} value={netVolume} emptyValue={undefined} onValue={setNetVolume} /></Field>
        </div>
        {volumeIssue && <div role="alert" className="brew-budget-warning"><p>{volumeIssue}</p>{recipe.volumeL > 0 && Number.isFinite(recipe.volumeL) && <button type="button" className="brew-budget-text-action" onClick={() => changeVolume(recipe.volumeL)}>Reprendre les {Units.format(recipe.volumeL, 'L')} de la recette</button>}</div>}
        {invalidNetVolume && <p role="alert" className="brew-budget-warning">Renseigne un volume net supérieur à zéro pour calculer le coût par litre.</p>}
        {!volumeIssue && volume !== recipe.volumeL && recipe.waterPlan && <p className="brew-budget-hint">Le budget ajuste les volumes d’eau et les doses conservées de la recette. Le plan d’eau du nouveau brassin reste à vérifier avant de brasser.</p>}
        <DateField label="Date du brassin" value={toSwissDate(brewBudgetDateKey(date)??'')} onChange={setDate} shortcuts={[{ label: 'Demain', offsetDays: 1 }, { label: 'Dans 7 jours', offsetDays: 7 }, { label: 'Dans 14 jours', offsetDays: 14 }]} hint="Les brassins prévus avant cette date utilisent le stock en priorité." />
      </section>
      <section className="brew-budget-section">
        <div className="brew-budget-section-heading"><h3>Ingrédients et eau</h3><span>{knownLines}/{estimate.lines.length} prix connus</span></div>
        <p className="brew-budget-hint">Ouvre un ingrédient pour ajuster son prix ou son format d’achat. Les quantités incluent la fermentation et le houblonnage à froid.</p>
        <div className="brew-budget-filters" role="group" aria-label="Filtrer les ingrédients">
          {([{ key: 'all', label: 'Tous', count: estimate.lines.length }, { key: 'buy', label: 'À acheter', count: purchaseLines.length }, { key: 'missing', label: 'À compléter', count: requiredPrices.length }] as const).map(filter => <button type="button" key={filter.key} aria-pressed={lineFilter === filter.key} onClick={() => { setFocusedLineKey(null); setLineFilter(filter.key); }}>{filter.label} <span>{filter.count}</span></button>)}
        </div>
        {visibleLines.length === 0 && <p className="brew-budget-empty">{lineFilter === 'buy' ? 'Aucun achat d’ingrédient supplémentaire avec les réglages actuels.' : 'Tous les ingrédients sont renseignés.'}</p>}
        <div className="brew-budget-lines">{visibleLines.map(line => {
          const item = stockItems.find(s => s.ref === line.stockItemRef);
          const price = prices[line.key] ?? line.price;
          return <details className="brew-budget-line" key={line.key} onFocusCapture={() => setFocusedLineKey(line.key)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocusedLineKey(null); }}>
            <summary><span className="brew-budget-line-icon">{line.issues.length ? <AlertCircle size={17} /> : line.missing ? <Package size={17} /> : <Check size={17} />}</span><span className="brew-budget-line-title"><b>{line.name}</b><small>{Units.format(line.quantity, line.unit)} nécessaires · {line.cashTreatment === 'included-in-recurring' ? 'facturé avec les charges' : line.missing > 0 ? line.purchaseQuantity === 0 ? 'compris dans l’achat groupé' : `${Units.format(line.purchaseQuantity, line.unit)} à acheter` : 'déjà en stock'}</small></span><span className="brew-budget-line-price">{line.purchaseTTC === null ? 'À estimer' : `${chf(line.purchaseTTC)} CHF`}<ChevronRight size={16} /></span></summary>
            <div className="brew-budget-line-body">
              <div className="brew-budget-stock-note"><span>Disponible : <b>{Units.format(line.available, line.unit)}</b></span>{line.reserved > 0 && <span>Réservé avant : <b>{Units.format(line.reserved, line.unit)}</b></span>}</div>
              <Field label="Article de stock"><select aria-label={`Article de stock pour ${line.name}`} className={inputClass} value={line.stockItemRef ?? ''} onChange={e => setBindings(current => ({ ...current, [line.key]: e.target.value }))}><option value="">Aucun article associé</option>{stockItems.map(s => <option key={s.ref} value={s.ref}>{s.name} · {s.ref} · {s.unit}</option>)}</select></Field>
              <label className="brew-budget-recurring"><input type="checkbox" checked={line.cashTreatment === 'included-in-recurring'} onChange={e => setCashTreatments(current => ({ ...current, [line.key]: e.target.checked ? 'included-in-recurring' : 'additional' }))} /><span>Déjà compris dans une facture récurrente<small>Garder le coût de revient, sans ajouter une seconde dépense prévue.</small></span></label>
              <div className="brew-budget-two"><Field label="Prix du format" hint="CHF"><NumberInput aria-label={`Prix de ${line.name}`} className={inputClass} min={0} value={price?.amount} emptyValue={undefined} placeholder={item?.pricePerUnit != null ? `${item.pricePerUnit} à confirmer` : 'À renseigner'} onValue={amount => changePrice(line, { amount })} /></Field><Field label="Pour une quantité de"><NumberInput aria-label={`Quantité du prix de ${line.name}`} className={inputClass} min={0.001} value={price?.quantity ?? 1} onValue={quantity => changePrice(line, { quantity })} /></Field></div>
              <div className="brew-budget-two"><Field label="Unité du prix"><select aria-label={`Unité du prix de ${line.name}`} className={inputClass} value={price?.unit ?? line.unit} onChange={e => changePrice(line, { unit: e.target.value })}>{[...new Set([line.unit, item?.unit, 'kg', 'g', 'L', 'mL', 'sachet', 'pièce'].filter(Boolean))].map(unit => <option key={unit} value={unit}>{unit}</option>)}</select></Field><Field label="Lot minimum d’achat" hint={`en ${price?.unit ?? line.unit} · vide si achat au détail`}><NumberInput aria-label={`Lot minimum de ${line.name}`} className={inputClass} min={0.001} value={price?.packQuantity} emptyValue={undefined} placeholder="Au détail" onValue={packQuantity => changePrice(line, { packQuantity })} /></Field></div>
              {line.missing > 0 && line.purchaseQuantity > line.missing && <p className="brew-budget-hint">Il manque {Units.format(line.missing, line.unit)}. Le format d’achat impose {Units.format(line.purchaseQuantity, line.unit)} : le reste pourra servir à d’autres brassins.</p>}
              <details className="brew-budget-advanced"><summary>TVA et origine du prix <span>{price?.basis ?? 'TTC'} · {price?.source === 'invoice' ? 'Facture' : price?.source === 'quote' ? 'Devis' : 'Estimation'}</span><ChevronRight size={16} /></summary><div>
                <div className="brew-budget-two"><Field label="Montant saisi"><select aria-label={`Base du prix de ${line.name}`} className={inputClass} value={price?.basis ?? 'TTC'} onChange={e => changePrice(line, { basis: e.target.value as 'HT' | 'TTC' })}><option value="TTC">TTC · TVA comprise</option><option value="HT">HT · TVA à ajouter</option></select></Field><Field label="TVA du prix" hint="% · reprendre la facture"><NumberInput aria-label={`TVA de ${line.name}`} className={inputClass} min={0} max={100} value={(price?.tvaRate ?? 0) * 100} onValue={value => changePrice(line, { tvaRate: value / 100 })} /></Field></div>
                <div className="brew-budget-two"><Field label="Origine du prix"><select aria-label={`Origine du prix de ${line.name}`} className={inputClass} value={price?.source ?? 'manual'} onChange={e => changePrice(line, { source: e.target.value as BrewPrice['source'], date: swissToday() })}><option value="manual">Estimation personnelle</option><option value="invoice">Facture fournisseur</option><option value="quote">Devis fournisseur</option></select></Field><Field label="Référence ou fournisseur"><input aria-label={`Référence du prix de ${line.name}`} className={inputClass} value={price?.note ?? ''} onChange={e => changePrice(line, { note: e.target.value })} placeholder="Facultatif" /></Field></div>
                {price && <p className="brew-budget-hint">{price.source === 'invoice' ? 'Facture du' : price.source === 'quote' ? 'Devis du' : 'Estimation du'} {price.date}. Une modification du montant ou du format devient une estimation personnelle.</p>}
              </div></details>
              <p className="brew-budget-hint">Valeur des ingrédients consommés : {line.consumedCost === null ? 'à compléter' : `${chf(line.consumedCost)} CHF`}. Seuls les achats supplémentaires sont ajoutés au planning.</p>
              {line.inventoryPrice && <p className="brew-budget-hint">Stock utilisé : {line.inventoryPrice.note}. Les quantités à acheter utilisent le prix du prochain achat.</p>}
              {line.issues.length > 0 && <p className="brew-budget-warning">{line.issues.join(' · ')}</p>}
            </div>
          </details>;
        })}</div>
      </section>
      <section className="brew-budget-section"><h3>Les autres frais de ce brassin</h3><p className="brew-budget-hint">Renseigne tes montants habituels. Désactive les postes qui ne concernent pas ce brassin.</p>
        {costsNeedVolumeReview && <p className="brew-budget-warning" role="status">Volume modifié : {Units.format(costBasisVolume, 'L')} brassés / {Units.format(costBasisNetVolume, 'L')} nets → {Units.format(volume, 'L')} brassés / {Units.format(netVolume, 'L')} nets. Les frais manuels ci-dessous sont conservés. Vérifie l’énergie, le nettoyage, le conditionnement et l’estimation d’impôt avant d’enregistrer ce nouveau budget.</p>}
        {(Object.keys(BREW_COST_LABELS) as BrewCostKey[]).map(key => <div key={key}>
          <div className="brew-budget-cost-row"><label><input type="checkbox" checked={settings.costs?.[key]?.enabled !== false} onChange={e => setSettings(s => ({ ...s, costs: { ...s.costs, [key]: { ...s.costs?.[key], enabled: e.target.checked } } }))} /><span>{BREW_COST_LABELS[key]}</span></label><div><NumberInput aria-label={`${BREW_COST_LABELS[key]} en CHF`} className={inputClass} value={settings.costs?.[key]?.amountTTC} emptyValue={undefined} min={0} placeholder="À estimer" disabled={settings.costs?.[key]?.enabled === false} onValue={amountTTC => setSettings(s => ({ ...s, costs: { ...s.costs, [key]: { ...s.costs?.[key], enabled: s.costs?.[key]?.enabled !== false, amountTTC } } }))} /><span>CHF</span></div></div>
          {settings.costs?.[key]?.enabled !== false && <label className="brew-budget-recurring"><input type="checkbox" checked={settings.costs?.[key]?.cashTreatment === 'included-in-recurring'} onChange={e => setSettings(s => ({ ...s, costs: { ...s.costs, [key]: { ...s.costs?.[key], enabled: true, cashTreatment: e.target.checked ? 'included-in-recurring' : 'additional' } } }))} /><span>Déjà prévu dans les charges récurrentes</span></label>}
          {key === 'beerTax' && settings.costs?.beerTax?.enabled !== false && <p className="brew-budget-hint">Estimation manuelle de l’impôt : ce montant ne se recalcule pas automatiquement avec le volume.</p>}
          {config.fiscal.isTvaRegistered && key !== 'beerTax' && settings.costs?.[key]?.enabled !== false && <Field label={`TVA · ${BREW_COST_LABELS[key]}`} hint="%"><NumberInput aria-label={`TVA ${BREW_COST_LABELS[key]}`} className={inputClass} min={0} max={100} value={settings.costs?.[key]?.tvaRate != null ? settings.costs[key].tvaRate * 100 : undefined} emptyValue={undefined} placeholder="À confirmer" onValue={rate => setSettings(s => ({ ...s, costs: { ...s.costs, [key]: { ...s.costs?.[key], enabled: true, tvaRate: rate != null ? rate / 100 : undefined } } }))} /></Field>}
        </div>)}
        <p className="brew-budget-hint">Saisis le coût TTC de chaque poste pour ce brassin. Coche « Déjà prévu » si son paiement figure dans tes charges récurrentes. Évite de reprendre les consommables déjà chiffrés dans les ingrédients.</p>
      </section>
      <section className="brew-budget-section"><h3>Le coût de revient</h3><p className="brew-budget-hint">Les charges annuelles se répartissent selon les litres produits. Elles ne s’ajoutent pas aux achats à payer pour ce brassin.</p>
        <div className="brew-budget-cost-result"><span>Valeur des ingrédients <b>{chf(estimate.ingredientsCost)} CHF</b></span><span>Frais du brassin <b>{chf(estimate.operatingCost)} CHF</b></span><span>Charges fixes attribuées <b>{chf(estimate.fixedAllocation)} CHF</b></span><span>Amortissement attribué <b>{chf(estimate.depreciationAllocation)} CHF</b></span><strong>Coût {estimate.complete ? 'estimé' : 'partiel'} <b>{chf(estimate.totalCost)} CHF</b></strong><strong>Par litre net <b>{estimate.costPerL === null ? '—' : `${chf(estimate.costPerL)} CHF/L`}</b></strong></div>
        <details className="brew-budget-advanced"><summary>Répartition des charges annuelles <ChevronRight size={16} /></summary><div>
          <p className="brew-budget-hint">La part du brassin = montant annuel × litres conditionnés ÷ production annuelle. Le prix d’achat du matériel et le capital remboursé sur un emprunt ne se rajoutent pas à son amortissement.</p>
          {settingsWarnings?.map(warning => <p className="brew-budget-warning" key={warning}>{warning}</p>)}
          <Field label="Production annuelle prévue" hint="L de bière conditionnée"><NumberInput aria-label="Production annuelle prévue" className={inputClass} value={settings.annualVolumeL} emptyValue={undefined} min={1} onValue={annualVolumeL => setSettings(s => ({ ...s, annualVolumeL }))} /></Field>
          {([{ key: 'annualFixedCHF', enabled: 'includeFixed', label: 'Charges fixes annuelles' }, { key: 'annualDepreciationCHF', enabled: 'includeDepreciation', label: 'Amortissement annuel' }] as const).map(field => <div key={field.key} className="brew-budget-cost-row"><label><input type="checkbox" aria-label={`Inclure ${field.label.toLocaleLowerCase('fr-CH')}`} checked={settings[field.enabled] !== false} onChange={e => setSettings(s => ({ ...s, [field.enabled]: e.target.checked }))} /><span>{field.label}</span></label><div><NumberInput aria-label={field.label} className={inputClass} value={effectiveSettings[field.key]} emptyValue={undefined} min={0} disabled={settings[field.enabled] === false} placeholder="À estimer" onValue={v => { if (field.key === 'annualDepreciationCHF') setUseRegisterDepreciation(false); setSettings(s => ({ ...s, [field.key]: v })); }} /><span>CHF</span></div></div>)}
          {depreciationForBudgetYear && settings.includeDepreciation !== false && <div className="brew-budget-hint">
            <p>{useRegisterDepreciation ? `Amortissement repris du registre du matériel pour ${budgetYear || 'l’année du brassin'}.` : 'Amortissement conservé dans cette estimation. Tu peux reprendre le montant du registre pour l’année du brassin.'}</p>
            {useRegisterDepreciation ? registerDepreciation?.warnings.map(warning => <p className="brew-budget-warning" key={warning}>{warning}</p>) : <button type="button" className="brew-budget-text-action" onClick={() => setUseRegisterDepreciation(true)}>Reprendre le registre {budgetYear || ''}</button>}
          </div>}
        </div></details>
      </section>
      {(!estimate.complete || invalidNetVolume) && <div className="brew-budget-incomplete" role="status"><AlertCircle size={20} /><div><b>Encore quelques repères à compléter</b><p>{requiredPrices.length > 0 ? `${requiredPrices.length} ingrédient${requiredPrices.length > 1 ? 's' : ''} à compléter. ` : ''}{volumeIssue || invalidNetVolume ? 'Corrige les volumes avant d’enregistrer cette estimation.' : 'L’estimation peut être enregistrée maintenant. Complète-la pour l’ajouter aux dépenses prévues.'}</p>{estimate.issues.length > 0 && <ul>{estimate.issues.map(issue => <li key={issue}>{issue}</li>)}</ul>}</div></div>}
      {error && <p role="alert" className="brew-budget-warning">{error}</p>}
    </div>
  </Sheet>;
}
