import { defineConfig, type Plugin } from 'vite';
import type { AcceptedPlugin } from 'postcss';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindEcran from '../ecran/tailwind.config.js';
import { ROUTES_PAGES } from './src/coquille/pages';

// Maquette jouable du parcours houblons (mission 2026-10-23-maquette-parcours), sur le modèle de ../ecran :
// - composants (src/ui, src/pages/PageShell), moteur V5.5 et jetons Tailwind IMPORTÉS de l'app, jamais recopiés ;
//   aucun fichier de l'app ne change ;
// - thèmes clair et cave de ../ecran (tailwind.config.js et src/themes.css importés) ;
// - sortie statique ouvrable en file:// : un script classique IIFE et une feuille communs, une page par route
//   (<route>/etat.html) plus index.html. Sortie : PARCOURS_SORTIE, sinon maquettes/parcours.
const ici = path.dirname(fileURLToPath(import.meta.url));
const depot = path.resolve(ici, '../../..');
const prototype = path.resolve(ici, '..');
export const SORTIE_DEFAUT = path.join(prototype, 'maquettes', 'parcours');
const sortie = path.resolve(process.env.PARCOURS_SORTIE || SORTIE_DEFAUT);

// Même frontière de types que ../ecran : plugin-react, tailwindcss et autoprefixer sont typés contre les copies
// de la racine. Mêmes objets à l'exécution.
const reactRacine = react() as unknown as Plugin[];
const tailwindParcours = {
  ...tailwindEcran,
  content: [path.join(ici, '*.html'), path.join(ici, 'src/**/*.{ts,tsx}'), path.join(depot, 'src/ui/**/*.{ts,tsx}'), path.join(depot, 'src/pages/PageShell.tsx')]
    .map((g) => g.split(path.sep).join('/')),
};
const postcssRacine = [tailwindcss(tailwindParcours), autoprefixer()] as unknown as AcceptedPlugin[];

/** Émet index.html et une page <route>/etat.html par route, autour du script et de la feuille communs.
 * Assemblage par split/join (L26) : aucun remplacement de chaîne avec « $ ». */
function pagesParRoute(): Plugin {
  return {
    name: 'affinee-parcours-pages',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const sorties = Object.values(bundle);
      const js = sorties.find((s) => s.type === 'chunk' && s.isEntry)?.fileName;
      const css = sorties.filter((s) => s.type === 'asset' && s.fileName.endsWith('.css')).map((s) => s.fileName);
      if (!js) this.error('Aucun script d’entrée produit.');
      const gabarit = fs.readFileSync(path.join(ici, 'index.html'), 'utf8');
      const MODULE = '<script type="module" src="./src/main.tsx"></script>';
      const ROUTE = 'data-route="ma-biere"';
      if (gabarit.split(MODULE).length !== 2) this.error('index.html : balise module introuvable ou répétée.');
      if (gabarit.split(ROUTE).length !== 2) this.error('index.html : data-route="ma-biere" introuvable.');
      const page = (route: string, prefixe: string) => {
        const balises = [...css.map((f) => `<link rel="stylesheet" href="${prefixe}${f}" />`), `<script defer src="${prefixe}${js}"></script>`].join('\n    ');
        return gabarit.split(MODULE).join(balises).split(ROUTE).join(`data-route="${route}"`);
      };
      this.emitFile({ type: 'asset', fileName: 'index.html', source: page('ma-biere', './') });
      for (const route of ROUTES_PAGES) {
        this.emitFile({ type: 'asset', fileName: `${route}/etat.html`, source: page(route, '../') });
        const note = path.join(ici, 'src/ecrans', route, 'NOTE.md');
        if (fs.existsSync(note)) this.emitFile({ type: 'asset', fileName: `${route}/NOTE.md`, source: fs.readFileSync(note, 'utf8') });
      }
      // Cas d'essai du rail (D36, D37) : la même recette, ébullition de 45′ et de 120′ (controle-rail.mjs).
      for (const route of ['ma-biere', 'dryhopper']) for (const min of [45, 120]) {
        const html = page(route, '../').split(`data-route="${route}"`).join(`data-route="${route}" data-ebullition="${min}"`);
        this.emitFile({ type: 'asset', fileName: `${route}/cas-ebu${min}.html`, source: html });
      }
    },
  };
}

export default defineConfig({
  root: ici,
  base: './',
  publicDir: false,
  plugins: [...reactRacine, pagesParRoute()],
  resolve: {
    alias: [
      { find: /^@app\/(.*)$/, replacement: `${path.join(depot, 'src')}/$1` },
      { find: /^@functions\/(.*)$/, replacement: `${path.join(depot, 'functions/src')}/$1` },
    ],
    dedupe: ['react', 'react-dom'],
  },
  define: {
    'process.env.V4_TEMOIN_NEGATIF': JSON.stringify(''),
  },
  // PostCSS en ligne : sinon Vite remonterait au postcss.config.js de l'app, sans les thèmes du prototype.
  css: { postcss: { plugins: postcssRacine } },
  server: { fs: { allow: [depot] } },
  build: {
    outDir: sortie,
    // Vidé seulement à la sortie par défaut : les voies d'écran construisent chacune dans maquettes/parcours-<écran>/.
    emptyOutDir: sortie === SORTIE_DEFAUT,
    modulePreload: false,
    cssCodeSplit: false,
    target: 'es2020',
    chunkSizeWarningLimit: 6000,
    rollupOptions: {
      input: path.join(ici, 'src/main.tsx'),
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'assets/parcours.js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
