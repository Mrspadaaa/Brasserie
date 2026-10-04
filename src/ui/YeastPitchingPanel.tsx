import { useId, useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, Undo2 } from 'lucide-react';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import type { StockItem, YeastSpec } from '../types';
import {
  readYeastProductDocument, readYeastSupply, type YeastLotDetails, type YeastOffer, type YeastPitchingPlan, type YeastPitchingWort, type YeastPreparationPlan,
  type YeastProduct, type YeastProductDocument, type YeastQuantityRange, type YeastStarterProtocol, type YeastSupply, type YeastSupplySource,
} from '../../functions/src/yeastSupplySchema';
import {
  applyYeastPitchingAdvice, createYeastPreparation, estimatePitchingWort, evaluateYeastPitching, mergeYeastSupply, pitchingAdditionId,
  pitchingRecipeBasis, rankYeastOffers, selectYeastProduct, yeastOfferState, yeastPreparationState, type YeastPitchingAdvice,
} from '../domain/yeastPitching';
import bootstrapSupply from '../data/yeastSupplyBootstrap.json';
import { useStorageValue } from '../hooks/useLiveData';
import { StorageService } from '../services/storage';
import { NumberInput } from './NumberInput';
import { Input, Textarea } from './Input';
import { SegmentedControl } from './SegmentedControl';
import { YeastDbCorrectionsPanel } from './YeastDbCorrectionsPanel';
import { YeastOfferEntry, YeastProductEntry } from './YeastSupplyEntry';
import { YeastStarterEntry } from './YeastStarterEntry';
import './yeast-recipe.css';
import './yeast-pitching.css';

type Change = (next: TrialRecipe) => TrialRecipe | void;
type WortBasis = YeastPitchingWort['basis'];
type Timing = Record<string, 'before' | 'after'>;
type Tone = 'ok' | 'low' | 'high' | 'unknown' | 'missing' | 'invalid';
/** Scopes of the shared DB correction panel. A bootstrap product travels as an explicit fallback document. */
type CorrectionTarget = null
  | { scope: 'product'; id: string; fallback?: YeastProductDocument }
  | { scope: 'offer'; id: string; offerId: string; fallback?: YeastProductDocument }
  | { scope: 'stock'; ref: string };

