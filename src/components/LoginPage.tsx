import React, { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, HardDrive, Lock } from 'lucide-react';
import { FirebaseAuthService } from '../services/firebaseAuth';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

/**
 * Page de connexion.
 *
 * Elle annonce à l'avance les deux autorisations que Google va demander. Un
 * écran de consentement qui réclame l'accès à Drive sans prévenir inquiète à
 * juste titre : mieux vaut dire ce qui est demandé, et surtout ce qui ne l'est
 * pas — l'application ne voit que les fichiers qu'elle a elle-même créés.
 */
export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const prepare = () => { setError(null); void FirebaseAuthService.prepareGoogleLogin().then(() => setReady(true)).catch(() => setError('La connexion Google ne peut pas être préparée. Vérifie ta connexion et réessaie.')); };
  useEffect(() => { prepare(); }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    const { success, user, error: loginError } = await FirebaseAuthService.loginWithGoogle();

    if (success && user) {
      if (onLoginSuccess) onLoginSuccess();
    } else {
      setError(loginError || 'Échec de la connexion.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-cave-950 text-cave-50 flex flex-col justify-center items-center px-5 py-10">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex items-center gap-4">
          <span className="w-14 h-14 rounded-panel bg-ebc-straw text-cave-950 flex items-center justify-center text-3xl shrink-0">
            🍺
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-cave-50 leading-tight">L'Affinée</h1>
            <p className="text-base text-cave-400 leading-tight">
              Villars-sur-Glâne · Fribourg
            </p>
          </div>
        </div>

        <p className="text-base text-cave-200 leading-relaxed">
          Gestion de production et comptabilité de la brasserie. L'accès est réservé aux comptes
          Google autorisés.
        </p>

        {error && (
          <div
            role="alert"
            className="p-4 rounded-panel bg-alert/10 border border-alert/40 text-alert
                       text-base flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={ready ? handleGoogleLogin : prepare}
          disabled={isLoading || (!ready && !error)}
          className="w-full min-h-touch-lg px-5 rounded-control bg-cave-50 hover:bg-white
                     text-cave-950 font-semibold text-base
                     flex items-center justify-center gap-3
                     transition-colors disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Connexion…</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuer avec Google</span>
            </>
          )}
        </button>

        {/* Ce que Google va demander, dit avant l'écran de consentement. */}
        <div className="space-y-3 pt-2 border-t border-cave-800">
          <p className="text-sm text-cave-400">Google demandera deux autorisations :</p>

          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-cave-600 shrink-0 mt-0.5" />
            <p className="text-sm text-cave-400 leading-relaxed">
              <span className="text-cave-200">Votre identité</span> — pour vérifier que le compte
              fait partie des comptes autorisés.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <HardDrive className="w-5 h-5 text-cave-600 shrink-0 mt-0.5" />
            <p className="text-sm text-cave-400 leading-relaxed">
              <span className="text-cave-200">Google Drive, accès restreint</span> — pour y
              déposer factures et quittances. L'application ne voit que les fichiers qu'elle a
              elle-même créés ou reçus avec votre accord. Cette autorisation est conservée pour les prochains envois.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
