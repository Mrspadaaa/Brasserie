/**
 * Thème de l'app (#144, D106) : clair par défaut (ses maquettes choisies), « cave » au choix. Le choix est gardé sur
 * l'appareil (localStorage), hors ligne. index.html pose le même attribut avant le premier rendu (sans clignotement) ;
 * ce module le relit et le tient à jour. Valeurs : src/theme/themes.css.
 */
import { useSyncExternalStore } from 'react';

export type Theme = 'clair' | 'cave';
export const THEMES: readonly Theme[] = ['clair', 'cave'];
export const THEME_PAR_DEFAUT: Theme = 'clair';
/** Clé de stockage, lue aussi par le script en ligne d'index.html : les deux doivent rester identiques. */
export const CLE_THEME = 'laffinee.theme';

const COULEUR_BARRE: Record<Theme, string> = { clair: '#FFFFFF', cave: '#12100E' };
const abonnes = new Set<() => void>();

function lireStocke(): Theme {
  try {
    const valeur = window.localStorage.getItem(CLE_THEME);
    return valeur === 'cave' || valeur === 'clair' ? valeur : THEME_PAR_DEFAUT;
  } catch {
    return THEME_PAR_DEFAUT;
  }
}

export function themeActuel(): Theme {
  if (typeof document === 'undefined') return THEME_PAR_DEFAUT;
  const pose = document.documentElement.dataset.theme;
  return pose === 'cave' || pose === 'clair' ? pose : lireStocke();
}

/** Pose le thème sur <html> et la couleur de la barre du navigateur. */
export function appliquerTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', COULEUR_BARRE[theme]);
}

export function choisirTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(CLE_THEME, theme);
  } catch {
    // Stockage refusé (navigation privée) : le choix vaut pour la session.
  }
  appliquerTheme(theme);
  abonnes.forEach((f) => f());
}

/** Au démarrage : reprend le choix gardé (index.html l'a déjà posé ; ceci couvre un document sans le script). */
export function initialiserTheme(): void {
  appliquerTheme(lireStocke());
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key !== CLE_THEME) return;
      appliquerTheme(lireStocke());
      abonnes.forEach((f) => f());
    });
  }
}

function abonner(f: () => void) {
  abonnes.add(f);
  return () => abonnes.delete(f);
}

export function useTheme(): [Theme, (theme: Theme) => void] {
  const theme = useSyncExternalStore(abonner, themeActuel, () => THEME_PAR_DEFAUT);
  return [theme, choisirTheme];
}
