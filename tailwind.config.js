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
          straw: '#F2C14E', // paille — action principale, attention
          gold: '#E0A02E',
          amber: '#C87A2C',
          copper: '#A0522D',
          brown: '#6B3A1E',
          stout: '#3B1F14'
        },

        // Sémantique — volontairement HORS de l'échelle bière.
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

      /**
       * Échelle modulaire (base 16, ratio ~1.25) au lieu des 10/11/12 px
       * empilés au hasard. 14 px est le PLANCHER : en dessous, illisible à bout
       * de bras dans une cave.
       */
      fontSize: {
        footnote: ['0.75rem', { lineHeight: '1.1rem' }], // 12 — mentions légales uniquement
        /**
         * 13 — EXPÉRIMENTAL, à la demande de Gaëtan (04.09.2026) pour gagner de
         * la densité clavier ouvert. Descend sous le plancher de 14 px posé par
         * le système de design ; réservé au CHROME (étiquettes, indications,
         * légendes) d'un écran de saisie mobile — jamais à une valeur qu'on
         * saisit ou qu'on relève. À valider sur téléphone : si ça se révèle
         * illisible à bout de bras, remonter à `sm`.
         *
         * ⚠️ NE JAMAIS poser cette classe sur un `<input>`/`<select>`/
         * `<textarea>` : ils sont protégés à 16 px ailleurs (`index.css`) contre
         * le zoom automatique de Safari, et une classe `text-2xs` l'emporterait
         * sur cette protection — Tailwind place les utilitaires après la base
         * dans la cascade, à spécificité égale.
         */
        '2xs': ['0.8125rem', { lineHeight: '1.05rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14 — plancher du système de design
        base: ['1rem', { lineHeight: '1.5rem' }], // 16 — texte courant
        lg: ['1.25rem', { lineHeight: '1.6rem' }], // 20 — titre de carte
        xl: ['1.5625rem', { lineHeight: '1.9rem' }], // 25 — titre de section
        '2xl': ['1.953rem', { lineHeight: '2.2rem' }], // 31
        '3xl': ['2.441rem', { lineHeight: '2.6rem' }], // 39 — la grande lecture
        '4xl': ['3.052rem', { lineHeight: '3.2rem' }] // 49
      },

      spacing: {
        /**
         * ÉCHELLE RÉVISÉE LE 12.09.2026, à la demande explicite de Gaëtan :
         * « les boutons sont toujours beaucoup trop grands, larges et imposants ».
         *
         * L'échelle précédente — 48 px de base, 56 px pour les steppers — était
         * calquée sur Material Design. Elle rendait chaque écran de l'assistant
         * plus haut que nécessaire : un formulaire de six champs perdait près de
         * 50 px en hauteur de contrôles, et les aplats pleine largeur écrasaient
         * le contenu qu'ils devaient servir.
         *
         * La base est descendue à 48, puis 44, puis **36 px**, sur trois demandes
         * successives. La règle a changé de NATURE : le dessin fait 36 px, la
         * zone d'attrape 44. Les deux ne sont plus le même nombre.
         *
         * Un `::before` en `-inset-*` ou `p-2 -m-2` porte les 44 px sans occuper
         * la moindre place. WCAG 2.2 AA (2.5.8) exige 24 px : même le dessin
         * seul reste au-dessus.
         *
         * ⚠️ CE QUI NE CHANGE PAS : le plancher typographique de 14 px.
         */
        touch: '2.25rem',
        /** 44 px — steppers manipulés avec des gants ou les mains mouillées. */
        'touch-lg': '2.75rem',
        /**
         * 32 px — contrôles RÉPÉTÉS uniquement : ± d'un stepper, corbeille d'une
         * carte, puce d'une liste de dix. Jamais une validation finale
         * (Enregistrer, Lancer le brassin), dont l'erreur coûte un brassin.
         */
        'touch-sm': '2rem'
      },

      // minHeight et minWidth n'héritent pas de l'échelle spacing dans
      // Tailwind v3 : sans ces trois entrées, les classes min-h-touch-* n'existent pas.
      minHeight: { touch: '2.25rem', 'touch-lg': '2.75rem', 'touch-sm': '2rem' },
      minWidth: { touch: '2.25rem', 'touch-lg': '2.75rem', 'touch-sm': '2rem' },

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