const BOOTSTRAP: YeastSupply = readYeastSupply(bootstrapSupply) ?? { version: 1, products: [], offers: [] };
const NO_DOCUMENTS: YeastProductDocument[] = [];
const NO_STOCK: StockItem[] = [];
const PACK_UNITS = /^(sachets?|packs?|flacons?)$/i;
const fr = (value: number, digits = 1) => value.toLocaleString('fr-FR', { maximumFractionDigits: digits });
const sgText = (sg: number) => sg.toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const rangeText = (range: YeastQuantityRange, digits = 1) => range.min === range.max ? fr(range.min, digits) : `${fr(range.min, digits)}–${fr(range.max, digits)}`;
const signed = (value: number, digits = 0) => `${value > 0 ? '+' : ''}${fr(value, digits)}`;
const dayText = (value: string) => { const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value); return match ? `${match[3]}.${match[2]}.${match[1]}` : value; };
const dateTimeText = (iso: string) => {
  const date = new Date(iso);
  return Number.isFinite(date.getTime()) ? date.toLocaleString('fr-CH', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : iso;
};
const pad = (value: number) => String(value).padStart(2, '0');
const localInput = (time: number) => { const d = new Date(time); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const weightText = (kg: number) => kg >= 1 ? `${fr(kg, 3)} kg` : `${fr(kg * 1000, 0)} g`;
const packWord = (product: YeastProduct | undefined, count: number) => `${product?.form === 'sèche' ? 'sachet' : 'pack'}${count > 1 ? 's' : ''}`;
const money = (price: NonNullable<YeastOffer['price']>) => `${price.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${price.currency} / ${price.packs > 1 ? `${price.packs} packs` : 'pack'}`;
/** Key order never counts as a change of a frozen copy. */
const stable = (value: unknown) => JSON.stringify(value ?? null, (_key, entry) => entry && typeof entry === 'object' && !Array.isArray(entry)
  ? Object.fromEntries(Object.entries(entry).filter(([, item]) => item !== undefined).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) : entry);
const compact = <T extends object>(value: T): T => Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
const BASIS: Record<WortBasis, string> = { measured: 'mesuré', 'recipe-estimate': 'estimé recette', hypothesis: 'hypothèse' };
const STARTER: Record<NonNullable<YeastPitchingWort['starterContribution']>, string> = { included: 'inclus dans ces valeurs', decanted: 'décanté, non inclus', unknown: 'apport inconnu' };
const QUALIFIER: Record<string, string> = { point: 'point', range: 'plage', approximate: 'approximative', 'lower-bound': 'borne basse', 'upper-bound': 'borne haute', 'strict-lower-bound': 'borne basse stricte', 'strict-upper-bound': 'borne haute stricte' };
const boundSymbol = (operator: NonNullable<YeastPitchingAdvice['bound']>['operator']) => operator === '>=' ? '≥' : operator === '<=' ? '≤' : operator;
const TONE: Record<Tone, string> = { ok: 'Dans le conseil', low: 'Sous le conseil', high: 'Au-dessus du conseil', unknown: 'Non comparable', missing: 'À renseigner', invalid: 'À corriger' };

/** Only valid product documents are merged: a malformed cached row is ignored, never cast, and no offer is fabricated for it. */
function useYeastSupply() {
  const stored: unknown = useStorageValue(StorageService.getYeastProducts);
  const documents = useMemo(() => Array.isArray(stored)
    ? stored.flatMap(row => { const document = readYeastProductDocument(row); return document ? [document] : []; }) : NO_DOCUMENTS, [stored]);
  const supply = useMemo(() => mergeYeastSupply(BOOTSTRAP, documents), [documents]);
  return { supply, documents };
}
/** Only articles of the Levure category can carry a lot for the recipe; an homonym elsewhere never counts. */
function useYeastStock(): StockItem[] {
  const stored = useStorageValue(StorageService.getStocks);
  return useMemo(() => (stored?.rawMaterials ?? NO_STOCK).filter(item => item.category?.toLocaleLowerCase('fr') === 'levure'), [stored]);
}
/** A local or queued receipt is said as such; only an explicit server state reads as confirmed. */
const receiptText = (receipt: unknown) => {
  const data = receipt && typeof receipt === 'object' ? receipt as Record<string, unknown> : {};
  const status = String(data.status ?? data.state ?? '');
  return /^(server|confirmed|server-confirmed)$/i.test(status) ? `Correction confirmée par la base.${data.readback === 'pending' ? ' La copie locale reste à actualiser.' : ''}`
    : 'Correction enregistrée sur cet appareil ou en attente d’envoi : pas encore confirmée par le serveur.';
};

/** Every write goes through the recipe's own yeast; an emptied plan disappears instead of leaving a shell. */
function withPitching(recipe: TrialRecipe, update: (plan: YeastPitchingPlan) => YeastPitchingPlan | undefined): TrialRecipe {
  const plan = update(structuredClone(recipe.yeast.pitching ?? { version: 1 }));
  const yeast: YeastSpec = { ...recipe.yeast };
  const kept = plan && compact(plan);
  if (kept && Object.keys(kept).some(key => key !== 'version')) yeast.pitching = { ...kept, version: 1 };
  else delete yeast.pitching;
  return { ...recipe, yeast };
}
/** Each value keeps its own qualification; the compatibility basis summarises them without upgrading any. */
function normalizeWort(value: Partial<YeastPitchingWort>): YeastPitchingWort | undefined {
  const out: YeastPitchingWort = { basis: 'hypothesis' };
  if (typeof value.volumeL === 'number' && value.volumeL > 0) { out.volumeL = value.volumeL; out.volumeBasis = value.volumeBasis ?? 'hypothesis'; }
  if (typeof value.sg === 'number' && value.sg >= 1 && value.sg <= 1.25) { out.sg = value.sg; out.sgBasis = value.sgBasis ?? 'hypothesis'; }
  if (value.starterContribution) out.starterContribution = value.starterContribution;
  if (value.additionTiming && Object.keys(value.additionTiming).length) out.additionTiming = { ...value.additionTiming };
  if (value.note?.trim()) out.note = value.note;
  const bases = [out.volumeBasis, out.sgBasis].filter((basis): basis is WortBasis => !!basis);
  out.basis = bases.includes('recipe-estimate') ? 'recipe-estimate' : bases.length && bases.every(basis => basis === 'measured') ? 'measured' : 'hypothesis';
  // The estimate keeps the recipe inputs it was computed from, so that a later recipe change can refuse it.
  if (out.basis === 'recipe-estimate' && value.recipeBasis) out.recipeBasis = value.recipeBasis;
  if (out.volumeL === undefined && out.sg === undefined && !out.starterContribution && !out.additionTiming && !out.note) return undefined;
  return out;
}
const volumeBasisOf = (wort?: YeastPitchingWort) => wort?.volumeL !== undefined ? wort.volumeBasis ?? wort.basis : undefined;
const sgBasisOf = (wort?: YeastPitchingWort) => wort?.sg !== undefined ? wort.sgBasis ?? wort.basis : undefined;

const formatText = (product: YeastProduct) => product.format ? product.format.label : 'Format non communiqué · packs inconnus';
/** What is documented first; what is not is named once, in a short list, instead of one absence per line. */
const productFacts = (product: YeastProduct) => {
  const known = [
    product.dose ? `dose fabricant ${rangeText(product.dose.range, 0)} g/hL${product.dose.qualifier && !['range', 'point'].includes(product.dose.qualifier) ? ` (${QUALIFIER[product.dose.qualifier]})` : ''}` : '',
    product.cellsPerPack ? `${product.cellsPerPack.kind === 'viable' ? 'cellules viables' : 'cellules totales, non viables garanties'} ${rangeText(product.cellsPerPack.range, 0)} Md/pack` : '',
    product.directPitch ? `direct ≤ ${fr(product.directPitch.maxVolumeL)} L, SG < ${sgText(product.directPitch.maxSg)}` : '',
    product.starter ? 'méthode de starter documentée' : '',
  ].filter(Boolean);
  const missing = [product.form === 'sèche' && !product.dose ? 'dose' : '', product.form !== 'sèche' && !product.cellsPerPack ? 'cellules/pack' : '',
    product.form !== 'sèche' && !product.starter ? 'méthode de starter' : ''].filter(Boolean);
  return [...known, missing.length ? `non relevé : ${missing.join(', ')}` : ''].filter(Boolean).join(' · ');
};
const lotDetails = (lot?: YeastLotDetails) => lot ? [lot.lotNumber ? `lot ${lot.lotNumber}` : '', lot.manufacturedOn ? `fabriqué le ${dayText(lot.manufacturedOn)}` : '',
  lot.expiresOn ? `à utiliser avant le ${dayText(lot.expiresOn)}` : '', lot.storage ? `conservation : ${lot.storage}` : '',
  lot.viableCellsBillion !== undefined ? `${fr(lot.viableCellsBillion, 0)} Md viables ${lot.cellsBasis === 'measured' ? 'mesurés' : 'déclarés'}` : ''].filter(Boolean).join(' · ') : '';

function SourceLink({ source, label }: { source: YeastSupplySource; label?: string }) {
  const origin = source.origin ? { manufacturer: 'Fabricant', merchant: 'Vendeur', ai: 'Recherche IA', manual: 'Saisie manuelle' }[source.origin] : 'Origine non précisée';
  return <a className="yp-source" href={source.url} target="_blank" rel="noreferrer">{label ?? source.title}
    <span className="yp-source-date"> · {origin} · relevé le {dayText(source.checkedAt)}</span></a>;
}

/** Market observation of one offer: stock, CH delivery and price stay three dated facts, never a synthetic cost. */
function OfferRow({ offer, now, retained, action, onCorrect, copyOnly }: {
  offer: YeastOffer; now: number; retained?: boolean; action?: ReactNode; onCorrect?: () => void; copyOnly?: boolean;
}) {
  const state = yeastOfferState(offer, now);
  const stockTone = !state.fresh ? 'unknown' : state.status === 'in-stock' ? 'ok' : state.status === 'out-of-stock' ? 'bad' : 'unknown';
  const shippingTone = state.shipping === 'no' ? 'bad' : state.buyable ? 'ok' : 'unknown';
  return <li className="yp-offer" data-retained={retained || undefined} data-buyable={state.buyable} data-offer={offer.id}>
    <div className="yp-offer-line">
      <span className="yp-offer-seller"><strong>{offer.seller}</strong>{offer.sellerCountry
        ? <span className="yp-country" title="Pays du vendeur, distinct du pays du laboratoire">vendeur {offer.sellerCountry}</span>
        : <span className="yeast-small">pays du vendeur non sourcé</span>}{retained && <span className="yp-tag" data-tone="chosen">Offre retenue</span>}</span>
      {action}
    </div>
    <div className="yp-offer-facts">
      <span className="yp-tag" data-tone={stockTone}>{state.label}</span>
      <span className="yp-tag" data-tone={shippingTone}>{state.shippingLabel}</span>
      {offer.price ? <span className="yp-price"><span className="yp-num">{money(offer.price)}</span>
        <span className="yeast-small">{state.priceLabel} · {dayText(offer.price.source.checkedAt)}</span></span>
        : <span className="yeast-small">Prix non relevé</span>}
    </div>
    {copyOnly && <p className="yeast-small" data-offer-copy={offer.stock.source.origin === 'manual' ? 'manual' : 'recipe'}>{offer.stock.source.origin === 'manual'
      ? 'Offre définie à la main, gardée dans la recette ; absente du catalogue chargé. Stock, livraison et prix restent des relevés saisis, non vérifiés.'
      : 'Copie conservée dans la recette ; offre absente de la base actuelle (hors ligne ou retirée).'}</p>}
    <details className="yp-more"><summary>Conditions et sources<ChevronDown size={14} aria-hidden="true" /></summary><div>
      <p>Stock : {offer.stock.text} <SourceLink source={offer.stock.source} label="page" /></p>
      {offer.shipping ? <p>Livraison CH : {offer.shipping.conditions} <SourceLink source={offer.shipping.source} label="conditions" /></p>
        : <p>Livraison CH non relevée.</p>}
      {offer.sellerSource && <p>Pays du vendeur : <SourceLink source={offer.sellerSource} /></p>}
      {offer.price && <p>Prix relevé hors port et douane, sans conversion de devise : <SourceLink source={offer.price.source} label="source" /></p>}
      <p><a className="yp-source" href={offer.url} target="_blank" rel="noreferrer">Page de l’offre{offer.sku ? ` · réf. ${offer.sku}` : ''}</a></p>
      {onCorrect && <button type="button" className="yeast-link" onClick={onCorrect}>Corriger cette offre dans la base</button>}
    </div></details>
  </li>;
}

type PartProps = { recipe: TrialRecipe; onChange: Change; readOnly?: boolean };

/** Exact commercial product of the chosen reference, with its offers where it is chosen. Optional: a strain
 * stays chosen without a product; a product never brings a quantity, and a new product never confirms an old lot. */
export function YeastProductChoice({ recipe, onChange, readOnly = false }: PartProps) {
  const id = useId();
  const { supply, documents } = useYeastSupply();
  const [listOpen, setListOpen] = useState(false);
  const [error, setError] = useState('');
  const [target, setTarget] = useState<CorrectionTarget>(null);
  const [receipt, setReceipt] = useState('');
  // Manual definition opened on intent only: a new product/format, or an offer of the chosen exact product.
  const [entry, setEntry] = useState<null | { kind: 'product'; existing?: YeastProduct } | { kind: 'offer'; existing?: YeastOffer }>(null);
  const yeast = recipe.yeast, plan = yeast.pitching, chosen = plan?.product;
  const products = useMemo(() => yeast.hopIndexId ? supply.products.filter(product => product.referenceId === yeast.hopIndexId) : [],
    [supply, yeast.hopIndexId]);
  const takenIds = useMemo(() => new Set([...supply.products.map(product => product.id), ...documents.map(document => document.id), ...supply.offers.map(offer => offer.id)]),
    [supply, documents]);
  if (!yeast.name?.trim()) return null;
  const entryId = `${id}-entry`;
  const toggleEntry = (kind: 'product' | 'offer') => setEntry(previous => previous?.kind === kind && !previous.existing ? null : { kind });
  const now = Date.now();
  const offersFor = (productId: string) => rankYeastOffers(supply.offers.filter(offer => offer.productId === productId), now);
  const current = chosen ? supply.products.find(product => product.id === chosen.id) : undefined;
  const incompatible = !!chosen && (chosen.referenceId !== yeast.hopIndexId || chosen.form !== yeast.form);
  const refreshed = !!chosen && !!current && !incompatible && stable(current) !== stable(chosen);
  // A product typed by the brewer and kept only in the recipe: readable, correctable, publishable on request.
  const manualCopy = !!chosen && !current && !incompatible && chosen.source.origin === 'manual';
  const fallback = (product: YeastProduct): YeastProductDocument | undefined => documents.some(document => document.id === product.id) ? undefined
    : { id: product.id, version: 1, revision: 0, product: structuredClone(product),
      offers: supply.offers.filter(offer => offer.productId === product.id).map(offer => structuredClone(offer)) };
  const choose = (product: YeastProduct, offer?: YeastOffer) => {
    try { onChange({ ...recipe, yeast: selectYeastProduct(yeast, product, offer) }); setError(''); setListOpen(false); }
    catch (e) { setError(e instanceof Error ? e.message : 'Ce produit ne peut pas être retenu pour cette référence.'); }
  };
  /** The measured wort and the lot's own details survive; product, offer, rate and preparation go with the product. */
  const release = () => {
    onChange(withPitching(recipe, previous => {
      const lot = previous.lot && compact({ ...previous.lot, productId: undefined });
      return { version: 1, wort: previous.wort, lot: lot && Object.keys(lot).length ? lot : undefined };
    }));
    setListOpen(false); setError('');
  };
  const retainedOffer = plan?.offer ? supply.offers.find(offer => offer.id === plan.offer!.id) ?? plan.offer : undefined;
  const otherOffers = chosen && !incompatible ? offersFor(chosen.id).filter(offer => offer.id !== retainedOffer?.id) : [];
  const showList = products.length > 0 && (!chosen || incompatible || listOpen);
  const correction = (product: YeastProduct) => !readOnly && <button type="button" className="yeast-link yp-correct"
    onClick={() => setTarget({ scope: 'product', id: product.id, fallback: fallback(product) })}>Corriger la fiche produit</button>;
  const offerCorrection = (product: YeastProduct, offer: YeastOffer) => readOnly ? undefined
    : () => setTarget({ scope: 'offer', id: product.id, offerId: offer.id, fallback: fallback(product) });
  return <div className="yeast-workbench yp-panel yp-supply" role="group" aria-labelledby={`${id}-title`} data-product-state={!chosen ? 'none' : incompatible ? 'incompatible' : 'chosen'}>
    <div className="yp-head"><h4 id={`${id}-title`}>Produit exact et achat</h4>
      {!chosen && <span className="yp-tag" title="Le produit exact fixe format, dose, méthode et offres ; rien n’est acheté ni consommé.">facultatif</span>}
      {chosen && !incompatible && !readOnly && <span className="yp-head-actions">
        {products.length > 1 && <button type="button" className="yeast-link" aria-expanded={listOpen} aria-controls={`${id}-list`} onClick={() => setListOpen(open => !open)}>{listOpen ? 'Garder ce produit' : 'Changer'}</button>}
        <button type="button" className="yeast-link" onClick={release}>Retirer</button></span>}
    </div>
    {!yeast.hopIndexId ? <p className="yeast-small">Saisie libre ou article sans référence catalogue : aucun produit ni offre n’y est rattaché automatiquement. Quantité et lot restent manuels.</p> : <>
      {chosen && <div className="yp-chosen" data-state={incompatible ? 'incompatible' : 'ok'}>
        <span className="yp-chosen-main"><strong>{chosen.label}</strong><small>{chosen.manufacturer} · {chosen.form} · {formatText(chosen)}</small></span>
        <SourceLink source={chosen.source} />
      </div>}
      {incompatible && chosen && <p className="yeast-notice" role="alert">« {chosen.label} » appartient à une autre référence ou forme que la levure du brouillon : format, dose et packs ne s’appliquent pas.
        {!readOnly && <> <button type="button" className="yeast-link" onClick={release}>Retirer ce produit</button></>}</p>}
      {chosen && !current && !incompatible && (manualCopy
        ? <p className="yeast-small" data-product-copy="manual">Définition manuelle gardée dans la recette ; absente du catalogue chargé.
          {!readOnly && <> <button type="button" className="yeast-link" aria-controls={entryId} onClick={() => setEntry({ kind: 'product', existing: chosen })}>Corriger ou créer la fiche dans la base</button></>}</p>
        : <p className="yeast-small">Copie de la recette conservée : produit absent de la base chargée (hors ligne ou retiré).</p>)}
      {refreshed && current && <p className="yeast-notice">Fiche produit mise à jour dans la base depuis sa copie dans la recette. Le calcul et une préparation éventuelle se relisent.
        {!readOnly && <> <button type="button" className="yeast-link" onClick={() => choose(current, plan?.offer && supply.offers.find(offer => offer.id === plan.offer!.id))}>Reprendre la version actuelle</button></>}</p>}
      {chosen && !incompatible && !showList && <ul className="yp-offers" aria-label={`Offres pour ${chosen.label}`}>
        {retainedOffer && <OfferRow offer={retainedOffer} now={now} retained copyOnly={!supply.offers.some(offer => offer.id === retainedOffer.id)}
          action={!readOnly && <span className="yp-head-actions">
            {!supply.offers.some(offer => offer.id === retainedOffer.id) && retainedOffer.stock.source.origin === 'manual' &&
              <button type="button" className="yeast-link" aria-controls={entryId} onClick={() => setEntry({ kind: 'offer', existing: retainedOffer })}>Corriger ou ajouter à la base</button>}
            <button type="button" className="yeast-link" onClick={() => choose(chosen)}>Ne plus retenir</button></span>}
          onCorrect={supply.offers.some(offer => offer.id === retainedOffer.id) ? offerCorrection(chosen, retainedOffer) : undefined} />}
        {!retainedOffer && <li className="yeast-small yp-offer-none">{otherOffers.length ? 'Aucune offre retenue · facultatif, la recette reste valable sans achat.' : 'Aucune offre relevée pour ce produit.'}</li>}
        {otherOffers.slice(0, retainedOffer ? 0 : 2).map(offer => <OfferRow key={offer.id} offer={offer} now={now} onCorrect={offerCorrection(chosen, offer)}
          action={!readOnly && <button type="button" className="yp-choose" onClick={() => choose(chosen, offer)}>Retenir</button>} />)}
      </ul>}
      {chosen && !incompatible && !showList && otherOffers.length > (retainedOffer ? 0 : 2) && <details className="yp-more yp-other-offers"><summary>{retainedOffer ? `Autres offres · ${otherOffers.length}` : `${otherOffers.length - 2} autre${otherOffers.length - 2 > 1 ? 's' : ''} offre${otherOffers.length - 2 > 1 ? 's' : ''}`}<ChevronDown size={14} aria-hidden="true" /></summary>
        <ul className="yp-offers">{otherOffers.slice(retainedOffer ? 0 : 2).map(offer => <OfferRow key={offer.id} offer={offer} now={now} onCorrect={offerCorrection(chosen, offer)}
          action={!readOnly && <button type="button" className="yp-choose" onClick={() => choose(chosen, offer)}>Retenir</button>} />)}</ul></details>}
      {chosen && !incompatible && !showList && <div className="yp-foot">{!manualCopy && correction(chosen)}
        {!readOnly && <button type="button" className="yeast-link" aria-expanded={entry?.kind === 'offer' && !entry.existing} aria-controls={entryId} onClick={() => toggleEntry('offer')}>Définir une offre</button>}
        {!readOnly && <button type="button" className="yeast-link" aria-expanded={entry?.kind === 'product' && !entry.existing} aria-controls={entryId} onClick={() => toggleEntry('product')}>Définir un autre produit / format</button>}</div>}
      {!products.length && !chosen && <p className="yeast-small" data-product-empty>Aucun produit exact relevé pour {yeast.name} : la souche reste choisie ; format, dose fabricant, packs et offres restent inconnus.</p>}
      {showList && <>
        {yeast.stockItemRef && <p className="yeast-small">Un autre produit que celui du lot {yeast.stockItemRef} retire l’association de ce lot : il n’est pas confirmé pour ce format.</p>}
        <ul id={`${id}-list`} className="yp-products" aria-label={`Produits relevés pour ${yeast.name}`}>{products.map(product => {
          const offers = offersFor(product.id), isChosen = chosen?.id === product.id && !incompatible;
          return <li key={product.id} data-chosen={isChosen || undefined} data-product={product.id}>
            <div className="yp-product-head">
              <span className="yp-chosen-main"><strong>{product.label}</strong><small>{product.manufacturer} · {product.form} · {formatText(product)}</small></span>
              {!readOnly && (isChosen ? <span className="yp-tag" data-tone="chosen">Retenu</span>
                : <button type="button" className="yp-choose" onClick={() => choose(product)}>Choisir</button>)}
            </div>
            <p className="yeast-small">{productFacts(product) || 'Aucune donnée d’usage relevée.'} · <SourceLink source={product.source} label="source" />{correction(product) && <> · {correction(product)}</>}</p>
            {offers.length ? <ul className="yp-offers" aria-label={`Offres pour ${product.label}`}>{offers.map(offer => <OfferRow key={offer.id} offer={offer} now={now}
              retained={isChosen && plan?.offer?.id === offer.id} onCorrect={offerCorrection(product, offer)}
              action={!readOnly && !(isChosen && plan?.offer?.id === offer.id) && <button type="button" className="yeast-link" onClick={() => choose(product, offer)}>{isChosen ? 'Retenir' : 'Choisir avec cette offre'}</button>} />)}</ul>
              : <p className="yeast-small">Aucune offre relevée.</p>}
          </li>;
        })}</ul>
        {supply.offers.filter(offer => products.some(product => product.id === offer.productId)).length > 1 && <details className="yp-more"><summary>Ordre et fraîcheur des offres<ChevronDown size={14} aria-hidden="true" /></summary>
          <div><p>Vendeur en Suisse, puis France et Allemagne, puis Europe ; le pays du laboratoire n’intervient pas. Un stock relevé il y a plus de 24 h ou une livraison CH non documentée n’est jamais un achat confirmé.</p></div></details>}
      </>}
      {/* The general case: any exact format of the chosen reference, even with no product listed. */}
      {!readOnly && (!chosen || showList) && <div className="yp-foot">
        <button type="button" className="yeast-link" aria-expanded={entry?.kind === 'product' && !entry.existing} aria-controls={entryId} onClick={() => toggleEntry('product')}>
          {products.length ? 'Définir un autre produit / format' : 'Définir le produit exact / format'}</button></div>}
      {entry && !readOnly && <div id={entryId} className="yp-entry-slot">
        {entry.kind === 'product'
          ? <YeastProductEntry key={entry.existing?.id ?? 'new-product'} recipe={recipe} onChange={onChange} existing={entry.existing} takenIds={takenIds} onClose={() => setEntry(null)} />
          : chosen && !incompatible && <YeastOfferEntry key={entry.existing?.id ?? 'new-offer'} recipe={recipe} onChange={onChange} product={chosen}
            parentFallback={fallback(current ?? chosen)} existing={entry.existing} takenIds={takenIds} onClose={() => setEntry(null)} />}
      </div>}
    </>}
    {error && <p className="yeast-error" role="alert">{error}</p>}
    {receipt && <p className="yp-receipt" role="status">{receipt}</p>}
    <YeastDbCorrectionsPanel target={target ? { ...target, context: { recipe } } : null} onClose={() => setTarget(null)} onUpdated={next => setReceipt(receiptText(next))} />
  </div>;
}

type SectionProps = { recipe: TrialRecipe; onChange: Change; readOnly: boolean; advice: YeastPitchingAdvice; stock: StockItem[] };

/** Wort actually receiving the yeast. Volume and density each carry their own basis; a measurement is never
 * reduced again, an estimate is refused once the recipe it came from changes, and J0 does not order additions. */
function WortSection({ recipe, onChange, readOnly }: SectionProps) {
  const id = useId();
  const wort = recipe.yeast.pitching?.wort;
  const volumeBasis = volumeBasisOf(wort), sgBasis = sgBasisOf(wort);
  const additions = recipe.fermentables.flatMap((fermentable, index) => fermentable.use === 'fermentation' && fermentable.weightKg !== 0
    ? [{ key: pitchingAdditionId(index, fermentable.name), name: fermentable.name, weightKg: fermentable.weightKg }] : []);
  const [draftTiming, setDraftTiming] = useState<Timing>({});
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const timing: Timing = wort ? wort.additionTiming ?? {} : draftTiming;
  const missing = additions.filter(addition => !timing[addition.key]);
  const estimated = volumeBasis === 'recipe-estimate' || sgBasis === 'recipe-estimate';
  const stale = estimated && wort?.recipeBasis !== pitchingRecipeBasis(recipe);
  const showStarter = recipe.yeast.pitching?.product?.form !== 'sèche' && recipe.yeast.form !== 'sèche';
  const commit = (next?: Partial<YeastPitchingWort>) => onChange(withPitching(recipe, plan => ({ ...plan, wort: next && normalizeWort(next) })));
  /** `fill` replaces what is not measured; `refresh` recomputes only what was already a recipe estimate. */
  const estimate = (nextTiming: Timing, scope: 'fill' | 'refresh') => {
    const result = estimatePitchingWort(recipe, nextTiming);
    const replace = (basis?: WortBasis) => scope === 'fill' ? basis !== 'measured' : basis === 'recipe-estimate';
    const kept = { starterContribution: wort?.starterContribution, note: wort?.note, additionTiming: nextTiming };
    if (!result.wort) {
      setMessage(result.reasons[0]);
      if (result.missing.length) setOpen(true);
      if (!wort) { setDraftTiming(nextTiming); return; }
      // A density estimated under another timing is withdrawn, never kept as if it were still valid.
      commit({ ...kept, volumeL: wort.volumeL, volumeBasis, recipeBasis: wort.recipeBasis,
        ...(scope === 'refresh' && sgBasis === 'recipe-estimate' ? {} : { sg: wort.sg, sgBasis }) });
      return;
    }
    setMessage('');
    commit({ ...kept, recipeBasis: result.wort.recipeBasis,
      volumeL: replace(volumeBasis) ? result.wort.volumeL : wort?.volumeL, volumeBasis: replace(volumeBasis) ? 'recipe-estimate' : volumeBasis,
      sg: replace(sgBasis) ? result.wort.sg : wort?.sg, sgBasis: replace(sgBasis) ? 'recipe-estimate' : sgBasis });
  };
  const setTiming = (key: string, value: 'before' | 'after' | 'unknown') => {
    const next = { ...timing };
    if (value === 'unknown') delete next[key]; else next[key] = value;
    if (!wort) { setDraftTiming(next); return; }
    if (estimated) estimate(next, 'refresh'); else commit({ ...wort, additionTiming: next });
  };
  const setVolume = (value?: number) => {
    if (value !== undefined && !(value > 0)) { setMessage('Volume nul ou négatif refusé : laisse vide s’il est inconnu.'); return; }
    setMessage('');
    commit({ ...wort, volumeL: value, volumeBasis: value === undefined ? undefined : volumeBasis === 'measured' ? 'measured' : 'hypothesis' });
  };
  const setSg = (value?: number) => {
    if (value !== undefined && !(value >= 1 && value <= 1.25)) { setMessage(`Densité ${fr(value, 4)} refusée : saisis une SG entre 1,000 et 1,250 (par exemple 1,048).`); return; }
    setMessage('');
    commit({ ...wort, sg: value, sgBasis: value === undefined ? undefined : sgBasis === 'measured' ? 'measured' : 'hypothesis' });
  };
  // « Estimé » is reached only through the estimate itself, never by relabelling a typed value.
  const basisOptions = (current?: WortBasis) => [{ value: 'measured' as WortBasis, label: 'Mesuré', disabled: false },
    { value: 'hypothesis' as WortBasis, label: 'Hypothèse', disabled: false }, { value: 'recipe-estimate' as WortBasis, label: 'Estimé', disabled: current !== 'recipe-estimate' }];
  const basisTag = (basis?: WortBasis) => <span className="yp-basis" data-basis={basis ?? 'unknown'}>{basis ? BASIS[basis] : 'inconnu'}</span>;
  return <section className="yp-section yp-wort" aria-labelledby={`${id}-title`} data-wort-basis={wort?.basis ?? 'none'} data-stale={stale || undefined}>
    <div className="yp-head"><h4 id={`${id}-title`}>Moût à ensemencer</h4>
      {!readOnly && (wort || open) && <button type="button" className="yeast-link" aria-expanded={open} aria-controls={`${id}-editor`} onClick={() => setOpen(value => !value)}>{open ? 'Fermer' : 'Corriger'}</button>}</div>
    <p className="yp-reading">
      <span><span className="yp-num">{wort?.volumeL !== undefined ? `${fr(wort.volumeL)} L` : 'Volume ?'}</span> {basisTag(volumeBasis)}</span>
      <span><span className="yp-num">{wort?.sg !== undefined ? `SG ${sgText(wort.sg)}` : 'SG ?'}</span> {basisTag(sgBasis)}</span>
      {showStarter && <span className="yeast-small">starter : {STARTER[wort?.starterContribution ?? 'unknown']}</span>}
    </p>
    {!wort && <p className="yeast-small">Volume et densité au moment d’ensemencer : ni la densité initiale finale ni le volume de recette ne les remplacent.</p>}
    {stale && <p className="yeast-notice" role="status">Estimation périmée : ingrédients, rendement ou volume de la recette modifiés.
      {!readOnly && <> <button type="button" className="yeast-link" onClick={() => estimate(timing, 'fill')}>Recalculer</button> · <button type="button" className="yeast-link" onClick={() => setOpen(true)}>Saisir une mesure</button></>}</p>}
    {!wort && !readOnly && !open && <div className="yp-actions">
      <button type="button" onClick={() => estimate(timing, 'fill')}>Estimer depuis la recette</button>
      <button type="button" className="yeast-link" onClick={() => setOpen(true)}>Saisir une mesure ou une hypothèse</button></div>}
    {message && <p className="yeast-notice" role="status">{message}</p>}
    {open && !readOnly && <div id={`${id}-editor`} className="yp-editor">
      <div className="yp-field-row">
        <label htmlFor={`${id}-volume`}>Volume</label>
        <span className="yp-input-unit"><NumberInput id={`${id}-volume`} aria-label="Volume du moût à ensemencer en litres" value={wort?.volumeL} emptyValue={undefined} min={0} onValue={setVolume} placeholder="?" /><span>L</span></span>
        {wort?.volumeL !== undefined && volumeBasis ? <SegmentedControl label="Nature du volume" value={volumeBasis} options={basisOptions(volumeBasis)}
          onChange={basis => { if (basis !== 'recipe-estimate') commit({ ...wort, volumeBasis: basis }); }} />
          : <span className="yeast-small">Nature à préciser après saisie</span>}
      </div>
      <div className="yp-field-row">
        <label htmlFor={`${id}-sg`}>Densité</label>
        <span className="yp-input-unit"><NumberInput id={`${id}-sg`} aria-label="Densité du moût à ensemencer en SG" value={wort?.sg} emptyValue={undefined} onValue={setSg} placeholder="1,0??" /><span>SG</span></span>
        {wort?.sg !== undefined && sgBasis ? <SegmentedControl label="Nature de la densité" value={sgBasis} options={basisOptions(sgBasis)}
          onChange={basis => { if (basis !== 'recipe-estimate') commit({ ...wort, sgBasis: basis }); }} />
          : <span className="yeast-small">Nature à préciser après saisie</span>}
      </div>
      {showStarter && <div className="yp-field-row"><span className="yp-label">Starter dans ces valeurs</span>
        <SegmentedControl label="Apport du starter dans le volume et la densité" value={wort?.starterContribution ?? 'unknown'}
          options={[{ value: 'included', label: 'Inclus' }, { value: 'decanted', label: 'Décanté' }, { value: 'unknown', label: 'Inconnu' }]}
          onChange={value => commit({ ...wort, basis: wort?.basis ?? 'hypothesis', starterContribution: value })} /></div>}
      <div className="yp-actions"><button type="button" onClick={() => estimate(timing, 'fill')}>{wort ? 'Estimer les valeurs non mesurées' : 'Estimer depuis la recette'}</button>
        {wort && <button type="button" className="yeast-link" onClick={() => { commit(undefined); setMessage(''); }}>Effacer le moût</button>}</div>
      <p className="yeast-small">Une valeur saisie peut être mesurée ; une mesure prise juste avant l’ensemencement n’est jamais réduite une seconde fois. Aucun apport de starter n’est ajouté automatiquement.</p>
    </div>}
    {additions.length > 0 && (open || missing.length > 0 && !!message) && <fieldset className="yp-timing" disabled={readOnly}>
      <legend>Ajouts en fermentation · présents dans le moût à l’ensemencement ?</legend>
      {additions.map(addition => <div key={addition.key} className="yp-timing-row" data-missing={!timing[addition.key] || undefined}>
        <span className="yp-timing-name">{addition.name} <span className="yp-num">{weightText(addition.weightKg)}</span></span>
        <SegmentedControl label={`Moment de ${addition.name} par rapport à l’ensemencement`} value={timing[addition.key] ?? 'unknown'}
          options={[{ value: 'unknown', label: 'Inconnu' }, { value: 'before', label: 'Avant' }, { value: 'after', label: 'Après' }]}
          onChange={value => setTiming(addition.key, value)} />
      </div>)}
      <p className="yeast-small">Avant : compté dans la densité estimée. Après : exclu. J0 ne suffit pas à ordonner un ajout. Un extrait ou une maltodextrine compte par son extrait, sans déduction de fermentescibilité.
        {missing.length > 0 && ` Densité estimée non calculée tant que ${missing.length > 1 ? `${missing.length} ajouts restent` : 'un ajout reste'} inconnu${missing.length > 1 ? 's' : ''}.`}</p>
    </fieldset>}
  </section>;
}

/** Sourced advice for this product and this wort; a range stays a range and nothing converts cells from grams, mL or age. */
function AdviceSection({ recipe, onChange, readOnly, advice, legacyDoseG }: SectionProps & { legacyDoseG?: YeastQuantityRange }) {
  const id = useId();
  const plan = recipe.yeast.pitching, product = plan?.product, wort = plan?.wort;
  const cellsMode = !!product && !(product.dose && product.form === 'sèche');
  const surplusUnit = advice.unit === 'g' ? 'g' : 'Md';
  const direct = product?.directPitch, pitchTemp = recipe.yeast.pitchTempC;
  const knownTemp = typeof pitchTemp === 'number' && Number.isFinite(pitchTemp);
  const directNotes = direct ? [
    wort?.volumeL !== undefined && wort.volumeL > direct.maxVolumeL ? `${fr(wort.volumeL)} L > ${fr(direct.maxVolumeL)} L` : '',
    wort?.sg !== undefined && wort.sg >= direct.maxSg ? `SG ${sgText(wort.sg)} ≥ ${sgText(direct.maxSg)}` : '',
    knownTemp && (pitchTemp! < direct.minTemperatureC || pitchTemp! > direct.maxTemperatureC)
      ? `ensemencement ${fr(pitchTemp!)} °C hors ${fr(direct.minTemperatureC)}–${fr(direct.maxTemperatureC)} °C` : '',
  ].filter(Boolean) : [];
  // Applicability is claimed only when every published condition can be checked; unknowns are named, not assumed within.
  const directUnknown = direct ? [wort?.volumeL === undefined ? 'volume du moût' : '', wort?.sg === undefined ? 'densité du moût' : '',
    !knownTemp ? 'température d’ensemencement' : ''].filter(Boolean) : [];
  const capacity = (count: number) => product?.format ? count * product.format.amount : undefined;
  const methodLabel = advice.method === 'manufacturer-mass' ? 'Repère fabricant · masse' : advice.method === 'viable-cells' ? 'Cellules viables · hypothèse sourcée'
    : advice.stale ? 'À revalider' : 'Non calculable';
  return <section className="yp-section yp-advice" aria-labelledby={`${id}-title`} data-method={advice.method} data-stale={advice.stale || undefined}>
    <div className="yp-head"><h4 id={`${id}-title`}>Conseil</h4><span className="yp-tag" data-tone={advice.method === 'unknown' ? 'unknown' : undefined}>{methodLabel}</span></div>
    {advice.method === 'manufacturer-mass' && advice.range && product?.dose && wort?.volumeL !== undefined && <p className="yp-figure" data-advice-range>
      <span className="yp-num yp-big">{rangeText(advice.range, 1)} g</span>
      <span>pour {fr(wort.volumeL)} L à ensemencer · {rangeText(product.dose.range, 0)} g/hL{product.dose.range.min !== product.dose.range.max ? ', plage publiée' : ''}</span></p>}
    {advice.bound && <p className="yp-figure" data-advice-bound><span className="yp-num yp-big">{boundSymbol(advice.bound.operator)} {fr(advice.bound.value, 1)} g</span>
      <span>borne publiée · aucun nombre de {packWord(product, 2)} ni milieu</span></p>}
    {advice.method === 'viable-cells' && advice.range && plan?.rate && wort?.volumeL !== undefined && wort.sg !== undefined && <p className="yp-figure" data-advice-cells>
      <span className="yp-num yp-big">{fr(advice.range.min, 0)} Md</span>
      <span>cellules viables pour {fr(wort.volumeL)} L à SG {sgText(wort.sg)} · taux {fr(plan.rate.value, 2)} M/mL/°P</span></p>}
    {advice.packs && product && <p className="yp-figure" data-advice-packs>
      <span className="yp-num yp-big">{rangeText(advice.packs, 0)} {packWord(product, advice.packs.max)}</span>
      <span>{product.format ? `de ${product.format.label.toLocaleLowerCase('fr')}` : ''}</span></p>}
    {/* Capacity of whole packs versus the dose reference: an excess is capacity, not a quantity that must stay unpitched. */}
    {advice.packs && product && advice.surplus && advice.method === 'manufacturer-mass' && advice.range && product.format && <p className="yp-line" data-advice-capacity>
      {advice.packs.min === advice.packs.max
        ? <>{advice.packs.min} {packWord(product, advice.packs.min)} = <span className="yp-num">{fr(capacity(advice.packs.min)!, 1)} {product.format.unit}</span> de capacité pour un repère de {rangeText(advice.range, 1)} g.</>
        : <>{advice.packs.min} {packWord(product, advice.packs.min)} = <span className="yp-num">{fr(capacity(advice.packs.min)!, 1)} g</span> de capacité (repère bas {fr(advice.range.min, 1)} g, excédent {fr(advice.surplus.lowDose, 1)} g) · {advice.packs.max} {packWord(product, advice.packs.max)} = <span className="yp-num">{fr(capacity(advice.packs.max)!, 1)} g</span> (repère haut {fr(advice.range.max, 1)} g, excédent {fr(advice.surplus.highDose, 1)} g).</>}
      <span className="yeast-small block">Capacité ouverte et quantité ensemencée restent distinctes : tout verser ou non se décide dans la quantité prévue.</span></p>}
    {advice.packs && advice.surplus && advice.method === 'viable-cells' && <p className="yp-line" data-advice-capacity>
      Excédent déclaré au-delà du besoin : {fr(advice.surplus.lowDose, 0)} {surplusUnit} avec {advice.packs.min} {packWord(product, advice.packs.min)} au maximum déclaré par pack, {fr(advice.surplus.highDose, 0)} {surplusUnit} avec {advice.packs.max} au minimum déclaré.</p>}
    {advice.availableCellsBillion !== undefined && <p className="yp-line">Lot associé : <span className="yp-num">{fr(advice.availableCellsBillion, 0)} Md</span> viables
      {advice.balanceCellsBillion !== undefined && <> · écart <span className="yp-num">{signed(advice.balanceCellsBillion)} Md</span></>} · sans extrapolation au starter.</p>}
    {advice.reasons.length > 0 && <ul className="yp-reasons">{[...new Set(advice.reasons)].map(reason => <li key={reason}>{reason}</li>)}</ul>}
    {!product && legacyDoseG && <p className="yp-legacy" data-legacy-dose>Repère de fiche catalogue au volume de recette ({fr(recipe.volumeL)} L) : <span className="yp-num">{rangeText(legacyDoseG, 1)} g</span>.
      Sans produit exact ni moût à ensemencer qualifiés, ce n’est ni un nombre de sachets ni un conseil pour ce moût.</p>}
    {direct && <p className="yp-line" data-direct-pitch data-direct-state={directNotes.length ? 'outside' : directUnknown.length ? 'unknown' : 'inside'}>
      Ensemencement direct publié : ≤ {fr(direct.maxVolumeL)} L, SG &lt; {sgText(direct.maxSg)}, {fr(direct.minTemperatureC)}–{fr(direct.maxTemperatureC)} °C.
      {directNotes.length ? <span className="yp-warn"> Ce moût : {directNotes.join(', ')} · davantage de levure ou une préparation selon la notice.</span> : null}
      {directUnknown.length ? <span className={directNotes.length ? 'yeast-small block' : 'yp-warn'}> Applicabilité non établie : {directUnknown.join(', ')} à renseigner.</span> : null}
      {!directNotes.length && !directUnknown.length ? ' Volume, densité et température de ce moût sont dans ces conditions publiées, sans autre garantie.' : null}</p>}
    {(advice.conditions || advice.source || direct) && <details className="yp-more"><summary>Conditions et source du conseil<ChevronDown size={14} aria-hidden="true" /></summary><div>
      {advice.conditions && <p>{advice.conditions}</p>}
      {advice.source && <p><SourceLink source={advice.source} /></p>}
      {direct && <p>{direct.conditions} <SourceLink source={direct.source} label="source" /></p>}
      {direct && <p>Ni cette notice ni un starter ne garantissent un nombre de cellules ; aucune croissance n’est calculée ici.</p>}
    </div></details>}
    {cellsMode && <RateEditor recipe={recipe} onChange={onChange} readOnly={readOnly} />}
  </section>;
}

/** A pitching rate is a sourced hypothesis with its conditions; it is stored only when complete. */
function RateEditor({ recipe, onChange, readOnly }: { recipe: TrialRecipe; onChange: Change; readOnly: boolean }) {
  const id = useId();
  const rate = recipe.yeast.pitching?.rate;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ value: rate?.value, title: rate?.source.title ?? '', url: rate?.source.url ?? '', conditions: rate?.conditions ?? '' });
  const url = draft.url.trim();
  const problems = [!(typeof draft.value === 'number' && draft.value > 0) ? 'taux' : '', !draft.title.trim() ? 'titre de la source' : '',
    !/^https:\/\/[^\s/]+\/\S+$/i.test(url) ? 'lien https vers la page' : '', !draft.conditions.trim() ? 'conditions' : ''].filter(Boolean);
  const save = () => {
    if (problems.length) return;
    onChange(withPitching(recipe, plan => ({ ...plan, rate: { value: draft.value!, conditions: draft.conditions.trim(),
      source: { url, title: draft.title.trim(), checkedAt: new Date().toISOString().slice(0, 10), origin: 'manual' } } })));
    setOpen(false);
  };
  const remove = () => { onChange(withPitching(recipe, plan => ({ ...plan, rate: undefined }))); setOpen(false); };
  return <div className="yp-rate" data-rate={rate ? 'set' : 'missing'}>
    <p className="yp-line">{rate ? <>Taux retenu : <span className="yp-num">{fr(rate.value, 2)} M/mL/°P</span> · {rate.conditions} · <SourceLink source={rate.source} /></>
      : 'Aucun taux cellulaire retenu : aucun taux universel n’est présumé.'}
      {!readOnly && <> <button type="button" className="yeast-link" aria-expanded={open} aria-controls={`${id}-rate`} onClick={() => setOpen(value => !value)}>{rate ? 'Corriger' : 'Renseigner un taux sourcé'}</button></>}</p>
    {open && !readOnly && <div id={`${id}-rate`} className="yp-editor">
      <div className="yp-field-row"><label htmlFor={`${id}-value`}>Taux</label>
        <span className="yp-input-unit"><NumberInput id={`${id}-value`} aria-label="Taux en millions de cellules viables par mL et par degré Plato" value={draft.value} emptyValue={undefined} min={0} onValue={value => setDraft(previous => ({ ...previous, value }))} /><span>M/mL/°P</span></span></div>
      <label className="yp-stack" htmlFor={`${id}-title`}>Source (titre)<Input id={`${id}-title`} value={draft.title} onChange={event => setDraft(previous => ({ ...previous, title: event.target.value }))} placeholder="Fiche fabricant, article…" /></label>
      <label className="yp-stack" htmlFor={`${id}-url`}>Lien de la source<Input id={`${id}-url`} type="url" value={draft.url} onChange={event => setDraft(previous => ({ ...previous, url: event.target.value }))} placeholder="https://…" /></label>
      <label className="yp-stack" htmlFor={`${id}-conditions`}>Conditions de validité<Textarea id={`${id}-conditions`} rows={2} value={draft.conditions} onChange={event => setDraft(previous => ({ ...previous, conditions: event.target.value }))} /></label>
      {problems.length > 0 && <p className="yeast-small">À compléter avant de retenir : {problems.join(', ')}. Le brouillon de taux reste local.</p>}
      <div className="yp-actions"><button type="button" disabled={problems.length > 0} onClick={save}>Retenir ce taux</button>
        {rate && <button type="button" className="yeast-link" onClick={remove}>Retirer le taux</button>}</div>
    </div>}
  </div>;
}

