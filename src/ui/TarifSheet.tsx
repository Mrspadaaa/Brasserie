import React, { useEffect, useRef, useState } from 'react';
import { NumberInput } from './NumberInput';
import type { InputElement } from './Input';
import { PricingItem, AppConfig } from '../types';
import { Sheet, ConfirmSheet } from './Sheet';
import { FormNav, Field, TextInput, inputClass } from './FormNav';
import { Trash2, AlertTriangle, ChevronDown } from 'lucide-react';
import { useSyncedDraft } from '../hooks/useLiveData';
import { parseDecimal } from './numericInput';
import './clients.css';

interface TarifSheetProps {
  item: PricingItem | null;
  config: AppConfig;
  existingProducts?: string[];
  onClose: () => void;
  onSave: (item: PricingItem) => void;
  onDelete: (item: PricingItem) => void;
}

type MoneyKey = 'costIngredients' | 'costFixed' | 'priceHT';
type TarifDraft = Omit<PricingItem, MoneyKey> & Record<MoneyKey, number | undefined>;
const chf = (value: number | undefined) => value === undefined || !Number.isFinite(value)
  ? 'À renseigner'
  : value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const validAmount = (value: number | undefined): value is number => value !== undefined && Number.isFinite(value) && value >= 0;
// saveTarifs adresse les documents avec cette normalisation. Vérifier la clé
// effective empêche aussi les collisions d'accents, de ponctuation ou de casse.
const productKey = (value: string) => value.toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

