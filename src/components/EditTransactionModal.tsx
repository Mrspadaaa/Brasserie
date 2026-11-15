import React, { useId, useRef, useState } from 'react';
import { useStorageValue, useSyncedDraft } from '../hooks/useLiveData';
import { NumberInput } from '../ui/NumberInput';
import { Input } from '../ui/Input';
import { Camera, ChevronDown, Copy, Check, Download, FileText, Folder, Lock, X } from 'lucide-react';
import { Transaction, FinanceCategory } from '../types';
import { StorageService } from '../services/storage';
import { FinanceService } from '../services/financeService';
import { FinancialArchiveService } from '../services/financialArchiveService';
import { DriveService } from '../services/driveService';
import { ReceiptService } from '../services/receiptService';
import { ModalShell } from '../ui/ModalShell';
import { archiveIndex, isTransactionArchived } from '../domain/finance/archive';
import { dateAffichee, isoDate, montantChf, sensDeCategorie, todayISO, toCents, transactionAmount, validateFinanceTransaction } from '../domain/finance/ledger';
import { anneesCloses, baisseSousLePaye, choixPertinent, effetCorrection, erreurNouveauMontant, payeNet, planCorrection, verrouMontant, type ChoixPaiement, type EtapeCorrection } from '../domain/finance/correctionMontant';
import { amountOnly } from '../ui/finance/financeFormat';
import { CATEGORY_LABELS } from '../ui/finance/FinanceForms';
import { GROUPES, type GroupeId } from '../ui/finance/operations/groupes';
import { RangeeApercu } from '../ui/finance/modifier/ApercuRangee';
import { executerPlan, simulerPlan } from '../ui/finance/modifier/executerCorrection';
import '../ui/finance/modifier/modifier.css';

interface EditTransactionModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onSave: (updated: Transaction) => void;
}

// Lecteurs stables (useStorageValue relit par cette référence) : la méthode du service ne se passe pas nue, elle perdrait son `this`.
const lirePaiements = () => FinanceService.getPayments();
const lireClotures = () => FinanceService.getClosings();
const lireArchives = () => FinancialArchiveService.getArchives();
const lireEcritures = () => StorageService.getTransactions();

