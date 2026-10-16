/**
 * La sortie manuelle des écrans de fiche, en phrase à part : « … Rien n’est appliqué. À saisir à la main. » (#100).
 * Avant, « — à saisir à la main. » se collait après une phrase déjà finie. Espaces insécables après « À » et « à » :
 * à 390 px, « à » finissait seul une ligne (V2 Chrome). Module pur : les tests moquent `aiClient`.
 */
export function withManualEntry(error: string): string {
  const said = error.trim();
  if (!said) return 'À\u00a0saisir à\u00a0la main.';
  return `${said}${/[.!?…]$/.test(said) ? '' : '.'} À\u00a0saisir à\u00a0la main.`;
}
