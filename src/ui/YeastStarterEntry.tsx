import { useEffect, useId, useRef, useState } from 'react';
import type { TrialRecipe } from '../domain/hopIndex/trials';
import { validYeastStarterProtocol, type YeastProduct, type YeastProductDocument, type YeastStarterProtocol } from '../../functions/src/yeastSupplySchema';
import { YeastDbCorrections, type YeastDbCorrectionClientReceipt, type YeastDbCorrectionProposal } from '../services/yeastDbCorrections';
import { YeastDbCorrectionsPanel } from './YeastDbCorrectionsPanel';
import { NumberInput } from './NumberInput';
import { Input, Textarea } from './Input';
import { YeastEntryErrors, YeastEntryStatus, yeastFreshId, yeastLocalDay, yeastManualSource, type YeastEntryStatusValue } from './YeastSupplyEntry';

/* Manual, sourced starter notice of one exact liquid/culture product. The notice is not a plan and not a culture:
   planning stays in « Préparation avant J0 ». Nothing is defaulted from biology: no medium other than malt extract,
   no average duration, no growth or cell count. Two gestures, as for products and offers: keep the notice as a
   recipe copy (offline), or propose it to the canonical base through the review panel (explicit apply, receipt). */

type Draft = { id: string; label: string; method: string; medium: '' | 'malt-extract' | 'other'; targetSg?: number;
  leadMin?: number; leadMax?: number; meaning: '' | NonNullable<YeastStarterProtocol['leadHoursMeaning']>; conditions: string; steps: string[];
  sourceTitle: string; sourceUrl: string; checkedAt: string };
const draftFrom = (taken: ReadonlySet<string>, existing?: YeastStarterProtocol): Draft => existing ? {
  // An existing protocol keeps its id; its meaning must be stated if the notice never said it.
  id: existing.id, label: existing.label, method: existing.method, medium: 'malt-extract', targetSg: existing.targetSg,
  leadMin: existing.leadHours.min, leadMax: existing.leadHours.max === existing.leadHours.min ? undefined : existing.leadHours.max,
  meaning: existing.leadHoursMeaning ?? '', conditions: existing.conditions, steps: [...existing.steps],
  sourceTitle: existing.source.title, sourceUrl: existing.source.url, checkedAt: existing.source.checkedAt.slice(0, 10),
} : { id: yeastFreshId('yeast-starter-manual', taken), label: '', method: '', medium: '', meaning: '', conditions: '', steps: [''],
  sourceTitle: '', sourceUrl: '', checkedAt: yeastLocalDay() };
/** An unchanged day keeps the original timestamp; a new day is a Swiss calendar date. */
const sourceDate = (draft: Draft, existing?: YeastStarterProtocol) =>
  existing && draft.checkedAt === existing.source.checkedAt.slice(0, 10) ? existing.source.checkedAt : draft.checkedAt;
function buildProtocol(draft: Draft, existing?: YeastStarterProtocol): { protocol?: YeastStarterProtocol; errors: string[] } {
  const errors: string[] = [];
  if (!draft.label.trim()) errors.push('Nom de la méthode à renseigner.');
  if (!draft.method.trim()) errors.push('Description de la méthode à renseigner.');
  if (!draft.medium) errors.push('Milieu de la notice à préciser.');
  if (draft.medium === 'other') errors.push('Milieu autre que l’extrait de malt : non pris en charge ici ; aucune préparation ne peut s’appuyer sur cette notice.');
  if (draft.targetSg === undefined) errors.push('SG cible publiée à renseigner.');
  else if (!(draft.targetSg > 1 && draft.targetSg <= 1.1)) errors.push('SG cible : supérieure à 1,000 et au plus 1,100.');
  if (!(typeof draft.leadMin === 'number' && draft.leadMin > 0)) errors.push('Durée publiée : valeur ou minimum en heures à renseigner.');
  if (draft.leadMax !== undefined && !(typeof draft.leadMin === 'number' && draft.leadMax >= draft.leadMin)) errors.push('Durée publiée : le maximum doit être au moins égal au minimum.');
  if (!draft.meaning) errors.push('Durée publiée : indique si elle couvre la culture seule ou toute la préparation.');
  if (!draft.conditions.trim()) errors.push('Conditions de la notice à renseigner.');
  const steps = draft.steps.map(step => step.trim()).filter(Boolean);
  if (!steps.length) errors.push('Au moins une étape de la notice à renseigner.');
  if (steps.length > 20) errors.push('20 étapes au plus.');
  const source = yeastManualSource(draft.sourceTitle, draft.sourceUrl, sourceDate(draft, existing), 'Source de la notice', errors);
  if (errors.length) return { errors };
  const protocol: YeastStarterProtocol = { id: draft.id, label: draft.label.trim(), source, method: draft.method.trim(), medium: 'malt-extract',
    targetSg: draft.targetSg!, conditions: draft.conditions.trim(), leadHours: { min: draft.leadMin!, max: draft.leadMax ?? draft.leadMin! },
    leadHoursMeaning: draft.meaning as NonNullable<YeastStarterProtocol['leadHoursMeaning']>, steps };
  return validYeastStarterProtocol(protocol) ? { protocol: structuredClone(protocol), errors: [] }
    : { errors: ['Notice refusée par le schéma : vérifie nom, description, SG, durée, conditions, étapes et source.'] };
}
const sameProtocol = (a?: YeastStarterProtocol, b?: YeastStarterProtocol) => !!a && !!b && JSON.stringify(a) === JSON.stringify(b);

