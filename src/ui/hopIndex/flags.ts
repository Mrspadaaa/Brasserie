/**
 * Drapeau des outils houblons v4 (épopée #159, D65).
 *
 * ÉTEINT par défaut : tant qu'il l'est, aucun bouton de l'app n'ouvre un outil v4 ; seules les routes existent
 * (`src/pages/useFullScreenRoute.ts`) et le crochet de développement (`devHook.ts`) les atteint. Il s'allume au build
 * par `VITE_HOP_V4=on`, jamais par une donnée de l'utilisateur. Le retrait de l'atelier V5.5 n'en dépend pas : il
 * revient à l'utilisateur et au brasseur.
 */
export function hopV4Enabled(env: Record<string, unknown> = import.meta.env): boolean {
  return env.VITE_HOP_V4 === 'on';
}
