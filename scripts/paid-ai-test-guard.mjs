const CONFIRMATION_FLAG = '--confirm-paid-ai';

function isEnabled(value) {
  return typeof value === 'string' && !['', '0', 'false', 'no'].includes(value.toLowerCase());
}

/**
 * Refuse tout test qui peut consommer le quota Gemini tant que son coût n'a
 * pas été accepté sur la ligne de commande. En CI, une seconde autorisation
 * est nécessaire afin qu'ajouter le flag par erreur à un script ne suffise pas.
 */
export function requirePaidAiTestOptIn({ label, command }) {
  if (!process.argv.slice(2).includes(CONFIRMATION_FLAG)) {
    throw new Error(
      [
        `Le contrôle « ${label} » est exclu des tests normaux car il effectue de vrais appels Gemini.`,
        `Lancement volontaire uniquement : ${command}`
      ].join('\n')
    );
  }

  if (isEnabled(process.env.CI) && process.env.ALLOW_PAID_AI_TESTS_IN_CI !== '1') {
    throw new Error(
      [
        `Le contrôle « ${label} » est bloqué dans la CI.`,
        'Pour une exécution volontaire et budgétée, définir aussi ALLOW_PAID_AI_TESTS_IN_CI=1.'
      ].join('\n')
    );
  }

  console.warn(`⚠ Test IA facturable autorisé explicitement : ${label}`);
}
