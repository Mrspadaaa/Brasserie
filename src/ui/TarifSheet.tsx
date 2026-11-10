import React, { useEffect, useRef, useState } from 'react';
import { NumberInput } from './NumberInput';
import type { InputElement } from './Input';
import { PricingItem, AppConfig } from '../types';
import { Sheet, ConfirmSheet } from './Sheet';
import { FormNav, Field, TextInput, inputClass } from './FormNav';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useSyncedDraft } from '../hooks/useLiveData';
import { messageRefus, parseDecimal, raisonHorsBornes } from './numericInput';
import { FORMATS_VENTE } from './vente/formatsVente';
import { formatDuTarif, type FormatId, type LecturePrix } from './prix/calculPrix';
import { montantChf } from '../domain/finance/ledger';
import { nombreFr } from '../domain/nombreAffiche';
import './prix/prix.css';

/**
 * « Changer le prix » (c7c) : le prix d'un format d'une bière. Le coût n'est plus saisi ici : il vient de la chaîne du litre (c3a, impôt p2b).
 * Ne reste à saisir que ce que la chaîne ne sait pas : le prix de vente HT et l'emballage d'UNE unité (vide = à compléter, jamais 0).
 */
export interface FormatChoix { id: FormatId; label: string; volumeL: number }
interface TarifSheetProps {
  item: PricingItem | null;
  config: AppConfig;
  existingProducts?: string[];
  /** Les formats proposés (le fût prend la capacité du brassin). Par défaut ceux de la caisse. */
  formats?: FormatChoix[];
  /** Ce que donnerait ce prix : la même lecture que l'écran Prix. */
  apercu?: (saisie: { prix: number | undefined; emballage: number | undefined; formatId: FormatId | '' }) => LecturePrix | null;
  onClose: () => void;
  /** `ancien` : le libellé avant modification (la clé de stockage), pour remplacer la ligne et non en créer une seconde. */
  onSave: (item: PricingItem, ancien?: string) => void;
  onDelete: (item: PricingItem) => void;
}

type MoneyKey = 'priceHT' | 'emballageUnite';
type Draft = Omit<PricingItem, MoneyKey> & { priceHT: number | undefined; emballageUnite: number | undefined };
/* BE-98 : un prix ou un coût UNITAIRE va de 0 à 10 000 CHF (estimé : un fût de 30 L ~150 CHF, une palette ~5 000 CHF). */
const PRIX_UNITAIRE_MAX = 10_000;
const validAmount = (value: number | undefined): value is number => value !== undefined && Number.isFinite(value) && value >= 0 && value <= PRIX_UNITAIRE_MAX;
const chfTxt = (v: number | undefined) => v === undefined || !Number.isFinite(v) ? 'À renseigner' : montantChf(v);
// saveTarifs adresse les documents avec cette normalisation : vérifier la clé effective empêche les collisions d'accents, de ponctuation ou de casse.
const productKey = (value: string) => value.toLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
const nomDuTarif = (biere: string, label: string) => `${biere.trim()} ${label.charAt(0).toUpperCase()}${label.slice(1)}`;