/** One scoped comparison: what is compared is named, so a pack count in range never reads as a dose in range. */
type QuantityCheck = { id: 'packs' | 'dose' | 'open' | 'cells'; label: string; value: string; verdict: string; tone: Tone };
type PlannedReading = { tone: Tone; badge?: string; text: string; detail?: string; checks?: QuantityCheck[] };
/** Display-only plural of a stored pack unit ("3 sachet" stays stored as is). */
const shownUnit = (qty: number, unit: string) => PACK_UNITS.test(unit) && qty > 1 && !/s$/i.test(unit) ? `${unit}s` : unit;
const doseCheck = (label: string, amount: number, range: YeastQuantityRange, unit: string): QuantityCheck => ({ id: 'dose', label, value: `${fr(amount, 1)} ${unit}`,
  tone: amount < range.min ? 'low' : amount > range.max ? 'high' : 'ok',
  verdict: amount < range.min ? `sous le repère bas ${fr(range.min, 1)} ${unit} (−${fr(range.min - amount, 1)} ${unit})`
    : amount > range.max ? `au-delà du repère haut ${fr(range.max, 1)} ${unit} (+${fr(amount - range.max, 1)} ${unit})` : `dans le repère ${rangeText(range, 1)} ${unit}` });
const packsCheck = (label: string, count: number, packs: YeastQuantityRange, product: YeastProduct): QuantityCheck => ({ id: 'packs', label,
  value: `${fr(count, 2)} ${packWord(product, count)}`, tone: count < packs.min ? 'low' : count > packs.max ? 'high' : 'ok',
  verdict: `${count < packs.min ? 'sous' : count > packs.max ? 'au-delà de' : 'dans'} la plage conseillée ${rangeText(packs, 0)}` });
