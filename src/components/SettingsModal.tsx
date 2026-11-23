import React, { useEffect, useMemo, useState } from 'react';
import { Check, Save } from 'lucide-react';
import { COMPANY_FALLBACK, companyFraiche } from '../domain/companyDefaults';
import { ibanCompact, ibanValide, MESSAGE_IBAN } from '../domain/finance/iban';
import { AppConfig } from '../types';
import { StorageService } from '../services/storage';
import { DriveService } from '../services/driveService';
import { FirebaseAuthService } from '../services/firebaseAuth';
import { ModalShell } from '../ui/ModalShell';
import { equipmentErrors, profileVolumeErrors } from '../domain/brewEquipment';
import { useStorageValue, useSyncedDraft } from '../hooks/useLiveData';
import { brewingPreferenceErrors } from '../domain/brewPreferences';
import '../ui/settings-compact.css';
import { Acces, BandeauAcces, BandeauBrasserie, BandeauFiscalite, BandeauSauvegardes, Brasserie, COULEUR_ONGLET, EnteteReglages, Fiscalite, Sauvegardes } from './reglages/Vues';
import { bilanReglages, brouillonModifie, piedOnglet, type OngletId } from './reglages/regles';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onConfigUpdated: (newConfig: AppConfig) => void;
  onOpenAuditLogs: () => void;
  /** Onglet à montrer à l'ouverture (ex. « Brasserie » depuis le lancement d'un brassin) ; absent : l'onglet courant. */
  ouvertSur?: OngletId;
}

