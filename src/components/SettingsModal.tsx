import { Input } from '../ui/Input';
import React, { useEffect, useState } from 'react';
import { COMPANY_FALLBACK } from '../domain/companyDefaults';
import { NumberInput } from '../ui/NumberInput';
import { 
  X, 
  Settings, 
  Shield, 
  RotateCcw, 
  Save, 
  Check, 
  FolderTree,
  Lock
} from 'lucide-react';
import { AppConfig } from '../types';
import { StorageService } from '../services/storage';
import { DriveService } from '../services/driveService';
import { ModalShell } from '../ui/ModalShell';
import { inputClass } from '../ui/FormNav';
import { BrewhouseSettings } from '../ui/BrewhouseSettings';
import { equipmentErrors } from '../domain/brewEquipment';
import { BackupPanel } from '../ui/BackupPanel';
import { DriveStoragePanel } from '../ui/DriveStoragePanel';
import { useSyncedDraft } from '../hooks/useLiveData';
import '../ui/settings-compact.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onConfigUpdated: (newConfig: AppConfig) => void;
  onOpenAuditLogs: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigUpdated,
  onOpenAuditLogs
}) => {
  const [activeTab, setActiveTab] = useState<'fiscal' | 'brewhouse' | 'security' | 'backup'>('fiscal');
  const [formData, setFormData] = useSyncedDraft(config, isOpen);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [backupRunning, setBackupBusy] = useState(false);
  const [migrationBusy, setMigrationBusy] = useState(false);
  const backupBusy = backupRunning || migrationBusy;
  const [dataMessage, setDataMessage] = useState('');
  const [dataError, setDataError] = useState(false);
  useEffect(()=>{if(isOpen) setSavedSuccess(false);},[isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (formData.brewhouses.some(b=>b.equipment&&equipmentErrors(b.equipment).length)) return;
    setBusy(true); setSavedSuccess(false); setDataError(false); setDataMessage('Enregistrement…');
    try {
    StorageService.saveConfig(formData);
    onConfigUpdated(formData);
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

  return (
    <ModalShell open={isOpen} onClose={onClose} size="lg" dismissible={!busy && !backupBusy} labelledBy="settings-modal-title">
      <div className="settings-workspace flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-cave-800 bg-cave-900/90 shrink-0">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-ebc-straw shrink-0" />
          <h3 id="settings-modal-title" className="font-semibold text-sm text-cave-50">Paramètres & Évolutions</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={busy || backupBusy}
          aria-label="Fermer"
          className="min-h-touch min-w-touch flex items-center justify-center text-cave-400 hover:text-cave-200 rounded-control transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex overflow-x-auto overscroll-x-contain bg-cave-950/60 p-1 border-b border-cave-800/80 text-sm shrink-0 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('fiscal')}
          disabled={backupBusy}
          aria-pressed={activeTab === 'fiscal'}
          className={`min-h-touch flex-1 py-0.5 px-1.5 rounded-control font-semibold transition whitespace-nowrap text-center disabled:opacity-50 ${
            activeTab === 'fiscal' ? 'bg-ebc-straw text-cave-950 shadow' : 'text-cave-400 hover:text-cave-200'
          }`}
        >
          Fiscalité
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('brewhouse')}
          disabled={backupBusy}
          aria-pressed={activeTab === 'brewhouse'}
          className={`min-h-touch flex-1 py-0.5 px-1.5 rounded-control font-semibold transition whitespace-nowrap text-center disabled:opacity-50 ${
            activeTab === 'brewhouse' ? 'bg-ebc-straw text-cave-950 shadow' : 'text-cave-400 hover:text-cave-200'
          }`}
        >
          Brasserie
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          disabled={backupBusy}
          aria-pressed={activeTab === 'security'}
          className={`min-h-touch flex-1 py-0.5 px-1.5 rounded-control font-semibold transition whitespace-nowrap text-center disabled:opacity-50 ${
            activeTab === 'security' ? 'bg-ebc-straw text-cave-950 shadow' : 'text-cave-400 hover:text-cave-200'
          }`}
        >
          Accès
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          disabled={busy || backupBusy}
          aria-pressed={activeTab === 'backup'}
          className={`min-h-touch flex-1 py-0.5 px-1.5 rounded-control font-semibold transition whitespace-nowrap text-center disabled:opacity-50 ${
            activeTab === 'backup' ? 'bg-ebc-straw text-cave-950 shadow' : 'text-cave-400 hover:text-cave-200'
          }`}
        >
          Sauvegardes
        </button>
      </div>

      {/* Modal Body */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 text-sm overscroll-contain">
        {/* TAB 1: FISCALITÉ */}
        {activeTab === 'fiscal' && (
          <div className="space-y-2">
            <p className="text-cave-400 text-xs sm:text-sm">
              Ajustez ces valeurs si la législation suisse évolue (ex: TVA ou droit brassicole).
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="settings-vat-reduced" className="text-cave-200 font-semibold block mb-1 text-xs">TVA réduite (denrées admissibles)</label>
                <div className="flex items-center space-x-1">
                  <NumberInput
                    id="settings-vat-reduced"
                    value={Math.round(formData.fiscal.tvaReducedRate * 1000) / 10}
                    onValue={(v) =>
                      setFormData({
                        ...formData,
                        fiscal: { ...formData.fiscal, tvaReducedRate: v / 100 }
                      })}
                    emptyValue={2.6}
                    pad
                    className={`${inputClass} font-mono font-bold`}
                  />
                  <span className="text-cave-400 text-xs">%</span>
                </div>
              </div>

              <div>
                <label htmlFor="settings-vat-normal" className="text-cave-200 font-semibold block mb-1 text-xs">TVA normale (bière alcoolisée, matériel)</label>
                <div className="flex items-center space-x-1">
                  <NumberInput
                    id="settings-vat-normal"
                    value={Math.round(formData.fiscal.tvaNormalRate * 1000) / 10}
                    onValue={(v) =>
                      setFormData({
                        ...formData,
                        fiscal: { ...formData.fiscal, tvaNormalRate: v / 100 }
                      })}
                    emptyValue={8.1}
                    pad
                    className={`${inputClass} font-mono font-bold`}
                  />
                  <span className="text-cave-400 text-xs">%</span>
                </div>
              </div>
            </div>

            {/* Assujettissement TVA */}
            <div className="p-2 bg-cave-850/40 rounded-control border border-cave-800 space-y-1">
              <label className="flex items-center justify-between cursor-pointer min-h-touch-lg">
                <span className="flex-1 pr-3">
                  <span className="font-bold text-cave-200 block text-xs sm:text-sm">Brasserie assujettie à la TVA</span>
                </span>
                <input
                  type="checkbox"
                  name="settings_tva_registered"
                  autoComplete="off"
                  data-form-type="other"
                  checked={formData.fiscal.isTvaRegistered}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fiscal: { ...formData.fiscal, isTvaRegistered: e.target.checked }
                    })
                  }
                  className="w-5 h-5 accent-ebc-straw rounded cursor-pointer shrink-0"
                />
              </label>
              <details><summary className="min-h-touch flex items-center cursor-pointer text-xs text-cave-400">Quel statut indiquer ?</summary><p className="text-xs text-cave-400">Reproduis le statut confirmé auprès de l’AFC. Le seuil de chiffre d’affaires ne remplace pas une décision d’assujettissement, notamment volontaire.</p></details>
            </div>

            <div className="space-y-2 rounded-control border border-cave-800 bg-cave-950/50 p-2">
              <h3 className="font-bold text-cave-50">Réserve impôt sur la bière</h3>
              <div className="grid grid-cols-2 gap-3"><label className="text-sm text-cave-200">Réduction annuelle OFDF (%)<NumberInput value={formData.fiscal.beerTaxAnnualReductionPct} onValue={value => setFormData({...formData,fiscal:{...formData.fiscal,beerTaxAnnualReductionPct:value}})} min={0} max={40} className={inputClass}/></label><label className="text-sm text-cave-200">Année confirmée<NumberInput value={formData.fiscal.beerTaxReductionYear} onValue={value => setFormData({...formData,fiscal:{...formData.fiscal,beerTaxReductionYear:value}})} min={2000} max={2200} integer className={inputClass}/></label></div>
              <label className="block text-sm text-cave-200">Périodicité attribuée<select className={inputClass} value={formData.fiscal.beerTaxPeriod??''} onChange={event=>setFormData({...formData,fiscal:{...formData.fiscal,beerTaxPeriod:(event.target.value||undefined) as 'annual'|'quarterly'|undefined}})}><option value="">À confirmer auprès de l’OFDF</option><option value="annual">Annuelle</option><option value="quarterly">Trimestrielle</option></select></label>
              <details className="text-xs text-cave-400"><summary className="min-h-touch flex items-center cursor-pointer">Calcul et déclaration</summary><div className="space-y-2"><p>Taux pleins selon le degré Plato : 16,88 / 25,32 / 33,76 CHF par hl. Le conditionnement fournit une réserve indicative ; l’impôt naît à la sortie ou à la consommation sur place.</p><p>Sans taux annuel confirmé, aucune réduction n’est supposée. Les paiements et décomptes s’effectuent selon les décisions de l’OFDF, via Taxas.</p><a href="https://www.bazg.admin.ch/fr/taxas-plateforme-pour-les-taxes-a-la-consommation" target="_blank" rel="noreferrer" className="inline-flex min-h-touch items-center text-ebc-straw underline">Consulter les informations OFDF</a></div></details>
            </div>
            <div className="p-2 bg-cave-850/40 rounded-control border border-cave-800 space-y-1">
              <label htmlFor="settings-company-iban" className="font-bold text-cave-200 text-xs">IBAN Brasserie (factures par virement)</label>
              <Input
                id="settings-company-iban"
                type="text"
                name="settings_company_qr_ref"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                data-form-type="other"
                data-lpignore="true"
                data-1p-ignore="true"
                data-bwignore="true"
                value={formData.company.iban || COMPANY_FALLBACK.iban}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    company: { ...formData.company, iban: e.target.value }
                  })
                }
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>
        )}

        {/* TAB 2: BREWHOUSE CONFIG */}
        {activeTab === 'brewhouse' && (
          <div className="space-y-3">
            <p className="text-cave-400 text-xs sm:text-sm">
              Système actif : <strong>{formData.brewhouses.find(b=>b.id===formData.activeBrewhouseId)?.name}</strong>.
            </p>

            {formData.brewhouses.map((bh) => (
              <div key={bh.id} className="p-2 rounded-control bg-cave-850/50 border border-cave-700 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-cave-50">{bh.name}</span>
                  <span className="text-footnote bg-ebc-straw/20 text-ebc-gold font-semibold px-2 py-0.5 rounded-full font-mono">
                    {bh.volumeL} L visés
                  </span>
                </div>

                <dl className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <dt className="text-cave-400">Rendement</dt>
                    <dd className="font-semibold text-sm tabular-nums text-cave-200">{bh.efficiencyPct}%</dd>
                  </div>
                  <div>
                    <dt className="text-cave-400">Évaporation</dt>
                    <dd className="font-semibold text-sm tabular-nums text-cave-200">{bh.equipment ? `${bh.equipment.boilOffLPerHour} L/h` : `${bh.boilOffRatePct}%/h`}</dd>
                  </div>
                  <div>
                    <dt className="text-cave-400">Pertes cuve</dt>
                    <dd className="font-semibold text-sm tabular-nums text-cave-200">{bh.deadSpaceL} L</dd>
                  </div>
                </dl>

                {bh.id===formData.activeBrewhouseId&&<BrewhouseSettings profile={bh} onChange={next=>setFormData(f=>({...f,brewhouses:f.brewhouses.map(b=>b.id===next.id?next:b)}))}/>}
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: SECURITY & PIN */}
        {activeTab === 'security' && (
          <div className="space-y-3">
            <div className="p-3.5 bg-cave-850/50 border border-cave-700 rounded-2xl space-y-2">
              <h4 className="font-bold text-cave-50 flex items-center text-xs sm:text-sm">
                <Lock className="w-4 h-4 text-hop mr-1.5" /> Accès à l'application
              </h4>
              <p className="text-xs sm:text-sm text-cave-400 leading-relaxed">
                L'accès est protégé par votre <strong className="text-cave-200">compte Google</strong> (authentification Firebase).
              </p>
            </div>

            {/* Audit Logbook trigger */}
            <div className="p-3 bg-cave-850/50 border border-cave-700 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="font-bold text-cave-50 flex items-center text-xs sm:text-sm">
                  <Shield className="w-4 h-4 text-hop mr-1.5" /> Journal d'Audit & Historique
                </h4>
                <p className="text-xs text-cave-400">Consulter les modifications</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuditLogs();
                }}
                className="px-3 py-1.5 bg-cave-800 hover:bg-cave-600 text-cave-200 font-bold rounded-xl transition text-xs sm:text-sm"
              >
                Ouvrir
              </button>
            </div>

            {/* Google Drive Export Manifest */}
            <div className="p-3 bg-water/10 border border-water/30 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="font-bold text-water flex items-center text-xs sm:text-sm">
                  <FolderTree className="w-4 h-4 text-water mr-1.5" /> Arborescence Google Drive
                </h4>
                <p className="text-xs text-water/80">Télécharger la liste classée</p>
              </div>
              <button
                type="button"
                onClick={() => DriveService.exportDriveManifest(StorageService.getTransactions())}
                className="px-3 py-1.5 bg-water hover:bg-blue-400 text-cave-950 font-bold rounded-xl transition text-xs sm:text-sm"
              >
                Exporter
              </button>
            </div>
          </div>
        )}

        {/* Keep the prepared file selection when switching settings tabs. */}
        <div hidden={activeTab !== 'backup'} className="space-y-4">
          <DriveStoragePanel onBusyChange={setMigrationBusy} disabled={backupRunning}/>
          <BackupPanel onBusyChange={setBackupBusy} disabled={migrationBusy}/>
          <details className="border-t border-cave-800 pt-3">
            <summary className="cursor-pointer py-2 text-sm text-cave-400">Cet appareil</summary>
            <button
              type="button"
              onClick={handleResetData}
              disabled={busy || backupBusy}
              className="mt-2 w-full min-h-touch-lg px-3 py-2 text-alert text-sm font-semibold rounded-xl border border-alert/30 hover:bg-alert/10 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true"/>
              Réinitialiser l’affichage de cet appareil
            </button>
          </details>
        </div>
      </div>

      {/* Sticky Actions */}
      {activeTab !== 'backup' && dataMessage && <p role={dataError ? 'alert' : 'status'} className={`px-4 py-2 text-xs ${dataError ? 'text-alert' : 'text-hop'}`}>{dataMessage}</p>}
      {(activeTab === 'fiscal' || activeTab === 'brewhouse') && <div className="px-2 py-0.5 border-t border-cave-800 bg-cave-900 flex items-center justify-between shrink-0">
        <span className="text-xs sm:text-sm text-hop font-semibold">
          {savedSuccess ? 'Modifications enregistrées !' : ''}
        </span>
        <button
          type="button"
          onClick={handleSave}
          disabled={busy || formData.brewhouses.some(b=>b.equipment&&equipmentErrors(b.equipment).length)}
          className="min-h-touch-lg px-3 py-1 bg-ebc-straw text-cave-950 font-bold text-sm rounded-xl shadow-lg transition flex items-center ml-auto"
        >
          {savedSuccess ? <Check className="w-4 h-4 mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
          <span>Sauvegarder</span>
        </button>
      </div>}
      </div>
    </ModalShell>
  );
};
