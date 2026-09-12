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
      colors: {
        /**
         * Fond : charbon CHAUD dérivé du malt torréfié, pas le bleu-noir `slate`
         * qui donnait à l'app une allure de tableau de bord de développeur.
         * Une cave n'est pas bleue.
         */
        cave: {
          950: '#12100E', // fond de page
          900: '#1A1613', // surface principale
          850: '#221D19', // surface surélevée
          800: '#2C2521', // bordure / séparateur
          700: '#3D342E', // bordure marquée
          600: '#574A42', // texte très secondaire
          400: '#9A8A7E', // texte secondaire
          200: '#D8CEC5', // texte courant
          50: '#F5F0EA' // texte fort
        },

        /**
         * Échelle EBC — la référence normalisée que les brasseurs utilisent pour
         * décrire la couleur d'un moût, de la paille au noir opaque.
         * RÉSERVÉE au produit et à l'état des brassins : un rouge d'alerte ne
         * doit jamais pouvoir se confondre avec une couleur de bière.
         */
        ebc: {
          straw: '#F2C14E', // paille — action principale
          gold: '#E0A02E',
          amber: '#C87A2C',
          copper: '#A0522D',
          brown: '#6B3A1E',
          stout: '#3B1F14'
        },

        // Repères de rubrique : stables, même en l'absence d'une alerte.
        area: {
          production: '#E7A070', // cuivre
          finances: '#86B9E6', // bleu
          stocks: '#A3C97A', // vert
          agenda: '#BCA5E8' // violet
        },

        // Sémantique — volontairement HORS de l'échelle bière.
        attention: '#E3B55D', // réapprovisionnement, action à prévoir
        'alert-strong': '#F29289', // texte d'erreur lisible sur les surfaces cave
        alert: '#D6453D', // rupture, erreur
        hop: '#6E9B5B', // disponible, validé (vert houblon sourd, pas un vert acide)
        water: '#5B8AA6' // eau, chimie, information
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
        panel: '0 1px 0 0 rgba(245,240,234,0.04) inset',
        lift: '0 8px 24px -12px rgba(0,0,0,0.7)',
        sheet: '0 -12px 40px -16px rgba(0,0,0,0.8)'
      },

      screens: { xs: '375px' }
    }
  },
  plugins: []
};
