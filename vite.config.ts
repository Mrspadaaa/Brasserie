import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react(), {
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
  server: {
    // 3000 par défaut ; `PORT` permet de lancer un second serveur en parallèle
    // quand le premier occupe déjà le port.
    port: Number(process.env.PORT) || 3000,
    host: true
  }
}));
