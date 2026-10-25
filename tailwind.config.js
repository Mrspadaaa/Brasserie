const v = (nom) => `rgb(var(--${nom}) / <alpha-value>)`;
const DEGRES = ['950', '900', '850', '800', '700', '600', '400', '200', '50'];
const degres = (prefixe) => Object.fromEntries(DEGRES.map((d) => [d, v(`${prefixe}-${d}`)]));
const AREAS = ['production', 'finances', 'stocks', 'agenda'];
const areas = (suffixe) => Object.fromEntries(AREAS.map((a) => [a, v(`area-${a}${suffixe}`)]));
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  /**
   * ⚠️ LE SURVOL NE VAUT QUE POUR CE QUI SAIT SURVOLER.
   *
   * Signalé ainsi : « le bouton Doser reste enfoncé dans beaucoup de
   * scénarios ». Ce n'était pas Doser, c'était TOUS les boutons — 224 classes
   * `hover:` dans quarante-deux fichiers, dont pas une n'était gardée.
   *
   * Sur un téléphone, un appui laisse `:hover` COLLÉ sur l'élément touché
   * jusqu'à ce qu'on en touche un autre : c'est le comportement normal des
   * navigateurs tactiles, qui simulent un survol pour les sites conçus à la
   * souris. Doser passait donc de paille à ambre au doigt et y restait — un
   * bouton qui a l'air pressé alors que son action est finie depuis longtemps.
   * Mesuré sur l'émulation : `pointer: coarse` vrai, `hover: hover` faux, et
   * `button.matches(':hover')` toujours vrai une seconde après l'appui.
   *
   * Ce drapeau enveloppe chaque `hover:` dans `@media (hover: hover)`. C'est le
   * défaut de Tailwind v4 ; en v3 il faut le demander. Contrepartie assumée :
   * sur un portable à écran tactile, les états de survol ne s'appliquent plus.
   */
  future: {
    hoverOnlyWhenSupported: true
  },
  theme: {
    extend: {
      /**
       * Couleurs par thème (#144, D106) : chaque jeton lit une variable en canaux RGB définie par thème dans
       * src/theme/themes.css (clair par défaut : ses maquettes choisies ; « cave » au choix). Les noms ne changent pas et
       * les opacités (`bg-water/50`) restent valides. Valeurs, contrastes et règles : DESIGN.md, « Colors ».
       *
       * Cave : charbon CHAUD dérivé du malt torréfié, pas le bleu-noir `slate`. Une cave n'est pas bleue.
       * Clair : page blanche, gris neutres, texte presque noir, action principale noire.
       */
      colors: {
        cave: degres('cave'), // 950 page · 900 surface · 850 surélevée · 800/700 bordures · 600/400 secondaire · 200 courant · 50 fort

        /**
         * Échelle EBC — la référence normalisée que les brasseurs utilisent pour décrire la couleur d'un moût.
         * RÉSERVÉE au produit et à l'état des brassins. Mêmes aplats dans les deux thèmes, sauf la paille, qui est
         * aussi l'aplat de l'action principale (noire en clair).
         */
        ebc: {
          straw: v('ebc-straw'), // paille — action principale
          gold: '#E0A02E',
          amber: '#C87A2C',
          copper: '#A0522D',
          brown: '#6B3A1E',
          stout: '#3B1F14'
        },

        // Repères de rubrique : stables, même en l'absence d'une alerte.
        area: areas(''),

        // Sémantique — volontairement HORS de l'échelle bière.
        attention: v('attention'), // réapprovisionnement, action à prévoir
        'alert-strong': v('alert-strong'), // texte d'erreur lisible
        alert: v('alert'), // rupture, erreur
        hop: v('hop'), // disponible, validé
        water: v('water'), // eau, chimie, information
        marque: v('marque'), // marque porteuse de sens (bande du style, piste)
        repere: v('repere') // repère d'accent (cible)
      },

      /**
       * Texte et aplat sont séparés : chaque accent a une variante texte qui tient 4,5:1 sur la page du thème. En clair,
       * `text-cave-950` reste une encre sombre (texte posé sur la paille), alors que `bg-cave-950` est la page blanche.
       */
      textColor: {
        cave: degres('cave-texte'),
        ebc: {
          straw: v('ebc-straw-texte'),
          gold: v('ebc-gold-texte'),
          amber: v('ebc-amber-texte'),
          copper: v('ebc-copper-texte')
        },
        area: areas('-texte'),
        attention: v('attention-texte'),
        'alert-strong': v('alert-strong-texte'),
        alert: v('alert-texte'),
        hop: v('hop-texte'),
        water: v('water-texte'),
        repere: v('repere-texte')
      },

      fontFamily: {
        // Tout ce qui se dit.
        sans: ['"Source Sans 3"', 'system-ui', '-apple-system', 'sans-serif'],
        // Tout ce qui se mesure : chiffres tabulaires, densités, montants.
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },

      // 12/13 px pour les métadonnées et commandes, 14 px pour le contenu.
      // Les champs conservent leurs 16 px dans index.css pour la saisie mobile.
      fontSize: {
        footnote: ['0.75rem', { lineHeight: '1.1rem' }],
        '2xs': ['0.8125rem', { lineHeight: '1.05rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14 — texte courant et données
        base: ['1rem', { lineHeight: '1.5rem' }], // 16 — texte courant
        lg: ['1.25rem', { lineHeight: '1.6rem' }], // 20 — titre de carte
        xl: ['1.5625rem', { lineHeight: '1.9rem' }], // 25 — titre de section
        '2xl': ['1.953rem', { lineHeight: '2.2rem' }], // 31
        '3xl': ['2.441rem', { lineHeight: '2.6rem' }], // 39 — la grande lecture
        '4xl': ['3.052rem', { lineHeight: '3.2rem' }] // 49
      },

      // DESIGN.md : actions répétées 24 px, commandes 28 px, saisie/primaire 32 px.
      // Les minimas laissent grandir les libellés, erreurs et préférences de texte.
      spacing: { touch: '1.75rem', 'touch-lg': '2rem', 'touch-sm': '1.5rem' },
      // Tailwind v3 exige aussi leur déclaration pour min-h-* et min-w-*.
      minHeight: { touch: '1.75rem', 'touch-lg': '2rem', 'touch-sm': '1.5rem' },
      minWidth: { touch: '1.75rem', 'touch-lg': '2rem', 'touch-sm': '1.5rem' },
      borderRadius: {
        // Trois rayons seulement, chacun porteur d'un niveau de hiérarchie.
        control: '0.625rem', // champs, boutons
        panel: '1rem', // blocs de contenu
        sheet: '1.5rem' // feuilles et modales
      },

      boxShadow: {
        // Une élévation franche plutôt que la même ombre grise partout.
        panel: '0 1px 0 0 rgb(var(--cave-50) / 0.04) inset',
        lift: '0 8px 24px -12px rgb(0 0 0 / var(--ombre-lift))',
        sheet: '0 -12px 40px -16px rgb(0 0 0 / var(--ombre-sheet))'
      },

      screens: { xs: '375px' }
    }
  },
  plugins: []
};
