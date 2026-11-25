// Config du banc c80 (copie de celle du banc liste de D451) : celle de vite.config.ts sans vite-plugin-pwa (absent de node_modules sur ce poste), dev seulement.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const racine = fileURLToPath(new URL('../../../../../../', import.meta.url));
const p = (rel) => fileURLToPath(new URL(rel, new URL('../../../../../../', import.meta.url)));

export default defineConfig({
  root: racine,
  plugins: [react()],
  resolve: { alias: [
    { find: './hopAdviceContentReference.js', replacement: p('src/domain/hopDecision/adviceContentReference.ts') },
    { find: './adviceContentReference.js', replacement: p('src/domain/hopDecision/adviceContentReference.ts') },
    { find: './brewerHopAdviceSemanticSource4.js', replacement: p('src/services/hopV55/brewerHopAdviceSemanticSource4.ts') },
    { find: /^\.\.\/\.\.\/domain\/(.+)\.js$/, replacement: `${p('src/domain/')}$1.ts` },
    { find: /^\.\.\/\.\.\/\.\.\/functions\/src\/(.+)\.js$/, replacement: `${p('functions/src/')}$1.ts` },
    { find: './brewerTools.js', replacement: p('src/domain/brewerTools.ts') },
    { find: './yeastCompanion.js', replacement: p('src/domain/yeastCompanion.ts') },
    { find: './financeContext.js', replacement: p('src/domain/finance/assistantContext.ts') }
  ] },
  optimizeDeps: { entries: ['work/missions/2026-11-23-reprise-soir/voies/c80-tests/banc/index.html'], include: ['cmdk', 'dexie', 'jspdf', 'swissqrbill/svg', 'swissqrbill/utils'] },
  server: { port: 3080, host: true, strictPort: true }
});
