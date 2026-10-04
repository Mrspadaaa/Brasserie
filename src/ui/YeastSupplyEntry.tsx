import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import type { YeastSpec } from '../types';
import { readYeastProductDocument, validYeastOffer, yeastSourceDateIsFuture, type YeastOffer, type YeastProduct, type YeastProductDocument, type YeastSupplySource } from '../../functions/src/yeastSupplySchema';
import { selectYeastProduct } from '../domain/yeastPitching';
import { YeastDbCorrections, type YeastDbCorrectionClientReceipt, type YeastDbCorrectionProposal } from '../services/yeastDbCorrections';
import { YeastDbCorrectionsPanel } from './YeastDbCorrectionsPanel';
import { NumberInput } from './NumberInput';
import { Input } from './Input';

/* Manual definition of an exact product (format) or of one offer, for the recipe's chosen reference.
   Two separate gestures: keep the definition as a recipe copy (offline, no publication), or propose it to the
   canonical base through the existing review panel (explicit apply, server receipt, readback). Nothing is
   inferred from a name or another variant: no dose, cells, viability, temperature or starter method. */

type Change = (next: TrialRecipe) => TrialRecipe | void;
const HTTPS_PAGE = /^https:\/\/[^\s/]+\/\S+$/i;
const pad = (value: number) => String(value).padStart(2, '0');
const localDay = (time = Date.now()) => { const d = new Date(time); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const localMinute = (time = Date.now()) => `${localDay(time)}T${pad(new Date(time).getHours())}:${pad(new Date(time).getMinutes())}`;
/** A new draft gets one id, kept through its corrections and its validation; an existing id is never reused. */
const freshId = (prefix: 'yeast-product-manual' | 'yeast-offer-manual' | 'yeast-starter-manual', taken: ReadonlySet<string>) => {
  let id = `${prefix}-${crypto.randomUUID()}`;
  while (taken.has(id)) id = `${prefix}-${crypto.randomUUID()}`;
  return id;
};
/** Day or minute typed by the brewer; the future is refused, never shifted. */
const checkedAt = (value: string, label: string, errors: string[]) => {
  const time = Date.parse(value);
  if (!value || !Number.isFinite(time)) { errors.push(`${label} : date de relevé à renseigner.`); return ''; }
  if (yeastSourceDateIsFuture(value)) { errors.push(`${label} : date de relevé dans le futur.`); return ''; }
  return /T/.test(value) ? new Date(time).toISOString() : value;
};
const manualSource = (title: string, url: string, at: string, label: string, errors: string[]): YeastSupplySource => {
  if (!title.trim()) errors.push(`${label} : titre de la source à renseigner.`);
  if (!HTTPS_PAGE.test(url.trim())) errors.push(`${label} : lien https vers la page exacte à renseigner.`);
  return { title: title.trim(), url: url.trim(), checkedAt: checkedAt(at, label, errors), origin: 'manual' };
};
const receiptLine = (receipt: YeastDbCorrectionClientReceipt, entity: 'product' | 'offer') => {
  const created = receipt.entityCreated ?? entity;
  const main = created === 'offer'
    ? `Offre ajoutée à la fiche produit dans la base, confirmée par le serveur.${receipt.targetCreated ? ' La fiche produit parente n’y existait pas encore : elle a été créée par cette même écriture.' : ''}`
    : receipt.targetCreated ? 'Fiche produit créée dans la base, confirmée par le serveur.' : 'Fiche produit enregistrée dans la base, confirmée par le serveur.';
  return `${main}${receipt.readback === 'pending' ? ' La copie de cet appareil reste à actualiser ; la définition confirmée reste disponible ici.' : ''}`;
};

/** Error list focused on validation: every message names its field, the draft stays as typed. */
function Errors({ errors, focus }: { errors: string[]; focus: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (focus && errors.length) ref.current?.focus(); }, [focus]);
  if (!errors.length) return null;
  return <div ref={ref} tabIndex={-1} role="alert" className="yeast-error yp-entry-errors"><p>À corriger avant de continuer :</p><ul>{errors.map(error => <li key={error}>{error}</li>)}</ul></div>;
}
type Status = { kind: 'local' | 'busy' | 'review' | 'confirmed' | 'dismissed' | 'error'; text: string } | null;
function StatusLine({ status }: { status: Status }) {
  if (!status) return null;
  return <p className="yp-entry-state" data-entry-state={status.kind} role={status.kind === 'error' ? 'alert' : 'status'}>{status.text}</p>;
}

