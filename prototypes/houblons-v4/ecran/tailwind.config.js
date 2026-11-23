// Configuration Tailwind de l'app (tailwind.config.js racine), ÉTENDUE au prototype.
// Les noms de jetons ne changent pas (cave-*, ebc-straw, hop…) : seules leurs valeurs passent
// par des variables CSS en canaux RGB, définies par thème dans src/themes.css. Le thème
// « cave » reprend les valeurs de l'app à l'identique ; le thème « clair » est une
// proposition du prototype (THEMES.md), pas une modification de DESIGN.md.
//
// Texte et aplats ont des variables distinctes (textColor) : en clair, `text-cave-950` (texte
// sur aplat paille) reste une encre sombre, et chaque accent a une variante texte ≥ 4,5:1.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import base from '../../../tailwind.config.js';

const ici = path.dirname(fileURLToPath(import.meta.url));
const depot = path.resolve(ici, '../../..');
const glob = (...p) => path.join(...p).replace(/\\/g, '/');

const v = (nom) => `rgb(var(--${nom}) / <alpha-value>)`;
const DEGRES = ['950', '900', '850', '800', '700', '600', '400', '200', '50'];
const degres = (prefixe) => Object.fromEntries(DEGRES.map((d) => [d, v(`${prefixe}-${d}`)]));
const AREAS = ['production', 'finances', 'stocks', 'agenda'];
const areas = (suffixe) => Object.fromEntries(AREAS.map((a) => [a, v(`area-${a}${suffixe}`)]));
const ext = base.theme.extend;

/** @type {import('tailwindcss').Config} */
export default {
  ...base,
  content: [glob(ici, '*.html'), glob(ici, 'src/**/*.{ts,tsx}'), glob(depot, 'src/ui/**/*.{ts,tsx}')],
  theme: {
    ...base.theme,
    extend: {
      ...ext,
      colors: {
        ...ext.colors,
        cave: degres('cave'),
        // L'échelle EBC décrit la bière : mêmes valeurs dans les deux thèmes, sauf la paille,
        // qui est aussi l'aplat de l'action principale.
        ebc: { ...ext.colors.ebc, straw: v('ebc-straw') },
        area: areas(''),
        attention: v('attention'),
        'alert-strong': v('alert-strong'),
        alert: v('alert'),
        hop: v('hop'),
        water: v('water'),
        // Prototype : marque porteuse de sens (bande, piste) et repère d'accent (cible), ≥ 3:1.
        marque: v('marque'),
        repere: v('repere'),
      },
      textColor: {
        cave: degres('cave-texte'),
        ebc: { straw: v('ebc-straw-texte') },
        area: areas('-texte'),
        attention: v('attention-texte'),
        'alert-strong': v('alert-strong-texte'),
        alert: v('alert-texte'),
        hop: v('hop-texte'),
        water: v('water-texte'),
        repere: v('repere-texte'),
      },
    },
  },
};
