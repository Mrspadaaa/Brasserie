/**
 * Drapeau des outils houblons v4 (épopée #159, D65).
 *
 * ÉTEINT par défaut : tant qu'il l'est, aucun bouton de l'app n'ouvre un outil v4 ; seules les routes existent
 * (`src/pages/useFullScreenRoute.ts`) et le crochet de développement (`devHook.ts`) les atteint. Il s'allume au build
 * par `VITE_HOP_V4=on`, jamais par une donnée de l'utilisateur. Le retrait de l'atelier V5.5 n'en dépend pas : il
 * revient à l'utilisateur et au brasseur.
 *
 * Le défaut ne lit que la clé du drapeau : passer `import.meta.env` entier ferait embarquer tout l'environnement
 * (coordonnées de l'entreprise comprises) dans le paquet de production.
 */
export function hopV4Enabled(env: Record<string, unknown> = { VITE_HOP_V4: import.meta.env.VITE_HOP_V4 }): boolean {
  return env.VITE_HOP_V4 === 'on';
}
