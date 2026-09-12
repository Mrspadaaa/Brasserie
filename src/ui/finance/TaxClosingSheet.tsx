import React, { useEffect, useRef, useState } from 'react';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { Sheet } from '../Sheet';
import { Field, MoneyInput, idFor } from './FinanceForms';
import { DocumentProofLink } from './DocumentProofLink';
import { DriveConnection } from './DriveConnection';
import { emptyTaxClosing, TAX_REVIEWS, taxBasisKey, validateTaxClosing } from '../../domain/finance/fribourgTax';
import { formatCHF } from '../../domain/finance/ledger';
import type { AnnualReport, FinancialClosing, FribourgTaxClosing, TaxAttachment, TaxBalanceLine, TaxCorrection } from '../../domain/finance/types';
import { FinanceService } from '../../services/financeService';
import { FirestoreRepo } from '../../services/firestoreRepo';
import { saveFinanceDocumentConfirmed, type prepareFinanceDocument } from '../../services/financeDocuments';

export type TaxSection = 'checks' | 'balance' | 'corrections' | 'attachments' | 'wealth';
export function TaxClosingSheet({ closing, report, section = 'checks', onClose, onSaved }: {
  closing?: FinancialClosing; report: AnnualReport; section?: TaxSection; onClose: () => void; onSaved: (id: string) => void;
}) {
  const [draft, setDraft] = useState<FribourgTaxClosing>(() => {
    const saved = structuredClone(closing?.tax ?? emptyTaxClosing());
    if (saved.reviewedBasis !== taxBasisKey(report)) saved.reviews = {};
    return saved;
  });
  const [page, setPage] = useState(section), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const basisKey = taxBasisKey(report), lastBasis = useRef(basisKey);
  useEffect(() => {
    if (lastBasis.current !== basisKey) { lastBasis.current = basisKey; setDraft(d => ({ ...d, reviews: {} })); setError('Les comptes ont changé pendant la saisie. Vérifie à nouveau les contrôles de l’année.'); }
  }, [basisKey]);
  const [attachmentKind, setAttachmentKind] = useState<TaxAttachment['kind']>('bank');
  const [attachmentAsset, setAttachmentAsset] = useState('');
  const files = useRef(new Map<string, ReturnType<typeof prepareFinanceDocument>>());
  const busyRef = useRef(false), fileInput = useRef<HTMLInputElement>(null);
  const [draftId] = useState(() => closing && !closing.report ? closing.id : idFor(`CLOTURE-${report.year}`));
  const updateBalance = (id: string, patch: Partial<TaxBalanceLine>) => setDraft(d => ({ ...d, balances: d.balances.map(b => b.id === id ? { ...b, ...patch } : b), reviews: { ...d.reviews, balance: false } }));
  const updateCorrection = (id: string, patch: Partial<TaxCorrection>) => setDraft(d => ({ ...d, corrections: d.corrections.map(c => c.id === id ? { ...c, ...patch } : c), reviews: { ...d.reviews, privateUse: false, social: false } }));
  const attach = async (selected: FileList | null) => {
    if (!selected?.length || busyRef.current) return;
    busyRef.current = true; setBusy(true); setError('');
    try {
      if (attachmentKind === 'asset' && !attachmentAsset) throw Error('Choisis le matériel concerné avant de joindre son justificatif.');
      const { prepareTaxAttachment } = await import('../../services/taxArchive');
      for (const file of Array.from(selected)) {
        const prepared = await prepareTaxAttachment(file);
        files.current.set(prepared.id, prepared);
        setDraft(d => ({ ...d, attachments: [...d.attachments, { id: prepared.id, documentId: prepared.id, fileName: prepared.fileName, mimeType: prepared.mimeType, kind: attachmentKind, label: file.name.replace(/\.[^.]+$/, ''), assetId: attachmentKind === 'asset' ? attachmentAsset : undefined }] }));
      }
    } catch (e) { setError((e as Error).message); }
    finally { busyRef.current = false; setBusy(false); if (fileInput.current) fileInput.current.value = ''; }
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError('');
    try {
      const tax = { ...draft, reviewedBasis: taxBasisKey(report) };
      validateTaxClosing(tax);
      const value: FinancialClosing = { ...(closing ?? { year: report.year, openingInventory: [], closingInventory: [], inventoriesConfirmed: false, adjustments: [] }), id: draftId, year: report.year, createdAt: new Date().toISOString(), report: undefined, tax };
      // Confirm each original first. Only then publish the closing references;
      // failed uploads remain staged for a safe retry with the same document ID.
      for (const a of draft.attachments) {
        const prepared = files.current.get(a.documentId);
        if (prepared) { await saveFinanceDocumentConfirmed(prepared, report.year); files.current.delete(a.documentId); }
      }
      FinanceService.saveClosing(value);
      await FirestoreRepo.waitForDocument('financialClosings', value.id, 15_000, saved => saved.createdAt === value.createdAt);
      onSaved(value.id); onClose();
    } catch (e) { setError((e as Error).message); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const cashSum = draft.balances.filter(b => ['bank', 'cash'].includes(b.kind)).reduce((n, b) => n + b.amountCents, 0);
  return <Sheet open title={`Préparer les impôts ${report.year}`} subtitle="Partie brasserie · indépendant à Fribourg" className="finance-sheet" onClose={onClose} dismissible={false}
    footer={<div className="finance-actions"><button type="button" disabled={busy} className="finance-action secondary" onClick={onClose}>Annuler</button><button type="submit" form="tax-closing-form" className="finance-action" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button></div>}>
    <form id="tax-closing-form" className="finance-form" onSubmit={save}>
      {error && <p role="alert" className="finance-error">{error}</p>}
      <Field label="Étape à compléter"><select value={page} onChange={e => setPage(e.target.value as TaxSection)}><option value="checks">Vérifications de l’année</option><option value="balance">Comptes et dettes</option><option value="corrections">Corrections fiscales</option><option value="attachments">Pièces complémentaires</option><option value="wealth">Report de fortune</option></select></Field>
      {page === 'checks' && <>
        <Field label="La brasserie est mon activité"><select value={draft.activity ?? ''} onChange={e => setDraft({ ...draft, activity: e.target.value as 'main' | 'secondary' || undefined })}><option value="">Choisir ma situation</option><option value="main">Principale</option><option value="secondary">Accessoire (en plus d’une autre activité)</option></select></Field>
        <p className="finance-muted">Coche chaque point après vérification. Tu peux enregistrer et revenir plus tard.</p>
        <div className="tax-review-list">{TAX_REVIEWS.map(r => <div key={r.key}><label className="finance-check"><input type="checkbox" checked={!!draft.reviews[r.key]} onChange={e => setDraft({ ...draft, reviews: { ...draft.reviews, [r.key]: e.target.checked } })}/><strong>{r.label}</strong></label><p className="finance-muted">{r.help}</p></div>)}</div>
        <Field label="Situations particulières et vérifications effectuées"><textarea rows={3} value={draft.specialCaseNote ?? ''} onChange={e => setDraft({ ...draft, specialCaseNote: e.target.value, reviews: { ...draft.reviews, specialCases: false } })} placeholder="Par exemple : aucune situation particulière, ou traitement vérifié des pertes antérieures."/></Field>
      </>}
      {page === 'balance' && <>
        <p className="finance-muted">Soldes professionnels au 31 décembre {report.year}. Les factures ouvertes, stocks et amortissements viennent déjà de l’app. Ajoute ici les comptes, la caisse et les autres actifs ou dettes qui n’y figurent pas.</p>
        <div className="tax-reconciliation"><span>Banque et caisse saisies<strong>{formatCHF(cashSum)}</strong></span><span>Trésorerie calculée<strong>{report.cashCents == null ? 'À compléter' : formatCHF(report.cashCents)}</strong></span></div>
        {report.cashCents != null && cashSum !== report.cashCents && <p className="finance-notice">Écart à expliquer et corriger : {formatCHF(cashSum - report.cashCents)}. Ce rapprochement ne crée aucun mouvement d’argent.</p>}
        {draft.balances.map(b => <fieldset className="finance-item-editor" key={b.id}><legend>{b.label || 'Compte ou dette'}</legend>
          <Field label="Nature du solde"><select value={b.kind} onChange={e => updateBalance(b.id, { kind: e.target.value as TaxBalanceLine['kind'], amountCents: Math.max(0, b.amountCents) })}><option value="bank">Compte bancaire</option><option value="cash">Caisse en espèces</option><option value="other-asset">Autre actif absent des comptes</option><option value="loan">Emprunt encore dû</option><option value="other-liability">Autre dette absente du journal</option></select></Field>
          <Field label="Compte ou nom du tiers"><input value={b.label} onChange={e => updateBalance(b.id, { label: e.target.value })} placeholder="Banque, caisse, prêteur…" required/></Field>
          <MoneyInput signed={b.kind === 'bank'} label="Solde au 31 décembre (CHF)" value={b.amountCents} onChange={v => updateBalance(b.id, { amountCents: v ?? 0 })} required/>
          {b.kind !== 'cash' && <><Field label="Référence (compte, contrat ou élément)"><input value={b.reference ?? ''} onChange={e => updateBalance(b.id, { reference: e.target.value })}/></Field><Field label="Adresse du tiers"><textarea rows={2} value={b.address ?? ''} onChange={e => updateBalance(b.id, { address: e.target.value })}/></Field></>}
          <Field label="Justification ou précision"><input value={b.note ?? ''} onChange={e => updateBalance(b.id, { note: e.target.value })}/></Field>
          <button type="button" className="finance-link" onClick={() => setDraft({ ...draft, balances: draft.balances.filter(r => r.id !== b.id), reviews: { ...draft.reviews, balance: false } })}><Trash2 size={16}/>Retirer cette ligne</button>
        </fieldset>)}
        <button type="button" className="finance-action secondary" onClick={() => setDraft({ ...draft, balances: [...draft.balances, { id: idFor('SOLDE'), kind: 'bank', label: '', amountCents: 0 }], reviews: { ...draft.reviews, balance: false } })}><Plus size={18}/>Ajouter un compte ou une dette</button>
        {!!report.outstanding?.length && <><h3>Factures ouvertes au 31 décembre</h3><p className="finance-muted">Leurs montants sont déjà inclus. Complète seulement l’identité des tiers.</p>{report.outstanding.map(r => <fieldset key={r.id} className="finance-item-editor"><legend>{r.description}</legend><p className="finance-muted">{r.direction === 'in' ? 'À recevoir' : 'À payer'} : {formatCHF(r.amountCents)} · {r.id}</p><Field label="Nom du client ou fournisseur"><input value={draft.counterparties[r.id]?.name ?? r.counterparty} onChange={e => setDraft({ ...draft, counterparties: { ...draft.counterparties, [r.id]: { address: draft.counterparties[r.id]?.address ?? r.address, name: e.target.value } }, reviews: { ...draft.reviews, balance: false } })}/></Field><Field label="Adresse du client ou fournisseur"><textarea rows={2} value={draft.counterparties[r.id]?.address ?? r.address} onChange={e => setDraft({ ...draft, counterparties: { ...draft.counterparties, [r.id]: { name: draft.counterparties[r.id]?.name ?? r.counterparty, address: e.target.value } }, reviews: { ...draft.reviews, balance: false } })}/></Field></fieldset>)}</>}
      </>}
      {page === 'corrections' && <>
        <p className="finance-muted">Le résultat contient déjà les dépenses professionnelles, l’inventaire, les amortissements et les ajustements de clôture. Utilise « Déjà pris en compte » pour documenter une somme sans la compter à nouveau.</p>
        {draft.corrections.map(c => <fieldset className="finance-item-editor" key={c.id}><legend>{c.label || 'Correction'}</legend>
          <Field label="Nature de la correction"><select value={c.kind} onChange={e => updateCorrection(c.id, { kind: e.target.value as TaxCorrection['kind'], treatment: 'included' })}><option value="social">Cotisations AVS / AI / APG</option><option value="private-use">Bière et frais à usage privé</option><option value="non-deductible">Charge non déductible de l’activité</option><option value="other">Autre correction documentée</option></select></Field>
          <Field label="Motif de la correction"><input required value={c.label} onChange={e => updateCorrection(c.id, { label: e.target.value })}/></Field>
          <MoneyInput label="Montant concerné (CHF)" value={c.amountCents} onChange={v => updateCorrection(c.id, { amountCents: v ?? 0 })} required/>
          <Field label="Traitement de ce montant"><select value={c.treatment} onChange={e => updateCorrection(c.id, { treatment: e.target.value as TaxCorrection['treatment'] })}><option value="included">Déjà pris en compte · aucun effet supplémentaire</option>{c.kind !== 'social' && <option value="add">Ajouter au résultat · montant à réintégrer</option>}{['social', 'other'].includes(c.kind) && <option value="deduct">Déduire du résultat · pas encore déduit</option>}</select></Field>
          <Field label="Référence d’écriture ou d’ajustement (si connue)"><input value={c.sourceId ?? ''} onChange={e => updateCorrection(c.id, { sourceId: e.target.value || undefined })}/></Field>
          <Field label="Justification et document à l’appui"><textarea required rows={3} value={c.note} onChange={e => updateCorrection(c.id, { note: e.target.value })} placeholder="Calcul, exercice concerné et référence du justificatif."/></Field>
          <button type="button" className="finance-link" onClick={() => setDraft({ ...draft, corrections: draft.corrections.filter(r => r.id !== c.id), reviews: { ...draft.reviews, social: false, privateUse: false } })}><Trash2 size={16}/>Retirer cette correction</button>
        </fieldset>)}
        <button type="button" className="finance-action secondary" onClick={() => setDraft({ ...draft, corrections: [...draft.corrections, { id: idFor('FISC'), kind: 'social', label: 'Cotisations sociales de l’indépendant', amountCents: 0, treatment: 'included', note: '' }], reviews: { ...draft.reviews, social: false, privateUse: false } })}><Plus size={18}/>Documenter une correction</button>
        <p className="finance-muted">Le montant d’un prochain fermenteur ou d’une hotte prévue n’est pas une charge de cette année. Le pilier 3a se déclare dans la partie personnelle.</p>
      </>}
      {page === 'attachments' && <>
        <DriveConnection/>
        <p className="finance-muted">Les factures enregistrées seront jointes automatiquement au dossier. Ajoute ici les relevés de fin d’année, décomptes AVS, inventaires signés et annexes remplies.</p>
        <Field label="Type de document à ajouter"><select value={attachmentKind} onChange={e => setAttachmentKind(e.target.value as TaxAttachment['kind'])}><option value="bank">Relevé bancaire</option><option value="social">Décompte de cotisations sociales</option><option value="inventory">Inventaire signé</option><option value="tax-form">Annexe fiscale remplie</option><option value="asset">Matériel ou valeur de reprise</option><option value="other">Autre justificatif</option></select></Field>
        {attachmentKind === 'asset' && <Field label="Matériel justifié"><select value={attachmentAsset} onChange={e => setAttachmentAsset(e.target.value)}><option value="">Choisir le matériel</option>{report.assetEvidence?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></Field>}
        <input ref={fileInput} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" multiple className="hidden" onChange={e => void attach(e.target.files)}/>
        <button className="finance-action secondary" type="button" disabled={busy} onClick={() => fileInput.current?.click()}><Plus size={18}/>Joindre des documents</button>
        <p className="finance-muted">PDF ou image · 4 Mo par fichier · aucune lecture IA. FriTax indique 3 Mo maximum par pièce transmise : conserve l’original et prépare une copie plus légère au besoin.</p>
        {draft.attachments.map(a => <div className="finance-item-editor" key={a.id}><p className="tax-file-name"><FileText size={17}/>{a.fileName}</p><Field label="Nom dans le dossier"><input required value={a.label} onChange={e => setDraft({ ...draft, attachments: draft.attachments.map(r => r.id === a.id ? { ...r, label: e.target.value } : r) })}/></Field>
          <DocumentProofLink transaction={{ id: a.id, date: `${report.year}-12-31`, description: a.label, amountHT: 0, amountTTC: 0, tvaRate: 0, tvaAmount: 0, category: 'divers', subcategory: '', proofFileName: a.fileName, proofType: a.mimeType,
            ...(files.current.has(a.documentId) ? { proofUrl: files.current.get(a.documentId)!.parts.join('') } : { finance: { version: 1, kind: 'expense', amountCents: 0, lines: [], proofDocumentId: a.documentId } }) }}/>
          <button type="button" className="finance-link" onClick={() => setDraft({ ...draft, attachments: draft.attachments.filter(r => r.id !== a.id) })}><Trash2 size={16}/>Retirer de cette version</button></div>)}
      </>}
      {page === 'wealth' && <>
        <p className="finance-muted">Utilise l’état des actifs et passifs fourni dans le dossier pour remplir l’annexe 05. Confirme ici le montant de fortune mobilière qui en résulte, après vérification des comptes, titres et dettes déclarés ailleurs.</p>
        <p className="finance-notice">Le patrimoine net comptable n’est pas automatiquement le montant fiscal à reporter. La confirmation évite une double déclaration.</p>
        <MoneyInput label="Montant de fortune issu de l’annexe 05 (CHF)" value={draft.movableWealth?.amountCents} onChange={v => setDraft({ ...draft, movableWealth: v == null ? undefined : { amountCents: v, note: draft.movableWealth?.note ?? '', confirmed: false } })}/>
        <Field label="Provenance et rapprochement"><textarea rows={3} value={draft.movableWealth?.note ?? ''} onChange={e => setDraft({ ...draft, movableWealth: { amountCents: draft.movableWealth?.amountCents, note: e.target.value, confirmed: false } })} placeholder="Référence de l’annexe remplie et explication des montants déclarés ailleurs."/></Field>
        <label className="finance-check"><input type="checkbox" checked={!!draft.movableWealth?.confirmed} disabled={draft.movableWealth?.amountCents == null || !draft.movableWealth.note.trim()} onChange={e => setDraft({ ...draft, movableWealth: { ...draft.movableWealth!, confirmed: e.target.checked } })}/>J’ai vérifié ce montant dans l’annexe officielle de l’année.</label>
      </>}
    </form>
  </Sheet>;
}
