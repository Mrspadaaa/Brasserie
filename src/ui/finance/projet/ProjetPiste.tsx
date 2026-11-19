import React from 'react';
import { ArrowRight, Calendar, Check, ChevronRight, Plus, X } from 'lucide-react';
import type { Transaction } from '../../../types';
import type { EquipmentUpgrade, FinancialPlan } from '../../../domain/finance/types';
import { DEPRECIATION_CATEGORIES } from '../../../domain/finance/annual';
import { UPGRADE_TIMINGS, upgradeDetails, upgradeProgress } from '../../../domain/finance/upgrades';
import { isoDate, planInvoiceAllocation, todayISO } from '../../../domain/finance/ledger';
import { Textarea, noAutofillProps } from '../../Input';
import { Field, MoneyInput } from '../prevision/base';
import { STATIONS, estEtapeSaisie, etatPiste, moisDe, montant, quand, resumeUsure, texteAns, type StationId } from './piste';
import './projet.css';

type Progression = ReturnType<typeof upgradeProgress>;
export interface ProjetPisteProps {
  draft: FinancialPlan; plan?: FinancialPlan;
  setDraft: React.Dispatch<React.SetStateAction<FinancialPlan>>;
  patch: (value: Partial<EquipmentUpgrade>) => void;
  setMonth: (value: string) => void;
  ouvert: StationId | null; setOuvert: (station: StationId | null) => void;
  progress: Progression; invoices: Transaction[]; missing: string[]; busy: boolean;
  error: string; erreurRef: React.RefObject<HTMLParagraphElement | null>;
  onClose: () => void; onRealise: () => void; onNoterAchat?: () => void; onOpenTransaction?: (transaction: Transaction) => void;
}

const Interrupteur = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) =>
  <input type="checkbox" className="pjd-sw" aria-label={label} checked={checked} onChange={e => onChange(e.target.checked)} />;

