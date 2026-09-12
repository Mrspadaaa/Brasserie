import React, { useState } from 'react';
import { useSyncedDraft } from '../hooks/useLiveData';
import { NumberInput } from '../ui/NumberInput';
import { X, Save, FileText, Check, Copy, Camera, UploadCloud, Download } from 'lucide-react';
import { Transaction, FinanceCategory } from '../types';
import { StorageService } from '../services/storage';
import { DriveService } from '../services/driveService';
import { ReceiptService } from '../services/receiptService';
import { ModalShell, StickyActions } from '../ui/ModalShell';
import { inputClass } from '../ui/FormNav';

interface EditTransactionModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSave: (updated: Transaction) => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  transaction,
  onClose,
  onSave
}) => {
  const [draft, setDraft] = useSyncedDraft(isOpen ? transaction : null, transaction?.id);
  const [copiedDrive, setCopiedDrive] = useState(false);
  const [saveError,setSaveError]=useState('');
  if (!isOpen || !transaction || !draft) return null;
  const { description, category, subcategory = '', date, amountHT, tvaRate,
    proofNotes = '', proofUrl, proofFileName } = draft;
  const field = <K extends keyof Transaction>(key: K, value: Transaction[K]) =>
    setDraft(current => current?.id === transaction.id ? { ...current, [key]: value } : current);

  // An edited label must never re-tax a historical non-VAT receipt.
  const moneyLocked = !!draft.finance;
  const moneyChanged = amountHT !== transaction.amountHT || tvaRate !== transaction.tvaRate;
  const effectiveRate = StorageService.getConfig().fiscal.isTvaRegistered ? tvaRate : 0;
  const tvaAmount = moneyChanged ? Math.round(amountHT * effectiveRate * 100) / 100 : draft.tvaAmount;
  const amountTTC = moneyChanged ? Math.round((amountHT + tvaAmount) * 100) / 100 : draft.amountTTC;

  const currentDrivePath = DriveService.generateDrivePath({
    ...draft,
    category,
    date,
    amountHT,
    amountTTC,
    proofNotes
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Transaction = {
      ...draft,
      description: description.trim(),
      category,
      subcategory: subcategory.trim() || 'Divers',
      date: date.trim(),
      amountHT,
      tvaRate,
      tvaAmount,
      amountTTC,
      ...(draft.finance ? { finance: { ...draft.finance, amountCents: Math.round(amountTTC * 100) } } : {}),
      proofNotes: proofNotes.trim(),
      proofUrl,
      proofFileName
    };
    try {
      StorageService.updateTransaction(updated);
      onSave(updated);
      onClose();
    } catch (error) {
      setSaveError((error as Error).message);
    }
  };

  const handleCopyDrive = () => {
    navigator.clipboard.writeText(currentDrivePath);
    setCopiedDrive(true);
    setTimeout(() => setCopiedDrive(false), 2000);
  };

  return (
    <ModalShell open={isOpen} onClose={onClose} size="lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-cave-800 bg-cave-900/90 shrink-0">
        <div>
          <span className="text-footnote text-ebc-straw font-bold uppercase tracking-wider font-mono">
            {transaction.id}
          </span>
          <h3 className="font-bold text-base text-cave-50">Modifier l'écriture comptable</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="p-2 text-cave-400 hover:text-cave-200 bg-cave-850 rounded-full transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSave} autoComplete="off" className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-sm overscroll-contain">
        {saveError&&<p role="alert" className="finance-error">{saveError}</p>}
        {moneyLocked&&<p className="text-sm text-cave-200">Les montants validés sont conservés. Pour une correction financière, utilise un avoir ou l’annulation de l’écriture.</p>}
        {/* Description */}
        <div>
          <label className="text-cave-200 font-semibold block mb-1 text-xs sm:text-sm">Description / Intitulé</label>
          <input
            type="text"
            name="tx_edit_label"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            required
            value={description}
            onChange={(e) => field('description', e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Category & Subcategory */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-cave-200 font-semibold block mb-1 text-xs sm:text-sm">Catégorie Comptable</label>
            <select
              name="tx_edit_category"
              autoComplete="off"
              data-form-type="other"
              value={category}
              onChange={(e) => field('category', e.target.value as FinanceCategory)}
              className={inputClass}
            >
              <option value="brassage">🌾 Frais de brassage (Malt/Houblon)</option>
              <option value="materiel">⚙️ Matériel & Équipement</option>
              <option value="nettoyage">🧼 Produits Nettoyage (CIP/Hygiène)</option>
              <option value="chargesFixes">🏢 Charges Fixes (Élec/Assurance)</option>
              <option value="renovation">🔨 Local & Rénovation</option>
              <option value="divers">📦 Frais Divers</option>
              <option value="apports">💎 Apport Personnel</option>
              <option value="recettes">💰 Recettes Ventes</option>
            </select>
          </div>

          <div>
            <label className="text-cave-200 font-semibold block mb-1 text-xs sm:text-sm">Sous-catégorie</label>
            <input
              type="text"
              name="tx_edit_subcategory"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              data-form-type="other"
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
              value={subcategory}
              onChange={(e) => field('subcategory', e.target.value)}
              placeholder="ex: CIP, Malt, Outillage..."
              className={inputClass}
            />
          </div>
        </div>

        {/* Date & Amounts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-0">
            <div>
              <label className="text-cave-200 font-semibold block mb-1 text-xs sm:text-sm">Date</label>
              <input
                type="text"
                name="tx_edit_entry_date"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                required
                value={date}
                onChange={(e) => field('date', e.target.value)}
                placeholder="JJ.MM.AAAA"
                className={`${inputClass} font-mono text-center px-2`}
              />
            </div>
            <div className="sm:hidden">
              <label className="text-cave-200 font-semibold block mb-1 text-xs sm:text-sm">Taux TVA</label>
              <select
                name="tx_edit_tva_mobile"
                autoComplete="off"
                data-form-type="other"
                value={tvaRate} disabled={moneyLocked||!StorageService.getConfig().fiscal.isTvaRegistered}
                onChange={(e) => field('tvaRate', parseFloat(e.target.value))}
                className={`${inputClass} text-center`}
              >
                <option value={0.0}>0.0% (Exonéré)</option>
                <option value={0.026}>2.6% (Réduit)</option>
                <option value={0.081}>8.1% (Normal)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-cave-200 font-semibold block mb-1 text-xs sm:text-sm">Montant HT</label>
            <NumberInput
              value={amountHT}
              disabled={moneyLocked}
              onValue={(v) => field('amountHT', v)}
              pad={false}
              className={`${inputClass} font-mono font-bold text-center`}
            />
          </div>

          <div className="hidden sm:block">
            <label className="text-cave-200 font-semibold block mb-1 text-xs sm:text-sm">Taux TVA</label>
            <select
              name="tx_edit_tva_desktop"
              disabled={moneyLocked || !StorageService.getConfig().fiscal.isTvaRegistered}
              autoComplete="off"
              data-form-type="other"
              value={tvaRate}
              onChange={(e) => field('tvaRate', parseFloat(e.target.value))}
              className={`${inputClass} text-center`}
            >
              <option value={0.0}>0.0% (Exonéré)</option>
              <option value={0.026}>2.6% (Réduit)</option>
              <option value={0.081}>8.1% (Matériel)</option>
            </select>
          </div>
        </div>

        {/* Computed TTC Summary */}
        <div className="p-3 bg-cave-950/70 border border-cave-800 rounded-2xl flex justify-between items-center text-sm">
          <div>
            <span className="text-cave-400">TVA : </span>
            <strong className="text-ebc-straw font-mono">{tvaAmount.toFixed(2)} CHF</strong>
          </div>
          <div className="text-right">
            <span className="text-cave-400">Total TTC : </span>
            <strong className="text-base text-hop font-mono">{amountTTC.toFixed(2)} CHF</strong>
          </div>
        </div>

        {/* Vendor / Notes */}
        <div>
          <label className="text-cave-200 font-semibold block mb-1 text-xs sm:text-sm">Fournisseur / N° Pièce / Justificatif</label>
          <input
            type="text"
            name="tx_edit_proof_notes"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            value={proofNotes}
            onChange={(e) => field('proofNotes', e.target.value)}
            placeholder="ex: Brau-Rauchshop Cmd 686863, Bauhaus..."
            className={inputClass}
          />
        </div>

        {/* If sale (recettes): Download Official Quittance PDF */}
        {category === 'recettes' && (
          <div className="flex justify-between items-center p-3 rounded-2xl bg-hop/10 border border-hop/20">
            <span className="text-hop font-bold text-xs sm:text-sm flex items-center">
              🧾 Quittance officielle :
            </span>
            <button
              type="button"
              onClick={() => {
                const cfg = StorageService.getConfig();
                ReceiptService.downloadReceipt(
                  {
                    clientName: proofNotes?.replace(/Client:\s*/, '').split('·')[0].trim() || 'Client Comptoir',
                    beerName: description.replace('Vente bière ', '').replace('Vente ', '').split('—')[0].trim() || 'Bière artisanale',
                    amountTTC,
                    tvaRate,
                    paymentMethod: proofNotes?.includes('TWINT') ? 'TWINT' : (proofNotes?.includes('Espèces') ? 'Espèces' : 'Virement'),
                    date,
                    receiptNumber: `QUITTANCE-${transaction.id.replace(/[^0-9]/g, '').slice(-6)}`
                  },
                  cfg
                );
              }}
              className="px-3 py-1.5 bg-hop hover:bg-emerald-400 text-cave-950 font-bold rounded-xl text-xs sm:text-sm flex items-center shadow transition"
            >
              <Download className="w-3.5 h-3.5 mr-1" /> Télécharger PDF
            </button>
          </div>
        )}

        {/* Piece justificative / Attachment Manager */}
        <div className="p-3 bg-cave-950/70 border border-cave-800 rounded-2xl space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-cave-200 font-semibold flex items-center text-xs sm:text-sm">
              <Camera className="w-3.5 h-3.5 text-ebc-straw mr-1.5" /> Justificatif joint :
            </span>
            {proofUrl && (
              <button
                type="button"
                onClick={() => { field('proofUrl', undefined); field('proofFileName', undefined); }}
                className="text-footnote text-alert font-bold hover:underline"
              >
                Supprimer
              </button>
            )}
          </div>

          {proofUrl ? (
            <div className="flex items-center space-x-2 text-sm text-hop bg-cave-900 p-2 rounded-xl border border-hop/30">
              <Check className="w-4 h-4 shrink-0" />
              <span className="truncate text-xs sm:text-sm">{proofFileName || 'justificatif_joint.jpg'}</span>
            </div>
          ) : (
            <label className="flex items-center justify-center p-2.5 rounded-xl border border-dashed border-cave-700 hover:border-ebc-gold bg-cave-900/60 cursor-pointer transition text-cave-400 hover:text-cave-200 text-xs sm:text-sm">
              <UploadCloud className="w-4 h-4 mr-2 text-ebc-straw" />
              <span>Attacher un justificatif (Photo / PDF)</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      field('proofUrl', reader.result as string);
                      field('proofFileName', f.name);
                    };
                    reader.readAsDataURL(f);
                  }
                }}
              />
            </label>
          )}
        </div>

        {/* Google Drive automatic path preview */}
        <div className="p-3 bg-water/10 border border-water/30 rounded-2xl space-y-1.5">
          <div className="flex justify-between items-center text-xs sm:text-sm text-water font-semibold">
            <span className="flex items-center">
              <FileText className="w-3.5 h-3.5 mr-1" /> Dossier Google Drive :
            </span>
            <button
              type="button"
              onClick={handleCopyDrive}
              className="text-footnote bg-water/20 hover:bg-water/30 text-water px-2 py-0.5 rounded transition flex items-center"
            >
              {copiedDrive ? <Check className="w-3 h-3 mr-0.5" /> : <Copy className="w-3 h-3 mr-0.5" />}
              {copiedDrive ? 'Copié' : 'Copier'}
            </button>
          </div>
          <p className="text-footnote text-water font-mono break-all bg-cave-900/60 p-1.5 rounded-lg border border-water/20">
            {currentDrivePath}
          </p>
        </div>

        {/* Sticky Actions */}
        <StickyActions>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-cave-850 hover:bg-cave-800 text-cave-200 font-bold rounded-xl transition text-sm"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 bg-gradient-to-r from-ebc-straw to-ebc-amber hover:from-ebc-gold text-cave-950 font-bold rounded-xl shadow-lg transition flex items-center justify-center space-x-1 text-sm"
          >
            <Save className="w-4 h-4 mr-1" />
            <span>Enregistrer</span>
          </button>
        </StickyActions>
      </form>
    </ModalShell>
  );
};