/** Reading of the one planned quantity next to its editor: its own state first (missing, unit, zero, negative),
 * then scoped checks. Whole packs are compared with the advised pack count, and separately their capacity with the
 * dose reference if everything is pitched; the header badge never merges the two. */
function plannedReading(yeast: YeastSpec, advice: YeastPitchingAdvice, product?: YeastProduct): PlannedReading {
  const qty = yeast.qty as number | undefined, unit = yeast.unit;
  if (qty == null) return { tone: 'missing', text: `Quantité prévue non renseignée${unit ? ` · ${unit}` : ''}.`, detail: 'Le conseil ne la remplit jamais seul : saisis-la ou adopte une valeur dans la plage.' };
  if (!Number.isFinite(qty)) return { tone: 'invalid', text: 'Quantité prévue illisible.', detail: 'Saisis-la de nouveau.' };
  const shown = `${fr(qty, 3)}${unit ? ` ${unit}` : ''}`;
  if (qty === 0) return { tone: 'invalid', text: `${shown} · zéro à corriger.`, detail: 'Un zéro est enregistré : renseigne la quantité prévue avant de conserver la recette.' };
  if (qty < 0) return { tone: 'invalid', text: `${shown} · négative.`, detail: 'Corrige la quantité négative avant de conserver la recette.' };
  if (!unit) return { tone: 'invalid', text: `${shown} · unité à préciser.`, detail: 'Choisis une unité ; aucune conversion n’est supposée.' };
  if (!product) return { tone: 'unknown', text: `Prévu ${shown} · sans produit exact, aucune comparaison en sachets ou packs.` };
  if (advice.stale) return { tone: 'unknown', text: `Prévu ${shown} · conseil à revalider avant de comparer.` };
  if (advice.planned === undefined || !product.format) return { tone: 'unknown', text: product.format
    ? `Prévu ${shown} · non convertible dans le format « ${product.format.label} ».` : `Prévu ${shown} · format du produit non communiqué : comparaison impossible.` };
  const format = product.format, packUnit = PACK_UNITS.test(unit);
  const display = `${fr(qty, 3)} ${shownUnit(qty, unit)}`;
  const planned = `Prévu ${display}${unit.toLocaleLowerCase('fr') === format.unit.toLocaleLowerCase('fr') ? '' : ` = ${fr(advice.planned, 2)} ${format.unit}`}`;
  const actual = 'La quantité réellement ajoutée se note au brassage.';
  if (advice.method === 'manufacturer-mass' && (advice.range || advice.bound)) {
    const amount = advice.planned;
    // Whole packs: their count against the advised count, their capacity against the dose if everything is pitched.
    const dose = advice.range ? doseCheck(packUnit ? 'Si tout est versé' : 'Dose prévue', amount, advice.range, format.unit)
      : { id: 'dose' as const, label: packUnit ? 'Si tout est versé' : 'Dose prévue', value: `${fr(amount, 1)} ${format.unit}`,
        tone: (advice.bound!.operator === '>=' ? amount < advice.bound!.value ? 'low' : 'ok'
          : advice.bound!.operator === '>' ? amount <= advice.bound!.value ? 'low' : 'ok'
            : advice.bound!.operator === '<' ? amount >= advice.bound!.value ? 'high' : 'ok'
              : amount > advice.bound!.value ? 'high' : 'ok') as Tone,
        verdict: `borne publiée ${boundSymbol(advice.bound!.operator)} ${fr(advice.bound!.value, 1)} ${format.unit}` };
    const doseBadge = packUnit ? { ok: 'Dans le conseil', low: 'Sous le repère si tout est versé', high: 'Au-delà du repère si tout est versé' }
      : { ok: 'Dose dans le repère', low: 'Dose sous le repère', high: 'Dose au-delà du repère' };
    if (packUnit) {
      const packs = packWord(product, 2), Packs = `${packs[0].toUpperCase()}${packs.slice(1)}`;
      const count = advice.packs ? packsCheck(`${Packs} à ouvrir`, qty, advice.packs, product) : undefined;
      const tone: Tone = dose.tone !== 'ok' ? dose.tone : count?.tone ?? 'ok';
      const badge = dose.tone !== 'ok' ? doseBadge[dose.tone as 'low' | 'high'] : count && count.tone !== 'ok' ? `${Packs} hors plage` : doseBadge.ok;
      const note = count?.tone === 'ok' && dose.tone === 'high'
        ? `${qty > 1 ? `Ces ${packWord(product, qty)} couvrent` : `Ce ${packWord(product, 1)} couvre`} le repère haut ; verser tout ou partie reste ton choix. ${actual}`
        : count && dose.tone === 'low' ? `Le conseil compte ${rangeText(advice.packs!, 0)} ${packWord(product, advice.packs!.max)} pour atteindre le repère. ${actual}` : actual;
      return { tone, badge, text: `Prévu ${display} : ${fr(amount, 1)} ${format.unit} de capacité ouverte.`, checks: count ? [count, dose] : [dose], detail: note };
    }
    const open = format.unit === 'g' ? Math.ceil(amount / format.amount - 1e-9) : undefined;
    return { tone: dose.tone, badge: doseBadge[dose.tone as 'ok' | 'low' | 'high'], text: `${planned}.`, detail: actual,
      checks: [dose, ...(open ? [{ id: 'open' as const, label: `${packWord(product, 2)[0].toUpperCase()}${packWord(product, 2).slice(1)} à ouvrir`, value: `${open} ${packWord(product, open)}`, tone: 'unknown' as Tone,
        verdict: `capacité ${fr(open * format.amount, 1)} ${format.unit}${open * format.amount - amount > 1e-9 ? `, dont ${fr(open * format.amount - amount, 1)} ${format.unit} non prévus` : ''}` }] : [])] };
  }
  if (advice.method === 'viable-cells' && advice.packs && advice.plannedPacks !== undefined) {
    const count = packsCheck('Packs prévus', advice.plannedPacks, advice.packs, product);
    // A declaration per whole pack does not establish a concentration for a partial volume or mass.
    const wholePacks = Number.isInteger(advice.plannedPacks);
    const cells = wholePacks && product.cellsPerPack?.kind === 'viable' && advice.range ? (() => {
      const low = advice.plannedPacks! * product.cellsPerPack!.range.min, high = advice.plannedPacks! * product.cellsPerPack!.range.max, need = advice.range!.min;
      const tone: Tone = high < need ? 'low' : low >= need ? 'ok' : 'unknown';
      return { id: 'cells' as const, label: 'Si tout est versé', value: `${rangeText({ min: low, max: high }, 0)} Md déclarés`, tone,
        verdict: tone === 'low' ? `sous le besoin de ${fr(need, 0)} Md` : tone === 'ok' ? `couvre le besoin de ${fr(need, 0)} Md` : `besoin de ${fr(need, 0)} Md couvert ou non selon le lot` };
    })() : undefined;
    const tone: Tone = cells?.tone === 'low' ? 'low' : count.tone;
    const badge = cells?.tone === 'low' ? 'Cellules sous le besoin si tout est versé' : count.tone === 'ok' ? 'Packs dans la plage' : count.tone === 'low' ? 'Packs sous la plage' : 'Packs au-delà de la plage';
    return { tone, badge, text: `${planned}.`, checks: cells ? [count, cells] : [count],
      detail: wholePacks ? actual : `Portion de pack : les cellules ne sont pas déduites des mL ou grammes sans concentration documentée. ${actual}` };
  }
  return { tone: 'unknown', text: `${planned} · nombre de ${packWord(product, 2)} non calculable avec les données actuelles.` };
}

