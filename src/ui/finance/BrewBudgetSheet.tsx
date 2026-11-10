import { batchDisplayDate } from '../../domain/batchSchedule';
import { Input } from '../Input';
import React, { useMemo, useRef, useState } from 'react';
import { AlertCircle, CalendarPlus, Check, ChevronLeft, ChevronRight, Package, Save, Sparkles } from 'lucide-react';
import type { AppConfig, Batch, Recipe, StockItem } from '../../types';
import { Sheet } from '../Sheet';
import { NumberInput } from '../NumberInput';
import { DateField, swissToday, toSwissDate } from '../DateField';
import { Units } from '../../services/units';
import { scaleBrewBudgetRecipe } from '../../domain/finance/brewBudgetScaling';
import { Field, inputClass } from '../FormNav';
import { brewBudgetDateKey, estimateBrewBudget, netVolumeSaisi, reductionImpotPourAnnee, type BrewBudgetLine, type BrewBudgetSettings, type BrewBudgetSnapshot, type BrewCostKey, type BrewPrice, type BrewCashTreatment } from '../../domain/finance/brewBudget';
import { coutLitre, litresNets, troisNotions } from '../../domain/finance/chaineLitre';
import { BORNES_PROCEDE } from '../../domain/bornesProcede';
import './brew-budget.css';
import { CoutBrassinFlux, fluxDuBrassin, fr, frL, groupeIngredient, type NoeudId, type SourceId } from './CoutBrassinFlux';
import type { FinanceTransaction, FinancialProfile } from '../../domain/finance/types';
import { ImpotBiereSheet } from '../production/ImpotBiereSheet';

const ProfileSheet = React.lazy(() => import('./FinanceForms').then(m => ({ default: m.ProfileSheet })));
const BrewerChat = React.lazy(() => import('../BrewerChat').then(m => ({ default: m.BrewerChat })));
/** Un mot par poste, le même sur le flux et dans la feuille (constat 7) : « Emballage », « Impôt bière ». */
const LABELS_FRAIS: Record<BrewCostKey, string> = { energy: 'Énergie', cleaning: 'Nettoyage', packaging: 'Emballage', beerTax: 'Impôt bière' };
const POSTE_DU_NOEUD: Partial<Record<NoeudId, BrewCostKey>> = { ener: 'energy', net: 'cleaning', emb: 'packaging', imp: 'beerTax' };
const dateCourte = (dateKey?: string) => dateKey ? new Intl.DateTimeFormat('fr-CH', { day: 'numeric', month: 'short' }).format(new Date(`${dateKey}T12:00:00`)) : '';
/** « 22,41 en stock + 22,42 à acheter » : la somme des deux parts est le coût de la ligne, celui du flux. */
const detailCout = (line: BrewBudgetLine) => [(line.stockCost ?? 0) > 0 && `${chf(line.stockCost!)} en stock`, (line.purchaseCost ?? 0) > 0 && `${chf(line.purchaseCost!)} à acheter`].filter(Boolean).join(' + ') || 'rien à payer';
const Aide = ({ children }: { children: React.ReactNode }) => {
  const [ouvert, setOuvert] = useState(false);
  return <div className="cbf-aide" data-ouvert={ouvert ? 'true' : undefined}><button type="button" aria-label="Explication" aria-expanded={ouvert} onClick={() => setOuvert(o => !o)}>?</button>{ouvert && <div className="cbf-aide-texte">{children}</div>}</div>;
};
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
  /** Usure annuelle linéaire du matériel pour la date du brassin (AAAA-MM-JJ) : `undefined` si inconnue, jamais 0. */
  usureForBudgetDate?: (dateKey: string) => { amountCHF?: number; warnings: string[] };
  renderPlanReconciliation?: (snapshot: BrewBudgetSnapshot) => React.ReactNode;
  canPlan?: (snapshot: BrewBudgetSnapshot) => boolean;
  onSave: (snapshot: BrewBudgetSnapshot, addToPlan: boolean) => void | Promise<void>;
  /** Fiche du brassin : « Noter la densité » depuis la feuille Impôt bière y mène. Absent : la feuille n'offre pas ce geste. */
  onNoteDensity?: () => void;
  /** CP-18 : « Litres nets » renvoie à la fiche du brassin › Mesures (volume conditionné). Absent : la saisie se fait dans « Volumes et date ». */
  onMesures?: () => void;
  /** CP-18 : le solde et ses paramètres (production annuelle des charges fixes et de l'usure). Absent : la saisie se fait dans « Charges fixes et usure ». */
  profile?: FinancialProfile;
  /** CP-18 : le registre du matériel (usure) et le tarif (emballage). Absents : aucun renvoi hors de cette feuille. */
  onRegistre?: () => void;
  onTarif?: () => void;
}
interface Manque { cle: string; titre: string; effet: string; agir: () => void }

type Vue = { id: 'flux' } | { id: 'volumes' } | { id: 'ingredients'; groupe: 'malt' | 'q' | 'autres' } | { id: 'frais'; poste?: BrewCostKey } | { id: 'annuel'; poste?: 'fix' | 'mat' };
const GROUPE_TITRE = { malt: 'Malt', q: 'Houblon, levure', autres: 'Autres ingrédients' } as const;
const VUE_TITRE: Record<Vue['id'], string> = { flux: '', volumes: 'Volumes et date', ingredients: 'Ingrédients', frais: 'Frais', annuel: 'Charges fixes et usure' };

/** Unmount the draft on close; live stock updates recalculate without overwriting the user's prices. */
export function BrewBudgetSheet(props: BrewBudgetSheetProps) {
  const [prevu, setPrevu] = useState<{ montant: number; date?: string } | null>(null);
  if (!props.open) return null;
  const recipe = props.batch?.recipeSnapshot ? { ...props.batch.recipeSnapshot, id: props.batch.recipeSnapshot.sourceRecipeId ?? props.batch.recipeRef ?? props.batch.id } as Recipe : props.recipe;
  if (!recipe) return <Sheet open onClose={props.onClose} title="Budget du brassin"><p className="p-4 text-cave-200">Associe une recette à ce brassin pour calculer ses besoins.</p></Sheet>;
  return <BrewBudgetDraft key={`${props.batch?.id ?? recipe.id}:${props.savedEstimate?.id ?? 'new'}`} {...props} recipe={recipe} prevu={prevu} setPrevu={setPrevu} />;
}

