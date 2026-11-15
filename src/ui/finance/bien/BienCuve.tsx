import React, { useId, useMemo, useState } from 'react';
import { Check, ChevronRight, Circle } from 'lucide-react';
import { Input } from '../../Input';
import { NumberInput } from '../../NumberInput';
import { ChampNombre } from '../../depense/ChampNombre';
import { ChampMontant } from '../ChampMontant';
import { BORNES_FINANCE } from '../../../domain/finance/bornesFinance';
import type { DepreciationCategory, FinancialAsset } from '../../../domain/finance/types';
import { DEPRECIATION_CATEGORIES, depreciationForYear } from '../../../domain/finance/annual';
import { formatCHF, isoDate, todayISO, transactionAmount, transactionDirection } from '../../../domain/finance/ledger';
import { StorageService } from '../../../services/storage';
import { FinanceService } from '../../../services/financeService';
import { montant, montantEntier } from '../previsions/format';
import { Field, FormSheet, idFor } from '../prevision/base';
import './bien.css';

/**
 * Bien amorti = m3im-c (choix du 15.11) : la cuve année par année, la manière dont elle s'use sous le doigt.
 * Aucun calcul n'est refait ici : chaque barre est `depreciationForYear` de `domain/finance/annual` (règles et catégories AFC inchangées),
 * et le chiffre « si 10 % du prix » est le même calcul avec l'autre méthode. L'enregistrement reste `FinanceService.saveAsset` (validateAsset).
 * Tant que la catégorie et le départ ne sont pas confirmés, le domaine ne rend aucune usure à l'Annuel : ici on montre un aperçu, dit « à confirmer ».
 */
const COURT: Record<DepreciationCategory, string> = { tanks: 'cuves', furniture: 'mobilier', production: 'machines', electronics: 'informatique', tools: 'outillage', custom: 'taux perso' };
const taux = (categorie: DepreciationCategory, methode: FinancialAsset['method']) => { const c = DEPRECIATION_CATEGORIES.find(x => x.id === categorie)!; return methode === 'linear' ? c.linearRate : c.decliningRate; };
const pct = (n: number) => `${String(Math.round(n * 100) / 100).replace('.', ',')} %`;
const court = (iso?: string) => (isoDate(iso) ? `${iso!.slice(8, 10)}.${iso!.slice(5, 7)}.${iso!.slice(2, 4)}` : '—');
const FRACTIONS: Array<[number, string]> = [[1, 'entière'], [0.5, 'moitié'], [0, 'aucune']];
const libelleFraction = (f: number) => FRACTIONS.find(([v]) => v === f)?.[1] ?? `× ${String(f).replace('.', ',')}`;

export interface BarreAnnee { libelle: string; cents: number; genre: 'achat' | 'passe' | 'exercice' | 'prevu' }
/** Les barres : l'achat, la valeur reprise (années avant le départ), puis la valeur de fin de chaque année selon le domaine ; l'exercice en plein, les années à venir en clair. */
export function barresDuBien(asset: FinancialAsset, exercice: number): BarreAnnee[] {
  const coutPro = Math.round(asset.acquisitionCents * asset.businessUsePct / 100);
  const achat = Number(isoDate(asset.acquisitionDate)?.slice(0, 4) ?? exercice);
  const debut = Math.max(asset.openingYear, achat), fin = Math.max(debut, exercice) + 4;
  const barres: BarreAnnee[] = [];
  if (asset.openingYear > achat) barres.push({ libelle: String(asset.openingYear - 1), cents: asset.openingValueCents, genre: 'passe' });
  for (let y = debut; y <= fin; y++) barres.push({ libelle: String(y), cents: depreciationForYear(asset, y).closingCents, genre: y === exercice ? 'exercice' : y < exercice ? 'passe' : 'prevu' });
  return [{ libelle: 'achat', cents: coutPro, genre: 'achat' as const }, ...barres.slice(-6)];
}