/** Sourced starter notice of the recipe's exact product, typed by the brewer. */
export function YeastStarterEntry({ recipe, product, existing, parentFallback, canPropose, takenIds, onRetain, onClose }: {
  recipe: TrialRecipe;
  /** The exact product copy of the recipe; the notice never leaves this product. */
  product: YeastProduct;
  /** The notice being corrected keeps its id; otherwise a new id is generated once for the draft. */
  existing?: YeastStarterProtocol;
  /** Parent document before the change, with its offers, only when the base does not hold it yet. */
  parentFallback?: YeastProductDocument;
  /** False for a product only kept in the recipe: its product sheet must be created in the base first. */
  canPropose: boolean;
  takenIds: ReadonlySet<string>;
  /** Writes the notice into the recipe's product copy only (quantity, wort, lot, rate, offer untouched). */
  onRetain: (protocol: YeastStarterProtocol) => void;
  onClose: () => void;
}) {
  const id = useId();
  const first = useRef<HTMLFieldSetElement>(null);
  const [draft, setDraft] = useState(() => draftFrom(takenIds, existing));
  const [errors, setErrors] = useState<string[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<YeastEntryStatusValue>(null);
  const [proposal, setProposal] = useState<YeastDbCorrectionProposal | null>(null);
  // The notice submitted for review is frozen: the receipt and a later adoption use this exact snapshot.
  const [submitted, setSubmitted] = useState<YeastStarterProtocol>();
  const [confirmed, setConfirmed] = useState<{ protocol: YeastStarterProtocol; receipt: YeastDbCorrectionClientReceipt }>();
  useEffect(() => { requestAnimationFrame(() => first.current?.querySelector<HTMLElement>('input, textarea, select')?.focus()); }, []);
  const set = (patch: Partial<Draft>) => { setDraft(previous => ({ ...previous, ...patch })); if (errors.length) setErrors([]); };
  const setStep = (index: number, value: string) => set({ steps: draft.steps.map((step, at) => at === index ? value : step) });
  const moveStep = (index: number, by: -1 | 1) => {
    const steps = [...draft.steps], target = index + by;
    if (target < 0 || target >= steps.length) return;
    [steps[index], steps[target]] = [steps[target], steps[index]];
    set({ steps });
  };
  const validate = () => {
    const result = buildProtocol(draft, existing);
    setErrors(result.errors); setAttempt(count => count + 1);
    return result.protocol;
  };
  const preparation = recipe.yeast.pitching?.preparation;
  const planned = !!preparation && preparation.status !== 'cancelled';
  const retain = (protocol: YeastStarterProtocol, text: string) => {
    try {
      onRetain(protocol);
      setStatus({ kind: 'local', text: `${text}${planned ? ' La préparation déjà planifiée garde sa révision et devient à revalider.' : ''}` });
    } catch (e) { setStatus({ kind: 'error', text: e instanceof Error ? e.message : 'La notice n’a pas pu être retenue pour ce produit.' }); }
  };
  const retainDraft = () => {
    const protocol = validate();
    if (protocol) retain(protocol, 'Notice retenue pour la recette, copie locale, source citée à la main. Produit, quantité, moût, lot, taux et offre restent inchangés ; cette action ne publie rien dans la base.');
  };
  const propose = async () => {
    const protocol = validate();
    if (!protocol) return;
    setSubmitted(structuredClone(protocol));
    setStatus({ kind: 'busy', text: 'Préparation de la proposition de notice…' });
    try {
      const next = await YeastDbCorrections.proposeStarterProtocol({ id: product.id, ...(parentFallback ? { fallback: parentFallback } : {}), context: { recipe } }, protocol);
      setProposal(next);
      setStatus({ kind: 'review', text: 'Proposition prête : relis la notice avant/après dans le panneau, puis confirme. Rien n’est écrit avant ta confirmation.' });
    } catch (e) {
      setSubmitted(undefined);
      setStatus({ kind: 'error', text: `${e instanceof Error ? e.message : 'La proposition n’a pas pu être préparée.'} La notice reste modifiable.` });
    }
  };
  const busy = status?.kind === 'busy';
  const frozen = busy || !!proposal || !!confirmed;
  const recipeProduct = recipe.yeast.pitching?.product;
  const recipeNotice = recipeProduct?.id === product.id ? recipeProduct.starter : undefined;
  return <div className="yp-editor yp-entry" role="group" aria-labelledby={`${id}-title`} data-entry="starter" data-entry-id={draft.id}>
    <h5 id={`${id}-title`} className="yp-entry-title">{existing ? 'Corriger la notice de préparation' : `Notice de préparation de ${product.label}`}</h5>
    <p className="yeast-small">Saisis seulement ce que la notice citée publie. Elle n’est ni un plan ni une culture obtenue : aucune croissance ni nombre de cellules n’est promis.</p>
    <fieldset ref={first} className="yp-entry-fields" disabled={frozen}>
      <legend className="sr-only">Notice de préparation</legend>
      <label className="yp-stack" htmlFor={`${id}-label`}>Nom de la méthode<Input id={`${id}-label`} value={draft.label} onChange={e => set({ label: e.target.value })} placeholder="Ex. starter au malt sec, 1 L" /></label>
      <label className="yp-stack" htmlFor={`${id}-medium`}>Milieu de la notice<select id={`${id}-medium`} value={draft.medium} onChange={e => set({ medium: e.target.value as Draft['medium'] })}>
        <option value="">À préciser…</option><option value="malt-extract">Extrait de malt (sec ou liquide)</option><option value="other">Autre milieu : non pris en charge</option></select></label>
      <label className="yp-stack yp-entry-wide" htmlFor={`${id}-method`}>Description de la méthode<Textarea id={`${id}-method`} rows={2} value={draft.method} onChange={e => set({ method: e.target.value })} /></label>
      <div className="yp-field-row"><label htmlFor={`${id}-sg`}>SG cible</label>
        <span className="yp-input-unit"><NumberInput id={`${id}-sg`} aria-label="Densité cible publiée du starter" value={draft.targetSg} emptyValue={undefined} onValue={targetSg => set({ targetSg })} placeholder="1,0??" /><span>SG</span></span></div>
      <fieldset className="yp-entry-source"><legend>Durée publiée</legend>
        <div className="yp-field-row"><label htmlFor={`${id}-lead-min`}>De</label>
          <span className="yp-input-unit"><NumberInput id={`${id}-lead-min`} aria-label="Durée publiée, valeur ou minimum en heures" value={draft.leadMin} emptyValue={undefined} min={0} onValue={leadMin => set({ leadMin })} placeholder="?" /><span>h</span></span>
          <label htmlFor={`${id}-lead-max`}>à</label>
          <span className="yp-input-unit"><NumberInput id={`${id}-lead-max`} aria-label="Durée publiée, maximum en heures, vide pour une valeur unique" value={draft.leadMax} emptyValue={undefined} min={0} onValue={leadMax => set({ leadMax })} placeholder="vide" /><span>h</span></span></div>
        <label className="yp-stack" htmlFor={`${id}-meaning`}>Cette durée couvre<select id={`${id}-meaning`} value={draft.meaning} onChange={e => set({ meaning: e.target.value as Draft['meaning'] })}>
          <option value="">À préciser selon la notice…</option><option value="culture">La culture seule (activation, ébullition, refroidissement en plus)</option>
          <option value="total-preparation">Toute la préparation</option></select></label>
        <p className="yeast-small">Vide à droite : valeur unique publiée. Aucune durée n’est complétée par défaut.</p>
      </fieldset>
      <label className="yp-stack yp-entry-wide" htmlFor={`${id}-conditions`}>Conditions de la notice<Textarea id={`${id}-conditions`} rows={2} value={draft.conditions} onChange={e => set({ conditions: e.target.value })}
        placeholder="Température, agitation, volume, contrôles, limites d’usage…" /></label>
      <fieldset className="yp-entry-source"><legend>Étapes, dans l’ordre de la notice</legend>
        <ol className="yp-step-editor">{draft.steps.map((step, index) => <li key={index} className="yp-step-row">
          <Input aria-label={`Étape ${index + 1}`} value={step} onChange={e => setStep(index, e.target.value)} />
          <span className="yp-step-actions">
            <button type="button" className="yeast-link" aria-label={`Monter l’étape ${index + 1}`} disabled={index === 0} onClick={() => moveStep(index, -1)}>Monter</button>
            <button type="button" className="yeast-link" aria-label={`Descendre l’étape ${index + 1}`} disabled={index === draft.steps.length - 1} onClick={() => moveStep(index, 1)}>Descendre</button>
            <button type="button" className="yeast-link" aria-label={`Retirer l’étape ${index + 1}`} disabled={draft.steps.length === 1} onClick={() => set({ steps: draft.steps.filter((_, at) => at !== index) })}>Retirer</button>
          </span></li>)}</ol>
        <button type="button" className="yeast-link" disabled={draft.steps.length >= 20} onClick={() => set({ steps: [...draft.steps, ''] })}>Ajouter une étape</button>
      </fieldset>
      <fieldset className="yp-entry-source"><legend>Source citée</legend>
        <label className="yp-stack" htmlFor={`${id}-source-title`}>Titre<Input id={`${id}-source-title`} value={draft.sourceTitle} onChange={e => set({ sourceTitle: e.target.value })} placeholder="Notice fabricant du produit exact" /></label>
        <label className="yp-stack" htmlFor={`${id}-source-url`}>Lien https précis<Input id={`${id}-source-url`} type="url" value={draft.sourceUrl} onChange={e => set({ sourceUrl: e.target.value })} placeholder="https://…" /></label>
        <label className="yp-stack" htmlFor={`${id}-source-date`}>Date indiquée<input id={`${id}-source-date`} type="date" max={yeastLocalDay()} value={draft.checkedAt} onChange={e => set({ checkedAt: e.target.value })} /></label>
        <p className="yeast-small">Source citée et date indiquée par toi : le lien n’est pas une page lue par le serveur. La source du produit reste distincte.</p>
      </fieldset>
    </fieldset>
    <YeastEntryErrors errors={errors} focus={attempt} />
    <YeastEntryStatus status={status} />
    {!canPropose && !confirmed && <p className="yeast-small" data-starter-base="needs-product">Ce produit n’existe que dans la recette : crée d’abord sa fiche produit dans la base pour y enregistrer la notice. La copie de recette reste possible.</p>}
    {!confirmed && <div className="yp-actions">
      <button type="button" disabled={frozen} onClick={retainDraft}>{existing ? 'Garder cette correction pour la recette' : 'Retenir cette notice pour la recette'}</button>
      <button type="button" disabled={frozen || !canPropose} onClick={propose}>{busy ? 'Préparation…' : 'Proposer l’enregistrement dans la base'}</button>
      <button type="button" className="yeast-link" disabled={busy || !!proposal} onClick={onClose}>{status?.kind === 'local' ? 'Fermer' : 'Annuler'}</button>
    </div>}
    {confirmed && <div className="yp-actions">
      {!sameProtocol(recipeNotice, confirmed.protocol) && <button type="button" onClick={() => retain(confirmed.protocol, 'Notice confirmée retenue pour la recette ; produit, quantité, moût, lot, taux et offre restent inchangés.')}>Retenir cette notice pour la recette</button>}
      <button type="button" className="yeast-link" onClick={onClose}>Fermer</button>
    </div>}
    <YeastDbCorrectionsPanel target={proposal?.target ?? null} initialProposal={proposal ?? undefined}
      onClose={() => {
        setProposal(null);
        // A refusal, a conflict or a closed review keeps the draft editable; only a receipt freezes it.
        if (!confirmed) { setSubmitted(undefined); setStatus({ kind: 'dismissed', text: 'Panneau fermé sans confirmation : rien n’a été écrit dans la base. La notice reste modifiable.' }); }
      }}
      onUpdated={receipt => {
        if (submitted) setConfirmed({ protocol: submitted, receipt });
        setStatus({ kind: 'confirmed', text: `Notice enregistrée dans la base pour ce produit exact, confirmée par le serveur.${receipt.targetCreated ? ' La fiche produit n’y existait pas encore : elle a été créée depuis sa version catalogue, avec ses offres.' : ''}${receipt.readback === 'pending' ? ' La copie de cet appareil reste à actualiser ; la notice confirmée reste disponible ici.' : ''} Ce reçu ne change pas la notice de la recette.` });
      }} />
  </div>;
}