/* ---------- Exact product / format ---------- */
type ProductDraft = { id: string; label: string; manufacturer: string; form: '' | YeastProduct['form']; format: '' | 'known' | 'unknown';
  amount?: number; unit: 'g' | 'mL'; formatLabel: string; sourceTitle: string; sourceUrl: string; checkedAt: string };
const productDraft = (yeast: YeastSpec, taken: ReadonlySet<string>, existing?: YeastProduct): ProductDraft => existing ? {
  id: existing.id, label: existing.label, manufacturer: existing.manufacturer, form: existing.form, format: existing.format ? 'known' : 'unknown',
  amount: existing.format?.amount, unit: existing.format?.unit ?? 'g', formatLabel: existing.format?.label ?? '',
  sourceTitle: existing.source.title, sourceUrl: existing.source.url, checkedAt: existing.source.checkedAt.slice(0, 10),
} : {
  // The manufacturer may come from the documented identity; the format never comes from another variant.
  id: freshId('yeast-product-manual', taken), label: '', manufacturer: yeast.lab?.trim() ?? '',
  form: yeast.form === 'sèche' || yeast.form === 'liquide' || yeast.form === 'levain' ? yeast.form : '', format: '',
  amount: undefined, unit: 'g', formatLabel: '', sourceTitle: '', sourceUrl: '', checkedAt: localDay(),
};
function buildProduct(draft: ProductDraft, referenceId: string, existing?: YeastProduct): { product?: YeastProduct; errors: string[] } {
  const errors: string[] = [];
  if (!draft.label.trim()) errors.push('Nom ou variante exacte à renseigner.');
  if (!draft.manufacturer.trim()) errors.push('Fabricant à renseigner.');
  if (!draft.form) errors.push('Forme à choisir.');
  if (!draft.format) errors.push('Format : indique s’il est connu ou inconnu.');
  if (draft.format === 'known' && !(typeof draft.amount === 'number' && draft.amount > 0)) errors.push('Format : quantité supérieure à zéro à renseigner.');
  const source = manualSource(draft.sourceTitle, draft.sourceUrl, draft.checkedAt, 'Source du produit', errors);
  if (errors.length) return { errors };
  const product: YeastProduct = { ...existing, id: draft.id, referenceId, label: draft.label.trim(), manufacturer: draft.manufacturer.trim(), form: draft.form as YeastProduct['form'], source,
    format: draft.format === 'known' ? { amount: draft.amount!, unit: draft.unit, label: draft.formatLabel.trim() || `${draft.amount!.toLocaleString('fr-FR')} ${draft.unit}`, source } : undefined };
  const document = readYeastProductDocument({ id: product.id, version: 1, revision: 0, product, offers: [] });
  return document ? { product: document.product, errors: [] } : { errors: ['Définition refusée par le schéma produit : vérifie nom, fabricant, forme, format et source.'] };
}

