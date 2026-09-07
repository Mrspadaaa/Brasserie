import React, { useEffect, useState } from 'react';
import { COMPANY_FALLBACK } from '../domain/companyDefaults';
import { NumberInput } from '../ui/NumberInput';
import { 
  X, 
  Settings, 
  Shield, 
  Download, 
  Upload, 
  RotateCcw, 
  Save, 
  Check, 
  FolderTree,
  Lock
} from 'lucide-react';
import { AppConfig } from '../types';
import { StorageService } from '../services/storage';
import { DriveService } from '../services/driveService';
import { ModalShell, StickyActions } from '../ui/ModalShell';
import { inputClass } from '../ui/FormNav';
import { BrewhouseSettings } from '../ui/BrewhouseSettings';
import { equipmentErrors } from '../domain/brewEquipment';

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
  const [formData, setFormData] = useState<AppConfig>(config);
  const [savedSuccess, setSavedSuccess] = useState(false);
  useEffect(()=>{if(isOpen){setFormData(config);setSavedSuccess(false);}},[isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (formData.brewhouses.some(b=>b.equipment&&equipmentErrors(b.equipment).length)) return;
    StorageService.saveConfig(formData);
    onConfigUpdated(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleExportBackup = () => {
    const json = StorageService.exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laffinee_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        StorageService.importAllData(reader.result as string);
        alert('Sauvegarde restaurée avec succès !');
        window.location.reload();
      } catch {
        alert('Erreur lors de la lecture du fichier de sauvegarde.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (confirm('Attention : réinitialiser toutes les données aux valeurs de base du classeur Excel ?')) {
      StorageService.resetToInitial();
      window.location.reload();
    }
  };

  return (
    <ModalShell open={isOpen} onClose={onClose} size="lg">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-cave-800 bg-cave-900/90 shrink-0">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-ebc-straw shrink-0" />
          <h3 className="font-bold text-base text-cave-50">Paramètres & Évolutions</h3>
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

      {/* Sub-tabs */}
      <div className="flex bg-cave-950/60 p-1.5 border-b border-cave-800/80 text-xs sm:text-sm overflow-x-auto scrollbar-none shrink-0 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('fiscal')}
          className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-xl font-semibold transition whitespace-nowrap text-center ${
            activeTab === 'fiscal' ? 'bg-ebc-straw text-cave-950 shadow' : 'text-cave-400 hover:text-cave-200'
          }`}
        >
          🇨🇭 Fiscalité
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('brewhouse')}
          className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-xl font-semibold transition whitespace-nowrap text-center ${
            activeTab === 'brewhouse' ? 'bg-ebc-straw text-cave-950 shadow' : 'text-cave-400 hover:text-cave-200'
          }`}
        >
          ⚙️ Brasserie
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-xl font-semibold transition whitespace-nowrap text-center ${
            activeTab === 'security' ? 'bg-ebc-straw text-cave-950 shadow' : 'text-cave-400 hover:text-cave-200'
          }`}
        >
          🔒 Accès
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-xl font-semibold transition whitespace-nowrap text-center ${
            activeTab === 'backup' ? 'bg-ebc-straw text-cave-950 shadow' : 'text-cave-400 hover:text-cave-200'
          }`}
        >
          💾 Backup
        </button>
      </div>

      {/* Modal Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-sm overscroll-contain">
        {/* TAB 1: FISCALITÉ */}
        {activeTab === 'fiscal' && (
          <div className="space-y-3">
            <p className="text-cave-400 text-xs sm:text-sm">
              Ajustez ces valeurs si la législation suisse évolue (ex: TVA ou droit brassicole).
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-cave-200 font-semibold block mb-1 text-xs sm:text-sm">TVA Bière</label>
                <div className="flex items-center space-x-1">
                  <NumberInput
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
                <label className="text-cave-200 font-semibold block mb-1 text-xs sm:text-sm">TVA Matériel</label>
                <div className="flex items-center space-x-1">
                  <NumberInput
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
            <div className="p-3 bg-cave-850/40 rounded-xl border border-cave-800 space-y-2">
              <label className="flex items-center justify-between cursor-pointer min-h-[44px]">
                <span className="flex-1 pr-3">
                  <span className="font-bold text-cave-200 block text-xs sm:text-sm">Brasserie assujettie à la TVA</span>
                  <span className="text-xs text-cave-400">
                    Sous {formData.fiscal.tvaThresholdTurnover.toLocaleString('fr-CH')} CHF de CA annuel, aucune TVA sur les quittances.
                  </span>
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-cave-200 font-semibold block mb-1 text-xs sm:text-sm">Impôt taux plein</label>
                <div className="flex items-center space-x-1">
                  <NumberInput
                    value={formData.fiscal.beerTaxFullRatePerHl}
                    onValue={(v) =>
                      setFormData({
                        ...formData,
                        fiscal: {
                          ...formData.fiscal,
                          beerTaxFullRatePerHl: v
                        }
                      })}
                    pad
                    className={`${inputClass} font-mono font-bold`}
                  />
                  <span className="text-cave-400 text-xs">CHF/hl</span>
                </div>
              </div>

              <div>
                <label className="text-cave-200 font-semibold block mb-1 text-xs sm:text-sm">Plafond petit brasseur</label>
                <div className="flex items-center space-x-1">
                  <NumberInput
                    value={formData.fiscal.beerTaxSmallBrewerMaxHl}
                    onValue={(v) =>
                      setFormData({
                        ...formData,
                        fiscal: {
                          ...formData.fiscal,
                          beerTaxSmallBrewerMaxHl: v
                        }
                      })}
                    integer
                    pad
                    className={`${inputClass} font-mono font-bold`}
                  />
                  <span className="text-cave-400 text-xs">hl/an</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-ebc-gold/90 bg-ebc-straw/10 border border-ebc-straw/30 rounded-xl p-2.5 leading-relaxed">
              ⚠️ L'impôt est calculé sur la bière <strong>réellement conditionnée</strong> (bouteilles + fûts).
            </p>

            <div className="p-3 bg-cave-850/40 rounded-xl border border-cave-800 space-y-1">
              <span className="font-bold text-cave-200 text-xs sm:text-sm">IBAN Brasserie (QR-Facture) :</span>
              <input
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
                className={`${inputClass} font-mono text-xs sm:text-sm`}
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
              <div key={bh.id} className="p-3 rounded-2xl bg-cave-850/50 border border-cave-700 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-cave-50">{bh.name}</span>
                  <span className="text-footnote bg-ebc-straw/20 text-ebc-gold font-semibold px-2 py-0.5 rounded-full font-mono">
                    {bh.volumeL} L visés
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm text-center">
                  <div className="bg-cave-900/60 p-2 rounded-xl">
                    <span className="text-cave-400">Rendement</span>
                    <div className="font-bold text-cave-200">{bh.efficiencyPct}%</div>
                  </div>
                  <div className="bg-cave-900/60 p-2 rounded-xl">
                    <span className="text-cave-400">Évaporation</span>
                    <div className="font-bold text-cave-200">{bh.equipment ? `${bh.equipment.boilOffLPerHour} L/h` : `${bh.boilOffRatePct}%/h`}</div>
                  </div>
                  <div className="bg-cave-900/60 p-2 rounded-xl">
                    <span className="text-cave-400">Pertes cuve</span>
                    <div className="font-bold text-cave-200">{bh.deadSpaceL} L</div>
                  </div>
                </div>

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

        {/* TAB 4: BACKUP & RESTORE */}
        {activeTab === 'backup' && (
          <div className="space-y-3">
            <div className="p-3 bg-cave-850/40 rounded-xl border border-cave-800 space-y-2">
              <h4 className="font-bold text-cave-200 text-xs sm:text-sm">Sauvegarder les données</h4>
              <p className="text-xs text-cave-400">
                Téléchargez une copie intégrale de toutes vos transactions, recettes, fûts et stocks en JSON.
              </p>
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-2 bg-cave-850 hover:bg-cave-800 text-cave-200 font-bold rounded-xl transition flex items-center justify-center space-x-1.5 text-xs sm:text-sm"
              >
                <Download className="w-3.5 h-3.5 text-ebc-straw" />
                <span>Exporter la sauvegarde</span>
              </button>
            </div>

            <div className="p-3 bg-cave-850/40 rounded-xl border border-cave-800 space-y-2">
              <h4 className="font-bold text-cave-200 text-xs sm:text-sm">Restaurer une sauvegarde</h4>
              <label className="w-full py-2 bg-cave-850 hover:bg-cave-800 text-cave-200 font-bold rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer text-xs sm:text-sm">
                <Upload className="w-3.5 h-3.5 text-water" />
                <span>Importer un fichier JSON</span>
                <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
              </label>
            </div>

            <div className="pt-2 border-t border-cave-800">
              <button
                type="button"
                onClick={handleResetData}
                className="w-full py-2 text-alert hover:text-alert text-xs sm:text-sm font-semibold rounded-xl border border-alert/20 hover:bg-alert/10 transition flex items-center justify-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                <span>Réinitialiser aux valeurs d'origine</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Actions */}
      <div className="p-3 border-t border-cave-800 bg-cave-900 flex items-center justify-between shrink-0">
        <span className="text-xs sm:text-sm text-hop font-semibold">
          {savedSuccess ? 'Modifications enregistrées !' : ''}
        </span>
        <button
          type="button"
          onClick={handleSave}
          disabled={formData.brewhouses.some(b=>b.equipment&&equipmentErrors(b.equipment).length)}
          className="px-5 py-2.5 bg-gradient-to-r from-ebc-straw to-ebc-amber hover:from-ebc-gold text-cave-950 font-bold text-sm rounded-xl shadow-lg transition flex items-center ml-auto"
        >
          {savedSuccess ? <Check className="w-4 h-4 mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
          <span>Sauvegarder</span>
        </button>
      </div>
    </ModalShell>
  );
};
