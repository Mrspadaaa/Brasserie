import React, { useRef, useState } from 'react';
import type { AppConfig, Client, PricingItem, Transaction } from '../../types';
import { Sheet } from '../Sheet';
import { NumberInput } from '../NumberInput';
import { prepareFinanceDocument } from '../../services/financeDocuments';
import { saveIncomeEntry, type IncomeEntry } from '../../services/incomeEntry';
import { DriveConnection } from './DriveConnection';
import { invoiceTotals, SwissQrBillService, type InvoiceItem } from '../../services/swissQrBill';
import { todayISO, isoDate, formatCHF } from '../../domain/finance/ledger';
import './finance.css';

export function InvoiceSheet({ client, config, tarifs, onClose, onSaved }: { client: Client; config: AppConfig; tarifs: PricingItem[]; onClose: () => void; onSaved?: () => void }) {
  const id = useRef(`FAC-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8)}`);
  const [items, setItems] = useState<InvoiceItem[]>([{ description: '', quantity: 1, unitPriceHT: 0, tvaRate: config.fiscal.tvaNormalRate }]);
  const [date, setDate] = useState(todayISO()), [dueDate, setDueDate] = useState(''), [error, setError] = useState('');
  const saving = useRef(false);
  const pending = useRef<{ entry: IncomeEntry; pdf: ReturnType<typeof SwissQrBillService.generateInvoicePdf> } | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  let totalCents: number | null = null;
  try { totalCents = invoiceTotals(items, config.fiscal.isTvaRegistered).totalCents; } catch { /* Incomplete lines remain editable. */ }
  const update = (index: number, patch: Partial<InvoiceItem>) => setItems(rows => rows.map((row, i) => i === index ? { ...row, ...patch } : row));
  const save = async () => {
    if (saving.current) return;
    saving.current = true; setBusy(true); setError('');
    try {
      if (!pending.current) {
      if (!isoDate(date) || !isoDate(dueDate) || dueDate < date) throw new Error('Renseigne une date et une échéance valides.');
      const totals = invoiceTotals(items, config.fiscal.isTvaRegistered);
      if (totals.totalCents <= 0) throw new Error('Le total de la facture doit être positif.');
      const pdf = SwissQrBillService.generateInvoicePdf(client, items, config, id.current, { date, dueDate, download: false });
      const proof = prepareFinanceDocument(`proof-${crypto.randomUUID()}`, pdf.dataUrl.replace(/^data:application\/pdf;[^,]*base64,/, 'data:application/pdf;base64,'), pdf.fileName, 'application/pdf');
      const tx: Transaction = { id: id.current, date, description: `Facture ${client.name} — ${items[0].description}`, amountHT: totals.netCents / 100, amountTTC: totals.totalCents / 100, tvaAmount: totals.vatCents / 100,
        tvaRate: config.fiscal.isTvaRegistered ? config.fiscal.tvaNormalRate : 0, category: 'recettes', subcategory: 'Facture client', proofNotes: `Client: ${client.name}`, proofFileName: pdf.fileName, proofType: 'application/pdf', syncedToDrive: true,
        finance: { version: 1, kind: 'income', amountCents: totals.totalCents, vendor: client.name, invoiceNumber: id.current, dueDate, paymentStatus: 'unpaid', recordedAt: new Date().toISOString(), proofDocumentId: proof.id,
          lines: items.map((item, i) => ({ id: `${id.current}-${i}`, description: item.description.trim(), kind: 'other', quantity: item.quantity, unit: 'pièce', amountCents: totals.lines[i].totalCents })) } };
      pending.current = { entry: { transaction: tx, proof }, pdf };
      }
      await saveIncomeEntry(pending.current.entry);
      pending.current.pdf.doc.save(pending.current.pdf.fileName); onSaved?.(); onClose();
    } catch (e) { setError((e as Error).message); }
    finally { saving.current = false; setBusy(false); }
  };
  return <Sheet open onClose={() => { if (!saving.current) onClose(); }} title={`Facturer ${client.name}`} dismissible={false} className="finance-sheet" footer={<div className="finance-actions"><button type="button" className="finance-action secondary" disabled={busy} onClick={onClose}>Annuler</button><button type="button" className="finance-action" disabled={busy} onClick={() => void save()}>{busy ? 'Enregistrement…' : pending.current ? 'Reprendre la confirmation' : 'Enregistrer et télécharger'}</button></div>}><div className="finance-form">
    <p className="finance-muted">Les articles saisis créent une vente à encaisser. Le PDF contient les instructions de virement.</p>
    <DriveConnection always={Boolean(error)} />
    {pending.current && <p className="finance-notice">La facture préparée est conservée à l’identique pendant sa confirmation, pour éviter un double enregistrement.</p>}
    <fieldset disabled={busy || Boolean(pending.current)} className="finance-form border-0 p-0 m-0">
    <div className="finance-form-grid"><label className="finance-field">Date<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label><label className="finance-field">Échéance<input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></label></div>
    {items.map((item, index) => <fieldset className="finance-item-editor" key={index}><legend>Article {index + 1}</legend>
      <label className="finance-field">Produit<select value="" onChange={e => { const found = tarifs.find(t => t.product === e.target.value); if (found) update(index, { description: found.product, unitPriceHT: found.priceHT }); }}><option value="">Choisir un tarif ou saisir ci-dessous</option>{tarifs.map(t => <option value={t.product} key={t.product}>{t.product}</option>)}</select></label>
      <label className="finance-field">Désignation<input value={item.description} onChange={e => update(index, { description: e.target.value })} placeholder="Bouteille, carton ou fût livré" /></label>
      <div className="finance-form-grid"><label className="finance-field">Quantité<NumberInput value={item.quantity} onValue={v => update(index, { quantity: v ?? 0 })} min={0} /></label><label className="finance-field">Prix unitaire {config.fiscal.isTvaRegistered ? 'HT' : '(CHF)'}<NumberInput value={item.unitPriceHT} onValue={v => update(index, { unitPriceHT: v ?? 0 })} min={0} /></label></div>
      {items.length > 1 && <button type="button" className="finance-action secondary" onClick={() => setItems(rows => rows.filter((_, i) => i !== index))}>Retirer cet article</button>}
    </fieldset>)}
    <button type="button" className="finance-action secondary" onClick={() => setItems(rows => [...rows, { description: '', quantity: 1, unitPriceHT: 0, tvaRate: config.fiscal.tvaNormalRate }])}>Ajouter un article</button>
    <div className="finance-summary flex justify-between items-center gap-3"><span>Total à encaisser</span><strong>{totalCents == null ? 'À compléter' : formatCHF(totalCents)}</strong></div>
    </fieldset>
    {error && <p role="alert" className="finance-error">{error}</p>}
  </div></Sheet>;
}
