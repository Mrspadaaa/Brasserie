import React, { useEffect, useRef, useState } from 'react';
import { Cloud, Loader2 } from 'lucide-react';
import { FirebaseAuthService } from '../../services/firebaseAuth';

/** Renewal is silent; Google's one-time consent remains a deliberate click. */
export function DriveConnection({ onConnected, always = false, compact = false }: { onConnected?: () => void; always?: boolean; compact?: boolean }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [connected, setConnected] = useState(FirebaseAuthService.hasDriveAccess());
  const [checking, setChecking] = useState(true), [ready, setReady] = useState(false);
  const callback = useRef(onConnected); callback.current = onConnected;
  useEffect(() => {
    let active = true;
    void FirebaseAuthService.ensureDriveAccessToken().then(token => {
      if (!active) return;
      setConnected(Boolean(token));
      if (token && always) callback.current?.();
    }).catch(() => { if (active) setError('Drive est temporairement indisponible. Ton justificatif reste dans ce formulaire.'); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (checking || connected && !always) return;
    let active = true;
    void FirebaseAuthService.prepareGoogleLogin().then(() => { if (active) setReady(true); }).catch(() => { if (active) setError('La connexion Google ne peut pas être préparée. Réessaie.'); });
    return () => { active = false; };
  }, [checking, connected, always]);
  if (checking) return null;
  if (!always && connected && FirebaseAuthService.hasDriveAccess()) return null;
  const connect = async () => {
    setBusy(true); setError('');
    try {
      if (!ready) { await FirebaseAuthService.prepareGoogleLogin(); setReady(true); return; }
      const result = await FirebaseAuthService.refreshDriveAccess();
      if (result.success) { setConnected(true); onConnected?.(); }
      else setError(result.error || 'La connexion Drive reste à confirmer.');
    } catch { setError('La connexion Drive a échoué. Réessaie.'); }
    finally { setBusy(false); }
  };
  return <div className={compact ? 'space-y-2' : 'space-y-2 rounded-xl border border-cave-700 bg-cave-950/50 p-3'}>
    {!compact && <p className="text-sm leading-relaxed text-cave-200">Autorise une fois le Drive de ton compte Google. Tes justificatifs y seront rangés et la connexion sera conservée.</p>}
    <button type="button" disabled={busy || (!ready && !error)} onClick={() => void connect()} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-cave-600 px-3 py-2 text-sm font-semibold text-cave-50 disabled:opacity-50">
      {busy ? <Loader2 size={16} className="animate-spin"/> : <Cloud size={16}/>} {busy ? 'Connexion…' : connected && FirebaseAuthService.hasDriveAccess() ? 'Renouveler la connexion Drive' : 'Connecter Drive'}
    </button>
    {error && <p role="alert" className="text-sm text-amber-300">{error}</p>}
  </div>;
}
