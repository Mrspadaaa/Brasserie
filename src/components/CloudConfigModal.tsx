import React, { useState } from 'react';
import {
  X,
  Sparkles,
  FolderTree,
  Check,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  HardDrive
} from 'lucide-react';
import { AiClient, AiTier, TIER_LABEL, TIER_HINT } from '../services/aiClient';
import { DriveConnection } from '../ui/finance/DriveConnection';
import { StorageService } from '../services/storage';
import { Button } from './ui/Button';

interface CloudConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

/**
 * Connexions cloud et IA.
 *
 * Cette modale ne demande PLUS de clé d'API ni de jeton à coller.
 *
 *   - La clé Gemini vit dans Secret Manager, côté serveur. Elle transitait
 *     auparavant par `localStorage` et partait dans chaque requête du
 *     navigateur : visible dans les outils de développement, et facturable par
 *     quiconque la récupérait.
 *   - L'accès Drive vient de la connexion Google elle-même. Il fallait avant
 *     coller à la main un jeton OAuth qui expirait au bout d'une heure.
 *
 * Il ne reste donc que ce qui se règle vraiment : le niveau d'IA par défaut, et
 * un bouton pour vérifier que tout répond.
 */
export const CloudConfigModal: React.FC<CloudConfigModalProps> = ({
  isOpen,
  onClose,
  onSaved
}) => {
  const [defaultTier, setDefaultTier] = useState<AiTier>(() =>
    StorageService.getUiState<AiTier>('ai_default_tier', 'fast')
  );
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<
    { ok: true; model?: string; elapsedMs?: number } | { ok: false; error: string } | null
  >(null);

  if (!isOpen) return null;



  /** Vérifie que la passerelle répond réellement, avec une vraie question. */
  const handleTestAi = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await AiClient.run({
      task: 'naturalSearch',
      tier: defaultTier,
      instruction: 'Combien font 2 + 2 ? Réponds simplement.',
      context: { controle: true }
    });
    setTestResult(
      res.ok
        ? { ok: true, model: res.model, elapsedMs: res.elapsedMs }
        : { ok: false, error: res.error || 'Échec inconnu.' }
    );
    setTesting(false);
  };

  const handleSave = () => {
    StorageService.setUiState('ai_default_tier', defaultTier);
    if (onSaved) onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-cave-950/85 backdrop-blur-md">
      {/*
        ⚠️ `role` / `aria-modal` / `aria-labelledby` : cette fenêtre était la
        seule des trois à n'en porter aucun. Un lecteur d'écran n'annonçait donc
        pas son ouverture, ne nommait pas son objet, et laissait parcourir la
        page derrière elle comme si de rien n'était.
      */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cloud-config-titre"
        className="w-full max-w-lg bg-cave-900 border border-cave-800 rounded-t-sheet sm:rounded-sheet shadow-sheet overflow-hidden max-h-[92dvh] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-cave-800 shrink-0">
          <h3 id="cloud-config-titre" className="text-lg font-semibold text-cave-50">
            Connexions cloud et IA
          </h3>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="touch-target rounded-control text-cave-400 hover:text-cave-100 hover:bg-cave-850 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-6">
          {/* --- Intelligence artificielle --- */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-ebc-straw shrink-0" />
              <h4 className="text-base font-semibold text-cave-50">Intelligence artificielle</h4>
            </div>

            <div className="p-4 rounded-panel bg-cave-950 border border-hop/30 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-hop shrink-0 mt-0.5" />
              <p className="text-sm text-cave-200 leading-relaxed">
                La clé Gemini est stockée sur le serveur, dans Secret Manager. Elle ne transite
                jamais par ce navigateur et n'apparaît dans aucune requête —{' '}
                <span className="text-cave-400">
                  contrairement à la version précédente, où elle était lisible depuis les outils
                  de développement.
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-cave-400">Niveau utilisé par défaut :</p>
              <div className="flex gap-2">
                {(['fast', 'max'] as AiTier[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDefaultTier(t)}
                    aria-pressed={defaultTier === t}
                    className={`flex-1 min-h-touch-lg px-3 rounded-control border text-left px-4 transition-colors ${
                      defaultTier === t
                        ? 'bg-ebc-straw/15 border-ebc-straw text-ebc-straw'
                        : 'bg-cave-950 border-cave-700 text-cave-400 hover:text-cave-200'
                    }`}
                  >
                    <span className="block text-base font-semibold">{TIER_LABEL[t]}</span>
                    <span className="block text-sm opacity-80">{TIER_HINT[t]}</span>
                  </button>
                ))}
              </div>
              <p className="text-sm text-cave-400 leading-relaxed">
                Chaque action garde son propre niveau adapté ; celui-ci ne fixe que la valeur de
                départ. Le niveau se change à tout moment avant de lancer une analyse.
              </p>
            </div>

            <Button intent="secondary" full onClick={handleTestAi} disabled={testing}>
              {testing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Vérification…
                </>
              ) : (
                'Vérifier que l’IA répond'
              )}
            </Button>

            {testResult?.ok && (
              <div className="p-3 rounded-panel bg-hop/10 border border-hop/40 text-hop text-sm flex items-start gap-2">
                <Check className="w-5 h-5 shrink-0" />
                <span>
                  L'IA répond. Modèle utilisé :{' '}
                  <span className="font-mono text-cave-100">{testResult.model}</span>
                  {testResult.elapsedMs !== undefined && (
                    <>
                      {' '}
                      en <span className="font-mono">{(testResult.elapsedMs / 1000).toFixed(1)} s</span>
                    </>
                  )}
                  .
                </span>
              </div>
            )}

            {testResult?.ok === false && (
              <div className="p-3 rounded-panel bg-alert/10 border border-alert/40 text-alert text-sm flex items-start gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{testResult.error}</span>
              </div>
            )}
          </section>

          {/* --- Google Drive --- */}
          <section className="space-y-4 pt-2 border-t border-cave-800">
            <div className="flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-water shrink-0" />
              <h4 className="text-base font-semibold text-cave-50">Google Drive</h4>
            </div>

            <p className="text-sm text-cave-300 leading-relaxed">Le Drive du compte Google connecté conserve tes justificatifs. Après l’autorisation initiale, l’accès se renouvelle automatiquement.</p>
            <DriveConnection />

            <a
              href="https://drive.google.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 min-h-touch text-water hover:underline text-sm"
            >
              Ouvrir mon Google Drive
              <ExternalLink className="w-4 h-4" />
            </a>
          </section>
        </div>

        <div className="p-4 border-t border-cave-800 flex gap-3 shrink-0 pb-safe">
          <Button intent="secondary" full onClick={onClose}>
            Annuler
          </Button>
          <Button intent="primary" full onClick={handleSave}>
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
};
