import React, { useState } from 'react';
import { Cloud, ExternalLink, FolderTree, RefreshCw, ShieldCheck, Sparkles, Target, Zap } from 'lucide-react';
import { AiClient, AiTier, TIER_HINT } from '../services/aiClient';
import { DriveConnection } from '../ui/finance/DriveConnection';
import { FirebaseAuthService } from '../services/firebaseAuth';
import { StorageService } from '../services/storage';
import { Feuille } from './feuilles/Feuille';

interface CloudConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

type Essai = { ok: true; model?: string; elapsedMs?: number; at: number } | { ok: false; error: string; at: number };

/** « il y a 2 min » : jamais plus précis que la minute, jamais une heure inventée. */
export const ilYa = (at: number, now: number): string => {
  const min = Math.max(0, Math.round((now - at) / 60_000));
  return min < 1 ? 'à l’instant' : min < 60 ? `il y a ${min} min` : `il y a ${Math.round(min / 60)} h`;
};

/**
 * Connexions cloud et IA (d3p2) : deux voyants (IA, Drive) puis les réglages qui s'y rattachent.
 *
 * Cette feuille ne demande PLUS de clé d'API ni de jeton : la clé Gemini vit dans Secret Manager, côté serveur, et
 * l'accès Drive vient de la connexion Google. Il reste le niveau d'IA par défaut (Rapide / Max, enregistré au toucher)
 * et un bouton pour vérifier que tout répond.
 *
 * Voyants : l'IA n'est « vérifiée » qu'après une vraie question, sinon « pas vérifiée » (jamais un vert supposé).
 * Drive : l'accès est un jeton court renouvelé en silence ; l'app n'en connaît pas l'expiration en jours, elle dit
 * seulement connecté / à renouveler.
 */
export const CloudConfigModal: React.FC<CloudConfigModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [defaultTier, setDefaultTier] = useState<AiTier>(() => StorageService.getUiState<AiTier>('ai_default_tier', 'fast'));
  const [testing, setTesting] = useState(false);
  const [essai, setEssai] = useState<Essai | null>(null);
  const [, bouge] = useState(0);
  if (!isOpen) return null;

  const driveOk = FirebaseAuthService.hasDriveAccess();
  const driveEtat = driveOk ? 'connecté' : FirebaseAuthService.driveTokenExpired() ? 'à renouveler' : 'à connecter';

  const choisirNiveau = (t: AiTier) => {
    setDefaultTier(t);
    StorageService.setUiState('ai_default_tier', t);
    onSaved?.();
  };

  /** Vérifie que la passerelle répond réellement, avec une vraie question. */
  const handleTestAi = async () => {
    setTesting(true);
    setEssai(null);
    const res = await AiClient.run({ task: 'naturalSearch', tier: defaultTier, instruction: 'Combien font 2 + 2 ? Réponds simplement.', context: { controle: true } });
    setEssai(res.ok ? { ok: true, model: res.model, elapsedMs: res.elapsedMs, at: Date.now() } : { ok: false, error: res.error || 'Échec inconnu.', at: Date.now() });
    setTesting(false);
  };

  const lampeIa = essai === null ? { e: 'inconnu', t: 'pas encore vérifiée' } : essai.ok
    ? { e: 'ok', t: `répond${essai.elapsedMs !== undefined ? ` · ${(essai.elapsedMs / 1000).toFixed(1).replace('.', ',')} s` : ''}` }
    : { e: 'ko', t: 'ne répond pas' };

  const bande = (
    <div className="fe-lamps" role="group" aria-label="État des connexions">
      <div className="fe-lamp"><i data-e={lampeIa.e} aria-hidden="true"><Sparkles size={22} /></i>IA Gemini<b data-e={lampeIa.e}>{lampeIa.t}</b></div>
      <div className="fe-lamp"><i data-e={driveOk ? 'ok' : 'ko'} aria-hidden="true"><FolderTree size={22} /></i>Google Drive<b data-e={driveOk ? 'ok' : 'ko'}>{driveEtat}</b></div>
    </div>
  );

  return (
    <Feuille open={isOpen} onClose={onClose} teinte="wat" icone={<Cloud size={16} />} titre="Connexions cloud et IA" bande={bande}>
      <div className="fe-gt"><span>Intelligence artificielle</span></div>
      <div className="fe-seg" role="group" aria-label="Niveau d’IA par défaut">
        {(['fast', 'max'] as AiTier[]).map(t => (
          <button key={t} type="button" aria-pressed={defaultTier === t} onClick={() => choisirNiveau(t)}>
            <i>{t === 'fast' ? <Zap size={15} aria-hidden="true" /> : <Target size={15} aria-hidden="true" />}{t === 'fast' ? 'Rapide' : 'Max'}</i>
            <small>{TIER_HINT[t]}</small>
          </button>
        ))}
      </div>
      <p className="fe-notice" style={{ margin: 0 }}>Chaque action garde son propre niveau adapté ; celui-ci ne fixe que la valeur de départ.</p>
      <div className="fe-r"><span className="fe-l">Clé Gemini<small>Secret Manager, jamais dans le navigateur</small></span><span className="fe-ld" />
        <span className="fe-v fe-ok"><ShieldCheck size={14} aria-hidden="true" />sur le serveur</span></div>
      <button type="button" className="fe-r" disabled={testing} onClick={handleTestAi}>
        <span className="fe-l">Vérifier que l’IA répond</span><span className="fe-ld" />
        <span className="fe-v fe-w">{testing ? 'Vérification…' : essai ? ilYa(essai.at, Date.now()) : 'pas encore'}</span>
        <RefreshCw size={14} aria-hidden="true" className={testing ? 'animate-spin' : undefined} />
      </button>
      {essai?.ok === true && <p className="fe-res" data-e="ok" role="status">L’IA répond{essai.model ? <> · modèle <span className="fe-m">{essai.model}</span></> : null}.</p>}
      {essai?.ok === false && <p className="fe-res" data-e="ko" role="alert">{essai.error}</p>}

      <div className="fe-gt"><span>Google Drive</span></div>
      <div className="fe-r"><span className="fe-l">Connexion Drive<small>justificatifs et quittances, Drive privé</small></span><span className="fe-ld" />
        <span className={`fe-v ${driveOk ? 'fe-ok' : 'fe-wa'}`}>{driveEtat}</span></div>
      <div className="fe-drive"><DriveConnection always compact onConnected={() => bouge(n => n + 1)} /></div>
      <a href="https://drive.google.com" target="_blank" rel="noreferrer" className="fe-r" style={{ borderBottom: 0, justifyContent: 'flex-end', gap: 6, color: 'var(--watt)', fontSize: 14 }}>
        Ouvrir mon Google Drive<ExternalLink size={14} aria-hidden="true" /></a>
    </Feuille>
  );
};