const UNITS = ['sachet', 'pack', 'g', 'mL'];
/** The one planned quantity (yeast.qty/unit). A range is adopted only by an explicit value inside it. */
function QuantitySection({ recipe, onChange, readOnly, advice, quantityEditor }: SectionProps & { quantityEditor?: ReactNode }) {
  const id = useId();
  const yeast = recipe.yeast, product = yeast.pitching?.product;
  const [adopted, setAdopted] = useState<{ before: { qty?: number; unit?: string }; after: { qty?: number; unit?: string } }>();
  const [picked, setPicked] = useState<number>();
  const [error, setError] = useState('');
  const reading = plannedReading(yeast, advice, product);
  const packs = advice.packs;
  const plannedCount = PACK_UNITS.test(yeast.unit ?? '') && Number.isInteger(yeast.qty) ? yeast.qty as number : undefined;
  const adoptable = !readOnly && !!packs && !advice.stale;
  const choices = packs && packs.max - packs.min <= 5 ? Array.from({ length: packs.max - packs.min + 1 }, (_, index) => packs.min + index) : [];
  const quantityText = (value: { qty?: number; unit?: string }) => value.qty == null ? 'non renseignée' : `${fr(value.qty, 3)}${value.unit ? ` ${value.unit}` : ''}`;
  const adopt = (count: number) => {
    try {
      const next = applyYeastPitchingAdvice(yeast, advice, count);
      onChange({ ...recipe, yeast: next });
      setAdopted({ before: { qty: yeast.qty as number | undefined, unit: yeast.unit }, after: { qty: next.qty, unit: next.unit } }); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Conseil périmé : recalcule avant d’adopter.'); }
  };
  const adoptionCurrent = !!adopted && yeast.qty === adopted.after.qty && yeast.unit === adopted.after.unit;
  const undoAdoption = () => {
    if (!adopted || !adoptionCurrent) return;
    onChange({ ...recipe, yeast: { ...yeast, qty: adopted.before.qty as number, unit: adopted.before.unit as string } });
    setAdopted(undefined);
  };
  const units = [...new Set([...UNITS, ...(yeast.unit ? [yeast.unit] : [])])];
  return <section className="yp-section yp-quantity" aria-labelledby={`${id}-title`} data-planned={reading.tone}
    data-packs-check={reading.checks?.find(check => check.id === 'packs')?.tone}>
    <div className="yp-head"><h4 id={`${id}-title`}>Quantité prévue</h4><span className="yp-tag" data-tone={reading.tone}>{reading.badge ?? TONE[reading.tone]}</span></div>
    {quantityEditor ?? (readOnly ? <p className="yp-num">{quantityText({ qty: yeast.qty as number | undefined, unit: yeast.unit })}</p>
      : <div className="yp-field-row" data-yeast-quantity-editor><label htmlFor={`${id}-qty`}>Quantité</label>
        <span className="yp-input-unit"><NumberInput id={`${id}-qty`} aria-label="Quantité prévue de levure" value={yeast.qty as number | undefined} emptyValue={undefined} min={0}
          onValue={qty => onChange({ ...recipe, yeast: { ...yeast, qty } })} placeholder="?" />
          <select aria-label="Unité de la quantité prévue" value={yeast.unit ?? ''} onChange={event => onChange({ ...recipe, yeast: { ...yeast, unit: event.target.value } })}>
            <option value="">unité ?</option>{units.map(unit => <option key={unit} value={unit}>{unit}</option>)}</select></span></div>)}
    <p className="yp-compare" data-tone={reading.checks ? undefined : reading.tone} data-quantity-reading>{reading.text}</p>
    {reading.checks && <dl className="yp-checks" aria-label="Comparaisons de la quantité prévue">{reading.checks.map(check => <div key={check.id} data-check={check.id} data-tone={check.tone}>
      <dt>{check.label}</dt><dd><span className="yp-num">{check.value}</span> · {check.verdict}</dd></div>)}</dl>}
    {reading.detail && <p className="yeast-small" data-quantity-detail>{reading.detail}</p>}
    {adoptable && packs && <div className="yp-adopt" role="group" aria-label={`Adopter un nombre de ${packWord(product, 2)} dans la plage conseillée`}>
      <span className="yeast-small">Adopter :</span>
      {choices.length ? choices.map(count => <button key={count} type="button" aria-pressed={plannedCount === count} onClick={() => adopt(count)}
        aria-label={`Adopter ${count} ${packWord(product, count)}${product?.format?.unit === 'g' ? `, capacité ${fr(count * product.format.amount, 1)} g` : ''}`}>
        {count} {packWord(product, count)}{product?.format?.unit === 'g' ? <span className="yp-adopt-capacity"> · {fr(count * product.format.amount, 1)} g</span> : null}</button>)
        : <><NumberInput integer min={packs.min} max={packs.max} aria-label={`Nombre de ${packWord(product, 2)} entre ${packs.min} et ${packs.max}`} value={picked} emptyValue={undefined} onValue={setPicked} />
          <button type="button" disabled={picked === undefined} onClick={() => picked !== undefined && adopt(picked)}>Adopter</button></>}
    </div>}
    {adoptable && <p className="yeast-small">Choix explicite dans la plage, sans milieu automatique ; la valeur affichée est la capacité des sachets ou packs, pas une dose imposée.</p>}
    {adoptionCurrent && adopted && <p className="yp-adopted" role="status">Quantité prévue : {quantityText(adopted.before)} → {quantityText(adopted.after)}.
      <button type="button" className="yeast-link" onClick={undoAdoption}><Undo2 size={14} aria-hidden="true" /> Rétablir {quantityText(adopted.before)}</button></p>}
    {error && <p className="yeast-error" role="alert">{error}</p>}
  </section>;
}

/** A stock article becomes the recipe's lot only by an explicit association; nothing is reserved or consumed. */
function LotSection({ recipe, onChange, readOnly, advice, stock, onCorrect }: SectionProps & { onCorrect: (ref: string) => void }) {
  const id = useId();
  const yeast = recipe.yeast, plan = yeast.pitching, product = plan?.product;
  const [picking, setPicking] = useState(false);
  const [pick, setPick] = useState('');
  const linked = yeast.stockItemRef ? stock.find(item => item.ref === yeast.stockItemRef) : undefined;
  const lotProduct = linked?.yeastLot?.productId ?? plan?.lot?.productId;
  const confirmed = !!product && !!linked && lotProduct === product.id;
  const conflict = !!product && !!linked?.yeastLot?.productId && linked.yeastLot.productId !== product.id;
  const nameKey = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('fr').replace(/\s+/g, ' ').trim();
  const homonyms = !linked ? stock.filter(item => nameKey(item.name) === nameKey(yeast.name)) : [];
  const associate = (item: StockItem) => {
    onChange({ ...recipe, yeast: { ...withPitching(recipe, previous => ({ ...previous, lot: item.yeastLot ? structuredClone(item.yeastLot) : undefined })).yeast, stockItemRef: item.ref } });
    setPicking(false); setPick('');
  };
  const dissociate = () => {
    const next = withPitching(recipe, previous => ({ ...previous, lot: undefined }));
    delete next.yeast.stockItemRef;
    onChange(next);
  };
  const confirm = () => product && onChange(withPitching(recipe, previous => ({ ...previous, lot: { ...previous.lot, productId: product.id } })));
  const toBuy = advice.packsToBuy;
  return <section className="yp-section yp-lot" aria-labelledby={`${id}-title`} data-lot={linked ? confirmed ? 'confirmed' : conflict ? 'conflict' : 'unconfirmed' : yeast.stockItemRef ? 'missing' : 'none'}>
    <div className="yp-head"><h4 id={`${id}-title`}>Lot et achat</h4>
      {toBuy && <span className="yp-tag" data-tone={toBuy.max === 0 ? 'ok' : 'unknown'}>{toBuy.max === 0 ? 'Rien à acheter' : `À acheter : ${rangeText(toBuy, 0)} ${packWord(product, toBuy.max)}`}</span>}</div>
    {linked ? <div className="yp-linked">
      <p className="yp-line"><strong>{linked.name}</strong> · réf. {linked.ref} · <span className="yp-num">{fr(linked.currentStock, 3)} {linked.unit}</span> en stock{lotDetails(linked.yeastLot ?? plan?.lot) ? ` · ${lotDetails(linked.yeastLot ?? plan?.lot)}` : ''}</p>
      {!product ? <p className="yeast-small">Sans produit exact, ce lot ne couvre aucun nombre de sachets ou packs.</p>
        : confirmed ? <p className="yp-line" data-tone="ok">Format confirmé : ce lot est « {product.label} » pour cette recette.</p>
          : conflict ? <p className="yeast-notice">Ce lot documente un autre produit ({linked.yeastLot!.productId}) : il ne couvre pas ce conseil.</p>
            : <p className="yeast-notice">Format non confirmé : ce lot ne compte pas dans les packs à acheter.
              {!readOnly && <> <button type="button" className="yeast-link" onClick={confirm}>Confirmer : ce lot est « {product.label} »</button></>}</p>}
    </div> : yeast.stockItemRef ? <p className="yeast-notice">Article {yeast.stockItemRef} absent du stock chargé (hors ligne ou supprimé) : rien n’est compté.</p>
      : <p className="yeast-small">Aucun lot de mon stock associé.{homonyms.length ? '' : ' Les packs à acheter restent inconnus sans lot associé.'}</p>}
    {homonyms.length > 0 && <p className="yeast-small" data-homonym>Homonyme{homonyms.length > 1 ? 's' : ''} en stock non associé{homonyms.length > 1 ? 's' : ''} : {homonyms.map(item => `${item.name} · réf. ${item.ref}`).join(' ; ')}. Ne couvre rien tant qu’il n’est pas associé.</p>}
    {!toBuy && advice.packs && <p className="yeast-small">Packs à acheter inconnus tant que l’article, son format et le stock utilisable ne sont pas confirmés.</p>}
    {!readOnly && <div className="yp-actions">
      {!picking && <button type="button" className="yeast-link" onClick={() => setPicking(true)}>{linked || yeast.stockItemRef ? 'Changer de lot' : 'Associer un lot de mon stock'}</button>}
      {(linked || yeast.stockItemRef) && <button type="button" className="yeast-link" onClick={dissociate}>Dissocier</button>}
      {linked && <button type="button" className="yeast-link" onClick={() => onCorrect(linked.ref)}>Corriger l’article dans la base</button>}
    </div>}
    {picking && !readOnly && <div id={`${id}-pick`} className="yp-editor">
      {stock.length ? <>
        <label className="yp-stack" htmlFor={`${id}-select`}>Article de la catégorie Levure
          <select id={`${id}-select`} value={pick} onChange={event => setPick(event.target.value)}>
            <option value="">Choisir un article…</option>
            {stock.map(item => <option key={item.ref} value={item.ref}>{[item.name, item.yeastLab, item.yeastStrain && `code ${item.yeastStrain}`, `réf. ${item.ref}`,
              item.yeastLot?.lotNumber && `lot ${item.yeastLot.lotNumber}`, `${fr(item.currentStock, 3)} ${item.unit}`].filter(Boolean).join(' · ')}</option>)}
          </select></label>
        <p className="yeast-small">L’association remplace l’article lié à la recette, recopie les détails documentés du lot et garde ta quantité prévue. Rien n’est réservé ni consommé.</p>
        <div className="yp-actions"><button type="button" disabled={!pick} onClick={() => { const item = stock.find(row => row.ref === pick); if (item) associate(item); }}>Associer ce lot</button>
          <button type="button" className="yeast-link" onClick={() => { setPicking(false); setPick(''); }}>Annuler</button></div>
      </> : <p className="yeast-small">Aucun article de la catégorie Levure dans le stock chargé. <button type="button" className="yeast-link" onClick={() => setPicking(false)}>Fermer</button></p>}
    </div>}
  </section>;
}

const PREPARATION_STATE: Record<ReturnType<typeof yeastPreparationState>, string> = {
  missing: 'Non planifiée', planned: 'Planifiée', due: 'Début atteint', 'too-late': 'Trop tard pour démarrer', stale: 'À revoir', cancelled: 'Annulée',
};
/** Where a sourced starter notice can be proposed: a canonical product needs no fallback; a bootstrap one travels as its parent before change. */
type StarterBase = { canPropose: boolean; parentFallback?: YeastProductDocument; takenIds: ReadonlySet<string> };
/** Only the exact product's sourced method; the plan must start before brew day and never promises growth. */
function PreparationSection({ recipe, onChange, readOnly, starterBase }: SectionProps & { starterBase: StarterBase }) {
  const id = useId();
  const yeast = recipe.yeast, product = yeast.pitching?.product, protocol = product?.starter, preparation = yeast.pitching?.preparation;
  const state = yeastPreparationState(yeast);
  const [editing, setEditing] = useState(false);
  // The notice entry opens on intent; it writes only the product copy's notice, never the plan below.
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(() => ({ targetPitchAt: preparation ? localInput(Date.parse(preparation.targetPitchAt)) : '',
    startAt: preparation?.startBasis === 'manual' ? localInput(Date.parse(preparation.startAt)) : '',
    volumeL: preparation?.volumeL, inoculum: preparation?.inoculum ?? '', equipment: preparation?.equipment ?? '' }));
  if (!product) return null;
  // The published window describes the culture itself; activation, boil, cooling and checks come on top, without a published total.
  const cultureOnly = protocol?.leadHoursMeaning !== 'total-preparation';
  const earliest = protocol ? localInput(Date.now() + protocol.leadHours.max * 3600000 + 60000) : undefined;
  const target = Date.parse(form.targetPitchAt);
  const latestCultureStart = protocol && Number.isFinite(target) ? target - protocol.leadHours.max * 3600000 : undefined;
  const openForm = () => {
    setForm({ targetPitchAt: preparation ? localInput(Date.parse(preparation.targetPitchAt)) : '', startAt: preparation?.startBasis === 'manual' ? localInput(Date.parse(preparation.startAt)) : '',
      volumeL: preparation?.volumeL, inoculum: preparation?.inoculum ?? '', equipment: preparation?.equipment ?? '' });
    setEditing(true); setError('');
  };
  const plan = () => {
    if (!form.targetPitchAt) { setError('Renseigne la date et l’heure d’ensemencement prévues.'); return; }
    try {
      const next = createYeastPreparation(yeast, { targetPitchAt: form.targetPitchAt, volumeL: form.volumeL ?? NaN, equipment: form.equipment, inoculum: form.inoculum,
        ...(form.startAt ? { startAt: form.startAt } : {}) });
      onChange(withPitching(recipe, previous => ({ ...previous, preparation: next })));
      setEditing(false); setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Préparation impossible avec ces valeurs.'); }
  };
  const cancel = () => preparation && onChange(withPitching(recipe, previous => ({ ...previous, preparation: { ...preparation, status: 'cancelled' } as YeastPreparationPlan })));
  /** Recipe copy of the notice: quantity, wort, lot, rate, offer and a planned preparation stay as they are (the plan becomes « À revoir »). */
  const retainNotice = (next: YeastStarterProtocol) => onChange(withPitching(recipe, previous => previous.product ? { ...previous, product: { ...previous.product, starter: next } } : previous));
  const noticeEntry = noticeOpen && !readOnly && <YeastStarterEntry key={product.id} recipe={recipe} product={product} existing={protocol}
    parentFallback={starterBase.parentFallback} canPropose={starterBase.canPropose} takenIds={starterBase.takenIds}
    onRetain={retainNotice} onClose={() => setNoticeOpen(false)} />;
  const transfer = preparation?.steps.filter(step => step.dueAt) ?? [];
  const untimed = preparation?.steps.filter(step => !step.dueAt) ?? [];
  return <section className="yp-section yp-prep" aria-labelledby={`${id}-title`} data-preparation={state}>
    <div className="yp-head"><h4 id={`${id}-title`}>Préparation avant J0</h4><span className="yp-tag" data-tone={state === 'stale' || state === 'due' || state === 'too-late' ? 'low' : state === 'planned' ? 'ok' : 'unknown'}>{PREPARATION_STATE[state]}</span></div>
    {!protocol ? <><p className="yeast-small">Aucune méthode de starter documentée pour « {product.label} » : aucune préparation n’est proposée ni dimensionnée.
      {!readOnly && <> <button type="button" className="yeast-link" aria-expanded={noticeOpen} onClick={() => setNoticeOpen(open => !open)}>Compléter la notice</button></>}</p>
      {noticeEntry}</> : <>
      <div className="yp-protocol">
        <p className="yp-line"><strong>{protocol.label}</strong> · milieu extrait de malt, SG cible <span className="yp-num">{sgText(protocol.targetSg)}</span></p>
        <p className="yp-line" data-lead-meaning={cultureOnly ? 'culture' : 'total'}>{cultureOnly
          ? <>Culture publiée : <span className="yp-num">{rangeText(protocol.leadHours, 0)} h</span> avant l’ensemencement. Activation, ébullition, refroidissement et contrôles s’y ajoutent ; leur durée totale n’est pas publiée, la marge reste à choisir.</>
          : <>Délai total publié : <span className="yp-num">{rangeText(protocol.leadHours, 0)} h</span> avant l’ensemencement.</>}</p>
        <p className="yeast-small">{protocol.method}</p>
        <details className="yp-more" open={!preparation}><summary>Conditions, contrôles et étapes de la notice · {protocol.steps.length}<ChevronDown size={14} aria-hidden="true" /></summary><div>
          <p>{protocol.conditions}</p>
          <ol className="yp-steps">{protocol.steps.map((step, index) => <li key={index}>{step}</li>)}</ol>
          <p>{protocol.source.origin === 'manual' ? 'Source citée à la main · ' : ''}<SourceLink source={protocol.source} /></p>
        </div></details>
        {!readOnly && <p className="yp-foot"><button type="button" className="yeast-link" aria-expanded={noticeOpen} onClick={() => setNoticeOpen(open => !open)}>Corriger la notice</button></p>}
      </div>
      {noticeEntry}
      {preparation && <div className="yp-plan-state">
        <p className="yp-line">{preparation.status === 'cancelled' ? 'Annulée · ' : ''}Début <span className="yp-num">{dateTimeText(preparation.startAt)}</span>
          {preparation.startBasis === 'manual' ? ' · choisi' : ' · au plus tard pour la fenêtre de culture publiée'} → ensemencement <span className="yp-num">{dateTimeText(preparation.targetPitchAt)}</span></p>
        {preparation.startBasis !== 'manual' && cultureOnly && preparation.status !== 'cancelled' && <p className="yeast-small">Aucune marge incluse pour activation, ébullition et refroidissement : choisis un début plus tôt si besoin (« Corriger ou remplacer »).</p>}
        <p className="yeast-small">Starter {fr(preparation.volumeL, 2)} L · inoculum : {preparation.inoculum} · matériel : {preparation.equipment} · révision {preparation.revision}</p>
        {state === 'stale' && <p className="yeast-notice">Produit, lot, moût, taux ou date changés depuis cette préparation : replanifie-la.</p>}
        {state === 'due' && <p className="yeast-notice">Le début prévu est atteint : la préparation se démarre maintenant ou se replanifie.</p>}
        {preparation.status !== 'cancelled' && <>
          {untimed.length > 0 && <ol className="yp-steps" aria-label="Étapes de la notice, sans heure publiée">{untimed.map(step => <li key={step.id}>{step.label}</li>)}</ol>}
          {transfer.map(step => <p key={step.id} className="yp-line" data-transfer>Transfert prévu <span className="yp-num">{dateTimeText(step.dueAt!)}</span> · {step.label}</p>)}
          {untimed.length > 0 && <p className="yeast-small">Étapes sans heure : leurs durées ne sont pas publiées ; seule l’échéance de transfert est fixée.</p>}
        </>}
        <p className="yeast-small">Croissance et cellules finales inconnues : la notice ne garantit aucun rendement. L’exécution se suit sur le brassin planifié.</p>
      </div>}
      {!readOnly && !editing && <div className="yp-actions">
        <button type="button" onClick={openForm}>{!preparation ? 'Planifier la préparation' : preparation.status === 'cancelled' ? 'Replanifier' : 'Corriger ou remplacer'}</button>
        {preparation && preparation.status !== 'cancelled' && <button type="button" className="yeast-link" onClick={cancel}>Annuler la préparation</button>}</div>}
      {editing && !readOnly && <div className="yp-editor">
        <label className="yp-stack" htmlFor={`${id}-pitch`}>Ensemencement prévu<input id={`${id}-pitch`} type="datetime-local" min={earliest} value={form.targetPitchAt}
          onChange={event => setForm(previous => ({ ...previous, targetPitchAt: event.target.value }))} /></label>
        <label className="yp-stack" htmlFor={`${id}-start`}>Début de la préparation · facultatif<input id={`${id}-start`} type="datetime-local" value={form.startAt}
          max={latestCultureStart ? localInput(latestCultureStart) : undefined} onChange={event => setForm(previous => ({ ...previous, startAt: event.target.value }))} /></label>
        <p className="yeast-small">{latestCultureStart
          ? <>Vide : début au plus tard à <span className="yp-num">{dateTimeText(new Date(latestCultureStart).toISOString())}</span> (fenêtre {cultureOnly ? 'de culture' : 'totale'} de {fr(protocol.leadHours.max, 0)} h). Plus tôt : ta marge, non calculée.</>
          : 'Vide : début au plus tard selon la fenêtre publiée. Plus tôt : ta marge, non calculée.'}</p>
        <div className="yp-field-row"><label htmlFor={`${id}-volume`}>Volume de starter</label>
          <span className="yp-input-unit"><NumberInput id={`${id}-volume`} aria-label="Volume de starter retenu en litres" value={form.volumeL} emptyValue={undefined} min={0}
            onValue={volumeL => setForm(previous => ({ ...previous, volumeL }))} placeholder="?" /><span>L</span></span></div>
        <label className="yp-stack" htmlFor={`${id}-inoculum`}>Inoculum<Input id={`${id}-inoculum`} value={form.inoculum} placeholder="Ex. 1 pack de ce produit"
          onChange={event => setForm(previous => ({ ...previous, inoculum: event.target.value }))} /></label>
        <label className="yp-stack" htmlFor={`${id}-equipment`}>Matériel<Input id={`${id}-equipment`} value={form.equipment} placeholder="Ex. erlenmeyer 2 L, agitateur"
          onChange={event => setForm(previous => ({ ...previous, equipment: event.target.value }))} /></label>
        <p className="yeast-small">Le début doit être encore à venir : aucune préparation n’est proposée le jour même ni sans le temps publié.</p>
        {error && <p className="yeast-error" role="alert">{error}</p>}
        <div className="yp-actions"><button type="button" onClick={plan}>{preparation ? 'Enregistrer la nouvelle révision' : 'Planifier'}</button>
          <button type="button" className="yeast-link" onClick={() => { setEditing(false); setError(''); }}>Fermer sans changer</button></div>
      </div>}
    </>}
  </section>;
}

/** Wort, advice, the single planned quantity, lot and preparation of the recipe's yeast. */
export function YeastPitchingPlanPanel({ recipe, onChange, readOnly = false, quantityEditor, legacyDoseG }: PartProps & { quantityEditor?: ReactNode; legacyDoseG?: YeastQuantityRange }) {
  const stock = useYeastStock();
  const { supply, documents } = useYeastSupply();
  const [target, setTarget] = useState<CorrectionTarget>(null);
  const [receipt, setReceipt] = useState('');
  const advice = useMemo(() => evaluateYeastPitching(recipe, stock), [recipe, stock]);
  if (!recipe.yeast.name?.trim()) return null;
  const product = recipe.yeast.pitching?.product;
  const shared: SectionProps = { recipe, onChange, readOnly, advice, stock };
  // The notice goes to the exact canonical product. A bootstrap product travels as its parent BEFORE change (supply
  // version and offers, never the recipe copy that may already hold a local notice); a recipe-only product cannot.
  const inBase = !!product && documents.some(document => document.id === product.id);
  const supplied = product && !inBase ? supply.products.find(item => item.id === product.id) : undefined;
  const starterBase: StarterBase = { canPropose: inBase || !!supplied,
    parentFallback: product && supplied ? { id: product.id, version: 1, revision: 0, product: structuredClone(supplied),
      offers: supply.offers.filter(offer => offer.productId === product.id).map(offer => structuredClone(offer)) } : undefined,
    takenIds: new Set(supply.products.flatMap(item => item.starter ? [item.starter.id] : [])) };
  return <div className="yeast-workbench yp-panel yp-plan" data-pitching-method={advice.method}>
    <WortSection {...shared} />
    <AdviceSection {...shared} legacyDoseG={legacyDoseG} />
    <QuantitySection {...shared} quantityEditor={quantityEditor} />
    <LotSection {...shared} onCorrect={ref => setTarget({ scope: 'stock', ref })} />
    {product && product.form !== 'sèche' && <PreparationSection {...shared} starterBase={starterBase} />}
    <p className="yeast-small yp-scope">Choix, conseil et préparation ne consomment aucun stock ; un brassin lancé garde sa copie.</p>
    {receipt && <p className="yp-receipt" role="status">{receipt}</p>}
    <YeastDbCorrectionsPanel target={target ? { ...target, context: { recipe } } : null} onClose={() => setTarget(null)} onUpdated={next => setReceipt(receiptText(next))} />
  </div>;
}

/** Shared qualified pitching of one recipe yeast. `part` lets a journey place product and dose where each decision is taken. */
export function YeastPitchingPanel({ recipe, onChange, part = 'all', quantityEditor, readOnly = false, legacyDoseG, mode = 'recipe' }: {
  recipe: TrialRecipe; onChange: Change;
  part?: 'all' | 'supply' | 'pitching';
  /** The recipe's existing quantity editor: when given, it is the only planned quantity entry. */
  quantityEditor?: ReactNode;
  readOnly?: boolean;
  /** Former catalogue-sheet dose at recipe volume, shown distinctly only while no exact product is chosen. */
  legacyDoseG?: YeastQuantityRange;
  mode?: 'recipe' | 'simulation';
}) {
  if (!recipe.yeast.name?.trim()) return null;
  return <>
    {mode === 'simulation' && <p className="yp-simulation" role="note">Simulation · variante locale : produit, moût et quantité ne sont pas enregistrés dans la recette.</p>}
    {part !== 'pitching' && <YeastProductChoice recipe={recipe} onChange={onChange} readOnly={readOnly} />}
    {part !== 'supply' && <YeastPitchingPlanPanel recipe={recipe} onChange={onChange} readOnly={readOnly} quantityEditor={quantityEditor} legacyDoseG={legacyDoseG} />}
  </>;
}

const wortText = (wort?: YeastPitchingWort) => !wort ? 'non renseigné' : [
  wort.volumeL !== undefined ? `${fr(wort.volumeL)} L ${BASIS[volumeBasisOf(wort)!]}` : 'volume inconnu',
  wort.sg !== undefined ? `SG ${sgText(wort.sg)} ${BASIS[sgBasisOf(wort)!]}` : 'SG inconnue',
  wort.starterContribution ? `starter ${STARTER[wort.starterContribution]}` : '',
  wort.additionTiming && Object.keys(wort.additionTiming).length ? `${Object.keys(wort.additionTiming).length} ajout${Object.keys(wort.additionTiming).length > 1 ? 's' : ''} qualifié${Object.keys(wort.additionTiming).length > 1 ? 's' : ''}` : '',
].filter(Boolean).join(' · ');
const preparationText = (preparation?: YeastPreparationPlan) => !preparation ? 'aucune'
  : `${preparation.status === 'cancelled' ? 'annulée' : 'planifiée'} · ensemencement ${dateTimeText(preparation.targetPitchAt)} · révision ${preparation.revision}`;
/** Saved recipe versus draft, named in French per decision; `pitching` never appears as a raw documentary key. */
export function yeastPitchingDifferences(saved: YeastSpec, draft: YeastSpec): { id: string; label: string; before: string; after: string }[] {
  const a = saved.pitching, b = draft.pitching, rows: { id: string; label: string; before: string; after: string }[] = [];
  const push = (id: string, label: string, same: boolean, before: string, after: string) => { if (!same) rows.push({ id, label, before, after }); };
  const product = (value?: YeastProduct) => value ? `${value.label}${value.format ? '' : ' · format inconnu'}` : 'aucun';
  const sameProductId = !!a?.product && a.product.id === b?.product?.id;
  push('pitching-product', 'Produit et format', stable(a?.product) === stable(b?.product), product(a?.product),
    `${product(b?.product)}${sameProductId ? ' · fiche actualisée' : ''}`);
  const offer = (value?: YeastOffer) => value ? `${value.seller}${value.sellerCountry ? ` (${value.sellerCountry})` : ''}` : 'aucune';
  push('pitching-offer', 'Offre retenue', stable(a?.offer) === stable(b?.offer), offer(a?.offer), `${offer(b?.offer)}${a?.offer && a.offer.id === b?.offer?.id ? ' · observation actualisée' : ''}`);
  const lot = (value?: YeastLotDetails) => value ? `${value.lotNumber ? `lot ${value.lotNumber}` : 'n° de lot inconnu'} · ${value.productId ? 'format confirmé' : 'format non confirmé'}` : 'aucun';
  push('pitching-lot', 'Lot associé', stable(a?.lot) === stable(b?.lot), lot(a?.lot), lot(b?.lot));
  push('pitching-wort', 'Moût à ensemencer', stable(a?.wort) === stable(b?.wort), wortText(a?.wort), wortText(b?.wort));
  const rate = (value?: YeastPitchingPlan['rate']) => value ? `${fr(value.value, 2)} M/mL/°P · ${value.source.title}` : 'aucun';
  push('pitching-rate', 'Taux cellulaire', stable(a?.rate) === stable(b?.rate), rate(a?.rate), rate(b?.rate));
  push('pitching-preparation', 'Préparation avant J0', stable(a?.preparation) === stable(b?.preparation), preparationText(a?.preparation), preparationText(b?.preparation));
  return rows;
}
/** Product and preparation compared except the wort, which an undo of the strain keeps on purpose. */
export const yeastPitchingChoiceChanged = (before: YeastSpec, after: YeastSpec) =>
  stable({ ...before.pitching, wort: undefined }) !== stable({ ...after.pitching, wort: undefined });
/** One line for closed summaries: exact product, retained offer, preparation. */
export function yeastPitchingSummary(yeast: YeastSpec): string {
  const plan = yeast.pitching;
  if (!plan?.product) return 'Produit exact non choisi';
  return [plan.product.label, plan.offer ? `offre ${plan.offer.seller}` : '', plan.preparation && plan.preparation.status !== 'cancelled'
    ? `préparation dès ${dateTimeText(plan.preparation.startAt)}` : ''].filter(Boolean).join(' · ');
}
