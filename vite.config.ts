import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react(), {
    // l2 (10.11) : `functions/src/brewerHopAdviceContextBinding.ts` n'importe de `brewerTools` que `normalizeRecipe` (ré-export de
    // `recipeSnapshot`), mais l'alias ci-dessous lui donnait tout `brewerTools.ts` : le chat Brasseur, donc Finances, tirait ainsi la
    // bibliothèque de levures (347 Ko). Côté navigateur seulement ; le serveur garde son `brewerTools.js` empaqueté, sans changement.
    name: 'binding-sans-brewertools',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer || !/[\\/]functions[\\/]src[\\/]brewerHopAdviceContextBinding\.ts(?:\?|$)/.test(importer)) return null;
      if (source !== './brewerTools.js' && !/[\\/]src[\\/]domain[\\/]brewerTools\.ts$/.test(source)) return null;
      return fileURLToPath(new URL('./src/domain/recipeSnapshot.ts', import.meta.url));
    }
  }, {
    name: 'exclude-private-initial-data',
    apply: 'build',
    generateBundle(_options, bundle) {
      for (const item of Object.values(bundle)) {
        if (item.type === 'chunk' && item.moduleIds.some(id => /[\\/]data[\\/]seedData\.ts(?:\?|$)/.test(id))) {
          this.error('Le jeu initial privé ne doit jamais entrer dans le bundle public.');
        }
      }
    }
  }],
  // Local migration data may contain private accounts and recipes. A shipped
  // browser bundle starts empty and reads the real data after authentication.
  resolve: { alias: [{
    find: './hopAdviceContentReference.js',
    replacement: fileURLToPath(new URL('./src/domain/hopDecision/adviceContentReference.ts', import.meta.url))
  }, {
    find: './adviceContentReference.js',
    replacement: fileURLToPath(new URL('./src/domain/hopDecision/adviceContentReference.ts', import.meta.url))
  }, {
    find: './brewerHopAdviceSemanticSource4.js',
    replacement: fileURLToPath(new URL('./src/services/hopV55/brewerHopAdviceSemanticSource4.ts', import.meta.url))
  }, {
    find: /^\.\.\/\.\.\/domain\/(.+)\.js$/,
    replacement: `${fileURLToPath(new URL('./src/domain/', import.meta.url))}$1.ts`
  }, {
    find: /^\.\.\/\.\.\/\.\.\/functions\/src\/(.+)\.js$/,
    replacement: `${fileURLToPath(new URL('./functions/src/', import.meta.url))}$1.ts`
  }, {
    find: './brewerTools.js',
    replacement: fileURLToPath(new URL('./src/domain/brewerTools.ts', import.meta.url))
  }, {
    find: './yeastCompanion.js',
    replacement: fileURLToPath(new URL('./src/domain/yeastCompanion.ts', import.meta.url))
  }, {
    find: './financeContext.js',
    replacement: fileURLToPath(new URL('./src/domain/finance/assistantContext.ts', import.meta.url))
  }, ...(command === 'build' ? [{
    find: /^.*\/data\/seedData(?:\.ts)?$/,
    replacement: fileURLToPath(new URL('./src/data/seedData.example.ts', import.meta.url))
  }] : [])] },
  // c8 : dans le build de l'application, composes-houblon.json sort du chunk des outils (chargement à part, budget B5) ; voir
  // src/domain/hopIndex/v4/composes.ts. Le serveur de dev, Vitest, vite-node et les builds des maquettes le gardent en synchrone.
  // D368 bis (08.11, « Pourquoi la vue des houblons est plus celui ci mais l'ancienne ???? ») : les écrans Houblons choisis par le brasseur sont
  // allumés par le build lui-même, plus par une variable à ne pas oublier (oubliée le 02.11 puis le 08.11). `VITE_HOP_V4=off` les éteint exprès.
  ...(command === 'build' ? { define: {
    'import.meta.env.VITE_COMPOSES_A_PART': JSON.stringify('on'),
    'import.meta.env.VITE_HOP_V4': JSON.stringify(process.env.VITE_HOP_V4 || 'on'),
    // D378 (08.11, « Baisse à 20 et go ») : l'enrichissement des fiches par l'IA est allumé en production, 20 recherches par jour au plus
    // (enrichissementReglages.ts). VITE_ENRICHISSEMENT_IA=eteinte au build l'éteint exprès ; le contrôle des drapeaux refuse un build sans valeur.
    'import.meta.env.VITE_ENRICHISSEMENT_IA': JSON.stringify(process.env.VITE_ENRICHISSEMENT_IA || 'production'),
  } } : {}),
  server: {
    // 3000 par défaut ; `PORT` permet de lancer un second serveur en parallèle
    // quand le premier occupe déjà le port.
    port: Number(process.env.PORT) || 3000,
    host: true
  }
}));
