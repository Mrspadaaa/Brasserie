import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

/*
 * CAL-LENT (21.11, « Il y a beaucoup de lenteur sur les actions du calendrier... »). Tailwind v3 écrit `space-*` et `divide-*` avec un
 * combinateur de frère au sujet universel : `.space-y-2 > :not([hidden]) ~ :not([hidden])`. Chrome teste ce sujet sur chaque élément de la
 * page ; dès qu'UNE telle règle existe dans la feuille, insérer un enfant ailleurs qu'en dernier (message, menu, feuille, calque) fait
 * recalculer le style de TOUT le sous-arbre du parent : 8 ms sans ralenti pour le Calendrier (600 éléments), 0,03 ms sans ces règles
 * (sonde work/missions/2026-11-20-frise/sonde-invalidation.mjs). Tailwind v4 a quitté ce sélecteur pour la même raison (guide de migration :
 * « serious performance issues on large pages »). Ici, le même élément reçoit la même marge : « non caché et pas le premier enfant ».
 * Seul écart : un premier enfant porteur de l'attribut `hidden` suivi d'un enfant visible (le second prend alors sa marge).
 */
const FRERE = ' > :not([hidden]) ~ :not([hidden])';
const SANS_FRERE = ' > :not([hidden]):not(:first-child)';
const espacesSansFrere = () => ({
  postcssPlugin: 'affinee-espaces-sans-frere',
  Rule(regle) {
    if (regle.selector.includes(FRERE)) regle.selector = regle.selector.split(FRERE).join(SANS_FRERE);
  },
});
espacesSansFrere.postcss = true;

export default {
  plugins: [tailwindcss(), espacesSansFrere(), autoprefixer()],
};
