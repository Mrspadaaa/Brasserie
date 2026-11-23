import { defineConfig, type Plugin } from 'vite';
import type { AcceptedPlugin } from 'postcss';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindConfig from './tailwind.config.js';

// Écran houblons, tranche verticale (méthode v2, étape 7).
// - Les composants (src/ui), le moteur V5.5 (src/, functions/src) et les jetons Tailwind
//   viennent de l'app, IMPORTÉS et jamais recopiés ; aucun fichier de l'app ne change.
// - React, motion, lucide-react, tailwindcss et @vitejs/plugin-react se résolvent depuis le
//   node_modules racine (remontée de Node), sans toucher au package.json de l'app.
// - La sortie est une page statique ouvrable en file:// : un seul script classique (IIFE,
//   aucun module ES, que Chrome bloque en file://) partagé par les trois pages.
const ici = path.dirname(fileURLToPath(import.meta.url));
const depot = path.resolve(ici, '../../..');
const prototype = path.resolve(ici, '..');

// Vite et PostCSS existent en deux copies (prototype et racine) : @vitejs/plugin-react, tailwindcss
// et autoprefixer sont typés contre celles de la racine. Mêmes objets à l'exécution ; on ne
// convertit le type qu'à cette frontière.
const reactRacine = react() as unknown as Plugin[];
const postcssRacine = [tailwindcss(tailwindConfig), autoprefixer()] as unknown as AcceptedPlugin[];

export const PAGES = ['index.html', 'etat-b.html', 'radar.html'];
export const THEMES = ['clair', 'cave'] as const;

const version = process.env.ECRAN_VERSION || 'version-a';
const theme = process.env.ECRAN_THEME || 'clair';
const variante = process.env.ECRAN_VARIANTE || 'essai';
// La sortie est vidée à chaque construction : « captures » (sorties de capture.mjs) est réservé.
if (!/^[a-z0-9][a-z0-9-]*$/.test(version) || version === 'captures') throw new Error(`Version invalide : « ${version} » (minuscules, chiffres, tirets ; « captures » réservé).`);
if (!(THEMES as readonly string[]).includes(theme)) throw new Error(`Thème inconnu : « ${theme} » (${THEMES.join(', ')}).`);

/** Pose le thème choisi sur <html>. */
const avecTheme = (html: string) => html.replace(/(<html[^>]*\sdata-theme=")[^"]*(")/, `$1${theme}$2`);

/** Émet les trois pages statiques autour du script IIFE et de la feuille de style. */
function pagesStatiques(): Plugin {
  return {
    name: 'affinee-pages-statiques',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const sorties = Object.values(bundle);
      const js = sorties.find((s) => s.type === 'chunk' && s.isEntry)?.fileName;
      const css = sorties.filter((s) => s.type === 'asset' && s.fileName.endsWith('.css')).map((s) => s.fileName);
      if (!js) this.error('Aucun script d’entrée produit.');
      const balises = [...css.map((f) => `<link rel="stylesheet" href="./${f}" />`), `<script defer src="./${js}"></script>`].join('\n    ');
      for (const page of PAGES) {
        const source = fs.readFileSync(path.join(ici, page), 'utf8');
        const module = /<script type="module" src="\.\/src\/main\.tsx"><\/script>/;
        if (!module.test(source)) this.error(`${page} : balise <script type="module" src="./src/main.tsx"> introuvable.`);
        this.emitFile({ type: 'asset', fileName: page, source: avecTheme(source).replace(module, balises) });
      }
    },
  };
}

export default defineConfig({
  root: ici,
  base: './',
  publicDir: false,
  plugins: [...reactRacine, pagesStatiques(), { name: 'affinee-theme-dev', apply: 'serve', transformIndexHtml: avecTheme }],
  resolve: {
    alias: [
      { find: /^@app\/(.*)$/, replacement: `${path.join(depot, 'src')}/$1` },
      { find: /^@functions\/(.*)$/, replacement: `${path.join(depot, 'functions/src')}/$1` },
    ],
    // Un seul React : celui de l'app (node_modules racine), pour l'écran et pour src/ui.
    dedupe: ['react', 'react-dom'],
  },
  define: {
    // Témoin négatif de check:engine (src/style/scale.ts) : sans objet dans le navigateur.
    'process.env.V4_TEMOIN_NEGATIF': JSON.stringify(''),
    __ECRAN__: JSON.stringify({ version, theme, variante }),
  },
  // Configuration PostCSS en ligne : sinon Vite remonterait jusqu'au postcss.config.js de l'app,
  // qui charge le tailwind.config.js racine sans les variables de thème du prototype.
  css: { postcss: { plugins: postcssRacine } },
  server: { fs: { allow: [depot] } },
  build: {
    outDir: path.join(prototype, 'maquettes', version),
    emptyOutDir: true,
    modulePreload: false,
    // Une feuille de style séparée (sinon, en IIFE, Vite l'injecte par le script) : pas de
    // flash sans style, et la feuille se lit telle quelle.
    cssCodeSplit: false,
    target: 'es2020',
    chunkSizeWarningLimit: 4000,
    rollupOptions: {
      input: path.join(ici, 'src/main.tsx'),
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'assets/ecran.js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
