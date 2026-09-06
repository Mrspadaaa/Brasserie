import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 3000 par défaut ; `PORT` permet de lancer un second serveur en parallèle
    // quand le premier occupe déjà le port.
    port: Number(process.env.PORT) || 3000,
    host: true
  }
});
