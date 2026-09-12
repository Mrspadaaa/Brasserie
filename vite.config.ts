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
  resolve: { alias: command === 'build' ? [{
    find: /^.*\/data\/seedData(?:\.ts)?$/,
    replacement: fileURLToPath(new URL('./src/data/seedData.example.ts', import.meta.url))
  }] : [] },
  server: {
    // 3000 par défaut ; `PORT` permet de lancer un second serveur en parallèle
    // quand le premier occupe déjà le port.
    port: Number(process.env.PORT) || 3000,
    host: true
  }
}));