function BrewBudgetDraft({ recipe, batch, stockItems, batches, config, savedEstimate, savedEstimates, settings: defaultSettings, settingsWarnings, usureForBudgetDate, renderPlanReconciliation, canPlan, transactions, onClose, onSave, onNoteDensity, onMesures, profile, onRegistre, onTarif, prevu, setPrevu }: BrewBudgetSheetProps & { recipe: Recipe; prevu: { montant: number; date?: string } | null; setPrevu: (p: { montant: number; date?: string }) => void }) {
  const [volume, setVolume] = useState(savedEstimate?.volumeL ?? recipe.volumeL);
  // Un seul net : le conditionné réel, sinon le net saisi et enregistré. Jamais le volume à brasser (30 L au lieu de 27 : 7,21 au lieu de 7,51).
  const initialNet = litresNets({ conditionneL: batch?.volumePackagedL, netEnregistreL: netVolumeSaisi(savedEstimate) })?.litres;
  const [netVolume, setNetVolume] = useState<number | undefined>(initialNet);
  const lastValidVolume = useRef(volume);
  const costBasisVolume = savedEstimate?.volumeL ?? recipe.volumeL;
  const costBasisNetVolume = initialNet;
  const changeVolume = (next: number | undefined) => {
    if (next > 0 && Number.isFinite(next)) {
      if (lastValidVolume.current > 0 && netVolume !== undefined && Number.isFinite(netVolume)) {
        setNetVolume(Math.round(netVolume * next / lastValidVolume.current * 1e6) / 1e6);
      }
      lastValidVolume.current = next;
    }
    setVolume(next);
  };
  const [date, setDate] = useState(savedEstimate?.brewDate ?? (batch ? batchDisplayDate(batch) : undefined) ?? '');
  const [settings, setSettings] = useState<BrewBudgetSettings>(() => structuredClone(savedEstimate?.settings ?? defaultSettings ?? {}));
  const [prices, setPrices] = useState<Record<string, BrewPrice>>(() => structuredClone(savedEstimate?.prices ?? {}));
  const [bindings, setBindings] = useState<Record<string, string>>(() => ({ ...savedEstimate?.bindings }));
  const [cashTreatments, setCashTreatments] = useState<Record<string, BrewCashTreatment>>(() => ({ ...savedEstimate?.cashTreatments }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const saving = useRef(false);
  const [vue, setVue] = useState<Vue>({ id: 'flux' });
  const [selection, setSelection] = useState<SourceId | null>(null);
  const [question, setQuestion] = useState<string>();
  const [regleOuverte, setRegleOuverte] = useState(false);
  const [profil, setProfil] = useState(false);
  const [lineFilter, setLineFilter] = useState<'all' | 'buy' | 'missing'>('all');
  const [focusedLineKey, setFocusedLineKey] = useState<string | null>(null);
  const [useRegisterDepreciation, setUseRegisterDepreciation] = useState(Boolean(usureForBudgetDate) && savedEstimate?.settings.annualDepreciationCHF == null);
  const futureBatch = !batch || batch.status === 'planifie' && !batch.stockConsumption?.appliedAt;
  const dateKey = brewBudgetDateKey(date);
  const budgetYear = Number(dateKey?.slice(0, 4));
  const registerDepreciation = useMemo(() => dateKey ? usureForBudgetDate?.(dateKey) : undefined, [usureForBudgetDate, dateKey]);
  const effectiveSettings = useMemo(() => useRegisterDepreciation ? { ...settings, annualDepreciationCHF: registerDepreciation?.amountCHF } : settings, [settings, useRegisterDepreciation, registerDepreciation]);
  const scaled = useMemo(() => {
    if (volume === recipe.volumeL || !(volume > 0) || !Number.isFinite(volume) || !(recipe.volumeL > 0) || !Number.isFinite(recipe.volumeL)) return recipe;
    const source = recipe.brewhouse ?? config.brewhouses?.find(b => b.id === config.activeBrewhouseId) ?? config.brewhouses?.[0];
    return source ? scaleBrewBudgetRecipe(recipe, volume, source) : recipe;
  }, [recipe, volume, config.brewhouses, config.activeBrewhouseId]);
  const volumeIssue = !(recipe.volumeL > 0) || !Number.isFinite(recipe.volumeL) ? 'Corrige le volume de la recette avant de redimensionner ce brassin.' : !(volume > 0) || !Number.isFinite(volume) ? 'Renseigne un volume à brasser supérieur à zéro.' : volume > BORNES_PROCEDE.volumeBrassinL.max ? `Volume à brasser de ${Units.format(volume, 'L')} : au plus ${Units.format(BORNES_PROCEDE.volumeBrassinL.max, 'L')} (la plus grande cuve d’une micro-brasserie). Erreur de saisie probable.` : Math.abs(scaled.volumeL - volume) > 1e-6 ? 'Configure une cuverie pour adapter les ingrédients à ce volume, ou reprends le volume de la recette.' : '';
  const netInconnu = netVolume === undefined;
  const netInvalide = !netInconnu && (!(netVolume > 0) || !Number.isFinite(netVolume));
  const netConnu = !netInconnu && !netInvalide ? netVolume : undefined;
  const costsNeedVolumeReview = !volumeIssue && netConnu !== undefined && costBasisNetVolume !== undefined && (Math.abs(volume - costBasisVolume) > 1e-6 || Math.abs(netConnu - costBasisNetVolume) > 1e-6) && Object.values(settings.costs ?? {}).some(cost => cost.enabled !== false && cost.amountTTC != null);
  // L'OG mesurée du brassin, sinon l'OG visée de la recette (un estimé : l'impôt est alors pointillé). Sans litres nets, aucun impôt n'est calculé : jamais sur le volume à brasser.
  const ogMesuree = batch?.og && Number(batch.og) > 1 ? batch.og : undefined;
  const ogUtilisee = ogMesuree ?? (recipe.ogTarget != null && recipe.ogTarget > 1 ? recipe.ogTarget : undefined);
  const abv = batch?.abv ?? (recipe.abvTarget != null ? recipe.abvTarget : undefined);
  const reductionPct = reductionImpotPourAnnee(config.fiscal, date);
  const estimate = useMemo(() => {
    const result = estimateBrewBudget({ recipe: scaled, stockItems, batches, brewDate: date, batchId: batch?.id,
      netVolumeL: netConnu, og: netConnu !== undefined ? ogUtilisee : undefined, abv, beerTaxReductionPct: reductionPct,
      bindings, prices, cashTreatments, settings: effectiveSettings, transactions, savedEstimates, isTvaRegistered: config.fiscal.isTvaRegistered });
    const issue = volumeIssue || (netInconnu ? 'Litres nets à confirmer' : netInvalide ? 'Volume net attendu à renseigner' : '');
    return issue ? { ...result, complete: false, costPerL: null, issues: [...new Set([...result.issues, issue])] } : result;
  }, [scaled, stockItems, batches, date, batch?.id, netConnu, ogUtilisee, abv, reductionPct, bindings, prices, cashTreatments, effectiveSettings, transactions, savedEstimates, config.fiscal.isTvaRegistered, volumeIssue, netInconnu, netInvalide]);
  const notions = useMemo(() => troisNotions(estimate), [estimate]);
  const litre = useMemo(() => coutLitre({ notions, litres: netConnu }), [notions, netConnu]);
  const requiredPrices = estimate.lines.filter(l => l.issues.length > 0);
  const estimes = useMemo(() => ({ ener: true, net: true, emb: true, imp: !(estimate.beerTaxSource === 'calcule' && ogMesuree), mat: !useRegisterDepreciation, fix: settings.annualFixedCHF !== defaultSettings?.annualFixedCHF }), [estimate.beerTaxSource, ogMesuree, useRegisterDepreciation, settings.annualFixedCHF, defaultSettings?.annualFixedCHF]);
  const changePrice = (line: BrewBudgetLine, patch: Partial<BrewPrice>) => setPrices(current => {
    const previous = current[line.key] ?? line.price;
    const changesValue = ['amount', 'quantity', 'unit', 'basis', 'tvaRate', 'packQuantity'].some(key => key in patch);
    return { ...current, [line.key]: {
      quantity: 1, unit: line.unit, amount: undefined, basis: 'TTC', tvaRate: 0, source: 'manual', date: swissToday(), ...previous,
      ...(changesValue ? { source: 'manual' as const, date: swissToday(), ...(previous?.source !== 'manual' ? { note: previous?.note ? `Adapté de : ${previous.note}` : '' } : {}) } : {}),
      ...patch
    } };
  });
  const canSaveDraft = !busy && !volumeIssue && !netInvalide && Boolean(dateKey);
  const canPlanNow = !busy && futureBatch && estimate.complete && !(canPlan && !canPlan(estimate));
  /* Test d'écran P5B, constat 4 : « Prévoir » gris sans un mot. La raison est écrite dans le pied, à côté du bouton, jamais seulement en bas du flux (hors de vue). */
  const raisonPrevoir = !futureBatch || busy || canPlanNow ? ''
    : volumeIssue ? volumeIssue
    : netInvalide ? 'Renseigne un volume net supérieur à zéro.'
    : netInconnu ? 'les litres nets du brassin.'
    : !estimate.complete ? (requiredPrices.length ? `${requiredPrices.length} ingrédient${requiredPrices.length > 1 ? 's' : ''} sans prix.` : estimate.issues.slice(0, 1).join(' · ') || 'Le coût du brassin n’est pas complet.')
    : 'Choisis d’abord le lien avec le budget de recette déjà prévu (plus haut).';
  const aLitres = () => { if (batch && !futureBatch && onMesures) { onClose(); onMesures(); } else setVue({ id: 'volumes' }); };
  const aDensite = () => { if (batch && onNoteDensity) { onClose(); onNoteDensity(); } else ouvrir('imp'); };
  const manques: Manque[] = (() => {
    const m: Manque[] = [];
    if (netInconnu || netInvalide) m.push({ cle: 'litres', titre: 'Litres nets du brassin', effet: 'Sans eux, pas de coût du litre ni d’impôt bière.', agir: aLitres });
    const { destinations } = fluxDuBrassin(estimate, estimes);
    const sansAnnuel = !(settings.annualVolumeL != null && settings.annualVolumeL > 0);
    for (const d of destinations) {
      if (d.montant !== null || d.horsRecette) continue;
      if (d.id === 'malt' || d.id === 'q' || d.id === 'autres') {
        const n = estimate.lines.filter(l => groupeIngredient(l, estimate.recipeSnapshot) === d.id && l.consumedCost === null).length;
        m.push({ cle: d.id, titre: `Prix de ${n} ingrédient${n > 1 ? 's' : ''} : ${GROUPE_TITRE[d.id].toLocaleLowerCase('fr-CH')}`, effet: `Sans ${n > 1 ? 'eux' : 'lui'}, le coût du brassin reste un minimum.`, agir: () => { ouvrir(d.id); setLineFilter('missing'); } });
      } else if (d.id === 'imp') {
        if (netInconnu || netInvalide) continue;
        m.push(ogUtilisee === undefined ? { cle: 'imp', titre: `Densité de « ${recipe.name} »`, effet: 'Sans elle, l’impôt bière reste inconnu.', agir: aDensite } : { cle: 'imp', titre: 'Impôt bière du brassin', effet: 'Sans lui, le coût du brassin reste un minimum.', agir: () => ouvrir('imp') });
      } else if (d.id === 'fix' || d.id === 'mat') {
        if (sansAnnuel) { if (!m.some(x => x.cle === 'annuel')) m.push({ cle: 'annuel', titre: 'Production annuelle prévue', effet: 'Sans elle, ni charges fixes ni usure ne se répartissent sur le litre.', agir: () => profile ? setProfil(true) : ouvrir(d.id) }); }
        else m.push({ cle: d.id, titre: d.id === 'fix' ? 'Charges fixes annuelles' : 'Usure annuelle du matériel', effet: 'Sans elles, la part de l’année est un minimum.', agir: () => ouvrir(d.id) });
      } else m.push({ cle: d.id, titre: `${d.label} du brassin`, effet: 'Sans ce montant, le coût du brassin reste un minimum.', agir: () => ouvrir(d.id) });
    }
    return m;
  })();
  const raisonAgir = netInconnu ? manques.find(x => x.cle === 'litres')?.agir : !estimate.complete && requiredPrices.length ? manques.find(x => ['malt', 'q', 'autres'].includes(x.cle))?.agir : undefined;
  const save = async (plan: boolean) => {
    if (saving.current || volumeIssue || netInvalide || !dateKey || plan && (!futureBatch || !estimate.complete || canPlan && !canPlan(estimate))) return;
    saving.current = true;
    setBusy(true); setError('');
    try { await onSave(estimate, plan); if (plan) setPrevu({ montant: estimate.cashRequiredTTC, date: dateKey }); else onClose(); }
    catch (e) { setError(e instanceof Error ? e.message : 'L’enregistrement a échoué. Ton estimation reste ici.'); }
    finally { saving.current = false; setBusy(false); }
  };
  const ouvrir = (id: NoeudId) => {
    setLineFilter('all'); setFocusedLineKey(null);
    setVue(id === 'malt' || id === 'q' || id === 'autres' ? { id: 'ingredients', groupe: id } : id === 'mat' || id === 'fix' ? { id: 'annuel', poste: id } : { id: 'frais', poste: POSTE_DU_NOEUD[id] });
  };
  const expliquer = () => {
    const total = notions?.total ?? estimate.totalCost;
    setQuestion(`Explique-moi le coût de mon brassin « ${recipe.name} » : ${fr(total)} CHF${netConnu ? ` pour ${frL(netConnu)} L nets` : ''}${litre ? `, soit ${fr(litre.affiche.complet)} CHF le litre` : ''}. `
      + `Distingue ce qui est déjà payé (stock : ${fr(estimate.dejaPaye ?? 0)}), ce que je dois encore payer (${fr(estimate.aPayer ?? 0)}) et la part de l’année (charges fixes et usure : ${fr(estimate.annee ?? 0)}). Dis ce qui est estimé et ce qui manque.`);
  };

  const sousTitre = futureBatch ? 'Coût du brassin' : 'Pour reproduire ce brassin';
  const posteActif = vue.id === 'frais' || vue.id === 'annuel' ? vue.poste : undefined;
  React.useEffect(() => { if (posteActif) document.querySelector<HTMLElement>('[data-poste-actif="true"]')?.scrollIntoView?.({ block: 'nearest' }); }, [vue.id, posteActif]);
  const ingredientsVides = vue.id === 'ingredients' && estimate.lines.every(l => groupeIngredient(l, estimate.recipeSnapshot) !== vue.groupe);
  const lignesDuGroupe = vue.id === 'ingredients' ? estimate.lines.filter(l => groupeIngredient(l, estimate.recipeSnapshot) === vue.groupe) : [];
  const knownLines = lignesDuGroupe.filter(l => l.consumedCost !== null).length;
  const manquantsGroupe = lignesDuGroupe.filter(l => l.issues.length > 0);
  const aAcheterGroupe = lignesDuGroupe.filter(line => line.purchaseQuantity > 0 && line.cashTreatment !== 'included-in-recurring');
  // Completing the last missing price must not remove the input mid-keystroke.
  const visibleLines = lignesDuGroupe.filter(line => lineFilter === 'all' || line.key === focusedLineKey || (lineFilter === 'missing' ? line.issues.length > 0 : line.purchaseQuantity > 0 && line.cashTreatment !== 'included-in-recurring'));

  const pied = prevu
    ? <>
      <div className="cbf-fait" role="status" data-booster="prevu"><Check size={16} aria-hidden="true" /><b>Ajouté aux prévisions</b><span>· {fr(prevu.montant)} CHF à payer{prevu.date ? ` · brassage le ${dateCourte(prevu.date)}` : ''}</span></div>
      <div className="cbf-act"><button type="button" className="cbf-pri" onClick={onClose}>Fermer</button></div>
    </>
    : vue.id === 'flux'
    ? <>
      {raisonPrevoir && (raisonAgir
        ? <button type="button" className="cbf-statut cbf-raison cbf-lien-ligne" aria-label={`Compléter : ${raisonPrevoir}`} aria-live="polite" data-booster="prevoir-raison" style={{ maxWidth: 390, margin: '0 auto 6px', width: '100%' }} onClick={raisonAgir}>Prévoir attend : {raisonPrevoir} ›</button>
        : <p className="cbf-statut cbf-raison" aria-live="polite" data-booster="prevoir-raison" style={{ maxWidth: 390, margin: '0 auto 6px', width: '100%' }}>Prévoir attend : {raisonPrevoir}</p>)}
      <div className="cbf-act">
      <button type="button" className="cbf-ia" data-booster="ia-expliquer" onClick={expliquer}><Sparkles size={17} aria-hidden="true" />Expliquer</button>
      {futureBatch && !estimate.complete && <button type="button" className="cbf-sec" disabled={!canSaveDraft} onClick={() => void save(false)}><Save size={17} aria-hidden="true" />Enregistrer</button>}
      {futureBatch
        ? <button type="button" className="cbf-pri" data-booster="prevoir" disabled={!canPlanNow} onClick={() => void save(true)}><CalendarPlus size={17} aria-hidden="true" />{busy ? 'Enregistrement…' : <>Prévoir <span className="cbf-m">{fr(estimate.cashRequiredTTC)} CHF</span></>}</button>
        : <button type="button" className="cbf-pri" disabled={!canSaveDraft} onClick={() => void save(false)}><Save size={17} aria-hidden="true" />Enregistrer</button>}
    </div></>
    : <div className="cbf-act">
      {ingredientsVides
        // Rien à saisir (aucun houblon ni levure dans la recette) : pas d'« Enregistrer » qui n'enregistrerait rien (constat 11).
        ? <button type="button" className="cbf-pri" onClick={() => { setVue({ id: 'flux' }); }}><ChevronLeft size={17} aria-hidden="true" />Retour au flux</button>
        : <>
          <button type="button" className="cbf-sec" onClick={() => { setVue({ id: 'flux' }); }}><ChevronLeft size={17} aria-hidden="true" />Retour</button>
          <button type="button" className="cbf-pri" disabled={!canSaveDraft} onClick={() => void save(false)}><Save size={17} aria-hidden="true" />Enregistrer</button>
        </>}
    </div>;

  return <><Sheet open onClose={() => { if (!saving.current) onClose(); }} title={recipe.name} subtitle={vue.id === 'flux' ? sousTitre : `${sousTitre} · ${vue.id === 'ingredients' ? GROUPE_TITRE[vue.groupe] : VUE_TITRE[vue.id]}`} dismissible={!busy} footer={pied} className="md:max-w-xl md:mx-auto">
    {vue.id === 'flux' && <div className="brew-budget">
      <CoutBrassinFlux snapshot={estimate} notions={notions} litre={litre} litres={netConnu ?? null} motifSansLitre={netInconnu || netInvalide ? 'litres' : 'prix'} estimes={estimes}
        selection={selection} onSelect={setSelection} onNoeud={ouvrir} onVolumes={aLitres} assujetti={config.fiscal.isTvaRegistered}>
        <div className="cbf-extra">
          {!futureBatch && <p className="brew-budget-hint">Ce brassin a déjà été produit. Cette simulation utilise le stock et les prix actuels pour le reproduire ; elle ne modifie pas son coût historique.</p>}
          {futureBatch && renderPlanReconciliation?.(estimate)}
          {manques.length > 0 && <section className="cbf-taches" aria-label="Données à compléter">
            <p className="cbf-taches-t" role="status">{requiredPrices.length ? `${requiredPrices.length} ingrédient${requiredPrices.length > 1 ? 's' : ''} sans prix. ` : ''}Pour compléter ce coût :</p>
            <ul>{manques.map(m => <li key={m.cle}><button type="button" className="cbf-tache" data-manque={m.cle} onClick={m.agir}><span><b>{m.titre}</b><small>{m.effet}</small></span><i aria-hidden="true">›</i></button></li>)}</ul>
          </section>}
          {manques.length === 0 && !estimate.complete && <p className="cbf-statut" role="status">{estimate.issues.slice(0, 2).join(' · ') || 'Le coût du brassin n’est pas complet.'}</p>}
          {error && <p role="alert" className="brew-budget-warning">{error}</p>}
        </div>
      </CoutBrassinFlux>
      {question !== undefined && <React.Suspense fallback={null}><BrewerChat scope={{ kind: 'app', id: 'finances' }} label="Mes finances" phase="Coût d’un brassin" initialOpen hideLauncher initialQuestion={question} onClose={() => setQuestion(undefined)} /></React.Suspense>}
    </div>}
    {vue.id !== 'flux' && <div className="brew-budget cbf-noeud">
      <button type="button" className="cbf-retour" onClick={() => setVue({ id: 'flux' })}><ChevronLeft size={16} aria-hidden="true" />Retour au flux</button>
      {vue.id === 'volumes' && <section className="brew-budget-section">
        <h3>{futureBatch ? 'Ton prochain brassin' : 'Le brassin à reproduire'}</h3>
        <div className="brew-budget-two">
          <Field label="Volume à brasser" hint="L"><NumberInput aria-label="Volume à brasser" className={inputClass} value={volume} emptyValue={undefined} disabled={Boolean(batch)} onValue={changeVolume} /></Field>
          <Field label="Volume net attendu" hint="L de bière conditionnée"><NumberInput aria-label="Volume net attendu" className={inputClass} value={netVolume} emptyValue={undefined} placeholder="À renseigner" onValue={setNetVolume} /></Field>
        </div>
        {batch?.volumePackagedL && initialNet === batch.volumePackagedL && <p className="brew-budget-hint">Net pris sur le conditionnement réel du brassin.</p>}
        {volumeIssue && <div role="alert" className="brew-budget-warning"><p>{volumeIssue}</p>{recipe.volumeL > 0 && Number.isFinite(recipe.volumeL) && <button type="button" className="brew-budget-text-action" onClick={() => changeVolume(recipe.volumeL)}>Reprendre les {Units.format(recipe.volumeL, 'L')} de la recette</button>}</div>}
        {netInvalide && <p role="alert" className="brew-budget-warning">Renseigne un volume net supérieur à zéro pour calculer le coût par litre.</p>}
        {savedEstimate && <p className="brew-budget-hint">Estimation enregistrée : <b>{chf(savedEstimate.cashRequiredTTC)} CHF</b>{!volumeIssue && Math.abs(estimate.cashRequiredTTC - savedEstimate.cashRequiredTTC) >= 0.005 ? ` · aujourd’hui ${chf(estimate.cashRequiredTTC)} CHF (${estimate.cashRequiredTTC > savedEstimate.cashRequiredTTC ? '+' : '−'}${chf(Math.abs(estimate.cashRequiredTTC - savedEstimate.cashRequiredTTC))})` : ' · inchangée'}</p>}
        {netInconnu && <p className="brew-budget-hint">Sans litres nets, le coût du litre reste « — » : il n’est jamais calculé sur le volume à brasser.</p>}
        {netInconnu && batch && !futureBatch && onMesures && <button type="button" className="cbf-lien-ligne" onClick={aLitres}>Saisir le volume conditionné dans la fiche du brassin ›</button>}
        {!volumeIssue && volume !== recipe.volumeL && recipe.waterPlan && <p className="brew-budget-hint">Le budget ajuste les volumes d’eau et les doses conservées de la recette. Le plan d’eau du nouveau brassin reste à vérifier avant de brasser.</p>}
        <DateField label="Date du scénario budgétaire" value={toSwissDate(dateKey ?? '')} onChange={setDate} shortcuts={[{ label: 'Aujourd’hui', offsetDays: 0 }, { label: 'Demain', offsetDays: 1 }, { label: 'Dans 7 jours', offsetDays: 7 }]} hint="Les brassins prévus avant ce jour utilisent le stock en priorité. Ce scénario ne change pas le planning du brassin." />
        {!dateKey && <p className="brew-budget-hint">Choisis un jour pour enregistrer cette estimation.</p>}
      </section>}
      {vue.id === 'ingredients' && <section className="brew-budget-section">
        <div className="brew-budget-section-heading"><h3>{GROUPE_TITRE[vue.groupe]}</h3><span>{knownLines}/{lignesDuGroupe.length} prix connus</span></div>
        {!lignesDuGroupe.length && <p className="brew-budget-hint">{vue.groupe === 'q' ? 'Aucun houblon ni levure dans la recette : le litre ne les compte pas. Ajoute-les à la recette pour les chiffrer.' : 'Aucun ingrédient de ce genre dans la recette.'}</p>}
        {lignesDuGroupe.length > 0 && <>
          {vue.groupe === 'q' && <p className="brew-budget-hint">Les quantités comptent le houblonnage à froid.</p>}
          <div className="brew-budget-filters" role="group" aria-label="Filtrer les ingrédients">
            {([{ key: 'all', label: 'Tous', count: lignesDuGroupe.length }, { key: 'buy', label: 'À acheter', count: aAcheterGroupe.length }, { key: 'missing', label: 'À compléter', count: manquantsGroupe.length }] as const).map(filter => <button type="button" key={filter.key} aria-pressed={lineFilter === filter.key} onClick={() => { setFocusedLineKey(null); setLineFilter(filter.key); }}>{filter.label} <span>{filter.count}</span></button>)}
          </div>
          {visibleLines.length === 0 && <p className="brew-budget-empty">{lineFilter === 'buy' ? 'Aucun achat d’ingrédient supplémentaire avec les réglages actuels.' : 'Tous les ingrédients sont renseignés.'}</p>}
        </>}
        <div className="brew-budget-lines">{visibleLines.map(line => {
          const item = stockItems.find(s => s.ref === line.stockItemRef);
          const price = prices[line.key] ?? line.price;
          return <details className="brew-budget-line" key={line.key} onFocusCapture={() => setFocusedLineKey(line.key)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocusedLineKey(null); }}>
            <summary><span className="brew-budget-line-icon">{line.issues.length ? <AlertCircle size={17} /> : line.missing ? <Package size={17} /> : <Check size={17} />}</span><span className="brew-budget-line-title"><b>{line.name}</b><small>{Units.format(line.quantity, line.unit)}{line.cashTreatment === 'included-in-recurring' ? ' · facturé avec les charges' : line.consumedCost === null ? (line.missing > 0 ? ` · ${Units.format(line.purchaseQuantity, line.unit)} à acheter` : ' · en stock') : <span className="cbf-ingr-calcul"> · {detailCout(line)}</span>}</small></span><span className="brew-budget-line-price">{line.consumedCost === null ? 'À estimer' : `${chf(line.consumedCost)} CHF`}<ChevronRight size={16} /></span></summary>
            <div className="brew-budget-line-body">
              <div className="brew-budget-stock-note"><span>Disponible : <b>{Units.format(line.available, line.unit)}</b></span>{line.reserved > 0 && <span>Réservé avant : <b>{Units.format(line.reserved, line.unit)}</b></span>}</div>
              <Field label="Article de stock"><select aria-label={`Article de stock pour ${line.name}`} className={inputClass} value={line.stockItemRef ?? ''} onChange={e => setBindings(current => ({ ...current, [line.key]: e.target.value }))}><option value="">Aucun article associé</option>{stockItems.map(s => <option key={s.ref} value={s.ref}>{s.name} · {s.ref} · {s.unit}</option>)}</select></Field>
              <label className="brew-budget-recurring"><input type="checkbox" checked={line.cashTreatment === 'included-in-recurring'} onChange={e => setCashTreatments(current => ({ ...current, [line.key]: e.target.checked ? 'included-in-recurring' : 'additional' }))} /><span>Déjà compris dans une facture récurrente<small>Garder le coût de revient, sans ajouter une seconde dépense prévue.</small></span></label>
              <div className="brew-budget-two"><Field label="Prix du format" hint="CHF"><NumberInput aria-label={`Prix de ${line.name}`} className={inputClass} min={0} value={price?.amount} emptyValue={undefined} placeholder={item?.pricePerUnit != null ? `${item.pricePerUnit} à confirmer` : 'À renseigner'} onValue={amount => changePrice(line, { amount })} /></Field><Field label="Pour une quantité de"><NumberInput aria-label={`Quantité du prix de ${line.name}`} className={inputClass} min={0.001} value={price?.quantity ?? 1} onValue={quantity => changePrice(line, { quantity })} /></Field></div>
              <div className="brew-budget-two"><Field label="Unité du prix"><select aria-label={`Unité du prix de ${line.name}`} className={inputClass} value={price?.unit ?? line.unit} onChange={e => changePrice(line, { unit: e.target.value })}>{[...new Set([line.unit, item?.unit, 'kg', 'g', 'L', 'mL', 'sachet', 'pièce'].filter(Boolean))].map(unit => <option key={unit} value={unit}>{unit}</option>)}</select></Field><Field label="Lot minimum d’achat" hint={`en ${price?.unit ?? line.unit} · vide si achat au détail`}><NumberInput aria-label={`Lot minimum de ${line.name}`} className={inputClass} min={0.001} value={price?.packQuantity} emptyValue={undefined} placeholder="Au détail" onValue={packQuantity => changePrice(line, { packQuantity })} /></Field></div>
              {line.missing > 0 && line.purchaseQuantity > line.missing && <p className="brew-budget-hint">Il manque {Units.format(line.missing, line.unit)}. Le format d’achat impose {Units.format(line.purchaseQuantity, line.unit)} : le reste pourra servir à d’autres brassins.</p>}
              <details className="brew-budget-advanced"><summary>TVA et origine du prix <span>{price?.basis ?? 'TTC'} · {price?.source === 'invoice' ? 'Facture' : price?.source === 'quote' ? 'Devis' : 'Estimation'}</span><ChevronRight size={16} /></summary><div>
                <div className="brew-budget-two"><Field label="Montant saisi"><select aria-label={`Base du prix de ${line.name}`} className={inputClass} value={price?.basis ?? 'TTC'} onChange={e => changePrice(line, { basis: e.target.value as 'HT' | 'TTC' })}><option value="TTC">TTC · TVA comprise</option><option value="HT">HT · TVA à ajouter</option></select></Field><Field label="TVA du prix" hint="% · reprendre la facture"><NumberInput aria-label={`TVA de ${line.name}`} className={inputClass} min={0} max={100} value={(price?.tvaRate ?? 0) * 100} onValue={value => changePrice(line, { tvaRate: value / 100 })} /></Field></div>
                <div className="brew-budget-two"><Field label="Origine du prix"><select aria-label={`Origine du prix de ${line.name}`} className={inputClass} value={price?.source ?? 'manual'} onChange={e => changePrice(line, { source: e.target.value as BrewPrice['source'], date: swissToday() })}><option value="manual">Estimation personnelle</option><option value="invoice">Facture fournisseur</option><option value="quote">Devis fournisseur</option></select></Field><Field label="Référence ou fournisseur"><Input aria-label={`Référence du prix de ${line.name}`} className={inputClass} value={price?.note ?? ''} onChange={e => changePrice(line, { note: e.target.value })} placeholder="Facultatif" /></Field></div>
                {price && <p className="brew-budget-hint">{price.source === 'invoice' ? 'Facture du' : price.source === 'quote' ? 'Devis du' : 'Estimation du'} {price.date}. Une modification du montant ou du format devient une estimation personnelle.</p>}
              </div></details>
              <p className="brew-budget-hint">Valeur des ingrédients consommés : {line.consumedCost === null ? <button type="button" className="cbf-lien-champ" onClick={() => [...document.querySelectorAll<HTMLInputElement>('input')].find(i => i.getAttribute('aria-label') === `Prix de ${line.name}`)?.focus()}>à compléter : le prix ci-dessus</button> : `${chf(line.consumedCost)} CHF`}. Seuls les achats supplémentaires sont ajoutés au planning.</p>
              {line.inventoryPrice && <p className="brew-budget-hint">Stock utilisé : {line.inventoryPrice.note}. Les quantités à acheter utilisent le prix du prochain achat.</p>}
              {line.issues.length > 0 && <p className="brew-budget-warning">{line.issues.join(' · ')}</p>}
            </div>
          </details>;
        })}</div>
      </section>}
      {vue.id === 'frais' && <section className="brew-budget-section">
        <div className="cbf-tete"><h3>Frais du brassin</h3><Aide><p>Saisis le coût TTC de chaque poste pour ce brassin. Coche « Déjà prévu » si son paiement figure dans tes charges récurrentes. Évite de reprendre les consommables déjà chiffrés dans les ingrédients.</p></Aide></div>
        {costsNeedVolumeReview && <p className="brew-budget-warning" role="status">Volume modifié ({Units.format(costBasisVolume, 'L')} brassés / {Units.format(costBasisNetVolume!, 'L')} nets → {Units.format(volume, 'L')} / {Units.format(netConnu!, 'L')}) : vérifie l’énergie, le nettoyage, l’emballage et l’impôt.</p>}
        {(Object.keys(LABELS_FRAIS) as BrewCostKey[]).map(key => <div key={key} data-poste-actif={vue.poste === key ? 'true' : undefined}>
          {key === 'beerTax' && estimate.beerTaxSource === 'calcule' && settings.costs?.beerTax?.enabled !== false
            ? <div className="brew-budget-cost-row"><label><input type="checkbox" checked onChange={e => setSettings(s => ({ ...s, costs: { ...s.costs, beerTax: { ...s.costs?.beerTax, enabled: e.target.checked } } }))} /><span>{LABELS_FRAIS[key]}</span></label><div><strong aria-label="Impôt bière calculé">{chf(estimate.beerTaxCost ?? 0)}</strong><span>CHF · calculé</span></div></div>
            : <div className="brew-budget-cost-row"><label><input type="checkbox" checked={settings.costs?.[key]?.enabled !== false} onChange={e => setSettings(s => ({ ...s, costs: { ...s.costs, [key]: { ...s.costs?.[key], enabled: e.target.checked } } }))} /><span>{LABELS_FRAIS[key]}</span></label><div><NumberInput aria-label={`${LABELS_FRAIS[key]} en CHF`} className={inputClass} value={settings.costs?.[key]?.amountTTC} emptyValue={undefined} min={0} placeholder="À estimer" disabled={settings.costs?.[key]?.enabled === false} onValue={amountTTC => setSettings(s => ({ ...s, costs: { ...s.costs, [key]: { ...s.costs?.[key], enabled: s.costs?.[key]?.enabled !== false, amountTTC } } }))} /><span>CHF</span></div></div>}
          {settings.costs?.[key]?.enabled !== false && !(key === 'beerTax' && estimate.beerTaxSource === 'calcule') && <label className="brew-budget-recurring"><input type="checkbox" checked={settings.costs?.[key]?.cashTreatment === 'included-in-recurring'} onChange={e => setSettings(s => ({ ...s, costs: { ...s.costs, [key]: { ...s.costs?.[key], enabled: true, cashTreatment: e.target.checked ? 'included-in-recurring' : 'additional' } } }))} /><span>Déjà prévu dans les charges récurrentes</span></label>}
          {key === 'beerTax' && settings.costs?.beerTax?.enabled !== false && (estimate.beerTaxSource === 'calcule'
            ? <p className="brew-budget-hint">{netConnu !== undefined ? Units.format(netConnu, 'L') : '—'} nets · densité {ogMesuree ? 'mesurée' : 'visée (estimé)'} {ogUtilisee === undefined ? '' : Number(ogUtilisee).toFixed(3).replace('.', ',')} · {estimate.beerTaxExonere ? 'exonérée (sans alcool) · ' : ''}{reductionPct ? `réduction ${reductionPct} %` : 'taux plein'}</p>
            : <p className="brew-budget-hint">{netConnu === undefined ? <button type="button" className="cbf-lien-champ" onClick={aLitres}>Litres nets à confirmer : impôt non calculé ›</button> : ogUtilisee === undefined ? <button type="button" className="cbf-lien-champ" onClick={aDensite}>Densité à noter : impôt non calculé ›</button> : null}{' '}Montant saisi à la main, il ne suit pas le volume.</p>)}
          {key === 'packaging' && onTarif && settings.costs?.packaging?.enabled !== false && <button type="button" className="cbf-lien-ligne" onClick={onTarif}>Tarif d’emballage des formats ›</button>}
          {key === 'beerTax' && settings.costs?.beerTax?.enabled !== false && batch && <button type="button" className="cbf-lien" onClick={() => setRegleOuverte(true)}>Règle des degrés ›</button>}
          {config.fiscal.isTvaRegistered && key !== 'beerTax' && settings.costs?.[key]?.enabled !== false && <Field label={`TVA · ${LABELS_FRAIS[key]}`} hint="%"><NumberInput aria-label={`TVA ${LABELS_FRAIS[key]}`} className={inputClass} min={0} max={100} value={settings.costs?.[key]?.tvaRate != null ? settings.costs[key].tvaRate * 100 : undefined} emptyValue={undefined} placeholder="À confirmer" onValue={rate => setSettings(s => ({ ...s, costs: { ...s.costs, [key]: { ...s.costs?.[key], enabled: true, tvaRate: rate != null ? rate / 100 : undefined } } }))} /></Field>}
        </div>)}
        {regleOuverte && batch && <ImpotBiereSheet batch={batch} onClose={() => setRegleOuverte(false)} onNoteDensity={onNoteDensity ? () => { setRegleOuverte(false); onClose(); onNoteDensity(); } : undefined} onNoteLitres={onMesures ? () => { setRegleOuverte(false); onClose(); onMesures(); } : undefined} />}
      </section>}
      {vue.id === 'annuel' && <section className="brew-budget-section">
        <div className="cbf-tete"><h3>Charges fixes et usure</h3><Aide><p>La part du brassin = montant annuel × litres conditionnés ÷ production annuelle ; elle ne s’ajoute pas aux achats à payer.</p><p>L’usure est linéaire sur la durée du matériel (jamais l’amortissement fiscal dégressif) ; le prix d’achat et le capital d’un emprunt ne s’y ajoutent pas.</p></Aide></div>
        {settingsWarnings?.map(warning => /à renseigner|à compléter|à confirmer/.test(warning) && onRegistre ? <button type="button" className="cbf-lien-ligne brew-budget-warning" key={warning} onClick={onRegistre}>{warning}<i aria-hidden="true"> ›</i></button> : <p className="brew-budget-warning" key={warning}>{warning}</p>)}
        {settings.annualVolumeL == null && profile && <button type="button" className="cbf-lien-ligne" onClick={() => setProfil(true)}>Production annuelle : la noter dans les paramètres du solde ›</button>}
        <Field label="Production annuelle prévue" hint="L de bière conditionnée"><NumberInput aria-label="Production annuelle prévue" className={inputClass} value={settings.annualVolumeL} emptyValue={undefined} min={1} onValue={annualVolumeL => setSettings(s => ({ ...s, annualVolumeL }))} /></Field>
        {([{ key: 'annualFixedCHF', enabled: 'includeFixed', label: 'Charges fixes annuelles', poste: 'fix' }, { key: 'annualDepreciationCHF', enabled: 'includeDepreciation', label: 'Usure annuelle du matériel', poste: 'mat' }] as const).map(field => <div key={field.key} className="brew-budget-cost-row" data-poste-actif={vue.poste === field.poste ? 'true' : undefined}><label><input type="checkbox" aria-label={`Inclure ${field.label.toLocaleLowerCase('fr-CH')}`} checked={settings[field.enabled] !== false} onChange={e => setSettings(s => ({ ...s, [field.enabled]: e.target.checked }))} /><span>{field.label}</span></label><div><NumberInput aria-label={field.label} className={inputClass} value={effectiveSettings[field.key]} emptyValue={undefined} min={0} disabled={settings[field.enabled] === false} placeholder="À estimer" onValue={v => { if (field.key === 'annualDepreciationCHF') setUseRegisterDepreciation(false); setSettings(s => ({ ...s, [field.key]: v })); }} /><span>CHF</span></div></div>)}
        {usureForBudgetDate && settings.includeDepreciation !== false && <div className="brew-budget-hint">
          <p>{useRegisterDepreciation ? `Usure reprise du registre du matériel pour ${budgetYear || 'l’année du brassin'}.` : 'Usure conservée dans cette estimation. Tu peux reprendre le montant du registre pour l’année du brassin.'}</p>
          {useRegisterDepreciation ? registerDepreciation?.warnings.map(warning => /à renseigner|à compléter|à confirmer/.test(warning) && onRegistre ? <button type="button" className="cbf-lien-ligne brew-budget-warning" key={warning} onClick={onRegistre}>{warning}<i aria-hidden="true"> ›</i></button> : <p className="brew-budget-warning" key={warning}>{warning}</p>) : <button type="button" className="brew-budget-text-action" onClick={() => setUseRegisterDepreciation(true)}>Reprendre le registre {budgetYear || ''}</button>}
        </div>}
      </section>}
    </div>}
  </Sheet>
  {profil && profile && <React.Suspense fallback={null}><ProfileSheet profile={profile} parametres onClose={() => setProfil(false)} /></React.Suspense>}
  </>;
}
