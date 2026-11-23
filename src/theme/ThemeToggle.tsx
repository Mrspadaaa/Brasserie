import { Moon, Sun } from 'lucide-react';
import { useTheme } from './theme';

/**
 * Le choix du thème dans l'en-tête, à côté de l'import (#144, 25.10 : « tu peux ajouter dans le header le choix de
 * thèmes à côté de l'import »). Un toucher bascule clair ↔ cave ; l'icône montre le thème où l'on va.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, choisir] = useTheme();
  const versCave = theme === 'clair';
  return (
    <button
      type="button"
      data-theme-toggle={theme}
      onClick={() => choisir(versCave ? 'cave' : 'clair')}
      aria-label={versCave ? 'Thème sombre (cave)' : 'Thème clair'}
      title={versCave ? 'Thème sombre (cave)' : 'Thème clair'}
      className={`w-7 h-7 rounded-control flex items-center justify-center text-cave-400 hover:text-cave-50 active:bg-cave-850 shrink-0 transition-colors ${className}`}
    >
      {versCave ? <Moon className="w-3.5 h-3.5" aria-hidden /> : <Sun className="w-3.5 h-3.5" aria-hidden />}
    </button>
  );
}
