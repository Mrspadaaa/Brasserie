import React, { useId, useRef, useState } from 'react';
import { useStorageValue, useSyncedDraft } from '../hooks/useLiveData';
import { NumberInput } from '../ui/NumberInput';
import { Input } from '../ui/Input';
import { ArrowDown, ArrowUp, CalendarDays, Camera, ChevronDown, Copy, Check, Download, FileText, Folder, Lock, Undo2, X } from 'lucide-react';
import { Transaction, FinanceCategory } from '../types';
import { StorageService } from '../services/storage';
import { FinanceService } from '../services/financeService';
import { FinancialArchiveService } from '../services/financialArchiveService';
import { DriveService } from '../services/driveService';
import { ReceiptService } from '../services/receiptService';
import { ModalShell } from '../ui/ModalShell';
import { archiveIndex, isTransactionArchived } from '../domain/finance/archive';
import { isoDate, montantChf, todayISO, toCents, transactionAmount, transactionDirection, validateFinanceTransaction } from '../domain/finance/ledger';
import { anneesCloses, baisseSousLePaye, choixPertinent, choixParDefaut, effetCorrection, erreurNouveauMontant, estMouvementPrive, payeNet, planCorrection, verrouMontant, type ChoixPaiement, type EtapeCorrection } from '../domain/finance/correctionMontant';
import { amountOnly } from '../ui/finance/financeFormat';
import { CATEGORY_LABELS } from '../ui/finance/FinanceForms';
import { GROUPES, type GroupeId } from '../ui/finance/operations/groupes';
import { RangeeApercu } from '../ui/finance/modifier/ApercuRangee';
import { ChoixDate } from '../ui/ChoixDate';
import { CATEGORIES_ACHAT, GENRES, METHODES, genreDe, jjmm, resumeReglement } from '../ui/saisie/modele';
import { Ic, teinteGenre } from '../ui/saisie/SaisieMain';
import { CategoryTag } from '../ui/finance/CategoryTag';
import type { FinanceTransaction } from '../domain/finance/types';
import { executerPlan, simulerPlan, verifierAvoir } from '../ui/finance/modifier/executerCorrection';
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
/** Le champ « Fournisseur, n° de pièce » réécrit le fournisseur (avant le premier « · ») et le n° de pièce (le reste) de la pièce saisie par facture. */
const avecTiers = (finance: NonNullable<Transaction['finance']>, texte: string): NonNullable<Transaction['finance']> => {
  const [fournisseur, ...reste] = texte.split('·');
  const sortie = { ...finance };
  const vendor = fournisseur.trim(), numero = reste.join('·').trim();
  if (vendor) sortie.vendor = vendor; else delete sortie.vendor;
  if (numero) sortie.invoiceNumber = numero; else delete sortie.invoiceNumber;
  return sortie;
};
const LIBELLE_TIERS: Record<string, string> = { achat: 'Fournisseur', autreo: 'Fournisseur', loyer: 'Bailleur', abo: 'Service', salaire: 'Employé', vente: 'Client', autrei: 'Client' };
const RYTHMES: Array<[string, string]> = [['une', '1×'], ['monthly', 'Mois'], ['quarterly', 'Trim.'], ['yearly', 'Année']];
const RYTHME_MOTS: Record<string, string> = { monthly: 'chaque mois', quarterly: 'chaque trimestre', yearly: 'chaque année' };
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
  /** FN-8 : le texte du champ « Fournisseur, n° de pièce » une fois touché ; tant qu'il ne l'est pas, le champ montre ce que la pièce a déjà. */
  const [notesSaisies, setNotesSaisies] = useState<string | null>(null);
  /** E35-11 : les mêmes blocs que la saisie (contrepartie, référence, note, sans justificatif, échéance) ; `null` = pas touché, la pièce garde ce qu'elle a. */
  const [tiersSaisi, setTiersSaisi] = useState<string | null>(null);
  const [refSaisie, setRefSaisie] = useState<string | null>(null);
  const [noteSaisie, setNoteSaisie] = useState<string | null>(null);
  const [sansJustif, setSansJustif] = useState<boolean | null>(null);
  const [echeanceSaisie, setEcheanceSaisie] = useState<string | null>(null);
  /** E40-4 : la frise de la date, ouverte au toucher de la pastille ; `dateTiree` : le jour que le doigt tient, montré en direct. */
  const [dateOuverte, setDateOuverte] = useState(false);
  const [dateTiree, setDateTiree] = useState<string | null>(null);
  const paiements = useStorageValue(lirePaiements);
  const clotures = useStorageValue(lireClotures);
  const archives = useStorageValue(lireArchives);
  const ecritures = useStorageValue(lireEcritures);
  const occupe = useRef(false);
  const titreId = useId();
  if (!isOpen || !transaction || !draft) return null;
  const { description, category, subcategory = '', date, amountHT, tvaRate,
    proofNotes: notesPiece = '', proofUrl, proofFileName } = draft;
  // FN-8 : une pièce saisie par la facture porte son fournisseur et son n° dans `finance`, pas dans `proofNotes` ; le champ les montre. Sans eux, il montre `proofNotes`.
  const tiersDeFinance = !notesPiece.trim() ? [transaction.finance?.vendor, transaction.finance?.invoiceNumber].filter(Boolean).join(' · ') : '';
  const champTiers = notesSaisies ?? (tiersDeFinance || notesPiece);
  const proofNotes = notesSaisies !== null && !tiersDeFinance ? notesSaisies : notesPiece;
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
  // FN-12 : un apport ou un prélèvement n'a pas de « Reste à payer » : son paiement suit toujours (jamais une créance « À encaisser »).
  const prive = estMouvementPrive(transaction);
  const pertinent = change && !montantInvalide && !prive && choixPertinent(transaction, paiements, ecritures);
  // FN-10 : sous ce qui est déjà payé, « Reste à payer » n'existe pas (le payé ne disparaît jamais). Deux choix, à faire explicitement : une erreur de saisie (le paiement suit) ou un trop-payé réel (avoir à recevoir).
  // FN-35 : une pièce payée EN PARTIE peut aussi descendre sous son payé (12,00 payés sur 15,00, baissée à 10,00) : la question vaut aussi pour elle.
  const sousLePaye = change && !montantInvalide && !prive && baisseSousLePaye(transaction, paiements, nouveauCents, ecritures);
  const tropPayeCents = sousLePaye ? payeNet(transaction, paiements, ecritures) - nouveauCents : 0;
  const choixSous: ChoixPaiement | null = choixManuel === 'suit' || choixManuel === 'avoir' ? choixManuel : null;
  const choix: ChoixPaiement = prive ? 'suit' : sousLePaye ? choixSous ?? 'suit' : choixManuel === 'reste' || choixManuel === 'suit' ? choixManuel : choixParDefaut();
  const choixAFaire = sousLePaye && !choixSous;
  const erreurDonnees = change && !montantInvalide ? erreurNouveauMontant(transaction, nouveauCents, ecritures) : null;
  /** Le plan, ou la raison pour laquelle il n'existe pas (M1) : un plan impossible ne se remplace jamais par une écriture directe. */
  const planPour = (c: ChoixPaiement): { plan: EtapeCorrection[] | null; erreur: string | null } => {
    if (!change || montantInvalide) return { plan: null, erreur: null };
    try { return { plan: planCorrection(transaction, paiements, nouveauCents, c), erreur: null }; }
    catch (e) { return { plan: null, erreur: e instanceof Error ? e.message : 'Correction impossible.' }; }
  };
  const { plan, erreur: erreurPlan } = choixAFaire ? { plan: null, erreur: null } : planPour(choix);
  const ctx = { aujourdhui: todayISO(), maintenant: new Date().toISOString() };
  const effet = (c: ChoixPaiement) => { const { plan: p } = planPour(c); return p ? effetCorrection(transaction, paiements, p) : null; };
  const apres = plan ? simulerPlan(transaction, paiements, plan, ctx) : null;
  const sortant = transactionDirection(transaction, ecritures) === 'out';
  const gauche = groupeDe(category);
  const aFinance = !!transaction.finance;
  const genreSaisie = GENRES[genreDe(transaction as FinanceTransaction)];
  const reglement = resumeReglement(transaction as FinanceTransaction, paiements);
  const planLie = transaction.finance?.planId ? FinanceService.getPlans().find((p) => p.id === transaction.finance!.planId) : undefined;
  const revient = planLie?.recurrence ? RYTHME_MOTS[planLie.recurrence.frequency] : undefined;
  const rythmeActuel = planLie?.recurrence?.frequency ?? 'une';
  const jourMax = [todayISO(), isoDate(date) ?? ''].sort().at(-1) as string;
  const iso = isoDate(date) ?? '';
  const jourVu = dateTiree && /^\d{4}-\d{2}-\d{2}$/.test(dateTiree) ? dateTiree : iso;
  const refund = genreSaisie.id === 'rembt';

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
      const f2 = { ...finance };
      const poser = (k: 'vendor' | 'invoiceNumber' | 'notes', v: string | null) => { if (v === null) return; const t = v.trim(); if (t) f2[k] = t; else delete f2[k]; };
      poser('vendor', tiersSaisi); poser('invoiceNumber', refSaisie); poser('notes', noteSaisie);
      if (sansJustif !== null) { if (sansJustif) f2.proofNotNeeded = true; else delete f2.proofNotNeeded; }
      if (echeanceSaisie && f2.paymentStatus !== 'paid') f2.dueDate = echeanceSaisie;
      finance = f2;
    }
    return {
      ...base,
      ...(settlementBalanceCents !== undefined ? { settlementBalanceCents } : {}),
      ...(lastPaymentId !== undefined ? { lastPaymentId } : {}),
      description: description.trim(),
      category,
      // FN-9 : « Précision » ne se remplit jamais seule ; vide elle reste vide.
      subcategory: subcategory.trim(),
      date: date.trim(),
      amountHT,
      tvaRate,
      tvaAmount,
      amountTTC,
      ...(finance ? { finance: finance && notesSaisies !== null && tiersDeFinance && notesSaisies !== tiersDeFinance ? avecTiers(finance, notesSaisies) : finance } : {}),
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
      if (choixAFaire) throw new Error('Choisis : erreur de saisie, ou bien payé comme avant (avoir à recevoir).');
      if (change && erreurPlan) throw new Error(erreurPlan);
      const vivante = StorageService.getTransactions().find(t => t.id === transaction.id) ?? transaction;
      const candidate = aEnregistrer(vivante);
      // Vérifié avant la première écriture : une correction ne s'arrête pas à mi-chemin sur une saisie qu'on pouvait refuser d'emblée.
      if (candidate.finance) validateFinanceTransaction(candidate);
      const etapes = plan ?? [];
      const etapeAvoir = etapes.find((s): s is Extract<EtapeCorrection, { type: 'avoir' }> => s.type === 'avoir');
      if (etapeAvoir) verifierAvoir(candidate, etapeAvoir, { ...ctx, maintenant: new Date().toISOString() }, StorageService.getTransactions(), FinanceService.getPayments());
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
    return c === 'reste' ? `payé ${amountOnly(e.payeCents)} · reste ${amountOnly(e.resteCents)}` : `payé ${amountOnly(e.payeCents)}`;
  };

  return (
    <ModalShell open={isOpen} onClose={onClose} size="lg" labelledBy={titreId}>
      <form onSubmit={handleSave} autoComplete="off" className="mod" aria-label="Modifier l’opération">
        <div className="mod-grab" aria-hidden="true" />
        <div className="mod-tete">
          <span className="mod-sq" style={{ background: gauche.fond }} aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={gauche.trait} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d={gauche.chemin} /></svg>
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

          {/* E40-4 : la même feuille que la saisie : la bande « Ça sort / Ça rentre · sorte », la carte (nom, étiquette, date au curseur) et le grand montant.
              `sai` apporte ses jetons (clair / cave) ; la sorte ne se change pas ici (sa nature fixe la TVA, le sens et le grand livre : on annule et on resaisit). */}
          <div className="sai mod-sai" data-modifier-saisie>
            <div className={`sai-sel ${refund ? 'neu' : sortant ? 'out' : 'in'}`} data-modifier-bande>
              {refund ? <Undo2 size={16} aria-hidden="true" /> : sortant ? <ArrowUp size={16} aria-hidden="true" /> : <ArrowDown size={16} aria-hidden="true" />}
              {refund ? 'Remboursement' : <>{sortant ? 'Ça sort' : 'Ça rentre'}<span className="g"><span style={{ color: teinteGenre(genreSaisie.id).seg, display: 'inline-flex' }}><Ic g={genreSaisie.id} size={18} /></span>{genreSaisie.nom}</span></>}
            </div>
            <div className={`sai-card${refund ? '' : sortant ? ' out' : ' in'}`} data-modifier-carte>
              <div className="sai-c1">
                <input aria-label="Nom" name="tx_edit_label" required value={description} enterKeyHint="done" autoComplete="off" autoCorrect="off" spellCheck={false}
                  data-form-type="other" data-lpignore="true" data-1p-ignore="true" data-bwignore="true" onChange={(e) => field('description', e.target.value)} />
                {prive ? <span className="finance-tag finance-tag-apports">Privé</span>
                  : <CategoryTag category={category} libelle={genreSaisie.id === 'autrei' ? 'Autre entrée' : genreSaisie.id === 'impot' ? 'Impôts' : undefined} />}
                {/* E38-4 : la date de la saisie : une pastille, et la frise au toucher (le curseur), jamais un champ « JJ.MM.AAAA » */}
                <button type="button" className="sai-chip dt" data-modifier-date aria-expanded={dateOuverte} aria-label={`Date de l’opération : ${iso ? jjmm(iso, true) : 'à poser'}`}
                  onClick={() => setDateOuverte(o => !o)}><CalendarDays size={14} aria-hidden="true" />{jourVu ? jjmm(jourVu) : 'Date à poser'}</button>
              </div>
              {dateOuverte && <div className="sai-date"><ChoixDate ouvert saisie label="Date de l’opération" valeur={iso} max={jourMax} rangee="achats"
                onBrouillon={setDateTiree} onChange={(d) => { field('date', d); setDateTiree(null); setSaveError(''); setDateOuverte(false); }} /></div>}
              <label className={`sai-amt ${refund ? '' : sortant ? 'out' : 'in'}`} data-modifier-montant data-edite={change || undefined} data-verrou={verrou ? '' : undefined}>
                {verrou ? <Lock size={16} aria-hidden="true" /> : <span aria-hidden="true">{sortant ? '−' : '+'}</span>}
                <NumberInput value={amountHT} disabled={!!verrou} onValue={(v) => { field('amountHT', v); setSaveError(''); }} pad={false} fractionDigits={2}
                  aria-label="Montant en CHF" aria-describedby={verrou ? `${titreId}-v` : undefined} />
                <small>{assujetti ? 'CHF HT' : 'CHF'}</small>
              </label>
              {change && !montantInvalide && <p className="mod-avant">avant <s className="mod-m">{amountOnly(ancienCents)}</s></p>}
            </div>
            {genreSaisie.id === 'achat' && <div className="sai-row" data-modifier-categorie>
              {CATEGORIES_ACHAT.map(c => <button key={c.id} type="button" className="sai-chip" aria-pressed={category === c.id} data-saisie-categorie={c.id} onClick={() => field('category', c.id)}>{c.nom}</button>)}
            </div>}
            {/* la précision n'existe que pour un achat (« CIP, malt, outillage ») ; ailleurs elle est le nom de la sorte, que `genreDe` relit : on n'y touche pas */}
            {genreSaisie.id === 'achat' && <details className="mod-fold" data-modifier-precision>
              <summary>{subcategory ? `Précision · ${subcategory}` : 'Précision'}<span><ChevronDown size={12} aria-hidden="true" /></span></summary>
              <Input type="text" name="tx_edit_subcategory" autoComplete="off" autoCorrect="off" spellCheck={false} data-form-type="other" data-lpignore="true" data-1p-ignore="true" data-bwignore="true"
                aria-label="Précision" value={subcategory} onChange={(e) => field('subcategory', e.target.value)} placeholder="CIP, malt, outillage…" className="mod-in" />
            </details>}
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
            {pertinent && !sousLePaye && (
              <div className="mod-ch" role="radiogroup" aria-label="Le paiement déjà noté">
                {(['suit', 'reste'] as const).map(c => (
                  <button key={c} type="button" role="radio" aria-checked={choix === c} onClick={() => setChoixManuel(c)}>
                    {c === 'suit' ? 'Le paiement suit' : 'Reste à payer'}<small>{mots(c)}</small>
                  </button>
                ))}
              </div>
            )}
            {sousLePaye && (
              <div className="mod-ch mod-ch-sous" role="radiogroup" aria-label="Le paiement déjà noté">
                <button type="button" role="radio" aria-checked={choixSous === 'suit'} onClick={() => setChoixManuel('suit')}>
                  Erreur de saisie : j’ai payé {amountOnly(nouveauCents)}<small>{mots('suit')}</small>
                </button>
                <button type="button" role="radio" aria-checked={choixSous === 'avoir'} onClick={() => setChoixManuel('avoir')}>
                  J’ai bien payé {amountOnly(payeNet(transaction, paiements, ecritures))} : {amountOnly(tropPayeCents)} {sortant ? 'trop payé' : 'trop encaissé'}<small>{amountOnly(tropPayeCents)} {sortant ? 'à récupérer du fournisseur' : 'à rembourser'} · la sortie reste comptée</small>
                </button>
              </div>
            )}
            {choixAFaire && <p className="mod-pourquoi" data-booster="trop-paye" role="status">Le montant passe sous ce qui est déjà payé ({amountOnly(payeNet(transaction, paiements, ecritures))}) : choisis ce qui s’est passé.</p>}
            {apres && (
              <div className="mod-ap" aria-live="polite"><h4>Dans Opérations</h4>
                <RangeeApercu piece={transaction} paiements={paiements} transactions={ecritures} mot="avant" ancien nom={transaction.description} />
                <RangeeApercu piece={{ ...apres.piece, proofUrl: proofUrl ?? apres.piece.proofUrl }} paiements={apres.paiements} transactions={ecritures} mot="après" nom={description.trim() || transaction.description} aRecupererCents={sousLePaye && choix === 'avoir' ? tropPayeCents : 0} entrantRecup={!sortant} />
              </div>
            )}
          </>}
          {montantInvalide && !saveError && <p className="mod-pourquoi" role="status">Montant invalide : un nombre positif en CHF est requis.</p>}
          {erreurDonnees && <p className="mod-erreur" role="alert">{erreurDonnees}</p>}
          {erreurPlan && <p className="mod-erreur" role="alert">{erreurPlan}</p>}

          {/* E35-11 : les blocs de la saisie à la main : contrepartie (Chez / Client…), référence, note, règlement, sans justificatif */}
          {aFinance && <>
            <label className="mod-f"><span className="mod-lib">{genreSaisie.qui ?? 'Tiers'}</span>
              <Input type="text" name="tx_edit_vendor" autoComplete="off" autoCorrect="off" spellCheck={false} data-form-type="other" data-lpignore="true" data-1p-ignore="true" data-bwignore="true"
                value={tiersSaisi ?? transaction.finance?.vendor ?? ''} onChange={(e) => setTiersSaisi(e.target.value)} placeholder={LIBELLE_TIERS[genreSaisie.id] ?? 'Nom'} className="mod-in" data-modifier-tiers /></label>
            <div className="mod-g2">
              <label className="mod-f"><span className="mod-lib">Référence</span>
                <Input type="text" name="tx_edit_reference" autoComplete="off" autoCorrect="off" spellCheck={false} data-form-type="other" data-lpignore="true" data-1p-ignore="true" data-bwignore="true"
                  value={refSaisie ?? transaction.finance?.invoiceNumber ?? ''} onChange={(e) => setRefSaisie(e.target.value)} placeholder="N° de facture" className="mod-in" data-modifier-reference /></label>
              <label className="mod-f"><span className="mod-lib">Note</span>
                <Input type="text" name="tx_edit_note" autoComplete="off" autoCorrect="off" spellCheck={false} data-form-type="other" data-lpignore="true" data-1p-ignore="true" data-bwignore="true"
                  value={noteSaisie ?? transaction.finance?.notes ?? ''} onChange={(e) => setNoteSaisie(e.target.value)} className="mod-in" data-modifier-note /></label>
            </div>
            <div className="mod-reg" data-modifier-reglement>
              <span className="mod-lib">Règlement</span>
              <div className="mod-reg-l">
                <span className="mod-reg-c" aria-current={reglement.etat === 'paye' ? 'true' : undefined}>{sortant ? 'Payé' : 'Reçu'}{reglement.etat === 'paye' && reglement.date ? ` le ${jjmm(reglement.date)}` : ''}</span>
                <span className="mod-reg-c" aria-current={reglement.etat === 'apayer' || reglement.etat === 'partiel' ? 'true' : undefined}>{reglement.etat === 'partiel' ? (sortant ? 'Payé en partie' : 'Reçu en partie') : sortant ? 'À payer' : 'À recevoir'}</span>
                {reglement.moyen && <span className="mod-reg-c" aria-label="Compte et moyen de paiement">{METHODES.find((m) => m.id === reglement.moyen)?.nom ?? reglement.moyen}</span>}
                {reglement.etat === 'inconnu' && <span className="mod-pourquoi">Règlement non noté.</span>}
              </div>
              {(reglement.etat === 'apayer' || reglement.etat === 'partiel') && (
                <div className="mod-ech"><small>d’ici le</small>
                  <ChoixDate saisie label="Échéance" valeur={echeanceSaisie ?? transaction.finance?.dueDate ?? ''} vide="Échéance à poser" rangee="achats" onChange={setEcheanceSaisie} /></div>
              )}
            </div>
            {genreSaisie.rythme !== null && (
              <div className="mod-rec" data-modifier-revient>
                <span className="mod-lib">Revient ?</span>
                <div className="mod-seg" role="group" aria-label="Revient ?">
                  {RYTHMES.map(([id, nom]) => <button key={id} type="button" disabled aria-pressed={rythmeActuel === id}>{nom}</button>)}
                </div>
                <p className="mod-pourquoi">{revient ? `Revient ${revient} : la prévision liée se règle au Calendrier.` : 'Une seule fois : aucune prévision liée.'}</p>
              </div>
            )}
            {transaction.finance?.kind !== 'refund' && (
              <label className="mod-ck" data-modifier-sans-justificatif><input type="checkbox" checked={sansJustif ?? !!transaction.finance?.proofNotNeeded} onChange={(e) => setSansJustif(e.target.checked)} />Sans justificatif, c’est normal</label>
            )}
          </>}
          {(!aFinance || !!notesPiece.trim()) && (
            <label className="mod-f"><span className="mod-lib">{aFinance ? 'Note de la pièce' : 'Fournisseur, n° de pièce'}</span>
              <Input type="text" name="tx_edit_proof_notes" autoComplete="off" autoCorrect="off" spellCheck={false} data-form-type="other" data-lpignore="true" data-1p-ignore="true" data-bwignore="true"
                value={champTiers} onChange={(e) => setNotesSaisies(e.target.value)} placeholder="Brau-Rauchshop cmd 686863, Bauhaus…" className="mod-in" />
            </label>
          )}

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