export const TarifSheet: React.FC<TarifSheetProps> = ({ item, config, existingProducts = [], onClose, onSave, onDelete }) => {
  const [draft, setDraft] = useSyncedDraft<TarifDraft | null>(item, item?.product);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [invalidMoney, setInvalidMoney] = useState<Partial<Record<MoneyKey, string>>>({});
  const form = useRef<HTMLDivElement>(null);
  useEffect(() => { setConfirmDelete(false); setAttempted(false); setInvalidMoney({}); }, [item?.product]);
  if (!item || !draft) return null;

  const isNew = !item.product;
  const costIngredients = invalidMoney.costIngredients ? undefined : draft.costIngredients;
  const costFixed = invalidMoney.costFixed ? undefined : draft.costFixed;
  const priceHT = invalidMoney.priceHT ? undefined : draft.priceHT;
  // Même coût et même fiscalité ; une saisie effacée ne devient pas un zéro.
  const costTotal = validAmount(costIngredients) && validAmount(costFixed)
    ? Math.round((costIngredients + costFixed) * 100) / 100 : undefined;
  const marginCHF = validAmount(priceHT) && costTotal !== undefined
    ? Math.round((priceHT - costTotal) * 100) / 100 : undefined;
  const marginPercent = validAmount(priceHT) && marginCHF !== undefined
    ? priceHT > 0 ? Math.round((marginCHF / priceHT) * 1000) / 10 : 0 : undefined;
  const tvaRate = config.fiscal.isTvaRegistered ? config.fiscal.tvaNormalRate : 0;
  const priceTTC = validAmount(priceHT) ? Math.round(priceHT * (1 + tvaRate) * 100) / 100 : undefined;
  const duplicate = existingProducts.some(product => product !== item.product && productKey(product) === productKey(draft.product));
  const productError = duplicate ? 'Ce produit a déjà un tarif. Choisis un autre nom.'
    : attempted && (draft.product.trim().length < 2 || !productKey(draft.product)) ? 'Indique un nom de produit d’au moins 2 caractères, avec des lettres ou des chiffres.' : undefined;
  const moneyErrors = (['costIngredients', 'costFixed', 'priceHT'] as const).filter(key => invalidMoney[key] || !validAmount(draft[key]));

  const save = () => {
    setAttempted(true);
    if (draft.product.trim().length < 2 || !productKey(draft.product) || duplicate) {
      form.current?.querySelector<HTMLElement>('#tf-product')?.focus();
      return;
    }
    if (moneyErrors.length) {
      form.current?.querySelector<HTMLElement>(`#tf-${moneyErrors[0]}`)?.focus();
      return;
    }
    // FormNav peut valider sans blur : lire aussi le champ actif, qui conserve
    // la chaîne pendant une frappe incomplète (« - », « 12, »).
    const invalidInput = Array.from(form.current?.querySelectorAll<InputElement>('[data-tarif-money] input, [data-tarif-money] textarea') ?? [])
      .find(input => !validAmount(parseDecimal(input.value) ?? undefined));
    if (invalidInput) { invalidInput.focus(); invalidInput.setCustomValidity('Indique un montant positif ou nul en CHF.'); invalidInput.reportValidity(); return; }
    if (!validAmount(costIngredients) || !validAmount(costFixed) || !validAmount(priceHT) || costTotal === undefined || marginCHF === undefined || marginPercent === undefined) {
      form.current?.querySelector<HTMLElement>(`#tf-${moneyErrors[0]}`)?.focus();
      return;
    }
    onSave({ ...draft, product: draft.product.trim(), costIngredients, costFixed, priceHT, costLabor: 0, costTotal, marginCHF, marginPercent });
    onClose();
  };

  const money = (label: string, key: MoneyKey) => (
    <Field label={`${label} (CHF)`} htmlFor={`tf-${key}`}>
      <div className="tarif-money-input" data-tarif-money onChangeCapture={event => {
        if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) return;
        const entered = event.target.value;
        event.target.setCustomValidity('');
        // NumberInput restaure la dernière valeur lisible au blur. Garder
        // l'erreur pour ne pas enregistrer cette ancienne valeur à sa place.
        setInvalidMoney(current => ({ ...current, [key]: entered.trim() && parseDecimal(entered) === null ? entered : undefined }));
      }}>
        <NumberInput id={`tf-${key}`} value={draft[key]} emptyValue={undefined}
          onValue={(value: number | undefined) => setDraft(current => current && ({ ...current, [key]: value }))}
          pad required className={`${inputClass} font-mono text-right`}
          aria-invalid={moneyErrors.includes(key)}
          aria-describedby={moneyErrors.includes(key) ? `tf-${key}-error` : undefined} />
      </div>
      {moneyErrors.includes(key) && <p id={`tf-${key}-error`} role="alert" className="text-xs text-alert-strong">{invalidMoney[key] ? `Montant « ${invalidMoney[key]} » non reconnu. Corrige le champ.` : 'Indique un montant positif ou nul.'}</p>}
    </Field>
  );

  return <>
    <Sheet open={Boolean(item)} onClose={onClose} title={isNew ? 'Nouveau tarif' : 'Modifier le tarif'} className="tarif-sheet"
      footer={<div className="tarif-footer">
        {!isNew && <button type="button" onClick={() => setConfirmDelete(true)} className="clients-action clients-action-danger" aria-label={`Supprimer le tarif ${item.product}`}><Trash2 size={14} aria-hidden="true" />Supprimer</button>}
        <button type="button" onClick={onClose} className="clients-action">Annuler</button>
        <button type="button" onClick={save} className="clients-action clients-action-primary">Enregistrer</button>
      </div>}>
      <div ref={form}>
        <FormNav className="tarif-form" onSubmit={save}>
          <Field label="Produit et conditionnement" htmlFor="tf-product">
            <TextInput id="tf-product" name="tarif_product_label" placeholder="Bouteille 75 cl, fût 30 L…" value={draft.product}
              onChange={product => setDraft(current => current && ({ ...current, product }))}
              aria-invalid={Boolean(productError)} aria-describedby={productError ? 'tf-product-error' : undefined} />
            {productError && <p id="tf-product-error" role="alert" className="text-xs text-alert-strong">{productError}</p>}
          </Field>
          <div className="tarif-money-grid">
            {money('Ingrédients', 'costIngredients')}
            {money('Charges fixes', 'costFixed')}
          </div>
          {money('Prix de vente HT', 'priceHT')}
          <dl className="tarif-results">
            <div className="tarif-result-row"><dt>Coût de revient</dt><dd><output className="font-mono" aria-label="Coût de revient">{chf(costTotal)}{costTotal !== undefined && ' CHF'}</output></dd></div>
            <div className="tarif-result-row"><dt>Marge brute</dt><dd><output aria-label="Marge brute" className={`font-mono tarif-result-margin ${marginCHF !== undefined && marginCHF <= 0 ? 'tarif-result-loss' : ''}`}>
              {marginCHF !== undefined && marginCHF > 0 ? '+' : ''}{chf(marginCHF)}{marginCHF !== undefined && ' CHF'}{marginPercent !== undefined && <span className="tarif-percent">{marginPercent.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} % du prix HT</span>}
            </output></dd></div>
            <div className="tarif-result-row"><dt>Prix TTC <span className="block text-xs">{config.fiscal.isTvaRegistered ? `TVA ${(tvaRate * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %` : 'Non assujettie à la TVA'}</span></dt><dd><output className="font-mono" aria-label="Prix TTC">{chf(priceTTC)}{priceTTC !== undefined && ' CHF'}</output></dd></div>
          </dl>
          {marginCHF !== undefined && marginCHF <= 0 && validAmount(priceHT) && priceHT > 0 && <p className="tarif-alert" role="status"><AlertTriangle size={15} aria-hidden="true" />{marginCHF < 0 ? 'Ce prix ne couvre pas le coût de revient.' : 'Ce prix couvre le coût, sans dégager de marge.'}</p>}
          <details className="clients-help">
            <summary>Ce qui entre dans le coût<ChevronDown size={14} aria-hidden="true" /></summary>
            <p>Ingrédients : malt, houblon, levure. Charges fixes : loyer, énergie et amortissement. Saisis les coûts du conditionnement indiqué. Le temps personnel du brasseur est exclu.</p>
          </details>
        </FormNav>
      </div>
    </Sheet>
    <ConfirmSheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Supprimer ce tarif ?"
      what={`${item.product} — ${chf(item.priceHT)} CHF HT`} consequence="Les ventes déjà enregistrées ne sont pas touchées." confirmLabel="Supprimer"
      onConfirm={() => { setConfirmDelete(false); onDelete(item); onClose(); }} />
  </>;
};