function Cuve({ barres, exercice, usure, aperçu }: { barres: BarreAnnee[]; exercice: number; usure: number | null; aperçu: boolean }) {
  const n = barres.length, plein = 346, largeur = 40, ecart = n > 1 ? Math.min(9, (plein - 8 - n * largeur) / (n - 1)) : 0, tout = n * largeur + (n - 1) * ecart, x0 = (plein - tout) / 2;
  const max = Math.max(1, ...barres.map(b => b.cents));
  const cls = { achat: 'bic-b0', passe: 'bic-bp', exercice: 'bic-bc', prevu: 'bic-bf' } as const;
  return <svg className="bic-g" viewBox="0 0 346 168" role="img" data-booster="annees"
    aria-label={`Valeur année par année : ${barres.map(b => `${b.libelle} ${montantEntier(b.cents)}`).join(', ')}`}>
    <line x1={0} x2={346} y1={140} y2={140} className="bic-zero" />
    {barres.map((b, i) => { const h = (b.cents / max) * 118, x = x0 + i * (largeur + ecart), c = x + largeur / 2, fort = b.genre === 'exercice';
      return <g key={b.libelle + i}><rect x={x} y={140 - h} width={largeur} height={h} rx={4} className={cls[b.genre]} />
        <text x={c} y={136 - h} textAnchor="middle" className={fort ? 'bic-vc' : 'bic-v'}>{montantEntier(b.cents)}</text>
        <text x={c} y={156} textAnchor="middle" className={fort ? 'bic-ac' : 'bic-a'}>{b.libelle}</text>
        {fort && usure != null && <text x={c} y={167} textAnchor="middle" className="bic-pe">{usure === 0 ? '0' : `−${montantEntier(usure)}`}</text>}</g>; })}
    {aperçu && <title>aperçu à confirmer</title>}
    <desc>{`Exercice ${exercice}`}</desc>
  </svg>;
}