export const TarifSheet: React.FC<TarifSheetProps> = ({ item, config, existingProducts = [], formats = FORMATS_VENTE.map(f => ({ id: f.id as FormatId, label: f.label, volumeL: f.volumeL })), apercu, onClose, onSave, onDelete }) => {
  const [draft, setDraft] = useSyncedDraft<Draft | null>(item as Draft | null, item?.product);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [refusMoney, setRefusMoney] = useState<Partial<Record<MoneyKey, string>>>({});
  const [invalidMoney, setInvalidMoney] = useState<Partial<Record<MoneyKey, string>>>({});
  // TE-6 : un montant jamais touché reste vide, sans reproche ; l'erreur vient à la frappe ou à l'enregistrement.
  const [touched, setTouched] = useState<Partial<Record<MoneyKey, boolean>>>({});
  const [formatId, setFormatId] = useState<FormatId | ''>('');
  const form = useRef<HTMLDivElement>(null);
  useEffect(() => { setConfirmDelete(false); setAttempted(false); setInvalidMoney({}); setTouched({}); setFormatId(item ? (formatDuTarif(item) ?? '') : ''); }, [item?.product]);
  if (!item || !draft) return null;

  const isNew = !item.product;
  const ancienSansFormat = !isNew && !item.format;
  const priceHT = invalidMoney.priceHT ? undefined : draft.priceHT;
  const emballage = invalidMoney.emballageUnite ? undefined : draft.emballageUnite;
  const tvaRate = config.fiscal.isTvaRegistered ? config.fiscal.tvaNormalRate : 0;
  const priceTTC = validAmount(priceHT) ? Math.round(priceHT * (1 + tvaRate) * 100) / 100 : undefined;
  const choisi = formats.find(f => f.id === formatId);
  const biere = (draft.biere ?? '').trim();
  const product = ancienSansFormat && !biere ? draft.product.trim() : choisi && biere ? nomDuTarif(biere, choisi.label) : draft.product.trim();
  const duplicate = existingProducts.some(p => p !== item.product && productKey(p) === productKey(product));
  const productError = duplicate ? 'Ce produit a déjà un tarif. Choisis un autre nom.'
    : attempted && (product.length < 2 || !productKey(product)) ? 'Indique la bière et le format (ou un nom d’au moins 2 caractères).' : undefined;
  // L'emballage est facultatif : vide = à compléter. Seul un montant saisi doit être valable.
  const moneyErrors = (['priceHT', 'emballageUnite'] as const).filter(key => invalidMoney[key] || (key === 'priceHT' ? !validAmount(draft.priceHT) : draft.emballageUnite !== undefined && !validAmount(draft.emballageUnite)));
  const montrerErreur = (key: MoneyKey) => moneyErrors.includes(key) && (attempted || Boolean(touched[key]) || Boolean(invalidMoney[key]));
  const lecture = apercu?.({ prix: validAmount(priceHT) ? priceHT : undefined, emballage: validAmount(emballage) ? emballage : undefined, formatId });

  const save = () => {
    setAttempted(true);
    if (product.length < 2 || !productKey(product) || duplicate) { form.current?.querySelector<HTMLElement>('#tf-product, #tf-biere')?.focus(); return; }
    if (moneyErrors.length) { form.current?.querySelector<HTMLElement>(`#tf-${moneyErrors[0]}`)?.focus(); return; }
    // FormNav peut valider sans blur : lire aussi le champ actif, qui conserve la chaîne pendant une frappe incomplète (« - », « 12, »).
    const invalidInput = Array.from(form.current?.querySelectorAll<InputElement>('[data-tarif-money] input, [data-tarif-money] textarea') ?? [])
      .find(input => input.value.trim() !== '' && !validAmount(parseDecimal(input.value) ?? undefined));
    if (invalidInput) { invalidInput.focus(); invalidInput.setCustomValidity('Indique un montant entre 0 et 10 000 CHF.'); invalidInput.reportValidity(); return; }
    if (!validAmount(priceHT)) { form.current?.querySelector<HTMLElement>('#tf-priceHT')?.focus(); return; }
    const sortie: PricingItem = { ...draft, product, priceHT };
    if (choisi) { sortie.format = { id: choisi.id, volumeL: choisi.volumeL }; if (biere) sortie.biere = biere; }
    if (validAmount(emballage)) sortie.emballageUnite = emballage; else delete sortie.emballageUnite;
    onSave(sortie, isNew ? undefined : item.product);
    onClose();
  };

  // BE-98 : le message d'enregistrement dit la vraie raison (au-delà du plafond, négatif, ou champ vide), pas toujours « positif ou nul ».
  const raisonMontant = (value: number | undefined) => value === undefined || !Number.isFinite(value)
    ? 'Champ vide : indique un montant de 0 à 10 000 CHF.'
    : raisonHorsBornes(value, { min: 0, max: PRIX_UNITAIRE_MAX, unite: 'CHF' });

  const money = (label: string, key: MoneyKey, aide?: string) => (
    <Field label={`${label} (CHF)`} htmlFor={`tf-${key}`}>
      <div className="tarif-money-input" data-tarif-money onChangeCapture={event => {
        if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) return;
        const entered = event.target.value;
        event.target.setCustomValidity('');
        // NumberInput restaure la dernière valeur lisible au blur. Garder l'erreur pour ne pas enregistrer cette ancienne valeur à sa place.
        setInvalidMoney(current => ({ ...current, [key]: entered.trim() && parseDecimal(entered) === null ? entered : undefined }));
      }}>
        <NumberInput id={`tf-${key}`} value={draft[key]} emptyValue={undefined} fractionDigits={2}
          onValue={(value: number | undefined) => { setTouched(current => ({ ...current, [key]: true })); setDraft(current => current && ({ ...current, [key]: value })); }}
          // BE-98 : au-delà du plafond (ou sous zéro), la saisie est refusée : la valeur d'avant revient ET le message dit le plafond et la valeur gardée.
          min={0} max={PRIX_UNITAIRE_MAX} rejeter
          onRefus={(r) => setRefusMoney(current => ({ ...current, [key]: r ? messageRefus(r.saisi, r.retenu, { min: 0, max: PRIX_UNITAIRE_MAX, unite: 'CHF' }) : undefined }))}
          pad required={key === 'priceHT'} className={`${inputClass} font-mono text-right`}
          aria-invalid={montrerErreur(key) || Boolean(refusMoney[key])}
          aria-describedby={montrerErreur(key) || refusMoney[key] ? `tf-${key}-error` : undefined} />
      </div>
      {aide && !montrerErreur(key) && !refusMoney[key] && <p className="prx-aide">{aide}</p>}
      {(montrerErreur(key) || refusMoney[key]) && <p id={`tf-${key}-error`} role="alert" className="text-xs text-alert-strong">{refusMoney[key] ?? (invalidMoney[key] ? `Montant « ${invalidMoney[key]} » non reconnu. Corrige le champ.` : raisonMontant(draft[key]))}</p>}
    </Field>
  );

  return <>
    <Sheet open={Boolean(item)} onClose={onClose} title={isNew ? 'Fixer le prix' : 'Changer le prix'} className="tarif-sheet prx-feuille"
      footer={<div className="prx-pied">
        {!isNew && <button type="button" onClick={() => setConfirmDelete(true)} className="prx-bouton prx-danger" aria-label={`Supprimer le tarif ${item.product}`}><Trash2 size={14} aria-hidden="true" />Supprimer</button>}
        <button type="button" onClick={onClose} className="prx-bouton">Annuler</button>
        <button type="button" onClick={save} className="prx-bouton prx-primaire">Enregistrer</button>
      </div>}>
      <div ref={form}>
        <FormNav className="prx-form" onSubmit={save}>
          {ancienSansFormat && <p className="prx-aide" role="note">Ce tarif n’a pas encore de bière ni de format : choisis-les pour qu’il serve à l’écran Prix et à la caisse.</p>}
          <Field label="Bière" htmlFor="tf-biere">
            <TextInput id="tf-biere" name="tarif_biere" placeholder="Pale Ale" value={draft.biere ?? ''}
              onChange={b => setDraft(current => current && ({ ...current, biere: b }))} />
          </Field>
          <div className="prx-seg" role="group" aria-label="Format du tarif">
            {formats.map(f => <button key={f.id} type="button" aria-pressed={formatId === f.id} onClick={() => setFormatId(f.id)}>{f.label}</button>)}
          </div>
          {ancienSansFormat && <Field label="Nom actuel du tarif" htmlFor="tf-product">
            <TextInput id="tf-product" name="tarif_product_label" value={draft.product} onChange={p => setDraft(current => current && ({ ...current, product: p }))}
              aria-invalid={Boolean(productError)} aria-describedby={productError ? 'tf-product-error' : undefined} />
          </Field>}
          {productError && <p id="tf-product-error" role="alert" className="text-xs text-alert-strong">{productError}</p>}
          {money(`Prix de vente HT`, 'priceHT')}
          {money('Emballage d’une unité', 'emballageUnite', 'Bouteille, capsule, étiquette. Vide : le reste est un maximum (≤).')}
          <dl className="prx-res">
            <div><dt>Prix TTC <small>{config.fiscal.isTvaRegistered ? `TVA ${(tvaRate * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %` : 'Non assujettie à la TVA'}</small></dt><dd><output className="font-mono" aria-label="Prix TTC">{chfTxt(priceTTC)}{priceTTC !== undefined && ' CHF'}</output></dd></div>
            {lecture?.reste && <div><dt>Il te reste</dt><dd><output className="font-mono" aria-label="Il te reste">{lecture.reste.borne ? '≤ ' : ''}{montantChf(lecture.reste.valeur)} CHF{lecture.partPrix !== null && <span className="prx-pct"> · {nombreFr(lecture.partPrix, 0)} %</span>}</output></dd></div>}
          </dl>
          {lecture?.zone === 'perte' && <p className="prx-alerte" role="status"><AlertTriangle size={15} aria-hidden="true" />Ce prix ne couvre pas le coût.</p>}
        </FormNav>
      </div>
    </Sheet>
    <ConfirmSheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Supprimer ce tarif ?"
      what={`${item.product} — ${chfTxt(item.priceHT)} CHF HT`} consequence="Les ventes déjà enregistrées ne sont pas touchées." confirmLabel="Supprimer"
      onConfirm={() => { setConfirmDelete(false); onDelete(item); onClose(); }} />
  </>;
};