/** m3pm-d : l'en-tête (titre éditable, budget en mono), la piste verticale, les notes. Chaque champ du projet est rangé à sa station ; la station ouverte montre ses champs, les autres tiennent en une ligne. */
export function ProjetPiste(props: ProjetPisteProps) {
  const { draft, plan, setDraft, patch, setMonth, ouvert, setOuvert, progress, invoices, missing, busy, error, erreurRef } = props;
  const detail = draft.upgrade!;
  const piste = etatPiste(draft, invoices.length, todayISO().slice(0, 7));
  const budget = detail.budgetKnown ? montant(draft.amountCents) : null;
  const ferme = !['draft', 'active'].includes(draft.status);
  const bascule = (id: StationId) => setOuvert(ouvert === id ? null : id);
  /* t3 (problème 3), m3pm-d : toucher le titre d'une étape saisie en fait l'étape en cours (les précédentes se cochent), comme son cercle ; Acheté et En service se déduisent et ne font que s'ouvrir. */
  const toucher = (id: StationId) => { if (estEtapeSaisie(id) && detail.stage !== id) { patch({ stage: id as EquipmentUpgrade['stage'] }); setOuvert(id); } else bascule(id); };
  const quandTexte = quand(draft), usure = resumeUsure(draft);
  const devisNote = !!(draft.vendor?.trim() || detail.quoteReference?.trim()) || detail.estimateSource === 'quote';
  const n = invoices.length;

  const tete = (id: StationId): { em?: string; resume?: React.ReactNode; action?: React.ReactNode } => {
    switch (id) {
      case 'idea': return { em: `· ${UPGRADE_TIMINGS[detail.timing]}`, resume: <p>{detail.purpose?.trim() || <span className="pjd-muet">à quoi va-t-il servir ?</span>}</p> };
      case 'research': return {
        em: `· ${detail.estimateSource === 'quote' ? 'devis fournisseur' : 'mon estimation'}`,
        resume: <p>{detail.purchaseCents == null ? <span className="pjd-muet">prix ?</span> : <span className="pjd-m">{montant(detail.purchaseCents)}</span>}
          {' + livraison '}{detail.deliveryCents == null ? '?' : <span className="pjd-m">{montant(detail.deliveryCents)}</span>}
          {detail.installationCents == null ? ' · pose ?' : <>{' + pose '}<span className="pjd-m">{montant(detail.installationCents)}</span></>}</p>,
      };
      case 'quote': return { em: devisNote ? `· ${draft.vendor?.trim() ? draft.vendor.trim() : 'devis noté'}` : '· aucun noté',
        action: <button type="button" className="pjd-a" aria-expanded={ouvert === 'quote'} onClick={() => bascule('quote')}>{devisNote ? 'Modifier le devis' : <><Plus aria-hidden="true" />Noter un devis</>}</button> };
      case 'ready': return { em: piste.actuelle === 'ready' ? '· tu en es là' : undefined,
        resume: <p>{quandTexte ? `Prévu en ${quandTexte}` : 'mois du paiement à choisir'}{' · '}{draft.status === 'active' ? 'dans mes prévisions' : 'pas dans mes prévisions'}</p> };
      case 'bought': return { em: n ? `· ${n} achat${n > 1 ? 's' : ''} lié${n > 1 ? 's' : ''} : ${progress.invoicedComplete ? montant(progress.invoicedCents) : 'à répartir'}` : '· achats liés : aucun',
        action: props.onNoterAchat ? <button type="button" className="pjd-a" onClick={props.onNoterAchat}>Noter l’achat<ArrowRight aria-hidden="true" /></button> : undefined };
      case 'service': return { em: '· son usure', resume: <p>{usure.ans == null ? 'durée ?' : texteAns(usure.ans)}{' · '}{usure.parAnCents == null ? 'usure ?' : <><span className="pjd-m">{montant(usure.parAnCents)}</span> par an</>}{' · mise en service '}{usure.mise ? moisDe(usure.mise) : '?'}</p> };
    }
  };

  const corps = (id: StationId): React.ReactNode => {
    switch (id) {
      case 'idea': return <>
        <Field label="À quoi va-t-il servir ?"><Textarea rows={2} value={detail.purpose ?? ''} onChange={e => patch({ purpose: e.target.value })} placeholder="Évacuer la vapeur, libérer un fermenteur, augmenter le volume…" /></Field>
        <div role="group" aria-label="Quand ce projet devient-il utile ?" className="pjd-seg">
          {Object.entries(UPGRADE_TIMINGS).map(([value, label]) => <button key={value} type="button" aria-pressed={detail.timing === value} onClick={() => patch({ timing: value as EquipmentUpgrade['timing'] })}>{label}</button>)}
        </div></>;
      case 'research': return <>
        <div className="pjd-g2">
          <MoneyInput label="Prix estimé TTC (CHF)" value={detail.purchaseCents} onChange={value => patch({ purchaseCents: value })} />
          <MoneyInput label="Livraison TTC (CHF)" value={detail.deliveryCents} onChange={value => patch({ deliveryCents: value })} />
          <MoneyInput label="Installation TTC (CHF)" value={detail.installationCents} onChange={value => patch({ installationCents: value })} />
          <Field label="D’où vient le prix ?"><select value={detail.estimateSource} onChange={e => patch({ estimateSource: e.target.value as EquipmentUpgrade['estimateSource'] })}><option value="estimate">Mon estimation</option><option value="quote">Devis fournisseur</option></select></Field>
        </div>
        <div className="upgrade-budget flex flex-wrap items-center justify-between gap-x-4 gap-y-1"><span>Budget total TTC</span><strong className="finance-money">{budget ?? 'À estimer'}</strong></div>
        <small className="pjd-muet">Frais laissés vides : non chiffrés. Pense à la pose et au raccordement.</small></>;
      case 'quote': return <>
        <Field label="Fournisseur"><input value={draft.vendor ?? ''} onChange={e => setDraft(d => ({ ...d, vendor: e.target.value }))} {...noAutofillProps} /></Field>
        <Field label="Référence ou détails du devis"><Textarea rows={2} value={detail.quoteReference ?? ''} onChange={e => patch({ quoteReference: e.target.value })} placeholder="Référence, date, durée de validité, ce qui est compris…" /></Field></>;
      case 'ready': return ferme
        ? <p className="pjd-muet" role="status">{draft.status === 'completed' ? 'Projet réalisé. Les achats liés restent dans les analyses.' : 'Projet archivé. Tu peux le reprendre quand il redevient utile.'}</p>
        : <>
          <div className="pjd-l"><span>Prévu en</span>
            <label className="pjd-mois"><Calendar aria-hidden="true" /><span>{quandTexte ?? 'Mois'}</span>
              <input type="month" aria-label="Paiement prévu en" value={draft.date.slice(0, 7)} onInput={e => setMonth(e.currentTarget.value)} onChange={e => setMonth(e.target.value)} onClick={e => { try { e.currentTarget.showPicker?.(); } catch { /* saisie au clavier */ } }} />
            </label></div>
          <label className="pjd-l pjd-incl"><span><b>Inclure dans mes prévisions</b>
            <small>{draft.status === 'active' ? (missing.length ? missing.join(' ') : quandTexte ? `compté dans les sorties de ${quandTexte}` : 'compté dans les sorties prévues') : 'le projet reste dans tes idées de matériel'}</small></span>
            <Interrupteur label="Inclure dans mes prévisions" checked={draft.status === 'active'} onChange={v => setDraft(d => ({ ...d, status: v ? 'active' : 'draft' }))} /></label></>;
      case 'bought': return <>
        {n > 0 && <>
          <div className="pjd-l"><span>Paiements enregistrés, remboursements déduits</span><b className="pjd-m">{progress.paymentKnown ? montant(progress.paidCents) : 'à confirmer'}</b></div>
          {!progress.invoicedComplete && <p className="pjd-muet" role="status">Une facture mixte ou un avoir reste à répartir : ouvre la facture dans le journal pour confirmer la part liée au projet.</p>}
          {invoices.map(tx => {
            const part = planInvoiceAllocation(tx).amountCents, date = isoDate(tx.date);
            const contenu = <><span><b>{tx.description}</b><small>{date ? new Date(`${date}T12:00:00`).toLocaleDateString('fr-CH') : 'Date à confirmer'} · part du projet</small></span><b className="pjd-m">{part == null ? 'à répartir' : montant(part)}</b></>;
            return props.onOpenTransaction ? <button type="button" className="pjd-l pjd-fact" key={tx.id} onClick={() => props.onOpenTransaction!(tx)}>{contenu}<ChevronRight aria-hidden="true" /></button> : <div className="pjd-l pjd-fact" key={tx.id}>{contenu}</div>;
          })}
          <small className="pjd-muet">Facturé pour ce projet, avoirs déduits ; les achats restent dans les comptes même si le projet est archivé.</small></>}
        {n === 0 && <small className="pjd-muet">Aucun achat lié. « Noter l’achat » relie la facture à ce projet.</small>}
        {plan && !ferme && <button type="button" className="pjd-lien" disabled={busy} onClick={props.onRealise}>Marquer comme réalisé</button>}</>;
      case 'service': return <>
        <Field label="Catégorie d’usure"><select value={detail.depreciationCategory ?? ''} onChange={e => patch({ depreciationCategory: (e.target.value || undefined) as EquipmentUpgrade['depreciationCategory'] })}><option value="">À préciser</option>{DEPRECIATION_CATEGORIES.filter(c => c.linearRate > 0).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></Field>
        <div className="pjd-g2">
          <Field label="Durée d’usage (années)"><input inputMode="decimal" value={detail.usefulLifeYears == null ? '' : String(detail.usefulLifeYears).replace('.', ',')} placeholder="5" autoComplete="off"
            onChange={e => { const v = Number(e.target.value.trim().replace(',', '.')); patch({ usefulLifeYears: e.target.value.trim() && Number.isFinite(v) && v > 0 ? v : undefined }); }} /></Field>
          <Field label="Mise en service prévue"><span className={detail.inServiceMonth ? 'pjd-mw' : 'pjd-mw pjd-vide'} data-vide="À poser"><input type="month" value={detail.inServiceMonth ?? ''} onChange={e => patch({ inServiceMonth: e.target.value || undefined })} /></span></Field>
        </div>
        <small className="pjd-muet">L’usure (linéaire) entre dans le coût du litre dès la mise en service. Sans durée, la catégorie donne la durée (100 ÷ taux linéaire AFC) ; sans les deux, elle reste « à renseigner », jamais 0.</small></>;
    }
  };

  return <div className="pjd">
    <div className="pjd-h">
      {plan && <button type="button" className="pjd-x" aria-label="Fermer" onClick={props.onClose}><X aria-hidden="true" /></button>}
      <input className="pjd-titre" aria-label="Matériel ou aménagement" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} placeholder="Hotte, fermenteur, nouvelle cuverie…" {...noAutofillProps} />
      <b className="pjd-m pjd-b" title={budget ? undefined : 'Budget à estimer'}>{budget ?? '—'}</b>
      {!plan && <button type="button" className="pjd-x" aria-label="Fermer" onClick={props.onClose}><X aria-hidden="true" /></button>}
    </div>
    {error && <p ref={erreurRef} role="alert" className="finance-error">{error}</p>}
    <ol className="pjd-p" data-booster="piste-projet">
      {STATIONS.map(s => {
        const fait = piste.faites.has(s.id), ici = piste.actuelle === s.id, ouverte = ouvert === s.id, t = tete(s.id);
        const cercle = fait ? <Check aria-hidden="true" /> : null;
        return <li key={s.id} data-station={s.id} aria-current={ici ? 'step' : undefined} className={`pjd-s${fait ? ' pjd-fait' : ''}${ici ? ' pjd-ici' : ''}${!fait && !ici ? ' pjd-pas' : ''}`}>
          {estEtapeSaisie(s.id)
            ? <button type="button" className="pjd-o" aria-label={`Placer le projet à l’étape ${s.label}`} aria-pressed={detail.stage === s.id} onClick={() => { patch({ stage: s.id as EquipmentUpgrade['stage'] }); setOuvert(s.id); }}>{cercle}</button>
            : <span className="pjd-o" aria-hidden="true">{cercle}</span>}
          <div className="pjd-n">
            <div className="pjd-hl">
              <h3><button type="button" className="pjd-ent" aria-expanded={ouverte} aria-controls={`pjd-c-${s.id}`} onClick={() => toucher(s.id)}>{s.label}{t.em && <em>{t.em}</em>}</button></h3>
              {t.action}
            </div>
            {!ouverte && t.resume}
            <div className="pjd-corps" id={`pjd-c-${s.id}`} data-ferme={ouverte ? undefined : ''}>{corps(s.id)}</div>
          </div>
        </li>;
      })}
    </ol>
    <details className="pjd-plus"><summary><span>Avancement et notes</span><ChevronRight aria-hidden="true" /></summary>
      <div className="pjd-champs">
        <Field label="Avancement du projet"><select value={detail.stage} onChange={e => { patch({ stage: e.target.value as EquipmentUpgrade['stage'] }); }}>{STATIONS.filter(s => estEtapeSaisie(s.id)).map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></Field>
        <Field label="Notes du projet"><Textarea rows={3} value={draft.notes ?? ''} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} /></Field>
      </div></details>
  </div>;
}