export function BienCuve({ asset, initial, onClose }: { asset?: FinancialAsset; initial?: Partial<FinancialAsset>; onClose: () => void }) {
  const [draft, setDraft] = useState<FinancialAsset>(() => asset ?? { id: idFor('IMMO'), name: '', acquisitionDate: todayISO(), inServiceDate: todayISO(), acquisitionCents: 0, businessUsePct: 100, category: 'production', method: 'declining', ratePct: 30, openingYear: new Date().getFullYear(), openingValueCents: 0, openingConfirmed: false, firstYearFraction: 1, ...initial });
  const [titre] = useState(() => (asset?.name || initial?.name || '').trim() || 'Ajouter un amortissement');
  const equipment = StorageService.getStocks().equipment;
  const allTransactions = StorageService.getTransactions().filter(t => !t.finance?.voidedAt);
  const transactions = allTransactions.filter(t => t.finance?.kind !== 'refund' && (t.category === 'materiel' || t.finance?.lines.some(l => l.kind === 'equipment')));
  const credits = allTransactions.filter(t => t.finance?.kind === 'refund' && t.finance.refundOfId === draft.transactionId && transactionDirection(t, allTransactions) === 'in');
  const field = <K extends keyof FinancialAsset>(key: K, value: FinancialAsset[K]) => setDraft(d => ({ ...d, [key]: value }));
  const exercice = Number(todayISO().slice(0, 4)), idPart = useId();

  const calcul = useMemo(() => {
    const apercu: FinancialAsset = { ...draft, openingConfirmed: true };
    const ligne = depreciationForYear(apercu, exercice);
    const valide = ligne.missing.length === 0;
    const autre: FinancialAsset['method'] = draft.method === 'declining' ? 'linear' : 'declining';
    const alt = draft.category === 'custom' ? null : depreciationForYear({ ...apercu, method: autre, ratePct: taux(draft.category, autre) }, exercice);
    return { valide, usure: valide ? ligne.depreciationCents : null, barres: valide ? barresDuBien(apercu, exercice) : [{ libelle: 'achat', cents: Math.round(draft.acquisitionCents * draft.businessUsePct / 100), genre: 'achat' as const }],
      autre, alt: alt && alt.missing.length === 0 ? alt.depreciationCents : null, manque: ligne.missing[0] };
  }, [draft, exercice]);
  const tauxDe = (m: FinancialAsset['method']) => (draft.category === 'custom' || m === draft.method ? draft.ratePct : taux(draft.category, m));
  const methode = (m: FinancialAsset['method']) => setDraft(d => ({ ...d, method: m, ratePct: d.category === 'custom' ? d.ratePct : taux(d.category, m) }));
  const sousTitre = (m: FinancialAsset['method']) => (m === 'declining' ? `dégressive · AFC ${COURT[draft.category]}` : 'linéaire');
  const duPrixOuReste = (m: FinancialAsset['method']) => `${pct(tauxDe(m))} ${m === 'declining' ? 'du reste' : 'du prix'}`;

  return <FormSheet className="fx4-sheet bic-sheet" title={titre} subtitle="son usure · terme : amortissement" onClose={onClose}
    onSave={() => { if (!draft.name.trim() || draft.acquisitionCents < 0 || draft.acquisitionCents === 0 && !draft.capitalAdjustmentTransactionIds?.length) throw Error('Renseigne le matériel et sa valeur d’acquisition.'); FinanceService.saveAsset(draft); }}>
    <div className="bic">
      <div className="bic-pan">
        <div className="bic-seg" role="group" aria-label="Comment elle s’use" data-booster="methode">
          {(['declining', 'linear'] as const).map(m => <button key={m} type="button" aria-pressed={draft.method === m} onClick={() => methode(m)}><b>{duPrixOuReste(m)}</b>{sousTitre(m)}</button>)}
        </div>
        <Cuve barres={calcul.barres} exercice={exercice} usure={calcul.usure} aperçu={!draft.openingConfirmed} />
        <div className="bic-lg"><span><i className="bic-sw bic-sw1" />{exercice}</span><span><i className="bic-sw bic-sw2" />prévu</span>
          {calcul.alt != null && <span className="bic-alt">si {duPrixOuReste(calcul.autre)} : <b className="bic-m">−{montant(calcul.alt)}</b> en {exercice}</span>}</div>
        {!draft.openingConfirmed && <p className="bic-note">Aperçu : l’Annuel ne compte cette usure qu’une fois la catégorie et le départ confirmés.</p>}
        <div className="bic-res"><span>Usure à garder en {exercice}</span><b className="bic-m" aria-live="polite">{calcul.usure != null ? montant(calcul.usure) : '—'}</b></div>
        {calcul.usure == null && calcul.manque && <p className="bic-note" role="note">{calcul.manque}</p>}
      </div>
      <div className="bic-cur" data-booster="part-pro"><label htmlFor={`${idPart}-pro`}>Part pro</label>
        <input id={`${idPart}-pro`} type="range" className="bic-range" min={0} max={100} step={1} value={draft.businessUsePct} aria-label="Part professionnelle (%)" aria-valuetext={`${draft.businessUsePct} %`}
          style={{ ['--pos' as string]: `${draft.businessUsePct}%` }} onChange={e => field('businessUsePct', Number(e.target.value))} /><b className="bic-m">{draft.businessUsePct} %</b></div>
      <div className="bic-g3">
        <label className="bic-cell"><span>Prix d’achat</span><ChampMontant fractionDigits={2} aria-label="Valeur d’acquisition TTC (CHF)" className="bic-in bic-m" value={draft.acquisitionCents ? draft.acquisitionCents / 100 : undefined} onValue={v => field('acquisitionCents', v == null ? 0 : Math.round(v * 100))} max={BORNES_FINANCE.operationCents.valeur / 100} maxDecimales={2} dire placeholder="0,00" /></label>
        <label className="bic-cell bic-date"><span>Achetée</span><b className="bic-m">{court(draft.acquisitionDate)}</b><input type="date" aria-label="Date d’achat" value={draft.acquisitionDate} required onChange={e => field('acquisitionDate', e.target.value)} /></label>
        <label className="bic-cell bic-date"><span>En service</span><b className="bic-m">{court(draft.inServiceDate)}</b><input type="date" aria-label="Mise en service" value={draft.inServiceDate} required onChange={e => field('inServiceDate', e.target.value)} /></label>
      </div>
      <div className="bic-g3">
        <label className="bic-cell"><span>Départ</span><NumberInput aria-label="Première année retenue" className="bic-in bic-m" integer value={draft.openingYear} onValue={v => field('openingYear', v ?? new Date().getFullYear())} min={1900} max={2200} /></label>
        <label className="bic-cell"><span>Valeur 1er janv.</span><ChampMontant fractionDigits={2} aria-label="Valeur professionnelle restante à l’ouverture (CHF)" className="bic-in bic-m" value={draft.openingValueCents / 100} onValue={v => field('openingValueCents', v == null ? 0 : Math.round(v * 100))} max={BORNES_FINANCE.operationCents.valeur / 100} maxDecimales={2} dire /></label>
        <label className="bic-cell bic-date"><span>1re année</span><b>{libelleFraction(draft.firstYearFraction)}</b>
          <select aria-label="Fraction de la première année (1 = année entière)" value={draft.firstYearFraction} onChange={e => field('firstYearFraction', Number(e.target.value))}>
            {FRACTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}{!FRACTIONS.some(([v]) => v === draft.firstYearFraction) && <option value={draft.firstYearFraction}>{libelleFraction(draft.firstYearFraction)}</option>}</select></label>
      </div>
      <label className={`bic-conf${draft.openingConfirmed ? ' bic-ok' : ''}`}><input type="checkbox" checked={draft.openingConfirmed} onChange={e => field('openingConfirmed', e.target.checked)} aria-label="Je confirme la catégorie, les valeurs d’ouverture et le traitement de la première année." />
        {draft.openingConfirmed ? <Check size={18} aria-hidden="true" /> : <Circle size={18} aria-hidden="true" />}<span>{draft.openingConfirmed ? 'Catégorie et départ confirmés' : 'Confirmer la catégorie et le départ'}</span></label>

      <details className="bic-row" data-booster="materiel"><summary><span>Matériel du stock, achat lié, catégorie</span><em>{COURT[draft.category][0].toUpperCase() + COURT[draft.category].slice(1)} {pct(draft.ratePct)}</em><ChevronRight size={18} aria-hidden="true" className="bic-chev" /></summary>
        <div className="bic-ouvert">
          <Field label="Matériel du stock"><select value={draft.equipmentRef ?? ''} onChange={e => { const item = equipment.find(x => x.ref === e.target.value); setDraft(d => ({ ...d, equipmentRef: item?.ref, name: item?.name ?? d.name, acquisitionDate: isoDate(item?.purchaseDate) ?? d.acquisitionDate, acquisitionCents: item?.purchasePrice != null ? Math.round(item.purchasePrice * 100) : d.acquisitionCents })); }}><option value="">Saisie manuelle</option>{equipment.map(e => <option key={e.ref} value={e.ref}>{e.name}</option>)}</select></Field>
          <Field label="Nom de l’immobilisation"><Input value={draft.name} onChange={e => field('name', e.target.value)} required /></Field>
          <Field label="Achat lié"><select value={draft.transactionId ?? ''} onChange={e => setDraft(d => ({ ...d, transactionId: e.target.value || undefined, lineId: undefined, capitalAdjustmentTransactionIds: undefined }))}><option value="">Achat ancien ou à relier</option>{transactions.map(t => <option key={t.id} value={t.id}>{t.description} · {formatCHF(transactionAmount(t))}</option>)}</select></Field>
          {draft.transactionId && <Field label="Ligne de l’achat"><select value={draft.lineId ?? ''} onChange={e => field('lineId', e.target.value || undefined)}><option value="">Achat complet</option>{transactions.find(t => t.id === draft.transactionId)?.finance?.lines.map(l => <option key={l.id} value={l.id}>{l.description} · {formatCHF(l.amountCents)}</option>)}</select></Field>}
          {credits.length > 0 && <div className="bic-avoirs"><p><b>Avoirs sur cet achat</b></p><p className="bic-note">Corrige la valeur d’acquisition ci-dessus, puis coche les avoirs déjà déduits de ce coût. Pour un ancien bien, vérifie aussi sa valeur comptable d’ouverture.</p>
            {credits.map(credit => <label className="bic-check" key={credit.id}><input type="checkbox" checked={draft.capitalAdjustmentTransactionIds?.includes(credit.id) ?? false} onChange={e => field('capitalAdjustmentTransactionIds', e.target.checked ? [...(draft.capitalAdjustmentTransactionIds ?? []), credit.id] : (draft.capitalAdjustmentTransactionIds ?? []).filter(id => id !== credit.id))} />{credit.description} · {formatCHF(transactionAmount(credit))}</label>)}</div>}
          <Field label="Catégorie AFC à confirmer"><select value={draft.category} onChange={e => { const category = e.target.value as DepreciationCategory; setDraft(d => ({ ...d, category, ratePct: taux(category, d.method) })); }}>{DEPRECIATION_CATEGORIES.map(c => <option key={c.id} value={c.id}>{CATEGORIES_LIBELLES[c.id]}</option>)}</select></Field>
          <Field label="Taux annuel (%)"><NumberInput value={draft.ratePct} onValue={v => field('ratePct', v ?? 0)} min={0} max={100} /></Field>
          <p className="bic-note">Les années précédentes ne sont pas recalculées. Pour un bien neuf, la valeur d’ouverture est nulle ; l’acquisition est ajoutée dans son année.</p>
        </div></details>
      <details className="bic-row" data-booster="cession"><summary><span>Vendue ou mise au rebut</span><em>{isoDate(draft.disposedDate) ? court(draft.disposedDate) : 'non'}</em><ChevronRight size={18} aria-hidden="true" className="bic-chev" /></summary>
        <div className="bic-ouvert">
          <Field label="Date de cession"><input type="date" value={draft.disposedDate ?? ''} onChange={e => field('disposedDate', e.target.value || undefined)} /></Field>
          <label className="finance-field">Produit de la cession (CHF)<ChampNombre aria-label="Produit de la cession (CHF)" value={draft.disposalProceedsCents == null ? undefined : draft.disposalProceedsCents / 100} onValue={v => field('disposalProceedsCents', v == null ? undefined : Math.round(v * 100))} max={BORNES_FINANCE.operationCents.valeur / 100} maxDecimales={2} dire /></label>
          <Field label="Vente de ce matériel liée"><select value={draft.disposalTransactionId ?? ''} onChange={e => field('disposalTransactionId', e.target.value || undefined)}><option value="">À relier si déjà enregistrée dans les ventes</option>{StorageService.getTransactions().filter(t => t.category === 'recettes' && !t.finance?.voidedAt).map(t => <option key={t.id} value={t.id}>{t.description} · {formatCHF(transactionAmount(t))}</option>)}</select></Field>
          <p className="bic-note">Relie la vente déjà enregistrée pour compter son produit une seule fois.</p>
        </div></details>
    </div>
  </FormSheet>;
}
const CATEGORIES_LIBELLES: Record<DepreciationCategory, string> = { tanks: 'Cuves et conteneurs', furniture: 'Installations et mobilier', production: 'Machines de production', electronics: 'Informatique et mesure électronique', tools: 'Outillage et instruments', custom: 'Taux personnalisé' };