/** Exact product or format of the recipe's reference, typed by the brewer. */
export function YeastProductEntry({ recipe, onChange, existing, takenIds, onClose }: {
  recipe: TrialRecipe; onChange: Change;
  /** A recipe copy being corrected keeps its id; otherwise a new id is generated once. */
  existing?: YeastProduct;
  /** Ids already used by product documents or the bootstrap: never reused. */
  takenIds: ReadonlySet<string>;
  onClose: () => void;
}) {
  const id = useId();
  const first = useRef<HTMLFieldSetElement>(null);
  const yeast = recipe.yeast, referenceId = yeast.hopIndexId ?? '';
  const [draft, setDraft] = useState(() => productDraft(yeast, takenIds, existing));
  const [errors, setErrors] = useState<string[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<Status>(null);
  const [proposal, setProposal] = useState<YeastDbCorrectionProposal | null>(null);
  const [submitted, setSubmitted] = useState<YeastProduct>();
  const [confirmed, setConfirmed] = useState<{ product: YeastProduct; receipt: YeastDbCorrectionClientReceipt }>();
  useEffect(() => { requestAnimationFrame(() => first.current?.querySelector<HTMLElement>('input, textarea, select')?.focus()); }, []);
  const set = (patch: Partial<ProductDraft>) => { setDraft(previous => ({ ...previous, ...patch })); if (errors.length) setErrors([]); };
  const validate = () => {
    const result = buildProduct(draft, referenceId, existing);
    setErrors(result.errors); setAttempt(count => count + 1);
    return result.product;
  };
  const choose = (product: YeastProduct, text: string) => {
    try { onChange({ ...recipe, yeast: selectYeastProduct(yeast, product) }); setStatus({ kind: 'local', text }); }
    catch (e) { setStatus({ kind: 'error', text: e instanceof Error ? e.message : 'Ce produit ne peut pas être retenu pour cette référence.' }); }
  };
  const retain = () => {
    const product = validate();
    if (product) choose(product, 'Retenu dans la recette comme copie locale, source saisie à la main. Cette action ne publie rien dans la base ; quantité, unité et moût restent inchangés.');
  };
  const propose = async () => {
    const product = validate();
    if (!product) return;
    setSubmitted(structuredClone(product));
    setStatus({ kind: 'busy', text: 'Préparation de la proposition de création…' });
    try {
      const next = await YeastDbCorrections.proposeProductCreation({ id: product.id, version: 1, revision: 0, product, offers: [] }, { recipe });
      setProposal(next);
      setStatus({ kind: 'review', text: 'Proposition prête : relis l’avant/après dans le panneau, puis confirme. Rien n’est écrit avant ta confirmation.' });
    } catch (e) { setStatus({ kind: 'error', text: `${e instanceof Error ? e.message : 'La proposition n’a pas pu être préparée.'} La définition reste modifiable.` }); }
  };
  const chosenId = yeast.pitching?.product?.id;
  const busy = status?.kind === 'busy';
  return <div className="yp-editor yp-entry" role="group" aria-labelledby={`${id}-title`} data-entry="product" data-entry-id={draft.id}>
    <h5 id={`${id}-title`} className="yp-entry-title">{existing ? 'Corriger la définition du produit exact' : `Définir un produit exact de ${yeast.name}`}</h5>
    <p className="yeast-small">Lié à la référence choisie. Saisis seulement ce que la source montre : aucune dose, cellule, température ni méthode n’est déduite du nom ou du format.</p>
    <fieldset ref={first} className="yp-entry-fields" disabled={busy || !!proposal || !!confirmed}>
      <legend className="sr-only">Définition du produit</legend>
      <label className="yp-stack" htmlFor={`${id}-label`}>Nom ou variante exacte<Input id={`${id}-label`} value={draft.label} onChange={e => set({ label: e.target.value })} placeholder={`${yeast.name} — format`} /></label>
      <label className="yp-stack" htmlFor={`${id}-maker`}>Fabricant<Input id={`${id}-maker`} value={draft.manufacturer} onChange={e => set({ manufacturer: e.target.value })} />
        {!existing && yeast.lab?.trim() && draft.manufacturer === yeast.lab.trim() && <span className="yeast-small">Repris de l’identité documentée de la levure ; modifiable.</span>}</label>
      <label className="yp-stack" htmlFor={`${id}-form`}>Forme<select id={`${id}-form`} value={draft.form} onChange={e => set({ form: e.target.value as ProductDraft['form'] })}>
        <option value="">À choisir…</option><option value="sèche">Sèche</option><option value="liquide">Liquide</option><option value="levain">Levain / culture</option></select></label>
      <label className="yp-stack" htmlFor={`${id}-format`}>Format du conditionnement<select id={`${id}-format`} value={draft.format} onChange={e => set({ format: e.target.value as ProductDraft['format'] })}>
        <option value="">À préciser…</option><option value="known">Connu : quantité par sachet ou pack</option><option value="unknown">Inconnu : packs non calculables</option></select></label>
      {draft.format === 'known' && <div className="yp-field-row">
        <label htmlFor={`${id}-amount`}>Contenu</label>
        <span className="yp-input-unit"><NumberInput id={`${id}-amount`} aria-label="Contenu d’un sachet ou pack" value={draft.amount} emptyValue={undefined} min={0} onValue={amount => set({ amount })} placeholder="?" />
          <select aria-label="Unité du contenu" value={draft.unit} onChange={e => set({ unit: e.target.value as 'g' | 'mL' })}><option value="g">g</option><option value="mL">mL</option></select></span>
        <label className="yp-stack yp-entry-wide" htmlFor={`${id}-format-label`}>Libellé du format · facultatif<Input id={`${id}-format-label`} value={draft.formatLabel} onChange={e => set({ formatLabel: e.target.value })} placeholder="Ex. sachet 11 g" /></label>
      </div>}
      <fieldset className="yp-entry-source"><legend>Source · page consultée</legend>
        <label className="yp-stack" htmlFor={`${id}-source-title`}>Titre<Input id={`${id}-source-title`} value={draft.sourceTitle} onChange={e => set({ sourceTitle: e.target.value })} placeholder="Fiche fabricant ou vendeur du format exact" /></label>
        <label className="yp-stack" htmlFor={`${id}-source-url`}>Lien https<Input id={`${id}-source-url`} type="url" value={draft.sourceUrl} onChange={e => set({ sourceUrl: e.target.value })} placeholder="https://…" /></label>
        <label className="yp-stack" htmlFor={`${id}-source-date`}>Relevé le<input id={`${id}-source-date`} type="date" max={localDay()} value={draft.checkedAt} onChange={e => set({ checkedAt: e.target.value })} /></label>
        <p className="yeast-small">Source saisie à la main : elle situe les valeurs, sans prouver leur exactitude ni une lecture serveur.</p>
      </fieldset>
    </fieldset>
    <Errors errors={errors} focus={attempt} />
    <StatusLine status={status} />
    {!confirmed && <div className="yp-actions">
      <button type="button" disabled={busy} onClick={retain}>{existing ? 'Garder cette correction dans la recette' : 'Retenir cette définition dans la recette'}</button>
      <button type="button" disabled={busy} onClick={propose}>{busy ? 'Préparation…' : 'Créer la fiche dans la base'}</button>
      <button type="button" className="yeast-link" disabled={busy} onClick={onClose}>{status?.kind === 'local' ? 'Fermer' : 'Annuler'}</button>
    </div>}
    {confirmed && <div className="yp-actions">
      {chosenId !== confirmed.product.id && <button type="button" onClick={() => choose(confirmed.product, 'Produit confirmé retenu dans la recette ; quantité, unité et moût restent inchangés.')}>Choisir ce produit dans la recette</button>}
      <button type="button" className="yeast-link" onClick={onClose}>Fermer</button>
    </div>}
    <YeastDbCorrectionsPanel target={proposal?.target ?? null} initialProposal={proposal ?? undefined}
      onClose={() => { setProposal(null); if (!confirmed) setStatus({ kind: 'dismissed', text: 'Panneau fermé sans confirmation : rien n’a été écrit dans la base. La définition reste modifiable.' }); }}
      onUpdated={receipt => {
        if (submitted) setConfirmed({ product: submitted, receipt });
        setStatus({ kind: 'confirmed', text: `${receiptLine(receipt, 'product')} Ce reçu ne change pas le produit de la recette.` });
      }} />
  </div>;
}

/* ---------- Offer of the exact product ---------- */
type SourceDraft = { title: string; url: string; checkedAt: string };
type OfferDraft = { id: string; seller: string; url: string; sku: string; pageTitle: string; checkedAt: string;
  country: string; countryOwn: boolean; countrySource: SourceDraft;
  stock: YeastOffer['stock']['status']; stockText: string; stockOwn: boolean; stockSource: SourceDraft;
  shipping: '' | NonNullable<YeastOffer['shipping']>['status']; shippingConditions: string; shippingOwn: boolean; shippingSource: SourceDraft;
  price?: number; currency: 'CHF' | 'EUR'; packs?: number; priceOwn: boolean; priceSource: SourceDraft };
const emptySource = (): SourceDraft => ({ title: '', url: '', checkedAt: localMinute() });
const sourceDraft = (source: YeastSupplySource): SourceDraft => ({ title: source.title, url: source.url,
  checkedAt: /T/.test(source.checkedAt) ? localMinute(Date.parse(source.checkedAt)) : `${source.checkedAt.slice(0, 10)}T00:00` });
const sameSource = (a?: YeastSupplySource, b?: YeastSupplySource) => !!a && !!b && a.title === b.title && a.url === b.url && a.checkedAt === b.checkedAt;
const offerDraft = (taken: ReadonlySet<string>, existing?: YeastOffer): OfferDraft => {
  if (!existing) return { id: freshId('yeast-offer-manual', taken), seller: '', url: '', sku: '', pageTitle: '', checkedAt: localMinute(),
    country: '', countryOwn: false, countrySource: emptySource(), stock: 'unknown', stockText: '', stockOwn: false, stockSource: emptySource(),
    shipping: '', shippingConditions: '', shippingOwn: false, shippingSource: emptySource(), currency: 'CHF', packs: 1, priceOwn: false, priceSource: emptySource() };
  const main = existing.stock.source;
  return { id: existing.id, seller: existing.seller, url: existing.url, sku: existing.sku ?? '', pageTitle: main.title, checkedAt: sourceDraft(main).checkedAt,
    country: existing.sellerCountry ?? '', countryOwn: !!existing.sellerSource && !sameSource(existing.sellerSource, main), countrySource: existing.sellerSource ? sourceDraft(existing.sellerSource) : emptySource(),
    stock: existing.stock.status, stockText: existing.stock.text, stockOwn: false, stockSource: emptySource(),
    shipping: existing.shipping?.status ?? '', shippingConditions: existing.shipping?.conditions ?? '', shippingOwn: !!existing.shipping && !sameSource(existing.shipping.source, main),
    shippingSource: existing.shipping ? sourceDraft(existing.shipping.source) : emptySource(),
    price: existing.price?.amount, currency: existing.price?.currency ?? 'CHF', packs: existing.price?.packs ?? 1, priceOwn: !!existing.price && !sameSource(existing.price.source, main),
    priceSource: existing.price ? sourceDraft(existing.price.source) : emptySource() };
};
function buildOffer(draft: OfferDraft, productId: string): { offer?: YeastOffer; errors: string[] } {
  const errors: string[] = [];
  if (!draft.seller.trim()) errors.push('Vendeur à renseigner.');
  if (!HTTPS_PAGE.test(draft.url.trim())) errors.push('Page de l’offre : lien https exact à renseigner.');
  // The offer page is the common source; a fact read elsewhere or at another time keeps its own source and date.
  const page = manualSource(draft.pageTitle, draft.url, draft.checkedAt, 'Page de l’offre', errors);
  const sourceFor = (own: boolean, source: SourceDraft, label: string) => own ? manualSource(source.title, source.url, source.checkedAt, label, errors) : page;
  const country = draft.country.trim().toUpperCase();
  if (country && !/^[A-Z]{2}$/.test(country)) errors.push('Pays du vendeur : code à deux lettres (CH, FR, DE…) ou vide.');
  if (draft.stock !== 'unknown' && !draft.stockText.trim()) errors.push('Stock : recopie le texte vu sur la page.');
  if (draft.shipping && draft.shipping !== 'unknown' && !draft.shippingConditions.trim()) errors.push('Livraison CH : recopie les conditions lues.');
  if (draft.price !== undefined && !(draft.price >= 0)) errors.push('Prix : montant positif ou vide.');
  if (draft.price !== undefined && !(typeof draft.packs === 'number' && draft.packs > 0)) errors.push('Prix : nombre de sachets ou packs de la base de prix à renseigner.');
  const offer: YeastOffer = { id: draft.id, productId, seller: draft.seller.trim(), url: draft.url.trim(), ...(draft.sku.trim() ? { sku: draft.sku.trim() } : {}),
    ...(country ? { sellerCountry: country, sellerSource: sourceFor(draft.countryOwn, draft.countrySource, 'Pays du vendeur') } : {}),
    // An unknown stock stays unknown: its text says so and creates no availability.
    stock: { status: draft.stock, text: draft.stockText.trim() || 'Disponibilité non relevée sur la page.', source: sourceFor(draft.stockOwn, draft.stockSource, 'Stock') },
    ...(draft.shipping ? { shipping: { destination: 'CH' as const, status: draft.shipping, conditions: draft.shippingConditions.trim() || 'Livraison vers la Suisse non précisée par la source.',
      source: sourceFor(draft.shippingOwn, draft.shippingSource, 'Livraison CH') } } : {}),
    ...(draft.price !== undefined ? { price: { amount: draft.price, currency: draft.currency, packs: draft.packs ?? 1, source: sourceFor(draft.priceOwn, draft.priceSource, 'Prix') } } : {}) };
  if (errors.length) return { errors };
  return validYeastOffer(offer) ? { offer: structuredClone(offer), errors: [] } : { errors: ['Offre refusée par le schéma : vérifie vendeur, page, stock, livraison, prix et sources.'] };
}

/** A fact covered by the offer page, or read on its own source at its own date. */
function OwnSource({ id, label, own, source, onOwn, onSource }: { id: string; label: string; own: boolean; source: SourceDraft; onOwn: (own: boolean) => void; onSource: (source: SourceDraft) => void }) {
  return <div className="yp-entry-own">
    <label className="yeast-check"><input type="checkbox" checked={!own} onChange={e => onOwn(!e.target.checked)} /><span>{label} relevé sur la page de l’offre, à la même date</span></label>
    {own && <div className="yp-entry-fields">
      <label className="yp-stack" htmlFor={`${id}-title`}>Titre de sa source<Input id={`${id}-title`} value={source.title} onChange={e => onSource({ ...source, title: e.target.value })} /></label>
      <label className="yp-stack" htmlFor={`${id}-url`}>Lien https<Input id={`${id}-url`} type="url" value={source.url} onChange={e => onSource({ ...source, url: e.target.value })} placeholder="https://…" /></label>
      <label className="yp-stack" htmlFor={`${id}-date`}>Relevé le<input id={`${id}-date`} type="datetime-local" max={localMinute()} value={source.checkedAt} onChange={e => onSource({ ...source, checkedAt: e.target.value })} /></label>
    </div>}
  </div>;
}

/** One offer of the exact product retained in the recipe. It is tied to that product id only. */
export function YeastOfferEntry({ recipe, onChange, product, parentFallback, existing, takenIds, onClose }: {
  recipe: TrialRecipe; onChange: Change; product: YeastProduct;
  /** Parent document before the append (without the new offer), when the base does not hold it yet. */
  parentFallback?: YeastProductDocument;
  existing?: YeastOffer;
  takenIds: ReadonlySet<string>;
  onClose: () => void;
}) {
  const id = useId();
  const first = useRef<HTMLFieldSetElement>(null);
  const yeast = recipe.yeast;
  const [draft, setDraft] = useState(() => offerDraft(takenIds, existing));
  const [errors, setErrors] = useState<string[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<Status>(null);
  const [proposal, setProposal] = useState<YeastDbCorrectionProposal | null>(null);
  const [submitted, setSubmitted] = useState<YeastOffer>();
  const [confirmed, setConfirmed] = useState<YeastOffer>();
  useEffect(() => { requestAnimationFrame(() => first.current?.querySelector<HTMLElement>('input, textarea, select')?.focus()); }, []);
  const set = (patch: Partial<OfferDraft>) => { setDraft(previous => ({ ...previous, ...patch })); if (errors.length) setErrors([]); };
  const validate = () => { const result = buildOffer(draft, product.id); setErrors(result.errors); setAttempt(count => count + 1); return result.offer; };
  const retainOffer = (offer: YeastOffer, text: string) => {
    try { onChange({ ...recipe, yeast: selectYeastProduct(yeast, product, offer) }); setStatus({ kind: 'local', text }); }
    catch (e) { setStatus({ kind: 'error', text: e instanceof Error ? e.message : 'Cette offre ne peut pas être retenue pour ce produit.' }); }
  };
  const retain = () => {
    const offer = validate();
    if (offer) retainOffer(offer, 'Offre retenue dans la recette comme copie locale, source saisie à la main. Aucun achat, réservation ni débit ; cette action ne publie rien dans la base.');
  };
  const propose = async () => {
    const offer = validate();
    if (!offer) return;
    setSubmitted(structuredClone(offer));
    setStatus({ kind: 'busy', text: 'Préparation de la proposition d’ajout…' });
    try {
      const next = await YeastDbCorrections.proposeOfferCreation({ id: product.id, ...(parentFallback ? { fallback: parentFallback } : {}), context: { recipe } }, offer);
      setProposal(next);
      setStatus({ kind: 'review', text: 'Proposition prête : relis l’avant/après dans le panneau, puis confirme. Les offres existantes ne sont pas remplacées.' });
    } catch (e) { setStatus({ kind: 'error', text: `${e instanceof Error ? e.message : 'La proposition n’a pas pu être préparée.'} L’offre reste modifiable.` }); }
  };
  const busy = status?.kind === 'busy';
  const retainedId = yeast.pitching?.offer?.id;
  const sources = {
    country: { own: draft.countryOwn, source: draft.countrySource, onOwn: (own: boolean) => set({ countryOwn: own }), onSource: (source: SourceDraft) => set({ countrySource: source }) },
    stock: { own: draft.stockOwn, source: draft.stockSource, onOwn: (own: boolean) => set({ stockOwn: own }), onSource: (source: SourceDraft) => set({ stockSource: source }) },
    shipping: { own: draft.shippingOwn, source: draft.shippingSource, onOwn: (own: boolean) => set({ shippingOwn: own }), onSource: (source: SourceDraft) => set({ shippingSource: source }) },
    price: { own: draft.priceOwn, source: draft.priceSource, onOwn: (own: boolean) => set({ priceOwn: own }), onSource: (source: SourceDraft) => set({ priceSource: source }) },
  };
  const sourceField = (key: keyof typeof sources, label: string): ReactNode => <OwnSource id={`${id}-${key}`} label={label} {...sources[key]} />;
  return <div className="yp-editor yp-entry" role="group" aria-labelledby={`${id}-title`} data-entry="offer" data-entry-id={draft.id}>
    <h5 id={`${id}-title`} className="yp-entry-title">{existing ? 'Corriger la définition de l’offre' : `Définir une offre pour ${product.label}`}</h5>
    <p className="yeast-small">Liée à ce produit exact seulement. Les valeurs inconnues restent inconnues ; aucun coût livré, port, douane ni conversion de devise n’est calculé.</p>
    <fieldset ref={first} className="yp-entry-fields" disabled={busy || !!proposal || !!confirmed}>
      <legend className="sr-only">Définition de l’offre</legend>
      <label className="yp-stack" htmlFor={`${id}-seller`}>Vendeur<Input id={`${id}-seller`} value={draft.seller} onChange={e => set({ seller: e.target.value })} /></label>
      <fieldset className="yp-entry-source"><legend>Page de l’offre · source commune</legend>
        <label className="yp-stack" htmlFor={`${id}-url`}>Lien https de la page exacte<Input id={`${id}-url`} type="url" value={draft.url} onChange={e => set({ url: e.target.value })} placeholder="https://…" /></label>
        <label className="yp-stack" htmlFor={`${id}-page-title`}>Titre de la page<Input id={`${id}-page-title`} value={draft.pageTitle} onChange={e => set({ pageTitle: e.target.value })} /></label>
        <label className="yp-stack" htmlFor={`${id}-date`}>Relevé le<input id={`${id}-date`} type="datetime-local" max={localMinute()} value={draft.checkedAt} onChange={e => set({ checkedAt: e.target.value })} /></label>
        <label className="yp-stack" htmlFor={`${id}-sku`}>Référence vendeur · facultatif<Input id={`${id}-sku`} value={draft.sku} onChange={e => set({ sku: e.target.value })} /></label>
      </fieldset>
      <fieldset className="yp-entry-source"><legend>Pays du vendeur · facultatif</legend>
        <label className="yp-stack" htmlFor={`${id}-country`}>Code pays<Input id={`${id}-country`} value={draft.country} onChange={e => set({ country: e.target.value })} placeholder="CH, FR, DE… ou vide" /></label>
        <p className="yeast-small">Pays de l’adresse du vendeur (mentions légales), jamais celui du laboratoire. Vide : non sourcé.</p>
        {draft.country.trim() && sourceField('country', 'Pays')}
      </fieldset>
      <fieldset className="yp-entry-source"><legend>Stock annoncé</legend>
        <label className="yp-stack" htmlFor={`${id}-stock`}>État<select id={`${id}-stock`} value={draft.stock} onChange={e => set({ stock: e.target.value as OfferDraft['stock'] })}>
          <option value="unknown">Inconnu</option><option value="in-stock">En stock · annoncé</option><option value="out-of-stock">Hors stock · annoncé</option></select></label>
        {draft.stock !== 'unknown' && <label className="yp-stack" htmlFor={`${id}-stock-text`}>Texte vu sur la page<Input id={`${id}-stock-text`} value={draft.stockText} onChange={e => set({ stockText: e.target.value })} /></label>}
        {sourceField('stock', 'Stock')}
      </fieldset>
      <fieldset className="yp-entry-source"><legend>Livraison vers la Suisse</legend>
        <label className="yp-stack" htmlFor={`${id}-shipping`}>État<select id={`${id}-shipping`} value={draft.shipping} onChange={e => set({ shipping: e.target.value as OfferDraft['shipping'] })}>
          <option value="">Non relevée</option><option value="unknown">Non précisée par la source</option><option value="yes">Oui · conditions lues</option><option value="no">Non · refus lu</option></select></label>
        {draft.shipping && draft.shipping !== 'unknown' && <label className="yp-stack" htmlFor={`${id}-shipping-text`}>Conditions lues<Input id={`${id}-shipping-text`} value={draft.shippingConditions} onChange={e => set({ shippingConditions: e.target.value })} placeholder="Frais, délais, restrictions…" /></label>}
        {draft.shipping && sourceField('shipping', 'Livraison')}
      </fieldset>
      <fieldset className="yp-entry-source"><legend>Prix affiché · facultatif</legend>
        <div className="yp-field-row"><label htmlFor={`${id}-price`}>Montant</label>
          <span className="yp-input-unit"><NumberInput id={`${id}-price`} aria-label="Prix affiché" value={draft.price} emptyValue={undefined} min={0} onValue={price => set({ price })} placeholder="vide" />
            <select aria-label="Devise du prix" value={draft.currency} onChange={e => set({ currency: e.target.value as 'CHF' | 'EUR' })}><option value="CHF">CHF</option><option value="EUR">EUR</option></select></span></div>
        {draft.price !== undefined && <div className="yp-field-row"><label htmlFor={`${id}-packs`}>Pour</label>
          <span className="yp-input-unit"><NumberInput id={`${id}-packs`} integer aria-label="Nombre de sachets ou packs de la base de prix" value={draft.packs} emptyValue={undefined} min={1} onValue={packs => set({ packs })} /><span>sachet(s) ou pack(s)</span></span></div>}
        {draft.price !== undefined && sourceField('price', 'Prix')}
        {draft.price !== undefined && <p className="yeast-small">Prix relevé tel qu’affiché, hors port et douane ; il vieillit comme observation datée.</p>}
      </fieldset>
    </fieldset>
    <Errors errors={errors} focus={attempt} />
    <StatusLine status={status} />
    {!confirmed && <div className="yp-actions">
      <button type="button" disabled={busy} onClick={retain}>{existing ? 'Garder cette correction dans la recette' : 'Retenir cette offre dans la recette'}</button>
      <button type="button" disabled={busy} onClick={propose}>{busy ? 'Préparation…' : 'Ajouter l’offre à la base'}</button>
      <button type="button" className="yeast-link" disabled={busy} onClick={onClose}>{status?.kind === 'local' ? 'Fermer' : 'Annuler'}</button>
    </div>}
    {confirmed && <div className="yp-actions">
      {retainedId !== confirmed.id && <button type="button" onClick={() => retainOffer(confirmed, 'Offre confirmée retenue dans la recette ; aucun achat, réservation ni débit.')}>Retenir cette offre dans la recette</button>}
      <button type="button" className="yeast-link" onClick={onClose}>Fermer</button>
    </div>}
    <YeastDbCorrectionsPanel target={proposal?.target ?? null} initialProposal={proposal ?? undefined}
      onClose={() => { setProposal(null); if (!confirmed) setStatus({ kind: 'dismissed', text: 'Panneau fermé sans confirmation : rien n’a été ajouté à la base. L’offre reste modifiable.' }); }}
      onUpdated={receipt => {
        if (submitted) setConfirmed(submitted);
        setStatus({ kind: 'confirmed', text: `${receiptLine(receipt, 'offer')} Ce reçu ne retient pas l’offre dans la recette.` });
      }} />
  </div>;
}

/* Shared by the other manual entries (starter notice): same errors, states, ids, dates and manual sources. */
export { Errors as YeastEntryErrors, StatusLine as YeastEntryStatus, manualSource as yeastManualSource, localDay as yeastLocalDay, freshId as yeastFreshId };
export type { Status as YeastEntryStatusValue };