const QUATORZE_JOURS = 14 * 24 * 3600 * 1000;

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onConfigUpdated, onOpenAuditLogs, ouvertSur }) => {
  const [activeTab, setActiveTab] = useState<OngletId>('fiscal');
  const [formData, setFormData] = useSyncedDraft(config, isOpen);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [backupRunning, setBackupBusy] = useState(false);
  const [migrationBusy, setMigrationBusy] = useState(false);
  const backupBusy = backupRunning || migrationBusy;
  const [dataMessage, setDataMessage] = useState('');
  const [dataError, setDataError] = useState(false);
  const systemBatches = useStorageValue(StorageService.getBatches);
  const systemInventory = useStorageValue(StorageService.getStocks);
  const transactions = useStorageValue(StorageService.getTransactions);
  const journal = useStorageValue(StorageService.getAuditLogs);
  useEffect(() => { if (isOpen) setSavedSuccess(false); }, [isOpen]);
  useEffect(() => { if (isOpen && ouvertSur) setActiveTab(ouvertSur); }, [isOpen, ouvertSur]);

  const user = isOpen ? FirebaseAuthService.getCurrentUser() : null;
  const bilan = useMemo(() => bilanReglages(formData, { ibanEffectif: formData.company.iban || COMPANY_FALLBACK.iban, compteConnecte: !!user }), [formData, user]);
  if (!isOpen) return null;

  /* AM-66 : un IBAN saisi doit être un IBAN ; vide, la facture dit que les coordonnées manquent. */
  const ibanSaisi = formData.company.iban || COMPANY_FALLBACK.iban;
  /* RL-14 : sans IBAN enregistré, le champ montre celui de la configuration de l'app (VITE_COMPANY_IBAN). S'il est faux, le dire : le brasseur n'a rien tapé, et croit son IBAN enregistré faux. */
  const ibanDeConfig = !formData.company.iban && !!COMPANY_FALLBACK.iban;
  const ibanErreur = ibanCompact(ibanSaisi) && !ibanValide(ibanSaisi)
    ? (ibanDeConfig ? 'Aucun IBAN n’est enregistré dans les Réglages : celui de la configuration de l’app s’affiche, et sa clé de contrôle est fausse. Saisis ici le bon IBAN, puis sauvegarde. ' : '') + MESSAGE_IBAN
    : '';
  /* Le message se montre toujours (un IBAN faux sur les factures doit se voir), mais seul un IBAN TAPÉ dans ce formulaire bloque l'enregistrement :
     un IBAN déjà là (enregistré, ou celui de la configuration de l'app) ne doit jamais empêcher de sauver la cuverie ou un autre réglage (08.11). */
  const ibanModifie = (formData.company.iban ?? '') !== (config.company?.iban ?? '');
  const installationInvalide = formData.brewhouses.some(b => (b.equipment && equipmentErrors(b.equipment).length) || brewingPreferenceErrors(b).length || profileVolumeErrors(b).length);

  const handleSave = async () => {
    if (installationInvalide) return;
    if (ibanErreur && ibanModifie) { setActiveTab('fiscal'); setDataError(true); setDataMessage(ibanErreur); return; }
    setBusy(true); setSavedSuccess(false); setDataError(false); setDataMessage('Enregistrement…');
    try {
      /* Un champ d'identité non touché reprend la valeur fraîche du stockage (adresse écrite depuis la caisse) : jamais un instantané périmé. */
      const aEnregistrer = { ...formData, company: companyFraiche(config.company, formData.company, StorageService.getConfig().company) };
      StorageService.saveConfig(aEnregistrer);
      onConfigUpdated(aEnregistrer);
      await StorageService.confirmPendingWrites();
      setSavedSuccess(true);
      setDataMessage('Enregistré sur le serveur.');
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) { setDataError(true); setDataMessage((err as Error).message); }
    finally { setBusy(false); }
  };

  const handleResetData = () => {
    if (confirm('Attention : réinitialiser toutes les données aux valeurs de base du classeur Excel ?')) {
      StorageService.resetToInitial();
      window.location.reload();
    }
  };

  const bh = formData.brewhouses.find(b => b.id === formData.activeBrewhouseId) ?? formData.brewhouses[0];
  const maintenant = Date.now();
  const modifs14j = journal.filter(l => { const t = Date.parse(l.timestamp); return Number.isFinite(t) && maintenant - t <= QUATORZE_JOURS; }).length;
  const pied = piedOnglet(bilan, activeTab, brouillonModifie(formData, config));
  const [avantReste, resteTrous] = [pied.trous, pied.erreurs];
  const bandeau = activeTab === 'fiscal' ? <BandeauFiscalite f={formData.fiscal} />
    : activeTab === 'brewhouse' ? <BandeauBrasserie bh={bh} />
    : activeTab === 'security' ? <BandeauAcces email={user?.email} drive={FirebaseAuthService.hasDriveAccess()} />
    : <BandeauSauvegardes brassins={systemBatches.length} ecritures={transactions.length} />;

  return (
    <ModalShell open={isOpen} onClose={onClose} size="lg" dismissible={!busy && !backupBusy} labelledBy="settings-modal-title">
      <div className="settings-workspace rg flex min-h-0 flex-1 flex-col overflow-hidden" style={{ ['--rg-c' as string]: `rgb(var(${COULEUR_ONGLET[activeTab]}))` }}>
        <div className="rg-band-wrap shrink-0">
          <EnteteReglages actif={activeTab} onOnglet={setActiveTab} bilan={bilan} occupe={busy} sauvegardeOccupee={backupBusy} onClose={onClose} fermable={!busy && !backupBusy} />
          <div className="rg-band" style={{ paddingTop: 0, marginTop: -4 }}>{bandeau}</div>
        </div>

        <div className="rg-bd">
          {activeTab === 'fiscal' && (
            <Fiscalite f={formData.fiscal} setF={fiscal => setFormData(d => ({ ...d, fiscal }))} company={formData.company}
              setCompany={company => setFormData(d => ({ ...d, company }))} ibanErreur={ibanErreur} ibanDeConfig={ibanDeConfig} />
          )}
          {activeTab === 'brewhouse' && (
            <Brasserie draft={formData} setDraft={setFormData} batches={systemBatches} inventaire={systemInventory.equipment}
              setMessage={m => { setDataError(false); setDataMessage(m); }} />
          )}
          {activeTab === 'security' && (
            <Acces email={user?.email} modifs14j={modifs14j} onOuvrirJournal={() => { onClose(); onOpenAuditLogs(); }}
              onExporter={() => DriveService.exportDriveManifest(StorageService.getTransactions())} />
          )}
          {/* Keep the prepared file selection when switching settings tabs. */}
          <Sauvegardes visible={activeTab === 'backup'} setBackupBusy={setBackupBusy} setMigrationBusy={setMigrationBusy} backupRunning={backupRunning}
            migrationBusy={migrationBusy} busy={busy} onReset={handleResetData} />
        </div>

        {activeTab !== 'backup' && dataMessage && <p role={dataError ? 'alert' : 'status'} className={`px-4 py-2 text-xs ${dataError ? 'text-alert' : 'text-hop'}`}>{dataMessage}</p>}
        {(activeTab === 'fiscal' || activeTab === 'brewhouse') && (
          <div className="rg-ft">
            <span>{savedSuccess ? 'Modifications enregistrées !' : (avantReste || resteTrous) ? <>Il reste {avantReste > 0 && <b className="rg-trou">{avantReste} {avantReste > 1 ? 'trous' : 'trou'}</b>}{avantReste > 0 && resteTrous > 0 && ' et '}{resteTrous > 0 && <b>{resteTrous} {resteTrous > 1 ? 'erreurs' : 'erreur'}</b>}</> : pied.texte}</span>
            <button type="button" onClick={handleSave} disabled={busy || installationInvalide}
              className="min-h-touch-lg px-3 py-1 bg-ebc-straw text-cave-950 font-bold text-sm rounded-xl shadow-lg transition flex items-center ml-auto">
              {savedSuccess ? <Check className="w-4 h-4 mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
              <span>Sauvegarder</span>
            </button>
          </div>
        )}
      </div>
    </ModalShell>
  );
};
