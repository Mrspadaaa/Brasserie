import React, { useEffect, useRef, useState } from 'react';
import { Cloud, Loader2 } from 'lucide-react';
import { DriveConnection } from './finance/DriveConnection';
import { migrateLegacyOriginals, type MigrationProgress } from '../services/financeDocumentMigration';
import { FirebaseAuthService } from '../services/firebaseAuth';

export function DriveStoragePanel({ onBusyChange, disabled = false }: { onBusyChange?: (busy: boolean) => void; disabled?: boolean }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [progress, setProgress] = useState<MigrationProgress>();
  const work = useRef<AbortController | null>(null);
  useEffect(() => () => work.current?.abort(), []);
  const run = async () => {
    if (work.current || disabled) return;
    setError('');
    const controller = new AbortController(); work.current = controller; setBusy(true); onBusyChange?.(true);
    try { if (!await FirebaseAuthService.ensureDriveAccessToken()) throw new Error('Autorise Drive pour déplacer tes anciens justificatifs.'); await migrateLegacyOriginals(setProgress, controller.signal); }
    catch (cause) { setError((cause as Error).name === 'AbortError' ? 'Migration en pause. Les fichiers déjà vérifiés restent disponibles ; tu peux reprendre.' : (cause as Error).message); }
    finally { work.current = null; setBusy(false); onBusyChange?.(false); }
  };
  return <section className="space-y-3 rounded-2xl border border-cave-700 bg-cave-900/50 p-4" aria-labelledby="drive-storage-title">
    <h4 id="drive-storage-title" className="flex items-center gap-2 font-semibold text-cave-50"><Cloud size={18} className="text-ebc-straw"/>Justificatifs sur Drive</h4>
    <p className="text-sm leading-relaxed text-cave-200">Tes PDF et photos sont rangés par année dans ton Drive privé. La base garde seulement leur référence.</p>
    <DriveConnection compact/>
    <details className="text-sm text-cave-200"><summary className="min-h-11 cursor-pointer py-3 font-medium">Anciens justificatifs et conservation</summary>
      <p className="pb-3 leading-relaxed">Déplace les fichiers déjà enregistrés pour alléger la base. Chaque original est copié, relu et vérifié avant que sa copie en base soit retirée. Les comptes et références restent identiques.</p>
      <p className="pb-3 leading-relaxed">Dossier : L’Affinée / Justificatifs / année. L’app garde une empreinte pour vérifier chaque fichier. Les retirer de Drive les rendrait indisponibles dans l’app. Télécharge aussi une sauvegarde annuelle complète sur un autre support. La capacité de ton compte Drive s’applique.</p>
    </details>
    {progress && <p role="status" aria-live="polite" className="break-words text-sm leading-relaxed text-cave-200">{progress.done
      ? `Vérification terminée. ${progress.migrated} fichier${progress.migrated > 1 ? 's' : ''} déplacé${progress.migrated > 1 ? 's' : ''} pendant cette passe.`
      : `${progress.migrated} déplacé${progress.migrated > 1 ? 's' : ''} · ${progress.inspected} fiches vérifiées${progress.current ? ` · ${progress.current}` : ''}`}</p>}
    {error && <p role="alert" className="text-sm text-amber-300">{error}</p>}
    <button type="button" disabled={disabled && !busy} onClick={() => busy ? work.current?.abort() : void run()} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-cave-600 px-3 py-2 text-sm font-semibold text-cave-50 disabled:opacity-50">
      {busy && <Loader2 size={16} className="animate-spin"/>}{busy ? 'Mettre en pause après ce fichier' : progress && !progress.done ? 'Reprendre la migration' : 'Déplacer les anciens justificatifs'}
    </button>
  </section>;
}
