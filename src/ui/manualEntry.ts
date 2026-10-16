/**
 * La sortie manuelle des écrans de fiche, en phrase à part : « … Rien n’est appliqué. À saisir à la main. » (#100).
 * Avant, « — à saisir à la main. » se collait après une phrase déjà finie. Module pur : les tests moquent `aiClient`.
 */
export function withManualEntry(error: string): string {
  const said = error.trim();
  if (!said) return 'À saisir à la main.';
  return `${said}${/[.!?…]$/.test(said) ? '' : '.'} À saisir à la main.`;
}
