// Serveur de dev minimal pour la capture de la voie liens : pas de plugin PWA (non installé dans cette copie), stub du module virtuel.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
const racine = fileURLToPath(new URL('../../../../../', import.meta.url));
export default defineConfig({
  root: racine,
  plugins: [react()],
  resolve: { alias: [{ find: 'virtual:pwa-register', replacement: fileURLToPath(new URL('./pwa-stub.mjs', import.meta.url)) }] },
  server: { fs: { strict: false } }
});