const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
/** « Drive · Novembre › Nettoyage » : le chemin en mots (m2mo-a) ; le chemin complet reste ce que « Copier le lien » copie. */
const cheminEnMots = (date: string, categorie: FinanceCategory): string => {
  const iso = isoDate(date);
  return `Drive · ${iso ? MOIS[Number(iso.slice(5, 7)) - 1] : 'Mois à vérifier'} › ${CATEGORY_LABELS[categorie] ?? categorie}`;
};
const groupeDe = (c: FinanceCategory) => GROUPES[(c === 'materiel' || c === 'renovation' ? 'part' : GROUPES[c as GroupeId] ? c : 'divers') as GroupeId];

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  transaction,
  onClose,
  onSave
}) => {
  const [draft, setDraft] = useSyncedDraft(isOpen ? transaction : null, transaction?.id);
  const [copiedDrive, setCopiedDrive] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [choixManuel, setChoixManuel] = useState<ChoixPaiement | null>(null);
  const paiements = useStorageValue(lirePaiements);
  const clotures = useStorageValue(lireClotures);
  const archives = useStorageValue(lireArchives);
  const ecritures = useStorageValue(lireEcritures);
  const occupe = useRef(false);
  const titreId = useId();
  if (!isOpen || !transaction || !draft) return null;
  const { description, category, subcategory = '', date, amountHT, tvaRate,
    proofNotes = '', proofUrl, proofFileName } = draft;
  const field = <K extends keyof Transaction>(key: K, value: Transaction[K]) =>
    setDraft(current => current?.id === transaction.id ? { ...current, [key]: value } : current);

  // Le montant se modifie, payé compris. Il ne se verrouille que pour une année close ou archivée, une pièce annulée (verrouMontant) :
  // il dit alors pourquoi en une ligne. Une étiquette modifiée ne retaxe jamais une pièce ancienne : la TVA ne se recalcule que si le montant ou le taux change.
  // L'année d'origine ET celle de la date saisie : on ne passe pas une pièce vers un exercice clos en changeant son montant (M3).
  // Une clôture ne ferme l'année que confirmée (figée, `report`) : un brouillon d'inventaire ne bloque rien (M4).
  const indexArchives = archiveIndex(archives);
  const contexteVerrou = {
    anneesCloturees: anneesCloses(clotures),
    archivee: isTransactionArchived(transaction, indexArchives),
    dateNouvelle: date,
    archiveeNouvelleDate: isTransactionArchived({ ...transaction, date }, indexArchives)
  };
  const verrouOrigine = verrouMontant(transaction, { ...contexteVerrou, dateNouvelle: undefined });
  const verrouDate = verrouOrigine ? null : verrouMontant(transaction, contexteVerrou);
  const verrou = verrouOrigine ?? (verrouDate ? `${verrouDate} Remets la date d’origine pour modifier le montant.` : null);
  const assujetti = StorageService.getConfig().fiscal.isTvaRegistered;
  const moneyChanged = amountHT !== transaction.amountHT || tvaRate !== transaction.tvaRate;
  const effectiveRate = assujetti ? tvaRate : 0;
  const tvaAmount = moneyChanged ? Math.round(amountHT * effectiveRate * 100) / 100 : draft.tvaAmount;
  const amountTTC = moneyChanged ? Math.round((amountHT + tvaAmount) * 100) / 100 : draft.amountTTC;

  // Le plan se calcule sur l'écriture vivante (`transaction`), jamais sur la copie du formulaire.
  const ancienCents = transactionAmount(transaction);
  const nouveauCents = toCents(amountTTC);
  const change = !verrou && nouveauCents !== ancienCents;
  const montantInvalide = change && (!Number.isFinite(amountTTC) || nouveauCents <= 0);
  const pertinent = change && !montantInvalide && choixPertinent(transaction, paiements, ecritures);
  // q6, point 1 : sous ce qui est déjà payé, seul « Le paiement suit » existe (le payé ne disparaît jamais) ; l'excédent versé se règle par un avoir.
  const sousLePaye = pertinent && baisseSousLePaye(transaction, paiements, nouveauCents, ecritures);
  const tropPayeCents = sousLePaye ? payeNet(transaction, paiements, ecritures) - nouveauCents : 0;
  const choix: ChoixPaiement = sousLePaye ? 'suit' : choixManuel ?? (nouveauCents > ancienCents ? 'reste' : 'suit');
  const erreurDonnees = change && !montantInvalide ? erreurNouveauMontant(transaction, nouveauCents, ecritures) : null;
  /** Le plan, ou la raison pour laquelle il n'existe pas (M1) : un plan impossible ne se remplace jamais par une écriture directe. */
  const planPour = (c: ChoixPaiement): { plan: EtapeCorrection[] | null; erreur: string | null } => {
    if (!change || montantInvalide) return { plan: null, erreur: null };
    try { return { plan: planCorrection(transaction, paiements, nouveauCents, c), erreur: null }; }
    catch (e) { return { plan: null, erreur: e instanceof Error ? e.message : 'Correction impossible.' }; }
  };
  const { plan, erreur: erreurPlan } = planPour(choix);
  const ctx = { aujourdhui: todayISO(), maintenant: new Date().toISOString() };
  const effet = (c: ChoixPaiement) => { const { plan: p } = planPour(c); return p ? effetCorrection(transaction, paiements, p) : null; };
  const apres = plan ? simulerPlan(transaction, paiements, plan, ctx) : null;
  const gauche = groupeDe(category);

  const currentDrivePath = DriveService.generateDrivePath({ ...draft, category, date, amountHT, amountTTC, proofNotes });

  /** L'écriture à enregistrer : les champs du formulaire sur la pièce vivante (solde réglé et dernier paiement viennent d'elle, jamais de la copie). */
  const aEnregistrer = (vivante: Transaction): Transaction => {
    const { settlementBalanceCents, lastPaymentId } = vivante;
    const base: Transaction = { ...draft };
    delete base.settlementBalanceCents; delete base.lastPaymentId;
    const cents = toCents(amountTTC);
    let finance = draft.finance;
    if (finance) {
      let lines = finance.lines;
      if (cents !== transactionAmount(vivante) && lines.length === 1) {
        const l = lines[0];
        lines = [{ ...l, amountCents: cents, ...(l.unitPriceCents != null && l.quantity ? { unitPriceCents: Math.round(cents / l.quantity) } : {}) }];
      }
      finance = { ...finance, amountCents: cents, lines };
    }
    return {
      ...base,
      ...(settlementBalanceCents !== undefined ? { settlementBalanceCents } : {}),
      ...(lastPaymentId !== undefined ? { lastPaymentId } : {}),
      description: description.trim(),
      category,
      subcategory: subcategory.trim() || 'Divers',
      date: date.trim(),
      amountHT,
      tvaRate,
      tvaAmount,
      amountTTC,
      ...(finance ? { finance } : {}),
      proofNotes: proofNotes.trim(),
      proofUrl,
      proofFileName
    };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (occupe.current) return;
    occupe.current = true;
    try {
      if (montantInvalide) throw new Error('Montant invalide : un nombre positif en CHF est requis.');
      if (erreurDonnees) throw new Error(erreurDonnees);
      if (verrou && toCents(amountTTC) !== ancienCents) throw new Error(verrou);
      if (change && erreurPlan) throw new Error(erreurPlan);
      const vivante = StorageService.getTransactions().find(t => t.id === transaction.id) ?? transaction;
      const candidate = aEnregistrer(vivante);
      // Vérifié avant la première écriture : une correction ne s'arrête pas à mi-chemin sur une saisie qu'on pouvait refuser d'emblée.
      if (candidate.finance) validateFinanceTransaction(candidate);
      const etapes = plan ?? [];
      if (etapes.some(s => s.type === 'montant')) {
        // Un lot Firestore par étape (B1) : on n'annonce « mise à jour » qu'une fois toutes les étapes mises en file ; un refus ultérieur du serveur reste le bandeau « Enregistrement refusé ».
        await executerPlan(etapes, transaction.id, { ...ctx, maintenant: new Date().toISOString() }, aEnregistrer);
      } else {
        StorageService.updateTransaction(candidate);
      }
      onSave(candidate);
      onClose();
    } catch (error) {
      setSaveError((error as Error).message);
    } finally {
      occupe.current = false;
    }
  };

  const handleCopyDrive = () => {
    navigator.clipboard.writeText(currentDrivePath);
    setCopiedDrive(true);
    setTimeout(() => setCopiedDrive(false), 2000);
  };

  const joindre = (f: File | undefined) => {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => { field('proofUrl', reader.result as string); field('proofFileName', f.name); };
    reader.readAsDataURL(f);
  };
  const rangee = !!proofUrl || !!transaction.finance?.proofDocumentId;
  const apercuImage = !!proofUrl && /^data:image\//.test(proofUrl);
  const mots = (c: ChoixPaiement) => {
    const e = effet(c);
    if (!e) return '';
    return c === 'suit' ? `payé ${amountOnly(e.payeCents)}` : `payé ${amountOnly(e.payeCents)} · reste ${amountOnly(e.resteCents)}`;
  };

  return (
    <ModalShell open={isOpen} onClose={onClose} size="lg" labelledBy={titreId}>
      <form onSubmit={handleSave} autoComplete="off" className="mod" aria-label="Modifier l’opération">
        <div className="mod-grab" aria-hidden="true" />
        <div className="mod-tete">
          <span className="mod-sq" style={{ background: gauche.fond }} aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={gauche.trait} strokeWidth="2.8"><path d={gauche.chemin} /></svg>
          </span>
          <h3 id={titreId}>{transaction.description}</h3>
          <button type="button" onClick={onClose} aria-label="Fermer" className="mod-x"><span><X size={18} /></span></button>
        </div>

        <div className="mod-corps">
          {saveError && <p role="alert" className="mod-erreur">{saveError}</p>}

          {/* La pièce en tête */}
          {rangee ? (
            <div className="mod-piece">
              {apercuImage ? <img src={proofUrl} alt="" /> : <span className="mod-piece-ico" aria-hidden="true"><FileText size={20} /></span>}
              <span className="mod-piece-nom"><b>{proofFileName || (proofUrl ? 'Pièce jointe' : 'Pièce rangée')}</b><small>{proofUrl ? 'Pièce jointe' : 'Rangée dans les documents'}</small></span>
              {proofUrl && <>
                <label className="mod-b2 mod-fich"><span>Remplacer</span>
                  <input type="file" accept="image/*,application/pdf" aria-label="Remplacer la pièce" onChange={(e) => joindre(e.target.files?.[0])} /></label>
                <button type="button" className="mod-b2" onClick={() => { field('proofUrl', undefined); field('proofFileName', undefined); }}>Retirer</button>
              </>}
            </div>
          ) : (
            <div className="mod-drop">
              <p><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeDasharray="3 2.4" aria-hidden="true"><path d="M7 3h7l4 4v14H7z" /></svg>Pas encore de pièce</p>
              <label className="mod-b1 mod-fich"><Camera size={20} aria-hidden="true" /><span>Photo du ticket</span>
                <input type="file" accept="image/*" capture="environment" aria-label="Photo du ticket" onChange={(e) => joindre(e.target.files?.[0])} /></label>
              <label className="mod-b2 mod-fich"><FileText size={18} aria-hidden="true" /><span>Fichier ou PDF</span>
                <input type="file" accept="image/*,application/pdf" aria-label="Fichier ou PDF" onChange={(e) => joindre(e.target.files?.[0])} /></label>
            </div>
          )}

          <label className="mod-f"><span className="mod-lib">Nom</span>
            <Input type="text" name="tx_edit_label" autoComplete="off" autoCorrect="off" spellCheck={false} data-form-type="other" data-lpignore="true" data-1p-ignore="true" data-bwignore="true"
              required value={description} onChange={(e) => field('description', e.target.value)} className="mod-in" />
          </label>

          <div className="mod-g2">
            <label className="mod-f"><span className="mod-lib">Catégorie</span>
              <span className="mod-sel">
                <span className="mod-sq" style={{ background: gauche.fond }} aria-hidden="true"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={gauche.trait} strokeWidth="2.8"><path d={gauche.chemin} /></svg></span>
                <select name="tx_edit_category" autoComplete="off" data-form-type="other" value={category} onChange={(e) => field('category', e.target.value as FinanceCategory)}>
                  {/* AM-62 : seules les catégories du même sens que l'écriture d'origine ; une charge ne devient pas une recette. */}
                  {sensDeCategorie(transaction.category) === 'charge' && <>
                    <option value="brassage">Brassage</option>
                    <option value="materiel">Matériel</option>
                    <option value="nettoyage">Nettoyage</option>
                    <option value="chargesFixes">Charges fixes</option>
                    <option value="renovation">Local et travaux</option>
                    <option value="divers">Autres frais</option>
                  </>}
                  {sensDeCategorie(transaction.category) === 'apport' && <option value="apports">Apports privés</option>}
                  {sensDeCategorie(transaction.category) === 'recette' && <option value="recettes">Ventes</option>}
                </select>
                <ChevronDown className="mod-chev" size={14} aria-hidden="true" />
              </span>
            </label>
            <label className="mod-f"><span className="mod-lib">Précision</span>
              <Input type="text" name="tx_edit_subcategory" autoComplete="off" autoCorrect="off" spellCheck={false} data-form-type="other" data-lpignore="true" data-1p-ignore="true" data-bwignore="true"
                value={subcategory} onChange={(e) => field('subcategory', e.target.value)} placeholder="CIP, malt, outillage…" className="mod-in" />
            </label>
          </div>

          <div className="mod-g2">
            <label className="mod-f"><span className="mod-lib">Date</span>
              <Input type="text" name="tx_edit_entry_date" inputMode="numeric" autoComplete="off" autoCorrect="off" spellCheck={false} data-form-type="other" data-lpignore="true" data-1p-ignore="true" data-bwignore="true"
                required value={dateAffichee(date)} onChange={(e) => field('date', e.target.value)} placeholder="JJ.MM.AAAA" className="mod-in" />
            </label>
            <div className="mod-f">
              <span className="mod-lib">{assujetti ? 'Montant HT' : 'Montant'}{change && !montantInvalide && <s className="mod-m">{amountOnly(ancienCents)}</s>}</span>
              <span className="mod-mt" data-edite={change || undefined} data-verrou={verrou ? '' : undefined}>
                {verrou ? <Lock size={14} aria-hidden="true" /> : null}
                <span className="mod-pre">{assujetti ? 'HT' : 'sans TVA'}</span>
                <NumberInput value={amountHT} disabled={!!verrou} onValue={(v) => { field('amountHT', v); setSaveError(''); }} pad={false} fractionDigits={2}
                  aria-label="Montant (CHF)" aria-describedby={verrou ? `${titreId}-v` : undefined} className="mod-mt-in" />
              </span>
            </div>
          </div>
          {verrou && <p className="mod-pourquoi" id={`${titreId}-v`}>{verrou}</p>}
          {assujetti && (
            <div className="mod-tva">
              <label>Taux TVA{' '}
                <select name="tx_edit_tva" autoComplete="off" data-form-type="other" value={tvaRate} disabled={!!verrou} onChange={(e) => field('tvaRate', parseFloat(e.target.value))}>
                  <option value={0.0}>0,0 % (exonéré)</option>
                  <option value={0.026}>2,6 % (réduit)</option>
                  <option value={0.081}>8,1 % (normal)</option>
                </select>
              </label>
              <span>TVA <b className="mod-m">{montantChf(tvaAmount)}</b> · Total TTC <b className="mod-m">{montantChf(amountTTC)}</b></span>
            </div>
          )}

          {/* Le choix du paiement, puis l'aperçu avant / après */}
          {change && !montantInvalide && <>
            {pertinent && (
              <div className={sousLePaye ? 'mod-ch mod-ch-un' : 'mod-ch'} role="radiogroup" aria-label="Le paiement déjà noté">
                {(sousLePaye ? ['suit'] as const : ['suit', 'reste'] as const).map(c => (
                  <button key={c} type="button" role="radio" aria-checked={choix === c} onClick={() => setChoixManuel(c)}>
                    {c === 'suit' ? 'Le paiement suit' : 'Reste à payer'}<small>{mots(c)}</small>
                  </button>
                ))}
              </div>
            )}
            {sousLePaye && <p className="mod-pourquoi" data-booster="trop-paye">Trop payé <b className="mod-m">{amountOnly(tropPayeCents)}</b> ? Enregistre un avoir depuis la fiche (« Avoir ou remboursement »).</p>}
            {apres && (
              <div className="mod-ap" aria-live="polite"><h4>Dans Opérations</h4>
                <RangeeApercu piece={transaction} paiements={paiements} transactions={ecritures} mot="avant" ancien nom={transaction.description} />
                <RangeeApercu piece={{ ...apres.piece, proofUrl: proofUrl ?? apres.piece.proofUrl }} paiements={apres.paiements} transactions={ecritures} mot="après" nom={description.trim() || transaction.description} />
              </div>
            )}
          </>}
          {montantInvalide && !saveError && <p className="mod-pourquoi" role="status">Montant invalide : un nombre positif en CHF est requis.</p>}
          {erreurDonnees && <p className="mod-erreur" role="alert">{erreurDonnees}</p>}
          {erreurPlan && <p className="mod-erreur" role="alert">{erreurPlan}</p>}

          <label className="mod-f"><span className="mod-lib">Fournisseur, n° de pièce</span>
            <Input type="text" name="tx_edit_proof_notes" autoComplete="off" autoCorrect="off" spellCheck={false} data-form-type="other" data-lpignore="true" data-1p-ignore="true" data-bwignore="true"
              value={proofNotes} onChange={(e) => field('proofNotes', e.target.value)} placeholder="Brau-Rauchshop cmd 686863, Bauhaus…" className="mod-in" />
          </label>

          {category === 'recettes' && (
            <div className="mod-quit"><span>Quittance officielle</span>
              <button type="button" onClick={() => {
                const cfg = StorageService.getConfig();
                ReceiptService.downloadReceipt({
                  clientName: proofNotes?.replace(/Client:\s*/, '').split('·')[0].trim() || 'Client Comptoir',
                  beerName: description.replace('Vente bière ', '').replace('Vente ', '').split('—')[0].trim() || 'Bière artisanale',
                  amountTTC, tvaRate,
                  paymentMethod: proofNotes?.includes('TWINT') ? 'TWINT' : (proofNotes?.includes('Espèces') ? 'Espèces' : 'Virement'),
                  date, receiptNumber: `QUITTANCE-${transaction.id.replace(/[^0-9]/g, '').slice(-6)}`
                }, cfg);
              }}><Download size={14} aria-hidden="true" /> Quittance PDF</button>
            </div>
          )}

          <div className="mod-drv"><Folder size={15} aria-hidden="true" /><span title={currentDrivePath}>{cheminEnMots(date, category)}</span>
            <button type="button" onClick={handleCopyDrive}>{copiedDrive ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}{copiedDrive ? 'Copié' : 'Copier le lien'}</button>
          </div>
        </div>

        <div className="mod-pied">
          <button type="button" onClick={onClose} className="mod-b2">Annuler</button>
          <button type="submit" className="mod-b1">Enregistrer</button>
        </div>
      </form>
    </ModalShell>
  );
};
